import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describeDay } from '../assets/js/contribution-roll.js';
const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');

test('describeDay reads like the tooltip: weekday, date, count', () => {
  assert.equal(describeDay('2026-10-16', 340), 'Fri, 16 Oct 2026 · 340 contributions');
  assert.equal(describeDay('2026-10-13', '1'), 'Tue, 13 Oct 2026 · 1 contribution');
});

test('the roll takes every colour from the site tokens, so light and dark both follow the theme', () => {
  const css = read('assets/css/contribution-roll.css');
  assert.doesNotMatch(css, /#[0-9a-f]{3,8}\b|rgba?\(|oklch\(/i);
  for (const token of ['--l2', '--l3', '--l4', '--l5']) assert.ok(css.includes(`var(${token})`), token);
});

test('notes are circles at every width', () => {
  assert.match(read('assets/css/contribution-roll.css'), /\.roll__week i \{[^}]*border-radius: 50%/);
});

test('motion plays once, only after JS arms it, and is switched off for reduced motion', () => {
  const css = read('assets/css/contribution-roll.css');
  assert.doesNotMatch(css, /infinite/);
  assert.match(css, /\.roll\.is-armed \.roll__note \{ opacity: 0; \}/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[^]*animation: none/);
  const js = read('assets/js/contribution-roll.js');
  assert.match(js, /prefers-reduced-motion: reduce/);
  assert.match(js, /watcher\.disconnect\(\)/);
});

test('the About page includes the roll and loads its style and script only there', () => {
  assert.match(read('index.html'), /\{% include about\/contribution-roll\.html %\}/);
  assert.match(read('_includes/head.html'), /page\.nav == 'about' %\}.*contribution-roll\.css/);
  assert.match(read('_layouts/base.html'), /page\.nav == 'about' %\}.*type="module" src="\{\{ '\/assets\/js\/contribution-roll\.js'/);
});

test('the include draws only data from the snapshot and has no invented heading', () => {
  const html = read('_includes/about/contribution-roll.html');
  assert.match(html, /site\.data\.github_activity/);
  assert.doesNotMatch(html, /<h[1-6]/);
  assert.match(html, /public repos only/);
});

test('deploys refresh the snapshot daily and keep the committed one if GitHub is unreachable', () => {
  const workflow = read('.github/workflows/pages.yml');
  assert.match(workflow, /schedule:\s*\n\s*- cron:/);
  assert.match(workflow, /update-github-activity\.mjs\n\s+continue-on-error: true/);
});
