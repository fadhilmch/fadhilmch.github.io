import { strict as assert } from 'node:assert';
import { readFileSync, readdirSync } from 'node:fs';
import { test } from 'node:test';
import { validatePostSource } from '../admin/validation.mjs';

const config = JSON.parse(readFileSync(new URL('../admin/config.yml', import.meta.url)));
const posts = config.collections[0];
const root = new URL('../', import.meta.url);
test('token-only, PR-only, existing-post-only configuration', () => {
  assert.equal(config.backend.branch, 'master');
  assert.deepEqual(config.backend.auth_methods, ['token']);
  assert.equal(config.publish_mode, 'editorial_workflow');
  assert.equal(posts.publish, false);
  assert.equal(posts.delete, false);
  assert.equal(posts.editor.preview, false);
  assert.equal(config.media_folder, 'admin/media-readonly'); // Sveltia reserves admin as read-only.
  assert.deepEqual(posts.files.map(f => f.file).sort(), readdirSync(new URL('_posts/', root)).filter(f => f.endsWith('.md')).map(f => `_posts/${f}`).sort());
});
for (const file of posts.files) {
  test(`${file.file}: pinned raw pipeline is byte-identical`, () => {
    assert.equal(file.format, 'raw');
    assert.equal(file.fields.length, 1);
    assert.equal(file.fields[0].widget, 'text');
    const original = readFileSync(new URL(file.file, root), 'utf8');
    // Sveltia 0.233.0 parseEntryFile and formatEntryFile raw branches.
    const parsed = original.trim().replace(/\r\n?/g, '\n');
    validatePostSource(parsed);
    assert.equal(`${parsed}\n`, original);
    const changed = parsed.replace(/^title: (.+)$/m, 'title: CMS test title');
    const restore = changed.replace(/^title: (.+)$/m, parsed.match(/^title: (.+)$/m)[0]);
    assert.equal(`${restore}\n`, original);
    assert.equal(changed.slice(changed.indexOf('\n---\n', 4)), parsed.slice(parsed.indexOf('\n---\n', 4)));
  });
}
test('basic checks reject missing or empty metadata and body', () => {
  const valid = '---\nlayout: post\ntitle: Test\ndate: 2021-10-09\nsummary: Test\n---\n\nBody';
  assert.equal(validatePostSource(valid), valid);
  for (const source of ['', valid.replace('title: Test', 'title:'), valid.replace('layout: post', 'layout: note'), valid.replace('date: 2021-10-09', 'date: yesterday'), valid.slice(0, valid.indexOf('\n\nBody')), `${valid}\r\n`]) {
    assert.throws(() => validatePostSource(source));
  }
});
