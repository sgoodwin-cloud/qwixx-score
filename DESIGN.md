# Qwixx Score — design notes

Last updated: 27 Oct 2026 (v10, live)

- Full design doc (Claude doc): https://claude.ai/artifact/YShyww3EHtMN2K7KNWo15Y
- Design system: https://claude.ai/artifact/XMrnkNmjaX1AqYGjM2kxFz
- Approved board prototype: https://claude.ai/artifact/4dvKP7Q5MrhW4XkFKtZcKq
- Live app: https://sgoodwin-cloud.github.io/qwixx-score/

## Status

| Milestone | What | Status |
| --- | --- | --- |
| 1 | Classic board: crossing with rules enforced, undo, penalties, locks, score line, game end, settings with Rules & FAQ, Share, New game, End game; offline install and update bar | Live (v6): v1 plus play-test tweaks (one-tap lock, clearer penalties, tap-again to clear, always landscape, share message with install steps) |
| 2 | Board picker: Colour Mix, Number Mix, Shuffle with board codes | Live (v9) |
| 3 | Big Points (six rows) | Not started |
| 4 | Optional: paper tally mode, high score and history, dice roller | Not started |

## Files

| File | What |
| --- | --- |
| `index.html` | The whole app: styles, markup, game logic, dialogs, service worker registration and update bar |
| `sw.js` | Service worker: installs every file in `CORE` at `?v=<VERSION>` addresses, checks `APP_VERSION`, retries up to 4 times; cache-first afterwards |
| `manifest.webmanifest` | Home-screen app settings (landscape, standalone) |
| `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` | Icons |
| `fonts/` | Barlow Semi Condensed 500–800, woff2, bundled for offline use |

## Code structure (`index.html`)

- `BOARDS`: each board is a list of rows, each row a colour plus its numbers in order. Colour Mix rows are `mixed` and carry a `colors` list, one colour per box; the lock takes the last box's colour. Shuffle has no fixed rows: `shuffleBoard(code)` jumbles 2–12 per row with a PRNG seeded from the 4-character code, so the same code always gives the same sheet. `getBoard(game.board)` returns the board (cached). The rules only ever look at "the next cell to the right", so number order and colours don't matter to them.
- Colour Mix and Number Mix are our own layouts that play like the official Qwixx Mixx pads, not copies of them.
- Board picker (`boards()`, `pick()`): Settings → Board. Switching board starts a new game (asks first if the sheet has anything on it). New game keeps the current board and Shuffle code. Codes use `CODE_CHARS` (no O, I, 0, 1 and other look-alikes).
- `game` (the save): `{ saveVersion, board: { id, code }, actions: [...] }`, stored in `localStorage` under `qwixx-score`.
- `derive(board, actions)`: works out crosses, last cross per row, closed rows, own locks, penalties, row scores, total and whether the game is over (and why). Everything on screen comes from this.
- `why(state, row, cell)`: the reason a cell can't be crossed, or null.
- `render()`: rebuilds the board, score line and penalty boxes from `derive`. Opens the Game over card when the game first ends.
- Dialogs (`openCard`): game over, settings, confirm, Rules & FAQ (tabs), Share.
- A small self-test of scoring and game end runs on load (console only).

## Save format

```json
{
  "saveVersion": 1,
  "board": { "id": "classic", "code": null },
  "actions": [
    { "type": "cross", "row": 0, "cell": 3 },
    { "type": "closeRow", "row": 2 },
    { "type": "penalty" },
    { "type": "endGame" }
  ]
}
```

`board.id` is `classic`, `colourmix`, `numbermix` or `shuffle`; Shuffle saves its code too, e.g. `{ "id": "shuffle", "code": "K7Q2" }`. Rows and cells are positions, not numbers, so the same format works for jumbled boards. Clearing removes that item's action from the list. Future format changes go through `migrate()`.

## Rules the app enforces

Cross left to right; skipped cells grey out. The last cell needs 5 crosses in its row; crossing it locks the row and adds a bonus cross. Rows closed by another player are closed with one tap on the lock. Tapping anything already marked clears it: the rightmost cross in a row (so a lock can't be left without its 5), a taken penalty, or a row closed for someone else. A game ended from Settings can be resumed. Penalties −5 each. The game ends on your fourth penalty, the second closed row, or End game in Settings (for another player's fourth penalty). Row score = n(n+1)/2 for n crosses including the lock.

## Release process

1. Build and check the change in an artifact preview where it helps.
2. Bump `APP_VERSION` (index.html) and `VERSION` (sw.js) to the same number; add any new file to `CORE`.
3. Headless Chromium test at 844 × 390 landscape: a full game, an offline reload, an update from the previous version, an update through a stale CDN.
4. Push to a test branch (`m2`, …) for Stuart to try via its preview; merge to `main` only once he approves. (v1 went straight to `main`: nothing was installed yet.)
5. Update this file in the same commit.
6. Wait for the GitHub Pages deployment to succeed, then: open the app with signal → "Update ready" bar → tap → it reloads on the new version. No bar: fully close and reopen.

## Known limits

- Phones can't be made to rotate a web page (iPhone never; Android only for an installed app, via the manifest). So when the phone reports portrait, `#stage` (the whole app, including toasts and dialogs) is rotated 90° clockwise in CSS. Held with the top of the phone to the left, it reads as landscape whether or not rotation lock is on. Safe-area padding swaps sides in that mode (the notch is on the stage's left).
- Scrolling inside a rotated dialog (Rules & FAQ) can only be checked on a real iPhone; headless Chromium has no WebKit.
- `yellow-num` on `yellow-tint` is about 2.9:1; darken it if yellow numbers read faint on the phone.

## Decision log

| Date | Decision |
| --- | --- |
| 27 Oct 2026 | v1 released to `main` as the first release (Milestone 1) |
| 27 Oct 2026 | v10: Settings puts New game and Change board as two large buttons; Rules & FAQ, Share and End game in a quieter row below (Stuart) |
| 27 Oct 2026 | Milestone 2 (v7–v9) merged to `main` after Stuart checked the preview on his iPhone |
| 27 Oct 2026 | v9: Colour Mix sections sized with explicit flex values and the lock sized from the row height, because Safari left a wide empty band on the right (Chrome was fine) |
| 27 Oct 2026 | v8: Colour Mix sections each sit on their own full-colour band (`.seg`), with the lock on its colour, so the colours read at a glance (Stuart) |
| 27 Oct 2026 | v7 (Milestone 2): board picker with Colour Mix, Number Mix and Shuffle (4-character codes); original layouts rather than copies of the Mixx pads; Colour Mix rows on a dark band with ink score chips |
| 27 Oct 2026 | v6: Share copies (and Send shares) a full message: the link plus iPhone and Android home-screen steps (Stuart) |
| 27 Oct 2026 | v2–v5 merged to `main` after Stuart approved the preview |
| 27 Oct 2026 | v5: the last number and its n/5 counter are stacked so the counter never overlaps the number |
| 27 Oct 2026 | v4: always landscape: the app rotates itself when the phone reports portrait; the squeezed portrait layout is gone (Stuart) |
| 27 Oct 2026 | v3: no Undo button; tap a marked box, penalty or lock again to clear it (Stuart). Crosses clear from the right only, to keep the 5-cross rule safe |
| 27 Oct 2026 | v2: lock closes a row in one tap, no confirm (Stuart); untaken penalty boxes are dashed outlines, taken ones solid red with a white X, so they can't be confused |
| 27 Oct 2026 | Kept the confirm card when closing a row for another player; revisit after play-testing (replaced in v2) |
| 26 Oct 2026 | Board prototype approved: stretching cells; raised open tiles, sunk hatched skipped cells, inverted crossed cells, rising fill on the last number |
| 26 Oct 2026 | Rules, FAQ, Share and New game behind one Settings button; Undo in the top bar |
| 26 Oct 2026 | Landscape layout; one phone per player, no sync; variant boards (Mixx A/B, Shuffle, Big Points) in later milestones |
