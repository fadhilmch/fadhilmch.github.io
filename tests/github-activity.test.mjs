import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { LEVEL_BOUNDS, buildActivity, levelFor, parseContributions } from '../scripts/github-activity.mjs';

const cell = (date, id) => `<td data-date="${date}" id="contribution-day-component-${id}" data-level="0" class="ContributionCalendar-day"></td>`;
const tip = (id, text) => `<tool-tip for="contribution-day-component-${id}" class="sr-only">${text}</tool-tip>`;
// Rows come before weeks in GitHub's table, so the days arrive out of date order.
const page = (total) => `<h2>
  ${total}
  contributions
    in the last year
</h2><table>${cell('2026-10-05', '0-1')}${cell('2026-10-04', '0-0')}${cell('2026-10-06', '1-0')}${cell('2026-10-20', '1-1')}</table>
${tip('0-0', 'No contributions on October 4th.')}${tip('0-1', '1 contribution on October 5th.')}${tip('1-0', '340 contributions on October 6th.')}${tip('1-1', '9 contributions on October 20th.')}`;

test('levels use fixed bounds and never reward a quiet day', () => {
  assert.deepEqual(LEVEL_BOUNDS, [2, 4, 8]);
  const levels = [0, 1, 2, 3, 4, 5, 8, 9, 340].map(levelFor);
  assert.deepEqual(levels, [0, 1, 1, 2, 2, 3, 3, 4, 4]);
});

test('parseContributions sorts by date, reads counts and drops future days', () => {
  const days = parseContributions(page('341'), '2026-10-17');
  assert.deepEqual(days, [{ d: '2026-10-04', c: 0 }, { d: '2026-10-05', c: 1 }, { d: '2026-10-06', c: 340 }]);
});

test('parseContributions refuses markup it does not recognise or counts that do not add up', () => {
  assert.throws(() => parseContributions('<html></html>', '2026-10-17'), /markup changed/);
  assert.throws(() => parseContributions(page('999'), '2026-10-17'), /add up to 341, page says 999/);
});

test('buildActivity summarises the year and needs weeks that start on Sunday', () => {
  const days = parseContributions(page('341'), '2026-10-17');
  const activity = buildActivity({ user: 'someone', days, today: '2026-10-17' });
  assert.equal(activity.total, 341);
  assert.equal(activity.active_days, 2);
  assert.deepEqual([activity.from, activity.to], ['2026-10-04', '2026-10-06']);
  assert.deepEqual(activity.days.map((day) => day.l), [0, 1, 4]);
  assert.throws(() => buildActivity({ user: 'someone', days: days.slice(1), today: '2026-10-17' }), /not a Sunday/);
});

test('the committed snapshot is internally consistent', () => {
  const snapshot = JSON.parse(readFileSync(new URL('../_data/github_activity.json', import.meta.url), 'utf8'));
  const { days } = snapshot;
  assert.equal(new Date(`${days[0].d}T00:00:00Z`).getUTCDay(), 0);
  days.forEach((day, i) => {
    if (i) assert.equal((Date.parse(day.d) - Date.parse(days[i - 1].d)) / 864e5, 1, `gap before ${day.d}`);
    assert.equal(day.l, levelFor(day.c), `level for ${day.d}`);
  });
  assert.equal(snapshot.total, days.reduce((sum, day) => sum + day.c, 0));
  assert.equal(snapshot.active_days, days.filter((day) => day.c > 0).length);
  assert.equal(snapshot.to, days.at(-1).d);
});
