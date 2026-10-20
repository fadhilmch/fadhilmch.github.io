import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('cross-document transition is off globally and opt-in only for no-preference motion',()=>{
 assert.match(read('assets/css/mode-toggle.css'),/@view-transition \{ navigation: none; \}/);
 const c=read('assets/css/page-transition.css');
 assert.match(c,/prefers-reduced-motion: no-preference\) \{\s*@view-transition \{ navigation: auto; \}/);
});
test('ripple reveals the arriving page through a growing circle, no page movement',()=>{
 const c=read('assets/css/page-transition.css');
 assert.match(c,/circle\(0 at var\(--vt-x\) var\(--vt-y\)\)/);
 assert.match(c,/circle\(var\(--vt-r\) at var\(--vt-x\) var\(--vt-y\)\)/);
 const reveal=c.match(/@keyframes ripple-reveal \{[\s\S]*?\n\}/)[0];
 assert.doesNotMatch(reveal,/transform|translate/);
 assert.match(c,/--route-portal: [0-9]{3}ms/);
});
test('a coral ring rides the ripple edge on its own transition layer',()=>{
 const c=read('assets/css/page-transition.css');
 assert.match(c,/#route-ring \{[^}]*view-transition-name: route-ring/);
 assert.match(c,/border: 3px solid var\(--route-coral\)/);
 assert.match(c,/::view-transition-new\(route-ring\) \{\s*animation-name: ripple-ring/);
 assert.match(c,/::view-transition-old\(route-ring\) \{\s*display: none/);
});
test('the same ripple plays in both directions',()=>{
 const c=read('assets/css/page-transition.css');
 assert.doesNotMatch(c,/data-route-portal="(in|out)"/);
 assert.doesNotMatch(c,/portal-in|portal-out/);
 assert.match(c,/html\[data-route-portal\]::view-transition-new\(root\) \{\s*animation-name: ripple-reveal/);
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
