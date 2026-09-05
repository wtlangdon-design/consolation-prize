# OPENING SET CONTINUITY RETROFIT AUDIT — ROOM 2 MAIN STREET + ROOM 3 BOUNTIFUL NUGGET

*2026-09-05. Audit only: nothing fixed, generated, regenerated, recast, repainted or promoted. Zero image operations. Machine-readable table: `proofs/factory/opening-set-retrofit-audit.json`. Live runs: `renders/proofs/opening-set-audit/main-street/` and `.../nugget/` (contact sheets tracked, raw frames ignored). Review sheets: `renders/opening-set-audit/`.*

## Owner finding, restated

Room 5 is the visual style target for the game; Main Street and the Nugget do not yet feel as though they live in the same visual universe; they can read as painted backdrops while Room 5 reads as a place Thad and Winnie inhabit. The audit diagnoses why; it does not redecide it.

## Why Room 5 feels like a room and the other two like pictures

1. **Foreground layering and occlusion.** Room 5 puts the counter, the cage bars and the lamp in front of Winnie -- three planes with a person inside them -- and Room 1 has rails, a wheel and barrels at the near edge. Main Street has no foreground plane and no working mask; the Nugget occludes nobody because the floor stops at the bar and the table. In both rooms Thad is drawn on top of everything, which is what "in front of an illustration" means.
2. **Detail distribution and value structure.** Measured grain: Main Street 6.0-6.5 and the Nugget 4.6-6.4 on every surface, against Room 5 at 1.2-2.3 and Room 1 at 3.0. One texture frequency on floor, wall and sky is one surface; Room 5's broad flat masses with grain only where the work is read as materials.
3. **Architecture-to-figure scale.** Main Street's doorways are 102-134 px, so Thad is 105-206 there against 240 in Room 1, 228-430 in the Nugget and 470-560 in Room 5. The player watches him halve at the first cut and grow five-fold by the fourth room. The Nugget's curve is right; Main Street's plate is the outlier.
4. **Practical, localised light -- and movers lit by it.** Room 5 at night is dark with one work lamp and a stove bounce; the Nugget is lit everywhere at once; Main Street lights every window equally. And in every room the renderer lights the plate, not the people: Thad stands cool in the saloon's orange pool beside a pie woman who glows.
5. **Characters designed for the scene, cut for their place.** Winnie came from the composition master in one generation and was matted behind the counter with her props separated. The Nugget's patrons are patches of the plate in two hands, one of them realistic; Main Street's pie woman and letter-writer are naturalistic portraits beside a cartoon Thad.
6. **Stateful props and occupation.** Room 5 has a board that gives, a pen that leaves its stand, a lamp that is the light. Main Street's only states are unreachable Act III overlays; the Nugget has none and its crowd changes pose on timers without doing anything.

Room 5 feels like a room because Thad and Winnie stand inside a stack of planes with flat, quiet surfaces lit from one place, among people drawn in their own hand; Main Street and the Nugget feel like backdrops because everything in them is one textured surface at one light, with the people -- and Thad -- laid on top of it, and Main Street's buildings are half the size of its people.

Measured: texture grain (mean neighbour difference of luma) main-street mud 6.0, main-street walls 6.5, main-street sky 1.8, nugget floor 6.4, nugget back wall 4.6, nugget ceiling 3.7, room5 night floor 1.4, room5 night wall 1.2, room5 day floor 2.3, room5 day wall 1.7, room1 mud 3.0, room1 sky 1.1. Thad's drawn height: room1 240, main_street 105-206 (147 mid), nugget 198-459 (228 table, 307 mid, 430 bar), room5 470-560 (515 mid).

## ROOM 2 — MAIN STREET

Sheet: `renders/opening-set-audit/main-street-audit-sheet.webp` · run: `renders/proofs/opening-set-audit/main-street/life.json`

| Subject | Class | Layer | Image op | Tyler approves | Reason (short) |
|---|---|---|---|---|---|
| plate | **REGENERATE-CANDIDATE** | plate/composition | yes | yes | The painted-backdrop reading is plate-deep on three counts that no lighting, mask or sprite pass reaches. (1) Architectural scale: every doorway is 102-134 px, so the room's own depth curve makes Thad 105-206 px -- half … |
| spatial realization | **REGENERATE-CANDIDATE** | plate/composition (primary); occlusion and lighting (secondary) | yes | yes | What gives the street volume today: the saloon's porch, the false fronts' side walls, the boardwalk's edge, the road curving off east. What flattens it: one grain on every surface; no near plane; every window lit at one … |
| masks | **DEBT-NOT-VISUAL** | occlusion | no | no | Both masks are 320x144, describe a lumber stack and wheel that are not in this plate, and are skipped by the renderer (maskPending), so nobody is occluded anywhere. Live effect: small -- the plate has only the trough and… |
| map seller -- casting/design | **KEEP** | character design | no | no | Big friendly features, simplified planes, a coat that hangs -- the same adventure idiom as Thad and Winnie. At 150 px he holds up.… |
| map seller -- rendering/integration | **IMPROVE** | placement/contact/lighting | no | no | Stands on the assay office step in the lantern's pool, relit per position (sprite luma 82 against the plate ring's 65: a touch bright, within a lamplit figure's licence). Contact with the step is right. His post beside t… |
| map seller -- life | **IMPROVE** | room life | no | no | Three separate break poses from a pool (holding the map up, adjusting his hat) on an irregular timer, plus his reputation barks on approach. Decorative rather than occupational: canon has him selling and calling ("Map to… |
| pie woman -- casting/design | **RECAST** | character design/rendering | yes | yes | Her portrait is a naturalistic drawing: realistic seven-head proportions, a small realistic face, painterly fabric with fine tonal gradation. Beside Thad (3¾ heads, flat masses, one clean lobe of hair) she is a person fr… |
| pie woman -- rendering/integration | **KEEP** | placement/contact/lighting | no | no | Placed in the saloon's pool and relit for it (87 against 81); feet on the mud; scale on the curve. The one figure whose light matches her place -- and that is the control that shows Thad, unlit beside her, is the odd one… |
| pie woman -- life | **KEEP** | room life | no | no | Her cry "Pie." fires as a world caption on a raised-hand break (breaksThatSpeak): the one occupational act on the street, and it is hers. Three separate breaks from a pool.… |
| letter-writer -- casting/design | **RECAST** | character design/rendering | yes | yes | Naturalistic portrait: spectacles, a realistic moustache and jaw, seven-head proportions, fine cloth folds. Not Thad's and Winnie's drawing. Frame 5 of the sheet puts him a body-width from Thad and the two families are p… |
| letter-writer -- rendering/integration | **IMPROVE** | placement/contact/lighting | no | no | Stands in open mud in front of the notice board holding a satchel; relit acceptably (74 against 70). No station, so nothing for his feet or hands to relate to.… |
| letter-writer -- life | **IMPROVE** | room life | no | no | Canon: writes letters home, ten cents the page, doing better than anyone. Live: three poses (satchel, hat, papers) from a pool; no writing, no papers on a surface, no customer, no station. The player sees a man standing … |
| dog | **IMPROVE** | design/scale/contact | no | no | A sleeping brown dog at 113 px on the room's curve: the right size, the right idiom (a soft dark mass), a two-frame ribcage derived at portrait scale. Reads as life rather than a prop because he is asleep, which is the c… |
| room life overall | **IMPROVE** | room life | no | no | Over 60 s: three figures change pose every few seconds on mutually prime timers, the dog breathes, the pie woman calls once. Nobody is frozen; nothing is repetitive in lockstep. But the activity is decorative -- poses, n… |
| base lighting | **IMPROVE** | plate lighting | no | no | Three declared lamps (saloon, assay lantern, company windows) draw radial pools on the plate. The plate itself lights every window on the street at one intensity, so the saloon reads as the exception by size rather than … |
| actor-light integration | **DEBT-NOT-VISUAL** | renderer | no | no | Lamps are drawn "after the plate, before the people": a mover is never lit by a lamp. Thad stands in the saloon's orange pool in his cool blue coat while the pie woman beside him glows -- the pasted-sprite reading, on th… |
| assay-office destination | **IMPROVE** | readability | no | no | Readable without highlighting: the only other lantern on the street hangs over its door, the map seller is posted on its step, and the hover names it. The sign board above the door is blank and the building is a narrow s… |
| exterior/interior continuity to Room 5 | **DEBT-NOT-VISUAL** | promotion | no | yes | Through the door today the SHIPPING build draws Room 5's legacy 320x144 placeholder (frame m18 of the run), because the accepted night plate is still staged. With the candidate loaded the pair is coherent: night street, … |
| exits / re-entry | **KEEP** | transit | no | no | Two assay-office round trips and a Nugget round trip in one run: arrival points correct, facing correct, the stale open-door defect stays fixed, no walk replays. The saloon door reads as a door in a building; the assay d… |
| dialogue (three micro-trees) | **KEEP** | dialogue | no | no | Approach lands a body-width from the speaker, facing them; choices draw as a list with no stale stage-direction prompt; the gated follow-up ("Going well?") appears after its opener; W1 counts persist; the universal exit … |
| Act III overlays -- assets | **IMPROVE** | state art | no | no | The gilt sign is a crisp, correctly registered relettering. The funeral notice is a blank near-white rectangle pinned over the board: at night it will read as a lit tile. The engine draws sign text at runtime, so the bla… |
| Act III overlays -- state architecture | **KEEP** | world state | no | no | Declared as state images at plate coordinates with ACT gates -- the same mechanism Room 5's floorboard uses. Nothing to change.… |
| ACT writer | **DEBT-NOT-VISUAL** | content | no | no | Nothing writes ACT (doc 48 S1 is unbuilt), so the overlays are unreachable and check-flag-order stays red. Not this room's and not visual.… |
| compiler / act-variant debt | **DEBT-NOT-VISUAL** | compiler | no | no | Compiles current; four Part Two-B act variants on existing hotspots (false fronts, notices, sign, dog) are reported NOT compiled on every run.… |

### Rows in full

**plate — REGENERATE-CANDIDATE** (plate/composition)

The painted-backdrop reading is plate-deep on three counts that no lighting, mask or sprite pass reaches. (1) Architectural scale: every doorway is 102-134 px, so the room's own depth curve makes Thad 105-206 px -- half his Room 1 size (240) and a fifth of Room 5 (470-560); the buildings are toys the size of the people, and the Room 1 > Main Street cut halves the protagonist on screen. (2) Detail distribution: mud, walls and boards all carry the same fine dither (measured grain 6.0-6.5 against Room 5's 1.2-2.3 and Room 1's 3.0), so the whole street is one surface; puddle highlights are spread evenly across 3700 px. (3) No foreground plane: nothing stands between the camera and the street (Room 1 has rails, a wheel and barrels; Room 5 the counter and cage bars), and the two occluders the plate does offer (the trough, the porch posts) never pass in front of Thad. Mood, night, composition and the saloon as the one lit doorway are RIGHT and are the ancestry the new candidate keeps (Room 1 authority: exterior night, darkness, arrival).

*Action:* One composition master from the current plate as ancestry (same street, same night, same saloon exception) at the game's architectural scale -- a man of ~240 at the boardwalk, doorways ~280 px -- with a near foreground plane (rail, post, trough) and selective detail; then the night plate; then the two Act III companions as edits of it. The current plate stays shipping until Tyler accepts the candidate. *Art scope:* 1 composition master + 1 plate + 2 Act III companion edits = ~4 operations, plus re-reading every rect, walk box, depth curve and lamp in the annotator on the new plate (0 operations).

*Evidence:* `renders/opening-set-audit/main-street-audit-sheet.webp`, `renders/opening-set-audit/opening-set-continuity-sheet.webp`, `docs/36-issue-list.md::Q10 · ROOM 2'S PLATE IS DRAWN AT ROUGHLY HALF THE GAME'S FIGURE SCALE`, `proofs/thad/locomotion.json`

**spatial realization — REGENERATE-CANDIDATE** (plate/composition (primary); occlusion and lighting (secondary))

What gives the street volume today: the saloon's porch, the false fronts' side walls, the boardwalk's edge, the road curving off east. What flattens it: one grain on every surface; no near plane; every window lit at one intensity; Thad drawn on top of everything with nothing to stand behind; buildings at half figure scale. The issue is plate-deep: Room 5's sense of place cannot be reached here by masks and relights alone, because the plate offers almost nothing to occlude with and its scale is wrong for the cast.

*Action:* See plate. If Tyler keeps the plate, the deterministic ceiling is: trough and porch-post masks, movers lit by lamps, per-window value hierarchy by companion edit -- and the scale stays wrong.

*Evidence:* `renders/opening-set-audit/main-street-audit-sheet.webp`, `renders/opening-set-audit/opening-set-continuity-sheet.webp`

**masks — DEBT-NOT-VISUAL** (occlusion)

Both masks are 320x144, describe a lumber stack and wheel that are not in this plate, and are skipped by the renderer (maskPending), so nobody is occluded anywhere. Live effect: small -- the plate has only the trough and the porch posts to occlude with, and Thad rarely crosses them (frame 11 of the sheet: the near west corner has nothing to stand behind). They do not materially reduce depth because there is little depth to reduce; the flatness is the plate's.

*Action:* If the plate is regenerated: author planes in the annotator on the new plate (0 operations). If kept: cut trough and post masks from the shipping plate deterministically (tools/art/room05-mask.mjs's method), 0 operations. Either way the maskPending flag comes off only when a mask describes the picture.

*Evidence:* `docs/36-issue-list.md::Q20 · BOTH OF MAIN STREET'S OCCLUSION MASKS DESCRIBE A STREET THAT NO LONGER EXISTS`, `content/rooms/main-street.json`, `renders/opening-set-audit/main-street-audit-sheet.webp`

**map seller -- casting/design — KEEP** (character design)

Big friendly features, simplified planes, a coat that hangs -- the same adventure idiom as Thad and Winnie. At 150 px he holds up.

*Action:* None.

*Evidence:* `renders/opening-set-character-strip.png`, `reference/room-02/cast/map-seller-portrait.png`, `renders/opening-set-audit/main-street-audit-sheet.webp`

**map seller -- rendering/integration — IMPROVE** (placement/contact/lighting)

Stands on the assay office step in the lantern's pool, relit per position (sprite luma 82 against the plate ring's 65: a touch bright, within a lamplit figure's licence). Contact with the step is right. His post beside the assay door is also Thad's arrival point from Room 5, so the two overlap on every exit.

*Action:* Move the assay-office arrival point or his post by a few dozen pixels in the annotation (0 operations); re-match his relight to the new plate if one comes.

*Evidence:* `renders/opening-set-audit/main-street-audit-sheet.webp`, `content/ambient/map-seller.json`

**map seller -- life — IMPROVE** (room life)

Three separate break poses from a pool (holding the map up, adjusting his hat) on an irregular timer, plus his reputation barks on approach. Decorative rather than occupational: canon has him selling and calling ("Map to Mott's strike! Dollar!"); nothing in the build shows a map being offered to a passer-by or a call as a world caption the way the pie woman's "Pie." is.

*Action:* Author his bark as a world caption on a break (the pie woman's mechanism, 0 operations); an offered-map pose exists on his sheet already.

*Evidence:* `renders/proofs/opening-set-audit/main-street/life.json`, `content/ambient/map-seller.json`, `docs/07-ambient-layer.md`

**pie woman -- casting/design — RECAST** (character design/rendering)

Her portrait is a naturalistic drawing: realistic seven-head proportions, a small realistic face, painterly fabric with fine tonal gradation. Beside Thad (3¾ heads, flat masses, one clean lobe of hair) she is a person from a different drawing. At 157 px the contrast softens but the proportions and value structure stay hers; in frame 6 of the sheet she and Thad do not read as the same cast.

*Action:* One casting sheet in Winnie's method (composition master transmitted; three poses: rest, offering, calling) with the same basket and shawl so the character survives the redraw. Current sprite stays until accepted. *Art scope:* 1 casting sheet.

*Evidence:* `renders/opening-set-character-strip.png`, `reference/room-02/cast/pie-woman-portrait.png`, `renders/opening-set-audit/main-street-audit-sheet.webp`

**pie woman -- rendering/integration — KEEP** (placement/contact/lighting)

Placed in the saloon's pool and relit for it (87 against 81); feet on the mud; scale on the curve. The one figure whose light matches her place -- and that is the control that shows Thad, unlit beside her, is the odd one out.

*Action:* Carry the relight forward to whatever she becomes.

*Evidence:* `renders/opening-set-audit/main-street-audit-sheet.webp`, `docs/38-character-pipeline.md::LIGHT A SPRITE BY WHERE IT STANDS, NOT BY A GLOBAL GRADE`

**pie woman -- life — KEEP** (room life)

Her cry "Pie." fires as a world caption on a raised-hand break (breaksThatSpeak): the one occupational act on the street, and it is hers. Three separate breaks from a pool.

*Action:* None beyond re-cutting the breaks from the recast sheet.

*Evidence:* `renders/proofs/opening-set-audit/main-street/life.json`, `renders/opening-set-audit/main-street-audit-sheet.webp`, `content/ambient/pie-woman.json`

**letter-writer -- casting/design — RECAST** (character design/rendering)

Naturalistic portrait: spectacles, a realistic moustache and jaw, seven-head proportions, fine cloth folds. Not Thad's and Winnie's drawing. Frame 5 of the sheet puts him a body-width from Thad and the two families are plain.

*Action:* One casting sheet in Winnie's method, WITH HIS STATION: a table or board with papers, since the writing establishes a working business and nothing in the build shows one. The station is a prop cut from the same generation so it sits in his light. Current sprite stays until accepted. *Art scope:* 1 casting sheet (figure + station).

*Evidence:* `renders/opening-set-character-strip.png`, `reference/room-02/cast/letter-writer-portrait.png`, `renders/opening-set-audit/main-street-audit-sheet.webp`

**letter-writer -- rendering/integration — IMPROVE** (placement/contact/lighting)

Stands in open mud in front of the notice board holding a satchel; relit acceptably (74 against 70). No station, so nothing for his feet or hands to relate to.

*Action:* Resolved by the recast's station; until then nothing deterministic changes the reading.

*Evidence:* `renders/opening-set-audit/main-street-audit-sheet.webp`, `content/ambient/letter-writer.json`

**letter-writer -- life — IMPROVE** (room life)

Canon: writes letters home, ten cents the page, doing better than anyone. Live: three poses (satchel, hat, papers) from a pool; no writing, no papers on a surface, no customer, no station. The player sees a man standing near a notice board. The occupational behaviour is entirely missing, not weak.

*Action:* After the recast: breaks that write, blot, turn a page, look up -- Winnie's pattern -- cut from the recast sheet (0 further operations). No customer is authored anywhere; none is proposed.

*Evidence:* `renders/proofs/opening-set-audit/main-street/life.json`, `renders/opening-set-audit/main-street-audit-sheet.webp`, `docs/07-ambient-layer.md`

**dog — IMPROVE** (design/scale/contact)

A sleeping brown dog at 113 px on the room's curve: the right size, the right idiom (a soft dark mass), a two-frame ribcage derived at portrait scale. Reads as life rather than a prop because he is asleep, which is the correct joke. Grounding: no shadow under him; a dog-shadow.png exists in art/objects and nothing references it.

*Action:* Draw the existing shadow under him (content only, 0 operations). No redesign.

*Evidence:* `renders/opening-set-audit/main-street-audit-sheet.webp`, `content/ambient/dog.json`, `art/objects/room-02/dog-shadow.png`

**room life overall — IMPROVE** (room life)

Over 60 s: three figures change pose every few seconds on mutually prime timers, the dog breathes, the pie woman calls once. Nobody is frozen; nothing is repetitive in lockstep. But the activity is decorative -- poses, not tasks -- against Room 5's principle of a specific occupation. The letter-writer is the clearest gap (no station, no writing). Interrupt/resume after a conversation is correct.

*Action:* Occupational breaks per character, authored from canon (the pie woman offering, the map seller calling, the letter-writer writing), once the recasts land.

*Evidence:* `renders/proofs/opening-set-audit/main-street/life.json`, `renders/opening-set-audit/main-street-audit-sheet.webp`

**base lighting — IMPROVE** (plate lighting)

Three declared lamps (saloon, assay lantern, company windows) draw radial pools on the plate. The plate itself lights every window on the street at one intensity, so the saloon reads as the exception by size rather than by being the only warm thing, and the blue night is one even wash: no dark end of the street.

*Action:* Folds into the regenerated plate (fewer lit windows, a darker east end). If the plate is kept, a companion edit of window values is an image operation and is not recommended on its own.

*Evidence:* `renders/opening-set-audit/main-street-audit-sheet.webp`, `content/rooms/main-street.json`

**actor-light integration — DEBT-NOT-VISUAL** (renderer)

Lamps are drawn "after the plate, before the people": a mover is never lit by a lamp. Thad stands in the saloon's orange pool in his cool blue coat while the pie woman beside him glows -- the pasted-sprite reading, on the protagonist, in the room's brightest spot. The ambient three are lit only because they were statically relit per position.

*Action:* A small renderer change: tint movers by the lamps they stand in (the same radial falloff, applied to the sprite). Not a rewrite; 0 operations. Deferred to the retrofit, not done here.

*Evidence:* `renders/opening-set-audit/main-street-audit-sheet.webp`, `engine/render/Renderer.ts`

**assay-office destination — IMPROVE** (readability)

Readable without highlighting: the only other lantern on the street hangs over its door, the map seller is posted on its step, and the hover names it. The sign board above the door is blank and the building is a narrow shed against Room 5's wide interior -- genre licence, but the exterior gives no clue what it is.

*Action:* Runtime lettering on the sign board is the design's own rule ("the engine draws sign text at runtime") and is unbuilt for this sign; when built it resolves the readability. No highlight, no arrow.

*Evidence:* `renders/opening-set-audit/main-street-audit-sheet.webp`, `renders/proofs/opening-set-audit/main-street/life.json`

**exterior/interior continuity to Room 5 — DEBT-NOT-VISUAL** (promotion)

Through the door today the SHIPPING build draws Room 5's legacy 320x144 placeholder (frame m18 of the run), because the accepted night plate is still staged. With the candidate loaded the pair is coherent: night street, lantern over the door, lamp-lit interior. The break is promotion debt, not art.

*Action:* Promote Room 5's accepted assets (a logged step, Tyler's). 0 operations.

*Evidence:* `renders/proofs/opening-set-audit/main-street/life.json`, `renders/opening-set-audit/main-street-audit-sheet.webp`

**exits / re-entry — KEEP** (transit)

Two assay-office round trips and a Nugget round trip in one run: arrival points correct, facing correct, the stale open-door defect stays fixed, no walk replays. The saloon door reads as a door in a building; the assay door as a door with a lantern.

*Action:* None.

*Evidence:* `renders/proofs/opening-set-audit/main-street/life.json`

**dialogue (three micro-trees) — KEEP** (dialogue)

Approach lands a body-width from the speaker, facing them; choices draw as a list with no stale stage-direction prompt; the gated follow-up ("Going well?") appears after its opener; W1 counts persist; the universal exit closes; a second TALK TO reopens. The interaction belongs in the street.

*Action:* None.

*Evidence:* `renders/proofs/opening-set-audit/main-street/life.json`, `renders/opening-set-audit/main-street-audit-sheet.webp`

**Act III overlays -- assets — IMPROVE** (state art)

The gilt sign is a crisp, correctly registered relettering. The funeral notice is a blank near-white rectangle pinned over the board: at night it will read as a lit tile. The engine draws sign text at runtime, so the blank is by rule, but its value is not the board's papers' value.

*Action:* Lower the notice's paper value to the board's (deterministic, 0 operations) when the state becomes reachable; both must be re-cut if the plate is regenerated.

*Evidence:* `art/objects/room-02/company-sign-gilt-overlay.png`, `art/objects/room-02/posted-notices-act3-overlay.png`

**Act III overlays -- state architecture — KEEP** (world state)

Declared as state images at plate coordinates with ACT gates -- the same mechanism Room 5's floorboard uses. Nothing to change.

*Action:* None.

*Evidence:* `content/rooms/main-street.json`, `tools/check-state-images.mjs`

**ACT writer — DEBT-NOT-VISUAL** (content)

Nothing writes ACT (doc 48 S1 is unbuilt), so the overlays are unreachable and check-flag-order stays red. Not this room's and not visual.

*Action:* Out of scope until the act-turn room is built.

*Evidence:* `docs/36-issue-list.md::Q24 · THREE ROOM 5 REFUSALS HAVE NO HOTSPOT TO LIVE ON, AND THE QUEUE BENCH HAS NO LISTEN`

**compiler / act-variant debt — DEBT-NOT-VISUAL** (compiler)

Compiles current; four Part Two-B act variants on existing hotspots (false fronts, notices, sign, dog) are reported NOT compiled on every run.

*Action:* Compiler support for variants on existing hotspots, in the retrofit. 0 operations.

*Evidence:* `cmd:node tools/compile-room.mjs 2 --check`

### Minimum retrofit

**Required:** Tyler's ruling on the plate: REGENERATE-CANDIDATE at architectural scale (the only route to Room 5's standard); until then the current plate ships; pie woman and letter-writer RECAST (design generation); lamp-lit movers (renderer, 0 ops); trough/post masks on whichever plate ships (0 ops).

**Strongly recommended:** letter-writer's station and writing breaks; map seller's call as a world caption; Room 5 promotion so the door leads somewhere real.

**Optional polish:** dog shadow; funeral-notice value; assay-office arrival point clear of the map seller; runtime lettering on the assay sign board.

## ROOM 3 — THE BOUNTIFUL NUGGET

Sheet: `renders/opening-set-audit/nugget-audit-sheet.webp` · run: `renders/proofs/opening-set-audit/nugget/life.json`

| Subject | Class | Layer | Image op | Tyler approves | Reason (short) |
|---|---|---|---|---|---|
| plate | **REGENERATE-CANDIDATE** | plate/composition | yes | yes | Four reasons, the first decisive. (1) Seven people are painted into the plate (the room's own castNote: "the seven men are baked into the four whole plates"); the six "ambient" sheets are patches cut from the plate and d… |
| spatial realization | **REGENERATE-CANDIDATE** | plate (primary); character integration (secondary) | yes | yes | What gives the Nugget volume: a strong one-point perspective along the bar; the bar's front and stools; the stairs receding; the floor plane's slope (198 at the back to 459 at the front, and Thad tracks it correctly). Wh… |
| Thad integration | **KEEP** | protagonist | no | no | Frozen Thad on the room's own curve: 390 at the door, 307 mid-floor, 228 at the table, 430 at the bar beside 434-px drinkers -- scale right at every depth, feet on the floor, perspective consistent, silhouette clear agai… |
| patron family -- bar drinkers (nugget_bar1, bar2, bar3) | **RECAST** | character design/rendering | yes | yes | Three men with their backs to us at the counter: design serviceable (hats, braces, a raised glass), no faces to betray a family. But they exist only as 153-px-tall patches of the plate above the counter, chunky at plate … |
| patron family -- card players (nugget_man1, man2, man34; the card-table group) | **RECAST** | character design/rendering | yes | yes | Four seated men facing the camera at the room's centre, ~200 px, the most visible faces in the room -- and they are drawn in a different hand from Thad and Winnie: bearded, heavy-set, realistic faces and hands, heavy ton… |
| patron lighting / integration | **IMPROVE** | lighting | no | no | No per-position relight record exists for any patron; measured, bar3 (69 vs 41) and man1 (70 vs 33) are far brighter than the plate around them, the others roughly matched by virtue of being the plate. Under a clean plat… |
| patron room life | **IMPROVE** | room life | no | no | Over 60 s: six figures each swap between two or three states on 4-8 s beats, mutually prime, so somebody moves about every three-quarters of a second. Nobody is frozen. But nothing social happens: nobody serves, pours, d… |
| room life overall | **IMPROVE** | room life | no | no | Decorative beats, not occupation; correct timing discipline; no interruption/resume issue (no talkable patron exists to interrupt).… |
| card table -- asset | **KEEP** | prop | no | no | The table, chairs, bottle and the abandoned hand are drawn well and at the right scale for the depth; the hand of cards hotspot sits on the tabletop. As a PROP it survives the retrofit (cut from the clean plate or the sa… |
| card table -- actor/table integration | **RECAST** | character/prop layering | yes | yes | Players and table are one baked sprite: hands and cards relate because they were painted together, chairs and bodies never separate. Thad at (900,515) stands among the chairs drawn over the far players because the group … |
| card table -- social animation | **IMPROVE** | room life | no | no | Two halves of the group alternate three states; no deal, no pot, no reaction.… |
| piano -- visual asset | **KEEP** | plate element | no | no | An upright against the left wall with a stool, scratched, prominent on the arrival line of sight, at a scale Thad can approach and work on. Reads as a physical object.… |
| piano -- future state architecture | **DEBT-NOT-VISUAL** | world state | yes | yes | A8 tunes it with the lid open: an authored state image (Interactable.states with image/imageByState) is exactly the floorboard's mechanism and needs no new architecture -- but the lid-open picture is an edit of the plate… |
| piano -- clue / readability | **DEBT-NOT-VISUAL** | annotation geometry | no | no | The hotspot rect [428,250,156,252] sits on the wall LEFT of the drawn piano (drawn at ~540-690 x): hovering the piano names nothing, and LOOK walks Thad to face the wall beside it (frame 7 of the sheet). The clue is disc… |
| handbill | **IMPROVE** | clue perceptibility | no | no | The paper IS drawn: a small pinned sheet on the wall between the door and the window, ~35x70 px at gameplay scale, mundane, world-first, not highlighted -- the floorboard lesson met on the picture. Its LOOK plays the ful… |
| stairs / the man on the landing | **DEBT-NOT-VISUAL** | canon vs plate (ruling 19b) | yes | yes | Doc 16's LOOK: "There is a man on the landing. There is always a man on the landing." The plate's landing is empty (frame 9); the room file records him as drawn on the seventh tread and he is not. Ruling 19b: a LOOK desc… |
| base lighting | **REGENERATE-CANDIDATE** | plate lighting | yes | yes | The plate is lit everywhere at once: no pool under the chandelier, no bounce from the stove, the far wall as bright as the bar front. The three declared lamps add a 6-14% flicker over a plate that already has no darkness… |
| actor-light integration | **DEBT-NOT-VISUAL** | renderer | no | no | Same renderer debt as Main Street: movers are never lit by lamps.… |
| dialogue / social interaction | **KEEP** | dialogue | no | no | No patron has a tree, so there is no social interaction to audit beyond one: TALK TO on THE PATRONS plays doc 16's override and Thad walks to the table and faces it (frame 10) -- the approach and contact are right for th… |
| Deke Vessel | **DEBT-NOT-VISUAL** | cast (unbuilt, Act II) | yes | yes | Per doc 04 VES_A1 the A3 sale is staged in the opening's shadow and his standing appearance is VES_B1 in Act II, so he is act-gated like the raccoon; his provisional rect [1180,330,120,300] lands on bar drinker 1's stool… |
| raccoon -- future-state architecture | **DEBT-NOT-VISUAL** | world state (deferred) | yes | yes | Act II after A5; provisional rect [1470,300,90,70] on the bottle shelf, not the bar top. An act-gated ambient sprite on the bar's end is expressible with the existing ambient record plus a gate the ambient schema does no… |
| compiler | **DEBT-NOT-VISUAL** | compiler | no | no | Exact mismatch: doc 16 Part Three writes its overrides as `**PIANO** · USE`, `**BAR** · PUSH`, `**STOVE** · OPEN`, `**PATRONS** · TALK TO`, `**HANDBILL** · PICK UP`, `**CARDS** · PICK UP`, `**STAIRS** · USE`, `**CHANDELI… |
| stale content / extraction debt | **DEBT-NOT-VISUAL** | content | no | no | The front-doors LOOK 2 carries the pre-errata-64 "Daylight past them." Falls out of the compiler fix.… |
| hotspot geometry (whole room) | **DEBT-NOT-VISUAL** | annotation geometry | no | no | Proved live by hover: the drawn stairs answer THE MIRROR, the drawn portrait and stove answer THE STAIRS, the drawn handbill answers THE WINDOW, the drawn piano and chandelier answer nothing, the drawn back doorway answe… |

### Rows in full

**plate — REGENERATE-CANDIDATE** (plate/composition)

Four reasons, the first decisive. (1) Seven people are painted into the plate (the room's own castNote: "the seven men are baked into the four whole plates"); the six "ambient" sheets are patches cut from the plate and drawn over their own baked selves. That is the rule doc 35 states in capitals, and it means the crowd can never leave, change, be relit, or make room for Deke or the raccoon without collision. (2) One warm grade and one dither over floor, walls and ceiling (grain 6.4 / 4.6 / 3.7 against Room 5's 1.2-2.3): the room is a single textured surface, which is why the good perspective along the bar still reads as a picture. (3) The chandelier is painted lit and the room declares it as a flickering lamp, while doc 16 has Thad say it has never been lit while he has been in the room. (4) The plate was re-composed after the annotation was read (the bar moved 432 px, per the annotation), and nobody re-read it. The composition -- the camera along the room, the bar running away right, the doors and window left -- is right and is the ancestry to keep.

*Action:* One composition master from the current plate as ancestry with NO people, the chandelier unlit (or a ruling that doc 16 changes), broad flat masses and selective grain, a stove and wall-lamp pool as the practical light; then the clean plate; the crowd returns as sprites (see the patron rows). The current plate stays shipping until Tyler accepts the candidate. *Art scope:* 1 composition master + 1 clean plate = 2 operations, plus every rect, walk box and obstacle re-read in the annotator (0 operations).

*Evidence:* `renders/opening-set-audit/nugget-audit-sheet.webp`, `renders/opening-set-audit/opening-set-continuity-sheet.webp`, `content/rooms/nugget.json`, `reference/room-03/annotation.json`, `docs/35-room-gate.md::NO PERSON IS EVER PAINTED INTO A PLATE. EVER.`

**spatial realization — REGENERATE-CANDIDATE** (plate (primary); character integration (secondary))

What gives the Nugget volume: a strong one-point perspective along the bar; the bar's front and stools; the stairs receding; the floor plane's slope (198 at the back to 459 at the front, and Thad tracks it correctly). What flattens it: the uniform warm grain on every surface; light that is everywhere and nowhere (no pool under the chandelier, none from the stove); a crowd whose front-facing members are drawn in another hand; nothing ever in front of Thad (the floor stops at the bar and the table, so he never passes behind a stool or the table edge). The plate carries the first two; the crowd carries the third; the fourth is authoring. Room 5's gap is mostly plate and cast, in that order.

*Action:* See plate and patron rows. Occlusion by the near stools and the table edge is cheap once the plate is clean (masks from the new plate, 0 operations).

*Evidence:* `renders/opening-set-audit/nugget-audit-sheet.webp`, `renders/opening-set-audit/opening-set-continuity-sheet.webp`

**Thad integration — KEEP** (protagonist)

Frozen Thad on the room's own curve: 390 at the door, 307 mid-floor, 228 at the table, 430 at the bar beside 434-px drinkers -- scale right at every depth, feet on the floor, perspective consistent, silhouette clear against the crowd. He is not lit by the chandelier or stove (the renderer debt above), which is the room's to fix.

*Action:* None on Thad. Lamp-lit movers is the renderer item.

*Evidence:* `renders/opening-set-audit/nugget-audit-sheet.webp`, `renders/proofs/opening-set-audit/nugget/life.json`, `proofs/thad/locomotion.json`

**patron family -- bar drinkers (nugget_bar1, bar2, bar3) — RECAST** (character design/rendering)

Three men with their backs to us at the counter: design serviceable (hats, braces, a raised glass), no faces to betray a family. But they exist only as 153-px-tall patches of the plate above the counter, chunky at plate resolution, with one beat frame each; drinker 3 is 32 luma brighter than the wall behind him. They cannot be moved, relit, or re-posed, and the clean plate has no drinkers in it.

*Action:* One casting sheet: three back/three-quarter drinkers in Winnie's method, cut whole, relit per position, with two or three breaks each (raise glass, turn to the neighbour, set glass down). Current patches stay until accepted. *Art scope:* 1 casting sheet.

*Evidence:* `renders/opening-set-character-strip.png`, `reference/room-03/cast/bar-v2.png`, `renders/opening-set-audit/nugget-audit-sheet.webp`, `content/ambient/nugget-bar1.json`

**patron family -- card players (nugget_man1, man2, man34; the card-table group) — RECAST** (character design/rendering)

Four seated men facing the camera at the room's centre, ~200 px, the most visible faces in the room -- and they are drawn in a different hand from Thad and Winnie: bearded, heavy-set, realistic faces and hands, heavy tonal shading. Frame 6 of the sheet beside frame 3 (Thad mid-floor) shows two casting generations at one table. Man 1 sits 40 luma above his surroundings. The table group is one baked sprite with two halves alternating three states, so the four men move as a mechanism.

*Action:* One casting sheet: four seated players in Winnie's method, cut individually, each with a deal/look/lean break on its own timer; the table and the abandoned hand as a prop cut from the same generation or from the clean plate. Current group stays until accepted. *Art scope:* 1 casting sheet (four figures) + the table as a prop from the clean plate.

*Evidence:* `renders/opening-set-character-strip.png`, `reference/room-03/cast/card-players.png`, `art/actors/nugget-card-table.png`, `renders/opening-set-audit/nugget-audit-sheet.webp`

**patron lighting / integration — IMPROVE** (lighting)

No per-position relight record exists for any patron; measured, bar3 (69 vs 41) and man1 (70 vs 33) are far brighter than the plate around them, the others roughly matched by virtue of being the plate. Under a clean plate with a real chandelier pool the recast figures are relit per position as Winnie was.

*Action:* match-local per figure on the recast sheets (0 operations).

*Evidence:* `renders/opening-set-audit/nugget-audit-sheet.webp`, `docs/38-character-pipeline.md::LIGHT A SPRITE BY WHERE IT STANDS, NOT BY A GLOBAL GRADE`

**patron room life — IMPROVE** (room life)

Over 60 s: six figures each swap between two or three states on 4-8 s beats, mutually prime, so somebody moves about every three-quarters of a second. Nobody is frozen. But nothing social happens: nobody serves, pours, deals, passes a bottle, turns to talk, or looks at the piano. There is no bartender in the build and none is written anywhere in canon (doc 16 writes no barman hotspot; the lamp note mentions one in passing), so none is proposed. The man on the landing is written and is not drawn (see stairs).

*Action:* Authored occupational breaks per recast figure from what canon gives: drinking, dealing, the raised glass, the corner storyteller ("the same story four times"). No new people beyond the written ones.

*Evidence:* `renders/proofs/opening-set-audit/nugget/life.json`, `renders/opening-set-audit/nugget-audit-sheet.webp`, `content/ambient/nugget-man34.json`

**room life overall — IMPROVE** (room life)

Decorative beats, not occupation; correct timing discipline; no interruption/resume issue (no talkable patron exists to interrupt).

*Action:* As above; lands with the recasts.

*Evidence:* `renders/proofs/opening-set-audit/nugget/life.json`, `renders/opening-set-audit/nugget-audit-sheet.webp`

**card table -- asset — KEEP** (prop)

The table, chairs, bottle and the abandoned hand are drawn well and at the right scale for the depth; the hand of cards hotspot sits on the tabletop. As a PROP it survives the retrofit (cut from the clean plate or the same generation).

*Action:* Carry as a prop.

*Evidence:* `renders/opening-set-audit/nugget-audit-sheet.webp`, `art/actors/nugget-card-table.png`

**card table -- actor/table integration — RECAST** (character/prop layering)

Players and table are one baked sprite: hands and cards relate because they were painted together, chairs and bodies never separate. Thad at (900,515) stands among the chairs drawn over the far players because the group is a single plane he is either in front of or behind. Separating the players from the table (recast) is what lets Thad pass behind a chair.

*Action:* With the player recast: table as a prop with an occlusion plane at its near edge.

*Evidence:* `renders/opening-set-audit/nugget-audit-sheet.webp`, `reference/room-03/annotation.json`

**card table -- social animation — IMPROVE** (room life)

Two halves of the group alternate three states; no deal, no pot, no reaction.

*Action:* Per-player breaks after the recast.

*Evidence:* `renders/proofs/opening-set-audit/nugget/life.json`

**piano -- visual asset — KEEP** (plate element)

An upright against the left wall with a stool, scratched, prominent on the arrival line of sight, at a scale Thad can approach and work on. Reads as a physical object.

*Action:* Carry into the regenerated plate unchanged in placement.

*Evidence:* `renders/opening-set-audit/nugget-audit-sheet.webp`

**piano -- future state architecture — DEBT-NOT-VISUAL** (world state)

A8 tunes it with the lid open: an authored state image (Interactable.states with image/imageByState) is exactly the floorboard's mechanism and needs no new architecture -- but the lid-open picture is an edit of the plate that does not exist, and baking the piano into the plate is fine only because its closed state is the base.

*Action:* When A8 is built: one companion edit for the open lid (1 operation, later, its own cap).

*Evidence:* `engine/core/types.ts`, `content/rooms/assay-office.json`

**piano -- clue / readability — DEBT-NOT-VISUAL** (annotation geometry)

The hotspot rect [428,250,156,252] sits on the wall LEFT of the drawn piano (drawn at ~540-690 x): hovering the piano names nothing, and LOOK walks Thad to face the wall beside it (frame 7 of the sheet). The clue is discoverable by eye and undiscoverable by cursor.

*Action:* Re-read the rect on the shipping plate (0 operations) -- part of the whole-room re-read below.

*Evidence:* `renders/proofs/opening-set-audit/nugget/life.json`, `renders/opening-set-audit/nugget-audit-sheet.webp`

**handbill — IMPROVE** (clue perceptibility)

The paper IS drawn: a small pinned sheet on the wall between the door and the window, ~35x70 px at gameplay scale, mundane, world-first, not highlighted -- the floorboard lesson met on the picture. Its LOOK plays the full Rules text. But its rect [262,248,42,66] sits on the door frame ~60 px left and ~60 px up of the paper: hovering the paper names THE WINDOW, and LOOK stands Thad facing the frame with the paper at his shoulder (frame 8). A curious player who sees the paper and clicks it gets the window.

*Action:* Re-read the rect on the paper (0 operations). Visual treatment: KEEP; carry the paper into the regenerated plate at the same place.

*Evidence:* `renders/opening-set-audit/nugget-audit-sheet.webp`, `renders/proofs/opening-set-audit/nugget/life.json`, `docs/05-examine-layer.md::ROOM 3 — THE BOUNTIFUL NUGGET#1`

**stairs / the man on the landing — DEBT-NOT-VISUAL** (canon vs plate (ruling 19b))

Doc 16's LOOK: "There is a man on the landing. There is always a man on the landing." The plate's landing is empty (frame 9); the room file records him as drawn on the seventh tread and he is not. Ruling 19b: a LOOK describes only what is rendered. The room's retiredNote makes him ruling 20's explicit exception (a person who never moves may be painted). Not fixable by the audit.

*Action:* Tyler rules: paint him into the regenerated plate as the standing exception, or strike/reword the line. Recorded, not decided.

*Evidence:* `renders/opening-set-audit/nugget-audit-sheet.webp`, `docs/16-room-03-content.md`, `content/rooms/nugget.json`

**base lighting — REGENERATE-CANDIDATE** (plate lighting)

The plate is lit everywhere at once: no pool under the chandelier, no bounce from the stove, the far wall as bright as the bar front. The three declared lamps add a 6-14% flicker over a plate that already has no darkness for them to matter in. Room 5's night shows the missing ingredient: a dark room with one place the work is lit.

*Action:* Folds into the plate candidate: practical light from the stove and the wall lamps, the chandelier unlit per doc 16, the corners dark.

*Evidence:* `renders/opening-set-audit/nugget-audit-sheet.webp`, `content/rooms/nugget.json`

**actor-light integration — DEBT-NOT-VISUAL** (renderer)

Same renderer debt as Main Street: movers are never lit by lamps.

*Action:* Lamp-lit movers, once, for every room.

*Evidence:* `engine/render/Renderer.ts`, `renders/opening-set-audit/nugget-audit-sheet.webp`

**dialogue / social interaction — KEEP** (dialogue)

No patron has a tree, so there is no social interaction to audit beyond one: TALK TO on THE PATRONS plays doc 16's override and Thad walks to the table and faces it (frame 10) -- the approach and contact are right for the one interaction that exists. Deke's tree is extracted (content/dialogue/deke-vessel.json) and wired to nobody.

*Action:* None until a talkable patron exists; the approach and contact that exist are right.

*Evidence:* `renders/opening-set-audit/nugget-audit-sheet.webp`, `renders/proofs/opening-set-audit/nugget/life.json`

**Deke Vessel — DEBT-NOT-VISUAL** (cast (unbuilt, Act II))

Per doc 04 VES_A1 the A3 sale is staged in the opening's shadow and his standing appearance is VES_B1 in Act II, so he is act-gated like the raccoon; his provisional rect [1180,330,120,300] lands on bar drinker 1's stool. There is compositional room for him only once the crowd is sprites on a clean plate. He has a tree, no design, no sheet.

*Action:* One casting master in Winnie's method when Act II is authorized (1 operation, its own cap); placement re-derived on the regenerated plate. Unbuilt is not RECAST: nothing exists to recast. *Art scope:* 1 casting master + 1 pose sheet, later.

*Evidence:* `reference/room-03/annotation.json`, `docs/04-dialogue-trees.md::DEKE VESSEL — three nodes and two duels`, `content/dialogue/deke-vessel.json`

**raccoon -- future-state architecture — DEBT-NOT-VISUAL** (world state (deferred))

Act II after A5; provisional rect [1470,300,90,70] on the bottle shelf, not the bar top. An act-gated ambient sprite on the bar's end is expressible with the existing ambient record plus a gate the ambient schema does not yet carry (Interactable has `when`; AmbientFile does not). Not Act I's and not penalised here.

*Action:* Deferred: an ambient `when` gate and one sprite, when Act II is built.

*Evidence:* `reference/room-03/annotation.json`

**compiler — DEBT-NOT-VISUAL** (compiler)

Exact mismatch: doc 16 Part Three writes its overrides as `**PIANO** · USE`, `**BAR** · PUSH`, `**STOVE** · OPEN`, `**PATRONS** · TALK TO`, `**HANDBILL** · PICK UP`, `**CARDS** · PICK UP`, `**STAIRS** · USE`, `**CHANDELIER** · PULL`, `**SPITTOON** · PICK UP` -- bare names -- while doc 05 names the subjects `THE PIANO`, `THE BAR`, ... and doc 16 Part One/Two head them `## THE STAIRS`, `## THE HAND OF CARDS`. The compiler keys overrides by doc 05's name and refuses the nine it cannot place rather than drop them. Consequence: nugget.json has no live writer; doc 16's reworded front-doors LOOK 2 ("The street past them...") is stale in the room file.

*Action:* Smallest fix: the compiler matches an override name to a doc 05 subject by dropping a leading "THE " on either side (and "CARDS" to "THE HAND OF CARDS" by an explicit alias table it refuses to grow silently); then compile-room 3 --write, register it as a generator, and the stale line re-extracts. Editing doc 16's nine headings instead is also one change, in the source of truth, and is the cleaner of the two if Tyler prefers the docs to agree. 0 operations.

*Evidence:* `cmd:node tools/compile-room.mjs 3`, `docs/36-issue-list.md::Q26 · ROOM 5 NEEDS A NIGHT STATE BEFORE IT SHIPS, AND TWO INTERIOR LINES STILL SAY DAYLIGHT`

**stale content / extraction debt — DEBT-NOT-VISUAL** (content)

The front-doors LOOK 2 carries the pre-errata-64 "Daylight past them." Falls out of the compiler fix.

*Action:* As above.

*Evidence:* `content/rooms/nugget.json`

**hotspot geometry (whole room) — DEBT-NOT-VISUAL** (annotation geometry)

Proved live by hover: the drawn stairs answer THE MIRROR, the drawn portrait and stove answer THE STAIRS, the drawn handbill answers THE WINDOW, the drawn piano and chandelier answer nothing, the drawn back doorway answers THE BAR. Seven of twelve rects are 60-200 px left of their subjects; only the doors, the spittoon, the table and the bar are on target. The annotation says the bar moved 432 px after the first reading; the rects were never re-read.

*Action:* Re-read every rect, obstacle, approach point and the walk box on whichever plate ships (the annotator, 0 operations) -- before any proof of this room is trusted. If the plate is regenerated, do it once on the new plate.

*Evidence:* `renders/proofs/opening-set-audit/nugget/life.json`, `renders/opening-set-audit/nugget-audit-sheet.webp`, `reference/room-03/annotation.json`

### Minimum retrofit

**Required:** geometry re-read on the shipping plate and the compiler fix (0 ops) -- before anything else is trusted; Tyler's ruling on the plate: REGENERATE-CANDIDATE with no painted people and the chandelier unlit; card players RECAST; bar drinkers RECAST (they exist only as plate patches); lamp-lit movers (renderer).

**Strongly recommended:** occupational breaks per recast figure from canon; occlusion planes at the near stools and the table edge on the clean plate; a ruling on the man on the landing.

**Optional polish:** interim relights of bar3 and man1; the piano's lid-open state when A8 is built.

**Where the Nugget's gap comes from:** plate 40% (grade, grain, baked people, lit chandelier); characters 30% (two generations at one table; plate patches); lighting 15% (no pools; movers unlit); layering 5% (occludes nobody; cheap once the plate is clean); roomLife 5% (beats, no occupation); infrastructure 5% of the LOOK -- and 100% of the click: the rects are off their subjects.

## Opening-set continuity: Room 1 → Main Street → Nugget → Room 5

- **weakLink:** Main Street: the plate's half-scale architecture and single-surface grain make it the one room that cannot reach Room 5's standard by deterministic work, and it is the hub the player crosses most.
- **largestVisualDiscontinuity:** Room 1 > Main Street: Thad halves on screen at the first cut and the town becomes a model. Second: Nugget > Room 5, where one warm textured surface gives way to flat quiet masses and a lamp.
- **largestCharacterDiscontinuity:** The Nugget's card players (realistic faces at the room's centre) against Thad; then Main Street's pie woman and letter-writer against Thad and Winnie.
- **largestRoomLifeDiscontinuity:** The Nugget: six beat-frames and nobody doing anything, in the room the writing calls loud and crowded; against Winnie writing.
- **thadStable:** Yes: one identity, one gait, the room's curve honoured everywhere; his only inconsistency is that no room lights him.
- **uiConsistent:** Yes: verb panel, sentence line, choice list and speaker placement identical in all four rooms.
- **movementConsistent:** Yes at 0.73 body-heights per second in every room; the SCREEN speed differs because the sizes do, which is correct.
- **isRoom5BetterStagedOrDifferentlyPainted:** Both, in order: differently painted (flat masses, selective grain, one light) FIRST, then better staged (planes, contact, props, occupation). A restaging of the current plates would close perhaps a third of the gap; the rest is in the pictures.

**Before Room 6:** Nugget geometry re-read and compiler fix (DEBT, 0 ops) so its proofs mean something; Room 5 promotion (owner step); lamp-lit movers in the renderer (0 ops); Main Street trough/post masks, dog shadow, funeral-notice value (0 ops); Tyler rules on the two REGENERATE-CANDIDATE plates and the four RECAST families; art begins only on his approval, each under its own cap.

## Proposed retrofit order

| # | What | Class | Kind | Ops | Tyler approves |
|---|---|---|---|---|---|
| 1 | Nugget: re-read every rect, obstacle and approach point on the shipping plate; compiler override-name reconciliation; re-extract the stale line; register compile-room 3 | DEBT-NOT-VISUAL | deterministic | 0 | no |
| 2 | Room 5 promotion of the accepted staged assets (logged) | DEBT-NOT-VISUAL | deterministic | 0 | yes |
| 3 | Renderer: movers lit by the lamps they stand in (all rooms) | DEBT-NOT-VISUAL | deterministic (small engine change) | 0 | no |
| 4 | Main Street: trough and porch-post masks cut from the shipping plate; dog shadow drawn; funeral-notice paper value; map seller call as a world caption; assay-office arrival point clear of the map seller | IMPROVE | deterministic | 0 | no |
| 5 | Nugget: match-local relights for bar3 and man1 on the current patches (interim) | IMPROVE | deterministic | 0 | no |
| 6 | Re-run both audit routes and the four-panel proofs; reassess against the sheets | proof | deterministic | 0 | no |
| 7 | Main Street plate: composition master at architectural scale from the current plate's ancestry, night plate, two Act III companions | REGENERATE-CANDIDATE | image operations | ~4 | yes |
| 8 | Nugget plate: composition master with no people and the chandelier unlit, clean plate | REGENERATE-CANDIDATE | image operations | 2 | yes |
| 9 | Nugget cast: card players sheet (4), bar drinkers sheet (3); relit, cut whole, per-figure breaks | RECAST | image operations | 2 | yes |
| 10 | Main Street cast: pie woman sheet; letter-writer sheet with his station | RECAST | image operations | 2 | yes |
| 11 | Re-annotate both rooms on the new plates; masks; relights; proofs; owner visual gate; then gameplay pass | proof | deterministic | 0 | yes |
| 12 | Deke Vessel master (Act II) and the raccoon: when those acts are authorized | DEBT-NOT-VISUAL | image operations, later | 2, later | yes |

## Classification tally

REGENERATE-CANDIDATE 5, DEBT-NOT-VISUAL 14, KEEP 10, IMPROVE 14, RECAST 5 (48 subjects).

## Nugget hover check (live, shipping plate)

| Pointer over the drawn… | The game names |
|---|---|
| drawn stairs | THE MIRROR |
| drawn mirror | (nothing) |
| drawn portrait | THE STAIRS |
| drawn stove | THE STAIRS |
| drawn piano | (nothing) |
| drawn handbill paper | THE WINDOW |
| drawn chandelier | (nothing) |
| drawn back doorway | THE BAR |
| drawn window | THE WINDOW |

**Awaiting Tyler's retrofit-scope approval. No retrofit has begun.**
