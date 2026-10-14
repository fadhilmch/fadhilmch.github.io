// Money math and recap text for TenisYuk. Pure functions, no DOM, no globals.
// Rules: kas = 5 kr per person, membership = billed minus real booking only.
(function (root) {
  const KAS = 5;
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const round2 = n => Math.round(n * 100) / 100;
  const group = (n, sep, dec) => {
    const [i, d] = String(round2(n)).split('.');
    return i.replace(/\B(?=(\d{3})+(?!\d))/g, sep) + (d ? dec + d : '');
  };
  const fEn = n => group(n, ',', '.');
  const fId = n => group(n, '.', ',');
  const kr = n => fEn(n) + ' kr';

  const court = s => s.billed / s.players.length;      // court share per person
  const charge = s => court(s) + KAS;                  // court share + kas
  const gap = s => s.billed - s.real;                  // membership part of a session
  const othersCount = (s, payer) => s.players.filter(p => p !== payer).length;
  const unpaidOthers = (s, payer) => s.players.filter(p => !s.paid.includes(p) && p !== payer);

  function totals(doc, cfg) {
    const ss = doc.sessions, P = cfg.payer;
    const unpaid = s => unpaidOthers(s, P);
    const names = [...new Set(ss.flatMap(s => s.players))];
    const owes = names
      .map(n => ({
        name: n,
        amount: ss.reduce((a, s) => a + (unpaid(s).includes(n) ? charge(s) : 0), 0),
        dates: ss.filter(s => unpaid(s).includes(n)).map(s => s.date),
      }))
      .filter(o => o.amount > 0)
      .sort((a, b) => b.amount - a.amount);
    const outstanding = owes.reduce((a, o) => a + o.amount, 0);
    const sg = t => (t.kind === 'in' ? 1 : -1) * t.amount;
    const kasManual = doc.tx.filter(t => t.account === 'kas').reduce((a, t) => a + sg(t), 0);
    const memManual = doc.tx.filter(t => t.account === 'membership').reduce((a, t) => a + sg(t), 0);
    const kasPersons = ss.reduce((a, s) => a + s.paid.filter(p => s.players.includes(p)).length, 0);
    const kasReal = cfg.kasOpening + KAS * kasPersons + kasManual;
    const kasPending = KAS * ss.reduce((a, s) => a + unpaid(s).length, 0);
    const realCost = ss.reduce((a, s) => a + s.real, 0);
    const charged = ss.reduce((a, s) => a + charge(s) * othersCount(s, P), 0);
    const attendance = names
      .map(n => ({ name: n, count: ss.filter(s => s.players.includes(n)).length }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    return {
      names, owes, outstanding,
      membership: ss.reduce((a, s) => a + gap(s), 0) + memManual,
      kasPersons, kasManual, kasReal, kasPending, realCost, charged,
      collected: charged - outstanding, attendance,
    };
  }

  // ---- ledger rows, chart data, membership progress ----
  const DEFAULT_MEMBERSHIP_TARGET = 1000;
  // Rows for one account ('kas' or 'membership') in page order, each with a running balance.
  // Session rows are automatic; manual rows carry manual:true and their tx id.
  function ledgerRows(doc, cfg, acct) {
    const rows = [];
    if (acct === 'kas') rows.push({ d: '', n: 'Opening balance', v: cfg.kasOpening });
    doc.sessions.forEach(s => {
      if (acct === 'kas') {
        const k = s.paid.filter(p => s.players.includes(p)).length;
        if (k) rows.push({ d: s.date, n: k + (k === 1 ? ' player' : ' players') + ' paid × 5', v: k * KAS });
      } else if (gap(s) > 0) rows.push({ d: s.date, n: 'Gap ' + fEn(s.billed) + ' − ' + fEn(s.real), v: gap(s) });
    });
    doc.tx.filter(t => t.account === acct).forEach(t => rows.push({
      id: t.id, d: t.date, n: t.note || (t.kind === 'in' ? 'Money in' : 'Money out'),
      v: (t.kind === 'in' ? 1 : -1) * t.amount, manual: true }));
    let run = 0;
    return rows.map(r => { run = round2(run + r.v); return { ...r, run }; });
  }
  // Chart data from ledger rows: balance after each row, money in, money out, min/max balance.
  function ledgerSeries(rows) {
    const bal = rows.map(r => r.run);
    return {
      points: rows.map((r, i) => ({ label: r.d || 'Start', value: r.run, delta: r.v, index: i })),
      moneyIn: round2(rows.filter(r => r.v > 0).reduce((a, r) => a + r.v, 0)),
      moneyOut: round2(rows.filter(r => r.v < 0).reduce((a, r) => a - r.v, 0)),
      min: bal.length ? Math.min(0, ...bal) : 0,
      max: bal.length ? Math.max(0, ...bal) : 0,
      balance: bal.length ? bal[bal.length - 1] : 0,
    };
  }
  // One entry per date for the charts: money in, money out and the balance at the end of that date.
  // Rows with the same date label merge (consecutive or not); first-seen order is kept. No date = 'Start'.
  function ledgerByDate(rows) {
    const out = [], idx = new Map();
    rows.forEach(r => {
      const label = r.d || 'Start';
      if (!idx.has(label)) { idx.set(label, out.length); out.push({ label, in: 0, out: 0, balance: 0 }); }
      const e = out[idx.get(label)];
      if (r.v >= 0) e.in = round2(e.in + r.v); else e.out = round2(e.out - r.v);
    });
    let run = 0;
    out.forEach(e => { run = round2(run + e.in - e.out); e.balance = run; });
    return out;
  }
  // Membership pot vs target (total pot, not per person). pct is capped at 100.
  function membershipProgress(total, target) {
    const t = target > 0 ? target : DEFAULT_MEMBERSHIP_TARGET;
    const have = Math.max(0, total);
    return { have, target: t, remaining: Math.max(0, round2(t - have)),
             pct: Math.min(100, Math.round(have / t * 1000) / 10), reached: have >= t };
  }

  // opts: { today: '3 Oct', siteUrl: 'https://...' }
  function recapText(doc, cfg, T, lang, opts) {
    const o = opts || {};
    const ss = doc.sessions, id = lang === 'id', P = cfg.payer, L = [];
    const F = n => (id ? fId(n) : fEn(n)) + ' kr';
    const unpaid = s => unpaidOthers(s, P);
    L.push(id ? `🎾 REKAP TENIS (update ${o.today})` : `🎾 TENNIS RECAP (update ${o.today})`, '');
    // Only sessions that still have unpaid players go in the share text.
    // Totals below still cover every session.
    for (const s of ss.filter(x => unpaid(x).length)) {
      const g = gap(s), c = charge(s);
      L.push(id
        ? (g > 0
          ? `📅 ${s.date} - total ${F(s.billed)} (${F(s.real)} sewa + ${F(g)} membership, ${P} talangin ${F(s.real)}), ${F(c)}/orang`
          : `📅 ${s.date} - court ${F(s.billed)} (${P} talangin), ${F(c)}/orang`)
        : (g > 0
          ? `📅 ${s.date} - total ${F(s.billed)} (${F(s.real)} rent + ${F(g)} membership, ${P} fronted ${F(s.real)}), ${F(c)}/person`
          : `📅 ${s.date} - court ${F(s.billed)} (${P} fronted), ${F(c)}/person`));
      if (s.venue) L.push(`📍 ${s.venue}`);
      const u = unpaid(s), paid = s.players.filter(p => s.paid.includes(p));
      if (!u.length) L.push(id ? '✅ Lunas semua 🎉' : '✅ All paid 🎉');
      else {
        L.push(`✅ ${id ? 'Lunas' : 'Paid'}: ${paid.join(', ') || '-'}`);
        L.push(`⏳ ${id ? 'Belum bayar' : 'Not paid yet'}: ${u.map(n => n + ' ' + F(c)).join(' | ')}`);
      }
      L.push('');
    }
    L.push(id ? `💰 Total per orang ke ${P}:` : `💰 Total per person to ${P}:`);
    const by = new Map();
    T.owes.forEach(w => by.set(w.amount, [...(by.get(w.amount) || []), w.name]));
    [...by.entries()].sort((a, b) => b[0] - a[0]).forEach(([a, ns]) =>
      L.push(`• ${ns.join(', ')}: ${F(a)}${ns.length > 1 ? (id ? ' masing-masing' : ' each') : ''}`));
    if (!T.owes.length) L.push(id ? '• Semua lunas 🎉' : '• Everyone is settled 🎉');
    L.push('',
      `💵 ${id ? `Total yang belum dibayar ke ${P}` : `Total still owed to ${P}`}: ${F(T.outstanding)}`, '',
      id ? '🏦 Kas bola (5 kr/orang):' : '🏦 Ball cash (5 kr/person):',
      `• Real: ${F(T.kasReal)}`, `• Pending: ${F(T.kasPending)}`,
      `• ${id ? 'Total nanti' : 'Total later'}: ${F(T.kasReal + T.kasPending)}`, '',
      `📲 ${id ? `Swish ke ${P}` : `Swish to ${P}`}: ${cfg.swish}`, '',
      `🔗 ${id ? 'Detail lengkap' : 'Full details'}: ${o.siteUrl || ''}`);
    return L.join('\n');
  }


  // ---- dates: the page stores labels like "2 Oct" (no year) ----
  const dateToLabel = iso => {
    const p = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    if (!p) return '';
    const mo = Number(p[2]), d = Number(p[3]);
    if (mo < 1 || mo > 12 || d < 1 || d > 31) return '';
    return d + ' ' + MONTHS[mo - 1];
  };
  const labelToIso = (label, year) => {
    const p = /^(\d{1,2})\s+([A-Za-z]{3})$/.exec(String(label || '').trim());
    if (!p) return '';
    const mo = MONTHS.findIndex(x => x.toLowerCase() === p[2].toLowerCase()) + 1;
    const d = Number(p[1]);
    if (!mo || d < 1 || d > 31) return '';
    return String(year) + '-' + String(mo).padStart(2, '0') + '-' + String(d).padStart(2, '0');
  };
  // Today's date in Stockholm as YYYY-MM-DD (en-CA formats that way).
  const todayIso = (now, tz) => new Intl.DateTimeFormat('en-CA', {
    timeZone: tz || 'Europe/Stockholm', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now || new Date());
  const hasDate = (doc, label) => doc.sessions.some(s => s.date === label);

  // Swish link per the official spec (developer.swish.nu, "Create QR code from specification"):
  // https://app.swish.nu/1/p/sw/?sw=<number with country code>&amt=<amount>&msg=<text>
  // Amount and message are locked in the payment form by default.
  function swishLink(number, amount, msg) {
    let d = String(number || '').replace(/\D/g, '');
    if (!d) return '';
    if (d.startsWith('00')) d = d.slice(2);
    else if (d.startsWith('0')) d = '46' + d.slice(1);
    let u = 'https://app.swish.nu/1/p/sw/?sw=' + d;
    if (amount > 0) u += '&amt=' + (Math.round(amount * 100) / 100).toFixed(2);
    if (msg) u += '&msg=' + encodeURIComponent(msg);
    return u;
  }

  // Sessions that make up one player's total owed: [{date, amount}]
  function owedBreakdown(doc, cfg, name) {
    return doc.sessions
      .filter(s => unpaidOthers(s, cfg.payer).includes(name))
      .map(s => ({ date: s.date, amount: charge(s) }));
  }

  // "12,5", "12.5", "1 250,50" -> number; anything else -> NaN
  const parseAmount = v => {
    const s = String(v == null ? '' : v).trim().replace(/[\s\u00a0]/g, '').replace(/kr$/i, '');
    if (!/^\d+([.,]\d{1,2})?$/.test(s)) return NaN;
    return Number(s.replace(',', '.'));
  };

  const api = { ledgerRows, ledgerSeries, ledgerByDate, membershipProgress, DEFAULT_MEMBERSHIP_TARGET, parseAmount, owedBreakdown, swishLink, dateToLabel, labelToIso, todayIso, hasDate, KAS, MONTHS, fEn, fId, kr, court, charge, gap, unpaidOthers, othersCount, totals, recapText };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TYMoney = api;
})(typeof window !== 'undefined' ? window : globalThis);
