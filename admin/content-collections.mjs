const field = (name, label, widget = 'string', extra = {}) => ({ name, label, widget, ...extra });
const text = (name, label, extra = {}) => field(name, label, 'text', extra);
const list = (name, label, fields, extra = {}) => field(name, label, 'list', { ...(fields ? { fields } : {}), ...extra });
const colorField = () => field('color', 'Color', 'select', { options: [
  { label: 'Blue', value: 'l0' }, { label: 'Rose', value: 'l1' },
  { label: 'Orange', value: 'l2' }, { label: 'Purple', value: 'l3' },
  { label: 'Teal', value: 'l4' }, { label: 'Gold', value: 'l5' },
  { label: 'Neutral', value: 'fg' },
] });
// Skills and lanes carry hidden keys that graph IDs and lane links depend on. Items the form
// added or duplicated would have no key, so these lists only edit, reorder and toggle visibility.
const fixedKeys = { allow_add: false, allow_duplicate: false, allow_remove: false };
const rootListFile = (name, label, filePath, fields, listOptions = {}) => ({
  name,
  label,
  file: filePath,
  fields: [list('items', label, fields, { ...listOptions, root: true })],
});

const experienceFields = [
  field('years', 'Years'),
  field('role', 'Role'),
  field('org', 'Organization'),
  field('place', 'Location', 'string', { required: false }),
  text('note', 'Description', { required: false }),
];

const educationFields = [
  field('years', 'Years'),
  field('role', 'Degree'),
  field('org', 'Institution'),
  field('country', 'Country', 'string', { required: false }),
];

const skillItemFields = [field('name', 'Name'), field('where', 'Where', 'string', { required: false })];
const skillFields = [
  field('key', 'Key', 'hidden'),
  field('lane', 'Lane key', 'hidden'),
  field('group', 'Group'),
  text('desc', 'Description'),
  text('spotlight', 'Spotlight', { required: false }),
  field('glyph', 'Glyph'),
  colorField(),
  list('items', 'Skills', skillItemFields, { summary: '{{fields.name}}' }),
  field('enabled', 'Enabled', 'boolean', {
    required: false,
    default: true,
    hint: 'For Product design, also set About → Lanes → Product design → Branch visible to true.',
  }),
];

const laneFields = [
  field('key', 'Key', 'hidden'),
  field('branch', 'Branch visible', 'boolean', {
    required: false,
    default: true,
    hint: 'Set Product design to true when enabling the Product design skill group.',
  }),
  field('title', 'Title'),
  field('label', 'Label'),
  field('long', 'Long label'),
  colorField(),
  list('tags', 'Tags'),
];

const projectFields = [
  field('id', 'ID'), field('title', 'Title'), field('kind', 'Kind'), field('stack', 'Technology stack'),
  text('problem', 'Problem'), text('built', 'What I built'), text('decision', 'Decision and lessons'), text('result', 'Result'),
  field('repo', 'Repository URL', 'string', { pattern: ['^https://', 'Use an HTTPS repository URL'] }),
  field('post', 'Related post URL', 'string', { required: false }),
  field('post_title', 'Related post title', 'string', { required: false }),
  field('image', 'Image path', 'string', { hint: 'Path to an existing image, for example /assets/images/projects/example.svg.' }),
  field('topic', 'Topic'), colorField(),
  field('image_caption', 'Image caption', 'string', { required: false }),
  text('teaser', 'Teaser'),
];

const recipeCommonFields = [
  field('layout', 'Layout', 'hidden', { default: 'recipe' }),
  field('title', 'Title'),
  field('kind', 'Recipe type', 'hidden'),
  field('time', 'Time', 'string', { hint: 'Use the time format shown on the site, e.g. 2:30.' }),
];

const recipeExtraFields = [
  field('status', 'Status', 'select', { required: false, default: 'published', options: [
    { label: 'Published', value: 'published' }, { label: 'Draft (shows "Recipe coming later")', value: 'draft' },
  ] }),
  list('tags', 'Tags', undefined, { required: false, hint: 'Short labels shown as filter chips on the list page, e.g. pour-over, weeknight.' }),
  field('photo', 'Photo', 'image', { required: false, media_folder: '/assets/recipes', public_folder: '/assets/recipes', choose_url: false, hint: 'Choose or drop a photo. It is converted to WebP and saved in assets/recipes. Best as a landscape 3:2 photo, up to 2 MB. Leave empty to show "Photo coming later".' }),
  field('photo_alt', 'Photo description', 'string', { required: false, hint: 'Describe the photo for screen readers.' }),
  field('photo_credit', 'Photo credit', 'string', { required: false, hint: 'Shown under the photo, for example Photo by Fadhil.' }),
];

const coffeeFields = [
  ...recipeCommonFields.slice(0, 2),
  field('kind', 'Recipe type', 'hidden', { default: 'coffee' }),
  field('method', 'Brew method'),
  field('dose_g', 'Coffee dose (g)', 'number', { value_type: 'float', min: 0.1, step: 0.1 }),
  field('water_g', 'Water (g)', 'number', { value_type: 'float', min: 0.1, step: 0.1 }),
  field('grind', 'Grind setting'),
  field('temp_c', 'Water temperature (°C)', 'number', { value_type: 'float', min: 0.1, step: 0.1 }),
  recipeCommonFields[3],
  field('beans', 'Beans', 'string', { required: false }),
  field('roastery', 'Roastery', 'string', { required: false }),
  ...recipeExtraFields,
  list('steps', 'Brew steps', undefined, { min: 1, hint: 'Start a step with m:ss, e.g. 0:45 Pour to 150 g, so the brew timer highlights it.' }),
  text('notes', 'Notes', { required: false }),
  text('comments', 'Result note', { required: false, hint: 'How your latest cup turned out. One editable note per recipe, separate from the recipe instructions. Shown under Notes as "Result".' }),
  field('source_name', 'Source name', 'string', { required: false, hint: 'Where the recipe came from, e.g. The Funky 5 by Purple Rain (aeroprecipe.com).' }),
  field('source_url', 'Source URL', 'string', { required: false, hint: 'Link to the original recipe. Shown as a clickable source link under Notes.' }),
];

const foodFields = [
  ...recipeCommonFields.slice(0, 2),
  field('kind', 'Recipe type', 'hidden', { default: 'food' }),
  field('cuisine', 'Cuisine'),
  field('serves', 'Serves', 'number', { value_type: 'int', min: 1 }),
  field('time', 'Time', 'string', { hint: 'Free text shown on the site, for example 35 min.' }),
  ...recipeExtraFields,
  list('ingredients', 'Ingredients', undefined, { min: 1 }),
  list('steps', 'Method steps', undefined, { min: 1 }),
  text('notes', 'Notes', { required: false }),
];

export const contentCollections = [
  {
    name: 'about',
    label: 'About',
    publish: false,
    files: [{
      name: 'profile',
      label: 'Profile',
      file: '_data/profile.yml',
      fields: [
        field('name', 'Name'), field('short_role', 'Short role'), field('city', 'City'),
        field('role', 'Role'), field('location', 'Location'), field('headline', 'Headline'),
        list('greetings', 'Greetings', [field('word', 'Word'), field('lang', 'Language')], { summary: '{{fields.word}} · {{fields.lang}}' }),
        list('bio_links', 'Interactive bio links', [
          field('text', 'Text'), field('node', 'Graph node', 'string', { required: false }),
          field('href', 'Link URL', 'string', { required: false }), field('color', 'Color', 'string', { required: false }),
        ], { summary: '{{fields.text}}' }),
        text('bio', 'Bio'), field('flag', 'Flag'),
        list('now', 'Now', [field('k', 'Label'), field('v', 'Value'), field('href', 'Link URL', 'string', { required: false })], { summary: '{{fields.k}}: {{fields.v}}' }),
        field('off_hours', 'Off hours'),
      ],
    }, rootListFile('lanes', 'Lanes', '_data/lanes.yml', laneFields, { max: 7, summary: '{{fields.title}}', ...fixedKeys })],
  },
  {
    name: 'experience', label: 'Experience', publish: false,
    files: [rootListFile('experience', 'Experience', '_data/experience.yml', experienceFields, { summary: '{{fields.years}} · {{fields.role}}, {{fields.org}}' })],
  },
  {
    name: 'education', label: 'Education', publish: false,
    files: [rootListFile('education', 'Education', '_data/education.yml', educationFields, { summary: '{{fields.years}} · {{fields.role}}' })],
  },
  {
    name: 'skills', label: 'Skills', publish: false,
    files: [rootListFile('skills', 'Skills', '_data/skills.yml', skillFields, { max: 5, summary: '{{fields.group}}', ...fixedKeys })],
  },
  {
    name: 'projects', label: 'Projects', publish: false,
    files: [{
      name: 'portfolio-projects', label: 'Portfolio projects', file: '_data/portfolio_projects.json', format: 'json',
      fields: [list('projects', 'Projects', projectFields, { root: true, summary: '{{fields.title}}' })],
    }],
  },
  {
    name: 'publications', label: 'Publications', publish: false,
    files: [rootListFile('publications', 'Publications', '_data/publications.yml', [
      field('title', 'Title'), field('authors', 'Authors'), field('venue', 'Venue'), field('conference', 'Conference'),
      field('event', 'Event'), field('pages', 'Pages'), field('year', 'Year'), field('doi', 'DOI'), field('href', 'URL'),
    ], { summary: '{{fields.year}} · {{fields.title}}' })],
  },
  {
    name: 'contact', label: 'Contact', publish: false,
    files: [rootListFile('contact', 'Contact', '_data/contact.yml', [field('label', 'Label'), field('value', 'Value'), field('href', 'Link URL')], { summary: '{{fields.label}}' })],
  },
  {
    name: 'coffee', label: 'Coffee', label_singular: 'Coffee recipe',
    folder: '_coffee', path: '{{slug}}', extension: 'md', format: 'yaml-frontmatter',
    create: true, delete: false, publish: false, fields: coffeeFields,
  },
  {
    name: 'food', label: 'Food', label_singular: 'Food recipe',
    folder: '_food', path: '{{slug}}', extension: 'md', format: 'yaml-frontmatter',
    create: true, delete: false, publish: false, fields: foodFields,
  },
  {
    // Visual editor field, saved as the raw layout file through a review PR (see admin/layout-field.js).
    name: 'after-work-layout', label: 'After work layout', publish: false,
    files: [{
      name: 'gateway-layout', label: 'Sticker layout', file: '_data/after_work_layout.json', format: 'layout-raw',
      fields: [field('layout', 'Sticker layout', 'aw-layout')],
    }],
  },
];
