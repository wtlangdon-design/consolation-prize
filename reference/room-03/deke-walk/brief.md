# Deke Vessel walks out — generation brief (Room 3, A3)

Tyler, 2026-11-01, on Vessel vanishing when the swindle settles: *"Yes it would bother me immensely to have a character just disappear."* Doc 57 A3: once option 6 settles, *"He finishes his drink, collects his hat, and leaves the Nugget."* He has five standing poses and no walk, so until this exists he simply stops being there.

**Status:** the engine is ready (`AmbientFile.exit`, `engine/core/Departure.ts`): a character whose condition stops holding while Thad is in the room walks his exit path and is gone at its end, drawn on the room's curve, graded like his standing sprite, mirrored for the other direction. **The walk cycle is not made yet** — the session that wrote this had no OpenAI key.

**Cap:** `deke-vessel`, 3 operations, 2 spent (the standing sheet). **This is the last one.** If it plainly breaks the prompt's RULES, stop and report; do not spend beyond the cap — Tyler raises it or not.

## Reference
`walk-reference.png` — Thad's six-frame left walk (art/actors/thad-walk-left) beside Deke's approved rest pose (art/staging/room-03/deke-02/cut/deke-vessel-ungraded.png), on magenta. Attach it.

## Generating
`NODE_USE_ENV_PROXY=1 node tools/art/deke-generate.mjs reference/room-03/deke-walk/prompt-01.txt art/staging/room-03/deke-walk-01/sheet.png reference/room-03/deke-walk/walk-reference.png`

No Authorization header: the "OpenAI" environment's network secret is attached by the agent proxy. Prove it first with a free call (`curl -sS https://api.openai.com/v1/models` must not be 401). Never print or write the key.

## Cutting and wiring
1. Key and despill as `tools/art/cut-ambient-sheet.py` does (crisp edges, no halo). Six frames, each trimmed to the figure.
2. **Register on the hips, not the feet:** a walking figure's feet move, so each frame is aligned on its torso's centre column and its boots' lowest row, or he will jitter as he walks.
3. Reduce once (BOX) to the same figure height his standing sheet uses per pixel, and grade with `tools/grade/match-neighbours.py` against `art/staging/room-03/deke-02/cut/barmen-pixels.npy`, as his standing sheet was. Save `art/actors/deke-vessel-walk.png`.
4. Add to `content/ambient/deke-vessel.json`:
   ```
   "exit": { "path": [[1000,848],[780,848],[420,800],[300,760],[150,712]], "speed": 150,
             "sheet": "art/actors/deke-vessel-walk.png", "frames": [[x,y,w,h], ...six],
             "fps": 8, "drawnFacing": "left", "figureHeight": <the walk sheet's figure height>,
             "note": "..." }
   ```
   The path starts at his feet automatically; it passes in front of the barrel and of Thad, to the batwing doors.
5. Prove it in the browser with `?fixture=w1-piano&room=nugget`: play the deal to "All right.", watch him walk to the door without sliding, jittering or popping, and send Tyler a short recording (gif) or a strip of frames.
6. Checks, tests, PR, merge on green, confirm the deploy.
