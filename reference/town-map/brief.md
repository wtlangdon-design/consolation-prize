# The district map's church: for the session with the image key (errata 163)

Written 2026-11-07. **Authorized:** Tyler was told the map draws the church in the middle of Main Street's row, while the game has it at the east end of town on Lower Street (errata 43, 161). He was advised to leave it and said **"I'd rather fix it"**. The cap is `town-map`: **2** in `art/staging/caps.json` (one edit and one correction). `tools/art/room-op.mjs` enforces it and records every operation in `art/staging/ledger.json`.

Never touch `wtlangdon-design/anchorage`.

## What changes

Only the town's north row:
- The church in the middle of the row becomes an ordinary false-front building like its neighbours.
- The church takes the place of the last building at the row's east end, by the bend in the road and the creek.

Nothing else on the map may move. The markers and the roads the map's Thad walks are measured off this picture (`content/rooms/town-map.json`), so `tools/art/town-map-edit.py` pastes back **only the north row** from the edit. Everything else stays the shipping map's own pixels.

## Steps

1. **Prepare.** `art/staging/town-map/edit-01/input.png` is already written and committed. To rebuild it, run `python3 tools/art/town-map-edit.py prepare`. It is the town at 1:1, drawn up 2× to 1536 × 1024.
2. **Edit.** Run `NODE_USE_ENV_PROXY=1 node tools/art/room-op.mjs reference/town-map/prompts/edit-01.spec.json`.
3. **Candidate.** Run `python3 tools/art/town-map-edit.py promote --attempt 1`. It writes `candidate.png` beside the source and prints how much the edit changed inside and outside the row.
4. **Check the candidate at full size:**
   - the middle of the north row is a plain building, with no steeple and no gap;
   - the church, with its steeple, stands at the row's east end;
   - the seam where the row meets the grass and the road above and below it is invisible;
   - there is no text anywhere.

   If a check misses, the one correction is `edit-02`. Copy the spec and prompt to `-02`, point `images` at `edit-01/input.png`, and state the miss in the prompt.
5. **Promote.** Run `python3 tools/art/town-map-edit.py promote --attempt N --write`. It replaces `art/backgrounds/room-00-town-map.png`.
6. **Run** `npm test` and `node tools/run-all.mjs`, then commit the source, the candidate, the shipping map and the ledger row. Open a PR whose description says `Lesson: none -- art for errata 163's map`, and merge it when CI is green.
