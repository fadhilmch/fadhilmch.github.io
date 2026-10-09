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

Cash tab graphs: the old Ball cash card and the Kas ledger are one section, titled Cash (Real, Pending, Total later, the explanation line, charts, ledger rows). It has a balance-over-time chart (SVG, `balanceChart` in `js/app.js`) and a column chart of money in (up, green) and out (down, red) per date (same-date rows share one x slot: in above the line, out below) with the amounts beside each column; the balance chart shows the end-of-date balance. Membership has a progress card: pot so far / 700 kr target, kr to go and percent (capped at 100). The 700 kr is the whole membership pot, not per person; `cfg.membershipTarget` overrides it. Data comes from `ledgerRows`, `ledgerSeries`, `ledgerByDate` and `membershipProgress` in `js/money.js` (tested).

Tabs: Sessions, Stats, Owed (who still owes Fadel, tap a name to pay with Swish), Cash (kas, membership, cash flow, admin entries), Share.

Motion: the Owed tab's collected/still-owed bar grows left-to-right to its existing proportions in 450ms (`ty-grow`, ease-out) when rendered. Other bars are unchanged. With `prefers-reduced-motion: reduce`, it appears at full size immediately.


Tennis theme: faint court lines sit behind the cards; section headings keep their original icons with small net dividers. Plus Jakarta Sans + Inter and finance labels stay unchanged. A seamed tennis ball marks the collected/still-owed boundary on Owed and the paid/owed Stats bars only. It stays inside the track at 0% and 100%, and is hidden for zero-total bars. The bar lengths and money calculations are unchanged. The ball follows the existing Owed grow animation; reduced motion still disables all animations. Decorative elements are hidden from assistive technology and never intercept taps.

Visual check: preview Owed, Stats and Cash at 390px in both themes; check 0%, mixed, 100% and zero-total bars, long numbers, empty data and reduced motion. Use demo data, not production access codes, for screenshots.

Mini tennis: tap the plain tennis ball in the header. Serve starts play, drag left/right on the court to move your racket, or use arrow keys and Space. Points and games reset when the dialog closes; nothing is stored or sent. Pause, tab switching and Close stop the game loop. Reduced-motion users get slower play, with no automatic start or decorative motion. The native dialog traps focus, Escape closes it and focus returns to the header button. `js/tennis-game.js` and `game.css` are isolated from money math and make no network requests. Unit tests cover point/game/set scoring, tie-break service order, out, misses, aiming and reduced-motion spin.

The header launcher keeps the standard 🎾 emoji, plain with no box. The game title uses an inline SVG tennis ball. Header control stays plain with a 44px tap target. In-game rackets are simple solid rounded paddle bars. Uses competitive arcade scoring.

Aim returns by where the ball hits the racket: left/right of center sends it that way, center is straighter. Moving the racket at contact adds direction; that influence fades quickly when held still. Horizontal speed is capped, point scoring and opponent misses are handled by physics.

Canvas rendering scales the backing pixels by devicePixelRatio (up to 3×) while physics stays in logical court units. Crisp court lines, seamed shaded ball, solid rounded paddles and score panels match the green/lime UI. Only gameplay animates after Serve; reduced-motion play is slower.

Court decoration: faint surface texture, a quiet TENNIS YUK watermark, a mesh net with posts and shadow. Ball and paddles remain clear. Removed the footer message about payments and local best; no best-score storage is used.


Edit `js/tennis-physics.js` to adjust the algorithm. Its `SETTINGS` names the values: `startSpeed`, `speedPerReturn`, `maxSpeed` for pace; `aimStrength`, `swipeInfluence`, `maxSideSpeed`, `swipeDecay` for aiming; `DIFFICULTY` and `opponentReturnY` for the top paddle; `slowMotionFactor` for reduced motion. Dimensions and paddle/ball sizes are there too. `create`, `movePaddle` and `step` contain the commented rules. Opponent movement is limited and may miss. Rendering/input/dialog code stays in `js/tennis-game.js`, layout in `game.css`. Run `node --test tests/*.test.js` after edits.

For later RL experiments, `step(state, dt, slow, policy)` accepts a swappable opponent policy. The default `followBallPolicy` reads a copied state and returns target x; physics applies its speed/bounds. No RL is built now. The state includes points, games and set outcome for a later RL environment.

Ball seams spin with speed and horizontal direction; edit `SETTINGS.spinPerPixel` to tune the visual spin. Reduced-motion users get static seams.


Competitive mini rules (separate from the visual rework): 0/15/30/40, deuce, advantage, games and one tie-break set. Default: six games with a two-game margin; at six-all, tie-break to seven with a two-point margin. Edit `gamesToSet`, `tieBreakTo` and `difficulty` in `SETTINGS`; `DIFFICULTY` gives easy/normal/hard paddle speed and aiming error. Opponent can miss. Click Next point after a point and New set after the set ends. Serve switches each game and uses 1-2-2 order in tie-breaks.

This is arcade tennis, not full real-tennis simulation: crossing a singles sideline is immediately OUT against the last hitter, with no side-wall rebound. There is no bounce/landing physics, diagonal service-box rule, two-serve fault rule, let or end-change animation. The mini-game uses the tennis point/set scoring, not all ITF play rules. Scoring reference: https://www.itftennis.com/media/7221/2026-rules-of-tennis-english.pdf

Example: 40-40 is Deuce. Your next point makes AD-40. Lose the next point and it returns to Deuce. Win two consecutive points from Deuce to win that game. At 6-6 games the tie-break starts; 7-6 tie-break points is not enough, 8-6 wins the set 7-6.

Scoreboard: rows for You and Computer, Set 1 games and current game points. A dot marks who serves, hidden when the set ends; a winning row gets a theme-aware accent. Tie-break points replace normal point labels at six-all. Current set and points reset only on New set or closing the game. Short phone screens use a smaller court so the scoreboard and controls stay in reach.
