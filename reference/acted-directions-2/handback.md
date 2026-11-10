# Acted directions, the second pass: handed back (reference/acted-directions-2/brief.md)

**All 21 rows are drawn.** Budget: `acted-directions-2`, cap 18. **Fourteen are spent** (ledger: acted-directions-2
attempts 1-14): thirteen sheets, one a figure and two for Thad, and **one correction** (attempt 14, Thad's blanket).
**Four are held.** Nothing was written; nothing in `content/` or `docs/` was touched.

**The spend cap.** After five operations the game's overall image spend reached 4,001,983 billed tokens against
`spendTokensTotal` 4,000,000 and every operation was refused; the first hand-back stopped there. On the instruction
"Raise spendTokensTotal to 4,250,000 and finish reference/acted-directions-2/brief.md" it is now 4,250,000
(`art/staging/caps.json`, with `spendTokensWhy`). The ledger records 4,100,461 billed tokens now, and 412 attempts
(398 when this brief began: 392 + final-look's 6).

This branch is `final-look-art`, then main merged in twice (the second time after the other session wired the first
eleven poses and the final look, errata 263).

## Tyler's ruling mid-brief: the panner

Shown the river panner beside Thad (`renders/panner-and-lookout-beside-thad.png`): he read as Thad in a hat -- the
same face and build, a long dark coat over a brown waistcoat. **"Redraw him, 1 op."** His operation redrew the whole
sheet as a different man -- older, a full grey beard, a brown check coat, a green waistcoat and watch chain, a red
neckerchief, a bowler -- with the pan in every pose, and drew the snort on the new man. All six old frames are replaced
in place in their own 160 x 380 cells (frame 1 is the breath, derived again); the snort is added after. No reserve was
spent on it.

## How they were made

- `tools/art/acted2-inputs.py` -- each template: Thad at his height beside the figure in its room, the figure's own
  rest frame (left as it is, the registration ruler), then the rest again for each new pose. Thad's own two sheets
  repeat his idle frame in the facing the poses take.
- `tools/art/acted2-cut.py KEY --write` -- takes the first figures from the left (the generator sometimes adds a spare
  copy at the end), scales every pose by one factor so the drawn rest is the sheet's rest height, matches its light,
  registers each pose on the rest by the legs (the waist for Winnie and Ozymandia, cut off at a counter and a table),
  despills, snaps to the one level at the record's own man, and **adds the poses as a new row below the sheet**,
  frames `[2 + i*(W+2), Y, W, H]`. It **asserts every existing frame is untouched, pixel for pixel** (all but the
  panner, which is redrawn whole). Each cut's numbers: `art/staging/acted-directions-2/<key>/cut.json`.
- Every new pose beside Thad in its room at game size: `renders/acted-directions-2-beside-thad.png`, one row a figure,
  Thad's two strips last.

## Every row

Frame numbers are indices into the record's `frames` once the new rects are appended in order (the first eleven are
already wired on main; frame numbers below are as I cut them). Seconds are suggestions for doc 95's columns.

| Row | Figure | New frames | Play | Seconds |
|---|---|---|---|---|
| 120 | pratt | **7** opening the coat, peering in | 7 | 2.0 |
| 121 | pratt | **8** a coin between finger and thumb | 8 | 2.5 |
| 122 | pratt | **9** the other hand out, palm up | 9 | 1.5 |
| 123 | pratt | **10** the hen in one arm, the empty coat held out | 10 | 2.0 |
| 131 | pratt_jump | **6** hand out; **7** writing with the chalk | 6, 7 | 1.5, 3.0 |
| 84 | gulch_rule_keeper | **7** tapping his temple | 7 | 1.5 |
| 90 | gulch_rule_keeper | **8** the bag tipped, a pinch of dust falling | 8 | 2.0 |
| 81 | gulch_lookout | **5** reading; **6** the paper lowered, looking at Thad | 5, 6 | 3.0, 1.5 |
| 82 | gulch_lookout | **7** the paper in his shirt over his heart | 7 | 2.0 |
| 87 | gulch_deacon | **6** polishing a glass | 6 | 2.5 |
| 88 | gulch_deacon | **7** pointing down and away | 7 | 1.5 |
| 74 | winnie | **5** ducking behind the counter; **6** coming up with the ledger in both hands | 5, 6 | 1.0, 2.0 |
| 109 | ozymandia | **7** one hand up to the hanging lamp's key, looking up | 7 | 2.0 |
| 132 | frame | **7** locking the type with the key; **8** inking with the roller | 7, 8 | 1.5, 1.5 (then his stood-back sheet) |
| 70 | deke_vessel | **6** the glass held at his chest; **7** raised | 6, 7 | 0.8, 1.5 |
| 69 | letter_writer | **5** the pen down on his board, his hand lifted | 5 | 2.0 |
| 96 | gulch_panner | **6** the snort, his head back (frames 0-5 are the redrawn man) | 6 | 1.0 |
| 80 | thad (back) | strip `thad-acted2-back.png` **0** the rod to the left, **1** the same trembling (derived), **2** the rod to the right | 0, 1, 0, 1, 2 | 0.25 each, 2 on 2 |
| 130 | thad (back) | **3** chalking on the stake | 3 | 3.0 |
| 136 | thad (back) | **4** one corner lifted (left hand), **5** the other (right hand) | 4, 5 | 1.5, 1.5 |
| 112 | thad (right) | strip `thad-acted2-right.png` **0** going down on one knee, a hand to the floor; **1** crawling | 0, 1 | 0.6, 1.0 |

New rects not given in the first hand-back:

- winnie: `[2,172,150,168]`, `[154,172,150,168]` (her own cell; the counter edge on her own row).
- ozymandia: `[2,456,171,248]` (cell 29 px taller than her 219: the raised arm; her waist on the cell's bottom row).
- frame: `[2,1010,253,502]`, `[257,1010,253,502]` (cell 253 wide: the roller; widened evenly, soles on row 501).
- deke_vessel: `[2,862,237,428]`, `[241,862,237,428]`.
- letter_writer: `[2,164,55,160]`.
- gulch_panner: `[2,384,160,380]` for the snort; frames 0-5 in their old rects, redrawn.
- Thad's strips: on his idle canvases (back 702 x 692, right 663 x 691), frame i at x = canvas width x i, soles on his
  idle frames' own rows (626, 625). As `thad-haul-right.png` was handed over, a strip: a clip directory touches
  `content/`. Thad's sheets are grouped by facing: the rod, the chalk and the blanket all face back (their walk-to is
  `back`), and the blanket is at his shoulder in the livery (his crown at y 386, the blanket at 488-546); the crawl
  faces right (`seance_table`).

## For Tyler's eye

- **Row 131:** the operation drew Pratt letting go of the mallet; the tool stands it on its head by his boot, from his
  rest frame, so it does not vanish (errata 111).
- **Row 90:** he tips the dust to the picture's right, away from Thad's side.
- **Row 81:** the open paper covers his chest and the pan is not seen in that frame.
- **Row 70:** Deke's glass goes up to his face, more than "an inch". The glass showed the key's magenta through it;
  his frames are despilled through and through (`FULL_DESPILL`), and no magenta is left.
- **Row 132:** the ink roller is a short T on a handle; at a glance it could be a small mallet.
- **Row 80:** the rod is the icon's forked shape, paler than its brass.
- **Row 136, corrected:** the first try held the whole blanket up by two corners at once, in brown check; attempt 14
  lifts one corner at a time in the icon's red-and-cream stripes (`REPLACE` in the cut takes frames 4 and 5 from it).
- **Row 74 stays B** even with the pose: the loose board lifted is not in her sheet, and her pose does not go round
  the counter. Her ledger comes up from below the counter.
- **The panner** is drawn at his old size; re-measure if his figureHeight was the old drawing's.

## Checks

All 67 checks and all 1,670 tests pass on this branch, the one-level check among them.
