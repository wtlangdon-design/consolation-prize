# The fiddler, drawn as Charlie (errata 123): for the session with the image key

**Tyler, 2026-11-06:** "My husband Charlie wanted a character in the game to look like him … I think the fiddler is perfect to look like Charlie."

The fiddler (doc 07 #11) keeps everything he has now:
- his place by the Nugget's piano and his poses (three bow strokes, TUNE, TALK);
- his costume (shirtsleeves, waistcoat, string tie, hat tipped back, fiddle and bow);
- his size and his bowing on the beat (errata 118 A).

Only the face, hair and build become Charlie's.

## Before anything

- **The cap is granted.** `art/staging/caps.json` asset `fiddler-charlie`, 2 operations (one drawing and one correction), Tyler 2026-11-06 ("proceed with your recommendations"). Nothing else may be spent under it.
- **The photo stays out of the repository.** Tyler attaches it in this session. Save it under `art/staging/private/`, which `.gitignore` excludes, and never commit it, copy it into `reference/`, or render it into anything under `renders/`. The ledger records its hash, not the picture.
- **Read** `CLAUDE.md`, errata 111 and 112 (one cast, one level), 115 (how the townspeople were cut) and 118.

## The operation

Spec `reference/fiddler-charlie/op-01.spec.json`:
- asset `fiddler-charlie`, role `other`;
- out `art/staging/fiddler-charlie/sheet-01.png`, size 1536x1024;
- `derivedFrom` the fiddler's current sheet, `art/staging/townspeople-110/fiddler/sheet-03.png`.

Images, in this order:
1. `art/staging/townspeople-110/fiddler/sheet-03.png`: the fiddler as he is. **The drawing to keep.**
2. `reference/townspeople/nugget-cast-standard.png`: the level of pixelation and detail.
3. The photo, from `art/staging/private/`.

The prompt (`reference/fiddler-charlie/prompt-01.txt`), in the cast-unify manner:

```
Image 1 is a saloon fiddler from my pixel-art adventure game, five poses on magenta. Image 2 shows the
level of pixelation and detail every character in the game is drawn at. Image 3 is a photograph of a
real man. Redraw the fiddler in Image 1 so that he is recognisably the man in Image 3: his face, his
short dark hair, his stubble, his build and his warm, slightly crooked smile. Keep EVERYTHING else from
Image 1 exactly: the same five poses in the same order and places, the same clothes (shirtsleeves,
waistcoat, string tie, hat tipped back), the same fiddle and bow, the same height, the same pixel size
and soft shading as Image 2, feet on one line, flat pure magenta (#FF00FF) background, clear magenta
between poses, crisp pixel edges, no text, no ground, no shadows. He is an 1850s frontier musician,
not a modern man in a costume: no sunglasses, no modern clothes.
```

## Cut and integrate

- Cut exactly as errata 115 cut the fiddler (`tools/art/townspeople-cut.py`), to the same frame boxes and figure height, so `content/ambient/fiddler.json`'s frames, breaks, `keepsTime` and talk frame stand unchanged.
- Snap to the one level (`tools/art/one-level.py`).
- Overwrite `art/actors/fiddler.png`.
- Run `node tools/run-all.mjs` and `npm test` (`tests/one-level.test.mjs`, `tests/movement.test.mjs`, `tests/keeps-time.test.mjs`, the edge checks).
- Render him beside Thad in the Nugget at game size (`renders/`), and show Tyler before merging. This is a likeness, so his eye is the test.
- Write an errata entry for the operations and merge.
