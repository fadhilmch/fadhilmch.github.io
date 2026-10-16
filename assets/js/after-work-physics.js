// Soft sticker collisions for the After work board. Pure functions, no DOM: the page and the Node tests share them.
// Bodies are rasters of the real sticker outlines (see after-work-layout.js), moved by an offset in board units.
import { STEP, BOARD_MARGIN, placeItem, rasterize, decodeShape } from './after-work-layout.js';

export const STEP_MAX = 3;      // longest single move, in board units, so nothing tunnels through a neighbour
export const PUSH_DEPTH = 4;    // how long a chain of pushed stickers may get

export function makeWorld(layout, shapes, bp) {
  const decoded = {};
  for (const k of Object.keys(shapes)) decoded[k] = { ...decodeShape(shapes[k]), aspect: shapes[k].h / shapes[k].w };
  const board = layout.boards[bp];
  const bodies = [];
  for (const it of layout.items.filter((x) => x[bp].show)) {
    const r = rasterize(placeItem(it, it[bp], decoded, it.label_box && it.label_box[bp]));
    const ci = [], cj = [];
    let sx = 0, sy = 0;
    for (let j = 0; j < r.n; j++) for (let i = 0; i < r.n; i++) if (r.data[j * r.n + i]) { ci.push(i); cj.push(j); sx += i; sy += j; }
    if (!ci.length) continue;
    const minI = Math.min(...ci), maxI = Math.max(...ci), minJ = Math.min(...cj), maxJ = Math.max(...cj);
    bodies.push({
      id: it.id, movable: it.type !== 'link', r, ci, cj,
      cx: (r.x0 + sx / ci.length) * STEP, cy: (r.y0 + sy / ci.length) * STEP,
      // outline box at rest, in board units
      bx0: (r.x0 + minI) * STEP, bx1: (r.x0 + maxI + 1) * STEP, by0: (r.y0 + minJ) * STEP, by1: (r.y0 + maxJ + 1) * STEP,
      ox: 0, oy: 0,
    });
  }
  return { board, bodies };
}

const cellShift = (v) => Math.round(v / STEP);

export function overlaps(a, b) {
  if (a.bx1 + a.ox <= b.bx0 + b.ox || b.bx1 + b.ox <= a.bx0 + a.ox || a.by1 + a.oy <= b.by0 + b.oy || b.by1 + b.oy <= a.by0 + a.oy) return false;
  const ax = cellShift(a.ox), ay = cellShift(a.oy), bx = cellShift(b.ox), by = cellShift(b.oy);
  const dx = a.r.x0 + ax - b.r.x0 - bx, dy = a.r.y0 + ay - b.r.y0 - by, n = b.r.n;
  for (let k = 0; k < a.ci.length; k++) {
    const i = a.ci[k] + dx, j = a.cj[k] + dy;
    if (i >= 0 && j >= 0 && i < n && j < n && b.r.data[j * n + i]) return true;
  }
  return false;
}

const inside = (w, b) => b.bx0 + b.ox >= -BOARD_MARGIN && b.bx1 + b.ox <= w.board.w + BOARD_MARGIN && b.by0 + b.oy >= -BOARD_MARGIN && b.by1 + b.oy <= w.board.h + BOARD_MARGIN;

function push(w, b, dx, dy, depth) {
  b.ox += dx; b.oy += dy;
  if (!inside(w, b)) return false;
  for (const o of w.bodies) {
    if (o === b || !overlaps(b, o)) continue;
    if (!o.movable || depth >= PUSH_DEPTH) return false;
    // push mostly along the movement, partly away from the pusher's centre
    let vx = (o.cx + o.ox) - (b.cx + b.ox), vy = (o.cy + o.oy) - (b.cy + b.oy);
    const vl = Math.hypot(vx, vy) || 1, ml = Math.hypot(dx, dy) || 1;
    let px = 0.6 * dx / ml + 0.4 * vx / vl, py = 0.6 * dy / ml + 0.4 * vy / vl;
    const pl = Math.hypot(px, py) || 1, len = Math.max(ml, 1);
    if (!push(w, o, px / pl * len, py / pl * len, depth + 1)) return false;
  }
  return true;
}

// Try one small move of body `b`. Everything moved is rolled back if the move would hit a link, the board edge or too long a chain.
export function tryStep(w, b, dx, dy) {
  const snap = w.bodies.map((x) => [x.ox, x.oy]);
  if (push(w, b, dx, dy, 0)) return true;
  w.bodies.forEach((x, i) => { x.ox = snap[i][0]; x.oy = snap[i][1]; });
  return false;
}

// Move `b` toward a target offset in steps of at most STEP_MAX, sliding along obstacles. Returns true if it got there.
export function moveToward(w, b, tx, ty, maxSteps = 80) {
  for (let s = 0; s < maxSteps; s++) {
    const dx = tx - b.ox, dy = ty - b.oy, d = Math.hypot(dx, dy);
    if (d < 0.05) return true;
    const k = Math.min(1, STEP_MAX / d), sx = dx * k, sy = dy * k;
    if (!(tryStep(w, b, sx, sy) || tryStep(w, b, sx, 0) || tryStep(w, b, 0, sy))) return false;
  }
  return false;
}
