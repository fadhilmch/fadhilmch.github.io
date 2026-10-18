// Shows a compact nav bar once the full site header has scrolled out of view.
(function () {
  var header = document.querySelector('.site-header');
  var nav = header && header.querySelector('.primary-nav');
  var mark = header && header.querySelector('.brand__mark');
  if (!nav || !mark || !('IntersectionObserver' in window)) return;

  var bar = document.createElement('div');
  bar.className = 'compact-nav';
  bar.setAttribute('inert', '');

  var home = document.createElement('a');
  home.className = 'brand';
  home.href = header.querySelector('.brand').getAttribute('href');
  home.setAttribute('aria-label', 'Fadhil Mochammad, home');
  home.appendChild(mark.cloneNode(true));

  var links = nav.cloneNode(true);
  links.setAttribute('aria-label', 'Primary, compact');

  bar.appendChild(home);
  bar.appendChild(links);
  document.body.appendChild(bar);

  new IntersectionObserver(function (entries) {
    var on = !entries[0].isIntersecting && entries[0].boundingClientRect.top < 0;
    bar.classList.toggle('is-on', on);
    if (on) bar.removeAttribute('inert'); else bar.setAttribute('inert', '');
  }).observe(header);
})();
