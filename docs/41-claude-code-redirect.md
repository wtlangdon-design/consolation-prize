# CLAUDE CODE — REDIRECT
## Stop. The presentation spec changed underneath you.

*Paste this whole thing. Do not summarise it.*

---

# READ THESE FIRST, BEFORE WRITING ANY CODE

1. `docs/00-errata.md` **ruling 54** — the presentation spec was replaced wholesale
2. `docs/36-issue-list.md` — decisions taken, defects found, open questions
3. `docs/38-character-pipeline.md` — how characters are made now
4. `docs/40-actor-clip-inventory.md` — what clips exist and what each character needs
5. `CLAUDE.md` — carries a stop notice at the top

Confirm you have read errata 54 before you touch anything.

---

# WHAT IS VOID

| Was | Is now |
|---|---|
| 320 × 200 window, 320 × 144 play area, 56px verb panel | **1920 × 1080, play area 1920 × 864, verb panel 216px** |
| 256-entry locked indexed palette | **Full RGB. No index palette.** `art/palette/consolation-256.json` is reference only |
| ~40px characters, two drawn sizes | **~233px at mid-depth, one drawn size, scaled by depth** |
| Decimation scaler (errata 24) | **Ordinary filtered resampling** |
| Integer scaling (errata 39) | **Void.** Its fullscreen and mouse rulings stand |
| 1-bit 5 × 7 font | **Void, no replacement chosen. Do not pick one.** |
| Palette cycling (doc 18) | **Void. The mechanism is gone.** Every room's `cycling` block is dead data |

**Docs 11 and 18 are void in full.** Doc 06's presentation section is void.

## Doc 34's own preserve list is partly void — this will trip you

Doc 34 says to preserve *"decimation, occlusion, locked palette, integer scaling."* **Three of those four no longer exist.** Errata 54 is more recent and wins. Preserve occlusion, walk boxes, feet anchoring, content-driven text, one-click behaviour, combination precedence, and no hints/death/timers/lose states. Discard the rest of that clause.

`engine/core/Decimation.ts` and `engine/core/PaletteCycling.ts` implement voided specs.

---

# WHAT DID NOT CHANGE

Every written line. Every puzzle. Every dialogue tree. The reveal schedule. Room topology. The verb model and errata 28b's click rules. Doc 33's save and shell architecture. **Doc 34's verdict and its A–G order stand, and so does its stop condition.**

This is a presentation ruling and nothing else.

---

# THREE DEFECTS FOUND IN THE RUNTIME

Verified against the current files. Recorded as X4 in `docs/36-issue-list.md`.

**1. The host discards the actor.** `GameScene.host()` implements every motion method as `(_actor, …) => { this.actor.… }`. The argument arrives and is thrown away. **Every `walk`, `face` and `chore` drives Thad**, whichever actor the step names. A driver chore animates Thad today.

**2. `Opening.stepsFor` emits only `say` and `wait`.** Doc 17's visual descriptions — the coach arriving, Thad climbing down, the case landing in the mud, the departure, Hob crossing — never lower to anything executable. The runtime waits eight seconds while a beat says the coach arrives, and no coach moves.

**3. There is no general room mover.** `Renderer.drawPeople` builds its list from the ambient NPC set plus the single player actor. There is no path for Hob, the driver, the horses or the coach.

**The step grammar is not the problem.** `Sequence.ts` already defines `walk`, `waitForActor`, `face`, `chore`, `say`, `wait`, each carrying an actor id. It does not need inventing — it needs honouring.

**Beat 9 additionally has no carrier.** Hob's crossing is a player-control beat and the opening runner completes before anything schedules it.

---

# WHAT TO DO

Stay on doc 34's A–G order. The presentation change does not reorder it.

**Step B as scoped, plus the three defects above**, because they block E's integrated proof and nothing else can be proven without them:

- Make the host honour the actor argument on `walk`, `face` and `chore`.
- Add a general room actor so a named mover other than the player can be drawn, positioned, depth-sorted and animated.
- Lower doc 17's staging descriptions into real `walk` / `face` / `chore` steps.
- Give beat 9 a carrier.

**Do not** implement docs 29–33 in sequence. Doc 34's verdict on that stands.

---

# ART THAT NOW EXISTS

```
art/actors/thad-walk-{front,back,left,right}/   8 frames + rig.json
art/actors/thad-idle-{front,back,left,right}/   6 frames + rig.json
reference/casting/                              approved plate, casting master, sources
reference/masks/                                painted limb masks
tools/rig/character.py                          the rigging tool
```

Each `rig.json` carries `facing`, `walk_dx`, `figure`, `hem_row`, `padding` and frame count. **Read the walk direction from `walk_dx`; do not infer it.** It was got backwards on both characters by hand.

Frames are full-resolution RGBA on a padded canvas — the padding exists so a swinging limb is not clipped. Scale to ~233px at mid-depth and anchor at the feet.

**Do not modify anything under `tools/rig/` or `reference/`, and do not regenerate any art.** That pipeline is not yours.

---

# WHAT IS STILL MISSING, SO YOU DO NOT WAIT ON IT

- `recoil`, `pickup`, `reach` clips — not made yet
- `content/actors/thad.json` still describes the voided spec: two drawn sizes, decimation threshold 30, 40px height. **It needs rewriting and that is not your call to make.**
- No font is chosen
- Depth scaling curves per room do not exist
- With cycling void, errata 35a's motion floor now costs sprite frames in all 44 rooms

---

# FOUR QUESTIONS ARE OPEN — DO NOT GUESS

Q7–Q10 in `docs/36-issue-list.md`: whether a `talk` clip exists, whether `pickup` and `reach` need four facings, the `thad.json` rewrite, and whether the mud/boardwalk surface variants survive. **The last one is the difference between 12 and 24 clips per character across 27 characters.** If you need any of them answered, ask — do not decide.

---

# THE STOP CONDITION STILL BINDS

Errata 52: no new global design rulings until the integrated proof, the canonical street loop, and a safe save/load/title flow are executable. Errata 54 was the one permitted exception, taken as a direct canon contradiction.

New findings go in `docs/36-issue-list.md`. They do not become rulings.
