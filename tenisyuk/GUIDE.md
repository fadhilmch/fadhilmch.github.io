# Versioned saves and read-only access

Status: prepared, not applied. Merging the page alone does NOT update Supabase.
No live amounts, codes, keys or capabilities are changed by this PR.

## Review example

Two pages load version 7 with Budi owing 50 kr. Page A marks Budi paid and saves.
The database returns a newer version. Page B adds a session using version 7.
It gets `conflict`, writes nothing, reloads current data and asks for review.
Budi stays paid. No automatic merge or retry.

In admin mode, expand a session and tap **Edit fronted**. Enter the new amount
(comma decimals work). The confirmation shows old/new fronted and membership,
and states that billed and each player's price stay unchanged. Cancel writes
nothing. Example only: 25 Sep, billed 595, seven players, fronted 455 to 475:
players still pay 90 each, membership 140 to 120. This PR does not perform it.
Undo uses the current page version, so it cannot replace a newer page's work.
A save in progress blocks further edits. A lost response is an unknown outcome,
not proof that nothing changed. Reload and review; do not blindly retry.

## Database change

`sql/001-versioned-saves.sql` is an unapplied, one-time migration. It moves the
existing full-snapshot writer into a private helper, preserving its validation,
soft deletions, one-removal limit and audit behavior. The public legacy writer
returns `upgrade_required`, never writes. `admin_save_v2` locks one revision row,
compares the caller's version, then calls the old helper. Statement triggers on
sessions, tx, venues and settings advance the revision in the same transaction.
Versions are opaque decimal strings, not timestamps or JavaScript numbers.
`get_recap` locks the revision while building a consistent snapshot. The bot
has only `bot_sessions` and `bot_summary`; there are no bot write endpoints.

The bot sends the existing public publishable key plus a separate random token
in `p_token`. Tokens are not Supabase secret keys, service_role keys, viewer
codes or admin codes. Store only a SHA-256 token hash, explicit read scopes,
expiry and revocation in the private capability table. Generate at least 32
random bytes (43+ base64url characters) later, after approval, with a secure
secret handoff. Never put the raw token in chat, GitHub, URLs, logs or client
config. This migration inserts NO capabilities. Summary returns counts and
financial totals; sessions returns dates, amounts, names and paid flags, but
not Swish, credentials, audit or removed records. Approve that disclosure scope
before provisioning or connecting a bot. Separate scope checks mean summary-only
access cannot read session names. Invalid tokens use a separate IP/global guard
with the existing five-failure, fifteen-minute lockout pattern.

## Required before approval to apply

1. Export/back up the current data and function definitions securely. Verify
   the actual production grants, default privileges, function owners, trigger
   definitions and crypto extension schema. These are NOT fully verified by
   the dashboard review. Confirm no other exposed function writes or bypasses
   the new guard; inspect all routes, not only the page. Confirm `tenisyuk` is
   not an exposed API schema and anon/authenticated cannot access its objects.
   Existing RLS is disabled; explicit grants are therefore load-bearing.
2. Compare the production helper code with the inspected behavior. Confirm all
   known entry points still use code verification, and all data-changing tables
   are included by revision triggers. Check definer ownership and fixed search
   paths. New code intentionally rejects application if required helpers or
   `extensions.digest(text,text)` are missing. Never relax that check blindly.
3. Apply to a separate test database first. Test real pgcrypto with no stubs,
   exact ACLs under anon/authenticated, valid/invalid/expired/revoked tokens,
   wrong scopes, lockouts, old clients, bad documents and the one-removal rule.
   Run two REAL database connections racing saves, including direct maintenance
   edits, and verify one cannot undo the other. Test backup and rollback there.
4. Approve the database change separately from merging this PR. Migration first
   immediately blocks old page writes. Deploy/merge the new page promptly and
   refresh ALL open admin pages. Until both steps complete, edits can fail safely.
   Verify PostgREST sees the new functions and grants. No data edits are part of
   deployment. Verify from two refreshed pages before returning to normal use.
5. Bot provisioning/connection is another approval: choose scopes, expiry and
   storage destination. This PR contains database access boundaries only, NOT
   a personal-agent tool implementation or a configured running connection.

## Rollback

Keep the version guard, even if bot access is revoked. Revoke capabilities first
if access must stop. Restore a reviewed backup only under a separate maintenance
approval. Do NOT restore the unsafe public snapshot writer while any stale
client can save. This migration is not idempotent; a second apply fails instead
of silently replacing existing objects. Keep migration history.

## Tests and limits

`node --test tests/*.test.js`: money, edits and sync boundary tests. The sync tests
cover conflicts, missing versions, a lost response, reload failures and fronted
edits preserving billed/charges. A local PGlite PostgreSQL fixture compiled the
migration, exercised the stale-page example, old endpoint rejection, scope and
revocation checks, summary math and denied anon table/helper access. Crypto was
stubbed in that fixture, so it does NOT prove production pgcrypto or concurrent
connection behavior. Staging and live ACL/trigger checks above remain required.

Reproduce the local SQL fixture (Node 20+, installs test-only dependencies):

    cd tenisyuk
    npm install --no-save --package-lock=false @electric-sql/pglite@0.5.8
    node tests/sql-regression.mjs

The fixture includes inspected code-only baseline functions and fabricated
schema/data, not live codes or hashes. Do not run it against Supabase.
