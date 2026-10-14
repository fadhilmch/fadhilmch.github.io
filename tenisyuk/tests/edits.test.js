// Run from the tenisyuk folder: node --test tests/*.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('../js/money.js');
const E = require('../js/edits.js');

const cfg = { payer: 'Fadel', swish: '072-160 66 41', kasOpening: 125, membershipTarget: 700 };
const doc = () => ({
  sessions: [
    { id: 's11', date: '11 Sep', billed: 900, real: 900, players: ['Fadel','Aldo','Dedy'], paid: ['Fadel','Aldo'] },
    { id: 's18', date: '18 Sep', billed: 600, real: 500, players: ['Fadel','Aldo','Dedy'], paid: ['Fadel','Aldo','Dedy'] },
  ],
  tx: [], venues: [],
});

test('date picker value becomes the stored label', () => {
  assert.equal(M.dateToLabel('2026-10-03'), '3 Oct');
  assert.equal(M.dateToLabel('2026-01-09'), '9 Jan');     // no leading zero
  assert.equal(M.dateToLabel('2026-12-31'), '31 Dec');
  assert.equal(M.dateToLabel(''), '');
  assert.equal(M.dateToLabel('not a date'), '');
  assert.equal(M.dateToLabel('2026-13-01'), '');
  assert.equal(M.dateToLabel('2026-02-00'), '');
});

test('stored label goes back into the picker', () => {
  assert.equal(M.labelToIso('3 Oct', 2026), '2026-10-03');
  assert.equal(M.labelToIso('11 Sep', 2026), '2026-09-11');
  assert.equal(M.labelToIso('9 jan', 2027), '2027-01-09');
  assert.equal(M.labelToIso('Sunday', 2026), '');
  assert.equal(M.labelToIso('', 2026), '');
  for (const iso of ['2026-03-04', '2026-11-30']) assert.equal(M.labelToIso(M.dateToLabel(iso), 2026), iso);
});

test('today is taken in Stockholm time, not UTC', () => {
  assert.equal(M.todayIso(new Date('2026-10-03T10:00:00Z')), '2026-10-03');
  assert.equal(M.todayIso(new Date('2026-12-31T22:30:00Z')), '2026-12-31'); // 23:30 in Stockholm
  assert.equal(M.todayIso(new Date('2026-12-31T23:30:00Z')), '2027-01-01'); // 00:30 in Stockholm
});

test('duplicate date check', () => {
  assert.equal(M.hasDate(doc(), '11 Sep'), true);
  assert.equal(M.hasDate(doc(), '12 Sep'), false);
});

test('per-person owed list: totals across sessions, sorted high to low, matches share text', () => {
  const T = M.totals(doc(), cfg);
  const amts = T.owes.map(o => o.amount);
  assert.deepEqual(amts, [...amts].sort((a, b) => b - a));
  assert.equal(T.owes.reduce((a, o) => a + o.amount, 0), T.outstanding);
  const dedy = T.owes.find(o => o.name === 'Dedy');
  assert.equal(dedy.amount, 305);
  assert.deepEqual(dedy.dates, ['11 Sep']);
  assert.equal(T.owes.find(o => o.name === 'Aldo'), undefined);
  const txt = M.recapText(doc(), cfg, T, 'id', { today: '3 Oct' });
  assert.ok(txt.includes('Dedy ' + M.fId(dedy.amount) + ' kr'));
});

test('edits never change the doc they are given', () => {
  const d = doc(), before = JSON.stringify(d);
  E.toggle(d, 's11', 'Dedy', 'Fadel');
  E.markAllPaid(d, 's11');
  E.setVenue(d, 's11', 'Solna Tenniscenter');
  E.setDate(d, 's11', '12 Sep');
  E.removeSession(d, 's11');
  E.addSession(d, { id: 'sx' });
  E.addTx(d, { id: 'x1' });
  assert.equal(JSON.stringify(d), before);
});

test('toggle marks paid and unpaid, never the payer, never a stranger', () => {
  const d = doc();
  const a = E.toggle(d, 's11', 'Dedy', 'Fadel');
  assert.ok(a.sessions[0].paid.includes('Dedy'));
  assert.ok(!E.toggle(a, 's11', 'Dedy', 'Fadel').sessions[0].paid.includes('Dedy'));
  assert.deepEqual(E.toggle(d, 's11', 'Fadel', 'Fadel'), d);
  assert.deepEqual(E.toggle(d, 's11', 'Stranger', 'Fadel'), d);
  assert.deepEqual(E.toggle(d, 'nope', 'Dedy', 'Fadel'), d);
});

test('mark all paid, venue, date, add and remove', () => {
  const d = doc();
  assert.equal(M.totals(E.markAllPaid(d, 's11'), cfg).outstanding, 0);
  assert.equal(E.setVenue(d, 's11', 'Solna').sessions[0].venue, 'Solna');
  assert.ok(!('venue' in E.setVenue(E.setVenue(d, 's11', 'Solna'), 's11', '').sessions[0]));
  assert.equal(E.setDate(d, 's11', '12 Sep').sessions[0].date, '12 Sep');
  assert.equal(E.setDate(d, 's11', '').sessions[0].date, '11 Sep');
  assert.equal(E.removeSession(d, 's11').sessions.length, 1);
  assert.equal(E.addSession(d, { id: 'sx' }).sessions.length, 3);
  const t = E.addTx(d, { id: 'x1', account: 'kas', kind: 'in', amount: 10 });
  assert.equal(t.tx.length, 1);
  assert.equal(E.removeTx(t, 'x1').tx.length, 0);
});

test('undo: restoring the remembered doc gives back the exact old state and totals', () => {
  const undo = E.makeUndo();
  const d = doc();
  const T0 = M.totals(d, cfg);
  undo.remember(d);
  const next = E.markAllPaid(d, 's11');
  assert.notEqual(M.totals(next, cfg).outstanding, T0.outstanding);
  assert.ok(undo.available());
  const back = undo.take();
  assert.deepEqual(back, d);
  assert.deepEqual(M.totals(back, cfg), T0);
  assert.equal(undo.available(), false);
  assert.equal(undo.take(), null);
});

test('a save that never reaches the server is rolled back on screen', async () => {
  const state = { doc: doc() };
  const original = state.doc;
  const next = E.markAllPaid(original, 's11');
  const r = await E.commitChange(state, next, async () => 'offline');
  assert.equal(r.result, 'offline');
  assert.equal(state.doc, original);               // old doc is back
});

test('a saved change stays, and the old doc is kept for undo', async () => {
  const state = { doc: doc() };
  const original = state.doc;
  const next = E.markAllPaid(original, 's11');
  const r = await E.commitChange(state, next, async () => 'ok');
  assert.equal(r.result, 'ok');
  assert.equal(state.doc, next);
  assert.equal(r.prev, original);
});

test('a server refusal keeps what the save routine reloaded', async () => {
  const state = { doc: doc() };
  const server = doc(); server.sessions.pop();
  const r = await E.commitChange(state, E.markAllPaid(state.doc, 's11'), async () => { state.doc = server; return 'server'; });
  assert.equal(r.result, 'server');
  assert.equal(state.doc, server);
});

test('swishLink follows the official Swish link format', () => {
  const u = M.swishLink('072-160 66 41', 117.5, 'Tennis Dedy');
  assert.equal(u, 'https://app.swish.nu/1/p/sw/?sw=46721606641&amt=117.5&msg=Tennis%20Dedy');
  assert.equal(M.swishLink('+46 72 160 66 41'.replace('+', '00'), 90, 'x'), 'https://app.swish.nu/1/p/sw/?sw=46721606641&amt=90.0&msg=x');
  assert.equal(M.swishLink('0721606641', 0, ''), 'https://app.swish.nu/1/p/sw/?sw=46721606641');
  assert.equal(M.swishLink('', 10, 'x'), '');
  assert.ok(M.swishLink('0721606641', 5, 'A&B=C').endsWith('amt=5.0&msg=ABC'));
  assert.ok(M.swishLink('0721606641', 33.333, 'x').includes('amt=33.33&'));
  assert.ok(M.swishLink('0721606641', 10, 'Åsa Öberg').endsWith('msg=%C3%85sa%20%C3%96berg'));
  assert.ok(M.swishLink('0721606641', 10, '😀 Tennis 😀').endsWith('msg=Tennis'));
  assert.ok(M.swishLink('0721606641', 10, 'a'.repeat(80)).endsWith('msg=' + 'a'.repeat(50)));
});

test('owedBreakdown adds up to the per-person total', () => {
  const d = doc(), T = M.totals(d, cfg);
  for (const o of T.owes) {
    const items = M.owedBreakdown(d, cfg, o.name);
    assert.equal(items.reduce((a, i) => a + i.amount, 0), o.amount);
    assert.deepEqual(items.map(i => i.date), o.dates);
  }
  assert.deepEqual(M.owedBreakdown(d, cfg, 'Aldo'), []);
});
