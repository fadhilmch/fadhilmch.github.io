(function () {
  // Food recipe sections as tabs on small screens. The tab bar stays hidden without
  // JS, leaving both sections visible and stacked; with JS it behaves as a tablist.
  var tabbar = document.querySelector('[data-recipe-tabs]');
  if (tabbar) {
    var tabBtns = [].slice.call(tabbar.querySelectorAll('[role="tab"]'));
    var selectTab = function (btn) {
      tabBtns.forEach(function (b) {
        var on = b === btn;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-selected', String(on));
        b.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(b.getAttribute('aria-controls'));
        if (panel) panel.classList.toggle('is-panel-off', !on);
      });
    };
    tabBtns.forEach(function (b, i) {
      b.addEventListener('click', function () { selectTab(b); });
      b.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        var n = tabBtns[(i + d + tabBtns.length) % tabBtns.length];
        n.focus();
        selectTab(n);
      });
    });
    var art = tabbar.closest && tabbar.closest('.recipe');
    if (art) art.classList.add('has-tabs');
    selectTab(tabBtns[0]);
    tabbar.hidden = false;
  }
  // Ingredient checklist keeps a running count beside the section heading.
  var checklist = document.querySelector('[data-checklist]'), ingCount = document.querySelector('[data-ing-count]');
  if (checklist && ingCount) {
    var boxes = [].slice.call(checklist.querySelectorAll('input[type="checkbox"]'));
    var paintIngCount = function () {
      var n = boxes.filter(function (b) { return b.checked; }).length;
      ingCount.textContent = n + ' of ' + boxes.length;
    };
    boxes.forEach(function (b) { b.addEventListener('change', paintIngCount); });
    paintIngCount();
    ingCount.hidden = false;
  }
  // Method steps on food pages: tap a step to tick it off, with a running count.
  var tick = document.querySelector('[data-tick-steps]'), prog = document.querySelector('[data-steps-progress]');
  if (tick && prog) {
    var lis = [].slice.call(tick.children);
    var count = function () { var n = lis.filter(function (l) { return l.classList.contains('is-done'); }).length; prog.textContent = n + ' of ' + lis.length + ' steps done'; };
    prog.hidden = false; count();
    lis.forEach(function (li) { li.setAttribute('role', 'checkbox'); li.setAttribute('aria-checked', 'false'); li.tabIndex = 0;
      var flip = function () { var on = li.classList.toggle('is-done'); li.setAttribute('aria-checked', String(on)); count(); };
      li.addEventListener('click', flip);
      li.addEventListener('keydown', function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip(); } }); });
  }
  // Brew stopwatch: start, pause and reset. Steps that begin with m:ss light up as the clock passes them,
  // and a thin bar shows progress to the last step. Without JS the steps still read as a plain list.
  // Steps that open with a time token (coffee m:ss, food "N min") get the token as
  // its own chip so the timing column is easy to scan. Text content is unchanged.
  ['[data-steps]', '[data-tick-steps]'].forEach(function (sel) {
    var stepList = document.querySelector(sel);
    if (!stepList || !document.createElement) return;
    [].slice.call(stepList.children).forEach(function (li) {
      var m = /^\s*(~?(?:\d+:\d{2}|\d+ min))\s+/.exec(li.textContent);
      if (!m || li.querySelector('.steps__t')) return;
      var chip = document.createElement('span');
      chip.className = 'steps__t';
      chip.textContent = m[1] + ' ';
      li.textContent = li.textContent.slice(m[0].length);
      li.insertBefore(chip, li.firstChild);
    });
  });
  // Dose stepper on coffee pages: change the coffee grams and the water stat and the
  // pour amounts in the steps follow the recipe's ratio. Step times, temperature and
  // grind stay as written, and every visit starts from the recipe's own dose.
  var doseDd = document.querySelector('[data-dose]'), waterDd = document.querySelector('[data-water]');
  var doseSteps = document.querySelector('[data-steps]');
  if (doseDd && waterDd && doseSteps && document.createElement && document.createTextNode) {
    var dose0 = parseFloat(doseDd.getAttribute('data-dose')), water0 = parseFloat(waterDd.getAttribute('data-water'));
    if (dose0 > 0 && water0 > 0) {
      var doseLis = [].slice.call(doseSteps.children);
      // The trailing text node holds the step sentence; the time chip is a separate span.
      var orig = doseLis.map(function (li) {
        var t = '';
        [].forEach.call(li.childNodes, function (n) { if (n.nodeType === 3) t += n.data; });
        return t;
      });
      // Water tokens in document order. A token soon followed by "total" is a cumulative
      // anchor; other ml/g amounts are incremental pours. "grind N g" is the dose itself.
      // Cumulative values anchor the chain, so rounded increments always add up to the
      // rounded totals; the last cumulative is pinned to the water stat.
      var tokens = [], tokByPos = {};
      doseLis.forEach(function (li, idx) {
        var t = orig[idx], m, re = /(\d+(?:\.\d+)?)(\s*(?:ml|g)\b)/gi, j = 0, running = tokens._run || 0;
        while ((m = re.exec(t))) {
          var before = t.slice(Math.max(0, m.index - 14), m.index).toLowerCase();
          var after = t.slice(m.index + m[0].length, m.index + m[0].length + 14).toLowerCase();
          var kind = null;
          if (/grind\s*$/.test(before)) kind = 'dose';
          else if (/^[^.;]{0,12}\btotal\b/.test(after)) kind = 'cum';
          else if (/ml/i.test(m[2]) || /water|pour|add|reach|fill/.test(before + ' ' + after)) kind = 'inc';
          if (kind) {
            if (kind === 'inc') running += parseFloat(m[1]);
            else if (kind === 'cum') running = parseFloat(m[1]);
            tokens.push({ li: idx, j: j, kind: kind, cum: running });
            tokByPos[idx + ':' + j] = tokens.length - 1;
          }
          j++;
        }
        tokens._run = running;
      });
      var lastCum = -1;
      tokens.forEach(function (tk, i) { if (tk.kind === 'cum') lastCum = i; });
      var fmtN = function (n) { var r = Math.round(n * 10) / 10; return r % 1 === 0 ? String(Math.round(r)) : String(r); };
      var minus = document.createElement('button'); minus.type = 'button'; minus.className = 'dose-btn'; minus.textContent = '\u2212'; minus.setAttribute('aria-label', 'Less coffee');
      var out = document.createElement('span'); out.className = 'dose-val';
      var plus = document.createElement('button'); plus.type = 'button'; plus.className = 'dose-btn'; plus.textContent = '+'; plus.setAttribute('aria-label', 'More coffee');
      var again = document.createElement('button'); again.type = 'button'; again.className = 'dose-reset'; again.textContent = 'Reset'; again.hidden = true;
      var note = document.createElement('p'); note.className = 'dose-note'; note.hidden = true;
      var noteText = document.createElement('span'); note.appendChild(noteText); note.appendChild(again);
      doseDd.textContent = '';
      doseDd.classList.add('dose-step');
      doseDd.appendChild(minus); doseDd.appendChild(out); doseDd.appendChild(plus);
      if (doseDd.parentNode && doseDd.parentNode.appendChild) doseDd.parentNode.appendChild(note);
      var paintDose = function (dose) {
        var k = dose / dose0, water = Math.round(water0 * k);
        out.innerHTML = fmtN(dose) + '<small>g</small>';
        waterDd.innerHTML = fmtN(water) + '<small>g</small>';
        var prev = 0, queue = tokens.map(function (tk, i) {
          if (tk.kind === 'dose') return fmtN(dose);
          var c = i === lastCum ? water : Math.round(tk.cum * k);
          var shown = tk.kind === 'cum' ? c : c - prev;
          prev = c;
          return fmtN(shown);
        });
        doseLis.forEach(function (li, idx) {
          var j = 0;
          var t = orig[idx].replace(/(\d+(?:\.\d+)?)(\s*(?:ml|g)\b)/gi, function (m, num, unit) {
            var ti = tokByPos[idx + ':' + j]; j++;
            return ti === undefined ? m : queue[ti] + unit;
          });
          [].slice.call(li.childNodes).forEach(function (n) { if (n.nodeType === 3) li.removeChild(n); });
          li.appendChild(document.createTextNode(t));
        });
        var changed = Math.abs(dose - dose0) > 1e-9;
        again.hidden = !changed;
        note.hidden = false;
        noteText.textContent = water > 295
          ? 'About ' + fmtN(water) + ' g of water is more than a standard AeroPress chamber holds (10 oz, about 295 g).'
          : (changed ? 'Scaled from the recipe\u2019s ' + fmtN(dose0) + ' g. Time, temperature and grind stay the same. ' : 'Tap + or \u2212 to brew a bigger or smaller cup; water and pours follow the ratio. ');
      };
      var cur = function () { return parseFloat(out.textContent); };
      minus.addEventListener('click', function () { var v = Math.round((cur() - 1) * 10) / 10; if (v >= 5) paintDose(v); });
      plus.addEventListener('click', function () { paintDose(Math.round((cur() + 1) * 10) / 10); });
      again.addEventListener('click', function () { paintDose(dose0); });
      paintDose(dose0);
    }
  }
  var box = document.querySelector('[data-brew-timer]');
  var list = document.querySelector('[data-steps]');
  if (!box || !list) return;
  var items = [].slice.call(list.children).map(function (li) {
    var m = /^\s*~?(\d+):(\d{2})\b/.exec(li.textContent);
    return m ? { li: li, t: +m[1] * 60 + +m[2] } : null;
  }).filter(Boolean);
  if (!items.length) return;
  box.hidden = false;
  var clock = box.querySelector('output'), go = box.querySelector('[data-timer-go]'), reset = box.querySelector('[data-timer-reset]');
  var bar = box.querySelector('.brew-timer__bar i');
  var barWrap = box.querySelector('.brew-timer__bar'), stepEl = box.querySelector('[data-timer-step]');
  var names = items.map(function (it) {
    var m = /^\s*~?\d+:\d{2}\s+([^:]{1,32}?):/.exec(it.li.textContent);
    return m ? m[1] : null;
  });
  var end = items[items.length - 1].t, elapsed = 0, startedAt = 0, tick = null;
  // A recipe can declare the full brew length (e.g. the press runs past the last
  // timed step); the clock then runs to that total instead of the last step's start.
  var declared = /^~?(\d+):(\d{2})$/.exec((box.getAttribute && box.getAttribute('data-brew-total')) || '');
  if (declared) { var dt = +declared[1] * 60 + +declared[2]; if (dt > end) end = dt; }
  // Tick marks on the progress bar at each step's start (skip 0:00 and the end).
  if (barWrap && typeof barWrap.appendChild === 'function' && document.createElement) {
    items.forEach(function (it) {
      if (it.t > 0 && it.t < end) {
        var tick = document.createElement('s');
        tick.style.left = (it.t / end * 100) + '%';
        barWrap.appendChild(tick);
      }
    });
  }
  var fmt = function (s) { return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); };
  var paint = function (s) {
    clock.innerHTML = fmt(s) + ' <small>of ' + fmt(end) + '</small>';
    bar.style.transform = 'scaleX(' + Math.min(1, s / end) + ')';
    var now = -1;
    items.forEach(function (it, i) { if (it.t <= s) now = i; });
    items.forEach(function (it, i) {
      it.li.classList.toggle('is-now', i === now && s < end);
      it.li.classList.toggle('is-done', i < now || s >= end);
    });
    if (stepEl) stepEl.textContent = s >= end ? 'Done' : (now < 0 ? '' : 'Step ' + (now + 1) + (names[now] ? ' \u00b7 ' + names[now] : ''));
    box.classList.toggle('is-done', s >= end);
  };
  var pause = function () { clearInterval(tick); tick = null; elapsed += (Date.now() - startedAt) / 1000; box.classList.remove('is-running'); };
  var label = function () { go.textContent = tick ? 'Pause' : (elapsed >= end ? 'Again' : (elapsed > 0 ? 'Resume' : 'Start')); go.setAttribute('aria-pressed', String(!!tick)); };
  go.addEventListener('click', function () {
    if (tick) { pause(); label(); return; }
    if (elapsed >= end) { elapsed = 0; paint(0); }
    startedAt = Date.now();
    box.classList.add('is-running');
    tick = setInterval(function () {
      var s = elapsed + (Date.now() - startedAt) / 1000;
      paint(Math.floor(s));
      if (s >= end) { pause(); elapsed = end; paint(end); label(); }
    }, 200);
    label();
  });
  reset.addEventListener('click', function () { if (tick) pause(); elapsed = 0; paint(0); label(); });
  paint(0); label();
})();
