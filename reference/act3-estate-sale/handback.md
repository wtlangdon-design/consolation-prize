# Scene C's art, handed back (reference/act3-estate-sale/brief.md)

Two of `act3-estate-sale`'s four operations spent (`art/staging/ledger.json`, attempts 1 and 2). Operations 3 and 4
are held for corrections.

## `art/actors/room-23-hen.png` (operation 1)

Pratt's hen, plain brown, side-on, facing RIGHT (toward the hole and the raccoon, who looks to his right, our left).
Four frames of 74 x 73, `[2 + i*76, 2, 74, 73]`: 0 rest, 1 breath (derived), 2 her head cocked, one eye up,
3 pecking. **Size:** 73 px, 0.199 of Room 23's man at the hole (367 px).

## `art/actors/room-23-raccoon-emerging.png` (operation 1)

The raccoon halfway out of the hole: head, shoulders and forepaws, a straight cut across his chest. Four frames of
96 x 65, `[2 + i*98, 2, 96, 65]`: 0 rest, looking left with suspicion, 1 breath (derived), 2 sniffing toward the hen,
3 ducked back down by half. **Size:** matched to the raccoon who already lives in the hole -- the span across his
ears is 32 px, as on `art/actors/room-23-raccoon.png` frame 0 (`renders/room-23-hen-and-raccoon-at-the-hole-with-thad.png`).

Cut by `tools/art/act3-estate-cut.py`.

## `art/actors/thad-coat-bundle-front.png` (operation 2)

A Thad clip, `coat-bundle`, facing front, on his stand-front canvas (709 x 691) and scale (figure 626 px, soles on
row 625 in every frame), as four frames SIDE BY SIDE in one strip, frame i at x = 709 i: 0 braced, both arms round
the bulging coat with the raccoon's face and a paw out of the top; 1 breath (derived); 2 the bundle lurching to the
left; 3 the paw swiping out, his head back. In his shirtsleeves and waistcoat; his face, hair, trousers and boots are
his own.

**A strip, not a clip directory:** an `art/actors/thad-*` directory is one of Thad's declared clips, and an
undeclared one fails `check` (and stops `tools/build-actor-record.mjs`); declaring it touches `content/`, which this
work does not. To wire it: split the strip into `art/actors/thad-coat-bundle-front/coat-bundle-00.png` .. `-03.png`
with a `rig.json` as `thad-pick-fit-back` has (`clip: coat-bundle`, `facing: front`, `figure: [189, 626]`,
`padding: 260`), add `coat-bundle` to `tools/build-actor-record.mjs`'s clips, and rebuild the record.

**No hat:** the brief says to match his hat, but none of Thad's figures has one (Act III's "hat low" is told in the
lines, never drawn), so matching his figure means none here either.

## `art/ui/item-icons-act3-estate.png` and `.json` (operation 2)

Two 60 x 40 cells, cut by `tools/art/item-icons-cut.py`'s own reduction as the Gulch's three were: `[0, 0, 60, 40]` the
coat bundled with the raccoon's face out of the top, `[60, 0, 60, 40]` the hen. A separate small sheet beside
`art/ui/item-icons.png`; the ids in the `.json` are this tool's names -- the main session names the items and moves
the cells into the shipping sheet. Cut by `tools/art/act3-coat-cut.py`.

## For the wiring

- **Night:** Room 23 is night, and the hen (daylight browns) and the emerging raccoon (a little lighter than the
  sitting one) will want the room's night grade, as errata 207 B graded four figures into theirs. The figure-light
  check will say how much.
- Nothing in `content/` is touched.
