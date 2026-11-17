# The duel crowd, and Rooms 33 and 34: handed back (reference/duel-and-caves-art/brief.md)

## Part A: not run

Part A (the duel crowd and Fanshawe in the street) was not asked for in this session. Nothing of it is drawn.

## Part B: Rooms 33 and 34, under Prosperity

### Spent

On Tyler's instruction (2026-11-17), `art/staging/caps.json` has these changes, each quoting him:
- four new entries, each with cap 2: `room-33-redraw`, `room-33-after`, `room-34-redraw` and `room-34-after`;
- `spendTokensTotal` raised by 100,000, from 4,625,000 to 4,725,000;
- `attemptsTotal` raised by the eight operations he authorized, from 451 to 459.

**Five of the eight operations are spent**, 41,556 billed tokens:

| Item | Asset | Attempt | Tokens |
|---|---|---|---|
| 1 | room-33-redraw | 1 | 4,477 |
| 1, at high quality | room-33-redraw | 2 | 9,676 |
| 2 | room-33-after | 1 | 8,816 |
| 3 | room-34-redraw | 1 | 9,742 |
| 4 | room-34-after | 1 | 8,845 |

- **Ledger:** 454 attempts and 4,622,994 tokens against `spendTokensTotal` 4,725,000, so about 102,000 is left.
- **Corrections in hand:** items 2, 3 and 4 each still have their second operation; item 1 has none left.
- **Nothing wired:** nothing in `content/`, `docs/` or `art/backgrounds/` is touched. The main session wires it.

Prompts and specs are `reference/duel-and-caves-art/<item>-op-<n>.txt` and `.spec.json`. Each redraw was given:
- the current plate in the generator's frame (`art/staging/duel-and-caves-art/<room>/current-plate.png`);
- Prosperity above (`prosperity-above.png`) for the pixel size;
- the hotel table lamp from Thad's room, enlarged (`hotel-table-lamp.png`).

Each after-plate was given its new plate and the current after-plate, and asked for the old plate's differences only.

### Item 1's correction, and a tool change

- **The miss.** Attempt 1 kept the composition and drew the hotel lamp, but its pixel was no finer than the old plate's, and the floor was still mottled.
- **The cause.** The API had chosen **low** quality on its own: 343 output tokens. The last six operations in the ledger before this brief came back at 343 or 158 as well.
- **The tool change.** `tools/art/char-op.mjs` now takes an optional `quality` in the spec, and records it in the ledger's `parameters`.
- **The fix.** Attempt 2 and every operation after it ran at `"quality": "high"` (5,488 output tokens, about 9,000 billed each). That is what gave the finer grid.
- **For later briefs.** Set `"quality": "high"` from the start for any whole plate. At the API's own choice, an operation can come back coarse.

### The four plates

`node tools/art/duel-and-caves-plates.mjs` derives each from its source by the standard fixed-room derivation (errata 63: crop x 8-1528, y 170-854, to 1920 x 864). Each is written beside its source, not over the shipping plate:

| Shipping path (untouched) | Candidate |
|---|---|
| `art/backgrounds/room-33-listening-chamber.png` | `art/staging/duel-and-caves-art/room-33/room-33-listening-chamber-1920x864.png` |
| `art/backgrounds/room-33-listening-chamber-after.png` | `art/staging/duel-and-caves-art/room-33/room-33-listening-chamber-after-1920x864.png` |
| `art/backgrounds/room-34-under-prosperity.png` | `art/staging/duel-and-caves-art/room-34/room-34-under-prosperity-1920x864.png` |
| `art/backgrounds/room-34-under-prosperity-after.png` | `art/staging/duel-and-caves-art/room-34/room-34-under-prosperity-after-1920x864.png` |

To wire one, the main session copies it over its shipping path.

**Before and after:** `renders/room-33-34-redraw-before-after.png`. Each row shows the old plate on the left and the new one on the right: 33, 33 after, 34, 34 after.

1. **Room 33, the listening chamber.**
   - The same chamber of rounded stones, tunnel mouth at the left, the lamp on the floor at about the middle (it moved about 20 px up).
   - The pixel is about half the old size. There is no checker dither, and the floor is smooth earth.
   - The lamp is the hotel's glass-chimney table lamp, lit.
2. **Room 33 after.**
   - An edit of the new 33, with the opening broken through right of centre in the old after-plate's place and a little rubble below it. The opening is a touch larger than the old one.
   - 1.3% of the picture differs from the new 33; everything else matches.
3. **Room 34, under Prosperity.**
   - Everything is where it was: the shaft and rope at the left, the stump with the lamp and the tuning fork, the timber frame (two posts, cap beam, braces), the back wall, and the rock face and tunnel at the right.
   - The finer pixel, no checker dither, and the hotel lamp on the stump.
4. **Room 34 after.**
   - An edit of the new 34: the gold seam runs diagonally across the right rock face, and the old barn lantern hangs on the left post, both in the old after-plate's places.
   - 1.4% of the picture differs from the new 34.

**Click areas:** `renders/room-34-redraw-after-with-hotspots.png` draws Room 34's hotspot rectangles on the new after-plate.
- Each object is still inside its area: lamp, tuning fork, old lantern, seam, timbering, rock face, tunnel, walls, floor.
- **One to check when wiring:** the new lamp's glass chimney is taller than the old lantern and rises about 30 px above the `lamp` rectangle (y 442). Its body and flame are inside it.
- Room 33 has one area, `every_rock_surface`, which still covers it.

### For Tyler's eye

- **Light.** The new plates are lighter overall: mean light 26.7 against 14.7 for Room 33, and 26.3 against 19.2 for Room 34. Their light is more even, and the pool of lamplight on the floor is softer. If the caves should stay as dark as they were, the main session can darken them without an operation.
- **The lamp's size.** The hotel lamp is taller and slimmer than the barn lantern it replaces. Judge whether it reads at Thad's scale when he stands beside it.
- **The tuning fork.** On the stump it is a small silver shape, as small as the old one; it does not read clearly as a fork at this size.
