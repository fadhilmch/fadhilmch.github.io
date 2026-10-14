// About pipeline: select a node to swap the visible inspector.
// All content is already in the HTML; this only toggles and animates it.
(function () {
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var home = document.querySelector('[data-inspectors]');
  var inspectors = $$('[data-inspector]');
  var triggers = $$('[data-node]');
  if (!inspectors.length) return;

  var mobile = window.matchMedia('(max-width: 759px)');
  var calmMq = window.matchMedia('(prefers-reduced-motion: reduce)');
  var current = null;
  var lightPath = function () {}; // set by explore()

  // Greeting: type the word out and back in, one language at a time. Word only; the rest of the headline is static.
  (function () {
    var g = document.querySelector('[data-greet]');
    var words = $$('[data-w]', g || document).map(function (w) { return { w: w.textContent, l: w.dataset.lang }; });
    if (!g || words.length < 2 || calmMq.matches) return;
    var out = g.querySelector('.greet__word'), tag = g.querySelector('.greet__lang'), i = 0, n = words[0].w.length, phase = 'hold';
    g.classList.add('is-live');
    function tick() {
      var ms = 70;
      if (document.hidden || calmMq.matches) return setTimeout(tick, 600);
      if (phase === 'hold') phase = 'del';
      else if (phase === 'del') {
        out.textContent = words[i].w.slice(0, --n);
        if (!n) { i = (i + 1) % words.length; phase = 'type'; tag.textContent = words[i].l; }
      } else {
        out.textContent = words[i].w.slice(0, ++n);
        if (n === words[i].w.length) { phase = 'hold'; ms = 2500; }
      }
      setTimeout(tick, ms);
    }
    setTimeout(tick, 2500);
  }());

  function panel(id) { return document.getElementById('wf-i-' + id); }

  function place(id) {
    var el = panel(id);
    if (!el) return;
    var slot = mobile.matches && document.querySelector('[data-acc="' + id + '"]');
    (slot || home).appendChild(el);
  }

  // After a click, bring the panel into view unless a good chunk of it already shows.
  function reveal(el) {
    var r = el.getBoundingClientRect();
    if (r.top >= 0 && r.top < window.innerHeight - 240) return;
    var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'nearest' });
  }

  function select(id, opts) {
    opts = opts || {};
    if (!panel(id)) id = inspectors[0].dataset.inspector;
    // On mobile, tapping the open item collapses it.
    var collapse = mobile.matches && opts.toggle && id === current;
    inspectors.forEach(function (p) { p.hidden = collapse || p.dataset.inspector !== id; });
    triggers.forEach(function (t) { t.setAttribute('aria-expanded', String(!collapse && t.dataset.node === id)); });
    current = collapse ? null : id;
    if (!collapse) place(id);
    if (opts.scroll && !collapse) reveal(panel(id));
    if (opts.hash) history.replaceState(null, '', collapse ? location.pathname + location.search : '#node-' + id);
  }

  // Bio phrases: hover/focus lights the node's path, click opens it
  $$('[data-bio-node]').forEach(function (b) {
    var id = b.dataset.bioNode, on = function () { if (!mobile.matches) lightPath(id); }, off = function () { lightPath(null); };
    b.addEventListener('pointerenter', function (ev) { if (ev.pointerType === 'mouse') on(); });
    b.addEventListener('pointerleave', off);
    b.addEventListener('focus', function () { if (b.matches(':focus-visible')) on(); });
    b.addEventListener('blur', off);
    b.addEventListener('click', function () {
      off(); select(id, { hash: true, scroll: true });
      var el = mobile.matches ? document.querySelector('[data-acc="' + id + '"]') : null;
      if (el) el.scrollIntoView({ behavior: calmMq.matches ? 'auto' : 'smooth', block: 'start' });
    });
  });

  triggers.forEach(function (t) {
    t.addEventListener('click', function () { select(t.dataset.node, { hash: true, toggle: true, scroll: !mobile.matches }); });
  });

  // Readable / JSON toggle: one choice for every inspector, remembered per browser.
  var viewBtns = $$('[data-view-btn]');
  function setView(view) {
    document.documentElement.setAttribute('data-wf-view', view);
    viewBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.viewBtn === view)); });
  }
  var savedView = null;
  try { savedView = localStorage.getItem('wf-view'); } catch (e) {}
  setView(savedView === 'json' ? 'json' : 'readable');
  viewBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      setView(b.dataset.viewBtn);
      try { localStorage.setItem('wf-view', b.dataset.viewBtn); } catch (e) {}
    });
  });

  mobile.addEventListener('change', function () {
    if (!current) select(inspectors[0].dataset.inspector);
    else place(current);
  });

  // Explorable canvas: hover path, drag, run, ambient packets. Desktop-only; mobile hides the canvas.
  function explore() {
    var cv = document.querySelector('.wf-canvas');
    var svg = cv && cv.querySelector('.wf-edges');
    if (!svg) return;
    var NS = 'http://www.w3.org/2000/svg';
    var calm = function () { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; };
    var W = parseFloat(cv.style.width), H = parseFloat(cv.style.height);
    var nodes = {}, edges = $$('.wf-edge', svg).map(function (el) { return { el: el, a: el.dataset.from, b: el.dataset.to }; });
    $$('[data-node],[data-join]', cv).forEach(function (el) {
      var g = el.dataset.g.split(',').map(Number), x = parseFloat(el.style.left), y = parseFloat(el.style.top);
      nodes[el.dataset.node || 'join'] = { el: el, g: g, x: x, y: y, ox: x, oy: y, tx: x, ty: y, vx: 0, vy: 0, k: .18, d: .78, drag: !el.hasAttribute('data-join') };
    });

    // Edge geometry, same node-editor curve as canvas.html
    function route(e) {
      var a = nodes[e.a], b = nodes[e.b];
      var x1 = a.x + a.g[1], y1 = a.y + a.g[2], x2 = b.x + b.g[0], y2 = b.y + b.g[2], c = Math.max(Math.abs(x2 - x1) / 2, 60);
      e.el.setAttribute('d', 'M' + x1 + ' ' + y1 + ' C' + (x1 + c) + ' ' + y1 + ' ' + (x2 - c) + ' ' + y2 + ' ' + x2 + ' ' + y2);
    }
    function put(n) {
      n.el.style.left = n.x + 'px'; n.el.style.top = n.y + 'px';
      edges.forEach(function (e) { if (nodes[e.a] === n || nodes[e.b] === n) route(e); });
    }

    // Hover / focus: light the full path through a node
    function reach(id, dir, seen) {
      edges.forEach(function (e) { var from = dir ? e.a : e.b, to = dir ? e.b : e.a; if (from === id && !seen[to]) { seen[to] = 1; reach(to, dir, seen); } });
      return seen;
    }
    function light(id) {
      var set = {};
      if (id) { set[id] = 1; reach(id, 1, set); reach(id, 0, set); }
      cv.classList.toggle('is-focus', !!id);
      Object.keys(nodes).forEach(function (k) { nodes[k].el.classList.toggle('is-lit', !!set[k]); });
      edges.forEach(function (e) { e.el.classList.toggle('is-lit', !!(set[e.a] && set[e.b])); });
    }
    lightPath = light;
    var dragging = null, touched = false;
    cv.addEventListener('pointerdown', function () { touched = true; });
    cv.addEventListener('keydown', function () { touched = true; });
    $$('[data-node]', cv).forEach(function (el) {
      el.addEventListener('pointerenter', function (ev) { if (ev.pointerType === 'mouse' && !dragging) light(el.dataset.node); });
      el.addEventListener('pointerleave', function () { if (!dragging) light(null); });
      el.addEventListener('focusin', function () { if (el.matches(':focus-visible')) light(el.dataset.node); });
      el.addEventListener('focusout', function () { light(null); });
    });

    // Spring loop: nodes chase their targets; release keeps velocity, so they overshoot a touch
    var raf = 0, moved = false, resetBtn = document.querySelector('[data-wf-reset]');
    function step() {
      var busy = false;
      Object.keys(nodes).forEach(function (k) {
        var n = nodes[k];
        if (!n.drag) return;
        if (calm()) { n.x = n.tx; n.y = n.ty; n.vx = n.vy = 0; }
        else {
          n.vx = (n.vx + (n.tx - n.x) * n.k) * n.d; n.vy = (n.vy + (n.ty - n.y) * n.k) * n.d;
          n.x += n.vx; n.y += n.vy;
          if (Math.abs(n.tx - n.x) + Math.abs(n.ty - n.y) + Math.abs(n.vx) + Math.abs(n.vy) < .1) { n.x = n.tx; n.y = n.ty; n.vx = n.vy = 0; }
          else busy = true;
        }
        n.x = Math.min(Math.max(n.x, 0), W - n.el.offsetWidth); n.y = Math.min(Math.max(n.y, 0), H - n.el.offsetHeight);
        put(n);
      });
      raf = busy || dragging ? requestAnimationFrame(step) : 0;
    }
    function kick() { if (!raf) raf = requestAnimationFrame(step); }
    function shifted() { return Object.keys(nodes).some(function (k) { return nodes[k].tx !== nodes[k].ox || nodes[k].ty !== nodes[k].oy; }); }

    cv.addEventListener('click', function (ev) { if (moved) { ev.stopPropagation(); ev.preventDefault(); } }, true);
    cv.addEventListener('pointerdown', function (ev) {
      var el = ev.target.closest('[data-node]'), n = el && nodes[el.dataset.node];
      if (!n || ev.button) return;
      var r = cv.getBoundingClientRect(), sx = ev.clientX, sy = ev.clientY, gx = ev.clientX - r.left - n.x, gy = ev.clientY - r.top - n.y, on = false;
      function mv(e) {
        if (!on) {
          if (Math.hypot(e.clientX - sx, e.clientY - sy) < 4) return;
          on = moved = true; dragging = n; n.k = .5; n.d = .6;
          el.classList.add('is-drag'); try { el.setPointerCapture(ev.pointerId); } catch (x) {}
          light(el.dataset.node); toast(); kick();
        }
        var b = cv.getBoundingClientRect();
        n.tx = Math.min(Math.max(e.clientX - b.left - gx, 0), W - el.offsetWidth);
        n.ty = Math.min(Math.max(e.clientY - b.top - gy, 0), H - el.offsetHeight);
      }
      function up() {
        el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up);
        if (!on) return;
        dragging = null; n.k = .18; n.d = .78; el.classList.remove('is-drag');
        setTimeout(function () { moved = false; }, 0);
        if (resetBtn && shifted()) resetBtn.hidden = false;
        if (!el.matches(':hover')) light(null);
        kick();
      }
      el.addEventListener('pointermove', mv); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    });
    if (resetBtn) resetBtn.addEventListener('click', function () {
      Object.keys(nodes).forEach(function (k) { var n = nodes[k]; n.tx = n.ox; n.ty = n.oy; n.k = .12; n.d = .8; });
      resetBtn.hidden = true; kick();
    });

    // Packets travelling along an edge path
    var live = true;
    function fly(e, dur, r, op, delay, done) {
      var c = document.createElementNS(NS, 'circle'), len = 0, t0 = 0;
      c.setAttribute('r', r); c.setAttribute('class', 'wf-packet'); c.setAttribute('style', e.el.getAttribute('style')); c.style.opacity = 0;
      svg.appendChild(c);
      (function f(t) {
        t0 = t0 || t + delay;
        var p = Math.min(Math.max((t - t0) / dur, 0), 1), q = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        if (t >= t0) { var pt = e.el.getPointAtLength(q * e.el.getTotalLength()); c.setAttribute('cx', pt.x); c.setAttribute('cy', pt.y); c.style.opacity = op * Math.min(1, p * 8, (1 - p) * 8 + .2); }
        if (p < 1) requestAnimationFrame(f); else { c.remove(); if (done) done(); }
      }(performance.now()));
    }
    function glow(id, ms) {
      var el = nodes[id].el; el.classList.add('is-active');
      setTimeout(function () { el.classList.remove('is-active'); }, ms || 650);
    }

    // Run: stage by stage, by longest-path depth
    var level = {};
    function depth(id) {
      if (level[id] != null) return level[id];
      level[id] = 0;
      edges.forEach(function (e) { if (e.b === id) level[id] = Math.max(level[id], depth(e.a) + 1); });
      return level[id];
    }
    Object.keys(nodes).forEach(depth);
    var last = Math.max.apply(null, Object.keys(level).map(function (k) { return level[k]; }));
    var runBtn = document.querySelector('[data-wf-run]'), running = false, toastEl = null, toastT = 0;
    function toast() { clearTimeout(toastT); if (toastEl) { toastEl.remove(); toastEl = null; } Object.keys(nodes).forEach(function (k) { nodes[k].el.classList.remove('is-done'); }); }
    function finish(t0) {
      var n = nodes.contact || nodes[Object.keys(level).filter(function (k) { return level[k] === last; })[0]];
      n.el.classList.add('is-done');
      toastEl = document.createElement('button');
      toastEl.type = 'button'; toastEl.className = 'wf-toast';
      toastEl.textContent = '✓ done in ' + ((performance.now() - t0) / 1000).toFixed(1) + 's · say hello?';
      toastEl.style.left = (n.x + n.el.offsetWidth) + 'px'; toastEl.style.top = Math.max(n.y - 34, 0) + 'px';
      toastEl.addEventListener('click', function () { toast(); n.el.click(); });
      cv.appendChild(toastEl);
      var el = toastEl;
      toastT = setTimeout(function () { el.classList.add('is-out'); toastT = setTimeout(function () { if (toastEl === el) toast(); }, calm() ? 0 : 400); }, 6000);
      runBtn.textContent = 'run again ▶'; runBtn.removeAttribute('aria-busy'); running = false;
    }
    document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && toastEl) toast(); });
    function bump(id) {
      var el = nodes[id].el; el.classList.remove('is-bump'); void el.offsetWidth; el.classList.add('is-bump');
    }
    function run() {
      if (running) return;
      running = true; toast(); if (runBtn) runBtn.classList.remove('is-attn'); runBtn.textContent = 'running…'; runBtn.setAttribute('aria-busy', 'true');
      var t0 = performance.now(), T = 340;
      Object.keys(nodes).forEach(function (k) { if (level[k] === 0) glow(k); });
      (function stage(k) {
        if (k > last) return finish(t0);
        var es = edges.filter(function (e) { return level[e.b] === k; }), left = es.length;
        function arrived(e) { glow(e.b); if (e.b === 'work') bump(e.b); if (!--left) stage(k + 1); }
        if (calm()) return setTimeout(function () { es.forEach(function (e) { glow(e.b, 220); }); stage(k + 1); }, 220);
        es.forEach(function (e, i) { fly(e, T, 4.5, 1, i * 50, function () { arrived(e); }); });
      }(1));
    }
    if (runBtn) {
      runBtn.addEventListener('click', run);
      runBtn.classList.add('is-attn');
    }

    // Auto-run once per session when the canvas is mostly in view and untouched
    var autoT = 0, auto = null;
    try { auto = sessionStorage.getItem('wf-auto'); } catch (e) {}
    var box = cv.parentNode;
    if (!auto && !calm() && runBtn && window.IntersectionObserver) {
      var io = new IntersectionObserver(function (en) {
        clearTimeout(autoT);
        if (!en[0].isIntersecting) return;
        autoT = setTimeout(function () {
          if (touched || running || calm()) return;
          try { sessionStorage.setItem('wf-auto', '1'); } catch (e) {}
          io.disconnect(); run();
        }, 900);
      }, { threshold: .6 });
      io.observe(box);
    }

    // Ambient: an occasional faint packet, only while visible and idle
    var seen = true;
    if (window.IntersectionObserver) new IntersectionObserver(function (en) { seen = en[0].isIntersecting; }).observe(cv);
    (function idle() {
      if (seen && !document.hidden && !running && !dragging && !calm()) fly(edges[Math.floor(Math.random() * edges.length)], 1400, 3, .55, 0);
      setTimeout(idle, 2400 + Math.random() * 2600);
    }());
  }
  explore();

  var fromHash = decodeURIComponent(location.hash.replace(/^#node-/, ''));
  select(fromHash && panel(fromHash) ? fromHash : inspectors[0].dataset.inspector);
  if (fromHash && panel(fromHash)) (mobile.matches ? document.querySelector('[data-acc="' + fromHash + '"]') : document.getElementById('wf-n-' + fromHash)).scrollIntoView({ block: 'center' });

}());
