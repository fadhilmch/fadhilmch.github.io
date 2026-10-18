# fadhilmch.github.io

Personal site of Fadhil Mochammad, an ML engineer in Stockholm. Live at https://fadhilmch.github.io.

## What's on the site

- **About**: a hero with a circular avatar, then a node pipeline built from `_data/workflow.yml`. Click a node to inspect it. The soft-depth layer adds a circle-clipped avatar shadow and an always-visible workflow with a travelling flow accent (with reduced-motion support).
- **GitHub activity**: under the About graph, a colour piano roll of public GitHub contributions over the past year, from a snapshot refreshed on every deploy ([guide](docs/EDITING.md#github-contribution-roll-about)).
- **Posts**: dated essays, grouped by year and filterable by topic lane.
- **Notes**: a working reference of decision rules, gotchas and defaults, kept as a linked vault with an explorer, backlinks and a force-directed graph.

## How it's organised

All content lives in `_data/*.yml`, `_posts/` and `_notes/`. Layouts, includes and assets hold no content. [docs/EDITING.md](docs/EDITING.md) has the full guide; the short version:

| I want to... | Edit |
| --- | --- |
| Publish a post | add `_posts/YYYY-MM-DD-slug.md` |
| Add a note | add `_notes/<id>.md` |
| Change bio, role or location | `_data/profile.yml` |
| Replace the About avatar | `assets/css/avatar-images.css` (embedded WebPs; see [guide](docs/EDITING.md#soft-depth-and-motion)) |
| Add a job, degree, project or paper | `_data/experience.yml`, `education.yml`, `projects.yml`, `publications.yml` |
| Add a toolkit or workflow node | `_data/skills.yml`, `_data/workflow.yml` |
| Add a coffee or food recipe | add `_coffee/<slug>.md` or `_food/<slug>.md` |
| Add or recolour a topic lane | `_data/lanes.yml`, `_data/tags.yml` |

## Project structure

```text
_data/      content as YAML (profile, workflow, experience, skills, lanes, ...)
_posts/     essays in Markdown
_notes/     linked notes in Markdown
_layouts/   base, page, post and note layouts
_includes/  head, header, footer, and workflow / notes / posts partials
assets/     hand-written CSS (depth.css is the opt-in soft-depth layer), vanilla JS, images, favicon
docs/       editing guide and implementation plan (not published)
scripts/    content validation, data migration and GitHub activity snapshot helpers (not published)
_archive/   design reference mockup and screenshots (not published)
index.html  About page
posts.html  Posts page
notes.html  Notes entry page
.github/    GitHub Actions workflow for build and deploy
```

## Local development

Requires Ruby 3.1 or newer.

```bash
bundle install
bundle exec jekyll serve
```

Open http://localhost:4000. To run the check CI runs:

```bash
bundle exec jekyll build
bundle exec htmlproofer _site --disable-external --ignore-missing-alt
```

## Deployment

Pushing to `master` triggers `.github/workflows/pages.yml`, which builds with Jekyll 4, runs html-proofer and deploys to GitHub Pages. The repository's Pages source must be set to "GitHub Actions".

## Tech

Jekyll 4 with `jekyll-feed`, `jekyll-seo-tag` and `jekyll-sitemap`. Hand-written CSS (native nesting, custom properties) and vanilla JavaScript, set in Geist and Geist Mono. No npm, no framework.

## Design

Direction "Workflow v2". The reference mockup is in `_archive/design-reference/` and is excluded from the build.

## License

Content © Fadhil Mochammad. All rights reserved.

## Site editor

The `/admin/index.html` page uses pinned Sveltia CMS 0.233.0. It supports new
and existing blog posts, About content, experience, education, skills, projects,
publications, contact details, and coffee/food recipes. Articles keep the full
source editor with syntax colors and a sandboxed preview. Other content uses
structured forms. Notes and asset uploads use GitHub/local editing.

Sign in with a repository-scoped fine-grained GitHub token. Saves create review
PRs against `master`; merge reviewed PRs on GitHub. Publishing and file deletion
controls are disabled. See [the CMS guide](docs/CMS.md) for setup and limitations.

After editing structured form schemas, regenerate the served config and run checks:

```bash
node scripts/sync-cms-config.mjs
node --test tests/*.test.mjs
```

PR checks also build Jekyll and check internal links. They do not deploy previews.

## Explorable About and After work (PR48)

The greeting cycles through Hi, Hej and Halo. Bio links open workflow inspectors;
workflow nodes support dragging, reset and a run animation. The ambient flow
paths follow dragged nodes. Reduced-motion settings stop the animated greeting
and ambient motion. After work keeps the coffee and food recipe collections.

Edit the Now rows in `_data/profile.yml`. Each row has `k` (label), `v` (text),
and optional `href`. The Learning row is data-driven, not a separate component.
The listening row links to Tom Misch's verified Spotify artist page.

Conflict QA: `node --test tests/cms.test.mjs`, JavaScript syntax checks, and
desktop/mobile browser checks of drag/reset, matching edge/flow geometry, Now
links and overflow. Local browser screenshots use a Liquid-rendered About
harness; they are not a deployed Jekyll build. Jekyll/html-proofer still need
the Ruby build environment before merge.

## After Work grid gateway

After Work uses an illustrated sticker gateway, then Coffee/Cooking category lists
and image-led recipe pages. Only those two interests are links. Cooking retains
`/after-work/food/` and `_food/` for existing URLs and CMS compatibility.

After Work follows the lamp. Dark mode keeps the deep-green theme on every page.
In light mode the gateway and category lists switch to the same warm-paper light
theme as the recipe detail pages (shared tokens in `assets/css/after-work-grid.css`),
and the collage sticker shadows soften on the light ground. The dock tray keeps
its dark frosted look in both themes.

Content comes from `_coffee/` and `_food/`; empty collections stay empty. Add an
optional `photo`, `photo_alt`, `photo_credit` and `status` to recipe front matter.
Missing photos show a neutral placeholder; draft recipes are labelled incomplete.
The decorative cutouts are illustrations, not the owner's actual recipe photos.

Recipe pages use a charcoal spec sheet in dark mode and a warm-paper sheet when
the lamp theme is on, with Geist titles, compact stat cards (coffee shows dose,
water, ratio, grind, temperature and method), a checklist ingredient list that
keeps a running count, and timed steps laid out as a clock (`m:ss` or `n min`
tokens become chips and drive the brew timer on coffee pages). On phones,
Cooking pages switch between Ingredients and Method tabs.

The gateway title ("After work" and the arrow) fades in word by word once, unless reduced motion is on. Stickers are base64 WebP includes in `_includes/after-work/images/`; after adding one, run `scripts/build-after-work-shapes.py` and keep the layout test passing. Loose stickers can be dragged (`assets/js/after-work-play.js`, `assets/js/after-work-physics.js`).
Shared templates live in `_includes/after-work/`; the scoped grid/sticker layer is
`assets/css/after-work-grid.css`. About, site navigation and the default branch
are not part of this design change. See [the editing guide](docs/EDITING.md#after-work-design).

Illustration WebPs are embedded as data URIs in `_includes/after-work/images/`
to support text-editor commits. Keep those bytes unchanged when editing templates.

The gateway scene is driven by `_data/after_work_layout.json` and edited at `/after-work/?edit`
(desktop and phone layouts, outline-based spacing checks, publish through a pull request).

Inside After Work the primary About/Posts/Projects/Notes pill is replaced by a floating bottom dock (`_includes/after-work/dock.html`, rendered from `_layouts/base.html`; the pill is skipped in `_includes/header.html`): soft-3D icons for After work home, Coffee and Cooking (`assets/images/ui/aw-nav-*.svg`, the supplied PNG artwork embedded losslessly in SVG wrappers so the icons stay text-commitable) with a small rounded, softly raised underline centred under the current page's icon body (recipes count as their category; the icon artwork is optically centred so asymmetric shapes like the cup and pan handles sit balanced). The tray is frosted glass where `backdrop-filter` is supported and plain transparent floating icons where it is not. Desktop hover magnifies the icon and shows a label above it; a tap plays a quick squash-and-spring (transform only). The dock clears the phone home bar via safe-area inset, and page bottom padding lets the last content scroll fully clear of it. Reduced motion removes the magnification and the press animation. The tray keeps its dark frosted glass on the list pages in both site themes and turns warm paper on light recipe pages. Styles: `assets/css/aw-dock.css`.
The header name reads "Fadhilmch." (18px, with "mch" in the muted color) on every page with no subtitle; the footer keeps the full name. Styles are `.brand__name` and `.brand__muted` in `assets/css/base.css`.
The header has two framed tiles side by side, after the nav pill (`.header-tools` in `_includes/header.html`): a laptop switch and the lamp theme button. They share one frame (`.theme-toggle, .mode-toggle` in `assets/css/base.css`) with the same 1px outline as the nav pill. The laptop is an open picture on the main site and a closed one on After work; hover or keyboard focus shows a half-open laptop. The laptop picture is 28x24 inside the 44px tile so it has padding (`assets/css/mode-toggle.css`). The lamp is a recessed (pressed-in) tile (a pale, very soft inset on light pages; After work always keeps the dark version), unlit in light mode and lit in dark mode (the glow comes from the bulb only). On phones the tiles sit top right beside the brand and the nav pill is full width below. In dark mode the M (wave) in the logo glows and warms up once on load; reduced motion skips the warm-up. The pictures are in `assets/images/ui/`.
Coffee and Cooking category pages sit tighter under the header: the page top padding is 8px (6px on phones), and the title block has 12px below it (`assets/css/after-work-grid.css`).
The After work gateway subtitle reads "Welcome to my life after work." and is typed once (reduced motion shows it at once). The space above the title is set by `.aw-page--gateway` and `.aw-head` in `assets/css/after-work-grid.css`.
The Coffee and Cooking labels on the gateway are cream pills with an arrow ("coffee →", "cooking →"), always visible 12px below the art. They use the old hover-tag look (`.aw-label` in `assets/css/after-work-grid.css`) and the text lives in the `tag` field of `_data/after_work_layout.json`. `--aw-pill-shift` is a named optical offset per sticker (Coffee is -8% because its handle widens the image box). On hover and keyboard focus the sticker stays still and only the pill reacts: it lifts 3px, grows 10%, turns pink-cream (`#ffe1d6`) and its shadow deepens; a tap/press gives a smaller version. Reduced motion removes the transition. The `#aw-cut` filter in `after-work/index.html` and the Oswald load in `_includes/head.html` are no longer used by these labels.
Header QA: run `node --test tests/*.test.mjs` (`header-icons`, `nav-lamp` and `after-work` cover the tiles), then look at the home page and After work in light and dark at desktop width and about 390px: both tiles the same size and outline, laptop picture not touching the frame, hover shows the half-open laptop. Details:
[layout editor](docs/EDITING.md#after-work-layout-editor).
