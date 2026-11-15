# The Mercantile's storekeeper: a new drawing

**Tyler, 2026-11-15** (errata 335, written with the wiring): a dozen of the Mercantile's lines speak of its proprietor (he weighs a nail and writes the nothing down, he stores dynamite by the stove and says it is perfectly safe, he has never marked the scales down, every man in town has a page in his credit ledger), and nobody stands behind the counter. Offered a keeper drawn into the room or an honour-system store, Tyler chose: **"B"** — draw him.

**This brief does not budget anything by itself.** The operations are authorized by the prompt Tyler pastes into the image session, which tells that session what to add to `art/staging/caps.json`. Do not touch `content/` or `docs/` while drawing, and never touch `wtlangdon-design/anchorage`.

## What the barman taught: read before drawing

The Nugget's barman (errata 323, 326; `reference/nugget-barman/brief.md` and both hand-backs) is the precedent, and its lessons hold here:
1. **Too sharp, too bright, too white is the usual miss.** The first barman measured texture 11.41 against Thad's 6.60 and looked pasted onto the plate. The second drawing, with one correction shown the side-by-side, landed.
2. **Never fix the numbers in the cut.** Squeezing a figure's luminance to Thad's spread turned the barman flat and grey (Tyler: "This looks awful"). The drawing has to come out right; a miss is a correction operation shown the side-by-side, never a filter.
3. **What he holds in one frame he holds in all of them** (errata 111). The barman's cloth jumped hands between frames; that frame is not played.

## Who he is

The storekeeper of the Mercantile: a lean, cheerful man of about forty-five, clean-shaven, thinning hair combed flat, a **pencil behind each ear**, shirt sleeves held up by **sleeve garters**, a dark waistcoat, a brown store apron. He is patient and pleased with himself: every man in town owes him money, and none of them can leave. Nothing about him is sinister, and nothing marks him as important (design invariant 9).

His lines (doc 27, THE STOREKEEPER, once approved) say: the pencils behind his ears, one hand always on the ledger. Draw both.

**His colours are the room's.** Warm, dim lamplight from the lantern above the shelves behind him. A cream shirt that is not white; a soiled brown apron; a dark waistcoat. No brighter overall than the shelves behind him or than Thad in the same light.

## The look: match Thad, and the barman

The style gate (`CLAUDE.md`): Thad's look is flat, soft-shaded and low in texture. The Nugget's barman (`art/actors/room-03-barman.png`) and drinkers are the closest match in the game and are the reference with Thad:
- big, simple shapes; two or three tones per material; soft, broad shading; no fine wrinkles, no crisp highlights, no hard dark outlines inside the figure;
- the same block size and edge softness as Thad at game size.

## Where he is

- **Behind the counter, between the open credit ledger and the big pickle jar,** in front of the tins and the tonic bottles. Anchor: room **(1660, 510)**, bottom-centre of each cell: the counter top's back edge under him.
- **Posture `band`, like the barman.** The sheet stops where his hands meet the counter top; the counter hides the rest.
- **His height:** a standing man about one counter-depth behind the counter's front. The room's curve gives the standing man 419 px at the counter's foot (y 720) and 433 px where Thad stands at it (y 740, `renders/room-12-mercantile-with-thad.png`). Draw him a little smaller than Thad at the counter, about **390 px crown to hidden feet**; his crown should sit a little below Thad's when both are at the counter. Report the measured height.
- **Do not cover what can be clicked.** He stands in front of the tins and the lower edge of the tonic bottles. Keep his crown below the shelf the tonic stands on (about y 265 in the room), so DR. PURVIS'S TONIC stays visible; the jar (x 1755 onward) and the ledger (to x 1620) must not be overlapped.

Thad will talk to him from the counter's front, to his left, side-on (about (1480, 740), facing right).

## Frames (one sheet, one operation)

**The pencil behind each ear in every frame. The ledger is the room's, not his: he does not hold a book.**
1. **Rest:** standing behind the counter, both hands resting on its top, looking out, pleasant.
2. **Rest B:** the same, his head tilted, the right hand tapping the counter.
3. **Writing:** taking the pencil from behind his right ear and writing at the counter's height, head down.
4. **The action** (`tests/movement.test.mjs`: a frame that changes at least 10% of the figure, at least every 30 s): leaning forward on both hands over the counter, smiling at the customer.

## Generate against Thad, in the room

Attach to the operation:
- `renders/room-12-mercantile-with-thad.png`: the Mercantile at game size with Thad standing at the counter. That is the light and the scale;
- Thad's standing frame on magenta, as the ruler;
- the barman (`art/actors/room-03-barman.png`, the rest frame at 2x), named as the drawing style to match.

Written descriptions alone have failed six times.

## Measure before anyone looks (the gate flags; it does not decide)

On the rest frame at game size, beside Thad's standing frame scaled to the same man, report texture and contrast (`tools/art/cast-softer-measure.py`) and mean luminance. **Aim for the barman's range.** Run `tools/art/one-level.py --only room-12-storekeeper` on the cut. Then look at him in the room at game size beside Thad. If he is visibly sharper, brighter or whiter than Thad, that is a miss: use the correction operation, shown the side-by-side.

## When done

Commit the sheet and its cut frames to a branch named `mercantile-keeper-art`, with the cut sheet at `art/actors/room-12-storekeeper.png` and `reference/mercantile-keeper/handback.md` beside this brief. The hand-back gives:
- the frame rects and the anchor;
- the measured height against the curve;
- texture, contrast and mean luminance beside Thad's and the barman's;
- a crop of him in the room at game size with Thad at the counter, under `renders/`;
- every frame checked for both pencils.

Push it, and stop. The wiring is done by the other session, and Tyler sees him before he goes in.
