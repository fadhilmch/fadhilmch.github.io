# fadhilmch.github.io — Implementation Plan

**Audience:** junior engineer executing this end to end.
**Design source:** `Portfolio F Workflow v2.dc.html` (Turn 5, direction "5a") from the *Portfolio Website Design Request* folder.
**Owner:** Fadhil Mochammad.
**Estimate:** 8–10 working days.

Read sections 0–3 fully before writing any code. Sections 4–11 are the phases; do them in order.

---

## 0. What we are building and why

A Jekyll site on GitHub Pages with three surfaces:

| Surface | URL | What it is |
|---|---|---|
| **About** | `/` | A node pipeline. `@ Fadhil → ∑ Education → ≡ Experience → {4 toolkits} → ▣ Work → → Say hello`. Click a node, an inspector below shows human-readable rows on the left and a syntax-highlighted `<node>.json` on the right. A "Run workflow" button animates the pipeline left to right. |
| **Posts** | `/posts/` | Long-form dated essays. Two views: **Branches** (a git-graph with one coloured lane per topic) and **Timeline** (a plain reverse-chronological list). Filterable by lane. |
| **Notes** | `/notes/` | A linked vault. Three panes: an **explorer** (grouped, searchable), a **reading pane** (the note plus its outgoing links and backlinks), and a **force-directed graph** widget. |

Plus a light/dark toggle, an `F`-with-modulation-wave logo, and Geist / Geist Mono type.

### The one rule that matters

> **Fadhil must be able to change every piece of content, and add new nodes, new toolkits, new posts and new notes, by editing YAML or Markdown only. Never HTML, CSS or JS.**

Everything in this plan exists to serve that rule. If you find yourself typing a person's name, a job title, a year, a metric or a node coordinate into a `.html`, `.css` or `.js` file, you have made a mistake — stop and move it into `_data/`.

### Decisions already made (do not relitigate)

1. **Direction:** F · Workflow v2. Not Terminal, not Trace, not Pipeline, not Agent.
2. **Posts and Notes are two separate Jekyll collections with different front-matter shapes.** Posts are dated essays. Notes are small, undated, linked.
3. **Start clean.** Everything currently in the repo is either the 2016 site or an abandoned different design. Delete it (step 4.1) — do not try to retheme it.

### Where the source material lives

```
~/Downloads/Portfolio Website Design Request/
├── Portfolio F Workflow v2.dc.html   ← the design to build. Read its inline styles.
├── fm-data-real.js                   ← all real content, as JS. Port this to _data/*.yml.
├── fm-graph.js                       ← the notes force-graph web component. Reuse almost as-is.
├── shots/01-v2.jpg, 01-v2b.jpg       ← About, top and node canvas
├── shots/02-v2.jpg                   ← Posts, branches view
├── shots/03-v2.jpg                   ← Notes, three panes
├── shots/01-logos.jpg, 02-logos.jpg  ← logo lockups and app-icon sizes
└── uploads/resume-source.md          ← canonical career record. The authority for all facts.
```

`fm-data-real.js` is a condensed copy of `resume-source.md`. **When the two disagree, `resume-source.md` wins.** It also carries rules Fadhil set (e.g. don't name the seven markets publicly, don't claim golden-dataset metrics) — honour them.

---

## 1. Prerequisites

```bash
# macOS. Check first — do not blindly install.
ruby -v            # need 3.1+
bundle -v
git --version
```

If Ruby is the system one (`/usr/bin/ruby`), install a real one first:

```bash
brew install chruby ruby-install
ruby-install ruby 3.3.5
# then add chruby to your shell profile per its README
```

You do **not** need Node for the site to work. Everything ships as hand-written CSS and vanilla JS. Do not add a bundler, React, Tailwind or npm. If you think you need one, you are solving the wrong problem.

---

## 2. Target repository structure

```
fadhilmch.github.io/
├── _config.yml
├── Gemfile
├── .gitignore
├── .github/workflows/pages.yml        # CI build + deploy
│
├── _data/                             # ◀ ALL CONTENT THAT ISN'T PROSE
│   ├── profile.yml
│   ├── stats.yml
│   ├── education.yml
│   ├── experience.yml
│   ├── skills.yml
│   ├── projects.yml
│   ├── publications.yml
│   ├── contact.yml
│   ├── lanes.yml
│   └── workflow.yml                   # ◀ THE NODE GRAPH. Add nodes here.
│
├── _posts/                            # long-form essays
│   └── 2026-09-10-evaluating-an-agent-honestly.md
│
├── _notes/                            # the vault
│   ├── index.md
│   ├── agents.md
│   └── …
│
├── _layouts/
│   ├── base.html                      # <html>, head, header, footer
│   ├── page.html
│   ├── post.html
│   └── note.html
│
├── _includes/
│   ├── head.html
│   ├── header.html
│   ├── footer.html
│   ├── logo.svg
│   ├── theme-toggle.html
│   ├── workflow/canvas.html           # node canvas: SVG edges + node buttons
│   ├── workflow/node.html
│   ├── workflow/inspector.html        # one per node, pre-rendered, hidden
│   ├── workflow/rows.html             # resolves a node's `source` → rows
│   ├── workflow/json.html             # renders + colours a node's JSON output
│   ├── posts/branches.html
│   ├── posts/timeline.html
│   ├── notes/explorer.html
│   ├── notes/reader.html
│   └── notes/backlinks.html
│
├── assets/                            # ◀ lowercase. See the gotcha in 4.1.
│   ├── css/
│   │   ├── tokens.css
│   │   ├── base.css
│   │   ├── workflow.css
│   │   ├── posts.css
│   │   └── notes.css
│   ├── js/
│   │   ├── theme.js
│   │   ├── workflow.js
│   │   ├── posts.js
│   │   ├── notes.js
│   │   └── fm-graph.js                # ported from the design folder
│   ├── img/
│   └── favicon.svg
│
├── index.html                         # About
├── posts.html                         # /posts/
├── notes.html                         # /notes/
├── notes-graph.json                   # generated by Jekyll from _notes/
│
├── docs/
│   ├── IMPLEMENTATION_PLAN.md         # this file
│   └── EDITING.md                     # ◀ written in Phase 7, for Fadhil
│
└── _archive/design-reference/         # the mockups, excluded from the build
```

---

## 3. The data model — the editability contract

This is the most important section. Get the schemas right and the rest is mechanical.

### 3.1 `_data/profile.yml`

```yaml
name: Fadhil Mochammad
role: Machine Learning Engineer
location: Stockholm, Sweden
headline: Engineer at heart. I build ML platforms and agents that hold up in production.
bio: >-
  I'm a machine learning engineer in Stockholm. I work on ML platforms,
  experimentation and, lately, AI agents. I studied electrical engineering in
  Bandung and machine learning at KTH. Outside work I take photos, design
  things and make music.
now: >-
  Multi-agent AI: how agents coordinate, how to evaluate them honestly, and
  how to run them reliably once the demo is over.
off_hours: Photography · digital design · music
```

### 3.2 `_data/stats.yml` — the tiles under the headline

Any number of entries. The grid reflows; do not hardcode four.

```yaml
- value: "6,000"
  label: monthly employees on the agentic assistant I help run
- value: "800+"
  label: experiments a year on the platform I led at Traveloka
- value: "−95%"
  label: cloud cost, year over year, after the modernization
- value: "50k+"
  label: requests per second, load-tested at P95 under 100 ms
```

Quote every value — `−95%` and `6,000` must not be parsed as numbers.

### 3.3 `_data/education.yml`

```yaml
- years: 2018 — 2020
  role: M.Sc. Machine Learning
  org: KTH Royal Institute of Technology
  note: Thesis — sales forecasting with GAM and LASSO on leading macroeconomic indicators.
- years: 2012 — 2016
  role: B.Sc. Electrical Engineering
  org: Institut Teknologi Bandung
  note: Thesis — hazardous chemical gas monitoring on a UAV.
```

### 3.4 `_data/experience.yml`

Newest first. Port all eight roles from `fm-data-real.js`, checking each against `resume-source.md`.

```yaml
- years: Sep 2025 — Now
  role: Machine Learning Engineer
  org: Electrolux Group
  place: Stockholm
  note: >-
    Agentic internal knowledge assistant — evaluation architecture, retrieval
    flow, feedback-triage agent. MLOps for a supply-chain optimization system.
```

### 3.5 `_data/skills.yml` — **each group becomes a node**

```yaml
- key: llms
  group: LLMs & agents
  glyph: "◎"
  color: l0                  # token name, see 5.1
  items:
    - name: Microsoft Agent Framework
      where: Electrolux Group
    - name: RAG · Azure AI Search · Azure OpenAI
      where: Electrolux Group
- key: experimentation
  group: Experimentation
  glyph: "⚖"
  color: l1
  items: [...]
```

Adding a fifth toolkit group here **automatically adds a fifth node** to the canvas — the layout engine in 6.2 distributes them vertically. That is the point.

### 3.6 `_data/projects.yml`, `_data/publications.yml`, `_data/contact.yml`

```yaml
# projects.yml
- name: Agentic knowledge assistant
  year: 2025 —
  desc: Agent Framework + RAG on Azure for 6,000 monthly employees…
  tags: agents · evals

# publications.yml
- title: FPGA Implementation of Template Matching Using Binary Sum of Absolute Difference
  venue: IEEE
  year: 2016
  href: https://ieeexplore.ieee.org/document/7849615/

# contact.yml
- label: email
  value: fadhil.mochammad1095@gmail.com
  href: mailto:fadhil.mochammad1095@gmail.com
- label: github
  value: github.com/fadhilmch
  href: https://github.com/fadhilmch
- label: linkedin
  value: in/fadhilmch
  href: https://www.linkedin.com/in/fadhilmch/
```

### 3.7 `_data/lanes.yml` — topic lanes, shared by Posts and Notes

```yaml
- key: agents
  label: agents
  long: Agents & LLMs
  color: l0
  tags: [agents]
- key: exp
  label: experimentation
  long: Experimentation
  color: l1
  tags: [exp, data]
- key: mlops
  label: ml-platform
  long: ML platform
  color: l3
  tags: [mlops]
- key: creative
  label: creative
  long: Creative
  color: l2
  tags: [design, photo, music]
```

A post or note carries raw tags (`agents`, `mlops`, …); the lane it renders in is whichever lane lists that tag. Add a lane, or move a tag between lanes, here only.

### 3.8 `_data/workflow.yml` — **the node graph**

This is the file Fadhil edits to add nodes. In the mockup the nodes and their `x`/`y` are hardcoded in JavaScript. **We are not doing that.** Nodes declare a `level` (which column) and the layout is computed.

```yaml
canvas:
  node_width:  76
  node_height: 72
  col_gap:     202     # horizontal distance between levels
  row_gap:     118     # vertical distance between siblings in a level
  pad_x:       30
  center_y:    250

nodes:
  - id: profile
    level: 0
    glyph: "@"
    title: Fadhil
    subtitle: "{{ profile.location }}"     # see note on interpolation below
    kind: profile                          # profile | input | loop | tool | output | respond
    color: fg
    desc: "{{ profile.bio }}"
    source: profile                        # ◀ where the inspector rows come from

  - id: edu
    level: 1
    glyph: "∑"
    title: Education
    subtitle: EE → ML
    kind: input
    color: fg
    desc: >-
      Electrical engineering and robotics in Bandung, then a Master's in
      machine learning at KTH. The hardware years still shape how I debug.
    source: education

  - id: exp
    level: 2
    glyph: "≡"
    title: Experience
    subtitle: auto                         # "auto" → "<n> roles"
    kind: loop
    color: fg
    desc: From a robotics lab in Bandung to ML work in Stockholm.
    source: experience

  # The four toolkits are NOT listed here. They are expanded from _data/skills.yml
  # at this level. See `expand` below.
  - expand: skills
    level: 3
    kind: tool

  - id: work
    level: 4
    glyph: "▣"
    title: Work
    subtitle: auto
    kind: output
    color: fg
    desc: Selected projects, plus two early papers from my robotics years.
    source: projects+publications

  - id: contact
    level: 5
    glyph: "→"
    title: Say hello
    subtitle: contact
    kind: respond
    color: l2
    desc: Happy to talk about agents, evaluation or experimentation.
    source: contact

edges:
  - { from: profile, to: edu,     label: "2 degrees" }
  - { from: edu,     to: exp,     label: auto }      # auto → "<n> roles"
  - { from: exp,     to: "@skills" }                 # fans out to every skills node
  - { from: "@skills", to: work }                    # fans in from every skills node
  - { from: work,    to: contact, label: "1 item" }
```

**`source` values the renderer must support** (implement as a `case`/`when` in `_includes/workflow/rows.html`):

| `source` | Rows rendered | JSON output |
|---|---|---|
| `profile` | role / based in / curious about / off-hours | `{name, role, location}` |
| `education` | `years` → `role, org. note` | array of `{degree, school, years}` |
| `experience` | `years` → `role · org — note` | array of `{role, org, years}` |
| `skills:<key>` | `where` → `name` | `{toolkit, tools[]}` |
| `projects+publications` | project name → desc, then `paper · venue year` → title (linked) | `{projects[], publications: n}` |
| `contact` | `label` → `value` (linked) | `{label: value, …}` |
| `custom` | the node's own inline `rows:` list | the node's own inline `output:` map |

**`source: custom` is the escape hatch.** It means Fadhil can add a node with a shape nobody anticipated — an "Awards" node, a "Speaking" node — without touching code:

```yaml
  - id: awards
    level: 4
    glyph: "★"
    title: Awards
    subtitle: auto
    kind: output
    color: l1
    desc: A few from the robotics years.
    source: custom
    rows:
      - { k: "2017", v: "2nd place, Go-Hackathon, Gojek Indonesia" }
      - { k: "2016", v: "1st place, i-Caps International Joint Capstone Design, Incheon" }
    output:
      awards: 2
```

**On `{{ profile.location }}` inside YAML:** Liquid does *not* interpolate strings that come out of `_data`. Two acceptable implementations — pick one and be consistent:

- **(a) Preferred, simplest.** Don't interpolate. Write the literal value in `workflow.yml` (`subtitle: Stockholm, Sweden`). Cost: the location is in two files.
- **(b) If you want single-sourcing.** Support a `subtitle_from: profile.location` key and resolve it with `{% assign parts = node.subtitle_from | split: "." %}` plus a two-level lookup. Do not build a general expression evaluator.

Choose (a) unless Fadhil asks otherwise. Note the choice in `docs/EDITING.md`.

### 3.9 Post front matter — `_posts/YYYY-MM-DD-slug.md`

```yaml
---
layout: post
title: Evaluating an agent honestly
date: 2026-09-10
tags: [agents]
summary: Relevance, recall, groundedness and latency, and why none of them is enough on its own.
---

Body in Markdown.
```

Reading time is **computed**, never written by hand: `{{ content | number_of_words | divided_by: 220 | plus: 1 }} min`.

### 3.10 Note front matter — `_notes/<id>.md`

The **filename without extension is the note id**. `_notes/retrieval-recall.md` has id `retrieval-recall`. Nothing else defines the id; do not add an `id:` key.

```yaml
---
layout: note
title: Retrieval recall
tag: agents
links: [rag, evals]
---

Did the right documents make it into context at all?
```

- `tag` — one raw tag; maps to a lane via `_data/lanes.yml`. Drives the node colour in the graph and the explorer grouping.
- `links` — outgoing edges, by note id. **Explicit, in front matter.** This is deliberate: it needs no Jekyll plugin and no regex pass.
- **Backlinks are computed,** never written. See 8.3.
- `[[some-id]]` may also appear inline in the body for readability; a small JS pass (8.4) turns those into links at render time. Front-matter `links` remains the source of truth for the graph.

---

## 4. Phase 0 — Clean slate and toolchain

**Estimate: half a day.**

### 4.1 Wipe and restructure

```bash
cd ~/Documents/personal_repo/fadhilmch.github.io
git checkout -b rebuild-workflow-v2

# Keep the old site reachable in history, but out of the working tree.
git rm -r --cached .DS_Store
git rm about.html index.html style.css about-style.css README.MD
rm -f about.html index.html style.css about-style.css notes.html
rm -rf _includes _layouts _config.yml Gemfile   # the abandoned editorial scaffold
```

**Case-sensitivity gotcha — read this before renaming `Assets/`.** macOS filesystems are case-insensitive; GitHub Pages' Linux build is not. A site that works locally with `Assets/` will 404 in production if the HTML says `assets/`. Git on macOS will not record a pure case change in one step:

```bash
git mv Assets assets-tmp
git mv assets-tmp assets
git status        # must show the renames. If it shows nothing, the rename did not take.
```

Then delete the 2016 images that the new design does not use (`FM Face*.png`, `aboutme.png`, `header.jpg`, the social-icon PNGs — the new design uses inline SVG). Keep nothing "just in case"; git history has it.

### 4.2 Park the design reference in the repo

```bash
mkdir -p _archive/design-reference
SRC=~/Downloads/Portfolio\ Website\ Design\ Request
mkdir -p _archive/design-reference/shots
cp "$SRC/Portfolio F Workflow v2.dc.html" _archive/design-reference/
cp "$SRC/fm-graph.js" _archive/design-reference/
cp "$SRC"/shots/{01-v2,01-v2b,02-v2,02-v2b,03-v2,01-logos,02-logos}.jpg _archive/design-reference/shots/
```

`_archive` is already in `exclude:` in `_config.yml` (4.3), so it never ships.

### 4.3 `_config.yml`

```yaml
title: Fadhil Mochammad
tagline: ML platforms, evaluation, and the parts that aren't the model.
description: >-
  Fadhil Mochammad is a machine learning engineer in Stockholm. Notes on ML
  infrastructure, agent evaluation, experimentation platforms and production systems.
author: Fadhil Mochammad
email: fadhil.mochammad1095@gmail.com
url: https://fadhilmch.github.io
baseurl: ""

github_username: fadhilmch
linkedin_username: fadhilmch
google_site_verification: isqDPfhl_ygE-BjKyXaufxOofzxuwccFMeswShdh6eU

timezone: Europe/Stockholm
markdown: kramdown
highlighter: rouge

collections:
  notes:
    output: true
    permalink: /notes/:name/

defaults:
  - scope: { path: "", type: posts }
    values: { layout: post }
  - scope: { path: "", type: notes }
    values: { layout: note }

permalink: /posts/:title/

plugins:
  - jekyll-feed
  - jekyll-seo-tag
  - jekyll-sitemap

feed:
  path: /feed.xml

sass:
  style: compressed

exclude:
  - Gemfile
  - Gemfile.lock
  - vendor
  - docs
  - _archive
  - README.md
```

Note `permalink: /posts/:title/` — the old config used `/notes/:title/` for posts, which now collides with the notes collection. Do not carry that over.

### 4.4 `Gemfile`

```ruby
source "https://rubygems.org"

gem "jekyll", "~> 4.3"

group :jekyll_plugins do
  gem "jekyll-feed"
  gem "jekyll-seo-tag"
  gem "jekyll-sitemap"
end

gem "webrick"
```

We use plain `jekyll`, not the `github-pages` gem, because we build in CI (4.5). That gives us Jekyll 4 and the freedom to add a plugin later.

**This is a preference, not a requirement.** Nothing in this design needs it — see appendix A. To deploy from a branch instead: swap this Gemfile for `gem "github-pages", group: :jekyll_plugins`, drop the `sass:` block from `_config.yml`, skip 4.5, and set Settings → Pages → Source = `master` / root.

### 4.5 `.github/workflows/pages.yml` — optional, see appendix A

Standard Actions Pages build. Repo → Settings → Pages → Source = **GitHub Actions**.

```yaml
name: Deploy site
on:
  push: { branches: [master] }
  workflow_dispatch:
permissions: { contents: read, pages: write, id-token: write }
concurrency: { group: pages, cancel-in-progress: false }
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ruby/setup-ruby@v1
        with: { ruby-version: "3.3", bundler-cache: true }
      - uses: actions/configure-pages@v5
      - run: bundle exec jekyll build --trace
        env: { JEKYLL_ENV: production }
      - uses: actions/upload-pages-artifact@v3
  deploy:
    needs: build
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

### 4.6 Add a build guard

Add `html-proofer` as a dev dependency and a CI step that runs it against `_site` with `--disable-external`. It catches the `Assets/` vs `assets/` class of bug before production does.

**Phase 0 acceptance:** `bundle exec jekyll serve` boots to an empty-but-valid site. CI runs green on a push. `git status` is clean.

---

## 5. Phase 1 — The shell

**Estimate: 1 day.**

### 5.1 `assets/css/tokens.css`

Lift the custom properties verbatim from the `<style>` block at the top of `Portfolio F Workflow v2.dc.html`. Do not re-pick colours by eye from the screenshots. The two blocks you want are `:root,[data-theme="light"]{…}` and `[data-theme="dark"]{…}`:

```css
:root, [data-theme="light"] {
  --bg:#f5f4f0; --panel:#fbfaf7; --fg:#161616; --muted:#62605a;
  --line:#dedbd3; --dot:#d3cfc6; --ghost:#dcd8ce;
  --k-key:oklch(0.5 0.14 255); --k-str:oklch(0.5 0.13 150);
  --k-num:oklch(0.55 0.16 30); --k-p:#8a877f;
  --l0:oklch(0.55 0.17 255); --l1:oklch(0.55 0.17 150);
  --l2:oklch(0.58 0.16 30);  --l3:oklch(0.55 0.17 305);
  --ok:oklch(0.55 0.15 150);
  /* graph */
  --g-fg:#44423d; --g-label:#6e6c66; --g-line:#cfcbc1;
  --g-acc:oklch(0.58 0.16 30);
  --g-c-agents:var(--l0); --g-c-exp:var(--l1); --g-c-data:var(--l1);
  --g-c-mlops:var(--l3); --g-c-photo:var(--l2); --g-c-music:var(--l2);
  --g-c-design:var(--l2); --g-c-meta:var(--fg);
  --g-font:'Geist Mono';
}
[data-theme="dark"] { … copy the dark block verbatim … }
```

`--l0…--l3` are the lane colours. `_data/lanes.yml` and `_data/skills.yml` reference them by name (`color: l0`), and Liquid emits `var(--l0)`. That is the whole colour-indirection story — keep it that simple.

Also add, once, at the top of `base.css`:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
  }
}
```

### 5.2 Type

Geist and Geist Mono, from the same Google Fonts URL the mockup uses:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap">
```

Body 15px / 1.55. Mono is used for: the breadcrumb (`workflows / fadhil.about`), node subtitles, the run status line, the lane chips, dates, and all JSON.

### 5.3 `_includes/logo.svg`

The mark is a large ghost `F` with a frequency-modulated wave drawn over it. In the mockup the wave path is generated at runtime by a `wave(x0, x1, y, amp)` helper. **We ship a static path** — generate it once and paste it in.

Run this in any browser console, then paste the output as the `d` attribute:

```js
// FM carrier: frequency rises then falls, Gaussian around t=0.55
const wave = (x0, x1, y, amp, n = 240) => {
  let s = '', p = 0;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const f = 1.4 + 4.5 * Math.exp(-Math.pow((t - 0.55) / 0.17, 2));
    p += f * 2 * Math.PI / n;
    s += (i ? 'L' : 'M') + (x0 + t * (x1 - x0)).toFixed(1)
       + ' ' + (y - Math.sin(p) * amp).toFixed(1);
  }
  return s;
};
wave(6, 114, 64, 26);   // ← the header logo, viewBox 0 0 120 120
```

Structure (from the mockup header):

```html
<svg viewBox="0 0 120 120" fill="none" aria-hidden="true" focusable="false">
  <text x="60" y="108" text-anchor="middle" fill="var(--ghost)"
        style="font-family:Geist,sans-serif;font-weight:700;font-size:128px">F</text>
  <path d="…" stroke="var(--bg)" stroke-width="13" stroke-linejoin="round" stroke-linecap="round"/>
  <path d="…" stroke="var(--l2)" stroke-width="6"  stroke-linejoin="round" stroke-linecap="round"/>
</svg>
```

The double path is a knockout: the thick `--bg` stroke behind the thin `--l2` stroke punches a gap through the `F`. Keep both.

Also produce `assets/favicon.svg` from the same mark at 32px — check it against `shots/01-logos.jpg`, which shows the intended app-icon sizes (72/40/20). If the wave is illegible at 20px, simplify to the `F` alone at that size via a second, simpler SVG; don't try to make one file do both.

### 5.4 Header, theme toggle, layouts

`_includes/header.html`: logo + `{{ site.title }}` with a mono subline `{{ site.data.profile.role }} · {{ site.data.profile.location }}`; a pill nav (About / Posts / Notes) where the current page's pill gets `background: var(--fg); color: var(--bg)`; and the theme toggle on the right reading `○ light` or `● dark`.

Mark the current tab with `aria-current="page"`, driven by a `nav:` key in each page's front matter — not by URL string-matching.

`assets/js/theme.js` plus an **inline, render-blocking** snippet in `<head>` to prevent a flash:

```html
<script>
  try {
    var t = localStorage.getItem('fm-theme')
      || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', t);
  } catch (e) {}
</script>
```

The toggle button flips the attribute and writes `localStorage`. Give it `aria-pressed`.

`_layouts/base.html` carries a skip link (`Skip to content` → `#main`), the header, `<main id="main">`, and the footer.

**Phase 1 acceptance:** all three pages render with correct type, colours and header. The theme toggle works, survives reload, and produces no flash on a hard refresh. Lighthouse accessibility ≥ 95 on the empty shell.

---

## 6. Phase 2 — Data layer

**Estimate: half a day.**

Port every array in `fm-data-real.js` into the `_data/*.yml` files defined in section 3. Mechanical work, but two things to be careful about:

1. **Check each fact against `resume-source.md`.** It is the authority, it is newer, and it carries suppression rules. In particular: do not name the seven Electrolux markets; do not publish golden-dataset size, generation time or acceptance rate; treat anything marked `[VERIFY]` as unusable until Fadhil confirms it. If in doubt, leave it out and ask.
2. **Quote anything that looks like a number, a date or a boolean.** `2018 — 2020` is fine unquoted; `6,000`, `−95%`, `50k+`, `Sep 2025 — Now` and `on` are not. When unsure, quote it.

Note the minus sign in `−95%` is U+2212, not a hyphen. Keep it.

**Phase 2 acceptance:** a scratch page that dumps every data file renders every field with no `nil`s and no YAML parse errors. Delete the scratch page afterwards.

---

## 7. Phase 3 — About: the node canvas

**Estimate: 2 days.** This is the hard part. Budget accordingly.

### 7.1 Architecture: render server-side, toggle client-side

Do **not** port the mockup's React-ish render loop. Instead:

- Liquid renders the SVG edges and the node buttons into the page at build time.
- Liquid renders **every** node's inspector panel into the DOM, all but one with `hidden`.
- `workflow.js` does exactly two things: swap which inspector is visible, and run the execute animation.

Consequences, all good: the page works with JS off (all content is in the HTML), search engines see every fact, there is no second copy of the content in JavaScript, and you never write a renderer.

### 7.2 Layout maths — compute, never hardcode

Given `canvas:` from `_data/workflow.yml` and the node list grouped by `level`:

```
NODE_W = 76,  NODE_H = 72,  COL_GAP = 202,  ROW_GAP = 118
PAD_X  = 30,  CENTER_Y = 250

x(node)            = PAD_X + level * COL_GAP
y(node, i, k)      = CENTER_Y - ((k - 1) * ROW_GAP) / 2 - NODE_H/2 + i * ROW_GAP
                     where k = number of nodes at this level, i = index within it

canvas width       = PAD_X * 2 + (max_level + 1) * COL_GAP
canvas height      = max(470, max_k * ROW_GAP + 120)
```

Sanity check against the mockup: level 3 with `k = 4` gives `y = 250 − 177 − 36 = 37, 155, 273, 391` — the mockup's hardcoded `40, 158, 276, 394`. A lone node at any level gives `y = 214`. Correct.

Ports and edges:

```
out-port of A = (x(A) + NODE_W, y(A) + NODE_H/2)
in-port  of B = (x(B) − 4,      y(B) + NODE_H/2)
edge path     = M x1 y1 C mx y1, mx y2, x2 y2      where mx = (x1 + x2) / 2
edge label    = centred at (mx, (y1 + y2) / 2)
```

Expand `from: "@skills"` / `to: "@skills"` into one edge per skills node before drawing.

**Liquid arithmetic warning:** `divided_by` on two integers does integer division. Multiply before you divide (`{{ a | times: b | divided_by: c }}`), and never feed it a float by accident. All the numbers above are integers by design — keep it that way.

### 7.3 Markup

```html
<div class="wf-scroll">
  <div class="wf-canvas" style="width:{{ w }}px;height:{{ h }}px">
    <svg class="wf-edges" width="{{ w }}" height="{{ h }}" aria-hidden="true">
      {% for e in edges %}<path d="…" class="wf-edge" data-to="{{ e.to }}" …/>{% endfor %}
    </svg>

    {% for n in nodes %}
    <button class="wf-node" id="wf-n-{{ n.id }}"
            style="left:{{ n.x }}px;top:{{ n.y }}px"
            data-node="{{ n.id }}" data-level="{{ n.level }}"
            aria-controls="wf-i-{{ n.id }}" aria-expanded="false">
      <span class="wf-node__glyph" style="color:var(--{{ n.color }})">{{ n.glyph }}</span>
      <span class="wf-node__title">{{ n.title }}</span>
      <span class="wf-node__sub">{{ n.subtitle }}</span>
    </button>
    {% endfor %}
  </div>
</div>

{% for n in nodes %}
<section class="wf-inspector" id="wf-i-{{ n.id }}" {% unless forloop.first %}hidden{% endunless %}>
  …left: glyph, title, desc, rows…   …right: <code>{{ n.id }}.json</code>, N items, JSON…
</section>
{% endfor %}
```

Nodes are `<button>`s, not `<div>`s. You get keyboard focus, Enter/Space and screen-reader semantics for free. The canvas is a `role="list"`-free plain container; the *pipeline* is decorative, the *content* lives in the inspectors.

Node shape by `kind` (from the mockup): `profile` → `border-radius: 36px 14px 14px 36px`; `respond` → `14px 36px 36px 14px`; everything else → `14px`. Profile nodes have no in-port; respond nodes have no out-port.

### 7.4 JSON rendering

`_includes/workflow/json.html` builds the `<node>.json` block. Do not write a JS tokenizer — emit the spans from Liquid:

- keys → `<span class="j-key">` (`--k-key`)
- string values → `<span class="j-str">` (`--k-str`)
- numbers → `<span class="j-num">` (`--k-num`)
- punctuation → `<span class="j-p">` (`--k-p`)

Escape values with `| escape`. Write one `{% case node.source %}` block with a branch per source type; each branch knows its own shape, so there is no general-purpose serializer to get wrong.

### 7.5 `assets/js/workflow.js`

Two behaviours, ~60 lines total.

**Select.** On node click: hide all inspectors, unhide the target, move `aria-expanded`, set the selected node's border to `var(--fg)` with a `0 0 0 4px var(--line)` ring, and `history.replaceState` a `#node-<id>` hash so a selection is linkable. On load, honour that hash.

**Execute.** "Run workflow" walks `level = 0 … max_level` on a timer (~350 ms/step):
- nodes at `level < current` → `done`, nodes at `level === current` → `run` (border `var(--l2)`), above → `idle`
- edges into a running node get `stroke-dasharray: 6 4; animation: fmflow .6s linear infinite`
- the mono status line reads `running… step N of M`, then settles to `last run: success · {n} nodes · 2.1s` — **compute the node count from the data**, and use a real elapsed measurement rather than a hardcoded `2.1s`

```css
@keyframes fmflow { to { stroke-dashoffset: -20 } }
```

If `prefers-reduced-motion` is set, jump straight to the final state.

### 7.6 Mobile — do not skip this

The canvas is ~1140 × 470. Below 760px:

- Hide `.wf-scroll` entirely.
- Show a stacked accordion instead: one `<button>` per node in pipeline order, each expanding **the same inspector element** already in the DOM. No duplicated content; move the inspector node with `appendChild`, or render inspectors once in a container both views point at.
- Keep the "Run workflow" button but let it just walk the accordion open one step at a time, or hide it. Ask Fadhil.

A horizontally scrolling canvas on a phone is not an acceptable substitute. If you are short on time, cut the execute animation on mobile, never the content.

### 7.7 Rest of the About page

Above the canvas: breadcrumb `workflows / fadhil.about · ● active` in mono; `{{ profile.headline }}` as the h1 (~40px, tight leading); the run status line; the "▶ Run workflow" button (`--l2` fill, white text); then the stat tiles from `_data/stats.yml` in an auto-fitting grid (`repeat(auto-fit, minmax(240px, 1fr))`).

**Phase 3 acceptance:**
- Adding a fifth group to `_data/skills.yml` adds a fifth node, re-spaces level 3, and wires both its edges — with **zero** code changes. Test this explicitly; it is the acceptance criterion that matters.
- Adding a `source: custom` node to `_data/workflow.yml` renders correctly. Also test.
- With JS disabled, every node's content is present in the page.
- Tab reaches every node; Enter opens it; the inspector is announced.
- No content string appears in any `.html`, `.css` or `.js` file.

---

## 8. Phase 4 — Posts

**Estimate: 1.5 days.**

### 8.1 `/posts/` — two views

`posts.html` renders **both** views into the DOM; `posts.js` toggles a class on the container. No refetch, no re-render.

**Branches** (see `shots/02-v2.jpg`): a vertical rail per lane down the left, in `_data/lanes.yml` order, each in its lane colour. A post sits on the rail of its first matching lane and gets a filled dot there; if it carries tags from other lanes it gets a hollow dot on those rails too. A mono year separator (`— 2026`) appears when the year changes. Each row: title (link), summary, then `⌐ agents + ml-platform` in mono, with the date and reading time right-aligned in mono.

Draw the rails as one SVG sized to the list, with the dot y-positions computed from row offsets — or, simpler and more robust, give each row a fixed min-height and compute the dot positions in Liquid from `forloop.index`. Prefer the latter; a JS measuring pass will fight with font loading.

**Timeline:** the same rows without rails. Reuse the row include.

### 8.2 Lane filter

Chips: `all branches` plus one per lane. Clicking filters client-side by toggling `[hidden]` on rows whose `data-lanes` doesn't match. Reflect the choice in the URL (`?lane=agents`) and honour it on load. The unfiltered list must be the server-rendered default so JS-off users see everything.

Post count in the header (`9 posts`) comes from `{{ site.posts | size }}`.

### 8.3 `_layouts/post.html`

Date, reading time, title, summary as standfirst, lane chips, prose, then prev/next.

Style the prose body deliberately: measure ~34rem, generous leading, `--panel` code blocks, Rouge highlighting that uses the `--k-*` tokens so it matches the JSON inspector.

**Phase 4 acceptance:** dropping a new file into `_posts/` puts it in both views, on the right rail, with the right colour and a computed reading time — no other edit anywhere. The two views agree on which posts exist.

---

## 9. Phase 5 — Notes

**Estimate: 2 days.**

### 9.1 Three panes

`notes.html` is a three-column grid (explorer | reader | graph) at ≥1100px. Below that: explorer collapses to a top drawer, graph moves under the reader.

`/notes/` shows `_notes/index.md` in the reading pane. `/notes/<id>/` shows that note. The explorer and graph are identical on every notes page — put them in `_layouts/note.html` so both the index page and individual notes share one layout.

### 9.2 Explorer

Group notes by lane (via `tag` → `_data/lanes.yml`), each group a collapsible `<details>` with a coloured dot, the lane's `long` label and a count. Total count in the header (`39 notes`).

Search box: filter client-side over the pre-rendered `<li>`s, matching title and tag. Plain `String.includes` on a lowercased title — no fuzzy matching, no library.

### 9.3 Backlinks — computed, never authored

```liquid
{% assign id = page.basename_without_ext %}
{% assign backlinks = site.notes | where_exp: "n", "n.links contains id" %}
```

Two things to know here:

- **Liquid 4 has no `push` filter.** Don't try to accumulate an array in a `for` loop — use `where_exp`, which Jekyll provides and which can see `id` from the surrounding scope.
- **Use `basename_without_ext`, not `slug`.** `page.slug` is reliable for posts but is not guaranteed on collection documents across Jekyll versions. `basename_without_ext` is on the document drop in both Jekyll 3 and 4. Confirm it in the first five minutes of Phase 5 by rendering `{{ page.basename_without_ext }}` on one note — if it's empty, fall back to `page.url | split: "/" | last`.

With ~40 notes this is free; don't optimise it. Show **outgoing** links as coloured chips and **backlinks** below; render an explicit "0 backlinks" when empty, as the mockup does.

**Validate links at build time.** Add a Liquid loop that, for every note, checks each `links:` target resolves to a real note, and emits a visible warning block when `JEKYLL_ENV != production`. A typo'd link id should be loud in development and invisible in production.

### 9.4 The graph

Port `fm-graph.js` to `assets/js/fm-graph.js` essentially unchanged — it is a self-contained `<fm-graph>` custom element with its own canvas, force simulation, pan/zoom and hover, and it already reads its colours from the CSS custom properties you defined in 5.1 (`--g-fg`, `--g-line`, `--g-acc`, `--g-c-<tag>`, `--g-font`).

One change: it currently blocks on `window.FM_DATA`. Replace `wait()`/`init()` with a fetch:

```js
fetch('{{ "/notes-graph.json" | relative_url }}')
  .then(r => r.json())
  .then(d => graph.init(d.notes));
```

Generate that file from Jekyll — `notes-graph.json` at the repo root, with front matter:

```liquid
---
layout: null
permalink: /notes-graph.json
---
{"notes":[{% for n in site.notes %}{
  "id":    {{ n.slug   | jsonify }},
  "title": {{ n.title  | jsonify }},
  "tag":   {{ n.tag    | jsonify }},
  "url":   {{ n.url    | relative_url | jsonify }},
  "links": {{ n.links  | jsonify }}
}{% unless forloop.last %},{% endunless %}{% endfor %}]}
```

Always `| jsonify` — never hand-build JSON strings with quotes in Liquid.

Wire the existing `fm-note-focus` event: when the reading pane changes note, dispatch it so the graph highlights the current node. Clicking a graph node navigates to that note's `url`.

Re-read colours on theme change — the element reads CSS custom properties once in `readColors()`; call it again from the theme toggle via a `fm-theme-change` event.

**Reduced motion / battery:** stop the `requestAnimationFrame` loop when the simulation settles (`alpha` below a threshold) and when the element scrolls out of view via `IntersectionObserver`. The mockup runs it forever; that is fine in a demo and rude on a laptop.

**Phase 5 acceptance:** adding `_notes/new-thing.md` with `links: [agents]` makes it appear in the explorer under the right group, as a node in the graph connected to `agents`, and as a backlink on the `agents` note — with no other edit. A broken link id produces a visible dev-time warning.

### 9.5 Inline `[[wikilinks]]`

`links:` in front matter drives the graph and is the source of truth. For readability, `[[some-id]]` in a note body should also render as a link. With no plugins available, do it in `assets/js/notes.js`: walk text nodes inside `.note-body` and replace `[[id]]` with an anchor to `/notes/id/`, using a `data-note-urls` map emitted by Liquid. Unknown ids render as plain text with a `.wikilink--missing` class.

Tell Fadhil, in `EDITING.md`: **inline `[[…]]` is cosmetic; if you want an edge in the graph, add the id to `links:`.** That asymmetry will bite him otherwise.

---

## 10. Phase 6 — Polish

**Estimate: 1 day.**

- **Responsive** — verify 360, 768, 1024, 1440. The node canvas (7.6) and the notes three-column layout are the two real breakpoint problems; everything else is a single-column reflow.
- **Accessibility** — skip link; visible focus rings on every interactive element (do not remove the outline, restyle it); colour contrast ≥ 4.5:1 for body text in both themes (check `--muted` on `--panel` in dark specifically, it is the one most likely to fail); `prefers-reduced-motion` honoured by the execute animation, the flowing edges and the graph.
- **SEO** — `jekyll-seo-tag` in `head.html`; per-page `description`; an OG image (render the logo lockup from `shots/02-logos.jpg` at 1200×630 and commit it as a PNG); `sitemap.xml` and `feed.xml` reachable.
- **Performance** — no JS blocks first paint except the 5-line theme snippet; `font-display: swap`; defer `fm-graph.js` and only instantiate it on notes pages. Target Lighthouse ≥ 95 on performance and accessibility for `/` and `/posts/`.
- **404** — a `404.html` in the site's voice.
- **`html-proofer`** — green in CI.

---

## 11. Phase 7 — Hand over

**Estimate: half a day.**

Write `docs/EDITING.md` **for Fadhil, not for engineers.** It is the deliverable that makes the "easily editable" requirement real. It must answer, each with a complete copy-pasteable example:

1. How do I publish a post? (create `_posts/YYYY-MM-DD-slug.md`, the five front-matter keys, what's computed for you)
2. How do I add a note? (filename = id, `tag`, `links`, how backlinks appear by themselves)
3. How do I change my bio / role / location / stats?
4. How do I add a job, a degree, a project, a paper?
5. **How do I add a whole new node to the About pipeline?** — both the "new toolkit" path (add to `skills.yml`) and the "new kind of thing entirely" path (`source: custom` in `workflow.yml`). Show the awards example from 3.8 verbatim.
6. How do I add or recolour a topic lane?
7. What do I never touch? (`_layouts`, `_includes`, `assets/`)
8. How do I preview locally? (`bundle exec jekyll serve`, then `http://localhost:4000`)
9. How do I publish? (push to `master`; CI builds; where to look when it fails)

Then: squash the rebuild into a small number of readable commits, open a PR against `master`, and walk Fadhil through adding one post, one note and one node **himself** while you watch. If he gets stuck on any of the three, the documentation is wrong — fix it before you close the PR.

---

## 12. Rules you must not break

1. No content in `.html`, `.css` or `.js`. Names, titles, dates, metrics, descriptions and URLs all live in `_data/` or front matter.
2. **No hardcoded node coordinates.** Positions are computed from `level` (7.2). The mockup hardcodes them; the mockup is a mockup.
3. No content that exists only in JavaScript. JS may hide, reveal and animate what Liquid already rendered. It may never be the only source of a fact.
4. No framework, bundler or npm dependency.
5. No new `_data` key without a matching entry in `docs/EDITING.md`.
6. Reading time, note counts, post counts, backlinks and edge labels are **computed**, never typed.
7. `assets/` is lowercase, everywhere, forever.
8. When `fm-data-real.js` and `resume-source.md` disagree, `resume-source.md` wins — and when a fact is marked `[VERIFY]` or flagged confidential there, it does not ship. Ask Fadhil.

---

## 13. Open questions for Fadhil

Ask these before Phase 3; the answers are cheap now and expensive later.

1. **Landing page.** The mockup makes About the default tab. Should `/` be About, or should it be Posts?
2. **Mobile "Run workflow."** Keep it driving the accordion, or hide it below 760px? (7.6)
3. **Notes content.** The 39 notes in `fm-data-real.js` are real-looking but were written for the mockup. Ship them as the starting vault, or start with only `index.md` and let them grow?
4. **The node subtitle question in 3.8** — option (a), duplicate the location string into `workflow.yml`, or option (b), support `subtitle_from`?
5. **Domain.** Stay on `fadhilmch.github.io`, or set up a custom domain now? (A `CNAME` file and DNS are ten minutes at the start and an afternoon of redirects later.)
6. **Analytics.** None, or something privacy-preserving? Affects `head.html` and the CSP if we add one.

---

## Appendix A — GitHub Pages limits, and whether we need Actions

### A.1 Is any part of this design impossible on GitHub Pages?

**No.** Every surface in the Workflow v2 design is static markup plus client-side behaviour:

| Feature | How it works | Needs a server? |
|---|---|---|
| Node canvas + edges | SVG and absolutely positioned buttons, emitted by Liquid at build time | No |
| Inspector panels | All pre-rendered into the DOM, JS toggles `hidden` | No |
| "Run workflow" animation | CSS keyframes + a `setTimeout` walk | No |
| JSON syntax colouring | `<span>`s emitted by Liquid, coloured by CSS | No |
| Posts branches / timeline | SVG rails, positions computed in Liquid | No |
| Lane filtering | Toggling `[hidden]` on pre-rendered rows | No |
| Notes explorer + search | `String.includes` over pre-rendered `<li>`s | No |
| Backlinks | Computed in Liquid at build time | No |
| Force-directed graph | Canvas + `fetch` of a build-time `notes-graph.json` | No |
| Light/dark | `data-theme` attribute + `localStorage` | No |

That is not a coincidence — the plan is built that way deliberately (section 7.1). The alternative, rendering from JS the way the mockup does, would also work on Pages, but would put every fact about Fadhil behind JavaScript where search engines and JS-off readers can't reach it.

### A.2 Where GitHub Pages actually stops

These are real walls. None of them is in scope today, but know where the edge is before someone asks for one of them:

- **No server-side code.** No Ruby/Node/Python at request time, no database, no sessions, no auth.
- **No form handling.** A contact form that emails needs a third party (Formspree, Basin, Netlify Forms). *The design sidesteps this: "Say hello" is `mailto:` and profile links, not a form.*
- **No server-side search.** Client-side only — fine at 40 notes, fine at 400, questionable at 4,000. At that point, prebuild a search index (Lunr) at build time; still no server.
- **No private or gated content.** A user Pages site is public. Drafts live unpushed on your machine, not in the repo.
- **No runtime secrets.** Anything shipped is public. Analytics keys, if any, are public by nature.
- **No dynamic content.** Anything that must change without a push — a live GitHub activity feed, a "now playing" widget — needs a client-side `fetch` to some third-party API, with that API's CORS and rate limits.
- **No custom 301s or headers.** No `.htaccess`, no redirect rules, no CSP header (a `<meta>` CSP is the only option). Moving a URL means leaving a stub page behind.
- **Soft limits.** 1 GB repo, ~100 GB bandwidth/month, ~10 builds/hour on branch deploys. Not close to any of them.

### A.3 So why did I put Actions in the plan?

Honest answer: **we don't need it.** I chose it for headroom and should have flagged it as a choice rather than baking it in. Here is the actual trade so you can decide.

**Deploy from a branch** (push to `master`, GitHub builds it):

- Zero config. Flip one setting, done.
- Locks you to **Jekyll 3.9** and a [frozen plugin whitelist](https://pages.github.com/versions/). `_plugins/` is silently ignored.
- Build failures arrive as an email, with thin logs.
- Everything in this plan works on it. The plan deliberately avoids plugins: `links:` is explicit front matter rather than a regex wikilink parser, backlinks are a Liquid loop, and inline `[[…]]` is a JS pass. That was designed around this constraint.

**Deploy from Actions** (one ~30-line YAML file):

- Jekyll 4 — faster builds, `sass: style: compressed`, better Liquid error messages.
- Any plugin you want, now or later. The two most likely asks: a real wikilink converter (so `[[…]]` works without JS and feeds the graph, removing the asymmetry flagged in 9.5), and build-time OG-image generation per post.
- **`html-proofer` runs before deploy, not after.** This is the concrete reason I'd keep it. The bug already sitting in this repo — `_includes/head.html` links `/assets/css/main.css` while the directory is `Assets/` — works on macOS and 404s on Linux. Actions catches that class of bug in CI; branch-deploy ships it and you find out from the live site.
- Readable build logs; you can reproduce the exact build locally.
- Cost: free CI minutes on a public repo, ~40 s per deploy instead of ~20 s.

**Recommendation:** use Actions, for the `html-proofer` gate more than the Jekyll version. But if Fadhil would rather have one less moving part, delete `.github/` and the `sass:` block, swap the Gemfile to `github-pages`, and nothing else in this plan changes. Make the call at the end of Phase 0 — it is a ten-minute reversal either way, in both directions.
