# The six interiors, built: for the builder session with the image key (errata 183)

Written 2026-11-08. **Authorized:**
- **Tyler, 2026-11-08:** "Build all six", then "Write all six now".
- **Caps:** `art/staging/caps.json` has `room-37` to `room-42`, four operations each (errata 72's rule). Check `art/staging/ledger.json` before every operation.
- **The lines are written** (doc 105). Nothing here may be written by the builder. A line a room needs that doc 105, doc 07 or doc 49 does not have is a stop: report it to Tyler.

Build them under `docs/55-full-game-build.md`, one room at a time, start to finish, in this order: **42 · 38 · 37 · 39 · 40 · 41**. The two on the Lane go first, because their fronts are already in the game.

## The six

| Room | Id | What it is (doc 12's prompt; doc 105's subjects) | Who is in it | Reached from |
|---|---|---|---|---|
| 42 | `barbers` | A one-room barber-surgeon's shop: the chair (straps on the arms, a bucket beside it), the strop on a hook, a tray of instruments, a jar on a shelf, a cracked mirror, and a price board reading SHAVE 2 BITS · TOOTH 4 BITS · LIMB $1. | The barber-dentist-surgeon (doc 07 #9: his tree and barks) | **The Lane**: a door under the barber's pole |
| 38 | `photographers_studio` | A plate camera on a tripod with a black cloth; an iron headrest clamp; a painted Grecian colonnade backdrop beside a real window onto mud; brown chemical bottles; the back of the window display (the gentleman in the good collar, on an easel, facing out); a carved sitting chair with a small table; a pinned price card; a box of identical cabinet portraits. | The photographer (doc 07 #10) | **The Lane**: the door beside the photographer's window |
| 37 | `boarding_house_parlour` | A startlingly civilised parlour: lace antimacassars on every chair, an upright piano with a doily and a vase, a fire with a brass fender, a framed print of a queen, a proper rug, stairs up with a sign and a row of boots beneath it, and a tea tray with a hen-shaped cosy. | The two boarding-house women (doc 07 #14–15) | **The map** |
| 39 | `bakehouse` | A small hot bakehouse: a big brick oven, lit, with a long paddle; flour sacks to the rafters; a long floured table with dough in rows; racks; a back door propped open with a brick onto a yard. | The boy (a figure, not a speaker: doc 105's THE BOY) | **The map** |
| 40 | `empty_storefront` | An abandoned shop: bare shelves, a conspicuously swept floor with a neat pile of sweepings, an empty counter with a clean square where a cash box sat, a blank-fronted window with old price tickets on the glass, a sign reading HARDWARE & SUNDRIES leaning against the wall (fresh paint, gold-edged), and a back room with one empty NAILS crate and an old calendar. | Nobody | **The map**. *This is not the Lane's boarded storefront, which stays shut for good (errata 183).* |
| 41 | `schoolhouse` | A new one-room schoolhouse, never used: fourteen hand-made desks in rows with dated lids, a washed blackboard with an unopened box of chalk, a brass handbell on the teacher's desk, a cold blacked stove laid with kindling and a kettle and one cup, a clean window, and a door with fourteen coat hooks. | Nobody | **The map** |

**Every room is at night, as the streets are** (errata 64 and 183). The parlour and the bakehouse are lamp-lit and warm; the others are lit by one lamp or by what comes through the window.

**Nothing the lines do not say.** Each room's plate shows doc 105's subjects, and the brief's descriptions above are drawn from doc 105, so anything that is not there stays out.

## What each room needs, beyond the plate

- **Its people.** Their trees and barks are already extracted from doc 07:
  - the barber;
  - the photographer;
  - the two women, as two figures, A and B, as doc 07 writes them;
  - the boy, drawn but silent.

  The character style gate in `CLAUDE.md` applies, all five steps: drawn against Thad in the room, measured, and moving from the start (errata 77).
- **Its way in.**
  - **The Lane's two doors** become exits on `reference/room-44/annotation.json`. They have no new lines: the pole and the window keep doc 97's.
  - **The map's four** become places on the map, wherever the district map (errata 163) has the building. If it has none, that is a stop: report it to Tyler.
- **Its way out:** one door each, back where it came from.
- **Sources:** `proofs/readiness/room-NN.sources.json` pointing at doc 105 (primary and completions), doc 07 (the people), and doc 49 (none written: doc 105's Overrides stand in). Then `node tools/check-room-readiness.mjs NN` must say **YES** before anything is drawn.

## When a room is in

- **`proofs/written-not-built.json`:** its lines come off the `ancillary-interiors` group, and `tools/check-written-vs-built.mjs` reports them as built.
- **`content/build-ledger.json`:** the room is `built`.
- **A render of the room with Thad in it:** pushed, and sent to Tyler.

Never touch `wtlangdon-design/anchorage`.
