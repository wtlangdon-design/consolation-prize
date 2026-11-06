# Three art fixes, for the session with the image key (errata 116)

Written 2026-11-06. **No new authorization is needed.** Each item fits the room's existing cap in `art/staging/caps.json` (four operations per room, errata 72). Remaining when this was written:
- room-19: 2 operations left;
- room-36: 2 left;
- room-13: 1 left.

Read first:
- `CLAUDE.md`;
- errata 54 (presentation), 111 and 112 (one cast, one level) and 115;
- the rows of `docs/55-full-game-build.md` §8 on plates and light.

Never touch `wtlangdon-design/anchorage`. Each operation is run with `NODE_USE_ENV_PROXY=1 node tools/art/room-op.mjs <spec.json>`, which checks the cap and records the ledger row.

## 1 · Thad's room in the morning, packed (Room 19, Act IV): one operation, one correction if it plainly misses

**Why.** Errata 101 B: "When Act IV begins … the game cuts to Room 19 and Thad says doc 57's line once: *'Packed. It took four minutes; there was less to pack than there was to leave. The coach is at noon. I am going to look at my mud once more first, because nobody else will.'* The packed case on the bed and the morning light are Room 19's Act IV state and wait for the next session with an image budget." The room has shown its night picture under that line ever since.

**Steps.**
1. **Input.** Make it the way `tools/art/room19-plate.mjs` framed plate-01: Room 19's shipping plate (`art/backgrounds/room-19-thads-room.png`) placed back into the 1536×1024 frame that operation came from. For reference image 2, crop Thad's case from Room 1's plate (`art/backgrounds/room-01-stage-road.png`, the `case_mud` hotspot rect 1002,745 105×98, enlarged nearest-neighbour), so the case on the bed is his case.
2. **Prompt** (write it as `reference/room-19/prompts/act4-01.txt`, with a spec like `plate-01.spec.json`, out `art/staging/room-19/act4-01/source.png`). Ask for:
   - the same room, every object where it is;
   - early-morning light: thin and pale through the window onto the floor, the lamp out;
   - on the bed, the case in image 2, closed and strapped;
   - nothing else changed, and no people;
   - the same pixel art, pixel size and palette as the input.
3. **Derive** to 1920×864 with the same crop as `room19-plate.mjs`. Save the result as `art/backgrounds/room-19-thads-room-act4.png`.
4. **Wire it:**
   - In `reference/room-19/annotation.json`, add `plates: { "act4": "art/backgrounds/room-19-thads-room-act4.png" }` and `plateWhen: [{ "when": { "ACT": { "atLeast": 4 } }, "plate": "act4" }]` (the mechanism Room 34 uses).
   - Compile with `node tools/compile-room.mjs 19 --write`.
   - Check whether the morning wants a `figureLight` (errata 109).
5. **Prove it.** Run `tools/gauntlet/proof.mjs thads_room` with an Act IV fixture. The hotspot rects must still sit on their objects, and the case must not cover the bed hotspot's interaction.

## 2 · The dawn street's glowing edges (Room 36): fix in the tooling first, an operation only if that fails

**What the audit saw.** The dawn plate has bright glowing outlines along the rooftops and building edges, and a blue-green smear in the sky above the saloon roof: Room 2's night mountains showing through the morning.

**Why it happens.** `tools/art/room36-dawn.py` carries the morning's light onto Room 2's pixels as a blurred ratio of two small pictures. Its blur (`BLUR`) mixes the bright sky into the ratio at every roof edge, so the edge pixels are multiplied as if they were sky. Its sky mask keeps Room 2's own lower peaks where operation 1 drew its mountains higher.

**Steps.**
1. **Try the script first.** Blur the ratio with the sky excluded on both sides: a normalized convolution that weights each pixel by not-sky, so no roof takes the sky's light. Then decide what the mountains above the saloon are: morning sky (extend the mask) or morning mountains (relight them as ground).
2. **Re-run the script and look** at `renders/`-sized crops of every roofline. If it is clean, promote it as `room36-plate.mjs` did.
3. **Only if the script cannot clean it,** spend one operation (`dawn-02`) relighting a small copy again, with the halo named in the prompt.
4. Record the fix and its lesson as a doc 55 §8 row (light from a blurred ratio bleeds at edges).

## 3 · The undertaker's ceiling (Room 13): one operation

**What the audit saw.** The top 38 rows of `art/backgrounds/room-13-undertakers.png` are one flat colour (mean 23,23,22; std about 1), with a near-black line at row 38. The picture does not reach the top of the frame.

**Steps.**
1. Make the input the way `tools/art/room13-plate.mjs` did for plate-01, with the flat band marked as missing picture.
2. Ask for the band to be painted as the ceiling continuing upward: the same beams and boards as the rows below, the same dim light. Nothing below row 40 changes.
3. Promote it with `tools/art/room13-promote.mjs`.
4. Add a check that fails a plate whose top or bottom rows are one flat colour. Prove it on the old plate.

## After all three

Run `node tools/run-all.mjs` and `npm test`. Write an errata entry with the operations spent and the measurements. Open a pull request with its `Lesson:` line, and merge when green.
