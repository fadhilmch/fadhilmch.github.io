import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('cross-document transition is off globally and opt-in only for no-preference motion',()=>{
 assert.match(read('assets/css/mode-toggle.css'),/@view-transition \{ navigation: none; \}/);
 const c=read('assets/css/page-transition.css');
 assert.match(c,/prefers-reduced-motion: no-preference\) \{\s*@view-transition \{ navigation: auto; \}/);
});
test('the arriving page slides in as a panel with a shadow on its leading edge',()=>{
 const c=read('assets/css/page-transition.css');
 assert.match(c,/@keyframes panel-in-right \{\s*from \{ transform: translateX\(100%\); \}/);
 assert.match(c,/@keyframes panel-in-left \{\s*from \{ transform: translateX\(-100%\); \}/);
 assert.match(c,/data-route-portal="forward"\]::view-transition-new\(root\) \{\s*animation-name: panel-in-right;\s*box-shadow: -24px 0 48px/);
 assert.match(c,/data-route-portal="back"\]::view-transition-new\(root\) \{\s*animation-name: panel-in-left;\s*box-shadow: 24px 0 48px/);
 assert.match(c,/--route-portal: [0-9]{3}ms/);
 assert.doesNotMatch(c,/scale\(|clip-path/);
});
test('the outgoing page drifts ~28% and dims for depth',()=>{
 const c=read('assets/css/page-transition.css');
 assert.match(c,/@keyframes panel-out-left \{\s*to \{ transform: translateX\(-28%\); filter: brightness\(0\.72\); \}\s*\}/);
 assert.match(c,/@keyframes panel-out-right \{\s*to \{ transform: translateX\(28%\); filter: brightness\(0\.72\); \}\s*\}/);
 assert.match(c,/data-route-portal="forward"\]::view-transition-old\(root\) \{\s*animation-name: panel-out-left/);
 assert.match(c,/data-route-portal="back"\]::view-transition-old\(root\) \{\s*animation-name: panel-out-right/);
});
test('nothing is left from the wave or pixel versions',()=>{
 const c=read('assets/css/page-transition.css');
 for (const gone of ['route-ring','route-warp','radial-gradient','drop-shadow','coral','feTurbulence','ripple','pixel'])
   assert.ok(!c.includes(gone),gone);
 const h=read('_includes/head.html');
 for (const gone of ['route-ring','route-warp','feTurbulence','vt-origin','pixelRevealCss','route-pixel-frames'])
   assert.ok(!h.includes(gone),gone);
});
test('only Home <-> After Work crossings keep the transition, direction marked forward/back',()=>{
 const h=read('_includes/head.html');
 assert.match(h,/addEventListener\('pageswap'/);
 assert.match(h,/addEventListener\('pagereveal'/);
 assert.match(h,/skipTransition\(\)/);
 assert.match(h,/awPath\(from\.pathname\) !== awPath\(location\.pathname\)/);
 assert.match(h,/setAttribute\('data-route-portal', awPath\(location\.pathname\) \? 'forward' : 'back'\)/);
 assert.doesNotMatch(h,/data-route-portal="(in|out)"/);
});
test('entrances are fast-forwarded only on crossings',()=>{
 const c=read('assets/css/page-transition.css');
 assert.match(c,/html\.vt-cross body \*/);
 assert.match(c,/animation-delay: -2s !important/);
});
