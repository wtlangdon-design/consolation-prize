# The whiskey barrel beside Deke — generation brief (Room 3)

Tyler, 2026-11-01, playing the Nugget: *"There's so much empty space in the bottom left third of the screen. So maybe move Deke slightly to the left so he's not overlapping the guy at the bar at all? And then we put the barrel to the left of Deke with a drink sitting on it?"* (An upright whiskey barrel was suggested instead of a high-top table, being nearer the period; he chose it.)

**Status:** Deke moved to 1035,815 (merged). The engine draws room furniture in depth order (`RoomFile.props`, set in `reference/room-03/annotation.json` and compiled through). **Made 2026-11-01**, first operation (`art/staging/room-03/barrel-01`, `room-03-barrel` 1 of 2; it broke none of the RULES, so the second was not spent): cut by `tools/art/cut-prop.py`, graded to the bar front, placed at 890,812 with its footprint obstacle, Thad talking to Deke from 730,818, proven by `tools/gauntlet/barrel-proof.mjs` (`renders/proofs/room-03-barrel/`). Cap: `art/staging/caps.json`, asset `room-03-barrel`, 2 operations.

## What it is
Set dressing only. It is not a hotspot (no document writes a LOOK or LISTEN for a barrel, and none may be invented), clicks go through it, and nothing in any puzzle refers to it.

## Reference image
`style-reference.png` — Thad and Deke in the Nugget at their new places, cropped from the running game, the barrel's spot empty between them. Attach it.

## The prompt
`prompt-01.txt`, verbatim. A second operation only if the first plainly breaks the prompt's RULES (not magenta, cut off, more than one object, people in it), never for taste.

## Generating
`NODE_USE_ENV_PROXY=1 node tools/art/barrel-generate.mjs reference/room-03/barrel/prompt-01.txt art/staging/room-03/barrel-01/source.png reference/room-03/barrel/style-reference.png`

It sends no Authorization header: the "OpenAI" cloud environment's network secret is attached by the agent proxy. Prove that first with a free call — `curl -sS https://api.openai.com/v1/models` must return a model list, not 401. Never print or write the key.

## Cutting and placing
1. Key out the magenta (the same keying and despill as `tools/art/cut-ambient-sheet.py`; crisp edges, no halo). Trim to the barrel and glass.
2. Size: Deke is 428 px tall where he stands (y 815), and the barrel's top should meet his belt — about 0.53 of him, so roughly **225 px** to the barrel's top, more with the glass. BOX-reduce once to that height.
3. Grade against the room, not against the figures: compare it with the bar's wood and the stools beside it; `tools/grade/match-neighbours.py` with a sample of the bar front is the starting point. Thad's look is the standard for sharpness — too sharp is the usual miss.
4. Save as `art/props/room-03-barrel.png`.
5. In `reference/room-03/annotation.json`, add
   `"props": [{ "id": "whiskey_barrel", "sheet": "art/props/room-03-barrel.png", "x": 890, "y": 812, "frame": [0, 0, W, H], "note": "..." }]`
   (x is the centre of its base, y its base line; nudge x so it clears Deke's rest pose, whose left edge is about 981) and an obstacle for its footprint so Thad walks round it, with `keepsGroundAbove` so the floor behind it stays walkable:
   `"obstacles": [{ "id": "whiskey_barrel", "rect": [x0, 790, width, 26], "keepsGroundAbove": true, "note": "..." }]`.
   Then `node tools/compile-room.mjs 3 --write`.
6. Thad's place for talking to Deke moves to the barrel's far side, so they talk across it: `content/ambient/deke-vessel.json` `walkTo` about `{ "x": 730, "y": 818, "facing": "right" }`.
7. Prove it in the browser: talk to Deke (Thad left of the barrel, nobody overlapping), walk Thad behind the barrel (it covers his legs) and in front of it (he covers it), and talk to the one-strike man and the card sharp (still clear).
8. `node tools/run-all.mjs`, `npm test`, branch, PR, merge on green, confirm the deploy. Send Tyler a frame of the room with the barrel in it.
