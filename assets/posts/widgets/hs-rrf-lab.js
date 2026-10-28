(() => {
  // node_modules/.cache/widgets-build/kit.js
  function byId(id) {
    return document.getElementById(id);
  }
  function reveal(el) {
    el.hidden = false;
  }

  // node_modules/.cache/widgets-build/hs-rrf-lab.js
  var CHUNKS = [
    { id: "A", label: "Error 809: VPN blocked", answer: true },
    { id: "B", label: "VPN setup guide" },
    { id: "C", label: "Error codes, full list" },
    { id: "D", label: "Proxy error 806" },
    { id: "E", label: "Home network tips" },
    { id: "F", label: "Laptop setup checklist" }
  ];
  var KEYWORD = ["A", "C", "D", "B", "F"];
  var VECTOR = ["B", "E", "A", "D", "F"];
  var DEFAULT_K = 60;
  var widget = byId("hs-lab");
  var kInput = byId("hs-k");
  var kOut = byId("hs-k-out");
  var useKw = byId("hs-use-kw");
  var useVec = byId("hs-use-vec");
  var resetButton = byId("hs-reset");
  var kwList = byId("hs-kw");
  var vecList = byId("hs-vec");
  var fusedList = byId("hs-fused");
  var status = byId("hs-status");
  var byChunkId = new Map(CHUNKS.map((c) => [c.id, c]));
  function item(chunk, extra) {
    const li = document.createElement("li");
    const name = document.createElement("span");
    name.className = "hs-name";
    name.textContent = chunk.label;
    li.append(name);
    if (chunk.answer) {
      li.classList.add("hs-answer");
      const tag = document.createElement("span");
      tag.className = "hs-tag";
      tag.textContent = "answer";
      li.append(" ", tag);
    }
    if (extra)
      li.append(extra);
    return li;
  }
  function fill(list, ids, on) {
    list.replaceChildren(...ids.map((id) => item(byChunkId.get(id))));
    list.classList.toggle("hs-off", !on);
  }
  function fuse(k) {
    const rows = CHUNKS.map((chunk) => {
      const kwRank = KEYWORD.indexOf(chunk.id) + 1;
      const vecRank = VECTOR.indexOf(chunk.id) + 1;
      const kw = useKw.checked && kwRank > 0 ? 1 / (k + kwRank) : 0;
      const vec = useVec.checked && vecRank > 0 ? 1 / (k + vecRank) : 0;
      return { chunk, kw, vec, total: kw + vec };
    });
    return rows.filter((r) => r.total > 0).sort((a, b) => b.total - a.total);
  }
  function bar(row, max) {
    const wrap = document.createElement("span");
    wrap.className = "hs-bar-row";
    const barEl = document.createElement("span");
    barEl.className = "hs-bar";
    barEl.setAttribute("aria-hidden", "true");
    const a = document.createElement("span");
    a.className = "hs-seg-a";
    a.style.width = (100 * row.kw / max).toFixed(1) + "%";
    const b = document.createElement("span");
    b.className = "hs-seg-b";
    b.style.width = (100 * row.vec / max).toFixed(1) + "%";
    barEl.append(a, b);
    const score = document.createElement("span");
    score.className = "hs-score";
    score.textContent = row.total.toFixed(4);
    wrap.append(barEl, score);
    return wrap;
  }
  function ordinal(n) {
    return n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : n + "th";
  }
  function draw() {
    const k = Number(kInput.value);
    kOut.value = String(k);
    kOut.textContent = String(k);
    fill(kwList, KEYWORD, useKw.checked);
    fill(vecList, VECTOR, useVec.checked);
    const rows = fuse(k);
    const max = 2 / (k + 1);
    fusedList.replaceChildren(...rows.map((r) => item(r.chunk, bar(r, max))));
    if (rows.length === 0) {
      status.textContent = "Both lists are off, so there is nothing to fuse.";
      return;
    }
    const answerPos = rows.findIndex((r) => r.chunk.answer) + 1;
    let text = `k = ${k}. The answer chunk is ${ordinal(answerPos)} of ${rows.length}.`;
    if (useKw.checked && useVec.checked) {
      const scoreF = rows.find((r) => r.chunk.id === "F").total;
      const scoreC = rows.find((r) => r.chunk.id === "C").total;
      if (Math.abs(scoreF - scoreC) < 1e-12) {
        text += " Laptop setup checklist (5th in both lists) and Error codes, full list (2nd in one list) tie.";
      } else if (scoreF > scoreC) {
        text += " A chunk that is 5th in both lists (Laptop setup checklist) beats one that is 2nd in only one list (Error codes, full list).";
      } else {
        text += " The chunk that is 2nd in one list (Error codes, full list) now beats the one that is 5th in both (Laptop setup checklist).";
      }
    } else {
      text += " With one list, fusion only repeats that list's order.";
    }
    status.textContent = text;
  }
  kInput.addEventListener("input", draw);
  useKw.addEventListener("change", draw);
  useVec.addEventListener("change", draw);
  resetButton.addEventListener("click", () => {
    kInput.value = String(DEFAULT_K);
    useKw.checked = true;
    useVec.checked = true;
    draw();
  });
  reveal(widget);
  draw();
})();
