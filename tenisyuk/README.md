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

Mini tennis: tap the plain tennis ball in the header. Serve starts play, drag left/right on the court to move your racket, or use arrow keys and Space. Every return adds to the rally; best score is stored only on the device as `ty_tennis_best`. Pause, tab switching and Close stop the game loop. Reduced-motion users get slower play, with no automatic start or decorative motion. The native dialog traps focus, Escape closes it and focus returns to the header button. `js/tennis-game.js` and `game.css` are isolated from money math and make no network requests. Unit tests cover wall/top returns, paddle hits, misses, zero delta, frame-delta cap and slower play.

The header launcher keeps the standard 🎾 emoji, plain with no box. The game title uses an inline SVG tennis ball. Header control stays plain with a 44px tap target. In-game rackets are simple solid rounded paddle bars. Rally rules stay unchanged.

Aim returns by where the ball hits the racket: left/right of center sends it that way, center is straighter. Moving the racket at contact adds direction; that influence fades quickly when held still. Horizontal speed is capped, rally scoring and opponent returns are unchanged.

Canvas rendering scales the backing pixels by devicePixelRatio (up to 3×) while physics stays in logical court units. Crisp court lines, seamed shaded ball, solid rounded paddles and score panels match the green/lime UI. Only gameplay animates after Serve; reduced-motion play is slower.

Court decoration: faint surface texture, a quiet TENNIS YUK watermark, a mesh net with posts and shadow. Ball and paddles remain clear. Removed the footer message about payments and local best; best-score storage still works.


Edit `js/tennis-physics.js` to adjust the algorithm. Its `SETTINGS` names the values: `startSpeed`, `speedPerReturn`, `maxSpeed` for pace; `aimStrength`, `swipeInfluence`, `maxSideSpeed`, `swipeDecay` for aiming; `opponentSpeed`, `opponentReturnY` for the top paddle; `slowMotionFactor` for reduced motion. Dimensions and paddle/ball sizes are there too. `create`, `movePaddle` and `step` contain the commented rules. Current rally mode guarantees opponent returns; changing speed alone will not make it miss. Rendering/input/dialog code stays in `js/tennis-game.js`, layout in `game.css`. Run `node --test tests/*.test.js` after edits.

For later RL experiments, `step(state, dt, slow, policy)` accepts a swappable opponent policy. The default `followBallPolicy` reads a copied state and returns target x; physics applies its speed/bounds. No RL is built now. Opponent returns are still guaranteed by the rally rule; a competitive/RL environment would also need a miss/point rule.
