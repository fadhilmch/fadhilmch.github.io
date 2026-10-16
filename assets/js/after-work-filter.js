// Tag filter for the Coffee and Cooking lists. Without JS every recipe is shown and the chips stay hidden.
(function () {
  var bar = document.querySelector('[data-aw-filter]'), menu = document.querySelector('[data-aw-menu]');
  if (!bar || !menu) return;
  bar.hidden = false;
  var cards = [].slice.call(menu.querySelectorAll('.aw-card'));
  var count = bar.querySelector('.aw-filter__count');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function apply(tag) {
    var shown = 0;
    cards.forEach(function (c) {
      var has = !tag || (c.dataset.tags || '').split('|').indexOf(tag) > -1;
      if (has) shown++;
      if (has === !c.hidden) return;
      if (has) { c.hidden = false; if (!reduce) { c.classList.add('is-in'); setTimeout(function () { c.classList.remove('is-in'); }, 400); } }
      else if (reduce) { c.hidden = true; }
      else { c.classList.add('is-out'); setTimeout(function () { c.hidden = true; c.classList.remove('is-out'); }, 180); }
    });
    count.textContent = tag ? shown + (shown === 1 ? ' recipe' : ' recipes') + ' tagged ' + tag : '';
  }
  bar.addEventListener('click', function (e) {
    var b = e.target.closest('.aw-chip'); if (!b) return;
    [].forEach.call(bar.querySelectorAll('.aw-chip'), function (x) { x.setAttribute('aria-pressed', String(x === b)); });
    apply(b.dataset.tag);
  });
})();
