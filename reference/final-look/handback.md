# The final look: handed back (reference/final-look/brief.md)

**Budget.** `final-look`, cap 10 (`art/staging/caps.json`, as recorded). **Six are spent** (ledger: final-look attempts
1-6), one per section, the pie woman included: none of the six needed a second pass. **Four are held** (three reserve,
one spare). The ledger stood at 392 attempts when I began, as stated; it is 398 now. Nothing was written; nothing in
`content/` or `docs/` was touched.

Every redraw was generated against a frame of Thad in the figure's own room (`tools/art/beside-thad.py`) with Thad's
standing frame as the ruler on the template and the forty-figure line-up attached, and every one keeps its sheet:
**the same file, the same frame rects in the same order, the same poses, each frame's soles on the row its old frame's
soles were on.** The wiring is the file already swapped; the rest heights below are for the re-measure.

What to look at:

- `renders/final-look-cast-before-after.png` -- Thad and the five rest frames at one height, old above, new below.
- `renders/final-look-beside-thad.png` -- each figure as the engine draws it in its room beside Thad, old left, new right.
- `renders/room-36-main-street-dawn-night-old-new.png` and `renders/room-36-main-street-dawn-with-its-rects.png`.
- `renders/room-45-washout-before-after.png`.

## The tools

- `tools/art/final-look-inputs.py` -- each template: Thad (as tall against the figure as he stands beside it in
  its room) and the figure's distinct poses in sheet order, on magenta.
- `tools/art/final-look-cut.py KEY --write` -- the cut. It finds each figure as a group of pieces (a rake's head
  stays with its man where the key ate the thin handle), scales every pose by ONE factor so the new rest is exactly
  as tall as the old, **matches the new drawing's mean light to the old** (the operation drew each about a tenth
  brighter, and Pratt at Prosperity crossed his night's light limit), registers each pose on its legs, lays it into
  the old frame rect on its old sole row, despills the outline ring only (Ozymandia's purple feather is hers), and
  snaps to the one level at the record's own man (`levelMan` where the record has one). It reads the old sheets from
  `art/staging/final-look/<key>/old-sheet.png` (main at 11345485), so it re-runs to the same pixels.
- `tools/art/final-look-dawn.py`, `tools/art/final-look-washout.py`, `tools/art/final-look-render.py`.

## 1 · Mr. Pratt -- operations 1 and 2

| Sheet | Rest height old → new | Notes |
|---|---|---|
| `art/actors/room-25-pratt-master.png` (7 × 355×400) | 391 → 391 | frame 4 (raking, pushed) nudged 4 px left so the rake's head stays in its cell |
| `art/actors/room-25-pratt-jump-master.png` (6 × 304×450) | 412 → **397** | the whole sheet drawn 3.6% smaller: the new mallet raised overhead (frame 3) reached above the 450 cell at full size. Frame 4 (struck) nudged 18 px left. Also the sheet `pratt_registrar` uses |

Head and hands at Thad's proportions, the build broad but not inflated; hat, moustache, shirt, braces, rake and mallet
as they were; every pose as it was. Frame 1 of each is the derived breath, as before.

## 2 · The rule-keeper -- operation 3

`art/actors/room-52-rule-keeper.png` (7 × 239×346): rest 338 → 338. Still stout -- his middle is his build -- with a
head and face at the cast's size. Frames 5 and 6 are his fiddle, bow one way and the other, as before.

## 3 · Main Street at dawn -- operation 5

`art/backgrounds/room-36-main-street-dawn.png`, 3700 × 864. **Room 2's own pixels, relit.** The old dawn plate was
already Room 2's street under a borrowed light (`tools/art/room36-dawn.py`); what made it look like another game was
the light it borrowed: room-36 operation 1 had drawn a bright, saturated full morning with crisp blue peaks. Operation
5 relit the same small copy of the night street to the very first light -- dim, cold, the lamps out, the mountains
soft -- and the same transfer carries only that light onto Room 2's plate. Every board, sign, window and puddle is the
night plate's own, so **every hotspot rect, walk box and exit of `content/rooms/main-street-dawn.json` sits exactly
where it sat on Room 2's street** (drawn over the new plate in `renders/room-36-main-street-dawn-with-its-rects.png`).

| | mean light | ground texture (high-pass) | saturation |
|---|---|---|---|
| Room 2 at night | 47.9 | 14.2 | 58.5% |
| the old dawn | 98.6 | 20.4 | 41.9% |
| **the new dawn** | **63.9** | **10.7** | **34.8%** |

- The sky: operation 5's is one colour across each row, which `tools/check-plate-flat-edges.mjs` reads as a plate
  stopping short of its frame; the tool gives it a broad 5% glow to the east, down the road out, where the first
  morning put it.
- **For Tyler's eye:** the lamps are out by the light, not by repainting. The saloon's doors and windows still show
  a faint warm cast where Room 2 lit them; putting them out by fill smeared the saloon's front and was not used.

## 4 · Madame Ozymandia at Prosperity -- operation 4

`art/actors/room-23-ozymandia.png` (5 × 175×372): rest 368 → 368. The lace is a few soft marks and the dress two or
three broad shades; the same figure, hat, feather and rod, every pose as it was. Drawn against the Nugget's bar men
(`art/staging/final-look/nugget-bar-men@3x.png`) for the texture.

## 5 · The pie woman -- operation 6

`art/actors/ambient-pie-woman-master.png` (5 × 86×177): rest 168 → **166** (the raised hand of frame 4 needed the
sheet 1% smaller to stay in its cell). A head a little smaller against her height, a little more even in her shading.
Done: four operations were left after the five above.

## 6 · The washout, by tool -- no operation

`art/backgrounds/room-45-washout.png`. Chroma (each pixel's distance from its own grey) scaled about its own lightness
by one factor, 0.801, to the mean of the ledge's and the tents'. Lightness untouched.

| | chroma | HSV saturation | mean light |
|---|---|---|---|
| Room 50, the ledge | 33.4 | 47.0% | 77.3 |
| Room 51, the tents | 35.7 | 52.5% | 69.8 |
| **the washout, before** | 43.1 | 55.8% | 89.8 |
| **the washout, after** | 34.6 | 47.1% | 89.8 |

It looks better: the sky and the hill's ochre stop shouting, and it sits beside the ledge and the tents as one place.
The step from the night town is still the step from night to day, which is ruled.

## Checks

All 67 checks and all 1,668 tests pass on this branch, the one-level, figure-light and plate-edges checks among them.
