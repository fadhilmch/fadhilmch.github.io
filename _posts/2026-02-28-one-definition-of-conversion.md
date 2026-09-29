---
layout: post
title: One definition of conversion
date: 2026-02-28
tags:
- exp
- data
summary: What building a metric semantic layer taught me about teams. The schema was the easy part. Ownership, and making the shared definition easier than a copy, decided whether it got used.
---

Two dashboards show a metric called "conversion" for the same week. The numbers differ. Someone asks which one is right, and the next hour goes on reading two pieces of SQL side by side. By the end nobody has learned anything about the product. The conversation has become a debate about queries.

I designed a metric semantic layer for an experimentation platform that served dozens of product teams: a centralised metadata schema, plus a query engine on BigQuery that computed metrics from it. The catalogue held more than 100 reusable metrics, and every product team's experiments used them. This post is about what that work taught me. Most of it was about people, and the schema was the smaller part.

## What a semantic layer is

A **semantic layer** is a place where the meaning of a metric is written down once, in a form that both people and programs can read. Instead of each dashboard or experiment analysis carrying its own SQL for "conversion", they all refer to one definition, and a query engine turns that definition into the query that runs against the warehouse.

Vendors have plenty to say about this. I'm going to skip the theory and describe the problem it solves.

## How drift happens

Nobody sets out to define a metric wrongly. Drift happens because every team has a reasonable local reason:

- One team counts a conversion when an order is created. Another counts it when the order is paid.
- One divides by all sessions. Another divides by sessions from logged-in users.
- One excludes internal test traffic. Another never got round to it.
- One counts per user per day. Another counts per session.

Each choice is defensible. The trouble is that all of them carry the same name, and a name is what people compare.

<figure class="fig">
<svg viewBox="0 0 680 346" role="img" aria-labelledby="odc1t odc1d">
  <title id="odc1t">Four local definitions of conversion versus one governed definition</title>
  <desc id="odc1d">Illustrative. Four dashboards each compute conversion with their own SQL and show four different numbers: 3.1, 4.8, 2.2 and 5.6 percent. In the governed version, one definition feeds both experiment analysis and reports, which show the same number.</desc>
  <defs><marker id="odc1a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="arrow" d="M0,0 L10,5 L0,10 z"/></marker></defs>
  <text class="h" x="6" y="16">BEFORE · EACH DASHBOARD OWNS A COPY</text>
  <rect class="box" x="6" y="28" width="155" height="76" rx="6" style="stroke:var(--fig-b);stroke-width:2"/>
  <text class="t" x="16" y="48">Dashboard A</text><text class="m" x="16" y="66">orders / sessions</text><text class="tb" x="16" y="90">3.1%</text>
  <rect class="box" x="175" y="28" width="155" height="76" rx="6" style="stroke:var(--fig-b);stroke-width:2"/>
  <text class="t" x="185" y="48">Dashboard B</text><text class="m" x="185" y="66">paid / visitors</text><text class="tb" x="185" y="90">4.8%</text>
  <rect class="box" x="344" y="28" width="155" height="76" rx="6" style="stroke:var(--fig-b);stroke-width:2"/>
  <text class="t" x="354" y="48">Experiment X</text><text class="m" x="354" y="66">orders / logged-in</text><text class="tb" x="354" y="90">2.2%</text>
  <rect class="box" x="513" y="28" width="161" height="76" rx="6" style="stroke:var(--fig-b);stroke-width:2"/>
  <text class="t" x="523" y="48">Weekly report</text><text class="m" x="523" y="66">orders / searches</text><text class="tb" x="523" y="90">5.6%</text>
  <text class="tb" x="340" y="128" text-anchor="middle">same name, four queries, four numbers</text>
  <line class="grid" x1="6" x2="674" y1="146" y2="146"/>
  <text class="h" x="6" y="170">AFTER · ONE DEFINITION, MANY CONSUMERS</text>
  <rect class="box" x="220" y="184" width="240" height="60" rx="6" style="stroke:var(--fig-a);stroke-width:2"/>
  <text class="t" x="234" y="208">conversion, v3</text><text class="m" x="234" y="226">one owner, one definition</text>
  <rect class="box" x="60" y="278" width="200" height="50" rx="6"/>
  <text class="t" x="72" y="299">Experiment analysis</text><text class="ta" x="72" y="317">3.4%</text>
  <rect class="box" x="420" y="278" width="200" height="50" rx="6"/>
  <text class="t" x="432" y="299">Dashboards and reports</text><text class="ta" x="432" y="317">3.4%</text>
  <path class="sa" d="M290,244 L190,276" marker-end="url(#odc1a)"/>
  <path class="sa" d="M390,244 L490,276" marker-end="url(#odc1a)"/>
  <text class="m" x="340" y="272" text-anchor="middle">same number</text>
</svg>
<figcaption>Illustrative numbers, not real data. The four figures above differ only because the queries differ. Once every consumer reads the same definition, the argument about the number disappears and the argument about the product can start.</figcaption>
</figure>

For an experimentation platform this costs more than for a dashboard. An experiment reports the effect of a change on a metric. If the metric can mean different things in different teams, results are not comparable, and a headline like "this change lifted conversion" cannot be checked against the last one.

## What a definition has to say

A definition that both a person and a program can rely on has to answer a few questions explicitly. This is the anatomy I'd expect from any semantic layer:

<figure class="fig">
<svg viewBox="0 0 680 306" role="img" aria-labelledby="odc2t odc2d">
  <title id="odc2t">Anatomy of a metric definition</title>
  <desc id="odc2d">Illustrative example of a metric definition with a name, owner, description, grain, numerator, denominator, filters, and version, each with a note on why the field exists.</desc>
  <rect class="box" x="6" y="8" width="420" height="290" rx="6"/>
  <text class="m" x="20" y="38">name</text><text class="t" x="110" y="38">checkout_conversion</text>
  <text class="m" x="20" y="72">owner</text><text class="t" x="110" y="72">a named team</text>
  <text class="m" x="20" y="106">description</text><text class="t" x="110" y="106">users who complete an order</text>
  <text class="m" x="20" y="140">grain</text><text class="t" x="110" y="140">per user, per day</text>
  <text class="m" x="20" y="174">numerator</text><text class="t" x="110" y="174">users with a paid order</text>
  <text class="m" x="20" y="208">denominator</text><text class="t" x="110" y="208">users with a session</text>
  <text class="m" x="20" y="242">filters</text><text class="t" x="110" y="242">exclude internal traffic</text>
  <text class="m" x="20" y="276">version</text><text class="t" x="110" y="276">3</text>
  <path class="ln" d="M426,72 L448,72"/><text class="ta" x="454" y="76">who answers questions</text>
  <path class="ln" d="M426,140 L448,140"/><text class="ta" x="454" y="144">what one row means</text>
  <path class="ln" d="M426,191 L448,191"/><text class="ta" x="454" y="195">the arithmetic, exactly</text>
  <path class="ln" d="M426,242 L448,242"/><text class="ta" x="454" y="246">what is left out</text>
  <path class="ln" d="M426,276 L448,276"/><text class="ta" x="454" y="280">what changed, and when</text>
</svg>
<figcaption>An illustrative definition, not a real one. Each field exists because leaving it out is how two teams end up with two numbers.</figcaption>
</figure>

- **Name and description** in plain language, so a product manager can tell whether it is the metric they want.
- **Owner**, a person or a team that answers questions and approves changes.
- **Grain**: what one unit of the metric is. Per user, per session and per order give different answers to the same question.
- **Numerator, denominator and filters**: the exact arithmetic, including what is excluded.
- **Version**, so a change is visible and old results stay interpretable.

The schema had to be precise enough for a program to compute from it. That was the job of the query engine: it took a definition and produced the BigQuery query for it, so the same definition gave the same number wherever it was used.

<figure class="fig">
<svg viewBox="0 0 680 190" role="img" aria-labelledby="odc3t odc3d">
  <title id="odc3t">From definition to number</title>
  <desc id="odc3d">Metric definitions are read by a query engine, which generates BigQuery queries. Experiment analysis, dashboards and ad hoc analysis all get their numbers from that one path.</desc>
  <defs><marker id="odc3a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="arrow" d="M0,0 L10,5 L0,10 z"/></marker></defs>
  <rect class="box" x="6" y="62" width="150" height="64" rx="6" style="stroke:var(--fig-a);stroke-width:2"/>
  <text class="t" x="18" y="88">Definitions</text><text class="m" x="18" y="108">the catalogue</text>
  <rect class="box" x="216" y="62" width="150" height="64" rx="6"/>
  <text class="t" x="228" y="88">Query engine</text><text class="m" x="228" y="108">definition to SQL</text>
  <rect class="box" x="426" y="62" width="110" height="64" rx="6"/>
  <text class="t" x="438" y="88">BigQuery</text><text class="m" x="438" y="108">runs it</text>
  <path class="sa" d="M156,94 L214,94" marker-end="url(#odc3a)"/>
  <path class="sa" d="M366,94 L424,94" marker-end="url(#odc3a)"/>
  <path class="ln" d="M536,84 L582,44" marker-end="url(#odc3a)"/>
  <path class="ln" d="M536,94 L582,94" marker-end="url(#odc3a)"/>
  <path class="ln" d="M536,104 L582,144" marker-end="url(#odc3a)"/>
  <text class="t" x="590" y="48">Experiments</text>
  <text class="t" x="590" y="98">Dashboards</text>
  <text class="t" x="590" y="148">Ad hoc work</text>
</svg>
<figcaption>Every consumer gets its number through the same path, so there is no second place for a definition to live.</figcaption>
</figure>

## Ownership matters more than the schema

You can build the schema and engine and still end up with two versions of conversion, one governed and one not. The technical work leaves open the harder question: who decides what "conversion" means?

In my experience the answer has to be a named owner for each metric. Not a committee, and not "the data team" in general. The person who owns a definition can decide when a request to change it is right, and can say no when a team wants a local variant that would fragment the meaning. Without that, the catalogue turns into a list of opinions.

A few practices follow, and they are the ones I'd insist on:

1. **Every metric has an owner in the definition itself.** If you can't say who owns it, don't publish it.
2. **Changes are reviewed and versioned.** A change to a definition changes past comparisons, so it should be visible and deliberate. Old versions stay readable.
3. **Disagreements get resolved in the definition.** If two teams need different things, that usually means two metrics with two names, not one metric with a silent fork.
4. **Deprecation is explicit.** A metric nobody owns any more should be marked so, rather than lingering.

## Adoption is the real test

A catalogue that nobody uses is documentation. What made the difference to me was that the governed definition had to be the *easiest* option, not just the correct one. If a team can write its own SQL in ten minutes but must file a request and wait a week to use a shared metric, the local copy wins every time, and it wins for good reasons.

That pointed the design at a few things. Some of these I did and some are what I'd emphasise now, and I'll keep to the general principle rather than the detail of any one system:

- **Meet people where they already work.** The natural home for a governed metric was the experimentation workflow, because that is where teams pick the metrics an experiment is judged on. If choosing a shared metric is a step in a task people already do, it costs less than writing a query.
- **Cover the metrics people argue about first.** A catalogue with the thirty metrics that cause the most disagreement is worth more than one with three hundred that nobody trusts. The catalogue grew past 100 reusable metrics, and the growth mattered less than whether it contained the ones teams actually reached for.
- **Make search and description good.** People pick the metric they can find and understand. A clear name and a plain description save a lot of local reinvention.
- **Treat requests as a signal.** When a team wants something the catalogue doesn't have, either the catalogue has a gap or an existing metric is described badly. Both are fixable, and both are better than letting the team quietly go its own way.
- **Make the first use painless.** The moment someone tries a governed metric and gets a number they trust is the moment they stop writing their own. Anything that makes that first attempt fail, such as a confusing name or a missing filter, sends them back to local SQL.

Every product team ended up using the catalogue in its experiments. I'd credit that to the definitions being useful and reachable, and I don't think a mandate would have produced the same result. A rule can make people register a metric. Only a metric that saves them work makes them keep using it.

## Ownership needs a process, not just a field

An owner field is a start. What it needs behind it is a path for changing a definition that people can follow without heroics. A common shape looks like this:

1. Someone proposes a change to a definition, with the reason and an example of the difference in the number.
2. The owner reviews it, and any team that depends on the metric is told.
3. The new version is published alongside the old one for a while, so results can be compared across the change.
4. The old version is retired on a date everyone knows.

None of this is complicated. The point is that changing what "conversion" means is a decision that affects other people's results, and the process makes it visible. Otherwise the definition changes silently, and the next dashboard comparison is a debate again.

## What I'd watch for

If I were starting again, I'd check for these early:

- **Over-modelling.** It is easy to design a schema that can express everything, and then nobody can fill it in. Start with what the common metrics need.
- **Definitions without tests.** A definition should be checkable against a known result, so a change to the engine can't silently change a number.
- **Local variants hiding in plain sight.** Watch what people compute outside the layer. It shows you the gaps.
- **Ownership drifting.** People move teams. An owner field that is out of date is worse than none, because it looks like governance.

## What I took from it

The schema and the engine mattered, but a shared definition only becomes a working practice through reuse, and reuse depends on people. Someone has to own each definition, changes have to be visible, and the shared version has to be easier to reach than a copy. Get those right and a dashboard comparison goes back to being a conversation about the product.
