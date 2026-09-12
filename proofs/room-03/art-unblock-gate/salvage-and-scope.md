# ROOM 3 — ZERO-GENERATION SALVAGE AND SCOPE GATE

**Zero image operations this pass.** Ledger unchanged at **49/51**.
`nugget-card-ensemble` 0/1 and `nugget-bar-units` 0/1 remain unspent.

---

## PART 1 · SALVAGE — half succeeded, and the half that failed cannot be fixed with evidence that exists

### The abandoned hand: RESTORED EXACTLY

It is canon, it is small, and the accepted composition holds it cleanly. Copied straight back.

```
abandoned hand vs accepted:  mean 0.01   max 1      (was 52.01 / 165)
```

That is byte-identical to rounding. Defect B is solved, deterministically, with no generation.

### The near rim: NOT REPAIRABLE

The method was an exact copy, not a reconstruction: wherever the ACCEPTED art shows clean table —
no man, no chair — those pixels are canon and can simply be put back.

**The trouble is where that is true.** The near rim is detectable as a bright-to-dark step only
from **x 844 to x 986**. Outside that the edge strength collapses (from 6–22 down to 2–4) because
card_1's and card_4's bodies are standing on it.

**The region where operation 49 went wrong is the region where the accepted art has no rim to
copy.** The men are sitting on exactly the evidence the repair needs. Copying what there is
leaves a step at each boundary:

```
left  copy edge x844:  rim 398 -> 412    step 14px
right copy edge x986:  rim 398 -> 436    step 38px
```

and the copy's own horizontal boundary at y 406 doubles the rim across the tabletop. Both are
plainly visible at 1:1 plate scale (`salvage-sheet.webp`, panels 4 and 6), so the §4 gate
— *"no obvious deterministic-repair seam exists at 1:1 gameplay source scale"* — **fails**.

Closing the step would need a warp fitted to the canonical rim, and the canonical rim is the
thing that cannot be observed. A fit to the visible arc is not available either: the strongest
edge between x 858 and x 896 is the **abandoned hand's own card edge** (strength 21.9 against the
rim's 7–10), so the samples there are contaminated.

**CLEAN-CARD ROUTE: BLOCKED**, for the same reason as the original stop and not a new one.

---

## PART 2 · SCOPE AUDIT — does anything actually require runtime separation?

### The one hard engine requirement

`Interactable` (`engine/core/types.ts:121`) carries `responses`, `overrides`, `fallback`,
`states`, `walkTo` — **and no `tree` field.** A dialogue tree is opened only from
`AmbientFile.tree` (`GameScene.ts:886`) or from an evidence pair, which also needs `person.tree`.

> **A character with a micro-tree MUST be an `AmbientFile`. A hotspot cannot carry dialogue.**

### The requirement that does NOT follow

**An `AmbientFile` is an interaction identity, not a promise of separated art.** Everything the
engine needs from one is data:

| What the engine needs | Where it comes from | Needs art? |
|---|---|---|
| tree opens on TALK TO | `npc.tree` | no |
| speech balloon over his head | `speakerHead`: `x`, `y − heightForZone(zone)` | no |
| reputation barks on approach | `barks`, `approachRadius` | no |
| where Thad stands to talk | `walkTo` | no |
| TALK TO hit box | `npcAt`: `0.2 × frames[0][3]` each side of `x` | **the frame's dimensions only** |

The last row is the only one that touches a sprite, and it reads the frame's **height**, not its
content. So a **fully transparent sprite at the painted man's dimensions** gives a correct,
man-sized click target and draws nothing — the baked painting remains the visible art.
`drawTinted` composites onto a cleared scratch, so transparent pixels stay transparent.

One caveat worth stating: an AmbientFile with **no** `sprite` at all draws a graybox outline
(`Renderer.ts:1032`) — that path is deliberately loud, for content gaps. The transparent frame is
the declaration that this character is painted on purpose.

*(A cleaner variant is a small engine change — let an ambient declare `painted: true` and skip the
graybox. It is engine plumbing, not content, but the transparent frame needs no code at all.)*

### Nothing canonical requires more

- No puzzle, flag, item or combination references any Nugget patron. `docs/02-puzzle-graph.md`
  and `docs/04-dialogue-trees.md` never mention the Card Sharp, the One-Strike Man or the Fiddler.
  They are `docs/07-ambient-layer.md` characters: a micro-tree and a bark table each, no puzzle role.
- Of the seven painted patrons, canon names exactly **two**: the Card Sharp (§17) and the
  One-Strike Man (§13). The other five need nothing beyond the existing `patrons` group hotspot,
  which already carries their LOOK and LISTEN copy and a TALK TO override.

| | needs AmbientFile | needs separated art |
|---|---|---|
| Card Sharp (= card_2) | **yes** | **no** |
| One-Strike Man (= bar_1) | **yes** | **no** |
| card_1, card_3, card_4, bar_2, bar_3 | no | no |

---

## PART 3 · RECOMMENDATION — **OPTION A**

**Keep all seven baked. Give the two speaking characters an interaction identity over the static
art. Spend nothing.**

- **Additional image operations: 0.** Operations 50 and 51 stay unspent.
- Consistent with the prior owner ruling that furniture-dependent patrons may remain static staging.
- No architectural churn: no plate rebuild, no extraction, no ensemble, no `floor_5` notch,
  no occlusion changes, no scaling changes.

**The one structural cost, stated honestly.** `tests/phase2a-access.test.ts` asserts
`actors === room.ambient` exactly, where `actors` are the population entries with `kind: "actor"`
and seven are `kind: "baked"`. Adding two ambients means the population record needs a way to say
*painted into the plate AND carrying a runtime interaction identity* — a third state, not a
reclassification (they are still paint). That is a small schema and test change, and it is the
only churn Option A carries.

**Phase 2B room life under Option A** — unchanged and still substantial: the stove man and the
landing man are already independent actors; the stove's firebox and the room's lamps animate
through `RoomLamp` (`rate`, `phase`, `whenObject`, `movers`); Deke arrives in Act II as a mover;
and **the Fiddler remains fully available** — he has never been painted into any plate, so he is a
clean new sprite over existing pixels with no extraction problem at all. What Option A gives up is
idle motion for seven seated/standing patrons, which is what the prior ruling already accepted.

Option B is not available while the clean-card route is blocked. Option C is not justified by
anything in canon.

---

## PART 4 · DIALOGUE UNDER OPTION A — not implemented, planned

Both trees are complete in `docs/07-ambient-layer.md` and **no line is invented**. The pattern is
the three existing ambient trees, each noted *"Doc 07 #N micro-tree, verbatim."*

**THE CARD SHARP** — doc 07 §17, `= card_2` (grey hair, side-whiskers, faces the room).
Tree: three options, of which *"Deal me in." → "No. I like you."* is the `[COMIC]` one. Eight
reputation barks, `R_NOBODY` through `R_WON_DUEL`. Implementation: `content/dialogue/amb-card-sharp.json`
with `speaker: "card_sharp"`; `content/ambient/nugget-card-sharp.json` at his seat with a
transparent frame at his painted dimensions, `zone` chosen so the balloon clears his head
(zone 0 = 263 puts `headY` at 293 against his head top of 250), `walkTo` on the floor in front of
the table, `approachRadius` sized to reach it.

**THE ONE-STRIKE MAN** — doc 07 §13, `= bar_1` (the old bearded miner on the far stool, tin cup —
the man the document describes). Tree: three options, `[COMIC]` is *"And since?"*. Nine barks,
the strike shrinking from a fist to a walnut and never noticed. Same construction at his stool.

Neither needs the other, neither needs art, and both are authorized for verbatim implementation.

---

## Reproducing

```
python3 tools/retrofit/nugget-card-clean-repair.py    # the repair, its measurements, the sheet
python3 tools/retrofit/nugget-op49-gate-proof.py      # the original gate
```

`repaired.png` is regenerated by the first and is not tracked.
