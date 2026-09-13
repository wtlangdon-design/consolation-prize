# ROOM 3 — PHASE A: VISUAL, GAMEPLAY-SPATIAL AND FUTURE-ACT GATES

Zero image operations. No cap changed, no category borrowed from, no runtime
file, shipping plate, room JSON or character asset touched.

---

## 1 · Why the one-band derivation exists — audited, not assumed

It is **not** an implementation choice. It follows from two things in the
engine:

* `engine/render/Screen.ts` — `PLAY_HEIGHT = 864`, fixed.
* `engine/core/Camera.ts` — `cameraFollow` scrolls in **X only**. There is no
  vertical camera anywhere in the engine. Main Street is 3700 px wide and
  scrolls; nothing is ever taller than 864.
* `Renderer.drawPlate` stretches the plate to `roomWidth × 864`.

So the undistorted band that can reach the screen has aspect `roomWidth/864`,
and at the full source width of 1536 with the minimum legal room width of 1920:

    rows available = 1536 × 864/1920 = 691

**A wider room makes it worse, not better** — aspect rises with width, so a
2400-wide room takes only 553 rows. A narrower room cannot be drawn: the screen
is 1920 and there is no letterboxing. Anamorphic squashing the whole 1024 rows
into 864 is a 32% vertical distortion of every object and of Thad.

The alternatives §3 lists were each tested against this and each fails:
whole-source uniform scaling gives a 1296-wide room (narrower than the screen);
a larger source with a gameplay camera needs a vertical camera the engine does
not have; different logical room dimensions means changing `PLAY_HEIGHT`, which
is errata 54's window layout for all 42 rooms, not a Room 3 accommodation.

## 2 · The hard content requirement, measured

Every §4 element, measured in `pref-replica-02/source.png`:

| element | source rows | | element | source rows |
|---|---|---|---|---|
| chandelier | 10–198 | | piano | 240–590 |
| stair landing | 47–128 | | card table + chairs | 480–870 |
| landing headroom | 32–128 | | bar counter | 300–800 |
| staircase | 100–470 | | bar stools | 620–978 |
| back-room door | 160–400 | | back bar + mirror | 140–520 |
| stove | 175–430 | | spittoon | 880–996 |
| portrait | 130–240 | | window | 90–340 |
| handbill | 215–300 | | front doors | 90–640 |

    all of section 4 spans   y 10 .. 996  =  986 rows
    available                             =  691 rows
    DEFICIT                               =  295 rows  (43% over budget)

**§4 is unsatisfiable from this source.** Not by a better band, not by a wider
room, not by any transform the engine supports.

Per-band coverage confirms y120 is the best there is — 7 of 15 features whole,
only the spittoon entirely absent — and every alternative is worse:

| feature | y120 | y180 | y240 | y287 |
|---|---|---|---|---|
| chandelier | 41% | 10% | 0% | 0% |
| stair landing | 10% | 0% | 0% | 0% |
| spittoon | 0% | 0% | 44% | 84% |
| card table + chairs | 85% | 100% | 100% | 100% |
| bar stools | 53% | 70% | 87% | 100% |
| portrait | 100% | 55% | 0% | 0% |

## 3 · And the landing is worse than a framing problem

Measured off the source at 3×: the landing platform's floor is at **source
y≈128**, its balustrade top at y≈68, the ceiling beam above it at y≈32. The
balusters are 43 source px for roughly 0.75 m, which makes a 1.75 m man about
**100 source px** at that depth against **96 px of headroom**.

**A man does not fit on that landing in the UNCROPPED source.** This is not
something a band can recover, and my Phase A report was wrong to call it purely
a framing consequence. It is drawn too high and too shallow to stand on.

`nugget-candidate.json` carries `nugget_landing_man` as one of the canonical
nine, and ruling 20 makes him the explicit exception whose whole joke is that
he never moves.

---

## 4 · The camera, re-derived rather than inherited

§7: do not keep old numbers because they are old. R3-PREF's curve belongs to
R3-PREF's plate. The replica's own camera is fitted from its four bar stools —
one object type, a known 0.75 m seat, four depths, each with a visible seat and
a visible floor contact:

    seat drawn 160 px with feet on row 640
               200 px               727
               233 px               820
    -> h(y) = c(y - E),  E = 292,  c = 0.460 for 0.75 m
    -> a 1.75 m man: k = 1.073

Cross-checked against the card chairs (0.95 m to the back top): k = 0.99. So
**k = 1.03 ± 5%, horizon y = 292**, and every clearance below is computed with
the pessimistic 1.073, because a margin proved with a too-small Thad is not a
margin.

**R3-PREF was k = 0.8494, horizon 239.** The replica is a different camera: a
man at y800 is 545 px here against 476 px there, about 14% bigger. The room
JSON's existing `scaleMode` curve is wrong for this plate and would be
re-authored in Phase C.

## 5 · How approach actually works in this engine

No Room 3 hotspot declares a `walkTo`, and none needs one.
`GameScene.approachPoint` walks Thad at the target's **nearest edge** and stops
a radius short, in **his own body heights** — `content/ui/verbs.json`: **2.0**
for examine verbs (LOOK AT, LISTEN TO, and TALK TO via `conversationVerbs`) and
**0.5** for hands-on — then snaps to walkable ground with `nearestFloor`.

Two consequences decide most of the matrix:

* An examine radius is 700–900 px in this room, so almost everything answers
  from where Thad already stands. The only demanding target is the **piano**,
  which is hands-on: A8 tunes it for the filing fee and doc 16 gives it OPEN.
* **Ambient NPCs do not block walking.** `isWalkable` consults the walkbox
  polygon and nothing else; there is no actor collision in the engine. So "with
  nine patrons installed" is never a pathing question and always the
  looks-right question §25 asks.

## 6 · The access matrix (all nine placeholders standing)

21 of 22 targets clean. Full data in `spatial.json`.

| target | visible | clickable | approach needed | route with nine installed |
|---|---|---|---|---|
| front_doors (exit W) | PASS | PASS | no — gap 0 / need 840 | PASS |
| back_room_door (exit) | PASS | PASS | yes — 1036 / 840 | PASS |
| **piano** | PASS | PASS | **yes, hands-on — 318 / 210** | **PASS** |
| handbill | PASS | PASS | no — 410 / 840 | PASS |
| window | PASS | PASS | no — 344 / 840 | PASS |
| portrait | PASS | PASS | no — 772 / 840 | PASS |
| card_table | PASS | PASS | no — 636 / 840 | PASS |
| cards (abandoned hand) | PASS | PASS | no — 747 / 840 | PASS |
| stove | PASS | PASS | yes — 953 / 840 | PASS |
| stairs | PASS | PASS | yes — 1124 / 840 | PASS |
| bar | PASS | PASS | yes — 1045 / 840 | PASS |
| back_bar | PASS | PASS | yes — 1324 / 840 | PASS |
| card_1..4 (incl. Card Sharp) | PASS | PASS | no — 516–831 / 840 | PASS |
| bar_1 (One-Strike) | PASS | PASS | yes — 1039 / 840 | PASS |
| bar_2, bar_3 | PASS | PASS | yes | PASS |
| stove_man | PASS | PASS | yes — 860 / 840 | PASS |
| deke_RESERVED | PASS | PASS | no — 279 / 840 | PASS |
| **landing_man** | **FAIL** | **FAIL** | — | — |
| **chandelier** | **FAIL — outside the band** | **FAIL** | — | — |
| **spittoon** | **FAIL — outside the band** | **FAIL** | — | — |

### The piano gate, in full (§12)

With all four card placeholders seated: Thad stands at **(628, 636)**, 354 px
tall, facing the keyboard. Gap to the piano's nearest edge **66 px** against a
hands-on radius of **177 px**, so the engine does not even have to move him
once he is in front of it. His shoulders span x 568–688; the nearest card chair
starts at x 715, clearing by 27 px. He crosses no chair, stands inside no
table, overlaps no player, and approaches from the front-left, which is the
side a man stands at an upright piano. Route in `H-piano-card-access.png`.

**PIANO: PASS.**

### Two audit bugs worth recording

Both produced false failures and both were in the tool, not the room. The
obstacle model first used each object's **drawn rectangle** rather than its
**floor footprint** — a chair's drawn rect reaches the top of its back, the
ground it occupies is its four feet — and reported sixteen failures that were
not there. And the route function first aimed at **staging points this audit
invented** rather than the point the engine would stop at, which is usually
before Thad has left the middle of the floor.

## 7 · Classification (§20)

| element | class | note |
|---|---|---|
| walls, dirt floor, doors, window, stairs, back bar, counter, stools, rail, chairs, table | **A** static plate | complete in the replica |
| handbill, portrait, mirror, cards (abandoned hand), spittoon, chandelier | **B** static + hotspot | spittoon and chandelier are outside the band |
| **piano** | **C** stateful | A8 tunes it, doc 16 gives it OPEN — the lid rises. The replica bakes the lid CLOSED, which is the correct base state; the open-lid overlay is Phase C work drawn from this piano |
| **stove fire** | **C** stateful | the replica bakes it LIT. Doc 16 note 4's third LISTEN says it has gone out and nobody has noticed — carried by words today, but `corrected-03/stove-fire-overlay.png` is the precedent if the art ever follows |
| wall lamp, chandelier candles | **C** stateful | doc 35 names both as light sources; palette cycling is void (errata 54) so any breathing is an overlay |
| card_1–4, bar_1–3, stove_man, landing_man, Thad, future Deke | **D** runtime actor | none baked — the whole point of the replica |

## 8 · Deke and the raccoon

**Deke (§22):** reserved at **(560, 706)**, footprint 141 × 427, approach
(640, 760), inside the walk polygon, clear of the piano base and of every card
chair, with the entrance route open. A3 sells Thad a claim in this room, so the
position is beside the front half of the floor where a man would button-hole an
arrival. Old coordinates were not consulted. **VIABLE.**

**Raccoon (§23):** canon does not put it in this room. `docs/01-bible-v2.md`:
*"lives in the hole at Prosperity"*, and puzzle A5 is entirely at the claim.
There is no Nugget raccoon requirement to reserve space for, and inventing one
would be the opposite of feasibility work. Nothing touched, no flags read.

---

# THE THREE GATES

## VISUAL REPLICA GATE — **PASS**

Same Nugget, same perceived scale, substantial architecture, real depth, dark
frontier night, warm practical light, the long bar still the dominant depth
device, the card table still the social centre, the stove still rearward, the
piano still in the composition, the dirt floor continuous, and — for the first
time in this room — a stove-side bar terminus that is actually built. Zero
people. Every piece of furniture the seven men were hiding is complete.

## GAMEPLAY-SPATIAL GATE — **FAIL**

21 of 22 targets clean and the piano gate passes convincingly. It fails on one
thing and it is not recoverable by framing: **the landing cannot hold a man,
even in the uncropped source**, and the landing man is one of the canonical
nine.

## FUTURE-ACT COMPATIBILITY GATE — **FAIL**

The piano's A8 base state is right and Deke has a viable position. It fails
because **the chandelier and the spittoon fall outside every usable band**, and
both are canonical hotspots in `nugget-candidate.json` — and the spittoon is
also the room's only `occlusionPlane`. A plate that cannot show them cannot
carry the room's declared contract.

---

# MINIMUM CORRECTION REQUIRED

Not "fix it when characters are added". The source must be re-made so that
**everything §4 lists fits inside 691 rows of a 1536-wide frame** — which means
the room drawn with roughly 30% less vertical spread than this source has:

1. **the landing brought down into the room** and given real headroom — a
   platform a 1.75 m man can stand on with the ceiling above him, not a shelf
   at the top edge;
2. **the chandelier hung lower**, inside the same band as the card table;
3. **the spittoon moved up** onto the near dirt inside the band rather than
   below it;
4. the card table and the bar left exactly where this source has them — they
   are the two things that agree, and they are what the replica got right.

That is one framing brief, not four repairs, and it needs a generation the
replica category no longer has capacity for. **The capacity decision is
Tyler's.** Everything else the replica achieved — the people-free furniture,
the resolved bar terminus, the continuous dirt, the clean foreground — is
preserved in `pref-replica-02/source.png` and should be the primary reference
for whatever comes next.
