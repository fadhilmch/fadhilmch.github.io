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

  // node_modules/.cache/widgets-build/sa-store.js
  var MAX_TURNS = 6;
  var SCRIPT_DOWN = /* @__PURE__ */ new Set([3]);
  var root = byId("sa-lab");
  if (root) {
    let podFor = function(n) {
      return n % 2 === 1 ? "A" : "B";
    }, chips = function(list, turns, empty) {
      if (!turns) {
        const li = document.createElement("li");
        li.className = "is-arrow";
        li.textContent = empty;
        list.replaceChildren(li);
        return;
      }
      list.replaceChildren(...turns.map((n) => {
        const li = document.createElement("li");
        li.textContent = "turn " + n;
        return li;
      }));
    }, flash = function(id) {
      const el = byId(id);
      el.classList.remove("lab-changed");
      void el.offsetWidth;
      el.classList.add("lab-changed");
    }, draw = function() {
      chips(byId("sa-redis-turns"), redis.length ? redis : null, "empty");
      chips(byId("sa-a-turns"), cache.A, "no copy");
      chips(byId("sa-b-turns"), cache.B, "no copy");
      byId("sa-turn").textContent = String(turn);
      const kept = /* @__PURE__ */ new Set([...redis, ...cache.A ?? [], ...cache.B ?? []]);
      const gone = Array.from({ length: turn }, (_, i) => i + 1).filter((n) => !kept.has(n));
      byId("sa-lost").textContent = gone.length ? gone.map((n) => "turn " + n).join(", ") : "none";
      nextButton.disabled = turn >= MAX_TURNS;
    }, step = function(readUp = redisBox.checked, writeUp = redisBox.checked) {
      if (turn >= MAX_TURNS)
        return;
      turn += 1;
      const pod = podFor(turn);
      const useCache = cacheBox.checked;
      let history;
      let source;
      if (useCache && cache[pod]) {
        history = cache[pod];
        source = `pod ${pod} memory`;
      } else if (readUp) {
        history = redis;
        source = "Redis";
      } else {
        history = [];
        source = "nothing (Redis is down)";
      }
      const said = Array.from({ length: turn - 1 }, (_, i) => i + 1);
      const missing = said.filter((n) => !history.includes(n));
      const next = [...history, turn];
      let saved;
      if (writeUp) {
        const overwritten = redis.filter((n) => !next.includes(n));
        redis = next;
        cache[pod] = null;
        saved = overwritten.length ? `saved to Redis and overwrote ${overwritten.map((n) => "turn " + n).join(", ")}` : "saved to Redis";
        flash("sa-redis-panel");
      } else if (useCache) {
        cache[pod] = next;
        saved = `the Redis write failed, so it was kept in pod ${pod} memory`;
        flash(pod === "A" ? "sa-a-panel" : "sa-b-panel");
      } else {
        saved = "the Redis write failed and there is no fallback, so nothing was saved";
      }
      const li = document.createElement("li");
      li.textContent = `Turn ${turn} on pod ${pod}: read ${source}` + (missing.length ? `, missing ${missing.map((n) => "turn " + n).join(", ")}` : "") + `; ${saved}.`;
      log.append(li);
      status.textContent = li.textContent;
      draw();
    }, reset = function() {
      turn = 0;
      redis = [];
      cache = { A: null, B: null };
      log.replaceChildren();
      redisBox.checked = true;
      status.textContent = "Each turn goes to the other pod. Turn Redis off before a turn to simulate an outage.";
      draw();
    }, tick = function() {
      if (turn >= 5) {
        player.stop();
        syncPlay();
        return;
      }
      const failing = SCRIPT_DOWN.has(turn + 1);
      step(true, !failing);
      redisBox.checked = true;
    }, syncPlay = function() {
      playButton.textContent = player.running ? "Pause" : "Play the outage";
      playButton.setAttribute("aria-pressed", String(player.running));
    };
    const redisBox = byId("sa-redis");
    const cacheBox = byId("sa-cache");
    const playButton = byId("sa-play");
    const nextButton = byId("sa-next");
    const log = byId("sa-log");
    const status = byId("sa-status");
    let turn = 0;
    let redis = [];
    let cache = { A: null, B: null };
    const player = createPlayer(tick, 1400);
    playButton.addEventListener("click", () => {
      if (player.running)
        player.stop();
      else {
        reset();
        cacheBox.checked = true;
        player.start();
      }
      syncPlay();
    });
    nextButton.addEventListener("click", () => step());
    byId("sa-reset").addEventListener("click", () => {
      player.stop();
      syncPlay();
      reset();
    });
    stopOnHidden(player, syncPlay);
    reveal(root);
    reset();
    if (prefersReducedMotion()) {
      cacheBox.checked = true;
      for (let i = 0; i < 5; i++)
        tick();
    }
    syncPlay();
  }
})();
