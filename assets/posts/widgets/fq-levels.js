(() => {
  // node_modules/.cache/widgets-build/kit.js
  function byId(id) {
    return document.getElementById(id);
  }
  function reveal(el) {
    el.hidden = false;
  }
  function stepButtons(bar, items, onPick) {
    const buttons = items.map((item, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = item.text;
      if (item.ariaLabel)
        b.setAttribute("aria-label", item.ariaLabel);
      b.addEventListener("click", () => onPick(i));
      bar.appendChild(b);
      return b;
    });
    return {
      buttons,
      setActive(index) {
        buttons.forEach((b, k) => b.setAttribute("aria-pressed", String(k === index)));
      }
    };
  }

  // node_modules/.cache/widgets-build/fq-levels.js
  var LAPTOP_SE = [
    ["User", "How do I request a new laptop in Sweden?"],
    [
      "Bot",
      "Open a hardware request in the IT portal. Your manager approves it, and IT ships the laptop to your office."
    ]
  ];
  var VPN_CLARIFY = [
    ["User", "I need help with VPN-7"],
    ["Bot", "Could you tell me more about what you need help with regarding VPN-7?"]
  ];
  var SCENARIOS = [
    {
      label: "Location",
      chat: LAPTOP_SE,
      last: "And in Poland?",
      generic: "How do I request a new laptop in Poland?",
      typed: "How do I request a new laptop in Poland?",
      ok: [false, false, true, true],
      notes: [
        "Search gets three words and no subject. It returns the pages that mention Poland the most.",
        "The answer model now knows the user means laptops. But search already ran on the bare follow-up, so the documents are the wrong ones.",
        "A rewrite before search fills in the subject. For a simple follow-up like this, a generic rewrite prompt is enough.",
        "Same result. An explicit location in the latest message replaces the earlier one."
      ]
    },
    {
      label: "New question",
      chat: VPN_CLARIFY,
      last: "How do I reset my password?",
      generic: "How do I reset my VPN-7 password?",
      typed: "How do I reset my password?",
      ok: [true, true, false, true],
      notes: [
        "The message is already standalone, so searching it as typed works here.",
        "Search is still right. The answer model also sees the history.",
        "A generic rewrite sees a pending clarifying question and merges. But the user moved on: the reply has its own subject.",
        "A self-contained question starts a new query, even right after a clarifying question. Nothing from earlier turns is copied in."
      ]
    },
    {
      label: "Fragment",
      chat: VPN_CLARIFY,
      last: "setting it up on my phone",
      generic: "Setting up VPN-7 on my phone",
      typed: "Setting up VPN-7 on my phone",
      ok: [false, false, true, true],
      notes: [
        'Search sees no subject. "it" could be anything.',
        "The answer model can guess the subject, but the documents were found without it.",
        "Merging is right this time. The user answered the question the bot asked.",
        "A fragment that answers a clarifying question is combined with the pending subject. Compare it with the new-question chat: same bot message, opposite rule."
      ]
    },
    {
      label: "Complaint",
      chat: [
        ["User", "Can I get a company phone?"],
        [
          "Bot",
          "I couldn't find a company phone policy. I found the laptop loan program, which lends a laptop for up to two weeks."
        ]
      ],
      last: "Really nothing on it? Who qualifies for it?",
      generic: "Who qualifies for the laptop loan program?",
      typed: "Who qualifies for a company phone?",
      ok: [false, false, false, true],
      notes: [
        "Search gets a complaint and two pronouns. Nothing in it names a subject.",
        "The answer model sees the history, but search did not.",
        '"it" is resolved by recency, so it becomes the last item the bot named. But the user is complaining that their own question had no answer.',
        "In a complaint, pronouns stay on the user's original subject. The bot's alternative is used only if the user names it or accepts it."
      ]
    },
    {
      label: "Unrelated",
      chat: LAPTOP_SE,
      last: "How do I book a meeting room?",
      generic: "How do I book a meeting room in Sweden?",
      typed: "How do I book a meeting room?",
      ok: [true, true, false, true],
      notes: [
        "A new, standalone question. Searching it as typed is fine.",
        "Search is still right. The answer model also sees the history.",
        "The rewrite adds the earlier location because the new query has none. The search is now narrowed to a country the user did not ask about.",
        "An earlier location is inherited only by a related follow-up. A new topic gets no location."
      ]
    }
  ];
  var LEVELS = ["1 Last message", "2 History to answer", "3 Rewrite", "4 Follow-up type"];
  var NO_HISTORY = "The rewriter got an empty history, so it took the first-message path and kept the message as typed. Nothing failed. This is what our chatbot did until the history bug was fixed.";
  var root = byId("fq-lab");
  if (root) {
    let show = function() {
      const s = SCENARIOS[scenario];
      scenarioButtons.setActive(scenario);
      levelButtons.setActive(level);
      const lines = [...s.chat, ["User", s.last]];
      chat.replaceChildren(...lines.map(([who, text], i) => {
        const li = document.createElement("li");
        if (i === lines.length - 1)
          li.className = "fq-last";
        const label = document.createElement("span");
        label.className = "fq-who";
        label.textContent = i === lines.length - 1 ? who + ", latest message" : who;
        li.append(label, text);
        return li;
      }));
      const rewrites = level >= 2;
      const lost = rewrites && !history.checked;
      const q = !rewrites || lost ? s.last : level === 2 ? s.generic : s.typed;
      const good = lost ? s.ok[0] : s.ok[level];
      query.textContent = q;
      verdict.textContent = good ? "Fits what the user meant." : "Misses what the user meant.";
      out.classList.toggle("fq-ok", good);
      out.classList.toggle("fq-bad", !good);
      note.textContent = lost ? NO_HISTORY : s.notes[level];
    };
    const chat = byId("fq-chat");
    const out = byId("fq-out");
    const query = byId("fq-query");
    const verdict = byId("fq-verdict");
    const note = byId("fq-note");
    const history = byId("fq-history");
    let scenario = 0;
    let level = 0;
    const scenarioButtons = stepButtons(byId("fq-scenarios"), SCENARIOS.map((s) => ({ text: s.label })), (i) => {
      scenario = i;
      show();
    });
    const levelButtons = stepButtons(byId("fq-levels"), LEVELS.map((text) => ({ text })), (i) => {
      level = i;
      show();
    });
    history.addEventListener("change", show);
    show();
    reveal(root);
  }
})();
