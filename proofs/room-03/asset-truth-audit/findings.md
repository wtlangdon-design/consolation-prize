# ROOM 3 — ASSET TRUTH AUDIT

**Question (Tyler, 2026-09-13):** do we already possess the pieces needed to
reconstruct the visually preferred Nugget as a people-free room with the
existing characters layered back on top?

**Answer: NO.** Proven below by pixels, not by provenance notes.

Zero image operations. No shipping art, no runtime file and no document was
modified. Two read-only tools were added:
`tools/audit/room03-people-free.py` and `tools/audit/room03-actor-identity.py`.

---

## A · The preferred target, precisely identified

| | |
|---|---|
| **audit identifier** | **R3-PREF** |
| runtime room JSON | `content/rooms/nugget-candidate.json` (`candidateOf: nugget`) |
| plate | `art/staging/room-03/rebuild-05/plate-room-03-repaired.png` |
| plate sha256 | `713e6580060d69a57fcd9f21bc1bad9123ccef2953aa09f857e69f4ff62b88c6` |
| plate size | 1920 × 864 RGB |
| last commit touching it | `f751dd2` "Room 3: repair the two rejected shipping-art defects" |
| deploy proof | `2ef8429`, merged `dad8054` — the deployed page requests that path and gets 200 |
| overlay | `art/staging/room-03/corrected-03/stove-fire-overlay.png` |
| occlusion | one plane, `art/masks/room-03-plane-1.png` (the spittoon); six floor bands |
| runtime actors | `nugget_landing_man`, `nugget_stove_man` |
| invisible interaction identities | `card_sharp` (card_2), `one_strike_man` (bar_1) |
| painted patrons | 7 — card_1..4, bar_1..3 |

**Not this:** `content/rooms/nugget.json`, the default shipping room, still
points at `art/backgrounds/room-03-nugget.png`, which measures 23.18 mean
levels away from R3-PREF and is a different room. R3-PREF is reached through
the candidate warp.

### How R3-PREF was built — the chain that matters

    corrected-03/plate-cold-dirt.png        PEOPLE-FREE.  Old card table, old bar.
      -> card-salvage/plate-card-baked.png  generated card cluster blitted into
                                            the plate window [673,260,1160,617]
      -> rebuild-01/plate-room-03-rebuilt   generated bar seamed on at x1176,
                                            free window [1270,270,1860,800]
      -> rebuild-02, -03                    grounding, cleanup
      -> rebuild-04                         bar_3 erased, recomposed 82 rows lower
      -> rebuild-05                         the two rejected defects repaired  = R3-PREF

The furniture and the people entered the plate **in the same two generated
images**. That single fact determines every answer below.

---

## B · Is there a complete matching people-free R3-PREF?  **NO**

`tools/audit/room03-people-free.py` compared **every 1920 × 864 image in the
working tree (79 of them) and every 1920 × 864 blob in the whole git history
(71 distinct)** against R3-PREF, on two halves: inside the seven patron boxes
and outside them. A genuine people-free R3-PREF would read near-zero outside
and large inside.

**Blobs matching that signature, in the entire history: 0.**

The five nearest, per patron (mean |diff|, 0.0 = that man is byte-identical):

| candidate | OUT | card_1 | card_2 | card_3 | card_4 | bar_1 | bar_2 | bar_3 |
|---|---|---|---|---|---|---|---|---|
| `rebuild-04/plate-room-03-empty.png` | 0.03 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | **9.8** |
| `rebuild-04/plate-room-03-recomposed.png` | 0.02 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.9 |
| `rebuild-03/plate-room-03-rebuilt.png` | 0.05 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 1.9 |
| `card-salvage/plate-card-baked.png` | 2.00 | 0.1 | 0.0 | 0.0 | 1.4 | 13.4 | 17.9 | 14.6 |
| `corrected-03/plate-cold-dirt.png` | 2.42 | 14.3 | 19.4 | 29.1 | 15.0 | 13.4 | 17.9 | 14.6 |

**`plate-room-03-empty.png` is named "empty" and is not.** Its own record says
so: *"the Nugget with the foreground bar patron removed"*. One man of seven.
Six are byte-identical to R3-PREF in it.

**`corrected-03/plate-cold-dirt.png` IS a complete people-free Nugget** — same
walls, doors, windows, chandelier, piano, stove, stairs, floor — and it is the
closest thing in the repository to what was asked for. It is not a people-free
R3-PREF, because **its card table and its bar are not R3-PREF's**:

* 62.3% of R3-PREF is within 1 level of it — the whole left third of the room
  is byte-identical, and so is the ceiling band across the full width.
* 32.3% (535,840 px) has no people-free ancestor anywhere.
* Its card table stands in the same place but carries **different chairs and
  different props** (a bottle and three glasses, not cards and chips), and no
  chair at the fifth place.
* Its **bar is at a different pitch and a different position**, with the counter
  running further left, a differently placed back shelf, and stools at different
  x. It is a different bar.

Deleted from history and checked: `art/backgrounds/room-03/frame-01..05.png`
(1920 × 864, the retired five-state frames) — all fail the same test.

---

## C · CARD inventory

| | asset | size | contains | geometry matches R3-PREF |
|---|---|---|---|---|
| A | `art/staging/room-03/rebuild-05/plate-room-03-repaired.png` | 1920×864 | table, chairs, four men, whole room | **the definition of it** |
| A′ | `art/staging/room-03/cluster-card-01/source.png` | 1024×1024 | the generated cluster as delivered: table + chairs + four men + floor, one image | YES — blitted at [673,260,1160,617] |
| B | — | — | **NO people-free version of this table exists** | — |
| B′ | `art/staging/room-03/cluster-card-01/furniture-canvas.png` | 1024×1024 | the ×2 card region of the COLD plate — the generator's **input**, i.e. the OLD table | **NO** |
| B″ | `art/staging/room-03/corrected-03/plate-cold-dirt.png` | 1920×864 | people-free room, OLD table and chairs | **NO** |
| C | `cast-card-players-01/card_{1_flatcap,2_silver,3_young,4_spectacles}.png` | 338×565, 304×596, 312×595, 338×538 | four separated men, clean alpha, no furniture | different art — see E |
| C′ | `art/actors/cast-nugget-card-1..4.png` | 82×165, 89×169, 81×163, 100×163 | four separated men at room scale | different art — see E |
| C″ | `cast-card-landing-01/card-1..4.png`, `-02/card-1..4.png` | 227–280 × 455–722 | earlier separated card men | different art |
| D | `cluster-card-01/edit-mask.png` | 1024×1024 | the **generation** free-window mask, not a segmentation of the output | n/a |
| D′ | `clean-card-01/layers/*.png` | cluster-local | a full seven-layer decomposition **of the clean-sheet cluster**, not of R3-PREF | **NO** — different room entirely (OUT 18.05) |
| E | `cast-card-players-01/source.png` + `players.json` | 1536×1024 | the master the four gate actors were cut from | — |

No mask, alpha or segmentation of R3-PREF's own four card men exists.

---

## D · BAR inventory

| | asset | size | contains | geometry matches R3-PREF |
|---|---|---|---|---|
| A | `rebuild-05/plate-room-03-repaired.png` | 1920×864 | bar, stools, rail, three men | **the definition of it** |
| A′ | `art/staging/room-03/bar-rebuild-01/source.png` | 1536×1024 | the generated bar as delivered: counter + back shelf + stools + rail + three men, one image | YES — crop [896,181,1920,864], seam x1176, feather 24 |
| B | — | — | **NO people-free version of this bar exists** | — |
| B′ | `bar-rebuild-01/canvas.png` | 1536×1024 | the generator's **input** — the card-baked plate's bar region, i.e. the OLD bar | **NO** |
| B″ | `corrected-03/plate-cold-dirt.png` | 1920×864 | people-free room, OLD bar at a different pitch | **NO** |
| B‴ | `rebuild-04/plate-room-03-empty.png` | 1920×864 | **bar_3 only** removed, his bar and floor reconstructed | YES, and it is the one genuine people-free patch that exists |
| C | `art/actors/cast-nugget-bar-1..3.png` | 148×269, 167×380, 188×494 | three separated men at room scale | different art — see E |
| C′ | `cast-bar-pair-01/finished/bar-2.png`, `bar-3.png` | 326×741, 287×754 | the deterministically repainted pair | different art |
| C″ | `cast-bar-stove-01/bar-1..3.png`, `-02/bar-1..3.png` | 267–319 × 581–821 | earlier separated bar men | different art |
| D | `bar-rebuild-01/edit-mask.png` | 1536×1024 | the **generation** free-window mask (44% free), not a segmentation | n/a |
| D′ | `clean-bar-01/layers/*.png` | cluster-local | five-layer decomposition **of the clean-sheet bar** | **NO** |
| E | `cluster-bar-01/source.png` | 1536×1024 | pose authority for the rebuild | — |

`cast-bar-stove-03/` is marked REJECTED and is not ancestry.

---

## E · The seven patrons — independent-asset truth table

Method: each candidate asset placed over R3-PREF at the registration the
repository records for it, mean |asset − plate| measured inside its own opaque
area. Same pixels → near zero. Redrawn likeness → tens.

| patron | best independent asset | mean │diff│ | **status** |
|---|---|---|---|
| card_1 | `cast-card-players-01/card_1_flatcap.png` @ 0.4559, (710,298) | 25.3 | **3 — similar identity, not the same art** |
| card_2 (Card Sharp) | `cast-card-players-01/card_2_silver.png` @ 0.4248, (784,259) | 28.8 | **3** |
| card_3 | `cast-card-players-01/card_3_young.png` @ 0.4403, (896,257) | 42.8 | **3** |
| card_4 | `cast-card-players-01/card_4_spectacles.png` @ 0.4834, (945,299) | 21.8 | **3** |
| bar_1 (One-Strike) | `art/actors/cast-nugget-bar-1.png` @ box | 37.3 | **3** |
| bar_2 | `art/actors/cast-nugget-bar-2.png` @ box | 53.3 | **3** |
| bar_3 | `art/actors/cast-nugget-bar-3.png` @ box | 36.1 | **3** |

**No patron is status 1 or 2, and none is status 4.** Every one of the seven
has an independent asset of the same *character*, and not one of them is the
art that is in the plate. Looked at side by side the differences are garments,
not noise: painted card_2 wears a necktie, the asset a red waistcoat; painted
bar_3 wears a red check shirt and braces, the asset a brown coat.

The `cast-card-players-01` four are the strongest set in the repository — one
authorized round, gate PASS on clean alpha, furniture independence and
independent depth ordering, registered head-anchored against
`rebuild-03/plate-room-03-rebuilt.png`, which this audit measured at 0.00
against R3-PREF in all four card boxes. They are still different art.

### Could they simply be drawn OVER the painted men?

No. At their own registration their silhouettes cover **55.4 / 83.5 / 67.1 /
59.8 %** of the pixels that differ from the cold plate inside each patron box,
while painting 8,111–12,894 px that were never the painted man. A sixth to a
half of each painted man would still be showing.

---

## F · Direct reassembly possible?  **NO**

## G · (not applicable)

## H · The exact missing pieces

Measured, not estimated — the union of every pixel the two generators drew:

| missing | region | size | what is absent |
|---|---|---|---|
| **the R3-PREF card table, people-free** | plate `[673, 260, 1160, 617]` | 487 × 357, 127,023 px changed | the tabletop **under four forearms and four fanned hands**, the far rim behind card_2 and card_3, the near chair seats and backs behind card_1 and card_4, the floor shadow they cast, and the chair at the empty fifth place |
| **the R3-PREF bar, people-free** | plate `[1178, 181, 1920, 864]` | 742 × 683, 395,429 px changed | the counter top and front panelling **behind bar_1, bar_2 and bar_3**, the back shelf and bottles behind bar_1 and bar_2, the stool bar_1 sits on, the brass foot rail behind bar_2's boots, and the floor under all three |
| partially present | `rebuild-04/plate-room-03-empty.png` | 12,013 px | **bar_3 alone** is already reconstructed away, deterministically, with the bar and floor rebuilt behind him. One of seven. |

Everything outside those two rectangles — 62.3% of the plate — is already
people-free in `corrected-03/plate-cold-dirt.png` and is byte-traceable to it.

**We did not pay for the answer and stop using it. The answer was never
produced.** The generation requests freed those windows on purpose: the card
blit replaced the window wholesale, and the bar request freed 44% of its
canvas. In both cases the men and the furniture they touch were drawn in one
pass, and the endpoint was never asked for the furniture alone.

---

## I · Registered local patch feasibility — **CARD YES, BAR YES**

Rectangles verified against the pixels: with

    CARD  [673, 250, 1178, 620]   505 × 370
    BAR   [1178, 181, 1920, 864]  742 × 683

**every pixel either generator ever drew falls inside one of them — 0 outside.**
Together they are 41.8% of the plate; the generators touched 535,840 px of that.

* The **rest frame is R3-PREF itself**, unmodified. It is already the accepted
  picture, so the rest state needs no new art and no new acceptance.
* An alternate frame **replaces the whole rectangle** — the plate's rows and
  columns are overwritten wholesale at an integer offset. Nothing is matted,
  nothing is cut out, nothing carries an alpha edge.
* The invariant pixels are gated by construction: require every pixel of the
  alternate rectangle **outside a declared motion envelope** to be byte-identical
  to R3-PREF's. Any furniture, wall, floor or lighting drift fails before the
  frame is accepted.

## J · Why a rectangular patch avoids the halo failure

The halo has happened twice in this room and both times had the same cause: a
**person was matted out of a plate along a soft or generous boundary**, and a
ring of his old surroundings travelled with him. `rebuild-05/repair.json`
records it in its own words — the recompose *"matted him with an unconditional
core term over a GENEROUS 42-point bound, so a ring of his old surroundings
travelled with him through the 82-row shift"*. The clean-sheet rebuild hit the
same class twice more: magenta mixed under transparent pixels by resizing, then
the masters' own anti-aliased silhouette.

Every one of those is a property of an **alpha boundary through a figure**. A
registered rectangle has no such boundary. Its edges lie in wall, floor and
counter that both frames share, its alpha is a constant 255, and the byte-
identity gate above proves the shared region really is shared. There is nothing
to feather, so there is nothing to feather wrongly.

What it costs instead is honest and should be stated: a rectangle that big is
**not** an animation layer. It moves the whole card table or the whole bar at
once, every alternate frame is a full generated image of that rectangle, and two
patrons inside one rectangle cannot be animated independently of each other.

## K · Shortest path from the evidence

The two routes the evidence actually supports, in order of cost:

1. **Registered local patch on R3-PREF** — keeps the picture Tyler prefers
   exactly as it is as the rest frame, needs no people-free plate, and cannot
   halo. Buys per-cluster motion, not per-person motion.
2. **Buy the people-free furniture that was never generated** — one operation
   per cluster, each asked for the R3-PREF furniture with nobody at it, gated on
   byte-identity outside the freed window. If they land, direct reassembly
   becomes possible and the `cast-card-players-01` four are already registered
   and gate-passed against this exact composition. If they miss the furniture
   geometry, nothing is lost but the operations, and route 1 still stands.

Route 2 is the only one that reaches per-person animation on R3-PREF. Neither is
begun in this audit.

## L · Image operations used: **ZERO**
