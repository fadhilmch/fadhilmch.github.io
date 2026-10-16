// Visitor "Play" mode: drag the avatar and the decorations around, then Reset.
// Coffee and Cooking stay put so a drag can never open a page. Nothing is saved.
const PLAYABLE = '.aw-avatar, .aw-deco';
const MOVE_THRESHOLD = 5;

export function initPlay(stickers, playButton, resetButton) {
  const items = [...stickers.querySelectorAll(PLAYABLE)];
  const offsets = new Map(items.map((el) => [el, { x: 0, y: 0 }]));
  let z = 20;

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
      if (r.left + px < board.left - 20) nx = cur.x + (board.left - 20 - r.left) / board.width;
      if (r.right + px > board.right + 20) nx = cur.x + (board.right + 20 - r.right) / board.width;
      if (r.top + py < board.top) ny = cur.y + (board.top - r.top) / board.width;
      if (r.bottom + py > board.bottom) ny = cur.y + (board.bottom - r.bottom) / board.width;
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
