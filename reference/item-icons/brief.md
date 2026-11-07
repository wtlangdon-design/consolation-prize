# All 26 item icons, redrawn at slot size: for the session with the image key (errata 142)

Written 2026-11-06.

**Authorized.** Tyler, 2026-11-06, asked what to do about the item pictures. Seven read poorly, and all 26 were enlarged by an uneven ×3.8. He chose: **"Redraw all 26 at slot size (Recommended)"**, an option that read "One or two images in your image session draw a new matching set at exactly the size they're shown". `art/staging/caps.json` asset **`item-icons`, 2 operations**: one sheet of all 26, and one correction.

## Why

`icons-before.png` in this folder is every icon at game size today, from the items audit (errata 140).
- **Seven read poorly:**
  - THE PICKLED EGGS read as a grey bin or dice.
  - THE LINEN MONEY is a cluttered cluster of coins and a button.
  - SHENG'S LOAN looks like grey rocks on paper.
  - THE LIVERY BLANKET is floating stripes.
  - THE HANDKERCHIEF is very faint.
  - THE PICKAXE and THE SAMPLE are dark on the dark panel.
- **The scaling is uneven.** Every icon is a 30×21 cell, fitted into a 180×80 inventory slot (`content/ui/panel.json`), which comes to ×3.81. So some art pixels draw 3 screen pixels wide and others 4. CLAUDE.md says integer scaling, and errata 112 B says a figure is "never enlarged".

## The target

- **Each icon is 60×40 art pixels, drawn at ×2 into its 180×80 slot.** `Renderer.drawInventory` fits by `min(180/60, 80/40)` = 2, which is a whole number, so every art pixel draws as a 2×2 block. That is about the pixel size of the cast at mid-depth (errata 112: a man is 115 art pixels).
- **Style:** the cast's. Soft-shaded, low texture, dark outline, and readable against the panel's dark ground (`panelBg`), the same treatment as the characters beside Thad. Not the old 1-bit, 320-era look.
- **What must survive** (`tools/pixelart/item_icons.py`'s docstring, errata 29):
  1. Each icon reads at size against the dark panel.
  2. **No two icons look alike.** The papers are the risk: THE AFFIDAVIT, THE ASSAY OF RECORD, THE CERTIFICATE, THE ATTESTATION, THE DEATH CERTIFICATE, THE SURVEY, THE INVITATION, THE EXECUTOR'S FORM, THE OBITUARY, THE DEED, THE LETTER, THE COMPANY MAP and THE SUBMISSION LOG. Draw them as different objects, not one paper with different marks: a sealed envelope, a folded newspaper, a gilt-edged card, a ledger, a stamped certificate with a seal, a hand-drawn chart, and so on. `check-item-names` fails if two cells are pixel-identical.

## The items

Read each item's own description in `docs/23-inventory-act1.md` and its later rows (doc 23 is extracted into `content/items/*.json` and is the authority). Keep the 26 ids in `content/ui/item-icons.json`, in that order:

tuning_fork · letter · four_dollars · deed · company_map · pickaxe · filing_fee · padded_log · watch · document_a (the affidavit) · document_b (the assay of record) · document_c (the certificate of contiguity) · document_d (the attestation) · death_certificate · survey · invitation · executor_form · obituary · handkerchief · photograph (a stock portrait) · eggs (a jar of pickled eggs) · tonic (Dr. Purvis's tonic, a bottle) · loan (Sheng's loan, $2.60 in coin, in a paper) · blanket (the livery blanket, folded) · linen_money (the Reverend's linen debt, coin) · sample (a heavy piece of rock with gold in it)

## The operation

**Inputs to the generator:**
1. `icons-before.png`, for what each icon is.
2. A crop of Thad and two cast members beside him at game size, for the style. `renders/townspeople-vs-cast@3x.png`, or a fresh `tools/art/figure-audit-sheets.mjs` sheet.

**The sheet.** Ask for:
- all 26 on one sheet;
- flat magenta (#FF00FF) ground;
- a grid of 6 or 7 across;
- each object alone, centred, the same scale family, with clear magenta between;
- crisp pixel edges, no glow, no text, no shadows.

**Cut.** Write the cut in `tools/pixelart/item_icons.py`, or a new `tools/art/item-icons-cut.py`. For each cell:
1. Find the object.
2. Scale it to fit 60×40, nearest-neighbour.
3. Snap it to the 60×40 grid, the same snapping `tools/art/one-level.py` does for figures.
4. Despill the magenta.
5. Write `art/ui/item-icons.png`, and `content/ui/item-icons.json` with `"cell": [60, 40]` and each rectangle.

**Correction.** Use the second operation only if the sheet plainly misses: an icon that does not read, two that look alike, or a style clash. Attach the side-by-side, and ask only for what missed.

## Prove it

- **Add a test**, for example `tests/item-icons-scale.test.ts`. Every icon cell must fit its inventory slot at a whole-number scale. This carries the lesson; prove it fails on the old 30×21 cells.
- Run `npm test`, especially `tests/items.test.ts` (errata 140) and `tools/check-item-names` via `node tools/run-all.mjs`.
- Make a new contact sheet of all 26 at game size beside their names, like `icons-before.png`, saved as `reference/item-icons/icons-after.png`. Look at it.
- Capture the inventory in the game on fixture `r7-f5-held`, which holds 19 items: `node tools/gauntlet/snap.mjs "fixture=r7-f5-held" <out.png>`.
- Write an errata entry at the next free number. Open a pull request and merge when green.
