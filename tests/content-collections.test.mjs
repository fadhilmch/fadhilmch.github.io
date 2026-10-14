import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { contentCollections } from '../admin/content-collections.mjs';

const collection = (name) => contentCollections.find((item) => item.name === name);
const file = (name) => contentCollections.flatMap((item) => item.files ?? []).find((item) => item.name === name);

test('root YAML lists use a single top-level list field', () => {
  for (const name of ['experience', 'education', 'skills', 'publications', 'contact']) {
    const definition = file(name);
    assert.ok(definition, `missing ${name} file`);
    assert.equal(definition.fields.length, 1);
    assert.equal(definition.fields[0].widget, 'list');
    assert.equal(definition.fields[0].root, true);
    assert.ok(definition.fields[0].fields.length > 0, `${name} list needs structured fields`);
  }
});

test('profile form exposes every property used by the site', () => {
  const names = file('profile').fields.map(({ name }) => name);
  assert.deepEqual(names, ['name', 'short_role', 'city', 'role', 'location', 'headline', 'greetings', 'bio_links', 'bio', 'flag', 'now', 'off_hours']);
});

test('project data remains a JSON array collection with publish and delete disabled', () => {
  const projects = collection('projects');
  assert.equal(file('portfolio-projects').file, '_data/portfolio_projects.json');
  assert.equal(file('portfolio-projects').format, 'json');
  assert.equal(projects.publish, false);
  assert.equal(file('portfolio-projects').fields[0].root, true);
  for (const field of ['id', 'title', 'kind', 'stack', 'problem', 'built', 'decision', 'result', 'repo', 'post', 'post_title', 'image', 'topic', 'color', 'image_caption', 'teaser']) {
    assert.ok(file('portfolio-projects').fields[0].fields.some((item) => item.name === field), `missing project field ${field}`);
  }
});

test('coffee and food editors expose every recipe template field', () => {
  const coffee = collection('coffee');
  const food = collection('food');
  assert.equal(coffee.publish, false);
  assert.equal(coffee.delete, false);
  assert.equal(food.publish, false);
  assert.equal(food.delete, false);
  for (const field of ['layout', 'title', 'kind', 'method', 'dose_g', 'water_g', 'grind', 'temp_c', 'time', 'beans', 'steps', 'notes']) {
    assert.ok(coffee.fields.some((item) => item.name === field), `missing coffee field ${field}`);
  }
  for (const field of ['layout', 'title', 'kind', 'cuisine', 'serves', 'time', 'ingredients', 'steps', 'notes']) {
    assert.ok(food.fields.some((item) => item.name === field), `missing food field ${field}`);
  }
});

test('product design enabled state has a corresponding lane visibility control', () => {
  const skills = file('skills').fields[0].fields;
  const lanes = file('lanes');
  assert.ok(collection('about').files.some(({ name }) => name === 'lanes'));
  assert.ok(lanes.fields[0].fields.some((field) => field.name === 'branch'));
  assert.ok(lanes.fields[0].fields.some((field) => field.name === 'key'));
  assert.equal(skills.find((field) => field.name === 'enabled').default, true);
  assert.equal(lanes.fields[0].fields.find((field) => field.name === 'branch').default, true);
  assert.equal(skills.find((field) => field.name === 'key').widget, 'hidden');
  assert.equal(skills.find((field) => field.name === 'lane').widget, 'hidden');
  assert.equal(lanes.fields[0].fields.find((field) => field.name === 'key').widget, 'hidden');
  assert.equal(file('skills').fields[0].max, 5);
  assert.equal(lanes.fields[0].max, 7);
});

test('optional data fields stay optional and CMS colors use the site palette', () => {
  const skills = file('skills').fields[0].fields;
  const lanes = file('lanes').fields[0].fields;
  const projects = file('portfolio-projects').fields[0].fields;
  const experience = file('experience').fields[0].fields;
  const education = file('education').fields[0].fields;
  for (const [fields, name] of [[experience, 'place'], [experience, 'note'], [education, 'country'], [skills, 'spotlight'], [skills.find(({ name }) => name === 'items').fields, 'where']]) {
    assert.equal(fields.find((field) => field.name === name).required, false, `${name} should be optional`);
  }
  const expectedColors = ['l0', 'l1', 'l2', 'l3', 'l4', 'l5', 'fg'];
  for (const field of [skills.find(({ name }) => name === 'color'), lanes.find(({ name }) => name === 'color'), projects.find(({ name }) => name === 'color')]) {
    assert.equal(field.widget, 'select');
    assert.deepEqual(field.options.map(({ value }) => value), expectedColors);
    assert.ok(field.options.every(({ label }) => label && !expectedColors.includes(label)));
  }
});

test('recipe numeric fields prevent invalid ratios and serving counts', () => {
  const coffee = collection('coffee').fields;
  const food = collection('food').fields;
  const dose = coffee.find(({ name }) => name === 'dose_g');
  assert.equal(dose.widget, 'number');
  assert.equal(dose.value_type, 'float');
  assert.ok(dose.min > 0);
  const water = coffee.find(({ name }) => name === 'water_g');
  assert.equal(water.value_type, 'float');
  assert.ok(water.min > 0);
  const servings = food.find(({ name }) => name === 'serves');
  assert.equal(servings.value_type, 'int');
  assert.equal(servings.min, 1);
});

// Exercise the config that Sveltia actually fetches, rather than schemas alone.
test('served config includes every schema and uses review PRs for every collection', () => {
  const config = JSON.parse(readFileSync(new URL('../admin/config.yml', import.meta.url), 'utf8'));
  assert.equal(config.publish_mode, 'editorial_workflow');
  assert.deepEqual(config.collections.filter(({ name }) => name !== 'posts'), contentCollections);
  for (const collection of config.collections) {
    assert.equal(collection.publish, false, collection.name);
    assert.ok(!collection.publish_mode || collection.publish_mode === 'editorial_workflow', collection.name);
    if (collection.folder) assert.equal(collection.delete, false, collection.name);
  }
});
