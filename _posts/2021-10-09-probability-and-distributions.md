---
layout: post
title: "Before the p-value: probability and distributions, one step at a time"
date: 2021-10-09
math: true
tags:
- exp
- data
summary: "Start with a die and a coin. Learn what probability counts, what a distribution shows, and why a bell curve is an area, not a bar chart."
---

You flip a coin and get heads. You flip again and get heads again. Is the third flip "due" to be tails?

No, if the coin is fair and the flips are independent. The coin doesn't keep a ledger. But that answer is easier to remember when you understand what probability is describing.

This is a short starting point for [p-values and statistical tests]({% post_url 2021-10-16-p-values-and-statistical-tests %}). No background needed. We'll count a few simple outcomes, turn the counts into a picture, and then give the picture a formula. The widgets are part of the explanation: try the small changes suggested beside them.

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

## One yes/no trial: Bernoulli

Call heads a *success* and tails a *failure*. These are just labels; "success" can mean a broken part or a failed payment if that's the event you want to count.

**Step 1:** record a success as 1 and a failure as 0.

**Step 2:** give success probability q, so failure has probability 1 - q.

$$
P(X=1)=q,\qquad P(X=0)=1-q
$$

That's a **Bernoulli distribution**: two values and two probabilities. For a fair coin, q = 0.5. For a conversion model, q might be 0.10. The letter q here is an event probability, not a p-value.

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

## Why bell curves appear in tests

The measurements themselves don't have to look like a bell for an average to have an approximately bell-shaped **sampling distribution**.

**Step 1:** imagine repeatedly taking a fresh sample of n independent observations from the same population.

**Step 2:** calculate the average of each sample. Now picture the distribution of those averages, not the distribution of individual observations.

**Step 3:** with a finite population variance and suitable sampling conditions, this distribution becomes approximately normal as n grows. That's the **central limit theorem**. There is no universal sample size that makes it accurate for every population.

If individual observations have standard deviation sigma, the sample average has standard error:

$$
SE(\bar X)=\frac{\sigma}{\sqrt n}
$$

$$\bar X$$ means the sample average. **Standard deviation** describes individual observations; **standard error** describes how an estimate wobbles across samples. More independent data reduce that wobble. In practice we usually estimate sigma from the sample.

For coin flips encoded as 0 or 1, the average is the fraction of heads. For conversions it's the conversion rate. This is why the [p-values article]({% post_url 2021-10-16-p-values-and-statistical-tests %}) can move from exact coin bars to an approximate bell curve for a large experiment.

## Keep these distinctions

1. **Outcome vs event:** one result vs the collection that answers your question.
2. **Probability vs frequency:** the model's chance vs the fraction seen in a finite sample.
3. **Conditional vs independent:** information can change the chance; independence says this information doesn't.
4. **Discrete vs continuous:** probabilities on separate values vs areas over intervals.
5. **Distribution vs one probability:** the whole picture vs one part of it.
6. **Standard deviation vs standard error:** spread of observations vs wobble of an estimate.

Next, a p-value asks us to pick a distribution under a specific assumption and count the unusual results. The coin bars and shaded areas you've just used are the pieces of that story.

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
