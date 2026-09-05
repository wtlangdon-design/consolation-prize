# ROOM 5 — THE PROUD FLOORBOARD

## Iteration 3 (2026-09-05) — same plank, retoned: the edge does the work

Tyler: location good, iteration 2's face too bright. The bright face was a day board drawn over the night plate (the night image rode a URL candidate); the night image is now declared by visual state (`imageByState.night`) and never depends on the URL. The treatments no longer brighten the face at all.

| | path | lift (left → right end) | gap | lip | end grain |
|---|---|---|---|---|---|
| A subtle | `floorboard/board-rest-a.png`, `-a-night.png` | 1 → 2 rows | 72% | none | none |
| B medium (declared) | `floorboard/board-rest-b.png`, `-b-night.png` | 2 → 3 | 62% | +6%, one row | 95% |
| C upper limit | `floorboard/board-rest-c.png`, `-c-night.png` | 2 → 4 | 52% | +8%, one row | 90% |
| pressed | `floorboard/board-pressed.png`, `-night.png` | flush | | | |

A and C are `?candidate=` swaps of B's path (day or night). Record: `floorboard/floorboard.json`.


## Iteration 2 (2026-09-05) — relocated to the middle walking band, prouder, uneven

Tyler rejected iteration 1 (below, preserved under `floorboard/v1-rejected/`): invisible in play and against the counter. The loose board is now the middle-band plank between the door step and the joint at x≈745. `tools/pixelart/floorboard.py` reads it between its fitted seam lines and lifts it unevenly, the right end higher.

| | path | what |
|---|---|---|
| REST A (moderate), day | `floorboard/board-rest-a.png` | lift 2 rows at the left end rising to 4 at the right, gap under the near edge at 62% |
| REST B (stronger), day | `floorboard/board-rest-b.png` | lift 3 rising to 5, gap at 55%, lip and end grain a shade more |
| PRESSED, day | `floorboard/board-pressed.png` | the plank flush, the plate's own pixels |
| night | `board-rest-a-night.png`, `board-rest-b-night.png`, `board-pressed-night.png` | the same from the night plate |

**Geometry.** Hotspot rect `[450, 740, 310, 56]`; physical plank and tread `[462, 746, 284, 43]`; seams top y = 0.0209x + 731.9 and bottom y = 0.0452x + 757.3; caption at (603, 744). A is the declared `rest` image; B and the night images are `?candidate=` swaps, so the playtest can show either without touching the base plate. Record: `floorboard/floorboard.json`.

## Iteration 1 (rejected)

Tyler's playtest finding, 2026-09-05: the writing says the board sits a
little proud and is loose; the accepted plates draw it flush. No image
operation, no repaint. `tools/pixelart/floorboard.py` reads the plank out of
each accepted plate and writes it back as the floorboard hotspot's state
images; the plates are untouched. Record: `floorboard/floorboard.json`.

| | path | what |
|---|---|---|
| REST, day | `floorboard/board-rest.png` | the plank lifted two rows out of the day plate, gap dark under its near edge |
| PRESSED, day | `floorboard/board-pressed.png` | the plank flush, the day plate's own pixels |
| REST, night | `floorboard/board-rest-night.png` | the same lift from the night plate |
| PRESSED, night | `floorboard/board-pressed-night.png` | the same plank flush from the night plate |

**Geometry.** Hotspot rect (unchanged, interaction geometry): `[880, 704, 240, 36]`.
Physical plank and tread: `[960, 707, 138, 18]` — rows 707–724 under the
counter's base seam, between the split at x≈956 and the joint at x≈1098.
Lift: 2 rows. Same on both plates.

**Behaviour.** `reference/room-05/annotation.json` → `hotspotStates.floorboard`:
default `rest`; `step` sweeps Thad's feet across the tread, presses the board
220 ms, shows the world caption CREEEAK at (1029, 706) for 900 ms and fires
doc 45's `R05-FLOOR-STEP`. Once per loading; silent while standing; re-arms
when the feet leave the wood. `engine/core/StepTriggers.ts`.

**Night.** The night images are selected the way the night plate is: two more
`?candidate=` swaps on the night playtest URL, until Q26 wires the visual state.

**Not promoted; `visual_accepted` unset.** The board is Tyler's to accept.
