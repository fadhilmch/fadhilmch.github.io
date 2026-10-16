// Visitor "Play" mode: drag the avatar and the decorations around, then Reset.
// Coffee and Cooking stay put so a drag can never open a page. Nothing is saved.
import { decodeShape, placeItem, rasterize, pairMetrics, HOVER_SCALE, HOVER_LIFT } from './after-work-layout.js';

const PLAYABLE = '.aw-avatar, .aw-deco';
const MOVE_THRESHOLD = 5;

export function initPlay(stickers, playButton, resetButton) {
  const items = [...stickers.querySelectorAll(PLAYABLE)];
  const offsets = new Map(items.map((el) => [el, { x: 0, y: 0 }]));
  let z = 20;
  const world = makeWorld(stickers); // collision data, loaded in the background

  const paint = (el) => {
    const o = offsets.get(el), w = stickers.getBoundingClientRect().width;
    el.style.translate = `${o.x * w}px ${o.y * w}px`; // stored as a share of the board width, so resizing keeps it
  };
  const anyMoved = () => [...offsets.values()].some((o) => o.x || o.y);

  function startDrag(el, ev) {
    if (ev.button > 0) return;
    const board = stickers.getBoundingClientRect(), start = { ...offsets.get(el) }, sx = ev.clientX, sy = ev.clientY;
    let dragging = false;
    el.setPointerCapture(ev.pointerId);
    const move = (m) => {
      const dx = m.clientX - sx, dy = m.clientY - sy;
      if (!dragging && Math.hypot(dx, dy) < MOVE_THRESHOLD) return;
      dragging = true;
      el.classList.add('is-drag');
      const r = el.getBoundingClientRect(), cur = offsets.get(el);
      let nx = start.x + dx / board.width, ny = start.y + dy / board.width;
      const px = (nx - cur.x) * board.width, py = (ny - cur.y) * board.width;
      // keep the sticker on the board
      if (r.left + px < board.left - 6) nx = cur.x + (board.left - 6 - r.left) / board.width;
      if (r.right + px > board.right + 6) nx = cur.x + (board.right + 6 - r.right) / board.width;
      if (r.top + py < board.top) ny = cur.y + (board.top - r.top) / board.width;
      if (r.bottom + py > board.bottom) ny = cur.y + (board.bottom - r.bottom) / board.width;
      // and never overlap or crowd another sticker: stop at the nearest free spot
      const safe = world.settle(el, offsets, cur, { x: nx, y: ny });
      nx = safe.x; ny = safe.y;
      offsets.set(el, { x: nx, y: ny });
      paint(el);
      resetButton.hidden = false;
    };
    const end = () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', end);
      el.removeEventListener('pointercancel', end);
      el.classList.remove('is-drag');
      if (dragging) { el.style.zIndex = ++z; el.dataset.dragged = '1'; setTimeout(() => delete el.dataset.dragged, 0); }
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
  }
  const onDown = (ev) => startDrag(ev.currentTarget, ev);

  function setPlay(on) {
    stickers.classList.toggle('is-play', on);
    playButton.setAttribute('aria-pressed', String(on));
    playButton.textContent = on ? 'Done playing' : 'Play';
    for (const el of items) el[on ? 'addEventListener' : 'removeEventListener']('pointerdown', onDown);
    if (!on) resetButton.hidden = !anyMoved();
  }

  function reset() {
    for (const el of items) {
      offsets.set(el, { x: 0, y: 0 });
      el.style.zIndex = '';
      el.style.transition = 'translate .35s ease';
      paint(el);
      setTimeout(() => { el.style.transition = ''; }, 400);
    }
    resetButton.hidden = true;
  }

  playButton.hidden = false;
  playButton.addEventListener('click', () => setPlay(playButton.getAttribute('aria-pressed') !== 'true'));
  resetButton.addEventListener('click', reset);
  addEventListener('resize', () => items.forEach(paint));
}

// Collision rules for Play, using the same outline masks as the editor: a dragged sticker may not overlap
// or come closer than the board's minimum gap to another visible sticker. Attached pairs (camera and Coffee,
// ball and headphones, ...) may overlap freely. The sticker stops at the nearest free spot; nothing is pushed.
function makeWorld(stickers) {
  let shapes = null;
  const url = stickers.dataset.shapes;
  if (url) fetch(url).then((r) => r.json()).then((j) => {
    shapes = {}; for (const k of Object.keys(j)) shapes[k] = { ...decodeShape(j[k]), aspect: j[k].h / j[k].w };
  }).catch(() => {});
  let attached = [], minGap = { desktop: 12, mobile: 10 };
  try { attached = JSON.parse(stickers.dataset.attached || '[]'); minGap = JSON.parse(stickers.dataset.minGap); } catch (e) { /* defaults */ }
  const isAttached = (a, b) => attached.some(([x, y]) => (x === a && y === b) || (x === b && y === a));

  function describeAll(offsets) {
    const cs = getComputedStyle(stickers), bw = parseFloat(cs.getPropertyValue('--bw')), board = stickers.getBoundingClientRect();
    const k = board.width / bw, bp = bw < 500 ? 'mobile' : 'desktop', P = bp === 'mobile' ? 'm' : 'd';
    const list = [];
    for (const el of stickers.querySelectorAll('[data-aw-id]')) {
      if (getComputedStyle(el).display === 'none' || !shapes || !shapes[el.dataset.awAsset]) continue;
      const v = (n) => parseFloat(el.style.getPropertyValue(`--${P}${n}`));
      const link = el.classList.contains('aw-sticker');
      const o = offsets.get(el) || { x: 0, y: 0 };
      list.push({ el, id: el.dataset.awId,
        item: { id: el.dataset.awId, asset: el.dataset.awAsset, type: link ? 'link' : 'deco' },
        place: { x: v('x'), y: v('y'), w: v('w'), r: v('r') },
        label: link ? { w: v('lw'), h: v('lh') } : null,
        off: { x: (o.x * board.width) / k, y: (o.y * board.width) / k } });
    }
    return { list, k, gap: minGap[bp], bw };
  }
  const rasterAt = (d, off, extra) => {
    const pl = { ...d.place, x: d.place.x + off.x, y: d.place.y + off.y };
    return rasterize(placeItem(d.item, pl, shapes, d.label, extra));
  };
  const bbox = (r) => ({ l: r.x0, t: r.y0, r: r.x0 + r.n, b: r.y0 + r.n });

  return {
    settle(el, offsets, cur, want) {
      if (!shapes) return want;
      const { list, k, gap } = describeAll(offsets);
      const me = list.find((d) => d.el === el);
      if (!me) return want;
      const board = stickers.getBoundingClientRect().width;
      // Coffee and Cooking grow and lift on hover, so keep clear of both their resting and hovered outlines
      const others = [];
      for (const d of list) {
        if (d === me || isAttached(me.id, d.id)) continue;
        others.push(rasterAt(d, d.off));
        if (d.item.type === 'link') others.push(rasterAt(d, d.off, { scale: HOVER_SCALE, lift: HOVER_LIFT }));
      }
      const toUnits = (o) => ({ x: (o.x * board) / k, y: (o.y * board) / k });
      const free = (o) => {
        const r = rasterAt(me, toUnits(o)), a = bbox(r), m = Math.ceil((gap + 4) / 2);
        for (const q of others) {
          const c = bbox(q);
          if (a.r + m < c.l || c.r + m < a.l || a.b + m < c.t || c.b + m < a.t) continue;
          const mt = pairMetrics(q, r, gap + 4);
          if (mt.overlap > 0 || mt.dist < gap) return false;
        }
        return true;
      };
      // Walk the whole path in small steps so a fast drag cannot jump over another sticker.
      const STEP_U = 5;
      const walk = (from, to) => {
        const du = toUnits({ x: to.x - from.x, y: to.y - from.y });
        const n = Math.max(1, Math.ceil(Math.hypot(du.x, du.y) / STEP_U));
        let last = from;
        for (let i = 1; i <= n; i++) {
          const o = { x: from.x + ((to.x - from.x) * i) / n, y: from.y + ((to.y - from.y) * i) / n };
          if (!free(o)) return { end: last, full: false };
          last = o;
        }
        return { end: to, full: true };
      };
      if (!free(cur)) return want; // already tangled (should not happen): never trap the sticker
      const direct = walk(cur, want);
      if (direct.full) return want;
      const dist = (o) => Math.hypot(o.x - want.x, o.y - want.y);
      // try sliding along each axis from the point where the direct path stopped
      let best = direct.end;
      for (const t of [{ x: want.x, y: direct.end.y }, { x: direct.end.x, y: want.y }]) {
        const w = walk(direct.end, t);
        if (dist(w.end) < dist(best)) best = w.end;
      }
      return best;
    },
  };
}
