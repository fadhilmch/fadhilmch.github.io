// Pure edit helpers for the admin screens. Each returns a NEW doc and never
// changes the one passed in, so the old doc can be kept and restored for Undo.
(function (root) {
  const clone = d => JSON.parse(JSON.stringify(d));
  const withSession = (doc, id, fn) => {
    const n = clone(doc);
    const s = n.sessions.find(x => x.id === id);
    if (s) fn(s, n);
    return n;
  };

  const toggle = (doc, id, name, payer) => withSession(doc, id, s => {
    if (name === payer || !s.players.includes(name)) return;
    s.paid = s.paid.includes(name) ? s.paid.filter(x => x !== name) : [...s.paid, name];
  });
  const markAllPaid = (doc, id) => withSession(doc, id, s => { s.paid = [...s.players]; });
  const setVenue = (doc, id, venue) => withSession(doc, id, s => {
    if (venue) s.venue = venue; else delete s.venue;
  });
  const setDate = (doc, id, label) => withSession(doc, id, s => { if (label) s.date = label; });
  const removeSession = (doc, id) => {
    const n = clone(doc);
    n.sessions = n.sessions.filter(x => x.id !== id);
    return n;
  };
  const addSession = (doc, s) => { const n = clone(doc); n.sessions.push(s); return n; };
  const addTx = (doc, t) => { const n = clone(doc); n.tx.push(t); return n; };
  const removeTx = (doc, id) => { const n = clone(doc); n.tx = n.tx.filter(x => x.id !== id); return n; };

  // Undo keeps one step: the doc as it was before the last change.
  function makeUndo() {
    let prev = null;
    return {
      remember(doc) { prev = doc; },
      available() { return prev !== null; },
      take() { const p = prev; prev = null; return p; },
    };
  }

  // Put the new doc in state, save it, and put the old doc back if the save never
  // reached the server ('offline'). 'server' means the server refused and save()
  // already reloaded the real data. Returns { result, prev }.
  async function commitChange(state, next, save) {
    const prev = state.doc;
    state.doc = next;
    const result = await save();
    if (result === 'offline') state.doc = prev;
    return { result, prev };
  }

  const api = { commitChange, toggle, markAllPaid, setVenue, setDate, removeSession, addSession, addTx, removeTx, makeUndo };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TYEdits = api;
})(typeof window !== 'undefined' ? window : globalThis);
