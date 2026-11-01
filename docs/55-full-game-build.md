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
| 4 | 2026-11-01 | #78 (stopped), #84, #88 | 4 of 4 (master, plate, Sowerby, Sowerby redrawn whole) | The Liar's Assay engine and Duels One and Two; judges and Sowerby new, Deke re-cut. `?room=nugget_back`; `?fixture=r4-a` convenes the Assay. Awaiting playthrough (doc 36 Q148, errata 76) |
