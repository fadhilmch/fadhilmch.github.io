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

  // node_modules/.cache/widgets-build/rm-route.js
  var SLOTS = [
    {
      label: "Writing, primary",
      route: "writing",
      fallback: false,
      model: "new-model",
      effort: "medium",
      deployments: { dev: "chat-dev-2", ci: "test-chat", prod: "chat-prod-eu" }
    },
    {
      label: "Writing, fallback",
      route: "writing",
      fallback: true,
      model: "old-model",
      effort: "low",
      deployments: { dev: "chat-dev-old", ci: "test-chat-old", prod: "chat-prod-eu-old" },
      primary: 0
    },
    {
      label: "Short calls, primary",
      route: "short",
      fallback: false,
      model: "new-model",
      effort: "none",
      deployments: { dev: "chat-dev-2", ci: "test-chat", prod: "chat-prod-eu" }
    }
  ];
  var ENVS = ["dev", "ci", "prod"];
  var ENV_LABELS = ["dev", "CI", "production"];
  var EFFORTS = ["none", "low", "medium", "high"];
  var PER_MODEL = [
    [/new-model/, "prompts_new_model.toml"],
    [/old-model-mini/, "prompts_old_model_mini.toml"]
  ];
  var isReasoning = (name) => /new-model|old-model/.test(name);
  function promptFile(name) {
    if (!isReasoning(name))
      return "prompts_legacy.toml";
    for (const [pattern, path] of PER_MODEL)
      if (pattern.test(name))
        return path;
    return "prompts_reasoning.toml";
  }
  var root = byId("rm-lab");
  if (root) {
    let set = function(id, text, ok) {
      const el = byId(id);
      el.textContent = text;
      const panel = el.closest(".lab-panel");
      panel?.classList.toggle("is-ok", ok === true);
      panel?.classList.toggle("is-bad", ok === false);
    }, draw = function() {
      envButtons.setActive(env);
      slotButtons.setActive(slot);
      keyButtons.setActive(byModel ? 0 : 1);
      const s = SLOTS[slot];
      const deployment = s.deployments[ENVS[env]];
      const key = byModel ? s.model : deployment;
      const choice = effortSelect.value;
      const effort = choice === "configured" ? s.effort : choice;
      set("rm-deployment", `${deployment}  (model: ${s.model})`);
      const own = promptFile(key);
      let promptText = own;
      let promptOk = byModel ? true : void 0;
      if (s.fallback && s.primary !== void 0) {
        const p = SLOTS[s.primary];
        const primaryFile = promptFile(byModel ? p.model : p.deployments[ENVS[env]]);
        promptText = `${own} for this model, but the messages were built from the primary's ${primaryFile}`;
        promptOk = void 0;
      }
      if (effort === "meduim") {
        set("rm-prompt", promptText, promptOk);
        set("rm-request", "nothing sent");
        set("rm-span", "no span");
        set("rm-result", 'The app does not start: the settings reject the unknown effort "meduim". Without that check, every call on this route would get a 400, and a 400 does not fall back.', false);
        return;
      }
      const reasoning = isReasoning(key);
      const request = { model: deployment };
      if (reasoning) {
        if (effort !== "")
          request.reasoning_effort = effort;
        request.max_completion_tokens = 4096;
      } else {
        request.temperature = 0.2;
        request.max_tokens = 1e3;
      }
      set("rm-prompt", promptText, byModel ? promptOk : false);
      set("rm-request", JSON.stringify(request, null, 1).replace(/\n\s*/g, " "));
      set("rm-span", `llm.model_name=${deployment}  llm.route=${s.route}  llm.reasoning_effort=${reasoning ? effort || "not-sent" : "not-sent"}`);
      if (!reasoning && isReasoning(s.model)) {
        set("rm-result", `The deployment name says nothing about the model, so the app guessed the older family: legacy prompt, temperature and max_tokens. The reasoning model rejects them with a 400 "Unsupported parameter". It fails fast, which is why the code guesses this way.`, false);
      } else if (effort === "") {
        set("rm-result", "No effort is sent, so the model's own default applies. That default can change with the next model version. The span records not-sent.");
      } else if (s.fallback) {
        set("rm-result", "The call works. During a fallback the older model reads the newer model's prompt. Test that with the primary switched off.");
      } else {
        set("rm-result", `The call works. The prompt and the parameters follow the model name, so this is the same in every environment. Only the deployment name changes.`, true);
      }
    };
    const effortSelect = byId("rm-effort");
    let env = 2;
    let slot = 0;
    let byModel = true;
    const envButtons = stepButtons(byId("rm-envs"), ENV_LABELS.map((text) => ({ text })), (i) => {
      env = i;
      draw();
    });
    const slotButtons = stepButtons(byId("rm-slots"), SLOTS.map((s) => ({ text: s.label })), (i) => {
      slot = i;
      effortSelect.value = "configured";
      draw();
    });
    const keyButtons = stepButtons(byId("rm-keys"), [{ text: "model name" }, { text: "deployment name" }], (i) => {
      byModel = i === 0;
      draw();
    });
    effortSelect.addEventListener("change", draw);
    effortSelect.replaceChildren(...[
      ["configured", "as configured"],
      ...EFFORTS.map((e) => [e, e]),
      ["", "empty (not sent)"],
      ["meduim", '"meduim" (typo)']
    ].map(([value, text]) => {
      const o = document.createElement("option");
      o.value = value;
      o.textContent = text;
      return o;
    }));
    reveal(root);
    draw();
  }
})();
