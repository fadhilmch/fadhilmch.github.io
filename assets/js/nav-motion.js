/* Native links remain native. Only a recent, matching arrival gets motion. */
(function () {
  'use strict';
  var nav = document.querySelector('.primary-nav');
  if (!nav) return;
  var links = Array.from(nav.querySelectorAll('a'));
  var selected = nav.querySelector('[aria-current="page"]');
  if (!selected) return;
  var family = nav.classList.contains('aw-nav') ? 'after-work' : 'main';
  var key = 'fm-nav-arrival-' + family;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)');
  var marker = document.createElement('span');
  marker.className = 'nav-motion-marker';
  marker.setAttribute('aria-hidden', 'true');
  var puddle = document.createElement('span');
  marker.appendChild(puddle);
  nav.prepend(marker);
  function place(link) {
    var box = link.getBoundingClientRect();
    var parent = nav.getBoundingClientRect();
    marker.style.left = (box.left - parent.left - nav.clientLeft) + 'px';
    marker.style.top = (box.top - parent.top - nav.clientTop) + 'px';
    marker.style.width = box.width + 'px';
    marker.style.height = box.height + 'px';
  }
  function stop() {
    [marker, puddle].concat(links.map(function (a) { return a.querySelector('img'); })).forEach(function (el) {
      if (el && el.getAnimations) el.getAnimations().forEach(function (a) { a.cancel(); });
    });
    place(selected);
  }
  place(selected);
  nav.dataset.motion = 'ready';
  var arrival;
  try {
    arrival = JSON.parse(sessionStorage.getItem(key));
    sessionStorage.removeItem(key);
  } catch (_) {}
  var navigation = performance.getEntriesByType('navigation')[0];
  if (!reduce.matches && marker.animate && arrival &&
      arrival.to === location.pathname && Date.now() - arrival.at >= 0 && Date.now() - arrival.at < 10000 &&
      navigation && navigation.type === 'navigate' && document.referrer &&
      new URL(document.referrer).origin === location.origin &&
      Number.isInteger(arrival.from) && links[arrival.from] && links[arrival.from] !== selected) {
    var dx = links[arrival.from].offsetLeft - selected.offsetLeft;
    var overshoot = dx < 0 ? 4 : -4;
    marker.animate([{transform:'translateX(' + dx + 'px)'},
      {transform:'translateX(' + overshoot + 'px)',offset:.76},{transform:'translateX(0)'}],
      {duration:300,easing:'cubic-bezier(.2,.75,.25,1)'});
    puddle.animate([{transform:'scale(1)'},{transform:'scale(1.12,.78) rotate(-2deg)',offset:.35},
      {transform:'scale(.96,1.06) rotate(1deg)',offset:.78},{transform:'scale(1)'}],{duration:300,easing:'ease-out'});
    var icon = selected.querySelector('img');
    if (icon) icon.animate([{transform:'translateY(0) rotate(0)'},
      {transform:'translateY(-6px) rotate(' + (links.indexOf(selected) === 1 ? -12 : 10) + 'deg)',offset:.48},
      {transform:'translateY(1px) rotate(-3deg)',offset:.83},{transform:'translateY(0) rotate(0)'}],{duration:380,easing:'ease-out'});
  }
  nav.addEventListener('click', function (event) {
    var link = event.target.closest('a');
    if (!links.includes(link) || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.download || (link.target && link.target !== '_self')) return;
    try {
      sessionStorage.removeItem(key);
      var target = new URL(link.href);
      if (!reduce.matches && target.origin === location.origin && target.pathname !== location.pathname) {
        sessionStorage.setItem(key, JSON.stringify({from:links.indexOf(selected),to:target.pathname,at:Date.now()}));
      }
    } catch (_) {} // Storage disabled: the normal link and selected state still work.
  });
  window.addEventListener('resize', stop);
  if (window.ResizeObserver) {
    var size = nav.getBoundingClientRect().width;
    new ResizeObserver(function () {
      var next = nav.getBoundingClientRect().width;
      if (Math.abs(next - size) > .5) { size = next; stop(); }
    }).observe(nav);
  }
  window.addEventListener('pageshow', function (event) { if (event.persisted) stop(); });
  if (reduce.addEventListener) reduce.addEventListener('change', stop);
})();
