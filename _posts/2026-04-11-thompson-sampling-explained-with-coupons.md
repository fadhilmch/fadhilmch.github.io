---
layout: post
title: "Bandits in production: Thompson sampling, explained with coupons"
date: 2026-04-11
tags:
- exp
summary: What Thompson sampling does, why we ran it as a batch job that edits a traffic split, and what it saves compared with an A/B test.
---

Say you have three discount coupons and want to know which one gets the most people to buy. The textbook answer is an A/B test: split traffic evenly, wait until the result is significant, then ship the winner. It works, but for the whole test a third of your users see each losing coupon, even after the data has made it fairly obvious they're losing.

A **multi-armed bandit** handles that by moving traffic toward what's working while the test is still running. On the experimentation platform I worked on, we ran bandits for exactly this kind of problem, coupon optimisation and adaptive traffic allocation, using **Thompson sampling**. This post explains the algorithm with coupons, then shows how we fitted it into a production system.

## Explore or exploit

Every bandit balances two needs. **Exploiting** means showing the coupon that looks best so far, to earn conversions now. **Exploring** means still showing the others sometimes, because "looks best" is based on limited data and might be wrong. Pure exploitation locks in an early lucky guess; pure exploration is just an A/B test. Thompson sampling gets the balance from how uncertain it is about each coupon.

## Thompson sampling in one picture

For each coupon, keep two numbers: how many people saw it and how many converted. Those two numbers define a **Beta distribution**, the bandit's belief about that coupon's true conversion rate, here the share of people who buy after seeing it. Little data gives a wide curve; lots of data gives a narrow one.

<figure class="fig">
<svg viewBox="0 0 680 252" role="img" aria-labelledby="t1t t1d">
  <title id="t1t">Posterior beliefs about three coupons</title>
  <desc id="t1d">Beta posterior curves for three coupons. A, 12 conversions out of 200, is narrow around 6%. B, 20 out of 200, is narrow around 10%. C, 3 out of 40, is wide around 7.5%. One random draw from each curve is marked on the axis.</desc>
  <line class="grid" x1="60" x2="650" y1="210" y2="210"/>
  <text class="m" x="60.0" y="228" text-anchor="middle">0%</text>
  <text class="m" x="207.5" y="228" text-anchor="middle">5%</text>
  <text class="m" x="355.0" y="228" text-anchor="middle">10%</text>
  <text class="m" x="502.50000000000006" y="228" text-anchor="middle">15%</text>
  <text class="m" x="650.0" y="228" text-anchor="middle">20%</text>
  <text class="m" x="650" y="244" text-anchor="end">conversion rate</text>
  <g tabindex="0"><title>Coupon A: 12 / 200 conversions: belief about its rate</title><path d="M63.0,210.0 L65.9,210.0 L68.8,210.0 L71.8,210.0 L74.8,210.0 L77.7,210.0 L80.7,210.0 L83.6,210.0 L86.5,210.0 L89.5,210.0 L92.4,210.0 L95.4,210.0 L98.3,210.0 L101.3,210.0 L104.2,209.9 L107.2,209.9 L110.2,209.8 L113.1,209.7 L116.0,209.5 L119.0,209.2 L121.9,208.9 L124.9,208.4 L127.8,207.7 L130.8,206.8 L133.8,205.7 L136.7,204.3 L139.6,202.7 L142.6,200.6 L145.6,198.3 L148.5,195.5 L151.4,192.3 L154.4,188.6 L157.4,184.5 L160.3,180.0 L163.2,175.0 L166.2,169.7 L169.1,163.9 L172.1,157.8 L175.0,151.3 L178.0,144.6 L180.9,137.7 L183.9,130.7 L186.8,123.6 L189.8,116.4 L192.8,109.3 L195.7,102.4 L198.7,95.6 L201.6,89.1 L204.6,83.0 L207.5,77.2 L210.4,71.8 L213.4,66.9 L216.3,62.5 L219.3,58.7 L222.2,55.4 L225.2,52.7 L228.1,50.6 L231.1,49.2 L234.0,48.3 L237.0,48.0 L239.9,48.3 L242.9,49.1 L245.8,50.5 L248.8,52.4 L251.8,54.7 L254.7,57.5 L257.6,60.6 L260.6,64.1 L263.6,68.0 L266.5,72.1 L269.4,76.4 L272.4,81.0 L275.3,85.7 L278.3,90.5 L281.2,95.4 L284.2,100.4 L287.1,105.4 L290.1,110.4 L293.0,115.4 L296.0,120.3 L298.9,125.1 L301.9,129.9 L304.9,134.5 L307.8,139.0 L310.8,143.3 L313.7,147.6 L316.6,151.6 L319.6,155.5 L322.5,159.2 L325.5,162.8 L328.4,166.1 L331.4,169.3 L334.3,172.4 L337.3,175.2 L340.2,177.9 L343.2,180.4 L346.1,182.8 L349.1,185.0 L352.1,187.1 L355.0,189.0 L357.9,190.8 L360.9,192.5 L363.8,194.1 L366.8,195.5 L369.7,196.8 L372.7,198.0 L375.6,199.1 L378.6,200.2 L381.5,201.1 L384.5,202.0 L387.4,202.7 L390.4,203.5 L393.3,204.1 L396.3,204.7 L399.2,205.2 L402.2,205.7 L405.1,206.2 L408.1,206.6 L411.1,206.9 L414.0,207.3 L416.9,207.6 L419.9,207.8 L422.9,208.1 L425.8,208.3 L428.8,208.5 L431.7,208.6 L434.6,208.8 L437.6,208.9 L440.6,209.1 L443.5,209.2 L446.4,209.3 L449.4,209.4 L452.4,209.4 L455.3,209.5 L458.2,209.6 L461.2,209.6 L464.2,209.7 L467.1,209.7 L470.1,209.7 L473.0,209.8 L475.9,209.8 L478.9,209.8 L481.8,209.8 L484.8,209.9 L487.7,209.9 L490.7,209.9 L493.6,209.9 L496.6,209.9 L499.5,209.9 L502.5,209.9 L505.4,209.9 L508.4,210.0 L511.3,210.0 L514.3,210.0 L517.2,210.0 L520.2,210.0 L523.1,210.0 L526.1,210.0 L529.0,210.0 L532.0,210.0 L535.0,210.0 L537.9,210.0 L540.8,210.0 L543.8,210.0 L546.8,210.0 L549.7,210.0 L552.6,210.0 L555.6,210.0 L558.5,210.0 L561.5,210.0 L564.5,210.0 L567.4,210.0 L570.3,210.0 L573.3,210.0 L576.2,210.0 L579.2,210.0 L582.1,210.0 L585.1,210.0 L588.0,210.0 L591.0,210.0 L593.9,210.0 L596.9,210.0 L599.8,210.0 L602.8,210.0 L605.8,210.0 L608.7,210.0 L611.6,210.0 L614.6,210.0 L617.5,210.0 L620.5,210.0 L623.4,210.0 L626.4,210.0 L629.4,210.0 L632.3,210.0 L635.2,210.0 L638.2,210.0 L641.1,210.0 L644.1,210.0 L647.0,210.0 L650.0,210.0" style="fill:none;stroke:var(--muted);stroke-width:2"/></g>
  <g tabindex="0"><title>Coupon B: 20 / 200 conversions: belief about its rate</title><path d="M63.0,210.0 L65.9,210.0 L68.8,210.0 L71.8,210.0 L74.8,210.0 L77.7,210.0 L80.7,210.0 L83.6,210.0 L86.5,210.0 L89.5,210.0 L92.4,210.0 L95.4,210.0 L98.3,210.0 L101.3,210.0 L104.2,210.0 L107.2,210.0 L110.2,210.0 L113.1,210.0 L116.0,210.0 L119.0,210.0 L121.9,210.0 L124.9,210.0 L127.8,210.0 L130.8,210.0 L133.8,210.0 L136.7,210.0 L139.6,210.0 L142.6,210.0 L145.6,210.0 L148.5,210.0 L151.4,210.0 L154.4,210.0 L157.4,210.0 L160.3,210.0 L163.2,210.0 L166.2,210.0 L169.1,209.9 L172.1,209.9 L175.0,209.9 L178.0,209.8 L180.9,209.8 L183.9,209.7 L186.8,209.6 L189.8,209.5 L192.8,209.4 L195.7,209.2 L198.7,208.9 L201.6,208.7 L204.6,208.3 L207.5,207.9 L210.4,207.5 L213.4,206.9 L216.3,206.2 L219.3,205.5 L222.2,204.6 L225.2,203.6 L228.1,202.5 L231.1,201.2 L234.0,199.8 L237.0,198.2 L239.9,196.4 L242.9,194.5 L245.8,192.4 L248.8,190.1 L251.8,187.6 L254.7,184.9 L257.6,182.1 L260.6,179.1 L263.6,175.8 L266.5,172.5 L269.4,168.9 L272.4,165.2 L275.3,161.4 L278.3,157.5 L281.2,153.5 L284.2,149.4 L287.1,145.2 L290.1,141.0 L293.0,136.7 L296.0,132.5 L298.9,128.3 L301.9,124.2 L304.9,120.1 L307.8,116.2 L310.8,112.3 L313.7,108.6 L316.6,105.1 L319.6,101.8 L322.5,98.7 L325.5,95.7 L328.4,93.1 L331.4,90.7 L334.3,88.5 L337.3,86.6 L340.2,85.0 L343.2,83.7 L346.1,82.7 L349.1,82.0 L352.1,81.5 L355.0,81.4 L357.9,81.5 L360.9,82.0 L363.8,82.7 L366.8,83.6 L369.7,84.8 L372.7,86.3 L375.6,88.0 L378.6,89.8 L381.5,91.9 L384.5,94.2 L387.4,96.7 L390.4,99.3 L393.3,102.0 L396.3,104.9 L399.2,107.8 L402.2,110.9 L405.1,114.0 L408.1,117.2 L411.1,120.4 L414.0,123.7 L416.9,127.0 L419.9,130.2 L422.9,133.5 L425.8,136.8 L428.8,140.0 L431.7,143.2 L434.6,146.3 L437.6,149.4 L440.6,152.4 L443.5,155.3 L446.4,158.2 L449.4,161.0 L452.4,163.7 L455.3,166.3 L458.2,168.8 L461.2,171.2 L464.2,173.5 L467.1,175.8 L470.1,177.9 L473.0,179.9 L475.9,181.9 L478.9,183.8 L481.8,185.5 L484.8,187.2 L487.7,188.8 L490.7,190.3 L493.6,191.7 L496.6,193.0 L499.5,194.3 L502.5,195.5 L505.4,196.6 L508.4,197.6 L511.3,198.6 L514.3,199.5 L517.2,200.3 L520.2,201.1 L523.1,201.8 L526.1,202.5 L529.0,203.1 L532.0,203.7 L535.0,204.3 L537.9,204.8 L540.8,205.2 L543.8,205.6 L546.8,206.0 L549.7,206.4 L552.6,206.7 L555.6,207.0 L558.5,207.3 L561.5,207.6 L564.5,207.8 L567.4,208.0 L570.3,208.2 L573.3,208.4 L576.2,208.5 L579.2,208.7 L582.1,208.8 L585.1,208.9 L588.0,209.0 L591.0,209.1 L593.9,209.2 L596.9,209.3 L599.8,209.4 L602.8,209.4 L605.8,209.5 L608.7,209.6 L611.6,209.6 L614.6,209.6 L617.5,209.7 L620.5,209.7 L623.4,209.8 L626.4,209.8 L629.4,209.8 L632.3,209.8 L635.2,209.8 L638.2,209.9 L641.1,209.9 L644.1,209.9 L647.0,209.9 L650.0,209.9" style="fill:none;stroke:var(--fig-a);stroke-width:2"/></g>
  <g tabindex="0"><title>Coupon C: 3 / 40 conversions: belief about its rate</title><path d="M63.0,210.0 L65.9,210.0 L68.8,209.9 L71.8,209.8 L74.8,209.7 L77.7,209.5 L80.7,209.3 L83.6,208.9 L86.5,208.6 L89.5,208.1 L92.4,207.6 L95.4,206.9 L98.3,206.3 L101.3,205.5 L104.2,204.7 L107.2,203.8 L110.2,202.8 L113.1,201.8 L116.0,200.7 L119.0,199.5 L121.9,198.3 L124.9,197.1 L127.8,195.8 L130.8,194.4 L133.8,193.1 L136.7,191.6 L139.6,190.2 L142.6,188.8 L145.6,187.3 L148.5,185.8 L151.4,184.3 L154.4,182.8 L157.4,181.3 L160.3,179.8 L163.2,178.2 L166.2,176.7 L169.1,175.3 L172.1,173.8 L175.0,172.3 L178.0,170.9 L180.9,169.5 L183.9,168.1 L186.8,166.7 L189.8,165.4 L192.8,164.1 L195.7,162.8 L198.7,161.6 L201.6,160.4 L204.6,159.3 L207.5,158.1 L210.4,157.1 L213.4,156.0 L216.3,155.1 L219.3,154.1 L222.2,153.2 L225.2,152.4 L228.1,151.6 L231.1,150.8 L234.0,150.1 L237.0,149.4 L239.9,148.8 L242.9,148.2 L245.8,147.7 L248.8,147.2 L251.8,146.8 L254.7,146.4 L257.6,146.0 L260.6,145.7 L263.6,145.5 L266.5,145.2 L269.4,145.1 L272.4,144.9 L275.3,144.8 L278.3,144.8 L281.2,144.8 L284.2,144.8 L287.1,144.8 L290.1,144.9 L293.0,145.0 L296.0,145.2 L298.9,145.4 L301.9,145.6 L304.9,145.9 L307.8,146.2 L310.8,146.5 L313.7,146.8 L316.6,147.2 L319.6,147.6 L322.5,148.0 L325.5,148.4 L328.4,148.9 L331.4,149.4 L334.3,149.9 L337.3,150.4 L340.2,150.9 L343.2,151.5 L346.1,152.1 L349.1,152.7 L352.1,153.3 L355.0,153.9 L357.9,154.5 L360.9,155.2 L363.8,155.8 L366.8,156.5 L369.7,157.1 L372.7,157.8 L375.6,158.5 L378.6,159.2 L381.5,159.9 L384.5,160.6 L387.4,161.3 L390.4,162.0 L393.3,162.7 L396.3,163.5 L399.2,164.2 L402.2,164.9 L405.1,165.6 L408.1,166.3 L411.1,167.1 L414.0,167.8 L416.9,168.5 L419.9,169.2 L422.9,169.9 L425.8,170.6 L428.8,171.3 L431.7,172.1 L434.6,172.8 L437.6,173.5 L440.6,174.1 L443.5,174.8 L446.4,175.5 L449.4,176.2 L452.4,176.9 L455.3,177.5 L458.2,178.2 L461.2,178.8 L464.2,179.5 L467.1,180.1 L470.1,180.7 L473.0,181.4 L475.9,182.0 L478.9,182.6 L481.8,183.2 L484.8,183.8 L487.7,184.4 L490.7,184.9 L493.6,185.5 L496.6,186.1 L499.5,186.6 L502.5,187.1 L505.4,187.7 L508.4,188.2 L511.3,188.7 L514.3,189.2 L517.2,189.7 L520.2,190.2 L523.1,190.7 L526.1,191.2 L529.0,191.6 L532.0,192.1 L535.0,192.5 L537.9,193.0 L540.8,193.4 L543.8,193.8 L546.8,194.3 L549.7,194.7 L552.6,195.1 L555.6,195.5 L558.5,195.8 L561.5,196.2 L564.5,196.6 L567.4,196.9 L570.3,197.3 L573.3,197.6 L576.2,198.0 L579.2,198.3 L582.1,198.6 L585.1,198.9 L588.0,199.3 L591.0,199.6 L593.9,199.8 L596.9,200.1 L599.8,200.4 L602.8,200.7 L605.8,201.0 L608.7,201.2 L611.6,201.5 L614.6,201.7 L617.5,202.0 L620.5,202.2 L623.4,202.4 L626.4,202.7 L629.4,202.9 L632.3,203.1 L635.2,203.3 L638.2,203.5 L641.1,203.7 L644.1,203.9 L647.0,204.1 L650.0,204.3" style="fill:none;stroke:var(--fig-b);stroke-width:2"/></g>
  <text x="213.4" y="62.0" text-anchor="end" style="fill:var(--muted);font-size:11px">A · 12/200 · narrow, low</text>
  <text x="390.4" y="95.4" text-anchor="start" style="fill:var(--fig-a);font-size:11px">B · 20/200 · narrow, high</text>
  <text x="458.2" y="170.2" text-anchor="start" style="fill:var(--fig-b);font-size:11px">C · 3/40 · wide: unsure</text>
  <circle cx="215.3" cy="210" r="5" style="fill:var(--muted);stroke:var(--bg);stroke-width:2"/>
  <circle cx="246.9" cy="210" r="5" style="fill:var(--fig-a);stroke:var(--bg);stroke-width:2"/>
  <circle cx="470.7" cy="210" r="5" style="fill:var(--fig-b);stroke:var(--bg);stroke-width:2"/>
  <text class="m" x="60" y="16">dots on the axis: one random draw per coupon · this round C drew highest, so C is shown</text>
</svg>
<figcaption>What the bandit believes after some traffic. Each curve is a Beta distribution over a coupon's true conversion rate. C has little data, so its curve is wide and it still wins some draws. Probability of being best: B 58%, C 38%, A under 5%.</figcaption>
</figure>

The whole algorithm is: for each user, draw one random value from each coupon's curve, and show the coupon with the highest draw.

```python
import random

def choose(stats):
    # stats: {"A": (conversions, views), ...}
    draws = {
        coupon: random.betavariate(1 + conv, 1 + views - conv)
        for coupon, (conv, views) in stats.items()
    }
    return max(draws, key=draws.get)
```

That's enough to get the balance right. A coupon with a high, narrow curve wins most draws, so it gets most of the traffic. A coupon with a wide curve sometimes draws high, so it still gets explored until the data settles what it's worth. A coupon with a low, narrow curve almost never wins. Nobody has to tune an exploration rate; uncertainty does the work.

## Sampling per request, or in batches

The textbook version draws per user, updates the counts after every conversion, and draws again. Ours ran differently: the bandit was a **batch job that edits a traffic split**. Batching like this has real advantages over per-request sampling:

- **Purchases arrive late.** Someone who sees a coupon might buy hours later. Updating per request would mostly update on "no purchase yet".
- **Users see consistent variants.** Drawing per request could show the same person a different coupon on every page.
- **The request path stays simple.** Assignment is a hot, latency-sensitive service that already knows how to assign users by a traffic split.

Every few hours, the job recomputed each coupon's posterior from logged exposures and conversions, estimated the probability that each coupon is the best, and wrote those probabilities back as the experiment's new traffic split.

```python
def split_from_posteriors(stats, draws=10_000):
    wins = {coupon: 0 for coupon in stats}
    for _ in range(draws):
        wins[choose(stats)] += 1
    return {coupon: n / draws for coupon, n in wins.items()}
```

Allocating traffic in proportion to "probability of being best" is exactly what Thompson sampling does on average, just applied in batches. The new split then travels to the assignment service like any other config change, which is why the [config delivery work]({{ '/posts/from-polling-to-push/' | relative_url }}) mattered: bandits were among the most frequent writers.

<figure class="fig">
<svg viewBox="0 0 680 226" role="img" aria-labelledby="t4t t4d">
  <title id="t4t">The bandit loop</title>
  <desc id="t4d">The assignment service assigns users using the current split and logs exposures. Conversions join them in an event store. Every few hours a bandit updater recomputes posteriors and the probability each variant is best, and writes a new split to the config store, which flows back to the assignment service.</desc>
  <defs><marker id="t4" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="arrow" d="M0,0 L10,5 L0,10 z"/></marker></defs>
  <rect class="box" x="10" y="20" width="200" height="60" rx="6"/><text class="t" x="22" y="42">Assignment service</text><text class="m" x="22" y="60">hash user → split</text>
  <rect class="box" x="470" y="20" width="200" height="60" rx="6"/><text class="t" x="482" y="42">Event store</text><text class="m" x="482" y="60">exposures, conversions</text>
  <rect class="box" x="470" y="130" width="200" height="86" rx="6" style="stroke:var(--fig-a)"/><text class="t" x="482" y="152">Bandit updater</text><text class="m" x="482" y="170">every few hours:</text><text class="m" x="482" y="186">update posteriors,</text><text class="m" x="482" y="202">P(best) → new split</text>
  <rect class="box" x="10" y="140" width="200" height="60" rx="6"/><text class="t" x="22" y="162">Config store</text><text class="m" x="22" y="180">split: B 90 · C 5 · A 5</text>
  <path class="ln" d="M210,50 L468,50" marker-end="url(#t4)"/><text class="m" x="340" y="42" text-anchor="middle">who saw what, who converted</text>
  <path class="ln" d="M570,80 L570,128" marker-end="url(#t4)"/>
  <path class="sa" d="M470,172 L212,172" marker-end="url(#t4)"/><text class="ta" x="340" y="164" text-anchor="middle">write new split</text>
  <path class="ln" d="M110,140 L110,82" marker-end="url(#t4)"/><text class="m" x="118" y="116">config path</text>
</svg>
<figcaption>The loop in production. Nothing in the request path samples anything: the bandit is a batch job that edits the traffic split, and the split travels to the assignment service like any other config change.</figcaption>
</figure>

## What it looks like over time

Here is a simulated run, with the true conversion rates set to 6%, 10% and 7.5%, and a few hundred users between updates:

<figure class="fig">
<svg viewBox="0 0 680 240" role="img" aria-labelledby="t2t t2d">
  <title id="t2t">Traffic allocation over time</title>
  <desc id="t2d">Stacked bars of traffic share per update. All three coupons start at a third. After a few updates the bandit hesitates between B and C, then settles on about 90% to B, keeping 5% each for A and C.</desc>
  <g tabindex="0"><title>Update 0: coupon B gets 33% of traffic</title><rect x="61.0" y="144.3" width="40.1" height="54.7" rx="2" style="fill:var(--fig-a);opacity:.75"/></g>
  <g tabindex="0"><title>Update 0: coupon C gets 33% of traffic</title><rect x="61.0" y="87.7" width="40.1" height="54.7" rx="2" style="fill:var(--fig-b);opacity:.75"/></g>
  <g tabindex="0"><title>Update 0: coupon A gets 33% of traffic</title><rect x="61.0" y="31.0" width="40.1" height="54.7" rx="2" style="fill:var(--muted);opacity:.75"/></g>
  <g tabindex="0"><title>Update 1: coupon B gets 47% of traffic</title><rect x="103.1" y="121.6" width="40.1" height="77.4" rx="2" style="fill:var(--fig-a);opacity:.75"/></g>
  <g tabindex="0"><title>Update 1: coupon C gets 48% of traffic</title><rect x="103.1" y="39.3" width="40.1" height="80.3" rx="2" style="fill:var(--fig-b);opacity:.75"/></g>
  <g tabindex="0"><title>Update 1: coupon A gets 5% of traffic</title><rect x="103.1" y="31.0" width="40.1" height="6.3" rx="2" style="fill:var(--muted);opacity:.75"/></g>
  <g tabindex="0"><title>Update 2: coupon B gets 90% of traffic</title><rect x="145.3" y="47.5" width="40.1" height="151.5" rx="2" style="fill:var(--fig-a);opacity:.75"/></g>
  <g tabindex="0"><title>Update 2: coupon C gets 5% of traffic</title><rect x="145.3" y="39.2" width="40.1" height="6.2" rx="2" style="fill:var(--fig-b);opacity:.75"/></g>
  <g tabindex="0"><title>Update 2: coupon A gets 5% of traffic</title><rect x="145.3" y="31.0" width="40.1" height="6.2" rx="2" style="fill:var(--muted);opacity:.75"/></g>
  <g tabindex="0"><title>Update 3: coupon B gets 58% of traffic</title><rect x="187.4" y="101.6" width="40.1" height="97.4" rx="2" style="fill:var(--fig-a);opacity:.75"/></g>
  <g tabindex="0"><title>Update 3: coupon C gets 36% of traffic</title><rect x="187.4" y="40.9" width="40.1" height="58.7" rx="2" style="fill:var(--fig-b);opacity:.75"/></g>
  <g tabindex="0"><title>Update 3: coupon A gets 6% of traffic</title><rect x="187.4" y="31.0" width="40.1" height="7.9" rx="2" style="fill:var(--muted);opacity:.75"/></g>
  <g tabindex="0"><title>Update 4: coupon B gets 86% of traffic</title><rect x="229.6" y="55.5" width="40.1" height="143.5" rx="2" style="fill:var(--fig-a);opacity:.75"/></g>
  <g tabindex="0"><title>Update 4: coupon C gets 6% of traffic</title><rect x="229.6" y="45.2" width="40.1" height="8.3" rx="2" style="fill:var(--fig-b);opacity:.75"/></g>
  <g tabindex="0"><title>Update 4: coupon A gets 8% of traffic</title><rect x="229.6" y="31.0" width="40.1" height="12.2" rx="2" style="fill:var(--muted);opacity:.75"/></g>
  <g tabindex="0"><title>Update 5: coupon B gets 89% of traffic</title><rect x="271.7" y="50.3" width="40.1" height="148.7" rx="2" style="fill:var(--fig-a);opacity:.75"/></g>
  <g tabindex="0"><title>Update 5: coupon C gets 5% of traffic</title><rect x="271.7" y="41.8" width="40.1" height="6.5" rx="2" style="fill:var(--fig-b);opacity:.75"/></g>
  <g tabindex="0"><title>Update 5: coupon A gets 6% of traffic</title><rect x="271.7" y="31.0" width="40.1" height="8.8" rx="2" style="fill:var(--muted);opacity:.75"/></g>
  <g tabindex="0"><title>Update 6: coupon B gets 91% of traffic</title><rect x="313.9" y="46.9" width="40.1" height="152.1" rx="2" style="fill:var(--fig-a);opacity:.75"/></g>
  <g tabindex="0"><title>Update 6: coupon C gets 5% of traffic</title><rect x="313.9" y="39.0" width="40.1" height="6.0" rx="2" style="fill:var(--fig-b);opacity:.75"/></g>
  <g tabindex="0"><title>Update 6: coupon A gets 5% of traffic</title><rect x="313.9" y="31.0" width="40.1" height="6.0" rx="2" style="fill:var(--muted);opacity:.75"/></g>
  <g tabindex="0"><title>Update 7: coupon B gets 91% of traffic</title><rect x="356.0" y="47.0" width="40.1" height="152.0" rx="2" style="fill:var(--fig-a);opacity:.75"/></g>
  <g tabindex="0"><title>Update 7: coupon C gets 5% of traffic</title><rect x="356.0" y="39.0" width="40.1" height="6.0" rx="2" style="fill:var(--fig-b);opacity:.75"/></g>
  <g tabindex="0"><title>Update 7: coupon A gets 5% of traffic</title><rect x="356.0" y="31.0" width="40.1" height="6.0" rx="2" style="fill:var(--muted);opacity:.75"/></g>
  <g tabindex="0"><title>Update 8: coupon B gets 91% of traffic</title><rect x="398.1" y="46.7" width="40.1" height="152.3" rx="2" style="fill:var(--fig-a);opacity:.75"/></g>
  <g tabindex="0"><title>Update 8: coupon C gets 5% of traffic</title><rect x="398.1" y="38.8" width="40.1" height="5.8" rx="2" style="fill:var(--fig-b);opacity:.75"/></g>
  <g tabindex="0"><title>Update 8: coupon A gets 5% of traffic</title><rect x="398.1" y="31.0" width="40.1" height="5.8" rx="2" style="fill:var(--muted);opacity:.75"/></g>
  <g tabindex="0"><title>Update 9: coupon B gets 88% of traffic</title><rect x="440.3" y="52.1" width="40.1" height="146.9" rx="2" style="fill:var(--fig-a);opacity:.75"/></g>
  <g tabindex="0"><title>Update 9: coupon C gets 5% of traffic</title><rect x="440.3" y="43.9" width="40.1" height="6.2" rx="2" style="fill:var(--fig-b);opacity:.75"/></g>
  <g tabindex="0"><title>Update 9: coupon A gets 8% of traffic</title><rect x="440.3" y="31.0" width="40.1" height="10.9" rx="2" style="fill:var(--muted);opacity:.75"/></g>
  <g tabindex="0"><title>Update 10: coupon B gets 89% of traffic</title><rect x="482.4" y="49.7" width="40.1" height="149.3" rx="2" style="fill:var(--fig-a);opacity:.75"/></g>
  <g tabindex="0"><title>Update 10: coupon C gets 5% of traffic</title><rect x="482.4" y="41.6" width="40.1" height="6.1" rx="2" style="fill:var(--fig-b);opacity:.75"/></g>
  <g tabindex="0"><title>Update 10: coupon A gets 6% of traffic</title><rect x="482.4" y="31.0" width="40.1" height="8.6" rx="2" style="fill:var(--muted);opacity:.75"/></g>
  <g tabindex="0"><title>Update 11: coupon B gets 89% of traffic</title><rect x="524.6" y="49.1" width="40.1" height="149.9" rx="2" style="fill:var(--fig-a);opacity:.75"/></g>
  <g tabindex="0"><title>Update 11: coupon C gets 5% of traffic</title><rect x="524.6" y="41.0" width="40.1" height="6.1" rx="2" style="fill:var(--fig-b);opacity:.75"/></g>
  <g tabindex="0"><title>Update 11: coupon A gets 6% of traffic</title><rect x="524.6" y="31.0" width="40.1" height="8.0" rx="2" style="fill:var(--muted);opacity:.75"/></g>
  <g tabindex="0"><title>Update 12: coupon B gets 91% of traffic</title><rect x="566.7" y="47.1" width="40.1" height="151.9" rx="2" style="fill:var(--fig-a);opacity:.75"/></g>
  <g tabindex="0"><title>Update 12: coupon C gets 5% of traffic</title><rect x="566.7" y="39.0" width="40.1" height="6.0" rx="2" style="fill:var(--fig-b);opacity:.75"/></g>
  <g tabindex="0"><title>Update 12: coupon A gets 5% of traffic</title><rect x="566.7" y="31.0" width="40.1" height="6.0" rx="2" style="fill:var(--muted);opacity:.75"/></g>
  <g tabindex="0"><title>Update 13: coupon B gets 91% of traffic</title><rect x="608.9" y="47.0" width="40.1" height="152.0" rx="2" style="fill:var(--fig-a);opacity:.75"/></g>
  <g tabindex="0"><title>Update 13: coupon C gets 5% of traffic</title><rect x="608.9" y="39.0" width="40.1" height="6.0" rx="2" style="fill:var(--fig-b);opacity:.75"/></g>
  <g tabindex="0"><title>Update 13: coupon A gets 5% of traffic</title><rect x="608.9" y="31.0" width="40.1" height="6.0" rx="2" style="fill:var(--muted);opacity:.75"/></g>
  <text class="m" x="81.1" y="218" text-anchor="middle">0</text>
  <text class="m" x="165.4" y="218" text-anchor="middle">2</text>
  <text class="m" x="249.6" y="218" text-anchor="middle">4</text>
  <text class="m" x="333.9" y="218" text-anchor="middle">6</text>
  <text class="m" x="418.2" y="218" text-anchor="middle">8</text>
  <text class="m" x="502.5" y="218" text-anchor="middle">10</text>
  <text class="m" x="586.8" y="218" text-anchor="middle">12</text>
  <text class="m" x="650" y="234" text-anchor="end">update (every few hours)</text>
  <text class="m" x="52" y="204" text-anchor="end">0%</text>
  <text class="m" x="52" y="119.0" text-anchor="end">50%</text>
  <text class="m" x="52" y="34" text-anchor="end">100%</text>
  <rect x="60" y="8" width="10" height="10" rx="2" style="fill:var(--fig-a)"/><text class="m" x="76" y="17">B</text>
  <rect x="100" y="8" width="10" height="10" rx="2" style="fill:var(--fig-b)"/><text class="m" x="116" y="17">C</text>
  <rect x="140" y="8" width="10" height="10" rx="2" style="fill:var(--muted)"/><text class="m" x="156" y="17">A</text>
  <text class="m" x="650" y="17" text-anchor="end">share of traffic per update · simulated</text>
</svg>
<figcaption>A simulated run with true rates of 6%, 10% and 7.5%. The split starts even, wavers between B and C while C's curve is still wide, then settles on B. A 5% floor keeps the losers in the test.</figcaption>
</figure>

The early updates are the interesting part. After the first batch, B and C look about equally good and split the traffic between them. As C collects more data its curve narrows below B's, and traffic moves to B. A drops out almost immediately.

The payoff is measured as **regret**: conversions lost compared with already knowing the best coupon.

<figure class="fig">
<svg viewBox="0 0 680 244" role="img" aria-labelledby="t3t t3d">
  <title id="t3t">Cumulative regret, fixed split versus Thompson sampling</title>
  <desc id="t3d">Two lines of conversions lost compared with always showing the best coupon. A fixed even split loses 76 by the end; Thompson sampling loses 21.</desc>
  <line class="grid" x1="60" x2="650" y1="200" y2="200"/>
  <g tabindex="0"><title>Fixed A/B/C split: 76 conversions lost by the end</title><path d="M60.0,189.6 L105.4,179.1 L150.8,168.7 L196.2,158.3 L241.5,147.9 L286.9,137.4 L332.3,127.0 L377.7,116.6 L423.1,106.1 L468.5,95.7 L513.8,85.3 L559.2,74.9 L604.6,64.4 L650.0,54.0" class="ln dash" style="stroke-width:2"/></g>
  <g tabindex="0"><title>Thompson sampling: 21 conversions lost by the end</title><path d="M60.0,189.6 L105.4,182.8 L150.8,181.3 L196.2,175.9 L241.5,173.6 L286.9,171.9 L332.3,170.5 L377.7,169.1 L423.1,167.7 L468.5,165.7 L513.8,164.0 L559.2,162.4 L604.6,161.0 L650.0,159.6" class="sa"/></g>
  <text class="m" x="650.0" y="46.0" text-anchor="end">fixed even split · 76 lost</text>
  <text class="ta" x="650.0" y="151.6" text-anchor="end">Thompson sampling · 21 lost</text>
  <text class="m" x="60" y="18">conversions lost versus always showing the best coupon · simulated, 3,500 users</text>
  <text class="m" x="60.0" y="218" text-anchor="middle">0</text>
  <text class="m" x="150.8" y="218" text-anchor="middle">2</text>
  <text class="m" x="241.5" y="218" text-anchor="middle">4</text>
  <text class="m" x="332.3" y="218" text-anchor="middle">6</text>
  <text class="m" x="423.1" y="218" text-anchor="middle">8</text>
  <text class="m" x="513.8" y="218" text-anchor="middle">10</text>
  <text class="m" x="604.6" y="218" text-anchor="middle">12</text>
  <text class="m" x="650" y="234" text-anchor="end">update</text>
</svg>
<figcaption>Regret: conversions lost compared with a world where you already knew the best coupon. A fixed split keeps paying for its losers at the same rate; the bandit stops paying once it's confident.</figcaption>
</figure>

Both lines start the same, because both begin with an even split. After that, the fixed split keeps losing conversions at the same rate until the test ends, while the bandit's losses flatten once it's confident.

## What production adds

The algorithm is ten lines. Most of the work is everything around it:

- **Define the reward carefully.** A bandit optimises exactly what you give it. Our reward was a purchase, not a click on the coupon: the two can favour different coupons. The window for counting a purchase matters too; too short, and it under-counts people who take a while to decide.
- **Keep a floor.** If a losing variant's share can reach zero, the bandit can never notice that it has improved. A small minimum share keeps every arm observable.
- **Expect the world to change.** Coupon performance drifts with seasons, weekdays and campaigns. Old data can be discounted, or the counts computed over a recent window, so the bandit can change its mind.
- **Decide what happens when the split moves.** If users are hashed into buckets by split, changing the split moves some users between variants. Either that's acceptable for the product, or first assignments need to be stored.
- **Don't use it to measure.** A bandit is built to earn while it learns, not to produce a clean estimate of the difference between variants. Because the losing arms get little traffic, their estimates stay noisy, and adaptive allocation biases naive confidence intervals. If the question is "how much better is B, and is it significant?", run an A/B test.

## When to reach for a bandit

Use an A/B test when you need to *learn*: a product decision, an effect size, something you'll report. Use a bandit when you need to *earn* while choosing among options with fast, measurable feedback: coupons, banners, notification copy, ranking tweaks. If the options change often, or the test would otherwise run for weeks while showing users a clearly worse option, a bandit usually pays for itself.

## References

1. Thompson, W. R. *On the Likelihood That One Unknown Probability Exceeds Another in View of the Evidence of Two Samples*. Biometrika, 1933. <https://doi.org/10.1093/biomet/25.3-4.285> — the original idea.
2. Russo, D. et al. *A Tutorial on Thompson Sampling*. Foundations and Trends in Machine Learning, 2018. <https://arxiv.org/abs/1707.02038>
3. Lattimore, T. and Szepesvári, C. *Bandit Algorithms*. Cambridge University Press, 2020. <https://www.cambridge.org/core/books/bandit-algorithms/8E39FD004E6CE036680F90DD0C6F09FC>
4. Chapelle, O. and Li, L. *An Empirical Evaluation of Thompson Sampling*. Advances in Neural Information Processing Systems 24 (NIPS), 2011. <https://papers.nips.cc/paper/2011/hash/e53a0a2978c28872a4505bdb51db06dc-Abstract.html>
5. Agrawal, S. and Goyal, N. *Analysis of Thompson Sampling for the Multi-armed Bandit Problem*. arXiv, 2011 (rev. 2012). <https://arxiv.org/abs/1111.1797> — regret bounds.
6. Nie, X. et al. *Why Adaptively Collected Data Have Negative Bias and How to Correct for It*. AISTATS, 2018. <https://arxiv.org/abs/1708.01977>
