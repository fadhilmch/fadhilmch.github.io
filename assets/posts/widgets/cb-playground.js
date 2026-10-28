(() => {
  // node_modules/.cache/widgets-build/kit.js
  function byId(id) {
    return document.getElementById(id);
  }
  var SVG_NS = "http://www.w3.org/2000/svg";
  function svg(tag, attrs, text) {
    const el = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, String(v)));
    if (text !== void 0)
      el.textContent = text;
    return el;
  }
  function resetChart(chart2, title, desc) {
    chart2.replaceChildren(svg("title", { id: chart2.id + "-title" }, title), svg("desc", { id: chart2.id + "-desc" }, desc));
    chart2.setAttribute("aria-labelledby", chart2.id + "-title " + chart2.id + "-desc");
  }
  function prefersReducedMotion() {
    return typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  function reveal(el) {
    el.hidden = false;
  }
  function createPlayer(tick2, intervalMs) {
    let timer = null;
    const player2 = {
      start() {
        if (timer)
          return;
        timer = setInterval(tick2, intervalMs);
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
    return player2;
  }
  function stopOnHidden(player2, onStop) {
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && player2.running) {
        player2.stop();
        onStop?.();
      }
    });
  }

  // node_modules/.cache/widgets-build/cb-playground.js
  var TRIP_FAILURES = 2;
  var WINDOW_S = 30;
  var COOLDOWN_S = 60;
  var VIEW_S = 90;
  var FAIL_COST_S = { "429": 0.3, timeout: 20 };
  var widget = byId("cb-lab");
  var chart = byId("cb-chart");
  var playButton = byId("cb-play");
  var stepButton = byId("cb-step");
  var quotaButton = byId("cb-quota");
  var resetButton = byId("cb-reset");
  var breakerBox = byId("cb-breaker");
  var kindSelect = byId("cb-kind");
  var status = byId("cb-status");
  var t = 0;
  var primaryDown = false;
  var calls = [];
  var downSpans = [];
  var openSpans = [];
  var failures = [];
  var openUntil = 0;
  var lostS = 0;
  var counts = { primary: 0, failed: 0, skipped: 0 };
  function circuitOpen() {
    return breakerBox.checked && t < openUntil;
  }
  function tick() {
    t += 1;
    let outcome;
    if (circuitOpen()) {
      outcome = "skipped";
    } else if (!primaryDown) {
      outcome = "primary";
      failures = [];
    } else {
      outcome = "failed";
      lostS += FAIL_COST_S[kindSelect.value];
      failures = failures.filter((f) => t - f < WINDOW_S).concat(t);
      if (breakerBox.checked && failures.length >= TRIP_FAILURES) {
        failures = [];
        openUntil = t + COOLDOWN_S;
        openSpans.push({ from: t, to: openUntil });
      }
    }
    counts[outcome]++;
    calls.push({ t, outcome });
    calls = calls.filter((c) => t - c.t < VIEW_S);
    draw();
  }
  var X0 = 24;
  var X1 = 656;
  function x(time) {
    return X1 - (t - time) * (X1 - X0) / VIEW_S;
  }
  function band(span, y, h, cls) {
    const from = Math.max(x(span.from), X0);
    const to = Math.min(x(span.to ?? t), X1);
    if (to <= X0 || from >= to)
      return;
    chart.append(svg("rect", { x: from, y, width: to - from, height: h, class: cls }));
  }
  function draw() {
    resetChart(chart, "The last 90 simulated seconds of model calls", `${counts.primary} calls served by the primary, ${counts.failed} failed on the primary and then used the fallback, ${counts.skipped} skipped the primary because the circuit was open. ${lostS.toFixed(1)} seconds were spent on failed primary attempts.`);
    downSpans.forEach((s) => band(s, 22, 6, "cb-down"));
    openSpans.forEach((s) => band(s, 40, 64, "cb-open"));
    chart.append(svg("text", { x: X0, y: 16, class: "m" }, "primary out of quota"));
    chart.append(svg("text", { x: X0, y: 118, class: "m" }, "circuit open (shaded)"));
    chart.append(svg("line", { x1: X0, x2: X1, y1: 72, y2: 72, class: "grid" }));
    calls.forEach((c) => {
      const cx = x(c.t);
      if (c.outcome === "primary") {
        chart.append(svg("circle", { cx, cy: 72, r: 3.5, class: "fa" }));
      } else if (c.outcome === "failed") {
        chart.append(svg("circle", { cx, cy: 72, r: 4.5, class: "fb" }));
      } else {
        chart.append(svg("circle", { cx, cy: 72, r: 3.5, class: "cb-skip" }));
      }
    });
    chart.append(svg("text", { x: X0, y: 140, class: "m" }, "90 s ago"));
    chart.append(svg("text", { x: X1, y: 140, class: "m", "text-anchor": "end" }, "now"));
    byId("cb-n-primary").textContent = String(counts.primary);
    byId("cb-n-failed").textContent = String(counts.failed);
    byId("cb-n-skipped").textContent = String(counts.skipped);
    byId("cb-lost").textContent = lostS.toFixed(1) + " s";
    if (!breakerBox.checked) {
      status.textContent = primaryDown ? "Breaker off: every call tries the primary first, fails, then falls back." : "Breaker off: calls go to the primary.";
    } else if (circuitOpen()) {
      status.textContent = `Circuit open for ${openUntil - t} more s: calls skip the primary.`;
    } else if (primaryDown && openSpans.length > 0) {
      status.textContent = "Cooldown over: calls try the primary again.";
    } else {
      status.textContent = "Circuit closed: calls try the primary first.";
    }
  }
  function setPrimaryDown(down) {
    primaryDown = down;
    if (down)
      downSpans.push({ from: t, to: null });
    else if (downSpans.length)
      downSpans[downSpans.length - 1].to = t;
    quotaButton.textContent = down ? "Quota is back" : "Primary runs out of quota";
    quotaButton.setAttribute("aria-pressed", String(down));
    draw();
  }
  function reset() {
    t = 0;
    calls = [];
    downSpans = [];
    openSpans = [];
    failures = [];
    openUntil = 0;
    lostS = 0;
    counts = { primary: 0, failed: 0, skipped: 0 };
    setPrimaryDown(false);
  }
  var player = createPlayer(tick, 250);
  function syncPlay() {
    playButton.textContent = player.running ? "Pause" : "Play";
    playButton.setAttribute("aria-pressed", String(player.running));
  }
  playButton.addEventListener("click", () => {
    if (player.running)
      player.stop();
    else
      player.start();
    syncPlay();
  });
  stepButton.addEventListener("click", () => {
    for (let i = 0; i < 10; i++)
      tick();
  });
  quotaButton.addEventListener("click", () => setPrimaryDown(!primaryDown));
  resetButton.addEventListener("click", reset);
  breakerBox.addEventListener("change", () => {
    if (!breakerBox.checked && t < openUntil) {
      openSpans[openSpans.length - 1].to = t;
      openUntil = 0;
    }
    failures = [];
    draw();
  });
  kindSelect.addEventListener("change", draw);
  stopOnHidden(player, syncPlay);
  reveal(widget);
  reset();
  if (!prefersReducedMotion())
    player.start();
  syncPlay();
})();
