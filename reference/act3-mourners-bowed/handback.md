# The mourners bowed in prayer, redrawn from their new rest frame: handed back (errata 378)

Tyler, 2026-11-18: **"I think just the Act III mourners to match the previous mourners."** This hand-back answers the brief beside it (`brief.md`). **Nothing is wired;** the main session wires it.

## Budget

`art/staging/caps.json` has a new entry, `act3-mourners-bowed`, cap 2, quoting him. No ceiling is raised.

**One operation is spent, 9,712 billed tokens.** It met the brief on head size, style and registration, so **the second operation was not used** and remains in hand.

The ledger is at 481 attempts against `attemptsTotal` 483, and 4,921,430 tokens against 4,970,000 (about 48,500 left).

## The drawing

**Operation 1** (`op-1.txt`, `op-1.spec.json`, high quality) was given:
1. **the template** (`art/staging/act3-mourners-bowed/op-1/template.png`): `rest-as-redrawn.png` three times side by side, full size, 500 px apart, on magenta;
2. **`bowed-as-it-is.png`**, for the praying pose only (its heads are the old, bigger ones);
3. **`graveside-with-redrawn-mourners.png`**, the group beside Thad and the Reverend at game size.

**Three groups side by side, not three rows.** The brief says "three rows" and names act3-hearse operation 2's method. That operation laid its three groups side by side in one row, and `tools/art/act3-mourners-cut.py` cuts exactly that layout. So this drawing follows it, and the existing cut tool takes it unchanged.

It returned (`art/staging/act3-mourners-bowed/op-1/sheet.png`):
1. the first group as in the template, the ruler the cut registers on;
2. all seven with heads bowed and eyes shut, hats and hands at the chest, the old woman on her cane;
3. the same, except that the young man in spectacles (back row, right) has lifted his head and is peeking.

**Heads** stay the new, small size, bowed or lifted. **Bodies, feet, clothes, the two hats and the cane** stay where row 1 has them.

## The cut, for the wiring

`tools/art/act3-mourners-cut.py` now takes two optional arguments. With neither, it behaves exactly as before:
- `--sheet` points it at another three-group drawing;
- `--out` writes somewhere other than the shipping sheet.

The cut was run as:

```
python3 tools/art/act3-mourners-cut.py --sheet art/staging/act3-mourners-bowed/op-1/sheet.png \
    --out art/staging/act3-mourners-bowed/op-1/bowed-cut.png --write
```

It reported `{"despilled": 90, "restRows": 395, "cut": [395, 395], "block": 3.14, "frames": [[2, 2, 473, 403], [477, 2, 473, 403]], "shippingFrame": [473, 403]}`.
- **Frames:** both are exactly the new cell size, 473 x 403, and nothing grew.
- **Order:** frame 0 is bowed with eyes shut; frame 1 is the one peeking.
- **The result:** `art/staging/act3-mourners-bowed/op-1/bowed-cut.png`, the unmirrored source.

**To wire it,** run the same command with `--out art/actors/room-14-mourners-bowed.png` (or copy the cut there). Then mirror it into `room-14-mourners-bowed-at-gate.png` for the gate, as errata 378 says. `tests/hearse.test.ts` holds the registration and the mirroring.

**`art/actors/` is untouched on this branch.**

## Measured against the shipping rest frame (`room-31-mourners-master.png` frame 0)

| | lower-body outline overlap (IoU) | lower-body colour moved | soles row | mean light | contrast |
|---|---|---|---|---|---|
| rest (shipping) | | | 402 | 43.1 | 27.9 |
| bowed, eyes shut | 0.902 | 3.9% | 402 | 43.6 | 25.4 |
| bowed, one peeking | 0.896 | 6.7% | 402 | 44.3 | 26.1 |
| the old bowed frame, for comparison | | | | 40.0 | 27.4 |

- **"Lower body"** is everything below 45% of the figure's height, under the heads and shoulders.
- **The whole figure** changes on 17-18% of its pixels: the heads, faces and hands. So the frames clear `tests/movement.test.mjs`'s 10% for an action.
- **Nothing jumps:** the soles stay on the same row, and the light is the rest frame's.

## What to look at

**`renders/act3-mourners-bowed-beside-rest.png`**: the shipping rest frame, then the bowed frame, then the peeking frame, side by side at 1:1.

## For Tyler's eye

- **The peek.** The young man lifts his whole head a little, and his spectacles catch it. He does not open one eye with his head down. The brief asks for "lifted his head a little and is peeking".

## Checks

- All 67 checks pass.
- All 2,092 tests pass.
