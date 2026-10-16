// Geometry and spacing rules for the After work sticker board.
// Pure functions, no DOM: the editor and the Node tests share them.
// Coordinates are "board units": the desktop board is 1000 wide, the phone board 350 wide.

export const STEP = 2;            // raster cell size in board units
export const LABEL_GAP = 6;       // space between a sticker and its label, as in the CSS
export const HOVER_SCALE = 1.04;  // hover growth of Coffee and Cooking
export const HOVER_LIFT = 7;      // hover lift of Coffee and Cooking
export const CLEAR_OVERLAP = 120; // square units: an attached pair must overlap at least this much
export const BOARD_MARGIN = 10;   // how far a sticker may poke past the board edge

export function decodeShape(shape) {
  const bin = typeof atob === 'function' ? atob(shape.bits) : Buffer.from(shape.bits, 'base64').toString('binary');
  const cells = new Uint8Array(shape.cols * shape.rows);
  for (let i = 0; i < cells.length; i++) cells[i] = (bin.charCodeAt(i >> 3) >> (7 - (i & 7))) & 1;
  return { cols: shape.cols, rows: shape.rows, cells, aspect: shape.h / shape.w };
}

// Geometry of one placed item: the image, plus a label for links, rotated as one group.
export function placeItem(item, place, shapes, label, extra = {}) {
  const shape = shapes[item.asset];
  const w = place.w;
  const ih = w * shape.aspect;
  const lw = item.type === 'link' ? label.w : 0;
  const lh = item.type === 'link' ? label.h : 0;
  const gh = ih + (lh ? LABEL_GAP + lh : 0);
  const scale = extra.scale || 1;
  return {
    id: item.id, shape, w, ih, lw, lh, gh, scale,
    cx: place.x + w / 2,
    cy: place.y + gh / 2 - (extra.lift || 0),
    rot: (place.r * Math.PI) / 180,
  };
}

export function rasterize(g) {
  const half = Math.hypot(Math.max(g.w, g.lw), g.gh) * g.scale / 2 + STEP;
  const x0 = Math.floor((g.cx - half) / STEP), y0 = Math.floor((g.cy - half) / STEP);
  const n = Math.ceil((half * 2) / STEP) + 1;
  const data = new Uint8Array(n * n);
  const cos = Math.cos(-g.rot), sin = Math.sin(-g.rot);
  const { cols, rows, cells } = g.shape;
  let count = 0;
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const dx = ((x0 + i + 0.5) * STEP - g.cx) / g.scale, dy = ((y0 + j + 0.5) * STEP - g.cy) / g.scale;
      const lx = dx * cos - dy * sin + g.w / 2, ly = dx * sin + dy * cos + g.gh / 2;
      let on = 0;
      if (ly >= 0 && ly < g.ih && lx >= 0 && lx < g.w) {
        on = cells[Math.floor((ly / g.ih) * rows) * cols + Math.floor((lx / g.w) * cols)];
      } else if (g.lh && ly >= g.ih + LABEL_GAP && ly < g.gh && lx >= (g.w - g.lw) / 2 && lx < (g.w + g.lw) / 2) {
        on = 1;
      }
      if (on) { data[j * n + i] = 1; count++; }
    }
  }
  return { x0, y0, n, data, count };
}

// Distance (in cells) from every cell to the nearest set cell: two-pass chamfer.
function distanceField(r) {
  const { n, data } = r, INF = 1e9, d = new Float32Array(n * n), s2 = Math.SQRT2;
  for (let i = 0; i < d.length; i++) d[i] = data[i] ? 0 : INF;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const k = y * n + x; let v = d[k];
    if (x > 0) v = Math.min(v, d[k - 1] + 1);
    if (y > 0) { v = Math.min(v, d[k - n] + 1); if (x > 0) v = Math.min(v, d[k - n - 1] + s2); if (x < n - 1) v = Math.min(v, d[k - n + 1] + s2); }
    d[k] = v;
  }
  for (let y = n - 1; y >= 0; y--) for (let x = n - 1; x >= 0; x--) {
    const k = y * n + x; let v = d[k];
    if (x < n - 1) v = Math.min(v, d[k + 1] + 1);
    if (y < n - 1) { v = Math.min(v, d[k + n] + 1); if (x < n - 1) v = Math.min(v, d[k + n + 1] + s2); if (x > 0) v = Math.min(v, d[k + n - 1] + s2); }
    d[k] = v;
  }
  return d;
}

// Minimum distance between two rasters, in board units, and their overlap area in square units.
// Distances beyond `limit` are reported as Infinity.
export function pairMetrics(a, b, limit) {
  const da = distanceField(a);
  let min = Infinity, overlap = 0;
  for (let j = 0; j < b.n; j++) {
    const ay = b.y0 + j - a.y0;
    if (ay < 0 || ay >= a.n) continue;
    for (let i = 0; i < b.n; i++) {
      if (!b.data[j * b.n + i]) continue;
      const ax = b.x0 + i - a.x0;
      if (ax < 0 || ax >= a.n) continue;
      const v = da[ay * a.n + ax];
      if (v === 0) overlap++;
      if (v < min) min = v;
    }
  }
  const dist = min * STEP;
  return { dist: dist > limit ? Infinity : dist, overlap: overlap * STEP * STEP };
}

const pairKey = (a, b) => [a, b].sort().join('|');

// Check one breakpoint ('desktop' or 'mobile'). Returns a list of problems; empty means the layout passes.
// Rules: no two visible items may touch or come closer than min_gap, except pairs listed in `attached`,
// which must either overlap clearly or keep the gap. Hover growth of links is included.
export function checkLayout(layout, shapes, bp) {
  const gap = layout.min_gap[bp], board = layout.boards[bp];
  const decoded = {};
  for (const k of Object.keys(shapes)) decoded[k] = { ...decodeShape(shapes[k]), aspect: shapes[k].h / shapes[k].w };
  const shapeMap = Object.fromEntries(Object.entries(decoded));
  const attached = new Set((layout.attached || []).map(([a, b]) => pairKey(a, b)));
  const visible = layout.items.filter((it) => it[bp].show);
  const problems = [];
  const build = (it, extra) => placeItem(it, it[bp], shapeMap, it.label_box && it.label_box[bp], extra);
  const rest = new Map(visible.map((it) => [it.id, rasterize(build(it))]));

  for (const it of visible) {
    const r = rest.get(it.id), g = build(it);
    const xs = [], ys = [];
    for (let j = 0; j < r.n; j++) for (let i = 0; i < r.n; i++) if (r.data[j * r.n + i]) { xs.push(r.x0 + i); ys.push(r.y0 + j); }
    if (!xs.length) continue;
    const minX = Math.min(...xs) * STEP, maxX = (Math.max(...xs) + 1) * STEP, minY = Math.min(...ys) * STEP, maxY = (Math.max(...ys) + 1) * STEP;
    if (minX < -BOARD_MARGIN || maxX > board.w + BOARD_MARGIN || minY < -BOARD_MARGIN || maxY > board.h + BOARD_MARGIN) {
      problems.push({ type: 'outside', a: it.id, state: 'rest' });
    }
    void g;
  }

  const evaluate = (rasters, state, only) => {
    for (let i = 0; i < visible.length; i++) for (let j = i + 1; j < visible.length; j++) {
      const A = visible[i], B = visible[j];
      if (only && A.id !== only && B.id !== only) continue;
      const m = pairMetrics(rasters.get(A.id), rasters.get(B.id), gap + 4);
      const isAttached = attached.has(pairKey(A.id, B.id));
      if (isAttached) {
        if (m.overlap > 0 ? m.overlap < CLEAR_OVERLAP : m.dist < gap) problems.push({ type: 'tangent', a: A.id, b: B.id, dist: m.dist, overlap: m.overlap, state });
      } else if (m.overlap > 0) {
        problems.push({ type: 'overlap', a: A.id, b: B.id, overlap: m.overlap, state });
      } else if (m.dist < gap) {
        problems.push({ type: 'gap', a: A.id, b: B.id, dist: m.dist, state });
      }
    }
  };
  evaluate(rest, 'rest');
  for (const it of visible.filter((x) => x.type === 'link')) {
    const hover = new Map(rest);
    hover.set(it.id, rasterize(build(it, { scale: HOVER_SCALE, lift: HOVER_LIFT })));
    evaluate(hover, 'hover ' + it.id, it.id);
  }
  return problems;
}

export function describe(p) {
  const pair = p.b ? `${p.a} and ${p.b}` : p.a;
  const when = p.state && p.state !== 'rest' ? ` (${p.state})` : '';
  if (p.type === 'outside') return `${pair} sticks out of the board${when}`;
  if (p.type === 'overlap') return `${pair} overlap${when}`;
  if (p.type === 'tangent') return `${pair} are marked as attached but only touch${when}`;
  return `${pair} are only ${Math.round(p.dist)} units apart${when}`;
                                        }
