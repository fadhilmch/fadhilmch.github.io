// Pure helpers for the About "contribution roll". No network or file access
// here, so tests can run them against a saved copy of the GitHub page.

/** Contribution counts at or below each bound map to level 1..3; anything above is level 4. */
export const LEVEL_BOUNDS = [2, 4, 8];

/** 0 = no activity, 1 = few ... 4 = most. Fixed bounds, so a quiet year never looks busy. */
export function levelFor(count) {
  if (count <= 0) return 0;
  const index = LEVEL_BOUNDS.findIndex((bound) => count <= bound);
  return index === -1 ? LEVEL_BOUNDS.length + 1 : index + 1;
}

const attr = (tag, name) => tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];

/**
 * Reads GitHub's public contributions page (https://github.com/users/<user>/contributions).
 * Throws when the markup no longer matches, so a stale snapshot is kept instead of bad data.
 */
export function parseContributions(html, today) {
  const header = html.match(/([\d,]+)\s+contributions?\s+in the last year/);
  if (!header) throw new Error('contribution total not found: GitHub markup changed');

  const counts = new Map();
  for (const [, id, text] of html.matchAll(/<tool-tip[^>]*\sfor="([^"]+)"[^>]*>([^<]*)<\/tool-tip>/g)) {
    counts.set(id, Number(text.match(/^(\d+) contribution/)?.[1] ?? 0));
  }

  const days = [];
  for (const [tag] of html.matchAll(/<td[^>]*\sdata-date="[^"]+"[^>]*>/g)) {
    const date = attr(tag, 'data-date');
    if (date > today) continue;
    days.push({ d: date, c: counts.get(attr(tag, 'id')) ?? 0 });
  }
  days.sort((a, b) => (a.d < b.d ? -1 : 1));
  if (!days.length) throw new Error('no contribution days found: GitHub markup changed');

  const total = days.reduce((sum, day) => sum + day.c, 0);
  const expected = Number(header[1].replace(/,/g, ''));
  if (total !== expected) throw new Error(`day counts add up to ${total}, page says ${expected}`);
  return days;
}

export function buildActivity({ user, days, today }) {
  if (new Date(`${days[0].d}T00:00:00Z`).getUTCDay() !== 0) {
    throw new Error('first day is not a Sunday: the roll lays weeks out from Sunday');
  }
  return {
    user,
    generated: today,
    from: days[0].d,
    to: days.at(-1).d,
    total: days.reduce((sum, day) => sum + day.c, 0),
    active_days: days.filter((day) => day.c > 0).length,
    days: days.map((day) => ({ ...day, l: levelFor(day.c) })),
  };
}
