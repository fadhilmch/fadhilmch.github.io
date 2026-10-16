// Keep structured content schemas readable while serving plain JSON/YAML to the CMS.
import { readFileSync, writeFileSync } from 'node:fs';
import { contentCollections } from '../admin/content-collections.mjs';

const url = new URL('../admin/config.yml', import.meta.url);
const config = JSON.parse(readFileSync(url, 'utf8'));
const posts = config.collections.find(({ name }) => name === 'posts');
if (!posts) throw new Error('The CMS needs its source-preserving posts collection.');
config.app_title = 'Fadhil · Site editor';
// Liquid treats '' as true, so a blank optional field (href, place, spotlight) would render.
// Jekyll reads YAML 1.1, where a plain 2:30 is the number 9000; quoted strings stay text.
// Unindented sequences match the existing data files, which keeps review diffs small.
config.output = { omit_empty_optional_fields: true, yaml: { quote: 'double', indent_sequences: false } };
// Uploads stay off globally (media_folder is read-only). Only the recipe photo field sets its own
// media_folder. Sveltia converts raster uploads to WebP and rejects files over 2 MB.
config.media_libraries = { default: { config: { max_file_size: 2097152, slugify_filename: true, transformations: { raster_image: { format: 'webp', quality: 85, width: 1600, height: 1600 } } } } };
config.collections = [posts, ...contentCollections];
writeFileSync(url, `${JSON.stringify(config, null, 2)}\n`);
