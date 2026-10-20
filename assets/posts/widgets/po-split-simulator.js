(() => {
  'use strict';
  const saltWidget = document.getElementById('po-salt-shifter');
  const splitWidget = document.getElementById('po-split-simulator');
  if (!window.crypto || !window.crypto.subtle || typeof TextEncoder === 'undefined' || typeof BigInt === 'undefined') {
    [saltWidget, splitWidget].forEach(widget => {
      const note = document.createElement('p');
      note.textContent = 'This interactive example needs Web Crypto and BigInt on HTTPS. The static examples still apply.';
      widget.replaceWith(note);
    });
    return;
  }
  saltWidget.hidden = splitWidget.hidden = false;
  const encoder = new TextEncoder();
  // PlanOut's SHA-1 mixer, not a cryptographic security feature. Never round the 60-bit integer.
  async function bucket(salt, unit) {
    const digest = await crypto.subtle.digest('SHA-1', encoder.encode(salt + '.button.' + unit));
    const hex = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
    return Number(BigInt('0x' + hex.slice(0, 15)) % BigInt(2));
  }
  const field = document.getElementById('po-dot-field');
  const saltButton = document.getElementById('po-change-salt');
  const saltStatus = document.getElementById('po-salt-status');
  const dots = Array.from({length:200}, (_, i) => {
    const dot = document.createElement('span');
    dot.className = 'po-dot';
    dot.title = 'user-' + i;
    field.appendChild(dot);
    return dot;
  });
  let saltVersion = 1;
  let assignments = [];
  function drawDots() {
    if (!assignments.length) return;
    const half = field.clientWidth / 2;
    const counts = [0, 0];
    assignments.forEach((choice, i) => {
      const index = counts[choice]++;
      const x = choice * half + 10 + (index % 8) * ((half - 22) / 8);
      const y = 12 + Math.floor(index / 8) * 12;
      dots[i].dataset.choice = String(choice);
      dots[i].style.transform = 'translate(' + x + 'px,' + y + 'px)';
    });
    field.style.height = (Math.ceil(Math.max(...counts) / 8) * 12 + 24) + 'px';
    document.getElementById('po-salt-blue').textContent = 'Blue: ' + counts[0];
    document.getElementById('po-salt-pink').textContent = 'Pink: ' + counts[1];
  }
  async function reshuffle() {
    saltButton.disabled = true;
    saltStatus.textContent = 'Computing 200 assignments...';
    const salt = 'checkout-v' + saltVersion;
    try {
      const next = await Promise.all(dots.map((_, i) => bucket(salt, 'user-' + i)));
      const changed = next.filter((choice, i) => assignments.length && choice !== assignments[i]).length;
      const initial = assignments.length === 0;
      assignments = next;
      document.getElementById('po-current-salt').textContent = salt;
      drawDots();
      saltStatus.textContent = initial ? '200 users assigned. Change salt to reshuffle them.' : changed + ' of 200 users changed sides. Same users; new salt.';
    } catch (error) {
      saltStatus.textContent = 'SHA-1 could not be computed. The static salt comparison is still available.';
    } finally { saltButton.disabled = false; }
  }
  saltButton.addEventListener('click', () => { saltVersion++; reshuffle(); });
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(drawDots).observe(field);
  else window.addEventListener('resize', drawDots);
  reshuffle();
  const runButton = document.getElementById('po-run-split');
  const splitStatus = document.getElementById('po-split-status');
  runButton.addEventListener('click', async () => {
    runButton.disabled = true;
    const counts = [0, 0];
    document.getElementById('po-split-progress').value = 0;
    document.getElementById('po-blue-fill').style.width = '0%';
    document.getElementById('po-pink-fill').style.width = '0%';
    document.getElementById('po-split-blue').textContent = 'Blue: 0';
    document.getElementById('po-split-pink').textContent = 'Pink: 0';
    splitStatus.textContent = 'Computing 10,000 real SHA-1 assignments...';
    try {
      // Bounded batches keep the page responsive and let actual progress paint.
      for (let start = 0; start < 10000; start += 250) {
        const batch = await Promise.all(Array.from({length:250}, (_, offset) => bucket('checkout-v1', 'user-' + (start + offset))));
        batch.forEach(choice => counts[choice]++);
        const completed = start + 250;
        document.getElementById('po-split-blue').textContent = 'Blue: ' + counts[0].toLocaleString();
        document.getElementById('po-split-pink').textContent = 'Pink: ' + counts[1].toLocaleString();
        document.getElementById('po-blue-fill').style.width = (counts[0] / 10000 * 100) + '%';
        document.getElementById('po-pink-fill').style.width = (counts[1] / 10000 * 100) + '%';
        document.getElementById('po-split-progress').value = completed;
        await new Promise(resolve => requestAnimationFrame(resolve));
      }
      splitStatus.textContent = '10,000 assigned: ' + (counts[0] / 100).toFixed(2) + '% blue, ' + (counts[1] / 100).toFixed(2) + '% pink. Repeat to get exactly the same counts. This is assignment, not exposure data or an SRM test.';
    } catch (error) {
      splitStatus.textContent = 'The computation stopped before finishing. Try again; the static explanation remains available.';
    } finally { runButton.disabled = false; }
  });
})();
