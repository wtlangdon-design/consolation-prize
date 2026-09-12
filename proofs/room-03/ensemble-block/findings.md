# ROOM 3 RUNTIME ENSEMBLE — IMPLEMENTATION BLOCKED

**Date:** 2026-09-12 · **HEAD at investigation:** `2278885` · **Ledger:** 48/48, untouched
**Baseline:** 236/236 tests pass · 55/56 checks pass (the one red is the known pre-existing
`No flag is read before it can be written` — ACT / `T_RACCOON_NAMED` — recorded and left alone)

The approved architecture is not in doubt and is not re-litigated here. The engine supports it;
that was settled by the architecture audit. **This document records why the implementation
cannot be carried out under the zero-image-operation constraint, and exactly what is missing.**

---

## The requirement, stated once

Lifting a baked patron out of the plate into a runtime sprite needs two things, both of them:

- **(A) a tight alpha silhouette of that patron**, cut from the accepted composite
- **(B) correct background pixels where he was standing**, for the plate underneath

§15 forbids the shortcut of leaving him baked in beneath his own sprite
(*"must not permanently contain duplicate runtime patrons/chairs whose pixels would ghost
beneath the runtime sprites"*), and that prohibition is right: the moment Phase 2B adds a
break frame in which a man moves, the baked copy shows.

---

## (B) BACKGROUND — solved for the bar, unsolvable for the cards

§2 was correct that people-free environment art exists. It exists **twice**, and the two
sources are not equivalent.

| Source | What it is | Verdict |
|---|---|---|
| `art/staging/room-03/bar-rebuild-01/canvas.png` | The canvas the bar rebuild was given: **the canonical rebuilt bar, complete and empty** — counter run, front panelling, base moulding, foot rail, three stools, back bar, bottles, mirror, spittoon, dirt floor | **Usable.** Panel 3 |
| `art/staging/room-03/cluster-card-01/furniture-canvas.png` | The canvas the card cluster was given: **the OLD table** — smaller, further back, five chairs, a different footprint | **Not usable.** Panel 2 |
| `art/staging/room-03/corrected-03/plate-cold-dirt.png` | The accepted cold-dirt plate — a completely people-free Nugget, but again with the **old** table and the **old** bar (130px further back) | Wall/floor/stove only |

The canonical rebuilt card table exists in exactly one place: `cluster-card-01/source.png` and
the plates derived from it — **always with four men painted on it.**

**card_1** (flat cap) and **card_4** (bald, spectacles) sit on the near side with their backs to
camera. Their bodies cross the table's left and right rim, apron and near edge. Those pixels of
the accepted rebuilt table exist in no source in the repository, in git history, or in staging.

Panel 1 classifies all seven patrons by what lies behind them:

- **GREEN — `bar_1`, `bar_2`, `bar_3`:** the empty counter behind each is in the bar canvas.
- **AMBER — `card_2`, `card_3`:** the far pair. The wall, window and portrait behind their heads
  are recoverable; their hands and cards lie on the table surface.
- **RED — `card_1`, `card_4`:** nothing anywhere holds the table behind them.

---

## (A) SILHOUETTE — no deterministic route exists, for any of the seven

This is the harder half, and it blocks the bar as well as the cards. Three routes were tested
and all three are dead. None of this is judgement; each is a measurement.

**1. Difference matte against the people-free canvas — DEAD.**
The endpoint did not preserve the background it was given. Comparing
`bar-rebuild-01/canvas.png` against its own output `source.png`:

```
mean abs diff 17.08   frac>8 0.5078   frac>16 0.3260   frac>32 0.1448
back-bar-right  mean 18.83  frac>16 0.2989      (no person stands here)
stairs          mean 14.84  frac>16 0.2244      (no person stands here)
floor-bottom    mean 11.59  frac>16 0.2216      (no person stands here)
```

**32.6% of the whole image differs by more than 16 levels, including regions containing no
person at all.** A difference matte would select a third of the picture. This is the measured
form of the rejection ruling, not a restatement of it.

**2. Colour or threshold segmentation — DEAD.**
The plate is a night interior with a mean level of 24. Sampled from the accepted composite:

```
table surface (930,430) rgb (21,14,7)      card_1 coat (800,400) rgb (22,19,12)
card_4 coat  (1060,420) rgb  (3, 7,10)     card_1 cap  (790,320) rgb (46,23,10)
```

A man's coat and the mahogany table are separated by three levels. A warm-hue mask tuned to the
table's ratio returns one connected component spanning **x 715–1001** — it takes card_1's cap and
coat as table. Threshold tuning is also explicitly banned.

**3. Substituting the existing separated cast sheets — DEAD.**
`art/actors/cast-nugget-bar-1/2/3.png` and `cast-nugget-card-1..4.png` are seven fully separated,
alpha-clean whole-body sprites of these same seven characters. They are **not the same paintings**
as the accepted composite — they were the identity reference fed *into* the cluster operations,
which then painted fresh men. Best-fit test at native scale, after fitting a per-channel gain:

| | residual after gain | luminance correlation |
|---|---|---|
| `cast-nugget-bar-3` | 10.61 | 0.620 |
| `cast-nugget-bar-1` | 17.04 | 0.106 |
| `cast-nugget-card-2` | 26.09 | 0.117 |

Against a plate whose mean level is 24, these are not matches. Dropping them in would replace
the accepted composition with different artwork — which §0 and §10 forbid.

The one method that *does* produce a clean alpha is the one the card-player feasibility gate
used: generate the figure on a flat magenta field and key it. That is an image operation, and
the cap is closed.

---

## CONTENT — both canonical trees are unbuilt

§5 instructs *"use the canonical existing Card Sharp tree id from the repository"* and §14
*"wire the existing canonical One-Strike Man dialogue tree to bar_1."* Neither exists.

`content/dialogue/` holds nine trees: `stage-driver`, `amb-letter-writer`, `amb-pie-woman`,
`amb-map-seller`, `harness-tree`, `undertaker`, `hotel-clerk`, `deke-vessel`, `winnie`.
There is no Card Sharp tree and no One-Strike Man tree, and `content/manifest.json` lists none.

Both micro-trees and both bark tables are written and complete in `docs/07-ambient-layer.md`
(§17 THE CARD SHARP, §13 THE ONE-STRIKE MAN). **No creative content is missing.** The trees
simply have never been built from the document. The precedent for doing so is the three existing
ambient trees, each carrying a note of the form *"Doc 07 #6 micro-tree, verbatim."*

This is a separate, smaller, and entirely unblocked piece of work — but it was not authorized on
its own terms and it is not what §5 and §14 describe, so it has not been done.

---

## What would unblock this

Three routes, for the owner to choose between. None is taken here.

1. **Authorize image operations for the seven patrons** (raise the cap). The card-player gate
   already proved the method works: one operation produced four separable, alpha-clean actors
   that passed every technical test. The cost is that the men are then *new paintings* and
   require visual acceptance — which is precisely what was withheld from the gate's output.

2. **Authorize one image operation for the people-free rebuilt card table alone.** Narrower:
   no characters, no acceptance risk to the cast, one object whose geometry is already fixed by
   the walk boxes and the `card_table` obstacle. It would solve (B) for the cards. It does **not**
   solve (A) — the silhouettes would still have no clean source.

3. **Accept authored silhouettes.** `nugget-bar-recompose.py` cut bar_3 with 42 authored points
   and the owner accepted that figure's placement. Extending the method to the other six is
   possible with no image operation, but it is hand work of exactly the class that produced the
   halo rejection, and it would need staged visual review per figure.

**Route 1 or 2 is the honest answer; route 3 is the one that has already failed once.**

---

## Reproducing this

```
python3 tools/retrofit/nugget-ensemble-block-proof.py
```

Writes the three panels and the contact sheet beside this file. Nothing is written back to any
shipping asset; the panels are gamma-lifted for reading only.
