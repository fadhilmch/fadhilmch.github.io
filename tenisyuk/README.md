# TenisYuk

Static page, no build step. Served as-is by GitHub Pages.

- `index.html` - page shell
- `style.css` - styles (light and dark)
- `js/wordmarks.js` - logo images as data URIs
- `js/edits.js` - admin edits as pure functions (toggle paid, add, delete, undo, rollback)
- `js/money.js` - money math and recap text (pure functions, no DOM)
- `js/app.js` - screens, data loading and admin actions
- `config.js` - public Supabase URL and publishable key
- `tests/money.test.js`, `tests/edits.test.js` - tests for the money math, dates, who-owes card and edits

Run the tests (Node 18+, no install needed):

    cd tenisyuk && node --test tests/*.test.js

Rules the tests lock in: kas is 5 kr per person only; membership is billed minus the real booking only; the two are always separate.


Validation errors on the Cash form (empty or zero amount) show as a floating red alert at the top (`showAlert` in `js/app.js`, `.alertbar` in `style.css`), auto-dismiss after 4 seconds or on tap. The amount field keeps its red border.

Tabs: Sessions, Stats, Owed (who still owes Fadel, tap a name to pay with Swish), Cash (kas, membership, cash flow, admin entries), Share.
