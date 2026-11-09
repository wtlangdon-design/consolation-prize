# Scene B's art, handed back (reference/act3-seance/brief.md)

Two of `act3-seance`'s four operations spent (`art/staging/ledger.json`, attempts 1 and 2). Operations 3 and 4 are held
for corrections. Cut by `tools/art/act3-seance-cut.py` (re-runnable; the commands are in its docstring).

## `art/actors/room-16-seance-table.png` (operation 1): the séance, lamp lit

One cut-out: the round table under a wine-red cloth to the floor on every side (nothing shows beneath it), one
candle and one hand bell; Ozymandia at the head, eyes closed, the rod across her palms; four townspeople round it
(a woman in a bonnet, a young man, a grey-haired woman, a bald man); Frame in the front-left chair with his notebook.
No empty chair. Four frames of 876 x 456, `[2 + i*878, 2, 876, 456]`:

| Frame | |
|---|---|
| 0 | rest |
| 1 | breath, derived (the sitters above the table's far edge lifted a pixel; the cloth does not move) |
| 2 | the grey-haired woman glancing round at her neighbour |
| 3 | Frame tapping his pencil on his notebook |

Every frame is the rest frame with only the head or the hand that moves pasted in, so the table and everyone else are
the same pixels throughout. Drawn beside Thad at Room 16's man (450 px on the floor before the table); the sitters'
heads match his (`renders/room-16-seance-table-with-thad.png`).

## `art/actors/room-16-seance-table-dark.png` (operation 2): the lamp turned down

The same group in near-darkness, the candle the only real light, on operation 1's canvas and registered onto its
rest frame, so the group does not move when the lamp goes down (silhouettes 0.945 the same). Three frames of 876 x 456:

| Frame | |
|---|---|
| 0 | rest, in the dark |
| 1 | breath, derived |
| 2 | the séance turns: the bald man's head jerked up, eyes wide, and Frame writing hard |

## `art/props/room-16-seance-lamp.png` (operation 2): the hanging lamp

Two frames of 80 x 180 -- the plate's own lamp's size -- `[2, 2, 80, 180]` lit and `[84, 2, 80, 180]` turned down to
a bead. They are drawn to sit over the lamp already on the plate (x about 920, from the top).

## For the wiring

- **The plate's own table shows behind the group** (the crystal ball's table, the teapot and the strong box): the
  séance state wants the tent without it, or the group placed to cover it (`renders/room-16-seance-table-with-thad.png`).
- `renders/room-16-seance-table-dark-check.png` is the dark state with the plate simply dimmed, for the check only;
  how the room darkens is the main session's.
- Holding hands round the table reads only loosely: hands meet on the tabletop rather than clasped.
