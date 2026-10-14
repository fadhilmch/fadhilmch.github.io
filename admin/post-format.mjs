const quoteYaml = (value) => JSON.stringify(String(value ?? ''));

export function createPostSource({ title = 'New post', date = new Date().toISOString().slice(0, 10), summary = 'Write a short summary.', tags = [] } = {}) {
  const tagLines = Array.isArray(tags) && tags.length
    ? `tags:\n${tags.map((tag) => `- ${quoteYaml(tag)}`).join('\n')}\n`
    : '';
  return `---\nlayout: post\ntitle: ${quoteYaml(title)}\ndate: ${date}\n${tagLines}summary: ${quoteYaml(summary)}\n---\n\nWrite your post here.`;
}

export function parsePostFile(source) {
  return { body: source };
}

export function formatPostFile(data) {
  const source = typeof data.body === 'string' && data.body.length
    ? data.body
    : createPostSource(data);
  return source.endsWith('\n') ? source : `${source}\n`;
}

export function registerPostFormat(CMS) {
  CMS.registerCustomFormat('post-raw', 'md', {
    fromFile: parsePostFile,
    toFile: formatPostFile,
  });
}
