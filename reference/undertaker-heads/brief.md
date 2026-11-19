# The undertaker, redrawn to Thad's proportions (errata 380)

For the image session. **No operation is spent until Tyler pastes the prompt below into it.**

## Why

Tyler, 2026-11-19, looking at the prayer at the gate after the mourners were redrawn (errata 376–379): "It looks like the guy on the far right still has a big head?" Asked whether to redraw both of the undertaker's drawings with the operation cap raised by 2, or only the hill's within what was left, he chose the first: **"1"**.

The undertaker's head is drawn bigger than Thad's (Act III art review finding 13: 15% of his height against Thad's 12%). He now stands beside the redrawn mourners and the Reverend, so the difference shows.

## Budget

- The ledger is at 481 attempts against `attemptsTotal` 483, and about 48,500 tokens under the ceiling (`reference/act3-mourners-bowed/handback.md`).
- **Raise `attemptsTotal` by 2, to 485.**
- Add a cap entry for each asset, `undertaker-hill` and `undertaker-shop`, each cap 2, quoting Tyler: "1" (to "Both drawings, with the operation cap raised by 2").
- So there is one operation each and one correction each. The token ceiling is not raised: four operations at about 10,000 tokens each fit under it.

## The two drawings

**1. On the hill: `art/actors/room-31-undertaker-master.png`.**
- Five frames, 129 x 400: 0 hands folded · 1 breath (derived, not drawn) · 2 head bowed · 3 a glance down to the left, at the coffin · 4 hands folded, looking up.
- Used at the graveside (`funeral_undertaker`) and at the gate (`procession_undertaker`), figureHeight 400.
- See `art/staging/undertaker-heads/hill-sheet-as-it-is@2x.png`, `graveside-as-it-is.png` (behind the coffin, beside the Reverend) and `gate-as-it-is.png` (far right).

**2. In his shop: `art/actors/room-13-undertaker-master.png`.**
- Five frames, 166 x 192, waist-up behind his workbench, drawn 1:1 at the room's scale: 0 turning the plane in his hands, looking at it · 1 breath (derived) · 2 sighting along its sole · 3 running a thumb along the blade · 4 looking up, the plane at his chest.
- See `art/staging/undertaker-heads/shop-sheet-as-it-is@2x.png` and `shop-as-it-is.png` (Thad at the talk stand in front of him).

## What

As the Reverend's master was done (`reference/sowerby-art/sow-master-op-1.txt`), **redraw every drawn frame in place.** Same man, same clothes and colours, same pose in each frame, same overall height: crown and soles (or, in the shop, crown and the cut at the bench) on the same rows. Whatever he holds (the plane) is held the same way.

**What changes is his head.**
- Make it small, in Thad's proportions and matching the redrawn mourners and the Reverend beside him: about seven heads tall standing, face no wider than Fanshawe's. The body is correspondingly longer, so his height does not change.
- Keep his grey hair and moustache, with a plain, softly shaded face.
- Use flat colour, two or three tones per material, and soft, broad shading. No crisp highlights and no hard dark lines inside the figure.
- Square pixels, no brighter than now. In the shop he stands by the lamp, and a white shirt and apron are not a reason to be lighter than Thad (Act III review, settled-rule table).

Use flat magenta (#FF00FF) with nothing touching between frames, and no ground, shadow, text or border.

**The cut.** Cut each the way the Reverend's sheets were: add jobs `ut-hill` and `ut-shop` to `tools/art/duel-crowd-cut.py` beside the `sow-*` jobs. Each drawn pose goes in its own old cell, registered on the old frame. Frame 1 is the breath, re-derived from frame 0. The same cells, frame rects and records, so nothing in `content/` changes. Then snap to one level with `tools/art/one-level.py --resnap --only <sheet>`. **Never run `one-level.py` without `--only` or `--dry`.**

## Paste this into the image session

> Read `reference/undertaker-heads/brief.md` on main and draw it. In `art/staging/caps.json` raise `attemptsTotal` by 2 (to 485) and add cap entries `undertaker-hill` and `undertaker-shop`, cap 2 each, quoting Tyler: "1" (to "Both drawings, with the operation cap raised by 2"). Do not raise the token ceiling. Redraw both of the undertaker's sheets in place with a smaller head, as the Reverend's master was done, using the images in `art/staging/undertaker-heads/` plus `art/staging/act-one-art/thad-ruler.png` and `art/staging/duel-and-caves-art/fanshawe-all/new-duel-fanshawe@2x.png`. Spend a correction only if a drawing misses on head size, style or registration. Cut each with new `ut-hill` and `ut-shop` jobs in `tools/art/duel-crowd-cut.py`. Put the result on a new branch named `undertaker-heads` with `reference/undertaker-heads/handback.md` saying what was spent. Show me each beside Thad in its own room, and do not wire anything: the main session wires it.
