// Grouped filter for the Coffee and Cooking lists: one Filter button, chips for the picks, and a
// popover (desktop) or bottom sheet (phone) holding the groups. Without JS every recipe stays shown
// and the filter stays hidden. Rules live in recipe-filter-core.js.
(function () {
  var core = window.RecipeFilterCore;
  var root = document.querySelector('[data-aw-filter]');
  var menu = document.querySelector('[data-aw-menu]');
  if (!core || !root || !menu) return;

  var openBtn = root.querySelector('.aw-filters__open');
  var panel = root.querySelector('.aw-filters__panel');
  var scrim = root.querySelector('[data-scrim]');
  var chips = root.querySelector('[data-chips]');
  var badge = root.querySelector('[data-badge]');
  var done = root.querySelector('[data-done]');
  var status = root.querySelector('[data-status]');
  var nomatch = document.querySelector('[data-nomatch]');
  var groups = [].slice.call(root.querySelectorAll('.aw-fgroup'));
  var cards = [].slice.call(menu.querySelectorAll('.aw-card'));
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var sheet = matchMedia('(max-width: 700px)');
  var selection = {};
  var labels = {};

  groups.forEach(function (g) {
    var id = g.dataset.group;
    selection[id] = [];
    labels[id] = g.querySelector('.aw-fgroup__head span').textContent;
  });

  var recipes = cards.map(function (card) {
    var values = {};
    groups.forEach(function (g) { values[g.dataset.group] = core.parseValues(card.getAttribute('data-g-' + g.dataset.group)); });
    return values;
  });

  function showCard(card, visible) {
    if (visible === !card.hidden) return;
    if (visible) {
      card.hidden = false;
      if (!reduce) { card.classList.add('is-in'); setTimeout(function () { card.classList.remove('is-in'); }, 400); }
    } else if (reduce) {
      card.hidden = true;
    } else {
      card.classList.add('is-out');
      setTimeout(function () { card.hidden = true; card.classList.remove('is-out'); }, 180);
    }
  }

  function renderChips() {
    chips.textContent = '';
    groups.forEach(function (g) {
      var id = g.dataset.group;
      selection[id].forEach(function (value) {
        var chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'aw-fchip';
        chip.dataset.group = id;
        chip.dataset.value = value;
        chip.setAttribute('aria-label', 'Remove filter ' + labels[id] + ': ' + value);
        var label = document.createElement('small'); label.textContent = labels[id];
        var text = document.createElement('span'); text.textContent = value;
        var x = document.createElement('i'); x.setAttribute('aria-hidden', 'true'); x.textContent = '×';
        chip.append(label, text, x);
        chips.appendChild(chip);
      });
    });
    if (core.total(selection)) {
      var clear = document.createElement('button');
      clear.type = 'button'; clear.className = 'aw-link'; clear.dataset.clear = '';
      clear.textContent = 'Clear';
      chips.appendChild(clear);
    }
  }

  function render() {
    var shown = 0;
    cards.forEach(function (card, i) {
      var visible = core.matches(selection, recipes[i]);
      if (visible) shown++;
      showCard(card, visible);
    });
    var count = core.total(selection);
    badge.hidden = !count;
    badge.textContent = count;
    root.classList.toggle('has-filters', count > 0);
    groups.forEach(function (g) {
      var id = g.dataset.group;
      g.querySelector('[data-summary]').textContent = core.summary(selection, id);
      g.querySelector('[data-summary]').classList.toggle('is-set', selection[id].length > 0);
      [].forEach.call(g.querySelectorAll('.aw-opt[data-value]'), function (o) {
        o.setAttribute('aria-pressed', String(selection[id].indexOf(o.dataset.value) > -1));
      });
    });
    done.textContent = 'Show ' + core.countLabel(shown);
    nomatch.hidden = shown > 0;
    status.textContent = count ? core.countLabel(shown) + ' match the filters.' : '';
    renderChips();
  }

  function setOpen(open) {
    panel.hidden = !open;
    scrim.hidden = !open || !sheet.matches;
    openBtn.setAttribute('aria-expanded', String(open));
    document.documentElement.classList.toggle('aw-filters-lock', open && sheet.matches);
    if (open) {
      var first = panel.querySelector('.aw-opt[data-value]');
      (first || panel).focus({ preventScroll: true });
    } else if (document.activeElement && panel.contains(document.activeElement)) {
      openBtn.focus({ preventScroll: true });
    }
  }

  function setExpanded(group, expanded) {
    group.classList.toggle('is-open', expanded);
    group.querySelector('.aw-fgroup__head').setAttribute('aria-expanded', String(expanded));
  }

  function syncLayout() {
    groups.forEach(function (g, i) {
      var keep = sheet.matches ? (g.classList.contains('is-open') || (i === 0 && !panel.dataset.touched)) : true;
      setExpanded(g, keep);
    });
    if (!panel.hidden) scrim.hidden = !sheet.matches;
    if (!sheet.matches) document.documentElement.classList.remove('aw-filters-lock');
  }

  openBtn.addEventListener('click', function () { setOpen(panel.hidden); });
  scrim.addEventListener('click', function () { setOpen(false); });
  done.addEventListener('click', function () { setOpen(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) setOpen(false); });
  document.addEventListener('click', function (e) {
    if (!panel.hidden && !sheet.matches && !root.contains(e.target)) setOpen(false);
  });

  root.addEventListener('click', function (e) {
    var t = e.target.closest('button');
    if (!t || !root.contains(t)) return;
    if (t.matches('[data-clear]')) {
      groups.forEach(function (g) { selection[g.dataset.group] = []; });
      render();
    } else if (t.matches('.aw-fchip')) {
      selection = core.toggle(selection, t.dataset.group, t.dataset.value);
      render();
    } else if (t.matches('.aw-opt[data-value]')) {
      selection = core.toggle(selection, t.closest('.aw-fgroup').dataset.group, t.dataset.value);
      render();
    } else if (t.matches('[data-more]')) {
      var host = t.closest('.aw-fgroup');
      host.dataset.expanded = '1';
      listOptions(host, '');
    } else if (t.matches('.aw-fgroup__head') && sheet.matches) {
      panel.dataset.touched = '1';
      var g = t.closest('.aw-fgroup');
      setExpanded(g, !g.classList.contains('is-open'));
    }
  });

  // Shows the first options, or every option once expanded or while searching.
  function listOptions(group, term) {
    var expanded = group.dataset.expanded === '1';
    var more = group.querySelector('[data-more]');
    [].forEach.call(group.querySelectorAll('.aw-opt[data-value]'), function (o) {
      if (term) o.hidden = o.dataset.value.toLowerCase().indexOf(term) < 0;
      else o.hidden = o.hasAttribute('data-extra') && !expanded;
    });
    if (more) more.hidden = expanded || !!term;
  }

  root.addEventListener('input', function (e) {
    if (!e.target.matches('[data-search]')) return;
    listOptions(e.target.closest('.aw-fgroup'), e.target.value.trim().toLowerCase());
  });

  if (sheet.addEventListener) sheet.addEventListener('change', syncLayout);
  root.hidden = false;
  syncLayout();
  render();
})();
