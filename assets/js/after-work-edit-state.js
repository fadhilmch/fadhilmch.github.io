// Editing state for the After work layout editor: history, placement limits and export.
// Pure functions, no DOM, so they are tested in Node.

export const LIMITS = { w: [30, 480], r: [-60, 60] };
export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const round = (v) => Math.round(v * 10) / 10;

export const clone = (layout) => JSON.parse(JSON.stringify(layout));

// Keep a place inside the limits and rounded to one decimal, so exported files stay readable.
export function normalizePlace(place, board) {
  return {
    ...place,
    x: round(clamp(place.x, -40, board.w - 10)),
    y: round(clamp(place.y, -40, board.h - 10)),
    w: round(clamp(place.w, LIMITS.w[0], LIMITS.w[1])),
    r: round(clamp(place.r, LIMITS.r[0], LIMITS.r[1])),
  };
}

export function createHistory(initial, max = 100) {
  let past = [], future = [], current = clone(initial);
  return {
    get state() { return current; },
    get canUndo() { return past.length > 0; },
    get canRedo() { return future.length > 0; },
    // Record a change. `edit` receives a copy of the layout and mutates it.
    commit(edit) {
      const next = clone(current);
      edit(next);
      if (JSON.stringify(next) === JSON.stringify(current)) return current;
      past.push(current); if (past.length > max) past.shift();
      future = []; current = next;
      return current;
    },
    // Start a continuous edit (a drag): remember the state before it, then change `state` in place.
    begin() { past.push(clone(current)); if (past.length > max) past.shift(); future = []; },
    undo() { if (past.length) { future.push(current); current = past.pop(); } return current; },
    redo() { if (future.length) { past.push(current); current = future.pop(); } return current; },
    reset(layout) { past = []; future = []; current = clone(layout); return current; },
  };
}

export function updateItem(layout, bp, id, patch) {
  const item = layout.items.find((it) => it.id === id);
  if (!item) return;
  item[bp] = normalizePlace({ ...item[bp], ...patch }, layout.boards[bp]);
}

export function moveToFront(layout, bp, id) {
  const top = Math.max(...layout.items.filter((it) => it[bp].show).map((it) => it[bp].z));
  updateItem(layout, bp, id, { z: top + 1 });
}

export function moveToBack(layout, bp, id) {
  const low = Math.min(...layout.items.filter((it) => it[bp].show).map((it) => it[bp].z));
  updateItem(layout, bp, id, { z: low - 1 });
}

const key = (a, b) => [a, b].sort();
export function attachPair(layout, a, b) {
  if (!layout.attached.some((p) => key(...p).join() === key(a, b).join())) layout.attached.push(key(a, b));
}
export function detachPair(layout, a, b) {
  layout.attached = layout.attached.filter((p) => key(...p).join() !== key(a, b).join());
}

// The file the owner commits. Fixed key order and indentation keep diffs small.
export function exportLayout(layout) {
  return JSON.stringify(layout, null, 1) + '\n';
}
