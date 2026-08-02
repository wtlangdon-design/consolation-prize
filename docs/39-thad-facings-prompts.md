# THAD — THE REMAINING THREE FACINGS
## Stacked prompt set

*The right-facing profile is done and rigged. Three remain. Run them in the order below.*

---

# HOW TO RUN THIS

## Attach TWO images to every one of these

1. **`reference/casting/room-01-casting-master.png`** — the casting sheet.
2. **The finished right-facing Thad** — the magenta one already approved.

The second is doing most of the work. Text alone will not hold a character across four generations; the finished profile is the anchor, exactly as the master was the anchor for the profile itself.

## Why four authored facings and not two mirrored ones

Errata 50 forbids runtime mirroring: costume asymmetry, frame-left lighting and eye direction make a flipped sprite visibly dishonest. Thad's coat laps one way and his waistcoat buttons one way — mirroring reverses both. Errata 54 changed the presentation spec but did not touch this ruling.

## Everything below is unchanged from the profile prompt

Neutral lighting. Magenta backdrop. Mid-stride with the legs clearly apart. No part of the figure overlapping any other part. Those four clauses are what make the rig work and none of them is negotiable.

## Expect to paint the arms

`tools/rig/mark-the-arm.html`, then `--near-mask` / `--far-mask`. Auto-detection found 43% of Thad's far arm on the profile and it will under-capture again. Assume it, don't discover it.

---

# 1 · LEFT PROFILE

*Run this first — it is the smallest change from the approved art, so it is the best test of whether the anchoring method holds.*

> Attached are two images: a scene from my game, and a character I have already approved — the man in the dark travelling coat on the magenta background.
>
> Draw THAT EXACT CHARACTER again, on a solid pure magenta background (#FF00FF), with nothing else in the frame — no ground, no shadow, no scenery, no other figures.
>
> **Same man.** Same face, same hair, same coat, same waistcoat, same collar, same shoes, same colours, same painting style, same level of stylisation. He must be unmistakably the same person as the attached character. Do not restyle him, do not make him more realistic, do not add photographic detail.
>
> **The only change is that he now faces the opposite way: full side profile facing FRAME LEFT.**
>
> This is a true mirror of his direction, not of his clothing — his coat still laps the same way across his body and his waistcoat buttons still run the same way. Draw him as the same man turned around, not as a flipped picture.
>
> **LIGHTING.** Neutral, plain, even daylight, as in the attached character. No night lighting, no blue moonlight, no lamp glow, no coloured light of any kind. His colours must read true.
>
> **POSE.** Mid-stride, walking, with the legs clearly apart and a visible gap of magenta between them running all the way up to the hem of his coat. Both arms hang down and away from the body, clear of the torso, hands empty.
>
> **NO PART OF THE FIGURE MAY OVERLAP ANY OTHER PART.** Arms clear of the torso. Legs clear of each other. Every limb separable as its own shape. Do not cross the arms, do not put a hand in a pocket, do not let the coat fall across an arm.
>
> His coat must reach just above the knee and its lower hem must be clearly visible as a distinct edge across both legs.
>
> He should fill the frame vertically.

# 2 · FRONT — walking toward the viewer

> Attached are two images: a scene from my game, and a character I have already approved — the man in the dark travelling coat on the magenta background.
>
> Draw THAT EXACT CHARACTER again, on a solid pure magenta background (#FF00FF), with nothing else in the frame.
>
> **Same man.** Same face, same hair, same coat, same waistcoat, same collar, same shoes, same colours, same painting style, same stylisation. Unmistakably the same person.
>
> **The change is the view: he now faces the VIEWER, walking straight toward the camera.** We see his front — his face, the front of his coat, the buttons of his waistcoat. He looks ahead at the viewer, level, neither up nor down.
>
> **LIGHTING.** Neutral, plain, even daylight. No night lighting, no coloured light. Colours read true.
>
> **POSE.** Mid-stride, one leg forward and one back, with the legs clearly apart and **a visible gap of magenta between them running all the way up to the hem of his coat**. Both arms hang down and away from his sides, clear of his body, hands empty and visible.
>
> **NO PART OF THE FIGURE MAY OVERLAP ANY OTHER PART.** Both arms must be entirely clear of the coat, with magenta visible between each arm and his body along their whole length. Legs clear of each other. Every limb separable as its own shape.
>
> His coat must reach just above the knee with its hem clearly visible as a distinct edge across both legs.
>
> He should fill the frame vertically.

# 3 · BACK — walking away from the viewer

> Attached are two images: a scene from my game, and a character I have already approved — the man in the dark travelling coat on the magenta background.
>
> Draw THAT EXACT CHARACTER again, on a solid pure magenta background (#FF00FF), with nothing else in the frame.
>
> **Same man.** Same coat, same hair, same shoes, same colours, same painting style, same stylisation. Unmistakably the same person seen from behind.
>
> **The change is the view: he now walks directly AWAY from the viewer.** We see his back — the back of his head and hair, the back of his coat, his heels. His face is not visible at all.
>
> **LIGHTING.** Neutral, plain, even daylight. No night lighting, no coloured light. Colours read true.
>
> **POSE.** Mid-stride, one leg forward and one back, with the legs clearly apart and **a visible gap of magenta between them running all the way up to the hem of his coat**. Both arms hang down and away from his sides, clear of his body, hands empty.
>
> **NO PART OF THE FIGURE MAY OVERLAP ANY OTHER PART.** Both arms entirely clear of the coat, with magenta visible between each arm and his body along their whole length. Legs clear of each other.
>
> His coat must reach just above the knee with its hem clearly visible as a distinct edge across both legs.
>
> He should fill the frame vertically.

---

# WHAT I CHECK ON EACH

1. **Same man.** Face, hair, coat cut, waistcoat, shoe colour against the approved profile. This is the one that cannot be fixed downstream.
2. **Neutral light.** No blue cast, no warm cast. He is tinted per room at runtime and a baked cast cannot be removed.
3. **Legs apart to the hem.** The rig fails loudly without it, and the failure message says so.
4. **Arms clear of the torso along their whole length.** Front and back views are the risk here — arms fall naturally against the body and the generator will do that unless told twice.
5. **Coat hem a distinct edge.** The hem detector needs a continuous single-run coat above and two separate legs below.
6. **Magenta only.** No stray backdrop colour inside the silhouette.

---

# A NOTE ON WHAT MIGHT NOT WORK

The front and back views ask for something the profile did not: **both arms clear of the body at once, seen head-on.** In profile, one arm naturally swings clear. Facing the viewer, arms hang against the coat by default and the pose is less natural to draw.

If they come back with arms touching the torso, the fallback is to paint both masks by hand rather than regenerate — a limb that overlaps the coat can still be marked, it just cannot be found automatically. Regenerate only if the *character* is wrong.
