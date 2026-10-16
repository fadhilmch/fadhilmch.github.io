import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('header shows "Fadhilmch." with a muted "mch" and no subtitle',()=>{
 const h=read('_includes/header.html'),b=read('assets/css/base.css');
 assert.match(h,/<span class="brand__name">Fadhil<span class="brand__muted">mch<\/span>\.<\/span>/);
 assert.doesNotMatch(h,/brand__meta/);
 assert.match(b,/\.brand__name \{[^}]*font-size: 18px/);
 assert.match(b,/\.brand__muted \{ color: var\(--muted\)/);
 assert.doesNotMatch(b+read('assets/css/after-work-grid.css'),/brand__meta/);
});
test('footer is unchanged by the header name',()=>{
 const f=read('_includes/footer.html');assert.doesNotMatch(f,/brand__name/);
});
