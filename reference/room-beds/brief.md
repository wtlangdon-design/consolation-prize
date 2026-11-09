# Every room's bed: for the builder (errata 203)

Written 2026-11-08.

**Authorized:** Tyler, 2026-11-08, on a sound plan for the rooms that have none: "Proceed". No image key is needed, and no image operation is spent.

**Read first:**
- doc 45, "Every room's bed", which is the plan;
- doc 45 §0.2, the tuning gate;
- errata 102 to 106: how the everyday sounds and room sounds were made, and what Tyler said when he heard them;
- `tools/audio/render-everyday-sfx.py` and `tools/audio/render-room-sfx.py`, and their lessons. Unpitched noise is good. Voices are only ever distant and wordless. Anything that rings at a clean pitch reads as the wrong material.

Never touch `wtlangdon-design/anchorage`.

## Do

1. **Render a bed for every room in the table**, plus its layers. Reuse a material Tyler has already approved wherever one exists, as `render-room-sfx.py` does: the wind, the street, the distant town, water, picks, the crowd's murmur. Every loop is built to loop (errata 102's rule).
2. **Check every source against the three lines invariant 3 protects before wiring it**, and drop any that is one of them (doc 45, rule 2). Prosperity's hole gets no sound at all.
3. **Wire each bed as an `ambience` entry** in `content/audio/sounds.json`, with a `why` citing its doc 45 row:
   - layers tied to figures use `whenPresent`, as Main Street's dog does;
   - leave out the four rooms the table says have none.
4. **Add a check that holds the plan:**
   - every room in the table has a bed, and the four silent rooms have none;
   - no bed or layer is keyed to a puzzle flag;
   - Prosperity has no sound tied to the hole.
5. **Build an audition page**, as errata 102's was: each room's music and bed playing together, with a gain slider for the bed, so Tyler can judge them by ear. **Nothing ships until he has heard them.** Send him the page and wait for his rulings. Then set the gains he chose.

## Ship

- **Checks:** `npm test`, `node tools/run-all.mjs`, `npx tsc --noEmit -p .`, `node tools/check-friction.mjs origin/main` and `npm run gauntlet` all pass.
- **Errata:** record it under the next free errata number on `main`, with commit trailers and a `Lesson:` line naming the new check.
