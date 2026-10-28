(() => {
  // node_modules/.cache/widgets-build/kit.js
  function byId(id) {
    return document.getElementById(id);
  }
  function reveal(el) {
    el.hidden = false;
  }
  function replaceWithNote(widget2, text) {
    const note = document.createElement("p");
    note.textContent = text;
    widget2.replaceWith(note);
  }

  // node_modules/.cache/widgets-build/po-playground.js
  var widget = byId("po-playground");
  var input = byId("po-user-id");
  var status = byId("po-status");
  var results = byId("po-results");
  if (!window.crypto || !window.crypto.subtle || typeof TextEncoder === "undefined" || typeof BigInt === "undefined") {
    replaceWithNote(widget, "The interactive example needs a browser with Web Crypto and BigInt on HTTPS. The static calculation above still applies.");
  } else {
    reveal(widget);
    let revision = 0;
    async function update() {
      const current = ++revision;
      const unit = input.value;
      results.hidden = true;
      if (unit === "") {
        status.textContent = "Enter a user ID to compute its assignment.";
        return;
      }
      status.textContent = "Computing the assignment...";
      try {
        const key = "checkout-v1.button." + unit;
        const bytes = new TextEncoder().encode(key);
        const digest = await window.crypto.subtle.digest("SHA-1", bytes);
        if (current !== revision)
          return;
        const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
        const prefix = hash.slice(0, 15);
        const integer = BigInt("0x" + prefix);
        const remainder = integer % BigInt(2);
        const choice = ["blue", "pink"][Number(remainder)];
        byId("po-key").textContent = key;
        byId("po-hash").textContent = hash;
        byId("po-prefix").textContent = prefix;
        byId("po-integer").textContent = integer.toString();
        byId("po-modulo").textContent = "h % 2 = " + remainder + " \u2192 choices[" + remainder + "]";
        const badge = byId("po-choice");
        badge.textContent = choice;
        badge.dataset.choice = choice;
        results.hidden = false;
        status.textContent = "Assigned to " + choice + ". Same ID, same answer.";
      } catch {
        if (current !== revision)
          return;
        status.textContent = "This browser could not compute SHA-1. The static example above is still available.";
      }
    }
    input.addEventListener("input", update);
    update();
  }
})();
