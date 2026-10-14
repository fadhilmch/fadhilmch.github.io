// Keep structured content schemas readable while serving plain JSON/YAML to the CMS.
import { readFileSync, writeFileSync } from 'node:fs';
import { contentCollections } from '../admin/content-collections.mjs';

const url = new URL('../admin/config.yml', import.meta.url);
const config = JSON.parse(readFileSync(url, 'utf8'));
const posts = config.collections.find(({ name }) => name === 'posts');
if (!posts) throw new Error('The CMS needs its source-preserving posts collection.');
config.app_title = 'Fadhil · Site editor';
config.collections = [posts, ...contentCollections];
writeFileSync(url, `${JSON.stringify(config, null, 2)}\n`);
