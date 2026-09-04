# ART GATE CALIBRATION, against art Tyler has already approved

Run at commit 6d5f1e37e0d95607a21f98481791a5af56417276 on 2026-09-04T04:42:51Z.

```
PLATES (--kind plate)
  room-00-town-map.png                       PASS
  room-01-stage-road.png                     PASS
  room-02-main-street.png                    PASS
  room-03-nugget.png                         PASS
  room-05-assay-office.png                   FAIL
  room-13-undertakers.png                    FAIL
  room-18-hotel-lobby.png                    FAIL
  room-19-thads-room.png                     FAIL
  room-29-high-ridge.png                     FAIL
  room-36-main-street-dawn.png               FAIL
  title-screen.png                           FAIL

SPRITES (--kind sprite)
  ambient-dog.png                            PASS
  ambient-letter-writer.png                  PASS
  ambient-map-seller.png                     PASS
  ambient-patrons-cards.png                  PASS
  ambient-pie-woman.png                      PASS
  thad-stand-front/stand-00.png              PASS
  thad-walk-left/walk-03.png                 PASS
  thad-aboard-coach-right/aboard-coach-00.png PASS
  hob-stand-right/stand-00.png               PASS
```

## THE STAGING AND PROVENANCE CHAIN, EXERCISED NON-DESTRUCTIVELY

No API call, no shipping asset touched. The staged file is a copy of an
already-approved plate, so what is being tested is the custody machinery
rather than the generator.

```
1. the staging refusal, on a shipping path
   refused: refusing to write art/backgrounds/room-01-stage-road
2. a staged attempt, recorded from an asset already in the tree
   recorded attempt 2 of exercise-plate
3. promotion refused before the gates have run
   refused: exercise-plate attempt 1 is not visually accepted
4. the gates, then promotion refused for want of visual_accepted
   refused: exercise-plate attempt 1 is not visually accepted
5. the budget
   2/6 attempts, 0 billed tokens, ok=true
```

**Every refusal fired.** The adapter will not write outside `art/staging/`;
promotion refuses an attempt whose technical gates have not run, and refuses
again once they have passed, because `visual_accepted` is false and only
Tyler sets it. The exercise artefacts were removed afterwards and the ledger
left initialised and empty.
