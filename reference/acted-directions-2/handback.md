# Acted directions, the second pass: handed back, PART-DONE (reference/acted-directions-2/brief.md)

**Stopped on a cap.** Five of the asset's eighteen operations are spent (ledger: acted-directions-2 attempts 1-5).
Then the game's overall image spend cap was reached: `art/staging/caps.json` `spendTokensTotal` is 4,000,000 and the
ledger records **4,001,983** billed tokens. `tools/art/staging.mjs` refuses every further operation, for every asset.
I was told not to raise a cap, so I stopped. **11 of the 21 rows are drawn; 10 are left** (below). Raising
`spendTokensTotal` is Tyler's call. The 13 operations left under this asset's own cap of 18 are enough for the rest.

The ledger stood at 398 (392 + final-look's 6) when this began, and at 403 now. Nothing was written; nothing in
`content/` or `docs/` was touched. This branch is cut from `final-look-art` with `main` merged in, as asked.

## Tyler's ruling mid-brief: the panner

Tyler, shown the river panner beside Thad (`renders/panner-and-lookout-beside-thad.png`): he reads as Thad in a hat.
The docs say only "in a good coat" and "rich men standing in cold water". **Ruling: "Redraw him, 1 op"** -- his whole
sheet as a different man (older, grey-bearded, a good brown check coat, a bowler), with the snort drawn on the new man
in the same operation. The prompt and spec are written (`reference/acted-directions-2/panner.*`) and the cut supports
it (`tools/art/acted2-cut.py panner` replaces his frames in place, derives the breath, adds the snort). **It is not
drawn: it is one of the operations the spend cap stopped.**

## How the drawn ones were made

- `tools/art/acted2-inputs.py` -- each template: Thad (at his height beside the figure in its room), the figure's own
  rest frame (left as it is, the registration ruler), then the rest again for each new pose.
- `tools/art/acted2-cut.py KEY --write` -- scales every pose by one factor so the drawn rest is the sheet's rest
  height, matches its light, registers each pose on the rest by the legs, despills the outline ring, snaps to the one
  level at the record's own man, and **adds the poses as a new row below the sheet**, frames `[2 + i*(W+2), Y, W, H]`.
  It **asserts every existing frame is untouched, pixel for pixel**. Each cut's numbers are in
  `art/staging/acted-directions-2/<key>/cut.json`.
- Every pose beside Thad in its room at game size: `renders/acted-directions-2-beside-thad.png` (one row a figure).

## The rows drawn (11)

Frame numbers are indices into the record's `frames` once the new rects are appended in order. Seconds are suggestions
for doc 95's columns.

| Row | Figure | Sheet, new frames | Frames to play | Seconds |
|---|---|---|---|---|
| 120 | pratt | `room-25-pratt-master.png`, **7**: opening the coat, peering in (the raccoon's face shows in the bundle) | 7 | 2.0 |
| 121 | pratt | **8**: the coat under his arm, a coin between finger and thumb | 8 | 2.5 |
| 122 | pratt | **9**: the coat under his arm, the other hand out, palm up, to his left (toward Thad) | 9 | 1.5 |
| 123 | pratt | **10**: the hen in one arm, the empty coat held out in the other | 10 | 2.0 |
| 131 | pratt_jump | `room-25-pratt-jump-master.png`, **6**: hand out, palm up, to his left; **7**: writing with the chalk at chest height | 6, then 7 | 1.5, 3.0 |
| 84 | gulch_rule_keeper | `room-52-rule-keeper.png`, **7**: a finger tapping his temple, the glass on his knee | 7 | 1.5 |
| 90 | gulch_rule_keeper | **8**: leaning forward, the pebble bag tipped, a pinch of dust falling | 8 | 2.0 |
| 81 | gulch_lookout | `room-51-lookout.png`, **5**: reading the paper open in both hands; **6**: the paper lowered, looking toward Thad | 5, then 6 | 3.0, 1.5 |
| 82 | gulch_lookout | **7**: the paper tucked in his shirt over his heart, his hand flat on it | 7 | 2.0 |
| 87 | gulch_deacon | `room-52-deacon.png`, **6**: polishing a glass with a cloth | 6 | 2.5 |
| 88 | gulch_deacon | **7**: pointing down and away, toward the left of the picture | 7 | 1.5 |

New rects (also in each `cut.json`):

- pratt: `[2,810,355,400]`, `[359,810,355,400]`, `[716,810,355,400]`, `[1073,810,355,400]`.
- pratt_jump: `[2,906,304,450]`, `[308,906,304,450]`. `pratt_registrar` shares this sheet; its rects are unchanged.
- gulch_rule_keeper: `[2,350,239,346]`, `[243,350,239,346]`.
- gulch_lookout: `[2,326,119,322]`, `[123,326,119,322]`, `[244,326,119,322]` (cell 4 px wider than his 115: the open
  paper; widened evenly, soles on row 321).
- gulch_deacon: `[2,390,292,387]`, `[296,390,292,387]` (cell 292 x 387, not 214 x 386: the pointing arm and the
  polishing hands; widened evenly, grown 1 px at the top, soles on row 385).

## For Tyler's eye, on the drawn ones

- **Row 131, Pratt's hand out:** the operation drew him letting go of the mallet. It is put back by the tool, standing
  on its head by his boot where his rest frame has it (`UNDERPAINT` in the cut), so it does not vanish (errata 111).
- **Row 90, the dust:** he tips the bag to his own left, the picture's right, where the plank by the barrels is --
  away from Thad's side. If the plank meant is between them, the frame needs mirroring or a correction.
- **Row 81, the lookout reading:** the open paper covers his chest, and the pan he holds in every frame is not seen in
  that frame (it is back under his arm in 6 and 7).

## The rows left (10), each with its prompt and spec written

| Row | Figure | What is left | Ready to run |
|---|---|---|---|
| 74 | winnie | ducking behind the counter; coming up with the ledger | `reference/acted-directions-2/winnie.spec.json` |
| 109 | ozymandia | one hand up to the hanging lamp's key | `ozymandia.spec.json` |
| 132 | frame | locking the type; inking (the standing back is drawn) | `frame.spec.json` |
| 70 | deke_vessel | the glass held; raised an inch | `deke.spec.json` |
| 69 | letter_writer | the pen laid down | `letter-writer.spec.json` |
| 80, 130, 136 | thad (back) | the rod left (and a derived tremble), the rod right; the chalk; the blanket, a corner at a time | `thad-back.spec.json` -> `art/actors/thad-acted2-back.png` |
| 112 | thad (right) | going down on hands and knees; crawling | `thad-right.spec.json` -> `art/actors/thad-acted2-right.png` |
| 96 | gulch_panner | the whole redraw (Tyler's ruling above) and the snort | `panner.spec.json` |

Each is one operation: `NODE_USE_ENV_PROXY=1 node tools/art/room-op.mjs reference/acted-directions-2/<key>.spec.json`,
then `python3 tools/art/acted2-cut.py <key> --write`. Two notes for whoever runs them:

- **Winnie's row stays B** even when her pose is drawn: the loose board lifted is not in her sheet, and her pose cannot
  go round the counter (the brief says so; the board is reference/second-ledger's).
- **Thad's sheets are grouped by facing, not as the brief grouped them.** The rod, the chalk and the blanket all face
  back (the walk-to of `left_passage`, `claim_marker` and `grievance_s_blanket` is `back`), and the blanket is at his
  shoulder (Livery: his crown at y 386, the blanket at 488-546), not low; the crawl faces right (`seance_table`). Still
  two sheets.
