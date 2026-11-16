# Act I's four figures that are not in the cast's hand

**From the Act I review's art director (2026-11-15), after Tyler's "Go" on the review's art group.** Four figures in Act I are drawn in a different hand from Thad and the cast beside them. Each is redrawn once, against Thad, in the room it stands in, and corrected once if it misses.

**This brief does not budget anything by itself.** The operations are authorized by the prompt Tyler pastes into the image session, which tells that session what to add to `art/staging/caps.json`. Do not touch `content/` or `docs/` while drawing, and never touch `wtlangdon-design/anchorage`.

## What the barman and the storekeeper taught: read before drawing

`reference/nugget-barman/brief.md`, `reference/mercantile-keeper/brief.md` and their hand-backs are the precedent.
1. **Too sharp, too bright, too white is the usual miss.** Thad's look is flat, soft-shaded and low in texture: big simple shapes, two or three tones a material, no fine wrinkles, no crisp highlights, no hard outlines inside the figure, and the same block size and edge softness as Thad at game size.
2. **Never fix the numbers in the cut.** No filter, median, pixelation or luminance squeeze on a finished drawing. A miss is a correction operation shown the side-by-side.
3. **What a figure holds in one frame it holds in all of them** (errata 111).
4. **Generate against Thad in the actual room.** Attach a frame of the room at game size with Thad standing where the figure stands, Thad's standing frame on magenta as the ruler, and the Nugget's barman (`art/actors/room-03-barman.png`, rest frame at 2x) as the style to match. Written descriptions alone have failed six times.
5. **Same poses, same cells, same anchor.** Each job replaces a sheet that is already wired. Keep the frame count, the order of the frames and what each frame does (the `frameNote` in the figure's `content/ambient/*.json`), the anchor and the height, so nothing in `content/` has to change. Report anything that could not be kept.

## The four jobs

### 1. The horses at Main Street's hitching rail — asset `act1-street-horses`

- **Now:** `art/actors/room-02-horses.png` (one cell, 702 x 413; `content/ambient/hitching-horses.json`, room (1470, 746)). Three saddled horses and the rail, painted smooth and finely detailed, with highlights on the coats and tack. The street behind them is chunky and low in detail, and they read as a photograph set on it.
- **Wanted:** the same three horses, the same rail, the same poses (the black facing out, the palomino head down at the feed, the paint facing out), drawn at the street's block size and in the cast's flat, soft shading. Night: no brighter than the street's mud around them. The rail and its posts are part of the sheet and stay where they are.
- **Attach:** `renders/room-02-main-street-hitching-post-night-thad-passing.png` (the street at game size with Thad passing them), Thad's ruler frame, the barman.
- **Check:** `tools/check-figure-light.mjs` holds them to Thad's brightness where they stand (errata 198, 205); run it.

### 2. The Company's lobby clerk — asset `act1-lobby-clerk`

- **Now:** `art/actors/room-10-clerk.png` (cells 133 x 137, behind the counter; `content/ambient/lobby-clerk.json`, room (1435, 387)). He is small and far back, and drawn in blocks about twice the size of the room's own: a pale, coarse figure in a finely drawn lobby. His face is four or five blocks across.
- **Wanted:** the same clerk (fair hair, grey waistcoat, white shirt sleeves, black tie), the same five frames (rest with his hands on the desk, breath, writing, the watch held up and read, looking up), at the room's block size, in the lobby's warm dim lamplight: a cream shirt that is not white, no brighter than the panelling behind him. Nothing on the desk is his (errata 111): his hands rest on the bare desk top.
- **Attach:** a capture of the Company lobby at game size with Thad standing at the desk, Thad's ruler frame, the storekeeper (`art/actors/room-12-storekeeper.png`, rest frame at 2x) as the nearest figure of his kind.
- **Check:** `tests/counter-surface.test.mjs` (his waist ends on the desk's back edge, y 377); `tools/art/one-level.py --only room-10-clerk`.

### 3. The map seller — asset `act1-map-seller`

- **Now:** `art/actors/ambient-map-seller-master.png` (cells 60 x 160; `content/ambient/map-seller.json`, Main Street (3185, 668)). CLAUDE.md's style gate names him as one of the three street figures that do not yet match Thad. He is soft and narrow beside Thad, with a muddy face under his hat.
- **Wanted:** the same man (tan jacket, red neckerchief, satchel strap across the chest, hat, the map held up, a pencil behind his ear in every frame), the same seven frames in the same order (standing with the map up, breath, the map offered, the map lowered, pointing at it, and the two acted frames drawing on it), at Thad's block size and clarity. He stands in the office lantern's pool and is painted in its warm light.
- **Attach:** a capture of Main Street's east end at game size with Thad standing beside him, Thad's ruler frame, the barman.
- **Check:** `tools/art/one-level.py --only ambient-map-seller-master`; `tools/check-figure-light.mjs`.

### 4. The first man at the Nugget's bar — asset `act1-bar-man`

- **Now:** `art/actors/nugget-bar1.png` (cell 172 x 245; `content/ambient/nugget-bar1.json`, room (1212, 601)): the drinker on the stool nearest the stairs, seen from behind in a dark coat and hat. He is blurred where the two men beside him are crisp, as if out of focus.
- **Wanted:** the same man from behind on the same stool, the same pose, drawn with the edges and the block size of the man in the blue shirt beside him (`art/actors/nugget-bar2.png`). His glass on the bar is the plate's, not his.
- **And if it can be done in the same drawing:** leave a clear standing place for Thad at the bar between him and the barman. Thad talks to the barman from (1484, 760) facing right, and the drinkers either side leave no room; a pose with this man's elbow drawn in toward his body, not out along the bar, is enough. Report whether it was done.
- **Attach:** `renders/room-03-talking-to-the-barman.png` (the bar at game size with Thad at it), Thad's ruler frame, `art/actors/nugget-bar2.png` at 2x.

## Measure before anyone looks (the gate flags; it does not decide)

For each, on the rest frame at game size beside Thad's standing frame scaled to the same man, report texture and contrast (`tools/art/cast-softer-measure.py`) and mean luminance, and look at it in the room at game size beside Thad. Visibly sharper, brighter or whiter than Thad is a miss: use the correction operation, shown the side-by-side.

## When done

Commit to a branch named `act-one-art-figures`: each cut sheet at the path it replaces, and `reference/act-one-art/handback.md` beside this brief. The hand-back gives, per job: what was drawn, the measurements, what could not be kept (frames, cells, anchor, height), the operations and tokens spent, and anything Tyler should look at. Do not merge; the main session wires and ships it.
