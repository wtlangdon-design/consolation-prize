# THE LAST CLAIM IN CONSOLATION
## The Issue List

*Errata 52's stop condition: new findings enter a finite issue list unless they expose data loss, unwinnability, inaccessible control, or a direct canon contradiction. This is that list. **Nothing here is a global design ruling.** Entries are decisions already taken by the project owner, questions awaiting his decision, or defects found in existing documents.*

*Opened during the Room 1 art session, after doc 35 and errata 53.*

---

# PART ONE — DECIDED

Recorded so they are not relitigated. None of these needs a new errata ruling; each either applies an existing one or corrects a scope error in how one was being applied.

## D1 · The plate is frozen as generated

Room 1's plate comes from the generator at 1600 × 720 and is **not hand-corrected before the room's other generations exist.** Measured: every 5 × 5 block is perfectly uniform, so the image is genuine 320 × 144 pixel art at 5× and decimation to native is lossless rather than approximate.

## D2 · Everything that moves is a sprite drawn on top

Per gate section 2 and section 7, already written. Movers, takeables and absent-later objects are sprites; the plate holds only what is present in every state of the room.

## D3 · Errata 53's condition 2 was being applied outside its scope

Condition 2 — movers come from companion generations rather than from cutting — was written for the case where **a generation contains the object and the plate behind it must be recovered.** Under doc 35's gate, plates are generated clean and contain no movers, so there is no hole to fill and nothing to subtract out. Condition 2 governs repair, not the primary pipeline.

**Where it still binds:** promoting something out of a finished plate in order to animate it — a swaying sign, a turning windmill — does leave a hole. At 320 × 144 that is hand-patched in minutes and does not require a regeneration.

## D4 · Movers are obtained by additive edit and subtraction

The generator is given the plate and asked to **add** one object. The object is recovered as the difference between the two images, arriving already cut out, positioned, scaled and lit to match the ground.

Evidence: the Room 1 interim plate changed 95,350 pixels, all inside one bounding box, with 1,056,650 pixels untouched, and the signed difference was cleanly warm (+57 R, +35 G, +10 B).

**Animation frames are authored by editing the recovered layer, never by generating a second time.** Two generations of the same object drift.

## D5 · Room 1 needs six generations, chained

```
A  PLATE                                   (exists)
├─ B = A + coach + two horses              attach A
│  ├─ C = B + driver on the box            attach B
│  └─ E = B + case on the roof rack        attach B
├─ D = A + Hob crossing with lantern       attach A
└─ F = A + case in the mud                 attach A
```

The driver is separate from the coach because doc 17 beats 2 and 6 have him climb down and climb back up. The case is separate because doc 17 gives it three states. **Chain order is binding:** C generated from A rather than from B produces a different coach and an unusable difference.

Prompts: `docs/37-room-01-generation-prompts.md`.

## D8 · No mover layer may contain light cast on the ground

**Corrects D6 as originally written.** A layer recovered by subtraction is not light — it is **the lit pixels of the specific ground that was beneath the object at generation time.** Translating Hob's pool would carry that mud, those ruts and those puddles across whatever it passed over. The same applies to the coach lamps' glow on the road.

**The separation required:** Hob's opaque body · the lantern and flame · the lantern's ground-light mask · the coach and team · the coach lamps · the coach lamps' ground-light masks. The first two travel with the figure. The masks alter whatever background pixels are beneath them at the moment they are drawn, and therefore cannot be baked into a sprite.

Generations B and D are amended to carry light **on the object only** — the globe, the lamp housings, the warm rim on a coat. Ground light is the runtime's job: doc 15's P5 radial pass, or an authored additive mask applied at native.

*Found in review of `docs/37`. The error was in switching between authored art and differenced art without noticing they behave differently under translation.*

## D9 · One design per object; every pose authored from it

The generations acquire **reference art**, not animation. Hob needs a walk cycle with a synchronised lantern swing; the driver needs seated, standing, climbing, reaching, case-handling and return; the case needs roof, mud and carried states. All are authored at native from a single generated design. The case is generated **once** — two generations of a 22 × 12 object produce two different cases.

## D10 · The coach layer is cut into components before it moves

A flat coach-and-team layer translated rightward reads as a cardboard cutout. Before the departure is authored the recovered layer is separated into coach body, near and far wheels, two horses, each horse's head, legs, harness and traces, the lamps, and the driver's attachment point. Root motion moves the assembly; components animate against it.

## D6 · Hob's lantern rides in his sprite

**Amended by D8.** Doc 17 note 0: *"He does not stop walking."* The figure and his lantern travel together as one sprite layer, and nothing is baked into the plate. **But the ground pool does not travel with him** — it is a runtime mask, not part of the sprite. The D generation produces the figure and the lit lantern only. The interim plate has no role as a plate and is discardable; its only residual value is as the single authored sample of what that ground looks like lit, should a runtime radial pass ever want a lookup table.

## D7 · Scrolling and errata 43's topology are orthogonal

Errata 43 governs **how many screens exist and whether the player walks between them.** Camera scrolling governs **the view within one screen.** SCUMM did both, and MI1 had several separate locations of which some were wider than the viewport. Three connected street screens with Main Street authored wider than 320 is consistent with errata 43, not a reversal of it.

Doc 29's caution is narrower than it reads at a glance: it warns against scrolling *merely because a background happens to be wide*, not against scrolling where the composition calls for it.

Room 1 stays a fixed establishing composition.

---

# PART TWO — DEFECTS FOUND IN EXISTING DOCUMENTS

## X1 · Doc 35's worked example contradicts doc 17

Gate section 5 and the Room 1 worked example both require *"an interim plate with the pool baked at Hob's mark."* **Doc 17 note 0 states Hob does not stop walking**, and doc 17 v2 says Hob is unchanged and must stay unchanged. There is no mark. Beat 9 is named *Hob's lamp crosses* — the crossing is the beat.

A baked pool is therefore wrong for this room in principle, not merely in size, and gate section 5's own rule — a light carried by a character is never painted into the ground — is the one that governs.

**Status:** superseded in practice by D6. The gate text should be corrected so the next room does not inherit it.

## X2 · Doc 35 section 6 hard-codes the viewport as the plate size

Section 6 requires *"1600 × 720 exactly, which is 5× the 320 × 144 frame"* for **every** room. That silently forbids any room authored wider than the viewport, and so forecloses camera scrolling before the question is asked.

**Correction:** the requirement is 5× the room's **authored width**. 1600 × 720 is the fixed-room case, not the universal one. A two-screen room is 3200 × 720; three-screen, 4800 × 720.

**Caution, not a ruling:** a 3200 × 720 single generation is 4.4:1 and generator drift worsens with aspect ratio. Adjoining panels avoid drift but risk seams. Worth a throwaway test before a real room commits to either.

## X3 · The quantiser will always spill Room 1's sky into the puddle cycling band

`stage-road.json` declares `colours.sky = 237`. The puddle cycling ramp is `accent_indigo` **239–241**. Base sky and reserved cycling entries are two indices apart inside one eight-entry family, so a distance-based quantiser cannot separate them.

Measured on the plate: a plain quantiser put **408 pixels into 239–241, bounding box (7,2)–(305,143)** — reaching row 2, which is sky. It also put 3 pixels into `accent_gold` 225–228 at (109,62)–(128,68), the distant town windows, which would have flickered at 0.6 Hz.

For Room 1 this is structural rather than incidental, and errata 53 condition 1's check must run on every generation for this room, not once.

## X4 · The runtime cannot move any of these movers, and the opening executes none of its own descriptions

Verified against `Renderer.ts`, `GameScene.ts` and `Opening.ts`.

**No general room mover exists.** `Renderer.drawPeople` builds its drawable list from the ambient NPC set plus the single player actor. There is no path for Hob, the driver, the horses or the coach.

**The opening emits two step kinds.** `Opening.stepsFor` produces `say` and `wait` and nothing else. Doc 17's visual descriptions — the coach arriving, Thad climbing down, the case landing in the mud, the coach departing with wheels turning, Hob crossing — are prose that never lowers to anything executable. The runtime can wait eight seconds while a beat says the coach arrives, and no coach moves.

*One correction to the review that raised this: it reports that GameScene ignores the actor named by a sequence step. It does not — `say` carries an actor and honours it. There are no `walk`, `face` or `chore` steps to ignore.*

**Beat 9 additionally has no carrier.** Hob's crossing is a player-control beat, and the opening runner completes before anything schedules it.

**Not a blocker on art acquisition.** This is doc 34's integrated proof, which errata 52's stop condition is already waiting on and which step B is building toward. The generations and the runtime work do not block each other and should proceed in parallel.

---

# PART THREE — OPEN, AWAITING A DECISION

## Q1 · Two horses or three — **RULED: two**

Doc 05's written LOOK line: *"Two horses I can see and I am told there are four more. They have their heads down and they have earned it."*

`tools/pixelart/room01/team.py` draws **three**, justified by counting nine hoof contacts in the original generated image. Errata 53 changes no written line, so the line is canon and the procedural art disagrees with it.

**Ruled by the project owner: two.** `docs/37` specifies two. `tools/pixelart/room01/team.py` disagrees with canon and is superseded.

## Q2 · Which way is Main Street — **RULED, but not yet reconciled**

Three sources disagree.

| Source | Says |
|---|---|
| Errata 43 | Walking order west to east: **Room 1 · Main Street · Lower Street** — Main Street is *east* of Room 1 |
| `stage-road.json` | Exit `road_west` → `main_street`; its LOOK line describes the town with lamps on in about a third of it |
| `stage-road.json` | Hotspot `road_east` LOOK: *"Home is that way. It is eleven hundred miles that way"* — home is Rhode Island, i.e. east |
| Doc 17 beats 6b, 7 | The coach departs **frame right** and recedes **east** |
| Doc 35 worked example | Noticed half of this; ruled the art fine and the doc in need of correction |

**Ruled by the project owner:** Thad leaves frame right toward town, and the stale `road_west` data is corrected rather than a new into-depth exit invented.

**Two things the ruling does not yet resolve, recorded so they are not lost.** The coach also departs frame right, receding *east* per doc 17 beats 6b and 7, which makes one road simultaneously the way to town at two hundred yards and the way home at eleven hundred miles — `road_east`'s written LOOK line is *"Home is that way. It is eleven hundred miles that way."* And the plate places the town visibly in the middle distance centre-left, so under this ruling Thad walks away from a town the player can see. Either the written lines move between hotspots, or the coach departs the other way, or the town's position in the composition is accepted as unrelated to the exit. None of the three has been chosen.

**Does not affect the Room 1 generations** — the coach departs frame right under every reading.

**Does affect** where Thad walks to reach town. The plate places the town in the middle distance, centre-left. Doc 29 already supports a road-into-depth transition — the actor walks away from camera, scales down, passes behind architecture, and the next room opens at a far-depth entrance — which would fit the picture without contradicting the coach's departure. That is a topology ruling and belongs to the project owner.

## Q3 · The second signboard — **RULED: remove the mark**

A small placard on the fence, roughly x 115–165, y 68–100 at native, carries an illegible mark. Doc 17's hotspot set has one sign. **Ruled by the project owner:** remove the mark so the board reads as ordinary scrap, not a second sign or a false hotspot. Hand-removed at native, no regeneration.

## Q4 · Room 1's hotspot and walkable geometry must be re-derived

Every rectangle in `stage-road.json` — `walkable`, `hotspots`, `exits`, `cycling.bounds`, `lightSources` — was measured against the **composed** plate that errata 53 discarded. Those numbers describe art that is no longer the art.

**They are not a specification and new work must not be checked against them.** What survives is the hotspot *set* and its written lines, which come from docs 05 and 17 and which errata 53 explicitly does not change. Geometry is re-derived from the new plate once the mover layers exist; errata 53 condition 3 requires it settled before any tracing.

---

# HOW THIS DOCUMENT WORKS

Entries are added, not rewritten. When the project owner rules on an open question it moves to Part One with the ruling recorded. When doc 34's stop condition lifts — integrated proof action, canonical street loop, safe save/load/title flow all executable — this list is reviewed in one pass and whatever still deserves to be global becomes errata.

**Nothing in this file overrides anything. It records.**
