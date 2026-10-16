import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('header laptop and lamp use the shipped pictures',()=>{
 const h=read('_includes/header.html')+read('_includes/theme-toggle.html');
 for(const n of ['laptop-open','laptop-half','laptop-closed','lamp-on','lamp-off']){
  assert.ok(existsSync(new URL('../assets/images/ui/'+n+'.png',import.meta.url)),n);
  assert.ok(h.includes('/assets/images/ui/'+n+'.png'),n);
 }
});
test('laptop images are decorative and the link keeps its label',()=>{
 const h=read('_includes/header.html');
 assert.match(h,/class="mt-img" aria-hidden="true"/);
 assert.match(h,/aria-label="\{% if aw_closed %\}Open the laptop/);
});
test('hover shows the half laptop, reduced motion removes the fade',()=>{
 const c=read('assets/css/mode-toggle.css');
 assert.match(c,/hover:hover[\s\S]*\.mt-half \{ opacity:1/);
 assert.match(c,/prefers-reduced-motion:reduce[^}]*\.mt-img img \{ transition:none/);
});
test('lamp is lit in dark mode with a bulb-only glow, and the logo wave glows in dark only',()=>{
 const c=read('assets/css/base.css');
 assert.match(c,/\[data-theme="dark"\] \.theme-toggle__on \{ display: block/);
 assert.match(c,/\.theme-toggle::after/);
 assert.doesNotMatch(c,/theme-toggle__on[^}]*drop-shadow/);
 assert.match(read('_includes/logo.svg'),/class="brand__wave"/);
 assert.match(c,/\[data-theme="dark"\] \.brand__wave \{ stroke/);
 assert.match(c,/prefers-reduced-motion: no-preference\) \{\s*\[data-theme="dark"\] \.brand__wave \{ animation/);
 assert.doesNotMatch(c,/brand-neon-on[^;]*infinite/);
});
