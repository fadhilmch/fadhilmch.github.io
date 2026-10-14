# Blog source editor

## Scope and design

This setup lists the 21 existing `_posts/*.md` files. It uses Sveltia CMS
0.233.0, token login and Editorial Workflow. One field edits the entire file,
including front matter. There is no rich-text conversion, HTML execution in the
editor, or structured front matter rewrite. Two display-only helpers sit on top
(see the next section). An earlier highlighted code widget was rejected after
browser QA found unstable edit state; the colors here work differently, so the
edited value is still a plain `<textarea>` string.

File collections are deliberate: they keep existing filenames fixed and display
human-readable titles. If a file or title changes outside the CMS, update its
entry in `admin/config.yml` as a review PR. The config is JSON syntax, which is
valid YAML. New posts, notes and assets remain in the GitHub/local editing flow.
Never point this setup at TenisYuk or add its database credentials here.

## Syntax colors and live preview

**Colors.** The source box is a normal textarea. A read-only copy of its text is
drawn behind it, colored by `admin/highlight.mjs` (front matter keys and strings,
Markdown headings/lists/code/links, HTML tags and attributes, inline `<script>`
and `<style>`, comments and Liquid). The textarea text is transparent, so you see
the colors and type in the real field. Untick **Colors** above the box to get the
plain textarea. Colors never write back: a test joins the tokens of all 21 posts
and requires the exact source. The box keeps its own copy of the text while you
type and only adopts a value the CMS did not get from you (reload, restore after
Later). Without this the caret jumped and keys were lost, because the CMS hands
the value back a moment after each key.

**Preview.** The Preview pane (the eye button on mobile) renders the source in an
iframe with the site's own CSS, front matter header and tags. It updates about
a third of a second after you stop typing and keeps its scroll position.

- **Static** (default): scripts removed, frame sandboxed. Widgets look inert.
- **Interactive**: the post's own scripts run in a frame with an opaque origin
  (`sandbox="allow-scripts"` only). It cannot read the admin page, your token in
  local storage or the repository. It reloads from the top on edits.
- **Approximate.** Markdown is rendered by `marked` (vendored in
  `admin/vendor/`, MIT) instead of kramdown, and Liquid is not run. Only
  `{{ '/path' | relative_url }}` is resolved so images show. Every other Liquid
  tag is a grey chip, `{% raw %}` blocks show literally. Kramdown extras
  (`{: .class}`, `markdown="1"`), the site header/footer, reading time, prev/next
  links and KaTeX are not reproduced. The PR build is still the real check.
- Fonts and any scripts' own network requests need internet access.

Neither helper changes the saved file. The preview reads the draft and builds a
separate document; nothing from it is written to the post.

## Start using it after merging the setup PR

1. Wait for the Pages deployment to pass, then open `/admin/index.html` on the
   site. This route is not live until the setup PR is merged and deployed.
2. In GitHub Settings > Developer settings > Personal access tokens >
   Fine-grained tokens, create a new token with an expiry. Select resource owner
   `fadhilmch`, **Only select repositories**, then `fadhilmch.github.io` only.
3. Give **Contents: Read and write** and **Pull requests: Read and write**.
   Metadata read permission is automatic. Do not use a classic token or grant
   access to all repositories. No OAuth app or helper server is needed.
4. Click **Sign In with Token** in the CMS. Paste the token there, not in chat,
   source files, screenshots or PR descriptions. Sveltia stores it in browser
   local storage. Use a trusted browser/device; sign out on shared devices and
   revoke the token in GitHub when no longer needed or if the device is lost.
5. Open Blog posts and choose an existing post. Edit the full source field.
   **Save** creates a draft PR on a `cms/posts/...` branch. **Send for Review**
   changes its review status; it does not merge it.
6. Review **Files changed** on GitHub. Confirm only the intended post changes,
   the base is `master`, widgets/links remain intact, and both checks pass.
   Merge there only when satisfied. Pages then builds and deploys as before.

## Safety boundaries

`publish: false` and `delete: false` hide publishing and deletion controls.
The required media folder points under `admin`, which Sveltia reserves as
read-only, so the Asset Library cannot make direct asset commits. No image/file
fields or writable asset collections are configured. Notes and settings are not
exposed. These are UI/workflow safeguards, not a GitHub permission sandbox:
a Contents-write token can write anywhere in this one repository. `master` is
currently unprotected. Enforced branch protection would require a separate
account/rules decision; this setup does not change repository settings.

## Basic checks, no preview service

The pre-save hook checks front matter delimiters, nonempty layout/title/date/
summary, layout `post`, a date-shaped value, nonempty body and LF/outer whitespace.
It is a convenience check, not a complete YAML parser, security scan or renderer.
The PR build is authoritative for YAML/Jekyll correctness. PR Actions run the
real Jekyll build and the same internal-link html-proofer check used by deploy.
External links, visual widget behavior and factual content still need review.
No preview deployment, OAuth helper or new paid service is added.

## Byte preservation and worked example

Sveltia's raw parser trims outer whitespace and normalizes CRLF to LF; the raw
serializer adds one final newline. All 21 current post files already follow this
convention. A dependency-free test checks every real file, changes/restores its
title and compares exact strings, including HTML, SVG, JS and Liquid. Arbitrary
future files with extra outer blank lines or CRLF are not byte-preserved; fix
those outside the CMS first. Interior spaces and blank lines are preserved.

Browser QA used the real PlanOut post with inline SVG and three JS widgets,
against an in-memory GitHub API fixture (no real token, no production content
writes): change the title from "Deconstructing PlanOut: a coin toss you can
repeat" to "Deconstructing PlanOut: a repeatable coin toss", Save, and inspect
the draft PR. The expected diff is only the title line. The fixture verifies the
saved source exactly and `master` unchanged. Restoring the title produces the
original file byte-for-byte. Do not confuse this fixture test with a live GitHub
PAT test; first real sign-in and save require your token after deployment.

Browser QA for the colors and preview (same in-memory fixture, real Sveltia
0.233.0 bundle, headless Chrome): for each of the 21 posts, type a marker into
the title in the colored editor, confirm the preview shows it, Save, and compare
the PR file with the original plus that marker. All 21 were exact and `master`
was unchanged. On PlanOut: fast typing mid-file, toggling Colors, deleting the
typing, Save, reopen the draft, remove the one character, Save again, and the
PR file equals the original byte-for-byte. The Interactive frame reported origin
`null`, blocked access to the parent and to local storage, and ran the widgets.

## Maintenance and recovery

Run `node --test tests/*.test.mjs` on Node 22 before changing config or upgrading
Sveltia. Upgrade the exact CDN version only in a PR, repeating browser Save,
restore, desktop/mobile and inert-widget checks. Do not use `latest` in the CDN
URL. If the CDN is unavailable, the editor will not load; the public site and
GitHub/local editing remain available. A third-party editor script on this origin
can access its token, so version pinning and reviewing admin changes matter.

A save with Contents but no Pull requests permission can create a workflow branch
then fail to open the PR. Fix the token permissions and retry; do not merge the
branch blindly. When a conflict appears, reload and review the newer source
instead of choosing Save Anyway without checking it. Discard closes an
unpublished change; it does not remove the published file. If deployment fails,
inspect Actions and repair in a follow-up PR, never by emptying a post body.

References: Sveltia [GitHub backend](https://sveltiacms.app/en/docs/backends/github),
[Editorial Workflow](https://sveltiacms.app/en/docs/workflows/editorial),
[raw formats](https://sveltiacms.app/en/docs/collections/entries/formats),
[read-only CMS folders](https://sveltiacms.app/en/docs/ui/asset-library).
