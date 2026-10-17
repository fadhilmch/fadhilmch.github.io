import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import vm from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const layout=()=>JSON.parse(read('_data/after_work_layout.json'));
test('gateway has exactly two links, Coffee and Cooking, first in the markup',()=>{
 const items=layout().items,links=items.filter(i=>i.type==='link');
 assert.deepEqual(links.map(i=>i.href),['/after-work/coffee/','/after-work/food/']);
 assert.deepEqual(items.slice(0,2).map(i=>i.id),['coffee','cooking']);
 const s=read('after-work/index.html');assert.match(s,/layout\.items/);assert.doesNotMatch(s,/href="\/after-work\/(coffee|food)/);
 for(const i of items)assert.ok(existsSync(new URL('../_includes/after-work/images/'+i.asset+'.html',import.meta.url)),i.asset);
});
test('gateway uses the supplied stickers and a reduced set of doodles',()=>{
 const ids=layout().items.map(i=>i.asset);
 for(const n of ['camera','tennis-ball','headphones','laptop','tablet','monstera','pothos','sparkles','shooting-star','loop-arrow','avatar-cutout','coffee-pourover','cooking-cutout'])assert.ok(ids.includes(n),n);
 assert.equal(layout().items.filter(i=>i.type==='deco'&&/sparkles|loop-arrow|shooting-star/.test(i.asset)).length,4);
 for(const n of ['heart','sparkle','squiggle'])assert.ok(ids.includes(n),n);
 assert.equal(existsSync(new URL('../_includes/after-work/doodle.html',import.meta.url)),false);
 for(const f of ['coffee','food'])assert.doesNotMatch(read('after-work/'+f+'.html'),/doodle=/);
});
test('no decoration is a control and the gateway has no interactive stickers',()=>{
 const items=layout().items;assert.equal(items.filter(i=>i.action).length,0);
 const s=read('after-work/index.html');assert.doesNotMatch(s,/role="button"/);assert.match(s,/type="module"/);
});
test('category template is data-driven, with empty, missing-photo and draft states',()=>{
 const s=read('_includes/after-work/category.html');assert.match(s,/include.items \| sort/);assert.match(s,/Photo coming later/);assert.match(s,/Recipe coming later/);assert.match(s,/for r in items/);assert.match(s,/else %}<p class="aw-empty"/);assert.doesNotMatch(s,/coffee\.png|cooking\.png/);
 assert.match(read('after-work/food.html'),/permalink: \/after-work\/food\//);
});
test('image-led entries retain recipe/timer flow and hide unfinished recipes',()=>{
 const s=read('_layouts/recipe.html');assert.match(s,/page.photo/);assert.match(s,/page.photo_alt/);assert.match(s,/page.photo_credit/);assert.match(s,/page.status == 'draft'/);assert.match(s,/data-brew-timer/);assert.match(s,/page.steps/);assert.match(s,/page.ingredients/);assert.match(read('_includes/after-work/spec.html'),/r.dose_g > 0/);
});
test('scoped grid styles include reduced-motion and straight consistent image cards',()=>{
 const css=read('assets/css/after-work-grid.css');assert.match(css,/prefers-reduced-motion/);assert.match(css,/\.aw-card__photo[^{]+\{[^}]*aspect-ratio:3\/2/);assert.doesNotMatch(css,/\.aw-card__photo[^}]+rotate/);assert.match(read('_includes/head.html'),/page.nav == 'after-work'[^\n]+after-work-grid.css/);
});
test('brew stopwatch starts, pauses, resumes, completes and resets without duplicate intervals',()=>{
 let now=0,callback,active=false;
 const items=['0:00 Bloom','0:02 Finish'].map(text=>({textContent:text,classList:{values:new Set(),toggle(k,v){v?this.values.add(k):this.values.delete(k)},contains(k){return this.values.has(k)}}}));
 const clock={textContent:''},go={textContent:'',attrs:{},addEventListener(e,fn){this.click=fn},setAttribute(k,v){this.attrs[k]=v}},reset={addEventListener(e,fn){this.click=fn}},bar={style:{}};
 const box={hidden:true,classList:{toggle(){},add(){},remove(){}},querySelector:s=>s==='output'?clock:s==='[data-timer-go]'?go:s==='[data-timer-reset]'?reset:bar};
 vm.runInNewContext(read('assets/js/after-work.js'),{document:{querySelector:s=>s==='[data-brew-timer]'?box:s==='[data-steps]'?{children:items}:null},Date:{now:()=>now},setInterval:fn=>{callback=fn;active=true;return 1},clearInterval:()=>{active=false}});
 assert.equal(box.hidden,false);assert.equal(go.textContent,'Start');
 go.click();assert.equal(go.textContent,'Pause');assert.equal(active,true);now=1000;callback();assert.equal(clock.innerHTML,'0:01 <small>of 0:02</small>');
 go.click();assert.equal(active,false);assert.equal(go.textContent,'Resume');
 go.click();now=2000;callback();now=3000;callback();assert.equal(active,false);assert.equal(clock.innerHTML,'0:02 <small>of 0:02</small>');assert.equal(go.textContent,'Again');
 reset.click();assert.equal(clock.innerHTML,'0:00 <small>of 0:02</small>');assert.equal(go.textContent,'Start');
});
test('approximate step tokens keep their tilde in chips and still drive the clock',()=>{
 const li={_t:'~0:30 Bloom',get textContent(){return this._t},set textContent(v){this._t=v},
  classList:{toggle(){},contains:()=>false},querySelector:()=>null,insertBefore(c){this.chip=c;this._t=c.textContent+this._t}};
 const stepList={children:[li]};
 const box={hidden:true,classList:{toggle(){},add(){},remove(){}},
  querySelector:()=>({textContent:'',addEventListener(){},setAttribute(){},style:{}})};
 const doc={querySelector:s=>s==='[data-steps]'?stepList:s==='[data-brew-timer]'?box:null,
  createElement:()=>({className:'',textContent:''}),createTextNode:t=>({t})};
 vm.runInNewContext(read('assets/js/after-work.js'),{document:doc,Date:{now:()=>0},setInterval:()=>1,clearInterval(){}});
 assert.match(li.chip.textContent,/^~0:30\s$/);
 assert.equal(li.textContent,'~0:30 Bloom');
});
test('brew timer labels the current step and marks step boundaries on the bar',()=>{
 let now=0,callback;
 const mkLi=text=>({_t:text,get textContent(){return this._t},set textContent(v){this._t=v},
  classList:{toggle(){},contains:()=>false},querySelector:()=>null,insertBefore(c){this._t=c.textContent+this._t}});
 const items=['0:00 Bloom: wet the grounds','0:30 Pour: add water'].map(mkLi);
 const clock={},stepEl={textContent:''},barWrap={style:{},children:[],appendChild(c){this.children.push(c)}},barI={style:{}};
 const go={textContent:'',addEventListener(e,fn){this.click=fn},setAttribute(){}},reset={addEventListener(){}};
 const box={hidden:true,classList:{toggle(){},add(){},remove(){}},getAttribute:k=>k==='data-brew-total'?'1:00':null,
  querySelector:s=>s==='output'?clock:s==='[data-timer-step]'?stepEl:s==='.brew-timer__bar'?barWrap:s==='.brew-timer__bar i'?barI:s==='[data-timer-go]'?go:reset};
 vm.runInNewContext(read('assets/js/after-work.js'),{document:{querySelector:s=>s==='[data-brew-timer]'?box:s==='[data-steps]'?{children:items}:null,createElement:()=>({style:{},className:'',textContent:''})},Date:{now:()=>now},setInterval:fn=>{callback=fn;return 1},clearInterval(){}});
 assert.equal(barWrap.children.length,1);assert.equal(barWrap.children[0].style.left,'50%');
 assert.equal(stepEl.textContent,'Step 1 \u00b7 Bloom');
 go.click();now=31000;callback();
 assert.equal(stepEl.textContent,'Step 2 \u00b7 Pour');
 now=61000;callback();
 assert.equal(stepEl.textContent,'Done');
});
test('a declared brew total extends the clock past the last timed step',()=>{
 let now=0,callback,active=false;
 const items=['~0:00 Bloom','~1:55 Press'].map(text=>({textContent:text,classList:{values:new Set(),toggle(k,v){v?this.values.add(k):this.values.delete(k)},contains(k){return this.values.has(k)}}}));
 const clock={textContent:''},go={textContent:'',attrs:{},addEventListener(e,fn){this.click=fn},setAttribute(k,v){this.attrs[k]=v}},reset={addEventListener(e,fn){this.click=fn}},bar={style:{}};
 const box={hidden:true,classList:{toggle(){},add(){},remove(){}},getAttribute:k=>k==='data-brew-total'?'2:30':null,
  querySelector:s=>s==='output'?clock:s==='[data-timer-go]'?go:s==='[data-timer-reset]'?reset:bar};
 vm.runInNewContext(read('assets/js/after-work.js'),{document:{querySelector:s=>s==='[data-brew-timer]'?box:s==='[data-steps]'?{children:items}:null},Date:{now:()=>now},setInterval:fn=>{callback=fn;active=true;return 1},clearInterval:()=>{active=false}});
 assert.equal(box.hidden,false);
 go.click();now=115000;callback();assert.equal(clock.innerHTML,'1:55 <small>of 2:30</small>');
 assert.equal(items[1].classList.contains('is-now'),true);assert.equal(items[1].classList.contains('is-done'),false);
 now=150000;callback();assert.equal(active,false);assert.equal(clock.innerHTML,'2:30 <small>of 2:30</small>');
 assert.equal(items[1].classList.contains('is-done'),true);assert.equal(go.textContent,'Again');
 reset.click();assert.equal(clock.innerHTML,'0:00 <small>of 2:30</small>');
});
test('non-timed or empty recipes never expose a non-working timer',()=>{
 const box={hidden:true};vm.runInNewContext(read('assets/js/after-work.js'),{document:{querySelector:s=>s==='[data-brew-timer]'?box:s==='[data-steps]'?{children:[]}:null}});assert.equal(box.hidden,true);
});

test('gateway title keeps a stable accent class and the header icon has open and closed shapes',()=>{
 assert.match(read('after-work/index.html'),/<span class="aw-accent[^"]*">work<\/span>/);
 assert.match(read('_includes/header.html'),/class="mt-open"[\s\S]*class="mt-shut"/);
});
test('sticker effects: entrance, shake and tilt are off for reduced motion and in edit mode, and never block links',()=>{
 const f=read('assets/js/after-work-fx.js'),g=read('assets/js/after-work-gateway.js');
 assert.match(g,/initFx\(stickers\)/);
 assert.match(f,/prefers-reduced-motion: reduce[\s\S]*aw-editing[\s\S]*return/);
 assert.match(f,/a\.aw-sticker[\s\S]*shake/);assert.doesNotMatch(f,/preventDefault|stopPropagation/);
 assert.match(f,/hover: hover/);
 const c=read('assets/css/after-work-grid.css');
 assert.match(c,/\.aw-stickers\.has-fx:not\(\.fx-ready\) \.aw-item \{ animation:aw-pop/);
 assert.match(f,/fx-ready/);
 assert.match(c,/\.aw-stickers\.has-fx \.aw-item\.is-shaking/);
});
test('the gateway shows no caption under the stickers',()=>{
 assert.doesNotMatch(read('after-work/index.html'),/aw-art-note|Illustrative stickers/);
});
test('doodle shapes exist for every placed doodle asset',()=>{
 const shapes=JSON.parse(read('assets/data/after-work-shapes.json'));
 for(const i of layout().items)assert.ok(shapes[i.asset],i.asset);
});

test('header: lamp button is roomy with a hover state, laptop pictures share one visible width, After work sets a dark theme-color',()=>{
 const b=read('assets/css/base.css'),m=read('assets/css/mode-toggle.css'),h=read('_includes/head.html');
 assert.match(b,/\.theme-toggle, \.mode-toggle \{[^}]*width: 44px; height: 44px/);
 assert.match(b,/\.theme-toggle:hover img \{ transform/);
 assert.match(m,/\.mt-img img \{[^}]*width:100%; height:auto/);
 assert.match(h,/theme-color" content="\{% if page\.nav == 'after-work' %\}#171e19/);
});
test('title words and arrow fade in once, only when motion is allowed',()=>{
 const s=read('after-work/index.html'),c=read('assets/css/after-work-grid.css');
 for(const k of['aw-w1','aw-w2','aw-w3'])assert.match(s,new RegExp(k));
 assert.match(s,/aw-w3" aria-hidden="true">↙/);
 assert.match(c,/@media \(prefers-reduced-motion:no-preference\) \{[^@]*aw-w3[^@]*animation:aw-title-in/);
 assert.doesNotMatch(c,/aw-title-in[^;]*infinite/);
});
test('food recipe pages get mobile-only tabs with plain labels and counts inside panels',()=>{
 const s=read('_layouts/recipe.html');
 assert.match(s,/data-recipe-tabs/);assert.match(s,/role="tablist"/);
 assert.match(s,/>Ingredients</);assert.match(s,/>Method</);
 assert.doesNotMatch(s,/recipe__tab[^>]*>[^<]*\d+ of \d+</);
 assert.match(s,/data-ing-count/);
 assert.match(s,/aria-controls="panel-ing"/);assert.match(s,/aria-controls="panel-method"/);
 const c=read('assets/css/after-work-grid.css');
 assert.match(c,/\.recipe--food \.recipe__tabs:not\(\[hidden\]\)/);
 assert.match(c,/\.is-panel-off/);assert.match(c,/\.has-tabs \.recipe__panelhead h2/);
});
test('recipe tabs switch panels and rove with arrow keys',()=>{
 const mkBtn=controls=>({controls,attrs:{},tabIndex:0,
  classList:{v:new Set(),toggle(k,on){on?this.v.add(k):this.v.delete(k)},contains(k){return this.v.has(k)}},
  setAttribute(k,val){this.attrs[k]=val},getAttribute(k){return k==='aria-controls'?this.controls:null},
  addEventListener(e,fn){(this.ev=this.ev||{})[e]=fn},focus(){this.focused=true}});
 const b1=mkBtn('panel-ing'),b2=mkBtn('panel-method');
 const mkPanel=()=>({classList:{v:new Set(),toggle(k,on){on?this.v.add(k):this.v.delete(k)},contains(k){return this.v.has(k)}}});
 const p1=mkPanel(),p2=mkPanel();
 const tabbar={hidden:true,querySelectorAll:()=>[b1,b2],closest:()=>null};
 const doc={querySelector:s=>s==='[data-recipe-tabs]'?tabbar:null,getElementById:id=>id==='panel-ing'?p1:p2};
 vm.runInNewContext(read('assets/js/after-work.js'),{document:doc});
 assert.equal(tabbar.hidden,false);
 assert.equal(b1.attrs['aria-selected'],'true');
 assert.equal(p2.classList.contains('is-panel-off'),true);
 assert.equal(p1.classList.contains('is-panel-off'),false);
 b2.ev.click();
 assert.equal(b2.attrs['aria-selected'],'true');
 assert.equal(p1.classList.contains('is-panel-off'),true);
 b1.ev.keydown({key:'ArrowRight',preventDefault(){}});
 assert.equal(b2.attrs['aria-selected'],'true');
 assert.equal(b2.focused,true);
});
test('ingredient checklist keeps a running count',()=>{
 const boxes=[{checked:true},{checked:false},{checked:false}].map(b=>({...b,addEventListener(e,fn){this.change=fn}}));
 const ingCount={hidden:true,textContent:''};
 const checklist={querySelectorAll:()=>boxes};
 const doc={querySelector:s=>s==='[data-checklist]'?checklist:s==='[data-ing-count]'?ingCount:null};
 vm.runInNewContext(read('assets/js/after-work.js'),{document:doc});
 assert.equal(ingCount.hidden,false);
 assert.equal(ingCount.textContent,'1 of 3');
 boxes[1].checked=true;boxes[1].change();
 assert.equal(ingCount.textContent,'2 of 3');
});
test('step time tokens become chips while the step text keeps its timing',()=>{
 const li={_t:'0:00 Bloom',get textContent(){return this._t},set textContent(v){this._t=v},
  classList:{toggle(){},contains:()=>false},querySelector:()=>null,insertBefore(c){this.chip=c;this._t=c.textContent+this._t}};
 const stepList={children:[li]};
 const box={hidden:true,classList:{toggle(){},add(){},remove(){}},
  querySelector:()=>({textContent:'',addEventListener(){},setAttribute(){},style:{}})};
 const doc={querySelector:s=>s==='[data-steps]'?stepList:s==='[data-brew-timer]'?box:null,
  createElement:()=>({className:'',textContent:''}),createTextNode:t=>({t})};
 vm.runInNewContext(read('assets/js/after-work.js'),{document:doc,Date:{now:()=>0},setInterval:()=>1,clearInterval(){}});
 assert.equal(li.chip.className,'steps__t');
 assert.match(li.chip.textContent,/^0:00\s$/);
 assert.equal(li.textContent,'0:00 Bloom');
});
test('recipe pages follow the lamp theme: charcoal dark, warm-paper light, Geist titles',()=>{
 const c=read('assets/css/after-work-grid.css');
 assert.match(c,/\[data-theme="light"\] body\.is-recipe-page/);
 assert.match(c,/\.recipe__head h1 \{ font-family:'Geist',sans-serif/);
 assert.match(read('_layouts/base.html'),/page\.layout == 'recipe' %\} is-recipe-page/);
});
test('dose stepper scales water stat and pours cumulatively, keeping times and temps',()=>{
 const mkBtn=()=>({type:'',className:'',_tc:'',innerHTML:'',hidden:false,attrs:{},children:[],
  get textContent(){return (this.innerHTML||this._tc||'').replace(/<[^>]+>/g,'')},
  set textContent(v){this._tc=v;this.innerHTML=''},
  setAttribute(k,v){this.attrs[k]=v},addEventListener(e,fn){this['on'+e]=fn},appendChild(c){this.children.push(c)}});
 const mkText=d=>({nodeType:3,data:d});
 const mkLi=text=>{const li={childNodes:[mkText(text)],
  get textContent(){return this.childNodes.map(n=>n.nodeType===3?n.data:n.textContent).join('')},
  set textContent(v){this.childNodes=[mkText(v)]},
  get firstChild(){return this.childNodes[0]},
  insertBefore(c){this.childNodes.unshift(c)},
  appendChild(c){this.childNodes.push(c)},
  removeChild(c){this.childNodes=this.childNodes.filter(n=>n!==c)},
  classList:{toggle(){},contains:()=>false},querySelector:()=>null,setAttribute(){},addEventListener(){}};return li;};
 const lis=['0:00 Bloom: pour 60ml of 80°C water over the grounds, stir gently, then wait until 0:30.',
  '0:30 Main pour: slowly add 180ml of 80°C water in a gentle spiral to reach 240ml total.'].map(mkLi);
 const stepList={children:lis};
 const statsDl={nextSibling:null,parentNode:{insertBefore(c){this.row=c}}};
 const doseDd={attrs:{'data-dose':'12'},children:[],classList:{add(){}},innerHTML:'12<small>g</small>',
  getAttribute(k){return this.attrs[k]},setAttribute(){},
  appendChild(c){this.children.push(c)},
  set textContent(v){this.children=[]},get textContent(){return this.children.map(c=>c.textContent).join('')},
  closest:s=>s==='dl.stats'?statsDl:null,
  parentNode:{appendChild(c){this.note=c}}};
 const waterDd={innerHTML:'240<small>g</small>',getAttribute(){return '240'}};
 waterDd.getAttribute=k=>k==='data-water'?'240':null;
 const box={hidden:true,classList:{toggle(){},add(){},remove(){}},
  querySelector:()=>({textContent:'',addEventListener(){},setAttribute(){},style:{}}),
  getAttribute:()=>null};
 const doc={querySelector:s=>s==='[data-steps]'?stepList:s==='[data-brew-timer]'?box:s==='[data-dose]'?doseDd:s==='[data-water]'?waterDd:null,
  createElement:()=>mkBtn(),createTextNode:t=>mkText(t)};
 vm.runInNewContext(read('assets/js/after-work.js'),{document:doc,Date:{now:()=>0},setInterval:()=>1,clearInterval(){}});
 const row=statsDl.parentNode.row;
 assert.ok(row,'dose controls live in their own row after the stats list');
 const label=row.children[0],minus=row.children[1],out=row.children[2],plus=row.children[3],resetBtn=row.children[4];
 assert.equal(label.textContent,'Adjust dose');
 assert.equal(doseDd.children.length,0,'Coffee stat cell keeps plain text, no controls inside');
 const stepText=i=>lis[i].childNodes.filter(n=>n.nodeType===3).map(n=>n.data).join('');
 assert.match(out.textContent,/12/);
 assert.match(doseDd.innerHTML,/12<small>g<\/small>/);
 assert.equal(resetBtn.hidden,true);
 // +3g to 15g: k=1.25, water 300, pours 75 + 225 -> 300 total, temps untouched
 plus.onclick();plus.onclick();plus.onclick();
 assert.match(out.textContent,/15/);
 assert.match(doseDd.innerHTML,/15<small>g<\/small>/);
 assert.match(waterDd.innerHTML,/300<small>g<\/small>/);
 assert.match(stepText(0),/pour 75ml of 80°C/);
 assert.match(stepText(1),/add 225ml of 80°C water/);
 assert.match(stepText(1),/reach 300ml total/);
 assert.equal(resetBtn.hidden,false);
 // reset returns every number to the recipe default
 resetBtn.onclick();
 assert.match(doseDd.innerHTML,/12<small>g<\/small>/);
 assert.match(stepText(0),/pour 60ml of 80°C/);
 assert.match(stepText(1),/add 180ml of 80°C water/);
 assert.match(stepText(1),/reach 240ml total/);
 assert.match(waterDd.innerHTML,/240<small>g<\/small>/);
 assert.equal(resetBtn.hidden,true);
 // minus never drops the dose below 5g
 for(let i=0;i<20;i++)minus.onclick();
 assert.match(out.textContent,/5/);
});
