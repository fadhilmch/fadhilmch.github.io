// Typing effect used by the subtitle under the page title.

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

// Subtitle under the title: types its line once with a caret.
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
