# Act II's three papers: the art, handed back (reference/act2-papers/brief.md)

**Budget.** `act2-papers` was set at 6 (Tyler, 2026-11-10: four operations and two in reserve; `art/staging/caps.json`).
Five are spent (`art/staging/ledger.json`, attempts 1-5): one for each picture, and **one correction, operation 5**,
for the wreath. **Operation 6 is held.** Every sheet below is cut by `tools/art/act2-papers-cut.py` (re-runnable from
staging), despilled, snapped to one level. Frames are laid out as every ambient sheet is: side by side, 2 px apart,
`[2 + i*(w+2), 2, w, h]`, bottom-centred.

## 1 · `art/actors/room-02-fanshawe-wreath.png` -- the Colonel in his doorway (II-5)

Four frames of 260 x 398:

| Frame | |
|---|---|
| 0 | pushing politely from inside, his face over the wreath |
| 1 | breath, derived |
| 2 | a harder push, his hat askew |
| 3 | **the wreath alone**, in the same place, so it can go through the door without him |

- **Operation 5 corrected operation 1.** Operation 1's ribbon read "IN LOVING MEMORY", which doc 115's LOOK ("A ribbon
  across it says SINCERELY") would have contradicted, and it was still legible at game size. Its wreath's hole showed
  the background through him, and its lilies were far sharper than Thad. Operation 5, shown the game-size
  side-by-side with Thad, fixed all three, but drew the wreath ending at his knees with nothing below. His own lower
  legs and boots, from the same sheet's standing figure, are put under the wreath (`legsUnder` in the tool's output),
  so he stands on the boards. Every frame is anchored on the wreath's ring: the wreath does not move between them.
- **Size.** The sheet is at his shipping rest frame's height (395). At the Company's door the street's curve gives a
  man 105 px (`renders/room-02-fanshawe-wreath-in-the-doorway-with-thad.png`); the wreath is wider than the door, as
  the line says.
- The hands pushing are not shown: operation 5 dropped them. At 105 px they would be two or three pixels.

## 2 · `art/actors/room-14-fanshawe-hat-in-hand.png` -- the Colonel on Boot Hill (II-1)

Three frames of 271 x 400 (his Main Street sheet's frame, mirrored to face left, down the hill): 0 his top hat held
at his chest in both gloved hands; 1 breath, derived; 2 his watch out on its chain, the hat under his arm. Registered on
his legs to that mirrored rest frame. It replaces his Duel Three sheet's hatted figure on the hill (the brief's
`room-14-fanshawe-coming-down.png` is not on main).

## 3 · `art/actors/room-14-sowerby-plate.png` -- the Reverend with the collection plate (II-1)

Four frames of 208 x 314, registered on his legs to his shipping rest frame (the sheet `sowerby-gate` uses; he does
not shift): 0 the pewter plate in both hands; 1 breath, derived; 2 one hand reaching out, the other empty (the plate
away down the line); 3 gripping the plate held out at arm's length, as against a pull. **He reaches and pulls to his
left**, where the line stands (the procession mourners at x 335; he is at 480).

## 4 · `art/actors/thad-plate-front.png` -- Thad holding the plate (II-1)

A strip of three frames on his stand-front canvas (709 x 691), frame i at x = 709 i, soles on row 625 in every frame,
as `coat-bundle` was cut: 0 holding the plate at his waist; 1 breath, derived; 2 the pull, arms drawn back, weight on
his heels. **His hat is under his arm** in both: doc 115's line has him take it off to stand in the line
("Thad takes off his hat"), and he is drawn bareheaded everywhere, so a plain dark hat under his arm is the hat
taken off.
**A strip, not a clip directory:** declaring a Thad clip touches `content/`. To wire it: split into
`art/actors/thad-plate-front/plate-00.png` .. `-02.png` with a `rig.json` like coat-bundle's (`figure: [189, 626]`,
`padding: 260`, `facing: front`), as `tools/art/thad-coat-bundle-split.py` did, and add the clip to
`tools/build-actor-record.mjs`.

## For the wiring

- `renders/room-14-collection-plate-and-fanshawe-with-thad.png` is a check of sizes and light, not a staging.
- Nothing in `content/` is touched; no lines are written.
