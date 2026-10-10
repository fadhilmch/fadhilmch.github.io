import { strict as assert } from 'node:assert';
import { readFileSync, readdirSync } from 'node:fs';
import { test } from 'node:test';
import { tokenize, TOKEN_TYPES } from '../admin/highlight.mjs';
import { buildPreviewDocument, parseFrontMatter, prepareLiquid } from '../admin/preview.mjs';

const root = new URL('../', import.meta.url);
const BASE = 'https://example.test/';
const posts = readdirSync(new URL('_posts/', root)).filter((f) => f.endsWith('.md'));

for (const name of posts) {
  test(`${name}: tokens join back to the exact source`, () => {
    const source = readFileSync(new URL(`_posts/${name}`, root), 'utf8');
    const tokens = tokenize(source);
    assert.equal(tokens.map((t) => t.text).join(''), source);
    for (const t of tokens) assert.ok(TOKEN_TYPES.includes(t.type), t.type);
  });
}

test('tokens join back to the source for awkward input', () => {
  for (const s of ['', '---', '---\n', '---\na: b\n---', '<div', '<!-- open', '<script>let a = `x', '```js\nno close', '{% raw', 'a\r\nb', '\u{1F600} <b>é</b>', '<style>a{}</style>x']) {
    assert.equal(tokenize(s).map((t) => t.text).join(''), s);
  }
});

test('highlights the main constructs', () => {
  const kinds = (s) => tokenize(s).filter((t) => t.type !== 'plain').map((t) => `${t.type}:${t.text}`);
  assert.deepEqual(kinds('---\ntitle: "A"\n---\n'), ['delim:---', 'key:title', 'punct::', 'string:"A"', 'delim:\n---']);
  assert.ok(kinds('# Head').includes('heading:# Head'));
  assert.ok(kinds('<a href="x">').includes('attr:href'));
  assert.ok(kinds("<script>const a = 'b'; // c\n</script>").includes('keyword:const'));
  assert.ok(kinds('{{ page.title }}').includes('liquid:{{ page.title }}'));
  assert.ok(kinds('<!-- hi -->').includes('comment:<!-- hi -->'));
});

test('front matter fields reach the preview header', () => {
  const { meta, body } = parseFrontMatter('---\nlayout: post\ntitle: "A \\"b\\""\ndate: 2026-01-02\ntags:\n- x\n- y\nsummary: S\n---\n\nBody');
  assert.equal(meta.title, 'A "b"');
  assert.deepEqual(meta.tags, ['x', 'y']);
  assert.equal(meta.summary, 'S');
  assert.equal(body.trim(), 'Body');
});

test('Liquid: relative_url is resolved, other tags become chips, raw blocks stay literal', () => {
  const { text, chips } = prepareLiquid("<img src=\"{{ '/assets/a.png' | relative_url }}\"> {{ page.x }} {% raw %}{{ .Values.a }}{% endraw %}", BASE);
  assert.match(text, /src="https:\/\/example\.test\/assets\/a\.png"/);
  assert.deepEqual(chips, ['{{ page.x }}']);
  assert.match(text, /\{\{ \.Values\.a \}\}/);
});

test('preview: static mode has no scripts; interactive keeps them; text is escaped', () => {
  const source = '---\ntitle: "<img src=x onerror=alert(1)>"\ndate: 2026-01-01\n---\n\nHello\n\n<script>window.x = 1</script>\n\n{{ page.url }}';
  const stat = buildPreviewDocument(source, { baseUrl: BASE });
  assert.ok(!/<script/i.test(stat.html));
  assert.ok(stat.hasScripts);
  assert.equal(stat.liquidCount, 1);
  assert.ok(!stat.html.includes('<img src=x onerror'), 'title must be escaped');
  assert.match(stat.html, /&lt;img src=x onerror=alert\(1\)&gt;/);
  const live = buildPreviewDocument(source, { baseUrl: BASE, runScripts: true });
  assert.match(live.html, /<script>window\.x = 1<\/script>/);
});

for (const name of posts) {
  test(`${name}: preview builds with the site styles`, () => {
    const source = readFileSync(new URL(`_posts/${name}`, root), 'utf8').trim();
    const { html, title } = buildPreviewDocument(source, { baseUrl: BASE });
    assert.ok(title);
    assert.match(html, /assets\/css\/posts\.css/);
    assert.ok(html.includes('class="prose"'));
  });
}
