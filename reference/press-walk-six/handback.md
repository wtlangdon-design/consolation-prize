# Frame's walk, as six frames: the art, handed back (reference/press-walk-six/brief.md)

**Budget.** The operation `press-pull` held in reserve: **operation 4 of its cap of 4 is spent**
(`art/staging/ledger.json`, press-pull attempt 4, a derived state of attempt 1). `press-pull` has none left. Nothing new
was taken from the fifteen; the night's spend stays at 6 of 15 new operations, plus this held one. Nothing was written
and nothing in `content/` was touched.

## `art/actors/room-09-frame-walk.png` -- overwritten with six frames

Ignatius Frame walking to the left in profile, one full cycle, posed on Thad's own six-frame walk to the left
(`art/actors/thad-walk-left`, attached as the pose guide, as WALK-C posed Deke's), drawn on a template of his rest frame
(the ruler) and operation 1's passing frame six times (the man): **contact, down, passing, contact on the other foot,
down, passing.** Apron, rolled sleeves, pencil behind the ear; his notebook in the same hand in every frame.

- **Frames `[2 + i*329, 2, 327, 502]`, i = 0..5**, bottom-centred, soles on row 501 in every frame. Cut by
  `tools/art/press-pull-cut.py --write` (despilled, snapped to one level at his man), one scale for all six (1.035),
  his tallest frame 502, his standing height; the others 495-501.
- **The cell is 327 wide, not the brief's 269.** Each frame is seated on its torso (15-45% down the figure, the method
  of `tools/art/walk-c.py`), so the body travels steadily and the legs do the walking; seated that way, operation 4's
  long contact strides reach 162 px either side of the torso, and 269 does not hold them. The engine draws
  bottom-centred, so the wider cell does not move him; the wiring's frame rects change from 269 to 327.
- **Checked against `tests/walk-gait.test.mjs`'s own measures** (it cannot see this sheet until the wiring declares
  it): the feet pass in both halves (narrowest spread 39% and 40% of the widest, under 60%), and consecutive frames
  share 20% of their silhouette below the hem on average (under 60%).
- His two legs are the same dark trousers, so which leg leads cannot be told by eye at game size; the frames copy
  Thad's, whose legs alternate. If the wiring's test or Tyler's eye finds the same leg leading both strides, nothing
  is held to redraw it.
- Beside Thad in the Clarion: `renders/room-09-the-press-pulled-with-thad.png`, top panel (the six frames along his
  path, Thad standing to talk).

Operation 1's four frames are superseded; its sheet stays in staging. The other two press-pull sheets
(`room-09-frame-stood-back.png`, `thad-haul-right.png`) are unchanged: re-running the cut reproduces them bit for bit.
