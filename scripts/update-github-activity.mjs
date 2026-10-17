// Refreshes _data/github_activity.json from the public GitHub contributions page.
// Usage: node scripts/update-github-activity.mjs [user]
// Public activity only: private contributions never appear on that page.
import { writeFileSync } from 'node:fs';
import { buildActivity, parseContributions } from './github-activity.mjs';

const user = process.argv[2] || 'fadhilmch';
const today = new Date().toISOString().slice(0, 10);
const response = await fetch(`https://github.com/users/${user}/contributions`, {
  headers: { 'user-agent': 'fadhilmch.github.io activity snapshot' },
});
if (!response.ok) throw new Error(`GitHub answered ${response.status}`);

const activity = buildActivity({ user, today, days: parseContributions(await response.text(), today) });
const target = new URL('../_data/github_activity.json', import.meta.url);
writeFileSync(target, JSON.stringify(activity) + '\n');
console.log(`${activity.total} contributions on ${activity.active_days} active days, ${activity.from} to ${activity.to}`);
