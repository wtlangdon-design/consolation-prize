# Fiddler's Gulch, built: for the builder session with the image key (errata 190, 191, 194, 195)

Written 2026-11-08.

**Authorized:**
- **The design (doc 107).** Tyler, 2026-11-08: "Looks good to me!"
- **The lines (docs 108 and 109).** Tyler, 2026-11-08: "Yes", then "I like the Gulch sample. Proceed.", then "I'll leave it all up to you!"
- **The art.** Tyler, 2026-11-08: "Art budget approved". `art/staging/caps.json` gives:
  - `room-45` to `room-54`, four operations each;
  - `gulch-vessel`, two;
  - `gulch-reserve`, two.

  Check `art/staging/ledger.json` before every operation, and log every operation in it.
- **The music.** Tyler, 2026-11-08: "I defer to you on music". It is set in doc 28 Part Three and doc 45, "Rooms 45–54".

**The lines are written. Nothing here may be written by the builder.** If a room needs a line that docs 108 and 109 (or docs 03, 04 and 57 for what they name) do not have, stop and report it to Tyler.

Read first:
- `CLAUDE.md`, especially the character style gate and errata 77 (everything moves);
- `docs/55-full-game-build.md` §8;
- docs 107, 108 and 109, whole;
- doc 45, "Rooms 45–54".

Never touch `wtlangdon-design/anchorage`.

## The rooms

| Room | Id | What it is | Who is in it | Reached from |
|---|---|---|---|---|
| 45 | `washout` | The road ending in a slide (a whole pine in it, roots up), a signpost reading FIDDLER'S GULCH 3 MI pointing into the slide, the road back, and an old timbered mine in the ridge with rails running out of it | Grievance, waiting | The livery, by B3's ride |
| 46 | `mine_adit` | Just inside: a chamber with three openings, and a gray survey stake by the right-hand one. Daylight behind | Nobody | 45, and 47's way back |
| 47 | `mine_climb` | A fork, one passage climbing steeply with cut steps and one going on level with rusted rails; pit props, one carved with initials, a date and SORRY; a bar of daylight down a shaft | Nobody | 46's right-hand opening |
| 48 | `mine_two_rocks` | A chamber with a stagecoach-sized boulder and a smaller one, a passage past each | Nobody | 47's passage up |
| 49 | `mine_line` | A junction of two timbered passages that look exactly alike, and an ore cart on its side with MAY chalked on it | Nobody | 48's way past the big rock |
| 50 | `ledge` | The mine's far mouth high on the ravine wall; the whole camp below; a zigzag path down with a rope; a cairn | Nobody | 49's right-hand passage |
| 51 | `gulch_tents` | Tents pegged twice (one with a KNOCK sign), log cabins with stick-and-mud chimneys and bolts, washing on a line with padlocked pockets, a cook fire, a stump with the CLAIM JUMPERS notice | The lookout | 50's path down |
| 52 | `grog_tent` | A plank across two barrels (WHISKEY, FLOUR) with a brass GOLD ON THE PLANK plate, bottles on a shelf, a fiddle on a peg, a pocket watch on a nail in the ridgepole | The Deacon (Vessel), the rule-keeper | 51 |
| 53 | `gulch_river` | A cold fast river, men knee-deep, a rocker, a long tom, a gravel bar mid-stream with a ring of stones and a stump | The panner, and men working in the water | 51 |
| 54 | `upstream` | The head of the gulch: two crossing sets of stakes with notices, gold in the gravel, a half-built sluice with a NOT YET board, a little waterfall | The man upstream, and his tent on the claim line | 53 |

**Daylight in every room** (errata 190). The mine is lit by shafts and cracks to the surface.

**Nothing the lines do not say.** Every subject above comes from docs 108 and 109. Anything not there stays out.

**The mine must not show the way.** No light, color, track, mark or composition may favor a right passage over a wrong one.
- 46's stake stands beside the right-hand opening, because that is the survey's clue and doc 108 says so.
- 47's rising passage and 48's big rock are visible because the survey names them.
- 49's two passages must be indistinguishable in the picture.

## The figures

All are drawn against Thad, in the room they stand in, under the character style gate. All are within the room's own four operations, except Vessel.
- **The lookout:** a gold pan held across his chest like a shield; new boots and hat; eyes that have not slept.
- **The rule-keeper:**
  - a big man on a barrel, with a glass and a pebble bag, and a gold watch-chain with no watch on it;
  - a playing pose for the fiddle, after G5.
- **The panner:** in the river to his knees, in a good coat with wet sleeves, a pan in his hands.
- **The man upstream:** with a shovel, guarding gravel.
- **Vessel, in the Gulch (`gulch-vessel`):**
  - his accepted figure (`art/actors/deke-vessel.png`), clean-shaven, with a pale stripe across his top lip where the mustache was (doc 109, "Two decisions");
  - behind the plank, so it can be cut at the plank top if that serves.
- **Grievance** at the washout uses her livery sheet if it fits the light. If it doesn't, she counts against `room-45`.
- **Background men in the river and at the long tom** may be painted into 53's plate. They have no lines.

## What the engine needs

Read these from the content. Name nothing from the fiction in a `.ts` file.

1. **Extraction from docs 108 and 109 directly**, as docs 105 and 106 are read. Do not copy their lines into other documents. Docs 02, 03, 04 and 57 get only structural notes that point at doc 109:
   - the puzzle rows G1 to G9;
   - pairs 25 and 26 in the pair list;
   - Duel Two's pool, now 1–21, 25 and 26;
   - VES_B1's Gulch differences.
2. **The mine's ways.**
   - A wrong way leads to the screen before (doc 108's table).
   - Arriving through one says doc 108's BACK WHERE HE STARTED run, in order, one line each time, counted in a flag so a save keeps its place.
   - After the first crossing, a flag makes 45's THE OLD MINE lead straight to 50, with doc 108's THE WAY THROUGH said once.
3. **USE THE BRASS ROD at the line.** It is answered on either passage of room 49 with doc 108's three lines. Elsewhere in the mine it gives the wrong answers. The right passage leads out with or without the rod.
4. **The lookout's block.** Before G3, walking from 51 toward 52 or 53 is stopped with doc 109's three lines. GIVE THE CLARION to him is G3.
5. **Vessel in the Gulch.**
   - He is a second placement of his record in 52, named THE DEACON with DEA_G1, until THE FIND (G4).
   - After the find he is named DEKE VESSEL, with VES_B1 and doc 109's Gulch differences.
   - At G9 he leaves 52 and is in Room 4. **`T_VESSEL_FOUND` moves from B3 to G9.** B3 now ends at the washout.
6. **The watch** has three states: before the find, after it, and after G9, when it becomes THE NAIL and the watch is gone with Vessel.
7. **Duel One in 53.**
   - Doc 03's duel is staged on the bar.
   - The rule-keeper's five rules replace Sowerby's handbill.
   - A pebble moves after each exchange (doc 45 `R53-PEBBLE`).
   - The panner is the voice that mutters the counters.
   - Duel One is no longer fought in Room 4. VES_B1 option 3 is offered only in the Gulch, before G9.
8. **The ride home.** USE GRIEVANCE at 45 after G9: doc 109's line over black, then the Nugget. Room 4's first TALK TO after the trip opens with "Grubb! You came all this way. Again."
9. **The changes in Consolation** (doc 109):
   - A9's third copy;
   - Room 16's option 9 (G1, two dollars from A8's piano, which can be earned again);
   - B1's Clarion edition;
   - three new items: THE THIRD COPY, THE BRASS ROD, THE CLARION.

   **Every item needs an icon** (`tests/lessons.test.ts`). Draw them by the project's existing icon route. If that needs image operations, use `gulch-reserve`. If the reserve is not enough, stop and ask Tyler.
10. **G8**: pairs 25 and 26, carried between PAN_G1 and UPS_G1 (doc 109), with their wrong answers.

## Music and sound

Doc 45, "Rooms 45–54":
- three new stems, rendered by the project's music renderer as the other room arrangements were;
- the room beds, rendered by the room-SFX tools;
- the existing THADDEUS and jaw-harp ASSAY files, reused as the sheet says.

**Add a check that fails if the four mine rooms differ in music or ambience, or if any exit, passage or rod use in them carries a sound.** That is the lesson of doc 107's "the listening stays special", made a test.

## Order

Build one room at a time, start to finish, under doc 55:
1. 45, with B3 changed to arrive there;
2. 46 to 49;
3. 50;
4. 51;
5. 52;
6. 53;
7. 54;
8. the changes in Consolation.

For each room, write `proofs/readiness/room-NN.sources.json` pointing at docs 108/109, then run `node tools/check-room-readiness.mjs NN`. It must say **YES** before anything is drawn.

**Graybox is a gate** (CLAUDE.md), and the legibility gate comes before any light.

## When it is all in

- **The puzzle count becomes 52:**
  - doc 02's rows;
  - the traversal list, extended to the trip;
  - CLAUDE.md's "45 puzzles";
  - the errata's canonical list.

  "All puzzles reachable from a fresh save" and "win state reachable from every reachable state" must hold with the trip in.
- **These all pass:**
  - `npm test`;
  - `node tools/run-all.mjs`;
  - `npx tsc --noEmit -p .`;
  - `node tools/check-friction.mjs origin/main`;
  - `npm run gauntlet`.
- **Renders.** One render per room with Thad in it, at `renders/room-NN-<name>.png`. Push them and send them to Tyler. He reviews the characters in the playthrough (errata 72).
- **Ship.** One pull request per room, or per two or three rooms. Record each under the next free errata number on `main`, with commit trailers and a `Lesson:` line as usual.
