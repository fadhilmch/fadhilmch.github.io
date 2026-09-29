---
layout: post
title: "An agent that triages its own feedback"
date: 2026-08-02
tags:
- agents
- mlops
summary: "Replay the flagged question, check the evidence, name the likely cause, route it to an owner, and send anything doubtful to a person."
---

Once an AI assistant is in production, users start telling you when it gets things wrong. Someone clicks a thumbs-down, or leaves a comment like "this isn't right for my situation". That feedback is valuable, and it is also close to useless as it arrives. It says that something went wrong. It doesn't say what, or whose problem it is.

Working out the what and the who is a small investigation every time. You find the conversation, read the question, look at what the assistant retrieved and what it said, check whether the right information exists anywhere, and decide whether to fix a document or fix the software. Then you find the person who owns that thing and explain it to them. Done by hand, on every flagged item, it eats the time of the people who should be improving the assistant.

I built and run a workflow that does the first pass of that investigation. This post describes how it's put together and, more to the point, where I chose not to let the agent decide anything.

## The shape of the loop

The workflow runs weekly, or on demand when someone wants an answer sooner. It reads the production traces for flagged conversations, and for each one it works through the same steps.

<figure class="fig">
<svg viewBox="0 0 680 216" role="img" aria-labelledby="tr1t tr1d">
  <title id="tr1t">The feedback triage loop</title>
  <desc id="tr1d">Flagged feedback is replayed, then the supporting evidence is checked, then the likely cause is classified, then the case is routed to an owner. The output is a report and a follow-up ticket. If the evidence is missing or conflicting after the check, the case stops and goes to a person.</desc>
  <defs><marker id="tr1a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="arrow" d="M0,0 L10,5 L0,10 z"/></marker></defs>
  <rect class="box" x="9" y="30" width="110" height="54" rx="6"/>
  <text class="t" x="21" y="52">Feedback</text><text class="m" x="21" y="69">flagged trace</text>
  <rect class="box" x="147" y="30" width="110" height="54" rx="6" style="stroke:var(--fig-a)"/>
  <text class="t" x="159" y="52">Replay</text><text class="m" x="159" y="69">ask it again</text>
  <rect class="box" x="285" y="30" width="110" height="54" rx="6" style="stroke:var(--fig-a)"/>
  <text class="t" x="297" y="52">Evidence</text><text class="m" x="297" y="69">sources found</text>
  <rect class="box" x="423" y="30" width="110" height="54" rx="6" style="stroke:var(--fig-a)"/>
  <text class="t" x="435" y="52">Classify</text><text class="m" x="435" y="69">likely cause</text>
  <rect class="box" x="561" y="30" width="110" height="54" rx="6"/>
  <text class="t" x="573" y="52">Route</text><text class="m" x="573" y="69">to an owner</text>
  <path class="ln" d="M119,57 L145,57" marker-end="url(#tr1a)"/>
  <path class="ln" d="M257,57 L283,57" marker-end="url(#tr1a)"/>
  <path class="ln" d="M395,57 L421,57" marker-end="url(#tr1a)"/>
  <path class="ln" d="M533,57 L559,57" marker-end="url(#tr1a)"/>
  <rect class="box" x="561" y="140" width="110" height="54" rx="6"/>
  <text class="t" x="573" y="162">Report</text><text class="m" x="573" y="179">and a ticket</text>
  <path class="ln" d="M616,84 L616,138" marker-end="url(#tr1a)"/>
  <rect class="box" x="230" y="140" width="270" height="54" rx="6" style="stroke:var(--fig-b)"/>
  <text class="tb" x="242" y="162">Missing or conflicting evidence</text><text class="m" x="242" y="179">stop here: a person reviews</text>
  <path class="sb dash" d="M340,84 L340,138" marker-end="url(#tr1a)"/>
  <text class="m" x="9" y="112">weekly, or on demand</text>
  <text class="m" x="9" y="210">blue outline: agent steps</text>
</svg>
<figcaption>Three steps are agent work. The fourth is a lookup. Anywhere the evidence doesn't line up, the loop stops and hands the case to a person.</figcaption>
</figure>

**Replay.** The trace records what the user asked and what the assistant did. The workflow asks the same question again, in the language it was originally asked. This matters more than it sounds. Some complaints describe a problem that has since been fixed, some can't be reproduced, and some reproduce every time. A flag you can't reproduce is a different kind of case from one you can.

**Check the evidence.** This is the step I'd insist on in any version of this system. The workflow looks at what the assistant retrieved and asks whether the information needed for a good answer was actually there. Was the relevant document in the knowledge base at all? Was it retrieved? Does the answer follow from what was retrieved? Everything after this step depends on the answer, so it comes before any conclusion, not after.

**Classify.** From the evidence, the workflow picks a likely cause from a fixed list. The most important split on that list is between two families of problem:

- **A content gap.** The knowledge the assistant needed is missing, out of date, unclear or contradicts another document. Fixing the assistant's code won't help. The indexed content needs to change.
- **A configuration or architecture issue.** The information exists, but the application didn't use it well: retrieval missed it, a setting excluded it, or the flow around the model handled the question badly. The fix is in the software.

**Route.** Each cause on the list maps to an owner, and that mapping is a plain lookup table. More on that below.

The workflow handles feedback, traces and conversations in whatever language they arrived in, since the assistant is used in many. The output is an investigation report per case, and it can open a follow-up ticket for the owner.

## Why the split matters

It's easy to treat all bad feedback as "the AI got it wrong" and send it to the engineers. That's a waste, and in my experience it's also the wrong diagnosis for a lot of cases. If the answer was wrong because a policy document was ambiguous, the engineer can do nothing useful with the ticket. The person who maintains that document can.

Separating content gaps from application faults sends work to the people who can act on it. It also gives you a quiet second benefit. Counting causes over a few weeks tells you where the assistant's weak spots really are. If most of the problems turn out to be content gaps, the most useful improvement isn't a cleverer prompt but better source material. Which way it falls will differ from system to system, but you can't know until the causes are counted.

A made-up example shows the difference. Suppose a user asks how a policy applies in their region and marks the answer as wrong. The replay reproduces the same answer. The evidence check finds that the regional document exists and was retrieved, but that the answer quotes the global one. That points at how the application chose between sources, so the cause is configuration, and the ticket goes to the engineers. Change one fact: the regional document doesn't exist, so the assistant fell back to the global one, which was the best it had. Now the cause is a content gap, and the ticket goes to whoever maintains that content. The complaint was identical both times, and the right owner was different.

## Where the agent stops

An agent that always produces an answer is dangerous in a triage role, because the answer is often a confident guess. So the workflow has a rule: **missing or conflicting evidence goes to a human.**

Missing evidence means the replay couldn't be run or the trace was incomplete. Conflicting evidence means the signals disagree, for example the right document was retrieved but the answer contradicts it in a way that could point at either the content or the model. In both cases the workflow doesn't pick a side. It says what it found, says what it couldn't establish, and hands the case over with the material already gathered.

I think this is the difference between a triage tool people trust and one they route around. The first time it confidently blames the wrong team, the reports stop being read. A tool that says "I can't tell, here is what I've got" loses very little, and it keeps its credibility for the cases where it does commit.

## Judgement by the model, decisions by code

The last design choice is about who does what. The model is good at the fuzzy parts: reading a trace, comparing an answer with retrieved passages, deciding which cause on the list fits. It's a poor choice for deciding who gets paged, because you want that to be predictable and easy to change.

So the cause-to-owner step is deterministic. Something like this:

```python
OWNER_BY_CAUSE = {
    "content_gap": "content-owners",
    "configuration": "application-team",
    "architecture": "engineering",
}

def route(cause):
    # An unknown or missing cause never guesses; it goes to a person.
    return OWNER_BY_CAUSE.get(cause, "human-review")
```

This is a sketch, not the real table, but the principle is what I'm after. If a team reorganises, you edit a mapping. If someone asks why a case went where it did, the answer is a line of code and not "the model felt like it". And because the classifier has to choose from a fixed list, its output is something the rest of the system can check.

<figure class="fig">
<svg viewBox="0 0 680 168" role="img" aria-labelledby="tr2t tr2d">
  <title id="tr2t">Which steps are model judgement and which are plain code</title>
  <desc id="tr2d">Replay, evidence check and cause classification are done by the agent using judgement. Owner lookup, report writing and ticket creation are deterministic code. A cause outside the fixed list routes to human review.</desc>
  <defs><marker id="tr2a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="arrow" d="M0,0 L10,5 L0,10 z"/></marker></defs>
  <text class="h" x="10" y="16">MODEL JUDGEMENT</text>
  <text class="h" x="670" y="16" text-anchor="end">PLAIN CODE</text>
  <rect class="box" x="10" y="30" width="120" height="50" rx="6" style="stroke:var(--fig-a)"/>
  <text class="t" x="22" y="51">Replay</text><text class="m" x="22" y="68">re-ask</text>
  <rect class="box" x="150" y="30" width="120" height="50" rx="6" style="stroke:var(--fig-a)"/>
  <text class="t" x="162" y="51">Evidence</text><text class="m" x="162" y="68">compare</text>
  <rect class="box" x="290" y="30" width="120" height="50" rx="6" style="stroke:var(--fig-a)"/>
  <text class="t" x="302" y="51">Cause</text><text class="m" x="302" y="68">from a list</text>
  <rect class="box" x="430" y="30" width="110" height="50" rx="6"/>
  <text class="t" x="442" y="51">Owner</text><text class="m" x="442" y="68">table lookup</text>
  <rect class="box" x="560" y="30" width="110" height="50" rx="6"/>
  <text class="t" x="572" y="51">Ticket</text><text class="m" x="572" y="68">report</text>
  <path class="ln" d="M130,55 L148,55" marker-end="url(#tr2a)"/>
  <path class="ln" d="M270,55 L288,55" marker-end="url(#tr2a)"/>
  <path class="ln" d="M410,55 L428,55" marker-end="url(#tr2a)"/>
  <path class="ln" d="M540,55 L558,55" marker-end="url(#tr2a)"/>
  <line class="dash ln" x1="420" x2="420" y1="24" y2="92"/>
  <rect class="box" x="290" y="110" width="250" height="46" rx="6" style="stroke:var(--fig-b)"/>
  <text class="tb" x="302" y="130">Not on the list, or unsure</text><text class="m" x="302" y="147">routes to a person</text>
  <path class="sb dash" d="M350,80 L350,108" marker-end="url(#tr2a)"/>
</svg>
<figcaption>The dashed line is where judgement ends. Everything to its right can be read, tested and changed like any other code.</figcaption>
</figure>

## What I haven't measured

The workflow has helped the team deal with recurring issues and content gaps. I haven't formally measured how often its root-cause call and its owner assignment are right, and I'd rather say so than quote a number. The comparison I'd make at this stage isn't accuracy but effort: how much of the manual investigation is already done when a case reaches a person. Because it produces a report with the replay and the evidence attached, a reviewer starts from a worked lead instead of a blank page. My own estimate is that it removes most of the digging per item, based on comparing the manual and the automated routes. It's an estimate, not a controlled measurement.

If you're building something like this, the parts I'd carry over are these: check the evidence before concluding anything, make the cause list small and explicit, keep routing deterministic, and give the agent a clear way to say it doesn't know. The goal is to shorten the investigation, not to automate certainty.

## References

1. Lewis, P. et al. *Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks*. NeurIPS, 2020. <https://arxiv.org/abs/2005.11401>
2. Barnett, S. et al. *Seven Failure Points When Engineering a Retrieval Augmented Generation System*. arXiv, 2024. <https://arxiv.org/abs/2401.05856> — a taxonomy of RAG failures.
3. Anthropic. *Building Effective AI Agents*. Anthropic Engineering, 2024. <https://www.anthropic.com/engineering/building-effective-agents> — routing and workflows versus agents.
4. Es, S. et al. *Ragas: Automated Evaluation of Retrieval Augmented Generation*. arXiv, 2023. <https://arxiv.org/abs/2309.15217>
5. Zheng, L. et al. *Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena*. NeurIPS Datasets and Benchmarks, 2023. <https://arxiv.org/abs/2306.05685>
6. Geifman, Y. and El-Yaniv, R. *Selective Classification for Deep Neural Networks*. arXiv, 2017. <https://arxiv.org/abs/1705.08500> — letting a model abstain when unsure.
