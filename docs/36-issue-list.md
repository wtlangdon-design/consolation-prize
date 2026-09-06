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

## Q2 · Which way is Main Street — **RULED: errata 58 adopts the resolution below**

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

## Q5 · Rooms are designed to change across acts — **RULED: errata 60, the act field**

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

## Q16 · The panel layout is provisional and needs the font — **CLOSED, ERRATA 62**

**Closed.** The font is ruled: the existing bitmap face ships at `PANEL_GLYPH_SCALE` 4. The panel rows in `content/ui/panel.json` were authored for a 28-unit glyph, which is that face at that scale, so they are no longer provisional — they are the layout.

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

## Q60 · No character in the game can be clicked, and that is not a fact about Hob

**Hob is reached through his lamp, and that works because he happens to carry something.** The undertaker, the hotel clerk, Deke Vessel and the rest do not.

**A MOVER HAS NO CLICKABLE EXTENT AT ALL.** `GameState.targetAt` searches hotspots and exits, both of which are rectangles declared in room JSON. `RoomActors` holds the movers and nothing in the input path consults it. So `TALK_TO` cannot reach any of them — not Hob, not the driver, not anybody.

**The scale of it:** doc 07 has 18 ambient characters, doc 04 has 8 character trees, doc 40's contract gives the protagonist `talk` overlays in four facings. **None of the people those were written for can be clicked.**

**IT WILL BLOCK ROOM 2 THE MOMENT THERE IS SOMEBODY TO TALK TO**, which is the next room with a character in it.

### WHAT IT NEEDS — a mechanism, not a room detail

A mover needs a hit extent, and the obvious candidate is **its drawn bounds at its drawn scale**, hit-tested in the same depth order the renderer draws in — feet Y, nearest first, so clicking two overlapping characters picks the one in front. `ActorSprite.placement` already returns the drawn origin and scale for exactly this reason, and `drawnHalfWidth` already measures the extent for the depth-tie check. The pieces exist; nothing assembles them.

**Three things it must settle, none of them obvious:**

1. **The padded canvas is not the character.** Frames carry 260 columns either side so a swung arm is not clipped, so the drawn bounds are much wider than the man. A hit box taken from them would catch clicks a foot to his left. The record's `anchor` and `figureHeight` describe the FIGURE, and a hit extent probably has to come from those rather than from the canvas.
2. **Which verb a mover answers.** An ambient NPC already has `verbs.npcVerb` as its default; a mover has no equivalent, and doc 13's fallbacks are keyed on targets.
3. **Where the response lives.** A hotspot carries its lines in room JSON. A character's lines are in his tree, or in a beat, or in doc 07's barks — three different homes, and a click has to resolve to one of them.

**Not attempted.** Filed because it is the shape of the next blocker rather than a defect in what exists, and because "use the thing he is carrying" only worked once.

---

## Q61 · The walk speed and the stride disagreed by a factor of three, and lowering Hob's `walkRate` did nothing

**Reported as "his legs move far too fast".** The suspicion offered was that a diagonal covers √2 times the ground and the phase outruns the eye. **Measured, and that is not it:**

| | frame changes | cycles | speed |
|---|---:|---:|---:|
| horizontal | 25.8 /s | 2.90 /s | 323 px/s |
| 45 degrees | 25.8 /s | 2.63 /s | 322 px/s |
| vertical | 28.0 /s | 2.00 /s | 320 px/s |

**The phase rate is the same in every direction**, because `advanceWalk` steps a constant distance along the direction vector. Diagonal routing is not the fault and nothing about it needs changing — doc 29 line 35 stands: the route may be diagonal, only the facing is cardinal.

**THE FAULT IS THAT THE SPEED AND THE STRIDE WERE NEVER RECONCILED.** 323 px/s against a measured 102px stride is **3.2 strides a second**; a person walks about two. Under the old clock-driven phase the legs ran at the record's 8 frames/s — one cycle a second — while he covered 323px, which implies a **323px stride, 1.35× his own height per step**. Slow legs and fast travel is a glide, and it read as one. Making the gait honest about distance made the speed visible.

**AND LOWERING HOB'S `walkRate` FROM 8 TO 5 DID NOTHING.** That is the frame rate of his cycle, not his speed — so he covered ground exactly as fast as Thad with slower legs, which is a man skating. Since the gait advances from distance, `walkRate` no longer governs walking at all, and the change now does nothing whatever.

**`walkSpeed` is a fact about a character**, like a stride or a height, so it is on the record: Thad 245 px/s (2.4 strides a second, a purposeful walk), Hob 170 (1.6, a slow old man). **Both are taste.** The arithmetic only says which numbers have to agree; it does not say what pace suits a man who has just arrived somewhere he means to make his fortune.

---

## Q62 · The walkable band's back edge stands level with the furniture's feet

**Reported as "he walks across boxes and the fence in the background".**

The band's back edge is **y660**, taken from where the mud becomes the surface — from what the ground is, not from what stands on it. The bench, its rail and the crate beneath it have their bases between roughly **y630 and y660**, so he may stand level with them or sixteen pixels in front, and at 222px tall he is drawn straight over them. Standing in front of something and being drawn over it are the same picture when there is no depth between you.

**Two ways, and the difference is not measurement.** Bringing the back edge down is one number; walk boxes that exclude the furniture is more correct and much more work. The band is 204 rows deep against a 240px character, so 40 rows at the back costs almost nothing — at y700 the depth curve still gives him 224.

**y700 clears every base by 40 to 70 pixels. y680 clears the bench legs and not the crate.** A rendered overlay with 660, 680, 700 and 720 drawn across the walk box is the thing to look at; the number is Tyler's off that picture, not off this paragraph.

---

## Q63 · Hob stands in the gap, and clearing him is the way out — RULED

**`road_west` is gated on `T_HOB_GONE`.** Until Thad has spoken to Hob, the gap in the fence is not an exit: clicking it gets a line and nothing else. Speaking to him — through his lamp, which is the only part of him a click can reach — sends him on his way and opens the road.

**This is a puzzle and it belongs in the graph**, not only in the room file. One node: *the watchman is in the way; address him and he moves.* It is the smallest possible puzzle and that is the point — it teaches the player, in the first room, that people are obstacles you resolve by talking rather than scenery you walk past.

**The softer version was wrong.** The exit was first narrowed to x500–590 so it could coexist with his lantern, which meant he was neither blocking nor clear — a man standing in a doorway you could simply walk around. Under this ruling the exit returns to the full gap, x500–650, because there is nothing left to compete with once he is gone.

**Two things this creates and one it does not.**

**The only way out of Room 1 now depends on one interaction.** If the lamp's response ever stops writing `T_HOB_GONE`, the game is unfinishable from its first room. That wants a check, not trust: an exit gated on a flag must have a writer that is built, and doc 36's `pending` mechanism already names unwritten flags on every run.

**And it makes the lamp load-bearing rather than decorative**, which is what it should be if it is the only address a mover has (Q60).

**What it must NOT create is a talkative Hob.** See below.

---

## Q64 · Hob's silence is the mechanism, not a gap — DO NOT GIVE HIM LINES

Doc 01 is specific: **"Speaks maybe forty words in the first two acts, all useless. He is Obadiah Mott. The game's best reveal is that the player walked past him in the opening scene and he had a line."**

That is a constraint, not an omission. It was proposed that Hob carry exposition about the town, or comic lines, since he is the first character the player meets and currently says almost nothing.

**Both would cost the game its best reveal.**

**Exposition is the direct contradiction.** Hob is the man who knows everything — twelve years watching the town search for him. A watchman who explains Consolation is Mott explaining Consolation, one act early, to a player who has no idea what he is being told.

**Comic lines are the subtler cost.** The reveal works because the player does not remember him. A character with good jokes is a character you remember as a character; the turn in Act III depends on the player realising they walked past somebody, not that a memorable minor character was secretly important.

**What he may have:** a handful more words that read as nothing and only mean something on a second playthrough. Weather. The mud. Not looking at you. The three he has — *"Wouldn't stand there." / "Why not?" / "No reason."* — are the model: refusals that sound like an old man being unhelpful and are, on reflection, a man declining to explain how he knows.

**The budget is forty words across two acts and he has spent about twelve.** Whatever is added comes out of that.

---

## Q65 · The case cannot enter the panel: doc 17 points at doc 23 for its lines and doc 23 has no case

**Q11 is ruled and two thirds of it are built.** The case comes down at beat 6 — it is its own drawn layer, gated on `T_CASE_DOWN`, so writing the flag *is* the case moving — Thad stoops to it with `pickup-low`, and beat 6b holds him in `carry` while the coach leaves. That last one is the bible's opening image: *"a stage coach pulls away, revealing a young man in a good coat standing in mud, holding a case."*

**The third part cannot be built, and the reason is a document pointing at another document that does not answer.**

`case_mud`'s PICK UP already carries `take: true` — doc 17 calls it *"the first PICK UP in the game and it teaches the verb"* — but the hotspot has **no `item`**, and `resolvePure` only moves something into inventory when `action.take && target.item`. So the case is picked up and goes nowhere.

**An item needs a record**, and `content/items/` has nine and not this one. Doc 17 state C says where its words live:

> **State C — carried.** The hotspot is gone and the case is inventory. **It has no LOOK or LISTEN lines of its own** — an object that does not exist cannot answer. *Its inventory lines are doc 23's.*

**Doc 23 has nine entries — the tuning fork, the letter, four dollars, the deed, the company map, the horse blanket, the pickaxe, the filing fee — and no case.** It mentions the case twice, both times inside the fork's lines: *"My father put this in the case first"*. The case's own inventory lines were never written.

**Two ways out, and both are Tyler's:**

1. **Doc 23 gains a case entry**, and the item is extracted from it like the other nine.
2. **The case answers from doc 13's fallback pools**, which is a legitimate design — an item with no authored lines gets the generic ones — but it would be the only Act I item that does, and the case is the one the opening teaches PICK UP on.

**A third thing is worth noting for whichever is chosen:** doc 17 still carries two LISTEN variants under state C, left over from the single-state version. The extractor reports them as orphans and drops them, correctly, because doc 17's own text says state C has no lines of its own. They are duplicates of state B's second and third. If doc 23 gains an entry they are not it.

**Nothing invented.** `name` would be "HIS CASE", which the hotspots already carry, but a name without lines is half an item and which half is missing is a decision about the writing.

---

## Q66 · The overlap check failed seventeen times on a correct tree, and overlap was never the rule

**Not a defect in the content. A defect in the check, caught before it was believed.**

The check argued for in Q63 — *"two targets whose rects intersect, where one carries `travelWhenTold`, is a defect by construction"* — was first written as *no exit shares a rectangle with anything live at the same time*. It failed **seventeen times across six rooms**, none of them defects:

| Room | Exit | Overlaps |
|---|---|---|
| main_street | `to_hotel` | `boardwalk`, `false_fronts`, `mud` |
| main_street | `to_clarion` | `posted_notices`, `dog`, `false_fronts` |
| main_street | `to_assay_office` | `boardwalk`, `false_fronts` |
| main_street | `to_company` | `company_sign`, `false_fronts` |
| main_street | `to_nugget` | `false_fronts` |
| main_street | `to_claims_road` | `mud` |
| nugget, assay_office ×2, claims_registrar, thads_room | five more | scenery |

**Overlap is the design, and the engine says so in its own words.** `GameState.targets` is `[...room.exits, ...room.hotspots]`, and the comment above it reads *"scenery first made every exit in the room unclickable."* A door painted on the front of a building is **supposed** to sit inside `false_fronts`; the boardwalk and the mud run the full 1920 of Room 2 underneath everything. Ordering is how the room is composed, not an accident the check should police.

**A check that fails on the design teaches people to ignore it**, and an ignored check is worse than no check — it is a green square that means nothing. This one would have been switched off or `expected`-listed within a day, and the day after that it would have stopped catching the thing it was built for.

**What is actually wrong is one of two things, and neither of them is "overlap":**

1. **A target with no pixels left.** Measured by subtracting every simultaneously-live target that answers *before* it and asking whether anything remains — not by counting intersections. Half-covered is still clickable. Entirely covered is not in the room.
2. **Any overlap at all where the exit declares `travelWhenTold`.** That exit does not walk anywhere: it writes a flag and hands a beat its cue. A stray click on it does not open a wrong door, it **begins the game's closing shot**. It is the one target where "the other one is still mostly clickable" is not a defence.

Rewritten to those two, plus Q63's writer clause, it passes: **107 target presentations checked for total occlusion, 1 `travelWhenTold` exit for any overlap, 1 exit gate for a writer.**

**And it was made to fail on purpose before being believed** (R5e — a check must not share its subject's assumptions, and a check nobody has seen fail is a check nobody has tested). Putting `road_west` back over the lamp where the defect shipped produces all three of:

```
"lamp_gone" has no clickable pixels left. Every part of 610,586,60,73 is covered by
  targets that answer before it
exit "road_west" declares travelWhenTold and overlaps "lamp_gone" by 60x73px
exit "road_west" declares travelWhenTold and overlaps "mud" by 180x30px
```

**Per-state bounds are handled on both sides, and asymmetrically on purpose.** A target hit-tests as any rect it can present (`to_assay_office` is 120×168 shut and 120×192 open), so every presentation is checked as a subject. But a target *covers* only where it covers in **every** state — the intersection, not the union — because something that hides you in one state and not another has not made you unreachable, it has made you conditional, and conditional is what `when` is for.

**What it still does not check: whether a rect sits on the thing it names.** A hotspot 200px from its object passes every clause. That is a picture question and it belongs to a person looking at an overlay.

---

## Q67 · The gauntlet's click coordinates rot, and only a failing run says so

**Second time, same direction, one merge apart.**

Beat 9's input clicks the watchman's lamp, because clicking the lamp is how you speak to Hob (Q60: no mover can be clicked, so the lamp he carries is the only part of him a player can address). The click was `540,528` — dead centre of the lamp **when the lamp was x480–600 y444–612**.

Hob has moved twice since. He stands at `600,700` now, the flame was re-measured at that position, and the hotspot moved with him to **x610–670 y586–659**. The old coordinate landed on nothing, wrote no flag, and the beat that waits on that flag held to its deadline — a 180s timeout, exactly as designed. Corrected to `640,622`.

**The beat number survived the move. The rect did not.** Everything else in the script is named — actors by id, clips by name, beats by number — and names survive things moving. A coordinate is the one thing in the file that refers to the world by position, and it is therefore the one thing that goes silently wrong.

**Nothing static caught it, and the run catching it is honesty 3 working**: *a green gauntlet against a wrong script is worse than none*. The script was wrong and the gauntlet went red, which is the correct outcome and the second time this beat has produced it (the first was when beat 9 became a response and the script had no input at all).

**A check is possible and is not built.** It would need each `click` to declare which room it is in — the script does not carry that today, and the schema is the project owner's. Given a room, the check is one line: the point must fall inside some target that can be live. Independent of the run in the R5e sense, since it reads the room JSON and never starts a browser.

**Filed, not built.** Two rots is a pattern; three would be a reason.

---

## Q68 · The gauntlet's R5h comparison was a coin toss on beat 9, and it had already failed once

**Found by chasing a regression that did not exist, which is the only reason it was found at all.**

Beat 9 measured **42.73s**, then **32.66s** after a merge. That looked like a ten-second regression, and the merge was small enough to bisect by reading: only `content/actors/coach.json` had changed, and nothing in it plausibly touches a beat that plays after the coach has gone.

**So the tree that produced 42.73s was re-run, in a worktree, on the same machine.** It produced **32.83s armed and 37.02s bare — and failed**, on a 4.2s drift against 3s of slack. Same commit. Nothing about the game different.

| tree | armed | bare | verdict |
|---|---|---|---|
| `a7e3d7b` (first run) | 43.95s | 44.55s | pass |
| `a7e3d7b` + sign | 42.73s | 43.02s | pass |
| after main's merge | 32.66s | 33.32s | pass |
| after main's merge, again | 34.24s | 34.60s | pass |
| **`a7e3d7b` re-run** | **32.83s** | **37.02s** | **FAIL** |

**There was no regression. There is a measurement that does not measure the game.**

Beat 9 holds on `T_HOB_SPOKEN`, and nothing writes that flag until the harness clicks the lamp. Its duration is therefore **the harness's own latency in noticing the segment, plus the game's response to one click** — and the first term is scheduling, which is free to vary by ten seconds under a browser starting up, a dev server compiling, and a 50ms sample loop.

**This is R5h pointed at R5h.** The rule says an instrument can change the system and not merely report on it. Here the instrument does not perturb the number, it *is* the number. "A timing that only holds while it is being measured is not a timing" was the right rule and the wrong application: this timing is manufactured by the measurement, so comparing two samples of it compares two draws from the same noise.

**And a flaky red is Q66/R5j, at the worst possible site.** It fails on correct work, in the file whose entire purpose is to be believed, and what it teaches is *a red gauntlet can be re-run until it goes away*. That habit ends the gauntlet as anything but decoration — and it had **already produced one such failure tonight**, on a tree that had passed twice.

**Fixed by excluding driven beats from the drift comparison, and saying so out loud:**

```
R5h: beat(s) 9 not compared -- this harness ended them, so their duration is
     mostly its own latency, not the game's
R5h: 4 beat(s) timed with and without the instrument, all within slack
```

The duration is **still reported** — a beat that stops ending at all is worth seeing — and still held to a ceiling if the script states one. What is gone is the comparison that could not mean anything. Note the count changed from 5 to 4: the exclusion is visible in the pass line as well as in the reason.

**The honest limit.** R5h now covers four beats, not five, and beat 9's timing is unguarded. Guarding it properly would mean measuring from the flag write rather than from beat entry, which needs the probe to report flags. Not built.

**And the general form, which is the part worth keeping:** *a number the apparatus determines cannot be used to check the apparatus.* Every timing R5h compares must be one the game would have produced whether or not anybody was watching. Beat 9's was not, and it took a regression hunt to notice, because a wrong number that is usually within slack looks exactly like a right one.

---

## Q69 · Idle breaks: one mover could reach them, and for that one it was a latch, not a timer — **BUILT**

**Three faults, and the art was innocent of all of them.** Thad has 12-frame idle-breaks in four facings, Hob has one, the coach has one. Every record carries `idleBreakRate: 2`. Doc 40 specifies the behaviour exactly: *"12 frames, ~2/s, a glance left then right, played occasionally"*, and *"it plays on a timer while idle and returns to it."*

**1 — Only the protagonist could ever play one.** `hasIdleBreak` was a `MoverOptions` field, and `GameScene` set it in exactly one place: on `this.actor`, from `content.actor.clips`. Every other mover in the game arrives through `RoomActors.place()`, which passes no options at all. **Hob's declared idle-break and the coach's were unreachable by construction** — the records right, the art on disk, and no code path in existence that could ask for them. R5f: the decision now traces to a field on the thing it is deciding about, so `place()` cannot forget it.

**2 — For Thad it was a latch, not a timer.** `clip` returned `idle-break` once `clock - stillSince >= 7` and **never returned anything else again**. A character who stood still for seven seconds switched permanently into the glance and looped it until something moved him. Doc 40 calls it an occasional one-shot; nothing about that was occasional and nothing about it was a shot.

**3 — And it played at the wrong speed.** `frameAt` uses `idleRate` for every non-walking clip, so the glance ran at the breathing rate. `idleBreakRate` was written into every record by `build-actor-record.mjs`, declared in `types.ts`, and **read by no code at all** — the fourth unused-field position of the session, and the same lesson: *an unused field is not safe, it is untested.*

**Built as doc 40 specifies.** One shot, from its own start, holding its last frame, at its own rate: 12 frames ÷ 2/s = **6 seconds**. Then back to idle. The gap is randomised above a floor — `7 + u × 11`, so **7–18 seconds** — because a fixed interval is the other wrong answer and reads as a tic, which is worse than standing still.

**Deterministically randomised, from the mover's id.** `Math.random()` would make two play-throughs of one save differ and would make any clip a script asserts a coin toss — Q68's flaky red arriving by a different road. A plain LCG seeded by the id means two characters standing together never sync, and the same run always plays the same way.

**A fourth fault surfaced while tracing it, and it was mine.** Arming the schedule in the constructor sets an *absolute* time about twelve seconds after zero — so a mover created later is already overdue and glances **on its first drawn frame**. Hob is placed at beat 7, a minute in. Same family as R5g: a quantity meaning *twelve seconds from the start* used where the meaning needed was *twelve seconds from now*. Armed on first update instead; a late arrival now waits its full gap.

**Traced, not assumed** (`X` = breaking, one character per half-second, 60s standing still):

```
thad   .........................XXXXXXXXXXXX.........................XXXXXXXXXXXX....
hob    ......................XXXXXXXXXXXX...........................XXXXXXXXXXXX.....
coach  ..........................XXXXXXXXXXXXXXXX..................................XX
```

**TWO NUMBERS FOR AN EYE, NOT A CHECK.** Both are doc 40's own and neither was re-decided here:

1. **Six seconds is a long glance.** 12 frames at 2/s is what the table says, and at 233px it is a slow, deliberate movement — which may be exactly right for this character, or may read as sleepy. It is a taste call and it needs looking at.
2. **Thad's first three gaps come out at 12.1s, 12.2s and 11.5s** — genuine draws that happen to cluster for his seed. A minute of watching him would show three evenly spaced glances and read more regular than the mechanism is. Hob's do not cluster. Nothing is wrong; the spread may want widening if it reads as a rhythm.

---

## Q70 · `case_roof` was not unreachable. It was live, and wrong, over empty sky

**Reported as "unreachable — gated on `T_CASE_DOWN`, which nothing writes". Both halves are false, and the truth is worse.**

`tools/extract-content.mjs` puts `T_CASE_DOWN: true` on beat 6 and says why: *"THE CASE COMES DOWN AT BEAT 6, and the write is honest again."* And `case_roof`'s gate is `{ T_CASE_DOWN: true }`. So from beat 6 onward **the roof hotspot switches ON** — at x1078 y341, eight feet up, with the coach already departed — and answers:

> *"My case, still up on the roof, under the driver's hand."*

Two live hotspots named **HIS CASE** for the rest of the game, one of them describing a driver who has gone. Anyone examining the sky above where the coach used to be is told his case is still up there.

**The gate had been inverted** at some point, from *while the case is not down* to *while it is*. Inverting a gate does not remove a state; it moves it.

**Retired, not re-gated.** The design has two states and the extractor now builds one hotspot. Doc 17's state A prose is untouched and reports as an orphan, awaiting the revision that is the writer's.

### The shape the extractor accepts — the question as asked

**It already tolerates a state the room does not build.** That is how state C — *"the hotspot is gone"* — has always worked: its lines are reported by name on stderr and dropped, non-fatally.

`const STATES = { B: 'case_mud' }` **is the list of states that have a hotspot.** Doc 17 may describe as many as the writing needs.

| The doc has | The room has | What happens |
|---|---|---|
| a state in `STATES` | that hotspot | wired |
| a state in `STATES` | **no** such hotspot | **throws**, by name — a typo stays fatal |
| a state not in `STATES` | — | reported as an orphan, dropped |

**What a wired state must contain**, or the extractor throws and names the state:

1. a heading `**State X — <label>**`
2. a `**LOOK**` run and a `**LISTEN**` run, each with **exactly three** variants
3. every `> ` override in one of two forms — refusal `VERB — "line"`, or the one that takes it, `**VERB — takes it.** *"line"*`

**So: write the states the design has. Tell me which have hotspots.** Today that is one.

**And a bug the retirement exposed immediately.** The orphan message said *"state C"* for every orphan regardless of letter — correct exactly as long as there was one thing to label, and the moment state A joined it began reporting A's lines under C's name. It names the letter now. R5k in miniature, with prose instead of a coordinate.

---

## Q71 · Doc 45's OQ-01 and OQ-15 are not contradictions. Both are settled inside doc 17

**OQ-01 — doc 17 both restores a four-option driver tree and says "four beats, no tree".**

Not a live disagreement. **It is stranded v3 text, and v3.1 struck it in the document's own words:**

> *"v3 cut the tree to zero. That was an over-correction and it is reversed."*

The surviving sentence sits at the end of the section on **what the town says about Mott**, and its list — *"Course you have," the four dollars, the undertaker, the hotel's five* — is beats 3, 4, 5 and 6 of the beat sheet. It reads as though it were scoped to Mott, and the neighbouring ruling *"Mott stays out"* is the part of it that survived. But beats 5 and 6 **are** the tree under v3.1, so *"no tree"* cannot be read as Mott-only without also being wrong.

**Ruling: v3.1 governs. The sentence is v3 residue.** A version-stamped reversal beats an unstamped sentence in an earlier section. Nothing is built against it — the engine, the content and the gauntlet all run the four-option tree — so this costs one struck line in doc 17 and no code.

**OQ-15 — the beat table says Room 1 is not interactive before beat 8, and the case carries LOOK/LISTEN/PICK UP for beats 1–5.**

**A hotspot being live is not the same as a hotspot being reachable.** There is no verb panel and no control before beat 8, so nothing in the room can be addressed however many hotspots are gated on. `case_mud` is live from the first frame and simply cannot be clicked until control arrives — at which point it can, and its lines are reachable for as long as the case is on the ground.

**The doc's state labels are prose, not gates.** *"beats 1–5"* and *"from beat 6"* describe *where the case is*, and the actual gates are flags. Nothing reads the beat numbers.

**Which leaves exactly one real defect inside OQ-15, and it is state A.** Its window — beats 1 to 5 — lay **entirely inside the non-interactive stretch**, so its LOOK, LISTEN and PICK UP lines were unreachable by construction: three lines that could never be said by anyone. Q70 retires that state on other grounds, and retiring it is also the answer here.

**Ruling: OQ-15 is closed by Q70.** Once state A is gone, no case line is gated to a stretch of the game in which no line can be asked for.

---

## Q72 · Beat 2 no longer contains an arrival, and the eight seconds are the measurement of that

**Doc 17 beat 2: "The coach ARRIVES and halts with Thad visibly aboard."** Stated at ~8s. It holds **0.86s**.

**Every step in it is a placement.** Read out of `content/sequences/opening.json`:

| step | actor | from → to | seconds |
|---|---|---|---|
| `move` | hob | [600, 720] → [600, 720] | 0.1 |
| `move` | coach | [1390, 742] → [1390, 742] | 0.1 |
| `setState` | — | the door opens | — |
| `move` | thad | [1170, 794] → [1170, 794] | 0.1 |
| `face` | thad | right | — |
| `chore` | thad | `aboard-coach` | held |

**Three moves of zero distance.** `stagingTakesTime` returns false for a `move` whose `from` equals its `to` — correctly, that is a placement and not a journey — so the beat has nothing in it that takes time, and it ends as soon as the pose is struck. **The coach does not arrive. It is simply there.** The eight seconds were budgeted for something that no longer happens.

**Doc 43 asked this months of work ago and nobody answered it:** should the coach arrive on screen, or be halted when the beat opens? The player-audit fix — *"we never saw Thad arrive, so there was no reason to think the man he is talking to drove him"* — is the argument for arriving, and holding him in the doorway helps without settling it.

**What is new is that it is measurable rather than theoretical.** It is not an opinion that the beat is thin; it is 0.86 seconds against a written 8, and the harness prints both side by side on every run.

**Deliberately not a failure.** A floor on beat duration would go red here, and beat 2 is short for reasons everybody already knows — `straighten-coat` is unbuilt, the driver cannot climb aboard, and main has since moved Thad's walk into beat 3 on purpose. That is R5j: a red on incompleteness that is not news teaches people that reds are ignorable. The number is reported next to the claim and the judgement is a person's.

**This one is the project owner's**, and it is the only item tonight whose answer changes what the opening *is* rather than how it is checked.

### UPDATE — the number moved to 7.36s and the question did not

`327f615` removed the `aboard-coach` chore from beat 2. That leaves the beat with nothing in its staging that takes time — three zero-distance moves, a `setState` and a `face` — so `stagingTakesTime` returns false and `stepsFor` emits the beat's written `wait` instead. **Beat 2 now holds 7.36s against its stated 8**, up from 0.86s, and the harness's shortfall line no longer fires.

**Nothing arrived.** The beat holds its eight seconds because it *waits* for them, not because anything happens during them. It went from a beat that was too short for its content to a beat that is the right length and empty — which is a different state, arguably a worse one to look at, and **not** an answer to doc 43's question.

**The measurement that made this visible has therefore stopped making it visible**, which is worth knowing before the shortfall line is trusted as coverage: it catches a beat that ends early, and cannot catch a beat that fills its time with a pause. What would catch it is a mark asserting that something MOVES during beat 2, and there is nothing to assert yet.

---

## Q73 · The ping-pong walk is every walk clip in the game, not two

**Reported from watching Hob: frames 1≡7, 2≡6, 3≡5, byte-identical — the second half is the first played backwards, so the same leg leads every step.** One leg swings out and comes back; the other never passes it. Described as galloping, which is what it is.

**Measured across every walk clip on disk, by SHA-256 of the file bytes:**

| Clip | Frames | Identical pairs |
|---|---|---|
| `thad-walk-right` | 8 | 1=7, 2=6, 3=5 |
| `thad-walk-left` | 8 | 1=7, 2=6, 3=5 |
| `thad-walk-front` | 8 | 1=7, 2=6, 3=5 |
| `thad-walk-back` | 8 | 1=7, 2=6, 3=5 |
| `hob-walk-right` | 8 | 1=7, 2=6, 3=5 |

**Five clips, one signature.** It is not a fault in a generation, it is the shape of the generation step — so a fix to one facing fixes one facing, and the other four keep galloping until they are regenerated too. Worth knowing before the contralateral source lands: **the thing to check when it arrives is the count, not the clip.**

**It was recorded as a note and became a defect by being watched.** The stride measurement found the identical frames and filed them; nothing was wrong with that reading and nothing acted on it. What changed is that Hob now crosses the whole screen, so there is time to see the leg that never leads. **A static fact about eight files became a visible fault when the distance travelled grew** — and no check that reads the files could have told anybody that, because the files did not change.

**The consequence, predicted and deliberately not pre-compensated:** the cycle becomes two steps rather than one, so **the declared stride doubles**. `strideLength` is 102 for Thad and 105 for Hob today; both describe a cycle that contains one real step. Since doc 43's gait advances from distance travelled, doubling the stride halves the frame rate of the legs at the same walking speed — which is the correct outcome and will look like it. **`walkSpeed` should not move**: the stride changes, the speed does not, and the fallout is worth seeing rather than cancelling out in advance.

**A check is one line and belongs with the art, not before it.** A walk cycle must not be its own mirror: `frame[i] === frame[n - i]` for any `i`. It would fail on all five clips today, which is correct and also unmergeable — a red the whole team must work around while the fix is in flight is R5j regardless of being right. It lands the day the art does, and it will say immediately whether all five were replaced or one.

---

## Q74 · The mud problem: three questions answered, and the fix proposed would not have fixed it — **RULED: a verb clears on use**

**Reported: Thad examines mud everywhere instead of walking. Confirmed, and the cause is not where it looks.**

### 1 · What is `defaultVerb` for?

**It is the per-target fallback. It is not, and never was, the resting selection.** The two are separate mechanisms and only one of them is called `defaultVerb`.

```
verbFor(target) = selected ?? (target.defaultVerb ?? file.defaultVerb)
```

The resting selection is `null`, set in `VerbSystem`'s constructor, with errata 28b cited in the comment: *"nothing is selected until the player selects something. With a verb always pre-selected there is no 'no verb' state, and the ruling's third row could never happen."*

`verbs.json`'s top-level `defaultVerb: "LOOK_AT"` is the fallback's fallback — what an object that declares none answers with. Errata 28b in its own words: *"Perform the object's `defaultVerb` — **LOOK AT unless the object declares otherwise**."*

> **So changing it to `WALK_TO` would not fix the reported symptom.** The floor already walks when nothing is selected: the mud declares `WALK_TO`, `verbFor` returns it, and `GameScene` walks. The proposed change would only alter what objects that declare no default do — which is every object the `check-default-verbs` report is about, and none of them are the ground.

### 2 · Does the selection reset after an action?

**No — and errata 28b specifies that it must not.**

> *"A selected verb **persists** until another is chosen. **It is not cleared by use.**"*

`resetToDefault()` exists and has exactly one caller: `GameState.reset()`, a new game. **The code matches the ruling.** This is not drift.

**Which makes the proposed behaviour a change to errata 28b, not a bug fix** — and worth ruling as one, with its cost visible: a verb that clears on use costs a second click for every repeated action, and doc 22's own reading of the original manual says the sentence line and the persistent verb are one interface.

### 3 · Is `WALK_TO` deliberately absent from the panel?

**Yes, and coherently.** `verbs.json` carries it as `walkVerb`, deliberately outside the nine; the grid is 3×3 and Bible v2 Part Two specifies nine verbs. Errata 28b row 1 is what makes a tenth button unnecessary: *"Left click on walkable ground → walk there. **Always.** No verb required and no verb consumed."*

**Its absence is only coherent as long as row 1 holds. Row 1 does not hold.**

### THE ACTUAL DEFECT, and it is a contradiction inside errata 28b

The mud is a hotspot spanning `[0, 660, 1920, 204]` — **the entire walkable band**. So every click on walkable ground is also a click on an object, and 28b's first two rows give opposite answers:

| 28b row | Says | For a click on the mud |
|---|---|---|
| 1 | walkable ground walks **always**, no verb consumed | walk |
| 2 | object + selected verb → perform that verb | examine |

The code implements row 2, with one exception: it walks when the resolved verb *is* `WALK_TO`. So:

| Selection | Click on the mud | Correct per 28b? |
|---|---|---|
| nothing | walks (mud's own `WALK_TO`) | ✔ both rows agree |
| `LOOK_AT` | **examines the mud** | ✘ row 1 says walk, always |

**The ruling contradicts itself for any object that IS the ground, and the mud is the only such object in the game so far.** Room 2's `mud` and `boardwalk` run the full 1920 as well, so Main Street will have it twice over.

### AND THE PART THAT MAKES IT PERMANENT

**There is no way to deselect a verb.** `selectVerb` is the only path from the panel, `resetToDefault` is only called on a new game, and clicking the selected verb again re-selects it. So the no-verb state exists **only before the player's first verb click of the entire game**, and once left, it can never be returned to.

> **One third of errata 28b's table becomes permanently unreachable the first time a player touches the panel** — and with it, every object's `defaultVerb`, which the authoring rule calls *"the verb a player would try first"* and which `check-default-verbs` exists to enforce. Every one of those authoring decisions is live for exactly one click per playthrough.

That is the resting-state fault, stated exactly: **the game has a resting state that a player can leave and never return to.**

### What is NOT wrong

The mud's own `defaultVerb: WALK_TO` is right and already does its job. `GameScene`'s walk shortcut is right and already carries the comment explaining it. `check-default-verbs` is right. Nothing has drifted from a written rule — **the written rule disagrees with itself**, and the disagreement was invisible until one object grew to the size of the floor.

**Nothing changed. This is a report.** Three things need ruling and they are separable: whether row 1 beats row 2 for ground-sized objects; whether a verb clears on use (a change to 28b); and whether a deselect exists at all, which is the smallest of the three and the one that restores the table without touching the ruling.

---

## Q75 · The held pose is expressible today, and the cheap way to express it reproduces the door-open fault

**The fear is correct and the number is 0.143 seconds.**

`chore` is a one-shot whose length is `frames.length / reactRate`. `lookup` has **one** frame and Thad's `reactRate` is **7**, so `chore lookup` raises his head for **one seventh of a second** and drops it — before the driver has begun answering, and quite possibly inside a single sampled frame of a play-through.

### The vocabulary can already express it, and it is doing this exact job in this exact scene

**Fourth of the same shape, and the answer this time is that nothing is missing.** `state` on `ActorClip`, `setState` and `interact` were each a capability the engine had before the vocabulary named it. This one the vocabulary *does* name:

```
{ kind: 'setState', object: string, state?: string }
```

`state` is optional, and omitting it **clears**, which is how the coach's door shuts — back to the declared clip rather than to a state called "shut" that nothing declares.

**And the coach's door is a held pose across a conversation.** `content/sequences/opening.json`, beat 2:

```json
{ "do": "setState", "object": "coach", "state": "door-open" }
```

Set at beat 2, never cleared, held through beat 6 — the whole driver's tree. **The thing being asked for is already running, on the object standing next to him, in the same beats.**

### What it needs is a registration, not a mechanism

`thad.json` declares the frame as its own clip: `{ "id": "lookup", "facing": "left" }`. Nothing plays a clip called `lookup` except a chore, and a chore is a one-shot.

Held instead, it is a **state of a clip he is already playing**: `{ "id": "idle", "facing": "left", "state": "lookup" }`. The renderer asks `sprite.frameCount(clip, facing, surface, state)` with `state` from `moverState`, and `clipOf` is exact-match-then-fall-back — so the variant answers while the state is set, the plain clip answers when it is cleared, and every other clip he plays falls back untouched. `objectStates` is already saved and restored, so it survives a save for free.

### AND THE CHEAP VERSION REPRODUCES THE FAULT THAT WAS JUST FIXED

**A state variant replaces the whole animated clip, not one frame of it.** So `idle/lookup` with **one frame** means Thad **stops breathing for the entire conversation** — head up, perfectly still, for the longest-held pose in the scene.

That is the door-open fault exactly, one object over:

| | frames | on screen for |
|---|---|---|
| coach `idle/door-open` **before** | 1 | beats 2–6, the whole conversation |
| coach `idle/door-open` **now** | 24 | beats 2–6 |
| thad `idle/lookup` **if registered as one frame** | 1 | beats 3–6, looking up at the driver |

The door-open clip was found because *"none of the lamps are glowing brighter then dimmer"* — a still picture noticed by its stillness. A man holding his head up and not breathing, at 233px, in the foreground, is the same thing at closer range.

> **The lookup pose needs a breathing loop, not a frame** — the same six frames the idle has, generated at the raised head. Doing it with one frame will work, will pass every check, and will look like a photograph of him.

**Nothing invented and nothing changed.** The step exists, the store exists, the fall-back exists, and the coach proves the whole path in the same sequence. What is needed is a clip registration and, to avoid shipping the fault that was fixed this morning, six frames rather than one.

---

## Q76 · Holding the driver's `looking-down`: the state is already writable and nothing reads it — **RULED: no held state. Not built.**

**Same question as Q75 from the other side, and it does share an answer — but not the one that looks obvious.**

`overlayState()` has exactly one selector and one fallback:

```ts
if (speaker) { for (const [id, s] of states) if (s.whenSpeaker === speaker) return id; }
return overlay.default;
```

Speaker, or default. Nothing else. So `looking-down` shows on Thad's spoken lines — **two of seven across beats 3–6** — and `neutral` for everything between, which is the whole time the player is reading four options.

### The three things already held, and none of them has the right extent

| Candidate | What it would hold for | Against the conversation, beats 3–6 |
|---|---|---|
| set `default` to `looking-down` | forever | he looks down at an empty road for the rest of the game |
| the coach's `door-open` state | beat 2 → off frame | too wide at both ends |
| the driver's dialogue tree running | beats 4–6 | misses beat 3, which is automatic and has no tree |

**The coach's state is the tempting one and it is wrong by more than it looks.** `door-open` is set at beat 2 and **never cleared** — the opening contains exactly one `setState` — so the coach departs with the door open, and a head tied to it would look down while Thad climbs out, and go on looking down while the coach drives away east.

It is also the wrong *fact*. The door being open is not the driver looking at somebody; the two coincide in this scene and nothing makes them coincide in the next.

### What the engine nearly does — the fourth of this shape, and the fifth time it has been true

`setState` does not check that its object is a mover:

```
SequenceWorld.setState → RoomActors.setMoverState → GameState.setMoverState
  → objectStates.set(`${scope}/${id}`, state)
```

**The id is an arbitrary string.** So this, written today, in a beat, with no engine change at all:

```json
{ "do": "setState", "object": "driver", "state": "looking-down" }
```

…already **writes** a state under `stage_road/driver`. It saves. It restores. Omitting `state` clears it, exactly as it does for the coach's door.

**Nothing reads it.** `overlayState()` never consults `objectStates`. The whole of the gap is one lookup by `overlay.id`, and then the extent is authored rather than inherited: set at the start of beat 3, cleared at the end of beat 6 — **exactly the conversation, because a beat says so, rather than approximately the conversation because a door happens to be open.**

> The recurring sentence, a fifth time: **the engine is usually further along than the vocabulary that addresses it.** Here it is further along than the *reader* — the write path is complete, tested by the coach, and saved for free; only the consult is missing.

### The decision that is not implementation

**Precedence.** Doc 43 line 97 gives the driver `speaking` on his own lines. A held `looking-down` must not take those, so `whenSpeaker` has to win over a held state — which means the held state is a *replacement for the default*, not an override of the speaker rule. That is a design choice and it belongs in the ruling, not in the code.

**And the taste question underneath it is Tyler's, unchanged:** a man who glances down when addressed and back out over his horses otherwise may well be more alive than one staring fixedly. What has changed is only that Thad now holds a look upward beside him, so the mismatch is visible where it was not before. **Both readings are buildable and neither needs a new mechanism.**

**Nothing invented and nothing changed.**

### RULED — the driver glances on Thad's lines only. No held state.

`overlayState()` stays exactly as it is: speaker match or default, two lines out of seven. **A man who looks down when addressed and back out over his horses otherwise is more like a person and less like a diagram.**

**The `setState`-on-a-non-mover route is AVAILABLE, not pending.** It has been shown to work — the write path is complete, saved and restored — and nothing needs it. It is recorded here so that the next person who wants a held overlay state does not rediscover it, and it is not on anybody's list.

**The consequence, accepted, and written down so it is not rediscovered as a bug:** Thad holds a look upward through the whole conversation while the driver only glances. **That asymmetry is deliberate.** If it reads wrong when watched, the fix is to give *Thad* the glancing rather than the driver the holding — his lookup becomes occasional and his ordinary stand the default.

---

## Q77 · `character.py` cannot rig a standing pose, and four more are coming — **BUILT**

**Not a defect until this week, and now it is a bottleneck.**

The hem detector requires *"two legs of roughly equal width, sustained"* and refuses outright when it does not find them. **A standing pose has the legs together, which is the whole point of a standing pose** — so the rig declines exactly the class of art it is about to be asked for four times.

The breath on `thad-lookup-left` was applied by hand as a result: a transform rather than a generation, above 30% of figure height held still so the head and collar never move, the coat rising and settling to the hem at y357, the legs planted. Six frames, no new art.

**The four standing poses from the casting sheet will each need that.** Doing it by hand four more times is four opportunities for the numbers to differ between facings, in a way nothing checks — the hem row, the still fraction, and the settle are per-pose constants that would exist only in whoever applied them.

**This is a decision about the pipeline and the pipeline is not mine** — `tools/rig/` is out of bounds by standing instruction, and this is recorded rather than acted on. What is worth having in the ruling: **the refusal is correct behaviour for a walking-pose detector and wrong behaviour for a rig that must now handle both.** Teaching it a standing pose means giving it a second hem strategy and a way to choose, not relaxing the first one — a detector that accepts legs together *and* legs apart under one rule would accept anything.

**Related, and the reason it surfaced now:** every one of Thad's `stand` clips is derived from a walking source, so the frozen stride and Q73's ping-pong are one fault with two symptoms. Nine generations replace both at once. The mirror check lands with them.

### BUILT — `--pose standing`, declared, plus the amplitude floor

**Three barriers, all of them rules written for a striding pose.**

**1 — the hem.** `find_hem` gained a second predicate and `--pose {striding,standing}` to choose it. **The threshold is not invented: doc 38's own docstring already measured it.** The width-drop rule was abandoned because *"in the mid-stride pose this pipeline requires, the leg span equals the coat"* — and recorded the numbers, **1.54 standing, 1.09 striding**. The drop is real for a standing figure and absent for a striding one, which is exactly why one rule cannot serve both. The cut sits between the two measured ratios, nearer the striding one so a mid-stride source is refused rather than mis-hemmed: **1.3**.

Absolute narrowness cannot do this job, which was the first thing tried. A profile standing figure is **one run from hat to shoe** — measured on the lookup pose: 99px widest, 95 through the coat, 64 through the legs — so the legs are 0.65 of the widest row and every absolute cut admitting them admits the coat too.

**The two predicates are complementary, proven both ways:**

| source | `--pose striding` | `--pose standing` |
|---|---|---|
| `thad-lookup-left` (legs together) | refused | **hem at row 354, 67%** |
| `thad-idle-right` (from a walking source) | hem at row 343, 65% | refused |

**And the rig lands 3px from the hand.** The breath was applied by hand at **y357**; taught the standing strategy, the detector finds **354** on its own, from the pixels, with no knowledge of that number.

**2 — `split_legs`.** Refuses when fewer than twelve rows have the legs apart, which for legs together is every row. **A standing pose has nothing to split and needs no split**: the only clip such a source can produce is a held pose that breathes, and the breath plants the legs, so they take no offset and are one static layer. Guarded on `--pose`.

**3 — the empty far-leg centroid.** `float(np.nonzero(far_lm.any(0))[0].mean())` on an empty mask is **NaN, silently**, and NaN compares false against everything downstream. Answered with the near leg's centroid — which is the truthful answer for legs that are together, and not R5f, because it is the same entity.

### And the amplitude floor, with an assertion behind it

`amp = 0.005 * fig_h` gives 2.6 against a step of 2 at `fig_h` 526, so three points of the curve round to the same offset. **Floored at `3 × step`.** Measured before and after:

| clip | before | after |
|---|---|---|
| Hob idle (striding, step 6) | 2 distinct | **4 distinct** |
| Thad lookup (standing, step 7) | — | **4 distinct**, offsets 0 −7 −14 −21 |

**And the rig now refuses to emit a two-picture breath**, by name, at the moment it would. The floor should make it unreachable; it is asserted anyway, because the collapse was silent for the whole life of the tool and what found it was somebody hashing the output files months later. **A generator that can emit a two-picture animation should say so rather than leave it to be discovered downstream.**

**What was not exercised:** the rig writes at source resolution — 869×1720 for this source against the shipped 279×610 — so the downscale stage was not run. Regenerating the sixteen existing clips remains a separate decision and Tyler's.

---

## Q78 · Nothing compared two clips to each other. It does now, and it found three things on its first run

**`tools/check-clip-agreement.mjs`.** Built as asked. **Not registered in `run-all.mjs`** — it fails on five pairs that need an art decision, and no fix is in flight for them, so registering it would put a standing red in front of everybody. Same disposition as Q73's mirror check and for the same reason (R5j). It registers the day those five are resolved.

### The rule, narrower than "the clips should look alike"

A pixel that **moves** inside a clip is that clip animating, which is the point of it. A pixel that is **still in both** clips is the character's fixed appearance, and the two must agree about it. So each clip is reduced to its **static image** — the pixels identical across all of its own frames — and the comparison happens only where both are static.

That is what keeps it quiet on correct work: walk and idle animate entirely different regions and pass, because their disagreement is confined to pixels one of them is deliberately moving.

**99 pairs compared, across 14 groups of matching actor, facing and canvas size.** Seven clips have no same-size sibling and are named in the report rather than silently skipped — the door-open coach among them, because it is 1129px wide against the plain idle's 1128.

### Finding 1 — Thad's hand is in a different place in three clips, statically

| pair | pixels | box |
|---|---|---|
| `thad-idle-right` / `thad-idlebreak-right` | 496 | 128,267,113,40 |
| `thad-idlebreak-right` / `thad-stand-right` | 554 | 128,267,113,41 |
| `thad-idle-left` / `thad-idlebreak-left` | 688 | 158,262,98,78 |
| `thad-idlebreak-left` / `thad-stand-left` | 797 | 158,262,98,78 |
| `thad-idlebreak-left` / `thad-recoil-left` | 150 | 158,270,98,70 |

`renders/thad-idlebreak-static-disagreement@3x.png` is the crop, at 3×, idle | idle-break | stand. The hand is at a different x in each.

### CORRECTION — the measurement was right and the reading was wrong

**It is not that the clips disagree about what Thad looks like.** Doc 40: *"idle-break is view-dependent. Head-on it is a glance aside; in profile it is a **shoulder shrug**."* A shrug moves the shoulder, which moves the arm, which moves the hand. **A moving arm in profile is the animation, not a defect** — and the tell was in the failure list all along: only `left` and `right` failed. `front` and `back`, which are glances, agree about the hand exactly.

**What is actually wrong is that the profile breaks never pass through the unshrugged pose.** Measured against each idle's settled frame:

| break | frame 0 vs idle | frame 11 vs idle |
|---|---|---|
| `back` | **0 px** — byte-identical | 0 px |
| `front` | 35 px | 35 px |
| `right` | **850 px** | 850 px |
| `left` | **1437 px** | 1437 px |

Head-on, the break begins and ends *on* the idle, which is correct. **In profile it begins already shrugged and ends still shrugged** — so the arm teleports on the way in and teleports back on the way out, twice per break, every time one fires. Doc 40 says the break *"plays on a timer while idle and **returns to it**"*, and returning to a pose means ending on it.

**Which makes it clause two of the check rather than clause one**, and clause two states it without interpretation: a clip that must return has to end on the thing it returns to.

**The idle break was unreachable for every mover but one until this session**, which is why nobody has seen it: the fault has been in the art the whole time and there was no code path that could play it.

**Four recoils end far from the idle too** — 35,000 to 40,500 pixels — and that is **reported, not asserted**. Doc 22's *"every chore must settle cleanly into a directional idle"* is a statement about the engine handing the body back; whether a recoil's last frame must also *be* the idle is a reading of it rather than a quotation, and a lean-back that holds and releases may be exactly what was wanted. It is recorded with its number for somebody watching it.

### Finding 2 — sixteen clips are two-picture animations padded to five, six or twelve frames

Measured by SHA-256 over the frame files:

| clip | frames | distinct pictures |
|---|---|---|
| `thad-idle-*` (all four) | 6 | **2** |
| `thad-idlebreak-left` / `-right` | 12 | **2** |
| `thad-idlebreak-front` / `-back` | 12 | **3** |
| `hob-idlebreak-right` | 12 | **2** |
| every Thad chore (`aboard-coach`, `alight-coach`, `carry`, `give-offer`, `pickup-low`, `shrug`, `use-near`) | 5–6 | **2** |
| `coach-idlebreak-right` | 16 | **8** |
| `thad-recoil-*`, `thad-talk-*`, `coach-idle-door-open-right` | 4 / 2–3 / 24 | **all distinct** |

**The breath does not rise and settle. It pops.** `thad-idle-right` is `A B B B B A` — one picture for a frame, a second for four, back for one. At 2.4/s that is a step every 1.7 seconds, not a breath. Doc 40 says *"6 frames"* and the table's rate column assumes six pictures.

**The clips that were generated as art are fully distinct; the clips the breath transform was applied to are two.** That is the tell, and it says the finding is about the transform rather than about any one pose.

**Not asserted, and no check added for it.** Whether a two-position breath reads as breathing at 233px is a watching question, and sixteen clips is a regeneration decision. It is recorded because it is measurable and nobody had measured it.

### Finding 3 — and it changes the answer to Q75's open question

**Asked: does `aboard-coach` need the same treatment as `lookup` before it can be a held state? Yes, and more of it.**

`thad-aboard-coach-right` is 5 frames and **2 distinct pictures**, in the order `A B B B A` — and **`A` is byte-identical to `thad-idle-right`'s first frame.** So the clip is *the ordinary standing pose*, then the aboard pose held for three frames, then *back to standing*. It is a there-and-back gesture, which is right for a one-shot chore and wrong for a held pose: set as a state variant it would loop, and he would flicker in and out of the doorway forever.

`thad-lookup-left` is also 2 distinct pictures, but **both of them are the raised-head pose** — its own base and its own breath. That is a coherent held pose; `aboard-coach` is not.

> **What `aboard` needs is a clip that is the aboard pose in every frame, with the breath applied to that pose** — exactly what was done for `lookup`, and it cannot be got by re-registering the existing five frames.

**One correction to the proposed staging, so it is not typed twice.** The step's field is `object`, not `actor`:

```json
{ "do": "setState", "object": "thad", "state": "lookup" }
```

`SequenceStep` is `{ kind: 'setState'; object: string; state?: string }`, and the extractor lowers `do`/`object` straight onto it. Omitting `state` clears, which is how both of these end.

---

## Q79 · The downscale stage was not in this repository — **BUILT: `tools/rig/downscale.py`**

**Asked: "assert the frame count survives the downscale before regenerating sixteen of anything."** It cannot be asked that way from here.

`tools/rig/character.py` writes at **source resolution** — 869×1720 for the lookup source. The shipped frames are **279×610**. **Nothing in `tools/` resizes actor art.** The step between them exists only in somebody's hands, which makes it the one part of the pipeline no check can reach and no reader can find. Same family as R5l, one level up: not a field nobody reads, a *stage* nobody can see.

**So clause three asserts on the output instead, which is stronger.** Whatever the downscale is and wherever it lives, the property that matters is a fact about the shipped bytes: **a six-frame clip must contain six frames' worth of pictures.** Measured there, it holds however the art was made and cannot be satisfied by a stage agreeing with itself.

**Three is the threshold** — the fewest that can rise and settle, and the number `character.py`'s amplitude floor now guarantees. Clause three is the downstream half of that refusal: the generator declines to emit two pictures, and the check declines to ship them.

**Fifteen clips fail it today**, which is the same list as the padding scan minus `thad-idlebreak-front` and `-back`, which have three and pass. `thad-lookup-left` is among the fifteen at 2 distinct — the rebuild at amp 6 is not on `main` yet, and clause three will pass it when it lands.

**Still not registered in `run-all.mjs`**: 24 failures across three clauses, no fix in flight for most. Registers when the art agrees.

### BUILT — the stage now leaves an artefact

`tools/rig/downscale.py`. Takes a rigged clip and a figure height, writes the frames the game loads, and refuses when the result collapses.

**Premultiply, resample, unpremultiply.** Resampling RGBA directly averages the colour of *transparent* pixels into their opaque neighbours, and at a 3× reduction every output pixel draws on nine inputs. Premultiplying makes the weight correct; skipping it is what puts a halo on every edge, and it is the class of thing that was being re-derived from memory each time.

**One scale factor for the whole clip, from the tallest frame.** A breath raises the chest, so the figure is a few rows taller mid-cycle — scaling each frame to its own height would make him grow and shrink instead of breathe.

**AND THE REFUSAL MEASURES THE SHAPE, NOT THE BYTES — which is the opposite of clause three, for a reason.** Byte-equality is the honest measure *upstream*, where frames are composites of the same layers at whole-pixel offsets. **After a resample it is the wrong measure**: LANCZOS turns a sub-pixel offset into slightly different values everywhere, so every frame stays byte-distinct however little the figure moved. Tested — a 4-picture clip reduced to a 62px figure, where the breath is a fifth of a pixel, still reported four. **A refusal that cannot fire is not a refusal.** The thresholded alpha mask asks the question the eye asks: did the shape move.

**Watched failing, per R5e.** Reducing the lookup clip to successively smaller figures: 4 distinct at 526, 4 at 200, 3 at 60, 3 at 30, and at 16 it refuses — *"6 frames reduce to 1 distinct picture. Nothing written."* The frames on disk were still 869×1720 afterwards, so the refusal happens before the write and not after it.

**Two guards on one failure, from different directions.** `character.py` floors the amplitude so the clip does not collapse at source resolution; `downscale.py` refuses if it collapses at the shipped one; `check-clip-agreement` clause three refuses to ship it if it somehow arrives anyway. The middle one is the stage where the arithmetic actually decides, and it did not exist.

---

## Q80 · RULED — regenerate the idles and idle-breaks, not the walks

**The project owner's call, recorded with its reasoning so it is not relitigated:**

| | | why |
|---|---|---|
| idles, idle-breaks | **regenerate** | the amplitude floor fixes them and nothing else about them changes |
| walks | **do not** | they need contralateral sources — one in flight for Hob, four unwritten for Thad. Regenerating now means doing it twice, and the mirror check lands with that art anyway |

**A man who steps between two postures every 1.7 seconds rather than breathing is visible**, so leaving sixteen clips wrong to avoid churn is the wrong trade — but the two groups have different blockers and only one of them is unblocked.

**And the two profile idle-breaks that never unshrug are NOT covered by this.** An amplitude fix touches intermediates; clause two's fault is endpoints, and a clip can have four real offsets and still teleport if none of them is zero. Whether those two are regenerated or re-authored is an art decision to be made watching one, since a shrug that holds may be what was wanted.

---

## Q81 · The lantern glow must anchor per clip, not per character — a constraint on unbuilt work

**Recorded before the work starts rather than found afterwards.**

Hob's standing pose holds the lantern **at his side**; his walk holds it **forward**, because a man carrying a lamp holds it out ahead to see by rather than swinging it. So the lamp changes position when he starts or stops walking — **which is real behaviour, not a fault.**

**The consequence for `art/effects/lantern-glow.json`, which is fully specified and referenced by nothing:** the glow anchors to the flame, so the light pool moves with the lamp. **The anchor must be read per clip.** A single anchor per character would pin the pool to one of the two positions and let the lamp walk out of its own light.

This is a constraint on unbuilt work, not a defect in it. It is written here because the alternative is discovering it after the glow is built against a per-character anchor — which is the cheaper thing to get right first and the expensive thing to find later.

---

## Q82 · R5h's slack is absolute and beat 3 has doubled, so its comparison is now flaky

**One run failed and the next passed, on identical trees.**

| run | armed | bare | drift |
|---|---|---|---|
| a | 14.85s | 11.53s | **3.32s** — fails, slack is 3s |
| b | 11.61s | 11.71s | 0.10s — passes |

**Not caused by the two new marks**, which fired correctly in both runs. It is the R5h comparison itself.

**Two things have changed under a constant.** `defaults.slack` is **3 seconds, absolute**, and it was chosen when beat 3 held 6.5s. Beat 3 now holds about 12: it gained 1.4s before Thad's line and 1.2s after, and a walk to the driver's box. **Three seconds was 46% of the old beat and is 25% of the new one** — the tolerance did not move when the beat did.

**And beat 3 now contains distance-driven motion, which is the one thing the instrument genuinely stretches.** Doc 43's gait advances from distance travelled, so a walk's WALL-CLOCK length is distance ÷ (speed × frame rate). Slow the frames — which arming the watch and polling the probe twenty times a second does — and the same walk takes longer in real time by construction. That is not the instrument perturbing a measurement; **it is the instrument changing the thing measured**, which is R5h's own subject arriving inside R5h.

**Nothing changed, deliberately.** Loosening a tolerance to make a red go away is the move this whole file argues against, and one failure in two runs is not enough to say whether 3.32s was that mechanism or ordinary variance. **What is certain is that an absolute slack cannot serve beats of 2s and 12s equally**, and that beat 9 is already excluded from this comparison for a related reason (Q68).

**The shape of the answer, when somebody rules on it:** slack proportional to the measured duration, with an absolute floor for short beats — or excluding beats containing a walk, the way driven beats are already excluded. The first is better because it keeps the comparison; the second is what Q68 did and is easier to defend.

**Q68's warning applies to this one too:** a red that passes on re-run teaches that reds are re-runnable. This is the second beat in that condition, and it is the reason to fix it rather than re-run it.

### RULED AND BUILT — `max(1.5s, 25% of the bare measurement)`

**Against the BARE measurement, not the armed one**, and the distinction is not cosmetic: taking the fraction of the armed number would grow the tolerance in proportion to the error it is measuring — a window that widens to admit whatever it finds. The bare run is the duration with no instrument in it, which is the thing the armed run is supposed to reproduce.

**Stricter where it matters.** At 25% this is *tighter* than 3s absolute on every beat under six seconds — beat 2 at 1.5s gets 1.5s rather than 3 — and relaxes only on beats long enough for 3s to have been meaningless.

**AND IT DOES NOT PASS BOTH SAMPLES, WHICH THE RULING EXPECTED IT TO.** Measured:

| | drift | tolerance | 3s absolute |
|---|---|---|---|
| run a | 3.32s | 2.88s → **fails** | fails |
| run b | 0.10s | 2.93s → passes | passes |
| beat 2 | 0.46s | **1.50s** → passes | passes |
| beat 7 | 0.15s | 1.77s → passes | passes |

25% of run a's bare 11.53s is 2.88s, and its drift was 3.32s. It would have passed against 25% of the *armed* 14.85s — 3.71s — which is the formulation rejected above.

**Left as ruled rather than adjusted to fit the sample.** Run a may be the real perturbation: beat 3 contains a distance-driven walk, and a 3.3s stretch on a 11.5s beat is 29%, which is a large thing for an instrument to do and arguably worth failing on. **Tuning the constant until the one observation that failed stops failing is how a tolerance stops meaning anything** — and the sample is one run. If it recurs, the number to move is the fraction, with the recurrence as the evidence rather than the inconvenience.

---

## Q83 · Thad floats into the town at full size — **FIXED** — and Hob's stride is shipped WRONG, not pending

### Beat 11: the clamp was gone and nothing reached it

`heightIn` was fixed to extrapolate above the band, with its own comment describing this exact picture: *"a man walking away up the road would not shrink at all: he would slide into the distance at the size of a man standing at the back of the band, forever."* **That fix was correct and unreachable.**

`Actor.sampleDepth` chose between two callers by `routed`:

```
routed  -> actorHeightAt   -- asks boxAt, which answers only INSIDE the band
staged  -> stagedHeightAt  -- falls back to the NEAREST box, which is what lets
                              heightIn extrapolate
```

**Thad is routed.** So the moment beat 11's `move` carries him above the band, `boxAt` finds no box, `actorHeightAt` returns null, and his height simply stops changing at 222.

**Choosing by `routed` was right for every case that existed when it was written** — the player walks, everything else is staged — and wrong the moment errata 38's `move` translated the *player* outside the boxes. It is now chosen by whether the mover is **gliding**, which is staged by definition whoever is doing it.

**The shape is worth the entry on its own: a fix one layer down, correct, with nothing routing to it.** Neither half looked wrong. `heightIn` extrapolates and says why; `sampleDepth` picks a caller and says why. The fault is only visible with both open at once, which is the clip-agreement family in code rather than in art.

### And Hob's legs are running at double rate on main RIGHT NOW

**Flagged as wrong, not filed as pending, because "pending" reads as *not yet right* and this is *currently wrong*.**

`frameAt` advances one frame per `stride / count` pixels. `strideLength` is **105**, measured on a cycle that contained **one** step. The cycle now contains two. So the legs cycle once every 105px where they should cycle once every ~210 — **double rate, at the same walking speed.**

It is the galloping Tyler reported, arriving from the other side: the ping-pong made one leg lead every step, and the fix for that made the remaining number describe half a cycle.

**Do not double it by assumption.** It wants measuring off the frames the way 102 and 105 were — foot travel past the standing silhouette — and it should wait for the arm correction, since replacing the four frames invalidates the measurement. **But it is shipped wrong in the meantime and should be read that way.**

---

## Q84 · Q60 diagnosed: three faults, and the one blocking Main Street is not the one Q60 describes

**Q60 says no character can be clicked and treats it as one problem needing a new mechanism. It is three, they are independent, and the mechanism already exists for the case that matters.**

### 1 · The ambient click path is COMPLETE, end to end

`AmbientLayer.npcAt(x, y)` → `GameScene.onPointerMove` names them on the sentence line → `onPointerDown` calls `dialogue.start(npc.tree)`. Hover, name, click, tree. **Nothing needs building.** Q60's "a mover has no clickable extent at all" is true of movers and was never true of ambient characters, and the three people standing in Main Street are ambient.

### 2 · THE AMBIENT LAYER WAS NEVER MIGRATED TO ERRATA 54

`content/ambient/*.json` carries **320×200-era coordinates**:

| | x | y |
|---|---|---|
| `letter_writer` | 30 | 112 |
| `pie_woman` | 150 | 126 |
| `map_seller` | 250 | 116 |

The play area is **1920×864**. So the furthest-right character stands **13% across** the screen and all three float at **13–15% down** — in the sky, above the horizon, nowhere near the walkable band. ×6 gives 180/900/1500 and 672/756/696, which are on the ground and spread across the street.

**And the hit box is 320-era too.** `npcAt` tests `x ± 8`. A character drawn at zone height **240** gets a **16-pixel-wide** hit box — 7% of a man's width. At 320, where a figure was ~40px tall and ~18 wide, ±8 was right.

**WHY IT WAS MISSED, and it is the migration's own stated virtue.** `tools/migrate-play-area-x6.mjs`: *"ALLOWLIST, NOT HEURISTIC. Every field scaled is named below… Anything not on the list is left exactly as it was."* It measured **"17 rooms, 140 rects"** — and ambient characters are not rooms, so nothing named them and nothing touched them.

> **An allowlist is safe against over-scaling and silent about under-scaling.** It reports what it changed; it cannot report what it never considered. The one-shot's caution is exactly the mechanism by which a whole content directory stayed at 320 — and unlike a wrong value, an unmigrated one produces a game that loads, validates and draws.

**This is what blocks Main Street**, and it is a data migration rather than a mechanism.

### 3 · Movers genuinely have no hit path, and the record cannot supply one

For Hob, the driver and the coach, Q60's diagnosis stands. And its first open question has a measurable answer:

`ActorSprite.drawnHalfWidth` exists but is **the padded canvas**, and its own comment says over-reporting is correct for the depth-tie check it was written for. Measured on Hob: canvas **1152** columns, figure **632** — **the canvas is 1.82× the man.** A hit box from it catches clicks half a body away.

**The figure width is not on the clip record and is not derivable from it.** The record carries `figureHeight` and `anchor`; `rig.json` carries `figure: [632, 1365]` and `padding: 260`. `anchor[0]` is 576, which is exactly half of 1152 — the canvas centre — so it carries no independent information about how wide the man is. **`build-actor-record.mjs` would need to write `figureWidth`** (or `padding`) through from the rig, the same way `figureHeight` and `state` already are.

Q60's other two questions are untouched: which verb a mover answers, and where its response lives.

### What this changes about the order

**Fixing the mover hit path does not unblock Main Street.** Migrating the ambient layer does. They were filed as one item and only one of them is on the critical path — and it is the one that needs no new mechanism, no ruling, and no art.

**Nothing changed.** The ±8 is a judgement — the migration precedent says *multiplied, not re-chosen*, which gives ±48, while a half-width proportional to drawn height would survive the next zone change. That wants a ruling rather than my preference.

---

## Q85 · The ambient layer migrated, and the map seller lands in a hole

**Ruled: mechanical ×6, verified per character rather than assumed.**

| | was | now | lands in |
|---|---|---|---|
| `letter_writer` | 30, 112 | **180, 672** | `mud_mid_west` ✔ |
| `pie_woman` | 150, 126 | **900, 756** | `mud_near` ✔ |
| `map_seller` | 250, 116 | **1500, 696** | **outside every walk box** |

**The map seller falls in the gap between `mud_mid_west` and `mud_mid_east`** — at y696 those boxes end at x≈1266 and begin at x≈1620, and he lands at 1500. That gap is the mouth of the claims road.

**Not moved.** The ×6 is arithmetically exactly right and the ruling was mechanical; *where a character stands* is authored content, and picking a new spot for him would be inventing placement under cover of a migration. He draws and clicks correctly either way — `heightForZone` reads his `zone`, not the boxes — so this is a composition question, not a fault. **A map seller standing at the mouth of the road to the claims may well be where he belongs.** Tyler's call.

### The half-width is proportional, and the two answers agreed today

`NPC_HALF_WIDTH = 0.2` of drawn height. At 240 that is 48, which is exactly ×6 of the old flat 8 — so **the mechanical answer and the proportional answer are the same number today**, and storing the ratio records where the number came from rather than re-choosing it.

**The reason to store it is depth, not the next zone change.** Drawn height already varies inside one room: 222 at the back of Room 1's band against 98 up the road. A fixed 48 would be a 96px box on a man drawn 98 tall — **wider than he is tall** — swallowing whatever stood beside him. The ambient three sit at fixed positions so it would not bite today; the mover hit path crosses depth by definition and is built on top of this.

---

## Q86 · The legibility ladder: the gait dies before the silhouette does

`renders/thad-back-walk-legibility-ladder.png` at 1:1 and `…@3x-small-end.png` magnified. Room 1's night ground (#353539), common ground line, `thad-walk-back` through `downscale.py` at one scale factor per clip.

**AN OBJECTIVE NUMBER, WHICH IS BETTER THAN MY EYE.** `downscale.py` reports distinct pictures at every rung, and the clip holds **5 of 8** all the way down to 22 — then drops to **4 at 16 and 12**.

| height | 120 | 90 | 70 | 55 | 45 | 35 | 28 | 22 | 16 | 12 |
|---|---|---|---|---|---|---|---|---|---|---|
| distinct | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 5 | **4** | **4** |

**So the WALK stops being a walk between 22 and 16** — two of its eight frames become the same picture, which is a gait losing a position, and that happens before anybody has to judge a silhouette.

**What I see, offered as observation and not as the ruling:** at 45 and 35 he is plainly a man in a coat and hat; at 28 the coat and hat still read and the legs are merging; at 22 the hat is a bump and the legs a stub; at 16 he is a dark blob; at 12 a smudge.

**And R5b2 applies to my own sheet.** The 3× magnification is not how this will be seen — it is there to make the small end examinable at all. **The 1:1 sheet is the honest one** and it is the one to rule from.

**The number to carry forward: 22.** Below it the animation loses a picture, which is measurable, rather than a silhouette losing legibility, which is taste. If Tyler wants him smaller than that, the answer is purpose-drawn far-distance art with a handoff — which is what Monkey Island's dot was, different art rather than Guybrush scaled down.

---

## Q87 · The phantom arm is not `character.py`'s, and the one that is has never fired

**Reproduced first, as instructed, and the reproduction disagrees with the attribution.**

`python3 tools/rig/character.py reference/casting/hob-walk-right.png --key magenta --pad 90 --arm-swing 0.55` returns, today, the same numbers `8a81342`'s `rig.json` recorded: `near 26895px, far 25849px`, `pivot 873`, `hem 1086 (71.6%)`. Same tool, same source, same output — so whatever the rigged frames contained is reproducible on demand.

**They contain two hands.** Counting skin-toned connected components over each frame:

| set | commit | third hand |
|---|---|---|
| the 8 **rigged** frames | `8a81342` | **no** — largest skin blobs at 40%, 49% and 58% of figure height, and nothing on the far side above 30% but the face |
| the 4 frames that replaced them | `9ed3106` | **yes, in walk-02 and walk-03 only** — a 465px and a 461px skin blob at 23% and 19% of figure height on the far side, which is a raised fist at chest height |
| the 4 frames on `main` | `19f934b` | no |

**So the raised fist entered with `9ed3106`, which is authored from a casting sheet, and left with `19f934b`, which is authored from a different one.** `19f934b`'s own title says so — *"loses its third hand"*. The rig never drew it. `9ed3106` added no `reference/` file, so the sheet that carried the fist is not in the repository and cannot be re-examined; the frames are the only surviving evidence and they are conclusive.

**This is R5p on the day it was written.** The attribution was inherited rather than re-derived, and one `git show` of the frames settles it.

**THE MECHANISM IS REAL, THOUGH, AND IT IS ONE LINE FROM FIRING.** The reason the rig does not draw a limb twice is `coat_m &= ~arms_all`, which cuts the arms out of the coat before a swung copy is laid over. Disabling that single line and re-rigging Hob produces exactly the described artefact — the near hand's skin blob goes **4,035px → 5,678px** and the far hand's **3,955px → 4,611px**, each hand now being itself plus its own swung copy.

**And that line was guarded on the wrong name.** It sat inside `if near_am is not None:` and did the work for *both* arms. `split_arms` returns both or neither, so the guard held — but a painted `--far-mask` over an auto pass that found nothing sets `far_am` alone, and then the subtraction is skipped entirely while the far arm is still swung. The same branch left `sh_far` as the auto `shoulder`, which in that case is `None`, and `None` reaches PIL's rotate centre.

**Fixed:** the union is built from whichever arms exist and the guard is on the union; shoulders resolve per arm; an arm with a mask and no shoulder row is refused by name. **Output on the working path is byte-identical** — all eight frame hashes unchanged — which is the point: a hardening that changes a shipped picture is not a hardening.

## Q88 · The palindrome, confirmed by construction, and it is not the worst of it

**Confirmed arithmetically, from the array rather than from the frames.** `HIP_SWING = [14, 10, 0, -10, -14, -10, 0, 10]` has magnitudes `14 10 0 10 14 10 0 10`. Every frame is a pure function of `s`, so equal `s` gives byte-identical output: `1 == 7`, `2 == 6`, `3 == 5`, five distinct pictures from eight frames. The rigged Hob's frame hashes read `cf24f21b e0fd9080 99e47747 df1579a8 748312c9 df1579a8 99e47747 e0fd9080` — the palindrome, exactly.

**`HIP_SWING` is not the bug and neither is the sign.** `rot(far, -s)` against `rot(near, s)` has been in the file since `1c63132`, its first commit. The legs alternate. **A sine visits every non-extreme magnitude twice per cycle**, and eight frames over a rigid leg can hold five pictures however the array is written.

**AND SWAPPING THE DRIVE FOR AN ASYMMETRIC ONE DOES NOT FIX IT EITHER.** With no per-phase quantity anywhere in the leg, `HIP[i + 4] == -HIP[i]` for any odd-symmetric array, so driving the far leg from a phase-shifted *index* is arithmetically identical to negating the angle. **Fault 2 cannot be fixed without introducing something that is a function of phase rather than of angle**, which is what fault 3 is.

## Q89 · Leg overlap: built, measured, and it is louder than reported

Clause four of `check-clip-agreement.mjs`. Below the hem, silhouette intersection-over-union of frame `i` against frame `i + n/2`, at the contact pose and at the passing pose. **Out of `run-all.mjs`, reported not asserted**, because `hob-walk-right` ships at 89% by ruling and asserting today is a standing red (R5j).

**The hem is the check's own constant, 0.72 of figure height, not the rig's `hem_pct`.** Reading the subject's own measurement would make the check agree with the thing it judges (R5e), and half the walks are authored and carry no such field, so it would also be a fallback to a sibling's number (R5f). The verdict is insensitive to it: across 0.66–0.75 no pair moves more than four points and no verdict changes.

| clip | contact | passing |
|---|---|---|
| `hob-walk-right` (`main`, authored) | **89%** | **69%** |
| `thad-walk-left` | 0% | **100%** |
| `thad-walk-right` | 0% | **100%** |
| `thad-walk-back` | **52%** | **100%** |
| `thad-walk-front` | 47% | **100%** |
| the 8 rigged Hob frames (`8a81342`) | 1% | **100%** |
| the 4 frames `19f934b` replaced (`9ed3106`) | 22% | 27% |

**89% and 69% reproduce the stated numbers exactly**, which is the check agreeing with the measurement it was specified from.

**Two things the brief's table did not say, and both matter.**

**The 21%/27% set is not the rigged one.** Those numbers belong to `9ed3106`'s frames, which are authored from a casting sheet — the ones carrying the third hand. The rigged output scores **1% on the contact pair and 100% on the passing pair**. Its stride is excellent and its passing pose is a duplicate frame.

**Every walk in the repository is at 100% on the passing pair except the two authored sets.** That is the palindrome measured from the other end: frames 2 and 6 are not merely similar, they are the same file. **Clause three passes all of them** — 5 distinct pictures out of 8 clears its threshold of 3 — which is the brief's point about distinctness proving nothing, and now it has a number.

**`thad-walk-back` at 52% and `thad-walk-front` at 47% are a separate finding.** Head-on views take the `shift_scale` path rather than `rot`, and translating a leg toward the camera barely changes the silhouette, so the two contacts nearly coincide. Whatever fixes the profile walks does not touch these.

## Q90 · The knee, costed and not built

**Requested as a cost, and the honest answer is that the code is small and the loop after it is not.**

**What already exists.** `swing_arm` is the operation: split a limb at a fractional row, rotate the distal segment about the split, rotate the whole about the proximal joint. It is 14 lines. `split_legs` already separates near from far by a fitted seam, `find_hem` already gives the hem, `rot` already premultiplies, and `extend_up` already replicates rows under a joint so a rotation opens no gap. **A `swing_leg` is `swing_arm` with different defaults**, and the right shape is to rename it `swing_limb` and call it twice.

**Code: about 40 lines.** A `KNEE_FLEX` drive of eight values, a `--knee-frac` flag defaulting to 0.5 of hip-to-sole (declared, never inferred, on the `--pose` precedent), the two call sites, and a shin variant of `extend_up`.

**The two things that are not cheap, stated because nobody has established they are.**

**One — the knee opens a gap in open air.** `extend_up` works because the thigh's replicated rows hide under the coat. A knee sits mid-shin over bare trouser, and rotating the shin about it opens a wedge with nothing over it. The arm gets away with this because the near elbow is inside a sleeve and the far arm runs at `elbow_frac=0.15, fore_lead=0.25` — small angles, high joint. A leg has neither. **This is the part that will need more than one round**, and it is the same class of problem as the coat gap, which made things worse twice.

**Two — the drive array is a judgement nobody has ruled.** Knee flexion is asymmetric by nature — bent through swing, straight through stance — and that asymmetry is exactly what breaks the palindrome. But *how* bent is a picture question, it has to be judged at shipped size, and "until it looks right" has no exit condition.

> **The recommendation: clause four is the exit condition, and it should land before the knee, not after.** A passing pair at 100% becoming a passing pair below 50% is a fact about the bytes that anybody can check in a second, and it is the difference between tuning a walk and looping on one. Clause four is built and reporting today; the knee change is the one that turns it into an assertion.

**What it unblocks, and this is why it is worth the rounds:** all four Thad walks, from the sources already in the repository, with no new generation. The contact pairs on the profile walks are already at 0% — the stride is right and only the passing pose is duplicated.

## Q91 · Beat 11's far figure is derived, and it is 15×46 of flat black

`tools/rig/far_blob.py`, and the whole tool is thirty lines of work over a rule.

**The room's darkest value is `#000000`**, and it is not an outlier: **1,469 pixels** of the plate are exactly that, the first at (34, 228). Measured by luminance over `art/backgrounds/room-01-stage-road.png` rather than chosen. If it reads too hard against the road it is one constant in one file.

**Written at 44px, which is R5a read correctly.** 22 is the *largest* this clip is ever drawn at — it takes over at the handoff and only shrinks afterwards — so twice the largest drawn size is 44, and the 2px bob is one drawn pixel at the handoff.

**Source frames 0, 2 and 4.** The back walk is a palindrome (Q88): 2 and 6 are the same file, as are 1/7 and 3/5. Those three are contact, passing and opposite contact — the widest-separated pictures the clip actually contains. **Asking for six would have returned three of them twice**, which is how sixteen padded idles happened.

**Area-averaged, then re-thresholded at half coverage.** Resampling a hard silhouette leaves a soft edge and the presentation spec forbids anti-aliasing anywhere; averaging coverage and cutting at 50% keeps the outline where the majority of the figure was and leaves every surviving pixel fully opaque. Result: **3 frames, 3 distinct**, and the tool refuses by name if the bob ever quantises away.

**I FIRST DECIDED NOT TO DECLARE IT IN `content/actors/thad.json`, AND A CHECK ALREADY IN THE REPOSITORY SAID OTHERWISE.** My reasoning was R5l — a clip in a record that nothing plays is a plan in a record — and `check-actor-clips` failed the build by name with the better argument: *"new art nobody wired is invisible — the game never asks for it and nothing says so."* **Undeclared art is not a milder form of the same problem; it is the form where nothing can tell the art exists at all.** Declared, it is loaded, budgeted and in every diff. Its reader today is the trace tool; no sequence plays it until beat 11 has a path.

**Two real defects surfaced by declaring it**, neither of which the eye would have caught:

**One — the bob was a hop, and my own comment said otherwise.** The code lifted the whole figure off a fixed canvas bottom while the comment beside it read *"the bounce lifts the body off them rather than moving both."* The comment described an implementation that was not there — R5o's tell, in a file three hours old. **The whole-figure bob is the right answer at this size** (at 22px there are no legs left to swing, so the bounce *is* the walk), so the comment was corrected rather than the code — but the two disagreeing is the thing.

**Two — the canvas convention was wrong and would have put him in the road.** `build-actor-record.mjs` writes `anchor: [padding + width/2, figureHeight]`, so the figure must occupy rows `0..figureHeight-1` at its lowest with the anchor row after it, which is how `character.py` writes every other clip. Mine was bottom-aligned with the bob going up, so the soles sat two rows low and the declared `figure` omitted the bob entirely. Now the two contact frames sit on the anchor row and the passing frame rides 2px above — **which is also where a walker actually is**, lowest at contact and highest at mid-stance. `figure` is the full 46-row extent, bob included, the same convention `thad-walk-back`'s 548 uses.

**`build-actor-record.mjs --check` throws rather than reporting.** A new clip directory makes it exit through an uncaught `Error` before it compares anything, so `check-generators` reported *"exited 1 without reporting a stale output"* rather than naming the directory. The throw is informative to a person reading a terminal and invisible to the check that wraps it. **Not fixed here** — it is the generator's error contract rather than this change — and recorded so it is not rediscovered.

`renders/thad-farwalk-back-derived-blob@8x.png`.

## Q92 · The trace tool is built, published, and driven

`tools/beat11/trace-path.html`. Standalone, no build, no imports. Click to append, drag the foot dot to move, drag the head dot to set `figureHeight`, Delete to remove, load a JSON back in, preview, download, copy.

**Every waypoint ghosts Thad on the plate at the height set there**, and past 22px it ghosts the derived blob instead — because that is what will be on screen. `renders/beat11-trace-tool-three-waypoints.png`.

**The runtime rule, implemented as specified.** `dw = ds / figureHeight(s)` over 2px steps, taking the height at each step's **midpoint** rather than its start — using the start biases every segment toward its larger end. Normalised to [0,1] so `beatSeconds` alone sets the rate. Cadence is a fixed frame rate off the wall clock, and the title's fade keys off the same `u`, so nothing about the path can change how long the title sits.

**The cadence default is derived, not picked:** `walkSpeed 245 ÷ (strideLength 102 ÷ 8 frames) = 19.2 fps`, which is the rate his legs already run at on flat ground at full size. **Fetched from `content/actors/thad.json` when the page is served, baked as a fallback when it is not, and the status line says which** — because `file://` blocks the fetch and a number whose provenance is invisible is the one nobody re-derives.

**PUBLISHED, and that is the part that was nearly missed.** `vite.config.ts` now copies `tools/beat11` into `dist`, so it lands at `/consolation-prize/tools/beat11/trace-path.html` on Pages, where its `../../art/...` paths resolve exactly as they do locally. **A tool the person who has to use it cannot open is R5o** — and he works from a Chromebook.

**Driven headlessly in both modes before this was written.** Three waypoints appended by click; the height handle dragged 206px → 86px; `w` moved 1.59 → 1.93, which is the right direction — a smaller figure means more world travel for the same screen distance. Served, the status line reads *"cadence from content/actors/thad.json (245 px/s ÷ 102px ÷ 8 frames)"*. The only 404 in the served run is the browser's automatic `/favicon.ico`; every asset the page asks for returns 200.

**`tools/check-beat11-path.mjs` is built and NOT registered.** Four rules — inside the play area, strictly decreasing height, first waypoint standing in a real walk box, `farClipHandoff` agreeing with the heights beside it. **It reads `content/rooms/stage-road.json` and is the authority on the band; the browser tool's copy of it is a drawing guide**, because a page opened from `file://` cannot fetch JSON.

**Proved on a deliberately broken path** — a repeated height, a waypoint at x2000, and a handoff off by one — and all three fired by name, plus the walk-box test correctly placing (575, 700) in `road_open`. **With no path committed it prints "NOTHING WAS CHECKED" and exits 0**, which is why it stays out of `run-all.mjs`: a check that passes because its subject is absent reports the same green as one that passed on real work. It joins the suite in the change that commits a path.

**What is still Tyler's here, unchanged:** where the path ends, whether credits exist, and every waypoint in it. `beatSeconds` is one field that can absorb credits; there is no credits roll.

## Q93 · The knee is built, and the wedge did not happen because the joint is not a cut

Doc 38 R4c carries the mechanism. The results, measured on Hob's rigged cycle:

| | frames | distinct | contact pair | passing pair |
|---|---|---|---|---|
| rigid (`--knee 0`) | 8 | **5** | 1% | **100%** |
| with the knee | 8 | **8** | 1% | **36%** |

**`--knee 0` is byte-identical to the previous rig** — all eight frame hashes unchanged — which is how the change was checked before anything was believed about it.

**THE WEDGE WAS THE THING TO REPORT, AND IT IS SOLVED RATHER THAN TOLERATED.** A row split at the knee opens a gap of half the limb's width times tan(angle): **35 pixels at 60 degrees on a 40px leg**, in open air, with no coat over it. Extending the shin to cover it needs 35px of shin above the knee, which then swings 30px clear of the thigh and reads as a spur. **So the joint is a disc instead** — everything within 0.58 of a leg-width of the knee travels with the shin, and a disc rotated about its own centre is the same disc. There is no edge to open.

**Measured for holes rather than eyeballed.** Counting enclosed transparent regions below the hem: the knee frames show 323px and 2,621px on frames 4 and 5, and the **rigid** version shows 9,487px on frame 4. **The largest enclosed area is in the version with no knee at all**, so what the metric is finding is the background between a straddled pair of legs, not a joint hole. Confirmed by looking: `renders/hob-knee-vs-rigid@3x.png`.

**AND THE AMPLITUDE LADDER IS THE OVERLAP CHECK'S WHOLE ARGUMENT IN ONE TABLE.**

| `--knee` | distinct | passing pair |
|---|---|---|
| 0.3 | **8 of 8** | 72% |
| 0.5 | **8 of 8** | 60% |
| 0.7 | **8 of 8** | 49% |
| 1.0 | **8 of 8** | **36%** |

**Any knee at all gives eight distinct pictures; it takes 0.7 before the legs stop being the same stride.** At `--knee 0.3` every byte-level check passes and the walk still gallops.

**NO COMMITTED ART WAS REGENERATED.** The standing instruction against regenerating art has not been lifted, Hob's clip is ruled in as authored, and `thad-walk-back` is the blob's source. Everything above is scratch output; the change is to the tool.

## Q94 · Clause four still cannot be asserted, and the reason is a ruling

Measured on the current tip, after `9c84012` and `636b174`:

| clip | contact | passing |
|---|---|---|
| `hob-walk-right` | 89% | 69% |
| `thad-walk-back` | 52% | **100%** |
| `thad-walk-front` | 49% | **100%** |
| `thad-walk-left` | 0% | **100%** |
| `thad-walk-right` | 0% | **100%** |

**All five fail. Registering clause four today is seven standing failures**, which is R5j. The knee landing in the tool does not change this, because no clip in `art/actors/` was produced by the tool since.

**TWO THINGS HAVE TO HAPPEN FIRST, AND ONE OF THEM IS TYLER'S.**

**The profile walks need re-rigging with the knee** — `thad-walk-left`, `thad-walk-right`, and whatever Hob would become. That is art regeneration and it is not mine.

> **AND IT WAS BLOCKED ON PROVENANCE, NOT ON KNEES.** Seven rig records named a
> source under `/tmp` that had been gone for months, `thad-walk-right` and
> `thad-walk-left` among them — so the two clips this asks for could not be
> re-rigged from what their own records said. Recovering `thad-walk-right` took
> an afternoon: the source is `reference/casting/thad-profile-right-approved.png`,
> and its far arm came from a **painted mask** that nothing recorded. Without
> `--far-mask reference/masks/thad-right-far-arm.txt` the arm comes out 11,748px
> against the recorded 27,535 — 43% of it, which is the number `character.py`'s
> own `parse_mask_code` docstring names and the only trace that a mask existed.
>
> **All seven now carry an `invocation`, and five of them are proven** by
> reproducing every comparable measurement exactly — ten for each profile walk,
> eight for `thad-walk-back`, and the two head-on idle-breaks whose only
> discrepancy is `step_px` 7 → 2, which is the 3.07× downsample and not a
> different input. **The two `recoil` clips are marked UNPROVEN in their own
> records**: a recoil rig carries no measurement two different sources could
> disagree about, so they are inference from their proven siblings on the same
> file, not a match.
>
> `character.py` now writes its own invocation, and clause six of
> `check-rig-describes-frames` fails any rig naming a source outside the tree —
> it reported exactly these seven before the fix. **Whoever does the re-rig runs
> the invocation in the record, then `downscale.py --figure 526`.** The ruling
> below is still Tyler's, and so is whether Room 1's signed-off walk may move.

**And the assertion needs a ruling on authored clips.** `hob-walk-right` carries `authored: true` and a note recording the accepted fault. Either the assertion skips clips carrying that flag — which makes `authored: true` an opt-out any future clip can claim, and the check then cannot see the next Hob — or Hob is re-rigged and the exception disappears. **Put to Tyler rather than chosen.** My reading, offered as reading: an exemption that a file can grant itself is the weaker of the two, and Hob crossing Room 1 once is exactly the case where re-rigging is cheap.

**`thad-walk-front` and `thad-walk-back` cannot pass however the ruling goes.** They take the head-on `shift_scale` path, which is also a pure function of `s`, and a knee facing the camera projects as foreshortening rather than as an angle. **Their fix is a different per-phase quantity — a foot that lifts in swing and plants in stance — and it is not built.** Costing it: the same shape as the knee, roughly 20 lines, no joint geometry because nothing rotates; the risk is that a vertical lift at 240px head-on is two or three pixels and may read as a limp rather than a gait. Worth building only if somebody watching says the head-on walks look wrong.

## Q95 · The arm-mask symmetry retraction is in doc 38, and doc 38 did not carry the claim

Struck and recorded as instructed. **Doc 38 never carried the arm metric**, so the section is preventative plus the record — but the audit found the neighbouring claim in Part Three, *"leg mass after split … should be roughly symmetric"*, which has the same standing: one observation from one character, never established as a threshold. Softened rather than struck, because `split_legs` fits a seam rather than ordering by mass, so its two numbers *can* differ meaningfully — unlike the arms, where the larger mask is called near by definition and the ratio cannot fall below 1:1.

**The `--pose standing` quirk is recorded in doc 38 too.** The message is the urgent half: telling the next person their source is a striding pose sends them to regenerate art that is fine.

## Q96 · The four-days line is not a stale build

`content/rooms/stage-road.json`, hotspot `coach_gone`, on the current tip:

> LOOK 1 "Gone. It made very good time on the way out." · 2 "Not another one for four days. I have checked twice and the answer did not improve." · 3 "The ruts are still filling in…"

**That is `docs/00-errata.md` line 329 verbatim**, and `check-extraction` is green, so the shipped line is the errata's line and the build is current. **Not the stale-build cause, and therefore content and Tyler's.**

**One thing that may be what "reads wrong" means.** `docs/17-opening-sequence.md` line 144 words the same beat differently — *"The next coach out of Consolation is in four days. I have checked twice and the answer did not improve."* — and the errata overrides doc 17, so the shipped version is the compressed one. If the fuller wording is the one wanted, it is a one-line change in the errata and a re-extract. **Named rather than changed: it is a line of dialogue.**

## Q97 · The lantern glow is built, and the spec that had no reader now has three

**`art/effects/lantern-glow.json` was R5l's third instance — fully specified, referenced by nothing.** It is now named in the manifest as `carriedLight`, loaded by `ContentLoader`, deferred by `planBoot`, and drawn by `Renderer.drawCarriedLight` after the plate and the idles and before the people. Errata D8's rule holds: **light that belongs to a mover leaves with the mover.**

**Q81's ruling is what the data shape follows.** `lantern_anchor` is per clip and per frame in `rig.json`, written through to the actor record as `lanternAnchor`, so the pool tracks the lamp between the stand (at his side) and the walk (held forward). `build-actor-record.mjs` refuses a list whose length does not match the frame count, by name — one short would light the wrong hand.

**ONE PROJECTION, TWO CALLERS.** `projectOnCanvas` in `ActorSprite.ts` now computes both the frame's top-left corner and the lamp's position. Written out twice they would be two formulas that agree today; the anchor rounding is not obvious, and a glow that computed its own version would drift a pixel or two the first time either changed — **which looks like the light being loose on the lamp rather than like a bug** (R5i). `frameFor` in the renderer is the same move for the frame index: the light pass runs before the figure pass and has to pick the frame the figure pass will pick, or the pool trails the lamp by one.

**Measured, at three depths, against the real plate:** `renders/room-01-lantern-glow-three-positions.png`.

| feet | drawn height | lamp | pool |
|---|---|---|---|
| 760, 760 | 242 | 811, 670 | 629 × 629 |
| 1080, 716 | 229 | 1121, 638 | 595 × 595 |
| 1400, 700 | 224 | 1444, 617 | 582 × 582 |

The pool is sized off the carrier's **drawn** height, so it recedes with him by the same number he does. The sprite's lit content runs y 20–328 of 512, so the ellipse sits above the sprite's own bottom third and the pool does not run off the play area even at the near edge.

**Three deliberate nulls, each of which is the feature rather than a gap.** No anchor on a clip → no light. No loaded frame → no light, because the projection needs the image's own pixel size and a pool placed from `figureHeight` alone would sit under a graybox in the wrong spot. No `carriedLight` in the manifest → no light at all, which is what the game did before this existed.

**Drawn UNMASKED, and that is a decision.** The near plane goes on after the people and therefore over the pool too, so a foreground post still stands in front of it. What it deliberately does not do is clip to the carrier's own occlusion mask — **a ground pool is not a figure**; it lies on the floor and the man stands in it, so masking it to his silhouette would cut the light to the shape of the man.

**Two things changed in the spec file and both are recorded in it.** `scale_rule` was prose — *"width = 2.6 x the character's drawn height"* — which is a rule a renderer cannot parse, and it stayed prose for exactly as long as nothing read it. And `anchor_in_source` named a flame at [658, 969] on a figure of [740, 1517]; **that clip is 356 × 668 today and the point does not exist in it.** R5k. It is replaced by the per-frame anchors, not re-measured.

**The anchor is the HANDLE, not the flame**, because the lamp is drawn unlit and there is no bright spot to measure from. The sprite's own `flameAnchor` sits a third of the way down its height, which absorbs the difference: a lantern body is about 5% of the pool's width.

**And `check-no-content-in-code` caught my test.** The first version reached for the carrier by id — the engine knowing the fiction. Rewritten to find him by his data, which is also the stronger assertion: *exactly one clip in the whole bundle declares a lamp.* 136 tests.

**Not built, and named rather than left to be found: flicker.** Doc 36 line 67 says flicker is now modulation of the glow's alpha or tint over time, no frames. Nothing modulates it — the pool is steady. **That is a one-line change against the clock and it should be a ruling, not a default**, because a flame's flicker rate is a look decision and a wrong one reads as a fault in the renderer.

## Q98 · One check for the whole class: a record must be true of the pixels beside it

`tools/check-rig-describes-frames.mjs`, **registered**, five clauses. Every bug it covers reached a play-through, and every one of them was invisible because **every existing check compared records with records.** Nothing opened a PNG and asked whether the number was true of it.

**Proved by reintroducing the bugs**: 17 failures on the pre-fix tree, 0 after — and the numbers it reports are the ones already on the record. `thad-walk-left` at a declared 442 against 526px of frames reads **1.190x**, which is the 19% that shipped. `driver-head.json` at 389 against a 447 body reads **1.149x**, exactly the figure in its own `figureHeightNote`.

| clause | what it asserts | bound, and where it came from |
|---|---|---|
| 1 | the figure's top is canvas row 0 | exact — true by construction for everything the rig writes, and all 39 clips sit at 0 today |
| 2 | declared figure height is true of the alpha | ≤ **1.08×**. 35 of 39 clips are exactly 1.000; the four that are not are head-on walks and recoils where a leg drops below the soles — 1.042, 1.042, 1.040, **1.056** |
| 3 | an overlay's figure height equals its body's | exact |
| 4 | the art-side rig and the content record agree | exact |
| 5 | a clip declaring `returns_to` begins and ends there | ≥ **0.95** silhouette agreement |

**The bounds are measured, not chosen** (R5b2), the distribution is printed on every run, and a new clip that legitimately reaches further fails by name so the number moves once, visibly, instead of the check being loosened until it is quiet.

### Two live faults it found on its first run, both on `main`

**THE DEPARTING COACH WAS UPSCALED 74%, AND THE DRIVER'S HEAD WAS AT TWICE ITS SCALE.** `coach-walk-right` declared 550×224 while every coach idle declares 1128×447 and the coach *draws* at 389 — so the idles scaled **down** by 0.87 and the walk scaled **up** by 1.74 the instant the coach began to move. And because `driver-head.json` declares 447, the overlay composited over that clip at **447/224 — twice the scale it should be.** Beat 6b, every play-through.

**Fixed from art that already ships, not by regenerating.** `1bf5d41` rebuilt the closed clips with the case painted out and said *"walk is the same frame"* — it was, and the pixels agree: `idle-00` downscaled to 550×224 matches the old walk frame to **a mean absolute error of 1.47 of 255**, alphas disagreeing on 0.05% of pixels. So the walk frame is now that same picture at full size, copied.

**And `1bf5d41` silently undid `2ab0616`.** The wheel clip went from eight frames to one, and the note describing eight rotating wheels survived on a directory holding one still frame. **The wheels are frozen again.** Restoring them means re-running the wheel rig over `art/objects/coach/` — art, not a copy, and left.

**THE DRIVER-HEAD RIG WAS STILL CARRYING BOTH ORIGINAL BUGS.** `art/actors/driver-head-right/rig.json` said `overlay_rect [409, 10]` and `figure [956, 389]`. The record was measured and corrected; **the rig was not, and the rig is what a regeneration reads.** Corrected to the record's verified values, with the derivation cited rather than re-derived. Clause four now asserts they agree.

## Q99 · The seven chores are reseated, and byte equality could never have been the test

**All seven fixed**, by `tools/rig/reseat_chore.py --all-returning`. Frames 0 and last of each are now the current `thad-stand-right`, resampled to the chore's figure height and seated on its anchor — soles on the sole row, centre line on the centre line, premultiplied before resampling (R4).

**This is not a re-rig and the tool cannot become one.** The key poses in frames 1–3 come from art in `reference/casting/` that no rig.json names, and rebuilding those needs knowledge nobody wrote down. **Frames 0 and last need none of it, because the contract says exactly what they are.**

**THE CONTRACT'S OWN WORDING IS UNTESTABLE AND THAT IS THE FINDING.** Seven rigs say *"Frame 0 and frame 4 ARE the stand frame, byte for byte."* A chore is 526px of figure on a 390×547 canvas; the stand is 625px on 648×690. **They can never be byte-equal.** Worse: **the two ends WERE byte-equal to each other throughout the bug** — both were the old stand — so the obvious test would have passed while the bug was live.

So clause five compares silhouettes on a 64×64 grid over each figure's own bounding box, which is scale-free and reuses none of the seating arithmetic (R5e). **Measured: 57% before, 100% after, against key poses at 45–69%.** The bound is 0.95, which no key pose can reach and no correct end frame misses.

**`carry` is played by nothing.** Its own generator comment says *"BEAT 6b HOLDS HIM IN `carry` WHILE THE COACH GOES, and that one moment is the whole reason the clip exists"* — and beat 6b's shipped staging is `setState thad`, `setState coach`, `move coach`. **A comment asserting behaviour the product does not have, which is R5o's exact tell**, in the file that generates the staging it describes. The bible's opening image — *"a stage coach pulls away, revealing a young man in a good coat standing in mud, holding a case"* — is not on screen. **Not added here: what plays in a beat is staging, and staging comes from doc 17.**

## Q100 · The act card does not clip the dialogue. Nothing was drawing those options at all

**Found in a real frame, as instructed, and it is neither the act card nor the layout.**

The card draws glyphs and fills nothing. The layout was correct in every frame measured. **The diagnosis is one number from the probe: at the act-card frame it reports `options: 0` while four option rows are on screen.** They are not being drawn. **They were never erased.**

**`drawPlate` covers the PLAY AREA — rows 0 to 864 — and the band below it has no owner.** It is written only by `drawPanel`, `drawDialogue`'s backing and `drawMenu`. `showPanel` is false for the whole opening, so on the frame the driver's conversation ends, the play area repaints over the top half of the dialogue backing and **the bottom half is simply left there**: three and a half option rows, still on screen, sliced exactly at the play area's lower edge because that is where the repaint stopped.

**That is precisely the report — "the top option is half-covered by the play area, and the scene appears to extend lower than it does otherwise."** Both halves of it are literally true, and neither is about the card.

**Measured, before and after:**

| | backing band starts | option ink rows | non-black pixels in the panel band |
|---|---|---|---|
| mid-conversation (correct) | 810 | 828, 888, 948, 1008 | — |
| act-card frame, before | **864** | 828 *(sliced)*, 888, 948, 1008 | **33,264** |
| act-card frame, after | — | none | **0** |

`renders/act-card-stale-panel-before-after.png`.

**`Screen.clear` has existed since the file was written and is called by nothing** — R5l, and this is what it cost. The fix is the narrower version of it: clear the panel band every frame, because clearing the whole screen would blank the play area a moment before the plate covers it and the band is the only region with no owner.

**Cleared to `overlayBg`, not `panelBg`, so this fixes the staleness and changes nothing else.** The band is black whenever it is empty today — untouched canvas before the first conversation, the dialogue's own backing after — and `panelBg` is a shade lighter, so clearing to it would have put a grey bar under the opening that nobody asked for.

> **The general lesson, and it is the one Tyler's instruction is really about: a region nothing owns keeps whatever was last put there.** Every check in the suite reads records; this was visible only in a composited frame, and the probe could have named it at any point in the last four play-throughs by being asked what it thought was on screen.

## Q101 · The two declared mark invalidations: checked, and neither invalidates a mark

Checked against `tools/gauntlet/opening.json` before filling anything in, as asked.

**`actCardExtraSeconds` 4 → 2 does not move an assertion.** Beat 7's only assertion is `within: 12`, an upper bound — and its own note says why it is loose: *"it is here to catch a beat that never ends, not to pin a number somebody is still choosing."* Shortening the beat from about 7.2s to about 5.2s stays under it. **What IS now stale is the note's "about 7.2"**, a number inside the script describing something that moved (R5k). **Measured by the gauntlet itself on this session's run: beat 7 held 5.20s armed and 5.14s bare** — which is what a two-second reduction from 7.2 looks like, and it confirms the change landed as well as leaving the ceiling intact.

**`case_mud`'s `walkTo` touches nothing, because no beat in the script interacts with the case.** Beat 4's input chooses dialogue options by index; beat 9's clicks the lamp. The case is never clicked in the whole run.

**And the script is emptier than "2 of 12 beats" suggests**: beat 2 asserts a relation (`thad.moving` when the walk clip starts), beat 3 asserts only that it begins. Beat 7's `within` is the third assertion and it is a ceiling. **Everything else is structure.**

## Q102 · Clause three shipped, caught its fault, and was obsolete within the hour — correctly

**`b329dac` is the better fix and it supersedes the check I wrote for the same bug.** I asserted that an overlay's `figureHeight` must equal its body's. `b329dac` **removed `figureHeight` from overlay data entirely** and made `drawOverlays` take the scale of the clip actually being drawn.

**That is strictly better and the reason is the one my own clause could not survive.** A body's figure height is **per clip** — the coach was 447 standing and 224 walking — so **one number on the overlay could never have followed it**, and asserting the two agree only ever made one of the two clips right. My check would have gone on passing forever against a number nothing read, which is R5l: **exactly the failure it was written to catch.**

> **A check defending an invariant somebody can delete is worth less than deleting the field.** Recorded rather than quietly dropped, because the next person to meet this shape will reach for the same check.

**And it went red the moment the two landed together** — `figureHeight` became `undefined`, the comparison produced `NaN`, and the check failed on correct work (R5j). Replaced with two assertions that survive the new shape: **`figureHeight` must be absent** (a void field left in place will be believed by somebody), and **`clips` must name body clips that exist** — a misspelling there silently reinstates the second head, since `clips` is how an overlay says it does not apply to art that already contains it.

**The two coach fixes compose rather than collide.** Theirs stops the overlay applying to `walk` at all; mine gives `walk` the same resolution as every other coach clip. The record now reads **447 across all five clips** where it read 447/447/447/447/**224**, so the departing coach is scaled *down* from 447 to 389 instead of *up* from 224 — and their observation that the walk frame already contains its driver stays true, because the frame it now holds is the closed-door idle, which is where the baked driver has always been.

## Q103 · The gait is an integral now, and the defect only appears after you have played for a while

**The finding handed over is right and the arithmetic confirms it.** `frameAt` computed `floor(travelled / (paced / count))` — **total historical distance over the current depth-scaled stride.** `travelled` is every pixel he has ever walked; `paced` moves whenever his drawn height does. So stepping toward or away from the camera **re-divided his entire history** and the frame index jumped several positions in one update.

**Measured on the same trajectory, old formula against new, at three amounts of prior walking:**

| prior walking | old, worst frame jump | new |
|---|---|---|
| 0px | **1** | 1 |
| 5,000px | **4 of 8** | 1 |
| 20,000px | **4 of 8** | 1 |

**Four frames of eight is half the cycle, in one update.** And at zero history the old code is clean — **which is why every observation until somebody played for a couple of minutes came back green, including my own first pass at this.** I ran the spoke pattern, got `maxJump 1` from both formulas, and had to go back and add the history before the difference existed. That is the shape of the thing: the error is proportional to `travelled`, so a fresh save cannot show it.

**The cadence cap did not fix it and could not.** It floors the *denominator* at `speed × 60 / 2.6 = 94.2px`, which pins it constant for every drawn height below 222 — hiding the jump across most of the band rather than removing it. Room 1's band runs 222–263, i.e. **entirely in the range where it still varied.**

**The fix.** One normalised phase, accumulated once per update: this update's actual displacement, divided by the stride that was true for it, using the **average of the drawn heights at each end** so crossing a depth boundary is continuous. Nothing ever revisits an earlier contribution.

**The ceiling survives, applied to the increment rather than the denominator** — `min(raw, 2.6 × elapsed)` — which bounds the rate without distorting the distance-to-frame relationship, so the foot-slide is paid only where the cap actually bites.

**Correction 1, the stride plumbing, decided: the actor reads its own record.** The constructor already does exactly this for `walkSpeed`, the idle-break clip and `idleBreakRate`, and the comment beside them gives the reason — **R5f, an engine decision traces to a field on the thing it is deciding about.** Stored as a *ratio* (`strideLength / height`) rather than a length, so it needs no height passed with it; doc 40 measured the same number from the other end at "0.42 of his height". The renderer no longer computes or passes a stride, because the division now has to happen at the moment the displacement does, and a caller cannot reach that moment.

**Correction 2 taken as stated.** The X-only `faceToward` is in the fallback after routing fails, reachable only when `routeTo` returns undefined and the destination is still walkable — and `WalkBoxes.route` returns a route whenever `nearest()` finds a box at both ends, so in a one-box room it is likely unreachable. **Fixed because it is wrong and free. No test claims to exercise it**, because I have not established it can be reached.

**Correction 3 taken: `FACING_HYSTERESIS` is untouched at 0.25**, and no test hardcodes a percentage.

**Observed running.** Spokes at 0/22/44/46/68/90/112/136/158/180/202/248/292/338 degrees, plus a long diagonal into the distance across **87 distinct drawn heights** and one into the foreground: **worst frame jump 1, everywhere, at every history length.** Sequences read `00011122233334445556667777` — one frame at a time.

**One edge the observation found on its own: a first update with no previous clock had no duration to bound a rate against, so it took its raw advance uncapped.** For a figure drawn at 96px that is 0.100 cycles against a capped 0.043, and it made a one-second march measure 2.657 cycles against a ceiling of 2.6. `RoomActors.place` happens to update once on arrival while stationary, so in the running game nobody ever saw it. A missing previous clock is now assumed to be one tick.

**And one of my assertions was wrong in the ceiling's own terms.** I asserted a small figure must never cycle faster than a large one; 2.6 is the cadence at the **front of the walkable band**, where the figure is drawn taller than 240, so a full-size walker sits naturally *below* it at 2.40. The assertions are now the two that are actually true: the small figure is nowhere near its uncapped rate, and nobody exceeds the ceiling.

**Seven property tests plus the regression, 143 total.** The gauntlet is green and **that is not evidence** — it is a skeleton and would be green whatever this change did.

## Q104 · Beat 11 reads its path — and at 40 seconds his legs run at a quarter pace

**Built: a `path` step kind, a `travel` step kind, and beat 11 using both.**

`path` names a FILE rather than coordinates, because the trace was made by eye against the plate and re-tracing must not need an engine change. Progress is linear in `w` where `dw = ds / height` — screen arc length over scale — normalised to [0,1] so `beatSeconds` alone sets the rate. **Height comes from the trace, not the depth curve**, which is why it was traced: the curve is calibrated for the walkable band and this beat goes far above it.

**`travel` replaces `interact road_west WALK_TO`, and that step was the bug.** `interact` resolves the verb where it stands, and doc 22 section 6 walks to a target's own `walkTo` first — road_west's is `[575, 710]`. **So the beat spent its whole length taking him up the road and then walked him back down to the fence before travelling.** `travel` names the exit rather than the room, because where road_west goes is on road_west and a destination repeated in the staging is a second copy that can disagree (R5k).

**A `face back` goes in front of the path.** The trace wanders — x runs 575, 581, 537, 464, 517, 598, 704, 772, 826 — so a walk that re-faced on each leg would turn him side-on four times on the way out of the game. `path` never re-faces; the staging sets it once. Errata 55: *"with his back to us."*

**Walked end to end and measured:**

| | | | | |
|---|---|---|---|---|
| 0.0s | (575, 709) | 222px | | 5.0s · (516, 540) · 150px |
| 10.0s | (519, 487) | 75px | | 20.0s · (649, 463) · 52px |
| 30.0s | (752, 439) | 43px | | 40.0s · (826, 409) · **29px, arrived** |

**Worst frame jump 1 for the whole forty seconds.** He ends exactly on the last waypoint at exactly its traced height, and the travel fires from there.

### THE FINDING, AND IT IS TYLER'S TO RULE ON: the cadence is 0.52 strides a second

**Constant, as the arithmetic says it must be** — screen speed is `height × W / seconds` and the gait divides by `strideRatio × height`, so the heights cancel and the legs cycle at `W / (beatSeconds × strideRatio)` from the first step to the last. Measured 0.515 → 0.525 across a path that shrinks him 222px → 29px.

**But a walking man does about 1.9 strides a second, and 0.52 is a quarter of that.** It will read as slow motion. The number is not a defect in the mechanism — it is what 40 seconds over this trace's world length gives. **Two ways to move it, both content:** shorten `beatSeconds` (≈11s for a natural pace, ≈17s for a slow deliberate one), or extend the trace so there is more world to cross. **`beatSeconds` also sets how long the title sits over the mountains**, which is why this is a ruling and not an adjustment.

**A second real thing the per-tick measurement found.** At the trace's two sharpest corners a single update's displacement is the **chord across the turn** rather than the path along it, so those ticks advance about half as far — 0.235 against 0.52. That is geometry being honest, it lasts a sixtieth of a second, and it is why the test asserts the cadence **per second** rather than per tick. Asserting per tick would have failed on correct work.

**`farClipHandoff` is built and `-1` is honoured as declared.** `Actor.isFarAway` is a question about the *path*, not about the height: a trace whose handoff is -1 never answers true however small he gets. **The committed trace bottoms out at 29px and the blob takes over below 22, so `thad-farwalk-back` is unused by it and he stays the real sprite the whole way** — switching at 29 to make the feature visible would be the engine overruling a look decision.

**Two new staging kinds, both named in the drawer**, which `check-drawer-coverage` demanded by name on its first run — `path` labelled with its file (the duration lives there, and a picture of the timing that omits it is useless) and `travel` labelled with its exit.

## Q105 · The stems are rendered, and the tool had two faults and a leftover

**It had never been run, and it stopped on the first line it executed.** `chromium.launch()` bare, with no fallback for a pre-provisioned browser — which the gauntlet had already solved and written down. **Extracted to `tools/lib/chromium.mjs` rather than copied**: two answers to "where is chromium" agree today, and the second consumer found the first one's answer by failing without it.

**THE SECOND FAULT WAS IN THE PROOF, AND ONLY ONE OF THE TWO PIECES COULD SHOW IT.** `scheduleSpan` — the offline-only path, comment and all — laid every beat at the module-level `BEAT`, which is `60/152`. The live scheduler asks `beatSeconds()` for the piece's own beat and lays one beat at a time. **THEME is at 152, so the title stem was correct by coincidence. THADDEUS is at 76 — exactly half — so it rendered at double speed and stopped halfway through its buffer**: a 39-second file with 19.9 seconds of music in it.

`pieceBeat` is computed by `setPiece` and read by `beatSeconds()`, which the live path uses, and *not* by `scheduleSpan`, which nothing had ever run. **Nothing Tyler has heard changes** — the audition path does not touch it.

### The loop had a hole in it, and the tool's own comment said it should not

`Music.ts` sets `element.loop = true`, restarting at sample zero the instant the file ends. The renderer appended a 1.2s release tail, so:

| | before | after |
|---|---|---|
| `consolation-title.wav` | 26.46s, tail decaying 0.45 → **0.014** | **25.26s**, exactly 2 statements |
| `thaddeus-room-01.wav` | 39.09s, **0.6s of digital silence** before the end | **37.89s**, exactly 4 statements |

**A half-second hole in a 38-second bed, every time round, in the room the opening happens in.** The release is now **folded back over the start** — which is what continuous playing sounds like, since a note still ringing when the last beat ends is still ringing when the first beat comes round again.

**Measured after: no silent run anywhere in either file, and the sample step across the loop point is smaller than the MEDIAN ordinary step** — 0.0116 against 0.0118 on the title, 0.0062 against 0.0089 on THADDEUS. There is no click to hear. `renders/music-stems-waveforms.png`.

### Two things to know about the files

**Two renders are never byte-identical.** Errata 56 builds the LA attack transient from bandpassed noise, so every render is a different performance: **0.9% RMS difference on the title, 0.1% on THADDEUS** across two consecutive runs. **Do not diff them to see whether the music changed** — a byte comparison says "different" every time and would say it just as loudly if nothing had been touched.

**11 MB for the pair, and the `.ogg` naming was the residue of the plan to fix that.** The tool named its outputs `.ogg` and rewrote them to `.wav` at all three use sites — a name that had stopped being true (R5k), now `.wav`, which is what is written and what the manifest asks for. **Encoding is still worth having and is not cheap here: neither `ffmpeg` nor `oggenc` is on this machine**, and it would need a manifest change too.

## Q106 · Dialogue is performed. Steps 1–7 of doc 30, and the machine was already there

**The diagnosis is exactly right and the repo agrees with it.** `DialogueRunner.select()` is `beginSelection` + `advance('echo')` + `advance('reply')` + `settle()` in four lines, and `GameScene` called that. **Every phase boundary `DialogueExchange` exists to create was crossed inside one statement** — including the one named `echo`, whose own comment cites errata 45's first correction. Doc 30 specified it, errata 45 corrected it, the exchange implements it, and the caller fast-forwarded. **R5o at the largest scale in this project.**

**Built: `engine/core/DialoguePerformance.ts`**, a driver rather than a second machine. It holds a queue and a clock, calls `advance` at the boundaries the exchange already names, and calls `settle` **on exit from the last reply** — which is errata 45 itself. **It lives in the model**, because "what a conversation does over time" is a fact about the game and a driver written in the scene would work where no test could see it (R5m).

| doc 30 section 1 | before | now |
|---|---|---|
| speech anchored over the speaker, following position and scale | top-centred at a fixed `SAY_TOP` | **anchored, clamped, and scaled** |
| choices hidden while an exchange plays, unable to receive clicks | drawn throughout | **hidden, and `dialogueHitboxes` returns nothing** |
| selecting a choice makes Thad speak the selected wording | never | **the echo, from `option.text`** |
| `readingHold = clamp(1.8s, 8.0s, 0.45s + glyphs × 0.055s)` | no hold; a line waited for a click forever | **built, from content** |
| per-speaker colour | live | live |

**The timing constants are content**, beside `lineSecondsPerGlyph`, whose own note says why: menu.json's unbuilt "Text speed" scales exactly these. **The two sets are deliberately not reconciled** — 0.045/1.6 is what the opening was watched and tuned against, 0.055/1.8 is doc 30's binding number for dialogue, and merging them retimes the opening, which is a ruling.

**Escape is NOT bound to skip.** Doc 30 4.2 reserves it for *non-interactive cutscenes* and says "interactive trees are never timed choices"; Escape is the menu key and stays it. `skipAll` is built and asserted to land on the same state as watching, and nothing binds to it, because there is no cutscene-skip action in the build.

### Watched, and the proof case performs as written

`renders/dialogue-performed-driver-hotel-exchange.png`. The hotel question: **choices vanish → "Where am I supposed to sleep?" over Thad → the driver answers → "I have four." over Thad → the driver lands "You've all got four." over the driver → choices return.** Nothing in the content was written for this.

**One real fault the watching found, and it is the kind only a frame can show.** The driver's lines came back at the top of the sky. **He is not a mover** — he is baked into the coach with only his head separating, which is why he is an overlay — so a search of the actor registry found nothing and the fallback fired for a man plainly on screen, which doc 30 3.1 forbids by name. **The link was already in the content**: the overlay's states declare `whenSpeaker: 'stage_driver'`, so the overlay that draws a speaker's face is found by asking which one claims him, and his head is its rect on the body it sits on. No id is named in code.

### And the gauntlet failed, correctly, on the first run

**It timed out at 180s having never left the tree.** It drove the driver's conversation by clicking one option after another — which worked while a selection resolved in three lines and stops working the instant it takes seconds, because the hitboxes are gone with the list. **`options` cannot say so**: `presentOptions` reports four throughout, since what changed is whether they are on *screen*. The probe now reports `performing`, and the harness waits rather than clicking through — clicking through would test the skip path every time instead of the performance.

### Step 8 is not carried, and neither is the exit fix

**Step 8 amends doc 30 against a sentence doc 30 wrote to protect** — "Errata 37 is preserved exactly". Steps 1–7 make it *possible*: the reshuffle objection is that removing a used option moves rows under the cursor, and **with the list rebuilt offscreen it never can**. That is the whole of what these steps change about it. **Tyler's ruling.**

**The exit fix is unblocked and not built.** With the list hidden and rebuilt, gating "Thank you for the ride." is a one-line `when` and nothing moves under anyone's cursor — no two-options-on-opposite-gates shape, no four test changes. **The stated shape is correct**: `Condition` is an AND, and `NumericTest` carries `atLeast`/`atMost`, so one counter expresses both "all asked" and "not yet all asked" where three booleans express only the first. **Authoring a flag and a gate is content.**

---

# HOW THIS DOCUMENT WORKS

Entries are added, not rewritten. When the project owner rules on an open question it moves to Part One with the ruling recorded. When doc 34's stop condition lifts — integrated proof action, canonical street loop, safe save/load/title flow all executable — this list is reviewed in one pass and whatever still deserves to be global becomes errata.

**Nothing in this file overrides anything. It records.**

---

## Q10 · ROOM 2'S PLATE IS DRAWN AT ROUGHLY HALF THE GAME'S FIGURE SCALE

**Found by the compiler, and it is the largest open problem in the room.**

Errata 54 fixes the drawn figure heights the whole game shares: far 222, mid
240, near 263. Room 2's plate does not have room for them.

| Doorway | Height on the plate | A man at 0.86 of it |
|---|---|---|
| The Nugget | 134px | 115 |
| The Company | 124px | 107 |
| The Clarion | 110px | 95 |
| The hotel | 104px | 89 |
| The assay office | 102px | 88 |

**A 222px Thad standing at the boardwalk would be nearly twice the height of
every door he is meant to walk through.** The annotation's measured 138px at
the boardwalk was derived independently, from the sleeping dog, and lands in
the same country as the doors — so the plate is internally consistent and
consistently about half the scale the engine expects.

**This is not an annotation error and cannot be fixed in the annotation.** The
depth samples describe the picture correctly; the picture describes a town
whose buildings are too small for its people.

### The options, none of them free

1. **Regenerate the plate at the right architectural scale** — buildings
   roughly twice as tall relative to the frame. Truest, and it costs the
   street we spent today converging on, including the saloon, the mud and
   both act states.
2. **Let a room declare its own figure heights**, with errata 54's numbers as
   the default. Cheapest, keeps every pixel, and means Thad is visibly
   smaller in Room 2 than in Room 1 — which a player crossing between them
   in one walk would see, because beat 11 walks him straight from one to the
   other.
3. **Crop and rescale the plate** so the buildings meet the figure scale.
   Loses roughly half the street's width and most of what makes it read as a
   street.

### EVIDENCE, from the ambient casting sheet — AND A CORRECTION

Three people were generated INTO this plate with no height specified.
Measured back at plate scale: the pie woman about **334px**, the seated
letter-writer about **280**, the map seller far up the street about **172**.

**I first read that as evidence AGAINST regenerating, and it is the
opposite.** I compared the figures to errata 54's canon numbers, saw them
straddle it, and concluded the room merely wanted its own depth curve. The
comparison should have been to the BUILDINGS BESIDE THEM.

Composited at his placed position, the letter-writer stands next to the
posted-notices board, which is 105px tall on the plate. A notice board is
chest-to-eye height; against it a man should be about **122px**. He is 242.
**Exactly twice.**

So the generator drew people at roughly canon human scale, and they tower
over the architecture — which is precisely what the doorway arithmetic
predicted and what a person standing in the scene makes unmistakable. The
casting sheet is CONFIRMATION, not doubt.

**What that changes:** option 2 no longer costs "a field". It means Room 2's
people are drawn at about 120px where Room 1's are 222 — and beat 11 walks
the player from one directly into the other, so the size change happens in a
single continuous move. That is the thing to look at before ruling.

**Tyler's ruling.** Option 2 is what I would build first because it is
reversible and costs no art; option 1 is what I would build if the size
difference reads as wrong on screen, and the only way to know that is to
watch Thad walk from the stage road into Main Street at both scales.


### RESOLVED IN SHAPE: the plate is consistent, and the answer is a CURVE

Tyler: 120px looks far too small — his head barely clears the saloon floor,
which is a six-inch step.

He was right to disbelieve it, and the reason is that **120 was never a
figure height, it was one point on a curve, applied flat.** Two independent
measurements of the plate agree exactly:

| Measured | On the plate | Real size | Implies a 1.75m man is |
|---|---|---|---|
| Saloon porch deck above the mud | 40px | ~0.6m | **117px** |
| Saloon batwing doorway | 134px | ~2.0m | **117px** |

The plate is internally consistent to the pixel. What misled both of us was
comparing across DEPTHS: the porch stands further back than the spot he was
composited on, so it draws higher and a correctly-sized man looks stunted
beside it.

**The plate's own curve**, anchored on that architecture with the horizon
where the mountains meet the town:

    height = 0.369 × (y − 300)

    at the building line (y 620): 118px
    mid-street          (y 700): 148px
    forward             (y 780): 177px
    front of frame      (y 858): 206px

So Room 2 is not a half-scale room. It is a DEEPER room: he arrives small at
the far end and grows to 206 at the front — against Room 1's 222 near. **The
seam beat 11 walks him across is between 222 and 206, not 222 and 120**, and
the shrink happens gradually as he walks away up a road, which is what a road
does.

This costs no art. Room 2 declares `scaling` from its own architecture
instead of the shared zones, and everything already made — the mud, the
saloon, both act states, the dog, the ambient cast — stands.

**Held meanwhile:** the room compiles and passes at CC's a078447 state.
Approach points, the generated walk boxes and the depth curve are written and
reverted, waiting on this ruling, because all three encode a figure scale.

---

## Q11 · `check-no-content-in-code` strips `Error(...)` with a lazy match

**Found by it blaming the wrong line.** The check reported player-facing prose
at `GameScene.ts:914` — an error message that had been there for weeks and had
passed every run — immediately after an edit six hundred lines below it.

`stripDeveloperText` does `.replace(/Error\(([\s\S]*?)\)/g, 'Error()')`. The
match is **lazy**, so an error message containing brackets of its own —

    throw new Error(`No declared clip "${clip}" (${facing}) for mover ...`);

— ends at the `)` inside `(${facing})`, leaving the rest of the template, and
crucially **a dangling backtick**, in the scanned source. The next template
literal added anywhere later in the file becomes that backtick's accidental
partner, and everything between them is read as one enormous prose string.

**Nothing is wrong with either piece of code. The scanner is.**

### Why it is not fixed yet

The obvious repair — count brackets instead of matching lazily — cannot be
done with `String.replace`, because a replacement cannot remove text beyond
its own match. A first attempt did exactly that and stopped stripping error
messages altogether: 37 false positives, every one a legitimate throw. It was
reverted rather than shipped half-working.

The real fix is a small scanner that walks the source once, tracking bracket
depth and quote state together. That is worth doing and is not worth doing in
the middle of an art pass.

**Meanwhile:** `GameScene.speakingBreaks` uses string concatenation where a
template literal would read better, with a comment pointing here. That is the
only place currently working around it, and the workaround is cheap.

---

## Q12 · THE ROOM WARP IS LIVE IN THE PUBLISHED BUILD AND MUST NOT SHIP

`?room=<id>` starts the game in any room, skipping the opening. It exists
because every judgement about Room 2 was being made from stills — the room is
behind a 31-second opening, a dialogue tree, a case to pick up and a mud beat,
and reviewing it meant playing all of that first.

**It is deliberately NOT gated on `import.meta.env.DEV`**, because the whole
point is links that work on the deployed site from a Chromebook, and a
dev-only warp gives links that do nothing.

**Before release:** put the `import.meta.env.DEV` guard back, or the first act
is optional and every reveal in the game is reachable by typing a room name.
It is one line, and it is the kind of one line that ships by accident.

---

## Q13 · PALETTE CYCLING DOES NOT WORK ON ERRATA 54's PLATES

**Doc 18's cycling is the only background animation the game has, and it has
been animating nothing since the plates changed.**

`CyclingBackground` recovers palette indices from the background image by
matching exact band colours, and its own comment explains why that is exact:
*"the pipeline stores indices and colour resolves at export... the reservation
rule makes the recovery exact."* True while plates were exported from the
locked 256-colour palette.

Errata 54 retired that palette. Every shipping plate is now a generated image,
graded to Room 1's levels and shadow-lifted. **Measured, not assumed:** of
`hobs_lamp`'s four reserved band colours, **zero** pixels appear anywhere in
`room-01-stage-road.png`. The element is declared, loaded, resolved, scanned
for — and finds nothing.

**Nothing failed, because a scan that finds nothing looks exactly like a room
with nothing to cycle.** `check-cycling-lands` is now the difference, and
`hobs_lamp` is marked `dormant` rather than deleted: the intention is right —
a carried flame in still air is the one thing in Room 1 that ought to move.

### What it would take

Cycling needs a mechanism that does not depend on an indexed plate. The
options, none costed:

1. **A lamp-glow sprite**, additive, anchored to the lamp and pulsed — which
   is what Room 2 already does for the saloon and the office lantern, except
   those do not pulse. Cheapest, and it generalises to every lamp in the game.
2. **Ship the index map** alongside each plate, so recovery does not depend on
   colour uniqueness. Truest to doc 18 and costs a second file per room.
3. **Accept still lamps.** Defensible — nobody has noticed for weeks — but the
   Nugget has a seven-candle chandelier and a stove with fire in it, and a lit
   interior that does not move is a photograph of a warm room.

**RULED AND BUILT: option 1.** `RoomLamp` declares a lamp already painted into
the plate, and the renderer lays a small warm additive glow over it that rises
and falls on two sines of different periods, so the flicker never ticks. It
runs after the plate and before the people, because a lamp lights the room it
hangs in and the figures are lit by `match-local` at cut time — a different
job, done once rather than every frame.

**It modulates light rather than creating any**, which is the whole difference
between it and the additive glow that failed on Room 2's doorways. That one
tried to make a dark doorway look lit and read as fog, because a lit interior
needs *content*. Here the lamp is drawn, the fire is drawn, and the glow only
makes them move.

Measured on two settled frames: the saloon's pool changed by −0.96 with a warm
bias, and a patch of dark mud in the same frames changed by 0.00. Light moves
where there is a lamp and nowhere else.

Six lamps declared — Main Street's saloon doorway, the office lantern hung for
the map seller, and the Company's windows; the Nugget's chandelier, stove and
bar lamps — each on its own rate and phase so no two breathe together. The
stove flickers hardest because it is a fire in a box; the Company's windows
barely move, because they can afford good oil.

`hobs_lamp` stays dormant until Room 1 gets the same treatment.

**And one thing was fixed on the way:** `tools/lib/png.mjs` could not open an
RGB PNG at all — only RGBA — so every shipping plate was unreadable to every
check. The first version of `check-cycling-lands` caught that as
`catch { continue }` and reported "0 of 0 elements" and passed. The reader now
handles colour type 2 and normalises to RGBA, and the check fails loudly when
it cannot read its input.

---

## Q14 · MAIN STREET'S TWO OCCLUSION PLANES ARE UNREACHABLE, AND THE COMPILER PUTS THEM THAT WAY

**Found by the four-panel room proof on its first run against Room 2.**

`main-street.json` declares two occlusion planes, `level: 1` and `level: 2`,
each with a mask on disk that boot loads. Every walk box in the room declares
`clipPlane: 12`.

`Renderer.masked()` resolves a plane by level —

    const plane = planes.find((candidate) => candidate.level === level);

— finds nothing for 12, and, with no state mask either, calls `draw()` straight
through. **So no figure in Main Street is ever occluded by anything.** The
lumber stack, the hitching rail and the water trough are all in front of Thad
in the picture and behind him in the draw. Two mask PNGs load, cost memory, and
occlude nobody.

`clipPlane: 12` is written by `tools/compile-room.mjs`, hard-coded, so this is
not a one-room mistake — it is what the compiler will emit into every room it
builds next.

**Nothing in the suite could see it.** `check-asset-paths` confirms the masks
exist. `check-boot-assets` confirms they are loaded. `check-walk-boxes` checks
routing and default verbs. The one thing nobody asked was whether the number on
the box names a plane the room has, and the answer is only visible in a frame.

### What the room's own notes already say, and why this is still a ruling

The plane notes are explicit:

> plane 1 — "The near corner alone — the lumber stack and the wagon wheel. An
> actor in the near mud is masked by this and by nothing else"

> plane 2 — "Plane 1 plus the hitching rail and the water trough… An actor in
> the middle band or further is behind all of it."

That reads as: **near mud → 1, everything further back → 2**, with the
boardwalk lip's assignment the only genuinely open question. But which band is
"the near mud" is a placement judgement about a picture, and doc 22 section 5's
rule — an actor is masked by ITS OWN plane, not by a union — means getting it
wrong puts a man in front of a trough he should be behind. **Not fixed here.**

**And there is a second question underneath it.** `types.ts` still describes
`clipPlane` as "carried now and read by nothing yet", which stopped being true
when `masked()` was written. A field the schema calls unread and the renderer
reads is a field two people will disagree about.

---

## Q15 · THE COMPILER AND THE ANNOTATOR ARE EACH HARD-WIRED TO ONE ROOM

Doc 46 part four's eight-step table is the factory. Steps 3 and 4 are the
compiler and the annotator, and neither can be pointed at a fourth room.

**The compiler**, `tools/compile-room.mjs`, in two places:

    const ROOM_FILE = { 2: 'main-street', 3: 'nugget' }[room];
    const annPath = `reference/room-0${room}/annotation.json`;

The first is a two-entry table; the second cannot express a room number above
nine.

**The annotator**, `tools/annotate/room.html`, is Room 2 throughout: the
`<title>`, the `<h1>`, the plate `src`, the note about the plate being
3700×864, and the entire `ITEMS` array — fifteen literal hotspot and exit
records — are written into the page.

Neither is hard to generalise and neither is generalised, and doc 46 part four
puts Tyler in the annotator for fifteen minutes per room. **For any room but
the second there is no annotator to be in**, and every rect, the walk box, both
depth samples and the arrival point come from it. This is the narrowest gate on
building a fourth room.

---

## Q16 · `check-item-names` MEASURES AGAINST A 320px LINE AND A VOID FONT — **FIXED**

**Fixed under errata 62.** The face is not void, and the measurement was wrong in three independent ways at once — a 320-space width, a 1920-space inset subtracted from it, and an unscaled glyph measurement — which is why it never failed. It now composes `ui.sentence.itemTemplate` with the longest verb label and the longest target name, measures at `PANEL_GLYPH_SCALE`, and compares against the sentence line's real 1848 screen units. Worst case in the build: 1296 of 1848, **70%**. Two negative witnesses fire: an over-long label, and a drift between the constant here and the engine's.

    const room = 320 - panel.sentence.x * 2;

**320 is the pre-errata-54 native width**, and the font it measures with is
`art/ui/font-5x7.json`, which errata 54 voids and forbids replacing without a
ruling. The check reports "the sentence line holds 248px, about 41 glyphs" —
a true statement about a presentation the project no longer has.

**Deliberately not changed.** Widening it to 1920 makes it pass on every
conceivable label, which is a vacuous assertion bought with a one-line edit and
is worse than an assertion that is honestly measuring the wrong thing. It is
blocked on the font ruling, and the note is here so the number is not mistaken
for a live constraint.

---

## Q17 · SEVEN SHIPPING PLATES CANNOT BE READ BY ANY TOOL IN THIS REPOSITORY

Recorded as a measurement rather than a new finding — Q17 above lists the
320-native assets — because the number is now exact and the consequence is
sharper than "still native".

`tools/lib/png.mjs` handles colour types 2 and 6 and refuses type 3, correctly:
an indexed PNG needs its palette and a reader that guessed would mis-decode
silently. Seven of the eleven files in `art/backgrounds/` are colour type 3 at
320×144:

    room-05-assay-office   room-13-undertakers   room-18-hotel-lobby
    room-19-thads-room     room-29-high-ridge    room-36-main-street-dawn
    title-screen

**So every pixel check in the project is blind to them.** `check-cycling-lands`
would fail loudly on one now; the art gates report `UNREADABLE`. That is the
right behaviour and it means the four rooms behind those plates cannot be
proven until the plates are regenerated at errata 54's presentation.

---

## Q18 · THE IMAGE API PATH HAS NEVER BEEN CALLED — **CALLED, AND IT WORKS**

**Closed by `node tools/art/smoke.mjs` against the live API.** `gpt-image-2`
answered both operations. What Q18 named as unproven — the request shape, the
response shape, and whether the model returns an image at the size asked for —
is now proven, and the ledger holds the evidence rather than this paragraph:

| | |
|---|---|
| generate | 1024×1024 RGB, 826,382 bytes, 231 billed tokens, gates PASS |
| edit | 1024×1024 RGB from `art/backgrounds/room-01-stage-road.png`, 1,195,960 bytes, 3,286 billed tokens, gates PASS |
| promotion | **refused** — `smoke-test-card attempt 1 is not visually accepted` |
| the reference plate | `3e4582227ac8` before, `3e4582227ac8` after |

Every number above is a row in `art/staging/ledger.json`, which is the record;
this table is a pointer to it.

### THE FIRST RUN FAILED, AND IT FAILED BY LYING ABOUT WHY

Worth more than the success. The adapter reported:

> `api.openai.com is not in this environment's network egress allowlist, so no
> request left the machine.`

**Every word of which was wrong.** `curl https://api.openai.com/v1/models`
returned **401** from the same container at the same moment — the API
answering, which is a host that is plainly reachable. Node's built-in `fetch`
does not read `HTTPS_PROXY`; `/root/.ccr/README.md` says so in as many words
and names the fix (`NODE_USE_ENV_PROXY=1`, Node ≥ 22.21). The request never
reached the proxy's forward path, the proxy refused the direct connect with a
403, and the adapter had exactly one branch for a 403 and it named the wrong
cause.

The failure classes were required to stay distinct precisely so this could not
happen, and one of them had been written to swallow four others. `post()` now
separates them, and the proxy-bypass case is diagnosed by asking whether this
process is proxied at all rather than by reading the status:

| status | class |
|---|---|
| 403 + egress text, **process bypassed the proxy** | the client's fault, not the network's — re-exec under `NODE_USE_ENV_PROXY=1` |
| 403 + egress text, proxied | genuinely not in the allowlist; nothing left the machine |
| 401 | credential — not network, not request |
| 429 / 402 / other 403 | billing, rate limit or model access |
| other 4xx | the adapter built a bad request |

`smoke.mjs` re-execs itself under the flag when a proxy is configured, so the
first symptom of this class is now a working run rather than a wrong sentence.

**A diagnostic that names the wrong cause is worse than one that says nothing**,
because it is acted on. This one would have sent somebody to ask for an
allowlist entry that already existed.

### THE CAP WAS PROVEN BY REACHING IT, NOT BY READING IT

Four attempts against a per-asset cap of six is a cap that has not been
exercised. Lowering `attemptsPerAsset` to 4 — a count already reached — and
re-running gave the negative witness: exit 1, the refusal named the asset and
the cap, **and the ledger gained no row**, because the budget is read before
the call and not after it. `caps.json` was restored byte-identical afterwards.

### WHAT IS STILL UNPROVEN

- **Nothing has been promoted, and nothing should be.** `visual_accepted` is
  Tyler's field. The smoke test's own third step is the promotion refusal.
- **No plate-sized generation.** Both calls were 1024×1024, which is what the
  API offers; a 1920×864 room plate is not a size the model returns, so how a
  generated plate reaches its shipping dimensions is unruled and is not this
  issue.
- **Gates 1–6 passed on a flat grey test card**, which is a weak subject by
  design. Calibration against real art is `proofs/calibration/gate-calibration.md`.

---

## Q19b · A HELD BEAT WAS REPORTED AS A PLAYING BEAT — **FIXED**

`CarriedBeats.current` returned `beats[at]` whether or not the beat had begun.
Doc 17 beat 9 declares `awaitFlag: T_HOB_SPOKEN` — Q63, ruled: Hob stands at
the roadside with his lamp until somebody addresses him — so the probe reported
"beat 9" for a beat that was armed, holding, and had dispatched nothing.

Doc 44 defines the reported beat as "the beat of the last step dispatched". A
held beat has dispatched none, and reporting it makes a correct wait
indistinguishable from a hang: a route sat out a ninety-second deadline against
a game doing exactly what Q63 says it should.

`current` is null while held, and `waiting` sits beside it, so "no beat is
playing" and "a beat is waiting for the player" are separable facts. The probe
carries both.


---

## Q20 · BOTH OF MAIN STREET'S OCCLUSION MASKS DESCRIBE A STREET THAT NO LONGER EXISTS

**Q14 is ruled and fixed; this is what was underneath it.**

The clip planes are right now — Tyler ruled boardwalk, mud_far and mud_mid to
plane 2 and mud_near to plane 1, the annotation authors them per band and the
compiler carries them through. What the planes point at is stale.

**Measured.** Both masks are 320×144 — errata 54's voided presentation, Q17 —
and `Renderer.masked` stretches a mask to the room's 3700×864 at draw time,
which is a defined behaviour and is not the same as authoring one at room
resolution. Stretched:

| Plane | What its mask draws | What the plate has there |
|---|---|---|
| 1 | a wagon wheel, eight spokes, and a slab beside it, across x0–940 of the near mud | open mud |
| 2 | plane 1, plus a hitching rail — two posts and a crossbar — at x1110–1640, and a plain rectangle at x2480–2930 | open mud, and no rail anywhere on the street |

Neither touches the water trough at x1862–2017 y543–605, which plane 2's own
note says it contains. They were authored against an earlier and narrower
Main Street.

**Both are marked `maskPending`.** The renderer skips a pending plane and
draws through — which is what the room did anyway while every box named a
plane that did not exist, so nothing regresses. Activating a stale mask would
be worse than the inert state it replaces: a man in mid-street would be erased
from the knees down by a rail that is not drawn.

### The part worth keeping is how it was nearly missed

The first reading of the overlay recorded plane 1 as CORRECT, on the grounds
that it "traces the wagon wheel's spokes exactly". It traces its own. **A mask
rendered over a background produces a highlighted shape whether or not there
is a shape underneath**, and the only thing that settles it is turning the
mask off — which is what panel C of the room proof does: a man standing in the
middle of that wheel, drawn whole, with nothing to be behind.

`check-occlusion`'s geometric overlap test passes both masks comfortably, at
31% and 12% of the drawn figure. That is the whole limit of what a machine can
say here, it is stated in the check's own header, and it is doc 44's first
honesty in miniature.

**What it needs:** both masks regenerated at 3700×864 against the current
plate, from the objects that are actually in it. That is art, and Tyler's.

---

## Q21 · FOUR CANDIDATE FACES ARE RENDERED IN THE LIVE UI, AND THE CHOICE IS UNMADE — **CHOICE MADE: NONE OF THEM**

**Closed by errata 62.** The existing bitmap face is retained. The four candidates, the sheets and `PreviewFont` are retained as diagnostics and are not a shipping path. See `docs/51-font-decision-sheet.md`, whose banner records the ruling.

Q16 stands. Errata 54 voided the 5×7 and forbids anyone but Tyler choosing
what replaces it; nothing here chooses.

What exists now is the thing the ruling needs: `tools/font/compare.mjs` drives
the real game to two UI states — a dialogue frame and a play frame — in each
candidate and in the current bitmap face, and writes full-frame sheets.
`docs/51-font-decision-sheet.md` is the sheet.

**Two sizes, because they are not the same question.** The 5×7 packs caps,
x-height and descenders into seven rows; a real face spends a third of its em
below the baseline. So a candidate given the bitmap's line budget reads
visibly smaller than the control, and one given the bitmap's cap height eats
more of a panel that Q35 already measured at 210 of its 216 rows. Both are
rendered.

**Glyph coverage is settled and is not the decision.**
`tools/font/check-candidates.mjs` reads each face's cmap directly — asked of
the font file, never of a canvas, because a browser substitutes a missing
glyph silently and `fillText` always draws something. All four cover the 78
characters the current content draws, including the seven CLAUDE.md names:
`' ' " " — – …`


---

## Q22 · ROOM 5's CHARACTER HAS NEVER BEEN CAST — **CLOSED**

**Winnie has no approved visual reference anywhere in the repository.**
`reference/casting/` holds the coach, the driver and Hob, and nothing else.

She is not a background figure. Doc 25 gives Room 5 four newly written
examine subjects and one of them is **HER PEN**; doc 14's exit note calls the
oiled, self-latching door "Winnie's character in two lines"; doc 01 makes her
the keeper of the second ledger, which is the fact the game turns on. The
assay office is her room in the sense that matters — its tidiness is a
description of a person the player has not met yet.

**So slot E of the global visual baseline is unsatisfied for Room 5**, and
`tools/art/baseline.mjs` refuses a room-art call on that basis. That refusal
is the point: with no approved Winnie in front of the model, a generation of
the assay office containing a figure produces **a Winnie the model invented**,
and inventing a character's appearance is inventing content.

**This is a casting decision and it is Tyler's.** Composition-master order
applies when it is made — one canonical design first, poses derived from it,
never separate fresh generations of the same person.

**It does not block a plate with no figure in it.** If Room 5's first
generation is the empty room, E is not applicable to that call and the
baseline entry should say so rather than being waived silently.

**CLOSED 2026-09-04:** Tyler's visual ruling accepts Winnie's canonical design, her
behind-counter presentation and her relights (staging ledger, winnie attempt 3,
`visual_accepted: true`). Slot E is satisfied by an approved reference.

**Status after the Room 5 pilot (kept for the record):** a CANDIDATE Winnie exists —
`art/staging/room-05/composition-master-02.png` (design) and
`art/staging/room-05/winnie-02/` (sheet), generated with the Room 1 casting
master transmitted first and recorded in `art/staging/ledger.json`. It is not
approved. This stays open until Tyler accepts or rejects her at the visual
gate; it is that gate under another name, not a content gap.

---

## Q23 · ROOM 5 HAS NO ANNOTATION, AND THAT IS NOT A CONTENT PROBLEM

Recorded separately from Q22 because conflating them would hide both.

`reference/room-05/` does not exist. There is no annotation, so there are no
walk boxes, no scale curve, no entrance, no exits geometry, no occlusion
planes and no proof points — and `tools/compile-room.mjs` refuses rather than
guessing, which is correct behaviour and the reason it was generalised.

**Missing geometry is not permission to infer geometry.** Room 1's walkable
band was measured against its approved plate and Room 2's clip planes were
authored by Tyler one box at a time, because both are readings of a PICTURE.
Room 5's picture does not exist yet: the shipping plate is the obsolete
320 × 144 indexed legacy art. Geometry cannot precede the plate it describes.

**Order, therefore:** plate → annotation → compile → proof. The readiness gate
reports content and geometry separately so that this can be seen rather than
averaged.

**Status 2026-09-04:** the plate and the geometry are Tyler-accepted (visual ruling); what
keeps this open is promotion — the shipping path still holds the legacy plate
until the manual playthrough and the logged promotion step.

**Status after the Room 5 pilot:** that order was followed.
`reference/room-05/annotation.json` exists and is bound by hash to the
candidate plate `art/staging/room-05/plate-02/`; the room compiles and both
proofs pass with the candidate loaded live. The shipping plate at
`art/backgrounds/room-05-assay-office.png` is still the legacy 320×144 indexed
art, so `GEOMETRY READY` stays NO until the candidate is promoted — which is
Tyler's visual gate, not geometry work.

---

## Q24 · THREE ROOM 5 REFUSALS HAVE NO HOTSPOT TO LIVE ON, AND THE QUEUE BENCH HAS NO LISTEN — **RULED**

Found by compiling Room 5 from its documents. Two kinds of gap, both reported by
the compiler on every run and neither invented around.

**Unhoused refusals.** `docs/49-wrong-answers.md::ROOM 5 — ASSAY OFFICE, FRONT`
writes OPEN and CLOSE for **THE WINDOW (AJAR)** and PULL for **THE BRASS
PLAQUE**. Neither subject has a LOOK or a LISTEN anywhere — not in doc 05's
Room 5 section, not in doc 25 — so neither can be a hotspot without inventing
its examine lines. The three refusals are carried nowhere; the annotation
declares them `unhoused` under this heading and the compiler prints them by
name. **Decision needed:** write LOOK/LISTEN for both, or fold the window's
lines into THE WINDOW SIGN and strike the plaque's.

**The queue bench.** Doc 05's act-variant block
(`docs/05-examine-layer.md::ROOM 5 — ASSAY OFFICE, FRONT#2`) writes THE QUEUE
BENCH a LOOK for acts 2–4 and nothing else; doc 49 gives it USE and PUSH in Act
I voice ("I have been all nine, on different days"). **No LISTEN and no repeat
variants exist for it anywhere.** It compiles as an act 2–4 hotspot and three
validators say so: `check-examine-lines` (no LISTEN), `check-written-content`
(one LOOK variant; LISTEN unhandled, no pool) and `check-flag-order` (its ACT
gate has no writer until doc 48's S1 is built). The first two are a one-line
creative gap and are Tyler's; the third is the same debt Main Street's Panel D
carries, now visible as a red check rather than a failed panel because the
bench is gated by errata 60's counter rather than by a cutscene.

**None of the three checks was weakened, excluded or disabled.** The room is
otherwise candidate-complete around them.

### Owner rulings, 2026-09-04 (Tyler), applied at the pilot's head `500f15a`

1. **THE QUEUE BENCH remains a hotspot.** It is an intentional Act 2–4 Room 5
   state variation. Its LISTEN now lives beside its LOOK in the act block
   (`docs/05-examine-layer.md::ROOM 5 — ASSAY OFFICE, FRONT#2`) and its LOOK 2–3
   and LISTEN 2–3 in doc 25's repeat block
   (`docs/25-rooms-05-07.md::Repeat variants for doc 05's five`). Doc 49's USE
   and PUSH stand. All six lines reach `content/rooms/assay-office.json` by
   the normal compiler path; nothing generated was hand-edited.
2. **THE WINDOW (AJAR) and THE BRASS PLAQUE are not Room 5 hotspot subjects.**
   The wrong-answer layer does not create hotspots to house orphan responses.
   Their three refusals (WINDOW CLOSE, WINDOW OPEN, PLAQUE PULL) are struck
   from `docs/49-wrong-answers.md::ROOM 5 — ASSAY OFFICE, FRONT`. No LOOK or
   LISTEN was written for either; the window's lines were **not** moved onto
   THE WINDOW SIGN (opening a sign is semantically wrong) and the plaque's
   line was **not** moved onto another hotspot. The annotation's `unhoused`
   block is gone because nothing is unhoused.
3. **ACT and `T_RACCOON_NAMED` are out of scope here.** The global ACT
   progression writer (doc 48 S1) and the raccoon-naming writer are unbuilt
   content belonging to other rooms. `check-flag-order` stays red on those two
   gates and was not weakened, excluded or falsified; the bench's own ACT gate
   stands as authored, its pre/post behaviour proven by the pilot harness.

After the rulings: `check-examine-lines` and `check-written-content` pass;
`check-flag-order` is the one red in the suite and it is not Room 5's.

---

## Q25 · THREE ENGINE FAULTS THE ROOM 5 LIFE PROOF FOUND — **FIXED**

All three are shared behaviour and were found by driving Room 5 for a minute
with the probe on. None is Room 5's; each would have bitten the next room.

1. **A verb stayed selected through a conversation.** TALK TO on an ambient
   opened the tree without resetting the verb — every other path resets in
   `GameState.interact` — so the first click after talking to Winnie was
   "talk to the back-room door" and the exit never transited. Reset when the
   conversation is queued (`GameScene`, errata 28b).
2. **An NPC's hit box swallowed a hotspot beside her.** The click handler
   tested the ambient box before hotspots, and Winnie's 445-row box covered
   HER PEN's stand at her right hand, so PICK UP reached the people pool and
   the authored refusal never played. A hotspot rect under the click now wins
   for every verb but TALK TO.
3. **Verb lines were spoken with no speaker.** `setSay(result.say)` left the
   speaker null; the renderer's fallback ink hid it, and the probe reported
   the last speaker it had seen, so an override of Winnie's read as the stage
   driver's. Verb lines are Thad's and now say so.

Plus a measurement the life proof made possible: in a room with no handover,
`control` is never `player`, so a route cannot wait on it; the route vocabulary
gained `waitFor { says }` to land a capture inside a reading hold instead.

---

## Q26 · ROOM 5 NEEDS A NIGHT STATE BEFORE IT SHIPS, AND TWO INTERIOR LINES STILL SAY DAYLIGHT

Opened by `docs/00-errata.md::64 · ACT I MAIN STREET IS NIGHT, AND ROOM 5 INHERITS THE STREET'S STATE — OWNER RULINGS`,
on the audit in `proofs/room-05/time-of-day-audit.md`.

**The night state.** Room 5's only candidate plate is daylight (now classified
ROOM 5 — DAY VISUAL CANDIDATE, kept, not rejected). The Act I route is Room 1
night → Main Street night → Room 5 night, so the room cannot be promoted for
Act I play until a night plate/state exists, derived from the same accepted
composition and geometry (errata 64c). It is not made until Tyler has reviewed
the day candidate's composition, style, scale and Winnie. Selection mechanism
per errata 64d: check the existing conditional architecture first; a room file
today carries one `background`, and nothing gates a plate on a flag.

**The night state exists (2026-09-04, the final pilot image operation):**
`art/staging/room-05/plate-03-night/candidate-1920x864.png` (72124eb6f213),
an edit of the DAY source with lighting only — every annotated rect
phase-correlates at (0,0) against the day candidate — plus Winnie's sheet and
the ink stand relit with identical alpha. Proved live through the candidate
override (`renders/proofs/assay-office-night/`). It is a CANDIDATE awaiting
Tyler's review. **What stays open here is the selection mechanism** (errata
64d): a room file carries one `background`; nothing gates a plate on a flag;
the night files are named by no content record. Since the hanging work lamp
(Tyler's post-pilot revision, `art/staging/room-05/LAMP.md`) a room lamp can
carry an `amountByState`, and the proofs select the state with the dev-only
`?state=night` (`engine/dev/RoomState.ts`) exactly as they select a candidate
plate. That is the seam the mechanism plugs into; it is not the mechanism.

**2026-09-04, visual ruling:** Tyler accepts the night candidate as lifted, the lamp and
its task light. Still open here: the selection mechanism, and promotion after
the manual playthrough.

**Two authored lines still say daylight** about Main Street from inside its
neighbours, and they are Tyler's to reword, as the mud line was:

1. `docs/16-room-03-content.md::THE FRONT DOORS → Room 2` — LOOK 2 *"Daylight
   past them. It is always a surprise."*
2. `docs/26-batch-a.md` — the hotel's STREET DOOR LOOK 3 *"Daylight, past it.
   It is always brighter than I remember."*

**Both RESOLVED by Tyler's wording, 2026-09-04:** LOOK 2 now reads *"The street
past them. It is always a surprise."* and LOOK 3 *"The street, past it. It is
always brighter than I remember."* — deliberately time-neutral rather than
"night", because the same reusable variants may be met under later daylight
states. Room 18's line reached `content/rooms/hotel-lobby.json` by the
normal path (the extractor). **Room 3's did not:** `content/rooms/nugget.json`
has no live writer — `node tools/compile-room.mjs 3` refuses on a pre-existing
doc 16 / doc 05 naming mismatch ("PIANO", "BAR", … which doc 05 does not name;
it refused identically before this change) and the extractor does not own the
Nugget's exits — so `nugget.json` still carries the old LOOK 2 and is not
hand-edited, per CLAUDE.md. It is stale on that one line until Room 3's
compiler path is made to agree with doc 16's headings, and the extractor's
staleness check does not cover it. Reported, not patched around. Nothing else in canon now
states a daytime base street: doc 13 is corrected, errata 43 and the two "only night
exterior" lines carry pointers to errata 64, and doc 12's "warm low sun" sits
in a document already superseded as final spec.

## Q107 · Thad is two drawings, walks at one screen speed whatever his size, and glances aside in somebody else's body — **RESOLVED; HYBRID PROFILE WALK OWNER-ACCEPTED 2026-09-05 AND FROZEN**

Tyler's manual Room 5 playthrough (2026-09-04) reported three protagonist defects: the walking Thad does not look like the standing one; walking in Room 5 is tediously slow; a stationary Thad facing the counter sometimes shows a mid-stride pose. One inconsistent protagonist system, three symptoms. Full record: `proofs/thad/audit.md`, `proofs/thad/locomotion.json`, `renders/thad-continuity-sheet.png`, `renders/thad-family-current.png`. Spec: `docs/52-thad-continuity-spec.md`.

**Two casting families.** Every `stand` and `idle` clip, the profile `idle-break`s and `recoil`s, and `walk-front` are rigged from the standing casting stills (`reference/casting/thad-stand-*-src.png`, `thad-walk-front-src.png`; Q77's "nine generations"). `walk-left`, `walk-right`, `walk-back`, the head-on `idle-break`s and `recoil`s, `lookup` and every chore clip are rigged from the earlier generations (`thad-profile-right-approved.png`, `thad-profile-left.png`, `thad-front.png`, `thad-back.png`): a wider, bigger-headed, shorter-coated drawing of the same man. Standing beside walking is the two families side by side. Left is not mirrored from right in that family; in the still family it is (stand-left is stand-right mirrored, difference 4/255).

**The mid-stride idle.** `thad-idlebreak-back` was rigged from `thad-back.png` with `--pose striding`: its "glance" is the old drawing standing mid-step, and the idle-break timer played it for six seconds every 7–18 s of standing still. Not a state-machine fault — `Actor.clip` was `idle-break`, correctly — an art-ownership fault. Fixed by re-rigging `idlebreak-front/back` and `recoil-front/back` from the standing stills, and `walk-back` with them (the far blob re-derived); `tools/check-stationary-family.mjs` now fails any stationary clip whose source is not its stand's. Two rig faults found on the way: the head-on recoil rolled the upper body with a wrapping `np.roll` (the head's top rows reappeared under the soles), and the despill left half-spilled pixels over the fringe check's line.

**The speed.** `Actor.advanceWalk` applied the declared 194 px/s as screen pixels at every drawn height, while the gait advances from distance over a stride that IS scaled to height. Room 1 at 242 px: 0.77 body heights/s, 1.8 strides/s. Room 5 at 515 px: 0.36 heights/s, 0.85 strides/s — half the pace and half the leg rate, which is exactly "extremely slow". Classification **A, global calibration** (with the cadence mismatch as its consequence). Fixed: the declared speed is his pace at the record's 240 and scales with drawn height, the rule `advancePath` already used. Room 1 is unchanged; Room 5 goes to ~416 px/s; Main Street, whose figures are 105–206 px, goes from 194 to 85–166 px/s — perspective-correct and to be judged by feel. `?pace=` (dev-only, `engine/dev/Pace.ts`) multiplies the pace for Tyler's A/B/C comparison on one build.

**The profile walk cannot be re-rigged from the still.** The standing profile has the legs together and the arms against the coat; `character.py` finds no hem to split and no arm to swing. **Reported to Tyler as requiring one new generation**: the still identity striding, facing right, mirrored for left. No image operation spent.

### Factory v2 lessons (recorded, not implemented)
- **Character continuity.** A character is not production-ready when one canonical still is approved. Acceptance is `canonical identity → directional poses → movement states → runtime transition proof`, and every movement clip is rigged from the accepted identity's own generation, never from an earlier one. The stationary-family check is the mechanical half; the continuity sheet at one displayed height is the human half.
- **Locomotion.** A room is not locomotion-ready because every destination is reachable. Room acceptance measures actor scale, screen speed AND body-heights-per-second, animation cadence, idle → walk, walk → idle, near/far traversal, and approach/final-facing, in the live build.
- **Character locomotion art.** A walk is authored as a family of complete poses (a sheet on a common baseline, every figure whole) and cropped whole; it is not puppet-rigged out of a single still. Five cuts of cutting, extending and rotating limbs from one stride still each moved the seam rather than removing it (gallop, dance-arm, severed elbows, floating forearm, then stiffness when the arms were frozen), and each cost a review round. The one-op multi-pose sheet gave a usable cycle in one extraction. Ask the sheet for the contralateral half explicitly and check it was drawn before extracting.
- **Animation state ownership.** Stationary actors must not leak locomotion frames. Runtime proof exercises prolonged idle (a minute, every frame change logged) and repeated arrival transitions; `tools/gauntlet/frames.mjs` is that instrument.

**Profile walk, next day (2026-09-05).** Tyler authorized ONE global character image operation, `thad-profile-walk-continuity` (cap 1/1, its own ledger asset, not a Room 5 budget): the Family-A identity striding right in profile, edited from `thad-stand-right-src.png` with the other three stills and the front-walk still transmitted. The result (`art/staging/thad/profile-stride-01.png`, untouched) rigged first try: `walk-right` from it at swing 0.7 / knee 0 (chosen from four variants on a sheet), `walk-left` by `tools/rig/mirror-clip.py`, both at the standing family's figure height 625. The Family-B walks are preserved under `art/staging/thad/previous/`. Two pipeline faults surfaced and were fixed: the rig filled pure-key holes and kept them magenta, and the downscaler rounded premultiplied colour to bytes before resampling (purple edges at faint alpha). Sheet: `renders/thad-profile-walk-continuity.png`; record: `proofs/thad/profile-walk.json`. **`visual_accepted` is not set; Tyler is the gate.** The seven profile chore clips remain Family-B continuity debt, inventoried in that record.

**Second cut, same day.** Tyler: the profile is right and he gallops. The rig had been adding its hip sine to the source's own stride, so the legs opened and closed with the same leg leading every frame -- true of every profile walk this tool ever made, hidden at 240px in Room 1 and plain at 515 in Room 5. `--level-limbs` measures each limb's angle in the source and subtracts it, so the cycle swings hanging limbs and the legs alternate; the planted sole is grounded per frame so the head bobs instead of the feet floating. One cycle is now two steps, so the record's `strideLength` is re-measured at 149 (was 102): cadence only, translation untouched. No image operation.

**Third cut, same day.** Tyler: the rear arm stays up at the waist through the cycle. The source's forward arm is bent at the elbow, and what `split_arms` lifts of it is the forearm alone, attached by its upper end to the coat at waist height; swung about its own centre it kept the hand at the waist front to back. Each lifted arm now hangs from its attachment to the coat and swings about the shoulder above it, and the coat-edge slivers the split leaves on an arm go back to the coat. No image operation.

**Fourth cut, same day.** Tyler: the cut edges show and the arms dangle at the elbows. A lifted piece rotated about its own cut opens a wedge there. The arms now get the legs' recipe: levelled, extended up to the shoulder by repeating their top rows, then swung about the shoulder, so the join is at a real joint and covered. No image operation.

**Intact-upper-body cut, same day -- REJECTED BEFORE COMPLETION.** Tyler rejected the fourth cut and ruled the arms must stay part of one intact silhouette; a candidate was built on that rule (the standing frame above its hem over the stride source's levelled legs: `character.py --legs-only`, `tools/rig/intact-walk.py`), and Tyler then rejected the no-arm-movement direction itself before proof finished. It is preserved, not adopted, under `art/staging/thad/candidates/intact-upper-body/`; the shipping profile walk remains the fourth cut. A new direction is pending.

**Authored whole-body cycle, same day — CANDIDATE.** Tyler's direction after five cuts: stop rigging a walk out of one still; author the walk as complete poses and crop them whole. ONE global op, `thad-profile-walk-cycle-authoring` (1/1, gates PASS): a sheet of six right-facing Family-A walking poses on magenta on a common baseline, `art/staging/thad/profile-walk-cycle-01.png`. Every pose is complete and connected. The sheet's second half repeats the first with the same leg leading (silhouette IoU 0.91 / 0.87 / 0.97 against poses 1–3), so the cycle is the three distinct poses — contact, recoil, passing — and one cycle is ONE step; nothing was duplicated and no limb was cut, rotated or transplanted to fabricate the contralateral half, which would need a second op only Tyler can authorize. `tools/rig/cut-cycle-sheet.py` keys each figure whole, scales all three by one factor (0.9843) so the upright pose is the stand's 625, and places them on the stand's canvas with soles on its ground row; `walk-left` is the frames mirrored whole. `strideLength` re-measured at 83 (one step, foot-centre separation 215 on 625). The fourth cut is preserved under `art/staging/thad/candidates/fourth-cut/`, and `candidates/README.md` indexes every candidate's status. Sheet: `renders/thad-profile-walk-continuity.png`; live strips `renders/thad-profile-walk-live-right.png` / `-left.png`; record `proofs/thad/profile-walk.json` §authoredCycle. **`visual_accepted` is not set; Tyler is the gate.**

**Opposite half, same day — NOT ACQUIRED, STOPPED.** Tyler reviewed the three-frame cycle: identity and anatomy right, but the arms scissor because the runtime loops one half of the gait. He authorized ONE op, `thad-profile-walk-opposite-half` (1/1, gates PASS), for about three poses supplying the other half (far leg forward, near arm forward), with the approved sheet transmitted as the image edited. The result, `art/staging/thad/profile-walk-opposite-half-01.png`, is three complete figures of the right man -- and its contact pose repeats the existing contact's polarity (near sleeve back over the coat, far hand forward, same leading leg; normalised silhouette IoU 0.909 against it). Only the two transition poses carry the near hand forward. Per the brief's failure condition nothing was installed, no half was used twice and no surgery was done; the three-frame candidate stands as it was. Evidence: `renders/thad-profile-walk-opposite-half-diagnosis.png`, `proofs/thad/profile-walk.json` §oppositeHalf. The cutter now takes two sheets under one scale (`--also`) for whenever the opposite contact is acquired. **Next attempt needs Tyler's authorization.**

**Opposite contact, same day — NOT ACQUIRED, STOPPED.** Tyler narrowed the ask to the one missing pose and required a deterministic pose guide rather than prose. `tools/pose/opposite-contact-guide.py` draws it (`reference/pose/thad-opposite-contact-guide.png`: far leg forward heel down, near leg trailing heel up, near arm forward, far arm back, viewer-side limbs in blue over the body) and the do-not-copy composite beside the shipping contact. ONE op, `thad-profile-walk-opposite-contact` (1/1, gates PASS), with the guide as the image edited. The result, `art/staging/thad/profile-walk-opposite-contact-01.png`, is a complete figure of the right man in the SAME contact again: near sleeve back over the coat, far hand forward, same leading leg, silhouette IoU 0.934 against the existing contact. Objective test in `proofs/thad/profile-walk.json` §oppositeContact; render `renders/thad-profile-walk-opposite-contact-diagnosis.png`. Per the failure condition nothing was built, no contact was used twice and no limb was manipulated; the three-frame candidate stands. Finding across three attempts: in this style the polarity lives only in sleeve and leg LAYERING, and the model holds that layering fixed to the reference. **Next attempt needs Tyler's authorization.**

**Hybrid completion, same day — CANDIDATE.** No image operation. Tyler's ruling: keep the authored whole upper bodies and rephase only the legs under the coat. Audit first: the opposite-half sheet's pose 2 has the near sleeve swung forward over the coat (hand +55 against the contact's -99) with the far arm hidden, and pose 3 is the return (+24), so the material for the other side of the arm swing exists. `tools/rig/hybrid-walk.py` composes six frames: each frame's upper body is one authored figure down to its own hem row, pixel-identical; the legs are the contact pose's own two legs, split at the hem, levelled, their roots extended straight up under the coat to a hip pivot 50 rows above the hem, swung about it (amplitude 23.7 deg, the contact's own stride, the far leg half a cycle behind), grounded on the cycle's lowest sole so the man dips at the contacts. Contact A leads with the near leg (near arm back), contact B with the far leg (near arm forward): both leg polarities exist from rotated real pixels. Near hand through the loop: -99, -17, -14, +55, +24, -14; the 6 -> 1 seam is the same size as 1 -> 2. Figure 643 (the levelled man is taller than the drawn stride); `strideLength` 141 for two steps. Sheets: `renders/thad-profile-walk-hybrid-cycle.png`, `-arm-swing.png`, `-three-cycles.png`; record `proofs/thad/profile-walk.json` §hybrid. **`visual_accepted` is not set; Tyler is the gate.**

**OWNER ACCEPTANCE, 2026-09-05.** Tyler reviewed the deployed hybrid gait at 3797684 and ruled: **THAD HYBRID PROFILE GAIT — VISUALLY APPROVED.** It is the approved shared Thad profile-walk authority and is FROZEN: the authored upper-body sources, the hidden-under-coat leg rephasing, the right walk, the mirrored left walk, the frame ordering, the cadence, the idle → walk → idle transitions and the scale/depth behaviour. No regeneration, no articulated-arm rigs, no arm-pose, leg-construction, bob or ordering changes, no further aesthetic refinement. The two source sheets carry `visual_accepted: true` in the staging ledger; the frozen frame hashes are in `proofs/thad/profile-walk.json` §hybrid.acceptance; every rejected candidate stays preserved under `art/staging/thad/candidates/`. **Pace is NOT selected by this acceptance** — A/B/C support stays until a separate owner ruling. Doc 52 carries the freeze.

## Q108 · The proud floorboard was flush — Tyler could not find the board the writing describes — **RESOLVED; TREATMENT C OWNER-ACCEPTED 2026-09-05 AND FROZEN**

Tyler's manual Room 5 playthrough (2026-09-05): "A floorboard. It sits a little proud of the others" and "Proud by about the width of a nail head" describe a physical fact the accepted plates do not draw. At gameplay scale every board is flush and the loose one cannot be found even when looked for. The hotspot, its rect, its LOOK, LISTEN, PULL and OPEN lines are all correct and none of that is perceivable.

**Ruling (Tyler).** The board stays ordinary, unmarked, unhighlighted, present from the first visit: no glow, outline, shimmer, cursor, marker, coloured light or act-dependent salience. The room advertises the fact by BEHAVIOUR: the board sits slightly proud; when Thad's feet load it, it gives, creaks once, and comes back. The player may think "that board is a little loose" and must not think "there is a secret under this board".

**Where the wood is.** The hotspot rect `[880, 704, 240, 36]` is interaction geometry (ruling 32) and is unchanged. The physical plank, read on the day plate (`tools/pixelart/floorboard.py`), is the board row directly under the counter's base seam, rows 707–724, between the split at x≈956 and the joint at x≈1098: `[960, 707, 138, 18]`. That is the tread the feet must cross.

**Visual.** No image operation and no repaint: `tools/pixelart/floorboard.py` lifts the plank's own pixels two rows out of each accepted plate and writes them back as the floorboard hotspot's `rest` state image (`art/staging/room-05/floorboard/board-rest.png`, and `-night.png` from the night plate), with the gap dark under the near edge, the top lip a shade lighter and the end grain a shade darker; `pressed` is the plank flush (`board-pressed.png`, `-night.png`). Same bounds and lift on both plates; the plates' hashes are unchanged (c0afe61efcf6, 92e3f8f5b70a). The night images ride the same `?candidate=` mechanism the night plate and Winnie's relight use until Q26 wires the visual state.

**Physical event.** `Interactable.step` (data, from `reference/room-05/annotation.json`, compiled through `tools/compile-room.mjs`) and `engine/core/StepTriggers.ts`: the protagonist's feet baseline is SWEPT from last tick's position to this one and clipped against the tread (Liang–Barsky), so a pace-C crossing that never lands a frame inside the eighteen-row tread still counts. Armed while the feet are off the wood; fires once on the first sweep that touches it; stays disarmed until the feet are off it again; a placement (load, resume, script) is not a step. On firing: state `pressed` for 220 ms, then `rest`; the world caption CREEEAK over the board for 900 ms, drawn as a bark is drawn and never in the speech channel; doc 45's `R05-FLOOR-STEP` fired by id. No collision change, no walk-box change, no change to Thad.

**Audio.** The build has no SFX layer (`engine/core/Music.ts` carries the room score only), so this is doc 45 case C: the cue is fired and counted, the caption is the guaranteed player-facing feedback, and the audible creak is DEFERRED audio work under the new `R05-FLOOR-STEP` row.

**Proof.** `tests/floorboard.test.ts` exercises the movement geometry (one press per crossing, silent standing, re-arm on leaving, a 30 px stride through an 18 px tread, no press beside it, no press on placement). Live: `renders/proofs/assay-office-lamp-night/floorboard-*` (step sequence, ten crossings at pace 1.25 and 1.5, twenty seconds standing, near misses, every verb), records in `proofs/room-05/floorboard.json`. **`visual_accepted` is not set; Tyler is the gate.**

### Factory v2 findings (recorded, not implemented)
- **Environmental clue perceptibility.** A critical hotspot is not authored because its rect, LOOK and LISTEN exist. The physical irregularity the writing advertises must be perceivable in live play at gameplay scale, and a room proof should include a person finding it.
- **Physical advertisement without highlighting.** Prefer world behaviour — step → flex → sound/text — over any puzzle-UI emphasis. The board reacts to the player; nothing points at the board.
- **Movement-trigger robustness.** A narrow environmental trigger is tested against actual actor traversal across the supported pace range with a swept test, so fast movement cannot tunnel through it; the test walks the geometry rather than calling the effect.

**Iteration 1 rejected (Tyler, 2026-09-05).** Two findings: the two-row lift on the plank against the counter was effectively invisible in play, and a foot only reached it by walking almost on top of Winnie's desk. Preserved under `art/staging/room-05/floorboard/v1-rejected/` with `owner_rejected: true`, reason "too visually subtle and too close to counter for natural traversal"; its proofs stay under `renders/proofs/assay-office-lamp-night/floorboard-*`.

**Iteration 2.** The loose board's location is not story-critical (Tyler); its behaviour and later meaning are. The board moves to a plank the room's ordinary walking already crosses: the middle-band board between the street door's step and the joint at x≈745, whose seams the plate draws sloping with the perspective (top y = 0.0209x + 731.9, bottom y = 0.0452x + 757.3). Physical plank and tread `[462, 746, 284, 43]`; hotspot rect `[450, 740, 310, 56]`, generous over it; the LOOK walk-to falls out of the compiler at (605, 828) facing back, as every floor object here is approached. The lift is one restrained step stronger and UNEVEN, as a loose board sits: treatment A lifts two rows at the left end rising to four at the right, B three rising to five, each with a dark gap under the near edge the height of the lift, the top lip a shade lighter, the end grain a shade darker at the right end; PRESSED is flush. Both derived from each plate by `tools/pixelart/floorboard.py`; the plates are unchanged. A is the declared `rest` image; B and the night derivations ride the `?candidate=` mechanism, so the playtest switches A/B without touching the base plate. Caption at (603, 744). Natural encounter: the entrance-to-Winnie approach (200,765 → 930,760) crosses it, as does any left–right walk along the middle lane and the diagonal from the door to the scales' spot; the short diagonal to the stove's spot and the near floor line the counter objects are approached on pass under it. Discoverable, not unavoidable. **`visual_accepted` is not set; Tyler is the gate.**

**Iteration 2 reviewed (Tyler, 2026-09-05): location GOOD, visual TOO OBVIOUS.** The plank read as dramatically lighter than the floor — a highlighted tile, a freshly replaced board. Measured cause: a DAY board over the NIGHT plate. The night derivation rode a `?candidate=` swap on the playtest URL, and without it the day-lit plank (face 89) sat on the night floor (51). A picture that belongs to a visual state must not depend on a URL, so `Interactable.states[].imageByState` now declares it beside `image`, resolved by the room's visual state exactly as a lamp's `amountByState` is (`engine/render/Renderer.ts` `stateImagePath`, loaded by `BootAssets`, listed by the probe). The night board is automatic; only the A/B/C choice is a swap.

**Iteration 3.** Location, tread, hotspot, press, rebound, caption and cue unchanged. The face is the plank's own pixels with NO global brightening; proudness is edge geometry: the dark gap under the near edge, at most a one-pixel lip, the right end a little higher. Three strengths from `tools/pixelart/floorboard.py`, each measured within a luminance point of the plate under it at night: A subtle (1→2 rows, gap 72%, no lip), B medium (2→3 rows, gap 62%, lip +6%, end grain 95%; declared), C upper limit (2→4 rows, gap 52%, lip +8%, end grain 90%). Full-room night frames `renders/room-05-floorboard-abc-night.png`, unlabelled; zoom `renders/room-05-floorboard-diagnostic.png`; press/rebound `renders/room-05-floorboard-step-sequence-b.png`. **`visual_accepted` is not set; Tyler chooses the strength.**

**OWNER ACCEPTANCE, 2026-09-05.** Tyler reviewed A, B and C live and ruled: **TREATMENT C IS SELECTED AND VISUALLY ACCEPTED** — identifiable after the creak, still ordinary wood, not puzzle-highlighted, naturally encountered. The relocated location and the physical behaviour are accepted with it. C is now the declared rest image for day and, by visual state, night (`reference/room-05/annotation.json`), so the live game needs no candidate override; A and B stay under `art/staging/room-05/floorboard/` marked not selected. `visual_accepted: true` in `art/staging/room-05/floorboard/floorboard.json` and `proofs/room-05/floorboard.json`, and a floorboard line in Room 5's acceptance in `content/build-ledger.json`. **Frozen**: plank location, the C raster treatment, day/night state resolution, tread, hotspot, press timing, caption, re-arm logic and traversal geometry. Not promoted, like every accepted Room 5 asset: the room's staged assets move together in the room's own logged promotion after the playthrough. The audible creak remains deferred audio work under `R05-FLOOR-STEP`.

## Q109 · Room 5 Act I gameplay acceptance pass — three defects found and fixed at source — **OWNER-ACCEPTED 2026-09-05 (see Q114)**

Tyler's brief (2026-09-05): prove Room 5's Act I first-visit gameplay end to end in the live build, at pace B (1.25, proof only, not selected), on the night state, with the frozen gait and the accepted floorboard, and deploy ONE complete URL for his own playthrough. No later-act gameplay, no new art, no dialogue changes.

**The Act I state.** `ACT` 1 (never written: the act turn is doc 48's S1, Room 11, not built), no `T_BORDERS_MOTT`, `T_ASSAY_QUEUE`, `T_NO_MOTT_GOLD`, `T_SECOND_LEDGER`, `T_STRIKE_FOUND`; the queue bench absent (its `ACT 2-4` gate); Winnie at the counter, writing; the tree opens on `WIN_A1`. Two of WIN_A1's five options are gated on flags an Act I room writes -- `T_TUNES_PIANOS` (the hotel clerk) and `T_PIKE_DEAD` (the undertaker) -- and neither can be reached in play today, because both NPC hotspots are stubs without trees. So the only Act I Room 5 state the build can produce is the clean first visit, WIN_A1 lists three rows, and a second URL for a later-Act-I topic state was not made. Every capture of the pass asserts ACT 1 and the absence of every later-act flag; none leaked.

**What was proven.** `renders/proofs/assay-office-act1/`: the gauntlet (`gauntlet/`, route `assay-office-act1`, 65 captures over 489s: entry by Main Street's own door, 75s of room life at the door, the board both ways with one creak each, the bench click that is floor, LOOK and LISTEN on every Act I target with three repeats and eight wrong verbs each answered in a line, WIN_A1's spoken opening at the declared dialogue point, every Act I row, WIN_A2's four rows including "Eight months." (the post-C5 rephrase has no runtime consumer and C5 is not solved), the exit line, her return to work, a second conversation, two street-door round trips, a crossing after re-entry, the records stub); ten interruptions of her work (`interrupt/`, 171 stills: the look-up frame held through every opening and list, the loop resumed within a frame of the exit line, never restarted -- it is a function of the room clock); TALK TO from five positions (`approach/`: the same point (930,760) and facing from each); the wrong-action and input pass (`input/`, 96 stills); the stationary regression (`stationary/`: no locomotion frame in a minute of standing). Record: `proofs/room-05/act1.json`.

**Three defects, all found by the pass and none of them Room 5's own art or writing.**

1. **Main Street's assay-office door could not be used twice.** Its `open` state (doc 22 item 9, turned on transit) carried `room-02-assay-door-open.png` -- a 320×144 overlay cut from the composed facade errata 54 discarded, already in Q20's void table -- and bounds in that space, `[1752,300,120,192]`. Drawn, the overlay was stretched across the whole 3700px plate as a smear beside the hotel (measured: mean difference 17.6 against the plate in that region, 0.9 in a control region); hit-tested, the bounds put the door in the middle of the road, so after the first pass through it the door could not be clicked where it is drawn, and Room 5 could not be re-entered from the street. The state stays; its image and bounds are gone (`content/rooms/main-street.json`, the one field of that generated file the compiler carries from the live copy), so the door looks shut and works. **The open leaf at plate scale is an art operation Tyler authorizes; it is not made here.**
2. **The first-sight walk replayed on every entry to Main Street.** `onEnter.walkTo` (the annotation's "where a man stands when he has just walked into a town he has never seen") ran unconditionally, so coming back out of the assay office put him at its door and then marched him into the middle of the road. It is gated by the same `sayOnce` flag as the lines (`GameScene.arrivalLines`).
3. **A conversation's opening exchange did not own the click.** The greeting is spoken before the tree opens, so the dialogue was not active, a click on the last line fell through, and a floor click walked Thad from the dialogue point to the scales while Winnie spoke; a verb on the scales was accepted too, and her list opened with him standing at the scales and a refusal playing under it. `playfieldClick` now takes `greeting` and spends the click (doc 30 §4.2); a click during the walk to talk cancels the conversation (doc 22's change of mind) instead of redirecting the walk and opening the tree from across the room. Tests in `tests/opening.test.ts`. One consequence, observed and judged consistent rather than fixed: a verb chosen on the panel while the greeting plays stays selected after it, as any verb does until it is used on a thing.

Also fixed on the way, not a gameplay defect: `ActorSprite`'s resampled-frame cache kept a canvas per (frame, drawn size) for ever, and a depth-scaled room makes a new size on every row. It is a bounded most-recently-used map now (`tests/actor-sprite-cache.test.ts`). It was suspected of the first run's lost page and was not the cause -- the page was closed by the harness after the door timeout -- but it is real.

**Re-entry, reported as an ambiguity, not resolved.** Every TALK TO opens `WIN_A1` and replays its three-line opening (doc 30 line 213 enqueues the greeting at tree start). The soil-assay row is `[PROGRESS · remove]` in doc 04, but the runtime has no `afterUse` consumer (errata 57: "until W1 content lands, every existing option behaves as retain"), so it stays, greyed, and re-selecting it replays its exchange and goes to WIN_A2 again; "What number am I?" is `counted-repeat` and is greyed like the rest. Whether a second conversation should reopen on the exchange, and whether W1 has landed for Winnie, is Tyler's to say; nothing was invented either way.

**Later-act architecture, audited and recorded (Factory v2), not implemented.** Overlay/state: the queue bench (`ACT 2-4`, wired, gated on a counter nothing writes -- `check-flag-order`'s red, Q24); the night state's selection (Q26). Character/chore: WIN_B1's "She stops writing" and the fifth raccoon ask; WIN_B3's second ledger from under the floor; WIN_F1's assay run at the window; doc 25's "Not with her at the counter". Gameplay logic: WIN_B1/B2/B3/C1/F1/F2 (B3 and C1 not extracted); `afterUse` and `rephrase` (no consumer); T_ASSAY_QUEUE, T_NO_MOTT_GOLD, T_SECOND_LEDGER writers; WIN_B1's exit gate on `T_RACCOON_NAMED` (the other `check-flag-order` red). Act turn: doc 48 S1 (Room 11). Conflicts found, none touching Act I: the bench's LOOK is post-C5 prose on an ACT-only gate; the post-C5 rephrase is unreachable through the entry table once T_BORDERS_MOTT bypasses WIN_A1; WIN_B1 option 3 writes no flag though doc 04 says it flags her interest; docs 05 and 08 disagree over which room hides the second ledger. Filed here for the later-act pass; none is Act I's.

### Factory v2 lessons (recorded, not implemented)
- **A room is not proven until it is entered and left by its real doors, twice.** Every prior Room 5 proof warped in or arrived once. The second arrival is where stale transit state lives.
- **Every stateful object's states are proven at plate scale.** A state image or bounds that survived a presentation change silently is a defect that fires on the first state change in play.
- **A performance owns the click from its first line to its list.** Test the last line, not the first: skipping lines hides the fall-through.
- **Harness captures declare their room and their expected counts.** Name-based heuristics in a proof harness assert the wrong thing.

**Status.** `Room 5 Act I gameplay = awaiting Tyler acceptance`. `Room 5 later-act gameplay = intentionally not implemented`. `Room 6 = stub; next room production scope`.

## Q110 · The choice interface drew the node's prompt over the choices — stale copy of a performed line — **FIXED GLOBALLY 2026-09-05**

Tyler's Room 5 Act I playthrough, otherwise successful: after Winnie's opening had been performed line by line ("If this concerns an assay, say so." / "It might." / "Then say it."), the lower interface showed "Then say it." a second time above the three choices. Doc 30 §14: "If the node has a greeting, enqueue it as a speaker-labelled utterance; do not draw node.prompt." Doc 30 §16, the binding Room 1 proof: "No stale prompt is drawn."

**Root cause, verified in the runtime.** `Renderer.drawDialogue` drew `node.prompt` above the option list whenever a node had one (it had earlier lived in the sentence slot, where it collided with the list's third row; moving it above the list fixed the collision and kept the drawing). Winnie's extractor sets `prompt` to the last line of the node's `opening` -- legitimate metadata (the schema check requires `prompt` or `noPrompt`; the glyph check reads it) -- so the performed line was drawn again. The driver's root is `noPrompt`, which is why Room 1 never showed it.

**The shared change.** `choiceLines()` in `engine/render/Renderer.ts` is the one layout the choice interface draws from: the options, prefixed and coloured as before, and nothing else. `drawDialogue` draws from it; hitboxes (`dialogueHitboxes`) are unchanged. `node.prompt` is not rendered anywhere; it stays in the data. The probe reports `choiceLines`, so a proof can assert it equals `options`. Nothing about placement, order, font, colour, prefixes, hover, wrapping, scrolling, hitboxes, speech timing or greeting click ownership changed. No authored dialogue changed; no generated JSON was edited.

**Cross-tree audit** (every tree in the manifest). Winnie's WIN_A1/B1/B2/F1: prompt equals the last opening line -- the stale copy, now gone. WIN_A2 (`noPrompt`): unchanged. The stage driver: `noPrompt`, unchanged. The three Main Street micro-trees (map seller, pie woman, letter-writer): their prompt is a stage direction from doc 07 ("The map seller brightens considerably.") with no `opening`; it was drawn above the list and is not drawn now, because doc 30 §8/§14 make staging delivery data rather than interface text -- **the one visible consequence outside Room 5, shown to Tyler for a ruling; the lines remain in data.** The doc 27 trees (Deke Vessel, hotel clerk, undertaker) carry a spoken opening line in `prompt` with no `opening` array; none is wired to a character in this build, and when they are, the extractor should carry that line as an `opening` utterance so it is spoken. Not done here (stubbed trees are out of scope).

**Proof.** `tools/gauntlet/dialogue-proof.mjs`, `renders/proofs/dialogue-prompt/`: Room 1 from the game's own start -- the driver's tree opens with its three ungated choices and three interface lines (the exit row is gated on the other three having been asked, 35e8c16, so §16's four are reached once they are), the band above the list flat; "Where am I supposed to sleep?" echoed by Thad, the driver's reply, "I have four.", "You've all got four." each over its speaker; choices return only after; the exit's "Wasn't for you." before the tree closes. Room 5 -- the three-line opening over its speakers, then WIN_A1 with three choices and three interface lines and a flat band above, WIN_A2's four rows unchanged; Main Street's map seller, four choices and a flat band where the stage direction was drawn. Before/after frames: `room-05-win-a1-before.png` (the stale line) and `room-05-win-a1-after.png`; `room-01-driver-choices-after.png`; `room-02-map-seller-after.png`. During every exchange the interface draws nothing (`choiceLines` 0) and the list returns only after. One reading of §16 is not met by the runtime and is not this defect: "the used PROGRESS option is gone" -- every option behaves as retain until W1 lands (errata 57's interim), so the used row is kept and dimmed.

**Tests.** `tests/dialogue-presentation.test.ts`: for every tree, the interface draws one line per option and never the prompt, and the prompt is exactly the opening's last line where an opening exists; the layout depends on the option count alone; a goto node without a prompt lays out as before.

## Q111 · Room 5's later-act states as playtest URLs — three constructible, four blocked by unbuilt and unspecified content

Tyler's brief after accepting Room 5's Act I: play the REST of Room 5 across the authored game state without playing the game up to each state. QA and state access, not a redesign.

**What existed.** `?room=` (live in the build, Q12), `?state=`, `?candidate=`, `?pace=`; the dev-only probe's `controls.flags`, which the published build does not carry; saves with slots. No fixtures, no state selector, no save snapshots (doc 34 lists a save-migration fixture and per-cutscene checkpoint bundles as owed work). So the smallest mechanism that meets "clickable on Pages, no console" is a NAMED FIXTURE: `content/fixtures/room-05.json` lists states as data (a room, flags and counters by id, item ids; pointers to the documents each is derived from; what the build has not built), the manifest lists the file, `?fixture=<id>` restores one **through the save path** (`GameState.applyFixture` builds a save and `restoreFrom` restores it, so a fixture can express only what a save can), under its own save key so a review session's autosaves never touch the real game. `tools/check-fixtures.mjs` refuses an undeclared flag or item, an unknown room, a counter given a boolean, and any combination the documented prerequisites forbid (ACT 2 needs T_SWINDLED and the finished opening; T_ASSAY_QUEUE needs T_BORDERS_MOTT; WIN_B2's rows need T_ASSAY_QUEUE; the strike needs ACT 4 and the pickaxe; the four dollars are gone after the swindle), and reads the tree's own entry table to confirm the node each fixture says it opens on. Like `?room=`, the parameter is live in the published build and carries Q12's debt: gate or remove it before release. It cannot set a flag, hold an item or choose a room on its own.

**Legal construction, from the documents.**
- **R5-A** — the accepted first visit: the opening's flags, the case's three items, ACT 1. WIN_A1; the bench absent.
- **R5-B** — A9 filed the deed at Room 7 (T_BORDERS_MOTT, doc 02:32), A10's dinner set T_SWINDLED and ACT 2 (doc 48 S1); the deed and Company map held, the fork always, the watch traded away and the four dollars spent (doc 02:126-133). WIN_B1; the bench live. **Nothing of C1 onward is pre-answered.** Not built: the writers of T_BORDERS_MOTT and ACT (Rooms 7 and 11 do not exist -- `check-flag-order`'s standing red), Fanshawe's handkerchief (no item), the Act I topic flags doc 04 declares beyond the build's, WIN_B1 option 3's "she stops writing".
- **R5-G** — the strike found (F3, T_STRIKE_FOUND; the fork and the pickaxe), ACT 4 (S4's close), and the Act II chain behind it (T_ASSAY_QUEUE; WIN_B2's T_NO_MOTT_GOLD and T_SECOND_LEDGER, which WIN_F1 option 2 presumes). WIN_F1. **Partial, and labelled so:** "Run it." sets no flag, gives no item and stages no assay -- the documents name no output for it -- and F5's certification (WIN_F2) is doc 48 S6 in Room 7, not extracted; the gold sample, Document B and the death certificate are not items.

**Blocked, not fabricated -- and, after errata 66 and W1 (Q112), what still blocks each, by component.**
- **R5-C padded log ready** — **REAL as of Q113**: the log is an item with Tyler's copy, the action is built, the fixture stands at C4 complete with the log in hand. C2–C4 themselves remain unbuilt; the fixture stands where they end. R5-C-POST is a regression fixture only.
- **R5-D second ledger** — needs: `puzzles.C5` written by C5's success (errata 66 B); WIN_B2 reachable; WIN_B3 extracted (errata 66 E lifts the node-rule skip); Winnie's retrieval staged at the Room 5 board (errata 66 D settles the room); a lifted board state.
- **R5-E assay / Document B** — needs: C6's pending/complete puzzle states; the `document_b` item (errata 66 H; no examine copy authored); the off-screen collection action and its lines (not authored); the Liar's-Assay sparring runtime.
- **R5-F false death certificate** — needs: WIN_C1 extracted (errata 66 J); the `death_certificate` item (errata 66 I; no examine copy authored); E0–E3 and ACT 3's writer.
- **R5-G** stays PARTIAL (errata 66 K): WIN_F1's exchange only; the assay and its outcome are unspecified and unbuilt.
Fixture `w1-piano` is a W1 proof state (the accepted first visit plus T_TUNES_PIANOS), not a review state.

**Proof.** `tools/gauntlet/fixture-proof.mjs`, `renders/proofs/room-05-fixtures/`: each fixture opened by its URL and measured -- the room, every flag and counter, the inventory; a crossing of the floorboard (one creak, at rest after, no flag written); LOOK on the bench (a target in R5-B and R5-G, floor in R5-A); TALK TO Winnie and the node the tree opens on, the choices drawn equal to the options; the universal exit; a street-door round trip with flags, counters and inventory compared before and after; eight stills of her work loop for the frame classifier. All three pass: R5-A opens WIN_A1 with three rows and the bench is floor; R5-B opens WIN_B1 with five rows and the bench is a target; R5-G opens WIN_F1 with four rows; one creak per crossing and the board at rest in each; every flag, counter and item as the fixture names it, unchanged across the round trip.

**Room life across states, reported.** Eight stills of her loop in each state, classified against her sheet: work frames with pool breaks (a glance up among them) in all three. Winnie's loop is the same clock-driven Act I loop in every state; no later emotional or story state is authored for her in the build (WIN_B1's "she stops writing", WIN_B3's ledger from under the floor, WIN_F1's assay at the window are dialogue staging with no chore clips), so a later state shows the early loop. Recorded as missing authored-state behaviour, not added.

**Doc 30 §16, checked.** "The used PROGRESS option is gone" is superseded by errata 57 (retain until W1 lands). "The tree opens with four choices" is contradicted by the build's driver-exit gate, which lived only in the extractor: errata 65 records it for Tyler to confirm or strike. No runtime change.


## Q112 · W1 landed: every option's aftermath is authored and persistent selection counts replace taken/not-taken

Errata 57 ruled that every option authors its own aftermath; the runtime had been on the ruling's interim, "every option behaves as retain", with a taken/not-taken set and one `repeat` string. The later Winnie material cannot work on that -- the raccoon is five selections deep, the soil-assay row is `remove`, the wait question rephrases after C5 -- so W1 is landed on the shared runtime, not as a Room 5 case.

**The model** (`engine/core/DialogueRunner.ts`). Committed selection counts per option, keyed tree → `node:option`, saved as `dialogueProgress` (a pre-W1 save's list of taken keys restores as one selection each). The `dialogueTaken` effect increments; nothing lands before the exchange drains, as before. Presentation from the option's authored `afterUse`: `remove` is gone once taken (from the list, across node and room re-entry and save/load); `retain` stays and greys; `counted-repeat` stays at full weight and counts; `rephrase` swaps its wording and answer once its named milestone is complete; `replace` offers `replaceWith` in its place. A missing `afterUse` behaves as `retain` (errata 57's interim) on the eight trees whose documents predate the ruling, and is a build failure on a tree the extractor marks `aftermathAuthored` (Winnie's). Selection n answers with the last `repeats` entry at or below n, clamped at the last authored variant; with none, the first exchange again -- the pre-W1 single `repeat` reads as the second selection's line. The echo and the list draw the presented wording (`PresentedOption.text`), so a rephrased row is echoed as rephrased.

**Milestones.** A rephrase names a canonical puzzle (`after: "C5"`). The game state now carries **puzzle progress** (`GameState.puzzles`, saved as `puzzles`, ids from doc 02's canonical 45) and the runner asks it; nothing writes it yet, so WIN_A2's wait question keeps its first wording until C5's success action exists. Doc 53 records the binding. No topic flag stands in for it (errata 66 B).

**The extractor** now carries doc 04's later selections: inline `*(second)*` / `*(third)*` answers and the `**Repeat on option N:**`, `**Third selection:**` and `**Option N, fifth selection:**` lines, as `repeats` by selection number (an exchange where the line has several quoted parts; its directions reported as staging). Winnie's tree is `aftermathAuthored`. `content/dialogue/winnie.json` was regenerated, not edited.

**Validation.** `tools/check-dialogue-afteruse.mjs`: unknown mode; missing aftermath on an aftermath-authored tree (universal pool exits excepted -- doc 04 part one supplies them to every node and writes no aftermath for them); `rephrase` names a canonical puzzle and both a wording and an answer; `repeats` strictly increasing from 2, each with a line or an exchange; `replace` names its replacement without an id collision; duplicate option ids; leavability once every removable row is gone. `check-fixtures` validates a fixture's `dialogueCounts` keys against real options. Eight trees remain on the interim and are counted on every run.

**Proof.** Tests: `tests/aftermath.test.ts` (remove across re-entry and save/load; retain; counted-repeat through the piano's three answers and the raccoon's fifth-selection exchange, clamped after; rephrase held back until the milestone and firing under a runner whose milestone source says so; counts through save/load and a pre-W1 save; fixture counts). In the game, `tools/gauntlet/w1-proof.mjs` (`renders/proofs/w1-aftermath/`): Room 1's driver unchanged (three rows then four, the used row kept and dimmed -- no authored aftermath, so retain); WIN_A1's soil-assay row gone after selection, on re-entry and after a street-door round trip; the piano row (fixture `w1-piano`) offered at every selection with its count 1, 2, 3, 4 and the count surviving a round trip; WIN_A2 reached with no puzzle complete.

**What W1 does not do.** It does not change the stage driver's exit gate (errata 65 stays open); it does not write any milestone; it does not extract WIN_B3 or WIN_C1 (errata 66 E and J waive the node rules for them; the next task lifts the extractor's skip); it does not author repeat lines beyond doc 04's.

## Q113 · C5 and WIN_B2 built: the submission log shown to Winnie completes C5 and opens the confrontation — awaiting Tyler's gameplay acceptance

The first later-state slice, after W1 (Q112) and errata 66. Exactly: C4's evidence in hand → USE THE SUBMISSION LOG on Winnie → C5 completes → WIN_B2's opening performs at once → WIN_B2 is the Act II conversation state. Nothing of WIN_B3, C6's return, Document B, WIN_C1 or WIN_F1 is built.

**The item.** Tyler's copy for `padded_log` (display THE SUBMISSION LOG, full name The Improvement Company submission log) went into `docs/23-inventory-act1.md` under a new "Act II items" section, and a new extractor (`actTwoItems`) writes `content/items/padded-log.json` from it -- the first item to come through the pipeline rather than by hand. Its icon is drawn by `tools/pixelart/item_icons.py` as a bound book, so it cannot be confused with the three papers; that procedural 30×21 glyph is the only new pixel asset of the slice, made by the tool that makes every icon, no image model.

**The action, as data.** Doc 24's table gains its Act II row, C5: THE SUBMISSION LOG on Winnie, with a direction and no quoted line -- the pair's line is WIN_B2's authored opening (errata 66 C). The extractor routes it (`padded_log` on `assay_office/winnie`, `requiresPuzzles: [C4]`, `completes: C5`, `opens: WINNIE`); `check-combinations` accepts a pair that opens a tree whose entry is gated on the puzzle it completes, and counts a room's ambient characters as targets. Nothing in the scene names the log or Winnie: `GameState.evidencePairFor(item, npc)` answers the live pair for any held item on any character in the current room, or null, and `commitEvidence` lands it through a journal like every other durable change.

**The scene.** USE with the log, then Winnie: the same walk TALK TO makes, to her declared dialogue point; at arrival he faces her and she looks up (the greeting state holds her talk frame -- the ledger stops); a 1.1 s beat; C5 lands (`puzzles.C5 = complete`, the log kept, autosave); WIN_B2's four lines perform over their speakers; the list. No control returns in between. A floor click during the walk cancels the whole thing: nothing written, no tree, the log held. After C5 the pair is not live, so the log on Winnie again answers with the people pool and re-completes nothing.

**No show-evidence chore.** The right-facing chores (`use-near`, `give-offer`) are hand-transformed, unrecorded-family clips -- continuity debt, not Family A -- and Winnie is faced from behind. The presentation is the accepted stand facing her, her look-up, the beat, and his first line, which is the showing. **Minimum asset for a physical show: one Family-A key pose, facing back or right, of Thad holding a document out at chest height, rigged to five frames as doc 42 prescribes.** The beat is where it will play.

**WIN_B2's entry.** `entries` may now be gated on a puzzle (`{ puzzle: 'C5', node: 'WIN_B2' }`, ordered after Act IV's, before Act II's root). An opening reached through a puzzle-gated entry belongs to the action: `openingOf(tree, viaAction)` returns it only to the action; an ordinary TALK TO afterwards opens WIN_B2's list without replaying the confrontation (errata 66 C, Tyler's ruling here). Act I's greeting behaviour is untouched. While C5 is complete and nothing more advanced is built, WIN_B2 stays the root: T_SECOND_LEDGER does not route to WIN_B3 (not extracted) -- an implementation boundary, not story behaviour.

**The rows, through W1.** winnie1 "Will you run my assay?" removes and writes `puzzles.C6 = pending` (doc 04's "grants assay → C6", read as doc 53 reads it; no assay, no Document B); winnie2 removes and writes T_NO_MOTT_GOLD; winnie3 removes and writes T_SECOND_LEDGER (recorded; the board untouched); winnie4 retains; the universal exit as before. A dialogue transaction may now reserve `puzzleProgress` beside counts and flags -- doc 34 §4.2's list, amended here, because doc 04 gives a row that job; inventory, objects and the room stay out of trees. The five kinds of state stay apart: `puzzles.C5/C6`, `T_NO_MOTT_GOLD`/`T_SECOND_LEDGER`, `padded_log`, `dialogueProgress`, the untouched board.

**Fixtures.** R5-C is real: r5-b's state plus C1–C4 complete, T_ASSAY_QUEUE (WIN_B1's first row counted once), the log held, C5 not done -- the action is Tyler's. R5-C-POST (C5 complete, WIN_B2 available) is regression only. `check-fixtures` learned puzzle progress and its prerequisites (C5 needs C4 and the log; the log needs C4 and T_ASSAY_QUEUE; C6 needs C5).

**Proof.** `tests/c5.test.ts` (6): extraction, the pair live/not live/spent, contact commits once and keeps the log, the tree opens through the action and not through TALK TO, the rows' writes and removals, re-entry and save/load, no WIN_B3 routing. In the game, `tools/gauntlet/c5-proof.mjs` (`renders/proofs/room-05-c5/`, individual frames): 20 captures, all green -- the log examined; the log on the scales and the deed on Winnie answer from the pools and write nothing; a cancelled approach writes nothing and keeps the log; the action lands at the dialogue point (930,760) facing her with C5 complete at his first line; the four lines over their speakers; five rows in authored order; the comic retained, the three progress rows removed with their writes (T_NO_MOTT_GOLD, T_SECOND_LEDGER, C6 pending), the board at rest throughout; the exit; TALK TO again opens the list with no Winnie line before it; a street-door round trip keeps everything; the log on her again answers from the pools and re-completes nothing. Frames `01-pre-c5-inventory` to `07-list-after-round-trip` beside the record.

**Regression.** Winnie's ledger stops at contact and resumes after the exit (her talk frame is held by the greeting state, as in Act I); the floorboard's state, cue count and treatment are untouched by the rows; the street door, the round trip and the dialogue approach are the accepted ones. Errata 65 untouched.

## Q114 · Factory v2 consolidated from Room 5: the room contract, the DAY/NIGHT companion check, the proof judgement, and the compiler's false DROPPED report — **RECORDED AND BUILT 2026-09-05**

Tyler's brief: STEP 2 of the plan (close Room 5 Act I → consolidate the factory → audit Main Street and the Nugget → retrofit → resume). Zero image operations; no retrofit; no later-act Room 5 work; nothing accepted touched. Preflight at branch head 382d24c, main 7033f20, clean tree.

**Recorded.** ROOM 5 ACT I GAMEPLAY IS OWNER-ACCEPTED (Tyler's manual playthrough of the deployed build at 0376119): `content/build-ledger.json` `acceptance.gameplay`, `proofs/room-05/act1.json` `ownerAcceptance`, and the room's build contract. Act I only — entry and re-entry by the real door, the night presentation, Winnie's loop, WIN_A1/WIN_A2, the approach, the choice presentation, both exits, every hotspot and wrong verb, the floorboard, Thad, room life. The boundary is recorded beside it: C5/WIN_B2 BUILT-EARLY-NOT-ACCEPTED (preserved, not reverted, not advanced); WIN_B3, C6, E4/WIN_C1, the Act IV assay and F5 CONTRACTED-UNBUILT. No further later-act Room 5 implementation is authorized by the acceptance. Q109's heading status is superseded by this entry.

**Doc 46 rewritten as FACTORY V2.** Part two audits v1's three builds against the tree (BUILT / PARTIALLY BUILT / SUPERSEDED / STILL MISSING / WRONG ASSUMPTION); part four is the v2 requirement set (the nine-gate pre-art gate, art, character, room-life, stateful-prop, swept-trigger, dialogue, state-model, DAY/NIGHT, natural-encounter, accepted-work and lifecycle rules, proof v2, machine vs human gates); part five the bug→check ledger from Room 5's actual production (22 rows, six MISSING named); part seven the retrospective; part eight the retrofit classes; part nine the checklist.

**Built, all high-leverage gaps and nothing from the bad list.**

1. **`tools/check-state-images.mjs`** — the DAY/NIGHT companion check. A room's visual-state set is derived from everything in it that answers to a state (`amountByState`, `imageByState`); every state image must carry a companion per state or declare `sameInAllStates: true` (new field on `Interactable.states[*]`, carried from the annotation by the compiler; the hanging lamp declares it); a companion must exist, match the base image's dimensions, and not be the base file. Proved by mutation in `tests/state-images.test.mjs` (the floorboard defect, the undeclared lamp, a 74×50 companion, the base-file disguise, a missing file, a room with no states).
2. **`content/build-contracts/*.json` + `tools/check-build-contracts.mjs`** — the per-room build contract (schema 1): nine pre-art gate answers and six live-gate answers from a closed vocabulary with evidence that must resolve (a file, a `path.md::Heading`, or a recorded `cmd:`); lifecycle rows per asset with the stage/location rule (nothing under `art/staging/` may claim SHIPPING; no candidate stage outside it); `acceptance.{visual, gameplay.<scope>, promotion}` dated, with the visual ruling cross-checked against the ledger's `visual_accepted` in both directions; later-state and retrofit rows. Contracts for Room 1, Main Street, the Nugget and Room 5 (the benchmark); the opening-set rooms answer NOT-RUN where the step-3 audit has not been run and NOT-CLASSIFIED on every retrofit row. Twelve mutation witnesses in `tests/build-contracts.test.mjs`. The ledger rows point at their contracts.
3. **`judgement` on every proof record** (`proof.mjs`, `life.mjs`): what the machine established, what it does not establish, and the human gates as PENDING TYLER — so `passed: true` can no longer be read as a verdict on the room.
4. **The compiler's false DROPPED report, fixed.** `compile-room.mjs` pushed every live `walkTo` as dropped before deciding whether the annotation re-sourced it, and printed the block under a heading that named Main Street and `street_east` for every room — so Room 5's twelve re-derived approach points were reported DROPPED on every run while `--check` said "current". Now only an approach point the compiled room lacks is reported, in room-neutral words. Room 2 and Room 5 compile clean and current.

**Exercised (§30).** Compiler `--check` on Rooms 2 and 5; the annotator loaded headless for Room 5 with its room list, hotspot checklist and export; the four-panel proof, life proof and contact sheets re-run on the committed tree (records below); the suite; the new validators.

**Findings not fixed, reported.** (a) `room-gate.mjs` reads only doc 05's first section and classes "THE WINDOW SIGN" as an opening — the gate matrix by hand is still the audit (known since the pilot). (b) The annotator cannot draw `hotspotStates`, treads, `exitWalkTo` or contact bands; those annotation fields are hand-edited JSON. (c) Room 1's plate and Main Street's plate are "approved"/"signed off" in prose and `visual_accepted: false` in the ledger — Tyler's field; the contracts record PENDING and the discrepancy. (d) Q26's canon-driven state selection is still missing; `?state=`, `?candidate=` and `?fixture=` are live in the published build (Q12). (e) The `check` CI job stays red on `check-flag-order` (ACT, `T_RACCOON_NAMED`), global content debt, by ruling.

**Next task:** OPENING SET CONTINUITY RETROFIT AUDIT — ROOM 2 + ROOM 3.

## Q115 · Opening-set continuity retrofit audit: Main Street and the Nugget against Factory v2 and the Room 1 + Room 5 authorities — **AUDITED 2026-09-05, RETROFIT SCOPE AWAITING TYLER**

Tyler's owner finding, taken as input: Room 5 is the visual style target; Main Street and the Nugget can read as painted backdrops while Room 5 reads as a place Thad and Winnie inhabit. The audit diagnoses why and classifies every subject (KEEP / IMPROVE / RECAST / REGENERATE-CANDIDATE / DEBT-NOT-VISUAL); it fixes nothing, spends no image operation, promotes nothing and changes no owner acceptance field. Record: `proofs/factory/opening-set-retrofit-audit.json` and `.md`; live runs `renders/proofs/opening-set-audit/{main-street,nugget}/`; review sheets `renders/opening-set-audit/` (Main Street 12 frames, Nugget 12, the four-room continuity sheet) and `renders/opening-set-character-strip.png`. The retrofit rows of both build contracts now carry the classifications.

**Why Room 5 feels like a room, ranked (live comparison, not hashes):** (1) foreground layering and occlusion -- Room 5 stacks counter, cage bars and lamp in front of Winnie; Main Street has no foreground plane and no working mask; the Nugget occludes nobody; (2) detail distribution -- measured grain 6.0-6.5 (Main Street) and 4.6-6.4 (Nugget) on every surface against 1.2-2.3 in Room 5 and 3.0 in Room 1: one texture frequency is one surface; (3) architecture-to-figure scale -- Main Street's doorways are 102-134 px so Thad is 105-206 there against 240 in Room 1 and 470-560 in Room 5 (Q10); (4) practical light, and movers lit by it -- the Nugget is lit everywhere at once, Main Street lights every window equally, and the renderer lights the plate, never the people, so Thad stands cool in the saloon's orange pool; (5) characters designed for the scene -- the Nugget's patrons are plate patches in two hands, the pie woman and letter-writer are naturalistic portraits beside a cartoon Thad; (6) stateful props and occupation.

**Main Street:** plate REGENERATE-CANDIDATE (half-scale architecture, single-surface grain, no foreground plane; night, mood and the saloon exception are the ancestry to keep; ~4 ops); pie woman and letter-writer RECAST (design generation; the letter-writer with his station -- canon says he writes and the build shows no station, papers or customer); map seller KEEP design / IMPROVE life; dog IMPROVE (draw the existing shadow); masks DEBT (describe nothing in this plate; little to occlude anyway); actor-light DEBT (renderer: lamps never light movers); exits/re-entry and the three micro-trees KEEP; Act III overlays KEEP architecture, IMPROVE the notice's value; the door into Room 5 lands on the legacy placeholder in the shipping build (promotion debt).

**The Nugget:** plate REGENERATE-CANDIDATE -- seven people are painted into it (the room's own castNote), which doc 35 forbids in capitals; the sprites are patches over their own baked selves; one warm grade and grain over everything; the chandelier painted lit against doc 16's "never been lit"; 2 ops, no people, composition kept. Card players RECAST (realistic faces at the room's centre, a different hand from Thad); bar drinkers RECAST (they exist only as plate patches); Thad integration KEEP; card table asset KEEP as a prop; piano visual KEEP; handbill visual KEEP -- perceptible and mundane -- but its rect is 60 px off the paper. **Geometry drift, proved live by hover on the shipping plate:** the drawn stairs answer THE MIRROR, the drawn portrait and stove answer THE STAIRS, the drawn handbill answers THE WINDOW, the drawn piano and chandelier answer nothing; seven of twelve rects sit 60-200 px left of their subjects (the annotation records the bar moving 432 px after the first reading). LOOK at the piano walks Thad to the wall beside it. DEBT-NOT-VISUAL, first in the order: nothing about this room's proofs can be trusted until it is re-read. Also: "There is a man on the landing" and the landing is empty (ruling 19b; the room file claims him drawn) -- Tyler rules paint or reword; compiler refusal diagnosed exactly (doc 16's overrides use bare names `PIANO`, `BAR`, `CARDS`... against doc 05's `THE PIANO`; the smallest fix is a leading-THE normalisation plus one explicit alias for CARDS, or nine heading edits in doc 16); the stale front-doors line falls out of that.

**Opening set:** the weak link is Main Street; the most jarring cut is Room 1 → Main Street (Thad halves, the town becomes a model), then Nugget → Room 5; the largest character break is the card players, then the pie woman and letter-writer; the largest life break is the Nugget. Thad, the interface and the walk (0.73 body-heights per second everywhere) are stable across all four rooms. Retrofit order: DEBT (Nugget re-read + compiler; Room 5 promotion; lamp-lit movers) → deterministic IMPROVE (masks, shadow, notice value, relights) → re-prove → Tyler rules on two plates and four cast families (~10 ops, each its own cap) → re-annotate, prove, owner gates. Tally over 48 subjects: KEEP 10, IMPROVE 14, RECAST 5, REGENERATE-CANDIDATE 5, DEBT-NOT-VISUAL 14.

**Also found, reported:** the Nugget's `stairs` LOOK is recorded as "drawn -- the man on the landing, on the seventh tread" by `audit-look-figures` and he is not in the plate; the annotator now draws a candidate plate, so the re-read can happen on a staged candidate before promotion (Q114).

**Awaiting Tyler's retrofit-scope approval. No retrofit has begun.**

## Q116 · Opening-set continuity retrofit, phase 1: the deterministic debt paid, lamps that light the people, and two plate candidates for Tyler — **BUILT 2026-09-05, PLATE RULINGS AWAITING TYLER**

Tyler approved the Q115 diagnosis and ordered phase 1 in a binding order: clean infrastructure → plate candidate → owner plate acceptance → cast against the accepted plate → integration and life → proof. This entry is the first three steps for Main Street and the Nugget, and it stops where the order says to: **two candidates ready for Tyler's visual selection, nothing promoted, no character recast generated, no mask cut against a plate nobody has accepted.** Image operations: Main Street 2 of 4 (`main-street-plate`), the Nugget 2 of 2 (`nugget-plate`), each under its own cap in `art/staging/caps.json`; the ledger carries every attempt with its transmitted references.

**The deterministic foundation (§2).** (A) The Nugget's twelve hotspot rects and two exits were re-read off the shipping plate on a 100 px grid and pinned by pixel where a subject has a hard edge; the room recompiled and the same hover probe that found the drift now finds every drawn subject answering its own name, 13 of 13 (`proofs/factory/phase1-nugget-geometry.json`). Room 3 is a registered generator (`compile-room-3`). (B) The compiler resolves doc 16's bare override names (PIANO, BAR, STOVE...) by unique prefix with or without a leading THE, takes an annotation's `overrideAliases` for the one that is not a prefix (CARDS → THE HAND OF CARDS) and refuses an alias whose target doc 05 does not name; it now reads Part Four's exit LOOK/LISTEN runs, which retired the stale "Daylight past them." for the doors' written "The street past them."; and `--annotation <path>` compiles a candidate room from its own annotation beside the shipping room. (C) Room 5's seven accepted files were promoted to their shipping paths by a logged step (`tools/art/staging.mjs promoteDerived`, `proofs/room-05/promotion.json`): every shipping file byte-identical to its accepted staged file, the four-panel proof re-taken with **no `?candidate=`** (`renders/proofs/assay-office-shipping/`) and differing from the candidate proof only by the lamp's flicker phase and Thad's idle frame. The DAY plate stays staged as `ACCEPTED-NOT-SHIPPING`, a lifecycle stage the contract validator did not have and needed (errata 64b: the day plate is the source of geometry, not the Act I state). The 320×144 placeholder moved to `art/staging/room-05/legacy/`. `visual_accepted` is untouched.

**Lamps that light the people (§3).** The audit's shared lighting fault: `drawLamps` breathes the pool over the plate and never over a mover. A room's lamp may now declare `movers` `{strength, colour, reach, radius, strengthByState}` and a mover whose feet stand in the field is flat-tinted toward the colour by strength × a square falloff — `engine/render/LightFields.ts`, pure and unit-tested (`tests/light-fields.test.ts`), applied through a scratch layer so the sprite's own silhouette is the mask and no edge or dither moves. Not a lighting engine (no normals, shadows or gradients); not a grade (a lamp that declares nothing touches nobody, so Rooms 1 and 5, which declare none, are unchanged to the pixel). Proved live on the shipping streets with the fields declared per room in the annotations: in the saloon's pool Thad's drawn pixels shift +26 red / −19 blue against his own source frame; out of every field he is drawn to within 2.1 of it (`proofs/factory/phase1-light-fields.json`, `renders/proofs/light-fields/`). Whether the strengths are right is Tyler's eye; the numbers are data.

**Main Street candidate 01 (§4–7).** Two errata-63 panels — a west panel from a fresh prompt against the rendering anchor, Room 1 live and plate, the current street, Room 5's plate and Thad as the ruler; an east panel outpainted from the west source under a mask — stitched at explicit cut columns where both show open boardwalk and mud (`tools/art/street-outpaint.py`, `street-stitch.py`; the model repainted the masked keep-region, so the seam is a feathered cut, not shared pixels; `stitch.json` records it). 3610×864, people-free, night, the saloon the brightest place on the street, the assay office with its one lantern at the east end, the Company's two lit windows at the west, real hills and a steeple behind, and three foreground objects the street never had (two hitching rails, the trough). **Scale corrected:** the Company door is 220 px, so Thad is 200 at the boardwalk line and 275 at the frame's foot (shipping: 105 and 206), inside errata 54's 222/240/263. Compiled to `main_street_candidate` from `reference/room-02-candidate/annotation.json` (every rect read off the candidate; masks planned, not cut; Act III overlays not carried — they are re-cut from whichever plate Tyler accepts) and played live by the dev warp with the accepted Thad at far/mid/near, in the saloon's pool, at the notice board, by the trough, in front of and behind the west rail: `renders/proofs/candidates/main-street/` PASS. The shipping ambient four ride along at their shipping positions as **LEGACY CONTEXT**, captioned so on every sheet.

**Nugget candidate 02 (§8–10).** An edit of the shipping plate — same composition by construction — with every painted person gone, the chandelier's seven candles cold (doc 16), the stove, the two bar lamps and one door lamp as the practical hierarchy, and the finish moved toward Room 5. Attempt 1 came back without the handbill and without the back-room door, both of which the writing needs; attempt 2 restored both under a mask that freed only those two wall patches, and the diff proves nothing else moved (mean 3.9/255 over the frame, the only blocks above noise the two patches; `proofs/room-03/refinement.json`). Zero people baked. Compiled to `nugget_candidate` from `reference/room-03-candidate/annotation.json`, re-read from scratch; NO chandelier lamp is declared. Played live with the accepted Thad only: `renders/proofs/candidates/nugget/` PASS. **Decision point, not a change:** Tyler's two depth anchors (198 at the far wall, 459 at the foot) are carried, and the plate's own furniture argues for a taller man at the back (~330 by the stools, the piano and the doorway); at 198 Thad stands a head shorter than the piano. The same tension existed in the shipping room; the annotation's scaling note gives the numbers.

**The review packages:** `renders/opening-set-retrofit/` — each candidate whole and in 1:1 crops, the shipping plate beside it at the same scale, the live route, Thad at three depths 1:1, the patron-zone diagnostic apart from the review sheets, and the four-room continuity sheet Room 1 → Main Street CANDIDATE → Nugget CANDIDATE → Room 5. Composer: `tools/retrofit/review-sheets.py`. **Separation plans** (§13) per candidate: `proofs/room-02/separation-plan.json`, `proofs/room-03/separation-plan.json` — baked architecture, the occluders to cut and their planes, stateful props and their companions, the lighting fields, actor zones for the deferred recasts and for Deke and the raccoon, dialogue approach points, and the future states that are and are not written.

**Also found:** the Improvement Company sign on the Main Street candidate is a blank board — the model painted no lettering — so the accepted plate's `company_sign` needs its lettering as a companion cut or a masked edit (the two remaining Main Street operations are the budget for it, if Tyler wants it in the plate). The candidate review route's first run walked Thad to the boardwalk hotspot's centre three captures running: a click on the boardwalk band is LOOK AT across the whole street, so walk clicks in a route sit in the mud; recorded in the route's note.

**What this entry does not do, by order:** no Room 6; no recast of the pie woman, the letter-writer, the bar drinkers or the card players; no Deke, no raccoon; no mask against an unaccepted plate; no promotion of either candidate; no change to Room 5's composition, Winnie, the lamp, the floorboard or Thad's gait. The `check-flag-order` red on ACT / T_RACCOON_NAMED is global content debt and is reported, not fixed.

**MAIN STREET PLATE — AWAITING TYLER VISUAL ACCEPTANCE. NUGGET PLATE — AWAITING TYLER VISUAL ACCEPTANCE.**

## Q117 · Opening-set retrofit, phase 1.5: the accepted environments corrected for canon and physics before casting — **BUILT 2026-09-05, ENVIRONMENT REVIEW AWAITING TYLER**

Tyler reviewed both Phase 1 candidates live and accepted their direction: they belong in Room 5's visual universe. What live review exposed was physical and canonical, not aesthetic, and it had to be right before Phase 2 puts people in the rooms. This pass corrects exactly those things and nothing else. **No character was generated, no room life built, no flicker timed, no Room 6, no later-act Room 5 work.** Image operations: Main Street 0; the Nugget 1 of a ceiling of 2 (the floor; the cold stove came out deterministic, so its reserved operation is unspent).

**Main Street (0 operations).** (1) *The trough was missing.* The candidate painted a box on the Company's porch; a trough is canon (`THE WATER TROUGH`: LOOK, LISTEN, repeats, USE, OPEN). The shipping plate's own trough — the one authorized trough in the game — is cut by polygon, scaled 1.9 (the ratio of the two plates' figure scales, errata 63's kernel), relit to the candidate's mud and seated in the street beside the east hitching rail, in the fringe of the saloon's pool, as a companion the room draws as the hotspot's `filled` state. It declares `occludes: [1]` and the far mud band is plane 1, so a man behind it is masked by its own silhouette; the renderer's early return for rooms without planes of their own had drawn Thad's legs over the water, and now consults state occluders too. Rect, obstacle and approach follow it. (2) *The notices read as a papered wall fused into the next building.* A framed board on that wall — the frame tiled from the plate's own porch post, a cast shadow on its lower and right edges — as the hotspot's `ordinary` state; the Act III `funeral` state is the same frame plus the authored clean sheet re-cut for this plate. (3) *The dog on the rail.* One dog, drawn once (the room lists him once; the plate paints none): his shipping x,y put him on top of the east rail the new plate has at that spot. The "two forms" were his own curled silhouette over the rail's bar. An ambient file may now carry `placements` by room id, and on the candidate he lies on the mud east of the rail's end post; the shipping room's x,y is untouched, and so is his art. (4) *The blank sign.* Correct at plate level (doc 35 §6) and a missing layer at runtime: the shipping gilt lettering, scaled to the board's inner face, is the `weathered` base state (dulled, flaked by a seeded erosion — painted twice, peeling) and the `gilt` Act III state (fresh). Record and derivation: `art/staging/room-02/companions-01/derivation.json`, `tools/retrofit/main-street-corrections.py`. (5) *Sanity pass:* the porch box stays a porch box; no other floating, fused or duplicated object found. A `?objects=<id>=<state>` warp (with `?state=` and `?fixture=`) shows the Act III companions, since errata 60's ACT counter is reachable by no script yet.

**The Nugget (1 operation).** (1) *Dirt floor is canon* — "A chandelier. Below it, a dirt floor. The two have never been introduced." The candidate painted planks. The deterministic attempt (`tools/retrofit/nugget-corrections.py`: a low-pass lighting field with an earth grain and worn paths) read as a smudge with planks surviving around it, which is the case Tyler authorized the one masked operation for. `art/staging/room-03/floor-01/floor-op.json` records the source, the mask (the main floor polygon only, in source space), the intended unchanged regions and the purpose before the call; afterwards `tools/retrofit/nugget-floor-restore.py` takes the floor from the result ONLY where the mask says floor and the accepted plate says "not furniture", so the three stools, the spittoon and the piano's stool are the accepted plate's own pixels — 0 changed — and the model's drift outside the mask (the whole plate re-encoded) is undone by construction. (2) *The stove must be able to go out* (doc 16 LISTEN 3, "It has gone out and nobody has noticed", with its note not to correct it). The fire is lifted out of the plate as the stove's `lit` state overlay; the base plate's firebox is cold iron; `out` draws nothing. The stove's lamp is gated on the object state (`whenObject`), so out means no pool and no field on a man beside it. Phase 2's flicker animates the overlay and nothing in the plate. (3) *Nine patrons, by owner ruling* — 3 at the bar, 4 at the card table, the man on the landing, the man beside the stove; all runtime; none baked; **no piano player, ever**. The separation plan reserves each zone with its feet and pose; the landing man's near-stillness and the stove man's relationship to the stove are recorded as authored behaviour, not filler. (4) *The abandoned hand survives:* the table's near edge has no chair; the face-up hand lies there, the absent fifth man's place; four chairs, four players, nobody claims it. (5) *The text conflict* (`proofs/room-03/patron-text-conflict.json`): PATRONS LOOK 1 says eleven men at eleven in the morning; the owner rules nine and the presentation is night (errata 64a). No later source supersedes the line. Three minimal replacements are proposed in the report and none is written into doc 16. (6) *The view onto Main Street* through the doors and the window is the far side of the street — night, lit windows, weathered clapboard — which no plate draws and which is not the obsolete street; left as is. (7) *Thad's scale* is not touched: the dirt floor does not change the reading, and the known Phase 2 calibration stays first before any casting.

**Proof:** `renders/opening-set-retrofit/phase15-*.webp` and the patron-zone diagnostic; live runs `renders/proofs/candidates/{main-street,main-street-act3,nugget,nugget-stove-out}/`; the corrected Nugget's hover re-read; contracts and ledger updated. Composer: `tools/retrofit/phase15-sheets.py`.

**PHASE 2 HAS NOT BEGUN. AWAITING TYLER'S PHASE 1.5 ENVIRONMENT REVIEW.**

## Q118 · Opening-set retrofit, phase 1.5B: the final environment cleanup — the trough as prop art, the funeral sheet as paper, the whole Nugget floor as dirt — **BUILT 2026-09-06, FINAL CLEANUP REVIEW AWAITING TYLER**

Tyler's live review of Phase 1.5 (Q117) found three remaining defects in environments whose direction stays owner-approved: the trough read as cut and pasted, jagged, older than the street and electric blue; the Act III funeral notice read as a glowing blank white rectangle; and the Nugget's dirt floor stopped at the front, leaving planks under and around the card table, the stove side and the bar-side circulation. This pass corrects exactly those three. **No character generated, no room life, no flicker, no Thad recalibration, no Room 6.** Image operations: Main Street 1 of 1 (the trough), the Nugget 1 of 1 (the floor, the owner-reassigned remaining operation), total 2 of 2; the funeral sheet 0.

**The trough (1 operation).** The Phase 1.5 deterministic treatment — the shipping plate's trough scaled 1.9 — is retired. New prop art was painted IN CONTEXT: the accepted plate has no true source (two stitched panels), so an errata-63 source canvas was built from a 1920-wide window of the plate around the site, and a mask freed only the trough's footprint in the mud beside the east rail (`art/staging/room-02/trough-01/trough-op.json` records purpose, source, mask and what must not change, before the call). The model painted a rough-timber trough with a few inches of dark water and one lamp reflection, and painted it lower than the mask; only the trough itself is taken — an authored polygon silhouette read off the result, never mud (`tools/retrofit/trough-extract.py`) — and placed with its ground footprint wholly in the mid mud band, so the far mud stays floor and a man there is behind it. The plate is untouched by construction. Hotspot, filled state, plane-1 mask (the same file), obstacle, approach and the occlusion proof point follow the new silhouette; the live proof stands Thad in front and behind.

**The funeral sheet (0 operations).** The authored clean sheet (`posted-notices-act3.png`) is treated deterministically: aged paper tone, seeded fibre, worn edges, faint suggested print without words, a tack, a cast shadow on the papers beneath, and the board's night value. The notice's copy exists only as the spoken LOOK line ("'THE PIANO MAN, MOURNED BY ALL.'"); no lettering art is authored for it, and none is invented. The ordinary board is unchanged. Not blocking Phase 2; a lettered sheet, if Tyler ever wants one read on screen, is future authored art.

**The Nugget floor (1 operation).** The Phase 1.5 mask stopped at the far wall's foot in front of the furniture. The Phase 1.5B mask is the whole public floor — doorway, the far wall's foot behind the piano and the table, the stove's and the back door's foot, the stairs' foot, the bar's front foot to the frame — with holes cut for the table top and for every pixel the restore classifier calls furniture, reviewed as a diagnostic before the call (`renders/opening-set-retrofit/phase15b-floor-mask-diagnostic.png`). The image edited was the Phase 1.5 result in source space, so the model continued the accepted foreground dirt rather than inventing a material. Afterwards `tools/retrofit/nugget-floor-restore.py --op 02` assembled `corrected-02`: the floor from the result only inside the mask, the furniture and everything outside the mask from the accepted plate byte for byte (0 pixels changed outside the floor or inside furniture), the stove out in the base and its fire lifted into the lit overlay exactly as before. The floor is one material from the doorway to the far wall; the wooden objects — bar, stools, table, chairs, piano and stool, stairs, doors, trim, spittoon, stove — stay wood. Fifteen of fifteen drawn subjects still answer their own names on hover.

**Record:** `renders/opening-set-retrofit/phase15b-*.webp`, live runs under `renders/proofs/candidates/`, contracts and the ledger updated. Composer: `tools/retrofit/phase15b-sheets.py`.

**PHASE 2 HAS NOT BEGUN. AWAITING TYLER'S FINAL ENVIRONMENT CLEANUP REVIEW.**

## Q119 · Opening-set retrofit, phase 1.5C: owner review of 1.5B failed — the Nugget floor made one floor; the Main Street integration operation failed and is stopped — **BUILT 2026-09-06, CORRECTIONS REQUIRED**

Tyler's live review of Phase 1.5B (Q118) rejected all three surfaces: the notice board and the trough still read as cut and pasted, and the Nugget floor kept plank remnants inside the rectangular furniture-restore regions. His ruling: the surfaces must look painted into the same environment, and the board structure and the trough belong in the plate itself, with a companion only for the notice paper that changes; the Nugget's public floor must be one continuous dirt floor, preserving actual furniture pixels only, no halos, no box restores. Both build contracts stay **FINAL ENVIRONMENT CLEANUP — OWNER REVIEW FAILED / CORRECTIONS REQUIRED** until Tyler approves new live screenshots.

**The Nugget (1 operation, the owner-directed third).** The whole public floor under one mask with no furniture holes (the table top excepted) on the Phase 1.5B result, so the model repainted the floor under and between every leg; afterwards nothing was restored by rectangle. The model's furniture stands as it kept it; the one thing it changed materially — it erased the brass spittoon at its place and painted a plain bucket by the near stool — is put right by the spittoon's authored silhouette from the accepted plate (a hotspot, an obstacle and canon) and the bucket covered with the floor beside it (`tools/retrofit/nugget-floor-final.py`, `art/staging/room-03/corrected-03/derivation.json`). Inspected at 2x and 3x in every region Tyler named: no board lines under or behind the table, at the stove side, along the bar, by the piano stool. Stove LIT/OUT unchanged.

**Main Street (1 operation, failed; stopped).** One in-context operation over the plate window freed the board wall and the trough footprint together (`art/staging/room-02/integrate-01/integrate-op.json`). The result is unusable on both counts and none of it is composited: the model painted the notice-board wall away — a plain wall with a lit window and a bench, no board, no papers — and painted a good trough outside its mask, at y 705–864, off the frame's bottom edge and past the rail post. Evidence: `renders/opening-set-retrofit/phase15c-street-failed-op.webp`. The plate stays candidate-01 with the Phase 1.5B companions, which Tyler has rejected. No further operation was spent without authorization. What the next attempt should change, for Tyler's ruling: (1) a 1:1 source canvas (a 1520×684 window of the plate placed unscaled, the trough site mid-frame, not at the bottom edge where the model twice put the trough off-frame); (2) two separate masks and prompts, the board first with the papers kept inside the mask as the thing to frame, the trough second; (3) the model shown the accepted trough result of Phase 1.5B as the reference for the object it is to paint in place. Two operations, one per subject.

**Nothing else moved.** No character, no room life, no flicker, no Thad recalibration, no Room 6.

**PHASE 2 HAS NOT BEGUN. AWAITING TYLER'S RULING ON THE NUGGET FLOOR AND THE MAIN STREET PLAN.**

## Q120 · Opening-set retrofit, phase 1.5D: Main Street's board and trough painted in place on local canvases (2 operations, both used), the Nugget frozen — **BUILT 2026-09-06, FINAL ENVIRONMENT REVIEW AWAITING TYLER**

Tyler's ruling after Q119: two independent local image operations, one for the bulletin board and one for the water trough, each with its own crop, mask, prompt, proof and failure stop; the results integrated as the existing objects' state images without changing the plate; the Nugget not to be modified in any way. Both operations were authorized with their own ledger caps (`main-street-board` 1, `main-street-trough` 2, the second cap's first attempt being Phase 1.5B's) and both were spent, once each, with Tyler's authorization.

**Why local canvases.** Phases 1.5B and 1.5C put the whole 1920×864 plate window on the canvas and the model twice painted the trough below its mask and off the frame's bottom edge, and once painted the board wall away. In 1.5D each operation gets a 1024×1024 canvas holding only a local window of the accepted plate, scaled so the site sits in the MIDDLE of the canvas, with only the site unmasked (`tools/retrofit/phase15d-prep.py`; the canvases and masks are drawn in `renders/opening-set-retrofit/phase15d-{board-01,trough-02}-canvas-diagnostic.png`). The board window is 500×500 at ×2 centred on the existing papered wall under the porch; the trough window is 720×444 at ×1.42 letterboxed at the canvas's middle, the site nowhere near an edge, with the Phase 1.5C trough (a good object, wrongly placed) passed as the object reference. The driver scales each result's window back to 1:1 (`tools/art/retrofit.mjs street-board`, `street-trough-local`; `art/staging/room-02/{board-01,trough-02}/`).

**Board (1 of 1, used, kept).** The prompt asks the model to frame THESE PAPERS into a public notice board at the existing location, the papers being the semantic anchor the 1.5C operation lost. The result is a boarded public notice board on its own posts, at the wall, with the plate's papers inside its frame and the porch, beam, post and boardwalk untouched outside the mask.

**Trough (1 of 1, used, kept).** The result is the same trough as the reference, whole, inside the mask, on the ground beside the east hitching rail, the rail and its posts untouched.

**Integration (0 operations).** Each result's masked zone becomes a full-frame RGBA companion over the UNCHANGED plate, alpha 1 inside the zone and feathered to 0 over the last 8 px, so the seam falls in the model's own repainted wall or mud, which matches the plate it was painted from (`tools/retrofit/phase15d-integrate.py`, `art/staging/room-02/companions-02/`). `posted_notices` ORDINARY is the new board; the Act III FUNERAL state is the same board with the Phase 1.5B aged funeral sheet tacked on it at 1.15× (a lettered sheet stays future authored art, non-blocking, as Q118 recorded). `water_trough` FILLED is the new trough; its plane-1 occlusion mask is an authored six-point silhouette cut on the new trough (`art/staging/room-02/trough-02/silhouette.json`), the obstacle and the pie woman's placement moved to match, and the far mud band declared plane 1 with a proof point at the trough's top edge. The plate file is unchanged; the companions-01 sign states stay in use; the companions-01 board, trough and funeral states are superseded.

**Proof.** `check-occlusion` PASS (the proof point behind the trough, mask coverage 11%); live proofs `main-street` and `main-street-act3` PASS with Thad walked in front of the trough and behind it and the funeral sheet and gilt sign in Act III (`renders/proofs/candidates/main-street*/life.json`). Inspected at 1:1 in every region Tyler named: the board, the trough, the dog zone, the sign, the rails and the porches (`renders/opening-set-retrofit/phase15d-sanity.webp`, `-main-street-full.webp`, `-board-detail.webp`, `-trough-detail.webp`, `-live.webp`).

**The Nugget.** FROZEN, as ruled: no floor, stove, furniture, hotspot, occlusion or state change. The Phase 1.5C floor stands as the review candidate, stove LIT/OUT unchanged, contract `PHASE 1.5C ENVIRONMENT — AWAITING OWNER VISUAL REVIEW`. It is not owner-accepted.

**Contracts.** Main Street `MAIN STREET FINAL ENVIRONMENT ART — READY FOR OWNER REVIEW BEFORE PHASE 2`; the Nugget as above. Nothing promoted; the shipping rooms untouched. No character, no room life, no flicker, no Thad recalibration, no Room 6.

**PHASE 2 HAS NOT BEGUN. AWAITING TYLER'S FINAL ENVIRONMENT VISUAL RULINGS.**
