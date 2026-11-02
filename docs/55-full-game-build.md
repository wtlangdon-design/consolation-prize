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
| 10 | 2026-11-02 | PR_PENDING | 4 of 4 (master, plate, the clerk's five-pose sheet, the act-4 rack) | The Improvement Company lobby: the clerk at his high desk, fifteen subjects, the empty rack in Act IV (`?fixture=r10-b`). `?room=company_lobby`. Five chairs painted where doc 05 says six; its door back has no lines (doc 36 Q153, errata 83) |

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

### Not caught — the process that worked

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
- **Art needs the "OpenAI" environment.** A session without the key writes a brief (`reference/room-NN/<subject>/brief.md`, a verbatim prompt, a reference image, a generator, the cap in `art/staging/caps.json`) and hands Tyler a paste-ready prompt for a session in that environment. The barrel and Deke's walk were made this way.
