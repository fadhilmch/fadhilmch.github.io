# fadhilmch.github.io

Personal site of Fadhil Mochammad, an ML engineer in Stockholm. Live at https://fadhilmch.github.io.

## What's on the site

- **About**: a hero with a circular avatar, then a node pipeline built from `_data/workflow.yml`. Click a node to inspect it. The soft-depth layer adds a circle-clipped avatar shadow and an always-visible workflow with a travelling flow accent (with reduced-motion support).
- **Posts**: dated essays, grouped by year and filterable by topic lane.
- **Notes**: a linked vault with an explorer, backlinks and a force-directed graph.

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
scripts/    content validation and data migration helpers (not published)
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

## Blog source editor

The `/admin/index.html` page uses pinned Sveltia CMS 0.233.0 with a plain-text,
full-source editor. It covers the 21 existing posts only. Notes, site settings,
TenisYuk and asset uploads are intentionally outside this first setup.

Sign in with a fine-grained GitHub token limited to this repository. Saves open
review PRs against `master`; publishing and deletion controls are disabled.
Merge reviewed PRs on GitHub, not in the editor. The token stays in your browser's
local storage, never in this repository. See [the CMS guide](docs/CMS.md) for
setup, the worked example, checks and known limits.

Run the dependency-free source checks with Node 22:

```bash
node --test tests/cms.test.mjs
```

PR checks also build Jekyll and run html-proofer; they do not deploy previews.
