---
layout: post
title: "Probability and distributions, one step at a time"
date: 2021-10-09
math: true
tags:
- exp
- data
summary: "Probability from scratch, with a die and a coin. What a chance really promises, what a distribution is, and why a bell curve is read by area."
---

You flip a coin and get heads. You flip it again and get heads again. Is the next one "due" to be tails?

It feels like it should be. It isn't. A fair coin has no memory, so the third flip is still 50/50. That part is easy to remember. What took me much longer was understanding *why*, and what a number like "50%" actually promises. Every textbook I tried opened with notation, and I usually lost the thread somewhere on the second page.

So this post goes the other way round. We do each calculation by hand first, with a die or a coin, and only write the formula once you've already done what it says. I've written it for someone who has never studied probability. If you have, I hope it still helps when you need to explain it to someone else.

The route:

1. Probability as counting, with one die roll.
2. Combining questions: *not*, *or*, *and*, *given*.
3. Distributions: every possible answer at once.
4. Two numbers that summarise a distribution.
5. From bars to curves, and the normal distribution.
6. Why averages end up looking like bells.

<style>
.fig.learn-fig { overflow:visible; }
.fig.learn-fig svg { width:100%; min-width:0; max-width:500px; height:auto; }
.learn-fig text { fill:var(--fg); font:16px 'Geist Mono',monospace; }
.learn-fig .sub { fill:var(--muted); font-size:14px; }
.learn-fig .axis { stroke:var(--muted); fill:none; }
.learn-fig .curve { stroke:var(--l0); stroke-width:2.5; fill:none; }
.pb-widget { margin:32px 0; padding:20px; border:1px solid var(--line); border-radius:8px; background:var(--panel); }
.pb-widget[hidden] { display:none; }
.prose .pb-widget h3 { margin:0 0 10px; }
.prose .pb-widget p, .prose .pb-widget li { font-size:14.5px; }
.pb-controls { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; margin:16px 0; }
.pb-controls label { font-size:14px; }
.pb-widget input[type=range] { display:block; width:100%; min-width:0; min-height:44px; accent-color:var(--l0); }
.pb-buttons { display:flex; flex-wrap:wrap; gap:8px; margin:12px 0; }
.pb-widget button { min-height:44px; padding:8px 12px; color:var(--fg); background:var(--bg); border:1px solid var(--line); border-radius:4px; font:inherit; font-size:14px; cursor:pointer; }
.pb-widget button:hover { border-color:var(--l0); }
.pb-widget :focus-visible { outline:2px solid var(--l0); outline-offset:3px; }
.pb-widget svg { width:100%; height:auto; display:block; margin:8px 0; }
.pb-widget svg text { font-family:'Geist Mono',monospace; }
.pb-result { border-top:1px solid var(--line); padding-top:12px; overflow-wrap:anywhere; font-family:'Geist Mono',monospace; font-size:13.5px; }
.pb-legend { display:flex; flex-wrap:wrap; gap:6px 16px; font-size:13px; color:var(--muted); }
.pb-legend i { display:inline-block; width:12px; height:12px; border-radius:2px; margin-right:6px; vertical-align:-1px; }
@media(max-width:480px) { .pb-widget svg text { font-size:21px; } .pb-widget { padding:14px; } .pb-controls { grid-template-columns:1fr; gap:6px; } }
</style>

## Probability is counting, when things are fair

Roll an ordinary six-sided die. What's the chance of an even number?

You probably already know it's a half. Here is how you got there, slowly, because the same three moves come back in everything that follows:

1. **List everything that could happen.** 1, 2, 3, 4, 5, 6. This list is called the *sample space*.
2. **Mark the outcomes you care about.** 2, 4 and 6. A group of outcomes like this is called an *event*.
3. **Divide.** 3 marked out of 6 in total.

$$
P(\text{even}) = \frac{3}{6} = 0.5
$$

$$P(\ldots)$$ is shorthand for "the probability of ...". 0.5, 50% and 1/2 are the same number written three ways. A probability always sits between 0, which means it can't happen, and 1, which means it's certain.

<figure class="fig">
<svg style="width:100%;min-width:0;height:auto" viewBox="0 0 600 120" role="img" aria-labelledby="pb-die-title pb-die-desc">
<title id="pb-die-title">Three of six equally likely die outcomes are even</title>
<desc id="pb-die-desc">Six equal boxes labelled one through six. Two, four and six are blue; one, three and five are unfilled. Three of six boxes count.</desc>
<g fill="none" stroke="var(--muted)"><rect x="10" y="10" width="80" height="80" rx="8"/><rect x="210" y="10" width="80" height="80" rx="8"/><rect x="410" y="10" width="80" height="80" rx="8"/></g>
<g fill="var(--l0)" fill-opacity=".18" stroke="var(--l0)"><rect x="110" y="10" width="80" height="80" rx="8"/><rect x="310" y="10" width="80" height="80" rx="8"/><rect x="510" y="10" width="80" height="80" rx="8"/></g>
<g fill="var(--fg)" font-size="30" text-anchor="middle"><text x="50" y="61">1</text><text x="150" y="61">2</text><text x="250" y="61">3</text><text x="350" y="61">4</text><text x="450" y="61">5</text><text x="550" y="61">6</text></g>
<text x="300" y="115" text-anchor="middle" fill="var(--muted)" font-size="16">2, 4 and 6 count: 3 out of 6 = 50%</text>
</svg>
<figcaption>Six equally likely faces, three of them even. Three out of six is a half.</figcaption>
</figure>

The divide step only works because every face is equally likely. If someone weighted the die so that 6 comes up half the time, counting faces would give the wrong answer, and you'd have to add up each face's own chance instead. So "count and divide" is a shortcut for fair situations, not a general rule.

### What does 50% actually promise?

Less than it sounds like. Roll the die ten times and you might get five evens. You might also get three, or eight. A 50% chance says nothing firm about a short run.

What it does describe is the long run. Roll hundreds or thousands of times, and the share of evens drifts closer and closer to a half. This is called the **law of large numbers**. You can watch it happen:

<section id="pb-lln" class="pb-widget" aria-labelledby="pb-lln-title" hidden>
<h3 id="pb-lln-title">Try it: roll a die a lot of times</h3>
<p>The blue line is the share of rolls so far that came up even. The dashed line is the true chance, 50%.</p>
<div class="pb-buttons">
<button id="pb-lln-1" type="button">Roll once</button>
<button id="pb-lln-10" type="button">Roll 10</button>
<button id="pb-lln-100" type="button">Roll 100</button>
<button id="pb-lln-1000" type="button">Roll 1,000</button>
<button id="pb-lln-reset" type="button">Start over</button>
</div>
<svg id="pb-lln-chart" viewBox="0 0 600 270" role="img" aria-labelledby="pb-lln-chart-title pb-lln-chart-desc"><title id="pb-lln-chart-title">Running share of even rolls</title><desc id="pb-lln-chart-desc"></desc></svg>
<p id="pb-lln-result" class="pb-result" role="status" aria-live="polite" aria-atomic="true"></p>
<ol><li>Roll once a few times. After one roll the share is either 0% or 100%, which tells you nothing.</li><li>Roll 100. The line still jumps around a lot.</li><li>Roll 1,000 a few times. The line flattens out close to 50% and the early jumps get squeezed to the left edge.</li><li>Start over and repeat. Every run starts wild and calms down, but no two runs take the same path.</li></ol>
</section>
<noscript><p>With JavaScript on, this spot has a die-rolling simulation. Without it: after 10 rolls, the share of evens can easily be 30% or 70%. After 10,000 rolls it's almost always between 49% and 51%.</p></noscript>

Notice what the line *doesn't* do. After a run of odd numbers, the die doesn't produce extra evens to catch up. The early streak just gets diluted by thousands of later rolls until it hardly moves the average. That's the real answer to the coin question at the top. Tails isn't due. The streak simply stops mattering as more flips pile up.

## Combining questions: not, or, and

Same die. Let's name two events:

- **A**: the roll is even (2, 4 or 6).
- **B**: the roll is over 4 (5 or 6).

**Not A** is whatever is left over: 1, 3 and 5. Something has to happen, so the chances of A and of not-A always add up to 1. That means you can get one from the other:

$$
P(\text{not }A) = 1 - P(A) = 1 - \tfrac{3}{6} = \tfrac{3}{6}
$$

**A or B** means at least one of them happens: 2, 4, 5 or 6. That's 4 out of 6. If you'd simply added 3/6 and 2/6 you would get 5/6, which is wrong, because 6 is in both lists and you counted it twice. So add, then take the double-counted overlap away once:

$$
P(A\text{ or }B) = P(A) + P(B) - P(A\text{ and }B) = \tfrac{3}{6} + \tfrac{2}{6} - \tfrac{1}{6} = \tfrac{4}{6}
$$

**A and B** means both happen on the same roll: even *and* over 4. Only 6 fits, so it's 1 out of 6.

<figure class="fig learn-fig">
<svg viewBox="0 0 460 272" role="img" aria-labelledby="pb-events-t pb-events-d">
<title id="pb-events-t">Not, or, and on one die roll</title>
<desc id="pb-events-d">Six boxes per row for the faces 1 to 6. A, even, marks 2, 4 and 6: 3 of 6. B, over 4, marks 5 and 6: 2 of 6. A or B marks 2, 4, 5 and 6: 4 of 6. A and B marks only 6: 1 of 6.</desc>
<text x="14" y="26">One roll, four questions</text><text x="14" y="73">A: even</text><rect x="128" y="48" width="36" height="36" rx="5" fill="var(--panel)" stroke="var(--line)"/><text x="146" y="73" text-anchor="middle">1</text><rect x="172" y="48" width="36" height="36" rx="5" fill="var(--l0)" fill-opacity=".28" stroke="var(--line)"/><text x="190" y="73" text-anchor="middle">2</text><rect x="216" y="48" width="36" height="36" rx="5" fill="var(--panel)" stroke="var(--line)"/><text x="234" y="73" text-anchor="middle">3</text><rect x="260" y="48" width="36" height="36" rx="5" fill="var(--l0)" fill-opacity=".28" stroke="var(--line)"/><text x="278" y="73" text-anchor="middle">4</text><rect x="304" y="48" width="36" height="36" rx="5" fill="var(--panel)" stroke="var(--line)"/><text x="322" y="73" text-anchor="middle">5</text><rect x="348" y="48" width="36" height="36" rx="5" fill="var(--l0)" fill-opacity=".28" stroke="var(--line)"/><text x="366" y="73" text-anchor="middle">6</text><text x="446" y="73" text-anchor="end">3/6</text><text x="14" y="125">B: over 4</text><rect x="128" y="100" width="36" height="36" rx="5" fill="var(--panel)" stroke="var(--line)"/><text x="146" y="125" text-anchor="middle">1</text><rect x="172" y="100" width="36" height="36" rx="5" fill="var(--panel)" stroke="var(--line)"/><text x="190" y="125" text-anchor="middle">2</text><rect x="216" y="100" width="36" height="36" rx="5" fill="var(--panel)" stroke="var(--line)"/><text x="234" y="125" text-anchor="middle">3</text><rect x="260" y="100" width="36" height="36" rx="5" fill="var(--panel)" stroke="var(--line)"/><text x="278" y="125" text-anchor="middle">4</text><rect x="304" y="100" width="36" height="36" rx="5" fill="var(--l3)" fill-opacity=".28" stroke="var(--line)"/><text x="322" y="125" text-anchor="middle">5</text><rect x="348" y="100" width="36" height="36" rx="5" fill="var(--l3)" fill-opacity=".28" stroke="var(--line)"/><text x="366" y="125" text-anchor="middle">6</text><text x="446" y="125" text-anchor="end">2/6</text><text x="14" y="191">A or B</text><rect x="128" y="166" width="36" height="36" rx="5" fill="var(--panel)" stroke="var(--line)"/><text x="146" y="191" text-anchor="middle">1</text><rect x="172" y="166" width="36" height="36" rx="5" fill="var(--l1)" fill-opacity=".28" stroke="var(--line)"/><text x="190" y="191" text-anchor="middle">2</text><rect x="216" y="166" width="36" height="36" rx="5" fill="var(--panel)" stroke="var(--line)"/><text x="234" y="191" text-anchor="middle">3</text><rect x="260" y="166" width="36" height="36" rx="5" fill="var(--l1)" fill-opacity=".28" stroke="var(--line)"/><text x="278" y="191" text-anchor="middle">4</text><rect x="304" y="166" width="36" height="36" rx="5" fill="var(--l1)" fill-opacity=".28" stroke="var(--line)"/><text x="322" y="191" text-anchor="middle">5</text><rect x="348" y="166" width="36" height="36" rx="5" fill="var(--l1)" fill-opacity=".28" stroke="var(--line)"/><text x="366" y="191" text-anchor="middle">6</text><text x="446" y="191" text-anchor="end">4/6</text><text x="14" y="243">A and B</text><rect x="128" y="218" width="36" height="36" rx="5" fill="var(--panel)" stroke="var(--line)"/><text x="146" y="243" text-anchor="middle">1</text><rect x="172" y="218" width="36" height="36" rx="5" fill="var(--panel)" stroke="var(--line)"/><text x="190" y="243" text-anchor="middle">2</text><rect x="216" y="218" width="36" height="36" rx="5" fill="var(--panel)" stroke="var(--line)"/><text x="234" y="243" text-anchor="middle">3</text><rect x="260" y="218" width="36" height="36" rx="5" fill="var(--panel)" stroke="var(--line)"/><text x="278" y="243" text-anchor="middle">4</text><rect x="304" y="218" width="36" height="36" rx="5" fill="var(--panel)" stroke="var(--line)"/><text x="322" y="243" text-anchor="middle">5</text><rect x="348" y="218" width="36" height="36" rx="5" fill="var(--l1)" fill-opacity=".28" stroke="var(--line)"/><text x="366" y="243" text-anchor="middle">6</text><text x="446" y="243" text-anchor="end">1/6</text><path d="M14,153 H446" class="axis" stroke-dasharray="4 4"/>
</svg>
<figcaption>Read each row as "which faces count?". The two rows below the line are built from the two above. Six is in both A and B, which is why "or" is 4/6 and not 5/6.</figcaption>
</figure>

Every rule here is a counting trick. The formulas only exist to save you from listing outcomes when the list gets long.

## "Given": new information shrinks the list

Now a friend rolls the die behind a book and tells you "it's over 4". What's the chance it's even?

You don't count out of six any more. Only 5 and 6 are still possible, so that's your new list. One of the two is even, so the answer is 1/2.

This is **conditional probability**: the chance of A *given* that B happened. The vertical bar is read "given":

$$
P(A \mid B) = \frac{P(A\text{ and }B)}{P(B)} = \frac{1/6}{2/6} = \frac{1}{2}
$$

The formula does exactly what you just did in your head. The top is "outcomes in both". The bottom is "outcomes that survived the new information". Dividing by the bottom is how you switch from counting out of six to counting out of two.

<figure class="fig learn-fig">
<svg viewBox="0 0 420 300" role="img" aria-labelledby="pb-given-t pb-given-d">
<title id="pb-given-t">Conditioning shrinks the sample space</title>
<desc id="pb-given-d">Without information, 3 of 6 outcomes are even. Given greater than 4, only 5 and 6 remain, so 1 of 2 is even.</desc>
<text x="16" y="27" text-anchor="start">New information changes the denominator</text><rect x="14" y="50" width="58" height="52" rx="5" fill="var(--panel)" fill-opacity="1" stroke="var(--line)"/><text x="43" y="82" text-anchor="middle">1</text><rect x="80" y="50" width="58" height="52" rx="5" fill="var(--l0)" fill-opacity="0.2" stroke="var(--line)"/><text x="109" y="82" text-anchor="middle">2</text><rect x="146" y="50" width="58" height="52" rx="5" fill="var(--panel)" fill-opacity="1" stroke="var(--line)"/><text x="175" y="82" text-anchor="middle">3</text><rect x="212" y="50" width="58" height="52" rx="5" fill="var(--l0)" fill-opacity="0.2" stroke="var(--line)"/><text x="241" y="82" text-anchor="middle">4</text><rect x="278" y="50" width="58" height="52" rx="5" fill="var(--panel)" fill-opacity="1" stroke="var(--line)"/><text x="307" y="82" text-anchor="middle">5</text><rect x="344" y="50" width="58" height="52" rx="5" fill="var(--l0)" fill-opacity="0.2" stroke="var(--line)"/><text x="373" y="82" text-anchor="middle">6</text><text x="210" y="131" text-anchor="middle">Before: 3 even out of 6 = 1/2</text><text x="210" y="174" class="sub" text-anchor="middle">Given greater than 4: keep only 5, 6</text><rect x="128" y="193" width="74" height="56" rx="5" fill="var(--panel)" fill-opacity="1" stroke="var(--line)"/><text x="165" y="227" text-anchor="middle">5</text><rect x="218" y="193" width="74" height="56" rx="5" fill="var(--l0)" fill-opacity="0.2" stroke="var(--line)"/><text x="255" y="227" text-anchor="middle">6</text><text x="210" y="280" text-anchor="middle">After: 1 even out of 2 = 1/2</text>
</svg>
<figcaption>Before your friend speaks, you count out of six. Afterwards, only 5 and 6 are left, so you count out of two.</figcaption>
</figure>

One trap worth spotting early: the order matters. "Even, given over 4" is 1/2. Flip it round to "over 4, given even" and the list becomes 2, 4, 6, of which only 6 is over 4, so it's 1/3. Swapping the two sides of the bar changes the question and the answer. Mixing the two up causes a surprising amount of bad reasoning, in medicine, in court and in data work, so it's worth getting used to the difference now.

### Independence: when the news changes nothing

Look at that first answer again. Before your friend said anything, the chance of even was 1/2. After hearing "over 4", it was still 1/2. The news didn't change anything.

When that happens, the two events are **independent**:

$$
P(A \mid B) = P(A)
$$

Compare it with the news "it's over 3". Now the list is 4, 5, 6, and two of those three are even, so the chance jumps to 2/3. "Even" and "over 3" are *not* independent on this die. Knowing one tells you something about the other.

Coin flips are the classic independent events. The coin has no memory, so the first flip tells you nothing about the second. That gives a shortcut for "and": multiply. Half the time the first flip is heads, and in half of *those* cases the second is heads too. Half of a half is a quarter:

$$
P(\text{heads, then heads}) = 0.5 \times 0.5 = 0.25
$$

In general, **only when A and B are independent**:

$$
P(A\text{ and }B) = P(A) \times P(B)
$$

That condition matters more than it looks. Two visits from the same user, or two people in the same household, are often related. Multiplying their chances as if they weren't is one of the most common mistakes I see in real data work.

## A distribution: every answer at once

So far each question had a single answer. Now let's ask one with several possible answers.

Flip a coin four times and count the heads. You could get 0, 1, 2, 3 or 4. How likely is each?

The tempting guess is "five possible answers, so 20% each". Let's check by listing. Four flips can come out in 2 × 2 × 2 × 2 = 16 different orders (HHHH, HHHT, HHTH, and so on), and with a fair coin each order has the same chance, 1/16. Now sort the orders by how many heads they contain:

<figure class="fig learn-fig">
<svg viewBox="0 0 420 305" role="img" aria-labelledby="pb-sequences-t pb-sequences-d">
<title id="pb-sequences-t">Sequences group into heads counts</title>
<desc id="pb-sequences-d">All sixteen equally likely sequences of four fair coin flips grouped into 0, 1, 2, 3 and 4 heads, with counts 1, 4, 6, 4 and 1.</desc>
<text x="14" y="25" text-anchor="start">16 equal sequences → 5 unequal counts</text><text x="46" y="61" text-anchor="middle">0 heads</text><rect x="8" y="78" width="76" height="25" rx="5" fill="var(--l0)" fill-opacity="0.15" stroke="var(--line)"/><text x="46" y="96" class="sub" text-anchor="middle">TTTT</text><text x="46" y="286" text-anchor="middle">1/16</text><text x="128" y="61" text-anchor="middle">1 heads</text><rect x="90" y="78" width="76" height="25" rx="5" fill="var(--l0)" fill-opacity="0.15" stroke="var(--line)"/><text x="128" y="96" class="sub" text-anchor="middle">TTTH</text><rect x="90" y="108" width="76" height="25" rx="5" fill="var(--l0)" fill-opacity="0.15" stroke="var(--line)"/><text x="128" y="126" class="sub" text-anchor="middle">TTHT</text><rect x="90" y="138" width="76" height="25" rx="5" fill="var(--l0)" fill-opacity="0.15" stroke="var(--line)"/><text x="128" y="156" class="sub" text-anchor="middle">THTT</text><rect x="90" y="168" width="76" height="25" rx="5" fill="var(--l0)" fill-opacity="0.15" stroke="var(--line)"/><text x="128" y="186" class="sub" text-anchor="middle">HTTT</text><text x="128" y="286" text-anchor="middle">4/16</text><text x="210" y="61" text-anchor="middle">2 heads</text><rect x="172" y="78" width="76" height="25" rx="5" fill="var(--l0)" fill-opacity="0.15" stroke="var(--line)"/><text x="210" y="96" class="sub" text-anchor="middle">TTHH</text><rect x="172" y="108" width="76" height="25" rx="5" fill="var(--l0)" fill-opacity="0.15" stroke="var(--line)"/><text x="210" y="126" class="sub" text-anchor="middle">THTH</text><rect x="172" y="138" width="76" height="25" rx="5" fill="var(--l0)" fill-opacity="0.15" stroke="var(--line)"/><text x="210" y="156" class="sub" text-anchor="middle">THHT</text><rect x="172" y="168" width="76" height="25" rx="5" fill="var(--l0)" fill-opacity="0.15" stroke="var(--line)"/><text x="210" y="186" class="sub" text-anchor="middle">HTTH</text><rect x="172" y="198" width="76" height="25" rx="5" fill="var(--l0)" fill-opacity="0.15" stroke="var(--line)"/><text x="210" y="216" class="sub" text-anchor="middle">HTHT</text><rect x="172" y="228" width="76" height="25" rx="5" fill="var(--l0)" fill-opacity="0.15" stroke="var(--line)"/><text x="210" y="246" class="sub" text-anchor="middle">HHTT</text><text x="210" y="286" text-anchor="middle">6/16</text><text x="292" y="61" text-anchor="middle">3 heads</text><rect x="254" y="78" width="76" height="25" rx="5" fill="var(--l0)" fill-opacity="0.15" stroke="var(--line)"/><text x="292" y="96" class="sub" text-anchor="middle">THHH</text><rect x="254" y="108" width="76" height="25" rx="5" fill="var(--l0)" fill-opacity="0.15" stroke="var(--line)"/><text x="292" y="126" class="sub" text-anchor="middle">HTHH</text><rect x="254" y="138" width="76" height="25" rx="5" fill="var(--l0)" fill-opacity="0.15" stroke="var(--line)"/><text x="292" y="156" class="sub" text-anchor="middle">HHTH</text><rect x="254" y="168" width="76" height="25" rx="5" fill="var(--l0)" fill-opacity="0.15" stroke="var(--line)"/><text x="292" y="186" class="sub" text-anchor="middle">HHHT</text><text x="292" y="286" text-anchor="middle">4/16</text><text x="374" y="61" text-anchor="middle">4 heads</text><rect x="336" y="78" width="76" height="25" rx="5" fill="var(--l0)" fill-opacity="0.15" stroke="var(--line)"/><text x="374" y="96" class="sub" text-anchor="middle">HHHH</text><text x="374" y="286" text-anchor="middle">1/16</text>
</svg>
<figcaption>Every tile is one equally likely order, with chance 1/16. There's one way to get 0 heads but six ways to get 2, so 2 heads is six times as likely.</figcaption>
</figure>

There is only one way to get 0 heads (TTTT), but there are six ways to get 2. So 2 heads has a chance of 6/16, or 37.5%, while 0 heads has 1/16, about 6%. The five answers are nowhere near equally likely.

That whole table, every possible value together with its chance, is a **probability distribution**. The thing we're counting, "heads in four flips", is called a **random variable** and is usually written $$X$$. Despite the name, it's just a number whose value depends on chance. The distribution is the complete picture of what $$X$$ might turn out to be, and its chances always add up to 1, because one of the answers has to happen.

## The binomial: a recipe for counting heads

Listing 16 orders is fine. Listing them for 20 flips, over a million orders, is not. We need a recipe.

Here is how to get the chance of exactly 2 heads in 4 flips without listing everything:

1. **Find the chance of one particular order.** HHTT means heads, heads, tails, tails. The flips are independent, so multiply: 0.5 × 0.5 × 0.5 × 0.5 = 1/16.
2. **Count the orders that give 2 heads.** There are six: HHTT, HTHT, HTTH, THHT, THTH, TTHH.
3. **Multiply the two.** 6 × 1/16 = 6/16.

That's the whole idea: **(number of ways) × (chance of each way)**. Here it is in general form, for $$n$$ flips, $$k$$ heads, and a coin that lands heads with chance $$q$$:

$$
P(X = k) = \binom{n}{k}\, q^k\, (1-q)^{n-k}
$$

Piece by piece:

- $$\binom{n}{k}$$, read "n choose k", is the number of ways to pick which $$k$$ of the $$n$$ flips are heads. In our example it's the 6. Spreadsheets have it built in (`COMBIN` in Excel or Google Sheets).
- $$q^k$$ is $$q$$ multiplied by itself $$k$$ times: the heads part of one order.
- $$(1-q)^{n-k}$$ is the tails part. The other $$n-k$$ flips are tails, each with chance $$1-q$$.

Put in $$n=4$$, $$k=2$$, $$q=0.5$$ and you get 6 × 0.5² × 0.5² = 6/16, exactly what we counted by hand. The formula doesn't know anything we didn't. It just counts faster.

This is the **binomial distribution**. It fits anything shaped like "$$n$$ independent tries, each one a yes or no with the same chance". Coin flips, but also "how many of 1,000 visitors buy something", if each visitor buys independently with the same chance. (You'll also see the name **Bernoulli** for a single try: 1 with chance $$q$$, 0 otherwise. It's just one flip.)

With a coin that lands heads 70% of the time, the same six orders each have chance 0.7² × 0.3² = 0.0441, so exactly 2 heads becomes 6 × 0.0441 ≈ 26%. The bias pushes the whole distribution towards more heads. Try it:

<section id="pb-binomial" class="pb-widget" aria-labelledby="pb-binomial-title" hidden>
<h3 id="pb-binomial-title">Try it: the heads-count distribution</h3>
<p>Each blue bar is the exact chance of that many heads. The dashed line marks the average (the expected value, coming up next). Orange dots appear when you simulate: they show how often each count actually came up.</p>
<div class="pb-controls">
<label for="pb-n">Flips per batch: <output id="pb-n-value">4</output><input id="pb-n" type="range" min="1" max="30" step="1" value="4"></label>
<label for="pb-q">Chance of heads on each flip: <output id="pb-q-value">50%</output><input id="pb-q" type="range" min="0" max="100" step="5" value="50"></label>
</div>
<svg id="pb-binomial-chart" viewBox="0 0 600 290" role="img" aria-labelledby="pb-bin-chart-title pb-bin-chart-desc"><title id="pb-bin-chart-title">Exact binomial chances and simulated frequencies</title><desc id="pb-bin-chart-desc"></desc></svg>
<div class="pb-legend"><span><i style="background:var(--l0)"></i>exact chance</span><span><i style="background:var(--l2);border-radius:50%"></i>simulated share</span></div>
<div class="pb-buttons">
<button id="pb-sim-one" type="button">Simulate 1 batch</button>
<button id="pb-sim-many" type="button">Simulate 100 batches</button>
<button id="pb-reset" type="button">Clear simulations</button>
</div>
<p id="pb-binomial-result" class="pb-result" role="status" aria-live="polite" aria-atomic="true"></p>
<ol><li>Leave 4 flips at 50%. The bar for 2 heads is 37.5%, not 20%.</li><li>Simulate 1 batch a few times, then 100 batches a few times. The dots wander at first and settle near the bars as batches pile up: the law of large numbers again.</li><li>Move the heads chance to 70%. The whole shape slides right.</li><li>Set 20 flips at 50%. The shape is starting to look like a bell. Hold that thought until the end of the post.</li><li>Set the heads chance to 100%. Only one bar is left, because there's no randomness any more.</li></ol>
</section>
<noscript><p>With JavaScript on, this spot has an interactive chart. For four fair flips the chances of 0 to 4 heads are 1, 4, 6, 4 and 1 out of 16.</p></noscript>

## Two numbers that summarise a distribution

A distribution is a lot of numbers. Most of the time you want just two of them: where is it centred, and how spread out is it?

### The centre: expected value

Flip a coin that lands heads 70% of the time, ten times. How many heads on average? Each flip contributes 0.7 of a head on average, so ten flips give 7. In general:

$$
E[X] = n \times q
$$

$$E[X]$$ is read "the expected value of $$X$$". The name is a bit misleading. It's not the result you should expect on any particular try. It's the long-run average if you repeat the whole thing many times. One fair flip has an expected value of 0.5 heads, and no coin has ever landed half-heads.

### The spread: standard deviation

Two distributions can share the same centre and still look completely different. Ten fair flips average 5 heads, but do batches usually land between 4 and 6, or all over the place?

The **standard deviation** (SD) measures that. Roughly, it's how far a typical result lands from the centre. For the binomial:

$$
SD(X) = \sqrt{n\,q\,(1-q)}
$$

You don't need to derive it, but you can check it against your intuition:

- More flips (bigger $$n$$) leave more room to wander, so the SD grows.
- $$q(1-q)$$ is largest when $$q = 0.5$$. A fair coin is the hardest one to predict.
- A coin that always lands heads ($$q = 1$$) gives an SD of 0. No randomness, no spread.

For ten fair flips, that's √(10 × 0.5 × 0.5) ≈ 1.58 heads. Most batches land within a couple of heads of 5. The widget above shows the SD for whatever you set.

The thing under the square root, $$n\,q\,(1-q)$$, has its own name: the **variance**. It's measured in "heads squared", which isn't a unit anyone can picture, so we take the square root to get back to plain heads.

## From bars to curves

Everything so far had gaps between the possible values: 2 heads or 3 heads, never 2.5. These are called **discrete** distributions, and each value gets its own bar.

Now think about something like a person's height, or how long you wait for a bus. Between 170 cm and 171 cm there are infinitely many possible values. You can't give each of them its own slice of probability, because the slices have to add up to 1 and there are infinitely many.

The way out is to stop asking about exact values and ask about ranges instead. Picture a spinner that can stop anywhere between 0 and 10, with no position favoured. What's the chance it stops between 2 and 4? That stretch is 2 of the 10 units, so 20%. Between 2 and 3? 10%. Exactly on 3.000...? Zero, because a single point has no width.

So we draw a curve and read probability as **area under the curve**. For the spinner the "curve" is a flat line at height 0.1, and the area between 2 and 4 is width × height = 2 × 0.1 = 0.2. The total area under the whole curve is always 1.

The height of the curve is called the **density**. It shows where results are packed tightly, but it isn't a probability by itself. This was the single thing that confused me most when I first met bell curves: I kept reading the height as a chance. It isn't. Chance is area.

<figure class="fig learn-fig">
<svg viewBox="0 0 420 435" role="img" aria-labelledby="pb-mass-area-t pb-mass-area-d">
<title id="pb-mass-area-t">Discrete mass versus continuous area</title>
<desc id="pb-mass-area-d">Top: exact probabilities for heads in four fair flips. Bottom: normal density with the interval within one standard deviation shaded, about 68.3 percent probability.</desc>
<text x="14" y="24" text-anchor="start">Discrete: probability belongs to a bar</text><rect x="50" y="134.9375" width="40" height="9.0625" rx="5" fill="var(--l0)" fill-opacity="0.6" stroke="var(--line)"/><text x="70" y="167" text-anchor="middle">0</text><rect x="116" y="107.75" width="40" height="36.25" rx="5" fill="var(--l0)" fill-opacity="0.6" stroke="var(--line)"/><text x="136" y="167" text-anchor="middle">1</text><rect x="182" y="89.625" width="40" height="54.375" rx="5" fill="var(--l0)" fill-opacity="0.6" stroke="var(--line)"/><text x="202" y="167" text-anchor="middle">2</text><rect x="248" y="107.75" width="40" height="36.25" rx="5" fill="var(--l0)" fill-opacity="0.6" stroke="var(--line)"/><text x="268" y="167" text-anchor="middle">3</text><rect x="314" y="134.9375" width="40" height="9.0625" rx="5" fill="var(--l0)" fill-opacity="0.6" stroke="var(--line)"/><text x="334" y="167" text-anchor="middle">4</text><text x="210" y="192" class="sub" text-anchor="middle">Heads in 4 fair flips</text><text x="14" y="232" text-anchor="start">Continuous: probability is area</text><path d="M30,359.27 L32,359.19 L34,359.10 L36,359.00 L38,358.89 L40,358.77 L42,358.64 L44,358.50 L46,358.35 L48,358.18 L50,358.00 L52,357.80 L54,357.58 L56,357.35 L58,357.10 L60,356.82 L62,356.53 L64,356.21 L66,355.87 L68,355.51 L70,355.11 L72,354.69 L74,354.24 L76,353.76 L78,353.25 L80,352.70 L82,352.12 L84,351.50 L86,350.84 L88,350.15 L90,349.41 L92,348.64 L94,347.82 L96,346.96 L98,346.05 L100,345.10 L102,344.10 L104,343.06 L106,341.97 L108,340.83 L110,339.64 L112,338.41 L114,337.13 L116,335.80 L118,334.42 L120,333.00 L122,331.53 L124,330.02 L126,328.47 L128,326.87 L130,325.24 L132,323.57 L134,321.86 L136,320.12 L138,318.35 L140,316.55 L142,314.74 L144,312.90 L146,311.04 L148,309.17 L150,307.29 L152,305.41 L154,303.53 L156,301.65 L158,299.79 L160,297.93 L162,296.10 L164,294.29 L166,292.50 L168,290.76 L170,289.05 L172,287.38 L174,285.77 L176,284.21 L178,282.71 L180,281.27 L182,279.90 L184,278.60 L186,277.38 L188,276.25 L190,275.19 L192,274.23 L194,273.36 L196,272.58 L198,271.91 L200,271.33 L202,270.85 L204,270.48 L206,270.21 L208,270.05 L210,270.00 L212,270.05 L214,270.21 L216,270.48 L218,270.85 L220,271.33 L222,271.91 L224,272.58 L226,273.36 L228,274.23 L230,275.19 L232,276.25 L234,277.38 L236,278.60 L238,279.90 L240,281.27 L242,282.71 L244,284.21 L246,285.77 L248,287.38 L250,289.05 L252,290.76 L254,292.50 L256,294.29 L258,296.10 L260,297.93 L262,299.79 L264,301.65 L266,303.53 L268,305.41 L270,307.29 L272,309.17 L274,311.04 L276,312.90 L278,314.74 L280,316.55 L282,318.35 L284,320.12 L286,321.86 L288,323.57 L290,325.24 L292,326.87 L294,328.47 L296,330.02 L298,331.53 L300,333.00 L302,334.42 L304,335.80 L306,337.13 L308,338.41 L310,339.64 L312,340.83 L314,341.97 L316,343.06 L318,344.10 L320,345.10 L322,346.05 L324,346.96 L326,347.82 L328,348.64 L330,349.41 L332,350.15 L334,350.84 L336,351.50 L338,352.12 L340,352.70 L342,353.25 L344,353.76 L346,354.24 L348,354.69 L350,355.11 L352,355.51 L354,355.87 L356,356.21 L358,356.53 L360,356.82 L362,357.10 L364,357.35 L366,357.58 L368,357.80 L370,358.00 L372,358.18 L374,358.35 L376,358.50 L378,358.64 L380,358.77 L382,358.89 L384,359.00 L386,359.10 L388,359.19 L390,359.27" class="curve"/><path d="M152,360 L152,305.41 L154,303.53 L156,301.65 L158,299.79 L160,297.93 L162,296.10 L164,294.29 L166,292.50 L168,290.76 L170,289.05 L172,287.38 L174,285.77 L176,284.21 L178,282.71 L180,281.27 L182,279.90 L184,278.60 L186,277.38 L188,276.25 L190,275.19 L192,274.23 L194,273.36 L196,272.58 L198,271.91 L200,271.33 L202,270.85 L204,270.48 L206,270.21 L208,270.05 L210,270.00 L212,270.05 L214,270.21 L216,270.48 L218,270.85 L220,271.33 L222,271.91 L224,272.58 L226,273.36 L228,274.23 L230,275.19 L232,276.25 L234,277.38 L236,278.60 L238,279.90 L240,281.27 L242,282.71 L244,284.21 L246,285.77 L248,287.38 L250,289.05 L252,290.76 L254,292.50 L256,294.29 L258,296.10 L260,297.93 L262,299.79 L264,301.65 L266,303.53 L268,305.41 L268,360 Z" fill="var(--l0)" fill-opacity=".25"/><path d="M30,360 H390" class="axis"/><text x="152" y="385" text-anchor="middle">-1σ</text><text x="210" y="385" text-anchor="middle">μ</text><text x="268" y="385" text-anchor="middle">+1σ</text><text x="210" y="415" text-anchor="middle">Shaded area ≈ 68.3%</text>
</svg>
<figcaption>Top: separate values, each with its own bar. Bottom: a continuous curve, where you get a chance by adding up the area over a range. About 68% of the area sits in the shaded middle.</figcaption>
</figure>

The flat spinner model is called the **uniform distribution**. The fair die is its discrete cousin: six bars of equal height.

## The normal distribution

The bell in that picture is the **normal distribution**. It turns up everywhere, for a reason we'll get to at the end. It has just two settings:

- the **mean**, written $$\mu$$ ("mu"), which sets where the centre is;
- the **standard deviation**, written $$\sigma$$ ("sigma"), which sets how wide it is.

Change the mean and the whole bell slides sideways. Increase $$\sigma$$ and the bell gets wider *and* flatter. It has to get flatter, because the total area has to stay 1.

### Measuring in standard deviations

Here is the useful part. Say exam scores follow a normal curve with mean 100 and SD 10. A score of 120 is 20 points above the mean, which is **2 standard deviations** above it. A score of 90 is 1 SD below.

That "how many SDs away" number is called a **z-score**:

$$
z = \frac{x - \mu}{\sigma}
$$

Subtract the mean to get the distance, then divide by the SD to measure that distance in units of spread. For 120: (120 − 100) / 10 = 2. For 90: −1. A negative z just means below the mean.

Why bother? Because on *every* normal curve, whatever its mean or SD, the same share of the area sits within the same number of SDs of the centre:

- about **68%** within 1 SD,
- about **95%** within 2 SDs,
- about **99.7%** within 3 SDs.

So without knowing anything else about the exam, you know that roughly 95% of scores land between 80 and 120. That rule of thumb is worth memorising. It only holds for things that really are close to normal, though. Incomes, for example, aren't: a few very large values stretch the right side out.

Try it. The axis stays fixed, so you can see the bell move and stretch:

<section id="pb-normal" class="pb-widget" aria-labelledby="pb-normal-title" hidden>
<h3 id="pb-normal-title">Try it: move the bell, count the area</h3>
<p>The shaded area is the chance of a value landing between the two orange markers. The dashed line is the mean.</p>
<div class="pb-controls">
<label for="pb-mu">Mean, μ (where the centre is): <output id="pb-mu-value">0</output><input id="pb-mu" type="range" min="-3" max="3" step="0.5" value="0"></label>
<label for="pb-sigma">Standard deviation, σ (how wide): <output id="pb-sigma-value">1</output><input id="pb-sigma" type="range" min="0.5" max="2" step="0.25" value="1"></label>
<label for="pb-lo">Left end of the range: <output id="pb-lo-value">-1</output><input id="pb-lo" type="range" min="-7" max="7" step="0.25" value="-1"></label>
<label for="pb-hi">Right end of the range: <output id="pb-hi-value">1</output><input id="pb-hi" type="range" min="-7" max="7" step="0.25" value="1"></label>
</div>
<svg id="pb-normal-chart" viewBox="0 0 600 290" role="img" aria-labelledby="pb-normal-chart-title pb-normal-chart-desc"><title id="pb-normal-chart-title">A normal curve with a shaded range</title><desc id="pb-normal-chart-desc"></desc></svg>
<div class="pb-buttons"><button id="pb-normal-reset" type="button">Reset</button></div>
<p id="pb-normal-result" class="pb-result" role="status" aria-live="polite" aria-atomic="true"></p>
<ol><li>Start as it is: mean 0, SD 1, range −1 to 1. About 68% of the area is shaded.</li><li>Widen the range to −2 to 2. About 95%.</li><li>Reset, then raise the SD to 2 without touching the range. The bell spreads out and flattens, and the same range now holds only about 38%.</li><li>Reset, then slide the mean to 2. The bell moves away from your range and the shaded share drops.</li><li>Put both ends on the same number. Zero width, zero area, even though the curve has height there.</li></ol>
</section>
<noscript><p>With JavaScript on, this spot has an interactive bell curve. For a normal curve with mean 0 and SD 1, the area between −1 and 1 is about 68%, and between −2 and 2 about 95%.</p></noscript>

You don't need the equations below to follow the rest of the post. They're here for when you see them somewhere else and want to know what they're doing.

<details markdown="1">
<summary>The equation that draws the bell</summary>

A bell needs three properties. It should be tallest at the centre, drop off on both sides, and have a total area of 1. The normal formula builds those in one at a time:

$$
f(x)=\frac{1}{\sigma\sqrt{2\pi}}\,e^{-\frac12\left(\frac{x-\mu}{\sigma}\right)^2}
$$

Read it from the inside out:

1. $$\frac{x-\mu}{\sigma}$$ is the z-score from above: how many SDs $$x$$ is from the centre.
2. Squaring it makes being 2 SDs *below* the centre count the same as 2 SDs *above*.
3. $$e^{-z^2/2}$$ is 1 at the centre and shrinks quickly as you move away. That's the bell shape. ($$e \approx 2.718$$ and $$\pi \approx 3.14$$ are just constants.)
4. The fraction in front scales the whole thing so the area comes out as exactly 1. It has $$\sigma$$ on the bottom, which is why a wider bell is lower.

$$f(x)$$ is the density at $$x$$, the height of the curve. For mean 0 and SD 1, it's about 0.399 at the centre and 0.242 one SD away. Those are heights, not 39.9% and 24.2% chances. For a chance, you still need area.

</details>

<details markdown="1">
<summary>The equation that counts the area</summary>

The area between two points is "all the area left of the right end" minus "all the area left of the left end".

For the standard normal curve (mean 0, SD 1), the area to the left of a point $$z$$ has its own symbol, $$\Phi(z)$$ ("phi"). About 84.1% of the area is left of 1, and about 15.9% is left of −1. Their difference is 68.3%, the number from the rule of thumb.

For any other normal curve, turn both ends into z-scores first, then subtract:

$$
P(a \le X \le b)=\Phi\!\left(\frac{b-\mu}{\sigma}\right)-\Phi\!\left(\frac{a-\mu}{\sigma}\right)
$$

For the exam example, 90 to 110 becomes −1 to 1, and you get the same 68%. You'll also see $$\Phi$$ called the **cumulative distribution function**, or CDF: "cumulative" because it has added up all the area so far.

</details>

## Why so many things look like bells

Back to the coin, one last time. Instead of counting heads, record the *fraction* of heads in each batch: 3 heads out of 10 flips is 0.3. Then look at the distribution of that fraction.

With one flip per batch, the fraction is either 0 or 1. Two bars, nothing like a bell. With five flips you get six bars and the shape starts to round off. With 30 or 100 it looks very much like a bell, and the bars bunch up tighter around the middle.

<section id="pb-clt" class="pb-widget" aria-labelledby="pb-clt-title" hidden>
<h3 id="pb-clt-title">Try it: average more flips</h3>
<p>Bars are the exact chances for the fraction of heads in one batch. The purple dashed curve is a bell with the same centre and spread. The horizontal axis stays fixed from 0 to 1, so you can see the shape narrow.</p>
<div class="pb-controls">
<label for="pb-clt-n">Flips averaged per batch: <output id="pb-clt-n-value">1</output><input id="pb-clt-n" type="range" min="0" max="7" step="1" value="0"></label>
<label for="pb-clt-q">Chance of heads on each flip: <output id="pb-clt-q-value">50%</output><input id="pb-clt-q" type="range" min="5" max="95" step="5" value="50"></label>
</div>
<svg id="pb-clt-chart" viewBox="0 0 600 290" role="img" aria-labelledby="pb-clt-chart-title pb-clt-chart-desc"><title id="pb-clt-chart-title">Distribution of the fraction of heads in a batch</title><desc id="pb-clt-chart-desc"></desc></svg>
<div class="pb-legend"><span><i style="background:var(--l0)"></i>exact chance</span><span><i style="background:var(--l3)"></i>bell-curve approximation</span></div>
<p id="pb-clt-result" class="pb-result" role="status" aria-live="polite" aria-atomic="true"></p>
<ol><li>Step the number of flips up from 1 to 400. The bars turn into a bell, and the bell gets narrower.</li><li>At 100 flips, read the "95% of batches" range below the chart: roughly 40% to 60%.</li><li>Set the heads chance to 5% and go back to 10 flips. The bars are lopsided and the bell is a poor fit. Push the flips up again and watch how many it takes before the bell fits.</li></ol>
</section>
<noscript><p>With JavaScript on, this spot has an interactive chart. Without it: the fraction of heads in 100 fair flips lands between about 40% and 60% in 95% of batches, and its distribution is very close to a bell.</p></noscript>

Two separate things are happening there, and both matter a lot in practice.

**The shape turns into a bell.** Averages of many independent pieces tend towards a normal distribution, even when each piece looks nothing like a bell. Each flip here is just a 0 or a 1. This is the **central limit theorem**, and it's the reason the normal curve shows up so often: plenty of real measurements are, in effect, sums or averages of many small independent things. How many pieces you need depends on what you start with. A lopsided coin needs far bigger batches before the bell fits, as you saw.

**The bell gets narrower.** The more flips you average, the less the average wobbles from batch to batch. The spread of an average has its own name, the **standard error** (SE):

$$
SE = \frac{\sigma}{\sqrt{n}}
$$

Here $$\sigma$$ is the SD of one single observation and $$n$$ is how many you average. A single fair flip, recorded as 0 or 1, has $$\sigma = 0.5$$. Average 100 flips and the SE is 0.5 / √100 = 0.05, so the fraction of heads typically lands within about 5 percentage points of 50%, and 95% of the time within about two SEs, between 40% and 60%. Average 400 flips and the SE drops to 2.5 points.

Look at the square root. Four times the data only halves the wobble. Getting more precise gets expensive quickly, which is the whole reason A/B tests need so many users.

Standard deviation and standard error are easy to mix up, so to be explicit:

- **Standard deviation** is the spread of individual results: single flips, single people.
- **Standard error** is the spread of an *average*, if you repeated the whole batch many times.

## Cheat sheet

| Idea | In one line |
|---|---|
| Probability | Count what you want, divide by everything possible (if all outcomes are equally likely) |
| Long run | A probability describes many tries, not the next few |
| Not | 1 minus the chance that it happens |
| Or | Add the chances, then subtract the overlap |
| And | Multiply, but only if the events are independent |
| Given | New information shrinks the list you count from |
| Independent | Learning one thing doesn't change the chance of the other |
| Distribution | Every possible value with its chance, adding up to 1 |
| Binomial | (Number of ways) × (chance of each way), for n yes/no tries |
| Expected value | The long-run average |
| Standard deviation | How far a typical result lands from the centre |
| Density | Height of a curve. Probability is the area under it |
| Normal | A bell set by its mean and SD. 68 / 95 / 99.7% within 1 / 2 / 3 SDs |
| Central limit theorem | Averages of many independent pieces come out bell-shaped |
| Standard error | How much an average wobbles: σ / √n |

## Further reading

- OpenStax, *Introductory Statistics 2e*: [probability terminology](https://openstax.org/books/introductory-statistics-2e/pages/3-1-terminology) and [two basic rules](https://openstax.org/books/introductory-statistics-2e/pages/3-3-two-basic-rules-of-probability).
- OpenStax, [the binomial distribution](https://openstax.org/books/introductory-statistics-2e/pages/4-3-binomial-distribution).
- OpenStax, [continuous probability density](https://openstax.org/books/introductory-business-statistics-2e/pages/5-1-properties-of-continuous-probability-density-functions) and [the standard normal distribution](https://openstax.org/books/introductory-statistics-2e/pages/6-1-the-standard-normal-distribution).
- OpenStax, [the central limit theorem for sample means](https://openstax.org/books/introductory-statistics-2e/pages/7-1-the-central-limit-theorem-for-sample-means-averages).

<script>
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const SVG = 'http://www.w3.org/2000/svg';
  function node(tag, attrs, text) {
    const el = document.createElementNS(SVG, tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    if (text !== undefined) el.textContent = text;
    return el;
  }
  function label(svg, x, y, text, anchor = 'middle', fill = 'var(--muted)') {
    svg.append(node('text', { x, y, 'text-anchor': anchor, fill, 'font-size': 15 }, text));
  }
  function reset(svg, title, desc) {
    svg.replaceChildren(node('title', { id: svg.id + '-title' }, title), node('desc', { id: svg.id + '-desc' }, desc));
    svg.setAttribute('aria-labelledby', svg.id + '-title ' + svg.id + '-desc');
  }
  const pct = (x, d = 1) => (100 * x).toFixed(d) + '%';
  function choose(n, k) { let c = 1; for (let i = 1; i <= k; i++) c = c * (n - i + 1) / i; return c; }
  function binomial(n, q) { return Array.from({ length: n + 1 }, (_, k) => choose(n, k) * q ** k * (1 - q) ** (n - k)); }
  function cdf(z) {
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const tail = Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI) * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
    return z < 0 ? tail : 1 - tail;
  }

  // 1. Law of large numbers: running share of even die rolls.
  (() => {
    const root = $('pb-lln'), chart = $('pb-lln-chart');
    let shares = [], evens = 0, last = null;
    const L = 60, R = 580, T = 30, B = 220;
    function draw() {
      const n = shares.length;
      reset(chart, 'Running share of even rolls', n ? 'After ' + n + ' rolls, ' + pct(evens / n) + ' were even.' : 'No rolls yet.');
      const span = Math.max(n, 10), x = i => L + (i / span) * (R - L), y = s => B - s * (B - T);
      [0, 0.25, 0.5, 0.75, 1].forEach(s => {
        chart.append(node('line', { x1: L, x2: R, y1: y(s), y2: y(s), stroke: 'var(--line)' }));
        label(chart, L - 8, y(s) + 5, (s * 100) + '%', 'end');
      });
      chart.append(node('line', { x1: L, x2: R, y1: y(0.5), y2: y(0.5), stroke: 'var(--muted)', 'stroke-dasharray': '6 5', 'stroke-width': 1.5 }));
      label(chart, R, y(0.5) - 12, 'true chance 50%', 'end');
      if (n) {
        const step = Math.max(1, Math.ceil(n / 700));
        let d = '';
        for (let i = 0; i < n; i += step) d += (d ? ' L' : 'M') + x(i + 1).toFixed(1) + ',' + y(shares[i]).toFixed(1);
        d += ' L' + x(n).toFixed(1) + ',' + y(shares[n - 1]).toFixed(1);
        chart.append(node('path', { d, fill: 'none', stroke: 'var(--l0)', 'stroke-width': 2.5, 'stroke-linejoin': 'round' }));
        chart.append(node('circle', { cx: x(n), cy: y(shares[n - 1]), r: 5, fill: 'var(--l0)' }));
      }
      chart.append(node('line', { x1: L, x2: R, y1: B, y2: B, stroke: 'var(--muted)' }));
      label(chart, L, B + 22, '0', 'middle'); label(chart, R, B + 22, span.toLocaleString('en-US'), 'end');
      label(chart, (L + R) / 2, B + 44, 'number of rolls so far');
      $('pb-lln-result').textContent = n
        ? 'Rolls: ' + n.toLocaleString('en-US') + '. Even: ' + evens.toLocaleString('en-US') + ' (' + pct(evens / n) + '). Last roll: ' + last + '.'
        : 'No rolls yet. Press a button to start.';
    }
    function roll(times) {
      for (let i = 0; i < times && shares.length < 50000; i++) {
        last = 1 + Math.floor(Math.random() * 6);
        if (last % 2 === 0) evens++;
        shares.push(evens / (shares.length + 1));
      }
      draw();
    }
    [1, 10, 100, 1000].forEach(t => $('pb-lln-' + t).addEventListener('click', () => roll(t)));
    $('pb-lln-reset').addEventListener('click', () => { shares = []; evens = 0; last = null; draw(); });
    draw(); root.hidden = false;
  })();

  // 2. Binomial: exact chances, expected value and simulated batches.
  (() => {
    const root = $('pb-binomial'), chart = $('pb-binomial-chart');
    let counts = [], batches = 0, last = null;
    function settings() { return [Number($('pb-n').value), Number($('pb-q').value) / 100]; }
    function draw() {
      const [n, q] = settings(), probs = binomial(n, q);
      $('pb-n-value').textContent = n; $('pb-q-value').textContent = Math.round(q * 100) + '%';
      reset(chart, 'Exact binomial chances and simulated frequencies', n + ' flips per batch, ' + Math.round(q * 100) + '% heads. Expected heads ' + (n * q).toFixed(2) + '. ' + batches + ' simulated batches.');
      const top = Math.max(...probs, ...counts.map(c => batches ? c / batches : 0)) * 1.08;
      const L = 60, R = 580, B = 225, T = 35, w = (R - L) / (n + 1);
      const x = k => L + k * w, y = p => B - p / top * (B - T);
      [0, 0.5, 1].forEach(f => {
        chart.append(node('line', { x1: L, x2: R, y1: y(top * f), y2: y(top * f), stroke: 'var(--line)' }));
        label(chart, L - 8, y(top * f) + 5, pct(top * f, 0), 'end');
      });
      for (let k = 0; k <= n; k++) {
        const g = node('g', { tabindex: 0 });
        g.append(node('title', {}, k + ' heads: exact ' + pct(probs[k], 2) + (batches ? '; simulated ' + pct(counts[k] / batches, 2) : '')));
        g.append(node('rect', { x: x(k) + Math.min(3, w * 0.15), y: y(probs[k]), width: Math.max(1, w - 2 * Math.min(3, w * 0.15)), height: B - y(probs[k]), fill: 'var(--l0)', opacity: 0.75, rx: 2 }));
        if (batches) g.append(node('circle', { cx: x(k) + w / 2, cy: y(counts[k] / batches), r: 4.5, fill: 'var(--l2)', stroke: 'var(--bg)', 'stroke-width': 1.5 }));
        chart.append(g);
        if (n <= 15 || k % 5 === 0) label(chart, x(k) + w / 2, B + 22, k);
      }
      const mx = L + (n * q + 0.5) * w;
      chart.append(node('line', { x1: mx, x2: mx, y1: T - 10, y2: B, stroke: 'var(--fg)', 'stroke-dasharray': '5 4', 'stroke-width': 1.5 }));
      label(chart, mx, T - 16, 'average ' + (n * q).toFixed(1), mx > 460 ? 'end' : mx < 140 ? 'start' : 'middle', 'var(--fg)');
      chart.append(node('line', { x1: L, x2: R, y1: B, y2: B, stroke: 'var(--muted)' }));
      label(chart, (L + R) / 2, B + 48, 'number of heads in one batch');
      $('pb-binomial-result').textContent = 'Expected heads: ' + (n * q).toFixed(2) + '. Standard deviation: ' + Math.sqrt(n * q * (1 - q)).toFixed(2) + ' heads. Simulated batches: ' + batches + '.' + (batches ? ' Last batch: ' + last + ' heads.' : '');
    }
    function clear() { counts = Array(Number($('pb-n').value) + 1).fill(0); batches = 0; last = null; draw(); }
    function simulate(times) {
      const [n, q] = settings();
      for (let i = 0; i < times; i++) { last = 0; for (let j = 0; j < n; j++) last += Math.random() < q ? 1 : 0; counts[last]++; batches++; }
      draw();
    }
    ['pb-n', 'pb-q'].forEach(id => $(id).addEventListener('input', clear));
    $('pb-sim-one').addEventListener('click', () => simulate(1));
    $('pb-sim-many').addEventListener('click', () => simulate(100));
    $('pb-reset').addEventListener('click', clear);
    clear(); root.hidden = false;
  })();

  // 3. Normal curve on a fixed axis, so moving and widening the bell is visible.
  (() => {
    const root = $('pb-normal'), chart = $('pb-normal-chart');
    const MIN = -7, MAX = 7, PEAK = 0.82, L = 40, R = 580, T = 30, B = 225;
    const x = v => L + (v - MIN) / (MAX - MIN) * (R - L);
    function draw(changed) {
      const mu = Number($('pb-mu').value), sigma = Number($('pb-sigma').value);
      let lo = Number($('pb-lo').value), hi = Number($('pb-hi').value);
      if (lo > hi) { if (changed === 'pb-lo') { $('pb-hi').value = lo; hi = lo; } else { $('pb-lo').value = hi; lo = hi; } }
      [['pb-mu', mu], ['pb-sigma', sigma], ['pb-lo', lo], ['pb-hi', hi]].forEach(([id, v]) => $(id + '-value').textContent = v);
      const dens = v => Math.exp(-0.5 * ((v - mu) / sigma) ** 2) / (sigma * Math.sqrt(2 * Math.PI));
      const y = v => B - dens(v) / PEAK * (B - T);
      const prob = lo === hi ? 0 : cdf((hi - mu) / sigma) - cdf((lo - mu) / sigma);
      reset(chart, 'A normal curve with a shaded range', 'Mean ' + mu + ', standard deviation ' + sigma + '. The range ' + lo + ' to ' + hi + ' holds ' + pct(prob) + ' of the area.');
      let d = 'M' + x(lo) + ',' + B;
      for (let i = 0; i <= 200; i++) { const v = lo + (hi - lo) * i / 200; d += ' L' + x(v).toFixed(1) + ',' + y(v).toFixed(1); }
      chart.append(node('path', { d: d + ' L' + x(hi) + ',' + B + ' Z', fill: 'var(--l0)', opacity: 0.25 }));
      d = '';
      for (let i = 0; i <= 500; i++) { const v = MIN + (MAX - MIN) * i / 500; d += (i ? ' L' : 'M') + x(v).toFixed(1) + ',' + y(v).toFixed(1); }
      chart.append(node('path', { d, fill: 'none', stroke: 'var(--l0)', 'stroke-width': 2.5 }));
      chart.append(node('line', { x1: L, x2: R, y1: B, y2: B, stroke: 'var(--muted)' }));
      chart.append(node('line', { x1: x(mu), x2: x(mu), y1: y(mu) - 6, y2: B, stroke: 'var(--muted)', 'stroke-dasharray': '5 5' }));
      [lo, hi].forEach(v => chart.append(node('line', { x1: x(v), x2: x(v), y1: T, y2: B, stroke: 'var(--l2)', 'stroke-width': 2 })));
      label(chart, (x(lo) + x(hi)) / 2, T - 8, pct(prob), 'middle', 'var(--fg)');
      for (let v = MIN; v <= MAX; v++) {
        chart.append(node('line', { x1: x(v), x2: x(v), y1: B, y2: B + 5, stroke: 'var(--muted)' }));
        if (Math.abs(v) % 2 === 1 || v === 0) label(chart, x(v), B + 22, v);
      }
      label(chart, (L + R) / 2, B + 48, 'value');
      $('pb-normal-result').textContent = 'Chance of landing between ' + lo + ' and ' + hi + ': ' + pct(prob, 2) + '. As z-scores, that range runs from ' + ((lo - mu) / sigma).toFixed(2) + ' to ' + ((hi - mu) / sigma).toFixed(2) + '. Curve height at the mean: ' + dens(mu).toFixed(3) + ' (a density, not a chance).';
    }
    ['pb-mu', 'pb-sigma', 'pb-lo', 'pb-hi'].forEach(id => $(id).addEventListener('input', () => draw(id)));
    $('pb-normal-reset').addEventListener('click', () => { [['pb-mu', 0], ['pb-sigma', 1], ['pb-lo', -1], ['pb-hi', 1]].forEach(([id, v]) => $(id).value = v); draw(); });
    draw(); root.hidden = false;
  })();

  // 4. Central limit theorem: fraction of heads in a batch, on a fixed 0..1 axis.
  (() => {
    const root = $('pb-clt'), chart = $('pb-clt-chart');
    const SIZES = [1, 2, 5, 10, 30, 100, 200, 400], L = 60, R = 580, T = 30, B = 225;
    const x = f => L + f * (R - L);
    function draw() {
      const n = SIZES[Number($('pb-clt-n').value)], q = Number($('pb-clt-q').value) / 100;
      $('pb-clt-n-value').textContent = n; $('pb-clt-q-value').textContent = Math.round(q * 100) + '%';
      const probs = binomial(n, q), se = Math.sqrt(q * (1 - q) / n);
      const bell = f => Math.exp(-0.5 * ((f - q) / se) ** 2) / (se * Math.sqrt(2 * Math.PI)) / n;
      const top = Math.max(...probs, bell(q)) * 1.08, y = p => B - p / top * (B - T);
      reset(chart, 'Distribution of the fraction of heads in a batch', n + ' flips per batch at ' + Math.round(q * 100) + '% heads. Standard error ' + pct(se) + '.');
      const w = Math.max(1.2, Math.min(36, (R - L) / (n + 1) * 0.8));
      probs.forEach((p, k) => {
        if (p < top * 0.002) return;
        const g = node('g', { tabindex: 0 });
        g.append(node('title', {}, k + ' of ' + n + ' heads (' + pct(k / n) + '): chance ' + pct(p, 2)));
        g.append(node('rect', { x: x(k / n) - w / 2, y: y(p), width: w, height: B - y(p), fill: 'var(--l0)', opacity: 0.75 }));
        chart.append(g);
      });
      let d = '';
      for (let i = 0; i <= 400; i++) { const f = i / 400; d += (i ? ' L' : 'M') + x(f).toFixed(1) + ',' + Math.max(T - 20, y(bell(f))).toFixed(1); }
      chart.append(node('path', { d, fill: 'none', stroke: 'var(--l3)', 'stroke-width': 2.5, 'stroke-dasharray': '7 5' }));
      chart.append(node('line', { x1: L, x2: R, y1: B, y2: B, stroke: 'var(--muted)' }));
      [0, 0.25, 0.5, 0.75, 1].forEach(f => label(chart, x(f), B + 22, pct(f, 0)));
      label(chart, (L + R) / 2, B + 48, 'fraction of heads in one batch');
      const lo = Math.max(0, q - 1.96 * se), hi = Math.min(1, q + 1.96 * se);
      $('pb-clt-result').textContent = 'Batches of ' + n + ': centre ' + pct(q, 0) + ', standard error ' + (100 * se).toFixed(1) + ' percentage points. About 95% of batches land between ' + pct(lo, 0) + ' and ' + pct(hi, 0) + (n < 30 || n * Math.min(q, 1 - q) < 10 ? ' (the bell is still a rough fit here).' : '.');
    }
    ['pb-clt-n', 'pb-clt-q'].forEach(id => $(id).addEventListener('input', draw));
    draw(); root.hidden = false;
  })();
})();
</script>
