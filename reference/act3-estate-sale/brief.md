# Scene C, the estate sale at Prosperity: for the builder session with the image key (errata 231, doc 111)

Written 2026-11-09.

**Authorized:**
- **The scene and its lines** (doc 111, THE LINES, C). Tyler, 2026-11-09: "Go".
- **The art.** Tyler, 2026-11-09, approving the Act III plan: "I approve all of your decisions". `art/staging/caps.json` gives `act3-estate-sale` four operations. Check `art/staging/ledger.json` before every operation, and log every operation in it.

**Nothing here may be written by the builder.** Every line is in doc 111. This brief asks only for pictures.

Read first:
- `CLAUDE.md`, especially the character style gate and errata 77 (everything moves);
- `docs/55-full-game-build.md` §8;
- `docs/111-scenes-b-and-c.md`, part C and THE LINES, C.

Never touch `wtlangdon-design/anchorage`.

## What the scene needs to show

Two rooms that already exist: Room 23, Prosperity (`art/backgrounds/room-23-prosperity.png`), where the raccoon lives in Thad's hole, and Room 25, Pratt's claim (`art/backgrounds/room-25-pratts-claim.png`). No new plates.

The raccoon already exists (`art/actors/room-23-raccoon.png`); match it. Pratt already exists (`art/actors/room-25-pratt.png`); match him.

## Operation 1 · Pratt's hen, and the raccoon halfway out

- **One cut-out sheet on magenta (#FF00FF), two figures, each with no ground under it.**
- **The hen.** A plain brown hen with firm views. Standing, side-on. Frames for errata 77: rest, a breath, a head cock, a peck at the ground. At Room 23's size a hen stands about a fifth of the room's man at that depth.
- **The raccoon, halfway out of the hole.** Head and shoulders and forepaws only, as if emerging from a hole in the ground; nothing below the chest. Looking at something to his right (the hen) with suspicion. Frames: rest, a breath, a sniff toward the hen, a duck back down by half.

## Operation 2 · The raccoon, in Thad's coat, carried

- **Thad in his shirtsleeves, holding his own coat bundled in both arms, with the raccoon inside it.** The raccoon's masked face and one paw stick out of the top; the bundle bulges. This is the physical joke of the scene: the coat is losing.
- Draw it against Thad's existing figures. **Attach a frame of Thad in Room 23**, and match his face, hat, trousers and boots; only the coat is off and in his arms.
- **Frames:** rest, a breath, the bundle lurching left, the raccoon's paw swiping out.
- **Plus three item icons, 60×40 art pixels each, matching `art/ui/item-icons.png`** (see `reference/item-icons/brief.md`): the coat, bundled, a raccoon's face out of the top; one for the hen; and MR. PRATT'S TWO DOLLARS AND SIXTY CENTS, a few coins, which must not be pixel-identical to Sheng's loan icon (`check-item-names` fails two identical cells): Pratt's coins are clean and stacked square.

## Reserve

Two operations are held for corrections, each made by showing the generator the side-by-side (style gate, step 4). If 1 and 2 land first time, they are not spent.

## Handing it back

Commit the cut-outs under `art/actors/`, and the two icons as a separate small sheet beside `art/ui/item-icons.png`, with their ledger rows, on a branch. Then tell the main session the branch name. The main session wires them into the scene: the room states, the items, the staging and the tests.
