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

  // node_modules/.cache/widgets-build/ci-lab-explorer.js
  var P = document.querySelector("#lab-explorer-img");
  if (P) {
    const base = P.src.replace(/lab-[A-Za-z]+\.png.*$/, "");
    const notes = {
      "lab-L.png": "L* alone is a complete grayscale photo. This is the model's input.",
      "lab-La.png": "Adding a* only: faint pink on the rock, faint green in the shadows. The sky stays grey.",
      "lab-Lb.png": "Adding b* only: the sky turns blue and the rock and plants turn yellow-brown. Most of the scene's colour is here.",
      "lab-Lab.png": "All three channels: the original photo. The model must predict the last two."
    };
    document.querySelectorAll("#lab-explorer button").forEach((b) => {
      b.addEventListener("click", () => {
        document.querySelectorAll("#lab-explorer button").forEach((x) => x.setAttribute("aria-pressed", "false"));
        b.setAttribute("aria-pressed", "true");
        const s = b.getAttribute("data-src");
        P.src = base + s;
        byId("lab-explorer-note").textContent = notes[s];
      });
    });
  }
  var r = byId("cmp-range");
  if (r) {
    let size = function() {
      top.firstElementChild.style.width = box.clientWidth + "px";
    }, set = function() {
      top.style.width = r.value + "%";
      h.style.left = r.value + "%";
    };
    const top = byId("cmp-top"), h = byId("cmp-handle"), box = top.parentElement;
    r.addEventListener("input", set);
    window.addEventListener("resize", size);
    size();
    set();
    setTimeout(size, 300);
    const im = top.firstElementChild;
    im.addEventListener("load", size);
  }
  var netSvg = document.querySelector("#net-svg");
  if (netSvg) {
    let show = function(i) {
      blocks.forEach((b) => {
        const on = b.step === i;
        b.f.setAttribute("class", "blk" + (on ? " on" : ""));
        if (b.t)
          b.t.setAttribute("class", on ? "on-top" : "top");
        if (b.l)
          b.l.setAttribute("visibility", on ? "visible" : "hidden");
      });
      tx.innerHTML = "";
      const s = document.createElement("strong");
      s.textContent = S[i].t;
      const p = document.createElement("span");
      p.textContent = S[i].d;
      tx.appendChild(s);
      tx.appendChild(p);
      ti.innerHTML = "";
      (S[i].im || []).forEach((n) => {
        const im = document.createElement("img");
        im.src = base2 + n;
        im.alt = n.indexOf("gray") > -1 ? "Grayscale input" : n.indexOf("pred") > -1 ? "Predicted colour" : "Ground truth";
        ti.appendChild(im);
      });
      steps.setActive(i);
    };
    const S = [
      {
        t: "1. Input",
        d: "The grayscale image, L* only, one channel. The notebook scales it as L*/50 - 1. Nothing about colour has entered the network yet.",
        im: ["ex1-gray.png"]
      },
      {
        t: "2. Encoder: down to 128 \xD7 128",
        d: "A 3 \xD7 3 convolution with stride 2 halves height and width and gives 64 channels. A second convolution widens it to 128 channels. Each position now describes a small neighbourhood, not a single pixel."
      },
      {
        t: "3. Encoder: down to 64 \xD7 64",
        d: "Another stride-2 convolution halves the grid again. Channels go to 128, then 256. Edges and textures start to combine into larger local patterns."
      },
      {
        t: "4. Encoder: down to 32 \xD7 32",
        d: "A third stride-2 convolution leaves a 32 \xD7 32 grid. Two 512-channel convolutions and one back to 256 give the encoder output, 32 \xD7 32 \xD7 256. This is the local-detail path."
      },
      {
        t: "5. Context vector",
        d: "In parallel, the grayscale image is resized to 299 \xD7 299, repeated across three channels and passed through pretrained Inception-ResNet-v2. The notebook keeps its 1,000 class outputs. This is one vector for the whole image, not a grid."
      },
      {
        t: "6. Fusion",
        d: "The 1,000-value vector is repeated at all 32 \xD7 32 positions, concatenated with the encoder output (256 + 1,000 = 1,256 channels), then a 1 \xD7 1 convolution mixes them back to 256 channels."
      },
      {
        t: "7. Decoder: back up",
        d: "A 128-channel convolution, then 2 \xD7 upsampling to 64 \xD7 64 with 64 channels, upsampling again to 128 \xD7 128 with 32 and 16 channels. Convolutions refine, upsampling restores the grid size."
      },
      {
        t: "8. Output: a* and b*",
        d: "A last convolution with tanh gives 2 channels at 128 \xD7 128, upsampled to 256 \xD7 256 \xD7 2. Multiply by 128 to get predicted a* and b*, then stack them under the original L*.",
        im: ["ex1-pred.png", "ex1-truth.png"]
      }
    ];
    const B = [
      [0, 256, 1, "256\xB2\xD71"],
      [1, 128, 64, "128\xB2\xD764"],
      [1, 128, 128, "128\xB2\xD7128"],
      [2, 64, 128, "64\xB2\xD7128"],
      [2, 64, 256, "64\xB2\xD7256"],
      [3, 32, 256, "32\xB2\xD7256"],
      [3, 32, 512, "32\xB2\xD7512"],
      [3, 32, 256, "32\xB2\xD7256"],
      [5, 32, 1256, "32\xB2\xD71256"],
      [5, 32, 256, "32\xB2\xD7256"],
      [6, 32, 128, "32\xB2\xD7128"],
      [6, 64, 64, "64\xB2\xD764"],
      [6, 128, 32, "128\xB2\xD732"],
      [7, 128, 2, "128\xB2\xD72"],
      [7, 256, 2, "256\xB2\xD72"]
    ];
    const H = (s) => 14 + Math.sqrt(s) * 6, Wd = (c) => 6 + Math.sqrt(c) * 1.3;
    let tot = 0;
    B.forEach((b) => {
      tot += Wd(b[2]);
    });
    const gap = (684 - tot) / (B.length - 1);
    let x = 8, fx = 0;
    const blocks = [];
    B.forEach((b, i) => {
      const h = H(b[1]), w = Wd(b[2]), y = 160 - h / 2;
      const g = svg("g", {});
      const tp = svg("polygon", {
        points: x + "," + y + " " + (x + 6) + "," + (y - 6) + " " + (x + w + 6) + "," + (y - 6) + " " + (x + w) + "," + y,
        class: "top"
      });
      const f = svg("rect", { x, y, width: w, height: h, class: "blk" });
      g.appendChild(tp);
      g.appendChild(f);
      netSvg.appendChild(g);
      const late = x > 600;
      const lab = svg("text", {
        x: late ? 694 : x + w / 2,
        y: i % 2 ? 236 : 214,
        "text-anchor": late ? "end" : "middle",
        visibility: "hidden"
      });
      lab.textContent = b[3];
      netSvg.appendChild(lab);
      if (i === 8)
        fx = x + w / 2;
      blocks.push({ step: b[0], f, t: tp, l: lab });
      x += w + gap;
    });
    const ctx = svg("rect", { x: fx - 20, y: 26, width: 40, height: 12, class: "blk" });
    const ctxT = svg("text", { x: 8, y: 16, "text-anchor": "start" });
    ctxT.textContent = "context vector from Inception-ResNet-v2";
    netSvg.appendChild(ctx);
    netSvg.appendChild(ctxT);
    const ln = svg("path", {
      d: "M" + fx + " 38V" + (160 - H(32) / 2 - 8),
      fill: "none",
      stroke: "var(--muted)",
      "stroke-width": 1.2,
      "stroke-dasharray": "3 3"
    });
    netSvg.insertBefore(ln, netSvg.firstChild);
    blocks.push({ step: 4, f: ctx, t: null, l: null });
    const bw = byId("net-buttons"), tx = byId("net-text"), ti = byId("net-images");
    const base2 = document.querySelector("#lab-explorer-img") ? document.querySelector("#lab-explorer-img").src.replace(/lab-[A-Za-z]+\.png.*$/, "") : "";
    const steps = stepButtons(bw, S.map((s, i) => ({ text: String(i + 1), ariaLabel: s.t })), (i) => show(i));
    show(0);
  }
})();
