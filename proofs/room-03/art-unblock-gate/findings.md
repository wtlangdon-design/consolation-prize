# ROOM 3 ART UNBLOCK GATE — OPERATION 49 FAILS ITS GEOMETRY GATE

**Date:** 2026-09-12 · **Start:** `0a02add`, ledger 48/48 · **End:** ledger **49/51**
**Operations 50 and 51 NOT spent.** §4 and §5 gate them on 49 passing, and 49 does not pass.

---

## 1 · What operation 49 got right

Masked edit over the accepted card area (`cluster-card-01`'s own framing, so the round trip is
the one already written down: canvas `(cx, cy)` is plate `(655 + cx/2, 110 + cy/2)`). The mask
freed the four men and their four chairs and kept everything else, including two things §4 names
as immutable — the empty fifth chair and the abandoned fifth-place hand.

It is a genuinely good picture. The four men and their chairs are gone. The wall, window,
portrait, stove and lit firebox, door, piano, piano stool and packed dirt floor all continue
correctly. The empty fifth chair survives. Nothing was invented, added or restyled. The table's
**far rim matches to within 1–3 px** and the near rim **matches exactly (0 px) in every column
the mask kept**.

The endpoint also respected the mask far better than the bar rebuild did: **5.96 mean difference
over the kept region, 6.1% of pixels beyond 16 levels** — against 32.6% for the bar rebuild. The
masked-edit method is sound.

---

## 2 · Why it fails anyway

**The table's near-left rim receded where the endpoint was free, and the abandoned hand now
overhangs the edge.**

Near rim by column, found as the bright-to-dark step at the table's lit lip. The columns the
mask kept are the control — they must read zero, and they do:

| plate x | accepted | op49 | delta | |
|---|---|---|---|---|
| 840 | 410 | 399 | **−11** | freed |
| 850 | 412 | 400 | **−12** | freed |
| 862 | 413 | 400 | **−13** | freed |
| 875 | 407 | 401 | **−6** | freed |
| 888 | 400 | 419 | +19 | kept (mask boundary artefact) |
| 900 | 420 | 420 | 0 | kept |
| 912 | 421 | 421 | 0 | kept |
| 924 | 421 | 421 | 0 | kept |
| 940 | 419 | 420 | +1 | kept |
| 955 | 413 | 413 | 0 | kept |

**Zero drift everywhere the mask held the rim; 6–13 px of recession everywhere it did not.**

The abandoned hand sits at plate x 858–896 — exactly across that transition. In the accepted
composition the two cards lie flat on the tabletop, well inside the rim. In the output the same
cards **overhang the edge**, with the table's lit lip cutting beneath them. Panels 4 and 5 of the
contact sheet show it at 4× and it needs no measurement to see.

**And the hand was repainted despite being outside the mask.** Mean difference **52.01**, max
**165**, in a rect whose surroundings averaged 5.96 — so this is a real change, not global noise.
The pips and the card angle both differ. §4's instruction was "Do NOT: alter abandoned hand."

Two playing cards floating off the edge of a table is not a subtle metric. It is a visible defect
in the one object §4 froze hardest, and the asset cannot ship as it stands.

---

## 3 · A CORRECTION to the 0a02add report — the bar premise is false

This matters more than operation 49, and it is my error to correct.

The previous report said `art/staging/room-03/bar-rebuild-01/canvas.png` holds "the canonical
rebuilt bar, complete and empty," and §3 of the work order withdrew the bar_3 counter fusion on
the strength of it. **That canvas is not the bar in the accepted composite.** It is the bar the
endpoint was *given*, and the operation redrew the counter as well as adding the three men.

Measured — counter front top edge:

```
accepted composite   y = 383 + 0.2135 (x - 1185)      at x=1800  ->  y 514
bar-rebuild canvas   y = 381 + 0.280  (x - 1185)      at x=1800  ->  y 553
```

**39 px apart at the right-hand end, and a different perspective pitch.** The stools are in
different places and at different scales; the back bar's bottle row differs. Panels 6 and 7.

I inferred "people-free canonical bar" from a provenance note plus the look of the image, and did
not test its geometry against the accepted composite. That was the wrong standard of proof and I
should have applied the same landmark test I applied here.

### What is actually true of the bar

| Unit | Silhouette | Background behind him |
|---|---|---|
| bar_1 | needs an operation | **missing** — no people-free source at accepted geometry |
| bar_2 | needs an operation | **missing** — same |
| bar_3 | needs an operation | **EXISTS** — `rebuild-04/plate-room-03-empty.png` rects [1619,195,1820,795], reconstructed deterministically at the accepted geometry and already committed |

So §3's withdrawal of the counter fusion **holds for bar_3 and only for bar_3** — his clean
background is real, so he needs no fused counter section and no `floor_5` notch. bar_1 and bar_2
cannot be composited at all until a further environment operation exists, which is not authorized.

Operation 51 as specified — three silhouettes to overlay on "the already-existing canonical empty
bar" — would therefore produce two assets with nothing correct to stand on. That is a second,
independent reason not to spend it before Tyler has re-decided.

---

## 4 · What would unblock the card table

Stated for a decision, not taken.

1. **One more masked operation with the mask cut at the rim rather than around the men.** The
   failure is specific and understood: the endpoint pulled the rim in exactly where it had
   freedom. A mask that frees the men's bodies but *keeps a continuous band along the whole
   fitted rim ellipse* removes that freedom — the control columns prove a kept rim comes back at
   0 px. This is the narrowest possible retry and it is the one I would recommend.
2. **Accept the table as drawn and move the abandoned hand to suit it.** Cheapest, no operation,
   but it changes accepted composition and the cards are a canon gag.
3. **Abandon the clean-environment route for the cards** and keep the four men baked, with the
   architecture applied to the bar only. Contradicts §0.

---

## 5 · Reproducing

```
python3 tools/retrofit/nugget-card-clean-mask.py --preview   # the mask, and why it keeps what it keeps
python3 tools/retrofit/nugget-op49-gate-proof.py             # the measurements above, and the sheet
```

Ledger row: `nugget-card-clean` attempt 1, gates PASS (format), geometry gate **FAIL**.
`nugget-card-ensemble` 0/1 and `nugget-bar-units` 0/1 remain unspent at 49/51.
