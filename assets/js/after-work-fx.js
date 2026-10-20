// Sticker effects for the gateway: staggered entrance, click shake (with outline-accurate hit test for
// decorations) and a light-direction 3D feel that follows the pointer. All effects are off for reduced motion.
export function initFx(stickers) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const items = [...stickers.querySelectorAll('.aw-item')];
  items.forEach((n, i) => n.style.setProperty('--i', i));
  // has-fx is set in the HTML so the entrance is armed at first paint; drop it when effects are off.
  if (reduce || stickers.classList.contains('aw-editing')) { stickers.classList.remove('has-fx'); return; }
  stickers.classList.add('has-fx');
  // The entrance only runs once. Without this, the pop animation restarts (from invisible) when a shake ends.
  setTimeout(() => stickers.classList.add('fx-ready'), 120 + items.length * 55 + 700);

  const shake = (el) => { stickers.classList.add('fx-ready'); el.classList.remove('is-shaking'); void el.offsetWidth; el.classList.add('is-shaking'); };
  items.forEach((n) => n.addEventListener('animationend', (e) => { if (e.animationName === 'aw-shake') n.classList.remove('is-shaking'); }));
  stickers.querySelectorAll('a.aw-sticker').forEach((a) => a.addEventListener('click', () => shake(a)));

  const canvases = new WeakMap();
  const alphaAt = (img, x, y) => {
    let c = canvases.get(img);
    if (!c) {
      const cv = document.createElement('canvas'); cv.width = img.naturalWidth; cv.height = img.naturalHeight;
      const ctx = cv.getContext('2d', { willReadFrequently: true }); ctx.drawImage(img, 0, 0); c = ctx; canvases.set(img, c);
    }
    const px = Math.floor(x / img.offsetWidth * img.naturalWidth), py = Math.floor(y / img.offsetHeight * img.naturalHeight);
    if (px < 0 || py < 0 || px >= img.naturalWidth || py >= img.naturalHeight) return 0;
    return c.getImageData(px, py, 1, 1).data[3];
  };
  const hit = (el, cx, cy) => {
    const img = el.tagName === 'IMG' ? el : el.querySelector('img');
    if (!img || !img.complete || !img.naturalWidth) return false;
    const r = img.getBoundingClientRect();
    const deg = parseFloat(getComputedStyle(el).rotate) || 0, a = -deg * Math.PI / 180;
    const mx = r.left + r.width / 2, my = r.top + r.height / 2;
    const dx = cx - mx, dy = cy - my;
    const lx = dx * Math.cos(a) - dy * Math.sin(a) + img.offsetWidth / 2;
    const ly = dx * Math.sin(a) + dy * Math.cos(a) + img.offsetHeight / 2;
    return alphaAt(img, lx, ly) > 24;
  };
  stickers.addEventListener('pointerdown', (e) => {
    if (e.target.closest('a')) return;
    const stack = items.filter((n) => !n.matches('a') && getComputedStyle(n).display !== 'none')
      .sort((p, q) => (+getComputedStyle(q).zIndex || 0) - (+getComputedStyle(p).zIndex || 0));
    const top = stack.find((n) => hit(n, e.clientX, e.clientY));
    if (!top) return;
    // A tap shakes the sticker; picking it up and dragging does not (after-work-play.js sets awMoved).
    const done = () => { stickers.removeEventListener('pointerup', done); if (!stickers.dataset.awMoved) shake(top); };
    stickers.addEventListener('pointerup', done);
  });

  if (matchMedia('(hover: hover)').matches) {
    const board = stickers.parentElement;
    board.addEventListener('pointermove', (e) => {
      const r = board.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width * 2 - 1, y = (e.clientY - r.top) / r.height * 2 - 1;
      stickers.style.setProperty('--px', x.toFixed(3)); stickers.style.setProperty('--py', y.toFixed(3));
    });
    board.addEventListener('pointerleave', () => { stickers.style.setProperty('--px', 0); stickers.style.setProperty('--py', 0); });
  }
}
