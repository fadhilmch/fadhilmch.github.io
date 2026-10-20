import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('cross-document transition is off globally and opt-in only for no-preference motion',()=>{
 assert.match(read('assets/css/mode-toggle.css'),/@view-transition \{ navigation: none; \}/);
 const c=read('assets/css/page-transition.css');
 assert.match(c,/prefers-reduced-motion: no-preference\) \{\s*@view-transition \{ navigation: auto; \}/);
});
test('the pixel reveal keeps a plain growing circle as fallback, no page movement',()=>{
 const c=read('assets/css/page-transition.css');
 assert.match(c,/circle\(0 at var\(--vt-x\) var\(--vt-y\)\)/);
 assert.match(c,/circle\(var\(--vt-r\) at var\(--vt-x\) var\(--vt-y\)\)/);
 const reveal=c.match(/@keyframes ripple-reveal \{[\s\S]*?\n\}/)[0];
 assert.doesNotMatch(reveal,/transform|translate/);
 assert.match(c,/--route-portal: [0-9]{3}ms/);
 assert.match(c,/html\[data-route-portal\]::view-transition-new\(root\) \{\s*animation-name: ripple-reveal/);
});
test('no wave ring, glow or warp is left from the water version',()=>{
 const c=read('assets/css/page-transition.css');
 for (const gone of ['route-ring','route-warp','radial-gradient','drop-shadow','coral','feTurbulence'])
   assert.ok(!c.includes(gone),gone);
});
test('the same reveal plays in both directions',()=>{
 const c=read('assets/css/page-transition.css');
 assert.doesNotMatch(c,/data-route-portal="(in|out)"/);
 assert.doesNotMatch(c,/portal-in|portal-out/);
});
test('only Home <-> After Work crossings keep the transition',()=>{
 const h=read('_includes/head.html');
 assert.match(h,/addEventListener\('pageswap'/);
 assert.match(h,/addEventListener\('pagereveal'/);
 assert.match(h,/skipTransition\(\)/);
 assert.match(h,/awPath\(from\.pathname\) !== awPath\(location\.pathname\)/);
 assert.match(h,/sessionStorage\.setItem\('vt-origin'/);
 assert.match(h,/route-pixel-frames/);
 assert.doesNotMatch(h,/route-warp|feTurbulence|route-ring/);
});
test('pixel keyframes generator: blocks radiate from the click and cover the viewport',()=>{
 const h=read('_includes/head.html');
 const src=h.match(/\/\* pixel-keyframes:start \*\/([\s\S]*?)\/\* pixel-keyframes:end \*\//)[1];
 const factory=new Function(src+'; return {pixelCell, pixelRevealCss};');
 const {pixelCell,pixelRevealCss}=factory();
 const css=pixelRevealCss(640,400,1280,800);
 assert.match(css,/@keyframes route-pixel-reveal/);
 assert.match(css,/html\[data-route-portal\]::view-transition-new\(root\) \{ animation-name: route-pixel-reveal;/);
 assert.match(css,/0% \{ clip-path: circle\(0 at 640px 400px\); \}/);
 assert.match(css,/100% \{ clip-path: none; \}/);
 assert.match(css,/animation-timing-function: step-end;/);
 const counts=[...css.matchAll(/clip-path: path\("([^"]*)"\)/g)].map(m=>(m[1].match(/M/g)||[]).length);
 assert.equal(counts.length,11);
 for (let i=1;i<counts.length;i++) assert.ok(counts[i]>counts[i-1],'monotonic');
 const cell=pixelCell(1280,800);
 assert.equal(counts[counts.length-1],Math.ceil(1280/cell)*Math.ceil(800/cell),'full coverage');
 const first=css.match(/clip-path: path\("(M[^"]*)"\)/)[1];
 const m=first.match(/M(\d+) (\d+)h/);
 assert.ok(Math.abs(parseInt(m[1])+cell/2-640)<=cell,'starts near click x');
 assert.ok(Math.abs(parseInt(m[2])+cell/2-400)<=cell,'starts near click y');
 const t0=performance.now();
 const phone=pixelRevealCss(200,700,390,844);
 const ms=performance.now()-t0;
 console.log(`pixelRevealCss phone viewport: ${ms.toFixed(2)}ms, ${phone.length} chars`);
 assert.ok(ms<100,'generation is cheap');
});
test('entrances are fast-forwarded only on crossings',()=>{
 const c=read('assets/css/page-transition.css');
 assert.match(c,/html\.vt-cross body \*/);
 assert.match(c,/animation-delay: -2s !important/);
});
