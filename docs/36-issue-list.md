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

## Q31 · The dialogue trees are consistent. Errata 37 is what reads as inconsistent.

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

---

# HOW THIS DOCUMENT WORKS

Entries are added, not rewritten. When the project owner rules on an open question it moves to Part One with the ruling recorded. When doc 34's stop condition lifts — integrated proof action, canonical street loop, safe save/load/title flow all executable — this list is reviewed in one pass and whatever still deserves to be global becomes errata.

**Nothing in this file overrides anything. It records.**
