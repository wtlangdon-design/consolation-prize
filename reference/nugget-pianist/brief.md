# The Nugget's pianist: one new figure

**Tyler, 2026-11-14** (errata 317, doc 133): the Nugget's music has a piano in it and nobody at the piano, while Thad's own LOOK says "Nobody's touched it since I came in." A player piano is an 1890s invention and cannot be in an 1850s game. Offered three ways, he chose: **"Add a bad pianist."** One image operation, in the session with the image key.

**This brief does not budget anything by itself.** The operation is authorized by the prompt Tyler pastes into the image session, which tells that session to add the cap entry. Do not touch `content/` or `docs/` while drawing, and never touch `wtlangdon-design/anchorage`.

## Read first

- `CLAUDE.md`: the character style gate. **Too sharp is the usual miss.** Thad's look is flat, soft-shaded and low in texture. The Nugget's bar men reached it.
- `reference/acted-directions-2/brief.md`: its process stands. That means the locked cast master, the in-game Thad on every board, one level of pixelation, the head measured by ruler, and the hand-back.

## Who he is

He is a patron of the Nugget who sits at the upright and plays it badly, with total confidence: an older miner in a waistcoat and shirtsleeves, hat pushed back, a glass on the piano lid by his elbow. He plays loudly and slightly wrong. Nothing about him is sinister and nothing marks him as important (design invariant 9: motion never conveys information).

## Where he is

- **The piano:** the upright at x 540-700, y 300-505 in the Nugget's plate (`art/backgrounds/room-03-nugget.png`, the `piano` hotspot).
- **The stool:** in front of the piano, at about x 645-705, y 445-525 (the `piano_stool` obstacle in `reference/room-03/annotation.json`).
- He sits on the stool with his back three-quarters to the room, facing the keys, his hands on them.
- Posture is `seated`. His seated height matches a man of the room's curve at his feet, about y 525. Measure him against `nugget_bar1`, who leans at the bar, and against Thad at the same depth.

## Frames (one sheet, one operation)

1. **Rest:** seated at the keys, hands on them.
2. **Play A:** left hand down, right hand up.
3. **Play B:** right hand down, left hand up.
4. **The action** (`tests/movement.test.mjs`: a frame that changes at least 10% of the figure, at least every 30 s). He lifts his glass from the lid and drinks, with the other hand still on the keys.

Whatever he holds in one frame he holds in all of them (errata 111). **The glass is on the lid in frames 1-3 and in his hand in frame 4.** It stays the same glass, and it never vanishes.

## Generate against Thad, in the room

Attach a frame of Thad standing in the Nugget near the piano. That frame is the style reference. Written descriptions alone have failed six times.

## When done

Commit the sheet and its cut frames to a branch named `nugget-pianist-art`, with `reference/nugget-pianist/handback.md` beside this brief. The hand-back gives:
- the frame rects;
- his feet point on the stool;
- the measured height against the curve;
- the texture and contrast numbers beside Thad's.

Push it, and stop. The wiring is done by the other session: his ambient record, his place on the stool, the piano heard as his, and Thad's piano lines rewritten to match (doc 133).
