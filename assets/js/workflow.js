// About pipeline: select a node to swap the visible inspector.
// All content is already in the HTML; this only toggles and animates it.
(function () {
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var home = document.querySelector('[data-inspectors]');
  var inspectors = $$('[data-inspector]');
  var triggers = $$('[data-node]');
  if (!inspectors.length) return;

  var mobile = window.matchMedia('(max-width: 759px)');
  var current = null;

  function panel(id) { return document.getElementById('wf-i-' + id); }

  function place(id) {
    var el = panel(id);
    if (!el) return;
    var slot = mobile.matches && document.querySelector('[data-acc="' + id + '"]');
    (slot || home).appendChild(el);
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
    if (opts.hash) history.replaceState(null, '', collapse ? location.pathname + location.search : '#node-' + id);
  }

  triggers.forEach(function (t) {
    t.addEventListener('click', function () { select(t.dataset.node, { hash: true, toggle: true }); });
  });

  mobile.addEventListener('change', function () {
    if (!current) select(inspectors[0].dataset.inspector);
    else place(current);
  });

  var fromHash = decodeURIComponent(location.hash.replace(/^#node-/, ''));
  select(fromHash && panel(fromHash) ? fromHash : inspectors[0].dataset.inspector);
  if (fromHash && panel(fromHash)) document.getElementById('wf-n-' + fromHash).scrollIntoView({ block: 'center' });

}());
