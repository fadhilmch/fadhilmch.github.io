---
layout: post
title: "Real or luck? P-values, significance and statistical tests"
date: 2021-10-16
math: true
tags:
- exp
- data
summary: What a p-value actually measures, why 0.05, how a statistical test works from start to finish, and the ways a "significant" result can still mislead you.
---

You change the colour of a button. Conversion goes from 10.0% to 10.8%. Is the new button better, or did you get a lucky week?

That question, *is this difference real or is it noise?*, is what statistical significance tries to answer. The tools for it (p-values, significance levels, t-tests) are some of the most used and most misread ideas in data work. Explanations tend to give either a formula with no intuition or intuition with no formula. This post gives both: an analogy, a coin you can check by hand, the equations, and a worked A/B test with real numbers.

## The courtroom analogy

A statistical test works like a criminal trial.

- The defendant is **presumed innocent**. In statistics, this default is the **null hypothesis**, $$H_0$$: *the change did nothing, and any difference is luck.*
- The prosecution brings **evidence**. In statistics, that's your data.
- The jury asks one question: *if the defendant were innocent, how surprising would this evidence be?* If it would be very surprising, they convict. The answer to that question is the **p-value**.
- The bar for conviction, "beyond reasonable doubt", is fixed **before** the trial. In statistics it's the **significance level**, $$\alpha$$, usually 5%.

Two details of the analogy matter later. First, the jury never proves innocence. "Not guilty" means "not enough evidence", not "definitely innocent". A non-significant result works the same way. Second, even a fair court sometimes convicts an innocent person. Setting $$\alpha = 0.05$$ means you accept that, when the change truly does nothing, you'll still declare it a winner 5% of the time.

## Start with a coin

A friend hands you a coin and says it's fair. You flip it 10 times and get **8 heads**. Should you believe them?

Take their claim as the null hypothesis: the coin is fair, so each flip is heads with probability 0.5. Under that assumption, the number of heads $$X$$ in 10 flips follows a **binomial distribution**:

$$
P(X = k) = \binom{10}{k} \left(\tfrac{1}{2}\right)^{10} = \frac{\binom{10}{k}}{1024}
$$

There are $$2^{10} = 1024$$ equally likely sequences of flips, and $$\binom{10}{k}$$ of them have exactly $$k$$ heads. Here is the whole distribution:

<figure class="fig">
<svg viewBox="0 0 680 252" role="img" aria-labelledby="p1t p1d">
  <title id="p1t">How often a fair coin gives each number of heads in 10 flips</title>
  <desc id="p1d">Bar chart of the binomial distribution for 10 fair flips. 5 heads is most likely at 24.6%. The bars for 8, 9 and 10 heads are highlighted; together they have probability 5.5%. The mirror bars for 0, 1 and 2 heads are also marked, bringing the two-sided total to 10.9%.</desc>
  <line class="grid" x1="60" x2="650" y1="200" y2="200"/>
  <g tabindex="0"><title>0 heads: 0.1%</title><rect class="fb" x="66.0" y="199.4" width="41.6" height="0.6" rx="2"/></g>
  <text class="m" x="86.8" y="216" text-anchor="middle">0</text>
  <g tabindex="0"><title>1 heads: 1.0%</title><rect class="fb" x="119.6" y="193.6" width="41.6" height="6.4" rx="2"/></g>
  <text class="m" x="140.5" y="216" text-anchor="middle">1</text>
  <g tabindex="0"><title>2 heads: 4.4%</title><rect class="fb" x="173.3" y="171.3" width="41.6" height="28.7" rx="2"/></g>
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
  <text class="tb" x="60" y="60">0, 1 or 2 heads: 5.5%</text>
  <text class="m" x="60" y="16">if the coin is fair · 1,024 equally likely sequences</text>
</svg>
<figcaption>What a fair coin does over 10 flips. Five heads is most likely, but 8 or more still happens 5.5% of the time. Counting the equally extreme results on the other side (2 or fewer heads) doubles that to 10.9%.</figcaption>
</figure>

The p-value asks: *if the coin were fair, how often would I see a result **at least this extreme**?* "At least as extreme" as 8 heads means 8, 9 or 10:

$$
P(X \ge 8) = \frac{\binom{10}{8} + \binom{10}{9} + \binom{10}{10}}{1024} = \frac{45 + 10 + 1}{1024} \approx 0.055
$$

If you'd be just as suspicious of a coin that landed tails 8 times, you also count 0, 1 and 2 heads. That's a **two-sided** test, and the p-value doubles to about 0.109.

So a fair coin gives a result this lopsided about one time in nine. That's unusual, but hardly damning. With $$\alpha = 0.05$$, you don't have enough evidence to call the coin unfair. Notice what that does *not* mean: you haven't shown the coin is fair. Ten flips just can't tell a fair coin from a slightly biased one.

<style>
.pv-widget { margin:32px 0; padding:20px; border:1px solid var(--line); border-radius:8px; background:var(--panel); }
.pv-widget[hidden] { display:none; }
.prose .pv-widget h3 { margin:0 0 8px; }
.prose .pv-widget p { margin:12px 0; font-size:14px; }
.pv-widget .pv-controls { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; margin:20px 0; }
.pv-widget label { display:block; font-size:14px; }
.pv-widget input, .pv-widget select { width:100%; min-width:0; box-sizing:border-box; min-height:44px; accent-color:var(--l0); }
.pv-widget select, .pv-widget button { border:1px solid var(--line); border-radius:4px; color:var(--fg); background:var(--bg); font:inherit; padding:8px; min-height:44px; cursor:pointer; }
.pv-widget :focus-visible { outline:2px solid var(--l0); outline-offset:3px; }
.pv-widget .pv-note { color:var(--muted); }
.pv-widget .pv-result { border-top:1px solid var(--line); padding-top:12px; font-family:'Geist Mono',monospace; overflow-wrap:anywhere; }
.pv-widget .pv-bars { display:grid; grid-template-columns:repeat(11,minmax(0,1fr)); gap:3px; height:180px; align-items:end; margin:20px 0 8px; }
.pv-widget .pv-bar { padding:0; border:0; background:transparent; height:100%; display:flex; flex-direction:column; justify-content:end; align-items:stretch; }
.pv-widget .pv-bar span { display:block; background:var(--line); border:1px solid var(--muted); min-height:2px; box-sizing:border-box; }
.pv-widget .pv-bar[data-tail="true"] span { background:var(--l0); border-color:var(--l0); }
.pv-widget .pv-bar[aria-pressed="true"] { outline:2px solid var(--fg); outline-offset:1px; }
.pv-widget .pv-bar small { font-size:12px; padding:6px 0; }
.pv-widget svg { display:block; width:100%; height:auto; }
.pv-widget .pv-legend { display:flex; gap:16px; flex-wrap:wrap; font-size:13px; }
.pv-widget .pv-null { color:var(--l0); }
.pv-widget .pv-alt { color:var(--l3); }
@media(max-width:480px) { .pv-widget { padding:14px; } .pv-widget .pv-controls { grid-template-columns:1fr; gap:10px; } .pv-widget svg text { font-size:22px; } }
</style>
<section class="pv-widget" id="pv-coin" aria-labelledby="pv-coin-title" hidden>
<h3 id="pv-coin-title">Try it: what counts as extreme?</h3>
<p>Choose a heads count, or click a bar. Blue bars are the outcomes counted in the p-value. Each bar's height is its exact probability under a fair coin.</p>
<div class="pv-controls">
<label for="pv-heads">Heads in 10 flips: <output id="pv-heads-value" for="pv-heads">8</output><input id="pv-heads" type="range" min="0" max="10" step="1" value="8"></label>
<label for="pv-sided">Alternative hypothesis<select id="pv-sided"><option value="two">Two-sided: coin is not fair</option><option value="upper">One-sided: coin favours heads</option></select></label>
</div>
<div class="pv-bars" id="pv-bars" role="group" aria-label="Choose the observed number of heads"></div>
<button id="pv-flip" type="button">Simulate 10 fair flips</button>
<p class="pv-result" id="pv-coin-result" role="status" aria-live="polite" aria-atomic="true"></p>
<p class="pv-note">The simulated coin is always fair. A small p-value can still happen. Choose one- or two-sided before collecting data, not whichever gives the smaller p-value afterwards. The one-sided test here always counts the upper tail, even when you observe fewer than 5 heads.</p>
</section>
<noscript><p>The static coin calculation above works without JavaScript. Enable JavaScript to explore other heads counts.</p></noscript>

## What a p-value is, precisely

In general:

$$
p = P\big(\text{a result at least as extreme as the one observed} \;\big|\; H_0 \text{ is true}\big)
$$

The vertical bar reads "given". Everything is calculated **in a world where the null hypothesis is true**. That one detail rules out the most common misreadings:

- **It is not the probability that the null hypothesis is true.** $$p = 0.03$$ does not mean "3% chance the button does nothing". The p-value assumes the null is true; it can't also tell you how likely that assumption is.
- **It is not the probability the result is a fluke.** Same mistake, different words.
- **$$1 - p$$ is not the probability your change works.** $$p = 0.03$$ doesn't mean 97% confidence the new button is better.
- **It doesn't measure how big the effect is.** A tiny effect with a huge sample can have a tiny p-value. More on that below.

A better one-line reading: *the p-value measures how surprised you should be by the data if nothing were going on.* Small p, big surprise.

## Two ways to be wrong

Every test ends in a decision, and the decision can go wrong in two directions. Here they are, with the courtroom alongside:

| | Null is true (no real effect) | Null is false (real effect) |
|---|---|---|
| **You reject the null** ("significant") | **Type I error**, false positive: convicting an innocent person. Happens with probability α. | Correct: a real effect found. Probability = **power**. |
| **You don't reject** ("not significant") | Correct: nothing there, nothing claimed. | **Type II error**, false negative: a guilty person walks free. Probability β. |

A smoke alarm is a good way to hold this in your head. Make it very sensitive and it goes off every time you make toast (Type I errors). Make it very insensitive and it stays quiet during a real fire (Type II errors). You can't drive both to zero with the same data. $$\alpha$$ sets how often you tolerate false alarms, and the only way to catch more real fires without more false alarms is **more data**.

**Power**, $$1 - \beta$$, is the probability of detecting an effect *if it really exists*. Industry practice is usually to design experiments for 80% power at the smallest effect you'd care about. We'll compute it for the button in a moment.

## How any statistical test works

Every classical test, whatever its name, follows the same five steps:

1. **State the hypotheses.** $$H_0$$: no difference. $$H_1$$: some difference.
2. **Pick $$\alpha$$** before looking at the data. Usually 0.05.
3. **Compute a test statistic**: one number that summarises how far the data are from what $$H_0$$ predicts.
4. **Find its distribution under $$H_0$$**: what values the statistic would take if nothing were going on.
5. **Compute the p-value** (how far into the tail of that distribution your statistic falls) and compare it with $$\alpha$$.

Most test statistics have the same shape, **signal divided by noise**:

$$
\text{test statistic} = \frac{\text{observed difference} - \text{difference expected under } H_0}{\text{standard error of the difference}}
$$

The numerator is the size of what you saw. The denominator, the **standard error**, is how much that number would wobble from sample to sample by chance alone. A statistic of 3 means "the difference is three times bigger than chance typically produces". Imagine trying to hear someone in a noisy café: what matters isn't how loud they are, it's how loud they are compared with the room.

## Worked example: the button

Back to the button. Each arm of the experiment got 10,000 users:

| Arm | Users | Conversions | Rate |
|---|---:|---:|---:|
| Control (old button) | 10,000 | 1,000 | 10.0% |
| Variant (new button) | 10,000 | 1,080 | 10.8% |

The right test for comparing two rates is the **two-proportion z-test**. Under $$H_0$$ both buttons share one true rate, so we estimate it by pooling both arms:

$$
\hat p = \frac{1000 + 1080}{10000 + 10000} = 0.104
$$

The standard error of the difference between two rates, under $$H_0$$:

$$
SE = \sqrt{\hat p\,(1 - \hat p)\left(\frac{1}{n_A} + \frac{1}{n_B}\right)} = \sqrt{0.104 \times 0.896 \times \frac{2}{10000}} \approx 0.00432
$$

Signal over noise:

$$
z = \frac{\hat p_B - \hat p_A}{SE} = \frac{0.108 - 0.100}{0.00432} \approx 1.85
$$

When samples are this large, the central limit theorem says $$z$$ follows a **standard normal distribution** if $$H_0$$ is true. The p-value is the area in both tails beyond 1.85:

$$
p = 2\,\big(1 - \Phi(|z|)\big) = 2\,(1 - \Phi(1.85)) \approx 0.064
$$

where $$\Phi$$ is the cumulative distribution function of the standard normal.

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
<figcaption>The null distribution of z. If the button did nothing, z-scores beyond ±1.85 would still turn up 6.4% of the time (shaded). The dashed lines at ±1.96 mark the 5% cut-off; the observed z falls just inside them.</figcaption>
</figure>

So the verdict is **not significant**: $$p = 0.064 > 0.05$$. A 0.8-point lift is exactly the kind of difference that, with 10,000 users per arm, luck produces about one time in sixteen.

Two things are worth noticing. First, the magic number 1.96 is just the z-score that leaves 2.5% in each tail, so "$$\lvert z\rvert > 1.96$$" and "$$p < 0.05$$" are the same rule. Second, 0.064 versus 0.05 is a hair's breadth. The line at 0.05 is a convention from Ronald Fisher in the 1920s, not a law of nature. A p-value of 0.064 is *weak evidence*, not *no evidence*.

### Same effect, more data

Now run the same test with 20,000 users per arm, and suppose the rates come out identical: 10.0% and 10.8%. The standard error shrinks, because it scales with $$1/\sqrt{n}$$:

$$
SE = \sqrt{0.104 \times 0.896 \times \frac{2}{20000}} \approx 0.00305, \qquad z = \frac{0.008}{0.00305} \approx 2.62, \qquad p \approx 0.009
$$

Now it's clearly significant. **The effect didn't change; your ability to see it did.** The p-value mixes up two things, how big the effect is and how much data you have, which is why it should never be read as a measure of importance.

### How much data you needed

This is what power analysis is for. With 10,000 users per arm, the chance of detecting a true 10% → 10.8% lift was only about **46%**: a coin flip. The sample size needed per arm for 80% power at $$\alpha = 0.05$$ is approximately:

$$
n \approx \frac{\left(z_{1-\alpha/2} + z_{1-\beta}\right)^2 \,\big[p_A(1-p_A) + p_B(1-p_B)\big]}{(p_B - p_A)^2}
= \frac{(1.96 + 0.84)^2 \times (0.090 + 0.096)}{0.008^2} \approx 22{,}900
$$

The original test was underpowered from the start. Its non-significant result mostly says "we didn't collect enough data to tell", which is why power analysis belongs *before* the experiment, not after.

<section class="pv-widget" id="pv-power" aria-labelledby="pv-power-title" hidden>
<h3 id="pv-power-title">Try it: same effect, more data</h3>
<p>Set a true effect and a sample size before the experiment. The blue curve is the no-effect world; the pink curve is the world with your chosen effect. Shaded pink tails are power: the chance of crossing either dashed rejection boundary.</p>
<div class="pv-controls">
<label for="pv-baseline">Control rate: <output id="pv-baseline-value" for="pv-baseline">10.0%</output><input id="pv-baseline" type="range" min="5" max="50" step="1" value="10"></label>
<label for="pv-lift">True lift: <output id="pv-lift-value" for="pv-lift">0.8 percentage points</output><input id="pv-lift" type="range" min="-3" max="3" step="0.1" value="0.8"></label>
<label for="pv-n">Users per arm: <output id="pv-n-value" for="pv-n">10,000</output><input id="pv-n" type="range" min="1000" max="50000" step="1000" value="10000"></label>
<label for="pv-alpha">Significance level<select id="pv-alpha"><option value="0.01">1%</option><option value="0.05" selected>5%</option><option value="0.10">10%</option></select></label>
</div>
<svg id="pv-power-chart" viewBox="0 0 680 260" role="img" aria-labelledby="pv-power-chart-title pv-power-chart-desc"><title id="pv-power-chart-title">Sampling distributions of the conversion-rate difference</title><desc id="pv-power-chart-desc"></desc></svg>
<div class="pv-legend"><span class="pv-null">Blue: null (no effect)</span><span class="pv-alt">Pink: chosen true effect</span><span>Dashed: rejection cut-offs</span></div>
<p class="pv-result" id="pv-power-result" role="status" aria-live="polite" aria-atomic="true"></p>
<p class="pv-note">This is a two-sided, fixed-sample normal approximation for independent users and equal-sized arms. The curves describe repeated experiments, not a probability that the null is true. The example p-value assumes observed rates equal the chosen true rates; real samples fluctuate. Power is a planning quantity, not a reinterpretation of an observed p-value. Everything runs in your browser.</p>
</section>
<noscript><p>Without JavaScript, the worked example above still shows why doubling the sample size changes the p-value without changing the effect.</p></noscript>

## Confidence intervals say more than p-values

A p-value collapses everything into one number. A **95% confidence interval** keeps the two things you actually care about apart: how big the effect looks, and how uncertain that estimate is.

$$
(\hat p_B - \hat p_A) \pm 1.96 \times SE_{\text{unpooled}}, \qquad SE_{\text{unpooled}} = \sqrt{\frac{\hat p_A(1-\hat p_A)}{n_A} + \frac{\hat p_B(1-\hat p_B)}{n_B}}
$$

(For intervals, the standard error isn't pooled: we're no longer assuming $$H_0$$.) For the 10,000-per-arm test, that gives **+0.80 points, from −0.05 to +1.65**. The interval contains zero, which is the same thing as $$p > 0.05$$ seen from another angle. It also shows you *why*: the data are consistent with anything from a tiny loss to a healthy 1.6-point gain.

The interval also exposes the opposite trap. Imagine a huge site with 2 million users per arm, where the variant converts at 10.1% instead of 10.0%:

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
<figcaption>Point estimates and 95% confidence intervals. The first test can't rule out zero. The second can. The third is overwhelmingly "significant" (p = 0.0009), yet its entire interval sits below the +0.5 point lift that would justify the work.</figcaption>
</figure>

With enough data, *any* difference becomes statistically significant, including ones too small to matter. **Statistical significance is not practical significance.** Before the experiment, decide the smallest effect worth acting on, then check whether the interval clears it, not only whether it clears zero.

## Choosing a test

The five steps stay the same; what changes is the test statistic and its null distribution, which depend on your data. A rough guide:

| Your data | Question | Usual test |
|---|---|---|
| Two rates (converted or not) | Do the rates differ? | Two-proportion z-test, or chi-square test |
| A number per user (revenue, time), two groups | Do the means differ? | Welch's t-test |
| Same units measured twice (before/after) | Did each unit change? | Paired t-test |
| Skewed numbers or ranks, two groups | Does one group tend to be higher? | Mann–Whitney U test |
| Three or more groups | Do any means differ? | ANOVA, then pairwise follow-ups |
| Anything, if unsure | Any of the above | Permutation test |

For means, **Welch's t-test** is the workhorse. Its statistic has the same signal-over-noise shape:

$$
t = \frac{\bar x_B - \bar x_A}{\sqrt{\dfrac{s_A^2}{n_A} + \dfrac{s_B^2}{n_B}}}
$$

where $$\bar x$$ is each group's mean and $$s^2$$ its sample variance. Under $$H_0$$ it follows a t-distribution, which looks like the normal curve with fatter tails for small samples, and becomes the normal curve as samples grow. Unlike the classic Student's t-test, Welch's version doesn't assume the two groups have equal variance, so it's the safer default.

In practice you don't compute these by hand:

```python
from scipy import stats
from statsmodels.stats.proportion import proportions_ztest

# Two rates: conversions and users per arm
z, p = proportions_ztest(count=[1080, 1000], nobs=[10000, 10000])
print(f"z = {z:.2f}, p = {p:.3f}")   # z = 1.85, p = 0.064

# Two means: revenue per user in each arm (arrays)
t, p = stats.ttest_ind(revenue_b, revenue_a, equal_var=False)  # Welch
```

## The permutation test: significance you can see

If the formulas feel abstract, the **permutation test** shows what they approximate. The idea: if the button truly did nothing, then the labels "control" and "variant" are arbitrary. Any user could have been in either group, and the outcome would be the same. So shuffle the labels many times, recompute the difference each time, and see how often a shuffle beats the real difference.

```python
import numpy as np

rng = np.random.default_rng(0)
control = np.r_[np.ones(1000), np.zeros(9000)]   # 1,000 of 10,000 converted
variant = np.r_[np.ones(1080), np.zeros(8920)]   # 1,080 of 10,000 converted

observed = variant.mean() - control.mean()       # 0.008
pooled = np.concatenate([control, variant])

diffs = []
for _ in range(10_000):
    rng.shuffle(pooled)                          # pretend labels don't matter
    diffs.append(pooled[10_000:].mean() - pooled[:10_000].mean())

p = np.mean(np.abs(diffs) >= abs(observed))
print(p)   # about 0.06, close to the z-test
```

The shuffled differences *are* the null distribution: you built "the world where nothing happened" out of your own data. The p-value is simply the share of those fake worlds that look at least as extreme as the real one. No normal curve, no central limit theorem, just counting. Every other test in the table is a shortcut for this idea when the maths lets you skip the shuffling.

## Where significance misleads

### Run enough tests and something will be "significant"

Here's a fact that surprises most people: **under the null, an exactly calibrated test with a continuous test statistic has uniformly distributed p-values**. Equal-width intervals between 0 and 1 are equally likely. That's why $$\alpha$$ is its false-positive rate: 5% of a uniform distribution lies below 0.05. Discrete tests, like the coin test above, only attain certain p-values; a valid exact test can have a false-positive rate below $$\alpha$$. Approximate tests are only approximately calibrated.

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
<figcaption>P-values from 2,000 simulated experiments. With no real effect, they're flat: about 5% land below 0.05 by chance. With a real effect, they pile up near zero, but at this sample size fewer than half make it below 0.05, which is the 46% power from earlier.</figcaption>
</figure>

Now check 20 metrics on an experiment where nothing changed. Each has a 5% chance of a false alarm, so the chance that *at least one* comes out significant is:

$$
P(\text{at least one false positive}) = 1 - (1 - \alpha)^m = 1 - 0.95^{20} \approx 0.64
$$

Two times in three, you'll find a "winner" in pure noise. It's the statistical version of throwing enough darts until one hits the bullseye, then drawing the target around it. The simplest fix is the **Bonferroni correction**: with $$m$$ tests, require $$p < \alpha / m$$ (here 0.05 / 20 = 0.0025). It's conservative; the Benjamini–Hochberg procedure is a less strict alternative that controls the share of false discoveries instead. Better still, name one **primary metric** before the experiment starts, and treat the rest as exploratory.

### Peeking

If you check the p-value every day and stop the first time it dips below 0.05, your false-positive rate is no longer 5%. Under the null, the p-value wanders randomly over time, and given enough looks it'll cross 0.05 at some point. That's the courtroom again: a prosecutor who can keep the trial running until the jury happens to lean their way. Either fix the sample size in advance and look once, or use a method designed for continuous monitoring, such as sequential tests.

### "Not significant" is not "no effect"

The button test failed to reach significance, but its confidence interval ran up to +1.65 points. Absence of evidence isn't evidence of absence, especially in an underpowered test. Report the interval, not just the verdict.

## Cheat sheet

- **Null hypothesis**: the boring explanation, "nothing is going on". The test assumes it's true and looks for evidence against it.
- **P-value**: how surprising your data would be if the null were true. Not the probability the null is true.
- **α (significance level)**: the false-positive rate you accept, chosen before you look. 0.05 is convention, not physics.
- **Significant** means "unlikely to be pure chance". It doesn't mean big, important, or certain.
- **Power**: your chance of detecting a real effect. Plan for it before the experiment; underpowered tests mostly produce shrugs.
- **Test statistic**: signal divided by noise. More data shrinks the noise.
- **Confidence intervals** show size and uncertainty together. Prefer them to a bare p-value.
- **One primary metric, fixed sample size, look once.** Or adjust for multiple tests and peeking.

## References

1. Wasserstein, R. L. and Lazar, N. A. *The ASA Statement on p-Values: Context, Process, and Purpose*. The American Statistician, 2016. <https://doi.org/10.1080/00031305.2016.1154108> — what p-values do and do not mean
2. Greenland, S. et al. *Statistical tests, P values, confidence intervals, and power: a guide to misinterpretations*. European Journal of Epidemiology, 2016. <https://doi.org/10.1007/s10654-016-0149-3> — common misreadings of p-values, intervals and power
3. Neyman, J. and Pearson, E. S. *On the problem of the most efficient tests of statistical hypotheses*. Philosophical Transactions of the Royal Society A, 1933. <https://doi.org/10.1098/rsta.1933.0009> — Type I and Type II errors
4. Fisher, R. A. *Statistical Methods for Research Workers*. Oliver and Boyd, 1925. <https://psychclassics.yorku.ca/Fisher/Methods/> — origin of the 0.05 convention
5. Welch, B. L. *The generalization of "Student's" problem when several different population variances are involved*. Biometrika, 1947. <https://doi.org/10.1093/biomet/34.1-2.28> — the unequal-variance t-test
6. statsmodels developers. *statsmodels.stats.proportion.proportions_ztest*. statsmodels documentation. <https://www.statsmodels.org/stable/generated/statsmodels.stats.proportion.proportions_ztest.html> — two-proportion z-test used in the code
7. SciPy developers. *scipy.stats.ttest_ind*. SciPy documentation. <https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.ttest_ind.html> — Welch's t-test via `equal_var=False`
8. Benjamini, Y. and Hochberg, Y. *Controlling the False Discovery Rate: A Practical and Powerful Approach to Multiple Testing*. Journal of the Royal Statistical Society: Series B, 1995. <https://doi.org/10.1111/j.2517-6161.1995.tb02031.x> — the Benjamini–Hochberg procedure
9. Johari, R. et al. *Peeking at A/B Tests*. Proceedings of KDD, 2017. <https://doi.org/10.1145/3097983.3097992> — why repeated looks inflate false positives
10. Kohavi, R., Tang, D. and Xu, Y. *Trustworthy Online Controlled Experiments*. Cambridge University Press, 2020. <https://doi.org/10.1017/9781108653985> — practical guide to A/B testing

<script>
(() => {
  'use strict';
  // Exact binomial probabilities for 10 independent fair flips.
  const counts = [1, 10, 45, 120, 210, 252, 210, 120, 45, 10, 1];
  function coinP(heads, sided) {
    return counts.reduce((sum, count, k) => sum + ((sided === 'upper' ? k >= heads : Math.abs(k - 5) >= Math.abs(heads - 5)) ? count : 0), 0) / 1024;
  }
  // Normal CDF approximation (absolute error < 8e-8); use symmetry for tails.
  function normalCDF(x) {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const tail = Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI) * t *
      (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
    return x < 0 ? tail : 1 - tail;
  }
  function normalQuantile(p) {
    let lo = -9, hi = 9;
    for (let i = 0; i < 60; i++) {
      const mid = (lo + hi) / 2;
      if (normalCDF(mid) < p) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }
  function powerModel(a, lift, n, alpha) {
    const b = a + lift, pooled = (a + b) / 2;
    const se0 = Math.sqrt(2 * pooled * (1 - pooled) / n);
    const se1 = Math.sqrt((a * (1 - a) + b * (1 - b)) / n);
    const critical = normalQuantile(1 - alpha / 2) * se0;
    const power = normalCDF((-critical - lift) / se1) + normalCDF((lift - critical) / se1);
    const z = lift / se0, p = Math.min(1, 2 * normalCDF(-Math.abs(z)));
    return { se0, se1, critical, power, z, p };
  }
  const $ = id => document.getElementById(id);
  const fmtP = p => p < 0.0001 ? '< 0.0001' : '= ' + p.toFixed(4);
  const coin = $('pv-coin'), heads = $('pv-heads'), sided = $('pv-sided');
  const bars = counts.map((count, k) => {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'pv-bar';
    button.setAttribute('aria-label', k + ' heads: ' + (100 * count / 1024).toFixed(2) + '% probability. Select this outcome.');
    const bar = document.createElement('span'); bar.style.height = (count / 252 * 140) + 'px';
    bar.setAttribute('aria-hidden', 'true');
    const label = document.createElement('small'); label.textContent = k;
    button.append(bar, label);
    button.addEventListener('click', () => { heads.value = k; updateCoin(); });
    $('pv-bars').append(button);
    return button;
  });
  function updateCoin() {
    const h = Number(heads.value), mode = sided.value;
    $('pv-heads-value').textContent = h;
    const tails = counts.map((_, k) => mode === 'upper' ? k >= h : Math.abs(k - 5) >= Math.abs(h - 5));
    bars.forEach((bar, k) => { bar.dataset.tail = tails[k]; bar.setAttribute('aria-pressed', k === h ? 'true' : 'false'); });
    const total = counts.reduce((sum, count, k) => sum + (tails[k] ? count : 0), 0);
    const p = coinP(h, mode);
    $('pv-coin-result').textContent = 'Counted heads: ' + tails.flatMap((yes, k) => yes ? [k] : []).join(', ') + '. ' + total + '/1024 sequences; p ' + fmtP(p) + '. ' + (p < 0.05 ? 'Significant' : 'Not significant') + ' at alpha = 0.05.';
  }
  heads.addEventListener('input', updateCoin); sided.addEventListener('change', updateCoin);
  $('pv-flip').addEventListener('click', () => {
    heads.value = Array.from({ length: 10 }, () => Math.random() < 0.5 ? 1 : 0).reduce((a, b) => a + b, 0);
    updateCoin();
  });
  updateCoin(); coin.hidden = false;

  const chart = $('pv-power-chart');
  function svg(tag, attrs, text) {
    const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, value));
    if (text !== undefined) element.textContent = text;
    return element;
  }
  function updatePower() {
    const a = Number($('pv-baseline').value) / 100, lift = Number($('pv-lift').value) / 100;
    const n = Number($('pv-n').value), alpha = Number($('pv-alpha').value);
    const m = powerModel(a, lift, n, alpha);
    $('pv-baseline-value').textContent = (100 * a).toFixed(1) + '%';
    $('pv-lift-value').textContent = (100 * lift).toFixed(1) + ' percentage points';
    $('pv-n-value').textContent = n.toLocaleString('en-US');
    $('pv-power-result').textContent = 'Approximate power: ' + (100 * m.power).toFixed(1) + '%. Example observed rates: ' + (a * 100).toFixed(1) + '% vs ' + ((a + lift) * 100).toFixed(1) + '%; z = ' + m.z.toFixed(2) + ', p ' + fmtP(m.p) + '. ' + (m.p < alpha ? 'Significant' : 'Not significant') + ' at alpha = ' + alpha + '.';
    chart.replaceChildren(svg('title', { id:'pv-power-chart-title' }, 'Sampling distributions of the conversion-rate difference'), svg('desc', { id:'pv-power-chart-desc' }, 'Null centred on zero; alternative centred on ' + (lift * 100).toFixed(1) + ' percentage points. Power is ' + (100 * m.power).toFixed(1) + '%. Rejection boundaries at plus and minus ' + (100 * m.critical).toFixed(2) + ' percentage points.'));
    const lo = Math.min(-4 * m.se0, lift - 4 * m.se1, -m.critical * 1.2);
    const hi = Math.max(4 * m.se0, lift + 4 * m.se1, m.critical * 1.2);
    const x = value => 50 + (value - lo) / (hi - lo) * 580;
    const density = (value, mean, se) => Math.exp(-0.5 * ((value - mean) / se) ** 2) / se;
    const maxDensity = 1 / Math.min(m.se0, m.se1);
    const y = (value, mean, se) => 210 - density(value, mean, se) / maxDensity * 165;
    function curve(mean, se, colour) {
      const d = Array.from({ length: 301 }, (_, i) => {
        const value = lo + (hi - lo) * i / 300;
        return (i ? 'L' : 'M') + x(value).toFixed(2) + ',' + y(value, mean, se).toFixed(2);
      }).join(' ');
      return svg('path', { d, fill:'none', stroke:colour, 'stroke-width':2.5 });
    }
    function shade(left, right) {
      const start = Math.max(lo, left), end = Math.min(hi, right);
      if (start >= end) return;
      let d = 'M' + x(start) + ',210';
      for (let i = 0; i <= 150; i++) {
        const value = start + (end - start) * i / 150;
        d += ' L' + x(value) + ',' + y(value, lift, m.se1);
      }
      d += ' L' + x(end) + ',210 Z';
      chart.append(svg('path', { d, fill:'var(--l3)', opacity:0.3 }));
    }
    shade(lo, -m.critical); shade(m.critical, hi);
    chart.append(svg('line', { x1:50, x2:630, y1:210, y2:210, stroke:'var(--muted)' }));
    [-m.critical, m.critical].forEach(c => chart.append(svg('line', { x1:x(c), x2:x(c), y1:25, y2:210, stroke:'var(--muted)', 'stroke-dasharray':'5 4' })));
    chart.append(curve(0, m.se0, 'var(--l0)'), curve(lift, m.se1, 'var(--l3)'));
    for (let i = 0; i <= 4; i++) {
      const value = lo + (hi - lo) * i / 4;
      chart.append(svg('text', { x:x(value), y:233, 'text-anchor':'middle', fill:'var(--muted)', 'font-size':14 }, (100 * value).toFixed(1)));
    }
    chart.append(svg('text', { x:340, y:255, 'text-anchor':'middle', fill:'var(--muted)', 'font-size':14 }, 'Observed lift (percentage points)'));
  }
  ['pv-baseline','pv-lift','pv-n'].forEach(id => $(id).addEventListener('input', updatePower));
  $('pv-alpha').addEventListener('change', updatePower);
  updatePower(); $('pv-power').hidden = false;
})();
</script>
