# Arianna & Sebastian's Party Games

Pass-and-play party games: one phone goes around the group. Static PWA (Vite, vanilla JS), no backend.
Live: https://theenglishjames.github.io/PartyGames/ · Repo: https://github.com/TheEnglishJames/PartyGames

## Product decisions (settled with the owner — keep unless they say otherwise)

- One phone, passed around. No server, accounts, global scores or leaderboards. Scores live only inside a game session (Taboo).
- Private project for the owner's friends, 18+. All in-app text is **English**; the owner talks to Claude in German.
- 3–10 players, names entered once and stored in localStorage.
- Global settings: drinking rules on/off, mild/spicy, sound. Every result line goes through `drinkNote(settings, withDrinks, without)` so the drinking toggle stays honest.
- Spicy = sex, embarrassment, exes. **No dangerous dares**: no driving, heights, fire, injury, anything illegal.
- Content is curated static lists in `src/content/`, written to be edited by hand. No runtime AI, no user-made packs (backlog).
- Portrait only, big buttons; Heads Up is the one landscape screen.

## Architecture

- `src/main.js` owns screens, the menu `SECTIONS`, settings and navigation. Every sub-screen pushes a history entry; the × button calls `history.back()`, so Android back and × share one path to the menu.
- A game is a module with `{ id, title, emoji, color, rules, start(stage, { players, settings }) }`. `start` renders into `stage` and returns an optional cleanup function (timers, wake lock, listeners). The cleanup must also cover async work that finishes after the player left.
- `lib/deck.js` holds the **no-repeat invariant**: `sessionDeck(key, items)` draws everything once before repeating, for the whole app session. Games sharing a key share a deck (Spin the Bottle reuses Truth or Dare's `truth`/`dare` decks on purpose).
- `games/card-game.js`: `spicyDeck` (spicy mode = mild + spicy items) and `makeCardGame` for read-a-card games.
- `lib/ui.js`: `el()` DOM builder (nested child arrays are flattened; `--custom` style props are set via `setProperty`), `passScreen` for hand-overs that hide the previous player's secret, `keepAwake`.
- `lib/players.js` owns player helpers, including `splitTeams(players, count, crowdOf)` (used by Taboo and Team Splitter; spreads each "crowd" evenly across teams).
- `lib/storage.js`: everything in localStorage — players, settings, Secret Missions (persist all weekend), and dismissed first-launch hints (`loadSeen`/`markSeen`, e.g. the settings tip on the menu).
- Pure game logic is exported from the game file and unit-tested in `test/logic.test.js` (deck, imposters, tilt, Stop at 10 ranking, Wavelength scoring, Fibbage options, teams, King's Cup deck, Werewolf roles/winner, mission dealing, content shape).
- Menu section "💍 Get to Know Each Other" is aimed at the wedding weekend: Who Wrote It, Hot Seat, Deep Talk, Secret Missions, Shoe Game (for the couple), Werewolf (app is the narrator, night actions are pass-and-play), Team Splitter.
- Sounds are synthesized in `lib/sound.js` — no audio files.

## Adding a game

1. Content list in `src/content/<id>.js` (use `{ mild, spicy }` if it has spicy cards).
2. Game module in `src/games/<id>.js`; reuse `makeCardGame`, `passScreen`, `sessionDeck`, `nextPlayer` where they fit.
3. Add it to a section in `SECTIONS` in `main.js`.
4. Export and test any pure logic; add a content-shape check if the format is structured.
5. Verify in a browser at 390×844 (puppeteer-core with the local Chrome works well), then push.

## Deploy

Push to `main` → `.github/workflows/pages.yml` runs tests, builds and deploys. GitHub Pages **Source must stay "GitHub Actions"**: "Deploy from a branch" serves the raw `index.html` and the app stays blank.
After changing `public/sw.js` or shipping a big update, bump its `CACHE` version. Installed phones pick up updates on the second launch.

## Gotchas

- Edit source files with the Edit/Write tools. PowerShell `Get-Content`/`Set-Content` round-trips mangle the UTF-8 emoji and symbols in this codebase.
- Heads Up tilt needs HTTPS (dev server uses `@vitejs/plugin-basic-ssl`) and, on iOS, a permission request inside a tap handler. Tap buttons are the fallback.
- iPhones: no `navigator.vibrate`, and the hardware mute switch silences Web Audio.

## Open items

- Not yet verified on a real phone: Heads Up tilt thresholds (`TRIGGER_GAMMA`/`NEUTRAL_GAMMA`), CSS rotation direction when rotation lock is on, Spin the Bottle and the Wavelength dial by touch.
- Some Fibbage "facts" are popular but shaky claims (most-stolen food, sloths vs dolphins) — owner may want them checked.
- Wavelength only labels the 4-point zone.
- Backlog ideas, not built: Spyfall, Quiplash, Higher or Lower, Emoji Riddles, Charades with teams, Ride the Bus, Pyramid, Draw & Guess, sensor/mic games (Steady Hands, Shake It, Scream Meter), Wheel of Fortune, "Surprise me" button, custom user cards.
