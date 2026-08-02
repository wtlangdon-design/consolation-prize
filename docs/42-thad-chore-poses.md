# THAD — THE CHORE POSES
## Stacked prompt set for everything the rig cannot derive

*Five clips need new generated poses. The rig transforms art that exists; it cannot fold a standing man at the waist. Once a key pose exists the rig supplies every frame between it and `stand`.*

---

# HOW TO RUN THIS

## Attach two images, always

1. **The approved right-facing Thad** — `reference/casting/thad-profile-right-approved.png`
2. **The facing you want**, if it isn't the right profile — `thad-profile-left.png`, `thad-front.png` or `thad-back.png`

The first fixes identity. The second fixes the view. Text alone will not hold a character across another six generations.

## The four clauses that never change

Every prompt below carries these, and none is negotiable:

- **Magenta backdrop** `#FF00FF`, nothing else in frame
- **Neutral even daylight.** No night lighting, no coloured light — the game tints per room
- **No part of the figure overlaps any other part.** Arms clear of torso, legs clear of each other
- **The coat hem is a visible distinct edge** across both legs

## Which facings each clip needs

**Not all four.** Doc 36 Q8 asks whether chores need four facings; until it is ruled, generate the ones the staging actually uses.

| Clip | Facings needed now | Why |
|---|---|---|
| `talk` | 4 | He talks in every room, facing anything |
| `pickup_low` | right, left | Doc 17's case pickup, and most objects are on the ground beside him |
| `use_near` | right, left, front | Doors and objects at chest height |
| `give_offer` | right, left | Handing something to someone standing beside him |
| `shrug` | 4 | A comic beat that must read from anywhere |
| `alight_coach` | **one only** | Room 1's blocking is locked; the coach is on one side |

---

# 1 · TALK — the mouth-open key pose

*Highest priority. He speaks in every room and currently cannot.*

> [Attach the approved Thad and the facing wanted]
>
> Draw THAT EXACT CHARACTER again on a solid pure magenta background (#FF00FF), nothing else in frame — no ground, no shadow, no scenery.
>
> Same man, same face, same hair, same coat, same waistcoat, same collar, same shoes, same colours, same painting style. Unmistakably the same person.
>
> **The only change is his mouth: it is OPEN, mid-speech.** Not shouting, not grinning — an ordinary open mouth partway through a word. The jaw drops slightly. Everything else about his head is identical: same eye line, same brow, same hair, same hat position, same head angle.
>
> **His body is unchanged from the attached image.** Same stance, same arms, same legs, same everything below the neck. Only the mouth differs.
>
> Neutral even daylight, no coloured light. He fills the frame vertically.

**Also generate a half-open version** by repeating the prompt with *"his mouth is only slightly open, barely parted"*. Three mouth states — closed from `stand`, half, open — give the loop.

**The body must be identical below the neck.** If it is not, the rig extracts the head and composites it over the stand frame instead, which is the head-overlay approach doc 40 prefers anyway.

# 2 · PICKUP_LOW — bent to the ground

> [Attach the approved Thad and the profile wanted]
>
> Same man, same everything, on solid pure magenta (#FF00FF), nothing else in frame.
>
> **He is bending down to pick something up off the ground.** Full side profile. Knees bent, back inclined forward, the near hand reaching down and forward to about ankle height with the fingers open, about to close on something. The far arm hangs back for balance, clear of his body. His head follows his hand — he is looking at what he is reaching for, not at the viewer.
>
> **His hand is empty.** He is reaching, not holding. The object is a separate sprite.
>
> **No part of the figure overlaps any other part.** The reaching arm is clear of the leg beneath it, with magenta visible between them. The far arm is clear of the coat.
>
> His coat hangs open as he bends, its hem a visible edge. Neutral even daylight. He fills the frame vertically.

# 3 · USE_NEAR — reaching at chest height

> [Attach the approved Thad and the facing wanted]
>
> Same man, same everything, on solid pure magenta (#FF00FF), nothing else in frame.
>
> **He is reaching forward to touch or operate something at chest height** — a door handle, a lever, a latch. The near arm extends forward and slightly up, elbow bent, hand open and about to make contact. The far arm hangs at his side, clear of the body. He stands upright with his weight even; only the arm reaches.
>
> **His hand is empty and open.**
>
> **No part of the figure overlaps any other part.** The reaching arm must be clear of his chest and coat along its whole length, with magenta visible between them.
>
> Neutral even daylight. He fills the frame vertically.

# 4 · GIVE_OFFER — holding something out

> [Attach the approved Thad and the profile wanted]
>
> Same man, same everything, on solid pure magenta (#FF00FF), nothing else in frame.
>
> **He is offering something to someone standing in front of him.** Full side profile. The near arm extends forward at about waist height, elbow slightly bent, **palm turned upward and open** as though presenting a small object. The gesture is polite and slightly hopeful — he is a man who expects this to go well.
>
> **His hand is empty.** Whatever he offers is a separate sprite attached to his palm.
>
> The far arm hangs at his side, clear of the body. He stands upright.
>
> **No part of the figure overlaps any other part**, with magenta visible between the offering arm and his coat.
>
> Neutral even daylight. He fills the frame vertically.

# 5 · SHRUG — the comic beat

*The hands are the point. A shoulder rise alone is already covered by `idle-break`.*

> [Attach the approved Thad and the facing wanted]
>
> Same man, same everything, on solid pure magenta (#FF00FF), nothing else in frame.
>
> **He is shrugging.** Both shoulders are raised toward his ears. Both arms are bent at the elbow with the forearms turned outward and **both palms open and turned upward**, hands roughly at waist height and held out from his sides. His head is pulled down slightly between the raised shoulders. His expression is mild — this is a dry, resigned shrug from a polite man, not comic exasperation.
>
> **Both hands must be fully visible and clear of his coat**, with magenta between each arm and his body along its whole length. This gesture is unreadable if the hands are hidden.
>
> Neutral even daylight. He fills the frame vertically.

# 6 · ALIGHT_COACH — Room 1 only, one facing

*Generate only after the coach's blocking is final. The direction he faces coming down is determined by which side the coach door ends up on.*

> [Attach the approved Thad and the profile matching the coach's side]
>
> Same man, same everything, on solid pure magenta (#FF00FF), nothing else in frame — **no coach, no step, no door.** Those are separate room objects.
>
> **He is stepping down from something high, mid-descent.** Full side profile. His leading foot has just reached the ground and taken his weight; the trailing leg is still bent behind and above, its foot not yet down. His near hand is raised to about shoulder height, fingers curled as though holding a rail that is not drawn. His body is lowering, slightly crouched, weight forward.
>
> He is careful rather than athletic — a man in town shoes getting down from a coach without falling.
>
> **No part of the figure overlaps any other part.** Legs clear of each other with magenta between them. The raised arm clear of his head and coat.
>
> Neutral even daylight. He fills the frame vertically.

---

# WHAT I DO WITH EACH ONE

1. Key the magenta, despill, bleed the edges.
2. Paint the arm masks in `tools/rig/mark-the-arms-*.html` — **assume this is needed**; auto-detection found 43% of a limb on the profile.
3. Derive the in-between frames between the key pose and `stand`, so the chore begins and ends at the pose every other clip returns to.
4. Place `begin` / `contact` / `commit` / `recover` / `complete` markers on the frames, per doc 40's contract.

**A chore that does not start and end at `stand` will pop.** That is why `stand` was built as frame 0 of `idle` rather than as its own drawing.

---

# WHAT IS STILL NOT COVERED AFTER ALL SIX

- **Carrying the case** — Q11. Visible carry is a whole extra locomotion family: stand plus walk in four facings, 36 frames, with the case on a hand socket. It cannot be faked with the ordinary walk.
- **Straightening his coat** — doc 17 beat 2. One-shot, one facing, and small enough that it may not deserve a generation.
- **The far tier** — voided. Errata 54 replaced two drawn sizes with one scaled by depth.
