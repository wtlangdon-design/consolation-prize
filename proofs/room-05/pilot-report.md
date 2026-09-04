# ROOM 5 · THE ASSAY OFFICE FRONT — AUTONOMOUS PILOT REPORT

*Evidence-backed. A gate is PASS only where a file or a command result says so. Nothing here is a visual judgement; every visual judgement is Tyler's.*

Start commit `b63bb4dd` · pilot start record `proofs/room-05/pilot-start.json`

## THE EIGHT GATES

| Gate | Result | Evidence |
|---|---|---|
| **1 · CANON / CONTENT** | **PASS, with one declared gap** | `proofs/readiness/room-05.json` (writing YES on every axis); `proofs/room-05/gate-matrix.md`; the compiler's own reconciliation (`node tools/compile-room.mjs 5`: 60 authored lines carried, two unhoused subjects named). **No creative invention was required or made.** The gap: THE QUEUE BENCH has no LISTEN and no repeat variants in canon — `docs/36-issue-list.md::Q24 · THREE ROOM 5 REFUSALS HAVE NO HOTSPOT TO LIVE ON, AND THE QUEUE BENCH HAS NO LISTEN`. BUILDABLE CREATIVE CANON: **YES** for everything the room draws and says; **NO** for the bench's LISTEN, which is one line and Tyler's |
| **2 · ROOM DATA / GAMEPLAY** | **FAIL on one subject** | `content/rooms/assay-office.json` (compiled, one writer, byte-identical across the compiler and the extractor); `content/dialogue/winnie.json` (five nodes, entries by act); `content/ambient/winnie.json`; tests `tests/room-05.test.ts` (3 pass: act-gated entries, the T_TUNES_PIANOS negative and positive side, the bench at ACT 1/2/5). `npm run validate`: **3 of 47 red**, all on the bench — no LISTEN, one LOOK variant / no pool, and an ACT gate nothing in built content writes — plus `T_RACCOON_NAMED` (an Act II gate, same class). None was weakened, excluded or disabled |
| **3 · GEOMETRY / PHYSICALITY** | **PASS** | `reference/room-05/annotation.json` bound to plate-02's hash; compiler output (3 bands, bench carved, 9 approach points, 2 exits, 3 entrances); proof depth marks at both extremes pass; entrance at the street door, exits by walking to the door; the counter plane masks Winnie by measurement (below) |
| **4 · ART PROVENANCE** | **PASS** | `reference/global-baseline.json` (A–E hashed; the Room 1 casting master required and transmitted on every call); `art/staging/ledger.json` rows 5–11 (every reference path, hash and `transmitted: true`; four rows marked REJECTED with Tyler's reason); `art/staging/room-05/plate-02/safe-frame.json` (source hash, crop, `lanczos3-separable-premultiplied-srgb-clamped`, derived hash, SAFE); `art/staging/room-05/winnie-02/frames.json` |
| **5 · CANDIDATE RUNTIME IDENTITY** | **PASS** | `renders/proofs/assay-office/proof.json`: `candidates[0].rendered = art/staging/room-05/plate-02/candidate-1920x864.png`, hash `c0afe61e…`, every panel's `bg:assay_office` row `candidate: true, loaded: true`; the mask and Winnie's sheet loaded; no stub, no fallback; the override was a URL parameter and is gone |
| **6 · VISUAL / RUNTIME PROOF** | **PASS** (technical admissibility only) | Four-panel proof PASS on commit `721b2595`, clean tree, panel D speaking the bench's line at ACT 2; life proof PASS on `8fe42509`, clean tree, 12 captures over 199s with 122 logged events; style sheet with four suspected items listed for Tyler | Four-panel proof `renders/proofs/assay-office/` (contact sheet, proof.json, index.html); life proof `renders/proofs/assay-office/life/` (life.json with a one-second trace, contact sheet); style sheet `renders/room-05-style-continuity.png` + `.json` |
| **7 · REGRESSION** | **PASS, except the three checks Gate 2 names** | typecheck clean; `npm test` 169/169; `npm run validate` 44 of 47 (the three bench/flag reds, unchanged in kind); `npm run gauntlet` green; Room 1 proof PASS on the pilot's engine, clean tree (`renders/proofs/stage-road/proof.json`), depth and panels unchanged; full-suite reruns after the first final run: 0 | typecheck, `npm run validate`, `npm test`, `npm run gauntlet`, Room 1 proof — run on the committed tree at the end of this report |
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

Daylight is canonical for this visit, not the model's choice: `docs/13-room-02-content.md` THE MUD · PICK UP — *"I am now a man holding mud, in a street, in daylight"* — and errata 43: the other street screens are *"both exteriors, both day. They inherit Room 2's palette script."* Room 5 is entered from Main Street in Act I. Room 1's night is Room 1's.

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

## STATUS

**ROOM 5 — CANDIDATE, NOT CANDIDATE-COMPLETE.** Every gate that machinery can pass passes, on a clean tree, with the candidate plate loaded live and Winnie in the room. What stops the word "complete" is one subject: the queue bench, whose LISTEN and repeat variants are not written anywhere and whose act gate cannot be written by anything built. Three validators say so and were left saying so.

**Primary blocker category: missing creative canon** — one LISTEN line (and two repeat variants) for THE QUEUE BENCH, `docs/36-issue-list.md::Q24`. Secondary: the ACT writer (doc 48 S1) and `T_RACCOON_NAMED`'s writer are unbuilt content, not Room 5's.

**Smallest next owner decision:** write the bench's LISTEN (and its two repeats), or rule that the bench is not a hotspot — in which case Room 5 has no authored state variation and panel D needs a ruling of its own.

**Then:** Tyler's visual/gameplay review of the candidate — the composition master, the plate, Winnie, the continuity sheet, the four-panel proof and the life sheet.
