// Theme toggle. The initial theme is set by the inline snippet in head.html.
(function () {
  var button = document.querySelector('[data-theme-toggle]');
  if (!button) return;
  var root = document.documentElement;
  function sync() { button.setAttribute('aria-pressed', String(root.getAttribute('data-theme') === 'dark')); }
  button.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('fm-theme', next); } catch (e) {}
    sync();
    window.dispatchEvent(new CustomEvent('fm-theme-change', { detail: next }));
  });
  sync();
}());
