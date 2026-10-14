/**
 * Builds the HTML document for the live preview.
 *
 * It is an approximation, not Jekyll: Markdown goes through `marked` instead
 * of kramdown, and Liquid is not run. `{{ '/path' | relative_url }}` is
 * resolved so images show; every other Liquid tag is drawn as a grey chip.
 * The result is shown in a sandboxed iframe, see source-field.js.
 */
import { marked } from './vendor/marked.esm.js';

const STYLES = ['tokens', 'base', 'workflow', 'posts', 'notes'];
const FONTS = 'https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap';
const OPEN = '\uE000';
const CLOSE = '\uE001';

export const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** Split the YAML front matter into the few fields the preview header shows. */
export function parseFrontMatter(source) {
  const m = /^---\n([\s\S]*?)\n---(?:\n|$)/.exec(source);
  if (!m) return { meta: {}, body: source };
  const meta = { tags: [] };
  let list = null;
  for (const line of m[1].split('\n')) {
    const kv = /^([A-Za-z_][\w-]*):[ \t]*(.*)$/.exec(line);
    const item = /^\s*-[ \t]+(.*)$/.exec(line);
    if (kv) {
      list = kv[2] === '' ? kv[1] : null;
      if (kv[2] !== '') meta[kv[1]] = unquote(kv[2].trim());
    } else if (item && list === 'tags') meta.tags.push(unquote(item[1].trim()));
  }
  return { meta, body: source.slice(m[0].length) };
}

function unquote(v) {
  const q = /^(["'])([\s\S]*)\1$/.exec(v);
  return q ? q[2].replace(/\\(["\\])/g, '$1') : v;
}

/**
 * Replace Liquid with markers. `relative_url` and `absolute_url` are resolved
 * against `baseUrl`. Content inside raw blocks stays untouched, like Jekyll.
 */
export function prepareLiquid(body, baseUrl) {
  const chips = [];
  const handle = (text) => text.replace(/\{\{-?\s*(['"])([^'"]*)\1\s*\|\s*(?:relative_url|absolute_url)\s*-?\}\}|\{%-?[\s\S]*?-?%\}|\{\{[\s\S]*?\}\}/g, (all, q, path) => {
    if (path !== undefined) return new URL(path.replace(/^\//, ''), baseUrl).href;
    chips.push(all);
    return `${OPEN}${chips.length - 1}${CLOSE}`;
  });
  const parts = body.split(/(\{%-?\s*raw\s*-?%\}[\s\S]*?\{%-?\s*endraw\s*-?%\})/);
  const text = parts.map((p, i) => (i % 2 ? p.replace(/^\{%-?\s*raw\s*-?%\}|\{%-?\s*endraw\s*-?%\}$/g, '') : handle(p))).join('');
  return { text, chips };
}

function restoreChips(html, chips) {
  return html.replace(new RegExp(`${OPEN}(\\d+)${CLOSE}`, 'g'), (_, i) => `<span class="cms-liquid" title="Liquid: filled in on the real site">${escapeHtml(chips[Number(i)])}</span>`);
}

export function renderBody(body, baseUrl) {
  const { text, chips } = prepareLiquid(body, baseUrl);
  const html = restoreChips(marked.parse(text, { gfm: true, breaks: false, async: false }), chips);
  return { html, liquidCount: chips.length };
}

const CHROME = `
body{display:block}
.cms-liquid{font:500 .8em/1 "Geist Mono",ui-monospace,monospace;color:var(--muted,#888);background:color-mix(in srgb,currentColor 12%,transparent);border-radius:4px;padding:.15em .35em;white-space:nowrap}
.cms-note{margin:0 0 1rem;padding:.5rem .75rem;border:1px dashed var(--muted,#888);border-radius:8px;font-size:12px;color:var(--muted,#888)}
`;

/**
 * @param {string} source whole post file, front matter included
 * @param {{baseUrl: string, theme?: 'light'|'dark', runScripts?: boolean}} options
 * @returns {{html: string, liquidCount: number, hasScripts: boolean, title: string}}
 */
export function buildPreviewDocument(source, { baseUrl, theme = 'light', runScripts = false }) {
  const { meta, body } = parseFrontMatter(String(source ?? ''));
  const rendered = renderBody(body, baseUrl);
  const { liquidCount } = rendered;
  // Static mode drops <script> elements so the browser has nothing to block or log.
  const html = runScripts ? rendered.html : rendered.html.replace(/<script\b[\s\S]*?<\/script\s*>/gi, '');
  const hasScripts = /<script\b/i.test(body);
  const tags = meta.tags.map((t) => `<span class="tag-chip">${escapeHtml(t)}</span>`).join('');
  const css = STYLES.map((n) => `<link rel="stylesheet" href="${escapeHtml(new URL(`assets/css/${n}.css`, baseUrl).href)}">`).join('');
  const doc = `<!doctype html><html lang="en" data-theme="${theme === 'dark' ? 'dark' : 'light'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><base href="${escapeHtml(baseUrl)}" target="_blank"><link href="${FONTS}" rel="stylesheet">${css}<style>${CHROME}</style></head><body><main id="main"><article class="article-shell"><header class="article-header"><p class="article-meta"><time>${escapeHtml(meta.date || '')}</time></p><h1>${escapeHtml(meta.title || 'Untitled')}</h1><p class="standfirst">${escapeHtml(meta.summary || '')}</p><div class="tag-list">${tags}</div></header><div class="prose">${html}</div></article></main></body></html>`;
  return { html: doc, liquidCount, hasScripts, title: meta.title || '' };
}
