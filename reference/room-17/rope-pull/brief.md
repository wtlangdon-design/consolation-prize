# Thad pulls the bell rope — generation and integration brief (Room 17)

Written 2026-11-06 for Tyler's authorization of that day: **up to 2 image operations**, asset `thad-rope-pull` in `art/staging/caps.json` (one sheet, one correction showing the generator the side-by-side if the first misses, per CLAUDE.md's character style gate step 4). Nothing else may be spent under this asset.

**Status (2026-11-06): generated and integrated -- one operation of two spent.**

- **The prompt below was refused twice, before any image, by the image service's filter** (`moderation_blocked`, "violence, self-harm"): verbatim as `prompt-01.txt`, then reframed as bell-ringing as `prompt-02.txt` (Tyler approved the reframing). A man gripping a rope that hangs onto his head reads to it as a hanging. Neither call returned an image, and Tyler ruled neither counts against the cap; they are not in the ledger.
- **Tyler chose "no rope in the art."** `prompt-03.txt` asks for the same six poses with empty hands, against `style-reference-no-rope.png` (the church plate with Thad lifted out of the reference frame and set down by the stove, nothing above him). It passed: thad-rope-pull attempt 1, `art/staging/thad-rope-pull/sheet-01.png`. The church plate's own rope already hangs to the top of his head, which is where his fists come down, so no rope is drawn.
- **Measured before anyone looked** (pose 6 against his back-facing stand frame at the rope's 469 px): texture 3.43 against 2.75 (1.25x, under the 1.35 flag), brightness 61.7 against 54.0, saturation 85.0 against 78.7 -- graded to Thad when cut. No correction spent.
- **Cut** by `tools/rig/cut-rope-pull.py`, not `cut-sheet.py`: that scales from pose 1 (here the reach, taller than a standing man) and aligns poses by their left edge; this scales from pose 6 and places each pose by its feet. Raised arms rise above the crown, so the canvas is 740x829 with the soles at row 764: the rig's new `sole_row`, which `tools/build-actor-record.mjs` and `tools/check-rig-describes-frames.mjs` now read.
- **The bell on the downstroke.** A verb's reaction plays before its line and the line fires its sound, so the toll would have come after he let go. The clip's new `landsAt` (rig `lands_at` 2) moves on to the line at pose 3 while the clip plays out; R17-BELL's `at` stays 0.12, so the bell sounds at about 0.45 s, on pose 4. Measured in the browser: cue at 0.33 s on pose 3.
- **Played** by `reactions: { "PULL": "reach" }` on `bell_rope`, from the annotation's new `reactions` (compile-room carries them).

## Why

Doc 49 wrote THE BELL ROPE · PULL ("The whole town orders its morning by that flat note, and it was not morning. Sowerby appeared before the echo died. We have agreed it was the wind."), and since errata 106–108 it tolls the bell over a ducked score. Thad does not move when it happens: he has no pull. Doc 40 names the clip PUSH and PULL want as **reach** ("Same clip, probably"), and no `reach` exists. The only back-facing pull he has is `tug` (his boot stuck in the mud), arms at his sides, which does not read as a pull on a rope overhead.

## Sources (nothing here is invented beyond art direction)
- Doc 49 Room 17, THE BELL ROPE · PULL (above). The rope is the church's own: doc 05 LOOK, "Frayed at pulling height by six years of Reverend Sowerby's mornings."
- `content/rooms/church.json`, `bell_rope`: walkTo (515, 857), facing **back**. The rope hangs down the wall from the bell to just above his head (see the reference).
- `content/actors/thad.json`: back-facing figures are 625 px tall, anchor (370, 625), `reactRate` 7 frames a second. Drawn at 469 px at the rope (the room's curve).

## Reference image
`style-reference.png` (full frame) and `style-reference-crop.png` (around the rope): Thad, at game size, standing at the bell rope in the church plate, from behind. **Attach the crop.** Showing the generator Thad in the actual room is what got the cast to his idiom; word-only descriptions failed six times. Too sharp is the usual miss (CLAUDE.md): Thad is flat, soft-shaded and low in texture.

## The prompt (verbatim)

```
The attached image is a frame from my pixel-art adventure game. The man in the long blue coat, seen from behind, is Thad, the hero. He is standing under a church bell rope. I need Thad himself, from behind, pulling that rope once.

STYLE — this is Thad, so match him exactly:
- Same pixel-art style, same pixel size, same flat, soft shading, same small amount of texture, same clean outlines. Not sharper, not more detailed.
- Same man: same dark curly hair, same long blue-grey coat, same dark trousers and brown boots, same proportions, same height.
- Same warm lamplight as the attached frame.

THE SHEET — one image, six poses of Thad from behind, side by side, left to right:
1. REACH: both arms raised straight up above his head, hands open, reaching for a rope just above him. Up on the balls of his feet a little.
2. GRIP: the same, hands closed around a short length of rope above his head. Include only the piece of rope in his hands, about one hand's length above and below his fists.
3. PULL: he pulls down hard: fists come down to just above his head, elbows bent and out to the sides, knees bent, his weight dropping. The short piece of rope comes down with his hands.
4. PULL, LOWEST: fists at the top of his head, knees bent a little more, shoulders hunched with the effort.
5. LET GO: arms rising again as the rope pulls up out of his hands, hands opening, knees straightening.
6. DONE: standing straight, arms down at his sides, exactly as in the attached frame.

RULES — these matter more than anything else:
- Background: flat, pure magenta (#FF00FF) everywhere. No floor, no shadow, no wall, no bell, no furniture. The only thing besides Thad is the short piece of rope in his hands in poses 2 to 4.
- Seen from directly behind in every pose, like the attached frame. We never see his face.
- All six poses full-length (hair to boots), the same size, boots on the same baseline.
- Clear magenta space between poses. No pose touches or overlaps another, raised arms included.
- Between poses, ONLY the change described happens. Same clothes, same colours, same proportions.
- Crisp pixel edges against the magenta. No soft glow or blur around him.
- No text, labels, numbers or borders.
```

## Integration, once a sheet passes

1. **Record every operation** in `art/staging/ledger.json` against `thad-rope-pull` before reading its result.
2. **Measure before anyone looks** (style gate step 2): height against the church's curve at (515, 857) — 469 px drawn, so 625 at the record's size; crisp edges against the key; colour and contrast in Thad's range. `tests/scale.test.ts`, the key-fringe checks.
3. **Cut** with `tools/rig/cut-sheet.py <sheet> art/actors/thad-reach-back 625`, anchored like every back-facing frame (370, 625), and add the clip to `content/actors/thad.json` as `reach`, facing `back` — doc 40's name, so a later PUSH or PULL can use the same clip in other facings.
4. **Play it on the pull.** The rope's PULL gets `reactions: { "PULL": "reach" }`. `bell_rope` is compiled from `reference/room-17/annotation.json`, and `tools/compile-room.mjs` does not carry `reactions` today: teach it to read them from the annotation, or the next compile drops the clip silently.
5. **Strike the bell on the downstroke.** R17-BELL's sound in `content/audio/sounds.json` plays `at` 0.12 s today. At 7 frames a second, pose 3 lands about 0.29 s after the reaction starts; set `at` to that, keep it after the duck's attack, and run `node tools/check-sound-levels.mjs`.
6. **Proof** with `tools/gauntlet/proof.mjs` on the church, and put the side-by-side (Thad at rest, the six poses at game size, in the room) in front of Tyler. Step 3 of the gate is now the playthrough (errata 72), so it ships if he does not object, and step 4 corrects it against Thad within the cap.
