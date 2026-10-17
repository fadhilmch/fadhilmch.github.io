# Editing the site

The site is built from YAML and Markdown. You can change the content without editing HTML, CSS or JavaScript.

## Publish a post

Create a file in `_posts/` named with the date and a lowercase slug:

```text
_posts/2026-10-01-a-short-title.md
```

Add this front matter, then write the post below it:

```markdown
---
layout: post
title: A short title
date: 2026-10-01
tags: [agents]
summary: One sentence that explains why the post is worth reading.
---

The essay starts here.
```

The site computes the URL, reading time, lane, date formatting, and previous/next links. The post appears on the Posts page under its year, with a dot in its lane colour, automatically.

### Diagrams in a post

Write a fenced `mermaid` block anywhere in a post and it renders as a diagram, coloured from the site theme and redrawn when the reader switches light/dark:

````markdown
```mermaid
flowchart LR
  A[Raw tweet] -->|clean| B[Tokens] --> C[TF-IDF]
```
````

Any Mermaid diagram type works (flowchart, sequence, state, and so on). The Mermaid library only loads on posts that contain such a block. For figures that need exact layout, an inline `<figure class="fig"><svg …></svg></figure>` also works; see the existing posts for examples.

## Add a note

The filename is the note id. Create `_notes/retrieval-recall.md` like this:

```markdown
---
layout: note
title: Retrieval recall
tag: agents
links: [rag, evals]
---

Did the right documents make it into context at all?
```

`links` creates graph edges and outgoing links. Backlinks are computed automatically. Inline `[[rag]]` links are cosmetic; add `rag` to `links` if the relationship should appear in the graph. A link to an unknown id is shown as a development warning.

## Change your profile and stats

Edit `_data/profile.yml` for your name, role, location, headline, bio, current focus, off-hours interests, roots, and the things you care about. `short_role` and `city` are the short versions shown under your name in the header and in the footer ("ML engineer · Stockholm").

`off_hours` may start each interest with an emoji, and `flag` (quoted, e.g. `"🇸🇪"`) is shown after the location in the About inspector. Emojis are content, so they live in YAML, never in templates. The Fadhil node's `subtitle` in `_data/workflow.yml` is a literal copy of the location; update it alongside `profile.yml`. The node's `desc` is a separate one-line tagline, distinct from the `bio` shown at the top of the page; edit it in `workflow.yml`.

`roots` (optional, e.g. `Indonesia 🇮🇩`) adds an "originally from" row after "based in" in the Fadhil inspector. `cares_about` (optional) is a list of short lines, each may start with an emoji; they render one per line as a "cares about" row after "off-hours". Both are inspector-only and stay out of the JSON panel. `bio` uses a YAML block scalar (`>-`) so apostrophes and emoji are safe.

List hobbies once, in `off_hours`. Toolkits in `_data/skills.yml` flow into Work on the pipeline, so keep them to things you have used in work, with `where` naming a company or project.

`_data/stats.yml` holds outcome tiles. The current design does not show them; they are kept for later:

```yaml
- value: "6,000"
  label: monthly employees on the assistant I help run
```

Keep values quoted when they contain punctuation, a percent sign, or a leading zero.

## Soft depth and motion

All depth, avatar and animation styling lives in `assets/css/depth.css`. Every rule is
scoped to `html[data-depth="soft"]`, which `_layouts/base.html` sets. **To go back to the
flat look, remove that attribute or the `depth.css` link in `_includes/head.html`.** The
avatar is hidden by a one-line `.avatar { display: none }` in `workflow.css`, so reverting
hides it too.

- Colours and shadows are variables at the top of the file (`--depth-*`). Change the circle
  colour with `--depth-circle` (one value for light, one for dark).
- `--depth-avatar-shadow` controls the cast shadow (lighter in dark mode). The avatar's
  CSS projection is clipped to the circle; the visible head has no shadow onto the panel.
  Keep its background sizing aligned with `.avatar__img` if you change the crop.
- Raised panels share `--depth-shadow-rest`, `--depth-shadow-raised` and `--depth-shadow-hover`.
  Add a new raised element by adding its selector to the `:is(...)` list in "Surfaces".
- The Posts and Projects page headings are intentionally flat. Do not add them to that list.
- Motion is in section 7: a staggered page-load rise, an avatar pop-in, a smooth theme
  switch and a 2px hover lift on cards. It only runs under `prefers-reduced-motion: no-preference`
  (the hover lift also requires `hover: hover`), so reduced-motion users get a static page.
- Workflow nodes and full base lines always stay visible. A short accent travels along
  the lines in a 2.4-second loop; `--depth-flow-period` controls speed. The SVG template
  adds one `.wf-flow` projection per edge with `pathLength="1"` for equal travel duration.
  Its stage comes from the edge-group order. Reduced-motion hides the projection and
  leaves the original graph static. The phone accordion has no added motion.
- Avatar: `assets/css/avatar-images.css` holds transparent 300 and 600 px WebP cutouts
  as base64 data URIs in `--avatar-image`. The browser chooses the 1x or 2x source; both
  the visible cutout and circle-only shadow use it. No binary files are required. To
  replace the avatar, export the same transparent cutout at both widths with the same
  aspect ratio, base64-encode each WebP, and replace the two data URIs. If the aspect
  ratio changes, update `.avatar__img` in `depth.css`. The wrapper stays `aria-hidden`
  because the heading already names Fadhil. The circle clips the body; the head rises
  above it. This asset stylesheet loads only on About and adds no new JavaScript.

Check About, Posts, Projects and Notes at 390 and 1280 px in both themes, and with
reduced motion on, after changing any of this.

## Add jobs, degrees, projects, and papers

Add entries to the matching data file. For example:

```yaml
# _data/experience.yml
- years: Oct 2026 — Now
  role: Senior ML Platform Engineer
  org: Example Company
  note: Building reliable training and evaluation infrastructure.
```

The other files use the same pattern:

```yaml
# _data/projects.yml
- name: Agentic knowledge assistant
  year: 2025 —
  desc: One or two sentences about what it is and what you owned.
  tags: agents · evals

# _data/publications.yml
- title: Paper title
  venue: IEEE
  year: "2016"
  href: https://example.org/paper

# _data/contact.yml
- label: email
  value: you@example.com
  href: mailto:you@example.com
```

Education and experience entries take an optional quoted `flag` (e.g. `flag: "🇸🇪"`), shown after the organisation. Experience entries also take an optional `place` (e.g. `place: Stockholm`), which appears in the JSON panel as plain text. Skill items take an optional `emoji`, shown before the name in the inspector (the JSON panel stays emoji-free).

New entries appear in the relevant workflow inspector automatically, and node subtitles such as `8 roles` and `8 items` update themselves.

## Add a node to the About workflow

Add a new toolkit to `_data/skills.yml`. It becomes a new node at the toolkit level:

```yaml
- key: systems
  group: Systems
  glyph: "◇"
  color: l3
  desc: What I reach for in systems work, and where I used it.
  items:
    - name: Distributed systems
      where: Example Company
```

For a new kind of content, add a node to `_data/workflow.yml` using `source: custom`:

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

The layout is computed from `level`; do not add coordinates. The node id must be unique. Nodes at the same level stack vertically and the canvas grows to fit.

To connect a new node, add an edge to `edges:` in the same file. `"@skills"` means every toolkit node:

```yaml
edges:
  - { from: work, to: awards }
  - { from: "@skills", to: awards }
```

`subtitle: auto` is replaced with a count, such as `8 roles`, `5 tools` or `8 items`. Any other value is shown as written.

The profile location (with its flag) is intentionally written literally as the Fadhil node's `subtitle` in `_data/workflow.yml` so the workflow file stays easy to read; update it there whenever `profile.yml` changes.

## Add or recolour a topic lane

Edit `_data/lanes.yml`:

```yaml
- key: research
  title: Research        # filter chip on Posts
  label: research        # footer legend
  long: Research notes
  color: l0
  tags: [research, experiments]
```

Posts use their raw `tags`; notes use one raw `tag`. A matching lane decides where each item appears and which colour it uses. `color` is one of `l0` to `l5` or `fg`.

Each raw tag also needs a display label in `_data/tags.yml`; that file's order is the order of groups in the Notes explorer:

```yaml
- key: research
  label: Research
```

A lane with `branch: false` (like `meta`) groups notes in the explorer but gets no filter chip on Posts and no footer entry.

## Add a coffee or food recipe

Recipes live in two collections: `_coffee/` and `_food/`. The filename is the URL slug (`_coffee/my-v60.md` becomes `/after-work/coffee/my-v60/`). Create a new Markdown file with front matter and recipe details. The collections may be empty; the category pages show an honest empty state. Do not restore deleted placeholder recipes.

```markdown
---
title: My everyday V60
method: V60
beans: Roaster, origin, roast date
dose_g: 15
water_g: 250        # the 1:16.7 ratio is computed for you
grind: medium-fine
temp_c: 94
time: "3:00"
steps:
  - "0:00 bloom 50g"
  - "0:45 pour to 150g"
  - "3:00 done"
photo: /assets/recipes/my-v60.webp # optional, your actual image
photo_alt: V60 brewer on the kitchen counter
photo_credit: Photo by Fadhil # optional
status: published # use draft to show Recipe coming later
notes: Anything worth remembering. # leave empty to hide the Notes section; the source link stays
source_name: Where the recipe came from # optional
source_url: Link to the original recipe # optional, shown as a clickable source link under Notes
comments: How the latest cup turned out # optional "Result note" in the CMS, shown under Notes as Result; edit it each brew
---
```

Start each coffee step with `m:ss` to power the "Start brew timer" button, which highlights the current step. Food recipes use `title`, `cuisine`, `serves`, `time`, `ingredients` (list), `steps` (list) and `notes`. Missing photos show a neutral "Photo coming later" panel, never a sample presented as your photo. Draft entries suppress specs/ingredients/steps until ready. Real photos appear on both category cards and entry pages. A Markdown body is optional and appears after the structured recipe.

### After Work design

The grid sticker gateway lives in `after-work/index.html`; only Coffee and Cooking are links. Cooking keeps `/after-work/food/` and `_food/` for URL/CMS compatibility. Category markup is shared in `_includes/after-work/category.html`; its title sticker and doodle (`sticker=`, `doodle=`) are names of files in `_includes/after-work/images/`. `assets/css/after-work-grid.css` is scoped to After Work and does not restyle About or site chrome. `after-work.css` holds recipe styles. Decorative WebP assets in `_includes/after-work/images/` (camera, tennis ball, headphones, laptop, tablet, two plants and three crayon doodles on the gateway; the sparkle and squiggle on category headings; the Coffee, Cooking and avatar cutouts). `heart.html` is kept but not currently shown are illustrative stickers, not recipe photos. Sticker positions are data, not CSS: see the next section.

Before opening a PR, run `node --test tests/*.test.mjs`, `bundle exec jekyll build` and HTML Proofer. Check gateway → both categories → a real recipe at 320, 390 and 1280px, plus empty categories, missing photos, keyboard focus, light/dark site chrome and reduced motion. No recipe content is shipped just for a screenshot.

## GitHub contribution roll (About)

The card under the About graph draws one note per day you made a public GitHub contribution, laid out like a piano roll: rows are weekdays, columns are weeks, and the colour runs teal, lilac, amber, coral from few to many that day (1-2, 3-4, 5-8, 9+, set in `LEVEL_BOUNDS` in `scripts/github-activity.mjs`). Colours are the site's `--l4`, `--l3`, `--l5`, `--l2` tokens, so light and dark follow the theme. Phones show the last 26 weeks. Tap or hover a note to read its date and count. When the card scrolls into view the notes pop in once, scattered but drifting left to right, never a loop, and not at all with reduced motion.

- **Data:** `_data/github_activity.json` is a snapshot of the public page `https://github.com/users/fadhilmch/contributions`. Only public activity counts; private repos never show.
- **Freshness:** the deploy workflow refreshes the snapshot before every build and once a day (04:17 UTC). If GitHub cannot be reached or its markup changes, the step fails quietly and the last committed snapshot stays. The card prints the snapshot date.
- **Refresh by hand:** `node scripts/update-github-activity.mjs [user]`, then commit the JSON.
- **Files:** include `_includes/about/contribution-roll.html`, style `assets/css/contribution-roll.css`, behaviour `assets/js/contribution-roll.js`, parsing `scripts/github-activity.mjs`, tests `tests/github-activity.test.mjs` and `tests/contribution-roll.test.mjs`.
- **Checks:** at 320, 390 and 1280px in light and dark, confirm the notes line up with the weekday letters, the status line is readable, and tapping a note shows its day.

## What not to edit

Do not edit `_layouts/`, `_includes/`, or `assets/` for normal content changes. They contain the site structure, styling, and behavior.

## Preview locally

Install Ruby 3.1 or newer, then run:

```bash
bundle install
bundle exec jekyll serve
```

Open <http://localhost:4000>. The development build also shows broken note-link warnings.

## Publish

Commit and push to `master`. GitHub Actions builds the site, runs HTML-Proofer, and deploys it to GitHub Pages. If a build fails, open the failed workflow run in the repository's **Actions** tab; the build step usually identifies the YAML, Markdown, or link that needs attention.

## Browser editing

For existing blog posts, use the [CMS setup and review guide](CMS.md). It edits full
source with syntax colors and a live preview (approximate, not Jekyll), including YAML front matter, HTML/SVG,
JavaScript and Liquid. Saves create review PRs and cannot publish from the CMS.
Keep using GitHub or your local editor for new post filenames, notes and assets.

### After Work layout editor

Positions, sizes, turns, stacking and visibility of every gateway sticker live in `_data/after_work_layout.json`, as one set for desktop (a 1000 x 680 unit board) and one for phones (350 x 760). The page scales the whole board, and phones get their own set below a board width of 660px.

- **Edit:** open `/after-work/?edit` (a normal page with an extra panel; the address is not a secret and is not a security boundary, because nothing it does can write to the site). Choose Desktop or Phone, drag a sticker, use the corner knob to resize and the top knob to turn. Arrow keys nudge, `+`/`-` resize, `[`/`]` turn. Undo, redo and "Reset to published" are in the panel. Hidden stickers are listed and can be added back.
- **Spacing check:** on every change the panel checks the visible outline of each sticker (not its box), at rest and in the hover state of Coffee and Cooking. Stickers must keep the gap shown in the panel (12 units desktop, 10 phone). Pairs that are meant to overlap, like the camera on Coffee, are listed under "Attached on purpose" (use "Mark as attached" next to a reported overlap). Publish stays blocked while either layout has a problem.
- **Save draft** keeps your work in this browser only. Visitors always see the published file.
- **Save through the site editor (preferred):** in `/admin/`, open "After work layout" and use the same visual editor inside the field. Save opens a review pull request with your normal editor login, exactly like other CMS content, and is blocked while either layout has a spacing problem. Nothing goes live until the pull request is merged. The field loads the layout from the CMS entry, so an open draft PR continues where you left off.
- **Publish from `?edit` (fallback):** the panel copies the new layout and links to GitHub's editor for `_data/after_work_layout.json`. Paste, choose "Create a new branch and start a pull request", review, then merge. This uses your GitHub login and not the CMS.
- **Add a sticker:** put its WebP data URI in `_includes/after-work/images/NAME.html`, run `python3 scripts/build-after-work-shapes.py` (needs Pillow; add NAME to its list first), then add an item with both layouts to the JSON. The outline masks in `assets/data/after-work-shapes.json` are 96 columns wide, so they are an approximation that errs on the safe side.
- **Visitors:** stickers are static and the header icon swaps between an open and a closed laptop picture, and shows a half-open laptop on hover or focus (an instant swap for reduced motion). Replace the SVG files (each wraps a PNG) in `assets/images/ui/` to change the art; keep the same file names and similar proportions so the header stays the same size.
- **Code:** `assets/js/after-work-layout.js` (geometry), `after-work-edit-state.js` (history and export), `after-work-editor.js` (panel, loaded only with `?edit`), `after-work-terminal.js` (subtitle typing); tests are in `tests/after-work-layout.test.mjs`.
- **Sticker effects:** `assets/js/after-work-fx.js` adds a staggered entrance, a short shake when a sticker is clicked or tapped (Coffee and Cooking still open at once), and a soft pointer tilt with moving shadows on devices with a mouse. All of it is off for reduced motion and while editing (`?edit`). Styles are at the end of `assets/css/after-work-grid.css`. A new doodle needs an entry in `ASSETS` in `scripts/build-after-work-shapes.py`; run it to rebuild `assets/data/after-work-shapes.json`.

### Now rows and graph motion

Use `_data/profile.yml` to change the About inspector's Now rows. Rows accept
`k`, `v` and optional `href`; adding Learning requires no layout change.
Keep external links as complete HTTPS URLs, including the Tom Misch Spotify
artist link. Coffee and food recipes remain in their own collections.

The draggable workflow keeps its solid edge and ambient flow paths aligned.
Use Reset layout to return nodes to their starting positions. Test desktop
and mobile, plus normal and reduced-motion settings before merging changes.

Illustration WebPs are embedded as data URIs in `_includes/after-work/images/`
to support text-editor commits. Keep those bytes unchanged when editing templates.
