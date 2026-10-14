(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Laptop easter egg: type a line on the screen.
  var laptop = document.getElementById('aw-laptop');
  var out = document.getElementById('aw-type-text');
  if (laptop && out) {
    var msg = '> git push && go home', timer;
    var type = function () {
      clearInterval(timer);
      laptop.classList.add('is-on');
      if (reduce) { out.textContent = msg; return; }
      var i = 0;
      out.textContent = '';
      timer = setInterval(function () {
        out.textContent = msg.slice(0, ++i);
        if (i >= msg.length) clearInterval(timer);
      }, 70);
    };
    laptop.addEventListener('mouseenter', function () { if (!laptop.classList.contains('is-on')) type(); });
    laptop.addEventListener('click', type);
    laptop.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); type(); } });
  }

  // Brew timer: steps starting with m:ss are highlighted as the clock passes them.
  var box = document.querySelector('[data-brew-timer]');
  var list = document.querySelector('[data-steps]');
  if (!box || !list) return;
  var items = [].slice.call(list.children).map(function (li) {
    var m = /^\s*(\d+):(\d{2})\b/.exec(li.textContent);
    return m ? { li: li, t: +m[1] * 60 + +m[2] } : null;
  }).filter(Boolean);
  if (!items.length) return;
  box.hidden = false;
  var clock = box.querySelector('output'), btn = box.querySelector('button');
  var start = 0, tick = null, end = items[items.length - 1].t;
  var fmt = function (s) { return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); };
  var paint = function (s) {
    clock.textContent = fmt(s);
    var now = -1;
    items.forEach(function (it, i) { if (it.t <= s) now = i; });
    items.forEach(function (it, i) {
      it.li.classList.toggle('is-now', i === now && s < end);
      it.li.classList.toggle('is-done', i < now || s >= end);
    });
  };
  var stop = function (label) { clearInterval(tick); tick = null; btn.textContent = label; };
  btn.addEventListener('click', function () {
    if (tick) { stop('Start brew timer'); paint(0); return; }
    start = Date.now();
    btn.textContent = 'Stop';
    paint(0);
    tick = setInterval(function () {
      var s = Math.floor((Date.now() - start) / 1000);
      paint(s);
      if (s >= end) stop('Restart brew timer');
    }, 250);
  });
})();
