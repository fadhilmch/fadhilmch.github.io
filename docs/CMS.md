# Site editor

Open `/admin/index.html` to edit content with the pinned Sveltia CMS 0.233.0.
The editor uses a repository-scoped GitHub token. Saves create review PRs against
`master`; merge those PRs on GitHub after the checks pass. Publishing and file
deletion controls remain disabled in the editor.

## Content available

| Collection | What you can edit |
| --- | --- |
| Blog posts | Existing posts and new posts, including embedded HTML, JavaScript, SVG and Liquid |
| About | Profile, bio, interactive bio links, greetings, Now rows and topic lanes |
| Experience | Roles, organizations, locations and descriptions |
| Education | Degrees, institutions, dates and countries |
| Skills | Groups, tools, descriptions, selected work and visibility |
| Projects | Project cards and case studies, repository/post links, image paths and captions |
| Publications | Papers, authors, venue and DOI links |
| Contact | Email and social links |
| Coffee | Create and edit brew recipes, doses, water, temperature, steps and notes |
| Food | Create and edit recipes, ingredients, servings, steps and notes |

Coffee and food start empty. Adding CMS support does not recreate removed posts.
Notes and asset uploads still use GitHub or local editing. Image fields accept
paths to existing assets. The editor does not manage TenisYuk or credentials.

## Sign in and save

1. Create a fine-grained GitHub personal access token restricted to
   `fadhilmch/fadhilmch.github.io`, with Contents and Pull requests read/write.
2. Choose **Sign In with Token** in the editor. Paste the token in that dialog,
   not in source files or chat. Sveltia stores it in your browser's local storage.
3. Open a collection and edit an entry. About and project data use structured
   forms; blog articles retain the full-source textarea.
4. Save to create or update the entry's draft PR. Send for Review updates its
   review status; it does not publish the site.
5. Review the diff and checks on GitHub, then merge there. Pages builds and
   deploys from `master` as before.

The GitHub token can write throughout this one repository; collection settings
control the editor UI, not GitHub token permissions. Use a trusted browser and
revoke an expired or lost-device token through GitHub.

## Create a post

Choose Blog posts → Create new, then edit the supplied source template. Set the
title, date, summary and article body in that source. Set the new filename in
the sidebar’s Slug panel as `YYYY-MM-DD-slug` (without `.md`), for example `2026-10-14-my-new-post`. Keep its date consistent with the
front matter. The filename control is editable during creation. Existing post
filenames stay fixed when you change their titles. Posts added outside the CMS appear automatically.

One final newline is accepted. Extra outer blank lines and CRLF line endings
are rejected before saving; interior formatting remains intact.

## About and project forms

Experience, education, skills, lanes, publications and contact files are YAML
arrays. The forms use root lists so saves keep their top-level array shape.
Projects use the same pattern for `_data/portfolio_projects.json`; its list can
add or remove project entries within a reviewed file change.

Keep stable keys and IDs intact, since graph links and project anchors use them.
Skills and Lanes keep their keys hidden, so those two lists cannot add, duplicate
or remove items in the editor; hide one with its visibility flag instead, or add
one in GitHub with a new key. To restore Product design, enable it under Skills
and enable its topic lane under About → Lanes. Both are currently disabled.
Missing visibility flags mean visible; form defaults reflect that existing site
behavior, so the first save writes `enabled: true` and `branch: true` explicitly.

Structured YAML saves may normalize formatting and remove YAML comments. Review
the resulting values and diff. The editor double-quotes strings, because Jekyll
reads a plain `2:30` as a number, and it omits blank optional fields, because
Liquid treats an empty string as true. The full-source post editor preserves the article
source instead of converting it to rich text.

## Source colors and post preview

The source field is a normal textarea with a read-only syntax-colored layer.
Turning Colors off shows the plain textarea. Neither colors nor preview writes
back into the post.

The post preview is approximate: it renders Markdown using the vendored `marked`
parser, not Jekyll/kramdown. It resolves simple `relative_url` expressions but
shows other Liquid as placeholders. It omits some site chrome and kramdown
extensions. PR checks build the real Jekyll site; PR preview hosting is not
configured.

Static preview disables scripts. Interactive preview runs the article's scripts
inside a sandboxed iframe with an opaque origin, without access to the admin
page or its token. Fonts and requests from article scripts may need internet.

## Configuration and checks

`admin/content-collections.mjs` defines the structured content forms.
`admin/config.yml` contains their generated configuration and the posts collection.
After changing a structured form, regenerate the served config:

```bash
node scripts/sync-cms-config.mjs
node --test tests/*.test.mjs
bundle exec jekyll build
bundle exec htmlproofer _site --disable-external --ignore-missing-alt
```

CMS PR checks cover posts, data, coffee, food, templates, assets and editor files.
They run source checks, build Jekyll and check internal links. They do not
validate article facts or external links.

Keep the Sveltia CDN version pinned. Before an upgrade, check post source
round trips, new-entry creation, root-list forms, save/reopen behavior and both
preview modes. If an entry conflicts with a newer GitHub edit, reload and review
that edit before saving again. If a save creates a branch but fails to open a PR,
check the token's Pull requests permission before retrying.

References: [Sveltia entry collections](https://sveltiacms.app/en/docs/collections/entries),
[file collections](https://sveltiacms.app/en/docs/collections/files),
[Editorial Workflow](https://sveltiacms.app/en/docs/workflows/editorial).
