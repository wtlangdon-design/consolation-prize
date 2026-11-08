# Eight townspeople redrawn against Thad: for the session with the image key (errata 168, 170)

Written 2026-11-08. **No new authorization is needed.** These are redraws of recurring characters, which is what asset `cast-unify` is for. Tyler raised its cap from 86 to 90 for exactly these eight (`art/staging/caps.json`, errata 168). Check `art/staging/ledger.json` before every operation: one sheet per figure, a correction only where one plainly misses, and never past 90. Record every operation in the ledger.

## Why

Tyler, 2026-11-07, on Main Street:
- "the newspaper guy has the same problem as some of the characters earlier where he's too wide compared to Thad. It might mostly be his head, but maybe his body a bit too. It looks like the pie woman has the same problem."
- "The boy and the letter writer also have heads that are too big compared to Thad."
- On the game-wide lineup, asked which to redraw: "all of them".

Every figure drawn bigger-headed or bulkier than Thad is redrawn. All of them pass the height test (`tests/scale.test.ts`) and fail on **build**: heads larger than his at the same height, shoulders broader, so they read squat beside him. It is the same fault, and the same fix, as Frame and the judges (`reference/leaner-cast/brief.md`).

## The eight

| # | Figure | Actor image | Content | Room |
|---|---|---|---|---|
| 1 | The map seller | `art/actors/ambient-map-seller-master.png` | `content/ambient/map-seller.json` | Main Street |
| 2 | The pie woman | `art/actors/ambient-pie-woman-master.png` | `content/ambient/pie-woman.json` | Main Street |
| 3 | The message boy | `art/actors/message-boy.png` | `content/ambient/message-boy.json` | Main Street |
| 4 | The letter-writer | `art/actors/ambient-letter-writer-master.png` | `content/ambient/letter-writer.json` | Main Street |
| 5 | Boundary man A | `art/actors/boundary-a.png` | `content/ambient/boundary-a.json` | Main Street |
| 6 | Boundary man B | `art/actors/boundary-b.png` | `content/ambient/boundary-b.json` | Main Street |
| 7 | The bell ringer | `art/actors/room-43-bell-ringer.png` | `content/ambient/bell-ringer.json` | Lower Street |
| 8 | The fiddler | `art/actors/fiddler.png` | `content/ambient/fiddler.json` | The Nugget |

**The message boy is a child.** He stays shorter than Thad. His head is in a child's proportion to his body, not a man's head on a small body.

**The fiddler is Charlie** (errata 123 and 132, `reference/fiddler-charlie/brief.md`). Keep his face, hair and likeness exactly as on his current sheet, `art/staging/fiddler-charlie/sheet-01.png`, and use that sheet as the reference. **Do not ask for or use Charlie's photo, and never commit a photo.** Only his head size and build change, to Thad's.

## Read first

- `CLAUDE.md`, the character style gate, all five steps. The standard is Thad's look: flat, soft-shaded, low in texture. "Too sharp" is the usual miss.
- Errata 111:
  - B: versions come from the master, never from each other;
  - D: frontier builds are lean, torso width over height about 0.32 like Thad's.
- Errata 112 G: one level, a man is 115 art pixels.
- Errata 115: how the townspeople were cut.
- Errata 118: the fiddler bows on the beat.
- `reference/leaner-cast/brief.md`: the same job, done for Frame and the judges. Follow its shape.
- `docs/55-full-game-build.md` §8.

Never touch `wtlangdon-design/anchorage`.

## Each operation (asset `cast-unify`, the next free batch number)

- **Images, in this order:**
  1. The figure's current sheet, on a board with Thad's cast-sheet self beside it at the same scale (`tools/art/townspeople-redraw-refs.py`; cast master `art/staging/cast-master/master-02.png`).
  2. The figure beside Thad in the actual room at game size (`tools/art/cast-vs-thad.py`). The picture is what works. Written style descriptions alone have failed six times.
- **Prompt, in the cast-unify manner** (batch 18's prompt, `reference/cast-unify-18.txt`, is the model):
  - The same person: the same face, hair, clothes, colours and props. Keep every current pose: count them on the current sheet, and keep each one, including the action poses errata 77 requires.
  - **Built like the hero:** the head the same size as the hero's at the same height, the shoulders no wider than the hero's, a lean, ordinary frontier build.
  - The same height as now: standing adults at the hero's height, crown to sole, and the boy as he is.
  - The same pixel size, soft shading, low texture and dark outline as the hero. Crisp edges on magenta, and no text.
- **Cut** each as it was cut before (`tools/art/townspeople-cut.py`; the bell ringer with `tools/art/room43-bell-ringer.py`), then snap with `tools/art/one-level.py`. Overwrite the actor PNG in place, and keep or update the frame rectangles in its `content/ambient` JSON.

## Measure before anyone looks

- **Head:** crown to chin within 10% of Thad's at that depth.
- **Shoulders:** no wider than 1.15× Thad's.
- Both are measured on the side-by-side. They flag; they do not decide.
- `npm test` passes, especially `tests/scale.test.ts`, `tests/movement.test.mjs` and `tests/staging-clear.test.ts`.
- Re-render and push `renders/townspeople-vs-cast@3x.png` (`tools/art/townspeople-lineup.py`) and `renders/character-lineup.png` (`tools/art/character-lineup.py`). Send Tyler the lineup.

## Ship

- One pull request.
- Record it under the next free errata number on `main`.
- Commit trailers and a `Lesson:` line as usual.

## Not this brief

The hitching post with horses on Main Street (asset `room-02`, four operations, errata 168) is a separate job.
