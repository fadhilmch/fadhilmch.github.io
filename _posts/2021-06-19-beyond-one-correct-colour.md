---
layout: post
title: "Beyond one correct colour: image colorization with transformers"
date: 2021-06-19
tags:
- data
summary: Why one grayscale photo has many believable colorings, and how a transformer can sample them instead of averaging them.
---

In my [colorization project]({{ '/posts/colorizing-images-with-local-and-global-features/' | relative_url }}) the network gave one answer for every grayscale photo. That felt natural: one input, one output. But look at a grey shirt. The honest answer to "what colour was it?" is a list: navy, forest green, mustard, charcoal. All of them are fine. Only one is true.

This post is about a paper that takes that list seriously: *Colorization Transformer* (ColTran) by Kumar, Weissenborn and Kalchbrenner, presented at ICLR 2021. I have not trained or run ColTran. This is my reading of the paper and its released code, and of what it changes compared with the single-answer model I built in 2019.

## 1. One grey, many colours

Take a single pixel on that shirt. Its lightness says "mid-dark". It says nothing about hue. Every colour in the figure below lands on nearly the same grey once the colour is removed.

<figure class="fig color-fig">
<svg viewBox="0 0 520 170" role="img" aria-labelledby="many-title">
<title id="many-title">One grey input and six possible colours</title>
<rect class="box" x="8" y="45" width="92" height="80" rx="8"/>
<rect x="28" y="62" width="52" height="46" rx="6" fill="#6b6b6b"/>
<text class="t" x="54" y="140" text-anchor="middle">input</text>
<path class="ln" d="M100 85H150"/>
<g>
<rect x="160" y="20" width="62" height="56" rx="8" fill="#1f386e"/>
<rect x="232" y="20" width="62" height="56" rx="8" fill="#286e46"/>
<rect x="304" y="20" width="62" height="56" rx="8" fill="#aa232d"/>
<rect x="160" y="92" width="62" height="56" rx="8" fill="#d2a028"/>
<rect x="232" y="92" width="62" height="56" rx="8" fill="#3c3c41"/>
<rect x="304" y="92" width="62" height="56" rx="8" fill="#1e828c"/>
</g>
<text class="m" x="440" y="70" text-anchor="middle">all believable,</text>
<text class="m" x="440" y="88" text-anchor="middle">one is true</text>
</svg>
<figcaption>Hand-made illustration. The six colours are picked by me, not produced by a model.</figcaption>
</figure>

A problem with several valid answers is called multimodal. A model that must return exactly one answer has to choose a way to cope with that.

## 2. What happens when you average

My 2019 model was trained to minimise a squared error between its predicted colour channels and the real ones. If half the training shirts were navy and half were mustard, the prediction that makes the squared error smallest is the middle of the two. A muddy olive grey that no shirt ever had.

Try it. Each press draws one of six colours. The big swatch shows each draw. The small swatch shows the average of everything drawn so far.

<figure class="fig color-viz" id="avg-demo">
<div class="viz-q"><strong>What is the average of several believable colours?</strong> Every draw is a valid colour for the same grey shirt. Keep drawing and watch the average swatch.</div>
<div class="viz-buttons" role="group" aria-label="Draw colours">
<button type="button" id="avg-draw" aria-pressed="false">Draw a colouring</button>
<button type="button" id="avg-reset" aria-pressed="false">Start over</button>
</div>
<div class="avg-row">
<div><div class="avg-sw" id="avg-last"></div><span>latest draw</span></div>
<div><div class="avg-sw" id="avg-mean"></div><span>average of all draws</span></div>
</div>
<p class="viz-note" id="avg-note">No draws yet. Press the button.</p>
</figure>

The average is a safe guess, and a dull one. Safe, because it is never far from any true answer. Dull, because it is rarely right and rarely vivid. This is one reason colorization models trained with a plain regression loss tend to produce desaturated, brownish results. The fix is to stop asking for the average and ask for a sample.

## 3. Predict a distribution, then draw from it

Instead of "the colour of this pixel is X", a generative model says "here is how likely each colour is". Drawing from that distribution gives navy sometimes, mustard other times, and almost never olive grey. Draw again with another random seed and you get a different, equally valid picture.

<figure class="fig color-fig">
<svg viewBox="0 0 520 176" role="img" aria-labelledby="dist-title">
<title id="dist-title">Regression gives one average colour, sampling gives different valid colours</title>
<text class="h" x="8" y="18">REGRESSION</text>
<rect class="box" x="8" y="28" width="96" height="46" rx="8"/>
<text class="t" x="56" y="56" text-anchor="middle">grey input</text>
<path class="ln" d="M104 51H170"/>
<rect x="176" y="28" width="64" height="46" rx="8" fill="#5a5c4c"/>
<text class="m" x="258" y="56">one blended answer</text>
<text class="h" x="8" y="104">SAMPLING</text>
<rect class="box" x="8" y="114" width="96" height="46" rx="8"/>
<text class="t" x="56" y="142" text-anchor="middle">grey input</text>
<path class="ln" d="M104 137H170"/>
<rect x="176" y="114" width="46" height="46" rx="8" fill="#1f386e"/>
<rect x="228" y="114" width="46" height="46" rx="8" fill="#aa232d"/>
<rect x="280" y="114" width="46" height="46" rx="8" fill="#d2a028"/>
<text class="m" x="342" y="142">a different valid answer each draw</text>
</svg>
<figcaption>The blended swatch is the average from the demo above, shown as one fixed colour.</figcaption>
</figure>

For a whole image this is harder than for one pixel. The colours of different pixels depend on each other. If the shirt's left sleeve is navy, the right sleeve should be navy too. Drawing each pixel independently would give a patchwork.

## 4. Choose pixel by pixel, remembering what you chose

ColTran handles this the way language models write a sentence: one piece at a time, each piece conditioned on everything chosen before. It scans the picture pixel by pixel. For each pixel it looks at the grayscale image and at the colours already chosen, then draws the next colour.

<figure class="fig color-fig">
<svg viewBox="0 0 520 190" role="img" aria-labelledby="auto-title">
<title id="auto-title">Choosing colours one pixel at a time, each depending on earlier choices</title>
<g stroke="var(--line)" stroke-width="1.5">
<rect x="40" y="30" width="40" height="40" fill="#1f386e"/>
<rect x="80" y="30" width="40" height="40" fill="#1f386e"/>
<rect x="120" y="30" width="40" height="40" fill="#1f386e"/>
<rect x="160" y="30" width="40" height="40" fill="#1f386e"/>
<rect x="40" y="70" width="40" height="40" fill="#1f386e"/>
<rect x="80" y="70" width="40" height="40" fill="#1f386e"/>
<rect x="120" y="70" width="40" height="40" fill="var(--panel)" stroke="var(--fig-a)" stroke-width="2.5"/>
<rect x="160" y="70" width="40" height="40" fill="var(--panel)" stroke-dasharray="4 4"/>
<rect x="40" y="110" width="40" height="40" fill="var(--panel)" stroke-dasharray="4 4"/>
<rect x="80" y="110" width="40" height="40" fill="var(--panel)" stroke-dasharray="4 4"/>
<rect x="120" y="110" width="40" height="40" fill="var(--panel)" stroke-dasharray="4 4"/>
<rect x="160" y="110" width="40" height="40" fill="var(--panel)" stroke-dasharray="4 4"/>
</g>
<text class="t" x="140" y="96" text-anchor="middle">?</text>
<path class="ln" d="M205 90H262"/>
<text class="t" x="270" y="60">Next colour depends on:</text>
<text class="m" x="270" y="84">1. the whole grayscale image</text>
<text class="m" x="270" y="104">2. the colours already chosen</text>
<text class="m" x="270" y="140">So the sleeves can agree.</text>
<text class="m" x="40" y="176">filled = chosen · outlined = this pixel · dashed = not yet</text>
</svg>
<figcaption>A 4 by 3 toy grid. The real model works on a much larger grid and uses self-attention, so each step can look at any earlier pixel, not just the neighbours.</figcaption>
</figure>

The attention part matters. My CNN saw each location through a small window plus one global summary of the scene. Self-attention lets each step look directly at every earlier position. That is how a choice made at the top of the shirt can still be felt at the bottom.

## 5. Why three stages

Choosing pixel by pixel is slow, and the cost grows quickly with image size. ColTran avoids paying that cost on a full-size picture by splitting the job into three parts, as described in the authors' code release:

<figure class="fig color-fig">
<svg viewBox="0 0 520 150" role="img" aria-labelledby="stages-title">
<title id="stages-title">Three stages: colorizer, color upsampler, spatial upsampler</title>
<rect class="box" x="8" y="30" width="140" height="84" rx="8"/>
<text class="t" x="78" y="58" text-anchor="middle">1. Colorizer</text>
<text class="m" x="78" y="78" text-anchor="middle">64x64 grey in</text>
<text class="m" x="78" y="96" text-anchor="middle">coarse colour out</text>
<path class="ln" d="M148 72H190"/>
<rect class="box" x="190" y="30" width="140" height="84" rx="8"/>
<text class="t" x="260" y="58" text-anchor="middle">2. Color upsampler</text>
<text class="m" x="260" y="78" text-anchor="middle">refines the colours</text>
<text class="m" x="260" y="96" text-anchor="middle">at 64x64</text>
<path class="ln" d="M330 72H372"/>
<rect class="box" x="372" y="30" width="140" height="84" rx="8"/>
<text class="t" x="442" y="58" text-anchor="middle">3. Spatial upsampler</text>
<text class="m" x="442" y="78" text-anchor="middle">more pixels,</text>
<text class="m" x="442" y="96" text-anchor="middle">final image</text>
<text class="m" x="8" y="140">pixel by pixel · all at once · all at once</text>
</svg>
<figcaption>Only the first stage makes the random, pixel-by-pixel choices. The other two run in parallel, which is much cheaper.</figcaption>
</figure>

Stage one decides *what colours go where*, at a small size where sampling is affordable. Stage two sharpens those colours. Stage three adds resolution. So the creative decision is made once, cheaply, and the rest is clean-up. That split lets a sampling model produce a large picture without scanning every pixel of it one by one.

## 6. How do you grade a model with no single right answer

My project compared a prediction to the original photo and looked at the error. That quietly assumes the original is *the* answer. For a model that samples, it is not: a navy shirt coloured mustard is a perfectly good output and scores badly against the photo.

The ColTran authors say this directly in their README. When you recolour an RGB image, a random sample is just another plausible colouring and is unlikely to match the original. So they recommend distribution-level metrics such as FID, not per-image scores such as LPIPS or SSIM. FID asks whether the set of outputs looks like the set of real photos, not whether each output matches its own source.

The paper also ran a human test on Mechanical Turk. Its abstract reports that in more than 60% of cases evaluators preferred the highest-rated of three generated colorings over the ground truth. That is a statement about how people rated ImageNet results in the authors' study. It does not mean the model recovers the true colours, and it says nothing about my own images.

<figure class="fig color-fig">
<svg viewBox="0 0 520 150" role="img" aria-labelledby="grade-title">
<title id="grade-title">Two ways to grade a colorization</title>
<rect class="box" x="8" y="20" width="240" height="100" rx="8"/>
<text class="h" x="22" y="42">PER-IMAGE</text>
<text class="t" x="22" y="68">Does this output match</text>
<text class="t" x="22" y="86">its own original photo?</text>
<text class="m" x="22" y="108">punishes valid alternatives</text>
<rect class="box" x="272" y="20" width="240" height="100" rx="8"/>
<text class="h" x="286" y="42">DISTRIBUTION-LEVEL</text>
<text class="t" x="286" y="68">Does the whole set look</text>
<text class="t" x="286" y="86">like a set of real photos?</text>
<text class="m" x="286" y="108">what the authors recommend</text>
</svg>
<figcaption>The same output can fail the first test and pass the second.</figcaption>
</figure>

## What I would take from it

I can't say how much of my model's mismatched vegetation came from squared error and how much from a small model and a small training set. Those need different tests, and I never ran them. What I can say is that a single-answer model trained on squared error is built to prefer the blend when the answer is uncertain. A bigger CNN would still be asked for one answer.

ColTran changes the question from "what is the colour?" to "what colours are believable, and which one shall I show?". That is a better match for the task. It does not make the output historical fact. A sampled colouring of an old photograph is still a guess, only a more honest and more varied one.

## Code and references

- [Colorization Transformer](https://arxiv.org/abs/2102.04432), Kumar, Weissenborn and Kalchbrenner (2021, ICLR 2021): the paper discussed here.
- [Authors' code and README](https://github.com/google-research/google-research/tree/master/coltran): the three-component description and the note on evaluation metrics.
- [My earlier colorization post]({{ '/posts/colorizing-images-with-local-and-global-features/' | relative_url }}): the 2019 CNN project this one looks back on.
- [Deep Koalarization](https://arxiv.org/abs/1712.03400), Baldassarre, González Morín and Rodés-Guirao (2017): the architecture I reproduced.

<style>
.color-fig svg{min-width:0;max-width:520px}.color-viz{overflow-x:visible}.avg-row{display:flex;gap:28px;justify-content:center;margin:16px 0}.avg-row>div{text-align:center}.avg-sw{width:120px;height:90px;border-radius:10px;border:1px solid var(--line);background:var(--panel)}#avg-mean{width:70px;height:52px;margin:19px auto 0}.avg-row span{display:block;font:12px/1.4 'Geist Mono',monospace;color:var(--muted);margin-top:6px}@media(max-width:640px){.color-fig svg .t{font-size:15px}.color-fig svg .m{font-size:14px}.color-fig svg .h{font-size:13px}}
</style>
<script>
(function(){
var C=[[31,56,110,'navy'],[40,110,70,'forest green'],[170,35,45,'crimson'],[210,160,40,'mustard'],[60,60,65,'charcoal'],[30,130,140,'teal']];
var n=0,s=[0,0,0];
var last=document.getElementById('avg-last'),mean=document.getElementById('avg-mean'),note=document.getElementById('avg-note');
if(!last)return;
function rgb(a){return 'rgb('+Math.round(a[0])+','+Math.round(a[1])+','+Math.round(a[2])+')';}
document.getElementById('avg-draw').addEventListener('click',function(){
var c=C[Math.floor(Math.random()*C.length)];n++;s[0]+=c[0];s[1]+=c[1];s[2]+=c[2];
last.style.background=rgb(c);mean.style.background=rgb([s[0]/n,s[1]/n,s[2]/n]);
note.textContent='Draw '+n+': '+c[3]+'. The average swatch blends all '+n+' draw'+(n>1?'s':'')+(n>2?' toward a dull mix that none of them look like.':'.')+' Colours and equal odds are my illustration, not model output.';
});
document.getElementById('avg-reset').addEventListener('click',function(){n=0;s=[0,0,0];last.style.background='';mean.style.background='';note.textContent='No draws yet. Press the button.';});
})();
</script>
