(function () {
  if (customElements.get('fm-graph')) return;
  class FMGraph extends HTMLElement {
    constructor() {
      super();
      const s = this.attachShadow({ mode: 'open' });
      s.innerHTML = '<style>:host{display:block;position:relative;width:100%;height:100%;min-height:240px;touch-action:none}canvas{position:absolute;inset:0;width:100%;height:100%;display:block;cursor:grab}</style><canvas></canvas>';
      this.cv = s.querySelector('canvas'); this.ctx = this.cv.getContext('2d');
      this.view = { x: 0, y: 0, k: 1 }; this.alpha = 1; this.hover = null; this.sel = (document.querySelector('[data-current-note]') || {dataset:{}}).dataset.currentNote || 'index'; this.running = false; this.visible = true; this.reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.nodes = []; this.edges = []; this.nb = {}; this.idx = {}; this.frame = 0; this.w = 1; this.h = 1; this.dpr = 1; this.tagc = {};
    }
    connectedCallback() {
      this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(this); this.resize();
      this.bind();
      this._f = e => { this.sel = e.detail; this.kick(); };
      this._t = () => { this.readColors(); this.kick(); };
      window.addEventListener('fm-note-focus', this._f);
      window.addEventListener('fm-theme-change', this._t);
      this.io = new IntersectionObserver(es => { this.visible = es[es.length - 1].isIntersecting; if (this.visible) this.kick(); });
      this.io.observe(this);
      fetch(this.dataset.src).then(r => r.json()).then(d => this.init(d.notes || [])).catch(() => {});
    }
    disconnectedCallback() { this.running = false; cancelAnimationFrame(this.raf); this.ro && this.ro.disconnect(); this.io && this.io.disconnect(); window.removeEventListener('fm-note-focus', this._f); window.removeEventListener('fm-theme-change', this._t); }
    kick() {
      if (this.running || !this.visible) return;
      this.running = true;
      const t = () => {
        if (!this.visible) { this.running = false; return; }
        this.step(); this.draw();
        if (this.alpha >= 0.002 || this.moving || this.down) this.raf = requestAnimationFrame(t); else this.running = false;
      };
      this.raf = requestAnimationFrame(t);
    }
    init(notes) {
      const idx = {};
      this.nodes = notes.map((n, i) => { const a = i * 2.399, r = 14 * Math.sqrt(i + 1); const o = Object.assign({}, n, { x: Math.cos(a) * r, y: Math.sin(a) * r, vx: 0, vy: 0, deg: 0 }); idx[n.id] = o; return o; });
      const seen = new Set(); this.edges = [];
      notes.forEach(n => (n.links || []).forEach(t => {
        if (!idx[t]) return; const k = [n.id, t].sort().join('|'); if (seen.has(k)) return; seen.add(k);
        this.edges.push([idx[n.id], idx[t]]); idx[n.id].deg++; idx[t].deg++;
        (this.nb[n.id] = this.nb[n.id] || new Set()).add(t); (this.nb[t] = this.nb[t] || new Set()).add(n.id);
      }));
      this.idx = idx; this.alpha = 1; this.readColors();
      if (this.reduced) { for (let i = 0; i < 400; i++) this.step(); this.userMoved = false; for (let i = 0; i < 60; i++) this.fit(); this.alpha = 0; this.draw(); }
      else this.kick();
    }
    resize() {
      const r = this.getBoundingClientRect(); this.w = Math.max(1, r.width); this.h = Math.max(1, r.height);
      const d = window.devicePixelRatio || 1; this.dpr = d; this.cv.width = this.w * d; this.cv.height = this.h * d;
      this.userMoved = false; this.kick();
    }
    readColors() {
      const cs = getComputedStyle(this); const g = (n, f) => (cs.getPropertyValue(n).trim() || f);
      this.col = { fg: g('--g-fg', '#bbb'), muted: g('--g-muted', '#777'), line: g('--g-line', '#444'), acc: g('--g-acc', '#f80'), font: g('--g-font', 'monospace') + ', monospace', label: g('--g-label', g('--g-muted', '#777')), compact: g('--g-compact', '') === '1' };
      this.tagc = {}; this.nodes.forEach(n => { if (!(n.tag in this.tagc)) this.tagc[n.tag] = cs.getPropertyValue('--g-c-' + n.tag).trim() || this.col.fg; });
    }
    fit() {
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      for (const n of this.nodes) { x0 = Math.min(x0, n.x); y0 = Math.min(y0, n.y); x1 = Math.max(x1, n.x); y1 = Math.max(y1, n.y); }
      const pad = 60, k = Math.max(0.3, Math.min(1.8, Math.min(this.w / (x1 - x0 + pad * 2), this.h / (y1 - y0 + pad * 2))));
      const v = this.view, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
      const dx = -cx * v.k - v.x, dy = -cy * v.k - v.y; this.moving = Math.abs(k - v.k) > 0.002 || Math.abs(dx) > 0.3 || Math.abs(dy) > 0.3;
      v.k += (k - v.k) * 0.2; v.x += dx * 0.2; v.y += dy * 0.2;
    }
    rad(n) { return 3.2 + Math.sqrt(n.deg) * 2; }
    step() {
      const N = this.nodes; if (!N.length || this.alpha < 0.002) return; const a = this.alpha;
      for (let i = 0; i < N.length; i++) { const p = N[i]; for (let j = i + 1; j < N.length; j++) { const q = N[j];
        let dx = q.x - p.x, dy = q.y - p.y, d2 = dx * dx + dy * dy; if (d2 < 1) { dx = Math.random() - .5; dy = Math.random() - .5; d2 = 1; }
        const d = Math.sqrt(d2), f = 2200 / d2 * a, fx = dx / d * f, fy = dy / d * f; p.vx -= fx; p.vy -= fy; q.vx += fx; q.vy += fy; } }
      for (const [p, q] of this.edges) { const dx = q.x - p.x, dy = q.y - p.y, d = Math.sqrt(dx * dx + dy * dy) || 1, f = (d - 62) * 0.035 * a, fx = dx / d * f, fy = dy / d * f; p.vx += fx; p.vy += fy; q.vx -= fx; q.vy -= fy; }
      for (const p of N) { p.vx -= p.x * 0.008 * a; p.vy -= p.y * 0.008 * a; if (p === this.dragNode) { p.vx = p.vy = 0; continue; } p.vx *= 0.6; p.vy *= 0.6; p.x += p.vx; p.y += p.vy; }
      this.alpha *= 0.988;
    }
    draw() {
      const c = this.ctx, v = this.view, w = this.w, h = this.h;
      if (!this.col) this.readColors();
      const col = this.col || {}; c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); c.clearRect(0, 0, w, h);
      if (!this.nodes.length) return;
      if (!this.userMoved) this.fit();
      c.translate(w / 2 + v.x, h / 2 + v.y); c.scale(v.k, v.k);
      const f = this.hover, rel = f ? (this.nb[f.id] || new Set()) : null, sel = this.idx[this.sel];
      c.lineWidth = 1 / v.k;
      for (const [p, q] of this.edges) { const on = f && (p === f || q === f); c.globalAlpha = f ? (on ? 1 : .1) : .6; c.strokeStyle = on ? col.acc : col.line; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(q.x, q.y); c.stroke(); }
      for (const n of this.nodes) {
        const r = this.rad(n), on = f && (n === f || rel.has(n.id));
        c.globalAlpha = f && !on ? .18 : 1; c.fillStyle = (n === f || n === sel) ? col.acc : (this.tagc[n.tag] || col.fg);
        c.beginPath(); c.arc(n.x, n.y, r, 0, 7); c.fill();
        if (n === sel) { c.globalAlpha = 1; c.strokeStyle = col.acc; c.lineWidth = 1.5 / v.k; c.beginPath(); c.arc(n.x, n.y, r + 4 / v.k, 0, 7); c.stroke(); c.lineWidth = 1 / v.k; }
      }
      c.font = (11 / v.k) + 'px ' + col.font; c.textAlign = 'center'; c.textBaseline = 'top';
      for (const n of this.nodes) {
        const on = f && (n === f || rel.has(n.id));
        let al = col.compact ? (n === sel ? 1 : 0) : (v.k > 1.25 ? 1 : (n.deg >= 4 || n === sel ? .9 : .45));
        if (f) al = on ? 1 : (col.compact ? 0 : .12);
        if (al <= 0) continue;
        c.globalAlpha = al; c.fillStyle = (on || n === sel) ? col.fg : col.label;
        c.fillText(n.title, n.x, n.y + this.rad(n) + 4 / v.k);
      }
      c.globalAlpha = 1;
    }
    bind() {
      const cv = this.cv;
      const pt = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
      const world = (x, y) => [(x - this.w / 2 - this.view.x) / this.view.k, (y - this.h / 2 - this.view.y) / this.view.k];
      const pick = (x, y) => { const [wx, wy] = world(x, y); let best = null, bd = 1e9; for (const n of this.nodes) { const d = Math.hypot(n.x - wx, n.y - wy); if (d < this.rad(n) + 6 / this.view.k && d < bd) { bd = d; best = n; } } return best; };
      cv.addEventListener('pointerdown', e => { const [x, y] = pt(e); cv.setPointerCapture(e.pointerId); const n = pick(x, y); this.userMoved = true; this.down = { x, y, n, vx: this.view.x, vy: this.view.y, moved: false }; if (n) this.dragNode = n; cv.style.cursor = 'grabbing'; });
      cv.addEventListener('pointermove', e => {
        const [x, y] = pt(e), dn = this.down;
        if (dn) { if (Math.hypot(x - dn.x, y - dn.y) > 3) dn.moved = true;
          if (dn.n) { if (dn.moved) { const [wx, wy] = world(x, y); dn.n.x = wx; dn.n.y = wy; this.alpha = Math.max(this.alpha, .35); } }
          else { this.view.x = dn.vx + (x - dn.x); this.view.y = dn.vy + (y - dn.y); } this.kick(); return; }
        const n = pick(x, y); if (n !== this.hover) { this.hover = n; cv.style.cursor = n ? 'pointer' : 'grab'; this.kick(); }
      });
      const up = () => { const dn = this.down; this.down = null; this.dragNode = null; cv.style.cursor = this.hover ? 'pointer' : 'grab';
        if (dn && dn.n && !dn.moved) { this.sel = dn.n.id; this.kick(); const ev = new CustomEvent('fm-note-select', { detail: dn.n.id, cancelable: true }); window.dispatchEvent(ev); if (!ev.defaultPrevented && dn.n.url) window.location.href = dn.n.url; } };
      cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
      cv.addEventListener('pointerleave', () => { if (!this.down) { this.hover = null; this.kick(); } });
      cv.addEventListener('wheel', e => { e.preventDefault(); this.userMoved = true; const [x, y] = pt(e); const [wx, wy] = world(x, y);
        const k = Math.min(4, Math.max(.3, this.view.k * Math.exp(-e.deltaY * 0.0015))); this.view.k = k; this.view.x = x - this.w / 2 - wx * k; this.view.y = y - this.h / 2 - wy * k; this.kick(); }, { passive: false });
    }
  }
  customElements.define('fm-graph', FMGraph);
})();
