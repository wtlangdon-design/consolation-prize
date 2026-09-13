# CLEAN-SHEET ROOM 3 — WHERE THE REBUILD STANDS

**Tyler's clean-sheet reset, 2026-09-13.** The retrofit lineage is retired; the room is being
rebuilt from zero with all nine patrons independent and animation-ready.

**This is a progress record, not an acceptance. The room is not built and not deployed.**

---

## 1 · Ledger

| | |
|---|---|
| historical actual usage | **49**, untouched |
| new categories created | card cluster (max 2), bar cluster (max 2), room shell (max 2), stove/landing (max 1) |
| spent this pass | **2** — both in category A |
| remaining authorised | bar 2, shell 2, stove/landing 1 = **5 unused** |
| absolute ceiling | 56 |

`nugget-card-ensemble` and `nugget-bar-units` remain withdrawn at 0 and were not revived.

## 2 · What is carried over from the retired room, and it is one thing

**The camera.** `h(y) = 0.8494 (y − 239)`: a true perspective reaching zero at y 239, measured,
cross-checked against the back door, built as an A/B/C study and owner-accepted. §3 says not to
canonise a scale incidentally, so the new room is designed to it and **every other number is built
from zero against it**. No old coordinate, mask, geometry or pixel is used.

## 3 · The new room's blocking — `blocking.json`

The bar becomes the room's longest line, **(1900, 838) to (1240, 505)**: 660 px across and 333 of
depth, so a patron at its near end is drawn 487 px and one at its far end 226. **Its far end dies
into the foot of the stairs**, which is why this room has no terminus to invent — the defect that
consumed the last two passes cannot recur here. The card table comes forward and left to a depth
where a man is 430 px. The stove keeps the back wall between them. The foreground is floor.

The guide corrected itself three times before any art existed: the landing man was being sized
from his contact row and came out **52 px tall**, a doll on a staircase, because a man on a raised
landing stands at the depth of the back wall; five regions collided; and the four seats were first
placed at the diagonals, which leaves no gap at the camera side for the fifth place the joke needs.

## 4 · The card cluster master — operation 50, category A attempt 1

**It came back with the thing that failed twice before.** Q133's finding was that a round table's
near seats need men seen FROM BEHIND and that no wording produced one; two operations were spent on
sheets where all four men faced the camera. **Both near men here are three-quarter back views**, and
the staging diagram is why — a diagram cannot be misread about who faces where.

Against §10, item by item: four believable seated positions, hips supported, knees and boots under
and around the table, the tabletop crossing the far men at the waist and the near men in front of
it, forearms in contact with the surface, four coherent chairs, nobody on the table, no impossible
limbs, **the abandoned hand face up on the near rim belonging to nobody**, and the fifth place
unmistakably empty. On flat magenta, with no floor, wall or room to contaminate anything.

Measured: near-left man crown y 272 to boot sole y 893 = 621 px of seated figure, which at the
camera puts the cluster at **scale 0.50** and his floor row at **707**. The cluster lands 644 × 455
in the room, top at row 301, near chair legs at 755 — leaving the foreground apron clear for Thad.

## 5 · The decomposition, and the wall it hit three times

**The unit is a man on his own chair.** §6's obvious reading puts chairs in the furniture base, and
that is not possible here: the two near men are seen from behind with their **chair backs drawn over
their lower torsos** — six slats about ten pixels wide alternating with the coat behind them.

**Nothing separates them, and it is measured three ways:**

| | |
|---|---|
| slats vs coat | hue 26–35 everywhere; chair back luminance **21.6** vs coat **27.8**; three horizontal profiles oscillating 4–43 against 7–40 |
| arms vs tabletop | skin R−B **74.3** vs wood **67.4**; cream sleeve luminance **90** vs wood **60** |
| props vs arms | the bottle, which must STAY with the table, sits at luminance **46** against the wood's **50** |

One warm light, one value family, by design. Hand-tracing the men was tried first and rejected by
its own preview: two of four outlines wandered across the tabletop, claimed the chips and the
abandoned hand, and **overlapped each other by 10,097 px**.

**What works**: remove the table, erode until four markers appear (23 iterations, measured), and
give every remaining pixel to its nearest marker. The separation becomes a distance transform
rather than a judgement.

**The recomposition gate PASSES** — 0 differing pixels inside the cluster, every cluster pixel
covered exactly once, none covered twice, none missed.

> The gate's own header says what it can and cannot prove: the layers are a partition, so a zero is
> expected rather than impressive. What it catches is the class of mistake that partitions wrongly —
> a pixel in two layers, a pixel in none, a crop written at the wrong offset, a stale master. All
> have happened to this project.

## 6 · The arms — half recovered, and the half that is not

The first split subtracted the table outright, which put **all four men's forearms, hands and fans
of cards in the table layer** — exactly the pixels §15 says have to animate.

**A gradient watershed recovers most of them, and needs no image operation.** Give the table a
marker of its own, make the cost the gradient magnitude, and let five markers flood: the frontier
between two markers settles on the ridge of highest cost between them, and in this art that ridge
is the **drawn outline** — the one thing that does separate a sleeve from a tabletop when hue,
luminance and R−B all fail to. It is written out longhand in `card-decompose.py` because
scikit-image is not installed and because a boundary this one matters should not be a black box.

It also caught its own leak: with only the middle of the ellipse marked, the flood walked the
low-gradient band along the apron and gave **the whole near rim to the near-left man** — his mask
ran to x 1100, most of the way across a table he is not sitting at. No arm rests on the near rim,
so the rim below the centre is now marked table outright.

**Recovered:** the two far men's hands and forearms, and the near rim.
**NOT recovered:** the two near men's forearms, hands and card fans — `furniture-table.png` still
covers **100%** of both hand boxes. The flood from the table crosses smooth wood cheaply and wins
the race to the sleeve's outline against a flood from the man that has to cross his own fold
gradients first. Fixing it needs a per-label path cost rather than one shared cost image.

So **§34 still fails for the two near card players**: their hand and card motion cannot be added
later without unbaking those pixels from the table. Everything else about them is independent.

## 7 · The companion route is closed — measured, operation 51, category A attempt 2

Errata 53 condition 2 is the project's own answer to precisely this: *"ask the generator for the
same scene without the object, quantise both, and the layer is a difference between two images."*
§14 authorises it in as many words. So the refinement was spent on a people-free companion, with
**93.9% of the canvas free and the tabletop core, the bottle and the abandoned hand held back** so
the table would be completed rather than re-invented.

**It came back as a different table.**

| | |
|---|---|
| protected core, 95,341 px | mean difference **63.07** of 255 · p95 **166** · max **254** · **0.00% identical** |
| tabletop at x 718 | master y 336–669 · companion y **264–748** — the near rim moved 79 px, the far rim 72 |
| pedestal | a four-footed pedestal that is not in the master at all |

The mask held nothing back. **The endpoint regenerated the whole canvas**, on a clean magenta field
with almost all of it free — which rules out both "the mask was wrong" and "the scene was too
busy". Differencing these two images would mark the entire picture as a man.

This is the second time this endpoint has failed a registered edit (operation 49 was the first), and
the first time it has failed one under conditions this favourable. `card-companion-drift.webp`.

## 8 · What this means for the plan

The pipeline **can** author a cluster master that meets §10 in one operation. It **cannot** produce
a registered people-free companion of that master. And a master cannot be split into its objects by
any deterministic pixel rule.

So every furniture-dependent group costs **one operation plus hand work**, and the hand work is the
part that is not yet proven at the arm level. Category A is at its cap; the arms must be recovered
deterministically or not at all.

**The next step is tractable and needs no operation**: an arm lying on a table is a simple rounded
shape between the rim and the hand — four of them, plus two card fans — far easier to trace than a
man or a slat. Move them to their men and continue the tabletop beneath by elliptical continuation
and grain sampling, which is exactly what §14 lists as permitted. That has not been done yet.
