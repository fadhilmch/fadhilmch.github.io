---
layout: post
title: "Deconstructing PlanOut: a coin toss you can repeat"
date: 2026-09-30
tags:
- exp
- systems
summary: "Follow one shopper from a button experiment to the actual SHA-1 bytes, then look at salts, namespaces and the gap between assignment and exposure."
---

Andi opens a checkout page. We want to test two buttons: A is blue, B is pink. He gets blue today. Tomorrow, he opens the page on another server. He should still get blue.

That sounds like a small requirement. It rules out the most obvious implementation: toss a fresh coin on every request. You could save every user's choice in a database, but then every server needs access to that record. PlanOut offers another way: make the coin toss repeatable from the inputs.

This is the part of experimentation systems I want to take apart here. One shopper, one button, and the actual numbers from the archived Python implementation. No production traffic or company internals: the example below uses invented IDs.

<style>
.prose .fig.planout-fig { max-width: 540px; }
.fig.planout-fig svg { min-width: 340px; max-width: 540px; }
.planout-fig .t { font-size: 14px; }
.planout-fig .m, .planout-fig .ta, .planout-fig .tb { font-size: 12px; }
.planout-fig .h { font-size: 12px; }
.planout-fig .po-step { animation: po-trace-in 9s ease-out infinite both; }
.planout-fig .po-d0 { animation-delay: 0s; }
.planout-fig .po-d1 { animation-delay: .15s; }
.planout-fig .po-d2 { animation-delay: .3s; }
.planout-fig .po-d3 { animation-delay: .45s; }
.planout-fig .po-d4 { animation-delay: .6s; }
.planout-fig .po-d5 { animation-delay: .75s; }
.planout-fig .po-d6 { animation-delay: .9s; }
@keyframes po-trace-in { 0% { opacity: 0; transform: translateY(8px); } 7%, 86% { opacity: 1; transform: translateY(0); } 91%, 100% { opacity: 0; transform: translateY(0); } }
.planout-fig .po-bar { transform-box: fill-box; transform-origin: left center; animation: po-bar-grow 9s cubic-bezier(.25,.7,.3,1) infinite both; }
.planout-fig .po-bar-1 { animation-delay: .15s; }
.planout-fig .po-bar-2 { animation-delay: .35s; }
@keyframes po-bar-grow { 0% { transform: scaleX(0); opacity: 1; } 10%, 86% { transform: scaleX(1); opacity: 1; } 91%, 99% { transform: scaleX(1); opacity: 0; } 99.1%, 100% { transform: scaleX(0); opacity: 1; } }
.planout-fig .po-val { animation: po-fade-in 9s ease-out infinite both; }
.planout-fig .po-val-0 { animation-delay: .25s; }
.planout-fig .po-val-1 { animation-delay: 1s; }
.planout-fig .po-val-2 { animation-delay: 1.2s; }
@keyframes po-fade-in { 0% { opacity: 0; } 5%, 86% { opacity: 1; } 91%, 100% { opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .planout-fig .po-step, .planout-fig .po-bar, .planout-fig .po-val { animation: none; } }
</style>

## What PlanOut was trying to separate

The product owns the checkout page. The experiment owns the rule for choosing the button. Those should not become one tangled piece of code.

PlanOut was developed at Facebook as a language and framework for defining online experiments. Its 2014 paper describes how an experiment maps a unit, such as a user ID, to parameter values. A parameter might be a button colour, a piece of text, or a discount. Product code asks for that value and uses it.

In other words, the experiment says "blue". It does not draw the button, count purchases, or tell us whether blue is better.

<figure class="fig planout-fig">
<svg viewBox="0 0 420 324" role="img" aria-labelledby="po-flow-t po-flow-d">
<title id="po-flow-t">Flow</title>
<desc id="po-flow-d">Andi enters the checkout. The experiment chooses blue. The product renders the button. The outcome pipeline counts purchases separately.</desc>
<rect class="box" x="12" y="12" width="396" height="60" rx="6"/><text class="t" x="24" y="36">Andi opens checkout</text><text class="m" x="24" y="55">unit: user-42</text><path class="ln" d="M210,72 v20"/><rect class="box" x="12" y="92" width="396" height="60" rx="6"/><text class="t" x="24" y="116">Experiment definition</text><text class="m" x="24" y="135">choose button = blue</text><path class="ln" d="M210,152 v20"/><rect class="box" x="12" y="172" width="396" height="60" rx="6"/><text class="t" x="24" y="196">Product code</text><text class="m" x="24" y="215">use blue when rendering checkout</text><path class="ln dash" d="M210,232 v20"/><rect class="box" x="12" y="252" width="396" height="60" rx="6"/><text class="t" x="24" y="276">Outcome pipeline</text><text class="m" x="24" y="295">record purchases; analyse later</text>
</svg>
<figcaption>PlanOut returns parameter values. Rendering and measuring the result live outside that decision.</figcaption>
</figure>

Here is a small definition using PlanOut's Python API:

```python
from planout.experiment import SimpleExperiment
from planout.ops.random import UniformChoice

class CheckoutButton(SimpleExperiment):
    def setup(self):
        self.salt = "checkout-v1"

    def assign(self, params, userid):
        params.button = UniformChoice(
            choices=["blue", "pink"], unit=userid
        )

experiment = CheckoutButton(userid="user-42")
colour = experiment.get("button")  # "blue"
```

Andi's invented ID is `user-42`. It is the *unit*: the thing we randomise. If we used a session ID instead, we'd be randomising sessions, and Andi could get a different button on his next visit. Choosing the unit is a design decision, not a detail to leave to the SDK.

## A coin toss without a coin

A hash function turns an input string into a fixed-length output. The same input always gives the same output. Small changes to the input usually produce very different outputs.

PlanOut uses SHA-1 as a mixing function for assignment. This is not a password scheme or a way to hide someone's group. We want repeatable, well-spread values, not secrecy.

For this example, PlanOut joins three pieces with dots:

1. The experiment salt: `checkout-v1`.
2. The parameter salt: `button`, supplied from the assigned variable name.
3. The unit: `user-42`.

The complete key is `checkout-v1.button.user-42`. The default separator is a dot; explicit salt overrides and multi-part units have their own paths in the source.

<figure class="fig planout-fig">
<svg viewBox="0 0 420 324" role="img" aria-labelledby="po-hash-t po-hash-d">
<title id="po-hash-t">Hash</title>
<desc id="po-hash-d">The exact key checkout-v1.button.user-42 is hashed. Its first 15 hex digits become integer 235347851596851754. Remainder modulo two is zero, selecting blue.</desc>
<g class="po-step po-d0"><rect class="box" x="12" y="12" width="396" height="60" rx="6"/><text class="t" x="24" y="36">checkout-v1.button.user-42</text><text class="m" x="24" y="55">salt + parameter + unit</text></g><g class="po-step po-d1"><path class="ln" d="M210,72 v20"/></g><g class="po-step po-d2"><rect class="box" x="12" y="92" width="396" height="60" rx="6"/><text class="t" x="24" y="116">SHA-1 → keep first 15 hex digits</text><text class="m" x="24" y="135">3441f9fc514ea2a</text></g><g class="po-step po-d3"><path class="ln" d="M210,152 v20"/></g><g class="po-step po-d4"><rect class="box" x="12" y="172" width="396" height="60" rx="6"/><text class="t" x="24" y="196">Convert hex to integer</text><text class="m" x="24" y="215">235347851596851754</text></g><g class="po-step po-d5"><path class="ln" d="M210,232 v20"/></g><g class="po-step po-d6"><rect class="box" x="12" y="252" width="396" height="60" rx="6"/><text class="t" x="24" y="276">h % 2 = 0 → choices[0] → blue</text><text class="m" x="24" y="295">same key, same answer</text></g>
</svg>
<figcaption>The computed path for Andi. Nothing is freshly drawn on the second request.</figcaption>
</figure>

SHA-1 produces 40 hexadecimal digits. The Python implementation keeps the first 15. Each hex digit holds four bits, so that prefix gives a 60-bit integer. For Andi:

```text
key:          checkout-v1.button.user-42
SHA-1:        3441f9fc514ea2ac8f04b1c44a64d90aa350f4fb
first 15:     3441f9fc514ea2a
integer h:    235347851596851754
h % 2:        0
choices[0]:   blue
```

`%` means remainder. Dividing an even number by 2 leaves remainder 0; an odd number leaves 1. With two choices, that is the whole `UniformChoice` decision: `choices[h % 2]`.

A thousand servers can repeat it. None needs a stored row saying "Andi got blue", as long as they agree on the input and implementation.

## The bucket picture, with one important distinction

It is tempting to explain every assignment as "put the hash on a line from zero to one, then split the line in half". That is a useful picture for weighted choices. It is not the exact code path for `UniformChoice`.

The archived Python implementation has two different operations:

- `UniformChoice`: use the integer's remainder to select a list position.
- `WeightedChoice`: divide the integer by a scale, then compare it with cumulative weights.

For the second operation, the scale is `2**60 - 1`, or `1,152,921,504,606,846,975`. Andi's normalized value is about `0.2041317216`. With weights `[0.5, 0.5]`, it lands in blue's half of the line.

<figure class="fig planout-fig">
<svg viewBox="0 0 420 296" role="img" aria-labelledby="po-bucket-t po-bucket-d">
<title id="po-bucket-t">Bucket</title>
<desc id="po-bucket-d">UniformChoice selects blue using remainder zero. WeightedChoice instead places normalized value 0.2041 in the first half of a line from zero to one.</desc>
<text class="h" x="12" y="22">UNIFORMCHOICE: LIST INDEX</text><rect class="box" x="12" y="38" width="190" height="60" rx="6"/><text class="t" x="24" y="62">0 → blue</text><text class="m" x="24" y="81">even hash</text><rect class="box" x="218" y="38" width="190" height="60" rx="6"/><text class="t" x="230" y="62">1 → pink</text><text class="m" x="230" y="81">odd hash</text><circle class="fa" cx="107" cy="118" r="6"/><text class="ta" x="107" y="145" text-anchor="middle">Andi: remainder 0</text><text class="h" x="12" y="188">WEIGHTEDCHOICE: CUMULATIVE WEIGHTS</text><rect class="fa" x="12" y="205" width="198" height="32" opacity=".5"/><rect class="fb" x="210" y="205" width="198" height="32" opacity=".5"/><text class="t" x="111" y="226" text-anchor="middle">blue</text><text class="t" x="309" y="226" text-anchor="middle">pink</text><text class="m" x="12" y="258">0</text><text class="m" x="210" y="258" text-anchor="middle">0.5</text><text class="m" x="408" y="258" text-anchor="end">1</text><path class="sa" d="M93,200 v44"/><text class="ta" x="93" y="280" text-anchor="middle">Andi: 0.2041</text>
</svg>
<figcaption>Two different operators. The example uses the same blue/pink order and equal weights, but matching probabilities do not guarantee matching users.</figcaption>
</figure>

Both operations happen to give Andi blue here. That does not mean they assign every user identically. Replacing one with the other can move users even if both advertise a 50/50 split.

A small source-level detail matters if you want compatibility: PlanOut converts that scale to a floating-point value, and uses `<=` at the weighted boundaries. The mathematical normalization includes 1 at the maximum hash. Replacing the denominator with `2**60`, changing the comparison, or switching to another port without checking its hash behaviour is not a harmless cleanup.

## A salt is the name of the shuffle

Think of the salt as the label on a shuffled deck. With the same deck label and the same user ID, draw the same card again. Change the label and you get a new shuffle.

Here are computed results for 10,000 invented users, `user-0` through `user-9999`, using the same key construction and `UniformChoice` modulo rule:

| Change | Users whose button changed |
| --- | ---: |
| Repeat `checkout-v1`, same choices | 0 / 10,000 |
| Change salt to `checkout-v2` | 4,984 / 10,000 |
| Keep salt, reverse `[blue, pink]` | 10,000 / 10,000 |

The original split was 5,004 blue and 4,996 pink. These are reproducible results for this toy population, not a promise that every experiment produces those exact counts.

<figure class="fig planout-fig">
<svg viewBox="0 0 420 306" role="img" aria-labelledby="po-salt-t po-salt-d">
<title id="po-salt-t">Salt</title>
<desc id="po-salt-d">Among ten thousand users, repeating the definition changes zero assignments, changing the experiment salt changes 4984, and reversing the choices changes all ten thousand.</desc>
<text class="h" x="12" y="20">USERS CHANGED / 10,000</text><text class="t" x="12" y="52">Same salt, same choices</text><rect class="box" x="12" y="64" width="396" height="20" rx="4"/><text class="m po-val po-val-0" x="408" y="104" text-anchor="end">0 / 10,000</text><text class="t" x="12" y="142">New salt</text><rect class="box" x="12" y="154" width="396" height="20" rx="4"/><rect class="fa po-bar po-bar-1" x="12" y="154" width="197.3664" height="20" rx="4"/><text class="m po-val po-val-1" x="408" y="194" text-anchor="end">4,984 / 10,000</text><text class="t" x="12" y="232">Reversed choices</text><rect class="box" x="12" y="244" width="396" height="20" rx="4"/><rect class="fb po-bar po-bar-2" x="12" y="244" width="396.0" height="20" rx="4"/><text class="m po-val po-val-2" x="408" y="284" text-anchor="end">10,000 / 10,000</text>
</svg>
<figcaption>Computed on invented user-0 through user-9999. Bars share the same scale; the input change, not new coin tosses, moves users.</figcaption>
</figure>

For Andi, the new salt produces prefix `5c87192d9dc8829`, integer `416707841066043433`, and remainder 1. He moves to pink. Reversing the original choices also gives him pink, but for a different reason: his original index is still 0; index 0 now means pink.

That last row is the trap. Keeping the hash stable is not enough. Keep the meaning of its output stable too.

A new experiment can use a new salt deliberately. A live experiment should not casually rename its salt, change ID formatting, reorder choices, edit weights, or switch hashing algorithms. Any of those can change the experience for people already enrolled. Stateless repeatability is not the same thing as a saved sticky assignment that survives definition changes.

The parameter name acts as a salt too. `button` and `hint` get different hash keys for the same user, unless you intentionally share an explicit salt. This keeps two parameters from being perfectly tied to each other by accident.

## Namespaces: pick the experiment before the button

Now suppose two teams both want to test the checkout page. One tests the button; the other tests the layout. We do not want Andi in both at the same time.

A namespace is a shared allocation space. In the Python implementation, a user hashes into an integer segment. Experiments reserve disjoint sets of segment IDs. The user's segment decides which experiment, if any, runs. Only then does that experiment choose its parameter values.

<figure class="fig planout-fig">
<svg viewBox="0 0 420 326" role="img" aria-labelledby="po-namespace-t po-namespace-d">
<title id="po-namespace-t">Namespace</title>
<desc id="po-namespace-d">Illustrative noncontiguous slots: button experiment owns 0, 3, 7; layout owns 1, 5. Other slots give defaults. A user first routes to one experiment, then gets its parameters.</desc>
<text class="h" x="12" y="20">ONE NAMESPACE · 10 ILLUSTRATIVE SLOTS</text><rect class="fa" x="12" y="36" width="72" height="48" rx="5" opacity=".65"/><text class="t" x="48" y="64" text-anchor="middle">0</text><rect class="fb" x="92" y="36" width="72" height="48" rx="5" opacity=".65"/><text class="t" x="128" y="64" text-anchor="middle">1</text><rect class="box" x="172" y="36" width="72" height="48" rx="5" opacity=".65"/><text class="t" x="208" y="64" text-anchor="middle">2</text><rect class="fa" x="252" y="36" width="72" height="48" rx="5" opacity=".65"/><text class="t" x="288" y="64" text-anchor="middle">3</text><rect class="box" x="332" y="36" width="72" height="48" rx="5" opacity=".65"/><text class="t" x="368" y="64" text-anchor="middle">4</text><rect class="fb" x="12" y="100" width="72" height="48" rx="5" opacity=".65"/><text class="t" x="48" y="128" text-anchor="middle">5</text><rect class="box" x="92" y="100" width="72" height="48" rx="5" opacity=".65"/><text class="t" x="128" y="128" text-anchor="middle">6</text><rect class="fa" x="172" y="100" width="72" height="48" rx="5" opacity=".65"/><text class="t" x="208" y="128" text-anchor="middle">7</text><rect class="box" x="252" y="100" width="72" height="48" rx="5" opacity=".65"/><text class="t" x="288" y="128" text-anchor="middle">8</text><rect class="box" x="332" y="100" width="72" height="48" rx="5" opacity=".65"/><text class="t" x="368" y="128" text-anchor="middle">9</text><text class="ta" x="12" y="186">Button: slots 0, 3, 7</text><text class="tb" x="12" y="208">Layout: slots 1, 5</text><text class="m" x="12" y="230">Other slots: default experience</text><rect class="box" x="12" y="250" width="396" height="64" rx="6"/><text class="t" x="24" y="274">User → segment → one experiment</text><text class="m" x="24" y="293">then: experiment → button value</text>
</svg>
<figcaption>Two decisions: namespace routing, then treatment assignment. Separate namespaces can still overlap in people.</figcaption>
</figure>

The numbered tiles above are an illustration, not Andi's computed upstream namespace segment. The real `add_experiment()` samples from the available segments, so an experiment's allocation need not be a neat contiguous range.

Mutual exclusion applies inside that namespace: a segment cannot belong to both checkout experiments at once. A separate namespace for the homepage can also enrol Andi. Namespaces do not automatically prevent interactions between experiments on different surfaces.

The namespace name, unit, segment count and allocation history are part of the routing contract. Preserving only the button's salt will not preserve routing if those change.

## Assignment is not exposure

We have computed a button colour. Has Andi seen the button? Not necessarily. The page might fail before rendering it. The application might ask for the colour on a route where checkout is never shown.

PlanOut gives you a logging hook. In the default Python experiment behaviour, the first eligible `get()` on an instance triggers exposure logging before returning the parameter. The instance remembers that it logged, so repeated `get()` calls on that same instance do not each emit a new automatic exposure. A new instance is a new situation; there is no global per-user deduplication promise.

<figure class="fig planout-fig">
<svg viewBox="0 0 420 324" role="img" aria-labelledby="po-logging-t po-logging-d">
<title id="po-logging-t">Logging</title>
<desc id="po-logging-d">Computing assignment is followed by first eligible get, which triggers a log hook. Rendering comes later and can fail. A purchase is another event.</desc>
<rect class="box" x="12" y="12" width="396" height="60" rx="6"/><text class="t" x="24" y="36">Compute assignment</text><text class="m" x="24" y="55">blue is the intended value</text><path class="ln" d="M210,72 v20"/><rect class="box" x="12" y="92" width="396" height="60" rx="6"/><text class="t" x="24" y="116">First eligible get("button")</text><text class="m" x="24" y="135">automatic log hook on this instance</text><path class="ln dash" d="M210,152 v20"/><rect class="box" x="12" y="172" width="396" height="60" rx="6"/><text class="t" x="24" y="196">Render button</text><text class="m" x="24" y="215">may fail; get() is not viewability</text><path class="ln dash" d="M210,232 v20"/><rect class="box" x="12" y="252" width="396" height="60" rx="6"/><text class="t" x="24" y="276">Purchase event</text><text class="m" x="24" y="295">outcome, not assignment</text>
</svg>
<figcaption>A parameter-access log is useful evidence, but it is not proof that a person saw the pixels.</figcaption>
</figure>

That hook records parameter access, not human viewability. Automatic logging can be disabled, and an experiment marked out of experiment does not log an exposure. The base experiment delegates the log to your implementation; `SimpleExperiment` writes JSON to a file. Getting a production event pipeline right is still your job.

A useful record connects the unit, experiment, parameter values and time to the definition that produced them. Upstream also records a checksum when available. In a production system I would make the definition version, override, surface and event ID explicit, then decide where the application should emit the event that analysis treats as exposure.

A hash can reconstruct an intended choice if the original inputs and definition survive. It cannot reconstruct a missing render event or a fallback that nobody recorded.

## What the hash cannot tell you

Suppose the button experiment expects an even split, but the logged population contains 700 blue and 300 pink users. That is a sample ratio mismatch, or SRM: the observed group counts are unexpectedly far from the planned allocation.

It is a warning to investigate the experiment, not evidence that pink loses. Maybe assignment changed. Maybe one group has missing events. Maybe the eligibility filter is different on the two paths. Check the population you count, the planned allocation, and the logging before reading an effect estimate. A fixed 50/50 check also does not fit a bandit that intentionally moves traffic.

PlanOut does not perform that investigation or estimate lift for you. Repeatable assignment is one part of trustworthy experimentation. Exposure data, outcome definitions and statistical analysis are separate parts.

## Archived does not mean the idea failed

The public repository was archived on June 1, 2021 and is read-only. That is verifiable. An exact public explanation from the maintainers for *why* it was archived is not established in the sources linked below.

So I would not turn the archive badge into a story about Facebook abandoning experimentation, maintenance costs, or a single successor replacing PlanOut. Its own documentation described the interpreter as one way to define experiments at Facebook, running on top of QuickExperiment. The public library was never the whole internal platform.

What has changed for someone choosing a tool today is the available scope. A language gives you definitions and operators. Modern experimentation products can also provide configuration delivery, allocation controls, exposure handling, metric definitions and analysis. Those are reasons to evaluate a broader platform, not proof of the archive's motive.

## What I would use instead today

There is no official replacement established by the PlanOut sources. The replacement depends on which job you need done.

- For owning the assignment implementation, a small SDK can work, but stable identity, versioned definitions and compatibility tests become your responsibility. GrowthBook's [build-your-own guide](https://docs.growthbook.io/lib/build-your-own) is a useful current example of an SDK contract.
- For an experimentation platform, [GrowthBook](https://docs.growthbook.io/app/sticky-bucketing) and [Statsig](https://docs.statsig.com/experiments-plus) are examples worth evaluating. Compare their allocation, logging, warehouse and analysis paths against your requirements. They are alternatives, not drop-in replicas of PlanOut's byte-level behaviour.
- For adaptive allocation, the policy is another layer. A bandit updates traffic based on rewards; a deterministic hash does not learn which button sells more. I covered that distinction in [Thompson sampling, explained with coupons]({{ '/posts/thompson-sampling-explained-with-coupons/' | relative_url }}).

If I were moving an existing experiment, I would first make a test set of IDs, salts, definitions, overrides and expected outputs. Run old and new systems against it. Explain every disagreement before moving live traffic. A new SDK producing "roughly half in each group" is not enough if it puts different people in those groups.

The lesson I keep from PlanOut is smaller than a whole platform: separate the experiment definition from product code, make assignment repeatable, and make the boundary between a decision and an observation explicit. Andi getting blue twice is easy to demonstrate. Knowing whether blue helped him is a different system.

## References

- Bakshy, Eckles and Bernstein, [Designing and Deploying Online Field Experiments](https://hci.stanford.edu/publications/2014/planout/planout-www2014.pdf), WWW 2014. The design motivation and system boundaries.
- [PlanOut repository](https://github.com/facebookarchive/planout) and [release page](https://github.com/facebookarchive/planout/releases). Public archival status and date.
- Python source: [random operators](https://github.com/facebookarchive/planout/blob/master/python/planout/ops/random.py), [assignment](https://github.com/facebookarchive/planout/blob/master/python/planout/assignment.py), [namespaces](https://github.com/facebookarchive/planout/blob/master/python/planout/namespace.py), and [experiment logging](https://github.com/facebookarchive/planout/blob/master/python/planout/experiment.py). The mechanics here refer to this implementation, not every language port.
- Fabijan et al., [Diagnosing Sample Ratio Mismatch](https://www.microsoft.com/en-us/research/publication/diagnosing-sample-ratio-mismatch-in-online-controlled-experiments-a-taxonomy-and-rules-of-thumb-for-practitioners/), KDD 2019. Why the count mismatch is a diagnostic warning, not a treatment-effect result.
- [About PlanOut](https://github.com/facebook/planout/blob/master/python/docs/08-about-planout.md). Its relationship to QuickExperiment.
- [GrowthBook SDK guide](https://docs.growthbook.io/lib/build-your-own), [sticky bucketing](https://docs.growthbook.io/app/sticky-bucketing), and [Statsig Experiments](https://docs.statsig.com/experiments-plus). Examples of current alternatives, not evidence of an official succession.
