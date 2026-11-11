# Winnie's walk, with the skirt lifted: handed back (reference/winnie-walk-2/brief.md)

**Budget.** `winnie-walk-2`, cap 2: **both spent** (ledger: winnie-walk-2 attempts 1 and 2). The first as briefed, the
second the brief's one correction. `caps.json` not changed.

- `art/staging/room-05/second-ledger/walk2/sheet-04.png` -- attempt 1, from `walk-04.spec.json` as written.
- `art/staging/room-05/second-ledger/walk2/sheet-04-fix.png` -- attempt 2, the correction (`walk-04-fix.txt`,
  `walk-04-fix.spec.json`; attempt 1's sheet sent as the template, kept as `last-try-04.png`). **Use this one.**

Not cut into `art/actors/`.

## The checks the brief asks for

Both sheets: her standing figure first, then six frames walking left in profile, her front hand gathering the skirt at
the hip, the hem lifted to the ankle, both boots and dark stockings showing.

| | attempt 1 | attempt 2 (fix) |
|---|---|---|
| frames 2 and 5: different boots forward, a clear gap | yes | yes |
| frames 4 and 7: boots together | yes | yes |
| feet pass in both halves (walk test, narrowest spread under 60% of the widest) | yes (46%, 45%) | yes (35%, 33%) |
| consecutive frames' overlap below the hem (walk test, mean under 60%) | **62%: fails** | **51%: passes** |

Measured both on the raw sheet and after a trial cut with `tools/art/second-ledger-walk.py`'s own steps (pointed at the
new sheet, its frames in drawn order, output to scratch, nothing written to `art/actors/`).

**Why the correction:** in attempt 1 the "down" frames (3 and 6) were the contact frames again -- the same open stride
and boots -- so frames 2-3 shared 92% below the hem and the mean failed. The correction asked for each down frame to
differ: the front boot flat under her, the back heel up on its toe, the back knee bent. It did.

## For the cut

- **Height: short again, about 6%.** Her standing figure is 403 px on the sheet; the walkers are 375-380. The cut's
  one factor fixes it (to 518, as before).
- **The order changes.** `second-ledger-walk.py`'s `ORDER = [0, 2, 3, 1, 2, 3]` was built for the old sheet, whose
  frames were five strides and one feet-together. This sheet is drawn in a walk's order: use `[0, 1, 2, 3, 4, 5]`,
  and its `SHEET` becomes `walk2/sheet-04-fix.png`.
- Her skirt's grade (`GRADE`) was measured on the old sheet; check it against this one.
