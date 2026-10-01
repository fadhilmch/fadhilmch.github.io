---
layout: post
title: "Real or luck? P-values, significance and statistical tests"
date: 2021-10-16
math: true
tags:
- exp
- data
summary: "How to tell a real difference from random noise. We start with ten coin flips you can count by hand, then use exactly the same idea on an A/B test."
---

You change the colour of a Buy button. With the old button, 1,000 out of 10,000 people buy. With the new one, 1,080 out of 10,000 do. The new button looks better.

But if you'd shown the *old* button to two different groups of 10,000 people, you wouldn't have got the same number twice either. People are random. One week 1,000 buy, another week 1,040. So is the extra 80 the button, or just the usual noise?

That's the question statistical tests answer, and p-values are how they report the answer. I've read the textbook definition of a p-value many times and it still slipped out of my head every time. So in this post I build it up from something small enough to count by hand, ten coin flips, and then take exactly the same idea back to the button.

If words like *distribution*, *standard deviation* or *normal curve* are new to you, my [probability post]({{ '/posts/probability-and-distributions/' | relative_url }}) covers them from scratch. You can also just read on. I explain each one briefly when it first comes up.

<style>
.fig.learn-fig { overflow:visible; }
.fig.learn-fig svg { width:100%; min-width:0; max-width:500px; height:auto; }
.learn-fig text { fill:var(--fg); font:16px 'Geist Mono',monospace; }
.learn-fig .sub { fill:var(--muted); font-size:14px; }
.learn-fig .accent { fill:var(--l0); }
.learn-fig .warm { fill:var(--l3); }
.learn-fig .axis { stroke:var(--muted); fill:none; }
.pv-widget { margin:32px 0; padding:20px; border:1px solid var(--line); border-radius:8px; background:var(--panel); }
.pv-widget[hidden] { display:none; }
.prose .pv-widget h3 { margin:0 0 8px; }
.prose .pv-widget p, .prose .pv-widget li { font-size:14.5px; }
.pv-widget .pv-controls { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; margin:16px 0; }
.pv-widget label { display:block; font-size:14px; }
.pv-widget input[type=range], .pv-widget select { width:100%; min-width:0; box-sizing:border-box; min-height:44px; accent-color:var(--l0); }
.pv-widget select, .pv-widget button { border:1px solid var(--line); border-radius:4px; color:var(--fg); background:var(--bg); font:inherit; font-size:14px; padding:8px 12px; min-height:44px; cursor:pointer; }
.pv-widget button:hover { border-color:var(--l0); }
.pv-widget button:disabled { opacity:.5; cursor:default; }
.pv-widget :focus-visible { outline:2px solid var(--l0); outline-offset:3px; }
.pv-widget .pv-buttons { display:flex; flex-wrap:wrap; gap:8px; margin:12px 0; }
.pv-widget .pv-check { display:flex; align-items:center; gap:8px; min-height:44px; }
.pv-widget .pv-check input { width:20px; height:20px; accent-color:var(--l3); }
.pv-widget .pv-note { color:var(--muted); }
.pv-widget .pv-result { border-top:1px solid var(--line); padding-top:12px; font-family:'Geist Mono',monospace; font-size:13.5px; overflow-wrap:anywhere; }
.pv-widget .pv-bars { display:grid; grid-template-columns:repeat(11,minmax(0,1fr)); gap:3px; height:180px; align-items:end; margin:20px 0 8px; }
.pv-widget .pv-bar { padding:0; border:0; background:transparent; height:100%; min-height:0; display:flex; flex-direction:column; justify-content:end; align-items:stretch; }
.pv-widget .pv-bar span { display:block; background:var(--line); border:1px solid var(--muted); min-height:2px; box-sizing:border-box; }
.pv-widget .pv-bar[data-tail="true"] span { background:var(--l0); border-color:var(--l0); }
.pv-widget .pv-bar[aria-pressed="true"] { outline:2px solid var(--fg); outline-offset:1px; }
.pv-widget .pv-bar small { font-size:12px; padding:6px 0; }
.pv-widget svg { display:block; width:100%; height:auto; margin:8px 0; }
.pv-widget svg text { font-family:'Geist Mono',monospace; }
.pv-widget .pv-legend { display:flex; gap:6px 16px; flex-wrap:wrap; font-size:13px; color:var(--muted); }
.pv-widget .pv-legend i { display:inline-block; width:12px; height:12px; border-radius:2px; margin-right:6px; vertical-align:-1px; }
.pv-build .build-flips { display:flex; gap:6px; flex-wrap:wrap; margin:16px 0; }
.pv-build .build-flips span { width:28px; height:32px; display:grid; place-items:center; border:1px solid var(--muted); border-radius:4px; font-family:'Geist Mono',monospace; }
.pv-build .build-flips .heads { background:var(--l0); border-color:var(--l0); color:var(--bg); }
.pv-build .build-chart { display:grid; grid-template-columns:repeat(11,minmax(0,1fr)); gap:4px; margin:12px 0 4px; }
.pv-build .build-cell { text-align:center; font-size:12px; }
.pv-build .build-track { position:relative; height:170px; border-bottom:1px solid var(--muted); }
.pv-build .build-bar { position:absolute; bottom:0; width:100%; background:var(--line); border-radius:2px 2px 0 0; transition:height .12s; }
.pv-build .build-cell.edge .build-bar { background:var(--l0); }
.pv-build .build-model { position:absolute; left:-2px; right:-2px; border-top:2px dashed var(--l3); z-index:1; }
.pv-build .build-count { display:block; font-size:11px; color:var(--muted); padding-top:2px; }
.pv-build .build-scale { font-size:12px; color:var(--muted); font-family:'Geist Mono',monospace; }
@media(max-width:480px) { .pv-widget svg text { font-size:20px; } .pv-widget { padding:14px; } .pv-widget .pv-controls { grid-template-columns:1fr; gap:6px; } .pv-build .build-count { font-size:9px; } }
</style>

## The idea in one paragraph

Before any maths, here's the whole trick. **Assume nothing interesting is going on. Work out how often pure chance would give you a result at least as extreme as yours. If that's rare, start doubting the "nothing is going on" story.**

It's the same logic as a courtroom. The defendant is presumed innocent. The question the jury asks is: *if they really were innocent, how surprising would this evidence be?* Their fingerprints on the window: a bit surprising, but there could be an innocent reason. Fingerprints, CCTV footage and the stolen laptop in their car: so surprising that "innocent" stops being believable. A p-value is a number for exactly that: how surprising your data would be if nothing were going on.

Everything else in this post is detail around that one move.

## Ten coin flips

A friend hands you a coin and says it's fair. You flip it 10 times and get **8 heads**. Do you believe them?

### Step 1: assume the boring explanation

The boring explanation is "the coin is fair": a 50% chance of heads on every flip, and each flip ignores the ones before it. In statistics the boring explanation is called the **null hypothesis**, written $$H_0$$. "Null" as in no effect, nothing going on.

We're not saying we believe it. We're adopting it for a moment so we can ask a question we can actually answer: *what does a fair coin do?*

### Step 2: watch what a fair coin does

The quickest way to get a feel for it is to watch. Below, one "trial" is 10 flips of a fair coin. Each finished trial adds one to the bar for its number of heads. Run a few hundred.

<section class="pv-widget pv-build" id="pv-build" aria-labelledby="pv-build-title" hidden>
<h3 id="pv-build-title">Try it: what does a fair coin do in 10 flips?</h3>
<p>The ten boxes are the current trial. Bars count finished trials by number of heads. The purple dashed marks are the exact fair-coin chances, which the bars should drift towards. The blue bars are the "8 heads or something even more lopsided" results we'll care about in a moment.</p>
<div class="build-flips" id="build-flips" aria-label="Flips in the current trial"></div>
<div class="pv-buttons">
<button id="build-step" type="button">Flip once</button>
<button id="build-play" type="button">Play 100 trials</button>
<button id="build-pause" type="button" disabled>Pause</button>
<button id="build-fast" type="button">Add 1,000 trials instantly</button>
<button id="build-reset" type="button">Start over</button>
</div>
<p class="build-scale" id="build-scale"></p>
<div id="build-chart" class="build-chart" role="img" aria-label="Histogram of finished trials"></div>
<p class="pv-note" style="text-align:center;font-size:13px;margin-top:4px">number of heads in one trial of 10 flips</p>
<p class="pv-result" id="build-status" role="status" aria-live="polite" aria-atomic="true"></p>
</section>
<noscript><p>With JavaScript on, this spot has a coin-flipping simulation. The exact chart a few paragraphs down shows what it converges to.</p></noscript>

A few things jump out. Five heads is the most common result, but it only happens about a quarter of the time. Four and six are close behind. Eight or more is rare, but not unheard of: a perfectly fair coin produces it every now and then.

We can also get the exact numbers instead of simulating. Each flip has 2 outcomes, so ten flips can come out in 2 × 2 × ... × 2 = 2¹⁰ = 1,024 different orders. With a fair coin, every one of those orders is equally likely.

<figure class="fig learn-fig">
<svg viewBox="0 0 420 385" role="img" aria-labelledby="pv-double-t pv-double-d">
<title id="pv-double-t">Ten flips create 1024 sequences</title>
<desc id="pv-double-d">One flip gives two sequences, two gives four, three gives eight and ten gives 1024. The displayed third-flip sequences are only the four beginning with H.</desc>
<text x="14" y="26" text-anchor="start">Each extra flip doubles the sequence list</text><rect x="12" y="49" width="396" height="66" rx="5" fill="var(--panel)" fill-opacity="1" stroke="var(--line)"/><text x="26" y="73" text-anchor="start">1 flip: 2 sequences</text><text x="26" y="97" class="sub" text-anchor="start">H · T</text><rect x="12" y="131" width="396" height="66" rx="5" fill="var(--panel)" fill-opacity="1" stroke="var(--line)"/><text x="26" y="155" text-anchor="start">2 flips: 4 sequences</text><text x="26" y="179" class="sub" text-anchor="start">HH · HT · TH · TT</text><rect x="12" y="213" width="396" height="66" rx="5" fill="var(--panel)" fill-opacity="1" stroke="var(--line)"/><text x="26" y="237" text-anchor="start">3 flips: 8 sequences</text><text x="26" y="261" class="sub" text-anchor="start">HHH · HHT · HTH · HTT</text><text x="210" y="289" class="sub" text-anchor="middle">… keep doubling …</text><rect x="12" y="295" width="396" height="66" rx="5" fill="var(--panel)" fill-opacity="1" stroke="var(--line)"/><text x="26" y="319" text-anchor="start">10 flips: 1,024 sequences</text><text x="26" y="343" class="sub" text-anchor="start">2¹⁰ = multiply ten copies of 2</text>
</svg>
<figcaption>Each extra flip doubles the number of possible orders. With ten flips there are 1,024, all equally likely if the coin is fair.</figcaption>
</figure>

Now sort those 1,024 orders by how many heads they contain. 252 of them have exactly 5 heads. 45 have exactly 8. 10 have 9, and only 1 has 10 (HHHHHHHHHH). Divide each count by 1,024 and you get the chart below, which is what your simulation was heading towards.

<figure class="fig">
<svg viewBox="0 0 680 252" role="img" aria-labelledby="p1t p1d">
  <title id="p1t">How often a fair coin gives each number of heads in 10 flips</title>
  <desc id="p1d">Bar chart of the binomial distribution for 10 fair flips. 5 heads is most likely at 24.6%. The bars for 8, 9 and 10 heads are highlighted; together they have probability 5.5%. The mirror bars for 0, 1 and 2 heads are also marked, bringing the two-sided total to 10.9%.</desc>
  <line class="grid" x1="60" x2="650" y1="200" y2="200"/>
  <g tabindex="0"><title>0 heads: 0.1%</title><rect class="fa" x="66.0" y="199.4" width="41.6" height="0.6" rx="2"/></g>
  <text class="m" x="86.8" y="216" text-anchor="middle">0</text>
  <g tabindex="0"><title>1 heads: 1.0%</title><rect class="fa" x="119.6" y="193.6" width="41.6" height="6.4" rx="2"/></g>
  <text class="m" x="140.5" y="216" text-anchor="middle">1</text>
  <g tabindex="0"><title>2 heads: 4.4%</title><rect class="fa" x="173.3" y="171.3" width="41.6" height="28.7" rx="2"/></g>
  <text class="m" x="194.1" y="216" text-anchor="middle">2</text>
  <text class="m" x="194.1" y="165.3" text-anchor="middle">4.4%</text>
  <g tabindex="0"><title>3 heads: 11.7%</title><rect style="fill:var(--line)" x="226.9" y="123.4" width="41.6" height="76.6" rx="2"/></g>
  <text class="m" x="247.7" y="216" text-anchor="middle">3</text>
  <text class="m" x="247.7" y="117.4" text-anchor="middle">11.7%</text>
  <g tabindex="0"><title>4 heads: 20.5%</title><rect style="fill:var(--line)" x="280.5" y="65.9" width="41.6" height="134.1" rx="2"/></g>
  <text class="m" x="301.4" y="216" text-anchor="middle">4</text>
  <text class="m" x="301.4" y="59.9" text-anchor="middle">20.5%</text>
  <g tabindex="0"><title>5 heads: 24.6%</title><rect style="fill:var(--line)" x="334.2" y="39.1" width="41.6" height="160.9" rx="2"/></g>
  <text class="m" x="355.0" y="216" text-anchor="middle">5</text>
  <text class="m" x="355.0" y="33.1" text-anchor="middle">24.6%</text>
  <g tabindex="0"><title>6 heads: 20.5%</title><rect style="fill:var(--line)" x="387.8" y="65.9" width="41.6" height="134.1" rx="2"/></g>
  <text class="m" x="408.6" y="216" text-anchor="middle">6</text>
  <text class="m" x="408.6" y="59.9" text-anchor="middle">20.5%</text>
  <g tabindex="0"><title>7 heads: 11.7%</title><rect style="fill:var(--line)" x="441.5" y="123.4" width="41.6" height="76.6" rx="2"/></g>
  <text class="m" x="462.3" y="216" text-anchor="middle">7</text>
  <text class="m" x="462.3" y="117.4" text-anchor="middle">11.7%</text>
  <g tabindex="0"><title>8 heads: 4.4%</title><rect class="fa" x="495.1" y="171.3" width="41.6" height="28.7" rx="2"/></g>
  <text class="m" x="515.9" y="216" text-anchor="middle">8</text>
  <text class="m" x="515.9" y="165.3" text-anchor="middle">4.4%</text>
  <g tabindex="0"><title>9 heads: 1.0%</title><rect class="fa" x="548.7" y="193.6" width="41.6" height="6.4" rx="2"/></g>
  <text class="m" x="569.5" y="216" text-anchor="middle">9</text>
  <g tabindex="0"><title>10 heads: 0.1%</title><rect class="fa" x="602.4" y="199.4" width="41.6" height="0.6" rx="2"/></g>
  <text class="m" x="623.2" y="216" text-anchor="middle">10</text>
  <text class="m" x="650" y="234" text-anchor="end">number of heads in 10 flips</text>
  <text class="ta" x="650" y="60" text-anchor="end">8, 9 or 10 heads: 5.5%</text>
  <text class="ta" x="60" y="60">0, 1 or 2 heads: 5.5%</text>
  <text class="m" x="60" y="16">if the coin is fair · 1,024 equally likely sequences</text>
</svg>
<figcaption>Everything a fair coin can do in 10 flips. Five heads is the most likely result, at 24.6%. The blue bars are the results at least as far from 5 as our 8 heads.</figcaption>
</figure>

### Step 3: decide what "at least this extreme" means

We got 8 heads, which is 3 away from the 5 a fair coin would give on average. So the question becomes: how often does a fair coin land **3 or more away from 5**? That includes 8, 9 and 10 heads, and also 2, 1 and 0. Two heads would be just as suspicious as eight. It's the same distance from fair, just in the other direction.

<figure class="fig learn-fig">
<svg viewBox="0 0 420 224" role="img" aria-labelledby="pv-extreme-t pv-extreme-d">
<title id="pv-extreme-t">Extreme means at least the observed distance</title>
<desc id="pv-extreme-d">Number line of heads counts from 0 through 10. Counts at least 3 away from 5 are highlighted: 0, 1, 2, 8, 9 and 10.</desc>
<text x="14" y="25" text-anchor="start">Observed: 8 heads, distance 3 from 5</text><path d="M22,92 H398" class="axis"/><circle cx="24.0" cy="92" r="5" fill="var(--l0)"/><text x="24.0" y="121" text-anchor="middle">0</text><circle cx="61.2" cy="92" r="5" fill="var(--l0)"/><text x="61.2" y="121" text-anchor="middle">1</text><circle cx="98.4" cy="92" r="5" fill="var(--l0)"/><text x="98.4" y="121" text-anchor="middle">2</text><circle cx="135.60000000000002" cy="92" r="5" fill="var(--muted)"/><text x="135.60000000000002" y="121" text-anchor="middle">3</text><circle cx="172.8" cy="92" r="5" fill="var(--muted)"/><text x="172.8" y="121" text-anchor="middle">4</text><circle cx="210.0" cy="92" r="5" fill="var(--muted)"/><text x="210.0" y="121" text-anchor="middle">5</text><circle cx="247.20000000000002" cy="92" r="5" fill="var(--muted)"/><text x="247.20000000000002" y="121" text-anchor="middle">6</text><circle cx="284.40000000000003" cy="92" r="5" fill="var(--muted)"/><text x="284.40000000000003" y="121" text-anchor="middle">7</text><circle cx="321.6" cy="92" r="8" fill="var(--l0)"/><text x="321.6" y="121" text-anchor="middle">8</text><circle cx="358.8" cy="92" r="5" fill="var(--l0)"/><text x="358.8" y="121" text-anchor="middle">9</text><circle cx="396.0" cy="92" r="5" fill="var(--l0)"/><text x="396.0" y="121" text-anchor="middle">10</text><path d="M210,67 H321.6" stroke="var(--l3)" stroke-width="2"/><text x="266" y="55" class="sub" text-anchor="middle">3 away</text><rect x="12" y="148" width="396" height="60" rx="5" fill="var(--l0)" fill-opacity="0.14" stroke="var(--line)"/><text x="26" y="173" text-anchor="start">Count: 0, 1, 2 and 8, 9, 10</text><text x="26" y="195" class="sub" text-anchor="start">Ignore: 3, 4, 5, 6, 7</text>
</svg>
<figcaption>Distance from 5 is what counts, not direction. Two heads is exactly as lopsided as eight.</figcaption>
</figure>

Why not just ask how likely *exactly* 8 heads is? Because any single exact result is unlikely. Even the most common result, 5 heads, only happens a quarter of the time, and with a thousand flips every exact count would have a tiny chance. What we want to know is how far out towards the edges our result sits, so we count it together with everything even further out.

### Step 4: add them up

8, 9 or 10 heads: 45 + 10 + 1 = 56 orders. 0, 1 or 2 heads: another 56. So:

$$
p = \frac{56 + 56}{1024} = \frac{112}{1024} \approx 0.109
$$

That's the **p-value**, about 11%. In plain words: *if the coin is fair, about 11 out of every 100 sets of ten flips would look at least this lopsided.*

Try other results below. Click a bar to pretend that's what you got.

<section class="pv-widget" id="pv-coin" aria-labelledby="pv-coin-title" hidden>
<h3 id="pv-coin-title">Try it: count the blue bars</h3>
<p>The outlined bar is your result. Blue bars are every result at least as extreme. The p-value is their total.</p>
<div class="pv-controls">
<label for="pv-heads">Heads in 10 flips: <output id="pv-heads-value" for="pv-heads">8</output><input id="pv-heads" type="range" min="0" max="10" step="1" value="8"></label>
<label for="pv-sided">What are you checking for?<select id="pv-sided"><option value="two">Biased either way (two-sided)</option><option value="upper">Biased towards heads (one-sided)</option></select></label>
</div>
<div class="pv-bars" id="pv-bars" role="group" aria-label="Choose the observed number of heads"></div>
<div class="pv-buttons"><button id="pv-flip" type="button">Flip a fair coin 10 times</button></div>
<p class="pv-result" id="pv-coin-result" role="status" aria-live="polite" aria-atomic="true"></p>
<ol><li>Click 5. Every bar turns blue and p = 1. Nothing is more ordinary than the middle.</li><li>Click 9. Only 0, 1, 9 and 10 count now, so p drops to about 2%.</li><li>Back to 8, then switch to one-sided. Only 8, 9 and 10 count, so p halves to about 5.5%.</li><li>Press "Flip a fair coin" a dozen times. Now and then a perfectly fair coin gives a small p-value. That's not a bug. It's the false alarm rate, which we'll get to.</li></ol>
</section>
<noscript><p>With JavaScript on, this spot lets you pick other results. For 9 heads the two-sided p-value is 22/1024, about 2.1%.</p></noscript>

### Step 5: decide

Is 11% surprising enough to say the coin isn't fair? Something that happens about one time in nine isn't very rare.

To avoid arguing about it after the fact, you pick a cut-off *before* looking at the data. The usual cut-off is 5%. It's called the **significance level** and written $$\alpha$$ (alpha). If p comes out below $$\alpha$$, the result is called **statistically significant** and you reject the null hypothesis.

Our 10.9% is above 5%, so we don't reject "fair". Be careful with what that means, though. It does **not** prove the coin is fair. Ten flips is very little evidence, and a coin that lands heads 70% of the time would often give results like ours too. Not significant means "not enough evidence", which is a very different statement from "no effect".

The 5% isn't magic either. Ronald Fisher suggested it in the 1920s as a convenient line, and it stuck. A p-value of 4.9% and one of 5.1% are practically the same evidence, even though one gets called significant and the other doesn't.

### One-sided or two-sided

We counted both edges because a coin biased either way would be a problem. That's a **two-sided test**. If, *before flipping*, you only cared whether the coin favours heads, you'd count only 8, 9 and 10 and get half the p-value, 5.5%. That's a **one-sided test**.

The rule is to choose before you see the data. Choosing the side afterwards because it gives the smaller number is cheating, even if it doesn't feel like it.

### The formula, now that you've done it

The chance of exactly $$k$$ heads in 10 fair flips is:

$$
P(X = k) = \frac{\binom{10}{k}}{2^{10}}
$$

$$X$$ is the number of heads. $$\binom{10}{k}$$, read "10 choose k", counts the orders with $$k$$ heads: 45 for $$k = 8$$. The bottom counts all the orders. And the p-value is the sum of the bars we picked:

$$
p = P(X \ge 8) + P(X \le 2)
$$

"8 or more, plus 2 or fewer". That's the 112/1024 you already worked out, written shorter.

## What a p-value is, and what it isn't

Here's the general version of what we just did:

$$
p = P(\text{a result at least this extreme} \mid H_0)
$$

Read the bar as "assuming": *the chance of a result at least this extreme, assuming the null hypothesis is true.*

That "assuming" is where almost everyone goes wrong, me included for a long time. The p-value *starts* by assuming $$H_0$$ is true, so it can't then tell you the chance that $$H_0$$ is true. A p-value of 3% does **not** mean:

- a 3% chance there's no real effect,
- a 3% chance the result is a fluke,
- a 97% chance your change works.

It means: if there were no real effect, results this extreme would turn up 3% of the time.

That can sound like hair-splitting, so here's a case where the difference is obvious. A smoke alarm rarely goes off when there's no fire: say 1% of the time. That's like a p-value of 1%. Does it mean that when the alarm goes off, there's a 99% chance of fire? Not in my kitchen. If you burn toast most mornings, most alarms are toast. "How often does it ring when there's no fire?" and "now that it's ringing, how likely is a fire?" are different questions. The p-value only answers the first one. (If you read the probability post, this is the "order matters when you say *given*" trap.)

## Two ways to be wrong

Any rule that makes decisions from noisy data will sometimes get it wrong. There are exactly two ways it can happen:

<figure class="fig learn-fig">
<svg viewBox="0 0 500 300" role="img" aria-labelledby="pv-errors-t pv-errors-d">
<title id="pv-errors-t">Two ways a test can be wrong</title>
<desc id="pv-errors-d">A two by two grid. Columns: the truth is no effect, or a real effect. Rows: you say it works, or you say nothing happened. No effect but you say it works is a false positive, with chance alpha. Real effect and you say it works is correct, with chance equal to power. No effect and you say nothing is correct. Real effect but you say nothing is a false negative, with chance beta.</desc>
<text x="14" y="26">What is true vs. what you decide</text><text x="14" y="66" class="sub">In reality:</text><text x="225" y="66" text-anchor="middle">No effect</text><text x="400" y="66" text-anchor="middle">Real effect</text><text x="14" y="128">You say</text><text x="14" y="150" class="sub">"it works"</text><text x="14" y="232">You say</text><text x="14" y="254" class="sub">"nothing"</text><rect x="140" y="84" width="170" height="96" rx="6" fill="var(--l2)" fill-opacity=".14" stroke="var(--line)"/><text x="225" y="126" text-anchor="middle">False positive</text><text x="225" y="150" text-anchor="middle" class="sub">Type I, chance α</text><rect x="315" y="84" width="170" height="96" rx="6" fill="var(--l1)" fill-opacity=".14" stroke="var(--line)"/><text x="400" y="126" text-anchor="middle">Correct</text><text x="400" y="150" text-anchor="middle" class="sub">chance = power</text><rect x="140" y="188" width="170" height="96" rx="6" fill="var(--l1)" fill-opacity=".14" stroke="var(--line)"/><text x="225" y="230" text-anchor="middle">Correct</text><text x="225" y="254" text-anchor="middle" class="sub">chance 1 − α</text><rect x="315" y="188" width="170" height="96" rx="6" fill="var(--l2)" fill-opacity=".14" stroke="var(--line)"/><text x="400" y="230" text-anchor="middle">False negative</text><text x="400" y="254" text-anchor="middle" class="sub">Type II, chance β</text>
</svg>
<figcaption>The test only sees noisy data, never the truth. Orange cells are the two mistakes. You choose α, the false-positive rate, directly. The false-negative rate β depends on how much data you have and how big the real effect is.</figcaption>
</figure>

- A **false positive** (also called a Type I error) is declaring an effect that isn't there. If there's really nothing going on, this happens with chance $$\alpha$$. At 5%, about 1 in 20 tests of useless changes will still come out "significant".
- A **false negative** (a Type II error) is missing an effect that is there. Its chance is written $$\beta$$ (beta).

**Power** is the other side of a false negative: the chance your test catches a real effect of a given size.

$$
\text{power} = 1 - \beta
$$

Power depends on how big the real effect is and how much data you have. Big effects are easy to spot. Small ones need a lot of data. We'll work it out for the button shortly.

## Back to the button

Here's the button experiment. Visitors were randomly split into two groups, often called **arms**: group A saw the old button, group B the new one.

| Group | Visitors | Bought | Conversion rate |
|---|---:|---:|---:|
| A: old button | 10,000 | 1,000 | 10.0% |
| B: new button | 10,000 | 1,080 | 10.8% |

B converts **0.8 percentage points** better: 10.8% against 10.0%. As a relative change, that's 8% better, because 0.8 is 8% of 10. Both are correct. Just be clear which one you mean, because people mix them up all the time.

The null hypothesis is that the button makes no difference: both groups have the same true conversion rate, and the 0.8-point gap is noise. We'll use a two-sided test with $$\alpha = 5\%$$, decided before the experiment started.

With the coin we could list every possible outcome. With 20,000 people that's hopeless. But there's a neat way to build the "nothing going on" world anyway.

### Shuffle the labels

If the button truly makes no difference, then the labels A and B are meaningless. Someone who bought would have bought with either button, and someone who didn't, wouldn't have. So:

1. Take all 20,000 people with their outcomes: 2,080 bought, 17,920 didn't.
2. Throw the A and B labels away, shuffle, and deal everyone into two new groups of 10,000.
3. Work out the difference in conversion rate between the two new groups.
4. Repeat thousands of times.

<figure class="fig learn-fig">
<svg viewBox="0 0 420 443" role="img" aria-labelledby="pv-shuffle-t pv-shuffle-d">
<title id="pv-shuffle-t">Permutation keeps the data and changes group labels</title>
<desc id="pv-shuffle-d">The pooled 20,000 conversion outcomes stay fixed. Each shuffle assigns 10,000 outcomes to each group, calculates a new difference and counts absolute differences at least 0.008.</desc>
<text x="14" y="25" text-anchor="start">Shuffle labels, not the outcomes</text><rect x="12" y="47" width="396" height="74" rx="5" fill="var(--panel)" fill-opacity="1" stroke="var(--line)"/><text x="26" y="75" text-anchor="start">Keep all 20,000 outcomes</text><text x="26" y="100" class="sub" text-anchor="start">2,080 ones + 17,920 zeros</text><path d="M210,121 v17" class="axis"/><rect x="12" y="143" width="396" height="74" rx="5" fill="var(--panel)" fill-opacity="1" stroke="var(--line)"/><text x="26" y="171" text-anchor="start">Randomly split into two groups</text><text x="26" y="196" class="sub" text-anchor="start">10,000 in A; 10,000 in B</text><path d="M210,217 v17" class="axis"/><rect x="12" y="239" width="396" height="74" rx="5" fill="var(--panel)" fill-opacity="1" stroke="var(--line)"/><text x="26" y="267" text-anchor="start">Record shuffled B rate − A rate</text><text x="26" y="292" class="sub" text-anchor="start">Repeat to build the null distribution</text><path d="M210,313 v17" class="axis"/><rect x="12" y="335" width="396" height="74" rx="5" fill="var(--panel)" fill-opacity="1" stroke="var(--line)"/><text x="26" y="363" text-anchor="start">Count |difference| ≥ 0.008</text><text x="26" y="388" class="sub" text-anchor="start">Both negative and positive tails</text>
</svg>
<figcaption>The outcomes never change, only which group each person is dealt into. If the button doesn't matter, every deal is as plausible as the real one.</figcaption>
</figure>

Each shuffle gives you a difference that came purely from how people happened to be split into groups. The pile of shuffled differences is the "nothing going on" world, just like the coin chart was. Then you count: how often is a shuffled difference at least as far from zero as our real +0.8?

<section class="pv-widget" id="pv-shuffle" aria-labelledby="pv-shuffle-title" hidden>
<h3 id="pv-shuffle-title">Try it: shuffle the labels</h3>
<p>Each shuffle deals the same 2,080 buyers and 17,920 non-buyers into two new groups of 10,000 and records the difference B − A. Blue marks shuffles at least 0.8 points away from zero in either direction, as far out as the real result.</p>
<div class="pv-buttons">
<button id="pv-sh-1" type="button">Shuffle once</button>
<button id="pv-sh-100" type="button">Shuffle 100 times</button>
<button id="pv-sh-1000" type="button">Shuffle 1,000 times</button>
<button id="pv-sh-reset" type="button">Start over</button>
</div>
<svg id="pv-shuffle-chart" viewBox="0 0 640 300" role="img" aria-labelledby="pv-shuffle-chart-title pv-shuffle-chart-desc"><title id="pv-shuffle-chart-title">Differences from shuffled labels</title><desc id="pv-shuffle-chart-desc"></desc></svg>
<div class="pv-legend"><span><i style="background:var(--muted);opacity:.4"></i>shuffle closer to zero than 0.8</span><span><i style="background:var(--l0)"></i>shuffle at least 0.8 away</span></div>
<label class="pv-check" for="pv-sh-bell"><input id="pv-sh-bell" type="checkbox"> Overlay the bell-curve shortcut (the z-test, next section)</label>
<p class="pv-result" id="pv-shuffle-result" role="status" aria-live="polite" aria-atomic="true"></p>
</section>
<noscript><p>With JavaScript on, this spot runs the shuffle in your browser. Across many shuffles, about 6.7% of the differences land at least 0.8 points away from zero.</p></noscript>

After a few thousand shuffles you'll settle at around 6.7%. That's the p-value. This method is called a **permutation test**, and I like it a lot, because there's no formula hiding anything. It's the coin's count-and-divide, done by a computer. Here it is in Python:

```python
import numpy as np

rng = np.random.default_rng(0)
a = np.r_[np.ones(1000), np.zeros(9000)]   # old button: 1 = bought
b = np.r_[np.ones(1080), np.zeros(8920)]   # new button
observed = b.mean() - a.mean()             # 0.008
everyone = np.concatenate([a, b])

shuffles, extreme = 10_000, 0
for _ in range(shuffles):
    rng.shuffle(everyone)
    diff = everyone[10_000:].mean() - everyone[:10_000].mean()
    extreme += abs(diff) >= abs(observed) - 1e-12   # tiny tolerance for rounding

p = (extreme + 1) / (shuffles + 1)   # count the real split as one of the shuffles
print(p)  # about 0.067; it moves a little from run to run
```

One caution: shuffling only works when people were randomly assigned and are independent of each other. If the same person shows up several times, or whole households were assigned together, you have to shuffle those units together, or the "nothing going on" world you build is wrong.

### The shortcut: the z-test

Shuffling works, but before computers it was impossible, and on huge datasets it's still slow. Look at the shape the shuffled differences made, though: a bell. That's the central limit theorem at work. A conversion rate is an average of lots of 0s and 1s, and averages come out bell-shaped.

If we know the null world is a bell centred on zero, we only need one more number to draw it: how wide it is. That width is the **standard error** (SE), the amount the difference between two groups typically wobbles from random sampling alone. Then we measure our result in "standard errors away from zero" and read the answer off the bell. That's the **two-proportion z-test**. One step at a time:

**1. Find the shared conversion rate.** Under the null, both groups have the same rate, so pool them: 2,080 buyers out of 20,000.

$$
\hat p = \frac{1000 + 1080}{10000 + 10000} = 0.104
$$

The hat means "estimated from data". Annoyingly, this $$\hat p$$ is a conversion rate, not a p-value. Same letter, different job.

**2. Work out the standard error of the difference.**

$$
SE = \sqrt{\hat p\,(1-\hat p)\left(\frac{1}{n_A} + \frac{1}{n_B}\right)}
$$

You don't need to memorise it, but you can read it. $$\hat p(1-\hat p)$$ is how unpredictable a single buy-or-not outcome is. The $$1/n$$ parts shrink it as the groups get bigger, where $$n_A$$ and $$n_B$$ are the group sizes. The square root turns it back into ordinary units. With our numbers:

$$
SE = \sqrt{0.104 \times 0.896 \times \frac{2}{10000}} \approx 0.00432
$$

So two identical buttons would typically differ by about 0.43 percentage points just by chance. Our gap is 0.8.

**3. Count how many standard errors our gap is.**

$$
z = \frac{\hat p_B - \hat p_A}{SE} = \frac{0.108 - 0.100}{0.00432} \approx 1.85
$$

This is the **test statistic**, one number for "how far out is my result". It's the same shape as a z-score: (what I saw − what the null expects) / (typical wobble). Here the null expects 0.

**4. Read the p-value off the bell.** If the null is true, $$z$$ follows a *standard normal* curve: a bell centred on 0 with a standard deviation of 1. We want the area beyond ±1.85:

<figure class="fig">
<svg viewBox="0 0 680 252" role="img" aria-labelledby="p2t p2d">
  <title id="p2t">Where the observed z-score falls on the null distribution</title>
  <desc id="p2d">A standard normal curve: the distribution of the z-score if the button change did nothing. The observed z of 1.85 is marked. The area beyond plus and minus 1.85 is shaded and totals 6.4%, the p-value. The cut-offs at plus and minus 1.96, which leave 5% in the tails, are drawn as dashed lines just outside it.</desc>
  <line class="grid" x1="60" x2="650" y1="200" y2="200"/>
  <g tabindex="0"><title>Right tail beyond z = 1.85: 3.2%</title><path class="fa" style="opacity:.35" d="M492.2,200 L492.2,172.4 L493.6,173.4 L495.1,174.4 L496.6,175.3 L498.1,176.3 L499.6,177.2 L501.0,178.1 L502.5,178.9 L504.0,179.7 L505.4,180.6 L506.9,181.3 L508.4,182.1 L509.9,182.8 L511.4,183.5 L512.8,184.2 L514.3,184.9 L515.8,185.5 L517.2,186.1 L518.7,186.7 L520.2,187.3 L521.7,187.9 L523.2,188.4 L524.6,188.9 L526.1,189.4 L527.6,189.9 L529.0,190.4 L530.5,190.8 L532.0,191.3 L533.5,191.7 L535.0,192.1 L536.4,192.4 L537.9,192.8 L539.4,193.2 L540.9,193.5 L542.3,193.8 L543.8,194.1 L545.3,194.4 L546.8,194.7 L548.2,195.0 L549.7,195.2 L551.2,195.5 L552.6,195.7 L554.1,195.9 L555.6,196.1 L557.1,196.4 L558.5,196.5 L560.0,196.7 L561.5,196.9 L563.0,197.1 L564.5,197.2 L565.9,197.4 L567.4,197.5 L568.9,197.7 L570.4,197.8 L571.8,197.9 L573.3,198.1 L574.8,198.2 L576.2,198.3 L577.7,198.4 L579.2,198.5 L580.7,198.6 L582.1,198.6 L583.6,198.7 L585.1,198.8 L586.6,198.9 L588.0,198.9 L589.5,199.0 L591.0,199.1 L592.5,199.1 L594.0,199.2 L595.4,199.2 L596.9,199.3 L598.4,199.3 L599.9,199.4 L601.3,199.4 L602.8,199.4 L604.3,199.5 L605.8,199.5 L607.2,199.6 L608.7,199.6 L610.2,199.6 L611.6,199.6 L613.1,199.7 L614.6,199.7 L616.1,199.7 L617.6,199.7 L619.0,199.7 L620.5,199.8 L622.0,199.8 L623.5,199.8 L624.9,199.8 L626.4,199.8 L627.9,199.8 L629.4,199.8 L630.8,199.9 L632.3,199.9 L633.8,199.9 L635.2,199.9 L636.7,199.9 L638.2,199.9 L639.7,199.9 L641.1,199.9 L642.6,199.9 L644.1,199.9 L645.6,199.9 L647.0,199.9 L648.5,199.9 L650.0,199.9 L650.0,200 Z"/></g>
  <g tabindex="0"><title>Left tail beyond z = −1.85: 3.2%</title><path class="fa" style="opacity:.35" d="M60.0,200 L60.0,199.9 L61.5,199.9 L63.0,199.9 L64.4,199.9 L65.9,199.9 L67.4,199.9 L68.9,199.9 L70.3,199.9 L71.8,199.9 L73.3,199.9 L74.8,199.9 L76.2,199.9 L77.7,199.9 L79.2,199.9 L80.7,199.8 L82.1,199.8 L83.6,199.8 L85.1,199.8 L86.5,199.8 L88.0,199.8 L89.5,199.8 L91.0,199.7 L92.4,199.7 L93.9,199.7 L95.4,199.7 L96.9,199.7 L98.3,199.6 L99.8,199.6 L101.3,199.6 L102.8,199.6 L104.2,199.5 L105.7,199.5 L107.2,199.4 L108.7,199.4 L110.2,199.4 L111.6,199.3 L113.1,199.3 L114.6,199.2 L116.0,199.2 L117.5,199.1 L119.0,199.1 L120.5,199.0 L121.9,198.9 L123.4,198.9 L124.9,198.8 L126.4,198.7 L127.8,198.6 L129.3,198.6 L130.8,198.5 L132.3,198.4 L133.8,198.3 L135.2,198.2 L136.7,198.1 L138.2,197.9 L139.7,197.8 L141.1,197.7 L142.6,197.5 L144.1,197.4 L145.6,197.2 L147.0,197.1 L148.5,196.9 L150.0,196.7 L151.5,196.5 L152.9,196.4 L154.4,196.1 L155.9,195.9 L157.4,195.7 L158.8,195.5 L160.3,195.2 L161.8,195.0 L163.3,194.7 L164.7,194.4 L166.2,194.1 L167.7,193.8 L169.2,193.5 L170.6,193.2 L172.1,192.8 L173.6,192.4 L175.1,192.1 L176.5,191.7 L178.0,191.3 L179.5,190.8 L180.9,190.4 L182.4,189.9 L183.9,189.4 L185.4,188.9 L186.8,188.4 L188.3,187.9 L189.8,187.3 L191.3,186.7 L192.8,186.1 L194.2,185.5 L195.7,184.9 L197.2,184.2 L198.7,183.5 L200.1,182.8 L201.6,182.1 L203.1,181.3 L204.6,180.6 L206.0,179.7 L207.5,178.9 L209.0,178.1 L210.4,177.2 L211.9,176.3 L213.4,175.3 L214.9,174.4 L216.3,173.4 L217.8,172.4 L217.8,200 Z"/></g>
  <path class="ln" d="M60.0,199.9 L61.5,199.9 L63.0,199.9 L64.4,199.9 L65.9,199.9 L67.4,199.9 L68.9,199.9 L70.3,199.9 L71.8,199.9 L73.3,199.9 L74.8,199.9 L76.2,199.9 L77.7,199.9 L79.2,199.9 L80.7,199.8 L82.1,199.8 L83.6,199.8 L85.1,199.8 L86.5,199.8 L88.0,199.8 L89.5,199.8 L91.0,199.7 L92.4,199.7 L93.9,199.7 L95.4,199.7 L96.9,199.7 L98.3,199.6 L99.8,199.6 L101.3,199.6 L102.8,199.6 L104.2,199.5 L105.7,199.5 L107.2,199.4 L108.7,199.4 L110.2,199.4 L111.6,199.3 L113.1,199.3 L114.6,199.2 L116.0,199.2 L117.5,199.1 L119.0,199.1 L120.5,199.0 L121.9,198.9 L123.4,198.9 L124.9,198.8 L126.4,198.7 L127.8,198.6 L129.3,198.6 L130.8,198.5 L132.3,198.4 L133.8,198.3 L135.2,198.2 L136.7,198.1 L138.2,197.9 L139.7,197.8 L141.1,197.7 L142.6,197.5 L144.1,197.4 L145.6,197.2 L147.0,197.1 L148.5,196.9 L150.0,196.7 L151.5,196.5 L152.9,196.4 L154.4,196.1 L155.9,195.9 L157.4,195.7 L158.8,195.5 L160.3,195.2 L161.8,195.0 L163.3,194.7 L164.7,194.4 L166.2,194.1 L167.7,193.8 L169.2,193.5 L170.6,193.2 L172.1,192.8 L173.6,192.4 L175.1,192.1 L176.5,191.7 L178.0,191.3 L179.5,190.8 L180.9,190.4 L182.4,189.9 L183.9,189.4 L185.4,188.9 L186.8,188.4 L188.3,187.9 L189.8,187.3 L191.3,186.7 L192.8,186.1 L194.2,185.5 L195.7,184.9 L197.2,184.2 L198.7,183.5 L200.1,182.8 L201.6,182.1 L203.1,181.3 L204.6,180.6 L206.0,179.7 L207.5,178.9 L209.0,178.1 L210.4,177.2 L211.9,176.3 L213.4,175.3 L214.9,174.4 L216.3,173.4 L217.8,172.4 L219.3,171.3 L220.8,170.3 L222.2,169.2 L223.7,168.0 L225.2,166.9 L226.7,165.7 L228.2,164.5 L229.6,163.3 L231.1,162.0 L232.6,160.7 L234.0,159.4 L235.5,158.1 L237.0,156.7 L238.5,155.3 L239.9,153.9 L241.4,152.4 L242.9,150.9 L244.4,149.4 L245.8,147.9 L247.3,146.3 L248.8,144.8 L250.3,143.2 L251.8,141.5 L253.2,139.9 L254.7,138.2 L256.2,136.5 L257.6,134.8 L259.1,133.1 L260.6,131.3 L262.1,129.6 L263.6,127.8 L265.0,126.0 L266.5,124.2 L268.0,122.3 L269.4,120.5 L270.9,118.7 L272.4,116.8 L273.9,114.9 L275.4,113.1 L276.8,111.2 L278.3,109.3 L279.8,107.4 L281.2,105.5 L282.7,103.6 L284.2,101.7 L285.7,99.9 L287.1,98.0 L288.6,96.1 L290.1,94.2 L291.6,92.4 L293.1,90.5 L294.5,88.7 L296.0,86.9 L297.5,85.1 L299.0,83.3 L300.4,81.5 L301.9,79.8 L303.4,78.1 L304.9,76.4 L306.3,74.7 L307.8,73.1 L309.3,71.5 L310.8,69.9 L312.2,68.3 L313.7,66.8 L315.2,65.4 L316.6,63.9 L318.1,62.5 L319.6,61.2 L321.1,59.9 L322.6,58.6 L324.0,57.4 L325.5,56.2 L327.0,55.1 L328.4,54.0 L329.9,53.0 L331.4,52.0 L332.9,51.1 L334.4,50.2 L335.8,49.4 L337.3,48.6 L338.8,47.9 L340.2,47.3 L341.7,46.7 L343.2,46.2 L344.7,45.7 L346.1,45.3 L347.6,45.0 L349.1,44.7 L350.6,44.5 L352.1,44.3 L353.5,44.3 L355.0,44.2 L356.5,44.3 L357.9,44.3 L359.4,44.5 L360.9,44.7 L362.4,45.0 L363.9,45.3 L365.3,45.7 L366.8,46.2 L368.3,46.7 L369.8,47.3 L371.2,47.9 L372.7,48.6 L374.2,49.4 L375.7,50.2 L377.1,51.1 L378.6,52.0 L380.1,53.0 L381.6,54.0 L383.0,55.1 L384.5,56.2 L386.0,57.4 L387.5,58.6 L388.9,59.9 L390.4,61.2 L391.9,62.5 L393.4,63.9 L394.8,65.4 L396.3,66.8 L397.8,68.3 L399.3,69.9 L400.7,71.5 L402.2,73.1 L403.7,74.7 L405.1,76.4 L406.6,78.1 L408.1,79.8 L409.6,81.5 L411.1,83.3 L412.5,85.1 L414.0,86.9 L415.5,88.7 L416.9,90.5 L418.4,92.4 L419.9,94.2 L421.4,96.1 L422.9,98.0 L424.3,99.9 L425.8,101.7 L427.3,103.6 L428.8,105.5 L430.2,107.4 L431.7,109.3 L433.2,111.2 L434.6,113.1 L436.1,114.9 L437.6,116.8 L439.1,118.7 L440.6,120.5 L442.0,122.3 L443.5,124.2 L445.0,126.0 L446.4,127.8 L447.9,129.6 L449.4,131.3 L450.9,133.1 L452.4,134.8 L453.8,136.5 L455.3,138.2 L456.8,139.9 L458.2,141.5 L459.7,143.2 L461.2,144.8 L462.7,146.3 L464.2,147.9 L465.6,149.4 L467.1,150.9 L468.6,152.4 L470.1,153.9 L471.5,155.3 L473.0,156.7 L474.5,158.1 L475.9,159.4 L477.4,160.7 L478.9,162.0 L480.4,163.3 L481.8,164.5 L483.3,165.7 L484.8,166.9 L486.3,168.0 L487.8,169.2 L489.2,170.3 L490.7,171.3 L492.2,172.4 L493.6,173.4 L495.1,174.4 L496.6,175.3 L498.1,176.3 L499.6,177.2 L501.0,178.1 L502.5,178.9 L504.0,179.7 L505.4,180.6 L506.9,181.3 L508.4,182.1 L509.9,182.8 L511.4,183.5 L512.8,184.2 L514.3,184.9 L515.8,185.5 L517.2,186.1 L518.7,186.7 L520.2,187.3 L521.7,187.9 L523.2,188.4 L524.6,188.9 L526.1,189.4 L527.6,189.9 L529.0,190.4 L530.5,190.8 L532.0,191.3 L533.5,191.7 L535.0,192.1 L536.4,192.4 L537.9,192.8 L539.4,193.2 L540.9,193.5 L542.3,193.8 L543.8,194.1 L545.3,194.4 L546.8,194.7 L548.2,195.0 L549.7,195.2 L551.2,195.5 L552.6,195.7 L554.1,195.9 L555.6,196.1 L557.1,196.4 L558.5,196.5 L560.0,196.7 L561.5,196.9 L563.0,197.1 L564.5,197.2 L565.9,197.4 L567.4,197.5 L568.9,197.7 L570.4,197.8 L571.8,197.9 L573.3,198.1 L574.8,198.2 L576.2,198.3 L577.7,198.4 L579.2,198.5 L580.7,198.6 L582.1,198.6 L583.6,198.7 L585.1,198.8 L586.6,198.9 L588.0,198.9 L589.5,199.0 L591.0,199.1 L592.5,199.1 L594.0,199.2 L595.4,199.2 L596.9,199.3 L598.4,199.3 L599.9,199.4 L601.3,199.4 L602.8,199.4 L604.3,199.5 L605.8,199.5 L607.2,199.6 L608.7,199.6 L610.2,199.6 L611.6,199.6 L613.1,199.7 L614.6,199.7 L616.1,199.7 L617.6,199.7 L619.0,199.7 L620.5,199.8 L622.0,199.8 L623.5,199.8 L624.9,199.8 L626.4,199.8 L627.9,199.8 L629.4,199.8 L630.8,199.9 L632.3,199.9 L633.8,199.9 L635.2,199.9 L636.7,199.9 L638.2,199.9 L639.7,199.9 L641.1,199.9 L642.6,199.9 L644.1,199.9 L645.6,199.9 L647.0,199.9 L648.5,199.9 L650.0,199.9" style="stroke-width:2"/>
  <line class="ln dash" style="stroke:var(--fig-b)" x1="210.4" x2="210.4" y1="56" y2="200"/>
  <line class="ln dash" style="stroke:var(--fig-b)" x1="499.6" x2="499.6" y1="56" y2="200"/>
  <line class="sa" x1="491.7" x2="491.7" y1="132.0" y2="200"/>
  <circle class="fa" cx="491.7" cy="200" r="5" style="stroke:var(--bg);stroke-width:2"/>
  <text class="ta" x="485.7" y="126.0" text-anchor="end">observed z = 1.85</text>
  <text class="tb" x="505.6" y="66">cut-off 1.96</text>
  <text class="tb" x="204.4" y="66" text-anchor="end">−1.96</text>
  <text class="ta" x="576.2" y="186" text-anchor="middle">3.2%</text>
  <text class="ta" x="133.8" y="186" text-anchor="middle">3.2%</text>
  <text class="m" x="60.0" y="216" text-anchor="middle">-4</text>
  <text class="m" x="133.8" y="216" text-anchor="middle">-3</text>
  <text class="m" x="207.5" y="216" text-anchor="middle">-2</text>
  <text class="m" x="281.2" y="216" text-anchor="middle">-1</text>
  <text class="m" x="355.0" y="216" text-anchor="middle">0</text>
  <text class="m" x="428.8" y="216" text-anchor="middle">1</text>
  <text class="m" x="502.5" y="216" text-anchor="middle">2</text>
  <text class="m" x="576.2" y="216" text-anchor="middle">3</text>
  <text class="m" x="650.0" y="216" text-anchor="middle">4</text>
  <text class="m" x="650" y="234" text-anchor="end">z-score</text>
  <text class="m" x="60" y="16">z-scores you would see if the change did nothing · shaded tails = p-value = 6.4%</text>
</svg>
<figcaption>The bell is where z would land if the button did nothing. The shaded tails beyond ±1.85 add up to 6.4%: that's the p-value. The dashed lines at ±1.96 are the 5% cut-off, and our z stops just short of them.</figcaption>
</figure>

$$
p = 2 \times \big(1 - \Phi(\lvert z\rvert)\big) \approx 0.064
$$

In pieces:

- $$\lvert z\rvert$$ is z without its sign: 1.85.
- $$\Phi$$ ("phi") is the area of the standard normal curve to the left of a point. $$\Phi(1.85) \approx 0.968$$.
- $$1 - 0.968 = 0.032$$ is the area in the right tail.
- Double it for the left tail: 0.064.

So **p ≈ 6.4%**, very close to the 6.7% from shuffling. Two completely different methods, nearly the same answer. (The small gap is because the bell is a smooth approximation of what are really lumpy, whole-number counts.) Tick the overlay box in the shuffle widget and you'll see the bell sitting right on top of the shuffled bars.

**5. Decide.** 6.4% is above our 5% line, so the result is not significant. We haven't shown the new button is better. We also haven't shown it isn't. The dashed lines at ±1.96 in the chart are where the 5% cut-off sits: $$z$$ has to get past 1.96 to count as significant, and ours stopped at 1.85.

You won't do this by hand in practice. In Python it's one line:

```python
from statsmodels.stats.proportion import proportions_ztest

z, p = proportions_ztest(count=[1080, 1000], nobs=[10000, 10000])
print(f"z = {z:.2f}, p = {p:.3f}")  # z = 1.85, p = 0.064
```

## Same effect, more data

Now imagine we'd run the test with 20,000 people per group instead, and got exactly the same rates, 10.0% and 10.8%.

The effect is the same. But the standard error shrinks with more data, by a square root: double the people and the wobble gets divided by √2 ≈ 1.41.

$$
SE \approx 0.00305, \qquad z \approx 2.62, \qquad p \approx 0.009
$$

Now it's significant. Nothing about the button changed. We just measured it more precisely. This is worth sitting with for a second: **a p-value mixes up how big an effect is with how much data you collected.** With enough users, a tiny, useless effect becomes "significant". With too few, a big, valuable one doesn't.

That's a comparison between two separate experiments, by the way. It is *not* permission to keep adding users to a finished test until it crosses the line. More on that in the traps section.

## Power: how many users do you need?

Before you run the experiment, ask: if the new button really does add 0.8 points, how likely is this test to notice?

With 10,000 people per group, the answer is only about **46%**. That's worse than a coin flip. You would miss a real, worthwhile improvement more often than you'd find it. With 20,000 per group it's about 75%.

The widget shows why. Imagine running the same experiment many times. The blue curve is where your measured lift would land if the button did nothing. The purple curve is where it would land if the true lift really is +0.8 points. Anything outside the dashed lines counts as significant. Power is the share of the purple curve that ends up outside them.

<section class="pv-widget" id="pv-power" aria-labelledby="pv-power-title" hidden>
<h3 id="pv-power-title">Try it: what makes a test powerful?</h3>
<p>Horizontal axis: the lift you'd measure in one experiment, in percentage points. It stays fixed so you can see the curves narrow. The shaded purple area is power.</p>
<div class="pv-controls">
<label for="pv-baseline">Old button's conversion rate: <output id="pv-baseline-value" for="pv-baseline">10.0%</output><input id="pv-baseline" type="range" min="5" max="50" step="1" value="10"></label>
<label for="pv-lift">True lift from the new button: <output id="pv-lift-value" for="pv-lift">+0.8 points</output><input id="pv-lift" type="range" min="-3" max="3" step="0.1" value="0.8"></label>
<label for="pv-n">Visitors per group: <output id="pv-n-value" for="pv-n">10,000</output><input id="pv-n" type="range" min="1000" max="50000" step="1000" value="10000"></label>
<label for="pv-alpha">False alarm limit, α<select id="pv-alpha"><option value="0.01">1%</option><option value="0.05" selected>5%</option><option value="0.10">10%</option></select></label>
</div>
<svg id="pv-power-chart" viewBox="0 0 680 280" role="img" aria-labelledby="pv-power-chart-title pv-power-chart-desc"><title id="pv-power-chart-title">Where measured lifts land, with and without a real effect</title><desc id="pv-power-chart-desc"></desc></svg>
<div class="pv-legend"><span><i style="background:var(--l0)"></i>button does nothing</span><span><i style="background:var(--l3)"></i>button has your true lift</span><span>dashed: significance cut-offs</span></div>
<p class="pv-result" id="pv-power-result" role="status" aria-live="polite" aria-atomic="true"></p>
<ol><li>Leave the defaults. Power is about 46%. Most of the purple curve sits between the dashed lines.</li><li>Raise visitors per group to 20,000. Both curves get narrower, the cut-offs move in, and power climbs to about 75%. The true lift didn't change.</li><li>Set the true lift to 0. Purple lands on top of blue and "power" drops to 5%. With no real effect, all that's left is the false alarm rate, α.</li><li>Put the lift back to +0.8 and switch α to 1%. The cut-offs move out: fewer false alarms, but you miss more real effects.</li></ol>
</section>
<noscript><p>With JavaScript on, this spot has an interactive power chart. At 10,000 visitors per group, a true +0.8-point lift is detected about 46% of the time. At 20,000 per group, about 75%.</p></noscript>

### The sample size formula

You can also run that backwards: pick the power you want, usually 80%, and solve for the number of people. For two equal-sized groups, a standard approximation is:

$$
n \approx \frac{\left(z_{1-\alpha/2} + z_{1-\beta}\right)^2 \left[p_A(1-p_A) + p_B(1-p_B)\right]}{(p_B - p_A)^2}
$$

It looks scary, so piece by piece:

- $$n$$ is people **per group**, not in total.
- $$p_A$$ and $$p_B$$ are the rates you're planning around: 10% and 10.8%. You choose them before the experiment, based on the smallest improvement you'd care about.
- $$z_{1-\alpha/2} \approx 1.96$$ is the cut-off for a two-sided test at 5%. $$z_{1-\beta} \approx 0.84$$ is the extra distance needed for 80% power.
- The bracket is how noisy each group is.
- The bottom is the effect, squared. So **halving the effect you want to detect means four times as many people.**

With our numbers:

$$
n \approx \frac{(1.96 + 0.84)^2 \times (0.090 + 0.096)}{0.008^2} \approx 22{,}800
$$

So roughly 23,000 people per group. Put 23,000 into the widget and you'll see power land at about 80%.

Power is a planning tool. After the experiment, working out "observed power" from your own result doesn't tell you anything the p-value hasn't already. Look at the confidence interval instead.

## Confidence intervals: how big is the effect?

A p-value tells you whether a result is surprising. It doesn't tell you how big the effect is, and that's usually what you actually want to know. For that, use a **confidence interval**: your estimate, plus or minus a margin for the wobble.

$$
\text{interval} = (\hat p_B - \hat p_A) \pm 1.96 \times SE
$$

For our button that's +0.80 ± 0.85 points, so the 95% confidence interval runs from **−0.05 to +1.65 percentage points**.

Read it as: the data are consistent with anything from "very slightly worse" to "1.65 points better". That's far more useful than "not significant". It tells you zero is still possible, but so is a big win, and that the honest next step is to collect more data.

(Small detail: for the interval, the SE is worked out from each group's own rate instead of the pooled one, because we're no longer assuming the two rates are equal. With these numbers it comes out at 0.00432 either way.)

What does the "95%" mean? It's about the method, not this one interval. If you repeated the experiment many times and built an interval each time, about 95% of those intervals would contain the true difference.

<figure class="fig">
<svg viewBox="0 0 680 236" role="img" aria-labelledby="p3t p3d">
  <title id="p3t">Three results with their 95% confidence intervals</title>
  <desc id="p3d">Estimated lift in conversion rate, in percentage points, with 95% confidence intervals. With 10,000 users per arm: +0.80, interval −0.05 to +1.65, which crosses zero. With 20,000 per arm: +0.80, interval +0.20 to +1.40. With 2 million per arm: +0.10, interval +0.04 to +0.16, far from zero but also far below the +0.5 point lift that would matter to the business.</desc>
  <line class="ln dash" x1="280.0" x2="280.0" y1="34" y2="180"/>
  <line class="ln dash" style="stroke:var(--fig-b)" x1="360.0" x2="360.0" y1="34" y2="180"/>
  <text class="m" x="280.0" y="28" text-anchor="middle">no effect</text>
  <text class="tb" x="364.0" y="28">worth shipping: +0.5</text>
  <text class="t" x="16" y="68">10,000 per arm</text>
  <g tabindex="0"><title>10,000 per arm: +0.80 points, 95% CI -0.05 to +1.65, p = 0.064</title><line class="sa" x1="272.0" x2="544.0" y1="64" y2="64"/><line class="sa" x1="272.0" x2="272.0" y1="58" y2="70"/><line class="sa" x1="544.0" x2="544.0" y1="58" y2="70"/><circle class="fa" cx="408.0" cy="64" r="5" style="stroke:var(--bg);stroke-width:2"/></g>
  <text class="m" x="554.0" y="68">p = 0.064</text>
  <text class="t" x="16" y="114">20,000 per arm</text>
  <g tabindex="0"><title>20,000 per arm: +0.80 points, 95% CI +0.20 to +1.40, p = 0.009</title><line class="sa" x1="312.0" x2="504.0" y1="110" y2="110"/><line class="sa" x1="312.0" x2="312.0" y1="104" y2="116"/><line class="sa" x1="504.0" x2="504.0" y1="104" y2="116"/><circle class="fa" cx="408.0" cy="110" r="5" style="stroke:var(--bg);stroke-width:2"/></g>
  <text class="m" x="514.0" y="114">p = 0.009</text>
  <text class="t" x="16" y="160">2,000,000 per arm</text>
  <g tabindex="0"><title>2,000,000 per arm: +0.10 points, 95% CI +0.04 to +0.16, p = 0.0009</title><line class="sa" x1="286.4" x2="305.6" y1="156" y2="156"/><line class="sa" x1="286.4" x2="286.4" y1="150" y2="162"/><line class="sa" x1="305.6" x2="305.6" y1="150" y2="162"/><circle class="fa" cx="296.0" cy="156" r="5" style="stroke:var(--bg);stroke-width:2"/></g>
  <text class="m" x="315.6" y="160">p = 0.0009</text>
  <line class="grid" x1="200" x2="600" y1="190" y2="190"/>
  <text class="m" x="200.0" y="206" text-anchor="middle">-0.5</text>
  <text class="m" x="280.0" y="206" text-anchor="middle">+0.0</text>
  <text class="m" x="360.0" y="206" text-anchor="middle">+0.5</text>
  <text class="m" x="440.0" y="206" text-anchor="middle">+1.0</text>
  <text class="m" x="520.0" y="206" text-anchor="middle">+1.5</text>
  <text class="m" x="600.0" y="206" text-anchor="middle">+2.0</text>
  <text class="m" x="600" y="224" text-anchor="end">lift in conversion rate, percentage points</text>
</svg>
<figcaption>Three experiments. The first can't rule out zero. The second can. The third is hugely "significant", yet its whole interval sits below the +0.5-point lift that would be worth shipping.</figcaption>
</figure>

Before you run a test, decide the smallest lift that would be worth the work, then compare the interval against *that* line, not just against zero. Statistically significant and worth doing are different questions.

## Three ways to fool yourself

### 1. Testing lots of things at once

Say you check 20 metrics on a button that changes nothing. Each test has a 5% chance of a false alarm. The chance that *at least one* of them comes out significant, if the tests are independent, is:

$$
1 - (1 - 0.05)^{20} \approx 64\%
$$

Each test has a 95% chance of staying quiet. All 20 staying quiet is 0.95 multiplied by itself 20 times, about 36%. Everything else, 64%, is at least one false alarm. Look at enough metrics and something will always light up.

Here's what p-values look like across many experiments. When nothing is going on, they're spread evenly between 0 and 1, so 5% land below 0.05 by pure chance. When there's a real effect, they pile up near zero.

<figure class="fig">
<svg viewBox="0 0 680 244" role="img" aria-labelledby="p4t p4d">
  <title id="p4t">Distribution of p-values with and without a real effect</title>
  <desc id="p4d">Two histograms of p-values from 2,000 simulated experiments with 10,000 users per arm. Left, an A/A test where nothing changed: the p-values are spread evenly from 0 to 1, and 5.0% fall below 0.05. Right, a real lift from 10% to 10.8%: p-values pile up near zero, and 48% fall below 0.05.</desc>
  <text class="t" x="40" y="22">no real effect (A/A)</text>
  <line class="grid" x1="40" x2="320" y1="190" y2="190"/>
  <g tabindex="0"><title>p between 0.00 and 0.05: 99 of 2,000</title><rect class="fb" x="41.0" y="175.2" width="12.0" height="14.9"/></g>
  <g tabindex="0"><title>p between 0.05 and 0.10: 111 of 2,000</title><rect style="fill:var(--line)" x="55.0" y="173.3" width="12.0" height="16.6"/></g>
  <g tabindex="0"><title>p between 0.10 and 0.15: 113 of 2,000</title><rect style="fill:var(--line)" x="69.0" y="173.1" width="12.0" height="16.9"/></g>
  <g tabindex="0"><title>p between 0.15 and 0.20: 105 of 2,000</title><rect style="fill:var(--line)" x="83.0" y="174.2" width="12.0" height="15.8"/></g>
  <g tabindex="0"><title>p between 0.20 and 0.25: 99 of 2,000</title><rect style="fill:var(--line)" x="97.0" y="175.2" width="12.0" height="14.9"/></g>
  <g tabindex="0"><title>p between 0.25 and 0.30: 95 of 2,000</title><rect style="fill:var(--line)" x="111.0" y="175.8" width="12.0" height="14.2"/></g>
  <g tabindex="0"><title>p between 0.30 and 0.35: 113 of 2,000</title><rect style="fill:var(--line)" x="125.0" y="173.1" width="12.0" height="16.9"/></g>
  <g tabindex="0"><title>p between 0.35 and 0.40: 109 of 2,000</title><rect style="fill:var(--line)" x="139.0" y="173.7" width="12.0" height="16.4"/></g>
  <g tabindex="0"><title>p between 0.40 and 0.45: 92 of 2,000</title><rect style="fill:var(--line)" x="153.0" y="176.2" width="12.0" height="13.8"/></g>
  <g tabindex="0"><title>p between 0.45 and 0.50: 98 of 2,000</title><rect style="fill:var(--line)" x="167.0" y="175.3" width="12.0" height="14.7"/></g>
  <g tabindex="0"><title>p between 0.50 and 0.55: 83 of 2,000</title><rect style="fill:var(--line)" x="181.0" y="177.6" width="12.0" height="12.5"/></g>
  <g tabindex="0"><title>p between 0.55 and 0.60: 103 of 2,000</title><rect style="fill:var(--line)" x="195.0" y="174.6" width="12.0" height="15.4"/></g>
  <g tabindex="0"><title>p between 0.60 and 0.65: 97 of 2,000</title><rect style="fill:var(--line)" x="209.0" y="175.4" width="12.0" height="14.6"/></g>
  <g tabindex="0"><title>p between 0.65 and 0.70: 91 of 2,000</title><rect style="fill:var(--line)" x="223.0" y="176.3" width="12.0" height="13.7"/></g>
  <g tabindex="0"><title>p between 0.70 and 0.75: 102 of 2,000</title><rect style="fill:var(--line)" x="237.0" y="174.7" width="12.0" height="15.3"/></g>
  <g tabindex="0"><title>p between 0.75 and 0.80: 107 of 2,000</title><rect style="fill:var(--line)" x="251.0" y="173.9" width="12.0" height="16.1"/></g>
  <g tabindex="0"><title>p between 0.80 and 0.85: 84 of 2,000</title><rect style="fill:var(--line)" x="265.0" y="177.4" width="12.0" height="12.6"/></g>
  <g tabindex="0"><title>p between 0.85 and 0.90: 105 of 2,000</title><rect style="fill:var(--line)" x="279.0" y="174.2" width="12.0" height="15.8"/></g>
  <g tabindex="0"><title>p between 0.90 and 0.95: 113 of 2,000</title><rect style="fill:var(--line)" x="293.0" y="173.1" width="12.0" height="16.9"/></g>
  <g tabindex="0"><title>p between 0.95 and 1.00: 81 of 2,000</title><rect style="fill:var(--line)" x="307.0" y="177.8" width="12.0" height="12.2"/></g>
  <text class="tb" x="60.0" y="175.2">p &lt; 0.05: 5.0%</text>
  <text class="m" x="40.0" y="206" text-anchor="middle">0</text>
  <text class="m" x="180.0" y="206" text-anchor="middle">0.5</text>
  <text class="m" x="320.0" y="206" text-anchor="middle">1</text>
  <text class="m" x="320" y="222" text-anchor="end">p-value</text>
  <text class="t" x="370" y="22">real lift 10% → 10.8%</text>
  <line class="grid" x1="370" x2="650" y1="190" y2="190"/>
  <g tabindex="0"><title>p between 0.00 and 0.05: 962 of 2,000</title><rect class="fa" x="371.0" y="45.7" width="12.0" height="144.3"/></g>
  <g tabindex="0"><title>p between 0.05 and 0.10: 247 of 2,000</title><rect style="fill:var(--line)" x="385.0" y="152.9" width="12.0" height="37.0"/></g>
  <g tabindex="0"><title>p between 0.10 and 0.15: 149 of 2,000</title><rect style="fill:var(--line)" x="399.0" y="167.7" width="12.0" height="22.3"/></g>
  <g tabindex="0"><title>p between 0.15 and 0.20: 102 of 2,000</title><rect style="fill:var(--line)" x="413.0" y="174.7" width="12.0" height="15.3"/></g>
  <g tabindex="0"><title>p between 0.20 and 0.25: 87 of 2,000</title><rect style="fill:var(--line)" x="427.0" y="176.9" width="12.0" height="13.0"/></g>
  <g tabindex="0"><title>p between 0.25 and 0.30: 68 of 2,000</title><rect style="fill:var(--line)" x="441.0" y="179.8" width="12.0" height="10.2"/></g>
  <g tabindex="0"><title>p between 0.30 and 0.35: 51 of 2,000</title><rect style="fill:var(--line)" x="455.0" y="182.3" width="12.0" height="7.6"/></g>
  <g tabindex="0"><title>p between 0.35 and 0.40: 47 of 2,000</title><rect style="fill:var(--line)" x="469.0" y="182.9" width="12.0" height="7.0"/></g>
  <g tabindex="0"><title>p between 0.40 and 0.45: 39 of 2,000</title><rect style="fill:var(--line)" x="483.0" y="184.2" width="12.0" height="5.8"/></g>
  <g tabindex="0"><title>p between 0.45 and 0.50: 43 of 2,000</title><rect style="fill:var(--line)" x="497.0" y="183.6" width="12.0" height="6.4"/></g>
  <g tabindex="0"><title>p between 0.50 and 0.55: 31 of 2,000</title><rect style="fill:var(--line)" x="511.0" y="185.3" width="12.0" height="4.7"/></g>
  <g tabindex="0"><title>p between 0.55 and 0.60: 30 of 2,000</title><rect style="fill:var(--line)" x="525.0" y="185.5" width="12.0" height="4.5"/></g>
  <g tabindex="0"><title>p between 0.60 and 0.65: 18 of 2,000</title><rect style="fill:var(--line)" x="539.0" y="187.3" width="12.0" height="2.7"/></g>
  <g tabindex="0"><title>p between 0.65 and 0.70: 19 of 2,000</title><rect style="fill:var(--line)" x="553.0" y="187.2" width="12.0" height="2.9"/></g>
  <g tabindex="0"><title>p between 0.70 and 0.75: 13 of 2,000</title><rect style="fill:var(--line)" x="567.0" y="188.1" width="12.0" height="1.9"/></g>
  <g tabindex="0"><title>p between 0.75 and 0.80: 24 of 2,000</title><rect style="fill:var(--line)" x="581.0" y="186.4" width="12.0" height="3.6"/></g>
  <g tabindex="0"><title>p between 0.80 and 0.85: 19 of 2,000</title><rect style="fill:var(--line)" x="595.0" y="187.2" width="12.0" height="2.9"/></g>
  <g tabindex="0"><title>p between 0.85 and 0.90: 17 of 2,000</title><rect style="fill:var(--line)" x="609.0" y="187.4" width="12.0" height="2.6"/></g>
  <g tabindex="0"><title>p between 0.90 and 0.95: 15 of 2,000</title><rect style="fill:var(--line)" x="623.0" y="187.8" width="12.0" height="2.2"/></g>
  <g tabindex="0"><title>p between 0.95 and 1.00: 19 of 2,000</title><rect style="fill:var(--line)" x="637.0" y="187.2" width="12.0" height="2.9"/></g>
  <text class="ta" x="390.0" y="59.7">p &lt; 0.05: 48.1%</text>
  <text class="m" x="370.0" y="206" text-anchor="middle">0</text>
  <text class="m" x="510.0" y="206" text-anchor="middle">0.5</text>
  <text class="m" x="650.0" y="206" text-anchor="middle">1</text>
  <text class="m" x="650" y="222" text-anchor="end">p-value</text>
  <text class="m" x="40" y="238">2,000 simulated experiments per panel · 10,000 users per arm</text>
</svg>
<figcaption>P-values from 2,000 simulated experiments each. Left: no real effect, and the p-values are flat, with 5% below 0.05 by chance. Right: a real lift, and the p-values pile up near zero, but at this sample size only about half get below 0.05. That's the low power from earlier.</figcaption>
</figure>

The fix: pick one primary metric before the experiment. If you must make claims about many tests, tighten the cut-off. The simplest way is the **Bonferroni correction**: divide $$\alpha$$ by the number of tests, so 0.05 / 20 = 0.0025 each. The **Benjamini-Hochberg** procedure is less strict and controls the share of your "discoveries" that are false, rather than the chance of any false alarm at all.

### 2. Peeking

You plan a two-week test. On day 3 you check: p = 0.04! You stop and ship.

The trouble is that the 5% false alarm rate only holds if you look once, at the end. Every peek is another chance for noise to wander across the line, and noise wanders a lot early on, when there's little data. In a quick simulation of a button that does nothing, checked 20 times along the way and stopped at the first p below 0.05, about **a quarter** of the experiments ended in a false "win".

Either decide the sample size in advance and look once, or use a method built for repeated looks (sequential testing). An ordinary p-value doesn't protect you from peeking.

### 3. Reading "not significant" as "no effect"

Back to the button: estimated +0.80 points, interval −0.05 to +1.65, p ≈ 0.064. The data leave room for no improvement *and* for a useful one. "Not significant" just means this experiment couldn't tell. If you need to show that two things are effectively the same, that's a different test (an equivalence test), with its own planning.

## Choosing a test

The coin and the button used tests for counts and rates. Other data needs other tests, but they mostly share the same shape: **(the difference you saw) / (how much it would wobble by chance)**, compared against what that ratio looks like when nothing is going on.

Two questions get you most of the way to the right one:

1. **What is one observation?** One independent user? The same person measured twice? A whole household? Getting this wrong breaks most tests.
2. **What are you measuring?** A yes/no outcome gives you a rate. Revenue or time on page gives you numbers with an average.

| Situation | Common test | Watch out for |
|---|---|---|
| Two independent conversion rates | Two-proportion z-test | Very small counts need an exact test |
| Two independent averages | Welch's t-test | Big outliers, such as a few huge orders |
| The same people measured twice | Paired t-test | Test the per-person differences |
| Two groups, skewed numbers | Mann-Whitney U test | It compares rankings, not averages |
| Three or more groups | ANOVA, or similar | Then adjust for multiple comparisons |
| Randomised groups you can reshuffle | Permutation test | Shuffle the unit that was randomised |

For averages, Welch's t-test has the familiar shape:

$$
t = \frac{\bar x_B - \bar x_A}{\sqrt{s_A^2/n_A + s_B^2/n_B}}
$$

$$\bar x_A$$ and $$\bar x_B$$ are the two group averages. $$s_A^2$$ and $$s_B^2$$ are their variances, how spread out each group is. Difference on top, wobble underneath, same as before. The result is compared against a **t-distribution**, which is a bell with slightly fatter tails to account for the extra uncertainty of small samples.

```python
from scipy import stats

# one revenue value per independent user in each array
t, p = stats.ttest_ind(revenue_b, revenue_a, equal_var=False)  # Welch's t-test
```

## The checklist

When I read or run a test now, I go through it in this order:

1. **What's the boring explanation?** Write down the null hypothesis, and decide one- or two-sided, before looking at the data.
2. **How big is the difference?** Keep the units: +0.8 percentage points, not just "significant".
3. **How much could it wobble by chance?** Check that observations are independent and the standard error makes sense.
4. **How surprising is it if nothing is going on?** That's the p-value, and it is *not* the chance the null is true.
5. **What rule did we agree on?** Compare against $$\alpha$$ without moving the goalposts, switching metrics or stopping early.
6. **What would we actually do?** Compare the confidence interval with the smallest lift worth shipping, and plan the next test's sample size for an effect that matters.

The coin is the whole idea in miniature: assume fair, count how often fair looks this lopsided, add up the blue bars. Every test after that is the same question with a different way of counting.

## References

1. Wasserstein, R. L. and Lazar, N. A. *The ASA Statement on p-Values: Context, Process, and Purpose*. The American Statistician, 2016. <https://doi.org/10.1080/00031305.2016.1154108>. What p-values do and don't mean.
2. Greenland, S. et al. *Statistical tests, P values, confidence intervals, and power: a guide to misinterpretations*. European Journal of Epidemiology, 2016. <https://doi.org/10.1007/s10654-016-0149-3>. A long list of common misreadings.
3. Neyman, J. and Pearson, E. S. *On the problem of the most efficient tests of statistical hypotheses*. Philosophical Transactions of the Royal Society A, 1933. <https://doi.org/10.1098/rsta.1933.0009>. Where Type I and Type II errors come from.
4. Fisher, R. A. *Statistical Methods for Research Workers*. Oliver and Boyd, 1925. <https://psychclassics.yorku.ca/Fisher/Methods/>. The origin of the 0.05 convention.
5. Welch, B. L. *The generalization of "Student's" problem when several different population variances are involved*. Biometrika, 1947. <https://doi.org/10.1093/biomet/34.1-2.28>. The unequal-variance t-test.
6. statsmodels developers. *statsmodels.stats.proportion.proportions_ztest*. <https://www.statsmodels.org/stable/generated/statsmodels.stats.proportion.proportions_ztest.html>.
7. SciPy developers. *scipy.stats.ttest_ind*. <https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.ttest_ind.html>. Welch's t-test via `equal_var=False`.
8. Benjamini, Y. and Hochberg, Y. *Controlling the False Discovery Rate: A Practical and Powerful Approach to Multiple Testing*. Journal of the Royal Statistical Society: Series B, 1995. <https://doi.org/10.1111/j.2517-6161.1995.tb02031.x>.
9. Johari, R. et al. *Peeking at A/B Tests*. Proceedings of KDD, 2017. <https://doi.org/10.1145/3097983.3097992>. Why repeated looks inflate false positives, and what to do instead.
10. Kohavi, R., Tang, D. and Xu, Y. *Trustworthy Online Controlled Experiments*. Cambridge University Press, 2020. <https://doi.org/10.1017/9781108653985>. The practical guide to A/B testing.

<script>
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const SVG = 'http://www.w3.org/2000/svg';
  function svg(tag, attrs, text) {
    const el = document.createElementNS(SVG, tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    if (text !== undefined) el.textContent = text;
    return el;
  }
  function label(chart, x, y, text, anchor = 'middle', fill = 'var(--muted)') {
    chart.append(svg('text', { x, y, 'text-anchor': anchor, fill, 'font-size': 14 }, text));
  }
  function reset(chart, title, desc) {
    chart.replaceChildren(svg('title', { id: chart.id + '-title' }, title), svg('desc', { id: chart.id + '-desc' }, desc));
    chart.setAttribute('aria-labelledby', chart.id + '-title ' + chart.id + '-desc');
  }
  const pct = (x, d = 1) => (100 * x).toFixed(d) + '%';
  const fmtP = p => p < 0.0001 ? '< 0.0001' : '= ' + p.toFixed(4);
  // Normal CDF approximation (absolute error < 8e-8).
  function normalCDF(x) {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const tail = Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI) * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
    return x < 0 ? tail : 1 - tail;
  }
  function normalQuantile(p) {
    let lo = -9, hi = 9;
    for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2; if (normalCDF(mid) < p) lo = mid; else hi = mid; }
    return (lo + hi) / 2;
  }
  // Ways to get k heads in 10 fair flips, out of 1,024.
  const ways = [1, 10, 45, 120, 210, 252, 210, 120, 45, 10, 1];
  const edge = k => Math.abs(k - 5) >= 3;

  // 1. Build the ten-flip distribution one trial at a time.
  (() => {
    const root = $('pv-build');
    const model = ways.map(w => w / 1024);
    let counts = Array(11).fill(0), current = [], total = 0, timer = null, target = 0;
    const cells = model.map((p, k) => {
      const cell = document.createElement('div'); cell.className = 'build-cell' + (edge(k) ? ' edge' : '');
      const track = document.createElement('div'); track.className = 'build-track';
      const bar = document.createElement('div'); bar.className = 'build-bar';
      const mark = document.createElement('div'); mark.className = 'build-model';
      track.append(bar, mark);
      const name = document.createElement('span'); name.textContent = k;
      const count = document.createElement('span'); count.className = 'build-count';
      cell.append(track, name, count);
      $('build-chart').append(cell);
      return { cell, bar, mark, count };
    });
    function draw(announce) {
      $('build-flips').replaceChildren(...Array.from({ length: 10 }, (_, i) => {
        const s = document.createElement('span'); s.textContent = current[i] || '·';
        if (current[i] === 'H') s.className = 'heads';
        return s;
      }));
      const shares = counts.map(c => total ? c / total : 0);
      const top = Math.max(0.3, ...shares) * 1.05;
      $('build-scale').textContent = 'Bar height: share of finished trials. Top of chart = ' + pct(top, 0) + '.';
      cells.forEach(({ cell, bar, mark, count }, k) => {
        bar.style.height = (shares[k] / top * 100) + '%';
        mark.style.bottom = (model[k] / top * 100) + '%';
        count.textContent = counts[k];
        cell.title = k + ' heads: ' + counts[k] + ' trials (' + pct(shares[k]) + '); fair-coin chance ' + pct(model[k]);
      });
      $('build-chart').setAttribute('aria-label', 'Finished trials: ' + total + '. ' + counts.map((c, k) => k + ' heads: ' + c).join('; ') + '.');
      if (!announce) return;
      const lopsided = counts.reduce((s, c, k) => s + (edge(k) ? c : 0), 0);
      const heads = current.filter(x => x === 'H').length;
      $('build-status').textContent = total
        ? 'Finished trials: ' + total.toLocaleString('en-US') + '. Trials with 8 or more heads, or 2 or fewer: ' + lopsided + ' (' + pct(lopsided / total) + '). The exact fair-coin answer is 10.9%.' + (current.length && current.length < 10 ? ' Current trial: ' + current.length + ' flips, ' + heads + ' heads.' : '')
        : 'No finished trials yet. Flip ten times, or press Play.';
    }
    function flip() {
      if (current.length === 10) current = [];
      current.push(Math.random() < 0.5 ? 'H' : 'T');
      if (current.length === 10) { counts[current.filter(x => x === 'H').length]++; total++; }
      draw(!timer || current.length === 10);
      if (timer && total >= target) stop();
    }
    function stop() {
      if (timer) clearInterval(timer);
      timer = null;
      ['build-play', 'build-step', 'build-fast'].forEach(id => $(id).disabled = false);
      $('build-pause').disabled = true;
      draw(true);
    }
    $('build-step').addEventListener('click', flip);
    $('build-play').addEventListener('click', () => {
      target = total + 100;
      ['build-play', 'build-step', 'build-fast'].forEach(id => $(id).disabled = true);
      $('build-pause').disabled = false;
      timer = setInterval(flip, 25);
    });
    $('build-pause').addEventListener('click', stop);
    $('build-fast').addEventListener('click', () => {
      for (let t = 0; t < 1000; t++) { let h = 0; for (let i = 0; i < 10; i++) h += Math.random() < 0.5 ? 1 : 0; counts[h]++; total++; }
      current = [];
      draw(true);
    });
    $('build-reset').addEventListener('click', () => { stop(); counts = Array(11).fill(0); current = []; total = 0; draw(true); });
    document.addEventListener('visibilitychange', () => { if (document.hidden && timer) stop(); });
    draw(true); root.hidden = false;
  })();

  // 2. Exact coin p-value: click a result, see which bars count.
  (() => {
    const root = $('pv-coin'), heads = $('pv-heads'), sided = $('pv-sided');
    const bars = ways.map((w, k) => {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'pv-bar';
      button.setAttribute('aria-label', k + ' heads, chance ' + pct(w / 1024, 2) + '. Use as my result.');
      const bar = document.createElement('span'); bar.style.height = (w / 252 * 140) + 'px'; bar.setAttribute('aria-hidden', 'true');
      const name = document.createElement('small'); name.textContent = k;
      button.append(bar, name);
      button.addEventListener('click', () => { heads.value = k; update(); });
      $('pv-bars').append(button);
      return button;
    });
    function update() {
      const h = Number(heads.value), mode = sided.value;
      $('pv-heads-value').textContent = h;
      const counted = ways.map((_, k) => mode === 'upper' ? k >= h : Math.abs(k - 5) >= Math.abs(h - 5));
      bars.forEach((bar, k) => { bar.dataset.tail = counted[k]; bar.setAttribute('aria-pressed', k === h ? 'true' : 'false'); });
      const n = ways.reduce((s, w, k) => s + (counted[k] ? w : 0), 0), p = n / 1024;
      $('pv-coin-result').textContent = 'Counted: ' + counted.flatMap((yes, k) => yes ? [k] : []).join(', ') + ' heads. That is ' + n + ' of 1,024 orders, so p ' + fmtP(p) + ' (' + pct(p) + '). ' + (p < 0.05 ? 'Below 5%: significant.' : 'Not below 5%: not significant.');
    }
    heads.addEventListener('input', update); sided.addEventListener('change', update);
    $('pv-flip').addEventListener('click', () => { heads.value = Array.from({ length: 10 }, () => Math.random() < 0.5 ? 1 : 0).reduce((a, b) => a + b, 0); update(); });
    update(); root.hidden = false;
  })();

  // 3. Permutation test for the button: deal 2,080 buyers into two groups of 10,000.
  (() => {
    const root = $('pv-shuffle'), chart = $('pv-shuffle-chart');
    const N = 10000, BUYERS = 2080, OBS = 80; // differences are kept as (B buyers - A buyers), so 80 = 0.8 points
    const SE = Math.sqrt(0.104 * 0.896 * 2 / N) * 100; // pooled SE in percentage points
    let inner = Array(40).fill(0), outer = Array(40).fill(0), total = 0, extreme = 0, last = null;
    const bin = m => Math.min(39, Math.max(0, Math.floor((m + 200) / 10))); // 0.1-point bins from -2.0 to +2.0
    function shuffleOnce() {
      let left = BUYERS, pool = 2 * N, b = 0;
      for (let i = 0; i < N; i++) { if (Math.random() * pool < left) { b++; left--; } pool--; }
      const m = b - (BUYERS - b);
      (Math.abs(m) >= OBS ? outer : inner)[bin(m)]++;
      if (Math.abs(m) >= OBS) extreme++;
      total++;
      last = { a: BUYERS - b, b, m };
    }
    function draw() {
      const L = 50, R = 620, T = 30, B = 230, x = v => L + (v + 2) / 4 * (R - L), w = (R - L) / 40;
      const bell = document.getElementById('pv-sh-bell').checked;
      const expected = v => total * 0.1 * Math.exp(-0.5 * (v / SE) ** 2) / (SE * Math.sqrt(2 * Math.PI));
      const top = Math.max(5, ...inner.map((c, i) => c + outer[i]), bell ? expected(0) : 0) * 1.1;
      const y = c => B - c / top * (B - T);
      reset(chart, 'Differences from shuffled labels', total + ' shuffles. ' + extreme + ' were at least 0.8 points from zero (' + (total ? pct(extreme / total) : '0%') + ').');
      for (let i = 0; i < 40; i++) {
        const c1 = inner[i], c2 = outer[i];
        if (!c1 && !c2) continue;
        const g = svg('g', { tabindex: 0 });
        const lo = (i * 10 - 200) / 100;
        g.append(svg('title', {}, lo.toFixed(1) + ' to ' + (lo + 0.1).toFixed(1) + ' points: ' + (c1 + c2) + ' shuffles'));
        if (c2) g.append(svg('rect', { x: L + i * w + 1, y: y(c1 + c2), width: w - 2, height: B - y(c2), fill: 'var(--l0)' }));
        if (c1) g.append(svg('rect', { x: L + i * w + 1, y: y(c1), width: w - 2, height: B - y(c1), fill: 'var(--muted)', 'fill-opacity': 0.3, stroke: 'var(--muted)', 'stroke-width': 0.6 }));
        chart.append(g);
      }
      if (bell && total) {
        let d = '';
        for (let i = 0; i <= 200; i++) { const v = -2 + 4 * i / 200; d += (i ? ' L' : 'M') + x(v).toFixed(1) + ',' + y(expected(v)).toFixed(1); }
        chart.append(svg('path', { d, fill: 'none', stroke: 'var(--l3)', 'stroke-width': 2.5 }));
      }
      [-0.8, 0.8].forEach(v => chart.append(svg('line', { x1: x(v), x2: x(v), y1: T - 6, y2: B, stroke: 'var(--fg)', 'stroke-dasharray': '5 4', 'stroke-width': 1.5 })));
      label(chart, x(0.8) + 6, T + 4, 'real +0.8', 'start', 'var(--fg)');
      label(chart, x(-0.8) - 6, T + 4, 'mirror −0.8', 'end', 'var(--fg)');
      chart.append(svg('line', { x1: L, x2: R, y1: B, y2: B, stroke: 'var(--muted)' }));
      [-2, -1, 0, 1, 2].forEach(v => label(chart, x(v), B + 22, (v > 0 ? '+' : '') + v));
      label(chart, (L + R) / 2, B + 48, 'shuffled B − A, percentage points');
      const lastText = last ? ' Last shuffle: A ' + last.a.toLocaleString('en-US') + ' buyers, B ' + last.b.toLocaleString('en-US') + ', difference ' + (last.m >= 0 ? '+' : '') + (last.m / 100).toFixed(2) + ' points.' : '';
      $('pv-shuffle-result').textContent = total
        ? 'Shuffles: ' + total.toLocaleString('en-US') + '. At least 0.8 points from zero: ' + extreme.toLocaleString('en-US') + ', so the simulated p-value is ' + pct(extreme / total) + '.' + lastText
        : 'No shuffles yet. Start with one, then do a thousand.';
    }
    function run(times) { for (let i = 0; i < times && total < 50000; i++) shuffleOnce(); draw(); }
    [1, 100, 1000].forEach(t => $('pv-sh-' + t).addEventListener('click', () => run(t)));
    $('pv-sh-reset').addEventListener('click', () => { inner = Array(40).fill(0); outer = Array(40).fill(0); total = 0; extreme = 0; last = null; draw(); });
    $('pv-sh-bell').addEventListener('change', draw);
    draw(); root.hidden = false;
  })();

  // 4. Power: null and alternative sampling distributions on a fixed axis.
  (() => {
    const root = $('pv-power'), chart = $('pv-power-chart');
    const MIN = -4, MAX = 4, L = 50, R = 650, T = 30, B = 220;
    const x = v => L + (Math.min(MAX, Math.max(MIN, v)) - MIN) / (MAX - MIN) * (R - L);
    function model(a, lift, n, alpha) {
      const b = a + lift, pooled = (a + b) / 2;
      const se0 = Math.sqrt(2 * pooled * (1 - pooled) / n), se1 = Math.sqrt((a * (1 - a) + b * (1 - b)) / n);
      const cut = normalQuantile(1 - alpha / 2) * se0;
      return { se0, se1, cut, power: normalCDF((-cut - lift) / se1) + normalCDF((lift - cut) / se1) };
    }
    function update() {
      const a = Number($('pv-baseline').value) / 100, lift = Number($('pv-lift').value) / 100;
      const n = Number($('pv-n').value), alpha = Number($('pv-alpha').value);
      const m = model(a, lift, n, alpha);
      $('pv-baseline-value').textContent = pct(a);
      $('pv-lift-value').textContent = (lift >= 0 ? '+' : '') + (100 * lift).toFixed(1) + ' points';
      $('pv-n-value').textContent = n.toLocaleString('en-US');
      reset(chart, 'Where measured lifts land, with and without a real effect', 'No-effect curve centred on 0, true-lift curve centred on ' + (100 * lift).toFixed(1) + ' points. Cut-offs at plus and minus ' + (100 * m.cut).toFixed(2) + ' points. Power ' + pct(m.power) + '.');
      // Work in percentage points from here on.
      const s0 = 100 * m.se0, s1 = 100 * m.se1, mu = 100 * lift, cut = 100 * m.cut;
      const pdf = (v, mean, s) => Math.exp(-0.5 * ((v - mean) / s) ** 2) / s;
      const top = 1.08 / Math.min(s0, s1), y = d => B - d / top * (B - T);
      function shade(from, to) {
        const lo = Math.max(MIN, from), hi = Math.min(MAX, to);
        if (lo >= hi) return;
        let d = 'M' + x(lo) + ',' + B;
        for (let i = 0; i <= 150; i++) { const v = lo + (hi - lo) * i / 150; d += ' L' + x(v).toFixed(1) + ',' + y(pdf(v, mu, s1)).toFixed(1); }
        chart.append(svg('path', { d: d + ' L' + x(hi) + ',' + B + ' Z', fill: 'var(--l3)', opacity: 0.3 }));
      }
      shade(MIN, -cut); shade(cut, MAX);
      function curve(mean, s, colour) {
        let d = '';
        for (let i = 0; i <= 400; i++) { const v = MIN + (MAX - MIN) * i / 400; d += (i ? ' L' : 'M') + x(v).toFixed(1) + ',' + y(pdf(v, mean, s)).toFixed(1); }
        chart.append(svg('path', { d, fill: 'none', stroke: colour, 'stroke-width': 2.5 }));
      }
      chart.append(svg('line', { x1: L, x2: R, y1: B, y2: B, stroke: 'var(--muted)' }));
      [-cut, cut].forEach(c => { if (c > MIN && c < MAX) chart.append(svg('line', { x1: x(c), x2: x(c), y1: T - 10, y2: B, stroke: 'var(--muted)', 'stroke-dasharray': '5 4' })); });
      curve(0, s0, 'var(--l0)'); curve(mu, s1, 'var(--l3)');
      label(chart, R, T - 12, 'shaded purple = power = ' + pct(m.power, 0), 'end', 'var(--l3)');
      for (let v = MIN; v <= MAX; v++) label(chart, x(v), B + 22, (v > 0 ? '+' : '') + v);
      label(chart, (L + R) / 2, B + 48, 'measured lift in one experiment, percentage points');
      $('pv-power-result').textContent = 'Power: ' + pct(m.power) + '. A result needs to be more than ' + cut.toFixed(2) + ' points away from zero to count as significant at α = ' + pct(alpha, 0) + '. Typical wobble (standard error): ' + s0.toFixed(2) + ' points.';
    }
    ['pv-baseline', 'pv-lift', 'pv-n'].forEach(id => $(id).addEventListener('input', update));
    $('pv-alpha').addEventListener('change', update);
    update(); root.hidden = false;
  })();
})();
</script>
