# Blog source editor

## Scope and design

This first setup lists the 21 existing `_posts/*.md` files. It uses Sveltia CMS
0.233.0, token login and Editorial Workflow. A plain-text field edits the entire
file, including front matter. There is no rich-text conversion, HTML execution,
structured front matter rewrite or Jekyll preview in the editor. The highlighted
code widget was rejected after browser QA found unstable edit state; the native
text field has a smaller failure surface and passed the Save test.

File collections are deliberate: they keep existing filenames fixed and display
human-readable titles. If a file or title changes outside the CMS, update its
entry in `admin/config.yml` as a review PR. The config is JSON syntax, which is
valid YAML. New posts, notes and assets remain in the GitHub/local editing flow.
Never point this setup at TenisYuk or add its database credentials here.

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

## Maintenance and recovery

Run `node --test tests/cms.test.mjs` on Node 22 before changing config or upgrading
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
