# Acted directions, the third pass: the running list of movements the rewrite needs

**Tyler, 2026-11-11,** after the street people were rewritten (errata 286): "make a running list of new character movements that need to be created to bring the new dialogue to life, and we can create those via CC as a next step". Errata 287.

**This is a running list.** The rewrite goes character by character. When a rewritten line has a physical stage direction no figure has a pose for, the direction goes into `docs/95-acted-directions.md` as class **B**, and its pose is listed here in the same pull request. `tests/movements-to-draw.test.mjs` fails if a B row is missing from this list or a row here is not B. When a pose is drawn, cut and wired, its row in doc 95 moves to **A** and comes off this list.

**It is not drawn yet, and it has no budget yet.** Drawing it is the next step, in the session with the image key, once the rewrite has gone far enough that one batch is worth a session (Tyler's call). Ask Tyler for the operations first. **Do not edit `art/staging/caps.json`.** A fair size: one sheet per figure below, plus about a third again held for corrections against Thad.

**Nothing here may be written by the builder.** No lines. Do not touch `content/` or `docs/` while drawing. Never touch `wtlangdon-design/anchorage`.

## Read first

- `CLAUDE.md`: the character style gate. Too sharp is the usual miss.
- `reference/acted-directions-2/brief.md`: its rules stand, and so does its process:
  - the locked cast master;
  - the in-game Thad on every board;
  - one level of pixelation;
  - the head measured by ruler;
  - new poses appended after the last frame, with the existing frames untouched pixel for pixel;
  - the hand-back.
- `docs/95-acted-directions.md`: rule 4, and the table.

**Whatever a figure holds in his other frames, he holds in these, and the reverse (errata 111):** nothing appears or vanishes between poses. Where a new pose needs a prop the figure does not carry today, the prop is added to every frame of his sheet, and that is said under his entry below.

When done, commit to a branch named `acted-directions-3-art`, with `reference/acted-directions-3/handback.md` beside this brief. Push it, and stop. The wiring is done by the other session: the doc 95 rows moved to A, the extraction, the tests and the replay.

## The list, by figure

*Empty.* Everything on it was drawn by acted-directions-3 (`reference/acted-directions-3/handback.md`) and wired by errata 311: doc 95 rows 167, 168, 169, 172, 173 and 174 are class A. A row made B from here on goes here, under its figure.

## Done

Nothing yet.
