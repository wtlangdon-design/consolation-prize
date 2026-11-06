# 55 · THE FULL GAME BUILD — the builder's brief

> **Status: in force from 2026-10-31.** Tyler: "Build the whole game in the style of what we've
> done so far. I'll play through it and we can make adjustments as I play." His answers to the
> three questions that followed: **real art room by room**; **characters reviewed while
> playing**; **up to four image operations per room**. Errata 72 records the ruling. This
> document is how a builder session carries it out. CLAUDE.md, the errata, the invariants and the
> prohibitions all still bind. Nothing here relaxes them except what errata 72 says.

---

## 1 · Who builds

**One builder session at a time, started in Tyler's "OpenAI" cloud environment.** It is the only
place an image can be generated (the key is a network secret there; never print it, never ask for
it). The builder does everything for a room: the gate, graybox, art, characters, wiring, proof,
merge.

Any other session (the one Tyler talks to about his playthrough) makes small fixes only, on its
own branches, rebased on main before it merges. It never generates art and never starts a room.

## 2 · The order

Doc 20's numbering, which is the canonical build order (doc 36 Q142):

**4 · 6 · 7 · 8 · 9 · 10 · 11 · 12 · 13 · 14 · 15 · 16 · 17 · 18 · 19 · 20 · 21 · 22 · 23/24 · 25 · 26 · 27 · 28 · 29 · 30 · 31 · 33 · 34 · 35 · 36**

- **5** is built. **32** is built and awaits Tyler's audition; Room 31 owns the climb out of the grave
  after HOB_C1 (doc 36 Q145).
- **7, 13, 18, 19, 29, 36** have room files or plates from before errata 54 (320×144, indexed).
  They are rebuilt to this brief, not patched.
- A room that stops (section 6) is reported and skipped. The build goes on to the next room and
  comes back when the stop is cleared.

## 3 · One room, start to finish

Room 5 is the benchmark (doc 46 v2). Doc 46 Part Nine is the checklist. In order:

1. **Gate.** `node tools/check-room-readiness.mjs <n>` must answer `BUILDABLE WITHOUT INVENTION:
   YES`. Then doc 35's Room Brief Gate, reading doc 02 for the puzzles sited here, and the
   build contract's nine pre-art answers in `content/build-contracts/` (doc 46 §4.1). Time of
   day and every visual state come from canon (gate A), never from taste.
2. **Writing in, by extraction only.** Run `node tools/extract-examine.mjs` (the room's
   `content/examine/room-NN.json` already exists) and wire it. Dialogue trees this room needs
   that are not yet in `content/dialogue/` are added to `tools/extract-content.mjs` the way
   `winnieTree()` and `hobTree()` are. No line is typed by hand. Each new extractor reads a
   tag cell's `after N` through `afterIds()` (doc 04 node rule 7), so follow-up questions
   wait for the question that raises them.
3. **Graybox (ruling 22, steps 1–6).** Value block, walkable band and exits, object
   silhouettes, character placement and reach, occlusion test, **legibility gate**. A room that
   fails the legibility gate is re-blocked, not lit.
4. **Art (four operations for the whole room, asset `room-NN`).** Composition master → the
   arrival-state plate at 1920×864 → other states as edits with zero drift (doc 46 §4.2, §4.9).
   **No person is ever painted into a plate** (doc 35). Every operation is logged in
   `art/staging/ledger.json` under the one asset id `room-NN`; `tools/art/staging.mjs` enforces
   the cap.
5. **Characters, from the same four.** The character style gate's steps 1, 2 and 4
   (CLAUDE.md): generated against a frame of Thad in this room; measured by `tests/scale.test.ts`
   (a `posture` on every figure, within 5% of the curve), edges and colour in Thad's range;
   rigged with `tools/rig/character.py` per doc 38, clips per doc 40. **Step 3 is the
   playthrough** (errata 72 D): it goes in, and Tyler flags misses as he plays. Too sharp is the
   usual miss.
6. **Wire and prove.** Annotation bound by hash; `tools/compile-room.mjs`; the room in the
   manifest; doors and the map; the proofs of doc 46 §4.13 — four-panel proof, life proof, and a
   gameplay pass entering and leaving by the real doors twice. Proof captures go under
   `renders/proofs/<room>/` per CLAUDE.md's render rules (raw frames ignored).
7. **Green, merge, deploy.** `node tools/run-all.mjs` and `npm test` green, `npm run build` clean,
   the readiness gate still YES. Branch, PR, wait for the `check` job, merge (the builder may
   merge its own PRs), and confirm the Pages deploy succeeded.
8. **Tell Tyler.** One short message per room: what is new, the link
   `https://wtlangdon-design.github.io/consolation-prize/?room=<id>`, and anything he should
   look at or listen to first. Record the room in section 7's log.

## 4 · Audio

Errata 49: an agent that cannot hear says so. One-shots are rendered offline (as
`tools/audio/render-coffin-sfx.py` does); Room 33's tap is live synthesis (errata 70 D). The F2
arc runs −35 → 0 cents across ninety seconds **from the confirmed void** (errata 52, 71 E), and
the lamp slows to stillness on the same ninety seconds (invariant 8). Tyler auditions in the
playthrough.

## 5 · What the builder decides, and what it never does

- **Decides, and records in the errata:** staging, mechanism and placement gaps, under the
  standing delegation, as errata 68–71 did. Each decision is named so it can be reversed by name.
- **Never:** writes a line, a joke, a bark or an option; invents a puzzle solution; fans out
  subagents on content (subagents for tooling, validation and art batching are fine); loops on
  quality; spends another room's operations; touches `wtlangdon-design/anchorage`.

## 6 · When a room stops

Stop the room, not the build, and say so in doc 36 and to Tyler, when:

- the readiness gate says NO;
- the room's four operations are spent without a usable plate;
- a gap needs a line or a puzzle solution (errata 72 F);
- something would break an invariant, above all 6 (no dead ends: verify by the traversal checks).

## 7 · The build log

| Room | Merged | PR | Operations used | Notes |
|---|---|---|---|---|
| 32 | 2026-10-31 | #75, #76 | 0 (drawn by script) | Awaiting audition |
| 4 | 2026-11-01 | #78 (stopped), #84, #88, #90, #91, #93 | 5 of 5 (master, plate, Sowerby, Sowerby redrawn whole, Sowerby alone on magenta; Tyler raised the cap to 5) | The Liar's Assay engine and Duels One and Two; judges and Sowerby new, Deke re-cut. `?room=nugget_back`; `?fixture=r4-a` convenes the Assay. Awaiting playthrough (doc 36 Q148, errata 76) |
| 6 | 2026-11-01 | #108 | 3 of 4 (master, plate, plate re-framed to hold the window, mat and cot) | The records room: night, nobody in it, sixteen subjects. `?room=assay_records`. Its door back has no lines (stub exit, doc 36 Q149, errata 79) |
| 7 | 2026-11-01 | #109 | 3 of 4 (master, plate, Sump's five-pose sheet) | The claims registrar: Sump at his window, A6 and A9 at his counter (A9 plays from `?fixture=r7-b` until the survey's room exists), D1, E1, E2 by his tree. `?room=claims_registrar`. Five doc 49 objects unhoused and three of Sump's nodes waiting (doc 36 Q150, errata 80) |
| 8 | 2026-11-01 | #110 | 2 of 4 (master; Thad out and the room re-framed in one edit) | The registrar's archive: entered through Room 7's archive door as the executor's agent (doc 57 E9), E9 seen by the form or by a look. `?fixture=r8-a`. Its door back has no lines (doc 36 Q151, errata 81) |
| 9 | 2026-11-01 | #111 | 3 of 4 (master, plate, Frame's five-pose sheet) | The Clarion: Ignatius Frame at his press, B1 (the trade) and E5 (the obituary, `?fixture=r9-b`), the headline board's editions. `?room=clarion`. Its door back has no lines (doc 36 Q152, errata 82) |
| 10 | 2026-11-02 | #112 | 4 of 4 (master, plate, the clerk's five-pose sheet, the act-4 rack) | The Improvement Company lobby: the clerk at his high desk, fifteen subjects, the empty rack in Act IV (`?fixture=r10-b`). `?room=company_lobby`. Five chairs painted where doc 05 says six; its door back has no lines (doc 36 Q153, errata 83) |
| 11 | 2026-11-02 | #113 | 4 of 4 (master, plate, Fanshawe's five-pose sheet, the colonel restored and the dinner laid) | Fanshawe's office: the Colonel at his desk, A4's map, the dinner (A10, `?fixture=r11-b`) with beat 4 and the PART TWO card, the funeral day's search (C4, `?fixture=r11-c`), the offer (E0b, `?fixture=r11-d`) and PART THREE. `?room=fanshawe_office`. FAN_D1 cannot be reached; S1's staging is reported (doc 36 Q154, errata 84) |
| 12 | 2026-11-05 | #116 | 3 of 4 (master, plate with the catalogue's slips, the unsold scales and the lamp oil) | The Mercantile: twenty-four subjects, the pickaxe, the eggs and the tonic on account (`?fixture=r12-a`), the ledger ruled off in Act III (`?fixture=r12-b`). `?room=mercantile`. Main Street's sixth door added; its doors have no lines (doc 36 Q155, errata 85) |
| 13 | 2026-11-05 | #117 | 3 of 4 (master, plate, the undertaker's five-pose sheet against Thad) | The undertaker's: the undertaker planing at his table, A1 ("Up the hill?", `?fixture=r13-a`), UND_C1 and the loan for E3 (`?fixture=r13-b`). `?room=undertaker`. THE COFFINS' USE plays doc 26's "Not yet."; doc 49's second line is reported (doc 36 Q156, errata 86) |
| 14 | 2026-11-05 | #118 | 5 of 5 (master, plate, the stones scattered, the open grave, the filled grave; Tyler raised the cap to 5) | Boot Hill: Mott's stone, the nineteen, Pike's board; the funeral day ends on walking up (`?fixture=r14-b`), the grave dug for Thad (`?fixture=r14-c`), his own plot after the funeral (`?fixture=r14-d`). `?room=boot_hill`. Sowerby's plate at the gate (D4) not built (doc 36 Q157, errata 87) |
| 15 | 2026-11-05 | #119 | 5 of 5 (master, plate, the livery man's sheet, Grievance's sheet, four side-on mules -- not shipped; Tyler raised the cap to 5) | The livery stable: the livery man in his chair and LIV_A1, Grievance over her door, two mules in the pen; B2 and the blanket on loan (`?fixture=r15-a`), B3 with the ride over black to the Nugget (`?fixture=r15-b`). `?room=livery`. Two mules where the lines say four (doc 36 Q158, errata 88) |
| 16 | 2026-11-05 | #120 | 3 of 4 (master, plate, Ozymandia's five-pose sheet) | Madame Ozymandia's tent: her table under the red lantern, OZY_A1, A7 -- her price, the filing fee, the map divined into THE SURVEY (`?fixture=r16-a`). `?room=ozymandias_tent`. Her look is the builder's (doc 36 Q159, errata 89) |
| 17 | 2026-11-05 | #121 | 3 of 4 (master, plate, Sowerby's pulpit sheet against his Room 4 drawing) | The church: Sowerby at his pulpit, SOW_A1 and SOW_C1; C3's letter (`?fixture=r17-a`), E3's eulogy at four words (`?fixture=r17-b`); the pulpit empty on the funeral day. `?room=church`. SOW_C1's on-screen counter not built (doc 36 Q160, errata 90) |
| 18 | 2026-11-05 | #122 | 3 of 4 (master, plate re-framed with the people out, the clerk's sheet) | The hotel lobby, rebuilt: the clerk at his desk, A2 -- his leave, the fork on the parlor piano, the room (`?fixture=r18-a`); the stairs refuse in his words until then. `?room=hotel_lobby`. The clerk's look is the builder's (doc 36 Q161, errata 91) |
| 19 | 2026-11-05 | #123 | 2 of 4 (master, plate with the mirror and the window corrected) | Thad's room, rebuilt: the letters home -- USE THE LETTERS HOME, the act's three versions (`?fixture=r19-a`), Act IV's one (`?fixture=r19-b`); nothing tracks the choice. `?room=thads_room`. Split first lines now spoken whole game-wide (doc 36 Q162, errata 92) |
| 20 | 2026-11-05 | #124 | 3 of 4 (master, plate, the cat's sheet) | The back alley, built new: the cat on the crates in the open door's light, the Company's back, the barrels, the wash line (`?fixture=r20-a`). Main Street's THE BACK LOTS leads here. `?room=back_alley`. Hob on his rounds here for E6 (`?fixture=r20-b`), his three refusals written at Tyler's request. The cat's 'sun' lines at night are Tyler's (doc 36 Q163, errata 93) |
| 21 | 2026-11-05 | #125 | 3 of 4 (master, plate, its companion after the confession: dawn and the two cups) | The watchman's shack, built new: empty in Act I (`?fixture=r21-b`); after E9, Hob at home and the confession on entering -- E10, then dawn and PART FOUR (`?fixture=r21-a`). `?room=watchmans_shack`. Act IV's morning in Room 19 not yet built (doc 36 Q164, errata 94) |
| 22 | 2026-11-05 | #126 | 3 of 4 (master, plate, the miners' walk sheet) | The road to the claims, built new at dusk: the two crowds walk out and back along the road (loop walkers, new); A4's way up refuses without the map (`?fixture=r22-a`). `?room=claims_road`. Both crowds on the road at dusk where doc 10 times them morning and night (doc 36 Q165, errata 95) |
| 23/24 | 2026-11-05 | #127 | 3 of 4 (master, plate, the raccoon's sheet) | Prosperity and the hole, built new: the raccoon in the hole, his naming, A5's bait, smoke and blanket (`?fixture=r23-a`), F1 in Act IV (`?fixture=r23-b`); on the map and up the road only with the map. `?room=prosperity`. Pratt's attempt comes with Room 25 (doc 36 Q166, errata 96) |
| 25 | 2026-11-05 | #128, #129 | 4 of 4 (master, plate, Pratt's sheet, the plate relit to dusk) | Pratt's claim, built new at dusk (Tyler: as next door): Pratt raking, his five trees and the offer that ends every conversation; A5's fourth way (`?fixture=r25-a`); D2 on Prosperity in Act II (`?fixture=r25-c`) and at his claim, D5's turn (`?fixture=r25-b`); next door from Prosperity and on the map with the map. `?room=pratts_claim`. D6's counter scene in Room 7 waits (doc 36 Q167, errata 97) |
| 22, 23/24, 25 | 2026-11-05 | #130 | one each (room-22 4 of 4, room-23 4 of 4, room-25 5 of 5) | The diggings relit to night, the town's hour (Tyler: "Going from night back to dusk doesn't make sense"); every figure graded into it; nothing moved (errata 98) |
| 23/24, 25 | 2026-11-05 | #131 | room-25 6 of 6 (the embers) | Prosperity and Pratt's claim lifted to the approved night rooms' level; the coffee fire's embers on Pratt's claim, its one warm light (errata 98 D) |
| 26 | 2026-11-05 | #132 | 3 of 4 (master, plate, the man panning) | The creek and the community sluice at night: ten subjects, the man panning at the water; on the map once the road to the claims has been walked. `?room=creek`. No puzzle sited (doc 36 Q168, errata 99) |
| 27 | 2026-11-05 | #133 | 4 of 4 (master, plate, two asks for the eleventh marker) | The abandoned claim row at night: fifteen subjects, eleven markers (the last a prop cut from the tenth), nobody. `?room=claim_row`. No puzzle sited (doc 36 Q169, errata 99 C) |
| 28 | 2026-11-05 | #134 | 3 of 4 (master, plate, Sheng and his board) | Sheng's laundry at night: seventeen subjects, Sheng ironing, his two trees -- D3, and D4's laundry half with the linen money in hand (`?fixture=r28-a`, `r28-b`); the loan in Act III. `?room=laundry`. The Reverend's funeral-day collection waits (doc 36 Q170, errata 99 D) |
| 29 | 2026-11-05 | #135 | 2 of 4 (master, plate) | The high ridge at night: eight subjects, Consolation's lamps below; up the path from Sheng's door, which is now the way up; the 320x144 plate retired. `?room=high_ridge`. No puzzle sited (doc 36 Q171, errata 99 E) |
| 30 | 2026-11-05 | #137 | 2 of 4 (master, plate) | Mott's supposed site at night: thirteen subjects, the offerings and a new digging; THE SITE's Act IV line. `?room=motts_site`. No puzzle sited. And the compiler now reads a merged subject's act lines: Room 19's and Room 23's dropped act lines restored (doc 36 Q172, errata 99 F) |
| 31 | 2026-11-05 | #139 | 4 of 4 (master, plate, the watchman's walk, the hill at night) | The funeral, at night since 2026-11-06 (errata 99 K, relit under operation 4's moon, five daylight lines rewritten): thirteen subjects, the town at the grave, Sowerby's eulogy as a bark; beat 3 on the second LOOK at the grave; THE COFFIN · USE into Room 32 (E7), and Room 32 hands back to the hill at night (E8, `T_FUNERAL_DONE`). Up from Boot Hill's plot once the executor is named (`?fixture=r31-a`). Procession unstaged; seven mourners drawn for nine (doc 36 Q173, errata 99 G) |
| 34 | 2026-11-05 | #141 | 3 of 4 (master, plate, the second state) | Under Prosperity: Thad's tunnel by his lamp, thirteen subjects; down by the pickaxe on the hole after F1 and by the hole after; THE GAP to Room 33 (doc 57's lines); after F3 the seam, the lantern and the footprints (errata 69 A). `?fixture=r34-a` (doc 36 Q174, errata 99 H) |
| 33 | 2026-11-05 | #141 | 3 of 4 (master, plate, the broken wall) | The listening chamber: the LOOK ladder, LISTEN as taps with ripples toward the void, its one line, the ninety seconds tuning the score and stilling the lamp; F3's three swings into Room 34's second state. `R33-M` composed 2026-11-06: THADDEUS complete, the fourth bar resolved (errata 99 L). `?fixture=r33-a` |
| 35 | 2026-11-05 | #142 | 2 of 4 (master, plate) | The Company vault: sixteen subjects, nobody; in through THE SAFE in Fanshawe's office from Act IV, out by THE VAULT DOOR. `?fixture=r35-a` (doc 36 Q175, errata 99 I) |
| 36 | 2026-11-05 | #143 | 2 of 4 (the street relit to dawn, the dog on his back) | Main Street at dawn: Room 2's pixels under the morning's light, nine dawn hotspots, the dog on his back; the coach stop's close -- 'Leave the mud.' and the letter over black. Reached by `?fixture=r36-a` until F4 and F5 are built (doc 36 Q176, errata 99 J) |

## 8 · What playing found — held by a script where a script can hold it

Every row here shipped past a green suite and was found by Tyler playing, by a review, or by a proof. Where a mechanical check now fails the build on it, the check is named; where the thing is taste, the process that worked is the rule. Read this before step 3.

**Every correction adds to this section or to the suite (Tyler, 2026-11-01: "when things are corrected, the lessons learned are built into the system").** When Tyler, a proof or a review finds something wrong, the fix is not finished until it carries the lesson with it, in the same PR: a test or check that fails on the defect (prove it by putting the defect back and watching it fail), or, where the thing is taste, a row here naming what went wrong, where, and the process that worked. A fix that only changes the one room teaches the next thirty nothing. **CI enforces this** (`tools/check-lesson-carried.mjs`): a pull request that reads as a fix and changes no test, no check and no line of this section fails its `check` job. A room's first build, or a build-log entry, says `Lesson: none -- <why>` in its description. *(Harvested 2026-11-01 from commits since 2026-10-31, doc 36 Q133–Q148, errata 72–77, and the Room 3 and Room 4 playthrough fixes.)*

### Caught by the suite now

| What went wrong | Instances | Now caught by |
|---|---|---|
| Thad's place for a conversation puts him on top of someone else, or he covers the person he is talking to | One-strike man behind Deke (#86, #87); the card sharp's stand on Deke's elbow; Room 4's stand for Deke in front of the first judge | `tests/staging-clear.test.ts` — every declared stand, against every figure who can be there at the same time, on drawn pixels |
| A character who talks is drawn over another figure | Deke on the stool leg, then in front of the drinkers (166db1b, #87, #89); in Room 4 his head over the third judge's face | `tests/staging-clear.test.ts` |
| A character vanishes in front of Thad | Deke after the swindle; the judges and Sowerby after Duel Two | By construction (`AmbientLayer.present`: who is in a room is decided when Thad arrives; a character leaves while he watches only by walking an `exit`), held by `tests/lessons.test.ts` |
| A puzzle's writing exists and nothing in the game performs it | A3 traded nothing, A8 paid nothing (#97) | `tests/lessons.test.ts`: every puzzle sited wholly in built rooms is played by a test (`// PLAYS: A3, A8` in the test) or listed with its reason in `proofs/played-pending.json`; and every puzzle content waits on (`requiresPuzzles`, a gated entry, a rephrase) has something that completes it |
| Content hands over an item the game never loads | The pocket watch (#97); the affidavit, Duel Two's yield | `tests/lessons.test.ts` — every item a combination, room, duel or fixture grants is in the manifest and has an icon; an item doc 23 holds "from the start" is carried in a new game |
| A cut figure is in pieces or has holes | The judges' coats keyed out against the wall (87a5b82) | `tests/lessons.test.ts` for standing characters with trees (one piece; under 2% enclosed transparency). Bands and seated figures are not covered: see below |
| Lines exist in a document but never reach a room | Doc 49's Nugget verbs; doc 05's act variants (#97) | `tools/compile-room.mjs` reads both for every room, and reports by name what has no hotspot yet |
| A figure drawn at the wrong height after a move | Deke recut at 382, then 428 | `tests/scale.test.ts` |
| A place on the map could not be clicked: another place's label ran across its marker | The registrar, Room 7's only built way in, under the undertaker's label (errata 80 H) | `tests/map.test.ts` — every place that can be travelled to is reached by its own marker, in every fixture's state |
| A scene that leads to another room changed rooms before its lines were read | The archive door's exchange hung its first line over the archive and lost the rest (errata 81 F) | `tests/room-08.test.ts` — a response with lines and a destination reports `goesTo` and does not change the room itself |
| A character standing still | The back row in Room 4 | `tests/movement.test.mjs` (errata 77) |
| A room line the doc changed never reached the game | The Nugget back-room door's PUSH after the voice pass (#140) | `tools/check-room-lines-sourced.mjs` — every line a room speaks is in /docs |
| A room built before the compiler kept its own copy of its lines, so rewriting the docs changed nothing | Room 1: only the case was extracted; 54 rewritten lines stayed old, and 12 lived in the extractor's code (#148) | `tools/check-room-lines-sourced.mjs` fails on every stale line; `roomOneLines` in `tools/extract-content.mjs` now reads them. **Before a voice pass on any room, run the check after editing the docs: a line that stays old means the room is not extracted** |
| A range document's exits were never read by the compiler | Rooms 5 and 7: doc 25's `## Exits` doors kept the room file's words after the Room 5 voice pass (#153) | `tools/check-room-lines-sourced.mjs`; `rangeDocExits` in `tools/compile-room.mjs` now reads them |
| A note for the builder is shown to the player as a stage direction | Winnie's "(Wrong. Hard wrong.)", which marks the wrong option (#158) | `tests/stage-directions.test.ts` fails on any line in doc 58's hidden list; **when a new tree's directions start showing, read every one once and hide the notes by name** |

### Not caught — the process that worked

- **A line readable before the event it assumes.** "Eleven weeks" on the first night, the Company's map before Fanshawe, "my watch" after Vessel has it (doc 91). No script knows when a sentence becomes true. **After a room's lines are written, read every ungated line as Thad on his first night and ask whether it is true yet** (doc 59 rule 11).
- **A line that needs a second read.** Period slang that hides the joke fails on screen even when the joke is good: Vessel's "Producing, mind." (Tyler, 2026-11-05, after the Room 3 voice pass). **Read every rewritten line once, at speed, as someone who does not know the joke's setup; if a word is jargon, say the plain thing and keep the joke under it** (doc 59 rule 8).
- **Cutting a figure out of a painted plate.** It carries the wall, loses dark clothes against dark walls, or slices a leg off (Room 4's Sowerby took four rounds). **Generate every new figure whole on magenta and key him.** Never cut a figure from an image where anything stands in front of him (e700515).
- **Light and colour.** A figure or prop that is right by the numbers can still read wrong (Deke's lighting, the barrel's brightness, twice). **Render three versions in the room at game size and let Tyler pick**; a small nudge after that ("ever so slightly brighter") is a number, not a new image.
- **Staging taste.** Whether a character feels anchored or "floating in the middle of the room" is Tyler's. Put talkers by furniture (a bar, a barrel) rather than on open floor, and show him the frame before merging.
- **Walk cycles.** Derive the frames per second from the stride, never from a placeholder: Deke's brief's 8 fps would have slid his boots at three times his pace (8a7a3ad). Play the cycle in order contact–pass–contact, and check the walk frames against the approved standing look (his hat and jacket, 96dc0a9).
- **Speech placement.** Lines drawn top-centre, over a face, or over the wrong spot (17f3a61, 4e2a559, errata 76 E). Each room's life proof triggers a greeting, a reply and a bark for every speaker and looks at where the words land.
- **A person who cannot be clicked because the scenery behind him is bigger** (dc07048). In the life proof, hover every person with a tree and read the sentence line.
- **Presentation changes break the gauntlet.** Turning on click-to-read (b13c222) turned the gauntlet red after merge. **Any change to `content/ui/ui.json` or the dialogue presentation runs the gauntlet in the same PR.**
- **The room proofs are not in CI, so a presentation change breaks them silently.** Click-to-read (b13c222) fixed the opening's gauntlet but not `tools/gauntlet/route.mjs`'s waits, so every room proof routed through the opening timed out on the driver's first answer, and nobody ran one for a day (found building Room 6, errata 79 G). **After any change to dialogue presentation, run one room proof (`node tools/gauntlet/proof.mjs assay_records --allow-dirty`) as well as the gauntlet.**
- **The readiness gate does not read a room's exits.** Room 6 answered YES with its only door unwritten (no document writes the records room's side of it); `check-examine-lines` caught it only after the room was wired. **At step 1, read the room's exits against the docs by hand**: a door with no lines ships as a stub exit and goes in doc 36 (errata 72 F), and a door in a puzzle's path stops the room.
- **A room reached only by the map has to be proved by the map.** Room 7's first proof route clicked the registrar's marker and arrived at the undertaker's; no check had ever clicked a crowded map. Route a map-only room through the panel's MAP button and the marker, as `tools/gauntlet/routes/claims-registrar.json` does.
- **Under click-to-read, a wait for one speaker's line must read past the others.** Thad's echo of a chosen question holds until clicked, so a life route waiting for the reply sat on the echo (errata 80 H; `tools/gauntlet/route.mjs`).
- **A route along a scrolling street walks in short legs.** The camera follows with a dead zone and a click west of its edge does not register, so Room 9's first route clicked the Clarion's door from the street's east end and nothing happened (errata 82 G). Step across Main Street in legs the camera can follow, as `tools/gauntlet/routes/clarion.json` does.
- **A character drawn whole on magenta keeps his see-through gaps.** Filling the holes in Frame's key made the gaps between arm and body opaque magenta, and the promotion gate refused him; key the figure, do not fill it (`tools/art/room09-frame.py`).
- **A generated plate drawn past the 20:9 band cannot always be cropped.** Room 6's master filled the 3:2 canvas, and no 20:9 crop held the high window, the mat and the cot. Handing the people-free plate back at 0.8 scale inside the band, asking for the walls to be extended, re-framed the room whole (room-06 operation 3). **Check the crop against every subject before the plate operation, and budget an operation for re-framing.**
- **A room's id is what other rooms' arrivals name.** Main Street declared its Company door's arrival as `from: "company"` while the room was `company_lobby`, so coming back out put Thad at the far end of the street, and the hotel and claims-road doors had the same fault (Room 10, errata 83 G). `tools/check-room-entries.mjs` now fails a way back into a room of several doors with no arrival of its own. **When a stub is replaced, rename every `from` that named it.**
- **An act's picture is a prop cut from a zero-drift edit.** Room 10's empty rack in Act IV is the plate edited once, and only the pixels that changed ship, as a prop gated on `ACT` (`tools/art/room10-rack.py`); the hotspot must cover the prop, which `tests/room-10.test.ts` holds. Budget the edit among the room's four operations.
- **A people-removal edit can take a painted person too.** Room 11's plate operation removed the people and also the colonel from his own portrait, which THE PORTRAIT's lines need. Look at every painted figure in a plate before spending the next operation; the fix was folded into the room's state edit, and only the portrait's canvas was taken from it (`tools/art/room11-compose.py`).
- **An act turn is a card, and a card follows the flag.** ACT is written at the act turns; `content/act-cards.json` holds each card (from doc 57) and the scene shows it when ACT rises in play, after the lines are read. `tests/room-11.test.ts` holds the two turns Room 11 makes.
- **A generated figure comes back on a finer grid than Thad, every time so far -- redraw it, do not filter it.** Fanshawe, Sump, Frame and the lobby clerk were all drawn with pixels far smaller than Thad's (Tyler caught Fanshawe, errata 84 J). A median made them smooth ("Thad is pixelated, not smooth") and pixelating the old drawing lost their faces; what worked was generating the sheet again against a side-by-side of Thad beside the figure (`tools/art/cast-vs-thad.py`), asking for Thad's pixel size outright. **Put that side-by-side in every character brief from the first generation.** No number stands in for the look: the texture metric ranked the smooth versions best.
- **`items` takes the thing it comes from; `grants` leaves it.** A response that gives `items` treats its object as a container taken whole, so Room 12's pickaxe would have taken the rack and Room 11's photograph had already taken the drawer out of the room (errata 85 F). Give from a shelf, a drawer or a stock with `grants`; keep `items` for the thing that is itself the item.
- **Generate a new figure against Thad from the first image, not after a miss.** Room 13's undertaker was the first figure whose very first sheet was briefed with a side-by-side of Thad and a cut of the figure from the master (`tools/art/cast-vs-thad.py`), and it came back on Thad's coarse grid at once -- no redraw spent. The four before him each needed a second sheet (errata 84 J).
- **A proof that raises ACT waits out the card.** The act card blocks clicks for its few seconds, so Room 13's panel D, which sets ACT 3, clicked the undertaker into nothing and timed out. A route that raises ACT waits before its next click; one that leaves a conversation reads its parting lines (`waitFor says`, then a click) before clicking the room, since a held line takes the next click.
- **Ask for an outdoor scatter, not rows.** Boot Hill's master stood its boards in two neat lines, and Tyler, seeing it: "the gravestones need to maybe be a bit more scattered." A graveyard, a camp or a yard grows irregularly; a brief for one says "scattered, irregular spacing, some leaning, in loose clusters" from the first image, or it costs an operation later.
- **When the cap is spent on a miss, compose from what the operations made.** Room 14's filled grave came back without its headboard; the open grave's operation had drawn one in the same place. The state was composed from the two operations' own pixels (`tools/art/room14-compose.py`) rather than accepted wrong or spent past the cap.
- **Measure a container against what it must hold before generating what goes in it.** Room 15's master painted a pen about 1.7 m across for doc 09's four mules; a mule side-on is 2.1 m. Three drawings went into it -- heads with no bodies, four squeezed copies, a crowd cut off by the wall -- before the arithmetic said no side-on mule fits whole at true scale (Tyler: "that size pen could hold maybe 1 or 2"). Work out the space at the room's scale (Thad's height at that depth is 1.75 m) in the graybox, and size the pen, the stall or the table to its contents there.
- **An animal is a figure, and the master's animals are not a source.** The composition master's mules were heads with no bodies. Animals get a sheet on magenta against Thad like any figure, whole, and move like any figure (errata 77).
- **A character with no written look is not a costume from a stock type.** Room 16's master, briefed with a head-wrap, hoop earrings and kohl for a fortune-teller nobody had described, drew an ethnic caricature. Brief an undescribed character from what the documents do say (a fraud, theatrical, the period) and from the period itself -- an 1850s American medium -- never from a stereotype of a people.
- **Cut a figure at the furniture's body, not at what stands on it.** Room 17's Sowerby was cut at the top of the small reading desk on his pulpit, and the wall showed beneath his waist either side of the desk -- Tyler: "the top half of his body is floating with no lower half". A behind-counter figure is cut where the counter's body begins; anything smaller standing on it is an occlusion plane in front of him. And make the plane the object's own shape: the first desk mask was a box with a brightness test, the wall behind passed it, and the wall was drawn over his waist exactly as before ("it's literally exactly the same"). Look at every cut at 2x across the join before showing it.
- **An object in front of a figure is masked whole.** Room 18's register, masked by its pale pages alone, let the clerk's shirt show through the gutter and the dark edges between them. A plane in front of a figure is the object's whole outline, each row filled edge to edge.
- **A field the data carries is not a field the player sees.** 139 objects carried the second half of their first LOOK in `then`, every check counted it present, and the engine never spoke it: it asked "is this the first look" after counting the look. A line in the content is only proved by a test that plays it and reads what comes back (`tests/split-lines.test.ts`).
- **The master's figure is the room's scale.** Room 20's master drew Thad a quarter smaller than the graybox planned, and every door, crate and barrel around him was drawn to that smaller man. Measure Thad in the master and take the depth curve from him; the graybox's numbers are the plan, the master's are the picture.
- **A figure gated on a flag arrives with Thad.** Room 20's panel D set `T_EXECUTOR_RULE` in the room and the frame showed no Hob, and the proof passed: who is in a room is decided as he arrives. A principal change that brings someone in steps out and back in before its capture -- look at panel D, not only at its pass.
- **A crowd that walks is a walker, not a sprite that marches on the spot.** Room 22's miners are a loop (`AmbientFile.loop`): a path off the frame at both ends, heights along it where the road leaves the walk band, a pause between walks. A figure that must be seen walking somewhere is never a standing sprite with walk frames.
- **Nobody pops in, either.** A figure whose condition starts holding while Thad watches walks in (`arrive`), as one whose condition ends walks out (`exit`): Room 23's three raccoons arrive along the slope. Never a figure that is simply there next frame.
- **What a figure holds at his feet is the room's, not his.** A talking figure is drawn in one piece (`tests/lessons.test.ts`), so the stake Pratt drives on Prosperity was cut out of his frames and stands as a prop -- placed where his mallet lands in the striking frame, not where the generator drew it, because the frames are aligned on his heel so his feet never slide.
- **A room's hour is its neighbours', and outside the hour is night.** The game has no clock; each room is painted at one hour, and walking between rooms must not jump between hours (Tyler, 2026-11-05: Room 25 painted in the morning beside Prosperity at dusk, then the diggings at dusk beside the night town -- "Going from night back to dusk doesn't make sense"). The one change of light is the ending's dawn (errata 98). A night room is measured against the approved night rooms before it ships (`tools/check-night-exposure.mjs`), and has a warm light the documents give it where they give one -- a lamp, a window, a fire. A line that names an hour is the speaker's, not the sky's: "Lovely morning" plays at dusk.
- **Count the repeated things in the master before anything else is spent.** Room 27's layout had eleven markers and the master drew ten; two operations then asked for the eleventh, in words and over a grey placeholder, and drew none -- the generator will not add one of a row after the fact. A wrong count in the master is cheaper to fix by drawing the master again than by asking the plate for more (errata 99 C).
- **Art needs the "OpenAI" environment.** A session without the key writes a brief (`reference/room-NN/<subject>/brief.md`, a verbatim prompt, a reference image, a generator, the cap in `art/staging/caps.json`) and hands Tyler a paste-ready prompt for a session in that environment. The barrel and Deke's walk were made this way.
