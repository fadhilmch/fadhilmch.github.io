(function () {
  var workspace = document.querySelector('[data-note-workspace]');
  if (!workspace) return;

  var explorer = workspace.querySelector('[data-explorer]');
  var toggle = workspace.querySelector('[data-explorer-toggle]');
  var search = workspace.querySelector('[data-note-search]');
  var groups = Array.prototype.slice.call(workspace.querySelectorAll('[data-note-group]'));
  var empty = workspace.querySelector('[data-notes-empty]');
  var urls = {};
  try { urls = JSON.parse(document.getElementById('note-urls').textContent); } catch (error) {}

  // Size the workspace to the viewport minus header and footer.
  function size() {
    var header = document.querySelector('.site-header');
    var footer = document.querySelector('.site-footer');
    var chrome = (header ? header.offsetHeight : 0) + (footer ? footer.offsetHeight : 0);
    workspace.style.setProperty('--notes-h', 'calc(100vh - ' + chrome + 'px)');
  }
  size();
  window.addEventListener('resize', size);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(size);

  if (toggle) toggle.addEventListener('click', function () {
    var open = explorer.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
  });

  var restore = null;
  function filter() {
    var query = (search.value || '').trim().toLowerCase();
    if (query && !restore) restore = groups.map(function (g) { return g.open; });
    var visible = 0;
    groups.forEach(function (group, index) {
      var matches = 0;
      Array.prototype.forEach.call(group.querySelectorAll('[data-note-item]'), function (item) {
        var match = !query || item.dataset.title.indexOf(query) !== -1 || item.dataset.tag.indexOf(query) !== -1;
        item.hidden = !match;
        if (match) matches += 1;
      });
      group.hidden = matches === 0;
      if (query) group.open = matches > 0;
      else if (restore) group.open = restore[index];
      visible += matches;
    });
    if (!query) restore = null;
    empty.hidden = visible !== 0;
  }

  function replaceWikiLinks() {
    var body = workspace.querySelector('.note-body');
    if (!body) return;
    var walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (textNode) {
      if (!/\[\[[^\]]+\]\]/.test(textNode.nodeValue)) return;
      var fragment = document.createDocumentFragment();
      var value = textNode.nodeValue;
      var last = 0;
      value.replace(/\[\[([^\]]+)\]\]/g, function (match, id, offset) {
        id = id.trim();
        fragment.appendChild(document.createTextNode(value.slice(last, offset)));
        var el;
        if (urls[id]) { el = document.createElement('a'); el.href = urls[id]; }
        else { el = document.createElement('span'); el.className = 'wikilink--missing'; }
        el.textContent = match;
        fragment.appendChild(el);
        last = offset + match.length;
        return match;
      });
      fragment.appendChild(document.createTextNode(value.slice(last)));
      textNode.parentNode.replaceChild(fragment, textNode);
    });
  }

  search.addEventListener('input', filter);
  filter();
  replaceWikiLinks();
  // Deferred scripts run in order, so fm-graph may not have registered its listener yet; dispatch after load too.
  var focus = function () { window.dispatchEvent(new CustomEvent('fm-note-focus', { detail: workspace.dataset.currentNote })); };
  focus();
  window.addEventListener('load', focus);
}());
