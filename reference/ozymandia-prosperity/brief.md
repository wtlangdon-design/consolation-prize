# Ozymandia at Prosperity, Act IV: for the session with the image key (errata 184)

Written 2026-11-08. **No new authorization is needed.** This is Ozymandia's own figure, so it is logged under her room's asset, `room-16`, which has one operation left of its four (`art/staging/caps.json`). Check `art/staging/ledger.json` before the operation and record it there. This brief spends **one operation** and no more. If it misses, stop and tell Tyler; do not raise a cap.

## Why

Doc 04, MADAME OZYMANDIA: "**Act IV:** if Thad returns after `T_VOID`, she is at Prosperity, holding the rod, staring at the ground, saying nothing. Her only line: *'…It's loud here.'*" It was written and never staged (doc 104, gap 4). Tyler chose to build it on 2026-11-08.

The writing and the data are done: `content/ambient/prosperity-ozymandia.json` has her line (extracted from doc 04), her condition (`T_VOID_FOUND` and Act IV) and a provisional place. It carries `awaitingArt`, so the room compiler does not cast her yet. What is missing is her picture: her tent figure is drawn behind her table and cut at the table top, and here she stands in the open.

## Read first

- `CLAUDE.md`:
  - the character style gate: generated against Thad in the actual room, measured before anyone looks, and not "too sharp";
  - errata 77: everything visible moves.
- `content/ambient/ozymandia.json` and `art/actors/room-16-ozymandia.png`: her canonical design (errata 89 B). Same woman, same clothes and colours.
- `content/rooms/prosperity.json` and `art/backgrounds/room-23-prosperity.png`: the room. In Act IV it is night if the room's act lighting says so; match what the room shows when `T_VOID_FOUND` is set.
- `docs/55-full-game-build.md` §8.

Never touch `wtlangdon-design/anchorage`.

## The operation (asset `room-16`, its fourth)

One sheet, on magenta, crisp edges, no text:

- **Ozymandia standing, full figure, in profile or three-quarter, holding her brass divining rod and looking down at the ground.** She is still and quiet, not performing. This is the only time in the game she is not selling anything.
- **Generated against Thad in Prosperity at game size**, with her tent sheet beside it for her design.
- **Four or five small poses on the sheet**, so she moves (errata 77): at rest; a breath; the rod tilting a little; her head lowering further; one deliberate change of at least 10% of the figure (she shifts her weight, or the rod dips toward the ground).

## Building it in

- Cut the sheet to `art/actors/room-23-ozymandia.png`. Give `prosperity-ozymandia.json` a `sprite` (frames, rate, phase, breaks), a `figureHeight` or stature so `tests/scale.test.ts` holds her (`posture: "standing"`, within 5% of the room's curve), and a `walkTo` for TALK TO.
- **Her place.** The file puts her on the far mud left of the hole (x 860, y 735). Move her where she reads best looking at the ground near the hole, clear of the hole's hotspot, the exits, the raccoon and Pratt's stake, and clear of every stand (`tests/staging-clear.test.ts`).
- **Remove `awaitingArt`**, run `node tools/compile-room.mjs 23 --write`, and check the only change to `content/rooms/prosperity.json` is her id in `ambient`. (A plain compile of Room 23 also moves Pratt's stake back to a stale place; keep the stake where `main` has it.)
- **Her line is a bark**, the same in every reputation state: she says it as Thad walks up. Write nothing else for her. If TALK TO wants its own answer, tell Claude; Claude writes it in the documents.

## Measure before anyone looks

- `npm test` and `node tools/run-all.mjs` pass, especially `tests/scale.test.ts`, `tests/movement.test.mjs` and `tests/staging-clear.test.ts`.
- `npm run gauntlet` is green.
- Render Prosperity in Act IV after the void with Thad walking up to her (`renders/room-23-ozymandia-act-iv.png`). Push it and send it to Tyler.

## Ship

- One pull request.
- Record it under the next free errata number on `main`.
- Commit trailers and a `Lesson:` line as usual.
- Tell Tyler it is in.
