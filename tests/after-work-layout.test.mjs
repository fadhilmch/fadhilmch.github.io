import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { checkLayout, decodeShape } from '../assets/js/after-work-layout.js';
import { createHistory, updateItem, attachPair, detachPair, moveToFront, moveToBack, exportLayout, normalizePlace, LIMITS } from '../assets/js/after-work-edit-state.js';
import { typeLine, LINE } from '../assets/js/after-work-terminal.js';

const read = (p) => JSON.parse(readFileSync(new URL('../' + p, import.meta.url), 'utf8'));
const layout = () => read('_data/after_work_layout.json');
const shapes = () => read('assets/data/after-work-shapes.json');

// A solid square shape: 96x96 cells, all filled, 100x100 units.
const solid = (() => {
  const bits = Buffer.alloc((96 * 96) / 8, 0xff).toString('base64');
  return { w: 100, h: 100, cols: 96, rows: 96, bits };
})();
const synthetic = (a, b, attached = []) => ({
  layout: {
    version: 1, min_gap: { desktop: 12, mobile: 10 }, boards: { desktop: { w: 1000, h: 680 }, mobile: { w: 350, h: 760 } }, attached,
    items: [['a', a], ['b', b]].map(([id, x]) => ({ id, type: 'deco', asset: 'sq', desktop: { x, y: 100, w: 100, r: 0, z: 1, show: true }, mobile: { x: 10, y: 10, w: 50, r: 0, z: 1, show: true } })),
  },
  shapes: { sq: solid },
});

test('shape masks decode to the declared size', () => {
  const d = decodeShape(solid);
  assert.equal(d.cells.length, 96 * 96);
  assert.equal(d.cells.every((c) => c === 1), true);
});
test('clear pairs pass, close pairs report a gap, touching pairs report overlap', () => {
  assert.deepEqual(checkLayout(...Object.values(synthetic(100, 300)), 'desktop'), []);
  const near = synthetic(100, 205), gap = checkLayout(near.layout, near.shapes, 'desktop');
  assert.ok(gap.length >= 1 && gap[0].a && gap[0].b);
  const over = synthetic(100, 150), hit = checkLayout(over.layout, over.shapes, 'desktop');
  assert.ok(hit.some((p) => p.type === 'overlap'));
});
test('an attached pair may overlap, but not sit apart with a gap problem hidden', () => {
  const s = synthetic(100, 150, [['a', 'b']]);
  assert.equal(checkLayout(s.layout, s.shapes, 'desktop').filter((p) => p.type === 'overlap').length, 0);
});
test('hidden stickers are ignored and board edges are enforced', () => {
  const s = synthetic(100, 150);
  s.layout.items[1].desktop.show = false;
  assert.deepEqual(checkLayout(s.layout, s.shapes, 'desktop'), []);
  s.layout.items[0].desktop.x = 990;
  assert.ok(checkLayout(s.layout, s.shapes, 'desktop').some((p) => p.type === 'outside'));
});
test('the published layout passes the spacing check on desktop and phone, including hover', () => {
  for (const bp of ['desktop', 'mobile']) assert.deepEqual(checkLayout(layout(), shapes(), bp), [], bp);
});
test('layout file shape: every item has both layouts, links have labels and hrefs', () => {
  const l = layout(), shp = shapes();
  assert.equal(l.version, 1);
  for (const it of l.items) {
    assert.ok(shp[it.asset], it.asset);
    for (const bp of ['desktop', 'mobile']) {
      const p = it[bp];
      for (const k of ['x', 'y', 'w', 'r', 'z']) assert.equal(typeof p[k], 'number', `${it.id}.${bp}.${k}`);
      assert.equal(typeof p.show, 'boolean');
    }
    if (it.type === 'link') { assert.ok(it.label && it.tag && it.href && it.label_box.desktop && it.label_box.mobile); }
  }
  for (const [a, b] of l.attached) assert.ok(l.items.some((i) => i.id === a) && l.items.some((i) => i.id === b));
});
test('edit state: history, limits, stacking, attach and export', () => {
  const h = createHistory(layout());
  h.commit((l) => updateItem(l, 'desktop', 'tennis', { w: 5000, r: 400, x: 20.123 }));
  const p = h.state.items.find((i) => i.id === 'tennis').desktop;
  assert.equal(p.w, LIMITS.w[1]); assert.equal(p.r, LIMITS.r[1]); assert.equal(p.x, 20.1);
  assert.equal(h.canUndo, true);
  h.undo();
  assert.equal(h.state.items.find((i) => i.id === 'tennis').desktop.w, layout().items.find((i) => i.id === 'tennis').desktop.w);
  h.redo(); assert.equal(h.state.items.find((i) => i.id === 'tennis').desktop.w, LIMITS.w[1]);
  h.commit((l) => moveToFront(l, 'desktop', 'monstera'));
  const top = Math.max(...h.state.items.map((i) => i.desktop.z));
  assert.equal(h.state.items.find((i) => i.id === 'monstera').desktop.z, top);
  h.commit((l) => moveToBack(l, 'desktop', 'monstera'));
  assert.equal(Math.min(...h.state.items.map((i) => i.desktop.z)), h.state.items.find((i) => i.id === 'monstera').desktop.z);
  h.commit((l) => attachPair(l, 'camera', 'sparkles'));
  assert.ok(h.state.attached.some((p) => p.includes('sparkles')));
  h.commit((l) => detachPair(l, 'camera', 'sparkles'));
  assert.ok(!h.state.attached.some((p) => p.includes('sparkles')));
  h.begin(); h.state.items[0].desktop.x = 1; h.undo();
  assert.equal(JSON.parse(exportLayout(layout())).items.length, layout().items.length);
  assert.ok(exportLayout(layout()).endsWith('\n'));
  assert.equal(normalizePlace({ x: 1, y: 2, w: 100, r: 0, z: 1, show: true }, { w: 1000, h: 680 }).w, 100);
});
test('the exported layout file round-trips byte for byte', () => {
  assert.equal(exportLayout(layout()), readFileSync(new URL('../_data/after_work_layout.json', import.meta.url), 'utf8'));
});
test('terminal line types one character at a time, or at once with reduced motion', () => {
  const seen = []; let tick;
  typeLine('abc', (t) => seen.push(t), { schedule: (fn) => { tick = fn; return 1; }, cancel: () => { tick = null; } });
  tick(); tick(); tick();
  assert.deepEqual(seen, ['', 'a', 'ab', 'abc']);
  const instant = []; typeLine(LINE, (t) => instant.push(t), { reduce: true });
  assert.deepEqual(instant, [LINE]);
});

test('site editor field: raw layout format, save gate and collection wiring', async () => {
  const { validateLayout, registerLayoutFormat, LAYOUT_COLLECTION } = await import('../admin/layout-field.js');
  let format;
  registerLayoutFormat({ registerCustomFormat: (name, ext, f) => { format = { name, ext, ...f }; } });
  const raw = readFileSync(new URL('../_data/after_work_layout.json', import.meta.url), 'utf8');
  assert.equal(format.name, 'layout-raw');
  assert.equal(format.toFile(format.fromFile(raw)), raw);
  validateLayout(raw, shapes());
  const bad = layout();
  bad.items.find((i) => i.id === 'tennis').desktop.x = bad.items.find((i) => i.id === 'laptop').desktop.x;
  assert.throws(() => validateLayout(exportLayout(bad), shapes()), /spacing/);
  assert.throws(() => validateLayout('{nope', shapes()), /valid JSON/);
  const config = JSON.parse(readFileSync(new URL('../admin/config.yml', import.meta.url), 'utf8'));
  const c = config.collections.find((x) => x.name === LAYOUT_COLLECTION);
  assert.equal(c.publish, false);
  assert.equal(c.files[0].file, '_data/after_work_layout.json');
  assert.equal(c.files[0].format, 'layout-raw');
  assert.equal(c.files[0].fields[0].widget, 'aw-layout');
});
