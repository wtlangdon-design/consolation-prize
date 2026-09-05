# 46 · THE ROOM FACTORY, VERSION 2 — consolidated from Room 5

> **Status: in force.** Version 1 of this document (Tyler's commission at the close of Room 1)
> was a proposal: "nothing here is built yet." Version 2 is written after Room 5, the assay
> office, went through the factory as the autonomous pilot and came out the other side with
> its Act I owner-accepted — and after every predicted tool turned out to exist, be different
> from what was predicted, or be missing in a place nobody had predicted. This rewrite keeps
> the v1 text where it was right, marks it where it was wrong, and states what v2 requires.
>
> **What Room 5 established is the standard.** Room 5 Act I is the benchmark room: the richest
> build contract, the fullest proof set, and the one every later room's contract is measured
> against. Room 1 stays the quality authority for exteriors, the opening and Thad's identity.
>
> **Scope.** This document is STEP 2 of the plan (1 close Room 5 Act I · 2 consolidate the
> factory · 3 audit Main Street and the Nugget · 4 retrofit · 5 resume production). It changes
> no art, no dialogue, no Thad, no Room 1, and performs no retrofit. Zero image operations.

---

# PART ONE — WHERE ROOM 5'S TIME ACTUALLY WENT

Version 1 accounted for Room 1: ~70% engine, ~15% pipeline invention, ~15% the room. It then
predicted the factory's job was the last 15%. Room 5 measured what that 15% contains.

| Share of Room 5's review rounds | What | Would a v1 tool have caught it? |
|---|---|---|
| **Time of day** — a daylight interior generated for a night street; a night plate, a work-area lift and a lamp bought back in three owner rounds | Gate A, asked before art | No. v1's gate never asked what time it was |
| **Character continuity** — Thad walking in one drawing family and standing in another; the head-on idle-break playing a mid-stride frame; five puppet-rig cuts before a hybrid gait | Casting master → families, a stationary-family check | No. v1 had no notion of a family |
| **Physical contact** — hands above the ledger, a stand above the counter, corrected twice by silhouette | Contact bands in the proof spec | No |
| **The floorboard** — flush, then off-route, then a DAY board on the NIGHT plate, then treatment C | Gate G, a natural-encounter proof, the DAY/NIGHT companion check | No. Every rect and every line was correct throughout |
| **Gameplay defects** — the street door's stale open state, the first-sight walk replaying, the greeting's click falling through, the stale node prompt | Enter and leave by the real doors twice; test the last line | No. All four passed every validator |
| **Content gaps** — the bench's LISTEN, three orphan refusals | The readiness gate | **Yes** — and it did |

So the v1 accounting was right about the engine and wrong about the room. The room's 15% is
not "content wiring, staging, geometry"; those were the cheap part. It is **state, cast,
contact, light and perceptibility**, and none of them was on v1's list because Room 1 has one
state, one cast that never stands still, no furniture, one carried light and no clue.

**What still cannot be automated**, unchanged from v1 and confirmed: art quality, comedy
timing, placement judgement, the writing. Room 5 adds one: **whether a clue is perceivable.**
A machine can prove the board is on the walking path and flips under a foot; only a person can
say "I found it" or "it looks like a highlighted tile."

---

# PART TWO — VERSION 1'S THREE BUILDS, AGAINST WHAT EXISTS

*The v1 audit. BUILT / PARTIALLY BUILT / SUPERSEDED / STILL MISSING / WRONG ASSUMPTION, against
the repository at 382d24c. Doc 50's inventory predates Room 5 and is not current on any row
below; this table is.*

## 1 · The room compiler — `tools/compile-room.mjs`

| v1 predicted | Reality | Verdict |
|---|---|---|
| "`extract-content.mjs` generalised" with the room number as a parameter | Rooms 2 and 5 compile from docs 05/13/25/49 plus `reference/room-NN/annotation.json`; registered as generators, `--check` in the suite | **BUILT** (Q15 closed it) |
| Emits dialogue trees too | Dialogue stays in `extract-content.mjs`, per tree; the compiler emits the room file only | **WRONG ASSUMPTION** — and correctly so: a tree's aftermath, repeats and entries (W1) are tree-shaped, not room-shaped |
| Stubs that fail loudly for missing rects | Refuses outright: a hotspot with no rect is a build failure naming the hotspot | **BUILT**, stricter than predicted |
| Act variation "needs a gating field from the start" | `acts.<id>` compiles to a numeric ACT gate (errata 60); Part Two-B variants on an EXISTING hotspot are reported NOT compiled on every run (four in Room 2) | **PARTIALLY BUILT** |
| Room 3 | Refuses on a doc 16 / doc 05 naming mismatch; `nugget.json` has no live writer and carries one stale line (Q26) | **STILL MISSING** for the Nugget |
| — | The stale-geometry report named Main Street and `street_east` in every room's output and listed Room 5's twelve re-sourced approach points as DROPPED on every run — a true 2026-08 report about Room 2, false for Room 5, and `--check` said "current" on the same run | **WRONG (fixed in v2, Q114)** |

## 2 · The room annotator — `tools/annotate/room.html`

| v1 predicted | Reality | Verdict |
|---|---|---|
| "Tyler's fifteen minutes, batched": walk box, depths, rects, exits, spawn, in one sitting | Exists, reads the manifest for its room list, draws walk box, depth samples, arrival, hotspot and exit rects, occlusion planes per band, proof points; emits only what it draws | **BUILT** (Q15 closed it) |
| Tyler in the annotator | **Room 5's annotation was written by Claude reading the candidate plate, bound by hash, and corrected through Tyler's playtest** — the floorboard's rect and tread moved twice by owner finding, not by annotator session | **WRONG ASSUMPTION** about who. The tool is right; the fifteen minutes did not happen and the plate reading did |
| Published with the site | Served from the repo root by the dev server; not a Pages page | **PARTIALLY BUILT** |
| Absorbs the tracer and placer patterns | The floorboard's tread, the lamp's rect, Winnie's contact bands and the step trigger are all annotation fields the annotator cannot draw (`hotspotStates`, `exitWalkTo`, `onEnterWalkTo`, `acts`) — hand-edited JSON, compiled | **PARTIALLY BUILT**: the annotator draws geometry and the annotation has grown past it |

## 3 · The room gauntlet — `tools/gauntlet/`

| v1 predicted | Reality | Verdict |
|---|---|---|
| `room.mjs`: hover every hotspot, every verb on every target, every exit, every dialogue option, every state pair; one contact sheet | No single `room.mjs`. Instead a family: `run.mjs` (doc 44's opening script), `proof.mjs` (four panels), `life.mjs` (a named route, full frames at named steps, `--route`/`--out`), `frames.mjs` (100 ms probe), `route.mjs` (the vocabulary), and per-question proofs (`dialogue-proof`, `fixture-proof`, `w1-proof`, `c5-proof`, `deployed-check`) | **SUPERSEDED** by something better shaped: routes are authored, not enumerated, because enumeration asserts nothing about what a click is FOR |
| "Fed by the compiler's output so it knows what to click" | Aim is read from the room JSON (a hand finding the lamp), expectations are written by hand (doc 44 honesty 3); captures declare `room` and `assert {speaker, options, thadAt, facing, flagsAbsent, act, cues}` | **BUILT**, on the honesty rule v1 did not have |
| Contact sheet as the definition of "built" | Every proof writes one; built in batches of six after a payload limit was hit | **BUILT** |
| — | Probe reports selections, puzzles, inventory, choice lines, dialogue position; `?fixture=` restores a named state through the save path; `?state=` and `?candidate=` select a visual state and staged art | **BUILT beyond v1**, and all three URL parameters are live in the published build (Q12's debt) |

## 4 · What v1 did not predict at all

| Area | Reality | Verdict |
|---|---|---|
| **Character pipeline** | Doc 38's rig (`character.py`) is a puppet rig; Tyler's rulings of 2026-09-05 (docs/52) replaced it for walks with **authored whole-body poses cropped whole**, and the hybrid rule (authored upper bodies intact, only the legs beneath the coat constructed) for the frozen gait. `check-stationary-family` holds every standing clip to its facing's stand source. Winnie was cast from a composition master in one generation with three poses | **SUPERSEDED**: the pipeline is families and masters, not rigs |
| **Room life** | `content/ambient/*.json`: an idle plus a POOL of breaks on an irregular timer, a talk frame held while the tree is open, props with per-frame states (the ink stand), a clip plane per figure; `life.mjs` proves ~200 s | **BUILT** |
| **Stateful art / world state** | `Interactable.states[*].image` + `imageByState` + `bounds` + `occludes`; lamps with `amountByState`; `step` triggers (`StepTriggers.ts`, swept, one press per crossing); `objectStates` in the save | **BUILT** for the cases Room 5 needed; the DAY/NIGHT selection from canon (Q26's mechanism) is **STILL MISSING** — `?state=` is dev-only |
| **Multi-act rooms** | ACT is a counter (errata 60) nothing writes; the bench is wired and proved at ACT 2 by the harness; puzzle progress (`puzzles.C5`), dialogue counts, topic flags, inventory and world-prop state are five kinds kept apart (doc 53); fixtures reach later states without playing to them | **PARTIALLY BUILT**: the state model exists; the act turn does not |
| **Acceptance** | The build ledger's `accepted` means visual_accepted and nothing else; Room 5's Act I gameplay, its C5 scene and its promotion were three more facts held as prose | **STILL MISSING** until v2's build contract (part four) |

---

# PART THREE — THE DISCIPLINES, CONFIRMED AND EXTENDED

v1's two disciplines paid throughout Room 5 and are restated as they now read.

**Every bug becomes a check, at the layer that could have caught it, and the check is proved
by reintroducing the bug.** `check-stationary-family` failed on exactly the four offending
clips; `check-state-images` fails on the floorboard defect by name; `check-fixtures` refuses
the four illegal combinations; the contract validator refuses SHIPPING under `art/staging/`.
Part five is the ledger of which bug became which check.

**Measure before ruling; render before judging — and now: PLAY BEFORE ACCEPTING.** Room 5's
four gameplay defects were invisible to every proof that warped in, because a proof that
enters by a URL never opens the door. The gameplay pass enters and leaves by Main Street's
door three times, and that is where the stale door state lived.

**A third, from Room 5: THE OWNER'S FINDING IS THE SPEC.** Five of the nine FAILs in the
retrospective (part seven) were found by Tyler playing, not by a tool, and each became a
requirement with a check. The factory does not replace that loop; it shortens the distance
between "Tyler found it" and "a check catches it next time" to one commit.

---

# PART FOUR — FACTORY V2: WHAT A ROOM BUILD IS NOW

## 4.1 · The pre-art gate — nine answers before any image is requested

Doc 35's gate stands and runs (`tools/room-gate.mjs`, `tools/check-room-readiness.mjs`). Room
5 added the questions doc 35 did not ask. **Every one is answered in the room's build contract
(`content/build-contracts/<room>.json`) before art**, each with evidence a person can open,
and `NOT-RUN` is an answer that says why.

| | Gate | The question Room 5 taught | Room 5's cost of asking it late |
|---|---|---|---|
| **A** | **Room story state** | Which acts visit; what differs per act; **what time of day the player arrives from, by canon**; which flags, puzzles, items, counts and world-prop states the room reads | A daylight plate for a night street: one night plate, one lift, one lamp |
| **B** | **Static vs stateful art inventory** | Every subject classed PLATE / STATEFUL / TAKEABLE / MOVER / ABSENT-LATER / OVERLAY / MASK / LIGHT / PROP; for each STATEFUL, every state and every visual-state companion | The floorboard's DAY board over the NIGHT plate |
| **C** | **Cast** | Every person from ONE canonical identity (a composition master), poses derived, never separately generated; which movement family each clip belongs to; which clip owns the stationary state per facing; left mirrored from right | Two Thads; a mid-stride idle-break |
| **D** | **Room life** | What each occupant DOES (canon names it), with what props, what the pool of breaks is, what is held while the tree is open, and what never becomes business (load-bearing hotspots) | Nothing — because it was asked. The gate matrix part three |
| **E** | **Physical contact** | Where hands, props and feet meet the furniture, as silhouette bands the proof asserts | Two contact corrections |
| **F** | **Lighting** | Plate light vs carried light; the task light where the work is; a state per authored time of day; sprites relit per state and per position | The lift and the lamp |
| **G** | **Clue perceptibility** | For each puzzle-critical physical fact the writing advertises: is it drawn at gameplay scale; is it on a natural route; does it advertise by behaviour, never by highlight | Three floorboard iterations |
| **H** | **Content / compiler health** | `BUILDABLE WITHOUT INVENTION: YES`; the compiler current; nothing unhoused; every gap reported, none filled | Nothing — the readiness gate held |
| **I** | **Art budget** | Every operation under a named cap with a ledger row, hashes and references transmitted; 0 without authorization | Nothing — the caps held |

## 4.2 · Art production v2

Errata 54's rules and errata 63's provisional transform stand. Added by Room 5:

1. **The composition master comes first**, transmitted with every later call; plates and cast
   derive from it. A master rejected by Tyler is kept as REJECTED with the reason.
2. **A plate is generated for the state canon says the player arrives in** (gate A), and every
   other authored state is an edit of the same source with lighting only, proved at zero
   geometry drift against the annotation (`proofs/room-05/night-geometry-drift.json` is the
   shape).
3. **Anything that is one prop in every state says so** (`sameInAllStates`); anything that is
   not has a companion per state (`imageByState`). `tools/check-state-images.mjs` enforces
   both and the geometry between them.
4. **Deterministic derivations are not image operations**: the lift, the lamp cut-out, the
   floorboard's lifted pixels, the relights and the counter matte were all made without the
   API and are recorded with the script that made them.
5. **Rejected candidates are preserved, never deleted**, under the room's staging directory with
   `owner_rejected` and the reason.

## 4.3 · Character pipeline v2

Docs 38 and 52 as amended by Tyler's rulings of 2026-09-05:

- **Casting master first.** One canonical identity per character; every pose from it.
- **Movement families, not puppet rigs.** A walk is a family of complete authored poses on one
  sheet, cropped whole; a phase the sheet did not draw is a missing frame to report. The hybrid
  rule (authored upper bodies, constructed legs under the coat) is how Thad's gait was
  completed and is frozen for him; it is not a licence to return to limb surgery.
- **Mirroring.** One canonical side, mirrored deterministically for the other. No second
  interpretation of a profile.
- **Family continuity, checked.** `check-stationary-family`: every clip that plays while a
  character stands still is rigged from that facing's stand source. The continuity sheet at one
  displayed height is the human half.
- **Stationary state ownership.** Idle, idle-break and recoil own the standing figure; a
  locomotion frame never plays while the actor is still (`frames.mjs` proves it over a minute).
- **Occupational characters are cut for where they stand** (behind a counter: matted, lowered,
  props separated) and relit per state.

## 4.4 · Room-life v2

A room is not alive because a sprite breathes. The contract's gate D requires: an occupation
canon names; a pool of separate breaks on an irregular timer (never a routine in order); a held
performance frame while the tree is open; props that travel with the character or sit at one
plate coordinate with per-frame states; and **a live idle proof of at least sixty seconds**
with every frame change logged and zero locomotion frames while still (`life.mjs`, the
`assay-office-life` route: ~200 s).

## 4.5 · The stateful prop contract

A prop that changes declares, as data on the interactable: its rest state and its changed
state as images (with companions per visual state), the trigger geometry (a `step` tread is
the worked example), the hold, the caption and the cue id. The engine knows a rectangle, two
state names and a hold; it does not know it is a floorboard. `tests/floorboard.test.ts` walks
the geometry rather than calling the effect.

## 4.6 · Swept movement triggers — the regression list

A narrow trigger is tested against ACTUAL traversal, swept from last frame to this one, across
the supported pace range (1.0 / 1.25 / 1.5): one press per crossing, silent while standing,
re-arm on leaving, a stride wider than the tread still presses, a placement is not a step. The
floorboard's tests are the template for any future tread, threshold or beam.

## 4.7 · Dialogue v2 — the regression list

From doc 30, errata 57 and Q109–Q113, every tree is held to: no `node.prompt` drawn (the
choice interface draws options only); every option's aftermath authored (`retain` / `remove` /
`counted-repeat` / `rephrase` / `replace`) and persistent selection counts in the save; the
greeting owns the click from its first line to its list; an evidence action on a person opens
its node then and there; raw markup never reaches a rendered line; the approach lands on the
dialogue point facing the speaker from every start position.

## 4.8 · The state model

Five kinds of state, kept apart, plus ACT (doc 53, errata 66 B): **topic flags**, **puzzle
progress**, **inventory**, **dialogue selection counts**, **world-prop state**; the ACT counter
written only at the act turns. No kind stands in for another. A fixture expresses any legal
combination and `check-fixtures` refuses the illegal ones.

## 4.9 · DAY/NIGHT companion mapping

`imageByState` support exists in the renderer, the boot loader and the probe. The generic check
(`tools/check-state-images.mjs`) derives the room's visual-state set from everything in the
room that answers to one (lamps' `amountByState`, images' `imageByState`) and fails a DAY-only
overlay in a NIGHT room, a missing companion, a companion of a different size, and a companion
that is the base file in disguise. What is still missing is Q26's mechanism: selection of the
visual state from canon rather than from `?state=`.

## 4.10 · Natural-encounter proof

For every gate-G item, a route that reaches it on an ordinary path (the entrance-to-counter
walk crosses the board) and a person who reports finding it. The route is the machine half;
the person is the gate.

## 4.11 · Accepted-work protection

Accepted assets are frozen by name (Room 5's night composition, Winnie, the lamp, floorboard C,
Thad's hybrid gait) and no task touches them without a new owner ruling. Every candidate lives
under `art/staging/`; the contract validator refuses SHIPPING there and refuses a candidate
stage outside it; `?candidate=` can only point at staging; promotion is a separate, logged step
no tool performs.

## 4.12 · The candidate lifecycle, mapped to what exists

```
GENERATED → STAGED → GATES → CANDIDATE → LIVE PROOF → OWNER VISUAL ACCEPTANCE
          → GAMEPLAY ACCEPTANCE → SHIPPING / PROMOTED
```

| Stage | Where it is recorded today | Nothing migrates; the contract names the stage |
|---|---|---|
| GENERATED / STAGED / GATES | `art/staging/ledger.json` row: out path, hashes, `gates.passed` | |
| CANDIDATE / LIVE PROOF | `renders/proofs/<room>/proof.json` `candidates[]` with `rendered` and hash | |
| OWNER VISUAL ACCEPTANCE | staging ledger row `visual_accepted`, build ledger `visual_accepted`, the asset's own record (`floorboard.json`, `profile-walk.json`) | contract `acceptance.visual` |
| GAMEPLAY ACCEPTANCE | build ledger `acceptance.gameplay` (prose) | contract `acceptance.gameplay.<scope>` (dated) |
| SHIPPING / PROMOTED | the asset under `art/` and the room file naming it | contract `acceptance.promotion` |
| REJECTED / LEGACY | `owner_rejected` on the record; the 320×144 placeholders | contract lifecycle rows |

## 4.13 · Proof v2 — the definition of "built"

A room is built when: the readiness gate says YES; the compiler is current; the four-panel proof
passes on a clean tree; the life proof passes; **a gameplay pass enters and leaves by the real
doors twice and exercises every target, every wrong verb, every tree in full, the approach from
five positions, interruption and resume, input, and a minute stationary**; the regression set is
green (typecheck, suite, validators, gauntlet, Room 1's proof) except reds ruled out of scope
by name; and the deployed build passes `deployed-check` at its merge commit. Every proof record
now carries a `judgement` block naming what the machine established and what a person still
holds (`proof.mjs`, `life.mjs`).

## 4.14 · Machine gates and human gates

| Machine (a script, under a minute) | Human (Tyler, by date) |
|---|---|
| readiness, compiler, fixtures, state images, contracts, ledger, the suite | composition, style, scale, likeness, lighting balance |
| four-panel, life, gameplay, fixture and deployed proofs | whether the room reads and is funny |
| geometry drift, contact bands, depth marks, occlusion | whether a clue is perceivable and not over-marked |
| stationary family, state coverage, asset paths | visual acceptance · gameplay acceptance per scope · promotion |

---

# PART FIVE — THE BUG → CHECK LEDGER, FROM ROOM 5'S PRODUCTION

*Every entry is a defect that actually occurred. No trivialities. "Check" names the mechanism
that catches it now; MISSING is written where none does.*

| # | Defect (where recorded) | Layer | Check now |
|---|---|---|---|
| 1 | Wrong time-of-day asset: a daylight interior entered from a night street (`proofs/room-05/time-of-day-audit.md`, errata 64) | gate A | Contract gate A with evidence; **no script can derive canon's time of day** — a person answers it |
| 2 | Scale regression: Thad two drawings, one screen speed at every size (Q107) | cast | `check-stationary-family`; `proofs/thad/locomotion.json`'s body-heights-per-second; `frames.mjs` |
| 3 | Family mismatch between standing and walking clips (Q107) | cast | `check-stationary-family` |
| 4 | Stationary mid-stride frame from a head-on idle-break (Q107) | cast | `check-stationary-family`; the stationary route (`*-stationary.json`) with zero locomotion frames asserted |
| 5 | Severed puppet arms, gallop, dance-arm, floating forearm (Q107, five cuts) | cast | Docs/52's authored-pose rule; `tools/rig/cut-cycle-sheet.py` cuts whole; the continuity sheet (human) |
| 6 | Approach too close: dialogue point on top of the counter; verb persisted through a conversation (Q25) | approach | `assay-office-act1-approach` route asserts the dialogue point and facing from five starts |
| 7 | Raw markup in a rendered line (`*(second)*` markers) (Q112) | extraction | `check-no-markdown-emphasis`; the extractor parses repeat markers |
| 8 | Stale node prompt drawn over the choices (Q110) | renderer | `tests/dialogue-presentation.test.ts`; `dialogue-proof.mjs` asserts `choiceLines == options` |
| 9 | Floorboard invisible at gameplay scale (Q108) | gate G | Contract gate G; the natural-encounter route; **the perceptibility itself is human** |
| 10 | Floorboard in the wrong location (off every natural route) (Q108 it. 1) | gate G | `assay-office-floorboard-encounter` route |
| 11 | Floorboard over-highlighted: a DAY board on the NIGHT plate (Q108 it. 2) | state art | **`check-state-images`** (new, v2) |
| 12 | Re-entry broken by stale door state: a 320×144 overlay and old-space bounds on Main Street's open door (Q109) | transit | The re-entry route (three round trips through the real door); `check-asset-paths` did not catch it because the file existed |
| 13 | NPC life: a verb stuck through a conversation; an NPC's box swallowing a hotspot; verb lines with no speaker (Q25) | engine | The life proof; `tests/room-05.test.ts` |
| 14 | First-sight walk replaying on every re-entry (Q109) | onEnter | The re-entry route asserts the arrival point on the second and third entry |
| 15 | Greeting click falling through to the hotspot behind it (Q109) | input | `tests/opening.test.ts` greeting case; the interrupt route |
| 16 | Hands above the ledger, stand above the counter (pilot report, corrections 1–2) | contact | `proofs/spec/<room>.json` `ambientContact` bands, asserted by `proof.mjs` |
| 17 | The ambient hit test before hotspots: USE on Winnie hit the shelves behind her (Q113) | input | A live evidence pair on the person wins; `tests/c5.test.ts` |
| 18 | Unbounded resample cache growing across a long session (Q109) | renderer | `tests/actor-sprite-cache.test.ts` |
| 19 | Contact-sheet payload limit: a 65-capture sheet failed to compose (Q109) | harness | Batched composition in `proof.mjs` |
| 20 | Captures named by heuristic asserting the wrong room (Q109) | harness | Captures declare `room` and `assert` |
| 21 | The compiler's false DROPPED report on Room 5's re-sourced approach points, worded for Main Street (Q114) | compiler | Fixed: only an approach point the compiled room lacks is reported, in room-neutral words |
| 22 | The `check` CI job red on `check-flag-order` (ACT, `T_RACCOON_NAMED`) — global content debt, not a room's | content | Reported on every task; ruled out of scope 2026-09-04; **not fixed, by ruling** |

**MISSING, named:** (a) Q26's canon-driven visual-state selection; (b) an annotator that can
draw `hotspotStates`, treads and contact bands; (c) a compiler path for the Nugget; (d) Part
Two-B act variants on existing hotspots; (e) the ACT writer (doc 48 S1); (f) an SFX layer for
the cues that are fired and counted.

---

# PART SIX — TOOL GAP AUDIT AND WHAT V2 BUILT

| Need | Covered | Partly | Missing |
|---|---|---|---|
| DAY/NIGHT companion validation | **`check-state-images.mjs`** (v2) | | canon-driven selection (Q26) |
| Room build manifest / gate fields | **`content/build-contracts/*.json` + `check-build-contracts.mjs`** (v2) | | |
| Proof metadata, human vs machine | **`judgement` on every proof record** (v2) | | |
| Room gate schema | doc 35's gate as `room-gate.mjs` + the contract's nine answers | `room-gate.mjs` reads doc 05's first section only | |
| Acceptance-state distinction | **contract `acceptance.{visual, gameplay.<scope>, promotion}`**, cross-checked with the ledger (v2) | | |
| Compiler / annotator reconciliation | **the false DROPPED report fixed** (v2); `--check` in the suite | the annotation has fields the annotator cannot draw | Nugget compile path |
| Character continuity | `check-stationary-family`, `check-state-coverage`, `check-clip-agreement` | | walk-family continuity is human |
| Room life | `life.mjs`, `frames.mjs` | | |
| Fixtures / state access | `check-fixtures`, `?fixture=` | live in the published build (Q12) | |
| Gameplay pass | `life.mjs --route`, five routes | authored per room | |

**Deliberately not built** (v2 §22's bad list): a bigger annotator, a renderer rewrite, an
animation suite, future-state selection, the flag-order red, any content rewrite.

---

# PART SEVEN — THE ROOM 5 RETROSPECTIVE, AGAINST THE CONTRACT

`proofs/room-05/factory-v2-retrospective.json`, 24 rows. **At production: 9 FAIL, 14 PASS,
1 DEFERRED. Now: 22 PASS, 2 PASS WITH EXISTING ACCEPTED EXCEPTION, 0 FAIL, 0 DEFERRED.** The
two exceptions are the profile chore clips (docs/52 debt, unused by any Act I action) and the
flag-order red (ruled out of scope). Nothing was fixed by the audit; every production FAIL is a
row in part five.

---

# PART EIGHT — RETROFIT CLASSIFICATION (defined here, applied in step 3)

| Class | Meaning |
|---|---|
| **KEEP** | Meets the contract as is; frozen if owner-accepted |
| **IMPROVE** | Meets the contract in kind; a deterministic derivation (relight, matte, companion) closes the gap, no image operation |
| **RECAST** | A character whose identity or family fails gate C; a new casting master, owner-authorized |
| **REGENERATE-CANDIDATE** | A plate or overlay that fails gate A/B/F; a new candidate through the full lifecycle, owner-authorized, the old one preserved |
| **DEBT-NOT-VISUAL** | A gap in content, engine or tooling that no picture fixes (the Nugget's compiler path, the ACT writer) |
| **NOT-CLASSIFIED** | The audit has not been run |

Rooms 1, 2 and 3 carry NOT-CLASSIFIED on every element. **The audit is step 3 and is not
performed by this document.**

---

# PART NINE — THE CHECKLIST

**BEFORE ART**
1. `node tools/check-room-readiness.mjs <n>` → YES, or stop.
2. `node tools/room-gate.mjs <n>` and the gate matrix by hand (doc 35, reading doc 02).
3. The contract's nine pre-art answers, with evidence, in `content/build-contracts/`.
4. Time of day and every visual state from canon (gate A) — into the plate brief.
5. Cast list with masters named; occupations named; contact bands drafted.
6. Caps set in `art/staging/caps.json` by Tyler.

**BEFORE A LIVE CANDIDATE**
7. Composition master → plate for the arrival state → other states as edits, zero drift.
8. Annotation bound by hash; compile; `--check` current; `check-state-images` green.
9. Four-panel proof, life proof, gameplay pass (real doors, twice), clean tree.
10. Regression set green except reds ruled out by name; contract live gates answered.

**OWNER GATES**
11. Visual acceptance, dated, by scope, in the contract and the ledger.
12. Gameplay acceptance per act/scene, dated, on the deployed build at its commit.
13. Promotion, logged, never by a tool.

---

# PART TEN — WHAT ROOM 5 IS NOW, AND WHAT IS NEXT

**Room 5 Act I: OWNER-ACCEPTED (2026-09-05).** C5/WIN_B2: built early, preserved, not
advanced, not accepted. WIN_B3, C6, E4/WIN_C1, the Act IV assay and F5: contracted and unbuilt
(doc 53). A room may be Act I accepted with its later states deferred; that is now a recorded
status, not an exception.

**Next: OPENING SET CONTINUITY RETROFIT AUDIT — ROOM 2 + ROOM 3** — the step-3 audit of Main
Street and the Nugget against this contract, classifying every element by part eight, with no
art produced.
