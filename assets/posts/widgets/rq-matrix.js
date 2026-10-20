(() => {
  'use strict';
  const root = document.getElementById('rq-matrix');
  if (!root) return;
  // Recall@10 (%) and MRR per cell, recomputed per knowledge base and question language.
  const STEPS = [
    { label: '1 Hybrid', note: 'Keyword and vector search fused, no reranker. Swedish questions find their pages but rank them low: MRR 0.17.',
      all: [84.0, 0.593, 10.0], cells: { 'SE-en': [94.5, 0.691], 'SE-sw': [90.0, 0.170], 'SE-in': [90.0, 0.372], 'PL-en': [79.3, 0.654], 'PL-po': [85.0, 0.576], 'US-en': [67.8, 0.575] } },
    { label: '2 + reranker', note: 'The reranker lifts ranking almost everywhere, and costs Swedish questions 20 points of recall.',
      all: [83.5, 0.711, 10.0], cells: { 'SE-en': [93.5, 0.828], 'SE-sw': [70.0, 0.447], 'SE-in': [100.0, 0.782], 'PL-en': [82.0, 0.756], 'PL-po': [80.0, 0.710], 'US-en': [68.6, 0.522] } },
    { label: '3 + threshold, filter', note: 'A score threshold and a country filter: 7.9 documents instead of 10, for half a point of recall.',
      all: [83.0, 0.715, 7.9], cells: { 'SE-en': [94.5, 0.843], 'SE-sw': [65.0, 0.437], 'SE-in': [100.0, 0.782], 'PL-en': [82.0, 0.762], 'PL-po': [80.0, 0.710], 'US-en': [66.1, 0.512] } },
    { label: '4 − country name', note: 'The country name is no longer appended to the query. Every non-English cell drops. English cells hold.',
      all: [81.0, 0.700, 6.8], cells: { 'SE-en': [94.0, 0.816], 'SE-sw': [55.0, 0.392], 'SE-in': [85.0, 0.738], 'PL-en': [83.3, 0.761], 'PL-po': [75.0, 0.667], 'US-en': [65.3, 0.529] } },
    { label: '5 + translation', note: 'Configuration used for chat: English and country-language translations, merged by max score.',
      all: [85.5, 0.705, 6.4], cells: { 'SE-en': [93.5, 0.784], 'SE-sw': [100.0, 0.665], 'SE-in': [100.0, 0.701], 'PL-en': [83.3, 0.762], 'PL-po': [85.0, 0.654], 'US-en': [65.3, 0.532] } },
    { label: '6 + HyDE', note: 'A HyDE passage as a third path: 0.6 points more overall, for 2.4 times the retrieval latency.',
      all: [86.1, 0.706, 7.4], cells: { 'SE-en': [94.0, 0.771], 'SE-sw': [100.0, 0.664], 'SE-in': [100.0, 0.717], 'PL-en': [82.7, 0.749], 'PL-po': [85.0, 0.671], 'US-en': [67.8, 0.561] } }
  ];
  const stepBar = root.querySelector('[aria-label="Configuration"]');
  const metricButtons = Array.from(root.querySelectorAll('[data-metric]'));
  const playButton = root.querySelector('.rq-play');
  const note = root.querySelector('.rq-note');
  const cells = Array.from(root.querySelectorAll('td[data-cell]'));
  const sums = { recall: root.querySelector('[data-sum="recall"]'), mrr: root.querySelector('[data-sum="mrr"]'), docs: root.querySelector('[data-sum="docs"]') };
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let step = 4, metric = 'recall', timer = 0;

  const stepButtons = STEPS.map((s, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = s.label;
    b.addEventListener('click', () => { stop(); show(i); });
    stepBar.appendChild(b);
    return b;
  });

  const value = (pair) => metric === 'recall' ? pair[0] : pair[1];
  const format = (v) => metric === 'recall' ? v.toFixed(1) + '%' : v.toFixed(3);
  // Shade by value: recall 50..100% or MRR 0.1..0.9 maps to 6..56% of the accent colour.
  const shade = (v) => {
    const t = metric === 'recall' ? (v - 50) / 50 : (v - 0.1) / 0.8;
    return (6 + 50 * Math.max(0, Math.min(1, t))).toFixed(1) + '%';
  };

  function show(i) {
    step = i;
    const cur = STEPS[i], prev = i > 0 ? STEPS[i - 1] : null;
    stepButtons.forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
    note.textContent = cur.note;
    cells.forEach(td => {
      const key = td.dataset.cell;
      const v = value(cur.cells[key]);
      td.style.setProperty('--p', shade(v));
      td.querySelector('.rq-val').textContent = format(v);
      td.title = key + ': ' + format(v);
      const d = td.querySelector('.rq-delta');
      d.className = 'rq-delta';
      if (!prev) { d.textContent = ''; return; }
      const diff = v - value(prev.cells[key]);
      const small = metric === 'recall' ? Math.abs(diff) < 0.05 : Math.abs(diff) < 0.0005;
      if (small) { d.textContent = 'no change'; return; }
      d.classList.add(diff > 0 ? 'up' : 'down');
      d.textContent = metric === 'recall' ? Math.abs(diff).toFixed(1) + ' pts' : Math.abs(diff).toFixed(3);
    });
    sums.recall.textContent = cur.all[0].toFixed(1) + '%';
    sums.mrr.textContent = cur.all[1].toFixed(3);
    sums.docs.textContent = cur.all[2].toFixed(1);
  }

  function stop() { clearInterval(timer); timer = 0; playButton.textContent = 'Play'; }
  playButton.addEventListener('click', () => {
    if (timer) { stop(); return; }
    show(0);
    playButton.textContent = 'Pause';
    timer = setInterval(() => {
      if (step >= STEPS.length - 1) { stop(); return; }
      show(step + 1);
    }, reduced ? 3000 : 2200);
  });
  metricButtons.forEach(b => b.addEventListener('click', () => {
    metric = b.dataset.metric;
    metricButtons.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    show(step);
  }));

  root.classList.add('is-live');
  show(step);
})();

