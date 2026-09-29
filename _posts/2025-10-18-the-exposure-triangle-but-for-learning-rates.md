---
layout: post
title: "The exposure triangle, but for learning rates"
date: 2025-10-18
tags:
- photo
summary: Aperture, shutter and ISO behave a lot like learning rate, batch size and
  warmup.
---

When I take photos, I keep running into the same annoyance. I open the aperture to let in more light, and the background goes soft. I slow the shutter to let in more light, and a moving subject smears. I raise the ISO to get more light without either, and the picture gets grainy. Nothing is free.

Photographers call this the **exposure triangle**. Neural-network training has its own version of that problem, with three knobs that also pull against each other: learning rate, batch size and warmup. This post lays the two side by side, shows what the training knobs do in a small simulation, and spends a fair amount of time on where the comparison stops being useful.

## The photography version

A camera sensor needs a certain amount of light to produce a well-exposed picture. Three controls set how much it gets, and each one changes something else about the image:

- **Aperture** is the size of the opening in the lens. A wide opening lets in more light but keeps only a thin slice of the scene in focus, which is the shallow depth of field that blurs backgrounds.
- **Shutter speed** is how long the sensor collects light. A long exposure gathers more, but anything that moves during it, including your own hands, turns into blur.
- **ISO** is how strongly the sensor's signal is amplified. Raising it brightens a dim scene without changing the opening or the exposure time, but it amplifies noise along with the signal, so the picture gets grainy.

<figure class="fig">
<svg viewBox="0 0 680 300" role="img" aria-labelledby="ex1t ex1d">
  <title id="ex1t">The exposure triangle</title>
  <desc id="ex1d">A triangle with aperture, shutter speed and ISO at its corners. Aperture controls light and depth of field, and a wide opening gives shallow focus. Shutter speed controls how long light is collected, and slow speeds give motion blur. ISO amplifies the signal, and high values add noise. Each knob has a cost in orange.</desc>
  <path class="ln" d="M115,40 L20,190 L210,190 Z" style="fill:var(--panel)"/>
  <circle class="fa" cx="115" cy="40" r="6"/><text class="t" x="115" y="24" text-anchor="middle">Aperture</text>
  <circle class="fa" cx="20" cy="190" r="6"/><text class="t" x="20" y="214" text-anchor="start">Shutter</text>
  <circle class="fa" cx="210" cy="190" r="6"/><text class="t" x="210" y="214" text-anchor="end">ISO</text>
  <text class="m" x="115" y="244" text-anchor="middle">one brightness budget,</text><text class="m" x="115" y="260" text-anchor="middle">three ways to spend it</text>
  <rect class="box" x="250" y="10" width="420" height="82" rx="6"/>
  <text class="t" x="264" y="32">Aperture · size of the opening</text>
  <text class="m" x="264" y="52">more light through, or less</text>
  <text class="tb" x="264" y="74">cost: wide gives a thin slice of focus</text>
  <rect class="box" x="250" y="104" width="420" height="82" rx="6"/>
  <text class="t" x="264" y="126">Shutter · how long the sensor collects</text>
  <text class="m" x="264" y="146">longer means more light</text>
  <text class="tb" x="264" y="168">cost: slow gives motion blur, shake</text>
  <rect class="box" x="250" y="198" width="420" height="82" rx="6"/>
  <text class="t" x="264" y="220">ISO · amplification after the fact</text>
  <text class="m" x="264" y="240">brightens a dim scene</text>
  <text class="tb" x="264" y="262">cost: more grain and noise</text>
</svg>
<figcaption>Every stop of brightness has to come from somewhere. You choose which cost you would rather pay.</figcaption>
</figure>

Brightness is measured in **stops**, and each stop is a doubling or halving of the light. That gives the triangle its useful property: the controls trade against each other one stop at a time. Open the aperture by one stop and you can halve the exposure time for the same brightness. The picture is equally bright, but you've swapped a shallower focus for less motion blur.

The point isn't that any corner is better. The right setting depends on what you care about in the scene, and a good photographer decides that first.

## The training version

Training a neural network has a comparable shape. You have a budget for how much progress each step can make safely, and three settings that spend it:

- **Learning rate** sets how far each parameter update moves. Too large and the loss oscillates or diverges. Too small and training crawls.
- **Batch size** is how many examples the gradient is averaged over at each step. A small batch gives a noisy estimate of the direction. A large one gives a cleaner estimate but costs more memory and compute for each step.
- **Warmup** means starting with a very small learning rate and ramping it up over the first steps. It keeps the early updates gentle, while the model and the optimiser's statistics are still in a poor state, so that you can use a bigger learning rate afterwards.

<figure class="fig">
<svg viewBox="0 0 680 300" role="img" aria-labelledby="ex2t ex2d">
  <title id="ex2t">The training triangle</title>
  <desc id="ex2d">A triangle with learning rate, batch size and warmup at its corners, matched to aperture, shutter and ISO. Learning rate sets how far each update moves and a large one can diverge. Batch size sets how many examples each gradient averages, and small batches are noisy. Warmup ramps the learning rate up from a small value; it costs a few slow early steps. Each cost is in orange.</desc>
  <path class="ln" d="M115,40 L20,190 L210,190 Z" style="fill:var(--panel)"/>
  <circle class="fa" cx="115" cy="40" r="6"/><text class="t" x="115" y="24" text-anchor="middle">Learning rate</text>
  <circle class="fa" cx="20" cy="190" r="6"/><text class="t" x="20" y="214" text-anchor="start">Batch size</text>
  <circle class="fa" cx="210" cy="190" r="6"/><text class="t" x="210" y="214" text-anchor="end">Warmup</text>
  <text class="m" x="115" y="244" text-anchor="middle">one stability budget,</text><text class="m" x="115" y="260" text-anchor="middle">three ways to spend it</text>
  <rect class="box" x="250" y="10" width="420" height="82" rx="6"/>
  <text class="t" x="264" y="32">Learning rate ~ aperture</text>
  <text class="m" x="264" y="52">how far each update moves</text>
  <text class="tb" x="264" y="74">cost: too big diverges, too small crawls</text>
  <rect class="box" x="250" y="104" width="420" height="82" rx="6"/>
  <text class="t" x="264" y="126">Batch size ~ shutter</text>
  <text class="m" x="264" y="146">how many examples each gradient averages</text>
  <text class="tb" x="264" y="168">cost: small is noisy, large costs compute</text>
  <rect class="box" x="250" y="198" width="420" height="82" rx="6"/>
  <text class="t" x="264" y="220">Warmup ~ ISO</text>
  <text class="m" x="264" y="240">a gentle start that lets you push harder later</text>
  <text class="tb" x="264" y="262">cost: slow early steps, one more knob</text>
</svg>
<figcaption>Each photographic knob is paired with a training knob. The first two pairs are fairly natural. The third is looser, and I say why below.</figcaption>
</figure>

The pairing I'm using is aperture with learning rate, shutter with batch size, and ISO with warmup. I'll explain each pair in turn, and mark how strong I think it is.

**Aperture and learning rate (strong).** Both are the main lever. They decide how big a step you take per unit of effort, and both have a sweet spot between too little and too much.

**Shutter and batch size (fairly strong).** A long exposure collects more photons, which averages out random fluctuation. A big batch collects more examples, which averages out sampling noise. In both, more collection reduces noise and costs you something: time on the camera side, compute on the training side.

**ISO and warmup (loose).** This is the pair I'm least sure about. ISO is a late-stage amplifier: you reach for it when the other two are already stretched. Warmup plays a similar supporting role, because it's a modest, cheap adjustment that lets the other two be pushed further. But ISO amplifies noise, and warmup does the opposite: it protects you from instability. I'd call this a pairing of roles, not of mechanisms.

## What the knobs do, in a simulation

Words are easy here, so I ran the experiment. The setup is deliberately tiny: gradient descent on a two-dimensional quadratic bowl, with random noise added to each gradient to stand in for sampling a mini-batch. It's pure Python, and it's illustrative rather than a real model.

<figure class="fig">
<svg viewBox="0 0 680 262" role="img" aria-labelledby="lr3t lr3d">
  <title id="lr3t">Simulated loss curves for different learning rates and batch sizes</title>
  <desc id="lr3d">Two log-scale loss charts over 80 gradient descent steps on a noisy two-dimensional quadratic. Left, at batch size 64: a learning rate of 0.005 falls slowly and is still around 2 at step 80; 0.10 drops to about 0.09 by step 20 and then sits at a noise floor near 0.003; 0.22 blows up and leaves the chart within a few steps. Right, at learning rate 0.10: batch size 1 settles at a noisy floor near 0.2, batch size 8 near 0.03, and batch size 64 near 0.003.</desc>
  <text class="h" x="50" y="20">LEARNING RATE · BATCH 64</text><text class="h" x="390" y="20">BATCH SIZE · LEARNING RATE 0.10</text>
  <line class="grid" x1="50" x2="320" y1="208.0" y2="208.0"/><text class="m" x="44" y="212.0" text-anchor="end">1e-4</text>
  <line class="grid" x1="50" x2="320" y1="165.1" y2="165.1"/><text class="m" x="44" y="169.1" text-anchor="end">1e-2</text>
  <line class="grid" x1="50" x2="320" y1="122.3" y2="122.3"/><text class="m" x="44" y="126.3" text-anchor="end">1</text>
  <line class="grid" x1="50" x2="320" y1="79.4" y2="79.4"/><text class="m" x="44" y="83.4" text-anchor="end">1e2</text>
  <text class="m" x="50.0" y="224" text-anchor="middle">0</text>
  <text class="m" x="185.0" y="224" text-anchor="middle">40</text>
  <text class="m" x="320.0" y="224" text-anchor="middle">80</text>
  <text class="m" x="320" y="240" text-anchor="end">step</text>
  <g tabindex="0"><title>lr 0.005 (small): loss 49.5 at step 0, 2.03 at step 80</title><path class="ln" d="M50.0,86.0 L53.4,86.8 L56.8,87.7 L60.1,88.6 L63.5,89.4 L66.9,90.3 L70.2,91.1 L73.6,91.9 L77.0,92.7 L80.4,93.5 L83.8,94.3 L87.1,95.1 L90.5,95.8 L93.9,96.6 L97.2,97.3 L100.6,98.1 L104.0,98.8 L107.4,99.4 L110.8,100.1 L114.1,100.7 L117.5,101.4 L120.9,102.0 L124.2,102.6 L127.6,103.1 L131.0,103.7 L134.4,104.2 L137.8,104.7 L141.1,105.2 L144.5,105.7 L147.9,106.2 L151.2,106.6 L154.6,107.0 L158.0,107.4 L161.4,107.7 L164.8,108.1 L168.1,108.4 L171.5,108.8 L174.9,109.0 L178.2,109.3 L181.6,109.6 L185.0,109.9 L188.4,110.2 L191.8,110.4 L195.1,110.7 L198.5,110.9 L201.9,111.1 L205.2,111.3 L208.6,111.5 L212.0,111.7 L215.4,111.9 L218.8,112.0 L222.1,112.2 L225.5,112.4 L228.9,112.5 L232.2,112.7 L235.6,112.8 L239.0,113.0 L242.4,113.1 L245.8,113.2 L249.1,113.4 L252.5,113.5 L255.9,113.6 L259.2,113.8 L262.6,113.9 L266.0,114.0 L269.4,114.1 L272.8,114.2 L276.1,114.4 L279.5,114.5 L282.9,114.6 L286.2,114.7 L289.6,114.8 L293.0,114.9 L296.4,115.0 L299.8,115.1 L303.1,115.2 L306.5,115.3 L309.9,115.5 L313.2,115.5 L316.6,115.6 L320.0,115.7"/><path d="M50.0,86.0 L53.4,86.8 L56.8,87.7 L60.1,88.6 L63.5,89.4 L66.9,90.3 L70.2,91.1 L73.6,91.9 L77.0,92.7 L80.4,93.5 L83.8,94.3 L87.1,95.1 L90.5,95.8 L93.9,96.6 L97.2,97.3 L100.6,98.1 L104.0,98.8 L107.4,99.4 L110.8,100.1 L114.1,100.7 L117.5,101.4 L120.9,102.0 L124.2,102.6 L127.6,103.1 L131.0,103.7 L134.4,104.2 L137.8,104.7 L141.1,105.2 L144.5,105.7 L147.9,106.2 L151.2,106.6 L154.6,107.0 L158.0,107.4 L161.4,107.7 L164.8,108.1 L168.1,108.4 L171.5,108.8 L174.9,109.0 L178.2,109.3 L181.6,109.6 L185.0,109.9 L188.4,110.2 L191.8,110.4 L195.1,110.7 L198.5,110.9 L201.9,111.1 L205.2,111.3 L208.6,111.5 L212.0,111.7 L215.4,111.9 L218.8,112.0 L222.1,112.2 L225.5,112.4 L228.9,112.5 L232.2,112.7 L235.6,112.8 L239.0,113.0 L242.4,113.1 L245.8,113.2 L249.1,113.4 L252.5,113.5 L255.9,113.6 L259.2,113.8 L262.6,113.9 L266.0,114.0 L269.4,114.1 L272.8,114.2 L276.1,114.4 L279.5,114.5 L282.9,114.6 L286.2,114.7 L289.6,114.8 L293.0,114.9 L296.4,115.0 L299.8,115.1 L303.1,115.2 L306.5,115.3 L309.9,115.5 L313.2,115.5 L316.6,115.6 L320.0,115.7" style="stroke:transparent;stroke-width:12;fill:none"/></g>
  <g tabindex="0"><title>lr 0.10 (good): loss 49.5 at step 0, 0.000764 at step 80</title><path class="sa" d="M50.0,86.0 L53.4,110.2 L56.8,112.1 L60.1,113.9 L63.5,116.1 L66.9,118.3 L70.2,120.4 L73.6,121.8 L77.0,124.0 L80.4,125.2 L83.8,126.9 L87.1,129.0 L90.5,131.2 L93.9,133.3 L97.2,134.5 L100.6,137.0 L104.0,138.6 L107.4,140.4 L110.8,142.9 L114.1,144.1 L117.5,145.2 L120.9,146.7 L124.2,148.2 L127.6,150.2 L131.0,150.0 L134.4,151.4 L137.8,154.7 L141.1,153.3 L144.5,156.1 L147.9,162.6 L151.2,161.3 L154.6,168.1 L158.0,164.1 L161.4,166.6 L164.8,160.7 L168.1,169.9 L171.5,176.6 L174.9,156.6 L178.2,171.3 L181.6,166.9 L185.0,179.2 L188.4,180.3 L191.8,184.7 L195.1,187.0 L198.5,170.4 L201.9,187.6 L205.2,177.1 L208.6,164.6 L212.0,174.4 L215.4,165.2 L218.8,187.8 L222.1,181.6 L225.5,172.9 L228.9,184.8 L232.2,208.0 L235.6,175.8 L239.0,190.1 L242.4,196.3 L245.8,191.2 L249.1,175.3 L252.5,170.0 L255.9,183.3 L259.2,175.4 L262.6,184.4 L266.0,179.3 L269.4,186.7 L272.8,184.8 L276.1,176.3 L279.5,169.8 L282.9,173.4 L286.2,170.5 L289.6,178.8 L293.0,156.4 L296.4,179.5 L299.8,178.5 L303.1,177.9 L306.5,179.4 L309.9,169.8 L313.2,175.2 L316.6,178.6 L320.0,189.1"/><path d="M50.0,86.0 L53.4,110.2 L56.8,112.1 L60.1,113.9 L63.5,116.1 L66.9,118.3 L70.2,120.4 L73.6,121.8 L77.0,124.0 L80.4,125.2 L83.8,126.9 L87.1,129.0 L90.5,131.2 L93.9,133.3 L97.2,134.5 L100.6,137.0 L104.0,138.6 L107.4,140.4 L110.8,142.9 L114.1,144.1 L117.5,145.2 L120.9,146.7 L124.2,148.2 L127.6,150.2 L131.0,150.0 L134.4,151.4 L137.8,154.7 L141.1,153.3 L144.5,156.1 L147.9,162.6 L151.2,161.3 L154.6,168.1 L158.0,164.1 L161.4,166.6 L164.8,160.7 L168.1,169.9 L171.5,176.6 L174.9,156.6 L178.2,171.3 L181.6,166.9 L185.0,179.2 L188.4,180.3 L191.8,184.7 L195.1,187.0 L198.5,170.4 L201.9,187.6 L205.2,177.1 L208.6,164.6 L212.0,174.4 L215.4,165.2 L218.8,187.8 L222.1,181.6 L225.5,172.9 L228.9,184.8 L232.2,208.0 L235.6,175.8 L239.0,190.1 L242.4,196.3 L245.8,191.2 L249.1,175.3 L252.5,170.0 L255.9,183.3 L259.2,175.4 L262.6,184.4 L266.0,179.3 L269.4,186.7 L272.8,184.8 L276.1,176.3 L279.5,169.8 L282.9,173.4 L286.2,170.5 L289.6,178.8 L293.0,156.4 L296.4,179.5 L299.8,178.5 L303.1,177.9 L306.5,179.4 L309.9,169.8 L313.2,175.2 L316.6,178.6 L320.0,189.1" style="stroke:transparent;stroke-width:12;fill:none"/></g>
  <g tabindex="0"><title>lr 0.22 (too large): loss 49.5 at step 0, 1e+06 at step 80</title><path class="sb" d="M50.0,86.0 L53.4,82.9 L56.8,79.7 L60.1,76.4 L63.5,73.1 L66.9,69.7 L70.2,66.4 L73.6,62.9 L77.0,59.5 L80.4,58.0 L83.8,58.0 L87.1,58.0 L90.5,58.0 L93.9,58.0 L97.2,58.0 L100.6,58.0 L104.0,58.0 L107.4,58.0 L110.8,58.0 L114.1,58.0 L117.5,58.0 L120.9,58.0 L124.2,58.0 L127.6,58.0 L131.0,58.0 L134.4,58.0 L137.8,58.0 L141.1,58.0 L144.5,58.0 L147.9,58.0 L151.2,58.0 L154.6,58.0 L158.0,58.0 L161.4,58.0 L164.8,58.0 L168.1,58.0 L171.5,58.0 L174.9,58.0 L178.2,58.0 L181.6,58.0 L185.0,58.0 L188.4,58.0 L191.8,58.0 L195.1,58.0 L198.5,58.0 L201.9,58.0 L205.2,58.0 L208.6,58.0 L212.0,58.0 L215.4,58.0 L218.8,58.0 L222.1,58.0 L225.5,58.0 L228.9,58.0 L232.2,58.0 L235.6,58.0 L239.0,58.0 L242.4,58.0 L245.8,58.0 L249.1,58.0 L252.5,58.0 L255.9,58.0 L259.2,58.0 L262.6,58.0 L266.0,58.0 L269.4,58.0 L272.8,58.0 L276.1,58.0 L279.5,58.0 L282.9,58.0 L286.2,58.0 L289.6,58.0 L293.0,58.0 L296.4,58.0 L299.8,58.0 L303.1,58.0 L306.5,58.0 L309.9,58.0 L313.2,58.0 L316.6,58.0 L320.0,58.0"/><path d="M50.0,86.0 L53.4,82.9 L56.8,79.7 L60.1,76.4 L63.5,73.1 L66.9,69.7 L70.2,66.4 L73.6,62.9 L77.0,59.5 L80.4,58.0 L83.8,58.0 L87.1,58.0 L90.5,58.0 L93.9,58.0 L97.2,58.0 L100.6,58.0 L104.0,58.0 L107.4,58.0 L110.8,58.0 L114.1,58.0 L117.5,58.0 L120.9,58.0 L124.2,58.0 L127.6,58.0 L131.0,58.0 L134.4,58.0 L137.8,58.0 L141.1,58.0 L144.5,58.0 L147.9,58.0 L151.2,58.0 L154.6,58.0 L158.0,58.0 L161.4,58.0 L164.8,58.0 L168.1,58.0 L171.5,58.0 L174.9,58.0 L178.2,58.0 L181.6,58.0 L185.0,58.0 L188.4,58.0 L191.8,58.0 L195.1,58.0 L198.5,58.0 L201.9,58.0 L205.2,58.0 L208.6,58.0 L212.0,58.0 L215.4,58.0 L218.8,58.0 L222.1,58.0 L225.5,58.0 L228.9,58.0 L232.2,58.0 L235.6,58.0 L239.0,58.0 L242.4,58.0 L245.8,58.0 L249.1,58.0 L252.5,58.0 L255.9,58.0 L259.2,58.0 L262.6,58.0 L266.0,58.0 L269.4,58.0 L272.8,58.0 L276.1,58.0 L279.5,58.0 L282.9,58.0 L286.2,58.0 L289.6,58.0 L293.0,58.0 L296.4,58.0 L299.8,58.0 L303.1,58.0 L306.5,58.0 L309.9,58.0 L313.2,58.0 L316.6,58.0 L320.0,58.0" style="stroke:transparent;stroke-width:12;fill:none"/></g>
  <line class="grid" x1="390" x2="660" y1="208.0" y2="208.0"/><text class="m" x="384" y="212.0" text-anchor="end">1e-4</text>
  <line class="grid" x1="390" x2="660" y1="165.1" y2="165.1"/><text class="m" x="384" y="169.1" text-anchor="end">1e-2</text>
  <line class="grid" x1="390" x2="660" y1="122.3" y2="122.3"/><text class="m" x="384" y="126.3" text-anchor="end">1</text>
  <line class="grid" x1="390" x2="660" y1="79.4" y2="79.4"/><text class="m" x="384" y="83.4" text-anchor="end">1e2</text>
  <text class="m" x="390.0" y="224" text-anchor="middle">0</text>
  <text class="m" x="525.0" y="224" text-anchor="middle">40</text>
  <text class="m" x="660.0" y="224" text-anchor="middle">80</text>
  <text class="m" x="660" y="240" text-anchor="end">step</text>
  <g tabindex="0"><title>batch 1: loss 49.5 at step 0, 0.0486 at step 80</title><path class="sb" d="M390.0,86.0 L393.4,109.8 L396.8,111.5 L400.1,112.0 L403.5,115.8 L406.9,120.1 L410.2,123.2 L413.6,119.6 L417.0,123.5 L420.4,117.2 L423.8,120.5 L427.1,123.7 L430.5,126.1 L433.9,129.9 L437.2,121.9 L440.6,127.6 L444.0,130.3 L447.4,133.3 L450.8,138.3 L454.1,131.6 L457.5,128.5 L460.9,133.7 L464.2,126.8 L467.6,129.2 L471.0,130.8 L474.4,129.6 L477.8,137.5 L481.1,128.7 L484.5,131.3 L487.9,147.5 L491.2,131.7 L494.6,146.0 L498.0,132.5 L501.4,142.4 L504.8,124.1 L508.1,147.2 L511.5,147.4 L514.9,119.5 L518.2,140.0 L521.6,133.3 L525.0,155.8 L528.4,150.6 L531.8,144.2 L535.1,143.9 L538.5,132.6 L541.9,147.7 L545.2,142.2 L548.6,126.2 L552.0,136.6 L555.4,127.3 L558.8,155.8 L562.1,144.4 L565.5,134.6 L568.9,148.9 L572.2,198.5 L575.6,137.6 L579.0,150.1 L582.4,162.1 L585.8,154.8 L589.1,136.4 L592.5,131.0 L595.9,144.1 L599.2,136.2 L602.6,144.5 L606.0,140.0 L609.4,147.0 L612.8,145.2 L616.1,137.2 L619.5,130.7 L622.9,134.3 L626.2,131.6 L629.6,139.7 L633.0,117.6 L636.4,140.5 L639.8,139.6 L643.1,139.0 L646.5,140.5 L649.9,130.9 L653.2,136.3 L656.6,139.8 L660.0,150.4"/><path d="M390.0,86.0 L393.4,109.8 L396.8,111.5 L400.1,112.0 L403.5,115.8 L406.9,120.1 L410.2,123.2 L413.6,119.6 L417.0,123.5 L420.4,117.2 L423.8,120.5 L427.1,123.7 L430.5,126.1 L433.9,129.9 L437.2,121.9 L440.6,127.6 L444.0,130.3 L447.4,133.3 L450.8,138.3 L454.1,131.6 L457.5,128.5 L460.9,133.7 L464.2,126.8 L467.6,129.2 L471.0,130.8 L474.4,129.6 L477.8,137.5 L481.1,128.7 L484.5,131.3 L487.9,147.5 L491.2,131.7 L494.6,146.0 L498.0,132.5 L501.4,142.4 L504.8,124.1 L508.1,147.2 L511.5,147.4 L514.9,119.5 L518.2,140.0 L521.6,133.3 L525.0,155.8 L528.4,150.6 L531.8,144.2 L535.1,143.9 L538.5,132.6 L541.9,147.7 L545.2,142.2 L548.6,126.2 L552.0,136.6 L555.4,127.3 L558.8,155.8 L562.1,144.4 L565.5,134.6 L568.9,148.9 L572.2,198.5 L575.6,137.6 L579.0,150.1 L582.4,162.1 L585.8,154.8 L589.1,136.4 L592.5,131.0 L595.9,144.1 L599.2,136.2 L602.6,144.5 L606.0,140.0 L609.4,147.0 L612.8,145.2 L616.1,137.2 L619.5,130.7 L622.9,134.3 L626.2,131.6 L629.6,139.7 L633.0,117.6 L636.4,140.5 L639.8,139.6 L643.1,139.0 L646.5,140.5 L649.9,130.9 L653.2,136.3 L656.6,139.8 L660.0,150.4" style="stroke:transparent;stroke-width:12;fill:none"/></g>
  <g tabindex="0"><title>batch 8: loss 49.5 at step 0, 0.00609 at step 80</title><path class="ln" d="M390.0,86.0 L393.4,110.1 L396.8,112.0 L400.1,113.4 L403.5,116.0 L406.9,118.8 L410.2,121.1 L413.6,121.4 L417.0,123.9 L420.4,123.3 L423.8,125.0 L427.1,127.4 L430.5,129.9 L433.9,132.5 L437.2,131.4 L440.6,135.0 L444.0,136.5 L447.4,138.2 L450.8,141.7 L454.1,140.8 L457.5,140.2 L460.9,142.4 L464.2,140.9 L467.6,143.2 L471.0,142.9 L474.4,143.1 L477.8,148.5 L481.1,143.4 L484.5,146.3 L487.9,157.9 L491.2,149.2 L494.6,161.5 L498.0,150.6 L501.4,157.2 L504.8,143.2 L508.1,161.0 L511.5,165.5 L514.9,138.5 L518.2,157.5 L521.6,151.3 L525.0,170.0 L528.4,167.7 L531.8,164.6 L535.1,164.7 L538.5,151.8 L541.9,167.9 L545.2,160.6 L548.6,145.5 L552.0,155.8 L555.4,146.5 L558.8,173.2 L562.1,163.4 L565.5,153.9 L568.9,167.5 L572.2,208.0 L575.6,156.9 L579.0,169.8 L582.4,180.2 L585.8,173.6 L589.1,155.8 L592.5,150.4 L595.9,163.6 L599.2,155.7 L602.6,164.2 L606.0,159.5 L609.4,166.6 L612.8,164.8 L616.1,156.7 L619.5,150.2 L622.9,153.8 L626.2,151.0 L629.6,159.1 L633.0,137.0 L636.4,159.9 L639.8,159.0 L643.1,158.4 L646.5,159.9 L649.9,150.3 L653.2,155.7 L656.6,159.2 L660.0,169.8"/><path d="M390.0,86.0 L393.4,110.1 L396.8,112.0 L400.1,113.4 L403.5,116.0 L406.9,118.8 L410.2,121.1 L413.6,121.4 L417.0,123.9 L420.4,123.3 L423.8,125.0 L427.1,127.4 L430.5,129.9 L433.9,132.5 L437.2,131.4 L440.6,135.0 L444.0,136.5 L447.4,138.2 L450.8,141.7 L454.1,140.8 L457.5,140.2 L460.9,142.4 L464.2,140.9 L467.6,143.2 L471.0,142.9 L474.4,143.1 L477.8,148.5 L481.1,143.4 L484.5,146.3 L487.9,157.9 L491.2,149.2 L494.6,161.5 L498.0,150.6 L501.4,157.2 L504.8,143.2 L508.1,161.0 L511.5,165.5 L514.9,138.5 L518.2,157.5 L521.6,151.3 L525.0,170.0 L528.4,167.7 L531.8,164.6 L535.1,164.7 L538.5,151.8 L541.9,167.9 L545.2,160.6 L548.6,145.5 L552.0,155.8 L555.4,146.5 L558.8,173.2 L562.1,163.4 L565.5,153.9 L568.9,167.5 L572.2,208.0 L575.6,156.9 L579.0,169.8 L582.4,180.2 L585.8,173.6 L589.1,155.8 L592.5,150.4 L595.9,163.6 L599.2,155.7 L602.6,164.2 L606.0,159.5 L609.4,166.6 L612.8,164.8 L616.1,156.7 L619.5,150.2 L622.9,153.8 L626.2,151.0 L629.6,159.1 L633.0,137.0 L636.4,159.9 L639.8,159.0 L643.1,158.4 L646.5,159.9 L649.9,150.3 L653.2,155.7 L656.6,159.2 L660.0,169.8" style="stroke:transparent;stroke-width:12;fill:none"/></g>
  <g tabindex="0"><title>batch 64: loss 49.5 at step 0, 0.000764 at step 80</title><path class="sa" d="M390.0,86.0 L393.4,110.2 L396.8,112.1 L400.1,113.9 L403.5,116.1 L406.9,118.3 L410.2,120.4 L413.6,121.8 L417.0,124.0 L420.4,125.2 L423.8,126.9 L427.1,129.0 L430.5,131.2 L433.9,133.3 L437.2,134.5 L440.6,137.0 L444.0,138.6 L447.4,140.4 L450.8,142.9 L454.1,144.1 L457.5,145.2 L460.9,146.7 L464.2,148.2 L467.6,150.2 L471.0,150.0 L474.4,151.4 L477.8,154.7 L481.1,153.3 L484.5,156.1 L487.9,162.6 L491.2,161.3 L494.6,168.1 L498.0,164.1 L501.4,166.6 L504.8,160.7 L508.1,169.9 L511.5,176.6 L514.9,156.6 L518.2,171.3 L521.6,166.9 L525.0,179.2 L528.4,180.3 L531.8,184.7 L535.1,187.0 L538.5,170.4 L541.9,187.6 L545.2,177.1 L548.6,164.6 L552.0,174.4 L555.4,165.2 L558.8,187.8 L562.1,181.6 L565.5,172.9 L568.9,184.8 L572.2,208.0 L575.6,175.8 L579.0,190.1 L582.4,196.3 L585.8,191.2 L589.1,175.3 L592.5,170.0 L595.9,183.3 L599.2,175.4 L602.6,184.4 L606.0,179.3 L609.4,186.7 L612.8,184.8 L616.1,176.3 L619.5,169.8 L622.9,173.4 L626.2,170.5 L629.6,178.8 L633.0,156.4 L636.4,179.5 L639.8,178.5 L643.1,177.9 L646.5,179.4 L649.9,169.8 L653.2,175.2 L656.6,178.6 L660.0,189.1"/><path d="M390.0,86.0 L393.4,110.2 L396.8,112.1 L400.1,113.9 L403.5,116.1 L406.9,118.3 L410.2,120.4 L413.6,121.8 L417.0,124.0 L420.4,125.2 L423.8,126.9 L427.1,129.0 L430.5,131.2 L433.9,133.3 L437.2,134.5 L440.6,137.0 L444.0,138.6 L447.4,140.4 L450.8,142.9 L454.1,144.1 L457.5,145.2 L460.9,146.7 L464.2,148.2 L467.6,150.2 L471.0,150.0 L474.4,151.4 L477.8,154.7 L481.1,153.3 L484.5,156.1 L487.9,162.6 L491.2,161.3 L494.6,168.1 L498.0,164.1 L501.4,166.6 L504.8,160.7 L508.1,169.9 L511.5,176.6 L514.9,156.6 L518.2,171.3 L521.6,166.9 L525.0,179.2 L528.4,180.3 L531.8,184.7 L535.1,187.0 L538.5,170.4 L541.9,187.6 L545.2,177.1 L548.6,164.6 L552.0,174.4 L555.4,165.2 L558.8,187.8 L562.1,181.6 L565.5,172.9 L568.9,184.8 L572.2,208.0 L575.6,175.8 L579.0,190.1 L582.4,196.3 L585.8,191.2 L589.1,175.3 L592.5,170.0 L595.9,183.3 L599.2,175.4 L602.6,184.4 L606.0,179.3 L609.4,186.7 L612.8,184.8 L616.1,176.3 L619.5,169.8 L622.9,173.4 L626.2,170.5 L629.6,178.8 L633.0,156.4 L636.4,179.5 L639.8,178.5 L643.1,177.9 L646.5,179.4 L649.9,169.8 L653.2,175.2 L656.6,178.6 L660.0,189.1" style="stroke:transparent;stroke-width:12;fill:none"/></g>
  <line class="ln" x1="50" x2="66" y1="34" y2="34"/><text class="m" x="71" y="38">0.005</text>
  <line class="sa" x1="116" x2="132" y1="34" y2="34"/><text class="m" x="137" y="38">0.10</text>
  <line class="sb" x1="175" x2="191" y1="34" y2="34"/><text class="m" x="196" y="38">0.22 diverges</text>
  <line class="sb" x1="390" x2="406" y1="34" y2="34"/><text class="m" x="411" y="38">batch 1</text>
  <line class="ln" x1="469" x2="485" y1="34" y2="34"/><text class="m" x="490" y="38">batch 8</text>
  <line class="sa" x1="548" x2="564" y1="34" y2="34"/><text class="m" x="569" y="38">batch 64</text>
</svg>
<figcaption>Simulated, not from a real model: gradient descent on a two-dimensional quadratic with added gradient noise. The largest learning rate that still converges here is 0.2, so 0.22 diverges. Smaller batches average less noise, so the loss stalls higher.</figcaption>
</figure>

On the left, batch size is fixed and only the learning rate changes:

- **0.005** is safe but slow. After 80 steps it has still only reached a loss of about 2.
- **0.10** gets to a low loss in about 20 steps and then hovers at a small noise floor.
- **0.22** is only a little larger, and it diverges. In this bowl, the steepest direction sets a hard limit: any learning rate above 2 divided by that direction's curvature (here 10, so 0.2) makes each step overshoot by more than it corrects.

On the right, learning rate is fixed and the batch size changes. The averaging effect is visible. A batch of one gives a noisy trace that settles about two orders of magnitude above where a batch of 64 does. Averaging over more examples shrinks the noise floor, roughly in proportion to one over the batch size.

That last sentence hides the coupling. The height of the noise floor depends on both the learning rate and the batch size, in this simple setting roughly as their ratio. Double the learning rate and you raise the floor. Double the batch and you lower it. That's the same kind of trade as opening the aperture by a stop and shortening the exposure by a stop, and it's where the analogy earns its keep.

## The trade that carries over

There is a well-known heuristic from large-batch training that has the same shape as the photographer's reciprocity. If you multiply the batch size by k, multiply the learning rate by about k as well, and add a warmup phase so that the early steps don't blow up. It's often called the linear scaling rule, and it comes from work on training image models with very large batches. It isn't a law. It works up to some batch size and then stops working, and for adaptive optimisers such as Adam, people often find a square-root scaling fits better.

I still find it worth remembering, because it shows why treating the knobs as independent is a mistake. If you double the batch size to "make training more stable" and leave the learning rate alone, you have changed the operating point. The run may get smoother and slower. If you double the learning rate to "make it faster" and leave everything else alone, you have moved towards the edge in the left panel.

A habit I'd suggest, borrowed from the photographers: when you change one control, name the other one you're spending. "I'm raising the learning rate, so I'm accepting more noise and less margin before divergence." "I'm shrinking the batch to fit on the device, so I'll expect a noisier curve and probably a lower learning rate." Saying it out loud makes the trade visible.

## Where the analogy breaks

I've pushed the comparison as far as I can. These are the places where it stops helping.

**Photography has a target; training doesn't.** An exposure is either about right or it isn't, and the camera can even show you a light meter. Nothing like that exists for training. There is no learning rate that gives the "correct" amount of progress, only better and worse outcomes on a metric you picked.

**The knobs aren't interchangeable.** In a camera, a stop of aperture and a stop of shutter are worth exactly the same amount of light, so the trade is precise. In training, batch size and learning rate coupling is a rough heuristic, and it depends on the model, the optimiser and the data. I'd treat any specific scaling rule as a starting guess to test.

**Warmup isn't a peer of the other two.** ISO is a number you set once per shot. Warmup is a schedule, with a length and a shape, that runs for the first part of training and then disappears. It matters most for large models and adaptive optimisers, and it does very little in my toy problem, where the loss is a smooth bowl and the only limit is curvature. Also, real training has more knobs than three: weight decay, the schedule after warmup, gradient clipping, the optimiser choice. A triangle undercounts.

**The costs are different in kind.** In photography every trade lands on a single image, and you see the result at once. In training the cost shows up later, in a curve you read after minutes or days, and sometimes only in an evaluation you weren't watching. That delay is the reason I think "name what you're spending" is such a useful habit for training and less necessary in a camera.

**Noise means different things.** Grain in a photo is nearly always unwanted. Noise in gradient descent is sometimes a nuisance and sometimes useful, because it can help a run escape sharp regions. A smaller batch isn't just a worse estimate.

## What I take from it

I don't think the analogy predicts anything. It gives me a way to explain to a colleague, or to myself, why "just change the learning rate" is rarely a single-variable question. It also reminds me to start from what I care about, the way you would with a subject that moves or a scene that's dim.

When I set up or review a training run, I try to ask three questions in that order. What's the failure I'm most worried about: divergence, slow progress, or noisy results? Which knob buys me the most protection against it? And which cost am I accepting in exchange? Then I look at the curve, the way I'd look at the back of the camera, and adjust.
