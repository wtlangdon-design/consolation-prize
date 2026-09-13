# ROOM 3 — R3-PREF PEOPLE-FREE REPLICA, PHASE A

Owner ruling, 2026-09-13: stop decomposing R3-PREF and recreate its visual
result people-free. Phase A only. **Candidate art. Nothing is promoted, no room
JSON changed, no character work begun.**

## The ledger, audited rather than recalled

`art/staging/ledger.json` held **53 attempt rows** before this phase: 49 art
operations and 4 `smoke-test-card` harness rows. The four clean-sheet operations
(card ×2, bar ×1, shell ×1) are among the 49 and stay exactly as written,
rejected direction and all.

New category `room-03-pref-replica-plate`, cap 2, `attemptsTotal` 56 → 58. The
rejected clean-sheet's three unspent authorisations (bar 1, shell 1,
stove/landing 1) are **not** moved here and are not spent.

Both replica operations were used. Capacity remaining: **0**.

## Why operation 2 was spent

Operation 1 (`pref-replica-01/source.png`) came back **recognizably the Nugget**
— sec.18's test for refine-versus-stop — with zero people and completed
furniture. Three concrete defects, all in sec.19's valid list:

| | defect | outcome |
|---|---|---|
| 1 | no landing platform at the head of the stairs | **partly fixed** — a platform with a balustrade now exists, but at source y≈103 |
| 2 | the counter's far end had an end cap but its panelling faded into shadow and never met the dirt | **fixed** — end stile, panelling to the floor, plinth on the dirt, foot rail terminated on its bracket |
| 3 | the bar's near end too slight to carry the room's depth | **not fixed** — still cut by the frame rather than coming forward |

Operation 2 referenced operation 1 first and R3-PREF second, which is what makes
it a refinement rather than a re-roll: pointing it back at R3-PREF alone would
have asked for the whole room again and got a third room.

## The band, and the measurement that chose it

The endpoint's widest size is 3:2; the play area is 2.22:1. A band is **one
number**, and the replica's landmarks do not agree about it. Each was measured
in the source and asked where the band would have to start to put it where
R3-PREF has it:

| landmark | source y | wants band y0 |
|---|---|---|
| card table, top rim | 394 | **133** |
| bar counter, far end | 401 | **108** |
| chandelier | 36 | 21 |
| brass spittoon | 906 | 301 |

**The spread is the finding and it is not smoothed over: the replica draws this
room's furniture smaller and further back than R3-PREF does, so no single band
reproduces R3-PREF's framing.** A whole-room cross-correlation preferred y204 —
a compromise that puts nothing where it belongs.

**y120** is chosen: the card table and the bar agree within 25 rows and they are
the room's subject. The cost is stated in `F-what-the-band-excludes.png` — the
chandelier, the landing and the spittoon all fall outside the band. **They are
lost from the BAND, not from the ART.** All three are drawn; any of them can be
extracted as a prop later with no image operation, the way Room 5's hanging lamp
was. The band is one number and Tyler can overrule it.

## The §20 replica gate, answered

| | question | answer |
|---|---|---|
| 1 | immediately the same Nugget? | **YES** |
| 2 | approximately the same perceived size? | **YES** |
| 3 | bar still the dominant long depth device? | **PARTIAL** — same trajectory and length; its near end no longer comes forward and command the lower right |
| 4 | card table compositionally where it belongs? | **YES** |
| 5 | stove clearly rearward? | **YES**, and better defined than R3-PREF's |
| 6 | stairs / landing / piano recognizably the same room? | **stairs YES, piano YES, LANDING NO** |
| 7 | dirt floor continuous? | **YES** — luminance std 12.9, R−B 54.8 across the walkable foreground |
| 8 | darkness and warm practical lighting preserved? | **YES** |
| 9 | dense frontier-saloon feeling? | **PARTIAL** — a little more open than R3-PREF, mostly because R3-PREF's seven men fill the middle |
| 10 | every person gone cleanly? | **YES** — all seven boxes gated |
| 11 | hidden furniture complete? | **YES** — the headline result |
| 12 | stove-side bar terminus actually resolved? | **YES** — for the first time in this room |
| 13 | foreground patron area clean and complete? | **YES** |

Ten YES, two PARTIAL, one NO.

## Differences from R3-PREF, not excused

1. **No landing in the play band.** The landing man is one of the canonical nine
   and ruling 20 makes him an explicit exception whose whole joke is that he
   never moves. As framed he has nowhere to stand. **This is the one item that
   would block Phase B if the band stands.**
2. **The chandelier and the spittoon fall outside the band.** Both carry
   canonical LOOK lines and the spittoon is the room's only occlusion plane.
3. **The bar's near end is slighter.** R3-PREF's counter comes toward the viewer
   with a tall front face filling the lower right; the replica's is cut by the
   frame at less mass.
4. **The card chairs are lighter furniture.** R3-PREF's are heavy plank-backed;
   the replica's are turned-spindle dining chairs, and against Thad their backs
   sit a little low.
5. **The room reads slightly wider and more open**, with more bare floor.
6. **The back bar is arranged differently** — open bottle shelves where R3-PREF
   has a large framed mirror as the dominant element.

## What the replica does better than R3-PREF

- The **stove-side bar terminus** is genuinely built: end stile, panelling
  carried to the dirt, base plinth, foot rail terminated on a bracket. Tyler
  rejected this twice; it is the first time it has been solved.
- **The furniture the seven men were hiding is all there**: a complete round top
  with both rims, apron and pedestal; **five whole chairs** including one at the
  empty fifth place; the abandoned face-up hand still on the table; four whole
  stools; an unbroken counter and back bar; a continuous foot rail; continuous
  dirt under and behind everything.
- **Thad's scale works** at all five sampled positions (477 / 392 / 392 / 324 /
  273 px) against the table, the chairs, the counter and the stools.

## Gate

`tools/room03/pref-replica-gate.py` — 17 checks, 0 failures. The people-free
check is not a face detector: each patron box must differ materially from
R3-PREF (a man has gone) **and** match the room immediately around it (what
replaced him is room). Colour distance from the surrounding room came back
between 0.06 and 6.23 on a scale where a surviving figure reads above 22.

Repository checks: typecheck clean, 236/236 tests, `npm run check` 55/56 — the
one red is the pre-existing ACT / `T_RACCOON_NAMED` gate on main, untouched.

## Status

`art/staging/room-03/pref-replica-02/candidate-1920x864.png` is a **candidate**.
`content/rooms/nugget-candidate.json` still draws R3-PREF; no runtime file,
shipping plate, occlusion plane, navigation or dialogue was touched; no
character sheet exists.
