(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const SVG = 'http://www.w3.org/2000/svg';
  function svg(tag, attrs, text) {
    const el = document.createElementNS(SVG, tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    if (text !== undefined) el.textContent = text;
    return el;
  }
  function label(chart, x, y, text, anchor = 'middle', fill = 'var(--muted)') {
    chart.append(svg('text', { x, y, 'text-anchor': anchor, fill, 'font-size': 14 }, text));
  }
  function reset(chart, title, desc) {
    chart.replaceChildren(svg('title', { id: chart.id + '-title' }, title), svg('desc', { id: chart.id + '-desc' }, desc));
    chart.setAttribute('aria-labelledby', chart.id + '-title ' + chart.id + '-desc');
  }
  const pct = (x, d = 1) => (100 * x).toFixed(d) + '%';
  const fmtP = p => p < 0.0001 ? '< 0.0001' : '= ' + p.toFixed(4);
  // Normal CDF approximation (absolute error < 8e-8).
  function normalCDF(x) {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const tail = Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI) * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
    return x < 0 ? tail : 1 - tail;
  }
  function normalQuantile(p) {
    let lo = -9, hi = 9;
    for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2; if (normalCDF(mid) < p) lo = mid; else hi = mid; }
    return (lo + hi) / 2;
  }
  // Ways to get k heads in 10 fair flips, out of 1,024.
  const ways = [1, 10, 45, 120, 210, 252, 210, 120, 45, 10, 1];
  const edge = k => Math.abs(k - 5) >= 3;

  // 1. Build the ten-flip distribution one trial at a time.
  (() => {
    const root = $('pv-build');
    const model = ways.map(w => w / 1024);
    let counts = Array(11).fill(0), current = [], total = 0, timer = null, target = 0;
    const cells = model.map((p, k) => {
      const cell = document.createElement('div'); cell.className = 'build-cell' + (edge(k) ? ' edge' : '');
      const track = document.createElement('div'); track.className = 'build-track';
      const bar = document.createElement('div'); bar.className = 'build-bar';
      const mark = document.createElement('div'); mark.className = 'build-model';
      track.append(bar, mark);
      const name = document.createElement('span'); name.textContent = k;
      const count = document.createElement('span'); count.className = 'build-count';
      cell.append(track, name, count);
      $('build-chart').append(cell);
      return { cell, bar, mark, count };
    });
    function draw(announce) {
      $('build-flips').replaceChildren(...Array.from({ length: 10 }, (_, i) => {
        const s = document.createElement('span'); s.textContent = current[i] || '·';
        if (current[i] === 'H') s.className = 'heads';
        return s;
      }));
      const shares = counts.map(c => total ? c / total : 0);
      const top = Math.max(0.3, ...shares) * 1.05;
      $('build-scale').textContent = 'Bar height: share of finished trials. Top of chart = ' + pct(top, 0) + '.';
      cells.forEach(({ cell, bar, mark, count }, k) => {
        bar.style.height = (shares[k] / top * 100) + '%';
        mark.style.bottom = (model[k] / top * 100) + '%';
        count.textContent = counts[k];
        cell.title = k + ' heads: ' + counts[k] + ' trials (' + pct(shares[k]) + '); fair-coin chance ' + pct(model[k]);
      });
      $('build-chart').setAttribute('aria-label', 'Finished trials: ' + total + '. ' + counts.map((c, k) => k + ' heads: ' + c).join('; ') + '.');
      if (!announce) return;
      const lopsided = counts.reduce((s, c, k) => s + (edge(k) ? c : 0), 0);
      const heads = current.filter(x => x === 'H').length;
      $('build-status').textContent = total
        ? 'Finished trials: ' + total.toLocaleString('en-US') + '. Trials with 8 or more heads, or 2 or fewer: ' + lopsided + ' (' + pct(lopsided / total) + '). The exact fair-coin answer is 10.9%.' + (current.length && current.length < 10 ? ' Current trial: ' + current.length + ' flips, ' + heads + ' heads.' : '')
        : 'No finished trials yet. Flip ten times, or press Play.';
    }
    function flip() {
      if (current.length === 10) current = [];
      current.push(Math.random() < 0.5 ? 'H' : 'T');
      if (current.length === 10) { counts[current.filter(x => x === 'H').length]++; total++; }
      draw(!timer || current.length === 10);
      if (timer && total >= target) stop();
    }
    function stop() {
      if (timer) clearInterval(timer);
      timer = null;
      ['build-play', 'build-step', 'build-fast'].forEach(id => $(id).disabled = false);
      $('build-pause').disabled = true;
      draw(true);
    }
    $('build-step').addEventListener('click', flip);
    $('build-play').addEventListener('click', () => {
      target = total + 100;
      ['build-play', 'build-step', 'build-fast'].forEach(id => $(id).disabled = true);
      $('build-pause').disabled = false;
      timer = setInterval(flip, 25);
    });
    $('build-pause').addEventListener('click', stop);
    $('build-fast').addEventListener('click', () => {
      for (let t = 0; t < 1000; t++) { let h = 0; for (let i = 0; i < 10; i++) h += Math.random() < 0.5 ? 1 : 0; counts[h]++; total++; }
      current = [];
      draw(true);
    });
    $('build-reset').addEventListener('click', () => { stop(); counts = Array(11).fill(0); current = []; total = 0; draw(true); });
    document.addEventListener('visibilitychange', () => { if (document.hidden && timer) stop(); });
    draw(true); root.hidden = false;
  })();

  // 2. Exact coin p-value: click a result, see which bars count.
  (() => {
    const root = $('pv-coin'), heads = $('pv-heads'), sided = $('pv-sided');
    const bars = ways.map((w, k) => {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'pv-bar';
      button.setAttribute('aria-label', k + ' heads, chance ' + pct(w / 1024, 2) + '. Use as my result.');
      const bar = document.createElement('span'); bar.style.height = (w / 252 * 140) + 'px'; bar.setAttribute('aria-hidden', 'true');
      const name = document.createElement('small'); name.textContent = k;
      button.append(bar, name);
      button.addEventListener('click', () => { heads.value = k; update(); });
      $('pv-bars').append(button);
      return button;
    });
    function update() {
      const h = Number(heads.value), mode = sided.value;
      $('pv-heads-value').textContent = h;
      const counted = ways.map((_, k) => mode === 'upper' ? k >= h : Math.abs(k - 5) >= Math.abs(h - 5));
      bars.forEach((bar, k) => { bar.dataset.tail = counted[k]; bar.setAttribute('aria-pressed', k === h ? 'true' : 'false'); });
      const n = ways.reduce((s, w, k) => s + (counted[k] ? w : 0), 0), p = n / 1024;
      $('pv-coin-result').textContent = 'Counted: ' + counted.flatMap((yes, k) => yes ? [k] : []).join(', ') + ' heads. That is ' + n + ' of 1,024 orders, so p ' + fmtP(p) + ' (' + pct(p) + '). ' + (p < 0.05 ? 'Below 5%: significant.' : 'Not below 5%: not significant.');
    }
    heads.addEventListener('input', update); sided.addEventListener('change', update);
    $('pv-flip').addEventListener('click', () => { heads.value = Array.from({ length: 10 }, () => Math.random() < 0.5 ? 1 : 0).reduce((a, b) => a + b, 0); update(); });
    update(); root.hidden = false;
  })();

  // 3. Permutation test for the button: deal 2,080 buyers into two groups of 10,000.
  (() => {
    const root = $('pv-shuffle'), chart = $('pv-shuffle-chart');
    const N = 10000, BUYERS = 2080, OBS = 80; // differences are kept as (B buyers - A buyers), so 80 = 0.8 points
    const SE = Math.sqrt(0.104 * 0.896 * 2 / N) * 100; // pooled SE in percentage points
    let inner = Array(40).fill(0), outer = Array(40).fill(0), total = 0, extreme = 0, last = null;
    const bin = m => Math.min(39, Math.max(0, Math.floor((m + 200) / 10))); // 0.1-point bins from -2.0 to +2.0
    function shuffleOnce() {
      let left = BUYERS, pool = 2 * N, b = 0;
      for (let i = 0; i < N; i++) { if (Math.random() * pool < left) { b++; left--; } pool--; }
      const m = b - (BUYERS - b);
      (Math.abs(m) >= OBS ? outer : inner)[bin(m)]++;
      if (Math.abs(m) >= OBS) extreme++;
      total++;
      last = { a: BUYERS - b, b, m };
    }
    function draw() {
      const L = 50, R = 620, T = 30, B = 230, x = v => L + (v + 2) / 4 * (R - L), w = (R - L) / 40;
      const bell = document.getElementById('pv-sh-bell').checked;
      const expected = v => total * 0.1 * Math.exp(-0.5 * (v / SE) ** 2) / (SE * Math.sqrt(2 * Math.PI));
      const top = Math.max(5, ...inner.map((c, i) => c + outer[i]), bell ? expected(0) : 0) * 1.1;
      const y = c => B - c / top * (B - T);
      reset(chart, 'Differences from shuffled labels', total + ' shuffles. ' + extreme + ' were at least 0.8 points from zero (' + (total ? pct(extreme / total) : '0%') + ').');
      for (let i = 0; i < 40; i++) {
        const c1 = inner[i], c2 = outer[i];
        if (!c1 && !c2) continue;
        const g = svg('g', { tabindex: 0 });
        const lo = (i * 10 - 200) / 100;
        g.append(svg('title', {}, lo.toFixed(1) + ' to ' + (lo + 0.1).toFixed(1) + ' points: ' + (c1 + c2) + ' shuffles'));
        if (c2) g.append(svg('rect', { x: L + i * w + 1, y: y(c1 + c2), width: w - 2, height: B - y(c2), fill: 'var(--l0)' }));
        if (c1) g.append(svg('rect', { x: L + i * w + 1, y: y(c1), width: w - 2, height: B - y(c1), fill: 'var(--muted)', 'fill-opacity': 0.3, stroke: 'var(--muted)', 'stroke-width': 0.6 }));
        chart.append(g);
      }
      if (bell && total) {
        let d = '';
        for (let i = 0; i <= 200; i++) { const v = -2 + 4 * i / 200; d += (i ? ' L' : 'M') + x(v).toFixed(1) + ',' + y(expected(v)).toFixed(1); }
        chart.append(svg('path', { d, fill: 'none', stroke: 'var(--l3)', 'stroke-width': 2.5 }));
      }
      [-0.8, 0.8].forEach(v => chart.append(svg('line', { x1: x(v), x2: x(v), y1: T - 6, y2: B, stroke: 'var(--fg)', 'stroke-dasharray': '5 4', 'stroke-width': 1.5 })));
      label(chart, x(0.8) + 6, T + 4, 'real +0.8', 'start', 'var(--fg)');
      label(chart, x(-0.8) - 6, T + 4, 'mirror −0.8', 'end', 'var(--fg)');
      chart.append(svg('line', { x1: L, x2: R, y1: B, y2: B, stroke: 'var(--muted)' }));
      [-2, -1, 0, 1, 2].forEach(v => label(chart, x(v), B + 22, (v > 0 ? '+' : '') + v));
      label(chart, (L + R) / 2, B + 48, 'shuffled B − A, percentage points');
      const lastText = last ? ' Last shuffle: A ' + last.a.toLocaleString('en-US') + ' buyers, B ' + last.b.toLocaleString('en-US') + ', difference ' + (last.m >= 0 ? '+' : '') + (last.m / 100).toFixed(2) + ' points.' : '';
      $('pv-shuffle-result').textContent = total
        ? 'Shuffles: ' + total.toLocaleString('en-US') + '. At least 0.8 points from zero: ' + extreme.toLocaleString('en-US') + ', so the simulated p-value is ' + pct(extreme / total) + '.' + lastText
        : 'No shuffles yet. Start with one, then do a thousand.';
    }
    function run(times) { for (let i = 0; i < times && total < 50000; i++) shuffleOnce(); draw(); }
    [1, 100, 1000].forEach(t => $('pv-sh-' + t).addEventListener('click', () => run(t)));
    $('pv-sh-reset').addEventListener('click', () => { inner = Array(40).fill(0); outer = Array(40).fill(0); total = 0; extreme = 0; last = null; draw(); });
    $('pv-sh-bell').addEventListener('change', draw);
    draw(); root.hidden = false;
  })();

  // 4. Power: null and alternative sampling distributions on a fixed axis.
  (() => {
    const root = $('pv-power'), chart = $('pv-power-chart');
    const MIN = -4, MAX = 4, L = 50, R = 650, T = 30, B = 220;
    const x = v => L + (Math.min(MAX, Math.max(MIN, v)) - MIN) / (MAX - MIN) * (R - L);
    function model(a, lift, n, alpha) {
      const b = a + lift, pooled = (a + b) / 2;
      const se0 = Math.sqrt(2 * pooled * (1 - pooled) / n), se1 = Math.sqrt((a * (1 - a) + b * (1 - b)) / n);
      const cut = normalQuantile(1 - alpha / 2) * se0;
      return { se0, se1, cut, power: normalCDF((-cut - lift) / se1) + normalCDF((lift - cut) / se1) };
    }
    function update() {
      const a = Number($('pv-baseline').value) / 100, lift = Number($('pv-lift').value) / 100;
      const n = Number($('pv-n').value), alpha = Number($('pv-alpha').value);
      const m = model(a, lift, n, alpha);
      $('pv-baseline-value').textContent = pct(a);
      $('pv-lift-value').textContent = (lift >= 0 ? '+' : '') + (100 * lift).toFixed(1) + ' points';
      $('pv-n-value').textContent = n.toLocaleString('en-US');
      reset(chart, 'Where measured lifts land, with and without a real effect', 'No-effect curve centred on 0, true-lift curve centred on ' + (100 * lift).toFixed(1) + ' points. Cut-offs at plus and minus ' + (100 * m.cut).toFixed(2) + ' points. Power ' + pct(m.power) + '.');
      // Work in percentage points from here on.
      const s0 = 100 * m.se0, s1 = 100 * m.se1, mu = 100 * lift, cut = 100 * m.cut;
      const pdf = (v, mean, s) => Math.exp(-0.5 * ((v - mean) / s) ** 2) / s;
      const top = 1.08 / Math.min(s0, s1), y = d => B - d / top * (B - T);
      function shade(from, to) {
        const lo = Math.max(MIN, from), hi = Math.min(MAX, to);
        if (lo >= hi) return;
        let d = 'M' + x(lo) + ',' + B;
        for (let i = 0; i <= 150; i++) { const v = lo + (hi - lo) * i / 150; d += ' L' + x(v).toFixed(1) + ',' + y(pdf(v, mu, s1)).toFixed(1); }
        chart.append(svg('path', { d: d + ' L' + x(hi) + ',' + B + ' Z', fill: 'var(--l3)', opacity: 0.3 }));
      }
      shade(MIN, -cut); shade(cut, MAX);
      function curve(mean, s, colour) {
        let d = '';
        for (let i = 0; i <= 400; i++) { const v = MIN + (MAX - MIN) * i / 400; d += (i ? ' L' : 'M') + x(v).toFixed(1) + ',' + y(pdf(v, mean, s)).toFixed(1); }
        chart.append(svg('path', { d, fill: 'none', stroke: colour, 'stroke-width': 2.5 }));
      }
      chart.append(svg('line', { x1: L, x2: R, y1: B, y2: B, stroke: 'var(--muted)' }));
      [-cut, cut].forEach(c => { if (c > MIN && c < MAX) chart.append(svg('line', { x1: x(c), x2: x(c), y1: T - 10, y2: B, stroke: 'var(--muted)', 'stroke-dasharray': '5 4' })); });
      curve(0, s0, 'var(--l0)'); curve(mu, s1, 'var(--l3)');
      label(chart, R, T - 12, 'shaded purple = power = ' + pct(m.power, 0), 'end', 'var(--l3)');
      for (let v = MIN; v <= MAX; v++) label(chart, x(v), B + 22, (v > 0 ? '+' : '') + v);
      label(chart, (L + R) / 2, B + 48, 'measured lift in one experiment, percentage points');
      $('pv-power-result').textContent = 'Power: ' + pct(m.power) + '. A result needs to be more than ' + cut.toFixed(2) + ' points away from zero to count as significant at α = ' + pct(alpha, 0) + '. Typical wobble (standard error): ' + s0.toFixed(2) + ' points.';
    }
    ['pv-baseline', 'pv-lift', 'pv-n'].forEach(id => $(id).addEventListener('input', update));
    $('pv-alpha').addEventListener('change', update);
    update(); root.hidden = false;
  })();
})();

