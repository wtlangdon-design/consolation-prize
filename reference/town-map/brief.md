# The district map, redrawn at night with the town as the game has it: for the session with the image key (errata 163)

Written 2026-11-07. **Authorized:** Tyler, three times that afternoon:
- of the church, drawn mid-Main Street while the game has it on Lower Street: **"I'd rather fix it"**;
- **"The map is set during the day. The game is set at night. We should probably have the map set at night too."**;
- **"The map also doesn't have the larger town square, which is pretty obvious in the game. And it has the fronts of buildings facing the map viewer, not the street that they would open up onto. It's okay to see the backs of buildings if that's what make sense."**

The cap is `town-map`: **4** in `art/staging/caps.json`. `tools/art/room-op.mjs` enforces it and records every operation in `art/staging/ledger.json`.

Never touch `wtlangdon-design/anchorage`.

## If the church edit has already run

The redraw below supersedes it. If `edit-01` was spent, it counts against the cap and nothing more is done with it. Do not promote it if it is not promoted yet. The redraw starts from whatever map is shipping.

## The town, as the game has it

`reference/town-map/town-layout-1920x864.png` blocks the town out over the map. This is errata 43's three streets, read off the plates:
- **Main Street** (Room 2) is a single row of false fronts along the north side of a wide, open square of mud, facing south onto it. Its plate shows nothing on the near side. The road from the west comes into the square's west end. The alley leaves from the west end (`to_back_alley`), and the road from the east end recedes north-east (`to_claims_road`).
- **The Lane** (Room 44) runs behind Main Street from that alley. Main Street's backs are on its south side, and five shopfronts face it from the north: the undertaker's, the photographer's, Ozymandia's tent, the barber's and the empty storefront.
- **Lower Street** (Room 43) is up the east road: the Registrar's, the church with its belfry and the bell on its post, and the livery. The Lane comes out onto it, and its road runs on east over the bridge to the claims road.
- The boarding house, the bakehouse and the schoolhouse sit on no street (errata 43). They stand on their own south-west of the square.

Outside the town nothing moves. The builder re-places the markers and re-measures the roads for the map's Thad on the result.

## Steps

1. **Prepare.** Run `python3 tools/art/town-map-edit.py prepare-redraw`. It writes `art/staging/town-map/redraw-01/input.png` (the shipping map) and `layout.png`, each in the 20:9 window of a 1536 × 1024 canvas.
2. **Redraw.** Run `NODE_USE_ENV_PROXY=1 node tools/art/room-op.mjs reference/town-map/prompts/redraw-01.spec.json`. Main Street's night plate goes with it, for the palette and for what the square looks like.
3. **Candidate.** Run `python3 tools/art/town-map-edit.py promote-redraw --attempt 1`. It prints how far the diggings side moved.
4. **Check the candidate at full size:**
   - it is plainly night, in the street plates' blues, with warm lit windows in town;
   - Main Street is one row of fronts facing south onto an open square, with no buildings on the square's south side;
   - the Lane runs behind Main Street, with Main Street's backs on one side and five shopfronts (one a tent) facing it;
   - Lower Street is up the east road, with the church on it;
   - the road east crosses the bridge to the diggings;
   - outside the town, everything is where it was: the shift it prints is within about 6 px;
   - there is no text and no moon disc.

   If a check misses, the correction is `redraw-02`, from the same `redraw-01` inputs, with the miss stated in the prompt.
5. **Promote.** Run `python3 tools/art/town-map-edit.py promote-redraw --attempt N --write`. Then in `reference/global-baseline.json`, set `room-00-town-map`'s `visualType` to `district-map-night` and delete its `daylight` line.
6. **Run** `npm test` and `node tools/run-all.mjs`. `tools/check-night-exposure.mjs` now holds the map to night. Commit the sources, candidates, layout, shipping map and ledger rows. Open a PR whose description says `Lesson: none -- art for errata 163's map`, and merge it when CI is green.

## Then: the mountain pass (redraw-03)

Written the same afternoon, after `redraw-01` was promoted (PR 234). Tyler said: **"at the beginning of the game I clearly walk out of a mountain pass into town. That's noticeable."** The builder compared every exterior plate with the night map:
- Room 1's coach stop is on a mountain road above the town's lamps, and Thad walks down it to Main Street's east end (the room's `stage_road` arrival, x 3660).
- Every plate shows the town in a valley ringed by mountains.
- The map had no pass, no coach stop and no mountains on its north and west, and its only road out ran west, where nobody in the game goes.

Tyler: **"That all sounds good."** The cap rises to 5: this pass, and one correction.

1. **Prepare.** Run `python3 tools/art/town-map-edit.py prepare-pass --attempt 3`. The committed `art/staging/town-map/redraw-03/input.png` is already this.
2. **Edit.** Run `NODE_USE_ENV_PROXY=1 node tools/art/room-op.mjs reference/town-map/prompts/redraw-03.spec.json`. Room 1's plate goes with it, as the coach stop to draw small.
3. **Candidate.** Run `python3 tools/art/town-map-edit.py promote-redraw --attempt 3`, with `--fit` if the frame drifts as it did before.
4. **Check the candidate at full size:**
   - there is a pass in mountains at the top edge, left of the graveyard;
   - the coach road comes down from it, past a small coach stop, to the east end of the square;
   - mountains ring the valley on the north and west;
   - the west road is gone;
   - everything else is where it was, including the Lane, the church and the diggings;
   - the shift outside the town is within about 6 px;
   - there is no text.

   If a check misses, the correction is `redraw-04`: copy the spec and prompt, point `images` at `redraw-03/input.png`, and state the miss.
5. **Promote** with `--write`. Run `npm test` and `node tools/run-all.mjs`. Commit, then open a PR whose description says `Lesson: none -- art for errata 163's map`, and merge it when CI is green. The builder re-places the markers and the roads on the result.

## Then: the square's L (town-01)

Written after the pass map was promoted (PR 237). Tyler said: **"a glaring difference is that the main square is in a very distinct L shape, which the map fails to incorporate."** Main Street's plate shows a long row of fronts along the back of the square. At its east end, the Nugget (the saloon with the balcony), the hotel and the assay office come forward down the square's side, and the road leaves past the assay office. He chose **"Yes, +2"**, so the cap is 7: this edit and one correction.

This is an edit of the town only, pasted back like the church edit, so nothing else on the map moves. `tools/art/town-map-edit.py` takes back only `TOWN_PASTE`: Main Street's rows, the square, its road loop and the Lane.

1. **Prepare.** `art/staging/town-map/town-01/input.png` is committed. To rebuild it, run `python3 tools/art/town-map-edit.py prepare-town --attempt 1`.
2. **Edit.** Run `NODE_USE_ENV_PROXY=1 node tools/art/room-op.mjs reference/town-map/prompts/town-01.spec.json`. Main Street's plate goes with it.
3. **Candidate.** Run `python3 tools/art/town-map-edit.py promote-town --attempt 1`.
4. **Check the candidate at full size:**
   - the fronts make an L, with the long row along the north side facing south, and the saloon, the hotel and a small office down the east side facing west;
   - the saloon is not also still in the long row;
   - the square is open in front of both arms, with its trough;
   - the road out leaves the east side towards the church street;
   - the Lane and its tent are unchanged;
   - the paste's edges are invisible;
   - there is no text.

   If a check misses, the correction is `town-02`: run `prepare-town --attempt 2`, copy the spec and prompt, and state the miss.
5. **Promote** with `--write`, then run `npm test` and `node tools/run-all.mjs`. Commit, then open a PR whose description says `Lesson: none -- art for errata 163's map`, and merge it when CI is green. The builder re-places the markers and the roads.

## Then: the town placed by code (pieces-01)

Written after the L map was promoted (PR 239). Tyler said: **"I really want it to look as similar to the actual game as possible ... Why wouldn't we give cc more specific instructions to do it totally right?"** Four tries showed the model will not follow a layout: asked to rearrange the town, it redrew everything or dropped half. So the model draws only buildings, and `tools/art/town-map-pieces.py` places them where `reference/town-map/town-plan.json` says. The plan is read off the game's plates. He said **"Yes"**; the cap is 13 (the pieces, the finishing pass, and one correction for each).

**What the plan fixes:**
- the east arm turned to face west onto the square, the saloon (the Nugget) largest, at the corner, with no gap after the long row;
- the hotel and the assay office below it, smaller;
- the Lane with five shopfronts, the tent third.

The long row, the Lane's road, Lower Street and everything else stay the shipping map's own pixels.

1. **Pieces.** `art/staging/town-map/pieces-01/town-2x.png` is committed. Run `NODE_USE_ENV_PROXY=1 node tools/art/room-op.mjs reference/town-map/prompts/pieces-01.spec.json`. Check the sheet:
   - three buildings on flat magenta, left to right the saloon, the hotel and the assay office;
   - each turned with its front facing left;
   - the map's view and pixel style;
   - sizes falling off left to right;
   - no text.

   If it misses, the correction is `pieces-02`: copy the spec and prompt to `-02`, keep `town-2x.png` from `pieces-01`, and state the miss.
2. **Assemble.** Run `python3 tools/art/town-map-pieces.py assemble --attempt N`. It cuts the sheet on its key, refuses unless it finds exactly three buildings, clears the plan's boxes, and sets each piece in its box. It writes `assembled.png`, `finish-input.png` and `finish-mask.png`. Look at `assembled.png` at full size: the buildings in place, the patches' edges showing. If a piece reads wrong in place, adjust its box in the plan (a few pixels) and re-assemble. That costs nothing.
3. **Finish.** Copy `reference/town-map/prompts/finish-01.spec.json` and change `pieces-01` to `pieces-0N` in its paths if N is not 1. Then run `room-op.mjs` on it. It is masked: only the pieces' boxes and the cleared boxes may change.
4. **Candidate.** Run `python3 tools/art/town-map-pieces.py finish --attempt N`. It pastes back only the masked boxes over the assembly.
5. **Check the candidate at full size:**
   - the buildings are where the plan put them and still face west;
   - the ground and the road meet them with no seam and no repeated pattern;
   - the Lane has five shopfronts with the tent third;
   - nothing outside the boxes changed;
   - there is no text.

   If it misses, the correction is a second finishing pass (`finish-02`, with the miss stated).
6. **Promote.** Run `finish --attempt N --write`, then `npm test` and `node tools/run-all.mjs`. Commit, then open a PR whose description says `Lesson: none -- art for errata 163's map`, and merge it when CI is green. The builder re-places the markers and the roads.

## Then: the whole district, dressed from a block-out (district-01)

**This supersedes parts five and six.** The town's block-out (`tools/art/town-map-blockout.py`) is not used.

Tyler said:
- **"What if you create a layout of where every building/location should be located ... Then it will know exactly where each building should go."**
- **"Feel free to create a completely new map if you need to."**
- **"Can't you just look inside the game and build the map layout based on what you see?"**

The builder read every exterior plate and wrote down where things are in `reference/district/plan.json`, room by room under `reading`. The two places the plates disagree are listed under `contradictions`. `tools/art/district-blockout.py` paints that plan as flat shapes in the night map's colours. The block-out is **the picture being edited**, not a reference beside it. The earlier redraw had its layout as a side picture, and the model kept to the old map.

The cap is 15: this dressing, and two corrections.

1. **Prepare.** `art/staging/town-map/district-01/input.png` is committed (`python3 tools/art/district-blockout.py build` rebuilds it).
2. **Dress.** Run `NODE_USE_ENV_PROXY=1 node tools/art/room-op.mjs reference/town-map/prompts/district-01.spec.json`. The current map goes with it as the style, and Main Street's plate goes for the street.
3. **Candidate.** Run `python3 tools/art/district-blockout.py promote --attempt 1`, with `--fit` if the frame drifts. It prints how far the drawing sits from the block-out.
4. **Check the candidate at full size against `reference/district/blockout-1920x864.png`:**
   - every building is where its block is, the same size, facing the same way:
     - the long row and the Lane's shops face down;
     - the Nugget, the hotel and the assay office face left onto the square;
     - the Nugget is the largest;
   - the church has its steeple and its bell post, and the livery its corral;
   - the roads, the creek, the bridges, the pass, the coach stop, the graveyard, the hole, the cabin, the stakes, the cairn, the laundry and Mott's field are where their shapes are;
   - the shift it prints is within about 8 px;
   - there is no text.

   If it misses, the correction is `district-02`: copy the spec and prompt, keep `district-01/input.png`, and state the miss.
5. **Promote** with `--write`. In `reference/global-baseline.json` the map stays `district-map-night` (do not add a `daylight` line). Run `npm test` and `node tools/run-all.mjs`. Commit, then open a PR whose description says `Lesson: none -- art for errata 163's map`, and merge it when CI is green. The builder sets the markers and the roads from the same plan.
