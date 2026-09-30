---
layout: post
title: "Real or luck? P-values, significance and statistical tests"
date: 2021-10-16
math: true
tags:
- exp
- data
summary: "How to tell a real difference from random noise"
---

You change the colour of a button. Out of 10,000 people, 1,000 convert with the old one and 1,080 with the new one. That looks better. But would a different group of people have given you a different answer?

**A real improvement and a lucky sample can look alike.** A statistical test helps you judge the evidence. It cannot tell you with certainty which explanation is true.

We'll start with ten coin flips, where we can count every possibility. Then we'll use the same thinking for the button. Each time: understand the question, work through an example, then read the formula one piece at a time. The widgets let you change one thing and see why the answer changes.

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

## Start with a coin

A friend says a coin is fair. You flip it **10 times and get 8 heads**. Is that enough reason to doubt the claim?

**Step 1: make the claim precise.** A fair coin has a 50% chance of heads on each flip. We also assume independent flips: one doesn't change the next. On average you'd expect 5 heads in 10 flips, but a fair coin doesn't promise exactly 5 every time.

The claim we're checking is the **null hypothesis**, written $$H_0$$. Here it means "the coin is fair". For now, assume that claim is true and ask what it could produce.

**Step 2: count all possible sequences.** One flip has two outcomes: H or T. Two flips have four: HH, HT, TH, TT. Each extra flip doubles the list. Ten flips have ten 2s multiplied together:

$$
2^{10}=1024
$$

The little 10 means "multiply ten copies of 2". For our fair, independent coin, all **1,024 sequences are equally likely**. Probability is therefore a count divided by 1,024.


<figure class="fig learn-fig">
<svg viewBox="0 0 420 385" role="img" aria-labelledby="pv-double-t pv-double-d">
<title id="pv-double-t">Ten flips create 1024 sequences</title>
<desc id="pv-double-d">One flip gives two sequences, two gives four, three gives eight and ten gives 1024. The displayed third-flip sequences are only the four beginning with H.</desc>
<text x="14" y="26" class="" text-anchor="start">Each extra flip doubles the sequence list</text><rect x="12" y="49" width="396" height="66" rx="5" fill="var(--panel)" fill-opacity="1" stroke="var(--line)"/><text x="26" y="73" class="" text-anchor="start">1 flip: 2 sequences</text><text x="26" y="97" class="sub" text-anchor="start">H · T</text><rect x="12" y="131" width="396" height="66" rx="5" fill="var(--panel)" fill-opacity="1" stroke="var(--line)"/><text x="26" y="155" class="" text-anchor="start">2 flips: 4 sequences</text><text x="26" y="179" class="sub" text-anchor="start">HH · HT · TH · TT</text><rect x="12" y="213" width="396" height="66" rx="5" fill="var(--panel)" fill-opacity="1" stroke="var(--line)"/><text x="26" y="237" class="" text-anchor="start">3 flips: 8 sequences</text><text x="26" y="261" class="sub" text-anchor="start">HHH · HHT · HTH · HTT</text><text x="210" y="289" class="sub" text-anchor="middle">… keep doubling …</text><rect x="12" y="295" width="396" height="66" rx="5" fill="var(--panel)" fill-opacity="1" stroke="var(--line)"/><text x="26" y="319" class="" text-anchor="start">10 flips: 1,024 sequences</text><text x="26" y="343" class="sub" text-anchor="start">2¹⁰ = multiply ten copies of 2</text>
</svg>
<figcaption>Three flips also include THH, THT, TTH and TTT. All 1,024 ten-flip sequences are equally likely only because the coin is fair and the flips are independent.</figcaption>
</figure>

**Step 3: separate a sequence from a heads count.** HHHHHHHHTT and TTHHHHHHHH are different sequences, but both give 8 heads. There are 45 sequences with 8 heads, 10 with 9, and just 1 with 10. Five heads has 252 sequences, which is why the middle bar is tallest.

Read the chart as a list of what a fair coin can do. The horizontal labels count heads; the heights show how often each count happens.

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

**Step 4: say what "at least as unusual" means.** Our 8 heads is 3 away from the expected 5. Every result at least 3 away counts: **0, 1, 2, 8, 9 or 10 heads**. We're looking for bias in either direction, so this is a **two-sided test**.

If we'd decided *before flipping* to check only whether the coin favours heads, we'd count 8, 9 and 10 instead. That's a **one-sided test**. Don't choose the direction after seeing which gives the smaller number.


<figure class="fig learn-fig">
<svg viewBox="0 0 420 224" role="img" aria-labelledby="pv-extreme-t pv-extreme-d">
<title id="pv-extreme-t">Extreme means at least the observed distance</title>
<desc id="pv-extreme-d">Number line of heads counts from 0 through 10. Counts at least 3 away from 5 are highlighted: 0, 1, 2, 8, 9 and 10.</desc>
<text x="14" y="25" class="" text-anchor="start">Observed: 8 heads, distance 3 from 5</text><path d="M22,92 H398" class="axis"/><circle cx="24.0" cy="92" r="5" fill="var(--l0)"/><text x="24.0" y="121" class="" text-anchor="middle">0</text><circle cx="61.2" cy="92" r="5" fill="var(--l0)"/><text x="61.2" y="121" class="" text-anchor="middle">1</text><circle cx="98.4" cy="92" r="5" fill="var(--l0)"/><text x="98.4" y="121" class="" text-anchor="middle">2</text><circle cx="135.60000000000002" cy="92" r="5" fill="var(--muted)"/><text x="135.60000000000002" y="121" class="" text-anchor="middle">3</text><circle cx="172.8" cy="92" r="5" fill="var(--muted)"/><text x="172.8" y="121" class="" text-anchor="middle">4</text><circle cx="210.0" cy="92" r="5" fill="var(--muted)"/><text x="210.0" y="121" class="" text-anchor="middle">5</text><circle cx="247.20000000000002" cy="92" r="5" fill="var(--muted)"/><text x="247.20000000000002" y="121" class="" text-anchor="middle">6</text><circle cx="284.40000000000003" cy="92" r="5" fill="var(--muted)"/><text x="284.40000000000003" y="121" class="" text-anchor="middle">7</text><circle cx="321.6" cy="92" r="8" fill="var(--l0)"/><text x="321.6" y="121" class="" text-anchor="middle">8</text><circle cx="358.8" cy="92" r="5" fill="var(--l0)"/><text x="358.8" y="121" class="" text-anchor="middle">9</text><circle cx="396.0" cy="92" r="5" fill="var(--l0)"/><text x="396.0" y="121" class="" text-anchor="middle">10</text><path d="M210,67 H321.6" stroke="var(--l3)" stroke-width="2"/><text x="266" y="55" class="sub" text-anchor="middle">3 away</text><rect x="12" y="148" width="396" height="60" rx="5" fill="var(--l0)" fill-opacity="0.14" stroke="var(--line)"/><text x="26" y="173" class="" text-anchor="start">Count: 0, 1, 2 and 8, 9, 10</text><text x="26" y="195" class="sub" text-anchor="start">Ignore: 3, 4, 5, 6, 7</text>
</svg>
<figcaption>Distance, not direction: 2 heads is just as far from 5 as 8 heads. This is the two-sided rule for this fair-coin example, not a universal definition of every test.</figcaption>
</figure>

**Step 5: add the counts, then divide.** Eight or more heads happens in 45 + 10 + 1 = 56 sequences. Two or fewer happens in another 56. Together:

$$
p=\frac{56+56}{1024}=\frac{112}{1024}\approx0.1094
$$

That's **10.9%**. This is the **p-value**: if the coin is fair, a result at least this far from 5 happens about 11 times in 100 sets of ten flips. We count your result *and more unusual ones*, not just exactly 8 heads.

**Step 6: compare with a rule chosen beforehand.** Suppose we agreed to question fairness only when that percentage is below 5%. Our 10.9% is above it, so the test doesn't reject fairness. That does **not** prove the coin is fair. Ten flips can miss a real bias.

That 5% rule is the **significance level**, written $$\alpha$$ ("alpha"). A result below it is called **statistically significant**. It's a chosen rule, not a natural boundary between truth and falsehood.

### The coin formula is the same counting, written shorter

The symbol $$\binom{10}{k}$$, read "10 choose k", counts ways to choose which $$k$$ flips are heads. For 8 heads, it is 45.

$$
P(X=k)=\frac{\binom{10}{k}}{2^{10}}
$$

Read it from left to right:

1. $$X$$ is the number of heads; $$k$$ is the count you're asking about.
2. $$P(X=k)$$ means "the probability of exactly k heads".
3. The top counts sequences with that many heads; the bottom counts all sequences.

So $$P(X=8)=45/1024$$. The p-value adds several bars:

$$
p=P(X\geq8)+P(X\leq2)
$$

The signs mean "8 or more" and "2 or fewer". That's the same 112/1024 calculation, with shorter labels. Try it below before moving on.

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
<h3 id="pv-coin-title">Try it: count the blue bars</h3>
<p>Start at 8 heads and leave the test on two-sided. Blue bars show 0, 1, 2, 8, 9 and 10 heads: all the results at least 3 heads away from 5. Add their probabilities to get the p-value below. The outlined bar is your result.</p>
<div class="pv-controls">
<label for="pv-heads">Heads in 10 flips: <output id="pv-heads-value" for="pv-heads">8</output><input id="pv-heads" type="range" min="0" max="10" step="1" value="8"></label>
<label for="pv-sided">What are you testing?<select id="pv-sided"><option value="two">Two-sided: coin is not fair</option><option value="upper">One-sided: coin favours heads</option></select></label>
</div>
<div class="pv-bars" id="pv-bars" role="group" aria-label="Choose the observed number of heads"></div>
<button id="pv-flip" type="button">Simulate 10 fair flips</button>
<p class="pv-result" id="pv-coin-result" role="status" aria-live="polite" aria-atomic="true"></p>
<ol><li>Click 5: every bar turns blue, and p = 1. Every result is at least as far from 5 as this one.</li><li>Click 9: only 0, 1, 9 and 10 count. The total falls to 22/1024, about 2.1%.</li><li>Return to 8, then choose one-sided. Only 8, 9 and 10 count, so the total halves to about 5.5%.</li><li>Simulate fair flips. The coin never becomes biased, even when its result looks unusual.</li></ol>
<p class="pv-note">The simulated coin is always fair. A small p-value can still happen. Choose one- or two-sided before collecting data, not whichever gives the smaller p-value afterwards. The one-sided test here always counts the upper tail, even when you observe fewer than 5 heads.</p>
</section>
<noscript><p>The static coin calculation above works without JavaScript. Enable JavaScript to explore other heads counts.</p></noscript>

<style>
.pv-build .build-flips { display:flex; gap:6px; flex-wrap:wrap; margin:16px 0; }
.pv-build .build-flips span { width:26px; height:30px; display:grid; place-items:center; border:1px solid var(--muted); border-radius:4px; color:var(--fg); }
.pv-build .build-flips .heads { background:var(--l0); color:var(--bg); }
.pv-build progress { width:100%; height:14px; accent-color:var(--l0); }
.pv-build .build-chart { display:grid; grid-template-columns:repeat(11,minmax(0,1fr)); gap:4px; margin:20px 0 8px; }
.pv-build .build-cell { text-align:center; font-size:12px; }
.pv-build .build-track { position:relative; height:160px; border-bottom:1px solid var(--muted); }
.pv-build .build-bar { position:absolute; bottom:0; width:100%; background:var(--l0); transition:height .15s; }
.pv-build .build-model { position:absolute; left:0; right:0; border-top:2px dashed var(--l3); z-index:1; }
.pv-build .build-count { display:block; font-size:11px; padding:6px 0; }
.pv-build button { margin:4px 4px 4px 0; }
</style>
<section class="pv-widget pv-build" id="pv-build" aria-labelledby="pv-build-title" hidden>
<h3 id="pv-build-title">Watch the distribution grow, one flip at a time</h3>
<p>One trial is <strong>10 fair flips</strong>. Watch H and T appear, then see one completed trial land in its heads-count bar. A single flip never goes straight into the histogram: the bar counts the result of a whole ten-flip trial.</p>
<div class="build-flips" id="build-flips" aria-label="Flips in the current trial"></div>
<label for="build-progress">Progress through this ten-flip trial <progress id="build-progress" max="10" value="0"></progress></label>
<button id="build-step" type="button">Flip once</button><button id="build-play" type="button">Play 100 trials</button><button id="build-pause" type="button" disabled>Pause</button><button id="build-reset" type="button">Reset</button>
<div id="build-chart" class="build-chart" role="img" aria-label="Empirical histogram of completed trials, with fair-coin model markers"></div>
<p class="pv-note">Blue bars: observed fraction of completed trials. Purple dashed marks: exact fair-coin probabilities. Both use the same fixed 0-100% height scale, so a first trial can make one bar reach 100%. Numbers under the bars are trial counts. Heads counts run from 0 to 10.</p>
<p class="pv-result" id="build-status" role="status" aria-live="polite" aria-atomic="true"></p>
<ol><li>Click "Flip once" ten times. The trial progress fills, then exactly one histogram bar gets its first count.</li><li>Press "Play 100 trials". Each ten-flip trial takes one second; the bars update after each completed trial. Pause to inspect a partial trial, then continue.</li><li>Compare the blue bars with the dashed model marks. With more trials they tend to look more alike, but the bars still wobble. A fair coin does not force a perfect match.</li><li>Reset to start a fresh run. Completed trials, the current flips and the progress all clear.</li></ol>
<p class="pv-note">Each flip is independent and uses 50% heads. This is a simulation, not measured coin data. More completed trials improve the histogram's picture of ten-flip results; they do not increase the number of flips inside each trial.</p>
</section>
<noscript><p>The static heads-count chart above is the exact distribution for ten fair flips. JavaScript adds a progressive simulation beside it.</p></noscript>
<script>
(function(){
  const root=document.getElementById('pv-build'); if(!root)return;
  const el=id=>document.getElementById(id), probabilities=[1,10,45,120,210,252,210,120,45,10,1].map(x=>x/1024);
  let counts=Array(11).fill(0), current=[], total=0, timer=null, target=0;
  const cells=probabilities.map((p,k)=>{const cell=document.createElement('div');cell.className='build-cell';const track=document.createElement('div');track.className='build-track';const bar=document.createElement('div');bar.className='build-bar';const mark=document.createElement('div');mark.className='build-model';mark.style.bottom=(p*100)+'%';track.append(bar,mark);const label=document.createElement('span');label.textContent=k;const count=document.createElement('span');count.className='build-count';cell.append(track,label,count);el('build-chart').append(cell);return {cell,bar,count};});
  function draw(announce){
    el('build-flips').replaceChildren(...Array.from({length:10},(_,i)=>{const s=document.createElement('span');s.textContent=current[i]||'·';if(current[i]==='H')s.className='heads';return s;}));
    el('build-progress').value=current.length;
    cells.forEach(({cell,bar,count},k)=>{let fraction=total?counts[k]/total:0;bar.style.height=(fraction*100)+'%';count.textContent=counts[k];cell.title=k+' heads: '+counts[k]+' trials, '+(fraction*100).toFixed(1)+'%; model '+(probabilities[k]*100).toFixed(1)+'%';});
    const desc=cells.map((_,k)=>k+' heads: '+counts[k]+' trials').join('; ');el('build-chart').setAttribute('aria-label','Completed trials: '+total+'. '+desc+'. Dashed marks show the exact fair-coin distribution.');
    if(announce)el('build-status').textContent='Completed trials: '+total+'. Total flips: '+(total*10+(current.length===10?0:current.length))+'. Current trial: '+current.length+'/10 flips, '+current.filter(x=>x==='H').length+' heads. '+(timer?'Playing toward '+target+' completed trials.':'Paused.');
  }
  function stop(){if(timer)clearInterval(timer);timer=null;el('build-play').disabled=false;el('build-step').disabled=false;el('build-pause').disabled=true;draw(true);}
  function flip(){if(current.length===10)current=[];current.push(Math.random()<.5?'H':'T');if(current.length===10){counts[current.filter(x=>x==='H').length]++;total++;}draw(!timer||current.length===10);if(timer&&total>=target)stop();}
  el('build-step').addEventListener('click',flip);
  el('build-play').addEventListener('click',()=>{target=total+100;el('build-play').disabled=true;el('build-step').disabled=true;el('build-pause').disabled=false;timer=setInterval(flip,100);draw(true);});
  el('build-pause').addEventListener('click',stop);
  el('build-reset').addEventListener('click',()=>{stop();counts=Array(11).fill(0);current=[];total=0;target=0;draw(true);});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&timer)stop();});
  draw(true);root.hidden=false;
})();
</script>

## Read the general p-value formula

The coin teaches a question we can reuse: **if the null claim were true, how often would we see a result at least this unusual?**

**Step 1: choose a score.** For the coin, it's distance from 5 heads. For the button, it'll be the difference between two rates, measured relative to its usual random wobble. This score is called a **test statistic**.

**Step 2: imagine repeated experiments under the null.** How often would that score be as far out as the one we observed? That fraction is the p-value:

$$
p=P\big(\text{at least as extreme a result}\mid H_0\big)
$$

$$P$$ means probability. The vertical bar means **"assuming"**. $$H_0$$ is the null claim. "Extreme" means far out according to the score and direction chosen for this test.

**Step 3: keep the question's direction straight.** We start by assuming $$H_0$$. The answer therefore cannot be "the probability that $$H_0$$ is true". A p-value of 0.03 means results this far out occur 3% of the time under that assumption. It does not mean a 3% chance of no effect, a 3% chance this result is luck, or a 97% chance your change works.

Think of a smoke alarm. "How often does it ring when there's no fire?" differs from "now that it rang, how likely is a fire?" A p-value asks in the first direction.

## Two ways the decision can go wrong

A rule can make mistakes even when the calculation is correct.

**Step 1: imagine no real effect.** Random data sometimes look unusual enough to pass the rule. We declare a difference that isn't there: a **false positive**, or **Type I error**.

**Step 2: imagine a real effect.** Random data sometimes hide it. We don't pass the rule even though a difference exists: a **false negative**, or **Type II error**.

**Step 3: name the chances.** Alpha limits false positives for a valid test. Beta, $$\beta$$, is the false-negative probability for a particular true effect. **Power** is the chance of detecting that effect:

$$
\text{power}=1-\beta
$$

If beta is 0.20, power is 0.80: the test finds that effect in about 80 out of 100 repetitions. Power depends on the effect size, sample size and rule. There isn't one power number for "any real effect".

A 5% alpha gives a 5% false-positive rate for an exactly calibrated continuous test. Valid discrete tests, like our coin count, may be more conservative. Approximate tests only meet the target approximately. Alpha is not the fraction of significant findings that are wrong.


<figure class="fig learn-fig">
<svg viewBox="0 0 420 460" role="img" aria-labelledby="pv-errors-t pv-errors-d">
<title id="pv-errors-t">Four combinations of reality and test decision</title>
<desc id="pv-errors-d">No effect plus reject is a false positive. Real effect plus do not reject is a false negative. The other two combinations are correct decisions.</desc>
<text x="14" y="25" class="" text-anchor="start">Reality and your decision are different</text><rect x="12" y="47" width="396" height="86" rx="5" fill="var(--l0)" fill-opacity="0.09" stroke="var(--line)"/><text x="26" y="70" class="" text-anchor="start">No real effect</text><text x="26" y="94" class="sub" text-anchor="start">Do not reject null</text><text x="26" y="118" class="accent" text-anchor="start">Correct restraint</text><rect x="12" y="147" width="396" height="86" rx="5" fill="var(--l3)" fill-opacity="0.09" stroke="var(--line)"/><text x="26" y="170" class="" text-anchor="start">No real effect</text><text x="26" y="194" class="sub" text-anchor="start">Reject null</text><text x="26" y="218" class="warm" text-anchor="start">False positive (Type I)</text><rect x="12" y="247" width="396" height="86" rx="5" fill="var(--l3)" fill-opacity="0.09" stroke="var(--line)"/><text x="26" y="270" class="" text-anchor="start">Real effect</text><text x="26" y="294" class="sub" text-anchor="start">Do not reject null</text><text x="26" y="318" class="warm" text-anchor="start">False negative (Type II)</text><rect x="12" y="347" width="396" height="86" rx="5" fill="var(--l0)" fill-opacity="0.09" stroke="var(--line)"/><text x="26" y="370" class="" text-anchor="start">Real effect</text><text x="26" y="394" class="sub" text-anchor="start">Reject null</text><text x="26" y="418" class="accent" text-anchor="start">Detect effect: power</text>
</svg>
<figcaption>A test makes a decision from noisy data; it does not reveal reality. Alpha concerns false positives under the null. Power concerns detection for a specified real effect.</figcaption>
</figure>

## From coin flips to the button

The idea stays the same. The calculation changes because this experiment has many more possible outcomes.

**Step 1: define the experiment.** Randomly assign independent users to the old button (A) or new button (B). Each user either converts or doesn't. Each group, also called an *arm*, has 10,000 users.

| Group | Users | Conversions | Rate |
|---|---:|---:|---:|
| A: old button | 10,000 | 1,000 | 10.0% |
| B: new button | 10,000 | 1,080 | 10.8% |

The observed difference is **+0.8 percentage points**, or 0.008 as a decimal. That's an 8% *relative* increase over 10%, not a 0.8% relative increase.

**Step 2: write the claims.** $$H_0$$: the true conversion rates are equal. $$H_1$$, the *alternative hypothesis*: the true rates differ. We'll use a two-sided test and choose $$\alpha=0.05$$ before collecting data.

**Step 3: estimate random wobble.** Even equally good buttons won't give identical sample rates. The **standard error** estimates the typical sample-to-sample wobble in their difference. More independent users usually make it smaller.

**Step 4: compare our difference with that wobble.** Many tests have this shape:

$$
T=\frac{d-d_0}{SE}
$$

Here T is the score, d is the observed difference, and d with a small 0 is the difference predicted by the null. SE is standard error. The top is the gap we're explaining; the bottom is its estimated random wobble. A score of 2 means two standard errors from what the null predicts, not "twice as likely to work".

**Step 5: find the p-value.** Use the scores expected under the null, just as we used the coin bars. For these large independent groups, a **two-proportion z-test** uses a bell curve as an approximation. Let's calculate it one piece at a time.

### The button formulas, without skipping the meanings

**1. Estimate the shared rate under the null.** Combine the groups: 2,080 conversions out of 20,000 users.

$$
\hat p=\frac{1000+1080}{10000+10000}=0.104
$$

The hat means "estimated from data". Here $$\hat p$$ is a conversion rate of 10.4%, **not the p-value**. The same letter is doing two different jobs.

**2. Calculate the standard error.** For this test:

$$
SE=\sqrt{\hat p(1-\hat p)\left(\frac{1}{n_A}+\frac{1}{n_B}\right)}
$$

$$n_A$$ and $$n_B$$ count users. The square root turns variance, a squared measure of wobble, back into rate-difference units. Larger samples make the fractions smaller.

With our numbers:

$$
SE=\sqrt{0.104\times0.896\times\frac{2}{10000}}\approx0.00432
$$

One standard error is about **0.432 percentage points**.

**3. Divide the gap by that error.** The null difference is zero:

$$
z=\frac{\hat p_B-\hat p_A}{SE}=\frac{0.108-0.100}{0.00432}\approx1.85
$$

$$z$$ is the test statistic. Our +0.8-point gap is about 1.85 standard errors above zero.

**4. Count both far ends of the bell curve.** Under the null and this large-sample approximation, z-scores follow a *standard normal* curve: centred on 0, with standard deviation 1. Scores near the middle are common; large positive or negative scores aren't.

$$
p=2\big(1-\Phi(\lvert z\rvert)\big)\approx0.064
$$

Read it in pieces:

- $$\lvert z\rvert$$ is the size of z without its sign: 1.85 here.
- $$\Phi(1.85)$$ ("Phi") is the fraction of the curve left of 1.85, about 0.968.
- $$1-\Phi(1.85)$$ is the right tail, about 0.032.
- Multiply by 2 for the equally far left tail: about 0.064, or **6.4%**.

Unlike the exact coin count, this is approximate. Using the unrounded z gives about 0.0639.

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

**5. Read only what the answer says.** If the buttons perform equally, a difference at least this far from zero occurs about 6.4% of the time under the model. That's above our 5% rule: **not significant**. We haven't established improvement, but we haven't established equality either.

The dashed lines are at about -1.96 and +1.96. The area outside them totals 5%. That's where 1.96 comes from: the bell-curve cut-off for this two-sided 5% test. A p-value of 0.049 and one of 0.051 are almost the same evidence, even though the rule labels them differently.

## More data, same effect

**Step 1: keep the rates unchanged.** Imagine a separate, larger experiment with 20,000 users per group. It happens to produce the same 10.0% and 10.8% rates. The lift is still +0.8 points.

**Step 2: shrink the wobble.** With equal-sized groups, standard error scales approximately as $$1/\sqrt n$$. Doubling n divides the error by $$\sqrt2$$, about 1.41, not by 2.

$$
SE\approx0.00305,\qquad z\approx2.62,\qquad p\approx0.0088
$$

**Step 3: notice what changed.** The p-value is now below 0.05. The effect stayed the same; the estimate became more precise. A p-value measures neither the size nor the business value of an improvement.

This compares sample sizes. It is not permission to extend a finished test until it passes. Choose the sample size or a valid sequential stopping rule in advance.

## Power: plan how often you'll find a real lift

**Step 1: pick an effect worth finding.** Suppose +0.8 points would be worth shipping. Ask: *if that really is the lift, how often would our experiment detect it?*

**Step 2: imagine many repetitions.** With 10,000 users per group and alpha 5%, the normal approximation gives about **46% power** for that lift. More than half of these experiments would miss it. At 20,000 per group, power is about **75%**.

**Step 3: use the playground before the formula.** Change only the number of users first. Narrower curves mean less wobble. More of the pink curve lies outside the cut-offs, so more experiments detect the effect.

<section class="pv-widget" id="pv-power" aria-labelledby="pv-power-title" hidden>
<h3 id="pv-power-title">Try it: same effect, more data</h3>
<p>Imagine repeating the experiment many times. The horizontal axis is measured lift, in percentage points. Blue shows the spread when the buttons truly perform equally. Pink shows the spread for your chosen true lift. Taller parts mean more common results; each curve has total area 1. Outside the dashed lines, a result is called significant. The pink area outside those lines is power.</p>
<div class="pv-controls">
<label for="pv-baseline">Control rate: <output id="pv-baseline-value" for="pv-baseline">10.0%</output><input id="pv-baseline" type="range" min="5" max="50" step="1" value="10"></label>
<label for="pv-lift">True lift: <output id="pv-lift-value" for="pv-lift">0.8 percentage points</output><input id="pv-lift" type="range" min="-3" max="3" step="0.1" value="0.8"></label>
<label for="pv-n">Users per arm: <output id="pv-n-value" for="pv-n">10,000</output><input id="pv-n" type="range" min="1000" max="50000" step="1000" value="10000"></label>
<label for="pv-alpha">False-alarm limit (alpha)<select id="pv-alpha"><option value="0.01">1%</option><option value="0.05" selected>5%</option><option value="0.10">10%</option></select></label>
</div>
<svg id="pv-power-chart" viewBox="0 0 680 260" role="img" aria-labelledby="pv-power-chart-title pv-power-chart-desc"><title id="pv-power-chart-title">Sampling distributions of the conversion-rate difference</title><desc id="pv-power-chart-desc"></desc></svg>
<div class="pv-legend"><span class="pv-null">Blue: null (no effect)</span><span class="pv-alt">Pink: chosen true effect</span><span>Dashed: rejection cut-offs</span></div>
<p class="pv-result" id="pv-power-result" role="status" aria-live="polite" aria-atomic="true"></p>
<ol><li>Leave the defaults: 10% control, +0.8-point true lift, 10,000 users per arm, alpha 5%. Power is about 46%.</li><li>Move users per arm to 20,000. The curves narrow; power rises to about 75%. The true lift has not changed.</li><li>Set true lift to 0. Pink and blue overlap. The shaded area is about 5%: false positives with no effect.</li><li>Restore the +0.8-point lift, then change alpha to 1%. The cut-offs move outward: fewer false alarms, but less power for the same effect.</li></ol>
<p class="pv-note">This is a two-sided, fixed-sample normal approximation for independent users and equal-sized arms. The curves describe repeated experiments, not a probability that the null is true. The example p-value assumes observed rates equal the chosen true rates; real samples fluctuate. Power is a planning quantity, not a reinterpretation of an observed p-value. Everything runs in your browser.</p>
</section>
<noscript><p>Without JavaScript, the worked example above still shows why doubling the sample size changes the p-value without changing the effect.</p></noscript>

### The sample-size formula answers that planning question

For 80% power to find a true change from 10.0% to 10.8%, a useful normal-approximation planning formula for equal-sized independent groups is:

$$
n\approx\frac{(z_{1-\alpha/2}+z_{1-\beta})^2[p_A(1-p_A)+p_B(1-p_B)]}{(p_B-p_A)^2}
$$

Don't read the whole line at once:

1. $$n$$ is users **per group**. $$p_A$$ and $$p_B$$ are the true rates we're planning around, not estimates from a completed test.
2. $$\alpha=0.05$$ sets the false-alarm limit. Its two-sided normal cut-off, $$z_{1-\alpha/2}$$, is about **1.96**.
3. For 80% power, $$\beta=0.20$$. The normal cut-off $$z_{1-\beta}$$ is about **0.84**. The two cut-offs account for avoiding false alarms and catching the chosen effect.
4. The bracket measures outcome variability. The bottom is the effect squared: a smaller effect is harder to find and needs more users.

With rounded values:

$$
n\approx\frac{(1.96+0.84)^2\times(0.090+0.096)}{0.008^2}\approx22{,}800
$$

That's roughly **23,000 users per group**, not total. It's an approximation, not a promise. Try 23,000 in the widget: power is close to 80%. Different planning methods can give slightly different requirements.

Power is a *before-the-experiment* calculation for a chosen true effect. Don't turn the observed lift into "observed power" and use it as new evidence. After testing, read the estimate and its uncertainty.

## Confidence intervals: how big could the effect be?

**Step 1: keep the estimate.** Our original test estimated +0.80 points. A p-value alone hides that size.

**Step 2: add uncertainty.** An approximate 95% confidence interval runs from **-0.05 to +1.65 percentage points**. It includes zero, but also useful improvements. "Not significant" doesn't mean "no effect".

**Step 3: understand the 95%.** If we repeated the sampling and interval procedure many times, about 95% of the intervals would contain the true difference under the model's assumptions. It isn't a 95% probability assigned to this particular fixed interval.

The formula is "estimate plus or minus a margin":

$$
\text{interval}=(\hat p_B-\hat p_A)\pm1.96\times SE_{\text{unpooled}}
$$

$$\pm$$ means compute both ends: subtract the margin, then add it. For the interval, we estimate each group's variability separately rather than imposing equal true rates:

$$
SE_{\text{unpooled}}=\sqrt{\frac{\hat p_A(1-\hat p_A)}{n_A}+\frac{\hat p_B(1-\hat p_B)}{n_B}}
$$

Here the error is about 0.00432. The margin is about 0.00846, or 0.846 points. Add and subtract from +0.80 to get the interval. Its inclusion of zero agrees with the test here; this unpooled interval and pooled test aren't exactly identical procedures in every case.

**Step 4: ask whether the lift is useful.** With enough data, a tiny effect can be significant. This chart compares our test with a larger one whose lift is only +0.1 points:

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

Before testing, choose the smallest gain worth the cost of changing the product. Consider the estimate and interval against that threshold, not only against zero. **Statistically significant doesn't mean practically important.**

## Choose a test without memorising a menu

**Step 1: identify one observation.** One independent user? The same person measured twice? A household or team? The sampling design affects the calculation.

**Step 2: identify the measurement.** A yes/no outcome, like conversion, gives a rate. Revenue or time gives a number with an average. Match the method to your question.

| Situation | Starting point | What to check |
|---|---|---|
| Two independent conversion rates | Two-proportion z-test | Enough successes and failures; sparse counts may need an exact method |
| Two independent averages | Welch's t-test | Independence, sample sizes and outliers |
| Same people measured twice | Paired t-test | Analyse within-person differences |
| Two independent sets of ranks | Mann-Whitney U test | Compares distributions/ranks, not automatically medians |
| Three or more averages | ANOVA or an appropriate alternative | Assumptions and adjusted follow-up comparisons |
| Randomised labels you can shuffle | Permutation test | Labels must be exchangeable under the null; preserve the design |

These are starting points, not automatic answers. Repeated users, clustered assignment or unusual data can need a different analysis.

**Step 3: recognise the familiar shape.** For two independent means, Welch's statistic is:

$$
t=\frac{\bar x_B-\bar x_A}{\sqrt{s_A^2/n_A+s_B^2/n_B}}
$$

$$\bar x_A$$ and $$\bar x_B$$ are sample averages. $$s_A^2$$ and $$s_B^2$$ are sample variances, measuring how spread out observations are. Again: difference on top, estimated wobble below.

Compare the score with a **t-distribution**, a bell-shaped curve with heavier tails than the normal curve at small degrees of freedom. Welch's method estimates those degrees of freedom and doesn't require equal variances. Its reference distribution is an approximation under suitable assumptions, not a universal cure for difficult data.

**Step 4: let software do the arithmetic.** You still choose the question and check assumptions. This uses our button counts and, separately, arrays of revenue observations:

```python
from scipy import stats
from statsmodels.stats.proportion import proportions_ztest

z, p = proportions_ztest(count=[1080, 1000], nobs=[10000, 10000])
print(f"z = {z:.2f}, p = {p:.3f}")  # z = 1.85, p = 0.064

# One revenue value per independent user in each array.
t, p = stats.ttest_ind(revenue_b, revenue_a, equal_var=False)
```

## A permutation test: build the no-effect world yourself

The coin let us count every outcome. For a randomised button experiment, we can instead shuffle group labels to build a reference distribution.

**Step 1: keep the outcomes.** We have 2,080 conversions and 17,920 non-conversions. Write each conversion as 1 and each non-conversion as 0.

**Step 2: shuffle group labels.** Under a null that makes outcomes exchangeable across the randomly assigned groups, allocate them into two groups of 10,000 again. Change only the group labels, not who converted.

**Step 3: measure the fake difference.** Subtract the shuffled rates. Repeat many times to see what random assignment alone could produce under this null.

**Step 4: count differences at least as far from zero as +0.008.** Include equally large negative differences for a two-sided test. The fraction is a simulated p-value, close to the z-test here.


<figure class="fig learn-fig">
<svg viewBox="0 0 420 443" role="img" aria-labelledby="pv-shuffle-t pv-shuffle-d">
<title id="pv-shuffle-t">Permutation keeps the data and changes group labels</title>
<desc id="pv-shuffle-d">The pooled 20,000 conversion outcomes stay fixed. Each shuffle assigns 10,000 outcomes to each group, calculates a new difference and counts absolute differences at least 0.008.</desc>
<text x="14" y="25" class="" text-anchor="start">Shuffle labels, not the outcomes</text><rect x="12" y="47" width="396" height="74" rx="5" fill="var(--panel)" fill-opacity="1" stroke="var(--line)"/><text x="26" y="75" class="" text-anchor="start">Keep all 20,000 outcomes</text><text x="26" y="100" class="sub" text-anchor="start">2,080 ones + 17,920 zeros</text><path d="M210,121 v17" class="axis"/><rect x="12" y="143" width="396" height="74" rx="5" fill="var(--panel)" fill-opacity="1" stroke="var(--line)"/><text x="26" y="171" class="" text-anchor="start">Randomly split into two groups</text><text x="26" y="196" class="sub" text-anchor="start">10,000 in A; 10,000 in B</text><path d="M210,217 v17" class="axis"/><rect x="12" y="239" width="396" height="74" rx="5" fill="var(--panel)" fill-opacity="1" stroke="var(--line)"/><text x="26" y="267" class="" text-anchor="start">Record shuffled B rate − A rate</text><text x="26" y="292" class="sub" text-anchor="start">Repeat to build the null distribution</text><path d="M210,313 v17" class="axis"/><rect x="12" y="335" width="396" height="74" rx="5" fill="var(--panel)" fill-opacity="1" stroke="var(--line)"/><text x="26" y="363" class="" text-anchor="start">Count |difference| ≥ 0.008</text><text x="26" y="388" class="sub" text-anchor="start">Both negative and positive tails</text>
</svg>
<figcaption>The observed conversions do not change. What changes is their allocation to A or B under an exchangeable no-effect model. The resulting distribution shows how much assignment alone can move the difference.</figcaption>
</figure>

```python
import numpy as np

rng = np.random.default_rng(0)
control = np.r_[np.ones(1000), np.zeros(9000)]
variant = np.r_[np.ones(1080), np.zeros(8920)]
observed = variant.mean() - control.mean()  # 0.008
pooled = np.concatenate([control, variant])

extreme = 0
repetitions = 10_000
for _ in range(repetitions):
    rng.shuffle(pooled)
    difference = pooled[10_000:].mean() - pooled[:10_000].mean()
    extreme += abs(difference) >= abs(observed) - 1e-12

p = (extreme + 1) / (repetitions + 1)
print(p)  # Around 0.06; simulations fluctuate.
```

The tiny tolerance handles floating-point rounding at the boundary. The +1 adjustment includes the observed arrangement and avoids reporting zero just because a finite simulation saw no extreme result.

This is the coin's *count then divide* idea again. Other tests needn't be equivalent to this particular shuffle: the null and shuffling scheme must fit the experiment. Paired or clustered designs can't be shuffled as if everyone were unrelated.

## Where significance misleads

### 1. More questions mean more chances for false alarms

Imagine testing 20 metrics when the button affects none of them. If each test has a 5% false-positive chance and the tests are independent:

**Step 1:** one test avoids a false positive with probability 0.95.

**Step 2:** all 20 avoid one with probability $$0.95^{20}$$, about 0.36.

**Step 3:** subtract from 1. The chance of at least one false positive is about 64%:

$$
P(\text{at least one false positive})=1-(1-\alpha)^m
$$

$$m$$ counts tests. Independence matters: correlated metrics needn't give this exact 64%, though searching many results still creates a multiple-testing problem.

For an exactly calibrated continuous test under the null, p-values are uniformly distributed: equal-width ranges from 0 to 1 are equally likely. So p below 0.05 can happen even when nothing changed. Our discrete coin test only produces certain p-values; they aren't uniformly distributed.

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

Choose a primary metric in advance. For claims across many tests, adjust the rule. **Bonferroni** uses $$\alpha/m$$ per test: 0.05/20 = 0.0025 here. It controls the chance of any false positive for valid tests without requiring independence. **Benjamini-Hochberg** instead controls the expected false-discovery proportion under its conditions. These answer different error-control questions.

### 2. Checking until you win changes the rule

**Step 1:** plan a fixed sample size and a 5% rule. The calibration assumes the planned analysis.

**Step 2:** check daily and stop as soon as p drops below 0.05. You've given random noise extra chances to pass. The overall false-positive rate is no longer that of a single planned look.

**Step 3:** keep the fixed analysis plan or use a sequential method designed for repeated monitoring. An ordinary fixed-sample p-value doesn't protect every stopping strategy.

### 3. Not finding an effect doesn't prove there isn't one

Return to the button: estimated +0.80 points, interval -0.05 to +1.65, p about 0.064. The data leave room for no improvement and for useful improvement.

Establishing that differences are smaller than a meaningful limit is a different question from testing equality. "Not significant" alone cannot establish that limit.

## Put it together

Read or run a test in this order:

1. **What claim are we checking?** Write null and alternative; choose one- or two-sided before looking.
2. **How big is the observed change?** Keep the units: +0.8 percentage points here.
3. **How much could it wobble?** Check the design, assumptions and standard error.
4. **How unusual is it under the null?** That's the p-value, not the probability the null is true.
5. **What rule did we plan?** Compare with alpha without changing the metric or stopping plan to get a win.
6. **What can we do with the result?** Read the confidence interval and business value. Plan the next test's power for an effect worth finding.

The coin widget makes the p-value visible: add the blue bars. The power widget makes sample size visible: narrow the curves. The formulas are shorter ways of describing those ideas, not a different story to learn from scratch.

## References

1. Wasserstein, R. L. and Lazar, N. A. *The ASA Statement on p-Values: Context, Process, and Purpose*. The American Statistician, 2016. <https://doi.org/10.1080/00031305.2016.1154108> - what p-values do and do not mean
2. Greenland, S. et al. *Statistical tests, P values, confidence intervals, and power: a guide to misinterpretations*. European Journal of Epidemiology, 2016. <https://doi.org/10.1007/s10654-016-0149-3> - common misreadings of p-values, intervals and power
3. Neyman, J. and Pearson, E. S. *On the problem of the most efficient tests of statistical hypotheses*. Philosophical Transactions of the Royal Society A, 1933. <https://doi.org/10.1098/rsta.1933.0009> - Type I and Type II errors
4. Fisher, R. A. *Statistical Methods for Research Workers*. Oliver and Boyd, 1925. <https://psychclassics.yorku.ca/Fisher/Methods/> - origin of the 0.05 convention
5. Welch, B. L. *The generalization of "Student's" problem when several different population variances are involved*. Biometrika, 1947. <https://doi.org/10.1093/biomet/34.1-2.28> - the unequal-variance t-test
6. statsmodels developers. *statsmodels.stats.proportion.proportions_ztest*. statsmodels documentation. <https://www.statsmodels.org/stable/generated/statsmodels.stats.proportion.proportions_ztest.html> - two-proportion z-test used in the code
7. SciPy developers. *scipy.stats.ttest_ind*. SciPy documentation. <https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.ttest_ind.html> - Welch's t-test via `equal_var=False`
8. Benjamini, Y. and Hochberg, Y. *Controlling the False Discovery Rate: A Practical and Powerful Approach to Multiple Testing*. Journal of the Royal Statistical Society: Series B, 1995. <https://doi.org/10.1111/j.2517-6161.1995.tb02031.x> - the Benjamini–Hochberg procedure
9. Johari, R. et al. *Peeking at A/B Tests*. Proceedings of KDD, 2017. <https://doi.org/10.1145/3097983.3097992> - why repeated looks inflate false positives
10. Kohavi, R., Tang, D. and Xu, Y. *Trustworthy Online Controlled Experiments*. Cambridge University Press, 2020. <https://doi.org/10.1017/9781108653985> - practical guide to A/B testing

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
