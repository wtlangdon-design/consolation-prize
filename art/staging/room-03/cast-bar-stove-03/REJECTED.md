# cast-bar-stove-03/source.png — REJECTED — NOT INTEGRATED, NOT ANCESTRY

The one additional `nugget-bar-stove-family` operation Tyler authorized on 2026-09-06, spent and
not used. **Nothing from this sheet is in the game.** The nine patrons in the Nugget are the ones
that were merged before it, unchanged, and `nugget_bar_2` and `nugget_bar_3` still carry the
defect it was meant to correct.

## What was asked for

A masked edit of `cast-bar-stove-02/source.png`. The mask freed a 701×764 window containing
`bar-2` and `bar-3` and nothing else, with 34 px of clearance to Bar Patron 1 and 89 px to the
Stove Man, so that Tyler's "do not reopen the accepted family members" would be structural rather
than a request in a prompt. The window and its clearances are asserted in
`tools/retrofit/phase2a-bar-fix-prep.py`, from the extraction record's own boxes.

## What came back

A new two-figure composition at a different scale, in none of the four original places.

| figure | how much of its own box is drawn, before → after |
|---|---|
| bar-1 (KEEP) | 52% → 52%, but not the same man: 67% of the box's pixels differ by more than 16 |
| bar-2 (redraw) | 42% → 12% |
| bar-3 (redraw) | 62% → 31% |
| stove-man (KEEP) | 52% → **6%** — he is gone |

`nugget_bar_3`, the moustached man in the bowler, is not in the returned image at all.
`nugget_bar_2` is wearing Thad's long blue-grey coat, which is not his costume.

## The diagnosis, for whoever is authorized next

**The prompt is not what failed.** The two men the model did draw are drawn in the vocabulary that
was asked for — flat skin masses, a shape per eye, no catchlights, facial hair as one shape. That
part of the instruction landed.

**The mask is what failed.** It did not confine the edit. Twelve earlier masked edits in this
project held their unmasked regions, so the convention itself is right (alpha 0 is the free
window) — what is new here is a mask whose free window is a large rectangle of flat backdrop
between separate figures, rather than a patch of continuous scenery. The endpoint appears to have
treated the request as "compose this scene again" rather than "repaint this window".

So a future authorized attempt should not rely on a mask to protect a figure. It should send a
source that contains **only** the men to be redrawn — one man per operation, or the two of them
cut out and composited onto their own canvas — so that the men who must not change are not in the
request at all.

Doc 36 Q130. Ledger: `nugget-bar-stove-family` attempt 4 of 4, `rejected: true`.
