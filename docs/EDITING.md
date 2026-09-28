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

Edit `_data/profile.yml` for your name, role, location, headline, bio, current focus, and off-hours interests. `short_role` and `city` are the short versions shown under your name in the header and in the footer ("ML engineer · Stockholm").

`_data/stats.yml` holds outcome tiles. The current design does not show them; they are kept for later:

```yaml
- value: "6,000"
  label: monthly employees on the assistant I help run
```

Keep values quoted when they contain punctuation, a percent sign, or a leading zero.

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

The profile location is intentionally written literally in `_data/workflow.yml` so the workflow file stays easy to read; update it there if the location changes.

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

Posts use their raw `tags`; notes use one raw `tag`. A matching lane decides where each item appears and which colour it uses. `color` is one of `l0`, `l1`, `l2`, `l3` or `fg`.

Each raw tag also needs a display label in `_data/tags.yml`; that file's order is the order of groups in the Notes explorer:

```yaml
- key: research
  label: Research
```

A lane with `branch: false` (like `meta`) groups notes in the explorer but gets no filter chip on Posts and no footer entry.

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
