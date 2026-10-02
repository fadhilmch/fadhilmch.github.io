---
layout: post
title: "What I learned tuning retrieval for a multilingual RAG chatbot"
date: 2026-10-02
tags:
- agents
summary: "Multilingual questions against a multilingual knowledge base: English questions were fine all along, while Swedish, Polish and Indonesian ones quietly lost their documents until each question was translated into the knowledge base's languages."
---

<style>
.rq-fig .fg { fill: var(--muted); opacity: .45; }
.rq-fig .fm { fill: var(--muted); }
.rq-fig .ring { fill: var(--bg); stroke: var(--muted); stroke-width: 2; }
.rq-fig .ta { font-size: 12px; }
.prose .fig.rq-explainer { overflow: visible; }
</style>

The chatbot I've been building answers questions about company policies, most of which are specific to one country. That makes it a multilingual problem twice over. The **questions** come in whatever language people like to write in. The **knowledge base** is multilingual too, and each country's mix is different.

Every answer depends on retrieval. If the right document isn't among the few the language model gets to read, no prompt will fix the answer. It will either say it doesn't know or, worse, write something plausible from the wrong source. So before touching prompts I spent a few weeks on the search step: about two dozen configurations, each scored against the same golden set of questions.

This post covers three countries, each with its own knowledge base:

- **Sweden**: policy pages in Swedish and in English. Questions arrive in English, Swedish and Indonesian.
- **Poland**: bilingual pages, Polish and English side by side. Questions arrive in English and Polish.
- **United States**: pages in English only, and questions in English only.

<figure class="fig rq-fig">
<svg viewBox="0 0 680 280" role="img" aria-labelledby="rq0t rq0d">
  <title id="rq0t">Which question languages meet which knowledge bases</title>
  <desc id="rq0d">Questions in four languages on the left, three country knowledge bases on the right. English questions go to all three: Sweden, with pages in Swedish and English; Poland, with pages in Polish and English; and the United States, with pages in English. Swedish questions go to Sweden and Polish questions to Poland; in both cases the question shares a language with some of the pages. Indonesian questions go to Sweden, where no page is written in Indonesian.</desc>
  <text class="h" x="10" y="16">QUESTION LANGUAGE</text>
  <text class="h" x="670" y="16" text-anchor="end">KNOWLEDGE BASE</text>
  <path class="sa" d="M150 52 C 300 52, 330 58, 450 58"/>
  <path class="sa" d="M150 52 C 300 52, 330 140, 450 140"/>
  <path class="sa" d="M150 52 C 300 52, 330 222, 450 222"/>
  <path class="sa" d="M150 112 C 300 112, 330 58, 450 58"/>
  <path class="sa" d="M150 172 C 300 172, 330 140, 450 140"/>
  <path class="sb dash" d="M150 232 C 300 232, 330 58, 450 58"/>
  <rect class="box" x="10" y="35" width="140" height="34" rx="6"/>
  <text class="t" x="24" y="56">English</text>
  <rect class="box" x="10" y="95" width="140" height="34" rx="6"/>
  <text class="t" x="24" y="116">Swedish</text>
  <rect class="box" x="10" y="155" width="140" height="34" rx="6"/>
  <text class="t" x="24" y="176">Polish</text>
  <rect class="box" x="10" y="215" width="140" height="34" rx="6"/>
  <text class="t" x="24" y="236">Indonesian</text>
  <rect class="box" x="450" y="30" width="220" height="56" rx="6"/>
  <text class="t" x="466" y="54" style="font-weight:600">Sweden</text>
  <text class="m" x="466" y="72">pages: Swedish, English</text>
  <rect class="box" x="450" y="112" width="220" height="56" rx="6"/>
  <text class="t" x="466" y="136" style="font-weight:600">Poland</text>
  <text class="m" x="466" y="154">pages: Polish, English</text>
  <rect class="box" x="450" y="194" width="220" height="56" rx="6"/>
  <text class="t" x="466" y="218" style="font-weight:600">United States</text>
  <text class="m" x="466" y="236">pages: English</text>
  <line class="sa" x1="10" x2="40" y1="268" y2="268"/><text class="m" x="48" y="272">shares a language with the pages</text>
  <line class="sb dash" x1="320" x2="350" y1="268" y2="268"/><text class="m" x="358" y="272">no page in this language</text>
</svg>
<figcaption>Which question languages meet which knowledge bases. Every pairing except one shares a language with at least some of the pages. Indonesian is the exception: it stands in for everyone who asks in a language the documents don't use.</figcaption>
</figure>

So there are six combinations of knowledge base and question language, and I'll call each one a **cell**. Thinking in cells turned out to matter more than any single setting. In short: English questions were fine all along, the overall average hid that questions in Swedish, Polish and Indonesian were quietly losing their documents, and translating each question into the knowledge base's languages fixed it.

## How I scored each configuration

Every question in the golden set is annotated with the page or pages a good answer needs, and tagged with its language and the country it's about. I wrote about building that set in [Golden datasets without the gold rush]({% post_url 2026-06-20-golden-datasets-without-the-gold-rush %}).

Two metrics did most of the work:

- **Recall@10**: the share of the needed pages that appear in the top 10 results. This is the main one, because a page that isn't retrieved can't be used.
- **MRR** (mean reciprocal rank): how high the first correct page ranks. When recall ties, a higher MRR means the right page is nearer the top, where the model is more likely to use it.

I also tracked how many documents each configuration passed on to the answer model, plus latency and cost, which I'll give as ratios. Each experiment changed one thing from the configuration before it, so every gain or loss has a single cause. The [previous post]({% post_url 2026-09-10-evaluating-an-agent-honestly %}) explains why I read these numbers as evidence rather than as a pass/fail gate.

## Step 1: the search mode ladder

I started by trying every query mode the search engine offers, from plain keyword matching to hybrid search with a reranker.

<figure class="fig rq-fig">
<svg viewBox="0 0 680 270" role="img" aria-labelledby="rq1t rq1d">
  <title id="rq1t">Recall@10 by search mode</title>
  <desc id="rq1d">Horizontal bars of Recall@10 for six search modes. Hybrid search without a reranker scores 84.0 percent, vector only 84.0, hybrid with a reranker 83.5, keyword with a reranker 74.0, keyword BM25 53.7, and keyword with Lucene query syntax 47.1. The reranker adds 20.3 points to keyword search and changes hybrid recall by half a point, while raising MRR from 0.593 to 0.711.</desc>
  <text class="h" x="10" y="18">BLUE: WITH RERANKER · GREY: WITHOUT</text>
  <line class="grid" x1="230" x2="230" y1="34" y2="242"/>
  <text class="m" x="230" y="258" text-anchor="middle">0%</text>
  <line class="grid" x1="330" x2="330" y1="34" y2="242"/>
  <text class="m" x="330" y="258" text-anchor="middle">25%</text>
  <line class="grid" x1="430" x2="430" y1="34" y2="242"/>
  <text class="m" x="430" y="258" text-anchor="middle">50%</text>
  <line class="grid" x1="530" x2="530" y1="34" y2="242"/>
  <text class="m" x="530" y="258" text-anchor="middle">75%</text>
  <line class="grid" x1="630" x2="630" y1="34" y2="242"/>
  <text class="m" x="630" y="258" text-anchor="middle">100%</text>
  <text class="t" x="10" y="53">Hybrid (keyword + vector)</text>
  <g tabindex="0"><title>Hybrid (keyword + vector): 84.0% Recall@10</title><rect class="fg" x="230" y="40" width="336.0" height="18" rx="3"/></g>
  <text class="m" x="572.0" y="53">84.0</text>
  <text class="t" x="10" y="87">Vector only</text>
  <g tabindex="0"><title>Vector only: 84.0% Recall@10</title><rect class="fg" x="230" y="74" width="336.0" height="18" rx="3"/></g>
  <text class="m" x="572.0" y="87">84.0</text>
  <text class="t" x="10" y="121">Hybrid + reranker</text>
  <g tabindex="0"><title>Hybrid + reranker: 83.5% Recall@10</title><rect class="fa" x="230" y="108" width="334.0" height="18" rx="3"/></g>
  <text class="m" x="570.0" y="121">83.5</text>
  <text class="t" x="10" y="155">Keyword + reranker</text>
  <g tabindex="0"><title>Keyword + reranker: 74.0% Recall@10</title><rect class="fa" x="230" y="142" width="296.0" height="18" rx="3"/></g>
  <text class="m" x="532.0" y="155">74.0</text>
  <text class="t" x="10" y="189">Keyword (BM25)</text>
  <g tabindex="0"><title>Keyword (BM25): 53.7% Recall@10</title><rect class="fg" x="230" y="176" width="214.8" height="18" rx="3"/></g>
  <text class="m" x="450.8" y="189">53.7</text>
  <text class="t" x="10" y="223">Keyword, Lucene syntax</text>
  <g tabindex="0"><title>Keyword, Lucene syntax: 47.1% Recall@10</title><rect class="fg" x="230" y="210" width="188.4" height="18" rx="3"/></g>
  <text class="m" x="424.4" y="223">47.1</text>
</svg>
<figcaption>Recall@10 for each search mode, all six cells together. Hover a bar for its value.</figcaption>
</figure>

Keyword search alone found the right pages about half the time. Vector search, which matches meaning rather than words, jumped to 84%, and hybrid search, which runs both and fuses the results, landed in the same place.

The **reranker** is a model that reads the question and each candidate page together and scores how well they match. On keyword search it added 20 points of recall. On hybrid search, recall barely moved (84.0% to 83.5%), but MRR jumped from 0.593 to 0.711: the same pages, with the right one much nearer the top.

I kept it, for two reasons. The answer model reads the top results first, so ranking matters. And the reranker's score is what makes it possible to cut the list with a threshold later. But that flat recall number was hiding something, and it came back in the next step.

## Step 2: make it cheaper, then look at the cells

Ten documents per question is a lot for the answer model to read, so the next changes were about passing on less.

- A **threshold** on the reranker score drops weak candidates instead of always passing ten.
- A **country filter** limits the search to documents for the country the question is about, plus those that apply everywhere.

Together they cost half a point (83.5% to 83.0%) and cut the average number of documents passed on from 10 to 7.9. Up to this point, every configuration had also appended the country name to the query text ("... in Sweden"). With the filter in place that looked redundant, and it hurt other kinds of questions, so the next change removed it. Recall dropped to 81.0%.

Two and a half points down from the base, for a cleaner query and 6.8 documents. Then I split the results into cells.

<figure class="fig rq-fig">
<svg viewBox="0 0 680 338" role="img" aria-labelledby="rq2t rq2d">
  <title id="rq2t">What the average hid: recall by knowledge base and question language</title>
  <desc id="rq2d">Recall@10 for each knowledge base and question language under three configurations: hybrid search without a reranker, with a reranker, and with the country filter, a reranker threshold and the country name no longer appended. Sweden: English questions 94.5, 93.5, 94.0 percent; Swedish questions 90, 70, 55; Indonesian questions 90, 100, 85. Poland: English questions 79.3, 82.0, 83.3; Polish questions 85, 80, 75. United States: English questions 67.8, 68.6, 65.3.</desc>
  <circle class="ring" cx="15" cy="14" r="5"/>
  <text class="m" x="25" y="18">hybrid, no reranker</text>
  <circle class="fm" cx="179.3" cy="14" r="5"/>
  <text class="m" x="189.3" y="18">+ reranker</text>
  <circle class="fb" cx="283.3" cy="14" r="5"/>
  <text class="m" x="293.3" y="18">+ filter, threshold, no country name</text>
  <line class="grid" x1="230.0" x2="230.0" y1="38" y2="310"/>
  <text class="m" x="230.0" y="328" text-anchor="middle">50%</text>
  <line class="grid" x1="312.0" x2="312.0" y1="38" y2="310"/>
  <text class="m" x="312.0" y="328" text-anchor="middle">60%</text>
  <line class="grid" x1="394.0" x2="394.0" y1="38" y2="310"/>
  <text class="m" x="394.0" y="328" text-anchor="middle">70%</text>
  <line class="grid" x1="476.0" x2="476.0" y1="38" y2="310"/>
  <text class="m" x="476.0" y="328" text-anchor="middle">80%</text>
  <line class="grid" x1="558.0" x2="558.0" y1="38" y2="310"/>
  <text class="m" x="558.0" y="328" text-anchor="middle">90%</text>
  <line class="grid" x1="640.0" x2="640.0" y1="38" y2="310"/>
  <text class="m" x="640.0" y="328" text-anchor="middle">100%</text>
  <text class="h" x="10" y="50">SWEDEN · PAGES IN SWEDISH AND ENGLISH</text>
  <text class="t" x="22" y="78">English questions</text>
  <line class="ln" x1="586.7" x2="594.9" y1="74" y2="74"/>
  <g tabindex="0"><title>English questions, hybrid, no reranker: 94.5%</title><circle class="ring" cx="594.9" cy="74" r="6"/></g>
  <g tabindex="0"><title>English questions, + reranker: 93.5%</title><circle class="fm" cx="586.7" cy="74" r="6"/></g>
  <g tabindex="0"><title>English questions, + filter, threshold, no country name: 94.0%</title><circle class="fb" cx="590.8" cy="74" r="6"/></g>
  <text class="m" x="590.8" y="64" text-anchor="middle">94.0</text>
  <text class="t" x="22" y="108">Swedish questions</text>
  <line class="ln" x1="271.0" x2="558.0" y1="104" y2="104"/>
  <g tabindex="0"><title>Swedish questions, hybrid, no reranker: 90.0%</title><circle class="ring" cx="558.0" cy="104" r="6"/></g>
  <g tabindex="0"><title>Swedish questions, + reranker: 70.0%</title><circle class="fm" cx="394.0" cy="104" r="6"/></g>
  <g tabindex="0"><title>Swedish questions, + filter, threshold, no country name: 55.0%</title><circle class="fb" cx="271.0" cy="104" r="6"/></g>
  <text class="m" x="271.0" y="94" text-anchor="middle">55.0</text>
  <text class="t" x="22" y="138">Indonesian questions</text>
  <line class="ln" x1="517.0" x2="640.0" y1="134" y2="134"/>
  <g tabindex="0"><title>Indonesian questions, hybrid, no reranker: 90.0%</title><circle class="ring" cx="558.0" cy="134" r="6"/></g>
  <g tabindex="0"><title>Indonesian questions, + reranker: 100.0%</title><circle class="fm" cx="640.0" cy="134" r="6"/></g>
  <g tabindex="0"><title>Indonesian questions, + filter, threshold, no country name: 85.0%</title><circle class="fb" cx="517.0" cy="134" r="6"/></g>
  <text class="m" x="517.0" y="124" text-anchor="middle">85.0</text>
  <text class="h" x="10" y="170">POLAND · PAGES IN POLISH AND ENGLISH</text>
  <text class="t" x="22" y="198">English questions</text>
  <line class="ln" x1="470.3" x2="503.1" y1="194" y2="194"/>
  <g tabindex="0"><title>English questions, hybrid, no reranker: 79.3%</title><circle class="ring" cx="470.3" cy="194" r="6"/></g>
  <g tabindex="0"><title>English questions, + reranker: 82.0%</title><circle class="fm" cx="492.4" cy="194" r="6"/></g>
  <g tabindex="0"><title>English questions, + filter, threshold, no country name: 83.3%</title><circle class="fb" cx="503.1" cy="194" r="6"/></g>
  <text class="m" x="503.1" y="184" text-anchor="middle">83.3</text>
  <text class="t" x="22" y="228">Polish questions</text>
  <line class="ln" x1="435.0" x2="517.0" y1="224" y2="224"/>
  <g tabindex="0"><title>Polish questions, hybrid, no reranker: 85.0%</title><circle class="ring" cx="517.0" cy="224" r="6"/></g>
  <g tabindex="0"><title>Polish questions, + reranker: 80.0%</title><circle class="fm" cx="476.0" cy="224" r="6"/></g>
  <g tabindex="0"><title>Polish questions, + filter, threshold, no country name: 75.0%</title><circle class="fb" cx="435.0" cy="224" r="6"/></g>
  <text class="m" x="435.0" y="214" text-anchor="middle">75.0</text>
  <text class="h" x="10" y="260">UNITED STATES · PAGES IN ENGLISH</text>
  <text class="t" x="22" y="288">English questions</text>
  <line class="ln" x1="355.5" x2="382.5" y1="284" y2="284"/>
  <g tabindex="0"><title>English questions, hybrid, no reranker: 67.8%</title><circle class="ring" cx="376.0" cy="284" r="6"/></g>
  <g tabindex="0"><title>English questions, + reranker: 68.6%</title><circle class="fm" cx="382.5" cy="284" r="6"/></g>
  <g tabindex="0"><title>English questions, + filter, threshold, no country name: 65.3%</title><circle class="fb" cx="355.5" cy="284" r="6"/></g>
  <text class="m" x="355.5" y="274" text-anchor="middle">65.3</text>
</svg>
<figcaption>Recall@10 for each cell, grouped by knowledge base. Overall recall fell 3 points across these steps. Swedish questions lost 35.</figcaption>
</figure>

**English questions held up in every knowledge base.** Every country has English pages, so an English question always shares a language with something it can find. Sweden's English questions stayed around 94%, Poland's rose 4 points, and the United States' dipped by 2.5. Nothing dramatic.

**The other three cells told a different story:**

- **Swedish questions against Sweden's mixed knowledge base** fell hardest: 90% with plain hybrid search, 70% with the reranker, 55% at the end. The MRR numbers add a twist. Without the reranker, these questions found their pages but ranked them poorly, with an MRR of just 0.17. The reranker pulled the pages it kept up the list (MRR 0.45), but pushed others out of the top 10 entirely.
- **Polish questions against Poland's bilingual pages** slid from 85% to 75%. A smaller loss than Swedish, even though both are questions in the local language.
- **Indonesian questions against Sweden**, which share no language with any page, actually did well with the reranker (100%, and MRR up from 0.37 to 0.78). They only fell, to 85%, when the country name came out of the query.

I don't have a complete explanation for the reranker step. The cell that lost most to it, Swedish questions, is one where the question does share a language with some of the pages, while the cell with no shared language gained. So it isn't simply "non-English questions do worse". My guess is that the reranker is weaker on Swedish text in particular. The last step is easier to read: removing the appended country name cost all three non-English cells 5 to 15 points, while the English cells as a whole didn't change. An English word like "Sweden" seems to have been giving those questions an anchor in the English pages.

These cells are small, so one question moves the number by several points. Even so, a 35-point drop for Swedish questions is not something an overall average should be allowed to hide.

## Step 3: translate into the knowledge base's languages

The fix was to stop searching with the question as written, and search in the knowledge base's languages instead. The walkthrough below goes through it step by step. Steps 1 and 2 recap the single search path, 3 to 5 cover translation and merging, and 6 covers a third path I'll come back to.

<figure class="fig rq-explainer">
<iframe id="rq-explainer" src="{{ '/assets/posts/multilingual-rag/retrieval-explainer.html' | relative_url }}" title="Animated walkthrough: two translated queries and a max-score merge" loading="lazy" style="display:block;width:100%;height:640px;border:0"></iframe>
<figcaption>Six steps. Use the numbered buttons or the arrows, or drag the timeline. The example question and documents are invented.</figcaption>
</figure>
<script>
window.addEventListener('message', function (event) {
  if (event.origin !== window.location.origin) return;
  var data = event.data;
  if (data && data.explainer === 'multilingual-rag' && data.height) {
    document.getElementById('rq-explainer').style.height = data.height + 'px';
  }
});
</script>

Every question now becomes two queries, one per language the knowledge base is written in:

1. An **English** translation, because every country has English pages.
2. A translation into the **country's own language**: Swedish for Sweden, Polish for Poland. For the United States, whose pages are all English, both queries end up in English.

The language the person wrote in is ignored. An Indonesian question about Sweden gets English and Swedish queries, not an Indonesian one, because no pages are written in Indonesian and searching for Indonesian text would find nothing. Picking languages from the knowledge base's side, not the user's, is the part of this design that matters most.

Both queries run in parallel through the same hybrid search and reranker. The two result lists are merged by keeping each page's higher score, and the same threshold applies to the merged list.

<figure class="fig rq-fig">
<svg viewBox="0 0 680 338" role="img" aria-labelledby="rq4t rq4d">
  <title id="rq4t">Recall by knowledge base and question language, one query vs two translated queries</title>
  <desc id="rq4d">Recall@10 for each knowledge base and question language, before and after translating each question into English and the country language. Sweden: English questions 94.0 to 93.5 percent; Swedish questions 55 to 100; Indonesian questions 85 to 100. Poland: English questions 83.3 both times; Polish questions 75 to 85. United States: 65.3 both times.</desc>
  <circle class="fb" cx="15" cy="14" r="5"/>
  <text class="m" x="25" y="18">one query, no country name</text>
  <circle class="fa" cx="226.20000000000002" cy="14" r="5"/>
  <text class="m" x="236.20000000000002" y="18">translated: English + local language</text>
  <line class="grid" x1="230.0" x2="230.0" y1="38" y2="310"/>
  <text class="m" x="230.0" y="328" text-anchor="middle">50%</text>
  <line class="grid" x1="312.0" x2="312.0" y1="38" y2="310"/>
  <text class="m" x="312.0" y="328" text-anchor="middle">60%</text>
  <line class="grid" x1="394.0" x2="394.0" y1="38" y2="310"/>
  <text class="m" x="394.0" y="328" text-anchor="middle">70%</text>
  <line class="grid" x1="476.0" x2="476.0" y1="38" y2="310"/>
  <text class="m" x="476.0" y="328" text-anchor="middle">80%</text>
  <line class="grid" x1="558.0" x2="558.0" y1="38" y2="310"/>
  <text class="m" x="558.0" y="328" text-anchor="middle">90%</text>
  <line class="grid" x1="640.0" x2="640.0" y1="38" y2="310"/>
  <text class="m" x="640.0" y="328" text-anchor="middle">100%</text>
  <text class="h" x="10" y="50">SWEDEN · PAGES IN SWEDISH AND ENGLISH</text>
  <text class="t" x="22" y="78">English questions</text>
  <line class="ln" x1="586.7" x2="590.8" y1="74" y2="74"/>
  <g tabindex="0"><title>English questions, one query, no country name: 94.0%</title><circle class="fb" cx="590.8" cy="74" r="6"/></g>
  <g tabindex="0"><title>English questions, translated: English + local language: 93.5%</title><circle class="fa" cx="586.7" cy="74" r="6"/></g>
  <text class="m" x="586.7" y="64" text-anchor="middle">93.5</text>
  <text class="t" x="22" y="108">Swedish questions</text>
  <line class="ln" x1="271.0" x2="640.0" y1="104" y2="104"/>
  <g tabindex="0"><title>Swedish questions, one query, no country name: 55.0%</title><circle class="fb" cx="271.0" cy="104" r="6"/></g>
  <g tabindex="0"><title>Swedish questions, translated: English + local language: 100.0%</title><circle class="fa" cx="640.0" cy="104" r="6"/></g>
  <text class="m" x="640.0" y="94" text-anchor="middle">100.0</text>
  <text class="t" x="22" y="138">Indonesian questions</text>
  <line class="ln" x1="517.0" x2="640.0" y1="134" y2="134"/>
  <g tabindex="0"><title>Indonesian questions, one query, no country name: 85.0%</title><circle class="fb" cx="517.0" cy="134" r="6"/></g>
  <g tabindex="0"><title>Indonesian questions, translated: English + local language: 100.0%</title><circle class="fa" cx="640.0" cy="134" r="6"/></g>
  <text class="m" x="640.0" y="124" text-anchor="middle">100.0</text>
  <text class="h" x="10" y="170">POLAND · PAGES IN POLISH AND ENGLISH</text>
  <text class="t" x="22" y="198">English questions</text>
  <line class="ln" x1="503.1" x2="503.1" y1="194" y2="194"/>
  <g tabindex="0"><title>English questions, one query, no country name: 83.3%</title><circle class="fb" cx="503.1" cy="194" r="6"/></g>
  <g tabindex="0"><title>English questions, translated: English + local language: 83.3%</title><circle class="fa" cx="503.1" cy="194" r="6"/></g>
  <text class="m" x="503.1" y="184" text-anchor="middle">83.3</text>
  <text class="t" x="22" y="228">Polish questions</text>
  <line class="ln" x1="435.0" x2="517.0" y1="224" y2="224"/>
  <g tabindex="0"><title>Polish questions, one query, no country name: 75.0%</title><circle class="fb" cx="435.0" cy="224" r="6"/></g>
  <g tabindex="0"><title>Polish questions, translated: English + local language: 85.0%</title><circle class="fa" cx="517.0" cy="224" r="6"/></g>
  <text class="m" x="517.0" y="214" text-anchor="middle">85.0</text>
  <text class="h" x="10" y="260">UNITED STATES · PAGES IN ENGLISH</text>
  <text class="t" x="22" y="288">English questions</text>
  <line class="ln" x1="355.5" x2="355.5" y1="284" y2="284"/>
  <g tabindex="0"><title>English questions, one query, no country name: 65.3%</title><circle class="fb" cx="355.5" cy="284" r="6"/></g>
  <g tabindex="0"><title>English questions, translated: English + local language: 65.3%</title><circle class="fa" cx="355.5" cy="284" r="6"/></g>
  <text class="m" x="355.5" y="274" text-anchor="middle">65.3</text>
</svg>
<figcaption>Recall@10 for each cell, before and after translating each question into the knowledge base's languages.</figcaption>
</figure>

Overall recall went from 81.0% to 85.5%. The gain landed exactly where the problem was:

- **Swedish questions** went from 55% to 100%, and their MRR from 0.39 to 0.67. Both problems from step 2, missing pages and poor ranking, improved at once.
- **Indonesian questions** went from 85% to 100%.
- **Polish questions** went from 75% to 85%, back to where they started before the reranker.
- **English questions** stayed within a point of where they were, in all three knowledge bases. For an English question, the English translation is close to the original, and in the United States there's nothing else to translate into.

Fifteen questions that used to miss now found their page, and fourteen of them were asked in Swedish, Indonesian or Polish. One English question got worse. The model reads 6.4 documents on average, slightly fewer than before. Compared with the version that still had the country name in the query, recall is 2.5 points higher: a proper translation does what the appended word was doing by accident.

What I can't tell you yet is how the work splits between the two queries. I didn't run each one on its own, so I don't know how much of the gain comes from the English query and how much from the local one. That's the next experiment.

The cost is one translation call per question, which is the only language-model call in retrieval. Retrieval latency a little more than doubled, but it's still a small part of the time a full answer takes, and cost per question rose by about a quarter.

## Merging: keep the best score, don't fuse ranks

The usual way to merge ranked lists is **reciprocal rank fusion** (RRF). Each document gets 1/(60 + rank) for every list it appears in, and the totals are summed. It ignores the scores completely, which is its strength when the lists come from systems whose scores aren't comparable.

Here the scores are comparable, because both paths are scored by the same reranker. Taking the maximum keeps that information: a page one path is confident about stays near the top even if the other path missed it. RRF instead rewards pages that turn up everywhere, so a page that was mediocre on both paths can overtake one that a single path was sure of. Step 5 of the walkthrough shows this happening.

When I tested both, recall was the same (84.0% against 83.7%), but max score ranked the right page higher: MRR 0.706 against 0.637. There's a practical reason too. A threshold only makes sense on a score with a fixed meaning, and RRF totals don't have one.

The condition matters, though. If your paths are different retrievers with different score scales, such as raw keyword scores next to vector similarities, the max is meaningless and RRF or score normalisation is the right choice.

## HyDE: neutral alone, marginal together

**HyDE** (Hypothetical Document Embeddings) asks a language model to write a plausible answer, then searches with that passage instead of the question. The idea is that an answer-shaped passage looks more like the documents than a question does.

Used on its own instead of the question, it changed nothing overall.

<figure class="fig rq-fig">
<svg viewBox="0 0 680 350" role="img" aria-labelledby="rq3t rq3d">
  <title id="rq3t">HyDE used alone: change in Recall@10 by knowledge base and question language</title>
  <desc id="rq3d">Change in Recall@10 when the question is replaced by a HyDE passage, against the same search without HyDE. All questions: no change. Sweden: English questions minus 0.5 points, Swedish questions plus 5.0, Indonesian questions minus 5.0. Poland: English questions plus 0.7, Polish questions no change. United States: no change.</desc>
  <text class="h" x="10" y="18">BLUE HELPS · ORANGE HURTS · POINTS OF RECALL@10</text>
  <line class="grid" x1="270" x2="270" y1="34" y2="320"/>
  <text class="m" x="270" y="336" text-anchor="middle">-10</text>
  <line class="grid" x1="360" x2="360" y1="34" y2="320"/>
  <text class="m" x="360" y="336" text-anchor="middle">-5</text>
  <line class="grid" x1="450" x2="450" y1="34" y2="320"/>
  <text class="m" x="450" y="336" text-anchor="middle">0</text>
  <line class="grid" x1="540" x2="540" y1="34" y2="320"/>
  <text class="m" x="540" y="336" text-anchor="middle">+5</text>
  <line class="grid" x1="630" x2="630" y1="34" y2="320"/>
  <text class="m" x="630" y="336" text-anchor="middle">+10</text>
  <text class="t" x="10" y="53">All questions</text>
  <g tabindex="0"><title>All questions: +0.0 points</title><rect class="fm" x="450.0" y="40" width="1.5" height="18" rx="3"/></g>
  <text class="m" x="458" y="53">no change</text>
  <text class="h" x="10" y="76">SWEDEN · PAGES IN SWEDISH AND ENGLISH</text>
  <text class="t" x="22" y="107">English questions</text>
  <g tabindex="0"><title>English questions: -0.5 points</title><rect class="fb" x="441.0" y="94" width="9.0" height="18" rx="3"/></g>
  <text class="m" x="435.0" y="107" text-anchor="end">-0.5</text>
  <text class="t" x="22" y="135">Swedish questions</text>
  <g tabindex="0"><title>Swedish questions: +5.0 points</title><rect class="fa" x="450.0" y="122" width="90.0" height="18" rx="3"/></g>
  <text class="m" x="546.0" y="135" text-anchor="start">+5.0</text>
  <text class="t" x="22" y="163">Indonesian questions</text>
  <g tabindex="0"><title>Indonesian questions: -5.0 points</title><rect class="fb" x="360.0" y="150" width="90.0" height="18" rx="3"/></g>
  <text class="m" x="354.0" y="163" text-anchor="end">-5.0</text>
  <text class="h" x="10" y="188">POLAND · PAGES IN POLISH AND ENGLISH</text>
  <text class="t" x="22" y="219">English questions</text>
  <g tabindex="0"><title>English questions: +0.7 points</title><rect class="fa" x="450.0" y="206" width="12.6" height="18" rx="3"/></g>
  <text class="m" x="468.6" y="219" text-anchor="start">+0.7</text>
  <text class="t" x="22" y="247">Polish questions</text>
  <g tabindex="0"><title>Polish questions: +0.0 points</title><rect class="fm" x="450.0" y="234" width="1.5" height="18" rx="3"/></g>
  <text class="m" x="458" y="247">no change</text>
  <text class="h" x="10" y="272">UNITED STATES · PAGES IN ENGLISH</text>
  <text class="t" x="22" y="303">English questions</text>
  <g tabindex="0"><title>English questions: +0.0 points</title><rect class="fm" x="450.0" y="290" width="1.5" height="18" rx="3"/></g>
  <text class="m" x="458" y="303">no change</text>
  <line class="ln" x1="450" x2="450" y1="34" y2="320"/>
</svg>
<figcaption>Change in Recall@10 for each cell when the question is replaced by a HyDE passage, against the same search without HyDE.</figcaption>
</figure>

Overall recall stayed at 83.0%: eight questions gained, seven lost, and retrieval was four times slower. Underneath, Swedish questions gained 5 points and Indonesian questions lost 5. That mix is what made it worth one more try. A technique that finds *different* pages can be useful as an extra path even if it doesn't beat the original, so I added it as a **third parallel path** with the same max-score merge. A path that only adds candidates can't push good results out, because the merge keeps whichever score is highest.

Next to the two translated queries, it added 0.6 points: 86.1% against 85.5%, three questions gained (two of them in the United States) and one lost. That cost 2.4 times the retrieval latency and 4.6 times the language-model tokens. For a chatbot, where people are waiting for an answer, that isn't worth it, so the chat setup uses two paths.

The lesson is to judge an extra path against your best setup, not a weak one. Once the translations were in place, most of what HyDE could have caught was already being found.

## Every step, every cell

The matrix below puts the whole story in one place. Rows are knowledge bases, columns are question languages, and each cell shows how that combination did. Step through the configurations, or press play, and watch which cells move. Switch to MRR to see the ranking side.

<style>
.rq-lab { margin: 32px 0; padding: 20px; border: 1px solid var(--line); border-radius: 8px; background: var(--panel); box-sizing: border-box; }
@media (min-width: 900px) { .prose .rq-lab { width: min(680px, calc(100vw - 72px)); } }
.prose .rq-lab h3 { margin: 0 0 6px; }
.prose .rq-lab p { margin: 0 0 12px; font-size: 14px; color: var(--muted); }
.rq-lab .rq-js { display: none; }
.rq-lab.is-live .rq-js { display: flex; }
.rq-bar { flex-wrap: wrap; gap: 6px; align-items: center; margin: 0 0 10px; }
.rq-lab button { font: 12px 'Geist Mono', monospace; padding: 6px 10px; min-height: 36px; border: 1px solid var(--line); border-radius: 6px; background: var(--bg); color: var(--fg); cursor: pointer; }
.rq-lab button[aria-pressed="true"] { border-color: var(--fig-a); background: color-mix(in oklch, var(--fig-a) 16%, var(--bg)); }
.rq-lab button:focus-visible { outline: 2px solid var(--fig-a); outline-offset: 2px; }
.rq-lab .rq-play { min-width: 72px; }
.rq-bar .rq-label { font: 11px 'Geist Mono', monospace; color: var(--muted); letter-spacing: .04em; margin-right: 4px; }
.prose .rq-lab .rq-note { min-height: 3.2em; margin: 4px 0 14px; color: var(--fg); font-size: 14px; }
.rq-wrap { overflow-x: auto; }
table.rq-grid { width: 100%; min-width: 520px; border-collapse: separate; border-spacing: 4px; font: 12px 'Geist Mono', monospace; margin: 0; }
.rq-grid th { text-align: left; font-weight: 500; color: var(--muted); padding: 4px 6px; vertical-align: bottom; border: 0; background: none; }
.rq-grid th[scope="row"] { color: var(--fg); vertical-align: middle; width: 26%; }
.rq-grid th[scope="row"] small { display: block; color: var(--muted); font-weight: 400; font-size: 11px; }
.rq-grid td { height: 58px; padding: 6px 8px; border: 0; border-radius: 6px; vertical-align: top; background: color-mix(in oklch, var(--fig-a) var(--p, 8%), var(--panel)); transition: background-color .45s ease; }
.rq-grid td.na { background: repeating-linear-gradient(135deg, transparent 0 6px, var(--line) 6px 7px); color: var(--muted); vertical-align: middle; }
.rq-grid td.nomatch { box-shadow: inset 0 0 0 1.5px var(--fig-b); }
.rq-val { display: block; font-size: 18px; font-weight: 600; color: var(--fg); }
.rq-delta { font-size: 11px; color: var(--fg); opacity: .8; }
.rq-delta.up::before { content: '▲ '; color: var(--fig-a); }
.rq-delta.down::before { content: '▼ '; color: var(--fig-b); }
.rq-sum { display: flex; flex-wrap: wrap; gap: 8px 22px; margin-top: 12px; font: 12px 'Geist Mono', monospace; color: var(--muted); }
.rq-sum b { color: var(--fg); font-size: 14px; font-weight: 600; }
.rq-legend { margin-top: 10px; font: 11px/1.6 'Geist Mono', monospace; color: var(--muted); }
.rq-legend i { display: inline-block; width: 12px; height: 12px; border-radius: 3px; vertical-align: -2px; margin-right: 4px; }
@media (prefers-reduced-motion: reduce) { .rq-grid td { transition: none; } }
@media (max-width: 420px) { .rq-lab { padding: 14px; } }
</style>

<section class="rq-lab" id="rq-matrix" aria-labelledby="rq-matrix-title">
  <h3 id="rq-matrix-title">Six cells, six configurations</h3>
  <p>Rows are knowledge bases, columns are the language the question was asked in. Darker cells score higher.</p>
  <div class="rq-bar rq-js" role="group" aria-label="Configuration">
    <span class="rq-label">STEP</span>
  </div>
  <div class="rq-bar rq-js" role="group" aria-label="Metric and playback">
    <span class="rq-label">SHOW</span>
    <button type="button" data-metric="recall" aria-pressed="true">Recall@10</button>
    <button type="button" data-metric="mrr" aria-pressed="false">MRR</button>
    <button type="button" class="rq-play">Play</button>
  </div>
  <p class="rq-note" aria-live="polite">Configuration used for chat: English and country-language translations, merged by max score.</p>
  <div class="rq-wrap">
    <table class="rq-grid">
      <thead>
        <tr><th scope="col">Knowledge base</th><th scope="col">English</th><th scope="col">Swedish</th><th scope="col">Polish</th><th scope="col">Indonesian</th></tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row">Sweden<small>Swedish + English pages</small></th>
          <td data-cell="SE-en"><span class="rq-val">93.5%</span><span class="rq-delta"></span></td>
          <td data-cell="SE-sw"><span class="rq-val">100.0%</span><span class="rq-delta"></span></td>
          <td class="na">not asked</td>
          <td data-cell="SE-in" class="nomatch"><span class="rq-val">100.0%</span><span class="rq-delta"></span></td>
        </tr>
        <tr>
          <th scope="row">Poland<small>Polish + English pages</small></th>
          <td data-cell="PL-en"><span class="rq-val">83.3%</span><span class="rq-delta"></span></td>
          <td class="na">not asked</td>
          <td data-cell="PL-po"><span class="rq-val">85.0%</span><span class="rq-delta"></span></td>
          <td class="na">not asked</td>
        </tr>
        <tr>
          <th scope="row">United States<small>English pages</small></th>
          <td data-cell="US-en"><span class="rq-val">65.3%</span><span class="rq-delta"></span></td>
          <td class="na">not asked</td>
          <td class="na">not asked</td>
          <td class="na">not asked</td>
        </tr>
      </tbody>
    </table>
  </div>
  <div class="rq-sum" aria-live="polite">
    <span>all questions <b data-sum="recall">85.5%</b></span>
    <span>MRR <b data-sum="mrr">0.705</b></span>
    <span>documents kept <b data-sum="docs">6.4</b></span>
  </div>
  <div class="rq-legend"><i style="box-shadow: inset 0 0 0 1.5px var(--fig-b)"></i>orange outline: no page is written in the question's language &nbsp; <i style="background: repeating-linear-gradient(135deg, transparent 0 4px, var(--line) 4px 5px)"></i>hatched: no questions of this kind &nbsp; ▲ ▼ change from the previous step</div>
</section>
{% raw %}
<script>
(() => {
  'use strict';
  const root = document.getElementById('rq-matrix');
  if (!root) return;
  // Recall@10 (%) and MRR per cell, recomputed per knowledge base and question language.
  const STEPS = [
    { label: '1 Hybrid', note: 'Keyword and vector search fused, no reranker. Swedish questions find their pages but rank them low: MRR 0.17.',
      all: [84.0, 0.593, 10.0], cells: { 'SE-en': [94.5, 0.691], 'SE-sw': [90.0, 0.170], 'SE-in': [90.0, 0.372], 'PL-en': [79.3, 0.654], 'PL-po': [85.0, 0.576], 'US-en': [67.8, 0.575] } },
    { label: '2 + reranker', note: 'The reranker lifts ranking almost everywhere, and costs Swedish questions 20 points of recall.',
      all: [83.5, 0.711, 10.0], cells: { 'SE-en': [93.5, 0.828], 'SE-sw': [70.0, 0.447], 'SE-in': [100.0, 0.782], 'PL-en': [82.0, 0.756], 'PL-po': [80.0, 0.710], 'US-en': [68.6, 0.522] } },
    { label: '3 + threshold, filter', note: 'A score threshold and a country filter: 7.9 documents instead of 10, for half a point of recall.',
      all: [83.0, 0.715, 7.9], cells: { 'SE-en': [94.5, 0.843], 'SE-sw': [65.0, 0.437], 'SE-in': [100.0, 0.782], 'PL-en': [82.0, 0.762], 'PL-po': [80.0, 0.710], 'US-en': [66.1, 0.512] } },
    { label: '4 − country name', note: 'The country name is no longer appended to the query. Every non-English cell drops. English cells hold.',
      all: [81.0, 0.700, 6.8], cells: { 'SE-en': [94.0, 0.816], 'SE-sw': [55.0, 0.392], 'SE-in': [85.0, 0.738], 'PL-en': [83.3, 0.761], 'PL-po': [75.0, 0.667], 'US-en': [65.3, 0.529] } },
    { label: '5 + translation', note: 'Configuration used for chat: English and country-language translations, merged by max score.',
      all: [85.5, 0.705, 6.4], cells: { 'SE-en': [93.5, 0.784], 'SE-sw': [100.0, 0.665], 'SE-in': [100.0, 0.701], 'PL-en': [83.3, 0.762], 'PL-po': [85.0, 0.654], 'US-en': [65.3, 0.532] } },
    { label: '6 + HyDE', note: 'A HyDE passage as a third path: 0.6 points more overall, for 2.4 times the retrieval latency.',
      all: [86.1, 0.706, 7.4], cells: { 'SE-en': [94.0, 0.771], 'SE-sw': [100.0, 0.664], 'SE-in': [100.0, 0.717], 'PL-en': [82.7, 0.749], 'PL-po': [85.0, 0.671], 'US-en': [67.8, 0.561] } }
  ];
  const stepBar = root.querySelector('[aria-label="Configuration"]');
  const metricButtons = Array.from(root.querySelectorAll('[data-metric]'));
  const playButton = root.querySelector('.rq-play');
  const note = root.querySelector('.rq-note');
  const cells = Array.from(root.querySelectorAll('td[data-cell]'));
  const sums = { recall: root.querySelector('[data-sum="recall"]'), mrr: root.querySelector('[data-sum="mrr"]'), docs: root.querySelector('[data-sum="docs"]') };
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let step = 4, metric = 'recall', timer = 0;

  const stepButtons = STEPS.map((s, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = s.label;
    b.addEventListener('click', () => { stop(); show(i); });
    stepBar.appendChild(b);
    return b;
  });

  const value = (pair) => metric === 'recall' ? pair[0] : pair[1];
  const format = (v) => metric === 'recall' ? v.toFixed(1) + '%' : v.toFixed(3);
  // Shade by value: recall 50..100% or MRR 0.1..0.9 maps to 6..56% of the accent colour.
  const shade = (v) => {
    const t = metric === 'recall' ? (v - 50) / 50 : (v - 0.1) / 0.8;
    return (6 + 50 * Math.max(0, Math.min(1, t))).toFixed(1) + '%';
  };

  function show(i) {
    step = i;
    const cur = STEPS[i], prev = i > 0 ? STEPS[i - 1] : null;
    stepButtons.forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
    note.textContent = cur.note;
    cells.forEach(td => {
      const key = td.dataset.cell;
      const v = value(cur.cells[key]);
      td.style.setProperty('--p', shade(v));
      td.querySelector('.rq-val').textContent = format(v);
      td.title = key + ': ' + format(v);
      const d = td.querySelector('.rq-delta');
      d.className = 'rq-delta';
      if (!prev) { d.textContent = ''; return; }
      const diff = v - value(prev.cells[key]);
      const small = metric === 'recall' ? Math.abs(diff) < 0.05 : Math.abs(diff) < 0.0005;
      if (small) { d.textContent = 'no change'; return; }
      d.classList.add(diff > 0 ? 'up' : 'down');
      d.textContent = metric === 'recall' ? Math.abs(diff).toFixed(1) + ' pts' : Math.abs(diff).toFixed(3);
    });
    sums.recall.textContent = cur.all[0].toFixed(1) + '%';
    sums.mrr.textContent = cur.all[1].toFixed(3);
    sums.docs.textContent = cur.all[2].toFixed(1);
  }

  function stop() { clearInterval(timer); timer = 0; playButton.textContent = 'Play'; }
  playButton.addEventListener('click', () => {
    if (timer) { stop(); return; }
    show(0);
    playButton.textContent = 'Pause';
    timer = setInterval(() => {
      if (step >= STEPS.length - 1) { stop(); return; }
      show(step + 1);
    }, reduced ? 3000 : 2200);
  });
  metricButtons.forEach(b => b.addEventListener('click', () => {
    metric = b.dataset.metric;
    metricButtons.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    show(step);
  }));

  root.classList.add('is-live');
  show(step);
})();
</script>
{% endraw %}

Compared with the hybrid-plus-reranker base, the configuration I use for chat finds the right pages more often (85.5% against 83.5%), ranks them about as well (MRR 0.705 against 0.711), and passes on 6 documents instead of 10. The overall gain looks modest because most questions are in English, and English questions had nothing to gain. Swedish and Indonesian questions went from the worst cells to perfect ones, and Polish questions won back what they had lost.

I also checked top-k. Keeping only 5 results cost over 3 points, and keeping 20 added under a point for twice the reading, so 10 stayed.

## What's still open

- **The United States sits at 65% to 69% in every configuration.** It's the simplest cell, English questions against English pages, and nothing on the search side moved it. When no retrieval change moves a number, I'd look at the documents next: whether the answer is missing, buried in a long page, or phrased very differently from how people ask.
- **Measuring each query on its own.** An English-only run and a local-language-only run would show how the work splits between the two translations, cell by cell.

## What I'd tell myself at the start

1. **Map your questions' languages against your knowledge base's languages before tuning anything.** The cells behave differently, and the same setting can help one and hurt another.
2. **Split every result by those cells before trusting it.** My biggest problem showed up as a three-point dip in the average.
3. **Judge the reranker by MRR, and check it per language.** Its overall recall barely moved, while it cost Swedish questions 20 points.
4. **Search in the knowledge base's languages, not the user's.** English plus the country's own language, whatever the question was written in. Don't rely on a stray English word in the query to do that job.
5. **Merge on scores when they share a scale, and keep a threshold.** Use RRF when they don't.
6. **Try new techniques as extra paths, and measure the gain against your best setup.**

## References

1. Robertson, S. and Zaragoza, H. *The Probabilistic Relevance Framework: BM25 and Beyond*. Foundations and Trends in Information Retrieval, 2009. <https://doi.org/10.1561/1500000019>
2. Karpukhin, V. et al. *Dense Passage Retrieval for Open-Domain Question Answering*. EMNLP, 2020. <https://arxiv.org/abs/2004.04906>
3. Nogueira, R. and Cho, K. *Passage Re-ranking with BERT*. arXiv, 2019. <https://arxiv.org/abs/1901.04085>: the cross-encoder reranking idea.
4. Cormack, G. V., Clarke, C. L. A. and Büttcher, S. *Reciprocal Rank Fusion Outperforms Condorcet and Individual Rank Learning Methods*. SIGIR, 2009. <https://doi.org/10.1145/1571941.1572114>
5. Gao, L., Ma, X., Lin, J. and Callan, J. *Precise Zero-Shot Dense Retrieval without Relevance Labels*. ACL, 2023. <https://arxiv.org/abs/2212.10496>: HyDE.
6. Rackauckas, Z. *RAG-Fusion: a New Take on Retrieval-Augmented Generation*. arXiv, 2024. <https://arxiv.org/abs/2402.03367>: multiple generated queries merged with RRF.
7. Thakur, N. et al. *BEIR: A Heterogeneous Benchmark for Zero-shot Evaluation of Information Retrieval Models*. NeurIPS Datasets and Benchmarks, 2021. <https://arxiv.org/abs/2104.08663>
8. Zhang, X. et al. *MIRACL: A Multilingual Retrieval Dataset Covering 18 Diverse Languages*. TACL, 2023. <https://arxiv.org/abs/2210.09984>: a benchmark for retrieval when questions and documents span many languages.
9. Lewis, P. et al. *Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks*. NeurIPS, 2020. <https://arxiv.org/abs/2005.11401>
