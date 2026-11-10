# The final look: four redraws and one plate, for the builder session with the image key

Written 2026-11-10 for errata 260. Tyler was shown a line-up of forty figures at one height (`cast-lineup-same-height.png`, beside this brief) and one frame of Thad in each room, with what stood out. **"Make all of the changes that you flagged. I want this game to be as close to perfect when I play through it."** What needed no drawing is done (errata 260). This is what needs the image key.

**Budget: NOT SET. Do not spend an operation until Tyler names a number.** Proposed to him: ten operations under a new asset `final-look` in `art/staging/caps.json` (seven for the sections below, three in reserve). `caps.json` changes only on his instruction; quote it in the cap's `why`. Check `art/staging/ledger.json` before each operation and log each.

**Nothing here may be written by the builder.** No lines. Do not touch `content/`. Never touch `wtlangdon-design/anchorage`.

Read first: `CLAUDE.md` (the character style gate: **the standard is Thad's look**, and too sharp is the usual miss), `docs/55-full-game-build.md` §8, and how the cast was last unified (`reference/cast-unify-17.spec.json` and its hand-back).

When done: commit to a branch named `final-look-art` with `reference/final-look/handback.md` beside this brief, push it, and stop. The wiring is done by the other session.

**Every redraw keeps its sheet's frames, in the same order, doing the same things, in cells of the same size, soles on the same row,** so that the wiring is a file swapped and a height re-measured. Each is generated against a frame of Thad in the room the figure stands in, and shown beside Thad and the nearby cast at game size in the hand-back.

In order of how much each stands out:

## 1 · Mr. Pratt (two sheets, two operations)

- `art/actors/room-25-pratt-master.png` (7 frames, cells 355 x 400; Pratt's claim) and `art/actors/room-25-pratt-jump-master.png` (6 frames, cells 304 x 450; Prosperity).
- **What is off:** his head and hands are larger and his build chunkier than anyone else's in the line-up. He reads as a cartoon among the cast: a different hand.
- **Wanted:** the same man (hat, moustache, grey shirt, braces, the rake in one sheet and the mallet in the other, every pose as it is) at the cast's proportions: Thad's head-to-height, hands the size of the bar men's. Flat, soft-shaded, low in texture.

## 2 · The grog tent's rule-keeper (one operation)

- `art/actors/room-52-rule-keeper.png` (7 frames, cells 239 x 346; the grog tent and the river).
- **What is off:** the same thing as Pratt: rounder and bigger-headed than the men beside him.
- **Wanted:** the same man and poses (frames 5 and 6 are his fiddle-playing, and must stay), at the cast's proportions. He may stay stout; stout is a build, not a head size.

## 3 · Main Street at dawn (one operation)

- `art/backgrounds/room-36-main-street-dawn.png`, the last street the player sees (`rooms-with-dawn.png`, beside this brief, shows it next to the night rooms).
- **What is off:** it looks like another game. It is brighter, more painterly and far more finely detailed than the night Main Street (`art/backgrounds/room-02-main-street.png`), whose buildings these are.
- **Wanted:** the night plate's own drawing at dawn. Attach the night plate as the layout and the grain: the same buildings in the same places at the same level of detail, the sky lightening behind the false fronts, the lamps out, the mud the same mud. Every hotspot rect, walk box and exit of `content/rooms/main-street-dawn.json` must still sit on its feature; say so in the hand-back, with a picture of the rects over the new plate.

## 4 · Madame Ozymandia at Prosperity (one operation, lower priority)

- `art/actors/room-23-ozymandia.png` (5 frames, cells 175 x 372).
- **What is off:** her lace and dress are drawn finer and sharper than the cast standard.
- **Wanted:** the same figure and poses, flatter and softer, at the texture of the Nugget's bar men.

## 5 · The pie woman (one operation, lowest priority)

- `art/actors/ambient-pie-woman-master.png` (5 frames, cells 86 x 177).
- **What is off:** a little softer and larger-headed than the cast. Slight. Do it only if operations are left after the four above and their corrections.

## 6 · The washout, by tool (no operation)

- `art/backgrounds/room-45-washout.png` is the most saturated plate in the game, and the step into it from the night town is the sharpest in `rooms-with-the-gulch.png`. The daylight is ruled and stays.
- **Wanted, by a deterministic tool and not an image operation:** its saturation brought to the level of `room-50-ledge` and `room-51-gulch-tents` (measure theirs; state the numbers), nothing else changed. Before and after in the hand-back. If it does not look better, say so and leave the plate.

## Not asked for here

The directions still printed for want of a pose (doc 95, class B: 21 rows) have their own brief, `reference/acted-directions/brief.md`, and their own budget.
