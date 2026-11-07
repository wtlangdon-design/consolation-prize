# Fanshawe's close-up, for his cut-away: for the session with the image key (errata 159)

Written 2026-11-07. **Authorized:** Tyler chose "Fanshawe only (Recommended)", whose option read "About 2 images". The asset is `fanshawe-closeup`, capped at **2** in `art/staging/caps.json`: one close-up at rest and one mid-word. **There is no correction attempt without Tyler's word.** Check `art/staging/ledger.json` before each operation, and record each one there.

## Why

Errata 158 added three Monkey Island cut-aways. Tyler then asked about LeChuck's: "it played like a video with a much better drawn version of LaChuck. Is that something to consider instead of just a played out scene in the same style as the game's already drawn?" Fanshawe is this game's LeChuck. His scene ("He said no." … "Good. Let him look.") gets a close-up, a larger and more detailed drawing of him, like Monkey Island's. Today the scene plays in his office at game size: `fanshawe-in-his-office-at-game-size.png` in this folder.

## Read first

- `CLAUDE.md`, the character style gate. **This is the one place the game draws a figure larger and more detailed than Thad's look on purpose.** The close-up is a different shot, not a different game. It keeps the game's palette, its soft shading and its dark outline, and it must sit next to the room plates without looking like another artist's work. "Too sharp" is still the usual miss.
- Doc 96 §3: the scene and its lines.
- Doc 01: Fanshawe is warm, generous and courteous, never raises his voice, and is the antagonist.
- Errata 63 and `tools/art/derive.mjs`: the source-to-room transform, 1536 × 1024 → 1920 × 864.

Never touch `wtlangdon-design/anchorage`.

## The shot

A close-up of COLONEL ABSALOM FANSHAWE at his desk at night, from just below eye level.
- **Him:** a portly, prosperous gentleman of about sixty, with silver hair, silver whiskers and the portrait's moustache. He wears a black frock coat, a brown waistcoat with a watch chain, and a white shirt with a black cravat. He is exactly the man in `fanshawe-rest-frame-x3.png` and in the office frame, at about four times the size.
- **Framing:** from the desk top up. His head and shoulders fill the middle of the frame.
- **Lighting:** the brass desk lamp warms one side of his face. The red damask wall and the gilt edge of his own giant portrait sit behind him, out of focus in the pixel-art sense: simpler, darker, with less detail than he has.
- **Mood:** pleased, settled and courteous, with menace that comes only from how comfortable he is. No sneer, no villain's grin.

Two frames, **identical except for his face and one hand:**
1. **At rest** (`art/cutaways/fanshawe-closeup-rest.png`): he leans back a little, hands folded on his waistcoat, mouth closed in a small satisfied smile.
2. **Mid-word** (`art/cutaways/fanshawe-closeup-talk.png`): the same frame, his mouth open on a word and one hand lifted a little from the waistcoat. Make it by editing frame 1, so everything else matches pixel for pixel. The game swaps between the two while he speaks.

## Operation 1: the close-up at rest

- **Images:**
  1. `fanshawe-rest-frame-x3.png`
  2. `fanshawe-in-his-office-at-game-size.png`
- **Prompt:** the shot above, frame 1, in the style of the second image's room and figure: the same pixel-art look, palette, soft shading and dark outline, at close-up scale. Landscape. The face and hands sit inside a central 20:9 band, with expendable wall above and desk below, because the crop removes 170 rows top and bottom. No text, no signature, no frame border.
- **Derive:** `tools/art/derive.mjs` (crop x 8, y 170, w 1520, h 684, then resample to 1920 × 864). Write `art/cutaways/fanshawe-closeup-rest.png`.

## Operation 2: mid-word

- **Images:** the derived frame 1 (or its 1536 × 1024 source).
- **Prompt:** an edit of this image only. Open his mouth on a word, and lift his right hand a few inches from the waistcoat as a man does when making a point gently. Change nothing else: not the light, the background, the colours, the framing or any other pixel.
- **Derive** as frame 1. Write `art/cutaways/fanshawe-closeup-talk.png`. Then check the difference between the two frames: it must be confined to his face and the hand. If anything else moved, keep frame 1 and tell Tyler rather than spending a third operation.

## Then

1. `node tools/extract-content.mjs`. The extractor declares the close-up in `content/cutaways.json` only once both files exist, so this is the step that switches it on. Until it runs, `--check` calls the file stale.
2. `npm test`, `node tools/run-all.mjs`.
3. Look at the scene in the game: a review link to any room with `ACT` 3 set through `__gauntlet.controls.flags`, as errata 158 E did. Send Tyler a frame of each line.
4. Commit the two PNGs, the regenerated `content/cutaways.json` and the ledger rows. The PR says `Lesson: none -- art for errata 159's declared close-up`.
