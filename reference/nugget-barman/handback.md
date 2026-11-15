# The Nugget's barman: handed back (reference/nugget-barman/brief.md)

**The brief was not on main.** It is on `playthrough-fixes-7` (fd155300); it was read there and copied here beside
this hand-back, as the pianist's was.

**The operation.** On Tyler's instruction (2026-11-15) `art/staging/caps.json` has a new entry `nugget-barman`, cap 1,
quoting it. **Attempt 1 is spent; the asset has none left.** The ledger stood at 431 attempts and is 432 now; the
game's image spend is 4,369,231 billed tokens against `spendTokensTotal` 4,400,000. Nothing in `content/` or `docs/`
is touched, and nothing is wired.

- Inputs (`art/staging/nugget-barman/`): `template.png` (Thad's standing front frame on magenta, the ruler),
  `thad-at-the-bar.png` (the Nugget plate's bar with the three drinkers and Thad standing at it, at game size), and
  `nugget-bar-man@2x.png` (the bar man the style gate names as Thad's level). Prompt and spec:
  `reference/nugget-barman/op-1.txt`, `op-1.spec.json`. Raw sheet: `art/staging/nugget-barman/sheet.png`.
- Cut: `tools/art/nugget-barman-cut.py --write` (re-runs from staging to the same pixels).
- **`art/actors/room-03-barman.png`**, and in the room at game size, all four frames between `nugget_bar2` and
  `nugget_bar3` with Thad at the bar: **`renders/room-03-barman-in-the-nugget.png`**.

## The sheet

Four frames, cell **106 x 143**, the counter's edge on each cell's bottom row:

| Frame | Rect | Pose |
|---|---|---|
| 0 | `[2, 2, 106, 143]` | rest: polishing a glass with the towel |
| 1 | `[110, 2, 106, 143]` | polish B: the glass turned, the towel moved |
| 2 | `[218, 2, 106, 143]` | the glass set on the counter, his hand on it |
| 3 | `[326, 2, 106, 143]` | the action: looking along the bar, the glass at his chest |

Frame 3 changes well over the 10% `tests/movement.test.mjs` asks of an action. The towel is over his shoulder in
every frame; the glass is in his hand in 0, 1 and 3 and on the counter in 2.

## Where he stands

- **Anchor: room (1580, 515)**, the counter top's front edge; in the cell, **(53, 142)**, bottom-centre. Posture
  `band`, like the drinkers. The sheet is drawn bottom-centred on that point.
- **Height against the curve:** one scale (0.4447) for all four frames, set so the Thad drawn beside him on the sheet
  is the curve's standing man at y 560, **246.4 px** (`reference/room-03/annotation.json`; the brief's "about 243").
  His crown is at **y 373**; the band is **143 px**, crown to counter edge.

## Deviation from the brief -- for Tyler's eye

**Cut where his hands meet the counter, not where his feet would be.** The brief puts his hidden feet at y 560 and the
counter's edge at 515. A 246 px man drawn that way has the counter at his knees, his hands about 95 px above the
counter top, and frame 2's glass set down in mid-air. So he keeps the brief's height, and the band is cut at the row
where frame 2's set-down glass meets the counter: that row is put on y 515. His feet, were they drawn, would be at
about y 619, behind the counter's front. On the counter top itself (its back edge about 10 px above the front edge)
only the glass is kept; his apron stops at the back edge, so it does not lie on the counter as a white strip.

## Measures beside Thad (the gate flags; it does not decide)

On frame 0, at game size, against Thad's standing frame scaled to the same man and against `nugget-bar2`:

| | texture | contrast (luminance s.d.) |
|---|---|---|
| **the barman** | **11.41** | **62.5** |
| Thad, at this man's size | 6.60 | 32.3 |
| `nugget-bar2` | 3.29 | 24.5 |

## What missed -- no operation is left to correct either

1. **Too sharp.** He measures nearly twice Thad's texture and contrast: the gate's usual miss. In the room he reads as
   a crisper, harder-lit figure than the drinkers beside him (the render). A correction is a new operation, shown this
   render beside Thad, as the gate's step 4 says.
2. **Errata 111, a hand cloth.** In frames 0 and 1 he polishes with a second, smaller cloth in his hand as well as the
   towel on his shoulder; in frames 2 and 3 that hand cloth is gone. The shoulder towel holds in all four. If the
   wiring plays 0 and 1 as the idle and 2 and 3 as the rarer actions, the cloth vanishes each time he sets the glass
   down.

## Checks

All 67 checks and all 1,927 tests pass on this branch.
