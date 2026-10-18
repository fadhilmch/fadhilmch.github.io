import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = (p) => readFileSync(new URL(`../assets/css/${p}`, import.meta.url), 'utf8');
const head = readFileSync(new URL('../_includes/head.html', import.meta.url), 'utf8');

test('page switches are instant: no cross-document fade', () => {
  const s = css('mode-toggle.css');
  assert.match(s, /@view-transition\s*{\s*navigation:\s*none;?\s*}/);
  assert.doesNotMatch(s, /navigation:\s*auto/);
});

test('same-site arrivals skip the load entrance, first visits and reloads keep it', () => {
  assert.match(head, /classList\.add\('nav-in'\)/);
  assert.match(head, /nav\.type === 'reload'/);
  assert.match(css('depth.css'), /&\.nav-in :is\([^)]*\) > \* \{ animation: none; \}/);
});
