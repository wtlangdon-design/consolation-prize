# The mercantile's doorway: handed back (reference/mercantile-doorway/brief.md)

**The brief was not on main.** It is on `playthrough-fixes-7` (fd155300); it was read there and copied here beside
this hand-back.

**The operation.** On Tyler's instruction (2026-11-15) `art/staging/caps.json` has a new entry `mercantile-doorway`,
cap 1, quoting it. **Attempt 1 is spent; the asset has none left.** This branch also carries the `nugget-barman` cap
entry and ledger row from `nugget-barman-art` (the same lines, so the two merge cleanly), so the ledger here is the
true count: **433 attempts, 4,379,916 billed tokens against `spendTokensTotal` 4,400,000** (about 20,000 left: the
guard refuses the next operation). Nothing in `content/` or `docs/` is touched, and the annotation's plate hash is
left for the other session.

## The plate

**`art/backgrounds/room-12-mercantile.png`**, the same path, 1920 x 864.
- sha256 before: `314c4a547802c2e0f1cb6266da39d47264732b06ec773441ada68cfed14565a1`
- sha256 after: `5d69d775d46499f1c31784c237af2131f23bcc535554267a03de7eefde206bdf`

Through the batwings it now shows the open street at night, as the brief asks:
- the store's porch boards and the first yard of mud under the batwings, warm from the porch lantern;
- the dark, wide street with puddles catching the sky;
- the dark line of the wooded hills;
- the night sky with a few stars.

Nothing is built across the street, and there are no figures. The colours are taken from Main Street's west end.

## The mask

**Mask rect: x 62, y 0, w 190, h 718** (x 62-251, y 0-717). It is 68,423 px, and 68,419 of them changed. It is not a
full rectangle: inside that rect it is only the outside seen through the doorway. That is:
- everything between the frame posts above the leaves' top rail;
- the slot between the two leaves;
- the porch under them.

The leaves, the frame, the threshold and the store floor are not in it.

**Changed pixels outside the mask: 0.** The tool asserts it.

**One step past the brief's wording.** The brief says "above the batwings' top rail". The mask also takes the slot
between the leaves and the porch under them, because:
- they show the same outside;
- the brief's own "lantern light on the near boards and the first yard of mud" is only visible there;
- left alone, the old house's foot would still show in the slot.

Mask file: `art/staging/mercantile-doorway/plate-mask.png` (white = repainted).

## Before and after

**`renders/room-12-mercantile-doorway-before-after.png`**: plate x 0-320, y 0-760 at 2x, before on the left.

## Light

Nothing outside is brighter than the store:

| | mean light | 99th percentile |
|---|---|---|
| the doorway, before | 19.6 | |
| **the doorway, after** | **20.3** | **64.3** |
| the store's interior | 32.3 | 121.5 |

## How it was made

1. **Inputs** (`art/staging/mercantile-doorway/`):
   - `input.png`: the plate's x 0-1080, y 0-720, scaled 1.4222 to 1536 x 1024;
   - `mask.png`: the doorway mask, 3 px wider, at that size;
   - `main-street-west-end.png`: `room-02-main-street.png` x 0-1400, attached as the reference.
2. **Prompt and spec:** `reference/mercantile-doorway/op-1.txt` and `op-1.spec.json`. The role is `plate`.
3. **Raw output:** `art/staging/mercantile-doorway/sheet.png`.
4. **Building the plate:** `tools/art/mercantile-doorway.py --write`.
   - It finds the mask on the old plate. The old plate is kept at `art/staging/mercantile-doorway/old-plate.png`, so the tool re-runs to the same pixels.
   - It scales the operation's output back to plate size.
   - It lays the output in only inside the mask.
   - It asserts that nothing outside the mask changes, then writes the plate, the mask and the render.

## For Tyler's eye

- **The frame's right inner face** was lit blue by the old view. Where that light was part of the mask, it is now the hills and mud. Where it was not, a few blue-lit pixels of the jamb remain. The result is a slightly ragged right edge to the opening between about y 110 and y 300, and again by the right post's foot.
- **The light on the near boards** is warmer than the old cold-blue porch. That is the porch lantern the brief asks for, but it is new warm light at the door.

## Checks

All 67 checks and all 1,927 tests pass on this branch.
