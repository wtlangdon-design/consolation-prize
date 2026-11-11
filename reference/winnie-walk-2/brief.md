# Winnie's walk, with the skirt lifted: for the session with the image key (errata 272)

Written 2026-11-10. Tyler: **"Fund both and go."** Cap: **`winnie-walk-2` 2** in `art/staging/caps.json`. Do this first, then `reference/main-street-redraw/brief.md` (the spend cap note there applies to both).

## Why

Her walk from her counter to the loose board (errata 270) was drawn with the long skirt down to her boots. Under it the legs do not show and the six frames are nearly one outline, so it may read as gliding. A woman crossing a floor in a long skirt gathers it in one hand and lifts the hem; then the boots show, and the stride with them.

## The operation

`NODE_USE_ENV_PROXY=1 node tools/art/room-op.mjs reference/winnie-walk-2/walk-04.spec.json`. The template is the last sheet (`art/staging/room-05/second-ledger/walk2/template.png`: her standing figure, then the six walking frames as drawn); the prompt (`walk-04.txt`) keeps the standing figure as the ruler and repaints the six with the hem lifted and the stride visible. It writes `art/staging/room-05/second-ledger/walk2/sheet-04.png`.

**Check:** frames 2 and 5 (counting the ruler as 1) have different boots forward and a clear gap; frames 4 and 7 have the boots together; the walkers are her height (the hand-back of the last sheet found them 5.5% short; say if so again, it is fixed in the cut). One correction if it misses.

## Hand back

On the branch `redraws-art`, with `reference/winnie-walk-2/handback.md`. Do not cut it into `art/actors/`; the builder cuts it with `tools/art/second-ledger-walk.py` and the walk test measures it.
