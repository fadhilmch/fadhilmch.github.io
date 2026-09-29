---
layout: post
title: "Evaluating an agent honestly"
date: 2026-09-10
tags:
- agents
summary: "Relevance, retrieval recall, groundedness and latency each catch a different failure. Here is how I use them as evidence, and why the report is not a deploy gate."
---

A single score cannot tell you whether an agent is useful. I work on a production assistant that answers questions by searching a body of documents and writing a reply from what it finds, a pattern usually called retrieval-augmented generation, or RAG. It's agentic, meaning a model decides which steps to take, so there are more places for it to go wrong than in a fixed pipeline. This post is about how I evaluate it, and about one decision that surprises people: the evaluation produces a report for engineers, not an automatic pass or fail on deployment.

## Why "it looks better" stops working

In the first weeks of building an agent you can iterate by feel. You try a handful of questions, read the answers, change a prompt, try again. That's a perfectly good way to start.

It breaks down once the system has some reach. The assistant I work on serves several markets, takes questions in any language and mixes global and region-specific knowledge. A change that improves one language can quietly degrade another. Nobody can read enough answers by hand to notice. And because the output is fluent, a worse answer doesn't look worse.

So I treat evaluation as engineering evidence. Compare a change with a baseline, look at the failures one by one, and only then decide what to change next. This is what people mean by **evaluation-driven development**: the eval isn't a check at the end, it's what steers the design.

## Four metrics, four different failures

I measure four things: answer relevance, retrieval recall, groundedness and latency. I want to be specific about why those four, because each one exists to catch something the others miss.

- **Answer relevance:** does the answer address what the user asked?
- **Retrieval recall:** did the search find the documents that contain the answer? This one needs a reference, the source a good answer should come from, which is why my golden examples record one.
- **Groundedness:** is every claim in the answer supported by what was retrieved? An answer can be relevant and still invent a detail.
- **Latency:** how long did the user wait? A correct answer that arrives too late is, for most purposes, not a good one.

<figure class="fig">
<svg viewBox="0 0 680 290" role="img" aria-labelledby="ev1t ev1d">
  <title id="ev1t">Which metric catches which failure</title>
  <desc id="ev1d">A matrix of six failure cases against four metrics. Ignoring the question and off-topic answers are caught by relevance. A missing document is caught by retrieval recall. Unsupported claims are caught by groundedness. A slow answer is caught by latency. A fluent, grounded answer built on a stale source is caught by none of the four.</desc>
  <text class="h" x="10" y="18">FAILURE CASE</text>
  <text class="h" x="395" y="18" text-anchor="middle">RELEVANCE</text>
  <text class="h" x="470" y="18" text-anchor="middle">RECALL</text>
  <text class="h" x="550" y="18" text-anchor="middle">GROUNDED</text>
  <text class="h" x="630" y="18" text-anchor="middle">LATENCY</text>
  <line class="grid" x1="10" x2="670" y1="28" y2="28"/>
  <text class="t" x="10" y="52">Answer ignores the question</text>
  <line class="grid" x1="10" x2="670" y1="66" y2="66"/>
  <g tabindex="0"><title>Answer ignores the question: caught by relevance</title><circle class="fa" cx="395" cy="48" r="6"/></g>
  <text class="t" x="10" y="90">Right document never retrieved</text>
  <line class="grid" x1="10" x2="670" y1="104" y2="104"/>
  <g tabindex="0"><title>Right document never retrieved: caught by retrieval recall</title><circle class="fa" cx="470" cy="86" r="6"/></g>
  <text class="t" x="10" y="128">Answer claims more than sources say</text>
  <line class="grid" x1="10" x2="670" y1="142" y2="142"/>
  <g tabindex="0"><title>Answer claims more than sources say: caught by groundedness</title><circle class="fa" cx="550" cy="124" r="6"/></g>
  <text class="t" x="10" y="166">Faithful to sources, but off-topic</text>
  <line class="grid" x1="10" x2="670" y1="180" y2="180"/>
  <g tabindex="0"><title>Faithful to sources, but off-topic: caught by relevance</title><circle class="fa" cx="395" cy="162" r="6"/></g>
  <text class="t" x="10" y="204">Good answer, arrives far too late</text>
  <line class="grid" x1="10" x2="670" y1="218" y2="218"/>
  <g tabindex="0"><title>Good answer, arrives far too late: caught by latency</title><circle class="fa" cx="630" cy="200" r="6"/></g>
  <text class="t" x="10" y="242">Fluent and grounded, but source is stale</text>
  <line class="grid" x1="10" x2="670" y1="256" y2="256"/>
  <g tabindex="0"><title>Fluent and grounded, but source is stale: none of the four metrics flags it</title><text class="tb" x="512" y="242" text-anchor="middle">none of the four</text></g>
</svg>
<figcaption>Each metric covers a different failure, and each can look healthy while another one is failing. The last row is the reminder that a passing dashboard is not the same as a good answer.</figcaption>
</figure>

Two rows in that matrix deserve a comment. "Faithful to sources, but off-topic" shows why groundedness alone is not enough: an answer can quote its sources perfectly and still not answer the question. And the last row shows the limit of all of them. If the source document is out of date, the assistant can be relevant, well retrieved and faithfully grounded in something that is no longer true. No automated metric flags that. A person reading the failures does, or a content review does.

This is why I don't collapse the four into one number. An average lets a good latency score hide a poor recall score. Reading them side by side tells you which part of the system to look at.

## Two kinds of evaluation, two jobs

There are two evaluations in the loop, and they answer different questions.

**Offline evaluation** runs on demand against a fixed set of questions. In my case it runs whenever there's an architecture change or a significant code change, and it's also what I use to check that a new market or language is ready. Because the test set is fixed, two runs are comparable. It answers: is this change better than what we have?

**Online evaluation** runs against live traffic. Its job is to detect regressions and bugs in production, the things nobody thought to put in the test set. It answers: what did we miss?

<figure class="fig">
<svg viewBox="0 0 680 216" role="img" aria-labelledby="ev2t ev2d">
  <title id="ev2t">Offline evaluation and online monitoring in one loop</title>
  <desc id="ev2d">A change goes through an on-demand offline evaluation run, which produces a report against a baseline. An engineer reads the report and decides whether to release. After release, online evaluation watches live traffic. A regression or new failure found there is turned into a new test case, which feeds the next change.</desc>
  <defs><marker id="ev2a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="arrow" d="M0,0 L10,5 L0,10 z"/></marker></defs>
  <text class="h" x="10" y="16">BEFORE RELEASE · OFFLINE</text>
  <text class="h" x="10" y="208">AFTER RELEASE · ONLINE</text>
  <rect class="box" x="10" y="26" width="132" height="54" rx="6"/>
  <text class="t" x="22" y="48">Change</text><text class="m" x="22" y="65">code or design</text>
  <rect class="box" x="186" y="26" width="132" height="54" rx="6" style="stroke:var(--fig-a)"/>
  <text class="t" x="198" y="48">Offline run</text><text class="m" x="198" y="65">on demand</text>
  <rect class="box" x="362" y="26" width="132" height="54" rx="6" style="stroke:var(--fig-a)"/>
  <text class="t" x="374" y="48">Report</text><text class="m" x="374" y="65">vs baseline</text>
  <rect class="box" x="538" y="26" width="132" height="54" rx="6"/>
  <text class="t" x="550" y="48">Engineer</text><text class="m" x="550" y="65">reads, decides</text>
  <path class="ln" d="M142,53 L184,53" marker-end="url(#ev2a)"/>
  <path class="ln" d="M318,53 L360,53" marker-end="url(#ev2a)"/>
  <path class="ln" d="M494,53 L536,53" marker-end="url(#ev2a)"/>
  <rect class="box" x="538" y="120" width="132" height="54" rx="6"/>
  <text class="t" x="550" y="142">Release</text><text class="m" x="550" y="159">ship it</text>
  <rect class="box" x="362" y="120" width="132" height="54" rx="6" style="stroke:var(--fig-a)"/>
  <text class="t" x="374" y="142">Online eval</text><text class="m" x="374" y="159">live traffic</text>
  <rect class="box" x="186" y="120" width="132" height="54" rx="6" style="stroke:var(--fig-b)"/>
  <text class="tb" x="198" y="142">Regression</text><text class="m" x="198" y="159">or new failure</text>
  <rect class="box" x="10" y="120" width="132" height="54" rx="6"/>
  <text class="t" x="22" y="142">Test set</text><text class="m" x="22" y="159">add the case</text>
  <path class="ln" d="M604,80 L604,118" marker-end="url(#ev2a)"/>
  <path class="ln" d="M538,147 L496,147" marker-end="url(#ev2a)"/>
  <path class="ln" d="M362,147 L320,147" marker-end="url(#ev2a)"/>
  <path class="ln" d="M186,147 L144,147" marker-end="url(#ev2a)"/>
  <path class="ln" d="M76,120 L76,82" marker-end="url(#ev2a)"/>
</svg>
<figcaption>The two kinds of evaluation do different jobs. Offline runs answer "is this change better?" before release. Online evaluation answers "what did we miss?" after it, and feeds the offline set.</figcaption>
</figure>

The loop closes when a failure found online becomes a new offline case. Over time the test set stops being what you thought users would ask and becomes a record of what actually broke. Neither kind is a substitute for the other, and neither is a substitute for understanding the task: someone has to read the failures.

Readiness reviews for a new market combine the offline results with something else: the history of issues that came through support tickets. The eval tells you how the system does on the test questions, and the ticket history tells you what people have actually run into. In practice, the findings from that combination have mostly led to improvements in the source content, not in the code.

## Why the report is not a gate

The default instinct, and it's a reasonable one, is to wire the eval into CI and block a release if the score falls below a threshold. It's what we do with unit tests. I chose not to, and the pipeline I built produces a comprehensive report that compares the current run with a baseline or with agreed criteria, and leaves the decision to an engineer.

My reasoning comes down to three points.

**The scores are noisy.** Metrics like relevance and groundedness are commonly scored by a language model acting as a judge, and the agent itself is not deterministic. Run the same system twice and you'll get slightly different numbers. A hard threshold turns that noise into a coin flip:

<figure class="fig">
<svg viewBox="0 0 680 262" role="img" aria-labelledby="ev3t ev3d">
  <title id="ev3t">Twelve runs of an unchanged system against a fixed threshold</title>
  <desc id="ev3d">Simulated. Twelve repeated evaluation runs of the same system score between 0.78 and 0.82. A pass mark at 0.80 sits in the middle of that spread, so 5 of the twelve runs fail with no change to the system.</desc>
  <line class="grid" x1="60" x2="650" y1="200" y2="200"/>
  <line class="grid" x1="60" x2="650" y1="146.7" y2="146.7"/>
  <line class="grid" x1="60" x2="650" y1="93.3" y2="93.3"/>
  <line class="grid" x1="60" x2="650" y1="40" y2="40"/>
  <text class="m" x="52" y="204" text-anchor="end">0.74</text>
  <text class="m" x="52" y="150" text-anchor="end">0.78</text>
  <text class="m" x="52" y="97" text-anchor="end">0.82</text>
  <text class="m" x="52" y="44" text-anchor="end">0.86</text>
  <line class="sb dash" x1="60" x2="650" y1="120.0" y2="120.0"/>
  <text class="tb" x="650" y="136.0" text-anchor="end">pass mark 0.80</text>
  <g tabindex="0"><title>Run 1: score 0.795, fails the 0.80 pass mark</title><circle class="fb" cx="93.8" cy="126.7" r="6"/></g>
  <text class="m" x="93.8" y="218" text-anchor="middle">1</text>
  <g tabindex="0"><title>Run 2: score 0.810, passes the 0.80 pass mark</title><circle class="fa" cx="141.2" cy="106.7" r="6"/></g>
  <text class="m" x="141.2" y="218" text-anchor="middle">2</text>
  <g tabindex="0"><title>Run 3: score 0.795, fails the 0.80 pass mark</title><circle class="fb" cx="188.8" cy="126.7" r="6"/></g>
  <text class="m" x="188.8" y="218" text-anchor="middle">3</text>
  <g tabindex="0"><title>Run 4: score 0.794, fails the 0.80 pass mark</title><circle class="fb" cx="236.2" cy="128.0" r="6"/></g>
  <text class="m" x="236.2" y="218" text-anchor="middle">4</text>
  <g tabindex="0"><title>Run 5: score 0.781, fails the 0.80 pass mark</title><circle class="fb" cx="283.8" cy="145.3" r="6"/></g>
  <text class="m" x="283.8" y="218" text-anchor="middle">5</text>
  <g tabindex="0"><title>Run 6: score 0.796, fails the 0.80 pass mark</title><circle class="fb" cx="331.2" cy="125.3" r="6"/></g>
  <text class="m" x="331.2" y="218" text-anchor="middle">6</text>
  <g tabindex="0"><title>Run 7: score 0.822, passes the 0.80 pass mark</title><circle class="fa" cx="378.8" cy="90.7" r="6"/></g>
  <text class="m" x="378.8" y="218" text-anchor="middle">7</text>
  <g tabindex="0"><title>Run 8: score 0.808, passes the 0.80 pass mark</title><circle class="fa" cx="426.2" cy="109.3" r="6"/></g>
  <text class="m" x="426.2" y="218" text-anchor="middle">8</text>
  <g tabindex="0"><title>Run 9: score 0.821, passes the 0.80 pass mark</title><circle class="fa" cx="473.8" cy="92.0" r="6"/></g>
  <text class="m" x="473.8" y="218" text-anchor="middle">9</text>
  <g tabindex="0"><title>Run 10: score 0.805, passes the 0.80 pass mark</title><circle class="fa" cx="521.2" cy="113.3" r="6"/></g>
  <text class="m" x="521.2" y="218" text-anchor="middle">10</text>
  <g tabindex="0"><title>Run 11: score 0.808, passes the 0.80 pass mark</title><circle class="fa" cx="568.8" cy="109.3" r="6"/></g>
  <text class="m" x="568.8" y="218" text-anchor="middle">11</text>
  <g tabindex="0"><title>Run 12: score 0.804, passes the 0.80 pass mark</title><circle class="fa" cx="616.2" cy="114.7" r="6"/></g>
  <text class="m" x="616.2" y="218" text-anchor="middle">12</text>
  <text class="m" x="355" y="238" text-anchor="middle">run number, same code and same test set each time</text>
  <text class="m" transform="translate(14 120) rotate(-90)" text-anchor="middle">answer score</text>
  <text class="h" x="60" y="20">BLUE PASSES · ORANGE FAILS</text>
</svg>
<figcaption>Simulated data. Nothing changed between runs, yet 5 of 12 fail. A hard threshold turns run-to-run noise into a red cross.</figcaption>
</figure>

**A single threshold hides the trade-offs.** A change that lifts recall while costing a little relevance on a narrow slice might be exactly the change you want. A gate sees one number and says no. A report shows the per-metric differences, the slices that moved, and the actual examples that got worse, so a person can judge whether the trade is worth it.

**A red cross ends the conversation.** When a gate fails, the natural response is to make it pass: tune until the number moves, or lower the bar. When a report arrives, the natural response is to read it. I'd like the team to argue about specific failing examples, not about the threshold.

## Where a gate does belong

I'm not against gates in general. A hard gate suits checks that are cheap, deterministic and clearly binary. A latency budget is a good example: either the response time is inside the budget or it isn't, and there's little to interpret. The same goes for a safety filter that must never be bypassed, or a schema check on tool output. Those I'd happily block on.

The metrics I'd keep as reports are the ones that need reading: relevance, and the finer judgements about groundedness. The rule of thumb I use is that if a person would want to look at the case before deciding, it shouldn't be an automatic block.

## What changes on a team

Making the evaluation a report changes how people use it. It becomes something you read before a review, alongside the diff, and not a gate that you try to get past. Reports that people actually want to read need to be legible: baseline next to current, differences by metric and slice, and the worst examples one click away. If nobody reads the report, you've built a gate with extra steps, so it's worth spending effort on the reading experience.

The practical lesson is to make evaluation part of the development loop, keep the reports readable by the people making the next decision, and keep a human in the seat where the decision is a judgement call.

## References

1. Lewis, P. et al. *Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks*. NeurIPS, 2020. <https://arxiv.org/abs/2005.11401>
2. Xia, B. et al. *Evaluation-Driven Development and Operations of LLM Agents: A Process Model and Reference Architecture*. arXiv, 2024. <https://arxiv.org/abs/2411.13768>
3. Es, S. et al. *Ragas: Automated Evaluation of Retrieval Augmented Generation*. arXiv, 2023. <https://arxiv.org/abs/2309.15217> — relevance, context and faithfulness metrics.
4. Saad-Falcon, J. et al. *ARES: An Automated Evaluation Framework for Retrieval-Augmented Generation Systems*. NAACL, 2024. <https://arxiv.org/abs/2311.09476>
5. Barnett, S. et al. *Seven Failure Points When Engineering a Retrieval Augmented Generation System*. arXiv, 2024. <https://arxiv.org/abs/2401.05856>
6. Zheng, L. et al. *Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena*. NeurIPS Datasets and Benchmarks, 2023. <https://arxiv.org/abs/2306.05685>
7. Miller, E. *Adding Error Bars to Evals: A Statistical Approach to Language Model Evaluations*. arXiv, 2024. <https://arxiv.org/abs/2411.00640> — quantifying run-to-run noise.
8. Jones, C., Wilkes, J. and Murphy, N. *Service Level Objectives*. In *Site Reliability Engineering*, Google, O'Reilly, 2016. <https://sre.google/sre-book/service-level-objectives/> — latency budgets as SLOs.
