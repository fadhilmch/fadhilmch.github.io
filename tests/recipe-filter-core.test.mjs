import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const core = createRequire(import.meta.url)('../assets/js/recipe-filter-core.js');
const halu = { origin: ['Indonesia'], method: ['AeroPress'], process: [] };
const funky = { origin: ['Indonesia'], method: ['AeroPress'], process: ['Anaerobic natural'] };
const v60 = { origin: ['Ethiopia'], method: ['V60'], process: ['Washed'] };

test('an empty selection shows every recipe', () => {
  assert.equal([halu, funky, v60].filter((r) => core.matches({}, r)).length, 3);
  assert.equal(core.matches({ origin: [], method: [] }, halu), true);
});

test('values inside one group combine with OR', () => {
  const selection = { origin: ['Indonesia', 'Ethiopia'] };
  assert.deepEqual([halu, funky, v60].map((r) => core.matches(selection, r)), [true, true, true]);
});

test('different groups combine with AND', () => {
  const selection = { origin: ['Indonesia'], process: ['Anaerobic natural'] };
  assert.deepEqual([halu, funky, v60].map((r) => core.matches(selection, r)), [false, true, false]);
});

test('a recipe without a value for a picked group does not match', () => {
  assert.equal(core.matches({ process: ['Washed'] }, halu), false);
  assert.equal(core.matches({ process: ['Washed'] }, {}), false);
});

test('toggle adds, removes and never mutates the previous selection', () => {
  const start = { origin: ['Indonesia'] };
  const added = core.toggle(start, 'origin', 'Kenya');
  assert.deepEqual(added.origin, ['Indonesia', 'Kenya']);
  assert.deepEqual(start.origin, ['Indonesia']);
  assert.deepEqual(core.toggle(added, 'origin', 'Indonesia').origin, ['Kenya']);
  assert.deepEqual(core.toggle({}, 'method', 'V60'), { method: ['V60'] });
});

test('total counts picks across groups', () => {
  assert.equal(core.total({ origin: ['a', 'b'], method: [], process: ['c'] }), 3);
  assert.equal(core.total({}), 0);
});

test('parseValues reads the pipe separated card attribute', () => {
  assert.deepEqual(core.parseValues('Bread|Main'), ['Bread', 'Main']);
  assert.deepEqual(core.parseValues(''), []);
  assert.deepEqual(core.parseValues(undefined), []);
});

test('summary and count labels', () => {
  assert.equal(core.summary({}, 'origin'), 'Any');
  assert.equal(core.summary({ origin: ['Kenya'] }, 'origin'), 'Kenya');
  assert.equal(core.summary({ origin: ['Kenya', 'Peru', 'Chile'] }, 'origin'), 'Kenya +2');
  assert.equal(core.countLabel(1), '1 recipe');
  assert.equal(core.countLabel(0), '0 recipes');
  assert.equal(core.countLabel(4), '4 recipes');
});
