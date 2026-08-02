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

Generations B and D are amended to carry light **on the object only** — the globe, the lamp housings, the warm rim on a coat.

**Ground light is the runtime's job, and errata 54 changed what that job is.**

*This paragraph has been wrong twice. It first said "an authored additive mask," which was ambiguous — a translucent RGB overlay would have produced colours outside the locked 256. It was then narrowed to index remapping through authored warm ramps, the mechanism doc 18's cycling used. **Errata 54 voids that too**: there are no indices any more.*

**The mechanism now:** a soft radial glow texture, additively blended, anchored to the lantern and drawn as its own sprite. In full RGB that is one texture and a blend mode, native to Phaser. It travels with the carrier, scales with his depth zone, and never touches the plate.

Everything D6 and D8 were working around dissolves:

- **The flame.** Issue X5 found palette cycling was background-only, so a sprite lantern could never have flickered under the old spec. Flicker is now modulation of the glow's alpha or tint over time. No frames.
- **The interim plate is useful again.** It remains the single authored sample of what Room 1's mud looks like lit, so it is the reference for the glow's colour and falloff — not a discarded asset.
- **Hob's own warmth is already right.** The lantern's light on his coat, hand, sleeve and hat brim is painted into the sprite and travels with him correctly. That was always the right place for it.

**What is lost, and it is accepted:** an additive glow does not respond per-material. Wet ruts and dry mud brighten identically, where genuinely lit art would differ. Index remapping would have preserved that and is no longer available.

**Unchanged and still binding:** no mover layer contains light cast on the ground. The glow is a separate sprite, never part of the figure.

*Found in review of `docs/37`. The error was in switching between authored art and differenced art without noticing they behave differently under translation.*

## D9 · One design per object; every pose authored from it

The generations acquire **reference art**, not animation. Hob needs a walk cycle with a synchronised lantern swing; the driver needs seated, standing, climbing, reaching, case-handling and return; the case needs roof, mud and carried states. All are authored at native from a single generated design. The case is generated **once** — two generations of a 22 × 12 object produce two different cases.

## D10 · The coach layer is cut into components before it moves

A flat coach-and-team layer translated rightward reads as a cardboard cutout. Before the departure is authored the recovered layer is separated into coach body, near and far wheels, two horses, each horse's head, legs, harness and traces, the lamps, and the driver's attachment point. Root motion moves the assembly; components animate against it.

## D6 · Hob's lantern rides in his sprite

**Amended by D8, and again by errata 54.** Doc 17 note 0: *"He does not stop walking."* The figure and his lantern travel together as one sprite layer, and nothing is baked into the plate. **But the ground pool does not travel with him** — it is a separate additive glow sprite anchored to the lantern, per D8 as revised. The D generation produces the figure and the lit lantern only. The interim plate is **retained**, not discarded: it is the single authored sample of what that ground looks like lit, and therefore the reference for the glow's colour and falloff.

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

## X4 · The step grammar exists; the host ignores the actor and the opening emits no choreography

*Corrected. The first version of this entry said `walk`, `face` and `chore` steps do not exist. **They do.** The error and how it was made are recorded below, because the method that produced it will produce others.*

**What exists.** `Sequence.ts` defines six step kinds — `walk`, `waitForActor`, `face`, `chore`, `say`, `wait` — each carrying an `actor` id, with a `SequenceHost` interface whose `walk`, `face` and `chore` all take an actor argument. The grammar is complete and does not need inventing.

**Three defects, all in the layers around it.**

1. **The host discards the actor.** `GameScene.host()` implements every motion method as `(_actor, …) => { this.actor.… }`. The argument is received, named to silence the linter, and never used. **Every `walk`, `face` and `chore` drives Thad**, whichever actor the step names. A driver chore today animates Thad.
2. **`Opening.stepsFor` emits only `say` and `wait`.** Doc 17's visual descriptions — the coach arriving, Thad climbing down, the case landing in the mud, the departure with wheels turning, Hob crossing — never lower to anything executable. The runtime waits eight seconds while a beat says the coach arrives, and no coach moves.
3. **`say` carries a speaker the host does not use.** The id is in the data and reaches the host, which displays the line and nothing else — no speaker position, colour or performance.

**Beat 9 additionally has no carrier.** Hob's crossing is a player-control beat and the opening runner completes before anything schedules it.

**How the wrong version was reached, recorded as a method note.** The claim rested on a grep of `GameScene.ts` for `step.actor` and `case 'walk'` that returned nothing. It returned nothing because the host is written as arrow functions with a `_actor` parameter, not as a switch over step kinds. **Absence of a grep match was treated as absence of the feature.** A failed search is evidence about the search.

**Not a blocker on art acquisition.** This is doc 34's integrated proof, which errata 52's stop condition already waits on. Generations and runtime work proceed in parallel.

## X5 · Palette cycling is background-only, so Hob's flame cannot use it

`PaletteCycling.ts` states it is the only background animation the game has, and `CyclingBackground` builds its element list from `room.cycling`. Sprites are never cycled.

`stage-road.json` declares `hobs_lamp` as a cycling element over `accent_gold` — a **room** element, from when the lamp was painted into the plate. Under D6 the lamp is a sprite, so **the flame must be authored as sprite frames** unless sprite cycling is added. The declaration is stale and will silently animate nothing.

---

# PART THREE — OPEN, AWAITING A DECISION

## Q1 · Two horses or three — **RULED: two**

Doc 05's written LOOK line: *"Two horses I can see and I am told there are four more. They have their heads down and they have earned it."*

`tools/pixelart/room01/team.py` draws **three**, justified by counting nine hoof contacts in the original generated image. Errata 53 changes no written line, so the line is canon and the procedural art disagrees with it.

**Ruled by the project owner: two.** `docs/37` specifies two. `tools/pixelart/room01/team.py` disagrees with canon and is superseded.

## Q2 · Which way is Main Street — **RULING RETRACTED, OPEN AGAIN**

The frame-right ruling was withdrawn by its author on the grounds that it was made without reconciling the visible town, the written lines and the coach's direction.

**The proposed resolution, coherent but not yet adopted:**

| | |
|---|---|
| Frame right / east | The coach's departure, and the road toward Thad's distant home. `road_east`'s written line — *"Home is that way. It is eleven hundred miles that way"* — stands unaltered |
| Into depth, toward the visible town | Thad's route to Main Street. Doc 29 already supports this as a road-into-depth transition: the actor walks away from camera, scales down, and the next room opens at a far-depth entrance |
| `road_west → main_street` | Conceptually correct; the exit rect is re-derived from the new plate per Q4 |
| Errata 43 | Its west-to-east ordering either inverts to Lower Street · Main Street · Room 1, or drops the cardinal wording, which was never load-bearing |
| Main Street | Receives Thad at a far-depth entrance |

This fits the picture, the coach's departure and every written line without moving any of them, which is the strongest thing that can be said for it.

**It amends errata 43 and therefore is not mine to adopt.** Recorded and awaiting the project owner.

**Does not affect the Room 1 generations** — the coach departs frame right under every reading.

## Q3 · The second signboard — **RULED: remove the mark**

A small placard on the fence, roughly x 115–165, y 68–100 at native, carries an illegible mark. Doc 17's hotspot set has one sign. **Ruled by the project owner:** remove the mark so the board reads as ordinary scrap, not a second sign or a false hotspot. Hand-removed at native, no regeneration.

## Q4 · Room 1's hotspot and walkable geometry must be re-derived

Every rectangle in `stage-road.json` — `walkable`, `hotspots`, `exits`, `cycling.bounds`, `lightSources` — was measured against the **composed** plate that errata 53 discarded. Those numbers describe art that is no longer the art.

**They are not a specification and new work must not be checked against them.** What survives is the hotspot *set* and its written lines, which come from docs 05 and 17 and which errata 53 explicitly does not change. Geometry is re-derived from the new plate once the mover layers exist; errata 53 condition 3 requires it settled before any tracing.

## Q5 · Rooms are designed to change across acts, and the schema cannot express it

**The design assumes act variation.** Doc 20 declares Room 36, *Main Street, dawn*, as replacing Room 2 after F5 — a full act variant with its own background, already in `art/backgrounds/`. Doc 01's reveal schedule reframes rooms narratively rather than physically: *Hob is Mott* lands in Act III and, in the bible's own words, reframes the opening scene. And several rooms carry paired state hotspots with their own written lines — `coach` / `coach_gone`, `lamp` / `lamp_gone`, `case_roof` / `case_mud`.

**Three things are missing.**

**1. No gating field exists.** Across all ten implemented room records — 83 hotspots — **not one is gated by act or flag.** There is no `requires`, `unless`, `whenAct` or equivalent in the room schema. State variation is expressed by duplicating a hotspot under a second id and relying on something else to decide which is live. That works for two states of one object and does not scale to four acts across 44 screens.

**2. Room 36 is the only declared act replacement in the entire map.** Monkey Island changed Mêlée substantially between acts. One replacement room is thin by comparison, and the question of which other rooms should get Act II, III or IV variants has not been asked.

**3. The cost lands on art, not code.** An act variant is a new plate, a new mover set and new written lines. Deciding this late is expensive; deciding it before the generation campaigns for Act I rooms is nearly free, because a room that will get a dawn variant can have its lighting planned for from the first generation.

**What is not in question:** the written content already supports revisiting — doc 05's variant discipline, errata 19a's per-state line sets, and the reveal schedule all assume the player returns to places and finds them meaning something different.

**Awaiting a decision on:** which rooms get act variants beyond 36, and whether the room schema gains a declarative gate or continues to duplicate ids. The second is an engine question and belongs with doc 34's coordinator work rather than ahead of it.

## Q6 · What errata 54 leaves unspecified

The presentation ruling replaced the spec but did not supply everything the old one provided. Each of these is open and none is mine to settle.

**The font.** The 1-bit 5 × 7 was sized for 320 × 200 and is unusable at 1920 × 1080. Nothing replaces it. Doc 06 forbade rasterised system fonts because they anti-alias at 320 × 200 — that objection dies with the resolution, so a system or webfont is now viable, but the choice is a look decision.

**Depth scaling.** 233 px is a character's height *at a stated depth*, not their size. Every room needs a scale curve. Doc 29's walk-box zones survive; the numbers in them do not.

**How anything in a room moves.** Palette cycling was the only non-sprite motion and it is void. Room 1's puddles and Hob's flame both relied on it. Errata 35a's floor — every room has at least one animated element — now costs sprite frames everywhere, in 44 rooms. This may warrant revisiting 35a.

**Room 1's plate is 1870 × 841 against a 1920 × 864 target.** A 2.7% upscale is accepted rather than regenerating an approved plate. Future rooms should be generated at play-area size, though the generator does not honour exact sizes and rescaling a painting is nearly free.

**Whether Main Street scrolls.** Unchanged by errata 54 and still open under D7.

## Q7–Q10 · The actor clip inventory

Raised in `docs/40-actor-clip-inventory.md`, which lists every clip every character needs. Four open questions fall out of it:

**Q7 · Does `talk` exist?** Doc 35's sprite manifest lists a talk clip. `content/actors/thad.json` does not declare one. One of the two is wrong.

**Q8 · Do `pickup` and `reach` need all four facings?** A pickup seen from behind is nearly invisible. Two facings may serve, which halves the work across 27 characters.

**Q9 · `thad.json` describes the voided spec.** Measured on main: `threshold 30`, near height `40`, far height `26`. Two drawn sizes, a decimation threshold of 30, a 40px character height — all voided by errata 54. The file needs rewriting for 233px and depth scaling regardless of any new clip.

**Q10 · Surface variants.** The record declares mud and boardwalk variants of every clip, doubling the count. That was a footstep-appearance decision under the old spec. Whether it survives errata 54 is the difference between 12 and 24 clips per character.

## Q11 · Does Thad visibly carry the case?

Two binding options, and the choice cannot be deferred past the case pickup being staged.

**Inventory abstraction** — the case vanishes into inventory on pickup. No extra art.

**Visible carry** — a separate `carry` locomotion family: stand plus walk in all four facings, with the case as a prop on a hand socket. **A full extra locomotion set**, and the ordinary walk cannot be silently reused for it.

The case is on screen through most of Room 1's opening, which argues for visible carry. It is also 36 extra frames for one prop.

## Q12 · Does Thad's appearance change after the Act III coffin?

Act III nails him into a coffin and lowers him into the ground — the sequence the bible calls the only one where the player can believe the game has broken.

**If he looks different afterward, that is a second complete character.** A new identity master and every clip regenerated against it: four facings × walk, idle, idle-break, stand, recoil, and every chore. Not a variant — a full second costume.

**The cost is asymmetric in time, not just in frames.** Acquired now, while the character is established in the generator's context, it is one session. Acquired in six months it means re-establishing him from scratch and hoping the result matches art already shipped in Acts I and II.

A prompt is written and held in `docs/42-thad-chore-poses.md` Part Three. **It is not to be run until this is ruled.**

Related: whether any other character changes across acts, and whether Q5's act-variation schema needs to cover costumes as well as rooms.

## Q15 · Asset-path validation — **CLOSED, and worth reading anyway**

**The failure.** `rm -rf art/actors/thad-*`, run to clear stale rig output, took `thad-near.png` and `thad-far.png` with it. `content/actors/thad.json` still named both. The deletion was committed, the protagonist had no art, and the deployed page rendered black. **The full suite passed** — twenty-four checks green on a tree where the player character could not be drawn.

**The worse part.** The restore commit was described as arriving *"with an asset-reference check that would have caught it at commit time."* It contained two PNGs and nothing else. The check had been run once as an ad-hoc command in a shell and reported as if committed. **A gap believed to be closed is worse than a gap known to be open**, because the belief stops anyone looking.

**How it was caught.** Not by reading the validator list — by moving `thad-near.png` aside and running the suite. It passed. That is one command, and it is the only kind of confirmation that would have worked.

**Closed by** `tools/check-asset-paths.mjs`, registered in `run-all.mjs`. Walks every content record generically rather than naming fields, since the next field nobody thought of is what it is for. 25 asset paths declared on main, all resolving. **Verified by re-running the exact deletion:** fails with `manifest.actor/sizes/near/sheet declares art/actors/thad-near.png -- no such file`, passes again on restore.

**It fails on zero, not passes.** Finding no asset paths at all would mean the content shape changed and the check had quietly stopped checking — the same failure one level up.

**Not covered:** clip directories. The ActorFile schema cannot address `thad-recoil-left/` at all, which is Q14 and a schema question rather than a missing-file one.

---

# HOW THIS DOCUMENT WORKS

Entries are added, not rewritten. When the project owner rules on an open question it moves to Part One with the ruling recorded. When doc 34's stop condition lifts — integrated proof action, canonical street loop, safe save/load/title flow all executable — this list is reviewed in one pass and whatever still deserves to be global becomes errata.

**Nothing in this file overrides anything. It records.**
