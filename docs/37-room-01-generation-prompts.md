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
└─ D  = A + Hob crossing with lantern   attach A
```

*There is no F. The case is generated once, at E.*

Layers recovered by subtraction: **B−A** = coach and team · **C−B** = driver · **D−A** = Hob and his lantern · **E−B** = the case.

**If C is generated from A rather than from B, its coach will differ from B's coach and C−B is garbage.** Do not shortcut the chain.

## Priority

B and D are required. C is required before the opening sequence can play. E is small and can wait — the case is 22 × 12 at native and may end up hand-drawn instead.

## No mover layer may contain light cast on the ground

**Added after review. This corrects an error in the first version of this document.**

A layer recovered by subtraction is not light — it is **the lit pixels of the specific ground that was under the object.** Move Hob's pool and it carries that patch of mud, those ruts and those puddles across whatever it passes over. It does not illuminate new ground; it transports old ground.

So every generation below must keep light **on the object itself** and off everything else:

| Legal in the layer | Illegal in the layer |
|---|---|
| The lantern globe and flame | Any pool, patch or wash of light on the mud |
| Warm rim light on Hob's coat, hand and hat | Any glow on fences, posts, the sign or the shack |
| The coach lamp housings, lit | Any glow on the ground beneath the coach |
| Warm light on the coach body near its own lamps | Any cast shadow on the ground |

Light on the object travels correctly with the object, because it *is* the object. Light on the ground does not.

**Ground light is the runtime's job** — doc 15's P5 radial pass, or an authored additive mask applied at native. Either way it is authored against the ground it falls on at the moment it falls there. It is never baked into a mover.

## One design per object, then author every pose from it

The generations produce **one canonical design each**, not a pose library. Everything else is authored from that design at native resolution:

- **Hob** needs a walk cycle with the lantern swing synchronised to it. The generation gives one mid-stride figure to build it from.
- **The driver** needs seated, standing, climbing the wheel, reaching the rack, handling the case, and returning to the box. The generation gives the seated pose.
- **The case** is generated **once** and its roof, mud and carried states are authored from that single asset. Two generations of a 22 × 12 object produce two different cases.

## The coach layer is cut into components before anything moves

A single flat coach-and-team layer slid rightward is a cardboard cutout. Before authoring the departure, the recovered layer is separated into: coach body, near and far wheels, the two horses, each horse's head, legs, harness and traces, the lamps, and the driver's attachment point. Root motion moves the assembly; the components animate against it.

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
> **The coach.** A frontier mail and passenger stagecoach that has come four hundred miles and looks it. Heavy, dusty, boxy body on leather thoroughbraces, side-on to the viewer and angled very slightly toward the frame right. A luggage rack on the roof with a low rail around it, empty. Two lamps mounted at the front corners, lit, small and dim. **The lamps light only the coach itself** — a little warmth on the bodywork immediately around each lamp. **They cast no light whatsoever on the ground, the mud, the horses or anything else in the picture.** Iron-tyred wooden wheels, the rear pair noticeably larger than the front. **The near rear wheel has been repaired with two different woods and the repair is visible** — the replacement spokes are a paler timber than the rest. Dust over everything, and the dust is a different colour from this ground because it came from somewhere else. Doors, a small window, no lettering of any kind anywhere on the coach.
>
> **The team.** **Exactly two horses visible**, harnessed in front of the coach, standing still with their heads down and their necks low — tired, patient, not unhitched. Working animals, not cavalry horses: deep chest, short back, heavy legs, plain harness with a few small points of dull metal on the bridles. They read as one dark warm mass against the cold ground, separated from it by hue rather than by being darker. Two horses only. Do not add more.
>
> **Do not add:** any person, any driver, any passenger, any luggage or case or trunk on the roof or on the ground, any reins held by anyone, any lantern other than the two coach lamps, **any pool or glow of light on the ground, any cast shadow on the ground.** The mud under and around the coach must remain exactly as it is in the attached image.
>
> A man 200 pixels tall would stand beside this coach with the roof rack well above his head.

## C · THE DRIVER

*Attach: **B**, not the plate.*

> [TECHNICAL BLOCK]
>
> Add a single figure to the attached image: the stage driver, **seated on the driver's box** at the front of the coach, above and slightly behind the team. Nothing else in the picture changes — the coach, the horses, the lamps, the ground and everything behind them stay exactly as they are.
>
> A working stage driver in his fifties. Long coat, brimmed hat, gloves. If he sits close enough to a coach lamp to catch it, a slight warm rim on the lamp-facing side of his coat and hat is correct — **on him only, never on the box, the coach or the ground.** Sitting square and settled, forearms on his knees or holding slack reins, facing forward over the team, **not looking toward the viewer**. Unhurried. He has done this run many times and is waiting rather than resting.
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
> **The lantern is the only NEW warm source near the viewer, and its light must fall on him and nothing else.** The distant town's existing lit windows stay exactly as they are — do not cool them, darken them, or remove them in order to make the lantern the brightest thing. The globe glows warm ochre and gold. That warmth reaches his hand, his sleeve, the near side of his coat and the underside of his hat brim, and stops there.
>
> **Do not draw any light on the ground.** No pool, no patch, no wash, no glow, no cast shadow on the mud. The road beneath and around him must remain exactly the cold moonlit mud that is in the attached image, unchanged, right up to the edge of his boots. The ground light is added later by the game engine and must not be present here.
>
> A standing man in this picture is 200 pixels tall. Draw him at that height.
>
> **Do not add:** the coach, horses, any second figure, any other light source, any change to the distant town's windows, **any light or shadow on the ground.**

## E · THE CASE — hand-drawn, not generated *(low priority)*

*At 22 × 12 native a canonical case is faster and more consistent to draw by hand than to generate, and hand-drawing removes the difference-isolation risk entirely. The prompt below is retained only if a generated reference is wanted first.*

*Attach: **B**. **There is no F.** The case is generated in one state only and its mud and carried states are authored from this single asset — two generations of a 22 × 12 object produce two different cases.*

> [TECHNICAL BLOCK]
>
> Add one small piece of luggage to the luggage rack on the roof of the coach, and change nothing else. A modest travelling case — leather or canvas over a wooden frame, a single handle, plain metal clasps, worn but cared for. It belongs to someone with very little, packed carefully. It sits alone on the rack, not strapped down. **No lettering, no monogram, no labels.** Nothing else in the image changes.


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
9. **No ground light** — the changed-pixel mask contains no mud, road, fence or ground pixels that were merely re-lit rather than covered. A recovered layer whose alpha includes lit ground is rejected and regenerated. This is the check that the first version of this document was missing.

## Deterministic processing, because prompting cannot enforce format

The checks above catch failures; they do not prevent them. Everything after acceptance happens at native resolution under code, not under instruction:

- Decimate 5 → 1 and do all final work at **320 × 144**.
- Quantise **only the new sprite pixels**; plate pixels are copied, never requantised.
- Assign reserved indices explicitly. `accent_gold` 225–228 belongs to Hob's flame and to nothing else in Room 1.
- Any upscale is nearest-neighbour only.
- Reject any edit that changed a plate pixel outside its permitted mask.

---

# PART FIVE — RULINGS

**1. Two horses.** Confirmed and closed. Doc 05's written line governs; `team.py`'s three horses were derived from counting hooves in a discarded image.

**2. Road direction. THE FRAME-RIGHT RULING IS RETRACTED — Q2 IS OPEN.** It was made without reconciling the visible town, the written lines and the coach's direction. A coherent resolution is proposed in `docs/36-issue-list.md` Q2: frame right stays the coach's departure and the road home, and Thad reaches Main Street by walking into depth toward the town he can see. It amends errata 43 and awaits the project owner. **No effect on these prompts** — the coach departs frame right under every reading.

**3. The placard.** Ruled and closed: remove the mark so the board reads as ordinary scrap, not a second sign or a false hotspot. Hand-removed at native, no regeneration.
