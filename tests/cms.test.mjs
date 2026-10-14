import { strict as assert } from 'node:assert';
import { readFileSync, readdirSync } from 'node:fs';
import { test } from 'node:test';
import { validatePostSource } from '../admin/validation.mjs';

const config = JSON.parse(readFileSync(new URL('../admin/config.yml', import.meta.url)));
const posts = config.collections[0];
const root = new URL('../', import.meta.url);
test('token-only, PR-only, auto-discovered posts configuration', () => {
  assert.equal(config.backend.branch, 'master');
  assert.deepEqual(config.backend.auth_methods, ['token']);
  assert.equal(config.publish_mode, 'editorial_workflow');
  assert.equal(posts.publish, false);
  assert.equal(posts.delete, false);
  assert.equal(posts.editor.preview, true);
  assert.equal(config.media_folder, 'admin/media-readonly');
  assert.equal(posts.folder, '_posts');
  assert.equal(posts.extension, undefined); // post-raw registration supplies md
  assert.equal(posts.format, 'post-raw');
  assert.equal(posts.fields.length, 1);
  assert.equal(posts.fields[0].name, 'body');
  assert.equal(posts.fields[0].widget, 'post-source');
  assert.deepEqual(posts.slug.editable, ['create']);
  assert.equal(posts.slug.template, undefined);
  const slugPattern = new RegExp(posts.slug.pattern[0]);
  assert.ok(slugPattern.test('2026-10-14-my-new-post'));
  assert.ok(!slugPattern.test('2026-10-14-My_New_Post'));
  assert.match(posts.slug.pattern[0], /\\d\{4\}-\\d\{2\}-\\d\{2\}/);
  assert.ok(readdirSync(new URL('_posts/', root)).some((f) => f.endsWith('.md')));
});
const postFiles = readdirSync(new URL('_posts/', root)).filter((name) => name.endsWith('.md'));
for (const name of postFiles) {
  test(`_posts/${name}: custom raw pipeline preserves full source`, async () => {
    const { formatPostFile, parsePostFile } = await import('../admin/post-format.mjs');
    const original = readFileSync(new URL(`_posts/${name}`, root), 'utf8');
    const parsed = parsePostFile(original);
    validatePostSource(parsed.body);
    // Sveltia 0.233.0's custom formatter wrapper trims and adds one final LF.
    assert.equal(`${formatPostFile(parsed).trim()}\n`, original);
  });
}
test('basic checks reject missing or empty metadata and body', () => {
  const valid = '---\nlayout: post\ntitle: Test\ndate: 2021-10-09\nsummary: Test\n---\n\nBody';
  assert.equal(validatePostSource(valid), valid);
  assert.equal(validatePostSource(`${valid}\n`), `${valid}\n`);
  assert.throws(() => validatePostSource(`${valid}\n\n`));
  assert.throws(() => validatePostSource(`\n${valid}`));
  for (const source of ['', valid.replace('title: Test', 'title:'), valid.replace('layout: post', 'layout: note'), valid.replace('date: 2021-10-09', 'date: yesterday'), valid.slice(0, valid.indexOf('\n\nBody')), `${valid}\r\n`]) {
    assert.throws(() => validatePostSource(source));
  }
});


test('pinned CMS format bootstrap uses only registerCustomFormat', async () => {
  const { registerPostFormat } = await import('../admin/post-format.mjs');
  let registration;
  registerPostFormat({ registerCustomFormat: (...args) => { registration = args; } });
  assert.equal(registration[0], 'post-raw');
  assert.equal(registration[1], 'md');
  assert.equal(typeof registration[2].fromFile, 'function');
  assert.equal(typeof registration[2].toFile, 'function');
});
test('posts use an auto-discovered raw folder and a complete creation template', async () => {
  const collection = config.collections.find((item) => item.name === 'posts');
  assert.equal(collection.folder, '_posts');
  assert.equal(collection.extension, undefined); // custom format owns its extension
  assert.equal(collection.format, 'post-raw');
  assert.equal(collection.slug.template, undefined);
  assert.deepEqual(collection.slug.editable, ['create']);
  const { createPostSource, formatPostFile, parsePostFile } = await import('../admin/post-format.mjs');
  const template = createPostSource({ title: 'My New Post', date: '2026-10-14', summary: 'A short summary', tags: ['notes'] });
  assert.match(template, /^---\nlayout: post\ntitle: "My New Post"\ndate: 2026-10-14\ntags:\n- \"notes\"\nsummary: "A short summary"\n---\n\n/);
  assert.equal(formatPostFile({ body: template }), `${template}\n`);
  assert.deepEqual(parsePostFile(template), { body: template });
  assert.match(collection.slug.pattern[0], /^\^\\d/);
  assert.ok(collection.slug.hint.includes('YYYY-MM-DD-slug'));
});
