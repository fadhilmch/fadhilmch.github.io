// Owner layout editor for the After work board. Opened with /after-work/?edit.
// Move, resize and rotate stickers on the desktop or phone layout, with live spacing checks.
// Drafts are kept in this browser. Publishing copies the layout file and opens GitHub's editor,
// so the change still goes through a reviewed pull request: nothing here can write to the site.
import { checkLayout, describe } from './after-work-layout.js';
import { createHistory, updateItem, moveToFront, moveToBack, attachPair, detachPair, exportLayout, clone, LIMITS } from './after-work-edit-state.js';

const DRAFT_KEY = 'aw-layout-draft-v1';
const PREFIX = { desktop: 'd', mobile: 'm' };
const LABELS = { desktop: 'Desktop', mobile: 'Phone' };
const BOARD_WIDTH = { desktop: null, mobile: 350 }; // phone preview is shown at its design width

const el = (tag, props = {}, ...kids) => {
  const n = Object.assign(document.createElement(tag), props);
  n.append(...kids);
  return n;
};

export async function initEditor(stickers) {
  const published = JSON.parse(document.getElementById('aw-layout').textContent);
  const shapes = await (await fetch(stickers.dataset.shapes)).json();
  const editUrl = stickers.dataset.editUrl;
  const board = stickers.closest('.aw-board');
  // Embedded in the site editor (/admin/): the CMS owns loading and saving, so no drafts or publish steps here.
  const embed = new URLSearchParams(location.search).has('embed') && window.parent !== window;
  let draft = null, fromCms = null;
  if (embed) {
    document.body.classList.add('aw-embed');
    fromCms = await new Promise((resolve) => {
      const done = (e) => {
        if (e.origin !== location.origin || !e.data || e.data.awEmbed !== 'init') return;
        removeEventListener('message', done); resolve(e.data.layout || null);
      };
      addEventListener('message', done);
      window.parent.postMessage({ awEmbed: 'ready' }, location.origin);
      setTimeout(() => { removeEventListener('message', done); resolve(null); }, 3000);
    });
  } else {
    try { draft = JSON.parse(localStorage.getItem(DRAFT_KEY)); } catch { draft = null; }
  }
  const start = (fromCms && fromCms.version === published.version && Array.isArray(fromCms.items)) ? fromCms : draft && draft.version === published.version ? draft : published;
  const history = createHistory(start);
  let bp = matchMedia('(max-width: 700px)').matches ? 'mobile' : 'desktop';
  let selected = null, problems = [], timer = 0, savedNote = '';

  document.body.classList.add('aw-editing');
  document.querySelectorAll('[data-aw-play], [data-aw-reset]').forEach((n) => { n.hidden = true; });
  const items = new Map([...stickers.querySelectorAll('[data-aw-id]')].map((n) => [n.dataset.awId, n]));
  items.forEach((n) => { n.tabIndex = 0; });
  const handles = el('div', { className: 'aw-item aw-handles', hidden: true },
    el('span', { className: 'aw-knob aw-knob--size', title: 'Drag to resize' }),
    el('span', { className: 'aw-knob aw-knob--turn', title: 'Drag to rotate' }));
  stickers.append(handles);

  const layout = () => history.state;
  const place = (id) => layout().items.find((i) => i.id === id)[bp];

  // ----- painting: the page reads positions from CSS variables, so the editor just sets them -----
  function paintItem(it, node) {
    const p = PREFIX[bp], v = it[bp];
    const s = node.style;
    s.setProperty(`--${p}x`, v.x); s.setProperty(`--${p}y`, v.y); s.setProperty(`--${p}w`, v.w);
    s.setProperty(`--${p}r`, v.r); s.setProperty(`--${p}z`, v.z);
    s.setProperty(`--${p}d`, v.show ? (it.type === 'link' ? 'flex' : 'block') : 'none');
  }
  function paintAll() {
    for (const it of layout().items) paintItem(it, items.get(it.id));
    placeHandles();
    items.forEach((n, id) => {
      n.classList.toggle('is-selected', id === selected);
      n.classList.toggle('is-bad', problems.some((p) => p.a === id || p.b === id));
    });
  }
  function placeHandles() {
    const node = selected && items.get(selected);
    handles.hidden = !node || getComputedStyle(node).display === 'none';
    if (handles.hidden) return;
    const it = layout().items.find((i) => i.id === selected);
    paintItem(it, handles);
    handles.style.setProperty(`--${PREFIX[bp]}d`, 'block');
    handles.style.height = node.offsetHeight + 'px';
    handles.style.setProperty(`--${PREFIX[bp]}z`, 99);
  }

  // ----- spacing check -----
  function runChecks() {
    problems = checkLayout(layout(), shapes, bp);
    paintAll(); renderPanel(); notifyCms();
  }
  // Tell the CMS what the layout is now and how many spacing problems it has on either layout.
  function notifyCms() {
    if (!embed) return;
    const count = ['desktop', 'mobile'].reduce((n, k) => n + checkLayout(layout(), shapes, k).length, 0);
    window.parent.postMessage({ awEmbed: 'change', text: exportLayout(layout()), problems: count }, location.origin);
    window.parent.postMessage({ awEmbed: 'height', height: document.documentElement.scrollHeight }, location.origin);
  }
  const scheduleChecks = () => { clearTimeout(timer); timer = setTimeout(runChecks, 120); };

  function change(edit) {
    history.commit(edit);
    savedNote = '';
    paintAll(); scheduleChecks();
  }
  const patchSelected = (patch, id = selected) => change((l) => updateItem(l, bp, id, patch));

  // ----- pointer editing -----
  const unitsPerPx = () => layout().boards[bp].w / stickers.getBoundingClientRect().width;
  const centerOf = (node) => { const r = node.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };

  function select(id) { selected = id; paintAll(); renderPanel(); }

  stickers.addEventListener('click', (e) => { if (e.target.closest('a')) e.preventDefault(); });
  stickers.addEventListener('pointerdown', (e) => {
    if (e.button > 0 || e.target.closest('.aw-knob')) return;
    const node = e.target.closest('[data-aw-id]');
    if (!node) { select(null); return; }
    e.preventDefault();
    const id = node.dataset.awId, start = { ...place(id) }, sx = e.clientX, sy = e.clientY, k = unitsPerPx();
    select(id);
    node.setPointerCapture(e.pointerId);
    let moved = false;
    const move = (m) => {
      const dx = (m.clientX - sx) * k, dy = (m.clientY - sy) * k;
      if (!moved && Math.hypot(dx, dy) < 2) return;
      if (!moved) { moved = true; history.begin(); }
      history.state.items.find((i) => i.id === id)[bp] = { ...start, x: start.x + dx, y: start.y + dy };
      updateItem(history.state, bp, id, {});
      paintAll();
    };
    const up = () => {
      node.removeEventListener('pointermove', move); node.removeEventListener('pointerup', up);
      if (moved) { savedNote = ''; scheduleChecks(); }
    };
    node.addEventListener('pointermove', move); node.addEventListener('pointerup', up);
  });

  function knobDrag(kind) {
    return (e) => {
      e.preventDefault(); e.stopPropagation();
      const node = items.get(selected), c = centerOf(node), start = { ...place(selected) };
      const d0 = Math.hypot(e.clientX - c.x, e.clientY - c.y), a0 = Math.atan2(e.clientY - c.y, e.clientX - c.x);
      handles.setPointerCapture(e.pointerId);
      let moved = false;
      const move = (m) => {
        if (!moved) { moved = true; history.begin(); }
        const it = history.state.items.find((i) => i.id === selected);
        if (kind === 'size') it[bp] = { ...start, w: start.w * Math.hypot(m.clientX - c.x, m.clientY - c.y) / d0 };
        else it[bp] = { ...start, r: start.r + ((Math.atan2(m.clientY - c.y, m.clientX - c.x) - a0) * 180) / Math.PI };
        updateItem(history.state, bp, selected, {});
        paintAll();
      };
      const up = () => {
        handles.removeEventListener('pointermove', move); handles.removeEventListener('pointerup', up);
        if (moved) { savedNote = ''; scheduleChecks(); }
      };
      handles.addEventListener('pointermove', move); handles.addEventListener('pointerup', up);
    };
  }
  handles.querySelector('.aw-knob--size').addEventListener('pointerdown', knobDrag('size'));
  handles.querySelector('.aw-knob--turn').addEventListener('pointerdown', knobDrag('turn'));

  // keyboard: arrows move, + and - resize, [ and ] rotate
  stickers.addEventListener('keydown', (e) => {
    const node = e.target.closest('[data-aw-id]');
    if (!node) return;
    if (selected !== node.dataset.awId) select(node.dataset.awId);
    const p = place(selected), s = e.shiftKey ? 10 : 2;
    const moves = { ArrowLeft: { x: p.x - s }, ArrowRight: { x: p.x + s }, ArrowUp: { y: p.y - s }, ArrowDown: { y: p.y + s },
      '+': { w: p.w + s }, '=': { w: p.w + s }, '-': { w: p.w - s }, '[': { r: p.r - s / 2 }, ']': { r: p.r + s / 2 } };
    if (moves[e.key]) { e.preventDefault(); patchSelected(moves[e.key]); }
  });

  // ----- panel -----
  const panel = el('aside', { className: 'aw-editor', ariaLabel: 'Layout editor' });
  board.after(panel);
  const button = (text, onClick, props = {}) => el('button', { type: 'button', textContent: text, onclick: onClick, ...props });

  function setBreakpoint(next) {
    bp = next; selected = null;
    board.style.maxWidth = BOARD_WIDTH[bp] ? BOARD_WIDTH[bp] + 'px' : '';
    board.style.marginInline = BOARD_WIDTH[bp] ? 'auto' : '';
    paintAll(); runChecks();
  }

  function renderPanel() {
    const l = layout(), sel = selected && l.items.find((i) => i.id === selected);
    const tabs = el('div', { className: 'aw-editor__tabs', role: 'group', ariaLabel: 'Layout' },
      ...Object.keys(LABELS).map((k) => button(LABELS[k], () => setBreakpoint(k), { ariaPressed: String(k === bp) })));
    const wide = bp === 'desktop' && stickers.getBoundingClientRect().width < 661;
    const parts = [el('h2', { textContent: 'Layout editor' }), tabs];
    if (wide) parts.push(el('p', { className: 'aw-editor__warn', textContent: 'This window is too narrow to show the desktop layout. Widen it to at least 700 px.' }));

    parts.push(el('div', { className: 'aw-editor__row' },
      button('Undo', () => { history.undo(); afterHistory(); }, { disabled: !history.canUndo }),
      button('Redo', () => { history.redo(); afterHistory(); }, { disabled: !history.canRedo }),
      button('Reset to published', () => { history.commit((x) => Object.assign(x, clone(published))); afterHistory(); })));

    if (sel) {
      const p = sel[bp];
      const field = (label, key, min, max, step) => {
        const input = el('input', { type: 'range', min, max, step, value: p[key] });
        input.addEventListener('input', () => patchSelected({ [key]: Number(input.value) }));
        return el('label', {}, `${label} `, input);
      };
      const show = el('input', { type: 'checkbox', checked: p.show });
      show.addEventListener('change', () => { patchSelected({ show: show.checked }); });
      parts.push(el('fieldset', {}, el('legend', { textContent: `${sel.id} (${LABELS[bp]})` }),
        field('Size', 'w', LIMITS.w[0], LIMITS.w[1], 1), field('Turn', 'r', LIMITS.r[0], LIMITS.r[1], 1),
        el('label', {}, show, ' Show on this layout'),
        el('div', { className: 'aw-editor__row' },
          button('Bring forward', () => change((x) => moveToFront(x, bp, selected))),
          button('Send back', () => change((x) => moveToBack(x, bp, selected))))));
    } else {
      parts.push(el('p', { className: 'aw-editor__hint', textContent: 'Click a sticker to select it. Drag to move, use the corner knob to resize and the top knob to turn. Arrow keys nudge, + and - resize, [ and ] turn. Hidden stickers are listed below.' }));
      const hidden = l.items.filter((i) => !i[bp].show);
      if (hidden.length) parts.push(el('div', { className: 'aw-editor__row' }, ...hidden.map((i) => button('+ ' + i.id, () => { patchSelected({ show: true }, i.id); select(i.id); }))));
    }

    const list = el('ul', { className: 'aw-editor__problems' });
    if (!problems.length) list.append(el('li', { className: 'is-ok', textContent: `Spacing is clear on the ${LABELS[bp]} layout, including hover.` }));
    for (const pr of problems) {
      const li = el('li', { textContent: describe(pr) + ' ' });
      if (pr.b && pr.type !== 'gap') li.append(button('Mark as attached', () => change((x) => attachPair(x, pr.a, pr.b))));
      list.append(li);
    }
    parts.push(el('h3', { textContent: `Spacing (at least ${l.min_gap[bp]} units apart)` }), list);
    if (l.attached.length) {
      parts.push(el('h3', { textContent: 'Attached on purpose' }), el('ul', { className: 'aw-editor__attached' },
        ...l.attached.map(([a, b]) => el('li', {}, `${a} + ${b} `, button('Remove', () => change((x) => detachPair(x, a, b)))))));
    }

    if (embed) parts.push(el('p', { className: 'aw-editor__hint', textContent: 'Use Save in the editor header to open a review pull request. Nothing goes live until it is merged. Save is blocked while either layout has a spacing problem.' }));
    else parts.push(el('div', { className: 'aw-editor__row' },
      button('Save draft', () => { saveDraft(); }),
      button('Publish…', publish, { className: 'is-primary' })),
      el('p', { className: 'aw-editor__hint', textContent: savedNote || 'Drafts stay in this browser. Visitors see the published layout only.' }));
    panel.replaceChildren(...parts);
  }

  function afterHistory() { paintAll(); runChecks(); }
  function saveDraft() {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(layout()));
    savedNote = 'Draft saved in this browser.'; renderPanel();
  }
  async function publish() {
    const bad = ['desktop', 'mobile'].flatMap((k) => checkLayout(layout(), shapes, k).map((p) => `${LABELS[k]}: ${describe(p)}`));
    if (bad.length) { savedNote = `Fix first. ${bad.slice(0, 3).join('; ')}${bad.length > 3 ? ` (+${bad.length - 3} more)` : ''}`; renderPanel(); return; }
    saveDraft();
    const text = exportLayout(layout());
    let copied = false;
    try { await navigator.clipboard.writeText(text); copied = true; } catch { copied = false; }
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const done = el('div', { className: 'aw-editor__done' },
      el('p', { textContent: copied ? 'Layout copied. Both layouts pass the spacing check.' : 'Both layouts pass the spacing check. Copy was blocked, so use the download.' }),
      el('ol', {}, el('li', {}, 'Open the file on GitHub: ', el('a', { href: editUrl, target: '_blank', rel: 'noopener', textContent: '_data/after_work_layout.json' })),
        el('li', { textContent: 'Paste the layout over the file.' }),
        el('li', { textContent: 'Choose "Create a new branch and start a pull request", then review it before merging.' })),
      el('a', { href: url, download: 'after_work_layout.json', textContent: 'Download after_work_layout.json' }));
    panel.replaceChildren(done, button('Back to editing', renderPanel));
  }

  addEventListener('resize', () => { placeHandles(); renderPanel(); });
  setBreakpoint(bp);
}
