# ROOM 3 — PHASE A GEOMETRY CORRECTION, ENGINE-FIT PASS

Two image operations, both authorised, both spent. No runtime file, shipping
plate, room JSON or character asset touched.

## Ledger

Audited before anything was written: `art/staging/ledger.json` held **55 attempt
rows** — 51 art operations and 4 `smoke-test-card` harness rows. New category
`room-03-pref-replica-geometry`, cap 2, `attemptsTotal` 58 → 60.
**`room-03-pref-replica-plate` stays closed at 2/2 and was not raised.**

## The guide, and the gate it failed first

`tools/room03/geometry-guide.py` draws the **safe gameplay band** — 1536 × 691,
from the engine's own arithmetic — on the 1536 × 1024 canvas, with all eighteen
features' FULL bounds inside it and every future person's envelope marked.

**Its first draft failed its own §3 gate**: it put the landing floor at room
y235 under a beam at y60 — 175 px of headroom for a man the camera made 203. A
guide that cannot pass its own gate is not a guide. Fixed before an operation
was spent: landing floor y262, ceiling y48, 214 px of headroom, and the landing
man's height authored at 180 rather than taken from `k(y − EYE)`, because he is
not on the ground plane and the camera formula means nothing for him.

The overscan strips were also changed from "leave blank" to "plain ceiling
above, plain dirt below". An instruction to leave a third of the canvas empty
is one an image model will not follow and should not.

## Operation 1 — and a reference mistake that was mine

`pref-geometry-01/source.png`. It did the three things asked: the chandelier
came down and is fully in frame with its chains, the stairs now climb to a real
railed gallery with headroom, and the spittoon moved up the room.

**It was sent with `pref-replica-01` as reference 1 when the ruling names
`pref-replica-02`.** The two rooms are close, so the geometry work survived —
but -02 was exactly the attempt that had finished the bar's stove-side end down
to a plinth on the dirt, and -01 had not. Attempt 1 inherited the weaker
terminus. Half of what the refinement had to buy back was my error.

## Operation 2 — the refinement

`pref-geometry-02/source.png`, referencing geometry-01 first, then
pref-replica-02 for the bar end, then the guide, then R3-PREF. Two named
defects: the spittoon still too low, and the unfinished terminus.

| | asked | delivered |
|---|---|---|
| bar's far end | plinth on the dirt, rail terminated on its bracket | **improved** — end cap, stile and panelling carried further down, though still darker at the base than pref-replica-02's |
| spittoon | up the room, out of the bottom edge | **moved 14 rows.** Not enough. It is drawn at source rows 782–908 and the band ends at 800 |

## The band, and what it holds

    band  x0 y109 1536 x 691   ->  1920 x 864
    15 of 18 features whole
    absent: ceiling beams, the chandelier's upper chain, THE SPITTOON

### The landing, which was the hard structural gate

    landing platform floor   source y 255
    ceiling above it         source y 122
    headroom                 133 source px = 166 room px
    a 1.75 m man there       ~128 source px = 160 room px   (from the balusters,
                                                             0.9 m at 66 source px)
    -> HE FITS, with 6 room px to spare.

Tight, and stated as tight. But he fits, he is inside the band, and he is
visible — which he was not in any previous version, croppedting or not.

## The camera, re-fitted again

From this plate's four stools (0.75 m seats at four depths):

    120 px with feet on row 660 | 130 px on 700 | 145 px on 745 | 160 px on 800
    ->  horizon y 240,  k = 0.667

The horizon lands on **240 against R3-PREF's 239** — the vertical recomposition
did not move the eye line, which is the best single sign it was done properly.
`k` did move: 0.667 against 0.8494, so a man at row 800 is 373 px here and 476
there. **Compressing the room's vertical spread by a third makes everything in
it about a fifth smaller**, and that is the price of fitting the chandelier, the
landing and the man on it into 864 rows.

## Access matrix — 24 of 25

All nine placeholders standing; full data in `spatial.json`. Every target
visible, clickable and reachable, with the engine's own approach rule (2.0 body
heights examine, 0.5 hands-on, snapped to walkbox):

**piano PASS** (hands-on, entry gap 343 / need 153, Thad at (565, 634) 261 px,
clear of card_1 by 50 px) · **card table, cards, Card Sharp, all four seats
PASS** · **bar, One-Strike Man, all three patrons PASS** · **stove and stove man
PASS** · **stairs PASS** · **landing PASS** · **landing man PASS — he is in the
picture and he fits** · **chandelier PASS — now a clickable hotspot inside the
band** · **both exits PASS** · **Deke reserved at (450, 724), PASS**.

**spittoon FAIL.** Drawn at source rows 782–908; the band ends at 800, so its
lower 108 rows are outside the plate. It is a canonical hotspot in
`nugget-candidate.json` and the room's only `occlusionPlane`. It is carried in
the matrix as an explicit failure rather than left off it, because a target that
passes by being absent from the list is the worst kind of green.

## Classification

Unchanged from the last pass except that the **chandelier moves from "outside
the band" to C — stateful overlay, base fixture in plate**, which is what §10
asked for. Piano C (lid closed is the correct base state; A8 tunes it, doc 16
gives it OPEN). Stove fire C. Lamps C. Everything else A or B.

Raccoon: still not a Room 3 requirement — bible v2 puts it in the hole at
Prosperity. Nothing touched, no flags read.

---

# THE THREE GATES

## VISUAL REPLICA GATE — **PASS**

Same Nugget. The room reads as substantial, the bar is still long and diagonal
down the right, the card table is still the social centre with five whole
chairs and the abandoned hand, the stove is rearward, the piano is comfortably
in the composition, the dirt floor is continuous, the light is dark and warm.
The ceiling and the landing now give the room a top, which R3-PREF never had.
It has NOT become a small generic saloon. Zero people.

## GAMEPLAY-SPATIAL GATE — **PASS**

24 of 24 in-frame targets clean. The landing holds a man. The piano gate holds
with all four card players seated.

## FUTURE-ACT COMPATIBILITY GATE — **FAIL**

One item: **the spittoon is still below the band.** A canonical hotspot and the
room's only occlusion plane cannot be shown.

---

# WHAT IS LEFT, AND HOW SMALL IT IS

The deficit has gone **295 rows → 132 → 108**, and it is now one object. The
minimum correction is the spittoon drawn roughly 110 source rows higher — about
a ninth of the picture — with everything else in `pref-geometry-02` left exactly
as it is. That is a narrower brief than either operation this category has
already spent, and the category is now at 2/2.

**Whether to buy that, or to accept the plate and author the spittoon as a
separate prop object the way Room 5's hanging lamp was, is Tyler's call.** The
second route needs no change to this plate at all, and an occlusion plane wants
its own silhouette anyway.
