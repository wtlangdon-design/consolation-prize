# ROOM 3 — THE TWO REJECTED SHIPPING DEFECTS, REPAIRED

**Owner rejection** (Tyler, 2026-09-12). Phase 2A was not accepted. Rechecked in the deployed
build; both defects still plainly visible. *"This is not a subjective maybe."*

**Zero image operations.** Ledger stays **49**; operations 50 and 51 remain withdrawn and
unavailable. Every pixel written here is copied from a source already in the repository.

| | |
|---|---|
| BEFORE | `art/staging/room-03/rebuild-04/plate-room-03-recomposed.png` `93fc4a60cd16e5f375560f236139a081fe573c7cd2236445a90a79df5014c755` |
| AFTER | `art/staging/room-03/rebuild-05/plate-room-03-repaired.png` `713e6580060d69a57fcd9f21bc1bad9123ccef2953aa09f857e69f4ff62b88c6` |

14,244 pixels changed, in two regions and nowhere else:

| region | pixels | bounding box |
|---|---|---|
| A — the stove-side bar end | 2,231 | x 1158–1194, y 366–566 |
| B — the foreground bar man | 12,013 | x 1616–1816, y 284–799 |

---

## 1 · Provenance, traced before anything was written

**Defect A did not come from the rebuild.** Block-mean `|current − corrected-03/plate-cold-dirt.png|`
over the terminus is **0.3–5.1 at x 1160–1180 for every row band** and 8–40 from x 1180 rightward.
The room left of x 1180 is the accepted plate, untouched. So the dissolve is in the **source
generated plate** and each step since has carried it forward — and `rebuild-04/empty.json` says so
in as many words: `"terminus": "OPEN -- not repaired in this pass"`.

> **The authoritative pixels for A** are therefore the CURRENT rebuilt bar's own material from
> x 1189 rightward, and the current plate's own untouched wall and floor from x 1160 leftward.
> `bar-rebuild-01/canvas.png` was **rejected as a source**: it is in register, but it carries its
> own stool at x ≥ 1190 which this composition does not have.

**Defect B came from the recomposition's matte.** `nugget-bar-recompose.py`:

```python
core  = gaussian_filter(poly, 5.0) > 0.80      # taken as CERTAINLY him
outer = gaussian_filter(poly, 2.0) > 0.12
alpha = core | (outer & (d > T_EDGE))
```

`poly` is a **generous 42-point bound drawn to contain him, not to trace him** — its left side sits
at x 1619–1628 where his trouser is at x 1650. `core` takes everything inside it unconditionally,
so a 15–30px ring of his old surroundings — bar panelling, kick-board, dark floor — travelled with
him when he was composited 82 rows down. That ring is the halo.

## 2 · Defect B — a restore, not a rematte

His accepted pixels are **not recomputed**. The repaired plate is the current plate inside a
traced 54-point silhouette and `rebuild-04/plate-room-03-empty.png` outside it — the clean room
that was already reconstructed for this exact geometry in step A of the same rebuild. So:

> **every pixel of the man the owner accepted is byte-identical by construction**, and the halo is
> replaced by room rather than by a repair of a repair.

**Measured, not asserted**: 64,777 human pixels, `sha256(before) == sha256(after) ==`
`a22dd6bfca73f2f6fee4e1c56e7006a7fef6efc6d7ef98f40201546d526ba19a`.

The two authored contact shadows are re-laid on the clean dirt at `nugget-bar-recompose.py`'s own
centres and radii — `(1675, 782) r 40×9` and `(1748, 777) r 46×10`, multiplied at 0.45, never over
him. They come back because the restore removes them with the halo, not because they were redrawn.

**The traced silhouette caught its own error.** The first trace stopped at x 1726 and the preview
staged his entire right boot for removal. Measured at 6×, his right boot runs to x 1785 and the
brass rail beyond x 1790 is the room's. The outline was corrected before a pixel was written —
which is what the preview is for.

## 3 · Defect A — cut back to the end the bar already has

Read at 9–12×, **the bar already has an end**: the counter's lit nosing starts at (1189, 382), a
dark end edge runs from (1188, 398) to (1203, 425), and the front face carries a moulded stile at
x 1193–1196 from y 480 to 545. Two things run *past* it and fade, and they are the whole defect:

1. **The nosing smears left** over the flat blue-grey wall behind.
2. **The foot rail outruns the bar** to x 1178 — eighteen pixels beyond the stile, with no bar
   above it, thinning into bare dirt.

Both are cut back to that stile. **No new architecture is drawn**: the bar keeps exactly the end it
was built with, and the terminus becomes one line instead of three ragged ones.

**The numbers that say it worked.** Warmth (R−B) across the wall band y 378–390:

| x | 1176 | 1180 | 1184 | 1188 | 1192 |
|---|---|---|---|---|---|
| rejected | 1.0 | 6.6 | 13.6 | 17.9 | 25.4 |
| repaired | 1.0 | −0.8 | 0.5 | 0.4 | 25.4 |

The counter now **begins** at x 1192 instead of smearing in from x 1178, and the clamp lost nothing:
at x ≤ 1176 the wall was already neutral. Rail peak luminance at x 1190 fell from **70.3 to 44.7**,
which is floor level.

**The fill is a short registered translation, and both sources were read before being used.** The
nosing band comes from x −30 (flat wall carrying the same dark horizontal line at y 391, stopping
clear of the stove at x 1125); the rail band from x −44 (open dirt at the same rows, whose own peak
luminances there are 56–67 — the same range as the floor it replaces, so it reads as ordinary
mottling and not as a patch).

> **A first attempt was reverted for being exactly the failure this project has rejected before.**
> It moved a 60px block of floor across from x −60 and brought the wall base and a stray object
> with it, and read as a pasted rectangle with a tonal step. It was seen, measured and thrown away
> rather than shipped.

## 4 · What was not allowed to move — asserted, not described

`tools/retrofit/nugget-shipping-gate.py`, every line of it a comparison:

```
CHANGED OUTSIDE THE TWO AUTHORISED REGIONS: 0

PASS  card_1 0 px          PASS  the abandoned hand 0 px      PASS  the stove man 0 px
PASS  card_2 THE CARD SHARP 0 px   PASS  Deke's empty fifth place 0 px   PASS  the landing man 0 px
PASS  card_3 0 px          PASS  bar_1 THE ONE-STRIKE MAN 0 px PASS  the piano 0 px
PASS  card_4 0 px          PASS  bar_2 0 px                    PASS  the spittoon 0 px
                                    PASS  the bar, right of the repair 0 px
```

Each repair band is **hard-clamped in x** so a feather cannot reach a protected box. The nosing
band stops at x 1178 on its left because the **stove man's** declared box runs to x 1177 — he is an
actor and owns no pixel of the plate, so a change to the wall behind him would harm nothing, but a
gate that has to be argued with is not a gate.

## 5 · The interaction identities are untouched

`card_sharp` and `one_strike_man`, the transparent frames, the population schema and the canonical
trees are all unchanged, and the live route was re-run against the repaired plate:

- speech anchored **51px clear above** each painted head, centred within 7px of his x
- Card Sharp's painted box **100.0000% identical**, max difference **0**
- One-Strike Man's painted box max difference **2** — the two lamps that reach him, breathing
- LOOK AT the patrons still answers with the group's own line
- **visible population = 9**, `tests/phase2a-access.test.ts` green

## Reproducing

```
python3 tools/retrofit/nugget-shipping-repair.py --preview   # what is kept, what is restored
python3 tools/retrofit/nugget-shipping-repair.py             # the plate
python3 tools/retrofit/nugget-shipping-gate.py               # what did not move
python3 tools/retrofit/nugget-shipping-proof.py              # the two before/after sheets
node tools/gauntlet/production-shot.mjs                      # the runtime frame, the owner gate
```
