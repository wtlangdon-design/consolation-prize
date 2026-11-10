# Act III polish, handed back (reference/act3-polish/brief.md)

## 1 · The money's icon: `art/ui/item-icons-act3-polish.png` (+ `.json`)

`act3-estate-sale` operation 3 (ledger attempt 3; operation 4 is still held). One 60 x 40 cell, `[0, 0, 60, 40]`, id
`pratt_money` (this tool's name; name the item when wiring): two silver dollars squared in one upright stack and a
smaller stack of small coins, one copper, beside it. Tidy stacks are its idea: no other money icon is stacked (the
filing fee's loose pile, the pair of coins, the loan's sack, the linen money's copper scatter). Cut by
`tools/art/act3-money-icon-cut.py` with `item-icons-cut.py`'s own reduction; the tool refuses a cell pixel-identical
to any shipping cell. The two stacks are separate shapes, so the tool takes the box of everything drawn
(`objects()` keeps only the longest run and had dropped the small coins).

## 2 · The Reverend praying: `art/actors/room-14-sowerby-praying.png`

**Budget:** `act3-hearse` had no held operations -- its 3 and 4 went on Grievance's ears (its own handback). Tyler,
2026-11-10, chose to raise its cap 4 -> 5 (`art/staging/caps.json`, recorded there); this is ledger attempt 5.

Two frames the size of his shipping frames (182 x 314), `[2, 2, 182, 314]` and `[186, 2, 182, 314]`, registered on his
legs to his shipping rest frame (`art/actors/room-31-sowerby-master.png` frame 0, the sheet `sowerby-gate` uses), so he
does not shift: 0 eyes shut, chin a little raised, the open hand lifted, mouth closed; 1 the same, mouth open on a long
word. Cut by `tools/art/act3-sowerby-praying-cut.py`. `renders/room-14-sowerby-praying-with-thad.png` shows him at the
gate.

**At game size the shut eyes are a few pixels:** his open eyes were already dark slits at 314 px, so the lids alone
barely change; what reads as prayer is the raised chin and the lifted open hand (and the open mouth in frame 1). If the
line's "eyes shut" needs to read on its own, that is a face judged after the snap (doc 55 section 8).

Nothing in `content/` is touched; no lines are written.
