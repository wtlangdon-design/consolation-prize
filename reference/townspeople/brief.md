# The townspeople (errata 110): generation and integration brief

**Authorized:** Tyler, 2026-11-06, "Go: townspeople, up to 10 images." This covers asset `townspeople-110` in `art/staging/caps.json`, with **10 operations shared across five sheets**: one sheet per figure, plus corrections. Nothing else may be spent under this asset.

**Already done (errata 110, this branch's PR):**
- Every word these figures say is extracted from doc 07 by `tools/extract-content.mjs`. That covers their trees in `content/dialogue/amb-*.json` and their barks in `content/ambient/*.json`. The boundary men's barks are a two-voice `barkExchange`.
- The engine plays two-voice barks and per-room barks.
- Each figure has an ambient file with its position and the stand Thad talks from.
- Each figure carries `awaitingArt`, so `tools/compile-room.mjs` casts it in no room until its picture is cut. **This session's job is the pictures and the cut, then removing `awaitingArt`.** Write no line for anyone.

## Before anything: the rules

Read `CLAUDE.md`, then `docs/55-full-game-build.md` §8 (the character rows), and the character style gate in CLAUDE.md. In short:
- Generate against Thad in the actual room.
- Measure before anyone looks.
- Correct a miss by showing the generator the side-by-side, within the cap.
- Every figure moves from the start (`tests/movement.test.mjs`).

**Too sharp is the usual miss:** Thad is flat, soft-shaded and low in texture. Never touch `wtlangdon-design/anchorage`.

## The five sheets

| Sheet | Ambient file(s) | Room, feet at | A man there is | Reference to attach |
|---|---|---|---|---|
| `message-boy` | `message-boy.json` (posture `child`) | Main Street 860,732 | 160 px. **He is nine: stature about 0.68** | `message-boy-style-reference-crop.png` |
| `man-leaving-tomorrow` | `man-leaving-tomorrow.json` | Main Street 2810,712, outside the hotel | 152 px | `man-leaving-tomorrow-style-reference-crop.png` |
| `boundary-men` | `boundary-a.json`, `boundary-b.json` (one sheet, both men) | Main Street 1640,760 and 1770,760 | 170 px | `boundary-a-style-reference-crop.png` |
| `dogs-owner` | `dogs-owner.json` | Back alley 560,792. **Also Main Street 2560,768 once `T_BILL_FOUND`** (the `placements` entry, beside the dog) | 317 px in the alley, 167 on Main Street | `dogs-owner-style-reference-crop.png` |
| `fiddler` | `fiddler.json` | Nugget 600,600, by the piano | 288 px | `fiddler-style-reference-crop.png` |

All files are in `reference/townspeople/`. Each figure has:
- a prompt, `<sheet>-prompt-01.txt`;
- a spec, `<sheet>-op-01.spec.json`;
- a full-frame reference, `-style-reference.png`;
- a close crop, `-style-reference-crop.png` (Thad at game size where he will stand to talk, doubled).

`tools/art/townspeople-refs.py` remakes the references.

## Running an operation

```
NODE_USE_ENV_PROXY=1 node tools/art/char-op.mjs reference/townspeople/<sheet>-op-01.spec.json
```

It checks the cap first, and records every completed operation in `art/staging/ledger.json`. Run the five first sheets. Then:

1. **Measure each one before anyone looks.** Use `python3 tools/art/cast-vs-thad.py <sheet> 0 <height share> <out.png>` for the side-by-side, then check texture, brightness and saturation against Thad as the rope-pull brief did (`reference/room-17/rope-pull/brief.md`, "Measured before anyone looked"). The texture flag is 1.35× Thad's. The numbers flag; they do not decide.
2. **A sheet that plainly misses** gets one correction:
   - Write `<sheet>-prompt-02.txt` and `<sheet>-op-02.spec.json`.
   - Attach the reference plus the side-by-side of the miss, and set `derivedFrom` to the first sheet.
   - Ask for exactly what missed. The precedent is `tools/art/deke-correction-ref.py`.
   - Misses that count: too sharp; wrong pixel size; poses touching; a pose changing more than it describes; magenta fringe.
3. **Stop at 10 operations in total**, however many misses remain, and say which.

If the image service refuses a prompt before making an image (`moderation_blocked`), it does not count. Report it; do not reword it without Tyler.

## Cutting and integrating each figure

1. **Cut** with `python3 tools/art/cut-ambient-sheet.py <sheet> <height> art/actors/<file>.png`, at the height the table gives. For the boy, use the man's height × his stature. For the boundary men, cut one sheet into two files, `art/actors/boundary-a.png` and `art/actors/boundary-b.png`, each man's three poses.
2. **Write the `sprite`** into the ambient file, the way `content/ambient/hotel-clerk.json` and `letter-writer.json` do:
   - `sheet` and `frames`, with frame 0 as rest;
   - `figureHeight` and `stature`, so the renderer holds him to the room's curve in every room he stands in (this matters for the dog's owner in two rooms);
   - `rate` and `phase`;
   - `breaks`, a pool of separate actions;
   - `breakEvery`;
   - `talkFrame`, the TALK pose;
   - a `frameNote`.
3. **What moves:**
   - **Fiddler:** his idle is his playing (PLAY 1–3 looped), in time with the bar grid per doc 22. TUNE is a break.
   - **Boy:** flips his penny and looks back.
   - **Man leaving tomorrow:** reaches for the bag, lifts it, sets it down.
   - **Boundary men:** point and argue, never on the same beat.
   - **Dog's owner:** looks and calls in the alley. On Main Street, his placement's `sprite` may give GLAD as rest.
4. **Remove `awaitingArt`** from the file, and add the file to `content/manifest.json` → `ambient`.
5. **Recompile the rooms:** `node tools/compile-room.mjs 2 --write`, `… 3 --write` and `… 20 --write`. Run `node tools/extract-content.mjs` again if anything in `content/ambient` changed by hand.
6. **Prove it:**
   - `node tools/run-all.mjs` and `npm test`, especially:
     - `tests/scale.test.ts` (standing figures within 5% of the curve; the boy as a `child`);
     - `tests/movement.test.mjs`;
     - `tests/staging-clear.test.ts` (nobody stands on anybody: move the figure or its `walkTo` if a stand overlaps);
     - `tests/lessons.test.ts`;
     - `tests/town-barks.test.ts`.
   - Then capture each room with `node tools/gauntlet/proof.mjs <room id>` and look at it: talk to each figure, and walk past the pair for their two-voice bark.
7. **Record** an errata entry (111) with:
   - the measurements;
   - every operation spent;
   - any correction and why;
   - anything that missed and was left for Tyler's playthrough (style gate step 3 moved there, errata 72).
8. **Open a pull request.** It is a first build, so its description carries `Lesson: none -- first art for figures errata 110 placed`. Merge when green.

## Open, and not this session's

- **The fiddler's playing in the music.** Doc 07 has him play faster in R_BORDERS_MOTT and the passing tune in R_DEAD, and doc 06 has him retune first during F2. That is a music task; he is drawn now and heard later.
- **The message boy's *(pay)* option** has no words in doc 07 for Thad to say, so it is left out until Tyler writes or rules it.
- **The bell-ringer and the stage driver** wait on Tyler (errata 110).
