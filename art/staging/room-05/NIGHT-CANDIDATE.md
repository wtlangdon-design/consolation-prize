# ROOM 5 — NIGHT VISUAL CANDIDATE

The final Room 5 pilot image operation (8 of 8; `art/staging/ledger.json`
room-05-reserve attempt 1, role plate, state night), 2026-09-04, under
Tyler's night pass and errata 64: Room 1 night → Main Street night → Room 5
night.

| | path | sha256 (first 12) |
|---|---|---|
| untouched API source, 1536×1024 | `plate-source-03-night.png` | 5ea39bd8201e |
| derived candidate, 1920×864 | `plate-03-night/candidate-1920x864.png` | 72124eb6f213 |
| crop overlay + safe-frame record | `plate-03-night/crop-overlay.png`, `plate-03-night/safe-frame.json` | SAFE |
| Winnie, relit (alpha identical to the approved sheet) | `winnie-02-counter/winnie-counter-sheet-night.png` | c116e34e8cdb |
| ink stand, relit | `winnie-02-counter/inkstand-night.png` | 12225c416c9d |

**It is an edit of the accepted DAY source**, `plate-source-02.png`
(a80140dcfa47), transmitted first, with the Room 1 live frame and plate, the
signed-off Main Street night plate, the Nugget, Thad, the Room 1 casting
master and Winnie's master all transmitted (`transmitted: true` in the
ledger row). Prompt: `proofs/room-05/prompts/night-plate-01.txt`. Lighting
only: every annotated rect phase-correlates at (0,0) against the DAY
candidate (`proofs/room-05/night-geometry-drift.json`, PASS).

**The DAY candidate is not rejected and not overwritten.** `plate-02/` stays
ROOM 5 — DAY VISUAL CANDIDATE (`DAY-CANDIDATE.md`), the source of the
composition, the geometry and Winnie's design.

**Not promoted, not selected by anything.** No content record names these
files; the night state loads through the explicit `?candidate=` override
(three swaps: plate, sheet, stand), which is how the night proofs drew it.
The day/night selection mechanism is errata 64d's and Q26's. `visual_accepted`
is unset and is Tyler's.
