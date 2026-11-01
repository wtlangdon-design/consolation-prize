# Deke Vessel — generation brief (Room 3, A3 the swindle)

Written 2026-10-31 and reviewed by Tyler. **Not yet generated. No image operation spent.**

## Sources (nothing here is invented beyond art direction)
- Doc 27, DEKE VESSEL · Room 3: voice "sunny, shameless, and visibly enjoying himself".
- Doc 27, his LOOK lines: "A man at the bar with his hat pushed back, entirely at ease, watching the door." · "His boots are good. Everything above the boots is not, and I have decided that is deliberate." · "He has been in this territory a long time and he is leaving it in a very good mood."
- Build contract `content/build-contracts/room-03-nugget.json`: he stands at the NEAR END OF THE BAR. In the shipping (old) plate that is the standing room in front of the one-strike man, not his stool (doc 36 Q141). He is never a re-skinned patron.
- Sheet shape: Room 2's speaking ambients — five poses, two near-identical rest frames (the sway) and three short actions (breaks / talk frame).

## Reference image
`style-reference.png` — Thad in the Nugget beside the bar, cropped from the running game. Attach it: showing the generator Thad in the actual room is what got the bar men to his idiom (texture 4.90 against his 6.09); six word-only descriptions did not.

## The prompt (verbatim)

```
The attached image is a frame from my pixel-art adventure game. The man in the long blue coat is Thad, the hero. I need a NEW character drawn to stand in this same saloon, and he must look like he belongs in the same game as Thad.

STYLE — match Thad exactly, not the room:
- Same pixel-art style as Thad: same pixel size, same flat, simple shading, same small amount of texture, same clean outlines.
- Same proportions as Thad: same head size relative to the body, same overall height.
- Same warm lamplight as the attached frame.

THE CHARACTER — Deke Vessel, a swindler:
- Middle-aged and weathered. He has been out West a long time and is about to leave it in a very good mood.
- Sunny, shameless, completely at ease. A big, easy, friendly grin.
- His hat is pushed back on his head.
- His BOOTS ARE EXCELLENT: tall, well-kept, polished. EVERYTHING ABOVE THE BOOTS IS SHABBY: battered hat, faded and patched coat or vest, worn shirt. The contrast should look deliberate.
- No gun, no weapons, nothing in his hands unless a pose says so.

THE SHEET — one image, five poses of this same man, side by side, left to right:
1. REST: standing at ease, weight on one leg, thumbs hooked in his belt, hat pushed back, grinning, looking toward the left of the picture (the saloon door).
2. BREATH: identical to pose 1 except his shoulders are very slightly raised. Nothing else changes.
3. TALKING: as pose 1, but mouth open mid-sentence and one hand held out palm-up, as if making a perfectly reasonable point.
4. HAT: as pose 1, but he pushes his hat further back with one finger, pleased with himself.
5. SPOTS A CUSTOMER: as pose 1, but his head turns to look straight out at the viewer with a big friendly grin. His body does not move.

RULES — these matter more than anything else:
- Background: flat, pure magenta (#FF00FF) everywhere. No floor, no shadow, no furniture, no bar, nothing else in the picture.
- He stands on his own. He does not lean on or touch anything.
- All five poses are full-length (hat to boots), the same size, with boots on the same baseline.
- Clear magenta space between poses. No pose touches or overlaps another.
- Body turned three-quarters toward the left of the picture in every pose.
- Between poses, ONLY the change described above happens. Same clothes, same colours, same face, same proportions, same pixels everywhere else.
- Crisp pixel edges against the magenta. No soft glow or blur around him.
- No text, labels, numbers or borders.
```

## Generating it directly
`tools/art/openai-image.mjs` needs api.openai.com reachable and a key. Tyler added the key on 2026-10-31 as a **network secret** on the cloud environment (host `api.openai.com`, `Authorization: Bearer`), so the agent proxy attaches it and the key never enters the session. Prove it first with a free call — `curl -sS https://api.openai.com/v1/models` must return a model list, not 401 — and record any operation in `art/staging/ledger.json` against a cap Tyler sets in `art/staging/caps.json`. The session that wrote this brief saw 401 "Missing bearer authentication": the secret was added after that session started.
