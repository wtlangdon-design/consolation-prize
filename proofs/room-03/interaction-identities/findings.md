# ROOM 3 — INTERACTION IDENTITIES OVER PAINTED CHARACTERS

**Owner architecture ruling, Option A** (Tyler, 2026-09-12). The seven furniture-dependent Nugget
patrons stay painted into the plate. Only the two canonical speaking characters gain a runtime
identity, and neither gains a pixel.

**Zero image operations.** Ledger 49/51 → **49/49**: operations 50 and 51 withdrawn unspent.

---

## 1 · The one hard engine requirement, and the one that does not follow

`Interactable` (`engine/core/types.ts:121`) carries `responses`, `overrides`, `fallback`,
`states`, `walkTo` — **and no `tree` field**. A dialogue tree is opened only from
`AmbientFile.tree` (`GameScene.ts:886`). So:

> **A character with a micro-tree must be an `AmbientFile`. A hotspot cannot carry dialogue.**

What does *not* follow is that he needs separated art. Everything else the engine wants from an
ambient is data, and the single thing that touches a sprite reads the frame's **height**, never
its content:

```js
// engine/core/Ambient.ts, npcAt
const height = npc.sprite?.frames?.[0]?.[3] ?? this.state.heightForZone(npc.zone);
const half = height * NPC_HALF_WIDTH;        // 0.2
```

So a **frame of pure alpha-0 at the painted man's own dimensions** gives a person-sized TALK TO
target and draws nothing. `drawTinted` composites onto a cleared scratch, so transparent pixels
stay transparent.

An ambient with **no** `sprite` draws the graybox outline (`Renderer.ts:1032`) — deliberately
loud, because that is what a content gap should look like. The transparent frame is the
declaration that this man is painted *on purpose*.

## 2 · Registration

`x` is the frame's horizontal centre and `y` is its **last row** (`Renderer.drawAmbient`), which
is why these numbers are not feet.

| | painted box | head top | anchor | zone | frame | TALK TO hit box |
|---|---|---|---|---|---|---|
| Card Sharp (`card_2`) | x 800–910, y 250–430 | 250 | (855, 513) | 0 → 263 | 110×263 | x 803–907, y 250–513 |
| One-Strike Man (`bar_1`) | x 1195–1350, y 262–605 | 262 | (1272, 525) | 0 → 263 | 155×263 | x 1220–1324, y 262–525 |

`513 − 263 = 250` and `525 − 263 = 262`: `speakerHead` lands exactly on each painted head top.

**Honest limits.** The Card Sharp's box overlaps `card_1`'s declared box between x 803–880 —
four men at one small table, and the half-width is `0.2 × frame height` in engine code, so it
cannot be tuned away. A hotspot wins over an ambient for every verb but TALK TO, so LOOK, LISTEN,
USE and PICK UP on the cards and the table are untouched. `bar_2` starts at x 1330, so the
One-Strike Man overlaps nobody.

His `approachRadius` is 130 because the anchor is not his feet: the nearest legal ground is 83px
away and his `walkTo` 125px. It is a bark radius, not a hit box.

## 3 · Measured live

Route `nugget-interaction-identities`, 11 captures, PASS.

**Speech anchor** — both blocks land with their foot **51px clear above** the painted head,
centred within 7px of his x.

**No duplicate art** — each painted box compared in a frame where Thad is at the *other* end of
the room (a whole-frame diff would be mostly the protagonist and would prove nothing):

| | identical | max difference |
|---|---|---|
| Card Sharp's painted box | **100.0000%** | **0** |
| One-Strike Man's painted box | 89.90% | **1** |

That second row is the lamps breathing, and the two results check each other: the `stove` lamp
(1095, 345, r170) and `bar_lamps` (1690, 200, r360) both reach the One-Strike Man's box, and
**neither reaches the Card Sharp's** — so the box inside two breathing lamps differs by one level
and the box inside none is bit-identical. Nothing is drawn over either man.

**Group intact** — LOOK AT the patrons still answers with the hotspot's own line.

## 4 · A real bug the proof caught

The ids were `nugget_card_sharp` and `nugget_one_strike_man` while the trees declared
`card_sharp` and `one_strike_man`. `Renderer.speakerHead` matches an ambient by
`each.id === this.speaker`, so neither was found and the first live run drew **"I am." over the
chandelier** — doc 30 §3.1's explicitly forbidden top-centre fallback, for a man plainly on
screen.

Every validator was green at the time. It was found by looking at the frame, which is doc 46
part three's whole point. Renamed; every other speaking character in the game (`winnie`,
`pie_woman`, `map_seller`, `letter_writer`) is named this way for the same reason, and the
room-prefixed `nugget_*` ids belong to the ambients that never speak.

## 5 · Population schema

Three kinds, and the third is not a halfway house:

- **`baked`** — painted, no runtime object at all
- **`voice`** — painted *too*, plus an invisible interaction identity named in `identity`
- **`actor`** — drawn at runtime

> **The invariant is visible population = 9**, which is `people.length`. It is **not** the ambient
> count: the room asks for four ambients and two of them draw nothing. A check equating the two
> would now fail for being right — the same trap the count fell into last time the architecture
> moved.

## 6 · Content

`docs/07-ambient-layer.md` §17 and §13, verbatim. Two of the One-Strike Man's three answers are
written as scenes, so they are carried as `beat` directions and listed every run as unbuilt
rather than invented into speech. Exits are from doc 04's universal pool: the Card Sharp gets
"I should go." because his conversation *is* clarifying, and the One-Strike Man gets "Thank you.
This has been clarifying." because his is not. Doc 07 §13's British "colour" was corrected to
"color" in the **document**, so the document and the content still read alike.

Node prompts are declared absent (`noPrompt` + `exceptionReason`): doc 07 writes no root line for
either man, and the earlier ambient trees' prompts were authored rather than extracted. Inventing
one here would be generating written content.

## 7 · What this deliberately does not do

The seven painted patrons **will not** receive independent idle animation. That is the accepted
consequence of Option A, not an oversight. Future Room 3 life comes from the stove man, the
landing man, the stove and lamp practicals, Deke in Act II, and the Fiddler — who has never been
painted into any plate and is therefore a clean new sprite with no extraction problem.

## Reproducing

```
python3 tools/retrofit/nugget-identity-frames.py                 # the two transparent frames
node tools/gauntlet/life.mjs nugget_candidate \
     --route nugget-interaction-identities --warp                # the live run
python3 tools/retrofit/nugget-identity-proof.py                  # the measurements and the sheet
```
