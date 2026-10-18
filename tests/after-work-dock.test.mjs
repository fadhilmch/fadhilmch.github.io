import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('After Work pages swap the primary nav for the dock',()=>{
 const header=read('_includes/header.html');
 assert.match(header,/unless page\.nav == 'after-work'[\s\S]*?primary-nav[\s\S]*?endunless/);
 assert.match(read('_layouts/base.html'),/\{% if page\.nav == 'after-work' %\}\{% include after-work\/dock\.html %\}/);
});

test('dock links home, coffee and cooking with per-page current state',()=>{
 const d=read('_includes/after-work/dock.html');
 assert.match(d,/\/after-work\/' \| relative_url \}\}/);
 assert.match(d,/\/after-work\/coffee\/' \| relative_url \}\}/);
 assert.match(d,/\/after-work\/food\/' \| relative_url \}\}/);
 assert.match(d,/page\.url == '\/after-work\/'/);
 assert.match(d,/page\.section == 'coffee' or page\.kind == 'coffee'/);
 assert.match(d,/page\.section == 'food' or page\.kind == 'food'/);
 assert.equal((d.match(/aria-current="page"/g)||[]).length,3);
 for(const l of ['After work home','Coffee','Cooking'])assert.ok(d.includes(`aria-label="${l}"`),l);
});

test('dock styles: frosted with transparent fallback, raised underline, press, safe area, reduced motion',()=>{
 const c=read('assets/css/aw-dock.css');
 assert.match(c,/@supports \(\(backdrop-filter: blur\(2px\)\) or \(-webkit-backdrop-filter: blur\(2px\)\)\)/);
 assert.match(c,/backdrop-filter: blur\(18px\) saturate\(1\.5\)/);
 assert.match(c,/\.aw-dock a\[aria-current="page"\]::after \{\n  content: ''; position: absolute; bottom: -6px[\s\S]*border-radius: 2\.5px/);
 assert.match(c,/@keyframes aw-dock-press/);
 assert.match(c,/\.aw-dock a:active \{ animation: aw-dock-press/);
 assert.match(c,/env\(safe-area-inset-bottom, 0px\)/);
 assert.match(c,/\.is-after-work \.site-footer \{ padding-bottom/);
 assert.match(c,/prefers-reduced-motion: reduce/);
});

test('category pages rely on the dock, not a switch or back link',()=>{
 const c=read('_includes/after-work/category.html');
 assert.doesNotMatch(c,/aw-switch/);
 assert.doesNotMatch(c,/back-link/);
});

test('head loads the dock stylesheet only on After Work pages',()=>{
 assert.match(read('_includes/head.html'),/page\.nav == 'after-work'[^\n]+aw-dock\.css/);
});

test('dock icon assets exist',()=>{
 for(const n of ['home','coffee','cooking'])
   assert.ok(existsSync(new URL(`../assets/images/ui/aw-nav-${n}.svg`,import.meta.url)),n);
});
