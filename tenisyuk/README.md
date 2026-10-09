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

Motion: the Owed tab's collected/still-owed bar grows left-to-right to its existing proportions in 450ms (`ty-grow`, ease-out) when rendered. Other bars are unchanged. With `prefers-reduced-motion: reduce`, it appears at full size immediately.


Tennis theme: faint court lines sit behind the cards; section headings keep their original icons with small net dividers. Plus Jakarta Sans + Inter and finance labels stay unchanged. A seamed tennis ball marks the collected/still-owed boundary on Owed and the paid/owed Stats bars only. It stays inside the track at 0% and 100%, and is hidden for zero-total bars. The bar lengths and money calculations are unchanged. The ball follows the existing Owed grow animation; reduced motion still disables all animations. Decorative elements are hidden from assistive technology and never intercept taps.

Visual check: preview Owed, Stats and Cash at 390px in both themes; check 0%, mixed, 100% and zero-total bars, long numbers, empty data and reduced motion. Use demo data, not production access codes, for screenshots.

Mini tennis: tap the plain 🎾 in the header. Serve starts play, drag left/right on the court to move your racket, or use arrow keys and Space. Every return adds to the rally; best score is stored only on the device as `ty_tennis_best`. Pause, tab switching and Close stop the game loop. Reduced-motion users get slower play, with no automatic start or decorative motion. The native dialog traps focus, Escape closes it and focus returns to the header button. `js/tennis-game.js` and `game.css` are isolated from money math and make no network requests. Unit tests cover wall/top returns, paddle hits, misses, zero delta, frame-delta cap and slower play.
