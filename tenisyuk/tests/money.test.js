// Run from the tenisyuk folder: node --test tests/*.test.js   (Node 18+, no dependencies)
const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('../js/money.js');

const cfg = { payer: 'Fadel', swish: '072-160 66 41', kasOpening: 125, membershipTarget: 700 };
const doc = () => ({
  sessions: [
    { id: 's11', date: '11 Sep', billed: 900, real: 900, venue: '',
      players: ['Fadel','Aldo','HS Putra','Sabrina','Alif Harfian','Dedy','Qiang','Naufal'],
      paid: ['Fadel','Aldo','HS Putra','Sabrina','Alif Harfian'] },
    { id: 's18', date: '18 Sep', billed: 900, real: 724, venue: '',
      players: ['Fadel','Aldo','HS Putra','Sabrina','Alif Harfian','Dartagnan','Suci','Assevitto'],
      paid: ['Fadel','Aldo','HS Putra','Sabrina','Alif Harfian','Dartagnan','Suci','Assevitto'] },
    { id: 's25', date: '25 Sep', billed: 595, real: 455, venue: '',
      players: ['Fadel','HS Putra','Alif Harfian','Suci','Assevitto','Dartagnan','Aldo'],
      paid: ['Fadel','Aldo'] },
  ],
  tx: [], venues: [],
});

test('number formatting and rounding', () => {
  assert.equal(M.fEn(117.5), '117.5');
  assert.equal(M.fId(117.5), '117,5');
  assert.equal(M.fEn(1234.567), '1,234.57');
  assert.equal(M.fId(1234567.891), '1.234.567,89');
  assert.equal(M.fEn(0.1 + 0.2), '0.3');
  assert.equal(M.fEn(1000000), '1,000,000');
  assert.equal(M.fEn(0), '0');
  assert.equal(M.kr(99.999), '100 kr');
});

test('per-session court share, charge (court + 5 kas) and membership gap', () => {
  const [a, b, c] = doc().sessions;
  assert.equal(M.court(a), 112.5);
  assert.equal(M.charge(a), 117.5);
  assert.equal(M.gap(a), 0);
  assert.equal(M.gap(b), 176);
  assert.equal(M.court(c), 85);
  assert.equal(M.charge(c), 90);
  assert.equal(M.gap(c), 140);
});

test('the payer never owes themselves', () => {
  const s = doc().sessions[2];
  assert.deepEqual(M.unpaidOthers(s, 'Fadel'), ['HS Putra','Alif Harfian','Suci','Assevitto','Dartagnan']);
  s.paid = ['Aldo'];
  assert.ok(!M.unpaidOthers(s, 'Fadel').includes('Fadel'));
});

test('totals on the sample data (hand-computed)', () => {
  const T = M.totals(doc(), cfg);
  assert.equal(T.outstanding, 802.5);          // 3 x 117.5 + 5 x 90
  assert.equal(T.charged, 2185);               // 7x117.5 + 7x117.5 + 6x90
  assert.equal(T.collected, 1382.5);           // charged - outstanding
  assert.equal(T.realCost, 2079);              // 900 + 724 + 455
  assert.equal(T.membership, 316);             // (900-724) + (595-455), billed minus real only
  assert.equal(T.kasPersons, 15);              // 5 + 8 + 2 paid players
  assert.equal(T.kasReal, 200);                // 125 opening + 5 x 15
  assert.equal(T.kasPending, 40);              // 5 x (3 + 0 + 5) unpaid
  assert.equal(T.owes.length, 8);
  assert.equal(T.owes[0].amount, 117.5);
  assert.deepEqual(T.owes.map(o => o.name).slice(0, 3), ['Dedy','Qiang','Naufal']);
  assert.equal(T.attendance[0].count, 3);
});

test('owes sum equals outstanding, collected + outstanding equals charged', () => {
  const T = M.totals(doc(), cfg);
  assert.equal(T.owes.reduce((a, o) => a + o.amount, 0), T.outstanding);
  assert.equal(T.collected + T.outstanding, T.charged);
});

test('kas and membership stay separate', () => {
  const d = doc();
  const base = M.totals(d, cfg);
  d.sessions[1].real = 600;                    // a bigger gap changes membership only
  const t1 = M.totals(d, cfg);
  assert.equal(t1.kasReal, base.kasReal);
  assert.equal(t1.membership, base.membership + 124);
  d.tx.push({ id: 'k1', date: '1 Oct', account: 'kas', kind: 'in', amount: 50, note: '' },
            { id: 'k2', date: '2 Oct', account: 'kas', kind: 'out', amount: 20, note: '' },
            { id: 'm1', date: '3 Oct', account: 'membership', kind: 'in', amount: 100, note: '' });
  const t2 = M.totals(d, cfg);
  assert.equal(t2.kasManual, 30);
  assert.equal(t2.kasReal, t1.kasReal + 30);
  assert.equal(t2.membership, t1.membership + 100);
});

test('empty data does not crash and settles to zero', () => {
  const T = M.totals({ sessions: [], tx: [], venues: [] }, cfg);
  assert.equal(T.outstanding, 0);
  assert.equal(T.kasReal, 125);
  assert.equal(T.membership, 0);
  assert.deepEqual(T.owes, []);
});

test('everyone paid means nothing owed', () => {
  const d = doc();
  d.sessions.forEach(s => { s.paid = [...s.players]; });
  const T = M.totals(d, cfg);
  assert.equal(T.outstanding, 0);
  assert.equal(T.kasPending, 0);
  assert.equal(T.kasPersons, 23);              // 8 + 8 + 7
});

test('Indonesian recap text: totals, kas and layout', () => {
  const d = doc();
  const T = M.totals(d, cfg);
  const txt = M.recapText(d, cfg, T, 'id', { today: '3 Oct', siteUrl: 'https://example.test/tenisyuk/' });
  const lines = txt.split('\n');
  assert.equal(lines[0], '🎾 REKAP TENIS (update 3 Oct)');
  assert.ok(lines.includes('📅 11 Sep - court 900 kr (Fadel talangin), 117,5 kr/orang'));
  assert.ok(lines.includes('📅 25 Sep - total 595 kr (455 kr sewa + 140 kr membership, Fadel talangin 455 kr), 90 kr/orang'));
  assert.ok(lines.includes('⏳ Belum bayar: Dedy 117,5 kr | Qiang 117,5 kr | Naufal 117,5 kr'));
  assert.ok(lines.includes('• Dedy, Qiang, Naufal: 117,5 kr masing-masing'));
  assert.ok(lines.includes('• HS Putra, Alif Harfian, Dartagnan, Suci, Assevitto: 90 kr masing-masing'));
  assert.ok(lines.includes('💵 Total yang masih masuk ke Fadel: 802,5 kr'));
  assert.ok(lines.includes('• Real: 200 kr'));
  assert.ok(lines.includes('• Pending: 40 kr'));
  assert.ok(lines.includes('• Total nanti: 240 kr'));
  assert.ok(lines.includes('📲 Swish ke Fadel: 072-160 66 41'));
  assert.ok(lines.includes('🔗 Detail lengkap: https://example.test/tenisyuk/'));
  assert.ok(!txt.includes('Membership:'), 'no membership balance line in the share text');
});

test('English recap text uses dot decimals and English wording', () => {
  const d = doc();
  const T = M.totals(d, cfg);
  const txt = M.recapText(d, cfg, T, 'en', { today: '3 Oct', siteUrl: '' });
  assert.ok(txt.startsWith('🎾 TENNIS RECAP (update 3 Oct)'));
  assert.ok(txt.includes('Still to come in to Fadel: 802.5 kr'));
  assert.ok(txt.includes('• Dedy, Qiang, Naufal: 117.5 kr each'));
  assert.ok(txt.includes('• Total later: 240 kr'));
});

test('recap says everyone is settled when nothing is owed', () => {
  const d = doc();
  d.sessions.forEach(s => { s.paid = [...s.players]; });
  const txt = M.recapText(d, cfg, M.totals(d, cfg), 'id', { today: '3 Oct' });
  assert.ok(txt.includes('• Semua lunas 🎉'));
  assert.ok(txt.includes('Total yang masih masuk ke Fadel: 0 kr'));
});

test('share text lists only sessions that still have unpaid players', () => {
  const d = doc();                              // 18 Sep is fully paid, 11 Sep and 25 Sep are not
  const T = M.totals(d, cfg);
  const id = M.recapText(d, cfg, T, 'id', { today: '3 Oct' });
  assert.ok(id.includes('📅 11 Sep'));
  assert.ok(id.includes('📅 25 Sep'));
  assert.ok(!id.includes('18 Sep'), 'completed session is left out');
  assert.ok(!id.includes('Lunas semua'));
  assert.equal(id.split('\n').filter(l => l.startsWith('📅')).length, 2);
  const en = M.recapText(d, cfg, T, 'en', { today: '3 Oct' });
  assert.ok(!en.includes('18 Sep'));
  assert.ok(!en.includes('All paid'));
});

test('leaving completed sessions out does not change the totals in the text', () => {
  const d = doc();
  const T = M.totals(d, cfg);
  const id = M.recapText(d, cfg, T, 'id', { today: '3 Oct' });
  assert.ok(id.includes('Total yang masih masuk ke Fadel: 802,5 kr'));
  assert.ok(id.includes('• Real: 200 kr'));
  assert.ok(id.includes('• Pending: 40 kr'));
  assert.ok(id.includes('• Total nanti: 240 kr'));
  assert.deepEqual(T, M.totals(d, cfg));
});

test('when every session is paid the text has no session blocks, only the settled summary', () => {
  const d = doc();
  d.sessions.forEach(s => { s.paid = [...s.players]; });
  const txt = M.recapText(d, cfg, M.totals(d, cfg), 'id', { today: '3 Oct' });
  assert.equal(txt.split('\n').filter(l => l.startsWith('📅')).length, 0);
  assert.ok(txt.includes('• Semua lunas 🎉'));
  assert.ok(txt.includes('• Real: 240 kr'));       // 125 + 5 x 23 paid players
});
