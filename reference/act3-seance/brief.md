# Scene B, the séance in Ozymandia's tent: for the builder session with the image key (errata 231, doc 111)

Written 2026-11-09.

**Authorized:**
- **The scene and its lines** (doc 111, THE LINES, B). Tyler, 2026-11-09: "Go".
- **The art.** Tyler, 2026-11-09, approving the Act III plan: "I approve all of your decisions". `art/staging/caps.json` gives `act3-seance` four operations. Check `art/staging/ledger.json` before every operation, and log every operation in it.

**Nothing here may be written by the builder.** Every line is in doc 111. This brief asks only for pictures.

Read first:
- `CLAUDE.md`, especially the character style gate and errata 77 (everything moves);
- `docs/55-full-game-build.md` §8;
- `docs/111-scenes-b-and-c.md`, part B and THE LINES, B.

Never touch `wtlangdon-design/anchorage`.

## What the scene needs to show

Room 16, Madame Ozymandia's tent (`art/backgrounds/room-16-tent.png`), at night, set for a séance. No new room plate: the tent's own plate, with the séance placed in it.

## Operation 1 · The séance table, with its sitters, lamp lit

- **One cut-out on magenta (#FF00FF), with no floor under it.**
- A **round table under a dark cloth that reaches the floor on every side.** This matters: Thad hides under it, so nothing may show beneath the table.
- On the table: **one candle and a small hand bell.** Nothing else.
- **Seated around it, holding hands:** four townspeople in their good coats, plus **Mr. Frame** in the front chair nearest the player, with a notebook and pencil instead of holding hands. Use Frame's existing figure (`art/actors/room-09-frame.png`) as the thing to match.
- **Madame Ozymandia at the head**, seated, eyes closed, more scarves than usual, her brass rod across her palms. Use `art/actors/room-16-ozymandia.png` to match.
- **No sixth chair.** There must be no empty seat.
- **Size.** Draw it against Thad in Room 16 at Room 16's size. A seated figure reads at the room's curve for a seated man (`content/scale-anchors.json`, posture `seated`).
- **Light.** Lamplight from above (a hanging lamp, drawn separately in operation 2), warm, on the faces and the tabletop.
- **Style.** Thad's look: flat, soft-shaded, low in texture (CLAUDE.md character style gate). Attach a frame of Thad in Room 16. Too sharp is the usual miss.
- **Frames, for errata 77.** A rest frame, a breath, and two deliberate actions:
  - a sitter glancing round at her neighbour;
  - Frame tapping his pencil on the notebook.
  If the budget is short, derive these from the rest frame (`tools/rig/room04-idles.py`).

## Operation 2 · The same table, the lamp down

- The **same group, same poses**, in near-darkness: the hanging lamp turned down to a bead, the candle the only real light, faces dim, the cloth almost black.
- Plus **the hanging lamp** as its own small cut-out, in both states (lit and turned down), so the room can switch it.
- **Frames:** rest, and the moment the séance turns: one sitter's head jerked up, Frame writing hard.

## Reserve

Two operations are held for corrections, each made by showing the generator the side-by-side (style gate, step 4). If 1 and 2 land first time, they are not spent.

## Handing it back

Commit the cut-outs under `art/actors/` and `art/props/`, with their ledger rows, on a branch. Then tell the main session the branch name. The main session wires them into the scene: the room state, the ambient files, the staging and the tests.
