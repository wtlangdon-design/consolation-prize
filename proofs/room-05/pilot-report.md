# ROOM 5 · THE ASSAY OFFICE FRONT — AUTONOMOUS PILOT REPORT

*Evidence-backed. A gate is PASS only where a file or a command result says so. Nothing here is a visual judgement; every visual judgement is Tyler's.*

Start commit `b63bb4dd` · pilot start record `proofs/room-05/pilot-start.json`

## THE EIGHT GATES

| Gate | Result | Evidence |
|---|---|---|
| **1 · CANON / CONTENT** | **PASS** | `proofs/readiness/room-05.json` (writing YES on every content axis; the one open-canon item left is the visual gate, Q22/Q23); `proofs/room-05/gate-matrix.md`; the compiler's own reconciliation (`node tools/compile-room.mjs 5`: 65 authored lines carried, nothing unhoused). **No creative invention was required or made.** The gap this report first declared — THE QUEUE BENCH's LISTEN and repeat variants — was closed by Tyler's rulings of 2026-09-04, recorded under `docs/36-issue-list.md::Q24 · THREE ROOM 5 REFUSALS HAVE NO HOTSPOT TO LIVE ON, AND THE QUEUE BENCH HAS NO LISTEN — **RULED**`: the bench stays as an Act 2–4 hotspot with its six lines authored in docs 05 and 25, and the three orphan refusals for THE WINDOW (AJAR) and THE BRASS PLAQUE are struck from doc 49 rather than housed anywhere. BUILDABLE CREATIVE CANON: **YES** |
| **2 · ROOM DATA / GAMEPLAY** | **PASS** | `content/rooms/assay-office.json` (compiled, one writer; the bench now carries LOOK 1–3 and LISTEN 1–3 by the normal compiler path, nothing hand-edited); `content/dialogue/winnie.json` (five nodes, entries by act); `content/ambient/winnie.json`; tests `tests/room-05.test.ts` (3 pass: act-gated entries, the T_TUNES_PIANOS negative and positive side, the bench at ACT 1/2/5). `npm run validate`: **1 of 47 red**, `check-flag-order` on the bench's ACT gate and `WIN_B1`'s `T_RACCOON_NAMED` — both gates are authored canon whose writers (doc 48 S1; the raccoon's naming) are unbuilt content of other rooms. Tyler ruled them out of Room 5's scope; the validator was not weakened, excluded or falsified |
| **3 · GEOMETRY / PHYSICALITY** | **PASS** | `reference/room-05/annotation.json` bound to plate-02's hash; compiler output (3 bands, bench carved, 9 approach points, 2 exits, 3 entrances); proof depth marks at both extremes pass; entrance at the street door, exits by walking to the door; the counter plane masks Winnie by measurement (below) |
| **4 · ART PROVENANCE** | **PASS** | `reference/global-baseline.json` (A–E hashed; the Room 1 casting master required and transmitted on every call); `art/staging/ledger.json` rows 5–11 (every reference path, hash and `transmitted: true`; four rows marked REJECTED with Tyler's reason); `art/staging/room-05/plate-02/safe-frame.json` (source hash, crop, `lanczos3-separable-premultiplied-srgb-clamped`, derived hash, SAFE); `art/staging/room-05/winnie-02/frames.json` |
| **5 · CANDIDATE RUNTIME IDENTITY** | **PASS** | `renders/proofs/assay-office/proof.json`: `candidates[0].rendered = art/staging/room-05/plate-02/candidate-1920x864.png`, hash `c0afe61e…`, every panel's `bg:assay_office` row `candidate: true, loaded: true`; the mask and Winnie's sheet loaded; no stub, no fallback; the override was a URL parameter and is gone |
| **6 · VISUAL / RUNTIME PROOF** | **PASS** (technical admissibility only) | Four-panel proof PASS on commit `721b2595`, clean tree, panel D speaking the bench's line at ACT 2; life proof PASS on `8fe42509`, clean tree, 12 captures over 199s with 122 logged events; style sheet with four suspected items listed for Tyler | Four-panel proof `renders/proofs/assay-office/` (contact sheet, proof.json, index.html); life proof `renders/proofs/assay-office/life/` (life.json with a one-second trace, contact sheet); style sheet `renders/room-05-style-continuity.png` + `.json` |
| **7 · REGRESSION** | **PASS, except the one global check Gate 2 names** | typecheck clean; `npm test` 169/169; `npm run validate` 46 of 47 after the rulings (the global flag-writer red only); `npm run gauntlet` green; Room 1 proof PASS on the pilot's engine, clean tree (`renders/proofs/stage-road/proof.json`), depth and panels unchanged; full-suite reruns after the first final run: 0 | typecheck, `npm run validate`, `npm test`, `npm run gauntlet`, Room 1 proof — run on the committed tree at the end of this report |
| **8 · HUMAN VISUAL GATE** | **PENDING TYLER** | `visual_accepted` is false everywhere. Nothing promoted. Status: **CANDIDATE** |

## WHAT WAS MADE

| | Path | Hash |
|---|---|---|
| Composition master (corrected) | `art/staging/room-05/composition-master-02.png` | `f78a4856f3a6` |
| Rejected master, kept as composition diagnostic | `art/staging/room-05/composition-master-01.png` + `REJECTED-01.md` | `87475a3a940d` |
| Untouched API source, plate | `art/staging/room-05/plate-source-02.png` | `a80140dcfa47` |
| Crop diagnostic | `art/staging/room-05/plate-02/crop-overlay.png`, `safe-frame.json` | SAFE, 15/15 required elements |
| Derived 1920×864 candidate plate | `art/staging/room-05/plate-02/candidate-1920x864.png` | `c0afe61efcf6` |
| Winnie canonical (one generation: rest, writing, looking up) | `art/staging/room-05/winnie-canonical-02.png` | `94e73f0af03c` |
| Winnie runtime sheet (5 frames, relit for her position) | `art/staging/room-05/winnie-02/winnie-sheet-lit.png` + `frames.json` | in `content/ambient/winnie.json` |
| Counter occlusion mask (derived from plate-02) | `art/staging/room-05/mask-plane-1.png` | — |
| Candidate annotation | `reference/room-05/annotation.json` | bound to `c0afe61e…` |
| Gate matrix | `proofs/room-05/gate-matrix.md` | — |
| Prompts, verbatim | `proofs/room-05/prompts/*.txt` | hashed in the ledger |

## TIME OF DAY

**Superseded by owner ruling — `docs/00-errata.md::64 · ACT I MAIN STREET IS NIGHT, AND ROOM 5 INHERITS THE STREET'S STATE — OWNER RULINGS`.** The pilot took daylight from doc 13's mud line and errata 43's "both day"; `proofs/room-05/time-of-day-audit.md` found the canon split and the signed-off Main Street plate night, and Tyler ruled: Act I Main Street is night, Room 5 inherits the street's state, and the Act I route is Room 1 night → Main Street night → Room 5 night. The candidate made here is therefore **ROOM 5 — DAY VISUAL CANDIDATE**: kept, not rejected, the approved source of composition, layout, geometry ancestry, Winnie's design ancestry and object placement, and not the Act I shipping state. A night plate/state derived from the same composition is required before shipping (errata 64c) and is not made before Tyler's visual review of this candidate.

## WHAT THE PROOFS MEASURED

- **Winnie is drawn and masked.** Panel B minus cast-suppressed panel A: 156×212 drawn, cut off at y394, 230px above her feet at y624 — the counter plane (level 1, declared on her record) is masking her. Recorded in `proof.json.ambientFigures`.
- **Thad's depth** passes at both authored extremes (470 at the far edge, 560 near).
- **The bench gate, both sides.** Life route step 07 at ACT 1: a LOOK click on the bench walks him to the floor at (1690,700) and no line plays. Proof panel D at ACT 2 (set by the harness): the bench answers with its act 2–4 line.
- **The dialogue** opens on `WIN_A1`, answers "What is it you actually do here?", and closes on the universal exit; Winnie holds her looking-up frame while the tree is open and returns to work after.
- **Three engine faults** found and fixed by the life proof: `docs/36-issue-list.md::Q25`.

## STYLE CONTINUITY — SUSPECTED ITEMS FOR TYLER (observations, not verdicts)

From `renders/room-05-style-continuity.json`: the interior scale jump (Thad 240 in Room 1 against 470–560 here, Winnie 445 — the approved Nugget already runs 198–459); Winnie's face carrying more tonal gradation than Thad's at 3×; Room 5's surfaces dithered finer than Room 1's mud; Thad's coat reading blue-grey in daylight.

## BUDGET AND CYCLES

- **API operations: 7 of 8** (4 before Tyler's rejection of master-01, 3 after; 1 reserve unused). 61,508 billed tokens. History intact; four rows marked REJECTED, none erased. Sub-caps: master 2/2, plate 2/2, Winnie 3/3, reserve 0/1.
- **Autonomous cycles: 14 of 20** — canon and gate matrix; art (four ops); annotation and mask; engine additions; compiler extensions; extractor and Winnie frames; Tyler's correction (three ops); re-measure and rebuild; validation fixes; runtime proof; life route (three iterations, three engine faults); style sheet; regression.
- Full-suite reruns after the first final run: none; the one red found afterwards (a test naming the fiction) was re-checked with the single validator and the test file.

## DEFERRED — REPORT ONLY

**Audio (`DEFERRED AUDIO REQUIREMENT`, cosmetic unless stated):** pen scratch on Winnie's writing breaks (trigger: break frames 2–3); the pen set into its stand (frame 0 after a break); the stove's tick (stove LISTEN says "Ticking"); the street door's latch on transit (doc 14: "It closes itself, slowly, and latches"); room tone (none gameplay-significant).

**Production debt:** no pen-down pose this pass (the pen appears in hand in one step); Winnie has no talk-mouth overlay (holds a looking-up frame, doc 32 §8.2); a door-open animation for either exit (Room 2's convention is a fade); `WIN_B3`/`WIN_C1` not extracted (below doc 04's own node rules); counted-repeat third lines have no field (errata 45); `WIN_B2` names no entry flag; the promotion step for two NEW assets (mask, Winnie sheet) will rewrite two content paths from `art/staging/room-05/` to `art/masks/` and `art/actors/`.

**Unrelated debt untouched:** Main Street's two masks stay `maskPending`; its ACT gate remains its own to re-prove (ACT is now declared).

## WINNIE COUNTER CONTACT — CORRECTED (2026-09-04)

Tyler's flag on review: her hands and the ink stand floated above the ledger and counter (hands 16px above the ledger's far edge, stand base 29px above the surface). Corrected without any image operation, redesign or plate change: `tools/rig/winnie-counter.py` derives a behind-counter sheet from the lit five-frame sheet (lowered 39px, matted per column against the ledger's far edge and the counter's back edge, stand removed, cropped to what is drawn), and the ink stand is one prop at one plate coordinate with pen-in/pen-out states cut from her own rest frame. Evidence: `renders/room-05-winnie-contact-before-after.png`; `renders/room-05-winnie-pen-state.png` + `proofs/room-05/winnie-pen-state.json`; measurements in `art/staging/room-05/winnie-02-counter/frames.json`; four-panel proof PASS clean on `b75e14b` (her lowest drawn row y400 in the ledger band y398–410, stand base y406 on the surface y399–431); life proof PASS clean on `484c81db`. Geometry, plate, composition, dialogue and Room 1 untouched; API operations still 7 of 8.

## STATUS

**ROOM 5 — CANDIDATE COMPLETE; HUMAN VISUAL GATE PENDING, WITH REQUIRED NIGHT VARIANT BEFORE SHIPPING** (errata 64).

Every gate that machinery can pass passes, on a clean tree, with the candidate plate loaded live and Winnie in the room, and after Tyler's rulings of 2026-09-04 no Room-5-specific creative or content check is red. The queue bench has its LOOK 1–3 and LISTEN 1–3 (docs 05 and 25, compiled by the normal path); the three orphan refusals are struck; `check-examine-lines` and `check-written-content` pass.

**What is still red, and whose it is:** `check-flag-order`, on the bench's ACT gate and on `T_RACCOON_NAMED`. Both are global content debt — the ACT progression writer (doc 48 S1) and the raccoon's naming — that no Room 5 work owns. It is reported here unchanged and is not a Room 5 blocker.

**What the rulings did not touch:** no image API operation was spent (7 of 8 remain the count), no art, mask or geometry changed, and neither proof was regenerated: the four-panel proof exercises the bench's LOOK at ACT 2 and the life proof its absence at ACT 1, and both lines are unchanged. The readiness gate's hotspot cross-check was corrected to count an act-block-only subject beside doc 05's "Eight hotspots." rather than against it; nothing else in a validator changed.

**Then:** Tyler's visual/gameplay review of the candidate — the composition master, the plate, Winnie, the continuity sheet, the four-panel proof and the life sheet. `visual_accepted` stays false until he sets it; nothing is promoted; Room 6 is not begun.
