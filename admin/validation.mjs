/** Basic source checks, not a Jekyll renderer or an HTML sanitizer. */
export function validatePostSource(source) {
  if (typeof source !== 'string' || !source.startsWith('---\n')) {
    throw new Error('Keep the opening YAML front matter block.');
  }
  const end = source.indexOf('\n---\n', 4);
  if (end < 0) throw new Error('Keep the closing YAML front matter delimiter on its own line.');
  const head = source.slice(4, end);
  for (const key of ['layout', 'title', 'date', 'summary']) {
    if (!new RegExp(`^${key}:[ \t]*[^ \t\n]`, 'm').test(head)) {
      throw new Error(`Front matter needs a nonempty ${key}.`);
    }
  }
  if (!/^layout:\s*post\s*$/m.test(head)) throw new Error('Keep layout: post.');
  if (!/^date:\s*["']?\d{4}-\d{2}-\d{2}/m.test(head)) throw new Error('Use YYYY-MM-DD for date.');
  if (!source.slice(end + 5).trim()) throw new Error('The post body cannot be empty.');
  if (source.includes('\r')) throw new Error('Use LF line endings; CRLF would be normalized.');
  if (source !== source.trim()) throw new Error('Remove outer blank lines before saving. The CMS adds one final newline.');
  return source;
}
