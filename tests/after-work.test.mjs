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
 for(const n of ['camera','tennis-ball','headphones','laptop','tablet','monstera','pothos','sparkles','shooting-star','loop-arrow','avatar-cutout','coffee-cutout','cooking-cutout'])assert.ok(ids.includes(n),n);
 assert.equal(layout().items.filter(i=>i.type==='deco'&&/sparkles|loop-arrow|shooting-star/.test(i.asset)).length,3);
 assert.equal(existsSync(new URL('../_includes/after-work/doodle.html',import.meta.url)),false);
 for(const f of ['coffee','food'])assert.doesNotMatch(read('after-work/'+f+'.html'),/doodle=/);
});
test('the laptop is the only decoration that is a control, and comes last for tab order',()=>{
 const items=layout().items;assert.equal(items[items.length-1].action,'terminal');
 assert.equal(items.filter(i=>i.action).length,1);
 const s=read('after-work/index.html');assert.match(s,/role="button" tabindex="0"/);assert.match(s,/type="module"/);
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
 go.click();assert.equal(go.textContent,'Pause');assert.equal(active,true);now=1000;callback();assert.equal(clock.textContent,'0:01');
 go.click();assert.equal(active,false);assert.equal(go.textContent,'Resume');
 go.click();now=2000;callback();now=3000;callback();assert.equal(active,false);assert.equal(clock.textContent,'0:02');assert.equal(go.textContent,'Again');
 reset.click();assert.equal(clock.textContent,'0:00');assert.equal(go.textContent,'Start');
});
test('non-timed or empty recipes never expose a non-working timer',()=>{
 const box={hidden:true};vm.runInNewContext(read('assets/js/after-work.js'),{document:{querySelector:s=>s==='[data-brew-timer]'?box:s==='[data-steps]'?{children:[]}:null}});assert.equal(box.hidden,true);
});
