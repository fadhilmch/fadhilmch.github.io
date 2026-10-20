(() => {
  'use strict';
  const widget = document.getElementById('po-playground');
  const input = document.getElementById('po-user-id');
  const status = document.getElementById('po-status');
  const results = document.getElementById('po-results');
  // SHA-1 is PlanOut's assignment mixer here, not a security primitive.
  if (!window.crypto || !window.crypto.subtle || typeof TextEncoder === 'undefined' || typeof BigInt === 'undefined') {
    const note = document.createElement('p');
    note.textContent = 'The interactive example needs a browser with Web Crypto and BigInt on HTTPS. The static calculation above still applies.';
    widget.replaceWith(note);
    return;
  }
  widget.hidden = false;
  let revision = 0;
  async function update() {
    const current = ++revision;
    const unit = input.value; // Preserve the exact ID, including spaces and Unicode.
    results.hidden = true;
    if (unit === '') {
      status.textContent = 'Enter a user ID to compute its assignment.';
      return;
    }
    status.textContent = 'Computing the assignment...';
    try {
      const key = 'checkout-v1.button.' + unit;
      const bytes = new TextEncoder().encode(key);
      const digest = await window.crypto.subtle.digest('SHA-1', bytes);
      if (current !== revision) return; // An older digest must not overwrite a newer ID.
      const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
      const prefix = hash.slice(0, 15);
      // Number would lose precision for a 60-bit hash. Keep this exact with BigInt.
      const integer = BigInt('0x' + prefix);
      const remainder = integer % BigInt(2);
      const choice = ['blue', 'pink'][Number(remainder)];
      document.getElementById('po-key').textContent = key;
      document.getElementById('po-hash').textContent = hash;
      document.getElementById('po-prefix').textContent = prefix;
      document.getElementById('po-integer').textContent = integer.toString();
      document.getElementById('po-modulo').textContent = 'h % 2 = ' + remainder + ' → choices[' + remainder + ']';
      const badge = document.getElementById('po-choice');
      badge.textContent = choice;
      badge.dataset.choice = choice;
      results.hidden = false;
      status.textContent = 'Assigned to ' + choice + '. Same ID, same answer.';
    } catch (error) {
      if (current !== revision) return;
      status.textContent = 'This browser could not compute SHA-1. The static example above is still available.';
    }
  }
  input.addEventListener('input', update);
  update();
})();

