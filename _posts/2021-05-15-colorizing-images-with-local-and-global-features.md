---
layout: post
title: "Image colorization: learning what grayscale leaves out"
date: 2021-05-15
tags:
- data
summary: How local detail and scene context help a neural network predict colour, and why plausible is not the same as correct.
---

A grayscale photograph still tells us a lot. We can see a person, a tree, a patch of sky. But a shirt that looks dark might have been blue, green or red. Removing colour throws away information. Putting colour back means making a prediction, not undoing a reversible operation.

In 2019, I built an image colorization model for the DD2424 course at KTH. I used TensorFlow and Keras to reproduce the approach in *Deep Koalarization*, with some modifications. The model combined a convolutional encoder with a pretrained Inception-ResNet-v2 network, then decoded their combined features into colour.

The interesting part is how those two paths help each other. One looks at local detail. The other provides context for the whole image. Neither can tell us the original colour of every object.

<figure class="fig color-fig">
<img src="{{ '/assets/images/projects/colorization-example.svg' | relative_url }}" alt="A landscape example from my project: grayscale input on the left, predicted colour in the middle, original colour on the right. The sky becomes blue, while the tree and vegetation do not fully match the original.">
<figcaption>Actual landscape output from my 2,000-image experiment. Left: grayscale. Middle: prediction. Right: original. The sky is blue, but the vegetation and tree do not fully match.</figcaption>
</figure>

## 1. Keep the lightness, predict the colour

Start with a pixel in the sky. Rather than ask the model to predict its red, green and blue values from scratch, I separate lightness from colour using the CIE L&#42;a&#42;b&#42; colour space.

**L&#42;** represents lightness. **a&#42;** runs roughly from green to red, and **b&#42;** from blue to yellow. My input is L&#42;. The target is the pair (a&#42;, b&#42;). At the end, I combine the predicted pair with the original L&#42;, then convert back to RGB for display.

<figure class="fig color-fig">
<svg viewBox="0 0 520 184" role="img" aria-labelledby="lab-title">
<title id="lab-title">Keep one channel and predict the other two</title>
<rect class="box" x="8" y="22" width="140" height="118" rx="8"/>
<text class="t" x="78" y="52" text-anchor="middle">Original image</text>
<text class="m" x="78" y="78" text-anchor="middle">L&#42; · a&#42; · b&#42;</text>
<path class="ln" d="M148 57H206 M148 113H206"/>
<rect class="box" x="206" y="22" width="138" height="64" rx="8"/>
<text class="t" x="275" y="48" text-anchor="middle">L&#42; → input</text>
<text class="m" x="275" y="68" text-anchor="middle">keep lightness</text>
<rect class="box" x="206" y="98" width="138" height="64" rx="8"/>
<text class="t" x="275" y="124" text-anchor="middle">a&#42;, b&#42; → target</text>
<text class="m" x="275" y="144" text-anchor="middle">learn colour</text>
<path class="ln" d="M344 54H376V90H390 M344 130H376V90"/>
<rect class="box" x="390" y="60" width="122" height="64" rx="8"/>
<text class="t" x="451" y="85" text-anchor="middle">Prediction</text>
<text class="m" x="451" y="107" text-anchor="middle">L&#42; + â*, b̂*</text>
</svg>
<figcaption>The final image keeps the input's lightness channel. Only the two colour channels are learned.</figcaption>
</figure>

<figure class="fig color-viz" id="lab-explorer">
<div class="viz-q"><strong>What does each channel contribute?</strong> Pick which channels to keep. Real photo from the project's ground truth, converted to L&#42;a&#42;b&#42;.</div>
<div class="viz-buttons" role="group" aria-label="Channels to keep">
<button type="button" data-src="lab-L.png" aria-pressed="true">L&#42; only</button>
<button type="button" data-src="lab-La.png" aria-pressed="false">L&#42; + a&#42;</button>
<button type="button" data-src="lab-Lb.png" aria-pressed="false">L&#42; + b&#42;</button>
<button type="button" data-src="lab-Lab.png" aria-pressed="false">L&#42; + a&#42; + b&#42;</button>
</div>
<div class="viz-stage"><img id="lab-explorer-img" src="{{ '/assets/images/projects/colorization/lab-L.png' | relative_url }}" alt="The same landscape photo showing only the channels selected"></div>
<p class="viz-note" id="lab-explorer-note">L&#42; alone is a complete grayscale photo. This is the model's input.</p>
</figure>

The other two channels are what the model has to invent. Shown on their own at constant lightness, they look like this:

<figure class="fig color-viz">
<div class="viz-row">
<div><img src="{{ '/assets/images/projects/colorization/lab-a-only.png' | relative_url }}" alt="The a-star channel alone: faint pink on the rock, faint green in the shadows, grey elsewhere"><span>a&#42;: green to red</span></div>
<div><img src="{{ '/assets/images/projects/colorization/lab-b-only.png' | relative_url }}" alt="The b-star channel alone: yellow-brown on the rock and vegetation, blue in the sky"><span>b&#42;: blue to yellow</span></div>
</div>
<figcaption>Both channels shown at one fixed lightness. In this photo most of the story is in b&#42;: blue sky against yellow-brown rock and plants. a&#42; stays close to zero everywhere. Values are recomputed from the figure's image pixels, so JPEG compression adds some noise.</figcaption>
</figure>

The notebook also scales the values before training: L&#42;/50 - 1 for the input, and a&#42;/128 and b&#42;/128 for the targets. Those are numerical conventions, not new colours. Reconstruction reverses the scaling before converting to RGB.

This split gives the model a narrower job. The sky's shape and lightness are already there; the model has to estimate its missing colour. But to do that, it first needs clues about what the pixel belongs to.

## 2. Detail is useful, but context changes its meaning

A convolution is a small filter moved across an image. It can respond to patterns such as edges and textures. Stacking these layers lets the encoder build a more useful representation than individual pixel values.

<figure class="fig color-viz">
<div class="viz-row viz-row4">
<div><img src="{{ '/assets/images/projects/colorization/ex1-gray.png' | relative_url }}" alt="Grayscale landscape input"><span>Input L&#42;</span></div>
<div><img src="{{ '/assets/images/projects/colorization/filter-vertical-edges.png' | relative_url }}" alt="Vertical edge response: bright along rock cracks and the cliff edge"><span>vertical edges</span></div>
<div><img src="{{ '/assets/images/projects/colorization/filter-horizontal-edges.png' | relative_url }}" alt="Horizontal edge response: bright along the tree line and cloud bottoms"><span>horizontal edges</span></div>
<div><img src="{{ '/assets/images/projects/colorization/filter-local-contrast.png' | relative_url }}" alt="Local contrast: texture on rock and trees, flat sky"><span>local contrast</span></div>
</div>
<figcaption><strong>Illustration, not the model's weights.</strong> I did not keep trained filters from the project, so these three maps come from hand-made Sobel and local-contrast filters applied to the real grayscale input. A trained first layer learns its own filters, but it responds to the same kind of thing: rock texture lights up, flat sky does not.</figcaption>
</figure>

A smooth light patch, though, could be sky, a wall or fabric. Its nearby pixels help, but so does knowing whether the entire image looks like an outdoor landscape or an indoor room. That is why my model has a second path.

I send a grayscale version of the image to Inception-ResNet-v2, pretrained on ImageNet. Its expected input is 299 × 299 × 3, so I resize and repeat grayscale across three channels. **Repeating grayscale does not restore colour.** It only makes the input compatible with the pretrained network.

<figure class="fig color-fig">
<svg viewBox="0 0 520 222" role="img" aria-labelledby="paths-title">
<title id="paths-title">Local detail and whole-image context meet before decoding</title>
<rect class="box" x="8" y="76" width="102" height="62" rx="8"/>
<text class="t" x="59" y="101" text-anchor="middle">Grayscale</text><text class="m" x="59" y="122" text-anchor="middle">same scene</text>
<path class="ln" d="M110 107H130V42H150 M130 107V173H150"/>
<rect class="box" x="150" y="10" width="194" height="66" rx="8"/>
<text class="t" x="247" y="37" text-anchor="middle">Convolutional encoder</text><text class="m" x="247" y="59" text-anchor="middle">spatial detail · learned</text>
<rect class="box" x="150" y="140" width="194" height="66" rx="8"/>
<text class="t" x="247" y="166" text-anchor="middle">Inception-ResNet-v2</text><text class="m" x="247" y="188" text-anchor="middle">whole-image features</text>
<path class="ln" d="M344 43H369V107H394 M344 173H369V107"/>
<rect class="box" x="394" y="76" width="118" height="62" rx="8"/>
<text class="t" x="453" y="102" text-anchor="middle">Fusion</text><text class="m" x="453" y="123" text-anchor="middle">then decoder</text>
</svg>
<figcaption>The encoder keeps spatial information. The pretrained path gives the decoder another source of evidence about the scene.</figcaption>
</figure>

The project report calls the pretrained representation high-level features. There is a useful implementation detail here: the v2 notebook creates Inception-ResNet-v2 with `include_top=True` and uses `inception.predict`. That gives the 1,000 class outputs. The report describes a vector before softmax, so its wording and this notebook are not identical. The safe description is a **1,000-value pretrained representation**, rather than claiming every version uses pre-softmax activations.

## 3. Put the scene context at every location

Now there are two things of different shapes. The encoder produces a grid of local features. The pretrained network produces one vector for the image. Fusion repeats that vector at every position in the grid and concatenates it with the local features.

In the v2 notebook the input is 256 × 256. Three stride-2 convolutions reduce height and width by a factor of eight, so the encoder output is 32 × 32 × 256. Repeating the 1,000-value context vector over that grid produces 32 × 32 × 1,000. Concatenating them gives 32 × 32 × 1,256. (The report used a 128 × 128 input, which gives a 16 × 16 grid with the same channel counts.)

<figure class="fig color-fig">
<svg viewBox="0 0 520 168" role="img" aria-labelledby="fusion-title">
<title id="fusion-title">The channel counts in the fusion layer</title>
<rect class="box" x="8" y="18" width="154" height="62" rx="8"/>
<text class="t" x="85" y="43" text-anchor="middle">Local grid</text><text class="m" x="85" y="64" text-anchor="middle">32 × 32 × 256</text>
<rect class="box" x="8" y="94" width="154" height="62" rx="8"/>
<text class="t" x="85" y="119" text-anchor="middle">Repeated context</text><text class="m" x="85" y="140" text-anchor="middle">32 × 32 × 1,000</text>
<path class="ln" d="M162 49H188V87H214 M162 125H188V87"/>
<rect class="box" x="214" y="55" width="128" height="64" rx="8"/>
<text class="t" x="278" y="80" text-anchor="middle">Concatenate</text><text class="m" x="278" y="101" text-anchor="middle">1,256 channels</text>
<path class="ln" d="M342 87H370"/>
<rect class="box" x="370" y="55" width="142" height="64" rx="8"/>
<text class="t" x="441" y="80" text-anchor="middle">1 × 1 convolution</text><text class="m" x="441" y="101" text-anchor="middle">256 channels</text>
</svg>
<figcaption>Each location receives its own local features plus the same scene vector. A 1 × 1 convolution mixes those channels before decoding.</figcaption>
</figure>

A 1 × 1 convolution does not look across neighbouring positions. It learns how to combine channels at the current position. After that, the decoder uses convolutions and upsampling to produce two colour values at each output pixel.

For my sky pixel, the path is now complete: local features describe its region, scene features provide context, and the decoder predicts (a&#42;, b&#42;). Training tells the model how close that guess came to the original.

Here is the whole path, using the layer sizes from the v2 notebook. Step through it. Block height shows height and width of the tensor, block thickness shows the number of channels.

<figure class="fig color-viz" id="net-stepper">
<div class="viz-q"><strong>What shape is the data at each stage, and what is each stage for?</strong></div>
<svg id="net-svg" viewBox="0 0 700 250" role="img" aria-label="Tensor shapes through the colorization network, from a 256 by 256 grayscale input to a 256 by 256 by 2 colour output"></svg>
<div class="viz-buttons" id="net-buttons" role="group" aria-label="Network stage"></div>
<div class="viz-panel" aria-live="polite"><div id="net-text"></div><div id="net-images"></div></div>
<figcaption>Tensor sizes and layer order are read from the v2 notebook. The blocks are a drawing of those sizes, not captured activations.</figcaption>
</figure>

## 4. Looking at what it predicted

With the architecture in place, the next question is what its predictions look like. The output examples are from the 2,000-image run. First, the three examples side by side. These are the figure from the project, cropped into separate images.

<figure class="fig color-viz">
<div class="viz-grid3">
<div><img src="{{ '/assets/images/projects/colorization/ex1-gray.png' | relative_url }}" alt="Example 1 grayscale"><span>Input</span></div><div><img src="{{ '/assets/images/projects/colorization/ex1-pred.png' | relative_url }}" alt="Example 1 predicted colour"><span>Prediction</span></div><div><img src="{{ '/assets/images/projects/colorization/ex1-truth.png' | relative_url }}" alt="Example 1 ground truth"><span>Ground truth</span></div>
<div><img src="{{ '/assets/images/projects/colorization/ex2-gray.png' | relative_url }}" alt="Example 2 grayscale"></div><div><img src="{{ '/assets/images/projects/colorization/ex2-pred.png' | relative_url }}" alt="Example 2 predicted colour"></div><div><img src="{{ '/assets/images/projects/colorization/ex2-truth.png' | relative_url }}" alt="Example 2 ground truth"></div>
<div><img src="{{ '/assets/images/projects/colorization/ex3-gray.png' | relative_url }}" alt="Example 3 grayscale"></div><div><img src="{{ '/assets/images/projects/colorization/ex3-pred.png' | relative_url }}" alt="Example 3 predicted colour"></div><div><img src="{{ '/assets/images/projects/colorization/ex3-truth.png' | relative_url }}" alt="Example 3 ground truth"></div>
</div>
<figcaption>Sky is blue and grass is green, but the red crowd in the second row comes out dark and the blue jersey in the third row comes out brown. The ground-truth crops in rows 2 and 3 are framed slightly differently from the other two columns in the original figure, so only row 1 lines up pixel by pixel.</figcaption>
</figure>

Row 1 lines up exactly, so I can ask where its colour is wrong. Drag the handle to compare the prediction with the original.

<figure class="fig color-viz" id="compare">
<div class="viz-q"><strong>Where does the prediction differ from the original?</strong> Prediction on the left of the handle, ground truth on the right.</div>
<div class="cmp-box"><img src="{{ '/assets/images/projects/colorization/ex1-truth.png' | relative_url }}" alt="Ground truth, example 1"><div class="cmp-top" id="cmp-top"><img src="{{ '/assets/images/projects/colorization/ex1-pred.png' | relative_url }}" alt="Prediction, example 1"></div><div class="cmp-handle" id="cmp-handle"></div></div>
<input id="cmp-range" type="range" min="0" max="100" value="50" aria-label="Comparison position">
</figure>

The map below measures that difference as distance in the (a&#42;, b&#42;) plane at each pixel: lighter is closer, darker is further from the original. The darkest area is the rock face, where the prediction is grey instead of orange and brown. Sky is the lightest.

<figure class="fig color-viz">
<div class="viz-row viz-row3">
<div><img src="{{ '/assets/images/projects/colorization/ex1-pred.png' | relative_url }}" alt="Prediction"><span>Prediction</span></div>
<div><img src="{{ '/assets/images/projects/colorization/ex1-truth.png' | relative_url }}" alt="Ground truth"><span>Ground truth</span></div>
<div><img src="{{ '/assets/images/projects/colorization/ex1-err.png' | relative_url }}" alt="Colour error map: dark on the cliff, light on the sky"><span>Colour error</span></div>
</div>
<div class="viz-legend"><span>0</span><i></i><span>60+ (a&#42;, b&#42; units)</span></div>
<figcaption>Mean colour error for this crop is about 11 units; the 95th percentile is about 25.</figcaption>
</figure>

The most useful picture is of the colours themselves. Each plot below places every pixel at its (a&#42;, b&#42;) position. Top row: the original colours. Bottom row: what the model predicted.

<figure class="fig color-viz">
<img src="{{ '/assets/images/projects/colorization/chroma-spread.png' | relative_url }}" alt="Two-dimensional histograms of a-star and b-star for three examples, ground truth on the top row, prediction on the bottom row. The predictions cluster tightly near the centre, the originals spread much further out.">
<figcaption>The predictions sit close to the neutral centre while the originals spread outward. Average chroma, measured as distance from the centre, is about 11 against 21 in example 1, 14 against 23 in example 2 and 13 against 21 in example 3. These numbers come from the 150-pixel image crops in the project's figure, so treat them as approximate.</figcaption>
</figure>

These plots show how muted the predictions are, but they do not establish the cause. Colour ambiguity and an implementation problem are different possible explanations; the output images alone cannot distinguish them.

## Plausible colour is not recovered history

The output examples are the most honest ending to this project. The model can put blue into sky and green into grass, while missing a shirt's actual colour. Local detail and scene context help make a guess; they do not turn that guess into a record of what was there.

I reproduced an approach and got a small model working. I did not establish excellent generalization, a production system, or a measured improvement over a baseline. The useful lesson is to keep those claims separate: fitting one image, producing a plausible example and reliably handling unseen images are different milestones.

## Code and references

- [My repository](https://github.com/fadhilmch/image_colorization): notebooks, architecture and output examples.
- [Project report](https://github.com/fadhilmch/image_colorization/blob/master/documents/DD2424_Project_Report.pdf): experiment sizes, training setup, results and the unresolved TFRecords issue.
- [The v2 notebook](https://github.com/fadhilmch/image_colorization/blob/master/dd2424_colorization_v2.ipynb): input normalization, pretrained representation and model implementation.
- [Deep Koalarization](https://arxiv.org/abs/1712.03400), Baldassarre, González Morín and Rodés-Guirao (2017): the main architecture I reproduced.
- [Let there be Color!](https://iizuka.cs.tsukuba.ac.jp/projects/colorization/en/), Iizuka, Simo-Serra and Ishikawa (2016): combining local image features with global context.

<style>
.color-fig svg{min-width:0;max-width:520px}.color-equation{border:1px solid var(--line);border-radius:8px;padding:16px;font:14px/1.8 'Geist Mono',monospace;margin:24px 0;overflow-wrap:anywhere}.color-experiments{display:grid;gap:12px;margin:24px 0}.color-experiments>div{border-left:3px solid var(--fig-a);padding:12px 16px;background:var(--panel)}.color-experiments strong,.color-experiments span{display:block}.color-experiments span{font-size:14px;color:var(--muted)}.color-experiments p{font-size:14px;margin:6px 0 0}@media(max-width:640px){.color-fig svg .t{font-size:15px}.color-fig svg .m{font-size:14px}}
.color-viz{overflow-x:visible}.color-viz img{display:block;width:100%;height:auto;border-radius:6px}.viz-q{margin:0 0 12px}.viz-buttons{display:flex;gap:6px;flex-wrap:wrap;margin:12px 0}.viz-buttons button{font:inherit;font-size:13px;cursor:pointer;border:1px solid var(--line);border-radius:999px;padding:4px 12px;background:var(--panel);color:var(--fg)}.viz-buttons button[aria-pressed="true"]{background:var(--fg);color:var(--bg)}.viz-stage{max-width:340px;margin:0 auto}.viz-note{font-size:13px;color:var(--muted);text-align:center;margin:10px 0 0}.viz-row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;max-width:520px;margin:0 auto}.viz-row4{grid-template-columns:repeat(4,minmax(0,1fr));max-width:680px}.viz-row3{grid-template-columns:repeat(3,minmax(0,1fr));max-width:620px}.viz-row span,.viz-grid3 span{display:block;font:12px/1.4 'Geist Mono',monospace;color:var(--muted);margin-top:4px;text-align:center}.viz-grid3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;max-width:520px;margin:0 auto}.viz-legend{display:flex;align-items:center;gap:8px;max-width:620px;margin:10px auto 0;font:12px 'Geist Mono',monospace;color:var(--muted)}.viz-legend i{flex:1;height:8px;border-radius:4px;background:linear-gradient(90deg,#fcfdbf,#fc8961,#b73779,#000004)}.viz-panel{display:flex;gap:16px;align-items:flex-start;min-height:120px;border:1px solid var(--line);background:var(--panel);border-radius:10px;padding:14px 16px}.viz-panel #net-text{flex:1;font-size:14px}.viz-panel #net-text strong{display:block;margin-bottom:4px}.viz-panel #net-text code{font-size:12px}#net-images{display:flex;gap:8px;flex:none}#net-images img{width:96px}#net-svg{min-width:0;max-width:700px}#net-svg .blk{fill:var(--line);stroke:var(--muted);stroke-width:1}#net-svg .blk.on{fill:var(--fig-a);stroke:var(--fg)}#net-svg .top{fill:var(--ghost)}#net-svg .on-top{fill:var(--fig-a);opacity:.6}#net-svg text{fill:var(--fg);font-size:12px}.cmp-box{position:relative;max-width:340px;margin:0 auto;overflow:hidden;border-radius:6px}.cmp-top{position:absolute;inset:0;overflow:hidden;width:50%}.cmp-top img{width:auto;max-width:none;height:100%;aspect-ratio:1}.cmp-handle{position:absolute;top:0;bottom:0;left:50%;width:2px;background:#fff;box-shadow:0 0 0 1px rgb(0 0 0 / 35%)}#cmp-range{display:block;width:100%;max-width:340px;margin:12px auto 0;accent-color:var(--fig-a)}@media(max-width:640px){.viz-row4{grid-template-columns:repeat(2,minmax(0,1fr))}.viz-panel{flex-direction:column}#net-svg text{font-size:21px}}
</style>
<script>
(function(){
var P=document.querySelector('#lab-explorer-img');
if(P){var base=P.src.replace(/lab-[A-Za-z]+\.png.*$/,'');var notes={'lab-L.png':'L* alone is a complete grayscale photo. This is the model\'s input.','lab-La.png':'Adding a* only: faint pink on the rock, faint green in the shadows. The sky stays grey.','lab-Lb.png':'Adding b* only: the sky turns blue and the rock and plants turn yellow-brown. Most of the scene\'s colour is here.','lab-Lab.png':'All three channels: the original photo. The model must predict the last two.'};
document.querySelectorAll('#lab-explorer button').forEach(function(b){b.addEventListener('click',function(){document.querySelectorAll('#lab-explorer button').forEach(function(x){x.setAttribute('aria-pressed','false')});b.setAttribute('aria-pressed','true');var s=b.getAttribute('data-src');P.src=base+s;document.getElementById('lab-explorer-note').textContent=notes[s];});});}
var r=document.getElementById('cmp-range');
if(r){var top=document.getElementById('cmp-top'),h=document.getElementById('cmp-handle'),box=top.parentNode;function size(){top.firstElementChild.style.width=box.clientWidth+'px';}function set(){top.style.width=r.value+'%';h.style.left=r.value+'%';}r.addEventListener('input',set);window.addEventListener('resize',size);size();set();setTimeout(size,300);var im=top.firstElementChild;im.addEventListener('load',size);}
var svg=document.getElementById('net-svg');
if(svg){
var S=[
{t:'1. Input',d:'The grayscale image, L* only, one channel. The notebook scales it as L*/50 - 1. Nothing about colour has entered the network yet.',im:['ex1-gray.png']},
{t:'2. Encoder: down to 128 × 128',d:'A 3 × 3 convolution with stride 2 halves height and width and gives 64 channels. A second convolution widens it to 128 channels. Each position now describes a small neighbourhood, not a single pixel.'},
{t:'3. Encoder: down to 64 × 64',d:'Another stride-2 convolution halves the grid again. Channels go to 128, then 256. Edges and textures start to combine into larger local patterns.'},
{t:'4. Encoder: down to 32 × 32',d:'A third stride-2 convolution leaves a 32 × 32 grid. Two 512-channel convolutions and one back to 256 give the encoder output, 32 × 32 × 256. This is the local-detail path.'},
{t:'5. Context vector',d:'In parallel, the grayscale image is resized to 299 × 299, repeated across three channels and passed through pretrained Inception-ResNet-v2. The notebook keeps its 1,000 class outputs. This is one vector for the whole image, not a grid.'},
{t:'6. Fusion',d:'The 1,000-value vector is repeated at all 32 × 32 positions, concatenated with the encoder output (256 + 1,000 = 1,256 channels), then a 1 × 1 convolution mixes them back to 256 channels.'},
{t:'7. Decoder: back up',d:'A 128-channel convolution, then 2 × upsampling to 64 × 64 with 64 channels, upsampling again to 128 × 128 with 32 and 16 channels. Convolutions refine, upsampling restores the grid size.'},
{t:'8. Output: a* and b*',d:'A last convolution with tanh gives 2 channels at 128 × 128, upsampled to 256 × 256 × 2. Multiply by 128 to get predicted a* and b*, then stack them under the original L*.',im:['ex1-pred.png','ex1-truth.png']}];
var B=[ // [step, size, ch, label, shape]
[0,256,1,'256²×1'],[1,128,64,'128²×64'],[1,128,128,'128²×128'],[2,64,128,'64²×128'],[2,64,256,'64²×256'],[3,32,256,'32²×256'],[3,32,512,'32²×512'],[3,32,256,'32²×256'],
[5,32,1256,'32²×1256'],[5,32,256,'32²×256'],[6,32,128,'32²×128'],[6,64,64,'64²×64'],[6,128,32,'128²×32'],[7,128,2,'128²×2'],[7,256,2,'256²×2']];
var NS='http://www.w3.org/2000/svg';
function el(n,a){var e=document.createElementNS(NS,n);for(var k in a)e.setAttribute(k,a[k]);return e;}
var H=function(s){return 14+Math.sqrt(s)*6;},Wd=function(c){return 6+Math.sqrt(c)*1.3;};
var tot=0;B.forEach(function(b){tot+=Wd(b[2]);});var gap=(684-tot)/(B.length-1),x=8,blocks=[],fx=0;
B.forEach(function(b,i){var h=H(b[1]),w=Wd(b[2]),y=160-h/2;var g=el('g',{});var tp=el('polygon',{points:x+','+y+' '+(x+6)+','+(y-6)+' '+(x+w+6)+','+(y-6)+' '+(x+w)+','+y,class:'top'});var f=el('rect',{x:x,y:y,width:w,height:h,class:'blk'});g.appendChild(tp);g.appendChild(f);svg.appendChild(g);
 var late=x>600,lab=el('text',{x:late?694:x+w/2,y:i%2?236:214,'text-anchor':late?'end':'middle',visibility:'hidden'});lab.textContent=b[3];svg.appendChild(lab);
 if(i===8)fx=x+w/2;
 blocks.push({step:b[0],f:f,t:tp,l:lab});x+=w+gap;});
var ctx=el('rect',{x:fx-20,y:26,width:40,height:12,class:'blk'});var ctxT=el('text',{x:8,y:16,'text-anchor':'start'});ctxT.textContent='context vector from Inception-ResNet-v2';svg.appendChild(ctx);svg.appendChild(ctxT);
var ln=el('path',{d:'M'+fx+' 38V'+(160-H(32)/2-8),fill:'none',stroke:'var(--muted)','stroke-width':1.2,'stroke-dasharray':'3 3'});svg.insertBefore(ln,svg.firstChild);
blocks.push({step:4,f:ctx,t:null,l:null});
var bw=document.getElementById('net-buttons'),tx=document.getElementById('net-text'),ti=document.getElementById('net-images');
var base2=document.getElementById('lab-explorer-img')?document.getElementById('lab-explorer-img').src.replace(/lab-[A-Za-z]+\.png.*$/,''):'';
function show(i){blocks.forEach(function(b){var on=b.step===i;b.f.setAttribute('class','blk'+(on?' on':''));if(b.t)b.t.setAttribute('class',on?'on-top':'top');if(b.l)b.l.setAttribute('visibility',on?'visible':'hidden');});
 tx.innerHTML='';var s=document.createElement('strong');s.textContent=S[i].t;var p=document.createElement('span');p.textContent=S[i].d;tx.appendChild(s);tx.appendChild(p);
 ti.innerHTML='';(S[i].im||[]).forEach(function(n){var im=document.createElement('img');im.src=base2+n;im.alt=n.indexOf('gray')>-1?'Grayscale input':(n.indexOf('pred')>-1?'Predicted colour':'Ground truth');ti.appendChild(im);});
 Array.prototype.forEach.call(bw.children,function(b,j){b.setAttribute('aria-pressed',j===i?'true':'false');});}
S.forEach(function(s,i){var b=document.createElement('button');b.type='button';b.textContent=String(i+1);b.setAttribute('aria-label',s.t);b.addEventListener('click',function(){show(i);});bw.appendChild(b);});
show(0);}
})();
</script>
