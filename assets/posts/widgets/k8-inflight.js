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
  function onInputs(ids, onChange) {
    ids.forEach((id) => byId(id).addEventListener("input", () => onChange(id)));
  }

  // node_modules/.cache/widgets-build/k8-inflight.js
  var PODS = 2;
  var CPU_PER_ANSWER = 0.6;
  var CPU_TARGET = 0.7;
  var INFLIGHT_TARGET = 8;
  var POD_COMFORT = 12;
  var root = byId("k8-lab");
  if (root) {
    let draw = function() {
      const perMin = Number(rateInput.value);
      const latency = Number(latInput.value);
      byId("k8-rate-v").textContent = perMin + " per minute";
      byId("k8-lat-v").textContent = latency + " s";
      const inflight = perMin / 60 * latency;
      const perPod = inflight / PODS;
      const cpu = perMin / 60 * CPU_PER_ANSWER / PODS;
      const cpuWants = Math.max(PODS, Math.ceil(PODS * cpu / CPU_TARGET));
      const inflightWants = Math.max(PODS, Math.ceil(inflight / INFLIGHT_TARGET));
      resetChart(chart, "Open requests per pod, CPU per pod, and what each autoscaler wants", `${perMin} questions per minute at ${latency} seconds each keep ${inflight.toFixed(1)} requests open, ${perPod.toFixed(1)} per pod. CPU per pod is ${Math.round(cpu * 100)} percent. A CPU autoscaler wants ${cpuWants} pods; an in-flight autoscaler wants ${inflightWants}.`);
      const narrow = chart.getBoundingClientRect().width < 480;
      chart.setAttribute("viewBox", narrow ? "0 0 340 340" : "0 0 680 232");
      for (let p = 0; p < PODS; p++) {
        const x0 = narrow ? 10 : 10 + p * 340;
        const y0 = narrow ? 10 + p * 112 : 10;
        const busy = perPod > POD_COMFORT;
        chart.append(svg("rect", {
          x: x0,
          y: y0,
          width: 320,
          height: narrow ? 102 : 120,
          rx: 6,
          class: "box",
          style: busy ? "stroke:var(--fig-b)" : ""
        }));
        chart.append(svg("text", { x: x0 + 12, y: y0 + 20, class: "t" }, `pod ${p + 1}`));
        chart.append(svg("text", { x: x0 + 308, y: y0 + 20, class: busy ? "tb" : "m", "text-anchor": "end" }, busy ? "event loop busy, probes at risk" : `${perPod.toFixed(1)} open requests`));
        const dots = Math.round(perPod);
        const shownDots = Math.min(dots, 60);
        for (let d = 0; d < shownDots; d++) {
          const cx = x0 + 20 + d % 20 * 15;
          const cy = y0 + 42 + Math.floor(d / 20) * 20;
          chart.append(svg("circle", { cx, cy, r: 5, class: d < POD_COMFORT ? "fa" : "fb" }));
        }
        if (dots > shownDots) {
          chart.append(svg("text", { x: x0 + 20, y: y0 + (narrow ? 96 : 110), class: "m" }, `+${dots - shownDots} more`));
        }
      }
      const meters = [
        ["CPU per pod", cpu, CPU_TARGET, `${Math.round(cpu * 100)}% (target 70%)`],
        [
          "open requests per pod",
          perPod / (INFLIGHT_TARGET / CPU_TARGET),
          CPU_TARGET,
          `${perPod.toFixed(1)} (target ${INFLIGHT_TARGET})`
        ]
      ];
      meters.forEach(([label, value, target2, text], i) => {
        const y = narrow ? 260 + i * 50 : 158 + i * 44;
        const X0 = narrow ? 10 : 190;
        const W = narrow ? 200 : 330;
        chart.append(svg("text", narrow ? { x: 10, y: y - 6, class: "t" } : { x: 10, y: y + 14, class: "t" }, label));
        chart.append(svg("rect", { x: X0, y, width: W, height: 18, rx: 3, class: "box" }));
        chart.append(svg("rect", {
          x: X0,
          y,
          width: Math.max(1, Math.min(1, value) * W),
          height: 18,
          rx: 3,
          class: value > target2 ? "fb" : "fa"
        }));
        chart.append(svg("line", {
          x1: X0 + target2 * W,
          x2: X0 + target2 * W,
          y1: y - 4,
          y2: y + 22,
          class: "ln"
        }));
        chart.append(svg("text", { x: X0 + W + 8, y: y + 14, class: "m" }, text));
      });
      byId("k8-inflight").textContent = `${(perMin / 60).toFixed(2)}/s \xD7 ${latency} s = ${inflight.toFixed(1)}`;
      byId("k8-cpu-wants").textContent = `${cpuWants} pods`;
      byId("k8-if-wants").textContent = `${inflightWants} pods`;
      status.textContent = cpuWants < inflightWants ? `The pods hold ${perPod.toFixed(1)} open requests each, but they use little CPU, so a CPU autoscaler stays at ${cpuWants} pods. Scaling on open requests would add ${inflightWants - cpuWants}.` : "Both signals agree here. Now slow the model down and keep the traffic the same.";
    }, syncPlay = function() {
      playButton.textContent = player.running ? "Pause" : "Play: the model slows down";
      playButton.setAttribute("aria-pressed", String(player.running));
    };
    const chart = byId("k8-chart");
    const rateInput = byId("k8-rate");
    const latInput = byId("k8-lat");
    const playButton = byId("k8-play");
    const status = byId("k8-status");
    let target = 0;
    const player = createPlayer(() => {
      const v = Number(latInput.value);
      if (v >= target) {
        player.stop();
        syncPlay();
        return;
      }
      latInput.value = String(v + 2);
      draw();
    }, 120);
    playButton.addEventListener("click", () => {
      if (player.running)
        player.stop();
      else {
        rateInput.value = "30";
        latInput.value = "15";
        target = 80;
        if (prefersReducedMotion())
          latInput.value = String(target);
        draw();
        player.start();
      }
      syncPlay();
    });
    onInputs(["k8-rate", "k8-lat"], () => {
      player.stop();
      syncPlay();
      draw();
    });
    stopOnHidden(player, syncPlay);
    window.addEventListener("resize", () => draw());
    reveal(root);
    draw();
    syncPlay();
  }
})();
