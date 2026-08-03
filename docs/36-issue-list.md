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

## Q13 · The inventory examine path drops reserved effects

Found during step B, verified independently against the combined tree.

Step B made `VerbSystem.resolve()` **return** effects rather than apply them, so every caller must now hand what it gets to a transaction. One caller does not: `GameScene.onInventoryClick` calls `this.state.verbs.resolve(verb, target, 'inventory').say` and takes only the line. The `effects` array is discarded.

**Nothing is broken today, and that is the whole problem.** A scan of all of `/content` finds sixteen objects carrying a durable effect key, and every one of them is a dialogue option, a room hotspot response, a room `onEnter`, or a sequence beat. `content.items` — the records `itemTarget()` reads — carry none. So the path drops an empty array and behaves exactly as before.

**But the pattern it would break already exists elsewhere.** `harness-a.json` has a `LOOK_AT` response carrying a flag write, so an examine verb with a durable effect is authored content, not a hypothetical. The first item response to gain one will write nothing, produce its correct line, and pass every check.

**The fix is step E's:** route the inventory examine through `GameState` like every other interaction rather than calling `VerbSystem` directly. Recorded here rather than fixed now because step E owns that call site and is rewriting it.

## Q14 · The `ActorFile` schema cannot address a clip directory

Sharper than Q9, and the reason Q9 is blocking rather than tidy-up.

`content/actors/thad.json` declares two sprite sheets, `art/actors/thad-near.png` and `art/actors/thad-far.png`. What `art/actors/` holds *besides* them is per-clip frame directories — `thad-idle-*`, `thad-idlebreak-*`, `thad-walk-*`, `thad-recoil-*`, `thad-stand-*`, four facings each, every one with its own `rig.json`. **The schema has no way to reference any of them.** It knows sheets and it knows a `threshold`, both of which errata 54 voided.

**The consequence is visible rather than silent.** Until the schema can address a clip directory, nothing renders the new art. Every non-player mover draws as a graybox as well — correct size, position, depth and occlusion — because `content/actors/` holds exactly one actor record. No renderer change alters either.

*History, recorded because the near-miss is the useful part.* The two sheets were genuinely absent from this branch when the finding was written, and the finding said so. They had been deleted on main by an `rm -rf art/actors/thad-*` clearing old rig output before a regeneration — the glob took the two sheets `thad.json` loads, the deployed page rendered black, and the project owner reported it. Restored at `2fe1021` — the sheets only; the check that would have caught it did not arrive until `f736152`, which is Q15. This branch predated the restore by four commits, so the graybox was real here and disappeared on merge. **The schema gap is what survives, and it is not affected by the sheets existing.**

## Q15 · Asset-path validation — **CLOSED, and worth reading anyway**

**The failure.** `rm -rf art/actors/thad-*`, run to clear stale rig output, took `thad-near.png` and `thad-far.png` with it. `content/actors/thad.json` still named both. The deletion was committed, the protagonist had no art, and the deployed page rendered black. **The full suite passed** — twenty-four checks green on a tree where the player character could not be drawn.

**The worse part.** The restore commit was described as arriving *"with an asset-reference check that would have caught it at commit time."* It contained two PNGs and nothing else. The check had been run once as an ad-hoc command in a shell and reported as if committed. **A gap believed to be closed is worse than a gap known to be open**, because the belief stops anyone looking.

**How it was caught.** Not by reading the validator list — by moving `thad-near.png` aside and running the suite. It passed. That is one command, and it is the only kind of confirmation that would have worked.

**Closed by** `tools/check-asset-paths.mjs`, registered in `run-all.mjs`. Walks every content record generically rather than naming fields, since the next field nobody thought of is what it is for. 25 asset paths declared on main, all resolving. **Verified by re-running the exact deletion:** fails with `manifest.actor/sizes/near/sheet declares art/actors/thad-near.png -- no such file`, passes again on restore.

**It fails on zero, not passes.** Finding no asset paths at all would mean the content shape changed and the check had quietly stopped checking — the same failure one level up.

**Not covered:** clip directories. The ActorFile schema cannot address `thad-recoil-left/` at all, which is Q14 and a schema question rather than a missing-file one.

## Q16 · The panel layout is provisional and needs the font

The play area migrated to errata 54 by multiplication — 1920 ÷ 320 = 6 and 864 ÷ 144 = 6, and all 140 rects across 17 rooms were integers inside the old frame, so every coordinate moved losslessly. **The panel could not.** 56 × 6 = 336 against errata 54's 216: the panel was re-proportioned, not scaled, which is how 1080 works at all — it is 5.4× of 200, and errata 54 resolves that by shrinking the panel rather than stretching it.

So `content/ui/panel.json` was **re-authored rather than migrated**, and what it preserves is the shape errata 26 and 29 specify and nothing else: three columns of four verb cells, MENU and the map in the fourth row, a four-by-two inventory grid on the right, arrows at the right edge, sentence line full width above.

**Every height in it is a guess, and it is marked as one in the file.** A button's height is a property of the text inside it, and the font is void with no replacement ruled (Q6). The numbers fit the band and hold the shape; they are not a specification. Re-author them the day the font lands.

## Q17 · Ten backgrounds, six foreground planes and two masks are still 320-native

Room 1's plate was promoted to `art/backgrounds/room-01-stage-road.png` at 1920 × 864, upscaled 2.7% from the approved 1870 × 841 by Lanczos. **It is the only play-area-sized plate in the repository.** The other ten backgrounds, all six foreground planes, both of Room 2's occlusion masks and the title screen are 320 × 144.

`Renderer.drawPlate` now stretches any plate to the play area, so each of them lands where its own coordinates say it should — 1:1 for anything already play-area sized, and exactly the 6× the geometry took for anything that is not. **Nothing is mispositioned; the legacy assets are simply six-times-magnified versions of themselves** until they are regenerated. That is a visible quality gap and not a geometry error, and it resolves per room as each plate is generated at play-area size under errata 54's amended gate section 6.

**Room 1's foreground plane is a different case and does not resolve by regeneration alone.** It was cut from the *composed* room, which errata 53 replaced with the traced plate, so it belongs to a picture that is no longer the room. It needs cutting from the approved plate.

## Q18 · What still implements the five things errata 54 voided

Done as a deliberate sweep of the ruling's own supersession list rather than by finding consumers one at a time. Two were already handled; the other three are reported and **not changed**, because each is a ruling and not a cleanup.

**Integer scaling — errata 39's rule. Fixed.** It was `main.ts`, and at a 1920 × 1080 native frame it cropped rather than shrank. Errata 54 supersedes it by name.

**Decimation — errata 24's scaler. Orphaned.** `engine/core/Decimation.ts` has **zero importers** across `engine/` and `tests/`; the last call site left `ActorSprite` when the sprite stopped decimating. It compiles and reaches no bundle path. Seven `tools/pixelart/` modules still use its Python counterpart, which is the art pipeline and not engine work. Residual prose: `scaling.json`'s own note and `types.ts:288` still describe the threshold as the height at which decimation stops leaving eyes, which is no longer what it selects.

**The locked palette — enforced, not merely referenced, and this is the sharp one.** Errata 54 says `consolation-256.json` "ceases to be authoritative. Retained for reference only." Today:

- `Screen.ts:144` **throws** on a palette whose `locked` flag is false. The engine refuses to start without it.
- `check-palette.mjs` is a registered validator asserting locked, 256 entries, 6-bit, fully referenced.
- `manifest.json` declares it as the palette.
- `Screen.colour(index)` is the only route any colour takes, and every room still stores `colours.sky`, `colours.ground` and `hotspots[].colour` as **indices** — deliberately not migrated, because they are not geometry.

So this is not a dangling reference to remove. **The engine's entire colour model is index-addressed** and errata 54 specifies full RGB. Room 1's promoted plate is already full-RGB and reaches the screen untouched, because a background is drawn and never indexed; everything the engine *draws itself* — stub-room fills, hotspot blocks, outlines, all interface chrome — still resolves through the locked 256.

**The 5 × 7 font — live and load-bearing.** `art/ui/font-5x7.json` is in the manifest, `BitmapFont` renders it by writing each lit pixel as an exact 1 × 1 rect, and `check-glyph-coverage.mjs` validates 505 content strings against 102 glyphs. Because the glyphs are literal 1 × 1 rects, **text did not scale with the migration**: it draws at the same pixel size in a frame six times larger, so every line is now a sixth of its former relative size. This is Q6 and it is the most visible unruled item in the build.

### A SIXTH CATEGORY, ADDED AFTER THREE INSTANCES: 320-SPACE CONSTANTS IN CODE

Errata 54's own supersession list names five voided *specs*. This is not one of them. It is the class of thing the ruling did not void and could not reach: **numbers authored as lengths in a 320 × 200 frame, living in `.ts` files rather than in content.** `tools/migrate-play-area-x6.mjs` moved 775 values and every one of them was in JSON, by construction — a migration over content cannot see a constant in code.

Three surfaced one at a time, each while something else was being measured, and each looked like a defect in the thing being measured:

- **The panel metrics.** `DIALOGUE_LINE_HEIGHT`, `SAY_TOP`, `TEXT_MARGIN`, `MENU_X/WIDTH/TOP/ROW`, the act-card and map-label metrics. Two spoken lines drew on top of each other and the menu overlay sat in a corner.
- **The font's 1 × 1 rects.** Every glyph pixel was one screen unit, so text drew at a sixth of its relative size in a frame six times larger.
- **`WALK_SPEED = 0.9`.** Crossing Room 1 took thirty-five seconds. **Its real cost was not slowness.** Boundary walks timed out mid-stride and reported x=596 and x=896 as walk-box edges — plausible numbers, wrong for a reason entirely outside what was being measured, and nearly filed as geometry.

**Swept rather than waited for.** Grepped `engine/` for module-level numeric constants and for bare integers in draw and geometry calls. What was left and is now scaled: the arrow triangle's four rows, the map label's padding and marker outline, the bark clamp margins, the protagonist's initial y offset of 14, and the bark's 30-unit rise above a speaker's head.

**What was deliberately NOT scaled, and this is the harder half:**

- `NOTICE_MS`, `TURN_SECONDS`, `IDLE_BREAK_AFTER`, every rate — **times, not lengths.** A second is a second at any resolution.
- `Renderer.drawFigure`'s `unit = height / 40` and its block table — **proportions, not lengths.** Its own comment already said so: everything there is a fraction of whatever height it is handed, so a mover asking to be 233 tall gets a 233-tall placeholder. Multiplying it would have been the mirror-image error.
- `Decimation.TABLE_SIZE = 256` — a table size in a module with zero importers.

**The rule this leaves.** A length in code is a bug waiting for a resolution change; a time or a proportion is not. The distinction is not visible in the number, which is why three of these shipped, and it is why they are scaled by `GLYPH_SCALE` — one named migration factor — rather than by a literal 6 in each place.

**Palette cycling — live in the engine, not dead code.** `GameScene.ts:253` constructs a `CyclingBackground` for any room declaring `cycling`, `check-palette-cycling.mjs` is a registered validator, and `tests/interface.test.ts` imports `PaletteCycling`. One room still declares it: `stage-road.json`, `hobs_lamp` and `puddles` — precisely the two errata 54 names as void.

**Measured rather than assumed, because the plate changed underneath it.** The cycler recovers indices by matching exact palette RGB in the background. Against the new full-RGB plate: `accent_gold` 225–228 match **0 pixels**, `accent_indigo` 239–241 match **1**. So it does not crash and it does not flicker — it rotates a single pixel at 0.25 Hz in a 1,658,880-pixel frame. What it does cost is a 6.6 MB `getImageData` readback and a 1.66-million-iteration scan at Room 1 load, to find that one pixel.

## Q19 · Errata 54 retired a thing the engine cannot start without

**This is a correction to errata 54 and only Tyler can make it. Filed, not proposed.** Nothing here is changed and nothing here suggests what to change it to.

Errata 54 says `art/palette/consolation-256.json` "ceases to be authoritative. Retained for reference only." The sweep in Q18 found that the engine's entire colour model is index-addressed into that file, and confirmed in source rather than by report:

- `Screen.ts` constructor: `throw new Error(\`Palette ${palette.id} is not locked\`)`. The engine refuses to start on a palette whose `locked` flag is false.
- `Screen.colour(index)` is the only route any colour takes.
- Every room stores `colours.sky`, `colours.ground` and `hotspots[].colour` as **indices**. They were deliberately not migrated with the ×6, because they are not geometry.
- `check-palette.mjs` is a registered validator asserting locked, 256 entries, 6-bit, fully referenced.

**So the ruling described an outcome and not a path**, and the gap has been in place since it was written. It is not a cleanup item and it does not resolve by deleting a reference.

**What errata 54 established is true and is working.** Backgrounds are full RGB. Room 1's promoted plate reaches the screen untouched, because a background is drawn and never indexed — that half of the ruling is live on `main` today.

**What it did not account for is that everything the engine draws *itself* still needs a colour source**: stub-room fills, hotspot blocks, outlines, and all interface chrome. Those need a palette. Having one is not the same as being bound to the old one, and which of those two the ruling meant is exactly what is unresolved.

**A suggested order once this and Q6 are ruled, and it is a suggestion.** Proposed during the session that found this, by someone who does not hold rulings on this project: the colour model first, then the font, then Q9's schema so the twenty per-clip directories can reach the screen. **Recorded as one opinion about what to do first, not as a decision.** Errata 52's stop condition exists because design rulings here belong to one person, and a sequencing preference written down as though it carried his authority is the drift that condition guards against — six months from now it would read as settled.

## Q20 · Every asset path in every room points at composed art

**Filed, not fixed.** Each entry below is a decision about what a room looks like, and those belong to Tyler.

The coach found it. `stage-road.json`'s `coach` hotspot — id `coach`, rect `[1152, 360, 480, 252]`, gated `T_COACH_DEPARTED: false` — declares `states.halted.image: art/objects/room-01-coach.png`, and its own note says exactly why it exists:

> *ERRATA 31d: the coach is an object state, not background art. The shipping background is the DEPARTED composition and this layer is the difference between the two composes — the coach, the team, and the light its lantern throws on the road, which is exactly the set that leaves with it.*

That was right under the composed pipeline and three things now stack against it: the background is the approved **generated** plate; errata 53 discarded the composed art the layer was differenced against; and it is 320 × 144 drawn over a 1920 × 864 painting, so `drawPlate` magnifies it six times.

**The hotspot is not the problem and must not be removed.** Its written lines are canon under errata 19a and its state gating is the mechanism the departure needs. What is stale is the image it points at.

### The full extent, so it is visible at once

Nineteen asset paths are declared across all 17 room files. Every one is written by a `tools/pixelart/` compositor — **19 of 19 are composed art.** Traced by matching each shipping filename against the modules that write it.

| | size | room | field | asset | compositor |
|---|---|---|---|---|---|
| | **1920×864** | stage-road | `.background` | `room-01-stage-road.png` | *hand-replaced with the approved plate* |
| | 320×144 | main-street | `.background` | `room-02-main-street.png` | `room02_main_street.py` |
| | 320×144 | nugget | `.background` | `room-03-nugget.png` | `room03_nugget.py` |
| | 320×144 | assay-office | `.background` | `room-05-assay-office.png` | `room05_assay.py` |
| | 320×144 | undertaker | `.background` | `room-13-undertakers.png` | `rooms_batch_a.py` |
| | 320×144 | hotel-lobby | `.background` | `room-18-hotel-lobby.png` | `rooms_batch_a.py` |
| | 320×144 | thads-room | `.background` | `room-19-thads-room.png` | `rooms_batch_a.py` |
| | 320×144 | town-map | `.background` | `room-00-town-map.png` | `room00_map.py` |
| | 320×144 | stage-road | `.foreground` | `room-01-stage-road.png` | `room01_stage_road.py` |
| | 320×144 | main-street | `.foreground` | `room-02-main-street.png` | `room02_main_street.py` |
| | 320×144 | nugget | `.foreground` | `room-03-nugget.png` | `room03_nugget.py` |
| | 320×144 | undertaker | `.foreground` | `room-13-undertakers.png` | `rooms_batch_a.py` |
| | 320×144 | hotel-lobby | `.foreground` | `room-18-hotel-lobby.png` | `rooms_batch_a.py` |
| | 320×144 | thads-room | `.foreground` | `room-19-thads-room.png` | `rooms_batch_a.py` |
| | 320×144 | main-street | `.occlusionPlanes[0].mask` | `room-02-plane-1.png` | `room02_main_street.py` |
| | 320×144 | main-street | `.occlusionPlanes[1].mask` | `room-02-plane-2.png` | `room02_main_street.py` |
| | 320×144 | **stage-road** | `.hotspots[4].states.halted.image` | **`room-01-coach.png`** | `room01_stage_road.py` |
| | 320×144 | main-street | `.exits[4].states.open.image` | `room-02-assay-door-open.png` | `room02_main_street.py` |
| | 144×36 | nugget | `.idles.sheet` | `room-03-nugget.png` | `room03_nugget.py` |

**The split was stated the wrong way round when this entry was first filed, and the corrected version is worse.** It said eleven resolve and eight do not. The counts are **8 and 11**, and it is the larger number that does not resolve.

**Eight resolve: the backgrounds.** Regenerating a room at play-area size produces a new background, and that is Q17 — a quality gap rather than a defect.

**Eleven do not**, because each was cut from, or differenced against, a specific composed picture, and regenerating the room does not produce them. **Six of the eleven are the foreground planes**, which have to be cut from the new plate by hand; only Room 1's was previously recorded, in Q17's closing paragraph, and the other five are the same case:

- **Six foreground planes** — Rooms 1, 2, 3, 13, 18 and 19. Each is the near plane that draws *over* the actor, cut from its composed room.
- **`room-01-coach.png`** — the difference between two composed versions of a plate that no longer exists.
- **`room-02-plane-1.png` / `plane-2.png`** — occlusion masks cut to Room 2's composed geometry.
- **`room-02-assay-door-open.png`** — a door state cut from the composed facade.
- **`room-03-nugget.png` (idle sheet)** — figures cut from the composed interior.

**There is nothing to replace the coach with yet.** `docs/37`'s chain has the plate as generation A and *A + coach + two horses* as generation B, and `reference/casting/` holds the plate, the casting master, Hob's profile source and Thad's four views — **no coach generation exists.** So the two available moves are: remove the image and the coach is invisible through beats 1–6 of the opening, or generate it against the approved plate, which is doc 42's territory. Both are decisions about what Room 1 looks like during the opening.

**And that chain is not a procedure anyone should follow as written today.** `docs/37` describes generation B as an *additive edit against a byte-identical plate*, and the method has failed repeatedly in practice — five consecutive attempts at a single Thad pose came back as redrawn characters rather than edits. Noted here rather than in `docs/37` itself, because amending that document is an art-pipeline decision and not this list's to make. It means the second of the two moves above is not simply "run D5 step B"; how the coach is obtained at all is part of what has to be decided.

### The hazard, which is guarded rather than filed

`npm run renders` destroyed two committed things, and following the documentation was enough to do it. This part is fixed, because stopping a documented command from silently overwriting approved work decides nothing about what any room looks like.

- `room01_stage_road.py` writes `art/backgrounds/room-01-stage-road.png` — **the path the approved plate now occupies.**
- `actor_export.py` rewrites `content/actors/thad.json` **wholesale**, from measurements taken on the composed 320 × 144 sheet. Running it reverted errata 54's ×6 migration — threshold 180 → 30, near height 240 → 40, far 156 → 26 — and re-derived the threshold from `eye_death_row`, which measures decimation, which errata 54 voids. Found by running the command and diffing, not by reading it.

**Guarded at the writers, not by editing the list.** `tools/pixelart/superseded.py` holds the paths and the reason for each; `canvas.save`, `canvas.save_rgba` and `actor_export` refuse and raise, naming the path and this entry. `npm run renders` now exits non-zero and prints the refusals. A module quietly dropped from `render-all.mjs` would be invisible — the next person adds it back and nothing says why it went.

**Room 2's masks and door state and Room 3's idle sheet are deliberately not guarded.** They are equally stale under errata 53, but those rooms have no approved plate, their composed output *is* the shipping art, and refusing to write it would remove working assets with nothing to replace them. That would be a decision about what those rooms look like. Room 1 and `thad.json` are guarded because they were superseded in fact rather than in doctrine.

`CLAUDE.md`'s "One command regenerates everything" is annotated, because it was no longer true as written.

## Q21 · Character scale measured against the plate — errata 54's 233px is too tall

**Measured, not derived, and approved on sight by the project owner.**

Errata 54 states characters are "~233px at mid-depth." That number came from Monkey Island's proportions — 27% of play height — and was never checked against Room 1's plate once the plate existed.

**The measurement.** Against the fence's far-left post in `art/backgrounds/room-01-stage-road.png`: top rail at row 520, posts meeting ground at row 680, so 160px tall. The project owner's anchor: the top of that fence reads as chest-to-shoulder height on a man.

That gives **~205px at the fence's depth**. It cross-checks: at that scale the fence works out to 4.5 feet, which is right for a frontier rail fence. Two independent readings agreeing.

**205 is not a replacement for 233 — it is an anchor.** Character height varies with depth. 205 is the height *at the fence*, which is roughly where Thad talks to the driver. Nearer the camera he is larger; up the road, smaller. This is the first real data point for Q6's per-room scale curve, which has had none.

**Correcting errata 54 is the project owner's.** Recorded here; not changed there.
## Q22 · `atmospheric_audit.py` has been failing since before errata 54

**Filed on its own so it is not attributed to whoever touched the render pipeline last**, which is exactly what happens to pre-existing breakage found during unrelated work.

`npm run renders` exits non-zero. Three modules fail. Two of them are the Q20 refusals and are deliberate. The third is not:

`atmospheric_audit.py` — errata 33b, *no scenery lighter than the sky* — fails on `stage_road`. **It was failing before the errata 54 migration and before the plate was promoted**, verified by running it in a throwaway checkout of `c4e333c^`:

| | rows measured | sky p90 | result |
|---|---|---|---|
| before the migration | 0–44 | 33.8 | **FAIL** 571 px over the sky, worst 125.1 at (107, 53) |
| on `main` today | 0–264 | 141.8 | **FAIL** 41,185 px over the sky, worst 174.5 at (244, 268) |

Same verdict on both sides, so the migration did not cause it. **The numbers are not comparable, though, and the second set should not be read as the first getting 72× worse.** The row band moved with the ×6 and the picture underneath changed from the composed 320 × 144 room to the 1920 × 864 plate, which has 36× the pixels — so both the sky's own p90 and the count of pixels over it are measurements of a different image against a different band.

**The audit is not measuring the plate.** It reports offenders as palette indices — `idx 75 L 174.5` — so before it can name anything it quantises the full-RGB plate into the locked 256. Errata 54 makes that palette reference-only, and errata 54's own measurements are why: quantising this art into `consolation-256` introduced a mean error of 5.69 and collapsed 46% of the frame into one eight-entry family.

**So the numbers above describe a picture that does not exist.** Not a stale reference to tidy up — a check whose output is a report on a quantised fiction. Whether errata 33b's rule survives against generated art, and what it would measure against if it does, is Tyler's and not this list's.

**`rooms_batch_a.py` is not failing.** It was named in Q20's first report as the pre-existing failure; that was a misread of `grep -B` context spanning a module boundary. Run directly it exits 0 and writes Rooms 18, 19 and 13.

## Q23 · A command's call list does not tell you what it writes

Recorded as a method note, because it is the only reason the second `npm run renders` casualty was found at all.

`tools/render-all.mjs` was read carefully. It names `room01_stage_road.py`, which writes Room 1's shipping background, and reading stopped there — by two people independently. **What reading the list could not show is that it also runs `actor_export.py`, which rewrites `content/actors/thad.json` wholesale.** That was found by running the command in a throwaway tree and diffing the result.

> **A call list is a claim about invocation, not about effect, and the difference is only visible by running it.** When a command is suspected of writing something it should not, run it in a throwaway tree and diff. Do not read its call list.

The general form is worth more than the instance. `render-all.mjs` names each module and describes it in a comment — *"Thad's two shipping sheets and his clip table"* — and that description is accurate. It still does not say that the clip table **is** `content/actors/thad.json`, or that it is rewritten wholesale rather than appended to. Every layer of the reading was correct and the conclusion was still wrong, because effect is one indirection below the list and no amount of careful reading crosses it.

**And the two casualties are not equally serious, which is the part worth keeping.** An overwritten background is visible the moment anyone opens the room. **Silently reverted content is not.** `thad.json` would have gone from threshold 180 back to 30 and near height 240 back to 40, with the threshold re-derived from `eye_death_row` — a decimation measurement errata 54 voids. **Every validator would still have passed.** Nothing would look wrong until Thad was 40 px tall in a 1920 × 864 frame and nobody could say when it happened.

That is the same shape as the sprite-sheet deletion that rendered the deployed page black: a correct-looking command producing a change nobody would attribute to it.

## Q24 · Integer numbering collides while branches are live, twice in one session

Raised rather than fixed again, because renumbering the symptom is what happened both times.

| | main appended | a branch appended | resolved by |
|---|---|---|---|
| first | Q11 · does Thad visibly carry the case?<br>Q12 · does his appearance change after the coffin? | Q11 · the inventory examine path drops effects<br>Q12 · the ActorFile schema can't address a clip directory | branch renumbered to Q13 / Q14 |
| second | Q21 · character scale measured against the plate | Q21 · the pre-existing render failure<br>Q22 · a call list is not an effect list | branch renumbered to Q22 / Q23 |

**Both collisions were caught by git, and that is luck rather than design.** A conflict appears only because two trees edited adjacent lines of the same file. Append far enough apart — a new entry at the end of a document while someone else edits the middle — and git merges both cleanly, leaving two entries with the same number and no marker anywhere. The first collision was noticed because `docs/42` referenced Q12 by number and the reference would have gone to the wrong entry.

**The failure is not the duplicate, it is the reference.** `docs/40` cites Q11, `docs/42` cites Q11, `panel.json` cites Q16, `superseded.py` cites Q20, and `thad.json`'s neighbours cite Q9. A citation to a number that later means something else is a wrong pointer that reads as a correct one.

**Not proposing the scheme.** Sequential integers assigned at write time require a global view that a branch does not have, and that is the whole of it. What replaces them — per-branch prefixes, dates, initials, content hashes — is a convention question with real trade-offs for how the document reads, and it belongs to Tyler along with everything else in this list. What is now established is that the current scheme has failed twice in one session, both times for the same reason, and that the next failure may not announce itself.

## Q25 · Clicking during the opening wedges it permanently — **RULED AND FIXED**

**CORRECTED. As first filed this entry said "the opening never ends" and that is wrong.** The opening ends. Twice measured, identically: play it without clicking except on the driver's dialogue options and it **completes at t = 21s**, `GameScene.opening` goes null, and the panel appears. The original claim came from a session where the opening was clicked through, and the conclusion drawn from it — that the game is unreachable — did not survive being checked patiently.

**What is true, and it is still serious.** Clicking during the opening's *automatic* segments stops it advancing, permanently. Measured: clicks at 700–900 ms intervals leave `openingAt` frozen — at 0 in one run, at 2 in another after the driver's tree was answered — and it never moves again. No error, no console output, nothing on screen to say anything is wrong. Because `showPanel` is `this.opening === null`, the panel never appears and the bottom 216 rows stay a single flat colour.

**So the defect is not that the opening cannot finish; it is that a player who clicks cannot finish it.** A player will click. It is the first thing anybody does at a screen holding a line of text, and doing it once during an eight-second automatic beat costs them the entire game with no feedback.

**Mechanism: located, at `engine/scenes/GameScene.ts:401`.**

```
    if (this.sequence.isRunning) {
      this.sequence.cancel();
      this.world.abandonActor(this.actors.playerId);
    }
```

`SequenceRunner.cancel()` sets `started = false`, so `isRunning` goes false **inside the click handler**. The next tick then reads:

```
    const wasRunning = this.sequence.isRunning;              // already false
    ...
    if (this.opening && wasRunning && !this.sequence.isRunning) this.advanceOpening();
```

`wasRunning` is false, the running → stopped transition is never observed, `advanceOpening` is never called, and `openingAt` never increments. That is the frozen counter, and it is why there is no error: nothing went wrong, the loop simply never saw the thing it was watching for.

**Proved in both directions rather than argued.** Guarding the cancel with `&& !this.opening` as a throwaway patch, the same click-every-700ms pattern that wedges the opening **completes it after 26 clicks**. Reverted immediately; it is a diagnostic and not a proposal.

**The cancel is right and the comment above it is right.** Doc 22's deterministic cancellation — a staged interaction the player has changed their mind about stops where it is rather than finishing a walk they no longer want. What the line cannot know is whether an *opening* is running. Ordinary play and a cutscene are two different things sharing one runner.

**RULED, AND FIXED: a click during a cutscene advances the pending line and nothing else.** Doc 17 decides it three ways over. The opening *is* the tutorial and every affordance is learned by using it, so a stray first click must not skip it. Beat 6b's coach departure is three seconds **because** errata found that a coach vanishing on a click is not a coach leaving, so a click must not cut it short either. And errata 30a's own reasoning is that an authored duration *is* the content.

The verdict lives in `Opening.playfieldClick` rather than in an `if` at the call site, because a decision with a name has a test and an event handler does not. `cancel` is untouched for ordinary play — doc 22's deterministic cancellation is right, and what the call site could not know is whether a cutscene is running.

**Checked by playing, not by tests passing.**

| | measured |
|---|---|
| click every 700 ms, title to control | opening **completes at 21.3 s** after 27 clicks; panel reachable |
| beat 6b untouched | 5.13 s |
| beat 6b with a click landing mid-beat | 4.96 s |

The 0.17 s between the last two is inside the 100 ms polling granularity: **the click does not shorten the departure.** The segment runs longer than its authored 3 s because it also plays its line, which is `stepsFor`'s existing behaviour and not this ruling's.

**And a regression test that fails against the old code before it passes** — `tests/opening.test.ts`. It is a miniature of the two pieces that disagreed: a loop that samples `isRunning` before ticking and advances on the transition, and a click that asks for a verdict. Neither piece shows the defect alone. A second test reinstates the pre-fix verdict and asserts the opening **wedges**, so the first cannot pass vacuously if the click ever stops reaching the runner. Neither asserts a segment index — the first draft did, and failed at 1 instead of 0 because the harness steps past the menu segment, which was a number about the beat sheet rather than about the defect.

**Not related to beat 10.** The validators' note — *"gated on but written by no content: `T_HOB_GONE`"* — is about a flag nothing writes, not about the sequence's ability to end. It ends at `at = 4`.

## Q26 · At ×6 the face does not comfortably fit errata 54's panel

The panel went from 56 rows to 216 — 3.86×, not the play area's 6× — and the face is now 42 units tall. Errata 26 and 29's layout is a sentence line plus four verb rows, which at the face's own proportions wants 5 × 66 = 330 units. It has 216.

It fits, and the fit is tight rather than comfortable: sentence at 866, four rows of 43 from 908, the bottom row's ink ending at y=1078 of 1080. **Measured rather than judged — the last row is complete, with two rows of margin under it.** Button labels are now centred in their buttons rather than inset by a fixed count, because a two-glyph-pixel inset is twelve units at this scale and put the bottom row off the frame.

Nothing here is broken. It is recorded because it is the first hard evidence for Q6 that the 5 × 7 does not merely look wrong at this size: the panel errata 54 specifies cannot hold it at its intended proportions, so whatever replaces it carries a size constraint the old face never had.

**AND THE PANEL IS NOW OUT OF CELLS. That is the same constraint seen twice, and the two should not be discovered separately.** Errata 39's fullscreen toggle took the verb grid's last free cell — nine verbs fill three rows of three, and the fourth row now holds MENU, MAP and FULL. `panel.json` records it, so the next thing that wants a cell finds out from the file rather than from a collision.

But there is no next cell. **Doc 40's contract still has a talk overlay, the case, and chore markers to surface**, and if any of them needs a control the answer is a new row or a different panel shape — which is a layout decision, in a panel already measured at 216 units against errata 26 and 29's 330. **Too short for its authored layout and out of cells are not two problems.** They are one panel that was re-proportioned by 3.86× while the play area grew by 6×, and any fix for either is a fix for both.

## Q27 · Thad is not drawing at 133px. The whole frame is being shown at two-thirds size.

Investigated because it was reported as the last thing keeping Room 1 from looking right. **It is not a sprite defect and there is nothing wrong with the actor record.** It is worth an entry anyway, because the thing that IS wrong is real and is not what it looks like.

**Measured in isolation.** Every clip drawn at a requested 205, alpha bbox measured on a blank canvas:

| clip | front | back | left | right |
|---|---|---|---|---|
| stand / idle / idle-break / recoil | 206 | 206 | 205 | 205 |
| walk | 195 | 214 | 203 | 203 |

The ±1 is rounding. Walk varies because a walk frame genuinely changes the figure's extent — a raised knee and a leaned torso are not the same height as a stand — and that is the art, not the scaler.

**Measured in the running game**, by wrapping `ActorSprite.draw` and reading the height it is actually handed:

| viewport | canvas | shown at | asked in-frame | ON THE PHYSICAL SCREEN |
|---|---|---|---|---|
| 1920 × 1080 | 1920 × 1080 | 1920 × 1080 (×1.00) | 225 | **225** |
| 1366 × 768 | 1920 × 1080 | 1365 × 768 (×0.711) | 225 | **160** |
| 1280 × 720 | 1920 × 1080 | 1280 × 720 (×0.667) | 225 | **150** |

`Phaser.Scale.FIT` letterboxes the 1920 × 1080 frame into the window. **133px on screen from a 205 figure is a display scale of 0.649 — a window about 700px tall. From a 225 figure it is 0.591, about 638px tall.** Both are a Chromebook with browser chrome, which is the target machine.

**So the proportions are exactly right and everything shrinks together** — the plate, the panel, the text, the man. Room 1 looks correct; it is being viewed at about two-thirds of full size.

**What is actually open is NOT a font question, and the entry should not be read as one.** At 0.667 the 42-unit glyph displays at 28 physical pixels and stays perfectly readable. The problem is underneath that: **every hairline in the plate and every glyph edge is resampled by a non-integer factor.** The old spec forbade exactly this — errata 39's *"never break the integer rule to fill a window; a fractionally scaled frame is not this game"* — and errata 54 superseded the integer-scaling rule without putting anything in its place.

**That gap survives whatever font is chosen.** A face drawn for 1920 × 1080 is still resampled by 0.667 on a 700-pixel window, and so is the art beside it. Choosing a typeface answers a different question. This one is about what happens between the frame and the glass, and it has been open since errata 54 and unnamed until now.

**And there is no way to reach 1:1.** `grep -rni fullscreen` over `engine/` and `content/` returns nothing. Errata 54 preserves errata 39's fullscreen and mouse-completeness rulings by name, so the fix errata 39 adopted for this exact problem is specified and unbuilt. **It is not a Q-number** — it is a specified feature nobody wrote, and it has gone to the project owner as that rather than as a list entry.

**One more thing this investigation surfaced, now guarded.** `art/actors/` holds three `talk` directories that are `kind: head-overlay` — heads composited into a body frame at `overlay_rect`, not bodies. They carry a `figure` too, because the rig records which body they belong to, so anything iterating the directory and scaling by figure height draws them at 4, 7 and 8 px: absurd, silent, and produced by code doing nothing obviously wrong. `tools/check-actor-clips.mjs` now fails on an overlay declared as a body clip **and** on any clip directory that is neither declared nor marked — the second being the case that catches new art nobody wired, which is otherwise invisible because the game simply never asks for it.

## Q28 · The coach was generated with its door closed, and Thad steps out of it

Art-side, recorded here because the shape of the answer is an engine one and errata 31d already set it.

Doc 17 beat 3 has Thad step out of the coach. The coach was generated with its **door closed**, so there is no state in which it is open.

**The answer is a second coach state, not a swinging door.** A door in profile foreshortens as it opens, so animating it needs several drawn angles, and each one has to match the body's shading at that angle — a door caught halfway that is lit like a door fully open reads as a mistake before anyone can say why. Two full states cannot drift out of alignment with each other, because there is nothing between them to be wrong.

**Errata 31d already made the coach an object state**, so this is the existing pattern rather than a new mechanism: `coach` gates on `T_COACH_DEPARTED`, and a door state gates the same way on whatever flag beat 3 sets. Q20 removed the coach's stale image and kept its state and gating for exactly this reason — when the coach is generated against the approved plate, it drops back into the hotspot that is already there.

## Q29 · Hob's art has arrived and there is nowhere to declare it

Caught by `check-actor-clips` within minutes of the art landing, which is the check working rather than the check being wrong.

`art/actors/` now holds `hob-stand-right`, `hob-idle-right`, `hob-idlebreak-right` and `hob-walk-right`. **There is no actor record for Hob and nowhere to put one.** `content/manifest.json` declares a single `actor` — `content/actors/thad.json` — and `ContentLoader` loads exactly that one. So the art is invisible: the game never asks for it, and until this check existed nothing said so.

**This is not a missing clip and re-running the generator will not fix it.** `build-actor-record.mjs` is written for one character by name. It is a second character arriving ahead of the plumbing that would load one, which is the ordinary and healthy order — art batches independently, per CLAUDE.md — but it means the check now fails on `main` until the plumbing exists.

**What is needed is a decision about shape**, and it is small but not mine: whether the manifest grows an actor *list*, whether records are discovered by convention from `content/actors/*.json`, and whether `scaling.json`'s one zone table is per-character or shared. Hob is also **right-facing only**, four clips against Thad's twenty, so whatever loads him has to tolerate a character who cannot turn — which is correct for a man who crosses the road once and never comes back.

## Q30 · The game is black for fifteen seconds because boot waits for 70 MB

Reported as "opens black and needs about five clicks before anything appears." Instrumented rather than guessed at, and the guess in the report — the title sequence — was not it.

**There is no title screen to blame.** `beginOpening` consumes the `control: menu` beat before the first frame, so the game opens directly into the opening's first automatic segment. Once drawing starts, the first frame is the room, fully composed, 2,947 distinct colours, Thad at 240 px. Nothing is black about it.

**What is black is everything before drawing starts.** `BootScene.create` awaits every asset the manifest declares before starting `GameScene`, and that is now **70.1 MB across 170 PNGs** — 124 frames for Thad at 54.4 MB, 27 for Hob at 14.1 MB, and 1.7 MB of backgrounds. Until that promise resolves nothing is drawn at all.

| | time to first drawn frame | downloaded |
|---|---|---|
| **localhost, unthrottled** | **14.9 s** | 70.1 MB |
| 20 Mbps | not within 30 s | 65.1 MB |
| 5 Mbps | not within 30 s | 12.7 MB of 70 |

Fifteen seconds on a machine serving from its own disk. The five clicks are not advancing anything — they are what a person does while waiting.

**Two separate problems, and they need different people.**

**1. Boot blocks on everything, which is an engine decision.** The room's background is enough to draw the first frame; an actor's frames are needed when he is first drawn, not before the scene starts. Even at a tenth the size, awaiting 151 files before anything appears is the wrong shape.

**2. The frames are ~50× the pixels they are drawn at, which is the pipeline.** Each is about 450 KB at 1105 × 1702, and the game draws them at 240 px tall — roughly 7× linear. `ActorSprite` resamples every one down on first use and caches the result, so the full-size pixels are paid for on the wire, in memory, and once in CPU, and then never used again. That is `tools/rig/` territory and not mine to change.

**Neither is fixed.** The instruction was to instrument and report, and the fix for the first is a decision about what must exist before the first frame.

## Q31 · The dialogue trees are consistent. Errata 37 is what reads as inconsistent. — **RULED: errata 37 REVOKED. Done.**

Reported as "some options vanish after use, some stay, no visible rule." Read against the content before touching the runner, as instructed, and the answer is neither of the two possibilities the report offered.

**The content is perfectly consistent.** All 45 options across 8 trees carry exactly one of four tags — TOPIC 14, COMIC 9, EXIT 9, PROGRESS 13 — and **zero are untagged.** There is no drift to find.

**The runner implements errata 37 exactly.** PROGRESS is removed once used; TOPIC, COMIC and EXIT grey and remain selectable. Simulated on the driver's tree, which is the first conversation every player has:

```
fresh                 drv1[PROGRESS]  drv2[PROGRESS]  drv3[COMIC]  drv4[EXIT]
after drv1            drv2[PROGRESS]  drv3[COMIC]  drv4[EXIT]
after drv2            drv3[COMIC]  drv4[EXIT]
after drv3            drv3[COMIC](grey)  drv4[EXIT]
```

**So the appearance of inconsistency is produced by the ruling, not by a defect.** Two rows vanish and a third greys, inside one four-option conversation, and the property that decides which — the tag — is invisible to the player. Errata 37's own premise is that both behaviours are right for different options; what it did not weigh is that the player cannot see which option is which, so the rule cannot be learned.

**And it diverges from the convention it was measured against.** Monkey Island's rule includes *the list never silently reshuffles*. Removal reshuffles: **6 of 9 nodes mix PROGRESS with non-PROGRESS**, so a used row vanishes and everything under it moves up. That is in errata 37, not in the code.

**Not fixed, and it should not be fixed here.** Errata 37 is a design ruling, amending doc 04 rule 4 by name, and the three ways out — keep it, drop the removal, or mark PROGRESS visibly so the rule becomes learnable — are all design decisions.

**RULING: errata 37 is REVOKED. Doc 04 rule 4 stands unamended — every used option greys and stays.** Its premise was a factual claim about Monkey Island and the claim is backwards: MI removed an option when the branch it led to was *unimportant* to progress, so flavour vanished and what a player needed stayed. Errata 37 removed `[PROGRESS]` and kept the jokes. Revoked rather than inverted, because a rule where *some* options vanish cannot be learned whichever ones they are — the property deciding it is invisible.

**Done.** `DialogueRunner.presentOptions` no longer filters and `SPENT_TAG` is gone. **The tags survive and stop controlling visibility.** `EXIT` still ends the conversation, which is the option's function and not an exemption from a rule that no longer exists — errata 37's "EXIT is always present" is now true of everything and needs no code to make it so.

**Two special cases survived the revocation, which is exactly what the ruling said to look for.**

**1. A CHECK THAT OUTLIVED ITS REASON.** `check-dialogue-nodes` failed a node whose every option was `PROGRESS`, because errata 37 would have emptied it and stranded the player. Nothing is removed now, so a tag can no longer strand anybody — but the rule would have gone on constraining authoring for a revoked mechanism. The guarantee it existed for is real and the remaining mechanism is **gates**, so it asks about those instead: every node must carry at least one option gated on nothing, present whatever the flags say. Measured against the content before asserting it — 9 nodes, 1 gated option, no node lacking an ungated one — so it is a rule the trees already meet rather than one imposed on them.

**2. A TEST THAT NEVER TESTED THE RULING.** `tests/resolution.test.ts` asserted `!after.includes('opt_unlock')` — "a spent PROGRESS option is removed". **`opt_unlock` moves the node**, HARN_1 to HARN_2, so it was absent from the next list because the player was somewhere else entirely. It passes identically with the removal filter deleted. A green assertion about a mechanism it never touched: R5e in its purest form, a test written from the same understanding as the code it was holding to account.

**The property, not the number.** The new test walks the driver's tree from fresh through every option and asserts the count **never decreases** and the order never changes — a count alone would pass a list that lost a row and gained one. Against errata 37's code it fails by name: `taking drv1 cut the list from 4 to 3`.

**Played, not inferred:**

```
AT THE START -- 4 options
   live  [PROGRESS] Where can I find Ezra Pike?
   live  [PROGRESS] Where am I supposed to sleep?
   live  [COMIC] You don't think much of my chances.
   live  [EXIT] Thank you for the ride.

AT THE END -- 4 options
   grey  [PROGRESS] Where can I find Ezra Pike?
   grey  [PROGRESS] Where am I supposed to sleep?
   grey  [COMIC] You don't think much of my chances.
   live  [EXIT] Thank you for the ride.
```

Same four rows, same order, three dimmed, the way out still bright. The COMIC option was clicked three times over — it answers again rather than going anywhere, which is doc 04's Winnie arc working by default instead of by special case.

## Q32 · Boot now waits on the first frame, not on the game — Q30's first half, closed

Q30 named two problems. The pipeline's half is fixed on `main` at `f8699d36`, which took `art/actors/` from 71.8 MB to 12.6 MB. This is the engine's half.

**`engine/core/BootAssets.ts` decides what the first frame needs, and boot awaits only that.** The start room's images, and the protagonist's `stand`, `idle` and `walk`. Everything else — every other room, every other character, item icons, and Thad's own `idle-break` and `recoil` — is loaded by `GameScene` after it is already drawing.

The split is worth more than it looks, because the heaviest thing Thad owns cannot possibly be on screen at second zero:

| clip | Thad | on screen at t=0? |
|---|---|---|
| stand | 0.31 MB | yes |
| idle | 1.86 MB | yes — he breathes while he stands |
| walk | 2.63 MB | yes — the first thing anyone does is move him |
| idle-break | **3.68 MB** | no — needs seconds of stillness by definition |
| recoil | 1.29 MB | no — needs a beat or an interaction |

**61 files / 6.49 MB required, 109 files / 7.85 MB deferred.**

**Measured, production build, cache disabled, first frame counted as >100 distinct colours in the play area:**

| | await everything | split | |
|---|---|---|---|
| unthrottled | 3.9 s | **3.2 s** | |
| 20 Mbps | 8.4 s | **5.7 s** | |
| 5 Mbps | 27.3 s | **14.6 s** | 46% of the wait removed |

The dev server, same harness, shows the same shape at higher absolute numbers — 3.0 → 1.9 s, 10.7 → 7.4 s, 37.7 → 25.0 s — because it serves ~100 unbundled modules and the production build serves one.

**The frame you get is the whole frame.** Captured at 5 Mbps at the instant it appears: the composed Room 1 plate, Thad at 240 px with his back turned, no graybox anywhere. The split does not trade a black screen for a broken one.

**What it really buys is that the wait no longer grows with the cast.** Hob's 27 frames blocked a frame he is not in; the next character's will not either.

**AND IT IS NOW A CHECK, NOT A CONVENTION.** `tools/check-boot-assets.mjs` walks the content records independently — generically, by regex, the way `check-asset-paths` does — and asserts every declared image is in exactly one of the two lists. That closes the category this session produced three times over and could not see: **declared and never loaded.** Hob's record parsed, his art was on disk, `check-actor-clips` passed, `check-asset-paths` passed, and he drew nothing, because the loader asked for the protagonist's frames and no others. Reverting the loader to that state now fails the check by name on all 13 of his frames — verified by doing it.

The check walks the records independently *on purpose*. Enumerating assets by calling `planBoot`'s own helper would make it agree with itself about a field neither of them knows exists, which is exactly how Hob was missed.

**Two things the apparatus got wrong first, both caught by checking it before trusting it** — R5d, and both worth recording because both produced a confident wrong number:

- **A "not black" predicate fired at 0.2 s.** The page is *white* until the JS bundle loads the stylesheet that makes it black, so brightness measured the blank page. A drawn room has hundreds of distinct colours and a flat page of any colour has one; the count is the honest test.
- **The production harness read `>60 s` at every bandwidth.** `window.__game` is stripped from production builds by an `import.meta.env.DEV` guard, so the probe was asking a question the page could not answer. An experiment that did not happen returns "never", which looks exactly like a real failure.

## Q33 · `npm run preview` cannot serve `npm run build` — **RULED: fix preview, not build. Done.**

Found while measuring Q32 and unrelated to it.

`vite.config.ts` sets `base: command === 'build' ? '/consolation-prize/' : '/'`. Vite's preview server runs under `command === 'serve'`, so it resolves `base` to `/` — while the `index.html` it is serving was written with `/consolation-prize/` baked into every asset URL. The result is a 200 on the page and a 404 on the bundle:

```
404 http://localhost:4173/consolation-prize/assets/index-UlDnmjwO.js
```

The deployed site is fine — GitHub Pages genuinely serves under `/consolation-prize/`. It is only local preview that cannot work, and the workaround is `BASE_PATH=/ npm run build`, which the config already supports.

**RULING: preview serves the base the bundle was built with. What build emits does not change.** The direction matters more than the fix does — making build emit `/` would repair local preview by breaking the live game, which is where the project owner has been looking at this all evening. A broken local convenience is not worth trading for a broken deploy.

**Done.** `vite.config.ts` now reads `base: command === 'build' || isPreview ? PAGES_BASE : '/'`. Vite passes `isPreview` alongside `command`, so preview is distinguishable from dev without touching the build branch.

Verified by looking, not by the config reading correctly: the built `index.html` still names `/consolation-prize/assets/index-UlDnmjwO.js` — the same bundle, unchanged — and `npm run preview` now announces `http://localhost:4173/consolation-prize/`, redirects the root to it, serves the bundle 200, and paints Room 1 in 3.1 s with no 4xx and no page errors.

## Q34 · Thad drew at a third of his size and floated 175 px above his feet — **FIXED**

Reported as "roughly 196–198 game px against a zone table of 263/240/222". Instrumented by the Q27 method rather than reasoned about, and the measurement separates the three candidate causes cleanly.

**The zone resolution is not the problem and never was.** The draw call is handed exactly the right number. Probed down Room 1's band at x960:

| y | height handed |
|---|---|
| 660 | 222 |
| 694 | 222 |
| 728 | 232 |
| 762 | 243 |
| 796 | 253 |
| 830 | 263 |
| 863 | 263 |

That is the box curve doing precisely what it declares. `boxAt` takes precedence over the zone table, the curve runs 222 at y694 to 263 at y830, and standing at y863 he is handed **263**.

**What the draw call then wrote was 88 pixels.** Wrapping `ActorSprite.draw` and spying on the `drawImage` it issues: handed `height: 263`, drew a canvas `88` tall at destination `[871, 600]`. His soles landed at y=688 against a foot position of y=863 — **175 px in the air, up against the fence, at a third of his size.**

**The cause is a generated file that was not regenerated.** `f8699d3` rewrote `art/actors/` from 71.8 MB to 12.6 MB — frames written at twice the drawn size instead of at source size — and updated each `rig.json` to match. `content/actors/*.json` is generated *from* those rig files by `tools/build-actor-record.mjs`, and it was not re-run. So the records went on declaring the old source space:

| | before `f8699d3` | after | record said |
|---|---|---|---|
| `thad-stand-back` frame | 1229 × 1702 | 366 × 548 | — |
| `rig.figure` | [569, 1565] | [191, 526] | — |
| `figureHeight` | 1565 | **should be 526** | 1565 |

`ActorSprite` scales by `height / figureHeight`. With a divisor three times too large, everything downstream is three times too small — and because the anchor is scaled by the same factor, he lifts off the ground by it too.

**Fixed by re-running the generator**, which is what the record's own note says to do and what nothing had done. Every clip now declares `figureHeight: 526`, and 263/526 is exactly 0.5 at the near zone. Verified by instrumenting again — handed 263, draws a 274-px canvas holding a 263-px figure, soles at y864 — and by looking at the frame.

**The reported 196–198 matches neither state**, which means the deployed build measured is not `f8699d3`. Worth knowing which commit is live before reading anything else off it; the local defect was three times worse than the report and is the one that is fixed.

**And it is a check now.** `tools/check-actor-frames.mjs` reads each frame's PNG header and asserts the declared figure and anchor fit inside it. On the stale record it fails **302 times** with the factor named. Containment needs no tolerance — a figure cannot be taller than its canvas — where the tighter test would need one and would be wrong: a walk frame's alpha runs 500 to 548 rows against a 526 figure, and those frames are correct.

**R5e's shape again, and this is the third time.** Every existing check passed: the record parsed, every frame resolved on disk, every clip directory was declared, the boot lists partitioned, the depth curve returned the right number. Nothing compared the record to the pictures. The new check asks the **PNG header** rather than `rig.json` on purpose — asking the generator's own source whether the generator ran is a check sharing its subject's assumptions.

## Q35 · The panel cannot hold five lines of 42-px type, and its font is scaled by the wrong factor — **RULED: ×4. Done.**

Confirmed exactly as reported, measured off the running game with the opening finished. Ink extents in the verb block, `x 24–1056`:

| element | rows | gap below |
|---|---|---|
| sentence line | 866–907 | 2 |
| LOOK AT / OPEN / PUSH | 910–950 | 2 |
| PICK UP / CLOSE / PULL | 953–993 | 2 |
| TALK TO / USE / LISTEN TO | 996–1036 | **0** |
| MENU / MAP / FULL | 1037–1078 | 1 to the frame edge |

Rows 2 and 3 are one unbroken 83-row run of ink: their glyphs touch, which is the "printed on top of" in the report. And at 1:1 nothing is technically cut — but **Tyler is not looking at 1:1.** Captured at 1366 × 768, a Chromebook resolution, the canvas is FIT-scaled to 0.711 and the bottom glyph rows fall off: MENU, MAP and FULL are visibly clipped. The one spare pixel row is what the whole layout has, and any downscale spends it.

**THE ROOT CAUSE IS NOT THAT THE PANEL IS SHORT. IT IS THAT ITS TYPE WAS MIGRATED BY THE PLAY AREA'S FACTOR.**

| | old | new | factor |
|---|---|---|---|
| play area | 320 × 144 | 1920 × 864 | **× 6 exactly** |
| panel | 320 × 56 | 1920 × 216 | **× 3.857** |
| glyph height | 7 | 42 | × 6 |

The panel is the one region errata 54 did *not* scale by six — it re-proportioned it, which is how 1080 works at all. The font came along at six anyway. That is Q18's sixth category exactly: a length authored in 320-space migrated by a factor that does not apply where it landed.

**The arithmetic, which is the whole argument:**

| | glyph | 5 lines | of 216 | slack | as % |
|---|---|---|---|---|---|
| old panel at ×1 | 7 | 35 | of 56 | 21 | **37.5%** |
| today at ×6 | 42 | 210 | of 216 | 6 | **2.8%** |
| ×5 | 35 | 175 | of 216 | 41 | 19.0% |
| **×4** | 28 | 140 | of 216 | 76 | **35.2%** |

**No layout inside 216 px works at 42-px glyphs.** Five lines need 210 of 216 rows before a single gap; redistributing six spare rows across six gaps buys one row each. This is arithmetic, not taste.

**×4 restores the panel's original proportion almost exactly** — 35.2% against 37.5% — and it is not an arbitrary pick: it is the panel's own migration factor, 3.857, rounded to an integer, in the same way the play area's 6 was.

**NOT DONE, because three routes are open and all three are somebody's decision:**

1. **Panel type at ×4.** No geometry migration, no design change, restores the reference proportion. **Costs: two glyph scales in the game**, panel type smaller than play-area type. CLAUDE.md gates font sizing behind a ruling and this is a font sizing decision.
2. **Three verb rows instead of four**, moving MENU / MAP / FULL elsewhere. Contradicts errata 26's three-columns-of-four and errata 39's "in the panel".
3. **A taller panel.** **This one is a second migration.** The play area shrinks, and every room's walkable band, walk box, entrance and hotspot rect moves with it. It should not happen as a side effect of a typography problem.

Recommended: **1**. Stated, not taken.

**RULING: ×4, panel only.** Taken on the derivation rather than on the slack table — ×4 is the panel's own migration factor rounded to an integer, the same operation the play area's 6 came from, which makes it a derived number rather than a chosen one.

**Done.** `PANEL_GLYPH_SCALE = 4` in `BitmapFont.ts`, which now carries the scale **per instance** rather than as a module constant — the panel and the play area are two regions that migrated by two different factors, and a module constant cannot be two things at once. `Renderer` builds a second face from the same glyph data and uses it for the sentence line, the verb labels, MENU/MAP/FULL and the inventory's fallback text. Play-area text — speech, dialogue options, the act cards — is untouched at ×6, because the play area genuinely is six times what it was.

`content/ui/panel.json` re-authored for a 28-unit glyph: sentence at 872, verb rows at 911 / 953 / 995 / 1037 on a 42-unit pitch, 33-unit cells, inventory rows at 911 on 80-unit cells.

**Measured off the running game, same method as the defect:**

| | before | after |
|---|---|---|
| glyph height | 42 | 28 |
| leading between the five lines | 2, 2, 2, **0** | 13, 14, 14, 14 |
| below the last line | **1** | **13** |
| one glyph pixel | 6 | 4 |

The five ink runs are now 872–899, 913–940, 955–982, 997–1024, 1039–1066. Nothing touches anything.

**Verified at 1366 × 768**, which is the machine this is played on: MENU, MAP and FULL are fully inside the frame with clear space below them, where before the 0.711 downscale cut them off.

**And it is a test.** `tests/interface.test.ts` asserts every line of panel text leaves at least **one glyph pixel** above the next and below the frame — the font's own unit of space, not a chosen threshold. It also asserts `PANEL_GLYPH_SCALE === Math.round(PANEL_HEIGHT / 56)`, so the constant is tied to the geometry it was derived from and cannot drift from it. Against the old layout every one of those gaps fails: 2, 2, 2, 0 and 1, against a required 6.

**Q6 is not closed and this closes none of it.** The 5×7 face is untouched, the glyph data is unchanged, and which integer multiplies it says nothing about what eventually replaces it.

## Q36 · Generated files could go stale silently, and the suite never ran in CI at all — **BOTH CLOSED**

Two findings, and the second was found while fixing the first.

**1. "Generated and not regenerated" was detectable but not impossible.** Q34's defect — the actor records left behind by `f8699d3` — is caught after the fact by `check-actor-frames`, which compares the record to the PNG headers. That catches the version that hurt. It does not catch the larger class: **a rig change that alters `walkDx`, or a facing, or adds a clip directory, changes no frame's dimensions at all** and would pass every header check ever written.

`tools/check-generated.mjs` runs each registered generator in a `--check` mode that builds its output and compares. Proved on exactly that case: `walk_dx` flipped from 1 to −1 in one `rig.json`, no PNG touched —

```
check-actor-frames : PASS  (blind to it, as expected)
check-generated    : FAIL (caught it)
   x content/actors/hob.json is NOT what build-actor-record produces today ... RUN: node tools/build-actor-record.mjs
```

**It names the command**, because Q34 took forty minutes to find partly because nothing connected "Thad draws at a third of his size" to "`build-actor-record.mjs` was not run".

`tools/lib/generators.mjs` is the inventory: every generator with a checked-in output, plus a `NOT_GENERATORS` list saying why three tools that write into the same directories are excluded — `migrate-play-area-x6` most of all, which multiplies geometry by six and would multiply by thirty-six if run twice. A list rather than a convention scan, because a scan cannot tell a generator from a one-shot migration.

**A registered generator must have a `--check` mode**, and one that does not fails the check with instructions. Proved by registering a generator that exits non-zero without reporting staleness. **Nothing in the suite writes**, which is the property that keeps it safe to run on a dirty branch — and a check that is unsafe to run is a check that stops being run.

**2. THE VALIDATION SUITE HAS NEVER RUN IN CI.** `pages.yml` was the only workflow. It runs `npm run build` — `tsc --noEmit && vite build` — so a type error failed the deploy and **nothing else did**. Not the 29 checks, not the 119 tests. Every green run this project has reported was somebody running it on their own machine and saying so.

That is the same shape as the finding this document opens with: a check believed to run is worse than a check known not to, because the belief closes the question. `.github/workflows/checks.yml` now runs `npm run check` on every push and pull request, and asserts afterwards that the working tree is unchanged.

**Deliberately NOT gating the deploy.** `pages.yml` publishes on every push to main and states its reason — "a half-published Pages site is worse than a slightly stale one". The deployed build is how the project owner looks at the game, and a red check that also took the game away would cost more than it caught. The new workflow reports; it does not block. **That is a policy choice and it is worth someone confirming rather than inheriting** — if a broken deploy is worse than no deploy, `checks` becomes a `needs:` on the build job and this is a two-line change.

## Q37 · Nothing marks the moment Thad steps down from the coach

Doc 17 has him alight at **beat 3** and the case come off the roof at **beat 6**. The flag vocabulary Room 1 shares with the opening is `T_CASE_DOWN`, `T_COACH_DEPARTED`, `T_HOB_CROSSING`, `T_HOB_GONE`, `T_OPENING_DONE`, `T_OPENING_SAID` — **there is nothing between those two moments.**

So the coach's two states are gated on `T_CASE_DOWN`, and the door opens at beat 6 along with the case. **For three beats Thad stands beside a shut coach he has just climbed out of.**

Closing it needs two small things, neither of which is a technical decision:

**A third coach state** — door open, case still on the rack. One generation, and it must align with the other two the same way they align with each other.

**A flag written when he alights**, which is a name and a beat.

Recorded rather than papered over, because the alternative was gating the door on something that does not mean what the door means.

## Q37 · Beat 6b's coach: the name is fine, the mechanism is not — and beat 2 stopped the opening before 6b ever ran

Asked as "does a MOVER resolve under the same name as the hotspot?" The answer is yes and it does not help, and three things were found on the way to it. All measured by playing, not read off the source.

**THE OPENING NEVER REACHED BEAT 6B.** It threw at **beat 2**:

```
PAGEERROR CLIP_FALLBACK: aboard-coach/front/mud
```

The seven chore clips are drawn **right-facing only**, and Thad starts the scene facing front. Beat 2 ordered `chore aboard-coach` *before* `face right`, so it asked for a clip that does not exist — and nothing is substituted for a missing clip, by design, so it stopped dead. Beat 6 already had the two in the right order. **Fixed**: the `face` moves to the front of beat 2. The opening now plays through beats 2 and 3 and hands over at the driver's tree with Thad at (820, 760).

**BEAT 6B THEN THROWS, AND NOT ABOUT THE NAME:**

```
PAGEERROR Sequence step names an actor with no mover in this room: coach
```

`RoomActors` is keyed by mover id and knows nothing about hotspots — the two live in different namespaces and `coach` is free. What is missing is the mover itself. **`SequenceWorld.move` places a mover only when the step carries `from`** — errata 38, in its own words: "Places the mover first when the step says where from, which is how anything that is not the player arrives in the room at all." Beat 6b has no `from`, so it takes the `require` branch and there is nothing to require.

**BEAT 9 FAILS IDENTICALLY.** Measured by emptying 6b's staging and letting the opening run on:

```
PAGEERROR Sequence step names an actor with no mover in this room: hob
```

`walk` calls `require` unconditionally and never places. Hob's first step has to be a `move` carrying `from`, exactly like the coach's.

**AND `from` ALONE WILL NOT GIVE YOU A COACH.** A mover draws from an **actor record**, and the coach has none — it is room art: two 1920 × 864 state layers and its wheels as separate PNGs. Placed, it would draw as a graybox figure at `mover.height`, which is a person-sized rectangle sliding off frame right. **That is a decision, not a bug to fix here:** either the coach gets an actor record with frames, or beat 6b needs a mechanism that moves a room layer rather than an actor. Both are yours.

**What is fixed, because it is engine and it was mine.** `Renderer.drawMover` opened with `if (mover.id !== this.actors.playerId) → graybox`. True when `content/actors/` held one file; false since Hob's record landed, and nothing noticed. **Hob would have crossed the road as a rectangle** with his record parsed, his 27 frames loaded and every check green — present, valid, declared, LOADED, and still not drawn, which is a fifth position on that list. The renderer now holds one `ActorSprite` per declared record and looks up by mover id, and reads each character's **own** rates rather than the protagonist's. A mover with no record still draws the graybox, which is correct and visible.

**Also fixed: `main` was red.** `8111e88e` failed both workflows — four TypeScript errors in `tests/interface.test.ts`, from spreading `automatic.beats[0]` (possibly undefined, and carrying `beat?: string` where `SequenceBeat` requires one) and reading a `.actor` that a beat does not have. The staging steps carry actors; the beat does not. Fixed by narrowing once and naming the protagonist from content.

**The check caught it and nobody was watching yet.** `checks.yml` had been live for one commit. It went red on the next one, correctly, and the deploy went red with it — which is the first real data for Q36's second half, and it argues the way it was ruled: the deploy failing did not tell anybody anything the check had not already said.

## Q38 · A mover has clips, not states — so the coach cannot open its door

The coach is a mover now, because errata 38's `move` translates a named mover and a hotspot's state image is drawn by `drawPlate` and cannot be translated at all. Beat 6b could never have worked from a state image.

But **a mover has clips, not states.** `Actor.clip` returns `walk` while it is moving and `idle` when it is still, whatever the mover is, so the coach's two clips carry those names. There is no third thing for it to be.

**The door-open body therefore cannot be shown.** Doc 17 has Thad step out at beat 3, and the coach stands with its door shut until it leaves. The art exists at `art/objects/room-01-coach-unloaded.png` and nothing can reach it.

Two ways out, and both are decisions rather than fixes:

**Movers gain states**, the way hotspots have them — a general mechanism, and the coach is unlikely to be the only thing that ever needs one.

**Or the door stays shut** and beat 3's staging says so. Not absurd: a man who climbs down and closes the door behind him is a man exactly like Thaddeus Grubb.

Related to Q37, which is the same gap seen from the content side: nothing marks the moment he steps down.
## Q39 · The opening, played end to end: one engine defect fixed, four faults left, and where the coordinates are wrong

Run from a fresh load, clicking only dialogue options, with the drawn size of every mover read out of `ActorSprite`'s resample cache rather than by instrumenting the draw path.

**FIXED, AND IT WAS ENGINE: A PLACED MOVER TELEPORTED.** `Actor`'s clock starts at zero and only advances in `update`. `SequenceWorld.move` places a mover and glides it **on the same tick**, so the glide recorded `startedAt: 0` against a scene clock already twenty-five seconds old, and its first frame found a three-second glide long finished. The coach and Hob did not cross — they appeared at their destinations. Nothing threw, nothing looked wrong in a still frame, and they were simply never seen to move. `RoomActors` now remembers the clock it last advanced everyone to and seeds a new mover with it. The coach was measured mid-crossing at x1666 afterwards, where before it was at x2600 on first sight.

The same zero would have made a chore on a freshly placed mover finish before its first frame.

**FOUR FAULTS REMAIN AND THEY ARE ALL YOURS.**

**1. The coach has no `idle` or `walk` clip, and the opening stops there.**

```
PAGEERROR CLIP_FALLBACK: idle/right/
```

`Actor.clip` returns `walk` while moving and `idle` when still — those are the two clips ANY mover is asked for, whatever it is. The record declares `halted` and `unloaded`. This is correct Q20 behaviour, naming the gap rather than substituting, and it is the first thing that stops the run. **I gave the record scratch `idle`/`walk` aliases to see what lay beyond it, and reverted them** — everything below was found through that patch and none of it is in the tree.

**2. THE COACH DRAWS AT 590 × 240. Its art is 956 × 389.** Measured from the resample cache, not inferred. Sixty-two per cent, and it reads exactly that way on screen: the coach roof sits at Thad's head height where a stagecoach should stand half again over a man. The cause is that a mover's height comes from the room's DEPTH CURVE — 222 to 263, a scale for *people* — and `ActorSprite` scales by `height / figureHeight`. A vehicle is not a person and its height is not a point on that curve. It needs an authored height, or an opt-out from the curve.

**3. HOB IS NEVER DRAWN. Not once, in the whole run.** The resample cache has no `hob` entry at all. He is declared right-facing only, and he crosses **right to left** — placed at 2100, moved to 1820, walked to 300 — so `facing` is `left` from his first frame to his last and `clipOf` correctly returns nothing. He crosses the road as a graybox. The staging note says "right-facing only, so he walks the way he is drawn", and the direction is the opposite of the one he is drawn in.

**4. Beat 9 holds beat 10 for sixteen seconds.** `lower('walk')` appends a `waitForActor`, so beat 10 waits for Hob to finish crossing — 1520 px at walking pace. Control passes to the player at beat 8, and then **twenty-four seconds later Thad walks himself across the screen** to (300, 800) while the player is holding the mouse. Beat 10's staging walking the player character during a player-control beat is the part worth a second look; the sixteen-second wait is just what a 1520 px crossing costs.

**WHERE THE COORDINATES ARE WRONG.**

- **He does not get out at the coach.** Beat 2 plays `alight-coach` at **(960, 863)** — the bottom centre of the frame, which is where the actor starts. The coach is at **(646, 742)**. He climbs down 314 px to the right of it and 121 px in front of it, with the coach behind his shoulder.
- **Then he walks the wrong way and comes back.** Beat 2 walks him to **600** — past the coach, to its far side — and beat 3 walks him back **right** to **820**. Measured: 960 → 616 → 820. On screen it is a wobble with no reason in it. If 820 is where he speaks up at the box, beat 2's target wants to be short of it, not past it.
- **Hob's entry and exit are sound.** 2100 is genuinely off-frame right and 300 is clear of the left edge; his path is the only one that does what its note says.
- **The coach's exit is sound.** 646 → 2600 clears the frame at 1920 with its own width to spare.

**One false lead, named so nobody chases it.** An early run threw `BODY_ONE_OWNER: thad@chore+walk` at beat 2. It does not reproduce without the instrument: wrapping `drawImage` to measure sizes slowed the frame enough to trip the guard. R5d — the apparatus perturbed the thing it was measuring, and the second measurement was built to touch nothing.

> **THIS WAS WRONG AND Q44 CORRECTS IT.** The instrument did trigger it, and that is not the same as causing it. It is a real race between two clocks, and any long frame trips it — 5 Mbps throttling reproduces it every run with nothing instrumented at all. "Only appears with the instrument attached" was the right observation and "therefore it is the instrument" was a conclusion the evidence did not support: an instrument that slows a frame is a load generator, and a defect that needs load is still a defect.

## Q40 · Second play-through: the coach is full size now, and Thad is standing in it

Run again from a fresh load after `f6d14ff5`. **No errors, start to finish.** All four of the previous faults are gone: the coach crosses, Hob is drawn and walks the way he is drawn, beat 2 places Thad at the coach before he climbs down, and beat 10 stages nothing.

**FIXED, AND IT WAS ENGINE AGAIN: every unrouted mover drew at the PROTAGONIST'S height.** `Actor`'s height fell back through `options.height → the depth curve if routed → state.content.actor.height`. The coach is unrouted, so it skipped the curve and took the last branch — **Thad's 240** — and its own record's 389 was never read by anything. The generator's `FIXED_HEIGHT` was correct and unreachable. One line: the mover's own record comes before the protagonist's. Measured from the resample cache, **590 × 240 → 981 × 389**, and it now reads as a stagecoach rather than a cart.

**THREE THINGS LEFT, AND THE FIRST IS ONLY VISIBLE NOW THAT THE COACH IS THE RIGHT SIZE.**

**1. Thad's talking position is inside the coach.** The idle frame is 956 × 389 with `anchor[0]` 478, drawn at scale 1.0 from x646 — so the coach and its team occupy **x 168 to 1124**, soles at y742. Thad stands at **(820, 760)**: inside that span, eighteen pixels in front of it. Depth sorting puts him in front, correctly, so he is not hidden — he is standing among the horses. That position was chosen when the coach drew 590 px wide; at 956 it is inside the vehicle. To speak up at the box he wants to be clear of the team, either right of x≈1124 or a good deal further forward than 18 px.

**2. The coach grows 2.6% when it starts moving.** `idle` is 956 × 389 with `figureHeight` 389; `walk` is 956 × **379**. At a drawn height of 389 that is scale 1.000 halted and 1.026 moving, so the departing coach measures 981 × 389 against 956 × 389 at rest. A stagecoach that gets bigger as it pulls away. Both frames are the same 956-wide canvas, so this is the rig's two figure measurements disagreeing rather than the art.

**3. Hob crosses at 240 px, the same height as Thad, sixty pixels further back.** He is unrouted, so he never takes a depth height at all — his record's flat 240 is used from first frame to last. At y700 the curve says 222; Thad at y760 is 242. The two men therefore read as the same size at different depths, which flattens the cue the whole room is built on. Not a break and not obviously wrong to fix here: whether a staged crossing should sample the curve as it goes, or hold one authored height because it is choreography rather than walking, is a question about what staging IS.

**What the second run did not find.** No `CLIP_FALLBACK`, no `BODY_ONE_OWNER`, no missing mover, nothing undrawn: `thad`, `hob` and `coach` all have resample-cache entries, which is the first time every figure in the opening has been drawn from its own art.

## Q41 · Third play-through: the depth ruling is in, and Hob speaks his line from off the frame

Run again from a fresh load after `b29842a5`, with doc 43 part two read first. **No errors, start to finish.** Thad alights at the doorway and speaks from in front of the box, the coach is at its own size and stops growing, Hob walks the way he is drawn.

**THE DEPTH RULING, IMPLEMENTED — and it needed something the record did not carry.** "An unrouted mover samples the curve at its current feet Y" and "the coach takes no scaling from the curve" are both true, and **nothing in the data told the engine which was which.** `FIXED_HEIGHT` lived in `build-actor-record.mjs`; the record it wrote carried the number and not the fact. So the engine could not distinguish a coach from a man without asking a tool that is not running.

`scalesWithDepth` is now in the record, written by the generator from the same `FIXED_HEIGHT` table. A fact about a character belongs to the character. Absent means yes, because everything that walks is a person until it says otherwise.

**And the curve had to be askable off the walk boxes.** Hob crosses **x−260 to 2100** against a box of 256–1629, so `actorHeightAt` — which returns null outside a box, correctly, because null means "there is no floor here" — would have answered for barely half his crossing and left him stepping from 240 to 224 at x256 in full view. `stagedHeightAt` asks the same curve by Y, falling back to the nearest box, which is the pattern `clipPlaneAt` already uses. `actorHeightAt` is deliberately unchanged: a test asserts its null for a point in the sky, and that assertion is worth keeping.

**Measured after: Hob crosses at h224 at y700 while Thad stands at h254 at y800.** Two men, sixty pixels apart in depth, thirty pixels apart in height. Before, both were 240.

**The coach has no entry in the resample cache at all now, and that is the result rather than a gap.** At height 389 against `figureHeight` 389 the scale is exactly 1.0, so `ActorSprite` takes the blit path and never resamples. The absence IS the confirmation.

**ONE THING LEFT, AND IT IS THE BEAT ITSELF: HOB DOES NOT STOP, AND HE SPEAKS FROM OFF THE FRAME.**

Beat 9 lowers to:

```
walk->1080  waitForActor  walk->2100  waitForActor  say  say  say
```

`carriedStepsFor` pushes **all** of a beat's staging and **then** all of its lines. So the stop at 1080 lasts exactly one tick — he touches it and walks on — and "Wouldn't stand there." / "Why not?" / "No reason." play once he has reached 2100, which is 180 px beyond the right edge of a 1920-wide frame. Captured: the line is on screen and the man who says it is not.

**This is structural, not a wrong number.** A beat's lines always follow all of its staging, so *walk here, speak, walk on* cannot be expressed in one beat however the coordinates are written. Two ways out, both yours: split beat 9 so the lines fall in a beat of their own between two walking beats, or give staging a `say` step so a line can sit between two walks. The second is the smaller change and the one that generalises — doc 22 section 6's chain already interleaves `walk → waitForActor → face → waitForActor → chore → say`, and a line is the only thing in that chain that cannot yet be placed.

## Q42 · A staged `say`, so a line can sit between two movements — **RULED and done**

Q41's remaining fault: Hob touched his mark for one tick and spoke his three lines from x2100, 180 units past the right edge of a 1920-wide frame. Structural, not a coordinate — `carriedStepsFor` pushed **all** of a beat's staging and **then** all of its lines, so *walk here, speak, walk on* could not be written however the numbers were chosen.

**IT IS NOT A NEW STEP KIND, AND THAT IS WORTH SAYING PLAINLY.** `SequenceStep` has carried `say` since it was written. Errata 28a cut the kinds to five, 30a added `wait`, 38 added `move`; **this adds none.** What it adds is the ability to PLACE one. Doc 22 section 6's chain is `walk → waitForActor → face → waitForActor → chore → say`, and a line was the only thing in it an author could not put anywhere.

**A STAGED `say` CARRIES AN INDEX, NEVER A STRING.** The staging table lives in `tools/extract-content.mjs` so that no `.ts` holds a coordinate and no prose document holds a pixel. A `say` with text in it inverts that exactly: dialogue would live in a tool, and doc 17 would stop being the only place the words are. Two places holding one fact is how every pair of documents in this project has drifted.

So beat 9 is now `walk → say 0 → say 1 → say 2 → walk`, where 0, 1 and 2 are the lines doc 17 already gives that beat — Hob, Thad, Hob. **An index with no line behind it throws at extraction**, which is checkable in a way a string is not:

```
doc 17 beat 9: staging says "say 7" and the beat has 3 line(s). A staged say names
one of the beat's OWN lines by index and carries no text -- the words stay in doc 17.
```

Proved by writing 7 and watching it fail.

**A beat that places any of its lines places all of them.** `unplacedLines` returns nothing once a beat schedules one, so a beat cannot half-schedule itself and play the remainder twice — which would have put a line the author had placed beside one they had not, in an order nobody chose.

**Played: all three lines land while he is stopped at x1080.** Captured one frame per line.

**And the test asserts the property, not the shape.** Every `say` step falls strictly between the first and last `walk`, each line appears exactly once, in authored order, and every staged `say` carries a number rather than a string. It fails against the old lowering, where all three sat after the last walk.

**One thing the check caught on the way.** The engine's error message for a bad index was written as a full English sentence and `check-no-content-in-code` flagged it as player-facing prose. It was right to: a paragraph in an engine `.ts` is indistinguishable from a line of the game. Shortened to `Beat 9 stages say 7 of 3 line(s)`; the explanation lives in the extractor, which is a tool and not scanned.

## Q43 · A fallback to a literal is fine; a fallback to another entity's data is not — **now a check**

The rule, as ruled: **an engine decision must trace to a field on the thing it is deciding about, or to a named constant, and nothing else.**

```
?? 240                     fine -- "nobody told me, here is the standard answer"
?? PLACEHOLDER_HEIGHT      fine -- the same, with a name to grep for
?? content.actor.height    THE DEFECT -- "nobody told me, I will use HIS answer"
```

The third is silent **by construction**, because somebody else's answer is always plausible: right type, right magnitude, and it comes from a record that is correct about itself. The coach asked how tall it was, its own record was never consulted, and the engine answered with the protagonist's 240 against art of 389. Record correct, generator correct, every check green, stagecoach with its roof at a man's head height.

**`tools/check-entity-fallback.mjs` parses `engine/**/*.ts` with the TypeScript compiler and flags any `??`/`||` whose right side reads `content.actor` — the singular, the protagonist.** `content.actors.get(id)` is not flagged and must not be: it is keyed by the identity of the thing being decided about, which is the entire difference between the two lines.

**It found three, not one.**

**1. `Actor.ts:131` — the known one.** `?? state.content.actor.height`, now `?? PLACEHOLDER_HEIGHT`, a named constant that is deliberately read from nobody. The only mover reaching it has no record at all and draws a placeholder meant to be seen.

**2. `GameState.ts:679` and `:680` — laundered through a local, and the check nearly missed it.** `surfaceAt` read `this.content.actor.clips[0]?.surface` into a variable called `fallback` and wrote `?? fallback`. A question about the GROUND answered out of a CHARACTER's record, one indirection along. Harmless only by accident — no clip declares a surface today, so it evaluated to `''` anyway. Now `NO_SURFACE`, which keeps what the old line was really for (no `.ts` file gets to know that mud is called mud) without borrowing anybody's data to do it.

**The check had to grow twice to see it**, and both gaps are worth recording because both are how a rule like this dies:

- **a bare identifier hides everything.** It now follows one hop to a same-file `const` initialiser. Scope-naive on purpose, and it names both lines in the message.
- **a tidy little default hides the rest.** `x.y ?? ''` wrapped the protagonist's field in its own fallback, and a check reading only the operand saw a `??` and stopped. It now looks through the left side of a nested fallback.

**3. `GameScene.choreSeconds` — the same rule, and no `??` in sight.** It read `content.actor` and guarded with `mover.id === record.id`, so a chore staged for anyone else resolved to `undefined` and threw. That guard was correct when he was the only record and is wrong now: **it would refuse a clip Hob genuinely declares**, and if it had not thrown, the duration would have come off Thad's `reactRate`. Now keyed by the mover's own id. A mover with no record still throws, by name.

**This is the part the script cannot hold.** The general rule reaches anything that answers a question about one entity out of another's data, in any syntax. The greppable subset is most of its value and is now enforced; the rest is a review rule, and finding number 3 came from reading rather than running.

**30 checks.** Played afterwards to confirm the chore path still works — beat 2's `aboard-coach` and `alight-coach` and beat 6's `pickup-low` all play, no errors start to finish.

## Q44 · The graybox coach, and the BODY_ONE_OWNER I wrongly dismissed

Both found by playing `6e225e7a`, and both mine.

**1. THE COACH DREW AS A BLACK RECTANGLE BESIDE THAD, half a second into a new game.** Now that it is placed in beat 2 it is on screen from the first frame — and its frames were in the DEFERRED half of the boot split. The graybox was the fallback working exactly as designed, which is why nothing threw and nothing was red.

`planBoot`'s required set was "the start room and the protagonist", and that word was an assumption rather than a fact. It is now **the start room and everyone the opening stages before it asks the player for anything.**

**The line is the first player-control beat**, not "everything the opening stages". Hob is placed in beat 7, on the far side of the driver's entire conversation — a player-paced event of no fixed length, and always at least one interaction away. There is time for him to arrive; there is none for the coach. Nothing else about them is statically distinguishable, and counting seconds is not available at boot.

Cost: **63 files / 6.49 MB → 65 / 7.93 MB.** Two frames, 1.44 MB, because the coach's are 956 × 389. `check-boot-assets` now prints the cast by name — *"the first frame waits on stage_road and coach, thad"* — so the next mover added to an early beat is a number somebody sees rather than one they discover by watching a rectangle.

**2. `BODY_ONE_OWNER: thad@chore+walk` IS REAL, AND I TOLD YOU IT WAS NOT.** In Q39 I recorded it as an artefact of my draw-spy because it vanished when the spy came off. It reproduces on every run at 5 Mbps with nothing instrumented. The spy was a load generator; removing the load hid the defect rather than disproving it.

**It is a race between two clocks.** A chore's end is computed twice — the runner waits `now + duration` from the tick it issued one, and the `Actor` ends it from its own clock — and the frame ran `sequence → carried → actors → settleBodies`. With the sequence first, the actor's clock was a frame BEHIND the runner's, so the actor finished at `now(N−1) + d` against the runner's `now(N) + d`, and the release at the end of the tick normally landed a frame before the next claim at the start of one. **On a long frame both deadlines fall inside the same tick**: the runner advances, claims the body for the walk, and the chore still holds it because `settleBodies` has not run yet.

**The frame now advances and settles BEFORE the script decides:** `actors.update → settleBodies → sequence → carried`. That puts the clocks in phase — a chore issued now records the same `now` the runner waits from — and guarantees that whatever finished has let go before anything asks for it. Proved both ways: three clean runs at 5 Mbps, then the old order restored for two runs that both threw.

**My first fix was wrong and a test caught it.** I made `lower('chore')` append a `waitForActor`, which works — and contradicts doc 22 section 6's chain, `walk → waitForActor → face → waitForActor → chore → say`, asserted verbatim in `staging.test.ts`. The wait after a chore is not in that chain because `say` claims nothing. Reverted; the race was never in the lowering.

**What this says about the earlier dismissal.** "Only appears with the instrument attached" was a correct observation. "Therefore it is the instrument" was a conclusion the evidence did not support — a defect that needs load is still a defect, and R5d's own warning about an apparatus that perturbs its subject cuts the other way too. The apparatus can create the CONDITIONS for a real failure as easily as it can create a false one, and the two look identical from a single run.

## Q45 · The drawer was leaving three steps off the picture, and the label branch for them was unreachable

Regenerated both views after the merge, which is the instruction, and the timeline was wrong in a way only the timeline could show.

**HOB'S BEAT 9 READ `walk / walk`.** The staging is `walk → say 0 → say 1 → say 2 → walk`. Three steps missing from a drawing whose entire job is to be looked at before the thing is played — and it was **the exact shape the say-step was added to fix**, so the picture agreed with the defect rather than with the code.

**A staged `say` carries no `actor`** — it names one of the beat's own lines by index, which is the constraint that keeps dialogue out of the tool — so `staged.actor` was undefined and `timeline()` dropped it at the grouping step. The label branch for `say` existed and was **unreachable**, which is the worst state a drawing can be in: it looks like the tool handles the step.

**The speaker is the row.** `beat.lines[i].speaker` is an entity id, so a line now lands on the row of whoever says it. Beat 9 draws as `walk / "Wouldn't stand there." / "No reason." / walk` on Hob's row with `"Why not?"` on Thad's — the exchange visible as an exchange, between the two walks, which is what being able to place a line was for.

**And the rows overlapped.** Labels are stacked and centred on the row line, so Thad's six steps in beat 2 ran fifty units either side and printed through the coach's row above — two `PLACED` labels on top of each other. Each row is now as tall as its busiest cell.

**One thing that was NOT a tool defect, and I nearly reported it as one.** The map came back with a flat grey background and no plate. The SVG references it as `href="../art/backgrounds/..."`, and I had loaded the file through `setContent`, which has no base URL for a relative href to resolve against. Loading it from `file://` renders it correctly. **My viewer, not the drawer** — R5d, and the check took thirty seconds against a report that would have cost somebody an afternoon.

**The instruction holds and is worth restating as the reason:** a check knows *"placed before used"* is violated; only a drawing tells you a man is standing among the horses. It also tells you when the drawing itself has stopped keeping up with the vocabulary — which is what this was.

## Q46 · `walk` was drawn by accident, and the vocabulary is now checked against the drawing

Your coverage question, run: `chore` named, `face` named, `move` named, `say` named, **`walk` not named.** The commonest step in the file reached the drawing through a default branch — correct today, and the same latent shape that left `say` unreachable. The next kind added would have fallen through the same way and looked drawn.

`tools/check-drawer-coverage.mjs` reads the `do` values out of every staging table in the content, parses `draw-staging-timeline.mjs` for the string literals compared against `.do`, and requires the first set to be covered by the second. **31 checks.**

```
staging uses "walk" (content/sequences/opening.json beat 2) and
tools/draw-staging-timeline.mjs never names it. It reaches the drawing through a
default branch, which is correct by accident: the label is whatever the step
happens to look like, and nothing says so. Name it, even if the label is its own name.
```

`walk` is named now, and the default branch says `UNDRAWN: <kind>` rather than guessing — so if the check is ever bypassed the picture says so in the picture.

**THIS IS THE THIRD TIME TODAY THE ANSWER HAS BEEN THE SAME SHAPE**, and it is worth putting the three together because the family is now clear:

| | agreed with itself | nothing checked it against |
|---|---|---|
| the stale actor record | `rig.json`, which the generator had just written | the frames on disk |
| the boot split | its own field-by-field helper | every declared image, found generically |
| the drawer | the steps it happened to know | the vocabulary the content actually uses |

Each time a mechanism was internally consistent and correct about everything it looked at. Each time the check that fixed it **enumerated from a different direction** — the PNG header, a regex over the records, the content's own `do` values — rather than asking the mechanism to confirm itself.

**And a fourth thing, on the apparatus.** My first negative test for this check reported PASS with the `walk` branch removed, which would have meant the check did not work. It had not run: shell quoting swallowed the edit and the file was never modified. Rewritten with `assert s.count(old) == 1, 'the experiment would not have happened'`, and it then failed correctly. R5d's clause, on the check written to enforce R5e's — an experiment that did not happen returns the answer you were hoping for just as readily as the one you feared.

## Q47 · The coach was facing front; the fringe check found nothing; and I misread the art twice

**1. THE COACH WAS FACING `front`, AND IT IS DRAWN RIGHT-ONLY.** Not surface, not a missing sprite. Instrumented by asking `drawMover`'s two predicates directly from the page rather than wrapping the draw path — R5h, since a wrapper is a load generator:

```
coach: branch=FRAMES 0  clip=idle/front  surface="mud"  frames=0
       clipIds=["idle/right","walk/right"]  textureLoaded=true
```

`clipOf` refuses a facing a character is not drawn in — Q20, by design — so `front` resolved to no clip and the renderer drew the placeholder. **Two causes, both fixed, and both were needed:**

- **`Actor`'s initial facing was a flat `'front'`.** Nothing had ever chosen it for the coach. A character drawn in exactly one direction has exactly one possible facing, so the RECORD answers this now and a module default does not. Where a record declares several, `front` stands — that is a real choice among real options.
- **A zero-distance `move` turned it to face the camera.** Staging places a mover with `move` from a point to the *same* point; `glideTo` asked `facingToward` which way to turn and got `front`, because a dx of zero is inside the vertical branch's dead band and a dy of zero is not above. **A point he is already standing on names no direction**, so it now changes nothing. Thad survived the identical call only because beat 2 follows it with an explicit `face right`.

**And the same zero-distance move was playing a WALK CYCLE.** `isWalking` is true for any glide, so the opening's first tenth of a second was Thad walking on the spot facing the camera before turning side-on. A move to where you already are now places, and does not walk.

**2. FAULT 3 IS NOT WHAT EITHER OF US GUESSED, and I have not reproduced it.** Traced on the game's own frames rather than by polling:

```
before:  walk/front(0.1s) → idle/right(0.28s) → aboard-coach → alight-coach → walk/right → idle/right
after:   aboard-coach/right → alight-coach/right → walk/right → idle/right
```

The facing is right, the clip selection is right, and the sprite drawn is the right-facing art — **verified by putting the on-screen head beside `thad-idle-right` and `thad-idle-left` at magnification.** The only anomaly the trace contains is the `walk/front` placement artifact above, which is now gone. If the oddity survives, it is at a moment this trace does not distinguish, and the timestamps above are the places to point at.

**I MISREAD THE ART TWICE ON THE WAY THERE.** A four-up thumbnail sheet read as "every right-facing directory contains left-facing art" — which would have sent you into the rig for nothing. A head-centroid metric then said the opposite, and disagreed with itself on Hob. Only the magnified side-by-side settled it, and it settled it against both of my earlier readings. **Small pixel-art thumbnails are not evidence about facing**, and a metric invented on the spot to replace an eyeball is not either.

**3. THE FRINGE CHECK IS IN, AND IT FOUND NOTHING — after first appearing to find everything.** `tools/check-key-fringe.mjs` decodes every actor PNG with `zlib` alone, because Pillow is not installable on a CI runner by a check's authority. 195 frames, 40 megapixels, **two seconds**.

Its first run reported 187 frames still carrying fringe, worst 127, on Thad and Hob alike — which would have meant the despill had missed almost everything. **It had not. The threshold was mine.** Every remaining fringe pixel sits at alpha 8–32 and there are none above:

| alpha band | fringe px | worst |
|---|---:|---:|
| 8–32 | 1298 | 127 |
| 32–64 | 0 | 0 |
| 64–128 | 0 | 0 |
| 128–255 | 0 | 0 |
| 255 | 0 | 0 |

So the despill was complete to any threshold that means "visible", and the check's line is where the evidence already put it. **The number below the line is reported every run rather than hidden**, so it is a line somebody can disagree with.

**The threshold sits in a measured gap**: real art tops out at **22** (the coach's maroon), the line is **30**, key fringe reached **127**. `min(r,b) − g` was tried as a tighter alternative and separates worse — 96 against the same 22 — so the average is kept. Proved by lowering the line to 15 and watching it name the coach.

**32 checks.**

## Q48 · Room 1 played end to end: it works, and the player's position is not state

Played from a fresh save at `70e4db1f`: the whole opening, then every hotspot with every examine verb, then the interface. **No errors anywhere.**

**THE OPENING RUNS CLEAN.** `aboard-coach → alight-coach → walk → idle` at the coach, the driver's four options, the coach away, Hob in and across and out, control at beat 8. Nothing thrown, nothing skipped, nothing drawn as a placeholder.

**ALL ELEVEN TARGETS ANSWER, AND ALL ELEVEN ARE DISTINCT.** Seven are live at the start; four are gated and were reached by setting the flags their own `when` clauses name:

| gated on | LOOK | LISTEN |
|---|---|---|
| `case_mud` · `T_CASE_DOWN` | *My case, in the mud, where it was put.* | *Nothing.* |
| `lamp` · `T_HOB_CROSSING` | *A lamp, crossing the road. There is a man behind it and he has not looked at me.* | *Footsteps. Even ones. He is counting them.* |
| `lamp_gone` · `T_HOB_GONE` | *The lamp, away up the street. It has not once looked back at me.* | *Nothing. He has taken the sound with him too.* |
| `coach_gone` · `T_COACH_DEPARTED` | *Gone. It made very good time on the way out.* | *The near axle, going away. It will fail on somebody else's stretch.* |

Two things I checked before reporting and neither is a defect: `case_roof` and `case_mud` both answer LISTEN with *"Nothing."*, which is in `duplicateAllowlist` because doc 05's LISTEN layer says most objects are silent; and `coach_gone` displays as **THE ROAD WEST OUT**, which is its authored name.

**THE INTERFACE WORKS.** Walking, verb selection, PICK UP refused with a written line, an item taken into the hand from the inventory, item-on-target (*"I have struck it against it. The fork is still A."*), the map opening and closing, the menu opening and closing on Escape, Ctrl+S, Ctrl+L, and the west exit into `main_street` at the declared entrance.

**AND ONE FAULT, WITH ONE ROOT CAUSE UNDER BOTH HALVES.**

```
A. walked to               x691 y839  stage_road
B. map open                x686 y838  town_map      (his position survives the map)
C. map closed              x960 y863  stage_road    <-- moved
D. fork in hand at         x700 y830
E. saved, then dropped it  x700 y830
F. loaded                  x960 y863  hand empty    <-- moved, and the hand is empty
```

**THE PLAYER'S POSITION IS NOT PART OF STATE.** The save payload has eight fields — room, inventory, reputation, object states, taken, flags, dialogue progress, dialogue position — and **not where he is standing.** The map is a room (`kind: 'map'`, doc 20 rule 5's "a menu that looks like a place"), so closing it re-enters `stage_road` and room entry places him at the entrance. Both symptoms are that one absence.

**Against a stated acceptance criterion:** CLAUDE.md's list says *save/load restores exact state including partial dialogue trees*. It restores the room and not the yard of road.

**The map half is the one a player meets first**, and it is worse than it sounds: doc 20 rule 2 makes the map always reachable, so checking where you are moves you. Opening a menu should not be a move.

**NOT FIXED, and the boundary is deliberate.** The fix is a `position` field in the save payload plus restoring it on load and on map return — but adding a field to the save format is a compatibility decision about every save already written, and it lands next to doc 34 section 1.2's fourth defect, which is about when `enterRoom` is allowed to autosave. The held item is a separate question with a real answer either way: it is the middle of an action rather than a possession, and the fork was still in `carrying` throughout.

## Q49 · Position is state now, and the black figure does not reproduce on the deployed build

**1. THE BLACK FIGURE IS GONE, AND WHEN IT WENT IS DATABLE.** I could not fetch the live page — the agent proxy denies `github.io` with a 403 on CONNECT, so this is not a reading of the site itself and should not be quoted as one. What I did instead is build the deployed sha exactly as `pages.yml` does, `BASE_PATH=/consolation-prize/ npm run build`, and serve and play the artifact.

**Clean.** Four captures across thirteen seconds: the coach draws, Thad draws, the driver's tree opens. No 4xx, no console errors, no page errors, no rectangle.

The Pages deployment history dates it:

| deployed | sha | |
|---|---|---|
| 01:31 | `9a686a75` | coach facing `front` — **the black figure** |
| 01:57 | `70e4db1f` | the facing fix |
| 02:05 | `c38536cd` | current |

**A screenshot taken before ~01:57 shows it and a screenshot after does not.** That is the whole of it: the black figure WAS the coach, and it was fixed twenty-six minutes later.

**2. POSITION IS PART OF STATE.** Both halves, one mechanism.

`SAVE_VERSION` goes 1 → 2 and the payload carries `position`. A v1 save is rejected outright, which costs nothing: every save in existence was written while testing in the hours before the field existed, and the alternative was leaving CLAUDE.md's own criterion — *save/load restores exact state* — false in the document that states it. The version marker was already there; it just had nothing to mark.

`position` is **optional on purpose**, and the absence is meaningful rather than legacy: the autosave fires on arrival, before the scene has placed him, so there is nothing to record and the entrance is where he is anyway.

**A RETURN PUTS HIM BACK; AN ARRIVAL USES THE DOOR.** `resumeStanding(from)` answers only when `from` is null (a load) or a room whose `kind` is `map` — so no `.ts` file names Room 0, and walking through an exit still lands on the entrance, because that is what an entrance is for.

**Measured in play:**

```
A. walked to               x616 y832 stage_road
B. map open                x610 y831 town_map
C. map closed              x610 y831 stage_road   <-- was x960
D. saved there, walked to  x934 y831 stage_road
E. loaded                  x610 y831 stage_road   <-- was x960
F. walked out west         x1848 y768 main_street  <-- still the entrance
```

Two tests carry it: one that a save round trip restores the position, one that a map round trip resumes while a door does not. **123 tests.**

The held item stays as it is, as ruled. It is the middle of an action rather than a possession, and the fork stayed in `carrying` throughout.

## Q50 · The black figure IS still there, and it is Thad behind the coach

**YOUR CAUTION WAS THE FINDING.** "Clean when played" and "absent in the first hundred milliseconds" are different claims, and my play-through answered only the first: it waits for `__game` and for the scene, which is exactly the apparatus that cannot observe a defect living in the opening frames. R5d, on the instrument that would have had to catch it.

**Rerun with CDP `Page.startScreencast` from navigation** — every frame the compositor presents, 115 of them over 12 seconds on the deployed artifact, no polling and no waiting for readiness. **It is there, in every frame from the first painted one.**

```
first painted frame   2080 ms
2080 ms   a dark angular shape under the coach body
2210 ms   two vertical black bars, between the wheels
2307 ms   the same
...       through the whole of beat 2
```

**IT IS NOT A GRAYBOX AND NOT A MISSING SPRITE. IT IS THAD, DRAWN BEHIND THE COACH.**

```
t=2.06s  insertion order: thad@y742(aboard-coach)  ->  coach@y742(idle)
```

**Both are at y742.** `depthOrder` sorts by feet Y — doc 22 section 5 step 3, and correctly — and `Array.prototype.sort` is stable, so a tie keeps insertion order. Thad is constructed in `create()` and the coach is placed at beat 2, so **thad is first in the map, draws first, and the coach draws on top of him.** He climbs out of the coach from behind it and the only part of him that clears the body is his legs between the wheels — two dark bars, which at a glance is a black figure standing under a stagecoach.

**Three of my earlier readings were wrong on the way to this**, and all three for the same reason: a metric found the darkest column in the play area and returned the plate's own timber at x48, constant in every frame, because a dark blob detector cannot tell a figure from a water tower. What settled it was the contact sheet — R5b2, on the third occasion in one session.

**THE FIX IS A COORDINATE AND IT IS YOURS.** He steps DOWN out of a coach, toward the camera, so his feet land nearer than its wheels. Doc 43 already uses exactly this reasoning for the talking spot — *"(1330, 800) — nearer the camera, so depth sorting has something true to sort"* — and beat 2's alighting spot is at the coach's own y742, where there is nothing true to sort. Any y greater than 742 puts him in front; how much greater is a look, not a calculation.

**The engine cannot fix a true tie and should not try.** Equal feet Y means equal depth, and insertion order is the only thing left — arbitrary, invisible, and not something content should be able to depend on silently. If you want it caught rather than noticed, a check that no two movers are staged at the same feet Y with overlapping x is cheap and I will write it on a word.

## Q51 · The coach's third clip: `state` on `ActorClip`, as ruled

Shape (b). **It adds no mechanism** — `ActorClip` already carried an optional discriminator, `surface`, and `clipOf` already did exact-match-then-fall-back on it. `state` is the same field with the same lookup:

```
state + surface  →  state  →  surface  →  neither
```

A record that declares no state resolves exactly as it did, which is every character in the game. **The state itself is not stored on the clip or on the mover:** `GameState.moverState(id)` reads `objectStates`, keyed `"room/object"` — already saved, already doc 22 item 9's mechanism, and already what the coach used while it was a hotspot. A resting-clip override on `Actor` would have made a second place object state lives.

Tested three ways: no state resolves as before; an unknown state falls back to the stateless clip rather than vanishing; a declared state wins while the stateless clip stays the fallback. **124 tests.**

**Recorded, not hidden, per your ruling:** the departing coach keeps the case on its rack, and strictly the rack is empty after beat 6. It is on screen for three seconds, receding, and a fourth generation would have to align pixel-for-pixel with three others. If it ever reads wrong, that is why.

## Q52 · The chore clips were deferred, and it was live — confirmed, then derived

**YOUR DIAGNOSIS WAS RIGHT AND IT WAS LIVE.** Asked the game directly rather than reading pixels, on the game's own frames, at the moment each chore played:

```
--- unthrottled, cache disabled ---
  t=7.47s aboard-coach   frames=5 textureLoaded=false
  t=8.17s alight-coach   frames=5 textureLoaded=false
--- 5 Mbps, cache disabled ---
  t=26.85s aboard-coach  frames=5 textureLoaded=false
  t=27.53s alight-coach  frames=5 textureLoaded=false
```

**`frames=5` and `textureLoaded=false` is the exact signature.** The record declares the clip, so `frameCount` answers 5 and `drawMover` takes neither the no-record branch nor the zero-frames branch — it calls `draw`, which returns false because the frame has not arrived, and falls to the graybox. **Unthrottled too**, which is the part I would not have guessed: at 7.5 seconds on localhost with the cache disabled it still had not landed, because the deferred half is 146 files served one at a time.

So Q50 and this are two faults in one picture. The depth tie explained where the shape stood; this explains why it was a flat shape at all.

**And a pixel test I ran first was not decisive, which is worth recording.** The dark bars held 2,064 pure-black pixels where the plate has none — which looked conclusive until I checked the coach's own art and found 2,997 pure-black pixels in it. A placeholder and a stagecoach's undercarriage are both black. The question was only answerable by asking the game.

**DERIVED, NOT AUTHORED, as ruled.** `firstFrameStaging` now returns each early actor's staged clip names alongside the actor itself, and `planBoot` requires `FIRST_FRAME_CLIPS` **plus every clip a `chore` names before the first player-control beat**. A chore names its own clip, so the list does not have to guess.

- `pickup-low` stays deferred, correctly — beat 6 is past the driver's whole conversation.
- The idle-break argument is untouched, because **nothing stages an idle break**. It is a thing that happens when nothing else is.

**65 files / 7.93 MB → 73 / 8.21 MB.** Ten frames, 280 KB, for a placeholder that was on screen at a tenth of a second in.

`check-boot-assets` now prints the **clips** as well as the cast, so a chore added to an early beat is a line somebody reads rather than a thing they find by watching a placeholder.

**Verified after: `textureLoaded=true` at both chores, unthrottled and at 5 Mbps.**

## Q53 · Facing toward a point: the runner has it, staging cannot reach it, and it would not help

**`Actor.faceToward(x, y)` exists** and is used by walking — `facingToward` resolves a point to a compass facing. **Staging cannot call it:** the vocabulary is `{ do: 'face', actor, facing }`, a compass direction, and there is no step that names a target.

**But adding one would change nothing here, and this is the part worth having before you move him.** `facingToward` can only ever answer one of four facings, because that is all the art has. Work it for the driver: he sits at x1332–1364, Thad stands at 1330, so `|dx|` is about 18 — outside the ±8 dead band that produces `back`/`front`, so it returns **`right`**. The same answer beat 3 already sets by hand.

**There is no facing that looks up.** The driver is roughly 300 px above him on the box, and the four-direction sprite set has no such pose; a fifth would be a generation for one line.

**THE ART ALREADY ANTICIPATED THIS AND IT IS NOT THAD'S FACING.** Doc 43 part two lists `reference/casting/driver-head-looking-down.png`, and part one says it in words: *"He should be `speaking` on his line and `looking-down` while Thad talks up at him."* Part two's beat table has the row — `| 3 | driver | looking-down | — | while Thad speaks |`. **The man who moves is the driver, not Thad.** Nothing wires the head overlays yet, which is why he speaks to nobody: it is not a facing bug, it is an unwired overlay.

So: no positional fix is needed for the facing, because `right` is already the only right answer. What is missing is the driver's head.

---

## Q54 · Doc 43's tables disagree with doc 43's prose, and the tables are the stale half — **READ BEFORE WRITING THE GAUNTLET SCRIPT**

**This is the single most useful thing to know before the marks are written**, because the gauntlet script is written by hand from doc 43 and doc 43 contradicts itself about the three positions the script would start with.

**The disagreement, laid out.** Doc 43 gives Thad's marks in two tables — part one's beat tables and part two's asset table. Both say the same thing. The shipped content says something else:

| | Doc 43's tables | `content/sequences/opening.json` |
|---|---|---|
| Beat 2, placed | 1290, **742** | 1170, **794** |
| Beat 2, walk to | **1180**, 754 | **1240**, 802 |
| Beat 3, walk to | **1120**, 762 | **1330**, 812 |

**They do not differ by a nudge. They run in opposite directions.** The tables walk him LEFT — 1290 → 1180 → 1120. The content walks him RIGHT — 1170 → 1240 → 1330.

**Doc 43's own prose already corrected both halves, in the same document.**

*On the y:* the tables say 742, and the bold paragraph under beat 2 says the opposite in as many words — *"He steps down out of a coach, so his feet land nearer than its wheels — 794 against 742."* That paragraph is the fix for the black figure. The table was not updated with it.

*On the x:* the tables put his talking spot at 1120, which is under the doorway (1008–1341). The prose says *"There is no room to stand between the driver and the horses. Thad speaks from in front of the box, nearer the camera, not beside it"* — and the box is at **1332–1364**. The content's 1330 is directly in front of the box, which is what the prose asks for. **1120 is not.**

**So the content follows doc 43's prose and doc 43's tables follow nothing.** They are the pre-correction numbers, left behind twice, in the document that says of itself *"every number here is measured or corrected, and the ones that are guesses say so."*

**WHY THIS MATTERS TODAY AND NOT NEXT WEEK.** Doc 44's third honesty is that a green gauntlet against a wrong script is worse than none: it converts an error into an invariant defended on every push. A script written from those three table rows would pin the game to marks the same document already corrected, and every future correction would arrive as a red CI run blaming the game.

**What is needed is a ruling, not a repair.** The tables and the prose cannot both be right and it is not mine to choose. The three positions the content currently plays are the ones that agree with the prose; if they are also the ones that look right on screen, doc 43's tables should be corrected to match before the script is written from them.

**Nothing has been changed.** No table edited, no coordinate moved, no mark written. `tools/gauntlet/opening.json` ships as a skeleton that asserts nothing and says so on every run.

---

## Q55 · The driver's head cannot be wired today, and there are three reasons, not one

**Assigned: wire the driver's head overlay — `looking-down` while Thad speaks, `speaking` on his own line, `neutral` otherwise.** It is not wired, and here is exactly why, measured rather than asserted. Nothing under `reference/` or `tools/rig/` was touched.

### 1. `driver-head-looking-down.png` STILL CARRIES THE MAGENTA KEY

| File | Mode | Transparent px | **Visible magenta px** |
|---|---|---:|---:|
| `driver-head-neutral.png` | RGBA | 270,328 | **0** |
| `driver-head-speaking.png` | RGBA | 270,744 | **0** |
| `driver-head-looking-down.png` | **RGB** | **0** | **279,697** |

The first two are keyed and clean. The third has **no alpha channel at all** and 279,697 opaque magenta pixels — **31.2% of its canvas**. Composited over the coach it would draw a magenta slab across a third of the frame, on the state that is up for the whole of Thad's line.

**It is the same fault `check-key-fringe` was built for, one stage earlier.** That check finds key *residue* on frames that were keyed; this frame was never keyed. It is not caught, because the check reads `art/actors/` and this file is in `reference/casting/`.

**Why it is plausible this was missed:** `driver-head.json`'s own note records that the first `looking-down` attempt failed and was regenerated by a different method. The regeneration produced a correct picture; the keying step did not follow it.

### 2. NONE OF THE THREE IS UNDER `art/`

`vite.config.ts` copies `content` and `art` into `dist` and nothing else. `reference/` is not served by a build. A path into `reference/` would work on the dev server and 404 on the deployed game — which is the worst possible failure shape, because it would look wired to whoever tested it locally.

### 3. THERE IS NO OVERLAY RECT, AND I WILL NOT INVENT ONE

Doc 43 part two gives Thad's talk overlays a complete rect per facing — *"right | x383 y207, 64 × 68"*. The driver's head row gives **none**. What it gives is *"All three share one canvas, so they swap without the body moving. Composite over the coach's own driver, at the coach's scale."*

The two canvases do not obviously relate: the coach's drawn frame is **956 × 389** and the head canvas is **786 × 1140**. Doc 43's *"the driver on the box | 1332 – 1364"* is a world **x** range with no y and no height, so it fixes one of the four numbers needed.

**I tried to measure it rather than guess it** — locating the neutral head inside the coach's own frame by matching, since neutral IS the coach's own driver — and abandoned the search as too coarse to be trusted. A rect that is nearly right puts a head slightly off a neck, which is worse than a head that is absent, because absent is obviously unfinished.

### AND A FOURTH THING, WHICH IS THE LARGER ONE

**There is no head-overlay mechanism at all.** Not for the driver and not for Thad. `content/actors/thad.json` declares no talk clips and no overlay rects; nothing in `engine/render/` composites an overlay over a body. Doc 43's draw order step 4 — *"Head overlays over their own bodies: Thad's talk, the driver's head"* — is unbuilt in both halves.

**Thad's half is fully specified and could be built now:** doc 43 gives all four facings' rects and frame counts, the loop shape (`0,1,0,2,1`, irregular), and the rule that talk timing never controls line duration. The driver's half needs the three items above first.

### WHAT WOULD UNBLOCK IT

1. A keyed `looking-down` — RGBA, magenta cut, matching the other two.
2. The three files under `art/`, wherever the pipeline puts character art.
3. **The overlay rect on the coach's 956 × 389 frame: x, y, width, height.** One row, the same shape as Thad's.

With those, it is a content schema addition and one composite step, and the gauntlet can already assert it: doc 44's probe reports `overlays` by id, and a mark asserting `{"driver": "looking-down"}` against an engine that reports no such overlay fails by **naming it** rather than quietly matching nothing.

---

## Q56 · "Steps forward then backward" is not the staging. Every chore is one pose held between two hard cuts

**The staging is correct and I would have been fixing the wrong thing.** Traced from the running game, every sample through beats 2 and 3, position and clip:

```
t 2.11  beat 2  1170, 794  idle           <- the first drawn frame; already on his mark
t 2.46  beat 2  1170, 794  aboard-coach
t 3.26  beat 2  1170, 794  alight-coach
t 4.10  beat 2  1170, 794  walk
        ...     1175, 795 · 1186, 796 · 1197, 797 · 1208, 798 · 1218, 800 · 1229, 801
t 5.31  beat 3  1240, 802  walk
        ...     1250, 803 · 1261, 804 · 1272, 806 · 1283, 807 · 1293, 808 · 1310, 810
t 6.93  beat 3  1330, 812  idle
```

**Every sample increases in x and in y. There is no backward step and no jump** — he is already standing at 1170, 794 on the first frame that is drawn, so even the placement is invisible.

### WHAT HE SAW IS IN THE CHORE FRAMES

Comparing each chore's frames against `stand`, and against each other:

| | vs `stand` | |
|---|---|---|
| `aboard-coach-00` | **identical** | |
| `aboard-coach-01` | 96,735 px differ | |
| `aboard-coach-02` | 96,735 px differ | **0 px differ from -01** |
| `aboard-coach-03` | 96,735 px differ | **0 px differ from -02** |
| `aboard-coach-04` | **identical** | |

`alight-coach` and `pickup-low` are the same shape — 80,616 and 65,598, with frames 1, 2 and 3 byte-identical to each other.

**So a chore is not an animation. It is ONE POSE, held for three frames, with a hard cut in and a hard cut out.** The rig note says frames 0 and 4 are the stand frame byte for byte "so a chore cannot pop on either end", and that is doing exactly what it says — but there is nothing between the ends.

**Beat 2 plays two chores back to back, so what is on screen is:**

> stand → *in the doorway* → **stand** → *leading foot down* → stand

He straightens up, in the middle of climbing out of a coach, between the two halves of one continuous descent. **That is the forward-then-backward.** It is not a coordinate; no staging change can remove it, because the return to stand is in the clips.

### WHAT WOULD FIX IT — not mine to choose

1. **One clip for the whole descent** rather than two poses that each return to stand.
2. **Chained chores**: a way to run a run of chores without the stand frame between them — play 0–3 of the first and 1–4 of the last. Cheap, and it makes any two-pose action read as one.
3. **Leave it**, and accept that a chore is a held pose. That is a legible convention if every chore is a single beat of action; it only fails where two are meant to be one.

**The wider fact is worth having on its own:** all seven of Thad's chores are three identical frames between two stand frames, so nothing he does with his hands is animated yet. Doc 42's poses are poses. That belongs to the rig, and I have not touched it.

---

## Q57 · Three questions answered from the code, not decided

**11. DOES SPEECH USE PER-CHARACTER COLOURS? No, and nothing carries one.** The opening's `speakers` table has `name` and a note and no colour; no dialogue file declares one; `drawSay` draws every line with a single `inkBright` role and one outline. Monkey Island did do this. It would need a colour per speaker in content and a lookup where the line is drawn — the speaker is already known at that point, because the probe reports it.

**12. THE ROAD WEST IS AN IMMEDIATE TRANSITION, and the engine already supports the other thing.** `road_west` is an exit hotspot with **no `walkTo`**. `GameScene.beginInteraction` reads exactly that field: a target with `walkTo` gets walk → waitForActor → face → then the interaction; a target without one resolves where the player stands. So this is a one-line content addition and not an engine change. **Where he should stand before taking it is a design call and I have not made it.**

**13. THERE IS NO TITLE SCREEN.** `beginOpening` filters the menu segment out of the opening with the comment *"Beat 1 is the title screen, which is its own scene and has already happened by the time anyone is standing on a road."* That scene does not exist: `main.ts` registers `BootScene` and `GameScene` and nothing else. **Beat 1 draws nothing.** The game boots into Room 1 and starts at beat 2, and doc 17's "Title over the ridge at night. Consolation below as scattered lamps in a great deal of darkness" — the one moment the document asks for longing rather than comedy — has never been on screen.

---

## Q58 · Is there supposed to be writing on the Consolation sign? — UNASKED, and raised rather than invented

Q3 ruled that the placard's **MARK** comes off. Whether the sign **carries text at all** is a different question and no document answers it.

**Raised rather than settled, because lettering is writing.** Putting words on a sign in a comedy adventure is authoring a line — the name of the town, in the town's own hand, is the first thing a player reads and it sets a voice. CLAUDE.md's rule is that every written line already exists in the documents and a missing one is reported, not filled in. This one is missing.

**What is checkable:** the sign is in the plate. There is no text layer, no glyph draw over it, and nothing in content declares one. If the answer is that it should carry the town's name, that is art — a new plate or a decal — and not something the font can be asked to draw over a painting at a believable angle.

---

## Q59 · The title art exists, is unusable, and would have been regenerated at the void resolution — **now guarded**

**Two files, both 320×144**, which is the resolution errata 54 voided:

| | | |
|---|---|---|
| `art/backgrounds/title-screen.png` | 320 × 144 | referenced by no content |
| `art/backgrounds/room-29-high-ridge.png` | 320 × 144 | referenced by no content |

**And the title render has its lettering AND its whole menu painted into the image** — THE LAST CLAIM IN CONSOLATION, and NEW GAME · CONTINUE · OPTIONS · CREDITS, all baked pixels. That makes it **a picture of a title screen rather than a title screen**: no hover, no greyed-out CONTINUE when there is no save, and typography that is not the game's own face at ×6.

**Neither was on `superseded.py`, so `npm run renders` would have regenerated both at 320×144.** That is the same footgun Q20 guarded for Room 1's plate and `thad.json` — following the documented instruction destroying committed work. **Both are now on the list and the refusal is verified: `npm run renders` stops on `room29_ridge.py` by name and neither file changes.**

### THEY ARE TWO DIFFERENT THINGS AND WILL BE CONFLATED OTHERWISE

**1. A TITLE SCREEN — art plus an interface.**

*What it needs:*
- A plate at **1920 × 864**. Doc 17 says "over the ridge", Room 29 IS the high ridge, and `room29_ridge.py` already composes it — at the wrong size. Whether the ridge plate is regenerated at 1920×864 or the approved-plate route is used (as Room 1's was) is an art decision.
- **The title drawn, not painted.** The game's own face, so it matches everything else, and so it can be laid out rather than re-rendered.
- **Live menu items**: NEW GAME always; CONTINUE greyed with no save — `MenuSystem` already does exactly this greying for the in-game menu; OPTIONS; CREDITS.
- **A scene.** `main.ts` registers `BootScene` and `GameScene` and nothing else, and `beginOpening` filters beat 1 out with a comment saying the title "is its own scene and has already happened". Somebody has to build the scene that comment refers to.

*What it does NOT need:* any change to the opening. Beat 1 stays filtered; the title screen precedes Room 1 entirely.

**2. THE CREDITS OVER THE WALK — no art and no interface.**

*What it needs:*
- **Text and timing only.** It is drawn over live gameplay while Thad walks away through the fence gap. There is no screen, no plate and nothing to click.
- **The words are Tyler's.** Not invented here.
- **The timing fits the walk, not the other way round.** The walk's length is a `move` over a stated duration; the credits must be authored to that number and not the reverse.
- The act-card drawer is nearly the mechanism already: centred, outlined, over the play area, wrapped as of this session. What it lacks is a sequence of cards rather than one.

### WHAT IS ALREADY TRUE AND WORTH KNOWING

**The exit walk needs no new step kind.** `move` already plays the walk cycle — `glideTo` sets `glide`, `isWalking` is true while it holds, and `Actor.clip` returns `walk` whenever `isWalking`. Errata 38 says so in as many words: "it carries the object's own animation while it travels." And `glideTo` calls `faceToward` first, so a move up the hill is dominant-vertical and resolves to **`back`** under the facing rule ruled this session. `thad-walk-back` exists in the record.

---

# HOW THIS DOCUMENT WORKS

Entries are added, not rewritten. When the project owner rules on an open question it moves to Part One with the ruling recorded. When doc 34's stop condition lifts — integrated proof action, canonical street loop, safe save/load/title flow all executable — this list is reviewed in one pass and whatever still deserves to be global becomes errata.

**Nothing in this file overrides anything. It records.**
