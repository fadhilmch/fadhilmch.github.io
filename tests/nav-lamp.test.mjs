import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');

test('After work drops the bright soft-depth highlight on the nav pill', () => {
  assert.match(read('assets/css/after-work-grid.css'), /html\[data-depth="soft"\] body\.is-after-work \.primary-nav \{ box-shadow:none; \}/);
});
test('light lamp styling is soft and never applies on After work', () => {
  const b = read('assets/css/base.css');
  assert.match(b, /\[data-theme="light"\] body:not\(\.is-after-work\) \.theme-toggle \{ background-image: none;/);
  assert.doesNotMatch(b, /^\[data-theme="light"\] \.theme-toggle \{ box-shadow/m);
});
