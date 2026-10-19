import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('cross-document transition is off globally and opt-in only for no-preference motion',()=>{
 assert.match(read('assets/css/mode-toggle.css'),/@view-transition \{ navigation: none; \}/);
 const c=read('assets/css/page-transition.css');
 assert.match(c,/prefers-reduced-motion: no-preference\) \{\s*@view-transition \{ navigation: auto; \}/);
});
test('transition is opacity only and short',()=>{
 const c=read('assets/css/page-transition.css');
 assert.doesNotMatch(c,/transform|translate|scale|blur/);
 assert.match(c,/animation-duration: 160ms/);
});
test('header stays in its own layer without motion',()=>{
 const c=read('assets/css/page-transition.css');
 assert.match(c,/view-transition-name: site-header/);
 assert.match(c,/view-transition-group\(site-header\) \{ animation: none; \}/);
});
test('only Home <-> After Work crossings keep the transition',()=>{
 const h=read('_includes/head.html');
 assert.match(h,/addEventListener\('pageswap'/);
 assert.match(h,/addEventListener\('pagereveal'/);
 assert.match(h,/skipTransition\(\)/);
 assert.match(h,/awPath\(from\.pathname\) !== awPath\(location\.pathname\)/);
});
test('entrances are fast-forwarded only on crossings',()=>{
 const c=read('assets/css/page-transition.css');
 assert.match(c,/html\.vt-cross body \*/);
 assert.match(c,/animation-delay: -2s !important/);
});
