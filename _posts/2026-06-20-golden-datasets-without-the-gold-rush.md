---
layout: post
title: "Golden datasets without the gold rush"
date: 2026-06-20
tags:
- agents
summary: "Simulated personas propose evaluation queries anchored to real documents, and people approve every one. Generate liberally, approve conservatively."
---

A **golden dataset** is the set of questions, with known-good answers, that you run a system against to see whether a change made it better or worse. For a retrieval-augmented generation (RAG) assistant, meaning one that searches a body of documents and writes an answer from what it finds, the golden set is what turns "it feels better" into evidence.

The usual advice for building one is to sit down and write fifty question and answer pairs by hand. That advice is fine for a prototype. It stops working when the assistant serves several markets, several languages and a knowledge base that keeps changing, because nobody has the time to write, and re-write, enough examples to cover all of that.

I work on a production assistant of this kind, and I'm building a pipeline that generates the candidates instead. This post describes the design: simulated personas propose evaluation records, and a person approves each one before it counts. I'll keep it about the mechanism, not the system it runs in, and I won't give sizes or rates because those aren't mine to share.

## What a record contains

An evaluation record is more than a question and an answer. In the pipeline I'm describing, each one has:

- **A query**, written the way a user would type it.
- **An expected answer**, the reference the assistant's answer is compared with.
- **A source document URL**, the place in the knowledge base where the answer comes from.
- **Metadata**: the language of the query, the geography it applies to, and the intent behind it.

The source URL matters most. It **anchors** the record to something checkable. An expected answer with no source is an opinion. An expected answer that points at a specific document can be verified by opening the document, and it gives you a second thing to measure: whether the assistant's retrieval found that document at all. I'll come back to that in the last section.

The metadata is what lets you slice results later. An average score across everything hides a lot. If the same assistant does well in one language and badly in another, you want to see that, which means every record needs to say which language it belongs to.

## Where personas come in

The obvious way to generate questions with a language model is to hand it a document and ask for questions about it. The result is predictable. The questions echo the document's own vocabulary, they're all polite and well-formed, and they all have a tidy answer in the text. Real users don't ask like that.

A **persona** is a short description of a kind of user: who they are, where they are, what they're trying to get done, how they tend to phrase things. The generator is asked to write queries as that person would, about a document sampled from the knowledge index. Different personas produce different questions from the same source:

- someone who knows the topic well and asks a narrow, specific question;
- someone new who doesn't know the right term and describes the situation instead;
- someone whose question only applies in their region;
- someone who writes in another language, or mixes two.

<figure class="fig">
<svg viewBox="0 0 680 236" role="img" aria-labelledby="gd1t gd1d">
  <title id="gd1t">Generating a golden dataset with a human approval gate</title>
  <desc id="gd1d">Source documents from the knowledge index and a simulated persona feed a generator that proposes records containing a query, an expected answer, a source URL and metadata. A human reviewer checks each proposal. Approved records join the golden set. Rejected or edited ones are dropped or fixed.</desc>
  <defs><marker id="gd1a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="arrow" d="M0,0 L10,5 L0,10 z"/></marker></defs>
  <text class="h" x="10" y="16">GENERATE LIBERALLY</text>
  <text class="h" x="520" y="16">APPROVE CONSERVATIVELY</text>
  <rect class="box" x="10" y="30" width="150" height="54" rx="6"/>
  <text class="t" x="22" y="52">Index</text><text class="m" x="22" y="69">source documents</text>
  <rect class="box" x="180" y="30" width="150" height="54" rx="6"/>
  <text class="t" x="192" y="52">Persona</text><text class="m" x="192" y="69">asks like a user</text>
  <rect class="box" x="350" y="30" width="150" height="54" rx="6"/>
  <text class="t" x="362" y="52">Proposed record</text><text class="m" x="362" y="69">query, answer, URL</text>
  <rect class="box" x="520" y="30" width="150" height="54" rx="6"/>
  <text class="t" x="532" y="52">Human review</text><text class="m" x="532" y="69">every record</text>
  <path class="ln" d="M160,57 L178,57" marker-end="url(#gd1a)"/>
  <path class="ln" d="M330,57 L348,57" marker-end="url(#gd1a)"/>
  <path class="ln" d="M500,57 L518,57" marker-end="url(#gd1a)"/>
  <rect class="box" x="520" y="130" width="150" height="54" rx="6" style="stroke:var(--fig-a)"/>
  <text class="t" x="532" y="152">Golden set</text><text class="m" x="532" y="169">approved only</text>
  <rect class="box" x="290" y="130" width="150" height="54" rx="6"/>
  <text class="t" x="302" y="152">Edit or drop</text><text class="m" x="302" y="169">back to the pool</text>
  <path class="sa" d="M620,84 L620,128" marker-end="url(#gd1a)"/>
  <text class="ta" x="628" y="110">approve</text>
  <path class="sb" d="M560,84 C560,110 480,110 440,140" marker-end="url(#gd1a)"/>
  <text class="tb" x="470" y="104">reject</text>
  <text class="m" x="10" y="214">Metadata (language, geography, intent) travels with every record.</text>
</svg>
<figcaption>Generation is cheap and wide. The gate is narrow and manual, and nothing reaches the golden set without passing through it.</figcaption>
</figure>

Personas also give you a coverage lever. If a language or an intent is thin in the set, you ask for more of it by changing the persona mix, instead of asking a colleague to write more by hand. The pipeline is configurable, and the persona mix is the natural knob for that: you change the request, not the code.

## Generate liberally, approve conservatively

The design decision I care most about is where the human sits. Generation is cheap, so I want it to over-produce and be varied. Approval is the expensive part, so it needs to be strict. Nothing a model generates becomes golden on its own, whatever score it gets from another model.

The reason is simple. A golden set is the ruler you measure everything else with. If the ruler is wrong, every comparison you make with it is wrong in a way that's hard to see, because the numbers still look like numbers. A model checking a model's homework tends to agree with itself.

What does the reviewer actually check? Three things, together, for each record:

1. **The query.** Would a real person plausibly ask this? Is it in the language and for the geography the metadata says?
2. **The expected answer.** Is it correct, and complete enough to compare against? Does it say more than the source does?
3. **The source.** Open the document. Does it support the answer? Is it current, and is it the right document for this user, or one that has been superseded?

Checking all three at once is faster than it sounds, because the record puts the three side by side. The reviewer is reading, comparing and deciding, not researching from scratch. That's the whole trade: the model does the tedious drafting and the person keeps the judgement.

## What goes wrong in generated data

Generated evaluation data fails in a handful of predictable ways, and it helps to know which check catches which.

<figure class="fig">
<svg viewBox="0 0 680 236" role="img" aria-labelledby="gd2t gd2d">
  <title id="gd2t">Failure modes in generated records and the review check that catches each</title>
  <desc id="gd2d">A matrix of five failure modes against four checks: query, answer, source and set. Nobody would ask this is caught by the query check. Answer says more than the source is caught by answer and source. Stale source is caught by source. Wrong language or intent tag is caught by query. Near-duplicate records are caught by looking at the set as a whole.</desc>
  <text class="h" x="10" y="18">FAILURE IN A GENERATED RECORD</text>
  <text class="h" x="410" y="18" text-anchor="middle">QUERY</text>
  <text class="h" x="475" y="18" text-anchor="middle">ANSWER</text>
  <text class="h" x="545" y="18" text-anchor="middle">SOURCE</text>
  <text class="h" x="620" y="18" text-anchor="middle">SET</text>
  <line class="grid" x1="10" x2="670" y1="28" y2="28"/>
  <text class="t" x="10" y="52">Nobody would ask this</text>
  <text class="t" x="10" y="90">Answer says more than the source</text>
  <text class="t" x="10" y="128">Source is stale or superseded</text>
  <text class="t" x="10" y="166">Wrong language or intent tag</text>
  <text class="t" x="10" y="204">Near-duplicate of another record</text>
  <line class="grid" x1="10" x2="670" y1="66" y2="66"/>
  <line class="grid" x1="10" x2="670" y1="104" y2="104"/>
  <line class="grid" x1="10" x2="670" y1="142" y2="142"/>
  <line class="grid" x1="10" x2="670" y1="180" y2="180"/>
  <g tabindex="0"><title>Nobody would ask this: caught by reading the query</title><circle class="fa" cx="410" cy="48" r="6"/></g>
  <g tabindex="0"><title>Answer says more than the source: caught by comparing the answer, and by opening the source</title><circle class="fa" cx="475" cy="86" r="6"/><circle class="fa" cx="545" cy="86" r="6"/></g>
  <g tabindex="0"><title>Stale source: caught by opening the source</title><circle class="fa" cx="545" cy="124" r="6"/></g>
  <g tabindex="0"><title>Wrong language or intent tag: caught by reading the query against its metadata</title><circle class="fa" cx="410" cy="162" r="6"/></g>
  <g tabindex="0"><title>Near-duplicate: only visible when looking at the set as a whole</title><circle class="fa" cx="620" cy="200" r="6"/></g>
</svg>
<figcaption>A dot means that check catches the failure. No single check covers everything, and the last row shows why coverage has to be looked at across the set, not record by record.</figcaption>
</figure>

The last row is the one people skip. Each record can be individually fine and the set can still be lopsided: twenty near-identical questions about the same document, and nothing about the one that users actually struggle with. Reviewing records one by one won't show you that. You need to look at the distribution by document, language, geography and intent, and then adjust the personas or the sampling.

## A bigger set is not a better set

It's tempting to report the size of the golden set as an achievement. I'd avoid that. A set padded with near-duplicates is worse than a smaller one that covers the real spread of what people ask, because it gives you a confident number about a narrow slice. The measures I'd care about are coverage, how much reviewers agree with each other, and how many records they had to edit. A headline count tells you none of that.

The same goes for keeping the set alive. The knowledge base changes, so a record that was correct last quarter can point at a document that has since been rewritten. Because each record carries its source URL, you can find those records mechanically and send them back for review, instead of discovering the problem when a score drops for no visible reason.

## What the anchor buys you later

Because each record names its source, the evaluation can ask two separate questions. Did the assistant give a good answer? And did it retrieve the document that answer should come from? When the first is bad and the second is good, the fault is in how the answer was written. When both are bad, look at retrieval. That split is much harder to make when the golden set is only questions and answers, and it's the main reason I insist on the URL.

If you're building something similar, the parts I'd keep are these: anchor every record to a source, use personas to widen what gets asked, keep a person as the only route into the golden set, and review the set as a whole as well as record by record. The rest is tooling.
