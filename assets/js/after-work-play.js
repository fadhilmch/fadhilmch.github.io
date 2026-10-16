// Drag the loose stickers around the After work board. They push each other softly, never move the Coffee and
// Cooking links or leave the board, and settle where you put them. A fresh page load resets everything.
// Mouse and pen drag at once; touch needs a short press so scrolling stays easy.
import { makeWorld, moveToward } from './after-work-physics.js';

export async function initPlay(stickers) {
  const board = stickers.parentElement;
  let layout; try { layout = JSON.parse(document.getElementById('aw-layout').textContent); } catch { return; }
  const shapes = await (await fetch(stickers.dataset.shapes)).json();
  const imgs = new Map([...stickers.querySelectorAll('.aw-item')].map((n) => [n.dataset.awId, n]));
  let bp = null, world = null;
  const build = () => {
    const next = board.clientWidth <= 660 ? 'mobile' : 'desktop';
    if (next === bp) return;
    bp = next; world = makeWorld(layout, shapes, bp);
    imgs.forEach((n) => { n.style.removeProperty('--ox'); n.style.removeProperty('--oy'); });
  };
  build();
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(build, 150); });

  const canvases = new WeakMap();
  const alphaAt = (img, x, y) => {
    let c = canvases.get(img);
    if (!c) {
      const cv = document.createElement('canvas'); cv.width = img.naturalWidth; cv.height = img.naturalHeight;
      c = cv.getContext('2d', { willReadFrequently: true }); c.drawImage(img, 0, 0); canvases.set(img, c);
    }
    const px = Math.floor(x / img.offsetWidth * img.naturalWidth), py = Math.floor(y / img.offsetHeight * img.naturalHeight);
    if (px < 0 || py < 0 || px >= img.naturalWidth || py >= img.naturalHeight) return 0;
    return c.getImageData(px, py, 1, 1).data[3];
  };
  const hit = (el, cx, cy) => {
    const img = el.tagName === 'IMG' ? el : el.querySelector('img');
    if (!img || !img.complete || !img.naturalWidth) return false;
    const r = img.getBoundingClientRect(), a = -(parseFloat(getComputedStyle(el).rotate) || 0) * Math.PI / 180;
    const dx = cx - (r.left + r.width / 2), dy = cy - (r.top + r.height / 2);
    return alphaAt(img, dx * Math.cos(a) - dy * Math.sin(a) + img.offsetWidth / 2, dx * Math.sin(a) + dy * Math.cos(a) + img.offsetHeight / 2) > 24;
  };
  const pick = (cx, cy) => world.bodies.filter((b) => b.movable)
    .map((b) => imgs.get(b.id)).filter((n) => n && getComputedStyle(n).display !== 'none')
    .sort((p, q) => (+getComputedStyle(q).zIndex || 0) - (+getComputedStyle(p).zIndex || 0))
    .find((n) => hit(n, cx, cy));

  const toBoard = (e) => { const r = stickers.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * world.board.w, (e.clientY - r.top) / r.height * world.board.h]; };
  const render = () => world.bodies.forEach((b) => {
    const n = imgs.get(b.id); if (!n || !b.movable) return;
    n.style.setProperty('--ox', b.ox.toFixed(2)); n.style.setProperty('--oy', b.oy.toFixed(2));
  });

  let drag = null, press = null;
  const start = (el, e) => {
    const body = world.bodies.find((b) => b.id === el.dataset.awId); if (!body) return;
    const [px, py] = toBoard(e);
    drag = { el, body, gx: px - body.ox, gy: py - body.oy, id: e.pointerId, pending: null, raf: 0 };
    stickers.dataset.awMoved = '1';
    el.classList.add('is-held'); stickers.classList.add('is-dragging');
    try { stickers.setPointerCapture(e.pointerId); } catch {}
  };
  const frame = () => {
    if (!drag) return;
    drag.raf = 0;
    if (drag.pending) { const [px, py] = drag.pending; moveToward(world, drag.body, px - drag.gx, py - drag.gy); render(); }
  };
  const end = () => {
    clearTimeout(press && press.timer); press = null;
    if (!drag) return;
    drag.el.classList.remove('is-held'); stickers.classList.remove('is-dragging');
    cancelAnimationFrame(drag.raf); drag = null;
  };
  stickers.addEventListener('pointerdown', (e) => {
    stickers.dataset.awMoved = '';
    if (e.button > 0 || e.target.closest('a')) return;
    const el = pick(e.clientX, e.clientY); if (!el) return;
    if (e.pointerType === 'touch') {
      press = { x: e.clientX, y: e.clientY, timer: setTimeout(() => { const p = press; press = null; if (p) start(el, e); }, 260) };
    } else { start(el, e); e.preventDefault(); }
  });
  stickers.addEventListener('pointermove', (e) => {
    if (press && Math.hypot(e.clientX - press.x, e.clientY - press.y) > 8) { clearTimeout(press.timer); press = null; }
    if (!drag || e.pointerId !== drag.id) return;
    drag.pending = toBoard(e);
    if (!drag.raf) drag.raf = requestAnimationFrame(frame);
  });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((t) => stickers.addEventListener(t, end));
  // once a touch drag has started, stop the page from scrolling under the finger
  document.addEventListener('touchmove', (e) => { if (drag) e.preventDefault(); }, { passive: false });
}
