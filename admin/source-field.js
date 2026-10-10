// Source editor with syntax colors, plus a live preview pane.
//
// The editor is a plain <textarea>. The colors are a read-only copy of the text drawn
// behind it, so what you type is exactly what is saved. The preview renders a copy of
// the text in a sandboxed iframe. Neither writes back to the post.
import { tokenize } from './highlight.mjs';
import { buildPreviewDocument } from './preview.mjs';

const EDITOR_CSS = `
.src { position: relative; border: 1px solid color-mix(in srgb, currentColor 25%, transparent); border-radius: 8px; overflow: hidden; }
.src-bar { display: flex; gap: .75rem; align-items: center; justify-content: space-between; padding: .35rem .75rem; font: 12px/1.4 system-ui, sans-serif; border-bottom: 1px solid color-mix(in srgb, currentColor 18%, transparent); background: color-mix(in srgb, currentColor 5%, transparent); }
.src-bar label { display: inline-flex; gap: .4rem; align-items: center; cursor: pointer; }
.src-stack { position: relative; }
.src-hl, .src-ta { margin: 0; padding: .75rem; border: 0; font: 13px/1.6 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; letter-spacing: 0; tab-size: 2; white-space: pre-wrap; overflow-wrap: break-word; word-break: normal; font-variant-ligatures: none; box-sizing: border-box; width: 100%; }
.src-hl { position: absolute; inset: 0; pointer-events: none; overflow: hidden; color: inherit; }
.src-ta { position: relative; display: block; min-height: 24rem; resize: none; overflow: hidden; background: transparent; color: inherit; outline: none; }
.src-on .src-ta { color: transparent; -webkit-text-fill-color: transparent; caret-color: CanvasText; }
.src-on .src-ta::selection { background: color-mix(in srgb, Highlight 45%, transparent); -webkit-text-fill-color: transparent; }
.src-delim, .src-punct { color: light-dark(#8a8f98, #7d8590); }
.src-key, .src-attr { color: light-dark(#0b6bcb, #79c0ff); }
.src-string { color: light-dark(#116329, #7ee787); }
.src-number { color: light-dark(#953800, #ffa657); }
.src-comment { color: light-dark(#8a8f98, #7d8590); font-style: italic; }
.src-tag { color: light-dark(#b5174c, #ff7b9c); }
.src-keyword { color: light-dark(#8250df, #d2a8ff); }
.src-liquid { color: light-dark(#9a6700, #e3b341); }
.src-heading { color: light-dark(#0b6bcb, #79c0ff); font-weight: 700; }
.src-strong { font-weight: 700; }
.src-code { color: light-dark(#116329, #7ee787); }
.src-link { color: light-dark(#0b6bcb, #79c0ff); }
.src-list { color: light-dark(#b5174c, #ff7b9c); font-weight: 700; }
`;
const PREVIEW_CSS = `
.pv { display: flex; flex-direction: column; height: 100vh; margin: 0; font: 12px/1.4 system-ui, sans-serif; }
.pv-bar { display: flex; flex-wrap: wrap; gap: .5rem .75rem; align-items: center; padding: .4rem .75rem; border-bottom: 1px solid color-mix(in srgb, currentColor 20%, transparent); }
.pv-bar button { font: inherit; padding: .25rem .6rem; border-radius: 6px; border: 1px solid color-mix(in srgb, currentColor 30%, transparent); background: transparent; color: inherit; cursor: pointer; }
.pv-bar button[aria-pressed="true"] { background: color-mix(in srgb, currentColor 15%, transparent); font-weight: 600; }
.pv-note { opacity: .75; flex: 1 1 14rem; }
.pv iframe { flex: 1; width: 100%; border: 0; background: Canvas; }
`;

function register() {
  const CMS = window.CMS;
  if (!CMS) return;
  const { createElement: h, useState, useEffect, useLayoutEffect, useMemo, useRef } = CMS.React;

  function SourceControl({ value, onChange, forID }) {
    const incoming = typeof value === 'string' ? value : '';
    // The CMS hands the value back a moment after each key. Writing that straight into the
    // textarea would move the caret and drop keys, so the textarea keeps its own copy and only
    // takes a value the CMS did not get from us (reload, restore after Later, discard).
    const [text, setText] = useState(incoming);
    const sent = useRef([]);
    useEffect(() => {
      const i = sent.current.indexOf(incoming);
      if (i >= 0) sent.current = i === sent.current.length - 1 ? [] : sent.current; // echo of our own edit
      else { sent.current = []; setText(incoming); }
    }, [incoming]);
    const edit = (next) => {
      sent.current = [...sent.current.slice(-50), next];
      setText(next);
      onChange(next);
    };
    const [colors, setColors] = useState(true);
    const ref = useRef(null);
    const nodes = useMemo(() => (colors ? tokenize(text).map((t, i) => (t.type === 'plain' ? t.text : h('span', { key: i, className: `src-${t.type}` }, t.text))) : null), [text, colors]);
    const grow = () => {
      const ta = ref.current;
      if (!ta) return;
      ta.style.height = 'auto';
      ta.style.height = `${ta.scrollHeight}px`;
    };
    useLayoutEffect(grow, [text, colors]);
    useEffect(() => {
      const ro = new ResizeObserver(grow);
      ro.observe(ref.current);
      return () => ro.disconnect();
    }, []);
    return h('div', { className: `src${colors ? ' src-on' : ''}` },
      h('style', null, EDITOR_CSS),
      h('div', { className: 'src-bar' },
        h('span', null, 'Source: front matter, Markdown and HTML'),
        h('label', null, h('input', { type: 'checkbox', checked: colors, onChange: (e) => setColors(e.target.checked) }), 'Colors')),
      h('div', { className: 'src-stack' },
        colors && h('pre', { className: 'src-hl', 'aria-hidden': 'true' }, nodes, '\n'),
        h('textarea', { id: forID, ref, className: 'src-ta', value: text, spellCheck: false, autoCapitalize: 'off', autoCorrect: 'off', onChange: (e) => edit(e.target.value) })));
  }

  function PreviewPane({ entry }) {
    const source = entry.getIn(['data', 'body']) || '';
    const [live, setLive] = useState(source);
    const [interactive, setInteractive] = useState(false);
    const frame = useRef(null);
    const scroll = useRef(0);
    // Wait for a pause in typing so the page does not reload on every key.
    useEffect(() => {
      const id = setTimeout(() => setLive(source), 350);
      return () => clearTimeout(id);
    }, [source]);
    const dark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    const built = useMemo(() => buildPreviewDocument(live, { baseUrl: new URL('../', import.meta.url).href, theme: dark ? 'dark' : 'light', runScripts: interactive }), [live, dark, interactive]);
    const remember = () => {
      // Readable only without scripts: the frame is then same-origin but cannot run code.
      try { scroll.current = frame.current.contentWindow.scrollY; } catch { scroll.current = 0; }
    };
    useLayoutEffect(() => { remember(); }, [built.html, interactive]);
    const restore = () => { try { frame.current.contentWindow.scrollTo(0, scroll.current); } catch { /* scripts mode */ } };
    // sandbox="" keeps scripts off. allow-same-origin is added only when scripts stay off, so
    // the scroll position survives a refresh. With scripts on, the frame gets an opaque origin
    // and cannot reach this page, the token or the repo.
    return h('div', { className: 'pv' },
      h('style', null, PREVIEW_CSS),
      h('div', { className: 'pv-bar' },
        h('button', { type: 'button', 'aria-pressed': String(!interactive), onClick: () => setInteractive(false) }, 'Static'),
        h('button', { type: 'button', 'aria-pressed': String(interactive), onClick: () => setInteractive(true), title: 'Runs this post\u2019s own scripts in an isolated frame' }, 'Interactive'),
        h('span', { className: 'pv-note' }, interactive
          ? 'Interactive: the post\u2019s scripts run in an isolated frame. Reloads from the top when you edit.'
          : `Approximate preview. ${built.hasScripts ? 'Scripts are off, so widgets look inert; switch to Interactive. ' : ''}${built.liquidCount ? `${built.liquidCount} Liquid tag(s) shown as grey chips. ` : ''}Markdown is rendered by marked, not Jekyll.`)),
      // The key makes switching modes build a new frame. Changing `sandbox` on a live frame only
      // applies at its next navigation, which would let new scripts run with the old flags.
      h('iframe', { key: interactive ? 'interactive' : 'static', ref: frame, title: 'Post preview', sandbox: interactive ? 'allow-scripts' : 'allow-same-origin', referrerPolicy: 'no-referrer', onLoad: restore, srcDoc: built.html }));
  }

  CMS.registerFieldType('post-source', SourceControl);
  fetch(new URL('config.yml', import.meta.url)).then((r) => r.json()).then((config) => {
    for (const c of config.collections) for (const f of c.files || []) CMS.registerPreviewTemplate(f.name, PreviewPane);
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', register, { once: true });
else register();
