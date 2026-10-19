import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('cross-document transition is off globally and opt-in only for no-preference motion',()=>{
 assert.match(read('assets/css/mode-toggle.css'),/@view-transition \{ navigation: none; \}/);
 const c=read('assets/css/page-transition.css');
 assert.match(c,/prefers-reduced-motion: no-preference\) \{\s*@view-transition \{ navigation: auto; \}/);
});
test('coral is its own transition layer, clipped to a circle, no page movement',()=>{
 const c=read('assets/css/page-transition.css');
 assert.match(c,/#route-coral \{[^}]*view-transition-name: route-coral/);
 assert.match(c,/circle\(0 at var\(--vt-x\) var\(--vt-y\)\)/);
 assert.doesNotMatch(c,/transform|translate/);
 assert.match(c,/--route-portal: [0-9]{3}ms/);
});
test('grows out going to After Work and shrinks back going home',()=>{
 const c=read('assets/css/page-transition.css');
 assert.match(c,/data-route-portal="in"\]::view-transition-new\(route-coral\)/);
 assert.match(c,/data-route-portal="out"\]::view-transition-new\(route-coral\)/);
});
test('only Home <-> After Work crossings keep the transition',()=>{
 const h=read('_includes/head.html');
 assert.match(h,/addEventListener\('pageswap'/);
 assert.match(h,/addEventListener\('pagereveal'/);
 assert.match(h,/skipTransition\(\)/);
 assert.match(h,/awPath\(from\.pathname\) !== awPath\(location\.pathname\)/);
 assert.match(h,/sessionStorage\.setItem\('vt-origin'/);
});
test('entrances are fast-forwarded only on crossings',()=>{
 const c=read('assets/css/page-transition.css');
 assert.match(c,/html\.vt-cross body \*/);
 assert.match(c,/animation-delay: -2s !important/);
});
