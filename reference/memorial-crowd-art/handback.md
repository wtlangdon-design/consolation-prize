# The mourners on Boot Hill, redrawn: handed back (reference/memorial-crowd-art/brief.md; errata 376)

**The brief was not on main.** It is on the branch `memorial-crowd-brief` (1d8c811b). The brief and its two reference images are copied here from it. That branch's `docs/00-errata.md` change is not.

## Spent

On Tyler's instruction (2026-11-18), `art/staging/caps.json` has a new entry, `room-14-memorial-crowd`, cap 2, quoting him: "Redraw the mourners".

**One operation is spent:** room-14-memorial-crowd attempt 1, at high quality, 9,376 billed tokens.

**The second was not spent.** The first did not miss on head size or style, which was the condition Tyler set for using it.

**Ledger:** 471 attempts and 4,823,314 tokens against 4,840,000.
- About 16,700 tokens are left, under the guard's 20,000 floor, and the attempts are at their cap of 471.
- So a second operation would need both ceilings raised first.

**Nothing is wired.** Nothing in `content/` or `docs/` is touched, and the shipping sheet `art/actors/room-14-town-coming-down.png` is not changed.

## What was drawn

The same seven mourners, in the same clothes, places and rest pose:
- **back row:** the young man holding his hat at his chest, the man with the black moustache, the grey-bearded old man, the young man in spectacles;
- **front row:** the woman in the black bonnet, the old woman in the grey shawl on her cane, the young woman in the black hood;
- all turned a little down the hill.

They are redrawn to Thad's look: about seven heads tall, small heads, plain softly shaded faces, flat colour.

**Inputs:**
- the old frame 0 at 2x, laid out in place (`art/staging/memorial-crowd/template.png`);
- the scene as it is, `boot-hill-memorial-as-it-is.png`;
- Thad's ruler frame.

Prompt and spec: `reference/memorial-crowd-art/op-1.txt` and `op-1.spec.json` (`tools/art/char-op.mjs`, quality high). Raw output: `art/staging/memorial-crowd/op-1.png`.

## The cut: `tools/art/memorial-crowd-cut.py --write`

**`art/staging/memorial-crowd/rest-cut.png`** is the rest frame, ready to become frame 0.
- **Height:** one scale (0.5878) makes the group exactly as tall as the old frame 0 (rows 8-402), with the soles on the old sole row.
- **Position:** it is centred as the old group was.
- **Pixel level:** it is snapped to the one level at the record's figureHeight (350, block 3.04), and the rim is cleaned of key.
- **Colour:** nothing is regraded.

**The cell widens 443 → 473.** The redrawn group stands a little wider (465 px against 429). The cell is widened evenly about its centre, so the group does not move and nobody is clipped.

## For the wiring (`content/ambient/memorial-town.json`)

- **Frame 0:** `rest-cut.png` becomes frame 0 of `art/actors/room-14-town-coming-down.png`, cells **473 x 403**.
- **Other frames:** the record's other four frames are derived from it, as the brief says: frame 1 a breath, and frames 2-4 with a different two or three of them shifting their weight (`tools/rig/room04-idles.py`'s method). So is the mirrored copy the gate scenes use.
- **figureHeight:** unchanged (350), because the group's height is kept. Re-check it with `tools/solve-figure-height.mjs` once the record has its new frames.
- **The collection plate** (`collection_plate`, a room prop at 1000, 828) still sits in front of the bonneted woman. Her hands are a little higher than before, and in the render the plate reads as held at her waist. Move it up a few pixels if it should sit in her hands.

## Render

**`renders/room-14-memorial-crowd-in-the-scene.png`** shows the memorial as the game composes it, before (above) and after (below):
- Thad;
- the Reverend (`sowerby_gate`);
- the obelisk;
- Fanshawe (`memorial-fanshawe`, as on main);
- the collection plate;
- the mourners.

Before, the men's heads were about 1.4 times Fanshawe's; now they are his size.

## Measured (rest frame at game size)

| | texture | contrast | mean light |
|---|---|---|---|
| before | 4.11 | 27.3 | 37.6 |
| **after** | **4.22** | **27.8** | **43.2** |
| Thad, at this man | 5.60 | 32.7 | 60.1 |

## Not in this picture

As the brief says, these keep their current drawings:
- the same mourners at the gate and bowed (`room-14-mourners-at-gate.png`, `room-14-mourners-bowed*.png`);
- the Reverend.
