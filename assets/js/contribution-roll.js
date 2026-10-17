// About contribution roll: tap or hover a note to read its day, and play one scattered reveal on first view.
// describeDay is pure so Node tests can use it; the DOM wiring only runs in a browser.

const format = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

export function describeDay(date, count) {
  const n = Number(count);
  return `${format.format(new Date(`${date}T00:00:00Z`))} · ${n} ${n === 1 ? 'contribution' : 'contributions'}`;
}

function wire(roll) {
  const grid = roll.querySelector('[data-roll-grid]');
  const status = roll.querySelector('[data-roll-status]');
  const idle = status.textContent;
  let picked = null;

  const show = (note) => {
    picked?.classList.remove('is-picked');
    picked = note;
    note?.classList.add('is-picked');
    status.textContent = note ? describeDay(note.dataset.d, note.dataset.c) : idle;
  };
  grid.addEventListener('click', (event) => {
    const note = event.target.closest('.roll__note');
    show(note && note !== picked ? note : null);
  });
  grid.addEventListener('pointerover', (event) => {
    if (event.pointerType !== 'mouse') return;
    const note = event.target.closest('.roll__note');
    if (note) show(note);
  });
  grid.addEventListener('pointerleave', (event) => { if (event.pointerType === 'mouse') show(null); });

  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  // Stagger the reveal: each note pops at its week column's time plus a random
  // offset, so dots appear scattered but drift left to right.
  const STEP_MS = 18; // per week column
  const JITTER_MS = 140; // random spread, so neighbouring columns interleave
  roll.querySelectorAll('.roll__note').forEach((note) => {
    const wk = Number(note.closest('.roll__week')?.style.getPropertyValue('--wk')) || 0;
    note.style.animationDelay = `${wk * STEP_MS + Math.random() * JITTER_MS}ms`;
  });
  roll.classList.add('is-armed');
  const watcher = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    watcher.disconnect();
    roll.classList.replace('is-armed', 'is-playing');
  }, { threshold: 0.5 });
  watcher.observe(roll);
}

if (typeof document !== 'undefined') {
  const roll = document.querySelector('[data-roll]');
  if (roll) wire(roll);
}
