# cast-bar-pair-01 — REJECTED AS DELIVERED, PROMOTED AFTER A DETERMINISTIC FACE FINISH

The final Phase 2A image operation Tyler authorized. Its output was **not** promoted as it came
back; it was rejected on style, with identity and staging passing. It was then **repainted** with
zero image-generation operations, and the repainted figures are what `nugget_bar_2` and
`nugget_bar_3` are in the game.

| | |
|---|---|
| `source.png` | what the operation returned. Never shipped. |
| `bar-2.png`, `bar-3.png` | the two figures cut out of it. The identity, pose, clothing and silhouette authority. Never shipped. |
| `finished/bar-2.png`, `finished/bar-3.png` | those two with their faces repainted. **These ship**, pre-scaled into `art/actors/cast-nugget-bar-{2,3}.png`. |

## Why the operation was not promoted as delivered

The method worked and the art did not. The request held only these two men, so the two who must
not change were not in it: the same two men came back, same poses, same clothes and colours, same
props, same facings, nobody added or deleted, no scene composed, neither man turned into Thad.
Every failure of the masked family-sheet attempt before it was absent.

But at 380 px and 494 px — the heights the room draws them at — the eye was still an eyeball: a
white sclera, an iris, a lid line, a catchlight. Thad's eye at the same height is one dark shape,
and so is every accepted figure's in this game. The cheeks still carried smooth continuous
modelling. Hair, hat, moustache and cloth were all genuinely improved and none of that was in
question.

## What the finish did, and did not do

`tools/art/phase2a-face-finish.py`, run on the two cut figures. Every operation is confined to a
declared region of a declared character; hair, hat, facial hair, clothing, hands, props, body and
pose are never touched, and there is no blur, no global posterize, no palette reduction, no
downsample-and-upscale.

- **The eye.** Inside a rectangle read off the art at 14× and drawn to sit below the brow, a pixel
  that is light and *not warm* takes the eye's own darkest tone. This cast is lit by lamplight and
  their skin runs to red-minus-blue around 170; a sclera is near-neutral. The dark part of the eye
  is left exactly as drawn, so the eye keeps the shape the generation gave it and simply stops
  being an eyeball. 25 pixels per man.
- **The cheek.** The skin inside the face is snapped to four tones measured from that man's own
  face, and every connected run smaller than 14 px is handed to the tone around it. The colours are
  his, so his colour family survives; the ramp between them does not.

Both were judged independently against Thad at matched figure height, against the accepted stove
man and card player 4, and at 1:1 in the deployed room. Both passed on identity, on pose and on
style, so both were promoted. Nothing else in the room changed: Bar Patron 1 and the Stove Man are
byte-identical.

Doc 36 Q131 (the operation) and Q132 (the finish). Ledger: `nugget-bar-stove-family` attempt 5 of 5.
