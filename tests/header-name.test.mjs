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
test('logo mark: clearer ghost F, 8px gap to the name, brighter After work wave, no coral dot',()=>{
 const t=read('assets/css/tokens.css'),b=read('assets/css/base.css'),a=read('assets/css/after-work-grid.css');
 assert.match(t,/--ghost: #d2cec0;/);
 assert.match(t,/--ghost: #3c3b37;/);
 assert.match(a,/--ghost:#36493c;/);
 assert.match(b,/\.brand \{[^}]*gap: 8px/);
 assert.match(a,/\[data-theme="dark"\] body\.is-after-work \.brand__wave \{ stroke:oklch\(0\.86 0\.16 30\); \}/);
 assert.doesNotMatch(read('_includes/header.html'),/brand__dot/);
});

test('After work page has a quiet hint that stickers move', async () => {
  const { readFileSync } = await import('node:fs');
  const html = readFileSync(new URL('../after-work/index.html', import.meta.url), 'utf8');
  assert.match(html, /class="aw-nudge">Nothing here is glued down\./);
});
