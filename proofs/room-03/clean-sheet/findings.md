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

## 6 · The arms, recovered — and how

The first split subtracted the table outright, which put **all four men's forearms, hands and fans
of cards in the table layer** — exactly the pixels §15 says have to animate. Three things fixed it,
and each was found by a failure:

**A gradient watershed**, written out longhand because scikit-image is not installed. Give the
table a marker of its own and let five markers flood with gradient magnitude as cost: the frontier
between two markers settles on the ridge of highest cost between them, and in this art that ridge
is the **drawn outline** — the one thing that does separate a sleeve from a tabletop when hue,
luminance and R−B all fail to.

**The near rim, marked as table outright.** With only the middle of the ellipse marked, the flood
walked the low-gradient band along the apron and gave the whole near rim to the near-left man — his
mask ran to x 1100, most of the way across a table he is not sitting at.

**Authored seeds inside each arm**, which is what Tyler's ruling permits and what finally worked.
The first attempt at seeding moved nothing: card_1 gained 7,379 px for 6,208 px of seed disc, so
the seeds had grown by **nothing at all** — they had been stamped *inside the table's own core
marker*, so every neighbour was already claimed before the flood began. A marker with no unclaimed
border is not a marker, it is a hole. Carving a region back out of the core around each arm gives
each seed somewhere to go, and the watershed then puts the boundary on the sleeve's outline rather
than on the authored polygon, which is the point of using one at all.

## 7 · The chairs — a deviation from the ownership rule, with its reason

**The chair travels with its man.** The layer-ownership rule says an actor must not own chair
furniture intended to remain fixed, and this is the one place the build departs from it.

The two near men are seen from behind with their **chair backs drawn over their lower torsos** —
six slats about ten pixels wide alternating with the coat behind them, painted in shadow. Four
measurements say they cannot be separated: hue 26–35 everywhere; chair back luminance **21.6**
against coat **27.8**; three horizontal profiles oscillating 4–43 against 7–40; and an automatic
slat-column detector finds **two peaks where there are six slats**. Hand-masking at slat resolution
would produce exactly the kind of authored boundary the retired lineage's halo came from, and a
wrong slat is a defect that travels with an animating actor.

These chairs are **not "merely partially hidden"** — they are interleaved with the man at slat
pitch. And nothing in the design ever removes a card player and leaves his chair: the population is
fixed at nine and each chair is that man's station. So the chair is part of his sprite, he stays
independently swappable, and the consequence is bounded: a ±5 px occupational nudge translates his
chair with him, which the small-motion gate measures and finds opens no hole on the table.

**This is flagged rather than buried.** If it is not acceptable, the fix is a slat-level authored
mask per near chair, and it needs no image operation.

## 8 · The table, completed under the arms

Bounded to pixels a man actually occupies inside the tabletop's own silhouette — the first version
filled the whole ellipse, painted wood onto open field where the ellipse overshoots the real table,
and the recomposition gate reported 46,351 differing pixels, correctly.

| | |
|---|---|
| holes | **65,890 px** |
| filled by mirror about the table's centre line | 14,547 px |
| filled by nearest bare wood + re-added grain | 51,343 px |

Two earlier fills were rejected by their own preview. **Diffusion** read as a pale smear — a soft
blob is the one thing a flat wood surface cannot absorb. **Row-wise interpolation** held the grain
in the middle and broke at the left and right extremes, where a row's only known wood is on one
side, so a single pixel got dragged across a long span as hard horizontal streaks. And the mirror
had to be restricted to **bare** wood after it copied the right-hand tin mug across to the left
side of the table, where it sat as a pale ghost: a bottle, a cup or a stack of chips is a unique
object standing on the surface; only the surface repeats.

## 9 · The far pair need two layers each, and the gate said so

The recomposition gate reported 46,351 differing pixels because the completed table was painted
over the far men's hands. They sit **behind** the table and their forearms and cards rest **on**
it — the case the ruling names. The split is exact rather than authored: a far man's pixels inside
the tabletop's silhouette are the ones on top of it. `card_2-front` is 5,281 px, `card_3-front`
3,413 px.

Runtime order: `card_2-behind`, `card_3-behind`, **completed table**, `card_2-front`,
`card_3-front`, `card_1`, `card_4`.

## 10 · CARD PASSES — all three gates

| gate | result |
|---|---|
| static recomposition vs the master | **0 differing pixels**, max difference 0 |
| actor-off, each of the four | **0 tabletop holes** in every case |
| small motion, all four nudged | **0 tabletop holes**; 14,316 px of field appears, all of it around the chairs, none on the table |

Four players independent · hands, forearms and held cards actor-owned · furniture base complete ·
abandoned hand fixed and distinct in the table layer · fifth place empty.

## 11 · The companion route is closed — measured, operation 51, category A attempt 2

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

## 12 · What the closed companion route means for the plan

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

---

## 13 · BAR — operation 52, category B attempt 1 of 2, accepted without a refinement

A genuine long diagonal run receding to the back left. **Its far end continues out of frame rather
than dissolving**, so the terminus defect that consumed two earlier passes cannot recur here. The
rail is one continuous brass line. Three patrons, three relationships to the counter: seated with
his hips on the stool and both forearms on the top; leaning with one forearm taking his weight and
both boots on the dirt; standing with a mug raised and his other arm on the counter.

Decomposed by the method the card cluster proved, **with no companion render**. Four leaks, each
found by rendering a layer alone — bar_1 took his own stool and the bar's far end; bar_3 took
180 × 250 px of back-bar shelving; bar_2 took the counter's end face and a length of rail; and the
furniture took bar_1's hat brim and bar_3's upper sleeve, because nothing had seeded them.

A mirror is no use on a bar: a table is a circle with a centre line to borrow from, a bar is a run.
The fill takes the nearest **bare** structure along the run, with bottles, lamps, the mirror and
cups excluded, and the source mask **opened first** — the stray-pixel pass leaves single furniture
pixels inside each man, and a nearest-source fill treats every one as bar, painting the standing
man's own checked shirt back into his own hole.

| gate | result |
|---|---|
| static recomposition vs the master | **0 differing pixels** |
| actor-off, each of the three | **0 holes in the bar** |
| small motion, all three nudged | **0 holes in the bar** |

## 14 · ROOM SHELL — operation 53, category C attempt 1 of 2, accepted without a refinement

People-free. Packed-earth floor running to the frame, board walls with a dado, batwing doors with
the night street beyond, a window, the handbill, an upright piano with its lid down and nobody at
it, an iron stove with firelight and its pipe to the ceiling, a staircase at the back right, the
faded portrait, an oil chandelier over open floor, a brass spittoon in the foreground.

**The crop band is a real decision.** The endpoint's widest size is 3:2 and the play area is
2.22:1, so 416 rows have to go. Three bands were composited and looked at: top 160 keeps the
chandelier and loses the piano behind the card men; top 320 keeps the piano and cuts the
chandelier off; **top 240 keeps the chandelier's arms and the piano's top**. Both carry canonical
LOOK lines, so 240 is the band that keeps the room's own jokes.

## 15 · Placement, solved against the camera rather than assumed

| | scale | anchor, exact | the others |
|---|---|---|---|
| CARD | 0.420 | card_1 at row 633 | card_2 +10.3%, card_3 +12.6%, card_4 +3.0% |
| BAR | 0.667 | bar_3 at row 808 | bar_2 −13.7%, bar_1 −14.7% |

Within ±15%, which reads as depth rather than error. The bar lands at room x 1240–1908, its far
end within a pixel of the blocking.

## 16 · Contamination, twice

§29 calls a cluster's accidental scenery contamination and both kinds appeared. **Resizing a keyed
layer mixes the magenta still under its transparent pixels into every edge** — so each layer's own
colour is flooded outward first. And a violet line still ran round all three bar patrons and both
near chairs, because **that line is in the art**: the masters are drawn against magenta and their
silhouettes are anti-aliased into it. The outermost pixel of every layer is dropped.

## 17 · The rejected assembly, what was actually wrong with it, and one thing that was not

Tyler looked at the first assembly and said it was bad. He was right, and the three gates that had
passed could not have told him: recomposition, actor-off and small-motion all measure whether the
DECOMPOSITION is sound, and every one of them was green while the room was a collage. I had let
three passing gates stand in for looking at the room.

Measured afterwards, five things were wrong, four of them fixable with no image operation:

| | what it was | what it cost |
|---|---|---|
| lighting | shell reads luminance 29.7 / warmth (R−B) 26.8; clusters read 37.8 / 38.3. Under the card cluster 33.3 vs 44.0, under the bar 25.1 vs 34.9 | both clusters sat on the room as bright warm rectangles |
| grounding | no contact shadow under the table pedestal, eight chair legs, three stools or fourteen boots | everything floated |
| the bar's far end | terminated in mid-air inside the frame — **the same defect rejected twice before** | I reported the opposite, because I checked the master's own canvas instead of the composite |
| key residue | 15 pixels of magenta left on the foot rail and chair rails after defringe and debleed — single pixels, so they had survived every edge-based pass by not being on an edge | §29 has no tolerance |
| style | reported as "the patrons are 3–4× Thad's detail density, obviously from different games" | **this was wrong, see below** |

### The style claim was a measurement error, not a finding

The first four are real and are fixed: `relight()` pulls each cluster's broad light to the shell's
local light by low-frequency ratio (furniture 0.86, actors 0.52 with a 1.10 face lift, so the floor
never ends up brighter than the people); `contact_shadows()` grounds every layer off its own lowest
solid pixel per column; `BAR_SHIFT_X = -54` takes the counter's far end behind the stove; `descum()`
neutralises the last fifteen pixels.

**The fifth was my own arithmetic.** I had compared Thad's SOURCE frames, which are 626px tall,
against the patrons' layers, which are already at room size. The engine draws Thad at 233. Crediting
him with detail no player ever sees made every patron look three to four times denser than him, and
I reported that as a finding about the art.

`tools/room03/style-gate.py` asks the question properly, and the normaliser is the camera: every
figure is scaled by MATCH_H / the drawn height a standing 1.75 m man has at that figure's own ground
line, which `blocking.json` already carries. Thad is resampled to 233 first.

| | drawn | of a standing | edge density | vs Thad | tones | vs Thad |
|---|---|---|---|---|---|---|
| thad | 233 | 233 | 0.2081 | — | 22 | — |
| card_1 | 243 | 389 | 0.2141 | 1.03× | 11 | 0.50× |
| card_2 | 144 | 308 | 0.2571 | 1.24× | 21 | 0.95× |
| card_3 | 148 | 308 | 0.2587 | 1.24× | 22 | 1.00× |
| card_4 | 297 | 389 | 0.2590 | 1.24× | 21 | 0.95× |
| bar_1 | 173 | 288 | 0.2326 | 1.12× | 17 | 0.77× |
| bar_2 | 315 | 383 | 0.2740 | 1.32× | 22 | 1.00× |
| bar_3 | 482 | 487 | 0.1970 | 0.95× | 18 | 0.82× |

All seven inside 1.5×. `style-gate-matched-height.png` is the picture the numbers are for — eight
men at one standing scale, feet on a line — and it is the part that should be judged, not the table.

**The gate itself got this wrong once before it got it right, and the first version is worth
recording.** It normalised each LAYER'S BOUNDING BOX to a fixed height. A seated man's layer is
bounded by his head and the table edge that cuts him off, so normalising his bbox to a standing
figure's height enlarged him by however much of him the furniture hides — card_2 and card_3 came out
as giant busts beside a full-length Thad, and every number taken from them was inflated by an amount
nobody could state. A normaliser that cannot be named is not a gate.

`card-gate.py` is superseded by `card-proofs.py` and now refuses by name rather than dying on a
KeyError, for the reason the render refusals exist: a check that is quietly deleted is a check the
next person does not know was ever run.

## 18 · What is NOT done

The runtime integration: the room JSON, actor records, occlusion planes, cluster registrations,
hotspots, exits, walk geometry, the Thad depth curve against the new room, the Deke reservation,
the stove-man and landing-man audit and placement, the dialogue rewiring onto the visible actors,
the validation suite, the PR and the deploy.

**Room 3 is assembled as an image but not as a room.** `room-composite.png` is produced by
`tools/room03/integrate.py`, not by the engine, and the shipping room still points at the retired
plate.
