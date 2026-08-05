# THE LAST CLAIM IN CONSOLATION
## The Room Brief Gate

*No room is generated, traced or composed until this gate has been completed for it in writing. Binding.*

---

# WHY THIS EXISTS

Room 1's plate went through six generations, and three defects were caught by the project owner rather than by anyone checking:

- **The lantern was in Thad's hand.** Doc 17 gives it to Hob, the night watchman. Thad arrives off a coach with a case and four dollars.
- **The strongbox was painted into the plate.** It is Thad's case and doc 17 makes picking it up the game's first PICK UP. A painted object can never be taken.
- **The road exited the wrong side**, and one draft had it blocked by firewood entirely.

Each was knowable from documents that already existed. None was checked.

**This gate is a written answer to every question below, produced before any image is requested, for every one of the remaining rooms.**

---

# THE GATE

## 1 · WHAT HAPPENS HERE

- Which puzzles from doc 02 take place in this room, and which of their steps are performed here?
- Which dialogue trees open here?
- Which scripted sequences play here?
- Which act or acts is this room visited in, and does anything about it differ between them?
- What does the player come here to do the **first** time, and what brings them back?

## 2 · EVERY OBJECT, CLASSIFIED

List every object the room contains. Each is exactly one of:

| Class | Definition | Where it lives |
|---|---|---|
| **PLATE** | Present in every state of the room, in every act, always | Painted into the background |
| **STATEFUL** | Present but changes appearance — open/shut, lit/cold, full/empty | Background, with a state image per doc 22 item 9 |
| **TAKEABLE** | Can leave the room in the player's inventory | **Sprite. Never in the plate** |
| **MOVER** | A person, animal, or vehicle that moves or departs | **Sprite. Never in the plate** |
| **ABSENT-LATER** | Present now, gone after some event | **Sprite or state image. Never in the plate** |

**The test is not "does it move." The test is WHETHER IT IS EVER ABSENT.** Anything that can be missing, taken, opened, extinguished or departed is not plate.

### THIS STEP IS EXECUTED, NOT REMEMBERED — `node tools/room-gate.mjs <room>`

This table was correct from the day it was written and Room 2's dog got
painted into the plate anyway, because the gate was a document somebody had
to remember to open, and the plate brief got written straight from doc 05's
hotspot list instead. Eight companion generations later Tyler asked whether
the dog should be a sprite. He was reading the rule off the picture; the rule
was already here.

So the step runs. The tool derives each hotspot's class from what the
documents already say — doc 05's sections, Part Two-B's act variants, doc
49/13's authored verbs, doc 02's item ledger — and prints three marks:

| Mark | Meaning |
|---|---|
| `!` | **Certain.** A mover, an opening, or a ledger item. Never plate. Companion generation required |
| `?` | **Needs a ruling.** An act variant that may repaint the object or may only change what Thad SAYS about it. Only reading it decides |
| ` ` | Plate |

**The `?` mark is the honest part.** An earlier version of this tool guessed,
classified every authored verb as stateful, and would have cost five needless
generations on Room 2 alone — the trough has an authored USE, but "I have
drunk from it once" does not change how a trough looks. A tool that cannot
tell proposes; a person rules.

**No plate brief may be written until every `?` is ruled**, and the brief is
written from the PLATE rows only.

## 2a · ROOM 2'S GATE, AS RUN (the worked example)

```
 ? THE FALSE FRONTS            act variant — RULED PLATE: Act II changes only
                               what he says ("every doorway says good morning")
 ? THE IMPROVEMENT COMPANY     act variant — RULED STATEFUL: Act III repaints
   SIGN                        it, "fresh gilt on the lettering"
 ? POSTED NOTICES              act variant — RULED STATEFUL: Act III posts the
                               funeral notice; Room 36 adds the sealed one
 ! A DOG                       MOVER. Reacts in doc 05 and doc 49, recognises
                               Thad in Act III, and is the last image of the
                               game on his back at dawn
   THE WATER TROUGH · THE BOARDWALK · THE CHURCH STEEPLE · THE MUD · THE HILLS
                               PLATE
```

Plus, from doc 13 rather than doc 05: **the assay office window** (ajar, and a
puzzle route).

**THE SIX DOORS: STATEFUL → PLATE-OPEN → CLOSED, in one sitting, and the last
answer is the right one.** Worth recording in full because the reasoning is
reusable.

The gate called them stateful. Tyler observed that MI's lit doorways make
buildings read as enterable, so they were regenerated permanently open and
lit — which looked wonderful and was wrong, on three counts ChatGPT named:

1. **It contradicts the room's own thesis.** Doc 05 calls Room 2 "the town
   performing prosperity at itself, at night, to nobody." Six blazing
   doorways is a street with something going on. The writing and the plate
   would have been arguing.
2. **Uniform invitation destroys the affordance.** If every door invites,
   none does. The SCUMM Bar reads as *the* place to go because it is the
   exception, not one of six.
3. **It promises explorable rooms behind every door**, and Consolation has
   six exits off this street, not sixteen.

**RULED: the closed-door plate is canonical; the saloon is the one lit
exception.** And the overlay recommendation is DECLINED — MI's doors do not
animate. The player walks to the door and the game cuts to the interior.
Three-state overlays for six doors is real art and engine work bought for a
beat the genre skips.

So the doors are neither plate-that-opens nor sprites: **they are exits with
a walkbox**, and they leave this list entirely.

**The gate's classification is only ever as good as the design it is run
against.** When a ruling changes what a thing DOES, re-run it — twice here,
and the second run was the one that agreed with the writing.

## 3 · HOTSPOTS AND THEIR LINES

- Every hotspot doc 05 and its batches write for this room, listed by name.
- **Does the picture contain something for each one to point at?** A LOOK line about a settee in a room with no settee is a ruling 19b violation whichever end you fix it from.
- Any hotspot whose subject is not in the composition: either add it to the brief or strike the line.

## 4 · MOVEMENT

- **Where does the player enter from, and where does he leave to?** Name the connecting rooms from doc 20 and errata 43.
- **Does each exit visibly exist in the picture?** A road that leaves the frame, a door, an alley, a stair — and is it wide enough to walk down at the far scale?
- Is there a continuous band of walkable ground of at least one and a half character heights?
- Where do the depth zones fall, and does the composition give a place for the scaling snap to hide?
- Which objects should occlude the actor, and are they positioned to do so?

## 5 · LIGHT

- What is the light source, where is it, and is it a **plate** light or a **mover's** light?
- **A light carried by a character is never painted into the ground.** If it were, the character could not move without leaving it behind.
- Is an interim baked version needed until the runtime light pass exists?
- What time of day, and does any other version of this room exist at another hour?

## 6 · THE PLATE SPECIFICATION

Written last, and derived from 2, 4 and 5 rather than described freshly:

- Everything in class PLATE, and nothing else.
- Every exit visible and traversable.
- No carried light.
- No lettering on any sign — the engine draws sign text at runtime.
- No figures of any kind.
- Ground continuous and ordinary wherever a mover or takeable will stand.
- 1600 × 720 exactly, which is 5× the 320 × 144 frame.

## 7 · THE SPRITE MANIFEST

Everything not in the plate, listed, with what it needs: facings, sizes per errata 24, states, idles per doc 32, and whether it carries a light.

---

# THE CHECK

**Before requesting art:** the gate is written into the room's brief document and the plate specification is derived from it, not invented alongside it.

**After art arrives:** each of sections 2 through 6 is verified against the image before it is quantised. A defect found here costs one regeneration. A defect found after tracing costs the trace.

**A room with no completed gate does not get generated.** This is an authoring gate, not a build check — but a room record whose brief document is missing should fail validation, so the omission is visible.

---

# ROOM 1, WORKED — the reference example

**1 · What happens here.** Doc 17's opening: Thad's declaration, the driver's four beats, the coach's departure, Hob's crossing, the case pickup. Act I only, once. Nothing brings him back.

**2 · Objects.**
- **PLATE** — the sign and posts, the fences and rails, the shack, barrels, crates, buckets, water butt, woodpile, wagon wheels, the mud with its ruts and puddles, the hills, sky, stars, and the town in the middle distance.
- **TAKEABLE** — Thad's case. *Three states per doc 17: on the coach, in the mud, carried. Never in the plate.*
- **MOVERS** — the coach and team as one unit, the driver, Hob with his lantern, Thad.
- **STATEFUL** — none.

**3 · Hotspots.** Doc 17's set: the sign, the mud, the coach (two states), the team, the case (three states), the watchman's lamp (absent before Hob enters), the road east, the road west. All present in the composition except the movers, which arrive as sprites.

**4 · Movement.** No entrance — the game begins here. One exit: the road, which must leave the frame and be walkable at far scale. *Doc 20 says west to Main Street; the art has it exiting right. Errata 43 is more recent and the art is fine — the doc needs correcting, not the picture.*

**5 · Light.** Hob's lantern, carried, and therefore **never painted into the ground**. The town's windows and the coach lamps are the only other warm light and both belong to movers. The plate is moonlight only. **An interim plate with the pool baked at Hob's mark is required until doc 15's P5 radial pass lands.**

**6 · Plate.** As above: no case, no coach, no team, no driver, no Hob, no lantern, no pool, no coach lamps. Blank sign. Road leaving frame right. 1600 × 720.

**7 · Sprites.** Thad (four facings, two sizes, idles, walk, talk, pickup). Hob (crossing, lantern, carried light). The coach and team as one unit with a departure. The driver on the box, seated, with idles.
