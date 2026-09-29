---
layout: post
title: A serving SDK data scientists actually use
date: 2025-06-14
tags:
- mlops
- design
summary: An SDK is an interface, so design it like one. What we hid, what we kept visible, and why a narrow path to production gets used.
---

An SDK is an interface. The people calling it are data scientists instead of other engineers, but the same rules apply: a small surface, sensible defaults, and errors that say what to do next. If every model author has to learn cluster setup, authentication, tracing and deployment conventions before shipping a model, the platform is exposing its machinery instead of helping with the task.

I built a serving engine and SDK for an ML platform. It supported approximately 40 model deployments, and the teams behind them did not have to configure the underlying infrastructure. This post is about the design thinking behind it. I'll describe the shape of the interface and the decisions I'd defend. Where I'm talking about general practice rather than my own system, I'll say so.

## The problem: a model is not a service

A trained model in a notebook is a function: features in, prediction out. A model in production is a service, and the gap between the two is mostly not machine learning. Someone has to:

- put the model behind an HTTP or gRPC endpoint
- authenticate callers
- emit traces and metrics so the model can be debugged when it misbehaves
- package it and run it on Kubernetes with sensible resource settings
- handle concurrent requests, including any parallel execution the model needs
- keep the same conventions as every other service in the company

None of these are hard individually. Together they are a lot of unfamiliar surface area for someone whose expertise is modelling. A data scientist can learn them, but each one who does spends days on work that isn't their job, and each ends up with slightly different choices. Ten teams shipping ten models by hand gives you ten ways of doing authentication and ten different sets of dashboards.

<figure class="fig">
<svg viewBox="0 0 680 300" role="img" aria-labelledby="sdk1t sdk1d">
  <title id="sdk1t">Path from notebook to endpoint, before and after an SDK</title>
  <desc id="sdk1d">Illustrative. Without a shared serving path, the model author handles six steps: the model, a web app, authentication, tracing, Kubernetes deployment, and metrics and alerts. With the SDK, the author does two things, wrap the model and deploy, and the platform provides the rest.</desc>
  <defs><marker id="sdk1a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="arrow" d="M0,0 L10,5 L0,10 z"/></marker></defs>
  <text class="h" x="6" y="16">WITHOUT A SHARED PATH · THE AUTHOR OWNS EVERY STEP</text>
  <rect class="box" x="6" y="30" width="90" height="52" rx="6"/>
  <text class="t" x="16" y="52">Notebook</text><text class="m" x="16" y="69">the model</text>
  <rect class="box" x="121" y="30" width="90" height="52" rx="6"/>
  <text class="t" x="131" y="52">Web app</text><text class="m" x="131" y="69">a server</text>
  <rect class="box" x="236" y="30" width="90" height="52" rx="6"/>
  <text class="t" x="246" y="52">Auth</text><text class="m" x="246" y="69">who calls</text>
  <rect class="box" x="351" y="30" width="90" height="52" rx="6"/>
  <text class="t" x="361" y="52">Tracing</text><text class="m" x="361" y="69">requests</text>
  <rect class="box" x="466" y="30" width="90" height="52" rx="6"/>
  <text class="t" x="476" y="52">Deploy</text><text class="m" x="476" y="69">Kubernetes</text>
  <rect class="box" x="581" y="30" width="90" height="52" rx="6"/>
  <text class="t" x="591" y="52">Metrics</text><text class="m" x="591" y="69">and alerts</text>
  <path class="sb" d="M97,56 L119,56" marker-end="url(#sdk1a)"/>
  <path class="sb" d="M212,56 L234,56" marker-end="url(#sdk1a)"/>
  <path class="sb" d="M327,56 L349,56" marker-end="url(#sdk1a)"/>
  <path class="sb" d="M442,56 L464,56" marker-end="url(#sdk1a)"/>
  <path class="sb" d="M557,56 L579,56" marker-end="url(#sdk1a)"/>
  <text class="tb" x="340" y="104" text-anchor="middle">five steps that are not modelling, each a chance to diverge from the last team</text>
  <line class="grid" x1="6" x2="674" y1="126" y2="126"/>
  <text class="h" x="6" y="152">WITH THE SDK · THE AUTHOR OWNS THE MODEL, THE PLATFORM OWNS THE REST</text>
  <rect class="box" x="6" y="166" width="150" height="52" rx="6"/>
  <text class="t" x="16" y="188">Notebook</text><text class="m" x="16" y="205">the model</text>
  <rect class="box" x="216" y="166" width="170" height="52" rx="6" style="stroke:var(--fig-a);stroke-width:2"/>
  <text class="t" x="226" y="188">Wrap with SDK</text><text class="m" x="226" y="205">a class and a config</text>
  <rect class="box" x="446" y="166" width="228" height="52" rx="6" style="stroke:var(--fig-a);stroke-width:2"/>
  <text class="t" x="456" y="188">Deployed endpoint</text><text class="m" x="456" y="205">auth, traces, metrics included</text>
  <path class="sa" d="M156,192 L214,192" marker-end="url(#sdk1a)"/>
  <path class="sa" d="M386,192 L444,192" marker-end="url(#sdk1a)"/>
  <text class="ta" x="340" y="248" text-anchor="middle">two steps for the author, and the same steps for every model</text>
  <text class="m" x="340" y="280" text-anchor="middle">Illustrative: the steps a typical hand-rolled deployment needs, not a measured timeline.</text>
</svg>
<figcaption>The point of a serving SDK is to shrink the author's path to the parts that are about the model. The steps still happen. They just happen once, in the platform.</figcaption>
</figure>

## What I put behind the interface

The engine took over the parts that are the same for every model:

- **Authentication.** Callers were checked the same way for every endpoint, so model authors did not write auth code.
- **Tracing.** The engine handled it, so model code needed no instrumentation calls.
- **Kubernetes orchestration.** The engine took care of running the model on the cluster, so authors did not configure it.
- **Parallel execution.** Running work in parallel was the engine's job.
- **Observability.** Metrics and logs came out in one consistent form for every model.

The design test I used for each item was simple: would two different data scientists ever have a good reason to make a different choice here? For authentication and tracing the answer is almost always no, so they belong in the platform. For anything where the answer is yes, they belong in the interface, as an option with a default.

<figure class="fig">
<svg viewBox="0 0 680 262" role="img" aria-labelledby="sdk2t sdk2d">
  <title id="sdk2t">What the author writes and what the platform handles</title>
  <desc id="sdk2d">The model author writes model loading, a predict function, input and output schemas, and a small config. The SDK sits between, and the platform provides authentication, tracing, Kubernetes orchestration, parallel execution and observability.</desc>
  <defs><marker id="sdk2a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="arrow" d="M0,0 L10,5 L0,10 z"/></marker></defs>
  <text class="h" x="6" y="16">THE AUTHOR WRITES</text>
  <text class="h" x="674" y="16" text-anchor="end">THE PLATFORM HANDLES</text>
  <rect class="box" x="6" y="30" width="230" height="200" rx="6" style="stroke:var(--fig-a);stroke-width:2"/>
  <text class="t" x="20" y="60">load the model</text>
  <text class="t" x="20" y="92">predict()</text>
  <text class="t" x="20" y="124">input and output schema</text>
  <text class="t" x="20" y="156">resources and options</text>
  <text class="m" x="20" y="206">Python, in the tools they know</text>
  <rect class="box" x="264" y="30" width="152" height="200" rx="6"/>
  <text class="h" x="340" y="64" text-anchor="middle">SDK</text>
  <text class="m" x="340" y="98" text-anchor="middle">one contract</text>
  <text class="m" x="340" y="118" text-anchor="middle">defaults</text>
  <text class="m" x="340" y="138" text-anchor="middle">clear errors</text>
  <text class="m" x="340" y="158" text-anchor="middle">any framework</text>
  <rect class="box" x="444" y="30" width="230" height="200" rx="6"/>
  <text class="t" x="458" y="60">authentication</text>
  <text class="t" x="458" y="92">tracing</text>
  <text class="t" x="458" y="124">Kubernetes orchestration</text>
  <text class="t" x="458" y="156">parallel execution</text>
  <text class="t" x="458" y="188">observability</text>
  <path class="sa" d="M236,130 L262,130" marker-end="url(#sdk2a)"/>
  <path class="sa" d="M416,130 L442,130" marker-end="url(#sdk2a)"/>
  <text class="m" x="340" y="252" text-anchor="middle">Illustrative split, following the design described in the text.</text>
</svg>
<figcaption>The author's side is small and stays in Python. The right-hand column is the same for every deployment, which is exactly why it belongs in one place.</figcaption>
</figure>

## What the author still writes

An SDK is easy to get wrong by hiding too much. If the only way to use it is a magic decorator that reads the notebook's global state, nobody can reason about what it does. I wanted the author's side to be a few explicit things:

1. How to load the model (files, weights, whatever the framework needs).
2. What "predict" does for one request.
3. What goes in and what comes out, as a schema.
4. A short config for the things that do vary, such as resource requests.

Here is the shape of that, as a sketch rather than the real API:

```python
from serving_sdk import Model, Schema, Config

class ChurnModel(Model):
    input = Schema(user_id=str, features=list[float])
    output = Schema(score=float)

    def load(self, path):
        self.model = load_my_model(path)   # any framework

    def predict(self, request):
        return {"score": self.model.score(request.features)}

config = Config(cpu="1", memory="2Gi", replicas=2)
```

Two things make this a good interface rather than just a short one. First, the class has exactly the three methods and attributes a model needs, so there is little to misuse. Second, nothing in it refers to the framework. The engine calls `load` and `predict`, and what happens inside is the author's business. That is how a serving engine stays framework-agnostic: the contract is about requests and responses, not about scikit-learn or PyTorch or anything else.

## Design choices I'd defend

**Make the right thing the default.** Settings that matter for safety or operability, like authentication and tracing, should need no configuration to be on. Turning something off should be deliberate. A default the author must remember to enable will be missed by some teams.

**Narrow beats flexible.** It is tempting to offer hooks for every possible need. Each hook is a promise you have to keep as the platform changes, and each one lets teams drift back into bespoke setups. I would rather have a smaller interface that covers most models cleanly, and add an option only when several teams have asked for the same thing.

**Errors are part of the interface.** A stack trace from deep inside the engine tells a data scientist nothing. Validation before deployment, with messages such as "the output schema says `score` is a float but `predict` returned a string", turns a support conversation into a fix the author makes alone. When people say a platform is "easy to use", a lot of that is error messages.

**Examples are documentation.** A working example for each common model type does more than a reference page. Most people will copy the closest example and edit it, so the examples define the real interface.

**Keep the escape hatch honest.** Some models will not fit. The choice is between a documented way out and a quiet fork of the platform. A documented way out, even a clumsy one, keeps those teams visible and lets you learn from them.

## Where abstractions leak

Every abstraction leaks somewhere, and the useful question is where you want it to. A common place is performance: a model that needs a lot of memory or a slow start-up behaves differently under the platform's scheduling from how it did in a notebook. When the layer hides Kubernetes completely, the author has no vocabulary for the problem.

The general fix I prefer is to expose the *effects* rather than the machinery. Let the author declare what the model needs (memory, warm-up time, concurrency) in the config, and surface what happened (a start-up that took too long, a request that timed out) in terms of those settings. They shouldn't need to know what a pod is to fix it.

## A shared path also standardises operations

Building one serving path had a second benefit that I underrated at the start. When every deployment is produced the same way, the platform can also say something consistent about all of them. Authentication, tracing and metrics come out in one form, so a single set of dashboards and alerts can cover every model. Governance questions, such as which models are running and who owns them, have one place to be answered.

Nobody had to be asked to follow a standard. It came with the easiest way to deploy.

## Build or adopt

Existing tools cover this ground, and the build-versus-adopt question is a fair one. My view is a general one and depends on your situation. If an existing serving framework already matches your company's authentication, tracing and deployment conventions, adopt it and spend the time elsewhere. If most of the work is fitting those conventions, then the real product is the thin layer that connects a model to them, and that layer is where an in-house SDK earns its keep. Either way, the design questions above still apply: the interface your data scientists see is yours to shape.

## What I'd take from it

- Treat data scientists as users of an interface, and design that interface the way you would a public API.
- Decide what belongs to the platform by asking whether any two authors would legitimately choose differently.
- Keep the author's side explicit and small, and keep the contract independent of any modelling framework.
- Invest in defaults, examples and error messages. They are most of what people experience.
- Expect leaks, and choose in advance where they show up.

The measure of success was not the SDK's feature list. It was that teams could take a model from a notebook to a running endpoint without becoming infrastructure engineers, and that there was one path to keep secure and observable.
