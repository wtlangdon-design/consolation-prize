# Scene A's art, handed back (reference/act3-hearse/brief.md)

Two of `act3-hearse`'s four operations spent (`art/staging/ledger.json`, attempts 1 and 2). The two reserve
operations are not spent.

## Operation 1 · `art/actors/room-14-hearse-grievance.png`

The hearse and Grievance as ONE cut-out (she is hitched to it), facing RIGHT, up the hill. Four frames of 950 x 387,
in a row with 2 px between (`[2 + i*952, 2, 950, 387]`), bottom-centred like every ambient sheet:

| Frame | |
|---|---|
| 0 | rest: her head turned back a little toward the hearse; she is not fooled |
| 1 | breath, derived (her rows above the barrel lifted one pixel; the hearse does not breathe) |
| 2 | her head turned fully back, looking at the hearse |
| 3 | a front hoof lifted, stamped once |

- The coffin is INSIDE: the end of a pale pine coffin shows where the drawn curtains don't meet. No trestles, no lid, no ground.
- The hearse is pixel-identical in all four frames (cut from frame 0); only she moves.
- **Size:** drawn at Room 14's man at the gate, 298 px. Her withers are 244 px, 0.82 of him (`content/scale-anchors.json`'s mules, 0.77-0.91). Her ear tips are 301 px over her hooves, 1.01 of him, below the anchors' 1.10-1.35 for ears: the generator drew her ears short against her withers, and the brief sets the withers. A scale anchor for this figure would flag the ears. The hearse stands 1.3 men tall.
- **Light:** Room 14's night, no blue rim (`renders/room-14-hearse-grievance-at-the-gate-with-thad.png`).
- **Where it can stand:** Pike's obelisk and the lilies sit at the front of the plate at x 540-720, and the hitch is 906 px long, so it cannot stand in the gate itself without covering them (Tyler, 2026-11-09, flagged the first check render doing exactly that). The check render stands it on the open grass right of the monument, hooves at y 792, the gate behind it. Staging is the main session's.
- **Key spill:** the cutter's despill left magenta in the thin pockets between the wheel spokes and in the plume. Both cut tools now pull out any pixel whose red and blue stand above green together, and refuse to write a sheet with any left.
- **The brief also asked** for the plaited black ribbon in her mane. It did not come out visibly; the plume and harness did.
- Cut by `tools/art/act3-hearse-cut.py` (re-runnable from the staging sheet).

## Operation 2 · `art/actors/room-14-mourners-bowed.png`

Room 31's seven mourners at their existing drawn size, in frames the size of `funeral-mourners.json`'s (443 x 403),
`[2, 2, 443, 403]` and `[447, 2, 443, 403]`:

| Frame | |
|---|---|
| 0 | heads bowed, eyes shut |
| 1 | the same, the young man in spectacles at the right peeking |

Registered on the group's legs to its shipping rest frame (frame 0 of `art/actors/room-31-mourners-master.png`), so
they can be appended to that sheet or used as their own. Cut by `tools/art/act3-mourners-cut.py`.

## Not done here

The wiring: ambient records, Room 14's procession state, staging, tests. The art is under `art/actors/` only; nothing
in it needed a separate prop.
