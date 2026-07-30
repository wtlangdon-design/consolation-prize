# CLAUDE.md — Consolation Prize

**Read this at the start of every session. It is binding.**

---

## What this is

A 2D point-and-click comedy adventure game in the tradition of *The Secret of Monkey Island*. Frontier gold rush town, 1850s. Dry, deadpan. Ten-to-twelve hours, 45 puzzles, 42 screens, ~3,850 written lines.

**`docs/00-errata.md` overrides every other document on every point it addresses. Read it first.** The design documents were written in sequence and contradict each other in thirteen places; the errata resolves all of them.

The design is complete and lives in `/docs`. **Do not invent content.** Every line of dialogue, every examine line, every bark already exists in those documents. If something is missing, say so and stop — do not fill the gap.

## Who you're working with

Tyler — non-technical PM, working from a Chromebook. He directs strategy and delegates implementation. He needs paste-ready steps and explicit decision points surfaced *before* work begins, not open-ended authoring. Verify before any irreversible action. Tell him before you deviate from the spec.

## Unrelated repos

There is another project, `wtlangdon-design/anchorage`. It is a completely different game with contradictory conventions. **Never read from it, write to it, or import its patterns.**

---

## Stack

- **Phaser 3 + TypeScript + Vite.** Not ThreeJS. Not a 3D engine.
- Native **320×200**, play area 320×144, verb panel occupying the bottom 56px natively.
- `pixelArt: true`, `roundPixels: true`, `antialias: false`. Integer upscale, nearest-neighbour. **Never smooth or anti-alias anything.**
- 256-colour locked palette, VGA-style. Character sprites ~40px tall.
- Must run at 60fps in Chrome on a Chromebook.

## The one architecture rule

> **No content lives in code. All content lives in JSON.**

The engine reads JSON and knows nothing about Consolation. There are ~3,850 written lines and each will be edited many times. If changing a line of dialogue requires touching a `.ts` file, the project has failed.

Enforce with a CI check: no content strings in any `.ts` file.

## Typography

Text renders through a hand-authored 1-bit 5×7 font. Rasterised system fonts anti-alias at 320×200 and are forbidden.

**The design documents were written in prose typography** — curly quotes, em dashes, en dashes, ellipsis characters. The glyph set must cover, at minimum: `' ' " " — – …`

Extend the font to cover them rather than normalising the writing to ASCII. Straight-quoting a comedy script flattens it, and Thad's voice depends on the dashes. Anything outside the covered set gets normalised at the content-authoring step, and the glyph-coverage check stays as the backstop.

---

## DESIGN INVARIANTS — these look like bugs and are not

**This is the most important section in this file.** Every item below will read as a defect, an oversight, or dead code to a competent engineer. All of them are deliberate. Do not fix, optimise, flag, or improve any of them.

1. **~40% of dialogue options do nothing.** They are tagged `[COMIC]`. No state change, no information, no progress. They exist because they are funny and they are the product. Any optimisation pass will identify them as dead code. They stay.

2. **Room 32 (inside the coffin) has no verb panel and no hotspots.** The interface is removed for approximately three minutes. This is the emotional centre of the game. It is not a rendering failure.

3. **Three LISTEN TO lines are load-bearing and must not be marked in any way.** No sting, no highlight, no colour change, no hint. They must be indistinguishable from the other ~520. If a player can tell which lines matter, the design collapses.

4. **There is no hint system and will never be one.** The no-dead-ends guarantee is the accessibility feature.

5. **The score is detuned by −35 cents for the entire game.** This is not an audio bug. In Act IV it animates to 0 over ninety seconds. That single parameter is the emotional arc of the game.

6. **The player cannot die and cannot make the game unwinnable.** Ever. Verify by automated graph traversal, not by inspection.

7. **`HOB_C1` option 4 is tagged `[COMIC]` and silently sets a critical flag.** It must not be marked as progress in the data. The player must not be able to tell.

8. **Nothing in the letters-home system is ever tracked or referenced.** Resist every instinct to pay it off. The absence of payoff is the payoff.

---

## Prohibitions

- **Never fan out subagents on content.** Parallelised comedy produces tonal mush. One voice writes Thad. Subagents are acceptable for engine plumbing, tooling, art batching, and validation — never for dialogue, examine lines, or barks.
- **Never generate written content.** It all exists. Missing line → stop and report.
- **Never `/loop` on quality.** Loop on validation scripts, which have exit conditions. "Until it's perfect" has none.
- **Never add features not in the design documents.** If something seems missing, say so and stop.

---

## Validation, not judgement

Acceptance criteria are scripts a person can check in under a minute, not adjectives:

- Every hotspot has a distinct LOOK line and a distinct LISTEN line; no duplicates game-wide
- Every dialogue node has ≥3 options and ≥1 `[COMIC]` option
- No flag is read before it can be written
- All 45 puzzles reachable from a fresh save (automated traversal — canonical list in the errata)
- Win state reachable from every reachable state
- Save/load restores exact state including partial dialogue trees
- 60fps on a Chromebook

---

## Documents

| File | Contains |
|---|---|
| `docs/00-errata.md` | **Overrides all others. Read first.** |
| `docs/01-bible-v2.md` | Story, characters, stakes, verbs, rooms, music, the opening |
| `docs/02-puzzle-graph.md` | 45 puzzles, item ledger, dead-end audit |
| `docs/03-liars-assay.md` | 24 boast/counter pairs, 3 duels + 2 sparrings |
| `docs/04-dialogue-trees.md` | 8 character trees, ~40 flags |
| `docs/05-examine-layer.md` | LOOK/LISTEN doctrine, 12 rooms |
| `docs/06-technical-spec.md` | Ambient layer, engine, audio, build brief |
| `docs/07-ambient-layer.md` | 18 characters, 162 reputation barks |
| `docs/08-examine-batch-1.md` | Examine rooms, batch one |
| `docs/09-examine-batch-2.md` | Examine rooms, batch two |
| `docs/10-examine-batch-3.md` | Examine rooms, batch three |
| `docs/11-art-revision-pixel.md` | Pixel-art direction — supersedes art in 01 and 06 |
| `docs/12-art-prompts.md` | Source-generation art prompts — superseded as final spec by 11 |

---

## Renders

**Every render goes to `renders/` on `main`, and gets pushed.** Room
composites, character sheets, scale checks, inspection crops — all of it.

- Descriptive filenames. `room-05-assay-office-with-thad@4x.png`, not `r5b.png`.
- **Overwrite in place. Never version in the filename.** Git is the
  versioning system; a second one in the filenames would only disagree with it.
- One command regenerates everything: `npm run renders`.
- Push after each pass, so what is on `main` is what was last looked at.

`art/backgrounds/*.png` are **not** renders — they are shipping assets the
engine loads and room JSON references by path. They live apart and keep
their own names.

## Current phase

**Phase 1 — engine skeleton.** Verb panel, flag store, room loader, dialogue runner, save/load, validation tooling. No content.

Do not build Acts I–IV. Do not build the puzzle graph. Stop when Phase 1 acceptance passes and wait.
