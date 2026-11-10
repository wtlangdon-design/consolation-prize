# Act III polish: two small pictures, for the builder session with the image key

Written 2026-11-09. Tyler, 2026-11-09, shown what was still rough in Act III's three new scenes: "Fix all the things that are rough".

**Budget.** No new operations. Each picture comes out of its scene's held reserve (`art/staging/caps.json`; check `art/staging/ledger.json` before each, and log each):
- `act3-estate-sale`: operations 3 and 4 are held (its handback). This brief spends **one**.
- `act3-hearse`: operations 3 and 4 are held (its handback). This brief spends **one**.

**Nothing here may be written by the builder.** No lines. Do not touch `content/`. Never touch `wtlangdon-design/anchorage`.

Read first: `CLAUDE.md` (the character style gate), `docs/55-full-game-build.md` §8, and the two handbacks: `reference/act3-estate-sale/handback.md`, `reference/act3-hearse/handback.md`.

## 1 · The money's icon (`act3-estate-sale`, operation 3)

MR. PRATT'S TWO DOLLARS AND SIXTY CENTS has no icon; it shows as a labelled box.

- **One 60×40 cell**, in the style and at the pixel size of `art/ui/item-icons.png` (see `reference/item-icons/brief.md` and how `tools/art/act3-coat-cut.py` cut the last two).
- **What it shows:** a small, square, very tidy stack of clean coins: two silver dollars and a few small coins beside them, squared up as Pratt would leave them.
- **It must not look like Sheng's loan icon** (`loan` in `content/ui/item-icons.json`; `tools/check-item-names.mjs` fails two cells that are pixel-identical, and a player should tell them apart at a glance). Attach the existing sheet so the generator sees the loan.
- Hand it back as a small sheet beside `art/ui/item-icons.png`, as the hen and coat were.

## 2 · The Reverend, praying (`act3-hearse`, operation 3)

At Boot Hill's gate, Thad's line during the prayer says the Reverend's eyes are shut, and the picture shows them open (`renders/proofs/boot-hill-praying/`).

- **The same man, same clothes, same size and stance** as `art/actors/room-31-sowerby-master.png` (attach it, and a frame of Thad in Room 14): cut out on magenta (#FF00FF), no ground.
- **Two frames, registered on his existing rest frame so he does not shift:**
  - eyes shut, chin a little raised, one hand lifted, mid-prayer;
  - the same, his mouth open on a long word.
- Thad's look: flat, soft-shaded, low in texture. Too sharp is the usual miss.

## Handing it back

Commit the cut-outs under `art/ui/` and `art/actors/`, with their ledger rows, on a branch named `act3-polish-art`. Push it and tell the main session the branch name. The main session wires them in.
