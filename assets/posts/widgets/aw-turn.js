(() => {
  // node_modules/.cache/widgets-build/kit.js
  function byId(id) {
    return document.getElementById(id);
  }
  function prefersReducedMotion() {
    return typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  function reveal(el) {
    el.hidden = false;
  }
  function createPlayer(tick, intervalMs) {
    let timer = null;
    const player = {
      start() {
        if (timer)
          return;
        timer = setInterval(tick, intervalMs);
      },
      stop() {
        if (timer)
          clearInterval(timer);
        timer = null;
      },
      get running() {
        return timer !== null;
      }
    };
    return player;
  }
  function stopOnHidden(player, onStop) {
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && player.running) {
        player.stop();
        onStop?.();
      }
    });
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

  // node_modules/.cache/widgets-build/aw-turn.js
  var sel = (speaker) => ({ speaker, chosenBy: "selector" });
  var CASES = [
    {
      label: "Clear question",
      question: "How do I request a new laptop?",
      chat: [
        { speaker: "Reception", chosenBy: "start" },
        sel("Orchestration"),
        sel("Retrieval"),
        sel("Filter"),
        sel("Response"),
        sel("Reply")
      ],
      steps: ["receive", "retrieve", "respond"],
      notes: [
        "Group chat: five times, a selector function reads the last message and names the next speaker. Fixed steps: three function calls in a known order."
      ]
    },
    {
      label: "Unclear question",
      question: "I need help with it",
      chat: [{ speaker: "Reception", chosenBy: "start" }, sel("Orchestration"), sel("Reply")],
      steps: ["receive", "early exit: clarifying question"],
      notes: [
        "Both designs stop early with a clarifying question. In the fixed steps, receive returns a reply and the code returns it. Nothing else runs."
      ]
    },
    {
      label: "No documents",
      question: "What is the policy for item X?",
      chat: [
        { speaker: "Reception", chosenBy: "start" },
        sel("Orchestration"),
        sel("Retrieval"),
        sel("Filter"),
        sel("Retrieval"),
        sel("Filter"),
        sel("Reply")
      ],
      steps: ["receive", "retrieve", "early exit: no answer"],
      notes: [
        "Group chat: the selector sends the turn back to Retrieval while retries are left, then to Reply. Fixed steps: retrieve does its own retries inside one function, and the code returns a no-answer reply."
      ]
    },
    {
      label: "Unplanned case",
      question: "A message no rule expected",
      chat: [
        { speaker: "Reception", chosenBy: "start" },
        sel("Orchestration"),
        sel("Retrieval"),
        sel("Filter"),
        { speaker: "Response", chosenBy: "model" },
        sel("Reply")
      ],
      steps: ["receive", "retrieve", "error: no rule for this case"],
      notes: [
        "Group chat: the selector returns None, so AutoGen asks a model to pick the next speaker. That call is outside our traced LLM spans, so nobody sees it. Fixed steps: a missing case raises an error, which shows up in tests and traces."
      ]
    }
  ];
  var root = byId("aw-lab");
  if (root) {
    let total = function(c) {
      return Math.max(c.chat.length, c.steps.length);
    }, chip = function(text, cls, title) {
      const li = document.createElement("li");
      li.textContent = text;
      if (cls)
        li.className = cls;
      if (title)
        li.title = title;
      return li;
    }, arrow = function(label) {
      return chip("\u2192 " + label + " \u2192", "is-arrow");
    }, draw = function() {
      const c = CASES[current];
      caseButtons.setActive(current);
      question.textContent = c.question;
      const hops = c.chat.slice(0, shown);
      chatList.replaceChildren(...hops.flatMap((h, i) => {
        const node = chip(h.speaker, h.chosenBy === "model" ? "is-b" : "");
        if (i === 0)
          return [node];
        return [arrow(h.chosenBy === "model" ? "model picks" : "selector"), node];
      }));
      const steps = c.steps.slice(0, shown);
      stepList.replaceChildren(...steps.flatMap((s, i) => {
        const end = s.startsWith("early exit") || s.startsWith("error");
        const node = chip(s, s.startsWith("error") ? "is-b" : end ? "" : "is-a");
        return i === 0 ? [node] : [arrow("code"), node];
      }));
      const decisions = Math.max(0, hops.length - 1);
      const modelPicks = hops.filter((h) => h.chosenBy === "model").length;
      byId("aw-n-chat").textContent = String(decisions);
      byId("aw-n-model").textContent = String(modelPicks);
      byId("aw-n-steps").textContent = String(steps.length);
      const done = shown >= total(c);
      status.textContent = done ? c.notes[0] : shown === 0 ? "Press Step or Play to follow the turn." : `Step ${shown} of ${total(c)}.`;
    }, tick = function() {
      if (shown >= total(CASES[current])) {
        player.stop();
        syncPlay();
        return;
      }
      shown += 1;
      draw();
    }, syncPlay = function() {
      playButton.textContent = player.running ? "Pause" : "Play";
      playButton.setAttribute("aria-pressed", String(player.running));
    };
    const chatList = byId("aw-chat");
    const stepList = byId("aw-steps");
    const question = byId("aw-question");
    const status = byId("aw-status");
    const playButton = byId("aw-play");
    let current = 0;
    let shown = 0;
    const caseButtons = stepButtons(byId("aw-cases"), CASES.map((c) => ({ text: c.label })), (i) => {
      current = i;
      shown = 0;
      player.stop();
      syncPlay();
      draw();
    });
    const player = createPlayer(tick, 900);
    playButton.addEventListener("click", () => {
      if (player.running)
        player.stop();
      else {
        if (shown >= total(CASES[current]))
          shown = 0;
        player.start();
      }
      syncPlay();
    });
    byId("aw-step").addEventListener("click", tick);
    byId("aw-reset").addEventListener("click", () => {
      player.stop();
      shown = 0;
      syncPlay();
      draw();
    });
    stopOnHidden(player, syncPlay);
    reveal(root);
    if (prefersReducedMotion())
      shown = total(CASES[current]);
    draw();
    syncPlay();
  }
})();
