import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import vm from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('gateway has exactly two active interests and bundled illustrative assets',()=>{
 const s=read('after-work/index.html');assert.equal((s.match(/<a /g)||[]).length,2);
 assert.match(s,/after-work\/coffee\//);assert.match(s,/after-work\/food\//);assert.doesNotMatch(s,/aw-laptop|desk-wrap/);
 for(const [,p] of s.matchAll(/include (after-work\/images\/[^ ]+)/g))assert.ok(existsSync(new URL('../_includes/'+p,import.meta.url)),p);
});
test('gateway uses the supplied camera, tennis ball and doodle stickers',()=>{
 const s=read('after-work/index.html');
 for(const n of ['camera','tennis-ball','sparkles','shooting-star','heart','squiggle','loop-arrow','sparkle'])assert.match(s,new RegExp('images/'+n+'\\.html'),n);
 assert.doesNotMatch(s,/headphones|plant|doodle\.html/);
 assert.equal(existsSync(new URL('../_includes/after-work/doodle.html',import.meta.url)),false);
 for(const f of ['coffee','food'])assert.match(read('after-work/'+f+'.html'),/doodle="(sparkle|squiggle)"/);
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
test('brew timer starts, completes, restarts and stops without duplicate intervals',()=>{
 let now=0,callback,active=false;
 const items=['0:00 Bloom','0:02 Finish'].map(text=>({textContent:text,classList:{values:new Set(),toggle(k,v){v?this.values.add(k):this.values.delete(k)}}}));
 const clock={textContent:''},button={textContent:'Start brew timer',addEventListener(e,fn){this.click=fn}};
 const box={hidden:true,querySelector:s=>s==='output'?clock:button};
 vm.runInNewContext(read('assets/js/after-work.js'),{document:{querySelector:s=>s==='[data-brew-timer]'?box:{children:items}},Date:{now:()=>now},setInterval:fn=>{callback=fn;active=true;return 1},clearInterval:()=>{active=false}});
 assert.equal(box.hidden,false);button.click();assert.equal(button.textContent,'Stop');assert.equal(clock.textContent,'0:00');assert.ok(items[0].classList.values.has('is-now'));
 now=2000;callback();assert.equal(active,false);assert.equal(clock.textContent,'0:02');assert.equal(button.textContent,'Restart brew timer');
 button.click();assert.equal(active,true);button.click();assert.equal(active,false);assert.equal(clock.textContent,'0:00');
});
test('non-timed or empty recipes never expose a non-working timer',()=>{
 const box={hidden:true};vm.runInNewContext(read('assets/js/after-work.js'),{document:{querySelector:s=>s==='[data-brew-timer]'?box:{children:[]}}});assert.equal(box.hidden,true);
});
