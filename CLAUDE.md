# CLAUDE.md — The Last Claim in Consolation

**Read this at the start of every session. It is binding.**

---

## What this is

A 2D point-and-click comedy adventure game in the tradition of *The Secret of Monkey Island*. Frontier gold rush town, 1850s. Dry, deadpan. Ten-to-twelve hours, 45 puzzles, 42 screens, ~3,850 written lines.

**`docs/00-errata.md` overrides every other document on every point it addresses. Read it first.**

> **STOP — READ ERRATA 54 BEFORE WRITING ANY RENDERING, SCALING, PALETTE, FONT OR BACKGROUND-ANIMATION CODE.**
> The presentation layer was replaced wholesale. Docs 11 and 18 are void, doc 06's presentation section is void, and errata 24's decimation scaler no longer applies. Work built against 320×144 or the locked 256 is wasted work.
>
> New: `docs/38-character-pipeline.md` and `tools/rig/character.py` — how characters are made now.
> `docs/40-actor-clip-inventory.md` — every clip every character needs.
> **`docs/41-claude-code-redirect.md` — read this before resuming work.**
> Open issues, including what errata 54 leaves unspecified: `docs/36-issue-list.md`.
>
> **Doc 34's preserve list is partly void.** It says to preserve decimation, the locked palette and integer scaling. Errata 54 removed all three and is more recent. `engine/core/Decimation.ts` and `engine/core/PaletteCycling.ts` implement voided specs. The design documents were written in sequence and contradict each other in thirteen places; the errata resolves all of them.

The design is complete and lives in `/docs`. **Do not invent content.** Every line of dialogue, every examine line, every bark already exists in those documents. If something is missing, say so and stop — do not fill the gap.

## Who you're working with

Tyler — non-technical PM, working from a Chromebook. He directs strategy and delegates implementation. He needs paste-ready steps and explicit decision points surfaced *before* work begins, not open-ended authoring. Verify before any irreversible action. Tell him before you deviate from the spec.

## Unrelated repos

There is another project, `wtlangdon-design/anchorage`. It is a completely different game with contradictory conventions. **Never read from it, write to it, or import its patterns.**

---

## Stack

- **Phaser 3 + TypeScript + Vite.** Not ThreeJS. Not a 3D engine.
- **Window 1920×1080, play area 1920×864, verb panel 216px.** Errata 54 — supersedes the former 320×200 / 320×144 / 56px spec entirely.
- `pixelArt: true`, `roundPixels: true`, `antialias: false`. Integer upscale, nearest-neighbour. **Never smooth or anti-alias anything.**
- **Full RGB. There is no locked palette.** `art/palette/consolation-256.json` is reference only. Character sprites **~233px** at mid-depth, scaled per room by depth. Errata 54.
- Must run at 60fps in Chrome on a Chromebook.

## The one architecture rule

> **No content lives in code. All content lives in JSON.**

The engine reads JSON and knows nothing about Consolation. There are ~3,850 written lines and each will be edited many times. If changing a line of dialogue requires touching a `.ts` file, the project has failed.

Enforce with a CI check: no content strings in any `.ts` file.

## Composing a room — graybox is a gate

Errata ruling 22, in full. Every room, in this order:

**grayscale value block → walkable band and exits → object silhouettes → character placement and reach → occlusion test → LEGIBILITY GATE → lighting → texture → ambient animation.**

Steps 1–6 are graybox. **Nothing proceeds past the legibility gate until it passes, and a room that fails there is re-blocked, not re-lit.**

Three rooms have already shipped or nearly shipped broken by ignoring this. Thirty-nine remain.

## Content is extracted from the docs, never retyped

Every written line in `/content` is **parsed out of `/docs`**, not transcribed. The documents are the source of truth and the pipeline reads them.

Transcribing by hand is how a comma goes missing from a joke — and the failure is silent, because the line still exists, still passes every check, and is simply slightly worse than what was written. Across ~9,800 lines that is not a risk worth taking once.

A line that needs changing is changed in `/docs` and re-extracted. Never edited in `/content`.

## Typography

**The 5×7 font is void under errata 54** — it was sized for 320×200 and is unusable at 1920×1080. No replacement is specified yet; do not pick one without a ruling.

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

8. **Room 33's lamp stops cycling during F2.** Its rate ramps to zero across the same ninety seconds as the audio detune. By the time the score resolves, the only moving thing in the frame has stopped. Nothing announces this. It is not a stalled animation.

9. **Cycling never conveys information.** No background element cycles because it is important, and nothing stops cycling because a puzzle state changed. A player must never learn to read motion as a hint. The single exception is item 8, which is an ending, not a hint.

10. **Nothing in the letters-home system is ever tracked or referenced.** Resist every instinct to pay it off. The absence of payoff is the payoff.

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
| `docs/13-17` | Room content, opening sequence, road to done |
| `docs/18-palette-cycling.md` | **VOID — errata 54.** Palette cycling requires an index palette. All room `cycling` declarations are dead data |
| `docs/19-19b-resolutions.md` | Resolutions for the 21 unrendered-figure hotspots |
| `docs/20-room-map.md` | Room connectivity and the town map screen |
| `docs/21-dossier-audit.md` | Audit against the Monkey Island design dossier |

---

## Renders

**Every render goes to `renders/` on `main`, and gets pushed.** Room
composites, character sheets, scale checks, inspection crops — all of it.

- Descriptive filenames. `room-05-assay-office-with-thad@4x.png`, not `r5b.png`.
- **Overwrite in place. Never version in the filename.** Git is the
  versioning system; a second one in the filenames would only disagree with it.
- One command regenerates everything: `npm run renders`. **It no longer
  regenerates *everything*, and it exits non-zero on purpose.** Three composers
  now refuse to write outputs that errata 53 and 54 took away from them, and
  say so by name. Read the refusals; do not delete the modules from
  `tools/render-all.mjs`. A module removed from a list is invisible to the next
  person, which is the whole reason the refusal exists. Details in
  `docs/36-issue-list.md` Q20; the list itself is `tools/pixelart/superseded.py`.
- Push after each pass, so what is on `main` is what was last looked at.

**Two things `npm run renders` would have destroyed, and this is why the
refusals are there.** `room01_stage_road.py` writes
`art/backgrounds/room-01-stage-road.png` — the path Room 1's **approved
generated plate** now occupies — and `actor_export.py` rewrites
`content/actors/thad.json` wholesale from measurements taken on the composed
320×144 sheet, silently reverting errata 54's ×6 migration and re-deriving a
threshold from decimation, which errata 54 voids. Following the instruction as
it was written undid committed work in both cases.

`art/backgrounds/*.png` are **not** renders — they are shipping assets the
engine loads and room JSON references by path. They live apart and keep
their own names.

**AND RAW ROOM-PROOF CAPTURES ARE NOT RENDERS EITHER.** Tyler's ruling, and it
is the one exemption from the rule above.

`tools/gauntlet/proof.mjs` takes five or six full 1920×1080 frames per room.
They are **test artifacts**, not canonical authored renders: nobody composed
them, nobody chooses them, and one command reproduces them in minutes. A frame
is ~2.9MB, so forty rooms is roughly 700MB of blobs git deltas badly against a
repository that is 279MB today.

| Under `renders/proofs/<room>/` | |
|---|---|
| `proof.json` | **tracked.** Every capture's sha256, the commit, the branch, the state, the flags, the inventory, the actor measurements, the assets and their hashes, the route, and whether a stub or fallback was used |
| `contact-sheet.webp` | **tracked.** One compact sheet showing every panel as a COMPLETE frame at half scale — downscaled, never cropped |
| `index.html` | **tracked.** The page a person reads |
| `raw-captures-ignored/` | **ignored.** The full-resolution frames |

**A hash the next capture can be compared against proves more than a stored
copy does**, which is why the manifest is the part that is kept.

**Nothing else about the render policy changes.** Shipping art stays tracked.
Authored renders under `renders/` stay tracked and pushed, and what is on
`main` is still what was last looked at.

## Current phase

**Phase 1 — engine skeleton.** Verb panel, flag store, room loader, dialogue runner, save/load, validation tooling. No content.

Do not build Acts I–IV. Do not build the puzzle graph. Stop when Phase 1 acceptance passes and wait.
