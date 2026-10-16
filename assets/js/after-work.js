(function () {
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
  var box = document.querySelector('[data-brew-timer]');
  var list = document.querySelector('[data-steps]');
  if (!box || !list) return;
  var items = [].slice.call(list.children).map(function (li) {
    var m = /^\s*(\d+):(\d{2})\b/.exec(li.textContent);
    return m ? { li: li, t: +m[1] * 60 + +m[2] } : null;
  }).filter(Boolean);
  if (!items.length) return;
  box.hidden = false;
  var clock = box.querySelector('output'), go = box.querySelector('[data-timer-go]'), reset = box.querySelector('[data-timer-reset]');
  var bar = box.querySelector('.brew-timer__bar i');
  var end = items[items.length - 1].t, elapsed = 0, startedAt = 0, tick = null;
  var fmt = function (s) { return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); };
  var paint = function (s) {
    clock.textContent = fmt(s);
    bar.style.transform = 'scaleX(' + Math.min(1, s / end) + ')';
    var now = -1;
    items.forEach(function (it, i) { if (it.t <= s) now = i; });
    items.forEach(function (it, i) {
      it.li.classList.toggle('is-now', i === now && s < end);
      it.li.classList.toggle('is-done', i < now || s >= end);
    });
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
