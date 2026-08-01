# Which Room 1 elements must move, and what currently stops them

Measured against the composed frame, not inferred from the code.

## The mechanism that exists

The engine already animates sprites over a background with positions owned by
the room file. `RoomData.idles` carries `{ sheet, figures[] }`, and each
`IdleFigure` declares `at` (feet, centred), `height`, `kind`, `rate`, `phase`
and its two source rects in the room's idle sheet. The Nugget's crowd uses it:
four animated figures of eleven, phase-offset, rates 0.3–0.8 Hz.

**Room 1's JSON has no `idles` block at all.** Everything that moves in Room 1
is either baked into the background or is the coach object layer.

## What is separable today

| Element | State | Evidence |
|---|---|---|
| **The coach and team** | **Separable, works** | The object layer differences cleanly out of the two composes: 5,947 px, bbox x 153–305, y 43–108. It leaves, and the team and the light it throws leave with it, because the layer is the *difference* between the two composes rather than a redraw. |
| **Hob** | **Baked into the background** | No compose flag removes him. He is drawn by `room01/hob.py` straight onto the shared canvas. |
| **His lantern flame** | **Baked, but cycles in place** | 21 px in the reserved `accent_gold` 4–7 band, inside `LAMP_BOUNDS` x 80–95 / y 76–91. The engine rotates those four entries at 0.6 Hz, so the flame lives without moving. |
| **His light pool** | **Baked, and it is the blocker** | `compose(lamp_x=140)` changes **5,293 pixels across x 57–319**. The pool is not a decoration on the ground; it *is* the ground for a third of the frame's width. |
| **The road puddles** | **Baked, cycles in place** | 412 px in `accent_indigo` 2–4, rows 104–143. Shimmer without motion. |
| **Room 33's lamp / errata 35d's swing and graze** | **Parameterised in the compositor only** | `compose(swing=…, graze=…)` produces the ambient GIF. The engine never sees those parameters; it loads one PNG. |

## The problem, stated exactly

Hob's *figure* could become an `IdleFigure` tomorrow — he is a 17 × 36 sprite
and the mechanism is built. **His light cannot.** A carried lamp modifies 5,293
pixels of ground, and the engine composites sprites *over* a finished
background; it has no way to modify the background underneath one.

So the current room supports **a man who stands where his pool is painted**.
Doc 17 has him walk onto the road once, and the pool is authored at the
position he ends at, so the room as designed is consistent — but it is
consistent by not moving him, not by being able to.

## Three ways a carried lamp could work

**A. He does not move.** What the design already assumes. The pool is baked at
his standing mark, he becomes an `IdleFigure` with a two-frame idle so he
breathes, and his one walk-on is a scripted sequence over a background that
already has the destination pool. Costs nothing, changes nothing, and is the
honest reading of doc 17. **Recommended unless the design wants him walking.**

**B. Background variants, one per lamp position.** The compositor *already*
takes `lamp_x` and produces a correct pool for any value — that work is done.
N backgrounds at ~7 KB each is cheap, and the engine would swap background by
index. Needs a room-schema field (`lampPositions` or similar) and an engine
change to select among them, so it is out of scope for this run but small.

**C. A runtime light pass.** The engine gains a radial modifier applied to the
background before sprites, fed by `lightSources` — which Room 1's JSON already
declares and nothing currently reads. This is the general answer, it would
serve every lamp, stove and doorway in the game, and it is a real engine
feature rather than a room fix.

**The pool's falloff is already a fitted function** — `L(ρ) = 27 + 97/(1 +
(ρ/6.2)²)`, ρ elliptical at 2.4:1, residual under 3 luminance — so C has its
maths done. What it needs is somewhere to run.

## The thing to decide before Room 1 ships

Not "can Hob move" but **"does Hob move"**. If the answer is no, the room is
finished as built and only needs its `idles` block so he breathes. If the
answer is yes, that is an engine feature and it should be scoped as one rather
than discovered when somebody tries to walk him.
