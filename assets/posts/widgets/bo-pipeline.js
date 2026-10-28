(() => {
  // node_modules/.cache/widgets-build/kit.js
  function byId(id) {
    return document.getElementById(id);
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

  // node_modules/.cache/widgets-build/bo-pipeline.js
  var OLD = { tag: "app:9d8e7f6", digest: "sha256:4c1e\u2026", how: "v1.3.0" };
  function steps(rebuild) {
    return [
      {
        label: "Merge into development",
        apply(s) {
          s.envs.dev = { tag: "app:a1b2c3d", digest: "sha256:91ab\u2026", how: "built from a1b2c3d" };
          s.log.push("deploy(dev): app:a1b2c3d");
          s.note = "The merge into development builds an image named after its commit, and dev runs it.";
        }
      },
      {
        label: "Promotion PR into main",
        apply(s) {
          s.envs.uat = { tag: "app:e4f5a6b", digest: "sha256:d07f\u2026", how: "built from e4f5a6b" };
          s.log.push("deploy(uat): app:e4f5a6b");
          s.note = "The PR into main creates a merge commit with a new SHA. The code is the same, but the name is not, so UAT gets a second build.";
        }
      },
      {
        label: "Tag v1.4.0 and approve",
        apply(s) {
          if (rebuild) {
            s.envs.prod = {
              tag: "app:e4f5a6b",
              digest: "sha256:5e2a\u2026",
              how: "v1.4.0, built again"
            };
            s.bad = "prod";
            s.note = "Same commit, same tag, different digest: the rebuild picked up a newer system package. Production now runs bytes that UAT never ran.";
          } else {
            s.envs.prod = {
              tag: "app:e4f5a6b",
              digest: "sha256:d07f\u2026",
              how: "v1.4.0, copied from UAT"
            };
            s.note = "A person approves, and the production deploy copies the UAT image. Nothing is built, so production runs the same digest the testers saw.";
          }
          s.log.push("deploy(prod): app:e4f5a6b v1.4.0");
        }
      },
      {
        label: "Roll back",
        apply(s) {
          s.envs.prod = { ...OLD, how: "v1.3.0, after the revert" };
          s.bad = void 0;
          s.log.push('Revert "deploy(prod): app:e4f5a6b v1.4.0"');
          s.note = "A git revert of the deploy commit puts the old image pin and its config back. Argo CD syncs the cluster to it. The log keeps both the bad release and the revert.";
        }
      }
    ];
  }
  var root = byId("bo-lab");
  if (root) {
    let fresh = function() {
      return {
        envs: { dev: { ...OLD }, uat: { ...OLD }, prod: { ...OLD } },
        log: ["deploy(prod): app:9d8e7f6 v1.3.0"],
        note: "All three environments run v1.3.0. Step through one change."
      };
    }, draw = function(changed) {
      ["dev", "uat", "prod"].forEach((env) => {
        const img = state.envs[env];
        byId(`bo-${env}-tag`).textContent = img.tag;
        byId(`bo-${env}-digest`).textContent = img.digest;
        byId(`bo-${env}-how`).textContent = img.how;
        const panel = byId(`bo-${env}`);
        panel.classList.toggle("is-bad", state.bad === env);
        if (env === changed) {
          panel.classList.remove("lab-changed");
          void panel.offsetWidth;
          panel.classList.add("lab-changed");
        }
      });
      byId("bo-log").replaceChildren(...state.log.map((line) => {
        const li = document.createElement("li");
        li.textContent = line;
        return li;
      }));
      byId("bo-status").textContent = state.note;
      const all = steps(rebuildBox.checked);
      stepButton.textContent = done < all.length ? "Next: " + all[done].label : "Done";
      stepButton.disabled = done >= all.length;
    }, next = function() {
      const all = steps(rebuildBox.checked);
      if (done >= all.length) {
        player.stop();
        syncPlay();
        return;
      }
      const before = JSON.stringify(state.envs);
      all[done].apply(state);
      done += 1;
      const changed = ["dev", "uat", "prod"].find((e) => JSON.stringify(JSON.parse(before)[e]) !== JSON.stringify(state.envs[e]));
      draw(changed);
    }, reset = function() {
      done = 0;
      state = fresh();
      draw();
    }, syncPlay = function() {
      playButton.textContent = player.running ? "Pause" : "Play";
      playButton.setAttribute("aria-pressed", String(player.running));
    };
    const rebuildBox = byId("bo-rebuild");
    const playButton = byId("bo-play");
    const stepButton = byId("bo-step");
    let done = 0;
    let state;
    const player = createPlayer(next, 2200);
    playButton.addEventListener("click", () => {
      if (player.running)
        player.stop();
      else {
        if (done >= steps(false).length)
          reset();
        next();
        player.start();
      }
      syncPlay();
    });
    stepButton.addEventListener("click", next);
    byId("bo-reset").addEventListener("click", () => {
      player.stop();
      syncPlay();
      reset();
    });
    rebuildBox.addEventListener("change", () => {
      player.stop();
      syncPlay();
      reset();
    });
    stopOnHidden(player, syncPlay);
    reveal(root);
    reset();
    syncPlay();
  }
})();
