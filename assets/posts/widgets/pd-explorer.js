(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const SVG = 'http://www.w3.org/2000/svg';
  function node(tag, attrs, text) {
    const el = document.createElementNS(SVG, tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    if (text !== undefined) el.textContent = text;
    return el;
  }
  function label(svg, x, y, text, anchor = 'middle', fill = 'var(--muted)') {
    svg.append(node('text', { x, y, 'text-anchor': anchor, fill, 'font-size': 15 }, text));
  }
  function reset(svg, title, desc) {
    svg.replaceChildren(node('title', { id: svg.id + '-title' }, title), node('desc', { id: svg.id + '-desc' }, desc));
    svg.setAttribute('aria-labelledby', svg.id + '-title ' + svg.id + '-desc');
  }
  const pct = (x, d = 1) => (100 * x).toFixed(d) + '%';
  function choose(n, k) { let c = 1; for (let i = 1; i <= k; i++) c = c * (n - i + 1) / i; return c; }
  function binomial(n, q) { return Array.from({ length: n + 1 }, (_, k) => choose(n, k) * q ** k * (1 - q) ** (n - k)); }
  function cdf(z) {
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const tail = Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI) * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
    return z < 0 ? tail : 1 - tail;
  }

  // 1. Law of large numbers: running share of even die rolls.
  (() => {
    const root = $('pb-lln'), chart = $('pb-lln-chart');
    let shares = [], evens = 0, last = null;
    const L = 60, R = 580, T = 30, B = 220;
    function draw() {
      const n = shares.length;
      reset(chart, 'Running share of even rolls', n ? 'After ' + n + ' rolls, ' + pct(evens / n) + ' were even.' : 'No rolls yet.');
      const span = Math.max(n, 10), x = i => L + (i / span) * (R - L), y = s => B - s * (B - T);
      [0, 0.25, 0.5, 0.75, 1].forEach(s => {
        chart.append(node('line', { x1: L, x2: R, y1: y(s), y2: y(s), stroke: 'var(--line)' }));
        label(chart, L - 8, y(s) + 5, (s * 100) + '%', 'end');
      });
      chart.append(node('line', { x1: L, x2: R, y1: y(0.5), y2: y(0.5), stroke: 'var(--muted)', 'stroke-dasharray': '6 5', 'stroke-width': 1.5 }));
      label(chart, R, y(0.5) - 12, 'true chance 50%', 'end');
      if (n) {
        const step = Math.max(1, Math.ceil(n / 700));
        let d = '';
        for (let i = 0; i < n; i += step) d += (d ? ' L' : 'M') + x(i + 1).toFixed(1) + ',' + y(shares[i]).toFixed(1);
        d += ' L' + x(n).toFixed(1) + ',' + y(shares[n - 1]).toFixed(1);
        chart.append(node('path', { d, fill: 'none', stroke: 'var(--l0)', 'stroke-width': 2.5, 'stroke-linejoin': 'round' }));
        chart.append(node('circle', { cx: x(n), cy: y(shares[n - 1]), r: 5, fill: 'var(--l0)' }));
      }
      chart.append(node('line', { x1: L, x2: R, y1: B, y2: B, stroke: 'var(--muted)' }));
      label(chart, L, B + 22, '0', 'middle'); label(chart, R, B + 22, span.toLocaleString('en-US'), 'end');
      label(chart, (L + R) / 2, B + 44, 'number of rolls so far');
      $('pb-lln-result').textContent = n
        ? 'Rolls: ' + n.toLocaleString('en-US') + '. Even: ' + evens.toLocaleString('en-US') + ' (' + pct(evens / n) + '). Last roll: ' + last + '.'
        : 'No rolls yet. Press a button to start.';
    }
    function roll(times) {
      for (let i = 0; i < times && shares.length < 50000; i++) {
        last = 1 + Math.floor(Math.random() * 6);
        if (last % 2 === 0) evens++;
        shares.push(evens / (shares.length + 1));
      }
      draw();
    }
    [1, 10, 100, 1000].forEach(t => $('pb-lln-' + t).addEventListener('click', () => roll(t)));
    $('pb-lln-reset').addEventListener('click', () => { shares = []; evens = 0; last = null; draw(); });
    draw(); root.hidden = false;
  })();

  // 2. Binomial: exact chances, expected value and simulated batches.
  (() => {
    const root = $('pb-binomial'), chart = $('pb-binomial-chart');
    let counts = [], batches = 0, last = null;
    function settings() { return [Number($('pb-n').value), Number($('pb-q').value) / 100]; }
    function draw() {
      const [n, q] = settings(), probs = binomial(n, q);
      $('pb-n-value').textContent = n; $('pb-q-value').textContent = Math.round(q * 100) + '%';
      reset(chart, 'Exact binomial chances and simulated frequencies', n + ' flips per batch, ' + Math.round(q * 100) + '% heads. Expected heads ' + (n * q).toFixed(2) + '. ' + batches + ' simulated batches.');
      const top = Math.max(...probs, ...counts.map(c => batches ? c / batches : 0)) * 1.08;
      const L = 60, R = 580, B = 225, T = 35, w = (R - L) / (n + 1);
      const x = k => L + k * w, y = p => B - p / top * (B - T);
      [0, 0.5, 1].forEach(f => {
        chart.append(node('line', { x1: L, x2: R, y1: y(top * f), y2: y(top * f), stroke: 'var(--line)' }));
        label(chart, L - 8, y(top * f) + 5, pct(top * f, 0), 'end');
      });
      for (let k = 0; k <= n; k++) {
        const g = node('g', { tabindex: 0 });
        g.append(node('title', {}, k + ' heads: exact ' + pct(probs[k], 2) + (batches ? '; simulated ' + pct(counts[k] / batches, 2) : '')));
        g.append(node('rect', { x: x(k) + Math.min(3, w * 0.15), y: y(probs[k]), width: Math.max(1, w - 2 * Math.min(3, w * 0.15)), height: B - y(probs[k]), fill: 'var(--l0)', opacity: 0.75, rx: 2 }));
        if (batches) g.append(node('circle', { cx: x(k) + w / 2, cy: y(counts[k] / batches), r: 4.5, fill: 'var(--l2)', stroke: 'var(--bg)', 'stroke-width': 1.5 }));
        chart.append(g);
        if (n <= 15 || k % 5 === 0) label(chart, x(k) + w / 2, B + 22, k);
      }
      const mx = L + (n * q + 0.5) * w;
      chart.append(node('line', { x1: mx, x2: mx, y1: T - 10, y2: B, stroke: 'var(--fg)', 'stroke-dasharray': '5 4', 'stroke-width': 1.5 }));
      label(chart, mx, T - 16, 'average ' + (n * q).toFixed(1), mx > 460 ? 'end' : mx < 140 ? 'start' : 'middle', 'var(--fg)');
      chart.append(node('line', { x1: L, x2: R, y1: B, y2: B, stroke: 'var(--muted)' }));
      label(chart, (L + R) / 2, B + 48, 'number of heads in one batch');
      $('pb-binomial-result').textContent = 'Expected heads: ' + (n * q).toFixed(2) + '. Standard deviation: ' + Math.sqrt(n * q * (1 - q)).toFixed(2) + ' heads. Simulated batches: ' + batches + '.' + (batches ? ' Last batch: ' + last + ' heads.' : '');
    }
    function clear() { counts = Array(Number($('pb-n').value) + 1).fill(0); batches = 0; last = null; draw(); }
    function simulate(times) {
      const [n, q] = settings();
      for (let i = 0; i < times; i++) { last = 0; for (let j = 0; j < n; j++) last += Math.random() < q ? 1 : 0; counts[last]++; batches++; }
      draw();
    }
    ['pb-n', 'pb-q'].forEach(id => $(id).addEventListener('input', clear));
    $('pb-sim-one').addEventListener('click', () => simulate(1));
    $('pb-sim-many').addEventListener('click', () => simulate(100));
    $('pb-reset').addEventListener('click', clear);
    clear(); root.hidden = false;
  })();

  // 3. Normal curve on a fixed axis, so moving and widening the bell is visible.
  (() => {
    const root = $('pb-normal'), chart = $('pb-normal-chart');
    const MIN = -7, MAX = 7, PEAK = 0.82, L = 40, R = 580, T = 30, B = 225;
    const x = v => L + (v - MIN) / (MAX - MIN) * (R - L);
    function draw(changed) {
      const mu = Number($('pb-mu').value), sigma = Number($('pb-sigma').value);
      let lo = Number($('pb-lo').value), hi = Number($('pb-hi').value);
      if (lo > hi) { if (changed === 'pb-lo') { $('pb-hi').value = lo; hi = lo; } else { $('pb-lo').value = hi; lo = hi; } }
      [['pb-mu', mu], ['pb-sigma', sigma], ['pb-lo', lo], ['pb-hi', hi]].forEach(([id, v]) => $(id + '-value').textContent = v);
      const dens = v => Math.exp(-0.5 * ((v - mu) / sigma) ** 2) / (sigma * Math.sqrt(2 * Math.PI));
      const y = v => B - dens(v) / PEAK * (B - T);
      const prob = lo === hi ? 0 : cdf((hi - mu) / sigma) - cdf((lo - mu) / sigma);
      reset(chart, 'A normal curve with a shaded range', 'Mean ' + mu + ', standard deviation ' + sigma + '. The range ' + lo + ' to ' + hi + ' holds ' + pct(prob) + ' of the area.');
      let d = 'M' + x(lo) + ',' + B;
      for (let i = 0; i <= 200; i++) { const v = lo + (hi - lo) * i / 200; d += ' L' + x(v).toFixed(1) + ',' + y(v).toFixed(1); }
      chart.append(node('path', { d: d + ' L' + x(hi) + ',' + B + ' Z', fill: 'var(--l0)', opacity: 0.25 }));
      d = '';
      for (let i = 0; i <= 500; i++) { const v = MIN + (MAX - MIN) * i / 500; d += (i ? ' L' : 'M') + x(v).toFixed(1) + ',' + y(v).toFixed(1); }
      chart.append(node('path', { d, fill: 'none', stroke: 'var(--l0)', 'stroke-width': 2.5 }));
      chart.append(node('line', { x1: L, x2: R, y1: B, y2: B, stroke: 'var(--muted)' }));
      chart.append(node('line', { x1: x(mu), x2: x(mu), y1: y(mu) - 6, y2: B, stroke: 'var(--muted)', 'stroke-dasharray': '5 5' }));
      [lo, hi].forEach(v => chart.append(node('line', { x1: x(v), x2: x(v), y1: T, y2: B, stroke: 'var(--l2)', 'stroke-width': 2 })));
      label(chart, (x(lo) + x(hi)) / 2, T - 8, pct(prob), 'middle', 'var(--fg)');
      for (let v = MIN; v <= MAX; v++) {
        chart.append(node('line', { x1: x(v), x2: x(v), y1: B, y2: B + 5, stroke: 'var(--muted)' }));
        if (Math.abs(v) % 2 === 1 || v === 0) label(chart, x(v), B + 22, v);
      }
      label(chart, (L + R) / 2, B + 48, 'value');
      $('pb-normal-result').textContent = 'Chance of landing between ' + lo + ' and ' + hi + ': ' + pct(prob, 2) + '. As z-scores, that range runs from ' + ((lo - mu) / sigma).toFixed(2) + ' to ' + ((hi - mu) / sigma).toFixed(2) + '. Curve height at the mean: ' + dens(mu).toFixed(3) + ' (a density, not a chance).';
    }
    ['pb-mu', 'pb-sigma', 'pb-lo', 'pb-hi'].forEach(id => $(id).addEventListener('input', () => draw(id)));
    $('pb-normal-reset').addEventListener('click', () => { [['pb-mu', 0], ['pb-sigma', 1], ['pb-lo', -1], ['pb-hi', 1]].forEach(([id, v]) => $(id).value = v); draw(); });
    draw(); root.hidden = false;
  })();

  // 4. Central limit theorem: fraction of heads in a batch, on a fixed 0..1 axis.
  (() => {
    const root = $('pb-clt'), chart = $('pb-clt-chart');
    const SIZES = [1, 2, 5, 10, 30, 100, 200, 400], L = 60, R = 580, T = 30, B = 225;
    const x = f => L + f * (R - L);
    function draw() {
      const n = SIZES[Number($('pb-clt-n').value)], q = Number($('pb-clt-q').value) / 100;
      $('pb-clt-n-value').textContent = n; $('pb-clt-q-value').textContent = Math.round(q * 100) + '%';
      const probs = binomial(n, q), se = Math.sqrt(q * (1 - q) / n);
      const bell = f => Math.exp(-0.5 * ((f - q) / se) ** 2) / (se * Math.sqrt(2 * Math.PI)) / n;
      const top = Math.max(...probs, bell(q)) * 1.08, y = p => B - p / top * (B - T);
      reset(chart, 'Distribution of the fraction of heads in a batch', n + ' flips per batch at ' + Math.round(q * 100) + '% heads. Standard error ' + pct(se) + '.');
      const w = Math.max(1.2, Math.min(36, (R - L) / (n + 1) * 0.8));
      probs.forEach((p, k) => {
        if (p < top * 0.002) return;
        const g = node('g', { tabindex: 0 });
        g.append(node('title', {}, k + ' of ' + n + ' heads (' + pct(k / n) + '): chance ' + pct(p, 2)));
        g.append(node('rect', { x: x(k / n) - w / 2, y: y(p), width: w, height: B - y(p), fill: 'var(--l0)', opacity: 0.75 }));
        chart.append(g);
      });
      let d = '';
      for (let i = 0; i <= 400; i++) { const f = i / 400; d += (i ? ' L' : 'M') + x(f).toFixed(1) + ',' + Math.max(T - 20, y(bell(f))).toFixed(1); }
      chart.append(node('path', { d, fill: 'none', stroke: 'var(--l3)', 'stroke-width': 2.5, 'stroke-dasharray': '7 5' }));
      chart.append(node('line', { x1: L, x2: R, y1: B, y2: B, stroke: 'var(--muted)' }));
      [0, 0.25, 0.5, 0.75, 1].forEach(f => label(chart, x(f), B + 22, pct(f, 0)));
      label(chart, (L + R) / 2, B + 48, 'fraction of heads in one batch');
      const lo = Math.max(0, q - 1.96 * se), hi = Math.min(1, q + 1.96 * se);
      $('pb-clt-result').textContent = 'Batches of ' + n + ': centre ' + pct(q, 0) + ', standard error ' + (100 * se).toFixed(1) + ' percentage points. About 95% of batches land between ' + pct(lo, 0) + ' and ' + pct(hi, 0) + (n < 30 || n * Math.min(q, 1 - q) < 10 ? ' (the bell is still a rough fit here).' : '.');
    }
    ['pb-clt-n', 'pb-clt-q'].forEach(id => $(id).addEventListener('input', draw));
    draw(); root.hidden = false;
  })();
})();

