# Act I, the dinner and the survey: two pictures, for the builder session with the image key

Written 2026-11-10, overnight, under Tyler's mandate (errata 245: "Yes, build it all"). These are for doc 114's rows I-1 and I-3, whose design and lines are `docs/120-act-one-by-hand.md`. The first is wanted first: the dinner is built and waiting on it.

**Budget.** A new asset, `act1-dinner`, in `art/staging/caps.json`, out of the fifteen operations Tyler set aside for new briefs in his overnight prompt. This brief asks for **two operations and one held in reserve** (three in all). Check `art/staging/ledger.json` before each operation and log each.

**Nothing here may be written by the builder.** No lines. Do not touch `content/`. Never touch `wtlangdon-design/anchorage`.

Read first: `CLAUDE.md`, `docs/55-full-game-build.md` §8, `docs/120-act-one-by-hand.md`.

When both are done: commit to a branch named `act1-dinner-art` with `reference/act1-dinner/handback.md` beside this brief, push it, and stop. Do not wait for Tyler.

## 1 · The dish uncovered (Fanshawe's office, the dinner)

- **What it is:** a patch laid over the dinner table's own picture, `art/props/room-11-dinner.png` (598 x 152; attach it). On that table, at its left end, is a silver dish cover (a cloche) on a plate. This picture is **the same spot with the cover lifted off and set down beside the plate, and on the plate a single folded page of a contract with a sprig of parsley on it.** Doc 120: "On a warmed plate, with a sprig of parsley, is a contract."
- **The page:** cream paper, a few lines of small print suggested and not legible, an empty line at the bottom. No readable words. One page.
- **Exactly the table's light, size and pixel grain.** It is drawn 1:1 over the table, so the plate must be the plate that is there, and nothing else on the table may change. Hand back a PNG of the whole 598 x 152 table with only that corner changed, or a patch with its offset; the main session cuts the changed pixels (as `tools/art/room14-props.py` does for the hill).
- Attach a frame of the dinner as it plays (`renders/playthrough/act-1.webp` has one) so the cover's size beside the seated men is right.

## 2 · The Company's map, large (Madame Ozymandia's table, for I-3)

- **What it is:** the Improvement Company's map of the district as it lies unrolled on her table, filling a 1920 x 864 frame, seen from above at a slight angle, in the tent's lamplight. Attach the map's item icon (`art/ui/item-icons.png`, the `company_map` cell) and her tent's plate.
- **On it:** Claim One and Claim Two side by side, Claim Two circled in ink ("somebody has circled it"); a stake marked at Claim Two's corner; uphill of it **two rocks, one larger**; a creek; the road. Hand-drawn survey style, sepia and one red. No legible words but the two claim numbers.
- **Open paper round the claims,** because the player will draw a line on it from the stake. Nothing important within 150 px of the frame's edge.
- This is a background, so no magenta and no cut. Night interior light, warm from one lamp at the upper left.

## For the wiring

- Nothing in `content/` is to be touched; no lines are to be written.
- The dinner's lines and rules are already in the game: until picture 1 is in, lifting the cover is told and not shown.
