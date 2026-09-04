# ROOM 5 — THE HANGING WORK LAMP

Tyler's post-pilot owner visual revision, 2026-09-04: one small plain period
oil lamp on a short chain from the brass service cage over the ledger is
canon. **POST-PILOT OWNER VISUAL REVISION — +1 IMAGE OPERATION**: recorded
as `room-05-lamp` attempt 1 (role canonical-design) under its own cap of 1 in
`art/staging/ledger.json`; the autonomous pilot's accounting stays **8/8**.

| | path | sha256 (first 12) |
|---|---|---|
| untouched API edit (the night source + one lamp) | `lamp-source-01.png` | cc76a6bfaf60 |
| derived 1920×864 (crop + Lanczos-3, SAFE) | `lamp-01/candidate-1920x864.png` | 8d91331f3fbf |
| the fixture as a prop, tight RGBA crop | `lamp-01/hanging-lamp.png` | bd8f79cea439 |
| the same pixels as a full-plate state image | `lamp-01/hanging-lamp-overlay.png` | 5575e30126f2 |
| extraction record | `lamp-01/lamp.json` | |
| Winnie relit under the lamp (alpha identical) | `winnie-02-counter/winnie-counter-sheet-night-lamp.png` | cd2f4c4fd151 |
| ink stand relit under the lamp | `winnie-02-counter/inkstand-night-lamp.png` | 502f042d2c74 |

**One fixture, both states.** The lamp is THE HANGING LAMP hotspot's `lit`
state image, drawn over the unchanged DAY plate (c0afe61efcf6) and the
unchanged NIGHT plate (92e3f8f5b70a, the lifted night candidate) alike;
`occludes: [1]` puts it in front of Winnie where its base meets her hair.
Its light is a room lamp at (990,300), radius 330, amount 0.03 by day and
0.18 by night through `amountByState`, breathing at 0.3 Hz; the state is
selected by the dev-only `?state=night` beside `?candidate=` until Q26 wires
the room's visual state to canon.

**Placement** (`proofs/room-05/lamp-placement.json`): bounds [932,62,82,187],
attachment (974,62) on the cage's top rail, flame (972,198), glow centre
18 px right and 102 px below the flame so the pool falls on the work. No
pixel of the fixture overlaps any of Winnie's five frames; no bar-mask pixel
lies under it; its rect sits inside `sample_shelves`, resolved smallest-first.

**Canon**: `docs/25-rooms-05-07.md::ROOM 5 · ASSAY OFFICE, FRONT` (THE HANGING
LAMP, LOOK 1–3, LISTEN 1–3, Tyler's wording); `docs/05-examine-layer.md`
roster line and count. No wrong-verb line was needed by validation; the
generic pools answer PULL.

**Not promoted; `visual_accepted` unset.** The lamp is Tyler's to accept.
