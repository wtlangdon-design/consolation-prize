# 50 · THE AUTONOMY DELTA AUDIT

*A record, not a ruling. Errata 52's stop condition holds: nothing here becomes
global canon, and every finding that survives goes into `docs/36-issue-list.md`
as a Q, which is where doc 41 says findings go.*

**What it answers:** is the green in `npm run check` evidence, and what is
actually missing before one room can be built without Tyler debugging it.

**What it does not answer:** whether any room is any good. Doc 44's first
honesty and doc 46 part one, both permanently.

---

# PART ZERO — THE STATE THIS WAS RUN AGAINST

| | |
|---|---|
| Branch | `claude/last-claim-autonomy-audit-v3vsy6` |
| Commit at audit start | `4b45d23a4ce38da2758c47e8c0f3fdc7f9ea86ff` |
| Working tree at start | clean |
| `npm run validate` | 48 of 48 passed |
| `npm run test` | 157 of 157 passed |
| `npm run typecheck` | clean |
| `npm run gauntlet` | green — **2 of 12 beats assert anything** |

**`node_modules` was absent and `npm run validate` did not run at all** until
`npm install` was run: it died on `Cannot find package 'typescript'` from
`check-entity-fallback`. Recorded because it is the first thing an autonomous
session hits, and because a suite that cannot start looks nothing like a suite
that passes and everything like a broken environment.

---

# PART ONE — THE PER-ASSERTION TRUTH TABLE

**A validator is not one claim.** Several here make three or four independent
assertions, and the mix of current and retired inside one check is precisely
what a per-check label hides. The classifications are the audit's:

| | |
|---|---|
| **CURRENT + PROVEN** | canon requires it, it examines real live subjects, and a mutation proved it catches the defect |
| **CURRENT + UNPROVEN** | canon requires it and it has subjects, but nothing has demonstrated the failure |
| **VACUOUS** | it can report success without establishing the assertion |
| **SUPERSEDED** | it may detect the condition correctly; canon no longer requires the condition |
| **DIAGNOSTIC ONLY** | useful information, not an acceptance criterion |

**A mutation test proves a validator can detect a condition. It does not prove
the condition is still canon.** Three assertions below are well-tested and
superseded, and that is not a contradiction.

## 1 · Assertions that were VACUOUS, with the witness

| Check | Assertion | Canon | Live subjects | Witness | Class | Action |
|---|---|---|---|---|---|---|
| `check-cycling-lands` | "every declared cycling element finds its pixels" | doc 18 **void** (errata 54); the check exists to catch the void mechanism still being declared | 1 non-dormant (`stage_road/puddles`) | **M6/M7**: moved its bounds to a 1×1 box, then off the plate entirely — **passed both times**. Its three band colours appear in `room-01-stage-road.png` exactly ONCE between them: one pixel of `#31396d` at (891,408), in the sky | **VACUOUS** | **FIXED.** Scans the declared bounds with a floor of 16px |
| `check-residual-key` | "no sprite carries the key colour it was cut from" | current — the coach's purple wedge is real | 358 files, **0 skipped today** | **M18**: truncated a sprite to 40 bytes; `catch { continue }` swallowed it and the check reported "358 scanned" and passed | **CURRENT + PROVEN** for the key test, **VACUOUS** on unreadable input | **FIXED.** Non-RGBA is a named note; anything else fails |
| `check-no-sheets-in-plates` | "no sprite sheet is baked into a background plate" | current — the Nugget shipped with six bar men | 10 sheets | **M55/M58**: made the dog's declared sheet *be* the Nugget's plate — the fault in its purest form — and it **passed**. Its only `report.fail()` is an unreadable file; the condition in its title is a `note` | **VACUOUS** | **DEMOTED** to diagnostic and renamed. Closing it for real means searching each plate for the sheet's SECOND frame; costed, not built |
| `check-variant-one` | "variant 1 stands alone (doc 17)" | current as a writing rule | 176 sequences | **M53**: handed a blatant violation, it listed it as a candidate and passed. **Zero `report.fail()` calls in the file** | **DIAGNOSTIC ONLY** | **DEMOTED** and renamed |
| `audit-look-figures` | "LOOK describes only what is rendered (ruling 19b)" | current | 1000 lines | **M54**: handed a LOOK line naming a figure that is nowhere in the frame, it listed it and passed. **Zero `report.fail()` calls** | **DIAGNOSTIC ONLY** | **DEMOTED** and renamed |
| `check-puzzle-graph` | "all 45 puzzles reachable; win reachable from every state" | current, and one of CLAUDE.md's named criteria | **ZERO** — `manifest.puzzles` is `[]` | **M61**: given a one-puzzle graph it failed on 44 missing canonical ids, so the machinery works | **VACUOUS** by subject count | **KEEP.** It already prints "this check is inert in Phase 1 by design, not passing on evidence", which is the honest form |
| `check-staging` | "staging marks stand on floor" | ruling 23 | **ZERO** staging marks; 13 arrival points | **M12** proved the arrival half | **arrival: CURRENT + PROVEN. marks: VACUOUS by subject count** | **KEEP** — it already says "13 room(s) with floor declare no staging marks yet" |

## 2 · Assertions that are SUPERSEDED

| Check | Assertion | Why superseded | Witness | Action |
|---|---|---|---|---|
| `check-palette` | palette is `locked` | Errata 54: "`consolation-256.json` ceases to be authoritative. Retained for reference only." **But `Screen.ts` still throws on a palette that is not locked** — doc 36 Q19, "errata 54 retired a thing the engine cannot start without" | M1 fails correctly | **KEEP the assertion, RENAME the check.** It guards a live boot precondition that is itself retired debt |
| `check-palette` | exactly 256 entries | Full RGB has no entry count | M2 fails correctly | **DEMOTED** with the check |
| `check-palette` | every channel on the 6-bit VGA grid | Nothing quantises to 6-bit | M4 fails correctly | **DEMOTED** with the check |
| `check-palette` | the 8 UI roles resolve; content colour indices in range | **CURRENT.** `Screen.roleColour` reads roles by name for all chrome; `Renderer` draws `room.colours.sky/ground` and `target.colour` for plateless rooms | M3 fails correctly | **CURRENT + PROVEN.** The reason the check is kept at all |
| `check-palette-cycling` | mode, rate ≤ 4 Hz, band inside its family, ≤ 2 elements, unique band colours, bounds have area | Doc 18 is **void in full**. Every subject is now dormant | M8, M9 fail correctly | **DEMOTED** to diagnostic. Kept whole: the day a mechanism replaces cycling these are its rules |
| `check-item-names` | a label fits the sentence line | Measured as `320 - 2 × panel.sentence.x` = **248px**, against the void 5×7 font. Errata 54 replaced the 320-wide frame and voided the font; no replacement is chosen (Q16) | M59b fails correctly | **BLOCKED on Q16, not changed.** Widening it to 1920 makes it pass on everything, which is a vacuous assertion bought with a one-line edit |
| `check-item-names` | two items must not draw the same label or the same icon | Errata 29's uniqueness rule stands | M38 fails correctly | **CURRENT + PROVEN** |

## 3 · Assertions that are CURRENT + PROVEN

Each has a negative witness from the mutation worktree. Section 4 records the
mutation, the expected failure and the actual one.

| Check | Assertion proved | Mutation |
|---|---|---|
| `check-no-content-in-code` | prose literal in an engine `.ts` | M20 |
| `check-no-content-in-code` | the engine names the fiction | new, this audit |
| `check-no-content-in-code` | content JSON compiled in | new, this audit |
| `check-content-schema` | exit to an unknown room | M14 |
| `check-content-schema` | a rect that leaves the room | M50 |
| `check-extraction` | generated content edited by hand | M27 |
| `check-state-coverage` | a state declared on some clips and not others | M45c |
| `check-sequences` | a timed beat outside `control: none` | M26 |
| `check-map` | a map location with no marker | M41 |
| `check-walkable` | a walkable region with no depth zone | M11 |
| `check-room-entries` | a room nothing exits to and which declares no entrance | M42 |
| `check-staging` | an arrival point off the floor | M12 |
| `check-walk-boxes` | an object with no `defaultVerb` (errata 28b) | M33 |
| `check-walk-boxes` | a walk box unreachable from the first | M57 |
| `check-beat11-path` | a waypoint that grows with depth | M37b |
| `check-item-names` | two items rendering the same icon | M38 |
| `check-combinations` | an authored pair with no written line | M39 |
| `check-examine-lines` | a hotspot with no LOOK line | M43 |
| `check-examine-lines` | a LOOK line duplicated across hotspots | M13 |
| `check-written-content` | an examine response reduced to one line | M56 |
| `check-fixed-lines` | a response rule added for a fixed verb | M51 |
| `check-dialogue-nodes` | a node with no `[COMIC]` option | M28 |
| `check-flag-order` | a gate on a flag nothing writes | M15 |
| `check-glyph-coverage` | a glyph removed while content uses it | M40 |
| `check-room-01-drawn` | a Room 1 module reaching for the reference at compose time | M47 |
| `check-stable-seeds` | `hash()` in the pixel-art pipeline | M46 |
| `check-asset-paths` | a declared path that does not resolve | M10 |
| `check-mover-lifecycle` | a chore clip the actor does not declare | M25 |
| `check-actor-clips` | a clip directory with no `rig.json` | M36 |
| `check-boot-assets` | a declared image in NEITHER boot list (the Hob category) | M21b |
| `check-actor-frames` | a declared figure height its frames cannot hold | M44 |
| `check-generated` | a generated file edited by hand | M19 |
| `check-residual-key` | graded key colour trapped inside a figure | M16 |
| `check-ambient-loaded` | a room asking for an ambient the manifest does not load | M30 |
| `check-american-english` | a British spelling in a spoken line | M31 |
| `check-sprite-sheets` | a frame rect that overruns its sheet | M29 |
| `check-tree-speakers` | a tree that names no speaker | M32 |
| `check-entity-fallback` | a fallback to the protagonist's record | M48b |
| `check-drawer-coverage` | a staged step kind the drawer does not name | M22b |
| `check-key-fringe` | magenta key on visible pixels | M17 |
| `check-gauntlet-script` | script and sequence disagreeing on a beat's control | M23 |
| `check-speech-colours` | two speakers given the same colour | M24 |
| `check-exit-collisions` | a target fully covered by one that answers earlier | M34b |
| `check-rig-describes-frames` | a rig whose figure height its frames contradict | M35 |
| `check-camera-space` | a hit test handed a window point instead of a room point | M52 |
| `check-bands-tile` | a band leaving a gap in its region | M49b |

## 4 · CURRENT + UNPROVEN

Nothing was left unproven for want of trying; these are the ones where a
mutation would have had to fabricate a subject that does not exist.

| Check | Assertion | Why no witness |
|---|---|---|
| `check-boot-assets` | no texture key names two different files | Every key in the game is derived from a unique path; producing a collision means editing `planBoot`, which tests the mutation rather than the check |
| `check-actor-clips` | an overlay's `rectFor` naming a body clip its owner lacks | Two attempts to shape the mutation were rejected by the schema before the check ran, which is a valid refusal one layer earlier and not a witness |
| `check-map` | a facade Main Street already opens onto | Needs a second map room to conflict with |

## 5 · CHECK DISPOSITIONS

| Check | Disposition |
|---|---|
| `check-cycling-lands` | **FIX** — done: scans the declared bounds |
| `check-residual-key` | **FIX** — done: an unreadable file fails |
| `check-no-sheets-in-plates` | **REMOVE FROM ACCEPTANCE GATE / RETAIN AS DIAGNOSTIC** — done |
| `check-variant-one` | **RETAIN AS DIAGNOSTIC** — done, renamed |
| `audit-look-figures` | **RETAIN AS DIAGNOSTIC** — done, renamed |
| `check-palette` | **SPLIT / RENAME** — done. Roles and ranges are acceptance; locked/256/6-bit are the retired half, recorded at the check |
| `check-palette-cycling` | **RETAIN AS DIAGNOSTIC** — done, renamed |
| `check-item-names` | **KEEP**, with the 320px measure flagged against Q16 |
| `check-puzzle-graph` | **KEEP** — inert by design and says so |
| `check-no-content-in-code` | **FIX** — done: Q11's lazy `Error(...)` match replaced by a scanner |
| every other check | **KEEP** |

**`npm run validate` now ends "All 43 checks passed, and 5 diagnostics were
reported."** The count went down and the sentence got truer.

---

# PART TWO — THE MUTATION RECORD

Run in a detached worktree at `4b45d23`, with `node_modules` symlinked from the
primary checkout so a module-not-found could not be mistaken for a detection.
**The worktree was destroyed and the primary checkout verified clean.**

A mutation counts as a negative witness only when the validator executed, the
mutated assertion was reached, and it failed for the deliberate defect. Every
row below was preceded by a baseline run that PASSED, so a check that was
already red could not be read as catching anything.

| # | Mutation | Executed | Reached | Expected | Actual | Setup failure | Valid witness |
|---|---|---|---|---|---|---|---|
| M1 | `palette.locked := false` | yes | yes | FAIL | FAIL "palette is not marked locked" | no | **yes** |
| M2 | palette has 255 entries | yes | yes | FAIL | FAIL, named | no | **yes** |
| M3 | UI role `ink` removed | yes | yes | FAIL | FAIL, named | no | **yes** |
| M4 | colour off the 6-bit grid | yes | yes | FAIL | FAIL "3 channel values" | no | **yes** |
| M5 | `hobs_lamp` un-dormanted | yes | yes | FAIL | FAIL, named | no | **yes** |
| M6 | `puddles` bounds → 1×1 corner | yes | yes | FAIL | **PASS** | no | **yes — vacuity** |
| M7 | `puddles` bounds → off the plate | yes | yes | FAIL | **PASS** | no | **yes — vacuity** |
| M8 | cycling rate 9 Hz | yes | yes | FAIL | FAIL, named | no | **yes** |
| M9 | band runs outside its family | yes | yes | FAIL | FAIL, named | no | **yes** |
| M10 | asset path that does not exist | yes | yes | FAIL | FAIL, named | no | **yes** |
| M11 | walkable region with no zone | yes | yes | FAIL | FAIL, named | no | **yes** |
| M12 | arrival point off the floor | yes | yes | FAIL | FAIL, named | no | **yes** |
| M13 | LOOK line duplicated | yes | yes | FAIL | FAIL, both ends named | no | **yes** |
| M14 | exit to an unknown room | yes | yes | FAIL | FAIL, named | no | **yes** |
| M15 | gate on an unwritten flag | yes | yes | FAIL | FAIL, named | no | **yes** |
| M16 | graded key trapped inside a sprite | yes | yes | FAIL | FAIL "2500px" | no | **yes** |
| M17 | magenta fringe on visible pixels | yes | yes | FAIL | FAIL "900 visible pixel(s)" | no | **yes** |
| M18 | truncated sprite PNG | yes | yes | FAIL | **PASS** | no | **yes — vacuity** |
| M19 | generated file hand-edited | yes | yes | FAIL | FAIL, names the generator | no | **yes** |
| M20 | prose literal in an engine `.ts` | yes | yes | FAIL | FAIL, quotes the line | no | **yes** |
| M21b | declared image in neither boot list | yes | yes | FAIL | FAIL, names `planBoot` | no | **yes** |
| M22b | unnamed staging step kind | yes | yes | FAIL | FAIL, names the beat | no | **yes** |
| M23 | script/sequence control mismatch | yes | yes | FAIL | FAIL, names the beat | no | **yes** |
| M24 | two speakers, one colour | yes | yes | FAIL | FAIL "0 apart" | no | **yes** |
| M25 | chore clip the actor lacks | yes | yes | FAIL | FAIL, two beats named | no | **yes** |
| M26 | timed beat under `control: player` | yes | yes | FAIL | FAIL, errata 30a quoted | no | **yes** |
| M27 | extracted content hand-edited | yes | yes | FAIL | FAIL, names the file | no | **yes** |
| M28 | node loses its only `[COMIC]` | yes | yes | FAIL | FAIL, names the node | no | **yes** |
| M29 | sheet rect overruns its sheet | yes | yes | FAIL | FAIL with both sizes | no | **yes** |
| M30 | ambient a room asks for, unloaded | yes | yes | FAIL | FAIL, lists what is loaded | no | **yes** |
| M31 | British spelling in a spoken line | yes | yes | FAIL | FAIL, two words named | no | **yes** |
| M32 | tree with no speaker | yes | yes | FAIL | FAIL, named | no | **yes** |
| M33 | object with no `defaultVerb` | yes | yes | FAIL | FAIL, errata 28b cited | no | **yes** |
| M34b | target covered by an earlier one | yes | yes | FAIL | FAIL, three named | no | **yes** |
| M35 | rig figure vs its frames | yes | yes | FAIL | FAIL "2.000x" | no | **yes** |
| M36 | clip directory with no rig | yes | yes | FAIL | FAIL, named | no | **yes** |
| M37b | beat-11 waypoint growing with depth | yes | yes | FAIL | FAIL, both heights | no | **yes** |
| M38 | two items, one icon | yes | yes | FAIL | FAIL, errata 29 cited | no | **yes** |
| M39 | pair with no written line | yes | yes | FAIL | FAIL, doc 24 rule 4 | no | **yes** |
| M40 | glyph removed, content uses it | yes | yes | FAIL | FAIL, names the codepoint | no | **yes** |
| M41 | map location with no marker | yes | yes | FAIL | FAIL, named | no | **yes** |
| M42 | orphan room | yes | yes | FAIL | FAIL, named | no | **yes** |
| M43 | hotspot with no LOOK line | yes | yes | FAIL | FAIL, named | no | **yes** |
| M44 | figure height its frames cannot hold | yes | yes | FAIL | FAIL "144.7x too SMALL" | no | **yes** |
| M45c | excused partial state un-excused | yes | yes | FAIL | FAIL, names all three clips | no | **yes** |
| M46 | `hash()` in the pixel pipeline | yes | yes | FAIL | FAIL with the line number | no | **yes** |
| M47 | Room 1 module reads the reference | yes | yes | FAIL | FAIL with the pattern | no | **yes** |
| M48b | fallback to the protagonist's record | yes | yes | FAIL | FAIL with the expression | no | **yes** |
| M49b | band leaving a 48px gap | yes | yes | FAIL | FAIL "48px GAP" | no | **yes** |
| M50 | rect leaving the room | yes | yes | FAIL | FAIL, named | no | **yes** |
| M51 | rule added for a fixed verb | yes | yes | FAIL | FAIL, precedence explained | no | **yes** |
| M52 | hit test handed a window point | yes | yes | FAIL | FAIL with the fix | no | **yes** |
| M53 | blatant variant-1 violation | yes | yes | FAIL | **PASS** | no | **yes — diagnostic** |
| M54 | LOOK line naming an undrawn figure | yes | yes | FAIL | **PASS** | no | **yes — diagnostic** |
| M55/M58 | a sheet that IS the plate | yes | yes | FAIL | **PASS** | no | **yes — vacuity** |
| M56 | responses cut to one line | yes | yes | FAIL | FAIL, counted | no | **yes** |
| M57 | walk box unreachable | yes | yes | FAIL | FAIL, three named | no | **yes** |
| M59b | item label too wide | yes | yes | FAIL | FAIL "420px vs 248px" | no | **yes** |
| M61 | puzzle graph missing 44 canonicals | yes | yes | FAIL | FAIL, each named | no | **yes** |

**Not witnesses, and recorded as such:** M21 (the edit did not apply — the
string did not match), M22/M37/M45/M45b/M60/M60b (mutation rejected before the
check ran), M16-first-attempt (a no-op command), M34/M49 (probes, not
mutations), M59 (mutated a field the check does not read). Every one is a
harness failure and none was counted.

---

# PART THREE — THE PRODUCTION COMPONENT DELTA

| Component | State | Disposition | What was done, or what is left |
|---|---|---|---|
| **Room gate** `tools/room-gate.mjs` | Reads doc 05, 49/13, 02's ledger and Part Two-B; marks `!` / `?` / plate; reads the puzzle graph and looks for light | **EXTEND** | Its LIGHT SOURCES section still says "declare `cycling` (doc 18) so the room breathes" — void under errata 54 and replaced by `RoomLamp` (Q13). One string, not done here: it is prose the gate prints, and changing what a gate tells an author is Tyler's call |
| **Room compiler** `tools/compile-room.mjs` | Works; produced Room 2 whole | **EXTEND** | Hard-wired to rooms 2 and 3: `ROOM_FILE = { 2: 'main-street', 3: 'nugget' }` and `reference/room-0${room}/annotation.json` (single digit only). A third room needs both generalised. **It also hard-codes `clipPlane: 12`** — see the delta finding below |
| **Room annotator** `tools/annotate/room.html` | Works; Tyler's fifteen minutes | **EXTEND** | Hard-wired to Room 2: the title, the plate path and the whole `ITEMS` array are literals. Parameterising it is a small job and is the gate on every room after the third |
| **Extraction pipeline** `tools/extract-content.mjs` + `check-extraction` | **REUSE AS IS** | — | 13 files, 0 stale, and the hand-edit witness (M27) fires |
| **`__gauntlet` contract** | Was purely observational | **EXTENDED** | Draw provenance (`from`, `bounds`, `order`, `clipLevel`, `fallback`), room `assets` with `loaded`, `flags`, `inventory`, `camera`, `waitingBeat`, and `optionRow` |
| **Direct `window.__game` reach** | One site: `run.mjs:441` walked `scene.state.dialogue.presentOptions()` then `scene.view.dialogueHitboxes()` | **SUPERSEDED** | Replaced by `optionRow(index)` on the probe. See the ruling below on what became a control and what did not |
| **Route system** `routes/main-street.json` | Authored, complete, **and nothing could execute it** | **MISSING → BUILT** | `tools/gauntlet/route.mjs`. On its first execution the route failed three times, each a real defect in the route — see Part Five |
| **Sequence gauntlet** `tools/gauntlet/run.mjs` | Green, R5h drift comparison, honest coverage line | **REUSE AS IS** | Its own report says **2 of 12 beats assert anything**. That is not a fault in the harness; it is the script being 17% written |
| **Contact sheet** `contact-sheet.mjs` | Hovers every hotspot in whatever room the game hands it — which is always Room 1 | **EXTEND, not replace** | `proof.mjs` is the four-panel proof built beside it and driven by the route system it was waiting for. The hover sheet stays: hovering every hotspot is a different question from proving a room |
| **Runtime snapshot** `Probeable.snapshot()` | Reads the offscreen 2D canvas — the only headless capture in this project that is not black | **REUSE AS IS** | It is what makes the whole proof possible |
| **Room/content manifest** `content/manifest.json` | Explicit, checked, no directory discovery | **REUSE AS IS** | Still names `font: art/ui/font-5x7.json` and `palette: consolation-256.json`, both void under errata 54 and both still loaded. Q19 |
| **Character pipeline** doc 38 + `tools/rig/character.py` | Doc 41: "do not modify anything under `tools/rig/` or `reference/`" | **REUSE AS IS** | Untouched |
| **Grading tools** `tools/grade/*.py` | Four scripts, used at cut time | **REUSE AS IS** | Untouched |
| **Generated-file protection** `check-generated` + `tools/lib/generators.mjs` | 3 registered generators, 4 named non-generators | **REUSE AS IS** | The witness fires (M19) |
| **Test suite** `tests/*.test.ts` | 157 tests | **REUSE AS IS** | — |
| **Build/check command** `npm run check` | typecheck → validate → test | **EXTEND** | `proof` is a separate command and deliberately not in `check`: it needs a browser and two full play-throughs, which is the same reasoning that keeps the gauntlet out |
| **Art API adapter** | — | **MISSING → BUILT** | `tools/art/openai-image.mjs` |
| **Staging + provenance** | — | **MISSING → BUILT** | `tools/art/staging.mjs`, with attempt and spend caps |
| **Objective art gates** | — | **MISSING → BUILT** | `tools/art/gates.mjs` (gates 1–6) and `proof.mjs` (gates 7, 8A–8E) |
| **Operational ledger** | — | **MISSING → BUILT** | `content/build-ledger.json`. No creative content — ids, source pointers, dependencies, status, hashes |

---

# PART FOUR — WHAT BECAME A CONTROL, AND WHAT DID NOT

The `__gauntlet` handle was observational. Four controls were added and each
one is named individually rather than exposed as a setter.

| Reach | Ruling |
|---|---|
| `scene.state.dialogue.presentOptions()` + `view.dialogueHitboxes()` | **Became part of the stable observational probe** as `optionRow(index)`. Where a row is drawn is a legitimate observational question asked through four private hops |
| Drawing the room without its cast | **Became a control**, `cast(on)`. Render-only: nothing is removed from the game, so a mover PAINTED INTO the plate stays when the real ones go. It is the only frame in which doc 35's baked dog is visible |
| Placing the protagonist at a point | **Became a control**, `stand(x, y)`, refusing any point off the walk boxes. A depth reading taken where no box reaches is the curve answering about ground it was never fitted to |
| Writing a flag | **Became a control**, `flags(values)`, accepting only ids `content/flags/flags.json` declares. An undeclared id cannot put the game into a state a player could reach |
| Entering a room | **Became a control**, `enter(roomId)`. The `?room=` warp already does this in the shipped build (Q12, which must be gated before release) |
| Moving a mover other than the protagonist | **REMAINS UNAVAILABLE.** Movers are driven by sequences and carried beats; a control that moved one would produce a frame no runner could have produced |
| Setting object state, inventory, or dialogue position directly | **REMAINS UNAVAILABLE.** Errata 48 fixes the order of a successful action — object state, flags, inventory — and a control that wrote one of them alone would build states the verb system cannot reach |
| Calling into the scene generally | **REMAINS UNAVAILABLE**, and this is the one worth restating: a proof that can put the game into a state the game cannot reach is a proof about a state nobody will ever see |

**Every control writes to a log** that the proof manifest carries, so a panel
reached by playing and a panel reached by injection are distinguishable
afterwards — they are both legitimate evidence and they are not the same
evidence.

---

# PART FIVE — WHAT THE NEW INFRASTRUCTURE FOUND ON ITS FIRST RUNS

Recorded because each is a defect that every validator passed.

**1 · `main_street` declares two occlusion planes and no walk box can reach
either.** Planes are `level: 1` and `level: 2`; every walk box says
`clipPlane: 12`, hard-coded in `compile-room.mjs`. `Renderer.masked()` looks a
plane up by level and draws straight through when it finds none — so the
lumber stack and the water trough occlude nobody, and two mask PNGs load,
occupy memory and are used by nothing. The room's own note explains at length
why no box is `clipPlane: 0`, which is a correct answer to a different
question. **Not fixed here:** which band is plane 1 and which is plane 2 is a
placement judgement, and the plane notes propose an answer that Tyler should
rule on.

**2 · `stage_road/puddles` cycles one pixel of sky.** Errata 54 voids Room 1's
`hobs_lamp` AND `puddles` by name; only the first was marked. Its declared
bounds are `[0,96,320,48]` — 320×144 coordinates the ×6 migration never
reached. **Fixed:** marked dormant, and `dormant` is now honoured by the engine
as well as by the validator.

**3 · The route to Main Street had never been run and was wrong in three
ways.** It waited on `control: player`, which fires *during* the driver's tree
because that tree is itself a player segment; it never spoke to Hob, whose beat
9 holds on `T_HOB_SPOKEN` (Q63, ruled after the route was written); and it
therefore waited on `T_HOB_GONE`, which beat 10 could never write. R5l exactly:
a fully specified thing with no reader, wrong within one run of the reader.

**4 · A held beat was reported as a playing beat.** `CarriedBeats.current`
returned beat 9 while it was armed and waiting on its flag, so a correct wait —
Hob standing at the roadside until addressed — was indistinguishable from a
hang. Doc 44 defines the reported beat as "the beat of the last step
dispatched"; a held beat has dispatched none. **Fixed**, with `waitingBeat`
beside it so the two facts are separable.

**5 · Q11 closed.** `check-no-content-in-code`'s `Error\(([\s\S]*?)\)` matched
lazily and its dangling backtick made ordinary new template literals read as
prose. Replaced by a scanner. On the way, the import-JSON assertion had to move
to a source view that still contains literals — written the other way it would
have passed on every file forever.

---

# PART SIX — GATE CALIBRATION AGAINST APPROVED ART

Run before the gates were trusted, against art Tyler has already accepted.
**Two of the new gates were wrong and the art was right.**

| Gate | Result on approved art | Verdict |
|---|---|---|
| DIMENSIONS / ALPHA | Rejected **every sprite in the repository** as "no alpha channel at all" | **CHECKER WRONG.** `readPng` normalises everything to RGBA and threw away whether the SOURCE had alpha. It now returns `hasAlpha` |
| CLIPPING | Rejected Thad, Hob and every rigged frame for touching row 0 | **CHECKER WRONG.** `check-rig-describes-frames` clause one *requires* the figure to start at row 0. The top-edge rule was removed; left, right and bottom stay |
| KEY / EDGE | Passed every approved sprite; worst magenta 0 of 30 | Correct |
| PLATE CONTENT | Derives from the room gate; asserts nothing on pixels | Correct by design — panel A is the proof |
| Plates, 4 of 11 | PASS | Correct |
| Plates, 7 of 11 | FAIL "UNREADABLE: colour type 3" | **CORRECT, AND A TRUE REPORT ABOUT THE ART.** Those seven are indexed 320×144 — errata 54's voided presentation, doc 36 Q17 |
| 8A SCALE, live | Room 1 far: expected 224, runtime 224, silhouette 224. Near: expected 263, runtime 263, silhouette 263 | Correct, and the strongest calibration result in the run |
| 8B FEET, live | far: soles at y700 against an authoritative y701. near: y861 against y862 | Correct, 1px |

**No approved asset was altered to make a checker green.** The record is
`proofs/calibration/gate-calibration.md`.

---

# PART SEVEN — WHAT STILL BLOCKS ONE AUTONOMOUS ROOM PILOT

**Blocking, in order:**

1. **`OPENAI_API_KEY` is not present in this environment.** The adapter reads
   it from the environment and nowhere else, refuses with instructions when it
   is absent, and has therefore never made a live call. Everything downstream
   of generation — staging, provenance, caps, gates 1–6 — is exercised against
   files already in the tree, and the API path itself is unproven.

2. **The annotator is hard-wired to Room 2.** Doc 46 part four step 4 is
   "Tyler, in the annotator, ~15 minutes", and for any room but the second
   there is no annotator to be in. Every rect, the walk box, the depth samples
   and the arrival point come from it.

3. **The compiler is hard-wired to rooms 2 and 3**, in two places, and emits
   `clipPlane: 12` — a value no room's planes declare.

4. **No font.** Errata 54 voided the 5×7 and forbids choosing a replacement
   without a ruling; the manifest still loads it and `check-item-names`
   measures against a 320px sentence line. Q16.

**Not blocking, and worth saying so:**

- `npm run gauntlet` asserting 2 of 12 beats is thin, and it is thin about the
  OPENING, not about a room. A room pilot does not depend on it.
- Room 2's occlusion being inert (Part Five item 1) is a defect in a built
  room, not a gate on building another.

---

# PART EIGHT — THE PROPOSED PILOT

**Room 5, the assay office front.**

Its case, against the current canonical build order:

- **Doc 46 part five step 6 names it in principle**: "Room 3 is the first to
  run [the factory] end to end, and is therefore the factory's acceptance
  test." Room 3 is built. Room 5 is the next room after it with its writing
  finished — doc 25 covers rooms 5–7 and doc 05 has its full examine section.
- **Doc 20 makes it reachable from Main Street**, which is built and routable,
  so a route to it is an extension of an existing route rather than a new one.
- **Its plate is one of the seven still 320×144 indexed** (Q17), so the pilot
  exercises the generation path rather than dressing up an existing asset.
- **Errata 52's stop condition does not gate it**: it is not a global ruling.
- **Doc 35's gate has not been run for it.** That is step 1 of doc 46 part
  four and it is the first thing the pilot should do.

**It is a proposal, and the choice is Tyler's.** The alternative worth naming
is doing no new room at all until Room 2's occlusion planes are ruled, because
that defect will be reproduced by the compiler into every room it builds.

---

---

# PART NINE — THE STATE THIS AUDIT LEAVES BEHIND

| | |
|---|---|
| `npm run typecheck` | clean |
| `npm run validate` | **All 44 checks passed, and 5 diagnostics were reported** |
| `npm run test` | 157 of 157 |
| `npm run gauntlet` | green — still 2 of 12 beats asserting |
| `npm run proof stage_road` | **PASS**, clean tree, `proofs/stage-road/proof.json` |
| `npm run proof main_street` | **FAIL, 10 findings**, clean tree, `proofs/main-street/proof.json` |
| Mutation worktree | destroyed; `git worktree list` shows one entry |
| Working tree | clean |

**One thing broke and was fixed rather than reverted, and it is worth reading.**
Making the probe honest about a held beat turned the gauntlet red. The harness
had been driving beat 9's input — the click on Hob's lamp — because the probe
reported beat 9 the moment the carrier armed it. **That click writes
`T_HOB_SPOKEN`, which is the flag beat 9 is holding on.** So the harness was
releasing a hold by acting on a beat the game had not started, and it worked
entirely by accident. Reporting the hold correctly deadlocked it. The fix is
`waitingBeat`: a beat waiting for the player is exactly when the player's input
is wanted, which is what that field says and `beat` never did.

**That is the shape of this whole audit in one paragraph.** A green run, a
mechanism agreeing with itself, and the correction visible only once something
independent looked.

---

# PART TEN — THE PILOT BLOCKERS, CLEARED

*Added after Tyler's rulings on Q14 and on proof storage. What follows is what
changed, not a second audit.*

| Blocker | State |
|---|---|
| **Q14** — Main Street's occlusion | **RULED AND FIXED.** The annotation authors a clip plane per band; the compiler carries it unchanged; nothing generic replaced the constant. Three assertions, eight negative witnesses. **And both masks turned out to be stale** — Q20 |
| **Q15** — the compiler and annotator hard-wired | **CLEARED.** Both take a room. Rooms 2 and 3 compile byte-identically except the intended Q14 fields; Room 5 refuses by name for want of an annotation, which is Tyler's fifteen minutes |
| **Q16** — no font | **PREPARED, NOT CHOSEN.** Four OFL faces rendered in the live UI at two sizes, coverage proved from each `cmap`. Doc 51. **Stopped for Tyler** |
| **Q18** — the image API | **READY, AND BLOCKED ON THE ENVIRONMENT.** Everything up to the socket is proven; `api.openai.com` is not in this environment's egress allowlist |
| Proof storage | **IMPLEMENTED.** `renders/proofs/<room>/`, manifest and one WebP sheet tracked, raw frames ignored |

## What Q14 turned into, and it is the finding of the sitting

The clip planes were one repair and the masks are another. **Both of Main
Street's masks describe an earlier, narrower street** — plane 2 draws a
hitching rail the plate does not contain, plane 1 draws an eight-spoked wagon
wheel over open mud, and neither touches the water trough that plane 2's own
note says it contains. Q20 has the measurements.

**The first reading got plane 1 wrong, and how is the useful part.** Rendering
a mask over a background produces a highlighted shape whether or not there is
a shape underneath, so the wheel looked like the plate's. Panel C settled it: a
man standing in the middle of that wheel, drawn whole, with nothing to be
behind.

`check-occlusion`'s geometric overlap test passes both masks — 31% and 12% of
the drawn figure — and says so in its own header. That is the whole limit of
what a machine can say about a mask, and it is doc 44's first honesty arriving
in a place nobody expected it.

---

*Nothing in this document overrides anything. It records.*
