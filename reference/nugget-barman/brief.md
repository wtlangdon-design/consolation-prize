# The Nugget's barman: a new drawing (second brief)

**Tyler, 2026-11-14** (errata 323, 325; doc 133): "Do we need a bartender in the Nugget?" Told that nobody stands behind the bar while three lines speak of a barman, he chose: **"Add a barman."** The first drawing missed, and a fix in the cut made it worse (Tyler: "This looks awful"). Then: **"Can we get a good, new bartender?"** This brief replaces the first one. The three lines he must make true:
- the barman pays Thad two dollars when the piano is tuned (doc 57 A7);
- "The barman watches me consider it." when Thad tries to OPEN the bar (doc 49);
- the lamps behind the bar are trimmed, "because the barman is the only person in town who maintains anything" (the room's light note).

He gets no new lines.

**This brief does not budget anything by itself.** The operations are authorized by the prompt Tyler pastes into the image session, which tells that session what to add to `art/staging/caps.json`. Do not touch `content/` or `docs/` while drawing, and never touch `wtlangdon-design/anchorage`.

## What went wrong the first time: read it before drawing

The first attempt is on the branch `nugget-barman-art`: `art/staging/nugget-barman/sheet.png` (the raw sheet), `art/actors/room-03-barman.png` (the cut) and `reference/nugget-barman/handback.md`. Look at it beside the drinkers. It is what **not** to make.

1. **Too sharp, too bright, too white.** He measured texture 11.41 and contrast 62.5, against Thad's 6.60 and 32.3 and the drinker `nugget_bar2`'s 3.29 and 24.5. His shirt and towel were near white under a hard light, while everyone around him sits in warm, dim lamplight. In the room he read as a figure pasted onto the plate.
2. **The numbers were then forced, and that was worse.** Squeezing his luminance to Thad's spread in the cut turned him flat and grey. The numbers passed, and he looked awful. **Do not soften, squeeze or regrade the figure in the cut.** The drawing has to come out right. If it misses, the correction is a second operation shown the side-by-side, never a filter.
3. **A cloth that vanished** (errata 111). He held a small cloth in two frames and not in the other two.

## Who he is

He is the Nugget's barman: a heavy-set, unhurried man of fifty, with a neat moustache, his sleeves rolled, a **dark** waistcoat and an apron. He is the only person in town who keeps anything in order, and he looks it. Nothing about him is sinister and nothing marks him as important (design invariant 9: motion never conveys information).

**His colours are the drinkers' colours.** His shirt is a warm, dim cream, not white. His apron is a soiled tan, not white. His waistcoat is a dark brown. The lamplight on him is the bar's: warm, low, from the lamps on the back bar behind him and above.

## The look: match the drinkers he stands among

The style gate (`CLAUDE.md`): Thad's look is flat, soft-shaded and low in texture, and **too sharp is the usual miss.** The three drinkers at this bar are the closest match in the game (texture 4.90 against Thad's 6.09) and he stands between two of them, so **they are the reference**, together with Thad:
- big, simple shapes; two or three tones per material; soft, broad shading; no fine wrinkles, no crisp highlights, no hard dark outlines inside the figure;
- the same block size and edge softness as the drinkers at game size;
- no brighter overall than the drinkers beside him.

## Where he is (unchanged, and as the first hand-back found it)

- **Behind the bar**, between the counter and the back bar, in front of the mirror, between the second and third drinkers (`nugget_bar2` at x 1413, `nugget_bar3` at x 1723).
- **Posture `band`, like the drinkers.** The sheet stops at the counter top's front edge. Anchor: room **(1580, 515)**, bottom-centre of each cell.
- **His height:** the room's standing man at the bar, about 246 px crown to hidden feet. **Cut where his hands meet the counter**, as the first hand-back did: drawn with his feet at y 560, the counter would cross him at the knees.

## Frames (one sheet, one operation)

**The cloth is in his right hand in every frame. There is no towel over his shoulder and no second cloth.**
1. **Rest:** polishing a glass, the glass in his left hand and the cloth in his right.
2. **Polish B:** the same, with the glass turned and the cloth moved round it.
3. **Set down:** the glass on the counter under his left hand, the cloth still in his right.
4. **The action** (`tests/movement.test.mjs`: a frame that changes at least 10% of the figure, at least every 30 s). He looks up and down the bar, his head turned, the glass and the cloth held against his chest.

Whatever he holds in one frame he holds in all of them (errata 111). Check every frame for the cloth before handing back.

## Generate against Thad and the drinkers, in the room

Attach these to the operation:
- the Nugget's bar at game size with the three drinkers and Thad standing at the bar. That is the style reference;
- the first attempt, labelled as the look to avoid.

Written descriptions alone have failed six times.

## Measure before anyone looks (the gate flags; it does not decide)

On the rest frame at game size, beside Thad's standing frame scaled to the same man and beside `nugget_bar2`, report texture and contrast (`tools/art/cast-softer-measure.py`) and mean luminance. **Aim for the drinkers' range, about texture 3-6 and contrast 25-33.** Run `tools/art/one-level.py --only room-03-barman` on the cut. Then look at him in the room at game size beside the drinkers. If he is visibly sharper, brighter or whiter than them, that is a miss: use the correction operation, shown the side-by-side.

## When done

Commit the sheet and its cut frames to a branch named `nugget-barman-art-2`, with `reference/nugget-barman/handback-2.md` beside this brief. The hand-back gives:
- the frame rects and the anchor;
- the measured height against the curve;
- texture, contrast and mean luminance beside Thad's and `nugget_bar2`'s;
- a crop of him in the room at game size between the drinkers, under `renders/`;
- every frame checked for the cloth.

Push it, and stop. The wiring is done by the other session, and Tyler sees him before he goes in.
