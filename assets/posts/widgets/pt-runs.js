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
  function pct(x, digits = 1) {
    return (100 * x).toFixed(digits) + "%";
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
  function onInputs(ids, onChange) {
    ids.forEach((id) => byId(id).addEventListener("input", () => onChange(id)));
  }

  // node_modules/.cache/widgets-build/pt-runs.js
  var JOBS = 10;
  function passChance(p, n, k) {
    let total = 0;
    for (let i = k; i <= n; i++) {
      let c = 1;
      for (let j = 1; j <= i; j++)
        c = c * (n - j + 1) / j;
      total += c * p ** i * (1 - p) ** (n - i);
    }
    return total;
  }
  var root = byId("pt-lab");
  if (root) {
    let read = function() {
      const n = Number(runsInput.value);
      needInput.max = String(n);
      if (Number(needInput.value) > n)
        needInput.value = String(n);
      const k = Number(needInput.value);
      const p = [Number(oldInput.value) / 100, Number(newInput.value) / 100];
      byId("pt-runs-v").textContent = String(n);
      byId("pt-need-v").textContent = String(k);
      byId("pt-old-v").textContent = pct(p[0], 0);
      byId("pt-new-v").textContent = pct(p[1], 0);
      return { n, k, p };
    }, draw = function() {
      const { n, k, p } = read();
      const chance = p.map((x) => passChance(x, n, k));
      resetChart(chart, "Chance that the test passes, for each prompt", `With ${n} runs and ${k} required passes, the old prompt passes the test ${pct(chance[0])} of the time and the new prompt ${pct(chance[1])}.`);
      const names = ["old prompt", "new prompt"];
      const cls = ["fb", "fa"];
      const narrow = chart.getBoundingClientRect().width < 480;
      const X0 = narrow ? 0 : 120;
      const W = narrow ? 290 : 500;
      chance.forEach((c, i) => {
        const y = narrow ? 20 + i * 50 : 14 + i * 40;
        chart.append(svg("text", narrow ? { x: 0, y: y - 6, class: "t" } : { x: 0, y: y + 15, class: "t" }, names[i]));
        chart.append(svg("rect", { x: X0, y, width: W, height: 20, rx: 3, class: "box" }));
        chart.append(svg("rect", { x: X0, y, width: Math.max(1, W * c), height: 20, rx: 3, class: cls[i] }));
        chart.append(svg("text", { x: X0 + W + 8, y: y + 15, class: "t" }, pct(c, 0)));
      });
      chart.append(svg("text", { x: X0, y: narrow ? 124 : 108, class: "m" }, "chance the test passes"));
      const top = narrow ? 156 : 136;
      chart.append(svg("text", { x: 0, y: top - 6, class: "h" }, "SAMPLED CI JOBS"));
      chart.append(svg("circle", { cx: narrow ? 160 : 186, cy: top - 10, r: 5, class: "fa" }));
      chart.append(svg("text", { x: narrow ? 170 : 196, y: top - 6, class: "m" }, "passed"));
      chart.append(svg("circle", { cx: narrow ? 230 : 256, cy: top - 10, r: 4.5, class: "sb" }));
      chart.append(svg("text", { x: narrow ? 240 : 266, y: top - 6, class: "m" }, "failed"));
      [0, 1].forEach((prompt) => {
        const left = narrow ? 0 : prompt === 0 ? 0 : 350;
        const blockTop = narrow ? top + prompt * 220 : top;
        chart.append(svg("text", { x: left, y: blockTop + 12, class: "m" }, names[prompt]));
        for (let job = 0; job < Math.min(shown, JOBS); job++) {
          const runs = samples[prompt][job];
          if (!runs)
            continue;
          const y = blockTop + 30 + job * 18;
          runs.forEach((ok, r) => {
            const cx = left + 8 + r * 14;
            chart.append(svg("circle", ok ? { cx, cy: y, r: 5, class: "fa" } : { cx, cy: y, r: 4.5, class: "sb" }));
          });
          const passes = runs.filter(Boolean).length >= k;
          chart.append(svg("text", { x: left + 8 + 12 * 14 + 8, y: y + 4, class: passes ? "ta" : "tb" }, passes ? "test passes" : "test fails"));
        }
      });
      chart.setAttribute("viewBox", narrow ? "0 0 340 580" : "0 0 680 345");
      if (shown === 0) {
        status.textContent = n === 1 ? `With one run, the old prompt still passes ${pct(chance[0], 0)} of the time, and the new one fails ${pct(1 - chance[1], 0)} of the time. One pass tells you little.` : `With ${n} runs and ${k} required, the gap between the prompts is ${pct(chance[1] - chance[0], 0)}.`;
      } else {
        const passed = [0, 1].map((pr) => samples[pr].slice(0, shown).filter((runs) => runs.filter(Boolean).length >= k).length);
        status.textContent = `Of ${Math.min(shown, JOBS)} sampled jobs, the old prompt passed ${passed[0]} and the new prompt passed ${passed[1]}.`;
      }
    }, sample = function() {
      const { n, p } = read();
      samples = [0, 1].map((pr) => Array.from({ length: JOBS }, () => Array.from({ length: n }, () => Math.random() < p[pr])));
      shown = 0;
      player.stop();
      if (prefersReducedMotion()) {
        shown = JOBS;
        draw();
      } else
        player.start();
    };
    const chart = byId("pt-chart");
    const runsInput = byId("pt-runs");
    const needInput = byId("pt-need");
    const oldInput = byId("pt-old");
    const newInput = byId("pt-new");
    const sampleButton = byId("pt-sample");
    const status = byId("pt-status");
    let samples = [[], []];
    let shown = 0;
    const player = createPlayer(() => {
      shown += 1;
      draw();
      if (shown >= JOBS)
        player.stop();
    }, 220);
    onInputs(["pt-runs", "pt-need", "pt-old", "pt-new"], () => {
      player.stop();
      shown = 0;
      samples = [[], []];
      draw();
    });
    sampleButton.addEventListener("click", sample);
    window.addEventListener("resize", () => draw());
    reveal(root);
    draw();
  }
})();
