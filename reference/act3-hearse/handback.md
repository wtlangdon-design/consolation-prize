# Scene A's art, handed back (reference/act3-hearse/brief.md)

All four of `act3-hearse`'s operations are spent (`art/staging/ledger.json`, attempts 1 to 4). The cut-outs are operations 1 and 2.

**Attempt 3 (a reserve, Tyler: "Go with your recommendations") is NOT used.** A masked edit of operation 1's sheet
to lengthen her ears and plait the ribbon in: the ears came out right, but the mask let it repaint her whole head and
it turned every head to face the viewer, losing frame 2's look back at the hearse (the scene's "not fooled"); the
ribbon still did not appear. The sheet is kept in `art/staging/act3-hearse/op-3/` for the record.

**Attempt 4 (the last, Tyler: "Retry, ears only") is NOT used either.** The mask was cut to the ears and the air above
her head only, her face outside it; the generator repainted the whole head anyway, every row facing forward alike,
and dropped the plume. A masked edit does not hold this generator to the mask. Lengthening the ears by hand on the
cut-out was tried and set aside: her ears stand clear of the plume in frames 0 and 1 but are mostly behind it in 2
and 3, so a stretch would make them change length between poses.

**So her ears stay short (1.01 of a man against the anchors' 1.10-1.35).** Wiring her with a scale anchor needs that
recorded as an exception (and in `proofs/check-friction.json` if a check is loosened for it).

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
