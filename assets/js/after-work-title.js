// Title entrance: each letter of "After work" churns through symbols, then resolves left to right
// and cools from mint to its normal colour. Runs once on load. Skipped with reduced motion.
// The heading keeps its plain text for screen readers through aria-label.
const SYMBOLS = '>_*/+=<~';
const STAGGER = 70, CHURN = 380, COOL = 350;

export function initTitle(h1, { reduce = matchMedia('(prefers-reduced-motion: reduce)').matches } = {}) {
  if (reduce) return;
  h1.setAttribute('aria-label', h1.textContent.replace('↙', '').replace(/\s+/g, ' ').trim());
  const cells = [];
  const wrap = (node) => {
    [...node.childNodes].forEach((c) => {
      if (c.nodeType === 3) {
        const frag = document.createDocumentFragment();
        for (const ch of c.textContent) {
          if (/\s/.test(ch)) { frag.append(ch); continue; }
          const i = document.createElement('i');
          i.setAttribute('aria-hidden', 'true');
          i.textContent = i.dataset.c = ch;
          cells.push(i); frag.append(i);
        }
        c.replaceWith(frag);
      } else if (c.nodeType === 1 && !c.hasAttribute('aria-hidden')) wrap(c);
    });
  };
  wrap(h1);
  cells.forEach((i) => { i.style.width = i.getBoundingClientRect().width + 'px'; });
  const t0 = performance.now();
  const step = (t) => {
    const e = t - t0; let busy = false;
    cells.forEach((i, n) => {
      const start = n * STAGGER, end = start + CHURN;
      if (e < start) { i.textContent = SYMBOLS[(n * 7) % SYMBOLS.length]; i.style.opacity = '.35'; busy = true; }
      else if (e < end) { i.textContent = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]; i.style.opacity = '.9'; i.style.color = '#9be6b8'; busy = true; }
      else {
        i.textContent = i.dataset.c; i.style.opacity = '';
        if (e - end < COOL) { i.style.color = '#9be6b8'; busy = true; } else i.style.color = '';
      }
    });
    if (busy) requestAnimationFrame(step);
    else cells.forEach((i) => { i.style.width = ''; });
  };
  requestAnimationFrame(step);
}
