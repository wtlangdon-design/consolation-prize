# ROOM 5 — THE PROUD FLOORBOARD

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
