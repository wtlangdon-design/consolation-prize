# A hitching post with horses on Main Street: for the session with the image key (errata 168)

Written 2026-11-08. **No new authorization is needed.** Tyler gave Room 2 four more operations for this (`art/staging/caps.json`, asset `room-02`, cap 6, two already spent). Check `art/staging/ledger.json` before every operation, and record each one there. This brief has four operations to spend, and no more.

## Why

Tyler, 2026-11-07, on Main Street: "maybe we add a hitching post front and center of the camera with a few horses tied to it so that it's not just a bunch of empty space?" He chose "Both: +6 cast, +4 Main St" for it.

## What it is

- **A hitching rail** (two posts and a rail), with **two or three saddle horses** tied to it.
- It stands in the **foreground of the street**, in the empty ground nearer the camera than the boardwalk. It goes in the stretch Tyler saw empty, which is the view around the Nugget, the trough and the boundary men.
- **It is scenery.** It is not a hotspot, has no lines and sets nothing. Do not write any. Claude will write its LOOK and LISTEN lines in the documents once it is in, and then make it clickable.

## Read first

- `CLAUDE.md`:
  - the room composition order;
  - the legibility gate;
  - the character style gate for the horses: they match Thad's flat, soft-shaded, low-texture look, and are not "too sharp";
  - errata 77: everything visible moves.
- Errata 54: full RGB, no locked palette, and integer scaling with nearest-neighbour only.
- Errata 64: Act I's Main Street is night. The rail and horses must sit right in the night version as well as the day one, under whatever the street's lighting already does to the plate.
- How Room 15's mules and Room 1's coach horses were made and cut:
  - `content/ambient/other-mules.json` and `content/ambient/grievance.json`;
  - errata 164's horses.
- How the trough and the dog became obstacles: `reference/room-02/annotation.json` `obstacles`.
- `docs/55-full-game-build.md` §8.

Never touch `wtlangdon-design/anchorage`.

## The operations (asset `room-02`)

1. **The rail and the horses, in context.**
   - Give the generator the Main Street plate around the chosen spot (`art/backgrounds/room-02-main-street.png`) and Thad standing there at game size.
   - Ask for the rail with two or three horses tied to it, at the street's scale. A horse's withers come to about Thad's shoulder at the same depth (`content/scale-anchors.json`, `tests/scale.test.ts`). Use the plate's light, perspective and painted style.
   - Crisp edges, on magenta for the parts that will be cut out, and no text.
2. **The horses' motion sheet.** The same horses on one sheet in a few small frames: a tail swish, a head lowered and raised, a weight shift, an ear turn. Errata 77: something changes at least every 10 s, and a deliberate action that changes at least 10% of the figure plays at least every 30 s.
3. **and 4. Corrections only,** if one of the above plainly misses. Show the generator the side-by-side.

## Building it in

- **The rail goes into the plate**, or is laid over it as a prop (`props` in the annotation, as Room 15's bin is), whichever keeps the plate's edges flat (`tools/check-plate-flat-edges.mjs`).
- **The horses are an ambient animal**, as `other_mules` is: `posture: "animal"`, the sprite sheet under `art/actors/`, and a frame rate and breaks so they move. No barks.
- **An obstacle.** Thad walks around it, never through it. Add it to `obstacles` in `reference/room-02/annotation.json` with the rect of the whole group, then run `node tools/compile-room.mjs 2 --write`.
- **Occlusion.** If the rail stands nearer the camera than any part of the walk band, Thad passes behind it. Add the occlusion plane or band, and run `tools/check-occlusion.mjs`.
- **Clear of everything else:**
  - it does not block the way to any door, exit or hotspot, or any figure's stand;
  - nobody's speech lands on it (`tests/staging-clear.test.ts`);
  - it is not where Thad arrives, from the stage road or anywhere else.

## Measure before anyone looks

- `npm test` and `node tools/run-all.mjs` pass, especially:
  - `tests/scale.test.ts` (give the horses a `posture`);
  - `tests/movement.test.mjs`;
  - `tests/staging-clear.test.ts`;
  - the walk and occlusion checks.
- `npm run gauntlet` is green.
- Render Main Street with Thad walking past the rail, in the day and at night. Push the renders, and send them to Tyler.

## Ship

- One pull request.
- Record it under the next free errata number on `main`.
- Commit trailers and a `Lesson:` line as usual.
- Tell Tyler it is in, and tell Claude, who writes its lines.
