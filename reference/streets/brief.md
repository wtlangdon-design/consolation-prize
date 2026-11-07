# Lower Street, the Lane and the bell-ringer: for the session with the image key (errata 161)

Written 2026-11-07. **Authorized:** Tyler asked why Lower Street was unbuilt and chose **"Lower Street and the Lane"**, now, before his playthrough. Caps in `art/staging/caps.json`:
- `room-43` (Lower Street): **4**.
- `room-44` (the Lane): **4**.
- `bell-ringer`: **2**.

`tools/art/room-op.mjs` enforces them and records every operation in `art/staging/ledger.json`.

## Why

Errata 43 made the town three walked streets: Main Street; **Lower Street** (2b), east of it through the receding road; and **the Lane** (2c), off Main Street's alley and through to Lower Street at its far end. Neither was ever built: their places have been reached from the town map. The builder is writing both streets' lines and rewiring the town while this runs. These are the two pictures and the one character those streets need.

## Read first

- `CLAUDE.md`, the character style gate (for the bell-ringer).
- Room 20 (the back alley) is the model for everything below. It is the last night exterior built from nothing. Its prompts are in `reference/room-20/prompts/`, its sequence in `tools/art/room20-*.mjs`.
- Errata 63 and `tools/art/derive.mjs`: 1536 × 1024 → 1920 × 864.
- `reference/global-baseline.json`: both rooms are entered (`room-43-lower-street`, `room-44-the-lane`), with Main Street as the comparable and the Room 1 casting master.

Never touch `wtlangdon-design/anchorage`.

## Lower Street (room-43)

The layout is `reference/room-43/layout-1536x1024.png`, made by `tools/streets-graybox.py`, which passes the legibility gate. Left to right:
- the way back to Main Street;
- the Claims Registrar's office, with its door and Sump's lit window;
- the back-alley mouth;
- the church, with its belfry, steps and doors;
- the hand bell on its post;
- the passage to the Lane;
- the livery, with its open doors, hay loft and trough;
- the road out of town.

1. **Composition master:** `NODE_USE_ENV_PROXY=1 node tools/art/room-op.mjs reference/room-43/prompts/composition-master-01.spec.json`.
2. **Plate:** copy the master to `art/staging/room-43/plate-01/input.png`, then run `room-op.mjs reference/room-43/prompts/plate-01.spec.json` (Thad removed, nothing else changed).
3. **Derive and promote:** `node tools/art/room43-plate.mjs --promote --attempt 2`. If the master painted the band taller than 20:9, as Room 20's did, add `--y <row>` and note it. The plate lands at `art/backgrounds/room-43-lower-street.png`.
4. **Checks:**
   - every exit in `proofs/room-43/graybox.json` is where the layout put it, within about 40 px;
   - the doors stand taller than Thad at the far edge of the street;
   - there is no readable text anywhere.

   If a check misses, one correction is allowed; there are two operations left over for this.

## The Lane (room-44)

The layout is `reference/room-44/layout-1536x1024.png`. Left to right:
- the way back to Main Street;
- the undertaker's, with its door and a coffin standing by it;
- the photographer's window, with a portrait in it (doc 06: "Has the Mott photograph in his window");
- Ozymandia's tent, its flap open;
- the barber's pole and window;
- the boarded storefront;
- the passage through to Lower Street.

Same four steps, with `reference/room-44/prompts/` and `tools/art/room44-plate.mjs`. The plate lands at `art/backgrounds/room-44-the-lane.png`.

## The bell-ringer (bell-ringer)

Doc 07 #4: "Church steps. Strikes the bell by hand, half a step flat, drunk." He stands beside the hand bell on Lower Street. **Do this after Lower Street's plate is promoted**, because his prompt shows him that plate.

1. `room-op.mjs reference/room-43/prompts/bell-ringer-01.spec.json`. It produces five poses on magenta: rest, breath, strike-up, strike and talk. He is at Thad's height and pixel size, lean, a shabby waistcoat and a battered bowler, a small mallet in his hand.
2. Measure before anyone looks, as the style gate asks:
   - his height against the street's curve, which is Room 20's exterior depth: 258 at y 705, 362 at y 858;
   - crisp edges on the key colour;
   - colour and contrast in Thad's range.

   **Too sharp is the usual miss.** One correction is allowed if he plainly misses.
3. Cut him as `tools/art/room20-cat.py` cut the cat, into `art/actors/room-43-bell-ringer.png`. Write the frame rectangles in a note in the PR. The builder writes his ambient file.

## Then

Commit the plates, the sheet, the ledger rows and the frame records, open a PR, and merge it when CI is green. The PR description says `Lesson: none -- art for errata 161's two streets`. The builder fits hotspots and walk boxes to the real plates once they are on main.
