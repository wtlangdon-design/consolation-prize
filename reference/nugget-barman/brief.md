# The Nugget's barman: one new figure

**Tyler, 2026-11-14** (errata 323, doc 133): asked "Do we need a bartender in the Nugget?", told that nobody stands behind the bar while three lines speak of a barman, he chose: **"Add a barman."** The three lines:
- the barman pays Thad two dollars when the piano is tuned (doc 57 A7);
- "The barman watches me consider it." when Thad tries to OPEN the bar (doc 49);
- the lamps behind the bar are trimmed, "because the barman is the only person in town who maintains anything" (the room's light note).

He gets no new lines. One image operation, in the session with the image key.

**This brief does not budget anything by itself.** The operation is authorized by the prompt Tyler pastes into the image session, which tells that session to add the cap entry. Do not touch `content/` or `docs/` while drawing, and never touch `wtlangdon-design/anchorage`.

## Read first

- `CLAUDE.md`: the character style gate. **Too sharp is the usual miss.** Thad's look is flat, soft-shaded and low in texture, and the Nugget's bar men reached it (texture 4.90 against his 6.09).
- `reference/nugget-pianist/brief.md` and its hand-back: the same room and the same process, done last.

## Who he is

He is the Nugget's barman: a heavy-set, unhurried man of fifty, with sleeves rolled and held by garters, a dark waistcoat, an apron, a clean towel over one shoulder and a neat moustache. He is the only person in town who keeps anything in order, and he looks it. Nothing about him is sinister and nothing marks him as important (design invariant 9: motion never conveys information).

## Where he is

- **Behind the bar**, between the counter and the back bar, in front of the mirror. That puts him at about x 1520-1640 in `art/backgrounds/room-03-nugget.png`, between the second and third drinkers (`nugget_bar2` at x 1413, `nugget_bar3` at x 1723).
- **Posture `band`, like the drinkers.** The sheet stops at the counter top's front edge, about y 515, so his `y` is that row, not his feet.
- **His height** is a standing man of the room's curve with his feet hidden behind the counter at about y 560 (`reference/room-03/annotation.json` `scaling`: about 243 px crown to sole). Measure him against `nugget_bar2` and against Thad standing at the bar.

## Frames (one sheet, one operation)

1. **Rest:** behind the counter, polishing a glass with the towel.
2. **Polish B:** the same, with the glass turned and the towel moved.
3. **Set down:** he sets the glass on the counter, his other hand still on the towel.
4. **The action** (`tests/movement.test.mjs`: a frame that changes at least 10% of the figure, at least every 30 s). He looks up and down the bar, the glass held against his chest.

Whatever he holds in one frame he holds in all of them (errata 111). **The towel is on him in every frame, and the glass is in his hand in every frame except 3, where it is on the counter under his hand.**

## Generate against Thad, in the room

Attach a frame of Thad standing at the Nugget's bar, beside the drinkers, as the style reference. Written descriptions alone have failed six times.

## When done

Commit the sheet and its cut frames to a branch named `nugget-barman-art`, with `reference/nugget-barman/handback.md` beside this brief. The hand-back gives:
- the frame rects;
- his anchor point on the counter's edge;
- the measured height against the curve;
- the texture and contrast numbers beside Thad's.

Push it, and stop. The wiring is done by the other session: his ambient record, his place behind the bar, and his part in the tuning's two dollars.
