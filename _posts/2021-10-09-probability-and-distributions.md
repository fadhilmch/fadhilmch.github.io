---
layout: post
title: "Probability and distributions, one step at a time"
date: 2021-10-09
math: true
tags:
- exp
- data
summary: "Start with a die and a coin. Learn what probability counts, what a distribution shows, and why a bell curve is an area, not a bar chart."
---

You flip a coin and get heads. You flip again and get heads again. Is the third flip "due" to be tails?

No, if the coin is fair and the flips are independent. The coin doesn't keep a ledger. But that answer is easier to remember when you understand what probability is describing.

<style>
.fig.learn-fig { overflow:visible; }
.fig.learn-fig svg { width:100%; min-width:0; max-width:480px; height:auto; }
.learn-fig text { fill:var(--fg); font:16px 'Geist Mono',monospace; }
.learn-fig .sub { fill:var(--muted); font-size:14px; }
.learn-fig .accent { fill:var(--l0); }
.learn-fig .warm { fill:var(--l3); }
.learn-fig .frame { fill:var(--panel); stroke:var(--line); }
.learn-fig .axis { stroke:var(--muted); fill:none; }
.learn-fig .curve { stroke:var(--l0); stroke-width:2.5; fill:none; }
</style>

## Probability starts with a question

Roll a fair six-sided die. What's the chance of an even number?

**Step 1: list what could happen.** The possible outcomes are 1, 2, 3, 4, 5 and 6. This whole list is the *sample space*.

**Step 2: mark what counts.** For our question, 2, 4 and 6 count. This collection of outcomes is an *event*. An event can contain one outcome or many.

**Step 3: divide, because these outcomes are equally likely.** Three outcomes count out of six:

$$
P(\text{even})=\frac{3}{6}=0.5=50\%
$$

$$P$$ just means "probability of". You can write the same chance as a fraction, a decimal or a percentage. Zero means impossible under the model; one means certain under the model.

<figure class="fig">
<svg style="width:100%;min-width:0;height:auto" viewBox="0 0 600 120" role="img" aria-labelledby="pb-die-title pb-die-desc">
<title id="pb-die-title">Three of six equally likely die outcomes are even</title>
<desc id="pb-die-desc">Six equal boxes labelled one through six. Two, four and six are blue; one, three and five are unfilled. Three of six boxes count.</desc>
<g fill="none" stroke="var(--muted)"><rect x="10" y="10" width="80" height="80" rx="8"/><rect x="210" y="10" width="80" height="80" rx="8"/><rect x="410" y="10" width="80" height="80" rx="8"/></g>
<g fill="var(--l0)" fill-opacity=".18" stroke="var(--l0)"><rect x="110" y="10" width="80" height="80" rx="8"/><rect x="310" y="10" width="80" height="80" rx="8"/><rect x="510" y="10" width="80" height="80" rx="8"/></g>
<g fill="var(--fg)" font-size="30" text-anchor="middle"><text x="50" y="61">1</text><text x="150" y="61">2</text><text x="250" y="61">3</text><text x="350" y="61">4</text><text x="450" y="61">5</text><text x="550" y="61">6</text></g>
<text x="300" y="115" text-anchor="middle" fill="var(--muted)" font-size="16">2, 4 and 6 count: 3 out of 6 = 50%</text>
</svg>
<figcaption>Equal boxes, equal chances. The blue boxes answer our question.</figcaption>
</figure>

The "count then divide" shortcut needs equally likely outcomes. A weighted die might show 6 much more often than 1. We'd need to add the actual probabilities instead of treating every face as one equal vote.

### Chance isn't a promise about the next few tries

**Step 1:** a fair die gives an even number half the time *in the probability model*.

**Step 2:** ten rolls can still give three evens, seven evens, or even no evens. A 50% chance does not force five evens in every ten rolls.

**Step 3:** over many independent repetitions, the observed fraction tends to settle near the model's probability. It can still move up and down along the way. This is the idea behind the *law of large numbers*, not a rule that the next roll must correct the last one.

## "Not", "or" and "and" ask different questions

Keep the die. Let A mean "even" and B mean "greater than 4".

**1. Not A: count what's left.** If half the probability belongs to even numbers, the other half belongs to odd numbers:

$$
P(\text{not }A)=1-P(A)
$$

**2. A or B: don't count the overlap twice.** A contains 2, 4, 6. B contains 5, 6. Together they contain 2, 4, 5, 6, not five distinct outcomes. Six is on both lists.

$$
P(A\text{ or }B)=P(A)+P(B)-P(A\text{ and }B)
$$

Here that's 3/6 + 2/6 - 1/6 = 4/6. In probability, "or" includes the case where both happen.

**3. A and B: count only the overlap.** On one roll, the number must be even *and* greater than 4. Only 6 qualifies, so the chance is 1/6.

Don't automatically multiply probabilities for "and". That shortcut needs independence. These two events on one die aren't independent: knowing it's greater than 4 changes the chance that it's even.


<figure class="fig learn-fig">
<svg viewBox="0 0 420 267" role="img" aria-labelledby="pb-events-t pb-events-d">
<title id="pb-events-t">Or combines; and keeps only overlap</title>
<desc id="pb-events-d">Rows mark the die outcomes for A, B, their union and their intersection. Six is in both A and B, but occurs only once in the union.</desc>
<text x="14" y="25" class="" text-anchor="start">One die roll; two questions</text><text x="14" y="73" class="" text-anchor="start">A: even</text><rect x="145" y="48" width="37" height="37" rx="5" fill="var(--panel)" fill-opacity="1" stroke="var(--line)"/><text x="163.5" y="73" class="" text-anchor="middle">1</text><rect x="189" y="48" width="37" height="37" rx="5" fill="var(--l0)" fill-opacity="0.25" stroke="var(--line)"/><text x="207.5" y="73" class="" text-anchor="middle">2</text><rect x="233" y="48" width="37" height="37" rx="5" fill="var(--panel)" fill-opacity="1" stroke="var(--line)"/><text x="251.5" y="73" class="" text-anchor="middle">3</text><rect x="277" y="48" width="37" height="37" rx="5" fill="var(--l0)" fill-opacity="0.25" stroke="var(--line)"/><text x="295.5" y="73" class="" text-anchor="middle">4</text><rect x="321" y="48" width="37" height="37" rx="5" fill="var(--panel)" fill-opacity="1" stroke="var(--line)"/><text x="339.5" y="73" class="" text-anchor="middle">5</text><rect x="365" y="48" width="37" height="37" rx="5" fill="var(--l0)" fill-opacity="0.25" stroke="var(--line)"/><text x="383.5" y="73" class="" text-anchor="middle">6</text><text x="14" y="126" class="" text-anchor="start">B: > 4</text><rect x="145" y="101" width="37" height="37" rx="5" fill="var(--panel)" fill-opacity="1" stroke="var(--line)"/><text x="163.5" y="126" class="" text-anchor="middle">1</text><rect x="189" y="101" width="37" height="37" rx="5" fill="var(--panel)" fill-opacity="1" stroke="var(--line)"/><text x="207.5" y="126" class="" text-anchor="middle">2</text><rect x="233" y="101" width="37" height="37" rx="5" fill="var(--panel)" fill-opacity="1" stroke="var(--line)"/><text x="251.5" y="126" class="" text-anchor="middle">3</text><rect x="277" y="101" width="37" height="37" rx="5" fill="var(--panel)" fill-opacity="1" stroke="var(--line)"/><text x="295.5" y="126" class="" text-anchor="middle">4</text><rect x="321" y="101" width="37" height="37" rx="5" fill="var(--l3)" fill-opacity="0.25" stroke="var(--line)"/><text x="339.5" y="126" class="" text-anchor="middle">5</text><rect x="365" y="101" width="37" height="37" rx="5" fill="var(--l3)" fill-opacity="0.25" stroke="var(--line)"/><text x="383.5" y="126" class="" text-anchor="middle">6</text><text x="14" y="179" class="" text-anchor="start">A or B</text><rect x="145" y="154" width="37" height="37" rx="5" fill="var(--panel)" fill-opacity="1" stroke="var(--line)"/><text x="163.5" y="179" class="" text-anchor="middle">1</text><rect x="189" y="154" width="37" height="37" rx="5" fill="var(--l0)" fill-opacity="0.25" stroke="var(--line)"/><text x="207.5" y="179" class="" text-anchor="middle">2</text><rect x="233" y="154" width="37" height="37" rx="5" fill="var(--panel)" fill-opacity="1" stroke="var(--line)"/><text x="251.5" y="179" class="" text-anchor="middle">3</text><rect x="277" y="154" width="37" height="37" rx="5" fill="var(--l0)" fill-opacity="0.25" stroke="var(--line)"/><text x="295.5" y="179" class="" text-anchor="middle">4</text><rect x="321" y="154" width="37" height="37" rx="5" fill="var(--l0)" fill-opacity="0.25" stroke="var(--line)"/><text x="339.5" y="179" class="" text-anchor="middle">5</text><rect x="365" y="154" width="37" height="37" rx="5" fill="var(--l0)" fill-opacity="0.25" stroke="var(--line)"/><text x="383.5" y="179" class="" text-anchor="middle">6</text><text x="14" y="232" class="" text-anchor="start">A and B</text><rect x="145" y="207" width="37" height="37" rx="5" fill="var(--panel)" fill-opacity="1" stroke="var(--line)"/><text x="163.5" y="232" class="" text-anchor="middle">1</text><rect x="189" y="207" width="37" height="37" rx="5" fill="var(--panel)" fill-opacity="1" stroke="var(--line)"/><text x="207.5" y="232" class="" text-anchor="middle">2</text><rect x="233" y="207" width="37" height="37" rx="5" fill="var(--panel)" fill-opacity="1" stroke="var(--line)"/><text x="251.5" y="232" class="" text-anchor="middle">3</text><rect x="277" y="207" width="37" height="37" rx="5" fill="var(--panel)" fill-opacity="1" stroke="var(--line)"/><text x="295.5" y="232" class="" text-anchor="middle">4</text><rect x="321" y="207" width="37" height="37" rx="5" fill="var(--panel)" fill-opacity="1" stroke="var(--line)"/><text x="339.5" y="232" class="" text-anchor="middle">5</text><rect x="365" y="207" width="37" height="37" rx="5" fill="var(--l3)" fill-opacity="0.25" stroke="var(--line)"/><text x="383.5" y="232" class="" text-anchor="middle">6</text>
</svg>
<figcaption>Read down the same six outcomes. "Or" keeps 2, 4, 5 and 6. "And" keeps only 6. An outlined box is not included; a coloured box is included.</figcaption>
</figure>

## "Given" means you're looking at a smaller world

Someone rolls the die behind a screen and tells you the result is greater than 4. What's the chance it's even now?

**Step 1: remove the outcomes ruled out by the information.** Only 5 and 6 remain.

**Step 2: count within that smaller list.** One of these two outcomes is even. The answer is 1/2, not the earlier overlap probability of 1/6.

**Step 3: read the formula as the same shrinking operation.**

$$
P(A\mid B)=\frac{P(A\text{ and }B)}{P(B)}
$$

The vertical bar reads **"given"**. Divide the overlap by the probability of the condition: (1/6)/(2/6) = 1/2. This formula needs $$P(B)>0$$.

Conditional probability changes which outcomes you're considering. It doesn't travel backward and change the roll. And $$P(A\mid B)$$ need not equal $$P(B\mid A)$$: given even, the chance of greater than 4 is 1/3, because 2, 4 and 6 are the remaining options.


<figure class="fig learn-fig">
<svg viewBox="0 0 420 300" role="img" aria-labelledby="pb-given-t pb-given-d">
<title id="pb-given-t">Conditioning shrinks the sample space</title>
<desc id="pb-given-d">Without information, 3 of 6 outcomes are even. Given greater than 4, only 5 and 6 remain, so 1 of 2 is even.</desc>
<text x="16" y="27" class="" text-anchor="start">New information changes the denominator</text><rect x="14" y="50" width="58" height="52" rx="5" fill="var(--panel)" fill-opacity="1" stroke="var(--line)"/><text x="43" y="82" class="" text-anchor="middle">1</text><rect x="80" y="50" width="58" height="52" rx="5" fill="var(--l0)" fill-opacity="0.2" stroke="var(--line)"/><text x="109" y="82" class="" text-anchor="middle">2</text><rect x="146" y="50" width="58" height="52" rx="5" fill="var(--panel)" fill-opacity="1" stroke="var(--line)"/><text x="175" y="82" class="" text-anchor="middle">3</text><rect x="212" y="50" width="58" height="52" rx="5" fill="var(--l0)" fill-opacity="0.2" stroke="var(--line)"/><text x="241" y="82" class="" text-anchor="middle">4</text><rect x="278" y="50" width="58" height="52" rx="5" fill="var(--panel)" fill-opacity="1" stroke="var(--line)"/><text x="307" y="82" class="" text-anchor="middle">5</text><rect x="344" y="50" width="58" height="52" rx="5" fill="var(--l0)" fill-opacity="0.2" stroke="var(--line)"/><text x="373" y="82" class="" text-anchor="middle">6</text><text x="210" y="131" class="" text-anchor="middle">Before: 3 even out of 6 = 1/2</text><text x="210" y="174" class="sub" text-anchor="middle">Given greater than 4: keep only 5, 6</text><rect x="128" y="193" width="74" height="56" rx="5" fill="var(--panel)" fill-opacity="1" stroke="var(--line)"/><text x="165" y="227" class="" text-anchor="middle">5</text><rect x="218" y="193" width="74" height="56" rx="5" fill="var(--l0)" fill-opacity="0.2" stroke="var(--line)"/><text x="255" y="227" class="" text-anchor="middle">6</text><text x="210" y="280" class="" text-anchor="middle">After: 1 even out of 2 = 1/2</text>
</svg>
<figcaption>The answer happens to stay 1/2 here, but the list changed. Reverse the condition: given even, only 2, 4 and 6 remain, and just 6 is greater than 4 (1/3).</figcaption>
</figure>

### Independence is a separate assumption

For independent events, learning B doesn't change the probability of A:

$$
P(A\mid B)=P(A)
$$

Then the chance of both is:

$$
P(A\text{ and }B)=P(A)P(B)
$$

Two independent fair coin flips both landing heads have chance 0.5 x 0.5 = 0.25. After one head, the next is still 50% heads. A streak doesn't make tails due.

Real data aren't automatically independent. Two visits by one user or two people in the same household may be related. Independence is something to justify, not something the multiplication sign grants you.

## A distribution is the whole picture, not one answer

We've asked about one event at a time. A **probability distribution** describes all possible values of a number and how probability is spread across them.

**Step 1: choose the number to record.** Flip a coin four times and record the number of heads. Call that number $$X$$, a **random variable**: a number whose value depends on an uncertain outcome.

**Step 2: list its possible values.** X can be 0, 1, 2, 3 or 4. Those five counts are not equally likely, even though the 16 sequences of four fair flips are.

**Step 3: count sequences for each value.** There is 1 way to get 0 heads, 4 to get 1, 6 to get 2, 4 to get 3 and 1 to get 4. The probabilities are those counts divided by 16. They add to 1 because something on the list must happen.

This is the bridge from "a heads count" to "a distribution of heads counts". The tallest bar marks a common count, not a result you're guaranteed to get.


<figure class="fig learn-fig">
<svg viewBox="0 0 420 305" role="img" aria-labelledby="pb-sequences-t pb-sequences-d">
<title id="pb-sequences-t">Sequences group into heads counts</title>
<desc id="pb-sequences-d">All sixteen equally likely sequences of four fair coin flips grouped into 0, 1, 2, 3 and 4 heads, with counts 1, 4, 6, 4 and 1.</desc>
<text x="14" y="25" class="" text-anchor="start">16 equal sequences → 5 unequal counts</text><text x="46" y="61" class="" text-anchor="middle">0 heads</text><rect x="8" y="78" width="76" height="25" rx="5" fill="var(--l0)" fill-opacity="0.15" stroke="var(--line)"/><text x="46" y="96" class="sub" text-anchor="middle">TTTT</text><text x="46" y="286" class="" text-anchor="middle">1/16</text><text x="128" y="61" class="" text-anchor="middle">1 heads</text><rect x="90" y="78" width="76" height="25" rx="5" fill="var(--l0)" fill-opacity="0.15" stroke="var(--line)"/><text x="128" y="96" class="sub" text-anchor="middle">TTTH</text><rect x="90" y="108" width="76" height="25" rx="5" fill="var(--l0)" fill-opacity="0.15" stroke="var(--line)"/><text x="128" y="126" class="sub" text-anchor="middle">TTHT</text><rect x="90" y="138" width="76" height="25" rx="5" fill="var(--l0)" fill-opacity="0.15" stroke="var(--line)"/><text x="128" y="156" class="sub" text-anchor="middle">THTT</text><rect x="90" y="168" width="76" height="25" rx="5" fill="var(--l0)" fill-opacity="0.15" stroke="var(--line)"/><text x="128" y="186" class="sub" text-anchor="middle">HTTT</text><text x="128" y="286" class="" text-anchor="middle">4/16</text><text x="210" y="61" class="" text-anchor="middle">2 heads</text><rect x="172" y="78" width="76" height="25" rx="5" fill="var(--l0)" fill-opacity="0.15" stroke="var(--line)"/><text x="210" y="96" class="sub" text-anchor="middle">TTHH</text><rect x="172" y="108" width="76" height="25" rx="5" fill="var(--l0)" fill-opacity="0.15" stroke="var(--line)"/><text x="210" y="126" class="sub" text-anchor="middle">THTH</text><rect x="172" y="138" width="76" height="25" rx="5" fill="var(--l0)" fill-opacity="0.15" stroke="var(--line)"/><text x="210" y="156" class="sub" text-anchor="middle">THHT</text><rect x="172" y="168" width="76" height="25" rx="5" fill="var(--l0)" fill-opacity="0.15" stroke="var(--line)"/><text x="210" y="186" class="sub" text-anchor="middle">HTTH</text><rect x="172" y="198" width="76" height="25" rx="5" fill="var(--l0)" fill-opacity="0.15" stroke="var(--line)"/><text x="210" y="216" class="sub" text-anchor="middle">HTHT</text><rect x="172" y="228" width="76" height="25" rx="5" fill="var(--l0)" fill-opacity="0.15" stroke="var(--line)"/><text x="210" y="246" class="sub" text-anchor="middle">HHTT</text><text x="210" y="286" class="" text-anchor="middle">6/16</text><text x="292" y="61" class="" text-anchor="middle">3 heads</text><rect x="254" y="78" width="76" height="25" rx="5" fill="var(--l0)" fill-opacity="0.15" stroke="var(--line)"/><text x="292" y="96" class="sub" text-anchor="middle">THHH</text><rect x="254" y="108" width="76" height="25" rx="5" fill="var(--l0)" fill-opacity="0.15" stroke="var(--line)"/><text x="292" y="126" class="sub" text-anchor="middle">HTHH</text><rect x="254" y="138" width="76" height="25" rx="5" fill="var(--l0)" fill-opacity="0.15" stroke="var(--line)"/><text x="292" y="156" class="sub" text-anchor="middle">HHTH</text><rect x="254" y="168" width="76" height="25" rx="5" fill="var(--l0)" fill-opacity="0.15" stroke="var(--line)"/><text x="292" y="186" class="sub" text-anchor="middle">HHHT</text><text x="292" y="286" class="" text-anchor="middle">4/16</text><text x="374" y="61" class="" text-anchor="middle">4 heads</text><rect x="336" y="78" width="76" height="25" rx="5" fill="var(--l0)" fill-opacity="0.15" stroke="var(--line)"/><text x="374" y="96" class="sub" text-anchor="middle">HHHH</text><text x="374" y="286" class="" text-anchor="middle">1/16</text>
</svg>
<figcaption>Every tile has chance 1/16. Six tiles give 2 heads, so that count has chance 6/16. Count the tiles, not just the five columns.</figcaption>
</figure>

## One yes/no trial: Bernoulli

Call heads a *success* and tails a *failure*. These are just labels; "success" can mean a broken part or a failed payment if that's the event you want to count.

**Step 1:** record a success as 1 and a failure as 0.

**Step 2:** give success probability q, so failure has probability 1 - q.

$$
P(X=1)=q,\qquad P(X=0)=1-q
$$

That's a **Bernoulli distribution**: two values and two probabilities. For a fair coin, q = 0.5. For a conversion model, q might be 0.10. The letter q here is just an event probability.

## Many independent yes/no trials: binomial

Count successes in n trials, with the same success probability q on every trial and independent trials. The count follows a **binomial distribution**.

**Step 1: understand one sequence.** For four fair flips, HHTT has probability $$0.5^4=1/16$$. Multiply one probability for each flip.

**Step 2: count sequences with the same number of heads.** Two heads can occupy the four positions in six ways. The symbol $$\binom{4}{2}$$, "4 choose 2", counts them.

**Step 3: multiply the chance of a sequence by the number of sequences.** In general:

$$
P(X=k)=\binom{n}{k}q^k(1-q)^{n-k}
$$

Read it in three pieces:

1. $$\binom{n}{k}$$ counts ways to place k successes among n trials.
2. $$q^k$$ multiplies the success probability k times.
3. $$(1-q)^{n-k}$$ multiplies the failure probability for the remaining trials.

For our four fair flips and two heads: 6 x 0.5² x 0.5² = 6/16 = **37.5%**. For a biased coin, the sequences no longer all have the same chance, but sequences with the same heads count still share the same product under this model.

<style>
.pb-widget { margin:32px 0; padding:20px; border:1px solid var(--line); border-radius:8px; background:var(--panel); }
.pb-widget[hidden] { display:none; }
.prose .pb-widget h3 { margin:0 0 10px; }
.pb-controls { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; margin:20px 0; }
.pb-controls label { font-size:14px; }
.pb-widget input { display:block; width:100%; min-width:0; min-height:44px; accent-color:var(--l0); }
.pb-widget button { min-height:44px; padding:8px 12px; color:var(--fg); background:var(--bg); border:1px solid var(--line); border-radius:4px; font:inherit; cursor:pointer; }
.pb-widget :focus-visible { outline:2px solid var(--l0); outline-offset:3px; }
.pb-widget svg { width:100%; height:auto; display:block; }
.pb-result { border-top:1px solid var(--line); padding-top:12px; overflow-wrap:anywhere; font-family:'Geist Mono',monospace; font-size:14px; }
.pb-note { font-size:14px; color:var(--muted); }
@media(max-width:480px) { .pb-widget { padding:14px; } .pb-controls { grid-template-columns:1fr; gap:10px; } }
</style>
<section id="pb-binomial" class="pb-widget" aria-labelledby="pb-binomial-title" hidden>
<h3 id="pb-binomial-title">Try it: build a heads-count distribution</h3>
<p>Blue bars are exact model probabilities. Orange dots are the fraction observed in your simulated batches. The dots won't match the bars perfectly after a few batches.</p>
<div class="pb-controls">
<label for="pb-n">Flips per batch: <output id="pb-n-value">4</output><input id="pb-n" type="range" min="1" max="20" step="1" value="4"></label>
<label for="pb-q">Chance of heads on each flip: <output id="pb-q-value">50%</output><input id="pb-q" type="range" min="0" max="100" step="5" value="50"></label>
</div>
<svg id="pb-binomial-chart" viewBox="0 0 600 280" role="img" aria-labelledby="pb-bin-chart-title pb-bin-chart-desc"><title id="pb-bin-chart-title">Exact binomial probabilities and simulated frequencies</title><desc id="pb-bin-chart-desc"></desc></svg>
<button id="pb-sim-one" type="button">Simulate 1 batch</button> <button id="pb-sim-many" type="button">Simulate 100 batches</button> <button id="pb-reset" type="button">Reset simulations</button>
<p id="pb-binomial-result" class="pb-result" role="status" aria-live="polite" aria-atomic="true"></p>
<ol><li>Leave 4 flips and 50% heads. The bar for 2 heads is 37.5%, not 20%. Five possible counts does not mean five equal chances.</li><li>Simulate one batch, then 100. The dots tend toward the bars as batches accumulate, but they still fluctuate.</li><li>Change to 10 flips and 70% heads. The distribution moves right: the expected count becomes 7.</li><li>Set heads chance to 100%. Only the all-heads count remains possible. At 0%, only zero heads remains.</li></ol>
<p class="pb-note">Every batch uses independent flips with the chosen fixed probability. Changing either slider resets simulations so you don't mix different models. Blue bars always sum to 100%; the chart rescales its height to keep them readable.</p>
</section>
<noscript><p>Without JavaScript, the four-flip example above still gives the exact probabilities: 1, 4, 6, 4 and 1 divided by 16.</p></noscript>

### Centre and spread describe different things

**Step 1: find the long-run average count.** A binomial count has expected value:

$$
E[X]=nq
$$

$$E[X]$$ means the average over many repetitions. Ten fair flips give an expected count of 5. Ten flips with q = 0.7 give 7. This average is not a prediction that each run will equal it.

**Step 2: describe the wobble around that average.** The variance is $$nq(1-q)$$. Its square root is the **standard deviation**:

$$
SD(X)=\sqrt{nq(1-q)}
$$

Standard deviation is a measure of spread in heads-count units. It is not the biggest possible deviation or a hard boundary. For ten fair flips it's about 1.58 heads.

**Step 3: distinguish counts from rates.** More flips usually make the *count* spread wider, but make the *fraction* of heads more stable. Fifty heads out of 100 and five out of ten both give 50%, yet the larger sample's fraction tends to wobble less. This matters when we compare conversion rates later.

## Continuous values: probability is area

Counts come in separate steps: 0, 1, 2 heads. Other models describe values along a continuous scale, such as an idealised measurement of height or time.

**Step 1: replace bars with a density curve.** A discrete bar's height can be a probability. A continuous curve's height is **density**, not probability.

**Step 2: choose an interval.** Probability is the area under the curve between its ends. The whole area is 1. A very narrow interval usually has little area even if the curve is tall there.

**Step 3: don't ask the curve for the probability of one exact point.** In a continuous model, the area at a single point is zero. A recorded measurement like "170.0 cm" usually represents a rounding interval, not infinitely precise knowledge.

A **continuous uniform distribution** is the simplest example: a flat density between a and b. Equal-length intervals have equal chances. Its height is $$1/(b-a)$$ so the rectangle's total area is 1. A uniform model from 0 to 10 gives a 20% chance between 2 and 4: width 2 times height 0.1.

Uniform is a model, not a claim that every real measurement is equally likely. Our fair die was a *discrete* uniform example: six separate outcomes, each with probability 1/6.


<figure class="fig learn-fig">
<svg viewBox="0 0 420 435" role="img" aria-labelledby="pb-mass-area-t pb-mass-area-d">
<title id="pb-mass-area-t">Discrete mass versus continuous area</title>
<desc id="pb-mass-area-d">Top: exact probabilities for heads in four fair flips. Bottom: normal density with the interval within one standard deviation shaded, about 68.3 percent probability.</desc>
<text x="14" y="24" class="" text-anchor="start">Discrete: probability belongs to a bar</text><rect x="50" y="134.9375" width="40" height="9.0625" rx="5" fill="var(--l0)" fill-opacity="0.6" stroke="var(--line)"/><text x="70" y="167" class="" text-anchor="middle">0</text><rect x="116" y="107.75" width="40" height="36.25" rx="5" fill="var(--l0)" fill-opacity="0.6" stroke="var(--line)"/><text x="136" y="167" class="" text-anchor="middle">1</text><rect x="182" y="89.625" width="40" height="54.375" rx="5" fill="var(--l0)" fill-opacity="0.6" stroke="var(--line)"/><text x="202" y="167" class="" text-anchor="middle">2</text><rect x="248" y="107.75" width="40" height="36.25" rx="5" fill="var(--l0)" fill-opacity="0.6" stroke="var(--line)"/><text x="268" y="167" class="" text-anchor="middle">3</text><rect x="314" y="134.9375" width="40" height="9.0625" rx="5" fill="var(--l0)" fill-opacity="0.6" stroke="var(--line)"/><text x="334" y="167" class="" text-anchor="middle">4</text><text x="210" y="192" class="sub" text-anchor="middle">Heads in 4 fair flips</text><text x="14" y="232" class="" text-anchor="start">Continuous: probability is area</text><path d="M30,359.27 L32,359.19 L34,359.10 L36,359.00 L38,358.89 L40,358.77 L42,358.64 L44,358.50 L46,358.35 L48,358.18 L50,358.00 L52,357.80 L54,357.58 L56,357.35 L58,357.10 L60,356.82 L62,356.53 L64,356.21 L66,355.87 L68,355.51 L70,355.11 L72,354.69 L74,354.24 L76,353.76 L78,353.25 L80,352.70 L82,352.12 L84,351.50 L86,350.84 L88,350.15 L90,349.41 L92,348.64 L94,347.82 L96,346.96 L98,346.05 L100,345.10 L102,344.10 L104,343.06 L106,341.97 L108,340.83 L110,339.64 L112,338.41 L114,337.13 L116,335.80 L118,334.42 L120,333.00 L122,331.53 L124,330.02 L126,328.47 L128,326.87 L130,325.24 L132,323.57 L134,321.86 L136,320.12 L138,318.35 L140,316.55 L142,314.74 L144,312.90 L146,311.04 L148,309.17 L150,307.29 L152,305.41 L154,303.53 L156,301.65 L158,299.79 L160,297.93 L162,296.10 L164,294.29 L166,292.50 L168,290.76 L170,289.05 L172,287.38 L174,285.77 L176,284.21 L178,282.71 L180,281.27 L182,279.90 L184,278.60 L186,277.38 L188,276.25 L190,275.19 L192,274.23 L194,273.36 L196,272.58 L198,271.91 L200,271.33 L202,270.85 L204,270.48 L206,270.21 L208,270.05 L210,270.00 L212,270.05 L214,270.21 L216,270.48 L218,270.85 L220,271.33 L222,271.91 L224,272.58 L226,273.36 L228,274.23 L230,275.19 L232,276.25 L234,277.38 L236,278.60 L238,279.90 L240,281.27 L242,282.71 L244,284.21 L246,285.77 L248,287.38 L250,289.05 L252,290.76 L254,292.50 L256,294.29 L258,296.10 L260,297.93 L262,299.79 L264,301.65 L266,303.53 L268,305.41 L270,307.29 L272,309.17 L274,311.04 L276,312.90 L278,314.74 L280,316.55 L282,318.35 L284,320.12 L286,321.86 L288,323.57 L290,325.24 L292,326.87 L294,328.47 L296,330.02 L298,331.53 L300,333.00 L302,334.42 L304,335.80 L306,337.13 L308,338.41 L310,339.64 L312,340.83 L314,341.97 L316,343.06 L318,344.10 L320,345.10 L322,346.05 L324,346.96 L326,347.82 L328,348.64 L330,349.41 L332,350.15 L334,350.84 L336,351.50 L338,352.12 L340,352.70 L342,353.25 L344,353.76 L346,354.24 L348,354.69 L350,355.11 L352,355.51 L354,355.87 L356,356.21 L358,356.53 L360,356.82 L362,357.10 L364,357.35 L366,357.58 L368,357.80 L370,358.00 L372,358.18 L374,358.35 L376,358.50 L378,358.64 L380,358.77 L382,358.89 L384,359.00 L386,359.10 L388,359.19 L390,359.27" class="curve"/><path d="M152,360 L152,305.41 L154,303.53 L156,301.65 L158,299.79 L160,297.93 L162,296.10 L164,294.29 L166,292.50 L168,290.76 L170,289.05 L172,287.38 L174,285.77 L176,284.21 L178,282.71 L180,281.27 L182,279.90 L184,278.60 L186,277.38 L188,276.25 L190,275.19 L192,274.23 L194,273.36 L196,272.58 L198,271.91 L200,271.33 L202,270.85 L204,270.48 L206,270.21 L208,270.05 L210,270.00 L212,270.05 L214,270.21 L216,270.48 L218,270.85 L220,271.33 L222,271.91 L224,272.58 L226,273.36 L228,274.23 L230,275.19 L232,276.25 L234,277.38 L236,278.60 L238,279.90 L240,281.27 L242,282.71 L244,284.21 L246,285.77 L248,287.38 L250,289.05 L252,290.76 L254,292.50 L256,294.29 L258,296.10 L260,297.93 L262,299.79 L264,301.65 L266,303.53 L268,305.41 L268,360 Z" fill="var(--l0)" fill-opacity=".25"/><path d="M30,360 H390" class="axis"/><text x="152" y="385" class="" text-anchor="middle">-1σ</text><text x="210" y="385" class="" text-anchor="middle">μ</text><text x="268" y="385" class="" text-anchor="middle">+1σ</text><text x="210" y="415" class="" text-anchor="middle">Shaded area ≈ 68.3%</text>
</svg>
<figcaption>Separate bars carry separate probabilities. For the bell curve, add the area across an interval; the height at one point is a density, not its probability.</figcaption>
</figure>

## The normal distribution: a bell with two settings

A **normal distribution** is a continuous bell-shaped model. Values near its centre are more common; values far away are less common. Not all data are normal: revenue, waiting times and counts can look very different.

**Step 1: locate the centre.** The mean, $$\mu$$ ("mu"), moves the bell left or right.

**Step 2: choose the spread.** The standard deviation, $$\sigma$$ ("sigma"), stretches or narrows it. Sigma must be positive. A wider bell is lower because its total area is still 1.

**Step 3: describe a location relative to those settings.**

$$
z=\frac{x-\mu}{\sigma}
$$

Take a value x, subtract the centre, then divide by the spread. If mu = 0 and sigma = 1, x = 2 has z = 2: two standard deviations above the centre. This is **standardising**. It changes the units; it doesn't make non-normal data normal.

For a normal model, about 68% of the area lies within one standard deviation of the mean, and about 95% within two. These are properties of this model, not guaranteed rules for every dataset.

<section id="pb-normal" class="pb-widget" aria-labelledby="pb-normal-title" hidden>
<h3 id="pb-normal-title">Try it: change the bell, count the area</h3>
<p>Blue is the normal density curve. The shaded area is the probability of a value falling inside your chosen interval. Vertical markers show the interval ends; the dashed line shows the mean.</p>
<div class="pb-controls">
<label for="pb-mu">Mean (centre): <output id="pb-mu-value">0</output><input id="pb-mu" type="range" min="-3" max="3" step="0.5" value="0"></label>
<label for="pb-sigma">Standard deviation (spread): <output id="pb-sigma-value">1</output><input id="pb-sigma" type="range" min="0.5" max="2" step="0.25" value="1"></label>
<label for="pb-lo">Interval left end: <output id="pb-lo-value">-1</output><input id="pb-lo" type="range" min="-6" max="6" step="0.25" value="-1"></label>
<label for="pb-hi">Interval right end: <output id="pb-hi-value">1</output><input id="pb-hi" type="range" min="-6" max="6" step="0.25" value="1"></label>
</div>
<svg id="pb-normal-chart" viewBox="0 0 600 280" role="img" aria-labelledby="pb-normal-chart-title pb-normal-chart-desc"><title id="pb-normal-chart-title">A normal density with a shaded interval</title><desc id="pb-normal-chart-desc"></desc></svg>
<button id="pb-normal-reset" type="button">Reset to standard normal</button>
<p id="pb-normal-result" class="pb-result" role="status" aria-live="polite" aria-atomic="true"></p>
<ol><li>At mean 0 and spread 1, the interval -1 to 1 contains about 68.3% of the area.</li><li>Change the ends to -2 and 2. The area grows to about 95.4%.</li><li>Reset, then increase spread to 2 without changing the interval. The curve widens and lowers; -1 to 1 now contains only about 38.3%.</li><li>Reset, then move both ends to 1. The interval has zero width, so its area is zero even though the density there is positive.</li><li>Move the mean while keeping the interval fixed. The probability changes because the bell moves relative to your interval.</li></ol>
<p class="pb-note">This is a chosen normal model, not a fit to real data. Density is per x-unit, not a percentage. The plot covers at least four standard deviations on either side of the mean and includes your interval; negligible far-tail area lies outside it. Interval probabilities use a numerical normal-CDF approximation. If the ends cross, they are automatically put in order.</p>
</section>
<noscript><p>For a standard normal model, the area from -1 to 1 is about 68.3%; from -2 to 2 it is about 95.4%.</p></noscript>

### The density formula draws the same bell

You don't need this formula to read the widget. It's here so the picture and symbols can meet:

$$
f(x)=\frac{1}{\sigma\sqrt{2\pi}}e^{-\frac12\left(\frac{x-\mu}{\sigma}\right)^2}
$$

1. $$f(x)$$ is the curve height at x: density, not the chance of exactly x.
2. The fraction at the front keeps total area equal to 1 when sigma changes.
3. Inside the exponent is the squared standardised distance from the mean. Farther away gives a smaller height. $$e$$ and $$\pi$$ are mathematical constants used to draw this curve.

To get probability, we add up area instead of reading height. The symbol $$\Phi(z)$$ ("Phi") names the area to the left of z on the **standard normal** curve, whose mean is 0 and standard deviation is 1.

$$
P(a\leq X\leq b)=\Phi\left(\frac{b-\mu}{\sigma}\right)-\Phi\left(\frac{a-\mu}{\sigma}\right)
$$

First find the area left of b, then subtract the area left of a. What remains is the interval between them, exactly the region shaded in the widget.

## Why bell curves appear so often

The measurements themselves don't have to look like a bell for an average to have an approximately bell-shaped **sampling distribution**.

**Step 1:** imagine repeatedly taking a fresh sample of n independent observations from the same population.

**Step 2:** calculate the average of each sample. Now picture the distribution of those averages, not the distribution of individual observations.

**Step 3:** with a finite population variance and suitable sampling conditions, this distribution becomes approximately normal as n grows. That's the **central limit theorem**. There is no universal sample size that makes it accurate for every population.

If individual observations have standard deviation sigma, the sample average has standard error:

$$
SE(\bar X)=\frac{\sigma}{\sqrt n}
$$

$$\bar X$$ means the sample average. **Standard deviation** describes individual observations; **standard error** describes how an estimate wobbles across samples. More independent data reduce that wobble. In practice we usually estimate sigma from the sample.

For coin flips encoded as 0 or 1, the average is the fraction of heads. So a large number of flips can use the bell curve as a shortcut instead of adding up many exact bars. This shortcut is the normal approximation, and it only gets better as n grows.


<figure class="fig learn-fig">
<svg viewBox="0 0 420 730" role="img" aria-labelledby="pb-averages-t pb-averages-d">
<title id="pb-averages-t">Averages wobble less than individual values</title>
<desc id="pb-averages-d">Three normal density curves on the same horizontal scale. The individual standard deviation is sigma. Averages of 4 and 16 independent observations have spread sigma/2 and sigma/4.</desc>
<text x="14" y="25" class="" text-anchor="start">Same population; less wobble</text><text x="14" y="50" class="" text-anchor="start">Individual observations</text><path d="M30,189.30 L32,189.24 L34,189.17 L36,189.10 L38,189.02 L40,188.94 L42,188.85 L44,188.75 L46,188.65 L48,188.54 L50,188.43 L52,188.31 L54,188.18 L56,188.04 L58,187.89 L60,187.73 L62,187.57 L64,187.39 L66,187.21 L68,187.01 L70,186.80 L72,186.59 L74,186.36 L76,186.12 L78,185.87 L80,185.60 L82,185.32 L84,185.03 L86,184.73 L88,184.42 L90,184.09 L92,183.74 L94,183.39 L96,183.02 L98,182.63 L100,182.24 L102,181.83 L104,181.40 L106,180.96 L108,180.51 L110,180.05 L112,179.57 L114,179.08 L116,178.58 L118,178.06 L120,177.54 L122,177.00 L124,176.46 L126,175.90 L128,175.33 L130,174.76 L132,174.18 L134,173.59 L136,173.00 L138,172.40 L140,171.80 L142,171.20 L144,170.59 L146,169.98 L148,169.38 L150,168.77 L152,168.17 L154,167.58 L156,166.98 L158,166.40 L160,165.82 L162,165.26 L164,164.70 L166,164.15 L168,163.62 L170,163.11 L172,162.61 L174,162.12 L176,161.66 L178,161.21 L180,160.78 L182,160.38 L184,160.00 L186,159.64 L188,159.31 L190,159.00 L192,158.72 L194,158.47 L196,158.25 L198,158.05 L200,157.88 L202,157.75 L204,157.64 L206,157.56 L208,157.52 L210,157.50 L212,157.52 L214,157.56 L216,157.64 L218,157.75 L220,157.88 L222,158.05 L224,158.25 L226,158.47 L228,158.72 L230,159.00 L232,159.31 L234,159.64 L236,160.00 L238,160.38 L240,160.78 L242,161.21 L244,161.66 L246,162.12 L248,162.61 L250,163.11 L252,163.62 L254,164.15 L256,164.70 L258,165.26 L260,165.82 L262,166.40 L264,166.98 L266,167.58 L268,168.17 L270,168.77 L272,169.38 L274,169.98 L276,170.59 L278,171.20 L280,171.80 L282,172.40 L284,173.00 L286,173.59 L288,174.18 L290,174.76 L292,175.33 L294,175.90 L296,176.46 L298,177.00 L300,177.54 L302,178.06 L304,178.58 L306,179.08 L308,179.57 L310,180.05 L312,180.51 L314,180.96 L316,181.40 L318,181.83 L320,182.24 L322,182.63 L324,183.02 L326,183.39 L328,183.74 L330,184.09 L332,184.42 L334,184.73 L336,185.03 L338,185.32 L340,185.60 L342,185.87 L344,186.12 L346,186.36 L348,186.59 L350,186.80 L352,187.01 L354,187.21 L356,187.39 L358,187.57 L360,187.73 L362,187.89 L364,188.04 L366,188.18 L368,188.31 L370,188.43 L372,188.54 L374,188.65 L376,188.75 L378,188.85 L380,188.94 L382,189.02 L384,189.10 L386,189.17 L388,189.24 L390,189.30" class="curve"/><path d="M30,190 H390" class="axis"/><text x="210" y="214" class="sub" text-anchor="middle">Same centre μ</text><text x="210" y="241" class="" text-anchor="middle">SD = σ</text><text x="14" y="280" class="" text-anchor="start">Averages of 4 observations</text><path d="M30,420.00 L32,420.00 L34,420.00 L36,420.00 L38,420.00 L40,420.00 L42,420.00 L44,420.00 L46,420.00 L48,420.00 L50,420.00 L52,420.00 L54,420.00 L56,420.00 L58,420.00 L60,420.00 L62,420.00 L64,420.00 L66,420.00 L68,420.00 L70,419.99 L72,419.99 L74,419.99 L76,419.99 L78,419.98 L80,419.98 L82,419.97 L84,419.96 L86,419.96 L88,419.94 L90,419.93 L92,419.91 L94,419.89 L96,419.86 L98,419.83 L100,419.79 L102,419.74 L104,419.68 L106,419.61 L108,419.53 L110,419.43 L112,419.31 L114,419.17 L116,419.01 L118,418.82 L120,418.59 L122,418.34 L124,418.04 L126,417.70 L128,417.30 L130,416.86 L132,416.35 L134,415.78 L136,415.13 L138,414.41 L140,413.61 L142,412.72 L144,411.73 L146,410.65 L148,409.46 L150,408.17 L152,406.78 L154,405.27 L156,403.65 L158,401.93 L160,400.10 L162,398.16 L164,396.13 L166,394.00 L168,391.80 L170,389.52 L172,387.19 L174,384.81 L176,382.39 L178,379.97 L180,377.55 L182,375.15 L184,372.80 L186,370.51 L188,368.31 L190,366.21 L192,364.24 L194,362.42 L196,360.76 L198,359.28 L200,358.01 L202,356.94 L204,356.10 L206,355.49 L208,355.12 L210,355.00 L212,355.12 L214,355.49 L216,356.10 L218,356.94 L220,358.01 L222,359.28 L224,360.76 L226,362.42 L228,364.24 L230,366.21 L232,368.31 L234,370.51 L236,372.80 L238,375.15 L240,377.55 L242,379.97 L244,382.39 L246,384.81 L248,387.19 L250,389.52 L252,391.80 L254,394.00 L256,396.13 L258,398.16 L260,400.10 L262,401.93 L264,403.65 L266,405.27 L268,406.78 L270,408.17 L272,409.46 L274,410.65 L276,411.73 L278,412.72 L280,413.61 L282,414.41 L284,415.13 L286,415.78 L288,416.35 L290,416.86 L292,417.30 L294,417.70 L296,418.04 L298,418.34 L300,418.59 L302,418.82 L304,419.01 L306,419.17 L308,419.31 L310,419.43 L312,419.53 L314,419.61 L316,419.68 L318,419.74 L320,419.79 L322,419.83 L324,419.86 L326,419.89 L328,419.91 L330,419.93 L332,419.94 L334,419.96 L336,419.96 L338,419.97 L340,419.98 L342,419.98 L344,419.99 L346,419.99 L348,419.99 L350,419.99 L352,420.00 L354,420.00 L356,420.00 L358,420.00 L360,420.00 L362,420.00 L364,420.00 L366,420.00 L368,420.00 L370,420.00 L372,420.00 L374,420.00 L376,420.00 L378,420.00 L380,420.00 L382,420.00 L384,420.00 L386,420.00 L388,420.00 L390,420.00" class="curve"/><path d="M30,420 H390" class="axis"/><text x="210" y="444" class="sub" text-anchor="middle">Same centre μ</text><text x="210" y="471" class="" text-anchor="middle">SE = σ / 2</text><text x="14" y="510" class="" text-anchor="start">Averages of 16 observations</text><path d="M30,650.00 L32,650.00 L34,650.00 L36,650.00 L38,650.00 L40,650.00 L42,650.00 L44,650.00 L46,650.00 L48,650.00 L50,650.00 L52,650.00 L54,650.00 L56,650.00 L58,650.00 L60,650.00 L62,650.00 L64,650.00 L66,650.00 L68,650.00 L70,650.00 L72,650.00 L74,650.00 L76,650.00 L78,650.00 L80,650.00 L82,650.00 L84,650.00 L86,650.00 L88,650.00 L90,650.00 L92,650.00 L94,650.00 L96,650.00 L98,650.00 L100,650.00 L102,650.00 L104,650.00 L106,650.00 L108,650.00 L110,650.00 L112,650.00 L114,650.00 L116,650.00 L118,650.00 L120,650.00 L122,650.00 L124,650.00 L126,650.00 L128,650.00 L130,650.00 L132,650.00 L134,650.00 L136,650.00 L138,649.99 L140,649.99 L142,649.98 L144,649.97 L146,649.94 L148,649.91 L150,649.86 L152,649.78 L154,649.66 L156,649.48 L158,649.22 L160,648.86 L162,648.34 L164,647.63 L166,646.67 L168,645.39 L170,643.72 L172,641.56 L174,638.83 L176,635.43 L178,631.30 L180,626.35 L182,620.54 L184,613.86 L186,606.32 L188,598.01 L190,589.04 L192,579.61 L194,569.94 L196,560.31 L198,551.02 L200,542.43 L202,534.84 L204,528.57 L206,523.88 L208,520.98 L210,520.00 L212,520.98 L214,523.88 L216,528.57 L218,534.84 L220,542.43 L222,551.02 L224,560.31 L226,569.94 L228,579.61 L230,589.04 L232,598.01 L234,606.32 L236,613.86 L238,620.54 L240,626.35 L242,631.30 L244,635.43 L246,638.83 L248,641.56 L250,643.72 L252,645.39 L254,646.67 L256,647.63 L258,648.34 L260,648.86 L262,649.22 L264,649.48 L266,649.66 L268,649.78 L270,649.86 L272,649.91 L274,649.94 L276,649.97 L278,649.98 L280,649.99 L282,649.99 L284,650.00 L286,650.00 L288,650.00 L290,650.00 L292,650.00 L294,650.00 L296,650.00 L298,650.00 L300,650.00 L302,650.00 L304,650.00 L306,650.00 L308,650.00 L310,650.00 L312,650.00 L314,650.00 L316,650.00 L318,650.00 L320,650.00 L322,650.00 L324,650.00 L326,650.00 L328,650.00 L330,650.00 L332,650.00 L334,650.00 L336,650.00 L338,650.00 L340,650.00 L342,650.00 L344,650.00 L346,650.00 L348,650.00 L350,650.00 L352,650.00 L354,650.00 L356,650.00 L358,650.00 L360,650.00 L362,650.00 L364,650.00 L366,650.00 L368,650.00 L370,650.00 L372,650.00 L374,650.00 L376,650.00 L378,650.00 L380,650.00 L382,650.00 L384,650.00 L386,650.00 L388,650.00 L390,650.00" class="curve"/><path d="M30,650 H390" class="axis"/><text x="210" y="674" class="sub" text-anchor="middle">Same centre μ</text><text x="210" y="701" class="" text-anchor="middle">SE = σ / 4</text>
</svg>
<figcaption>Here the starting population is normal, so all three curves are exactly normal. Horizontal scales match. Averaging makes the distribution narrower and taller, keeping total probability equal to 1. For other populations, the bell shape is an approximation, not a guarantee.</figcaption>
</figure>

## Keep these distinctions

1. **Outcome vs event:** one result vs the collection that answers your question.
2. **Probability vs frequency:** the model's chance vs the fraction seen in a finite sample.
3. **Conditional vs independent:** information can change the chance; independence says this information doesn't.
4. **Discrete vs continuous:** probabilities on separate values vs areas over intervals.
5. **Distribution vs one probability:** the whole picture vs one part of it.
6. **Standard deviation vs standard error:** spread of observations vs wobble of an estimate.


## Further reading

- OpenStax, *Introductory Statistics 2e*, [probability terminology](https://openstax.org/books/introductory-statistics-2e/pages/3-1-terminology) and [two basic rules](https://openstax.org/books/introductory-statistics-2e/pages/3-3-two-basic-rules-of-probability).
- OpenStax, [binomial distribution](https://openstax.org/books/introductory-statistics-2e/pages/4-3-binomial-distribution).
- OpenStax, [continuous density](https://openstax.org/books/introductory-business-statistics-2e/pages/5-1-properties-of-continuous-probability-density-functions) and [standard normal distribution](https://openstax.org/books/introductory-statistics-2e/pages/6-1-the-standard-normal-distribution).
- OpenStax, [central limit theorem for sample means](https://openstax.org/books/introductory-statistics-2e/pages/7-1-the-central-limit-theorem-for-sample-means-averages).

<script>
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  function node(tag, attrs, text) {
    const el=document.createElementNS('http://www.w3.org/2000/svg',tag);
    Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));
    if(text!==undefined) el.textContent=text;
    return el;
  }
  function label(svg,x,y,text,anchor='middle') { svg.append(node('text',{x,y,'text-anchor':anchor,fill:'var(--muted)','font-size':18},text)); }
  function choose(n,k) { let c=1; for(let i=1;i<=k;i++)c=c*(n-i+1)/i; return c; }
  function probabilities(n,q) { return Array.from({length:n+1},(_,k)=>choose(n,k)*q**k*(1-q)**(n-k)); }
  let counts=[],batches=0;
  function updateBinomial(reset=false) {
    const n=Number($('pb-n').value),q=Number($('pb-q').value)/100;
    if(reset || counts.length!==n+1) {counts=Array(n+1).fill(0);batches=0;}
    $('pb-n-value').textContent=n; $('pb-q-value').textContent=(q*100).toFixed(0)+'%';
    const probs=probabilities(n,q), chart=$('pb-binomial-chart');
    chart.replaceChildren(node('title',{id:'pb-bin-chart-title'},'Exact binomial probabilities and simulated frequencies'),node('desc',{id:'pb-bin-chart-desc'},n+' flips per batch, '+(q*100)+'% heads probability. Expected heads '+(n*q).toFixed(2)+'. '+batches+' simulated batches.'));
    const max=Math.max(...probs,...counts.map(c=>batches?c/batches:0));
    const width=500/(n+1),x=k=>60+k*width, y=p=>225-p/max*175;
    chart.append(node('line',{x1:55,x2:565,y1:225,y2:225,stroke:'var(--muted)'}));
    for(let k=0;k<=n;k++) {
      const g=node('g',{tabindex:0});g.append(node('title',{},k+' heads: exact '+(100*probs[k]).toFixed(2)+'%; simulated '+(batches?(100*counts[k]/batches).toFixed(2)+'%':'not sampled')));
      g.append(node('rect',{x:x(k)+2,y:y(probs[k]),width:Math.max(1,width-4),height:225-y(probs[k]),fill:'var(--l0)',opacity:.7}));
      if(batches)g.append(node('circle',{cx:x(k)+width/2,cy:y(counts[k]/batches),r:4,fill:'var(--l2)',stroke:'var(--fg)','stroke-width':1}));
      chart.append(g);
      if(n<=10 || k%2===0 || k===n)label(chart,x(k)+width/2,248,k);
    }
    label(chart,60,25,'Top of scale: '+(100*max).toFixed(1)+'%','start'); label(chart,310,275,'Number of heads');
    $('pb-binomial-result').textContent='Expected heads: '+(n*q).toFixed(2)+'. Standard deviation: '+Math.sqrt(n*q*(1-q)).toFixed(2)+' heads. Simulated batches: '+batches+'.'+(batches?' Last batch: '+last+' heads.':' Try a simulation.');
  }
  let last=0;
  function simulate(times) {const n=Number($('pb-n').value),q=Number($('pb-q').value)/100;for(let i=0;i<times;i++){last=0;for(let j=0;j<n;j++)last+=Math.random()<q?1:0;counts[last]++;batches++;}updateBinomial();}
  ['pb-n','pb-q'].forEach(id=>$(id).addEventListener('input',()=>updateBinomial(true)));
  $('pb-sim-one').addEventListener('click',()=>simulate(1));$('pb-sim-many').addEventListener('click',()=>simulate(100));$('pb-reset').addEventListener('click',()=>updateBinomial(true));
  updateBinomial(true);$('pb-binomial').hidden=false;
  function cdf(z) {const t=1/(1+.2316419*Math.abs(z));const tail=Math.exp(-z*z/2)/Math.sqrt(2*Math.PI)*t*(.319381530+t*(-.356563782+t*(1.781477937+t*(-1.821255978+t*1.330274429))));return z<0?tail:1-tail;}
  function updateNormal(changed) {
    const mu=Number($('pb-mu').value),sigma=Number($('pb-sigma').value);
    let lo=Number($('pb-lo').value),hi=Number($('pb-hi').value);
    if(lo>hi) {if(changed==='pb-lo'){$('pb-hi').value=lo;hi=lo;}else{$('pb-lo').value=hi;lo=hi;}}
    [['pb-mu',mu],['pb-sigma',sigma],['pb-lo',lo],['pb-hi',hi]].forEach(([id,v])=>$(id+'-value').textContent=v);
    const density=v=>Math.exp(-.5*((v-mu)/sigma)**2)/(sigma*Math.sqrt(2*Math.PI));
    const min=Math.min(mu-4*sigma,lo),max=Math.max(mu+4*sigma,hi),x=v=>55+(v-min)/(max-min)*510,y=v=>225-density(v)/.8*180;
    const chart=$('pb-normal-chart'),prob=lo===hi?0:Math.max(0,Math.min(1,cdf((hi-mu)/sigma)-cdf((lo-mu)/sigma)));
    chart.replaceChildren(node('title',{id:'pb-normal-chart-title'},'A normal density with a shaded interval'),node('desc',{id:'pb-normal-chart-desc'},'Mean '+mu+', standard deviation '+sigma+'. Interval '+lo+' to '+hi+' has probability '+(prob*100).toFixed(2)+'%.'));
    let d='M'+x(lo)+',225';for(let i=0;i<=200;i++){const v=lo+(hi-lo)*i/200;d+=' L'+x(v)+','+y(v);}d+=' L'+x(hi)+',225 Z';chart.append(node('path',{d,fill:'var(--l0)',opacity:.25}));
    d='';for(let i=0;i<=400;i++){const v=min+(max-min)*i/400;d+=(i?' L':'M')+x(v)+','+y(v);}chart.append(node('path',{d,fill:'none',stroke:'var(--l0)','stroke-width':2.5}));
    chart.append(node('line',{x1:55,x2:565,y1:225,y2:225,stroke:'var(--muted)'}));
    chart.append(node('line',{x1:x(mu),x2:x(mu),y1:40,y2:225,stroke:'var(--muted)','stroke-dasharray':'5 5'}));
    [lo,hi].forEach(v=>{chart.append(node('line',{x1:x(v),x2:x(v),y1:y(v),y2:225,stroke:'var(--l3)','stroke-width':2}));});
    for(let i=0;i<=4;i++) {const v=min+(max-min)*i/4;label(chart,x(v),248,v.toFixed(1));}
    label(chart,55,25,'Density (curve height)','start');label(chart,310,276,'Value (x)');
    $('pb-normal-result').textContent='P('+lo+' ≤ X ≤ '+hi+') ≈ '+(100*prob).toFixed(2)+'%. z at left: '+((lo-mu)/sigma).toFixed(2)+'; z at right: '+((hi-mu)/sigma).toFixed(2)+'. Density at mean: '+density(mu).toFixed(3)+' per x-unit (not a probability).';
  }
  ['pb-mu','pb-sigma','pb-lo','pb-hi'].forEach(id=>$(id).addEventListener('input',()=>updateNormal(id)));
  $('pb-normal-reset').addEventListener('click',()=>{[['pb-mu',0],['pb-sigma',1],['pb-lo',-1],['pb-hi',1]].forEach(([id,v])=>$(id).value=v);updateNormal();});
  updateNormal();$('pb-normal').hidden=false;
})();
</script>
