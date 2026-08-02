# Target frame — Room 1

`room-01-target-frame.png` is **1920 × 1080**, composited by hand from the real assets at the sizes errata 54 specifies. It is **not a screenshot** — the engine cannot render it yet.

It exists so the renderer has something to be checked against rather than eyeballed.

| | |
|---|---|
| Play area | 1920 × 864 |
| Verb panel | 216px, placeholder — no font chosen (Q6) |
| Plate | `reference/casting/room-01-plate-approved.png`, 1870 × 841 upscaled 2.7% |
| Thad | `art/actors/thad-walk-right`, frame 2, **233px** |
| Hob | `reference/casting/hob-profile-source.png`, keyed, **196px** |

**Two things it does NOT show, deliberately:**

- **No ambient tint.** Thad is generated in neutral light; errata 54's model applies a per-room tint at runtime. He will read too bright against this night mud until that exists. That is expected, not a defect in the sprite.
- **No lantern glow.** Hob's ground light is a separate additive sprite (issue D8), which does not exist yet.

Depth: 233px near, 196px further up the road. Whether that falloff is steep enough is unresolved — there is no per-room scale curve (Q6).
