(function () {
  var chips = Array.prototype.slice.call(document.querySelectorAll('[data-lane-filter]'));
  if (!chips.length) return;
  var rows = Array.prototype.slice.call(document.querySelectorAll('.post-row'));
  var groups = Array.prototype.slice.call(document.querySelectorAll('[data-year-group]'));
  var count = document.querySelector('[data-post-count]');
  var keys = chips.map(function (c) { return c.getAttribute('data-lane-filter'); });

  function apply(lane, push) {
    if (keys.indexOf(lane) < 0) lane = 'all';
    var shown = 0;
    rows.forEach(function (r) {
      var lanes = (r.getAttribute('data-lanes') || '').split(',');
      var show = lane === 'all' || lanes.indexOf(lane) > -1;
      r.hidden = !show;
      if (show) shown++;
    });
    groups.forEach(function (g) { g.hidden = !g.querySelector('.post-row:not([hidden])'); });
    chips.forEach(function (c) { c.setAttribute('aria-pressed', c.getAttribute('data-lane-filter') === lane ? 'true' : 'false'); });
    if (count) count.textContent = shown + (shown === 1 ? ' post' : ' posts');
    if (push) {
      try {
        var u = new URL(window.location.href);
        if (lane === 'all') u.searchParams.delete('lane'); else u.searchParams.set('lane', lane);
        history.replaceState(null, '', u.pathname + u.search + u.hash);
      } catch (e) {}
    }
  }

  chips.forEach(function (c) {
    c.addEventListener('click', function () { apply(c.getAttribute('data-lane-filter'), true); });
  });
  var q = 'all';
  try { q = new URLSearchParams(window.location.search).get('lane') || 'all'; } catch (e) {}
  apply(q, false);
})();
