/**
 * Syntax highlighting for a post's source: YAML front matter, Markdown, HTML,
 * inline <script>/<style> blocks and Liquid tags.
 *
 * This is display-only. `tokenize()` returns tokens whose text, joined in order,
 * is exactly the input. The editor never writes highlighted text back, so the
 * saved file is whatever the textarea holds.
 */

const JS_KEYWORDS = new Set((
  'async await break case catch class const continue default delete do else export extends finally for from function if import in instanceof let new of return static super switch this throw try typeof var void while yield true false null undefined'
).split(' '));

const TOKEN_TYPES = ['plain', 'delim', 'key', 'string', 'number', 'comment', 'tag', 'attr', 'punct', 'liquid', 'heading', 'code', 'strong', 'link', 'keyword', 'list'];
export { TOKEN_TYPES };

/** Push a token, merging with the previous one when the type matches. */
function add(out, type, text) {
  if (!text) return;
  const last = out[out.length - 1];
  if (last && last.type === type) last.text += text;
  else out.push({ type, text });
}

function frontMatter(src, out) {
  // Returns the index where the body starts, or 0 when there is no front matter.
  if (!src.startsWith('---\n')) return 0;
  const end = src.indexOf('\n---', 3);
  if (end < 0) return 0;
  let close = end + 4;
  if (src[close] !== '\n' && close !== src.length) return 0;
  add(out, 'delim', '---');
  const head = src.slice(3, end);
  for (const line of head.split(/(?<=\n)/)) {
    const m = /^(\s*)([A-Za-z_][\w-]*)(:)([ \t]*)([^\n]*)(\n?)$/.exec(line);
    if (m) {
      add(out, 'plain', m[1]);
      add(out, 'key', m[2]);
      add(out, 'punct', m[3]);
      add(out, 'plain', m[4]);
      scalar(m[5], out);
      add(out, 'plain', m[6]);
    } else if (/^\s*-[ \t]/.test(line)) {
      const k = /^(\s*)(-)([ \t]+)([^\n]*)(\n?)$/.exec(line);
      add(out, 'plain', k[1]);
      add(out, 'punct', k[2]);
      add(out, 'plain', k[3]);
      scalar(k[4], out);
      add(out, 'plain', k[5]);
    } else add(out, 'plain', line);
  }
  add(out, 'delim', src.slice(end, close));
  return close;
}

function scalar(text, out) {
  if (/^("|').*\1\s*$/.test(text)) add(out, 'string', text);
  else if (/^-?\d[\d.:-]*\s*$/.test(text)) add(out, 'number', text);
  else add(out, 'plain', text);
}

function script(text, out, lang) {
  const re = lang === 'css'
    ? /\/\*[\s\S]*?(?:\*\/|$)|"(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?|#[0-9a-fA-F]{3,8}\b|-?\d+(?:\.\d+)?(?:px|em|rem|%|vh|vw|s|ms|deg)?\b|--?[A-Za-z][\w-]*(?=\s*:)/g
    : /\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$)|"(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?|`(?:\\[\s\S]|[^`\\])*`?|\b\d+(?:\.\d+)?\b|\b[A-Za-z_$][\w$]*\b/g;
  let pos = 0;
  for (const m of text.matchAll(re)) {
    add(out, 'plain', text.slice(pos, m.index));
    const t = m[0];
    let type = 'plain';
    if (t.startsWith('//') || t.startsWith('/*')) type = 'comment';
    else if (/^["'`]/.test(t)) type = 'string';
    else if (/^[\d#]/.test(t) || (lang === 'css' && /^-?\d/.test(t))) type = 'number';
    else if (lang === 'css' && t.startsWith('-')) type = 'attr';
    else if (JS_KEYWORDS.has(t)) type = 'keyword';
    add(out, type, t);
    pos = m.index + t.length;
  }
  add(out, 'plain', text.slice(pos));
}

function tag(text, out) {
  const m = /^(<\/?)([A-Za-z][^\s>/]*)([\s\S]*?)(\/?>?)$/.exec(text);
  add(out, 'punct', m[1]);
  add(out, 'tag', m[2]);
  const attrs = m[3];
  const re = /"[^"]*"?|'[^']*'?|[^\s=]+|=|\s+/g;
  let afterEq = false;
  for (const a of attrs.matchAll(re)) {
    const t = a[0];
    if (t === '=') { add(out, 'punct', t); afterEq = true; continue; }
    if (/^\s+$/.test(t)) { add(out, 'plain', t); continue; }
    if (/^["']/.test(t) || afterEq) add(out, 'string', t);
    else add(out, 'attr', t);
    afterEq = false;
  }
  add(out, 'punct', m[4]);
}

function inline(text, out) {
  // Inline Markdown on a plain stretch: code spans, bold, links.
  const re = /`[^`\n]+`|\*\*[^*\n]+\*\*|\[[^\]\n]+\]\([^)\n]*\)/g;
  let pos = 0;
  for (const m of text.matchAll(re)) {
    add(out, 'plain', text.slice(pos, m.index));
    const t = m[0];
    add(out, t[0] === '`' ? 'code' : t[0] === '*' ? 'strong' : 'link', t);
    pos = m.index + t.length;
  }
  add(out, 'plain', text.slice(pos));
}

/** Lines of Markdown text between HTML constructs: headings, lists, fences, inline spans. */
function markdown(text, out, atLineStart) {
  const lines = text.split(/(?<=\n)/);
  lines.forEach((line, i) => {
    const start = i > 0 || atLineStart;
    let m;
    if (start && (m = /^(#{1,6}[ \t].*?)(\n?)$/.exec(line))) {
      add(out, 'heading', m[1]);
      add(out, 'plain', m[2]);
    } else if (start && (m = /^(\s*)([-*+]|\d+\.)([ \t]+)([\s\S]*)$/.exec(line))) {
      add(out, 'plain', m[1]);
      add(out, 'list', m[2]);
      add(out, 'plain', m[3]);
      inline(m[4], out);
    } else inline(line, out);
  });
}

export function tokenize(source) {
  const out = [];
  const src = String(source);
  let pos = frontMatter(src, out);
  let plainStart = pos;
  const re = /^(?:```|~~~)[^\n]*\n[\s\S]*?(?:\n(?:```|~~~)[ \t]*(?=\n|$)|$)|\{%[\s\S]*?%\}|\{\{[\s\S]*?\}\}|<!--[\s\S]*?(?:-->|$)|<(script|style)\b[^>]*>[\s\S]*?(?:<\/\1\s*>|$)|<\/?[A-Za-z][^\s>/]*(?:"[^"]*"|'[^']*'|[^>"'])*>?/gm;
  re.lastIndex = pos;
  const flush = (end) => {
    if (end > plainStart) markdown(src.slice(plainStart, end), out, plainStart === 0 || src[plainStart - 1] === '\n');
  };
  let m;
  while ((m = re.exec(src))) {
    const t = m[0];
    flush(m.index);
    plainStart = m.index + t.length;
    if (/^(```|~~~)/.test(t)) add(out, 'code', t);
    else if (t.startsWith('{')) add(out, 'liquid', t);
    else if (t.startsWith('<!--')) add(out, 'comment', t);
    else if (m[1]) {
      const open = /^<[^>]*>/.exec(t)[0];
      const closeAt = t.search(/<\/(?:script|style)\s*>$/i);
      const inner = t.slice(open.length, closeAt < 0 ? t.length : closeAt);
      tag(open, out);
      script(inner, out, m[1] === 'style' ? 'css' : 'js');
      if (closeAt >= 0) tag(t.slice(closeAt), out);
    } else tag(t, out);
    if (t.length === 0) re.lastIndex++;
  }
  flush(src.length);
  return out;
}
