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

  // node_modules/.cache/widgets-build/hx-playground.js
  var WINDOW_S = 10;
  var VOLUME_THRESHOLD = 20;
  var ERROR_PERCENT_THRESHOLD = 50;
  var SLEEP_WINDOW_S = 5;
  var MAX_RPS = 20;
  var widget = byId("hx-lab");
  var chart = byId("hx-chart");
  var rpsInput = byId("hx-rps");
  var failInput = byId("hx-fail");
  var playButton = byId("hx-play");
  var stepButton = byId("hx-step");
  var resetButton = byId("hx-reset");
  var status = byId("hx-status");
  var t = 0;
  var open = false;
  var openedOrLastTested = 0;
  var buckets = [];
  var served = 0;
  var cached = 0;
  function windowTotals() {
    const recent = buckets.filter((b) => b.t > t - WINDOW_S);
    const ok = recent.reduce((s, b) => s + b.ok, 0);
    const errors = recent.reduce((s, b) => s + b.fail + b.short, 0);
    const requests = ok + errors;
    return { requests, errorPct: requests ? Math.round(100 * errors / requests) : 0 };
  }
  function isOpen() {
    if (open)
      return true;
    const { requests, errorPct } = windowTotals();
    if (requests < VOLUME_THRESHOLD)
      return false;
    if (errorPct >= ERROR_PERCENT_THRESHOLD) {
      open = true;
      openedOrLastTested = t;
    }
    return open;
  }
  function allowRequest() {
    if (!isOpen())
      return true;
    if (t >= openedOrLastTested + SLEEP_WINDOW_S) {
      openedOrLastTested = t;
      return true;
    }
    return false;
  }
  function tick() {
    t += 1;
    const bucket = { t, ok: 0, fail: 0, short: 0 };
    buckets.push(bucket);
    const failRate = Number(failInput.value) / 100;
    for (let i = 0; i < Number(rpsInput.value); i++) {
      if (!allowRequest()) {
        bucket.short++;
        cached++;
        continue;
      }
      if (Math.random() < failRate) {
        bucket.fail++;
        cached++;
      } else {
        if (open) {
          open = false;
          buckets = [bucket];
          bucket.ok = bucket.fail = bucket.short = 0;
        }
        bucket.ok++;
        served++;
      }
    }
    buckets = buckets.filter((b) => b.t > t - WINDOW_S);
    draw();
  }
  function draw() {
    const { requests, errorPct } = windowTotals();
    resetChart(chart, "Requests in the last 10 simulated seconds", `${requests} requests in the window, ${errorPct}% errors. The circuit is ${open ? "open" : "closed"}.`);
    const x0 = 24;
    const slot = 63;
    const base = 150;
    const scale = 110 / MAX_RPS;
    for (let i = 0; i < WINDOW_S; i++) {
      const time = t - WINDOW_S + 1 + i;
      const b = buckets.find((k) => k.t === time);
      const x = x0 + i * slot;
      chart.append(svg("rect", {
        x,
        y: base - MAX_RPS * scale,
        width: slot - 12,
        height: MAX_RPS * scale,
        class: "hx-slot"
      }));
      if (!b)
        continue;
      let y = base;
      const stack = [
        [b.ok, "fa"],
        [b.fail, "fb"],
        [b.short, "hx-short"]
      ];
      stack.forEach(([n, cls]) => {
        if (!n)
          return;
        const h = n * scale;
        y -= h;
        chart.append(svg("rect", { x, y, width: slot - 12, height: h, class: cls }));
      });
    }
    chart.append(svg("text", { x: x0, y: 170, class: "m" }, "10 s ago"));
    chart.append(svg("text", { x: x0 + WINDOW_S * slot - 12, y: 170, class: "m", "text-anchor": "end" }, "now"));
    chart.append(svg("text", { x: x0, y: 22, class: "t" }, `window: ${requests} requests (needs ${VOLUME_THRESHOLD}), ${errorPct}% errors (trips at ${ERROR_PERCENT_THRESHOLD}%)`));
    byId("hx-served").textContent = String(served);
    byId("hx-cached").textContent = String(cached);
    const state = byId("hx-state");
    state.textContent = open ? "open" : "closed";
    state.dataset.open = String(open);
    if (open) {
      const wait = openedOrLastTested + SLEEP_WINDOW_S - t;
      status.textContent = wait > 0 ? `Open: every call gets the cached config. Next probe in ${wait} s.` : "Open: the next call is a probe. If it succeeds, the circuit closes.";
    } else if (requests < VOLUME_THRESHOLD) {
      status.textContent = `Closed. Too few requests in the window to judge (${requests} of ${VOLUME_THRESHOLD}), so it cannot trip.`;
    } else {
      status.textContent = "Closed: calls go to the dependency.";
    }
  }
  function reset() {
    t = 0;
    open = false;
    openedOrLastTested = 0;
    buckets = [];
    served = 0;
    cached = 0;
    draw();
  }
  function syncLabels() {
    byId("hx-rps-out").textContent = rpsInput.value + " / s";
    byId("hx-fail-out").textContent = failInput.value + "%";
  }
  var player = createPlayer(tick, 600);
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
  stepButton.addEventListener("click", tick);
  resetButton.addEventListener("click", reset);
  [rpsInput, failInput].forEach((input) => input.addEventListener("input", syncLabels));
  stopOnHidden(player, syncPlay);
  reveal(widget);
  syncLabels();
  reset();
  if (!prefersReducedMotion())
    player.start();
  syncPlay();
})();
