import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('After Work pages render the contained header navbar with icons',()=>{
 const header=read('_includes/header.html');
 assert.match(header,/\{%- if page\.nav == 'after-work' -%\}[\s\S]*?primary-nav aw-nav[\s\S]*?\{%- endif -%\}/);
 for(const u of ["/after-work/","/after-work/coffee/","/after-work/food/"])assert.ok(header.includes(u),u);
 for(const ic of ['aw-icon-space.png','aw-icon-coffee.png','aw-icon-cooking.png'])assert.ok(header.includes(ic),ic);
 assert.match(header,/aw_nav_home[\s\S]*page\.url == '\/after-work\/'/);
 assert.match(header,/page\.section == 'coffee' or page\.kind == 'coffee'/);
 assert.match(header,/page\.section == 'food' or page\.kind == 'food'/);
});

test('aw-nav styles keep the main-page pill with a transparent active highlight',()=>{
 const css=read('assets/css/after-work-grid.css');
 assert.match(css,/body\.is-after-work \.aw-nav a \{ display: flex; align-items: center; gap: 7px; \}/);
 assert.match(css,/\.aw-nav a img \{ width: 19px; height: 19px/);
 assert.match(css,/\.aw-nav a\[aria-current="page"\][\s\S]*?color-mix\(in oklab, var\(--fg\) 10%, transparent\)/);
 assert.match(css,/html\[data-depth="soft"\] body\.is-after-work \.aw-nav \{ box-shadow:/);
 assert.match(css,/@media \(max-width: 680px\) \{ body\.is-after-work \.aw-nav a \{ justify-content: center; \} \}/);
});

test('the floating dock is removed in favour of the header navbar',()=>{
 const base=read('_layouts/base.html');
 assert.doesNotMatch(base,/dock\.html/);
 assert.doesNotMatch(read('_includes/head.html'),/aw-dock\.css/);
 for(const f of ['_includes/after-work/dock.html','assets/css/aw-dock.css'])assert.equal(existsSync(new URL('../'+f,import.meta.url)),false,f);
 const c=read('_includes/after-work/category.html');
 assert.doesNotMatch(c,/aw-switch/);
 assert.doesNotMatch(c,/back-link/);
});
