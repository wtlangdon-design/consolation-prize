# The mourners bowed in prayer, redrawn from their new rest frame (errata 378)

For the image session. **No operation is spent until Tyler pastes the prompt below into it.** The ledger is at 480 attempts against 483 and about 58,000 tokens under the ceiling (reference/sowerby-art/handback.md), so one drawing and one correction fit without raising either.

## Why

Tyler, 2026-11-18, after the memorial's mourners were redrawn to Thad's proportions (errata 376, 377) and he was shown everyone else drawn with bigger heads: "I think just the Act III mourners to match the previous mourners."

Two of the three Act III sheets needed no drawing. The graveside sheet was always the memorial's drawing, and the gate's is the same drawing mirrored, so both are now the new drawing (errata 378). The third is the prayer at the gate (`T_HILL_PRAYER`): the same seven with heads bowed and eyes shut, and one of them peeking. It was painted on the old rest frame (act3-hearse operation 2), so it still has the old, bigger heads, and for the length of the prayer the group swaps back to them.

See:
- `art/staging/act3-mourners-bowed/rest-as-redrawn.png`: the new rest frame, the drawing the prayer must match.
- `art/staging/act3-mourners-bowed/bowed-as-it-is.png`: the bowed frame as it is (old heads), for the pose only.
- `art/staging/act3-mourners-bowed/graveside-with-redrawn-mourners.png`: the new group at the graveside with Thad, the Reverend and Hob, at game size.

## What

**One picture on a template of the new rest frame (errata 144's method, as act3-hearse operation 2 did):** three rows of the same seven people in the same clothes and the same places:
1. the group exactly as in `rest-as-redrawn.png` (the ruler the cut registers on);
2. heads bowed and eyes shut, hands clasped or hats held at the chest;
3. the same as 2, except that the young man in spectacles (back row, right) has lifted his head a little and is peeking.

- Change nothing but heads, eyes and hands. Bodies, feet and clothes stay where they are in row 1, so nothing jumps when they bow.
- Thad's proportions as in the rest frame: small heads, softly shaded, flat colour, low texture, no brighter than Thad.
- On flat magenta (#FF00FF).

The main session cuts rows 2 and 3 into `art/actors/room-14-mourners-bowed.png` (the unmirrored source) at the new cell size, 473 by 403. It mirrors them into `room-14-mourners-bowed-at-gate.png` for the gate and wires them. `tests/hearse.test.ts` holds the registration and the mirroring.

**Not in this picture:** the undertaker, Hob, Pratt, Frame, the duel crowd and the rest of the cast whose heads are also bigger than Thad's. Tyler kept this to the mourners.

## Paste this into the image session

> Read `reference/act3-mourners-bowed/brief.md` on main and draw it. Add a cap entry to `art/staging/caps.json` for asset `act3-mourners-bowed`, cap 2, quoting Tyler: "I think just the Act III mourners to match the previous mourners". Use `art/staging/act3-mourners-bowed/rest-as-redrawn.png` as the template and `bowed-as-it-is.png` and `graveside-with-redrawn-mourners.png` as references. Generate the three rows at high quality; spend the second operation only if the first misses on head size, style or registration. Put the result on a new branch named `act3-mourners-bowed` with a `reference/act3-mourners-bowed/handback.md` saying what was spent. Show me the bowed group beside the rest frame, and do not wire anything: the main session wires it.
