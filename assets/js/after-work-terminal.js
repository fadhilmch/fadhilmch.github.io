// The laptop sticker: hover, click, Enter or Space types a line on a small terminal chip.
export const LINE = '> git push && go home';

// Types `line` through `setText`. Returns a cancel function. With reduced motion the text appears at once.
export function typeLine(line, setText, { reduce = false, delay = 70, schedule = setInterval, cancel = clearInterval } = {}) {
  if (reduce) { setText(line); return () => {}; }
  let i = 0;
  setText('');
  const id = schedule(() => {
    setText(line.slice(0, ++i));
    if (i >= line.length) cancel(id);
  }, delay);
  return () => cancel(id);
}

export function initTerminal(stickers, laptop) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const chip = document.createElement('span');
  chip.className = 'aw-bubble';
  chip.setAttribute('role', 'status');
  stickers.append(chip);
  let stop = () => {};
  const place = () => {
    const b = stickers.getBoundingClientRect(), l = laptop.getBoundingClientRect();
    const left = Math.min(Math.max(l.left - b.left, 0), Math.max(0, b.width - chip.offsetWidth));
    chip.style.left = left + 'px';
    chip.style.top = Math.max(0, l.top - b.top - chip.offsetHeight - 6) + 'px';
  };
  const run = () => {
    stop();
    laptop.classList.add('is-on');
    chip.classList.add('on');
    stop = typeLine(LINE, (t) => { chip.textContent = t; place(); }, { reduce });
  };
  laptop.addEventListener('mouseenter', () => { if (!laptop.classList.contains('is-on')) run(); });
  laptop.addEventListener('click', (e) => { if (laptop.dataset.dragged) { e.stopImmediatePropagation(); return; } run(); });
  laptop.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); run(); }
  });
}

// Subtitle under the title: types its line once with a caret, in the same style as the laptop chip.
// Screen readers get the line from the start. Reduced motion shows it at once.
export function initSubtitle(p) {
  const text = p.textContent.trim();
  p.setAttribute('aria-label', text);
  const out = document.createElement('span');
  out.setAttribute('aria-hidden', 'true');
  out.className = 'aw-typed';
  p.textContent = '';
  p.append(out);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) { out.textContent = '> ' + text; return; }
  p.classList.add('is-typing');
  typeLine('> ' + text, (v) => { out.textContent = v; }, {
    delay: 45, cancel: (id) => { clearInterval(id); setTimeout(() => p.classList.remove('is-typing'), 900); },
  });
}
