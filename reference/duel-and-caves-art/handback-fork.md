# The tuning fork in Room 34: handed back (reference/duel-and-caves-art/brief.md, Part C)

## Spent

On Tyler's instruction (2026-11-17), `art/staging/caps.json` has a new entry, `room-34-fork`, cap 1, quoting him: "Let's do the fork correction."

**One operation is spent:** room-34-fork attempt 1, at high quality, 6,890 billed tokens. The asset has none left.

**Ledger:** 470 attempts and 4,813,938 tokens against 4,840,000, about 26,000 left. That is just over the guard's 20,000 floor: one more operation fits, two do not.

**Nothing is wired.** Nothing in `content/` or `docs/` is touched, and the Room 34 plates are not changed.

## What was drawn

**`art/staging/duel-and-caves-art/room-34-fork/fork-1.png`** (raw, 1536 x 1024, on magenta) is a tuning fork alone:
- two straight parallel prongs joined at a rounded U, and a short round stem;
- lying flat, seen slightly from above, with the stem to the lower right and the prongs to the upper left, as the old one lies;
- lit warm from the upper left.

**Inputs.** The prompt is `reference/duel-and-caves-art/fork-op-1.txt` and the spec is `fork-op-1.spec.json` (`tools/art/char-op.mjs`, quality high). The only reference was `art/staging/duel-and-caves-art/room-34/stump-with-fork-x4.png`.

**Cut.** `fork-1-cut.png` is keyed off magenta with the rim despilled, 469 x 459 at the operation's scale.

**Render:** `renders/room-34-fork-beside-reference.png` shows three panels:
- the reference;
- the reference with the new fork laid over the old one at the brief's length, half the lamp's height;
- the fork alone.

## For the wiring (`art/staging/duel-and-caves-art/room-34-fork/placement.json`)

- **Scale:** the brief asks for a length of half the lamp's height. The lamp is about 680 px tall in the 4x reference, so the fork is about **85 px** long in the plate, tip to tip. From the cut, that is a factor of about **0.13** (0.518 at 4x).
- **Position:** the old fork's centre is at about **(636, 571)** in the plate (reference x 470-750, y 380-620).

## For Tyler's eye

1. **The old fork is painted into both plates.** Laid over it, the new fork leaves the old smudge showing between its prongs (the render's middle panel). The wiring either paints the smudge out of both Room 34 plates under the prop, or sets the fork so its U and stem cover it.
2. **Its pixel is finer than the room's.** At 85 px long, the fork's blocks come out about 2 plate px, where the room's are about 4-5. A snap to the room's block in the cut would match it. That is a resample, not a regrade, and the wiring's call.
3. **Its colour is warm brass-pale all over**, with little of the cooler grey steel on its shadowed side that the brief asked for. In the room it reads as a lit metal fork beside the lamp.

## Checks

The only changes are new staging files, `caps.json`, the ledger and this hand-back. Nothing the game loads is touched.
