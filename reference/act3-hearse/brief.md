# Scene A, the hearse at Boot Hill's gate: for the builder session with the image key (errata 231, 233)

Written 2026-11-09.

**Authorized:**
- **The scene and its lines** (doc 110 §2). Tyler, 2026-11-09: "Go".
- **The art.** Tyler, 2026-11-09, approving the Act III plan: "I approve all of your decisions". `art/staging/caps.json` gives `act3-hearse` four operations. Check `art/staging/ledger.json` before every operation, and log every operation in it.

**Nothing here may be written by the builder.** Every line is in doc 110 §2. This brief asks only for pictures.

Read first:
- `CLAUDE.md`, especially the character style gate and errata 77 (everything moves);
- `docs/55-full-game-build.md` §8;
- `docs/110-act-three-scenes.md` §2.

Never touch `wtlangdon-design/anchorage`.

## Why new art is needed

The scene stages Room 31's funeral at Room 14's gate. The agent that tried to build it with the existing sprites stopped, rightly, for two reasons:

1. **No picture of the hearse shows the coffin inside it.** Room 31's hearse (`art/props/room-31-hearse.png`) and Grievance (`art/actors/room-31-grievance.png`) are drawn with the coffin outside, on trestles, its lid propped up. The scene's lines need the coffin inside, behind the glass: "My coffin is inside, behind the glass", "Nothing from inside", and Thad climbing in.
2. **They face the wrong way.** Grievance and the hearse face left, toward town. At Room 14's left-hand gate, the procession faces right, up the hill.

`layout-mockup-existing-sprites.png` in this folder shows the problem. It is the existing cast pasted at the gate, with Thad standing at Room 14's scale on the right. It is a scratch picture, not a render.

## Operation 1 · The hearse and Grievance, at the gate, facing up the hill

- **One cut-out figure on magenta (#FF00FF), with no ground under it.**
  - Grievance is in her black harness and hitched to the hearse, facing RIGHT, up the hill. Her head is turned back over her shoulder toward the hearse, because she is not fooled.
  - She stands square, and won't move.
  - Her black ribbon is plaited into her mane, as at the funeral.
- **The hearse** is the same hearse as Room 31's:
  - black lacquer, brass lamps, the plume on the roof, glass sides;
  - its curtains are drawn;
  - the coffin is INSIDE: the end of a pale pine coffin just visible through the glass where the curtain doesn't meet;
  - no trestles, no propped lid, and no grass baked in.
- **Size.** Draw it against Thad in Room 14 at Room 14's size: a standing man at the gate is about 285 to 305 px. Grievance's withers are 0.75 to 0.9 of that man (`content/scale-anchors.json`, the animals).
- **Light.** The gate's night light. Not Room 31's blue rim, which shows as a halo against Room 14's plate.
- **Style.** Thad's look: flat, soft-shaded, low in texture (CLAUDE.md character style gate). Attach a frame of Thad in Room 14, and Room 31's hearse and Grievance as the things to match.
- **Frames, for errata 77.** A rest frame, a breath, and two deliberate actions:
  - Grievance's head turning back toward the hearse;
  - a foot stamped once.
  If the budget is short, derive these from the rest frame (`tools/rig/room04-idles.py`).

## Operation 2 · The mourners, heads bowed (if the budget allows)

Room 31's seven mourners (`art/actors/room-31-mourners-master.png`) have no bowed pose. Doc 110's prayer says "The mourners bow their heads and shut their eyes."

The same seven people, the same group and the same clothes, in two frames:
- heads bowed and eyes shut;
- heads bowed, one of them peeking.

These are cut on magenta, at their existing drawn size; the room scales them. If this operation isn't spent, the moment is carried by the words alone, and the scene still works.

## Reserve

Two operations are held for corrections, each made by showing the generator the side-by-side (style gate, step 4). If both 1 and 2 land first time, they are not spent.

## Handing it back

Commit the cut-outs under `art/actors/` and `art/props/`, with their ledger rows, on a branch. Then tell the main session the branch name. The main session wires them into the scene: the ambient files, the staging and the tests.
