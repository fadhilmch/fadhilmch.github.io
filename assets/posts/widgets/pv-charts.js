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
  function resetChart(chart, title, desc) {
    chart.replaceChildren(svg("title", { id: chart.id + "-title" }, title), svg("desc", { id: chart.id + "-desc" }, desc));
    chart.setAttribute("aria-labelledby", chart.id + "-title " + chart.id + "-desc");
  }
  function chartLabel(chart, x, y, text, anchor = "middle", fill = "var(--muted)", fontSize = 14) {
    chart.append(svg("text", { x, y, "text-anchor": anchor, fill, "font-size": fontSize }, text));
  }
  function pct(x, digits = 1) {
    return (100 * x).toFixed(digits) + "%";
  }
  function normalCDF(x) {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const tail = Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI) * t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
    return x < 0 ? tail : 1 - tail;
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

  // node_modules/.cache/widgets-build/pv-charts.js
  var label = (chart, x, y, text, anchor = "middle", fill = "var(--muted)") => chartLabel(chart, x, y, text, anchor, fill, 14);
  var fmtP = (p) => p < 1e-4 ? "< 0.0001" : "= " + p.toFixed(4);
  function normalQuantile(p) {
    let lo = -9, hi = 9;
    for (let i = 0; i < 60; i++) {
      const mid = (lo + hi) / 2;
      if (normalCDF(mid) < p)
        lo = mid;
      else
        hi = mid;
    }
    return (lo + hi) / 2;
  }
  var ways = [1, 10, 45, 120, 210, 252, 210, 120, 45, 10, 1];
  var edge = (k) => Math.abs(k - 5) >= 3;
  (() => {
    const root = byId("pv-build");
    const model = ways.map((w) => w / 1024);
    let counts = Array(11).fill(0), current = [], total = 0, target = 0;
    const cells = model.map((p, k) => {
      const cell = document.createElement("div");
      cell.className = "build-cell" + (edge(k) ? " edge" : "");
      const track = document.createElement("div");
      track.className = "build-track";
      const bar = document.createElement("div");
      bar.className = "build-bar";
      const mark = document.createElement("div");
      mark.className = "build-model";
      track.append(bar, mark);
      const name = document.createElement("span");
      name.textContent = String(k);
      const count = document.createElement("span");
      count.className = "build-count";
      cell.append(track, name, count);
      byId("build-chart").append(cell);
      return { cell, bar, mark, count };
    });
    function draw(announce) {
      byId("build-flips").replaceChildren(...Array.from({ length: 10 }, (_, i) => {
        const s = document.createElement("span");
        s.textContent = current[i] || "\xB7";
        if (current[i] === "H")
          s.className = "heads";
        return s;
      }));
      const shares = counts.map((c) => total ? c / total : 0);
      const top = Math.max(0.3, ...shares) * 1.05;
      byId("build-scale").textContent = "Bar height: share of finished trials. Top of chart = " + pct(top, 0) + ".";
      cells.forEach(({ cell, bar, mark, count }, k) => {
        bar.style.height = shares[k] / top * 100 + "%";
        mark.style.bottom = model[k] / top * 100 + "%";
        count.textContent = counts[k];
        cell.title = k + " heads: " + counts[k] + " trials (" + pct(shares[k]) + "); fair-coin chance " + pct(model[k]);
      });
      byId("build-chart").setAttribute("aria-label", "Finished trials: " + total + ". " + counts.map((c, k) => k + " heads: " + c).join("; ") + ".");
      if (!announce)
        return;
      const lopsided = counts.reduce((s, c, k) => s + (edge(k) ? c : 0), 0);
      const heads = current.filter((x) => x === "H").length;
      byId("build-status").textContent = total ? "Finished trials: " + total.toLocaleString("en-US") + ". Trials with 8 or more heads, or 2 or fewer: " + lopsided + " (" + pct(lopsided / total) + "). The exact fair-coin answer is 10.9%." + (current.length && current.length < 10 ? " Current trial: " + current.length + " flips, " + heads + " heads." : "") : "No finished trials yet. Flip ten times, or press Play.";
    }
    const player = createPlayer(flip, 25);
    function setRunning(running) {
      ["build-play", "build-step", "build-fast"].forEach((id) => byId(id).disabled = running);
      byId("build-pause").disabled = !running;
    }
    function flip() {
      if (current.length === 10)
        current = [];
      current.push(Math.random() < 0.5 ? "H" : "T");
      if (current.length === 10) {
        counts[current.filter((x) => x === "H").length]++;
        total++;
      }
      draw(!player.running || current.length === 10);
      if (player.running && total >= target)
        stop();
    }
    function stop() {
      player.stop();
      setRunning(false);
      draw(true);
    }
    byId("build-step").addEventListener("click", flip);
    byId("build-play").addEventListener("click", () => {
      target = total + 100;
      setRunning(true);
      player.start();
    });
    byId("build-pause").addEventListener("click", stop);
    byId("build-fast").addEventListener("click", () => {
      for (let t = 0; t < 1e3; t++) {
        let h = 0;
        for (let i = 0; i < 10; i++)
          h += Math.random() < 0.5 ? 1 : 0;
        counts[h]++;
        total++;
      }
      current = [];
      draw(true);
    });
    byId("build-reset").addEventListener("click", () => {
      stop();
      counts = Array(11).fill(0);
      current = [];
      total = 0;
      draw(true);
    });
    stopOnHidden(player, () => {
      setRunning(false);
      draw(true);
    });
    draw(true);
    reveal(root);
  })();
  (() => {
    const root = byId("pv-coin"), heads = byId("pv-heads"), sided = byId("pv-sided");
    const bars = ways.map((w, k) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "pv-bar";
      button.setAttribute("aria-label", k + " heads, chance " + pct(w / 1024, 2) + ". Use as my result.");
      const bar = document.createElement("span");
      bar.style.height = w / 252 * 140 + "px";
      bar.setAttribute("aria-hidden", "true");
      const name = document.createElement("small");
      name.textContent = String(k);
      button.append(bar, name);
      button.addEventListener("click", () => {
        heads.value = String(k);
        update();
      });
      byId("pv-bars").append(button);
      return button;
    });
    function update() {
      const h = Number(heads.value), mode = sided.value;
      byId("pv-heads-value").textContent = String(h);
      const counted = ways.map((_, k) => mode === "upper" ? k >= h : Math.abs(k - 5) >= Math.abs(h - 5));
      bars.forEach((bar, k) => {
        bar.dataset.tail = String(counted[k]);
        bar.setAttribute("aria-pressed", k === h ? "true" : "false");
      });
      const n = ways.reduce((s, w, k) => s + (counted[k] ? w : 0), 0), p = n / 1024;
      byId("pv-coin-result").textContent = "Counted: " + counted.flatMap((yes, k) => yes ? [k] : []).join(", ") + " heads. That is " + n + " of 1,024 orders, so p " + fmtP(p) + " (" + pct(p) + "). " + (p < 0.05 ? "Below 5%: significant." : "Not below 5%: not significant.");
    }
    heads.addEventListener("input", update);
    sided.addEventListener("change", update);
    byId("pv-flip").addEventListener("click", () => {
      heads.value = String(Array.from({ length: 10 }, () => Math.random() < 0.5 ? 1 : 0).reduce((a, b) => a + b, 0));
      update();
    });
    update();
    reveal(root);
  })();
  (() => {
    const root = byId("pv-shuffle"), chart = byId("pv-shuffle-chart");
    const N = 1e4, BUYERS = 2080, OBS = 80;
    const SE = Math.sqrt(0.104 * 0.896 * 2 / N) * 100;
    let inner = Array(40).fill(0), outer = Array(40).fill(0), total = 0, extreme = 0, last = null;
    const bin = (m) => Math.min(39, Math.max(0, Math.floor((m + 200) / 10)));
    function shuffleOnce() {
      let left = BUYERS, pool = 2 * N, b = 0;
      for (let i = 0; i < N; i++) {
        if (Math.random() * pool < left) {
          b++;
          left--;
        }
        pool--;
      }
      const m = b - (BUYERS - b);
      (Math.abs(m) >= OBS ? outer : inner)[bin(m)]++;
      if (Math.abs(m) >= OBS)
        extreme++;
      total++;
      last = { a: BUYERS - b, b, m };
    }
    function draw() {
      const L = 50, R = 620, T = 30, B = 230, x = (v) => L + (v + 2) / 4 * (R - L), w = (R - L) / 40;
      const bell = byId("pv-sh-bell").checked;
      const expected = (v) => total * 0.1 / (SE * Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * (v / SE) ** 2);
      const top = Math.max(5, ...inner.map((c, i) => c + outer[i]), bell ? expected(0) : 0) * 1.1;
      const y = (c) => B - c / top * (B - T);
      resetChart(chart, "Differences from shuffled labels", total + " shuffles. " + extreme + " were at least 0.8 points from zero (" + (total ? pct(extreme / total) : "0%") + ").");
      for (let i = 0; i < 40; i++) {
        const c1 = inner[i], c2 = outer[i];
        if (!c1 && !c2)
          continue;
        const g = svg("g", { tabindex: 0 });
        const lo = (i * 10 - 200) / 100;
        g.append(svg("title", {}, lo.toFixed(1) + " to " + (lo + 0.1).toFixed(1) + " points: " + (c1 + c2) + " shuffles"));
        if (c2)
          g.append(svg("rect", {
            x: L + i * w + 1,
            y: y(c1 + c2),
            width: w - 2,
            height: B - y(c2),
            fill: "var(--l0)"
          }));
        if (c1)
          g.append(svg("rect", {
            x: L + i * w + 1,
            y: y(c1),
            width: w - 2,
            height: B - y(c1),
            fill: "var(--muted)",
            "fill-opacity": 0.3,
            stroke: "var(--muted)",
            "stroke-width": 0.6
          }));
        chart.append(g);
      }
      if (bell && total) {
        let d = "";
        for (let i = 0; i <= 200; i++) {
          const v = -2 + 4 * i / 200;
          d += (i ? " L" : "M") + x(v).toFixed(1) + "," + y(expected(v)).toFixed(1);
        }
        chart.append(svg("path", { d, fill: "none", stroke: "var(--l3)", "stroke-width": 2.5 }));
      }
      [-0.8, 0.8].forEach((v) => chart.append(svg("line", {
        x1: x(v),
        x2: x(v),
        y1: T - 6,
        y2: B,
        stroke: "var(--fg)",
        "stroke-dasharray": "5 4",
        "stroke-width": 1.5
      })));
      label(chart, x(0.8) + 6, T + 4, "real +0.8", "start", "var(--fg)");
      label(chart, x(-0.8) - 6, T + 4, "mirror \u22120.8", "end", "var(--fg)");
      chart.append(svg("line", { x1: L, x2: R, y1: B, y2: B, stroke: "var(--muted)" }));
      [-2, -1, 0, 1, 2].forEach((v) => label(chart, x(v), B + 22, (v > 0 ? "+" : "") + v));
      label(chart, (L + R) / 2, B + 48, "shuffled B \u2212 A, percentage points");
      const lastText = last ? " Last shuffle: A " + last.a.toLocaleString("en-US") + " buyers, B " + last.b.toLocaleString("en-US") + ", difference " + (last.m >= 0 ? "+" : "") + (last.m / 100).toFixed(2) + " points." : "";
      byId("pv-shuffle-result").textContent = total ? "Shuffles: " + total.toLocaleString("en-US") + ". At least 0.8 points from zero: " + extreme.toLocaleString("en-US") + ", so the simulated p-value is " + pct(extreme / total) + "." + lastText : "No shuffles yet. Start with one, then do a thousand.";
    }
    function run(times) {
      for (let i = 0; i < times && total < 5e4; i++)
        shuffleOnce();
      draw();
    }
    [1, 100, 1e3].forEach((t) => byId("pv-sh-" + t).addEventListener("click", () => run(t)));
    byId("pv-sh-reset").addEventListener("click", () => {
      inner = Array(40).fill(0);
      outer = Array(40).fill(0);
      total = 0;
      extreme = 0;
      last = null;
      draw();
    });
    byId("pv-sh-bell").addEventListener("change", draw);
    draw();
    reveal(root);
  })();
  (() => {
    const root = byId("pv-power"), chart = byId("pv-power-chart");
    const MIN = -4, MAX = 4, L = 50, R = 650, T = 30, B = 220;
    const x = (v) => L + (Math.min(MAX, Math.max(MIN, v)) - MIN) / (MAX - MIN) * (R - L);
    function model(a, lift, n, alpha) {
      const b = a + lift, pooled = (a + b) / 2;
      const se0 = Math.sqrt(2 * pooled * (1 - pooled) / n), se1 = Math.sqrt((a * (1 - a) + b * (1 - b)) / n);
      const cut = normalQuantile(1 - alpha / 2) * se0;
      return {
        se0,
        se1,
        cut,
        power: normalCDF((-cut - lift) / se1) + normalCDF((lift - cut) / se1)
      };
    }
    function update() {
      const a = Number(byId("pv-baseline").value) / 100, lift = Number(byId("pv-lift").value) / 100;
      const n = Number(byId("pv-n").value), alpha = Number(byId("pv-alpha").value);
      const m = model(a, lift, n, alpha);
      byId("pv-baseline-value").textContent = pct(a);
      byId("pv-lift-value").textContent = (lift >= 0 ? "+" : "") + (100 * lift).toFixed(1) + " points";
      byId("pv-n-value").textContent = n.toLocaleString("en-US");
      resetChart(chart, "Where measured lifts land, with and without a real effect", "No-effect curve centred on 0, true-lift curve centred on " + (100 * lift).toFixed(1) + " points. Cut-offs at plus and minus " + (100 * m.cut).toFixed(2) + " points. Power " + pct(m.power) + ".");
      const s0 = 100 * m.se0, s1 = 100 * m.se1, mu = 100 * lift, cut = 100 * m.cut;
      const pdf = (v, mean, s) => Math.exp(-0.5 * ((v - mean) / s) ** 2) / s;
      const top = 1.08 / Math.min(s0, s1), y = (d) => B - d / top * (B - T);
      function shade(from, to) {
        const lo = Math.max(MIN, from), hi = Math.min(MAX, to);
        if (lo >= hi)
          return;
        let d = "M" + x(lo) + "," + B;
        for (let i = 0; i <= 150; i++) {
          const v = lo + (hi - lo) * i / 150;
          d += " L" + x(v).toFixed(1) + "," + y(pdf(v, mu, s1)).toFixed(1);
        }
        chart.append(svg("path", { d: d + " L" + x(hi) + "," + B + " Z", fill: "var(--l3)", opacity: 0.3 }));
      }
      shade(MIN, -cut);
      shade(cut, MAX);
      function curve(mean, s, colour) {
        let d = "";
        for (let i = 0; i <= 400; i++) {
          const v = MIN + (MAX - MIN) * i / 400;
          d += (i ? " L" : "M") + x(v).toFixed(1) + "," + y(pdf(v, mean, s)).toFixed(1);
        }
        chart.append(svg("path", { d, fill: "none", stroke: colour, "stroke-width": 2.5 }));
      }
      chart.append(svg("line", { x1: L, x2: R, y1: B, y2: B, stroke: "var(--muted)" }));
      [-cut, cut].forEach((c) => {
        if (c > MIN && c < MAX)
          chart.append(svg("line", {
            x1: x(c),
            x2: x(c),
            y1: T - 10,
            y2: B,
            stroke: "var(--muted)",
            "stroke-dasharray": "5 4"
          }));
      });
      curve(0, s0, "var(--l0)");
      curve(mu, s1, "var(--l3)");
      label(chart, R, T - 12, "shaded purple = power = " + pct(m.power, 0), "end", "var(--l3)");
      for (let v = MIN; v <= MAX; v++)
        label(chart, x(v), B + 22, (v > 0 ? "+" : "") + v);
      label(chart, (L + R) / 2, B + 48, "measured lift in one experiment, percentage points");
      byId("pv-power-result").textContent = "Power: " + pct(m.power) + ". A result needs to be more than " + cut.toFixed(2) + " points away from zero to count as significant at \u03B1 = " + pct(alpha, 0) + ". Typical wobble (standard error): " + s0.toFixed(2) + " points.";
    }
    ["pv-baseline", "pv-lift", "pv-n"].forEach((id) => byId(id).addEventListener("input", update));
    byId("pv-alpha").addEventListener("change", update);
    update();
    reveal(root);
  })();
})();
