# ROOM 1 — THE STAGE ROAD
## Generation prompt set, stacked

*Every generation below is an **edit of an existing image**, not a fresh render. That is the entire method. Read Part One before pasting anything.*

---

# PART ONE — HOW TO RUN THIS

## The one rule that matters

**The plate already exists and is correct. Nothing regenerates it.**

Each prompt below attaches an image and asks ChatGPT to *add one thing to it*. The object is then recovered by subtracting the two images. That subtraction only works if every pixel outside the added object is byte-identical.

Your interim plate proved this is achievable: 95,350 pixels changed, every one of them inside a single box, and 1,056,650 pixels untouched. That is a tool doing a local edit. Aim for exactly that again.

## The chain, and why order is binding

Generations must be produced **in this order**, each attaching the output of the one before:

```
A  PLATE                        (done — room01-room-blank-sign-open-road-1600x720.png)
│
├─ B  = A + coach + two horses          attach A
│  │
│  ├─ C = B + driver on the box         attach B
│  └─ E = B + case on the roof rack     attach B
│
├─ D  = A + Hob crossing with lantern   attach A
└─ F  = A + case in the mud             attach A
```

Layers recovered by subtraction: **B−A** = coach and team · **C−B** = driver · **D−A** = Hob with his light · **E−B** = case on roof · **F−A** = case in mud.

**If C is generated from A rather than from B, its coach will differ from B's coach and C−B is garbage.** Do not shortcut the chain.

## Priority

B and D are required. C is required before the opening sequence can play. E and F are small and can wait — the case is 22×12 at native and may end up hand-drawn.

## Never ask for a second frame

Animation frames are made by **editing the recovered layer**, not by generating again. "Same coach, horse's head slightly lower" will drift across the whole image and the difference will be worthless. One good generation per object, then the motion is authored on top of it.

---

# PART TWO — THE TECHNICAL BLOCK

**Paste this verbatim at the top of every prompt below. Do not paraphrase or shorten it.**

> This is an edit of the attached image, not a new image. Every pixel outside the object I am asking you to add must remain exactly as it is. Do not redraw, re-render, restyle, re-light, sharpen, denoise, upscale, or "improve" any part of the picture. Do not adjust brightness, contrast, saturation, or colour balance anywhere. Do not touch the sky, the stars, the hills, the distant town or its lit windows, the sign, the fences, the shack, the barrels, the wagon wheels, the woodpile, or the mud and its ruts and puddles.
>
> Output must be **PNG**, exactly **1600 × 720 pixels**, with no resampling and no compression artefacts. Do not return JPEG.
>
> The image is pixel art at an internal resolution of 320 × 144, displayed at 5× — every 5 × 5 block of pixels is one flat colour. **The object you add must obey the same grid**: drawn as if at 320 × 144 and scaled up 5×, hard edges, no anti-aliasing, no soft shadows, no gradients, no blur. Match the existing palette exactly — cold indigo, grey and weathered timber, with warm ochre and gold only where a flame reaches.
>
> Night scene lit by moonlight. Camera at standing eye level, horizontal, no tilt.

## Scale, and it is the thing most likely to go wrong

The player character stands **200 pixels tall** in this 1600 × 720 image (40px at native). Everything added must be sized against that:

| Object | Height in the 1600 × 720 frame |
|---|---|
| A standing man | **200 px** |
| Horse, ground to withers | **175–190 px** |
| Coach body, ground to roof line | **235–260 px** |
| Coach roof rack, top edge | **≈ 300 px** |
| Coach wheel, rear | **110–130 px** |

**State the man-height number in the prompt every time.** A stagecoach drawn at "correct" size without a reference comes out either toy-sized or the height of a house.

---

# PART THREE — THE PROMPTS

## B · THE COACH AND TEAM

*Attach: the plate. This is the important one — everything else chains off it.*

> [TECHNICAL BLOCK]
>
> Add a halted stagecoach and its team to the road, standing on the open mud in the middle-right of the frame, positioned so it has clear unobstructed ground to drive off the right-hand edge of the picture. The coach faces frame right.
>
> **The coach.** A frontier mail and passenger stagecoach that has come four hundred miles and looks it. Heavy, dusty, boxy body on leather thoroughbraces, side-on to the viewer and angled very slightly toward the frame right. A luggage rack on the roof with a low rail around it, empty. Two lamps mounted at the front corners, lit, small and dim — a low warm glow that reaches the coach itself and about a foot of ground beneath it and no further. Iron-tyred wooden wheels, the rear pair noticeably larger than the front. **The near rear wheel has been repaired with two different woods and the repair is visible** — the replacement spokes are a paler timber than the rest. Dust over everything, and the dust is a different colour from this ground because it came from somewhere else. Doors, a small window, no lettering of any kind anywhere on the coach.
>
> **The team.** **Exactly two horses visible**, harnessed in front of the coach, standing still with their heads down and their necks low — tired, patient, not unhitched. Working animals, not cavalry horses: deep chest, short back, heavy legs, plain harness with a few small points of dull metal on the bridles. They read as one dark warm mass against the cold ground, separated from it by hue rather than by being darker. Two horses only. Do not add more.
>
> **Do not add:** any person, any driver, any passenger, any luggage or case or trunk on the roof or on the ground, any reins held by anyone, any lantern other than the two coach lamps.
>
> A man 200 pixels tall would stand beside this coach with the roof rack well above his head.

## C · THE DRIVER

*Attach: **B**, not the plate.*

> [TECHNICAL BLOCK]
>
> Add a single figure to the attached image: the stage driver, **seated on the driver's box** at the front of the coach, above and slightly behind the team. Nothing else in the picture changes — the coach, the horses, the lamps, the ground and everything behind them stay exactly as they are.
>
> A working stage driver in his fifties. Long coat, brimmed hat, gloves. Sitting square and settled, forearms on his knees or holding slack reins, facing forward over the team, **not looking toward the viewer**. Unhurried. He has done this run many times and is waiting rather than resting.
>
> Drawn at the same 5× pixel grid as the rest of the image, hard-edged, no anti-aliasing. A standing man in this picture would be 200 pixels tall; seated on the box he occupies proportionally less.
>
> **Do not add:** a lantern, a whip in motion, a second figure, any luggage, any change to the coach or horses.

## D · HOB, CROSSING

*Attach: the plate. Not B — the coach must not be in this one.*

> [TECHNICAL BLOCK]
>
> Add a single walking figure with a lantern to the open road, crossing the frame. Place him on the open mud left of centre, in clear ground, with nothing overlapping him.
>
> A night watchman in his sixties, walking steadily from one side of the road toward the other, **in profile, mid-stride, not looking toward the viewer**. Long coat, brimmed hat. He carries an oil lantern low in one hand, out a little from his body. He is unhurried and entirely uninterested in anything else in the picture.
>
> **The lantern is the only bright warm thing in the frame.** It casts a small pool of warm ochre and gold light on the mud directly beneath and around him — no wider than about one and a half times his own height, falling off quickly to nothing. The light warms him and the ground at his feet and nothing else: it does not reach the fences, the sign, the shack, or the far side of the road. It is a lamp, not a torch.
>
> **The pool of light must be attached to him** — centred on him and moving with him, not a patch of lit ground he happens to be standing near.
>
> A standing man in this picture is 200 pixels tall. Draw him at that height.
>
> **Do not add:** the coach, horses, any second figure, any other light source, any change to the distant town's windows.

## E · THE CASE ON THE ROOF *(low priority)*

*Attach: **B**.*

> [TECHNICAL BLOCK]
>
> Add one small piece of luggage to the luggage rack on the roof of the coach, and change nothing else. A modest travelling case — leather or canvas over a wooden frame, a single handle, plain metal clasps, worn but cared for. It belongs to someone with very little, packed carefully. It sits alone on the rack, not strapped down. **No lettering, no monogram, no labels.** Nothing else in the image changes.

## F · THE CASE IN THE MUD *(low priority)*

*Attach: the plate.*

> [TECHNICAL BLOCK]
>
> Add one small travelling case standing in the mud in the near foreground, set down flat and upright as if placed rather than dropped. Same case as described for the roof rack: leather or canvas over a wooden frame, single handle, plain clasps, worn, no lettering or monogram of any kind. It is not open. Nothing else in the image changes — no figure, no coach, no light on it beyond the moonlight already in the picture.

---

# PART FOUR — WHAT I CHECK WHEN THEY COME BACK

Run before anything is traced or animated. Each is a one-line pass or fail.

1. **Format and size** — PNG, exactly 1600 × 720. JPEG fails immediately and cannot be repaired.
2. **Block structure** — every 5 × 5 block one flat colour. The plate scored 100%. Anything below that means the tool resampled and the whole image drifted.
3. **Difference isolation** — all changed pixels inside one bounding box, zero changed pixels elsewhere. This is the pass/fail for the whole method.
4. **Reserved bands** — `accent_gold` 225–228 and `accent_indigo` 239–241 assigned deliberately, not by colour distance. On the plate a plain quantiser put 408 pixels of the puddle-cycling band into the sky. Hob's lantern is the *only* thing in Room 1 that should occupy the gold band.
5. **Scale** — coach roof rack ≈ 300 px, horses 175–190 px at the withers, figures 200 px.
6. **Canon** — two horses, not three. No lettering anywhere. No case in B. No driver in B. No coach in D.
7. **Ground contact** — wheels and feet land on ground that exists, at a depth consistent with their size.
8. **Departure path** — B leaves clear mud between the coach and the right edge of the frame, wide enough for it to drive off.

---

# PART FIVE — THREE THINGS YOU SHOULD RULE ON

**1. Two horses, not three.** Doc 05's written LOOK line is *"Two horses I can see and I am told there are four more."* The existing procedural team draws **three**, with a long justification derived from counting nine hooves in the original ChatGPT image. Errata 53 changes no written line, so the line wins and the art was wrong. The prompt above says two. Confirm.

**2. The road-direction contradiction is live.** Errata 43 sets the walking order west-to-east as Room 1 · Main Street · Lower Street, which puts Main Street *east* of Room 1. But the room record's exit `road_west` goes to Main Street, `road_east`'s LOOK line is *"Home is that way. It is eleven hundred miles that way"* — home being Rhode Island, i.e. east — and doc 17 beat 6b has the coach depart **frame right** and beat 7 has it recede **east**. Doc 35's worked example noticed half of this and ruled the art fine.

It does not affect these prompts: the coach departs frame right either way. It does affect where Thad walks to reach town. The picture puts the town in the middle distance centre-left, which doc 29 already supports as a road-into-depth transition — the actor walks away from camera and the next room opens at a far-depth entrance. That would resolve it cleanly, but it's a topology ruling and errata 52's stop condition means it's yours, not mine.

**3. The placard.** There is a second small signboard on the fence carrying an illegible mark. Doc 17's hotspot set has one sign. Either it gets a LOOK line or it gets painted out. It is small enough to remove by hand at native — it does not need a regeneration.
