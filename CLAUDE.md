# Qwixx Score — notes for Claude

Read `DESIGN.md` first. It holds the milestone status, code structure, save format, release process and decision log. The full design doc (rules the app enforces, screens, variant boards, milestones) is Stuart's Claude doc linked from `DESIGN.md`, and the look comes from the Qwixx Score design system linked there too. The general lessons for all of Stuart's phone apps are in the Phone Web App Playbook in the "Artifact App Development" Claude project.

- Landscape app: the board fills the screen; cells stretch rather than staying square. Test at 844 × 390.
- Keep the app fully offline: no runtime network calls, fonts bundled in `fonts/`.
- On every release, bump `APP_VERSION` in `index.html` and `VERSION` in `sw.js` together, to the same number: the service worker refuses to install if they differ.
- Add any new file to `CORE` in `sw.js`.
- Each milestone goes to a test branch first; merge to `main` only after Stuart has play-tested it.
- Never `preventDefault()` touches on buttons; keep the global `[hidden]` rule. No `alert()` or `confirm()`.
- The save is a list of actions (`SAVE_VERSION`); scores, greyed cells and game end are worked out from it. Upgrade old saves in `migrate()`, never wipe them.
- Boards are data (`BOARDS` in `index.html`); add variants there, not by changing the screen.
- Rules and FAQ text in the app are written in our own words, not copied from the rulebook. Stuart's own classic Qwixx box is the rules source.
- Update `DESIGN.md` (status, decision log, "Last updated") in the same commit as the change.
- UK spelling throughout. Commits as Stuart Goodwin.
