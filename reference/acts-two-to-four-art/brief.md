# Acts II to IV: four drawings (errata 354)

For the image session. **No operation is spent until Tyler pastes the prompt below into it.** Budget at the time of writing: about 100,000 tokens left of the 4,625,000 ceiling (reference/act-one-art/handback.md). Each item below is one operation if it goes first time; cap of two each.

Every figure or prop is generated against a frame of Thad in the actual room (CLAUDE.md character style gate, step 1), flat, soft-shaded, low in texture. Key colour magenta. Nothing is a new character.

## 1. The view up out of the coffin, with Hob (room-32-coffin-lantern)
- **Why:** the plate shown when Hob opens the lid is script-drawn (`tools/art/render-coffin-plates.py`): a rectangle of sky, two brown bars, a lantern of four discs, and no Hob. It is the release after the three minutes of dark (invariant 2) and the only picture in Act III not in the game's hand.
- **What:** looking straight up out of an open pine coffin at night: the coffin's two long edges in the foreground at left and right, dark; the night sky beyond, a few stars; Hob leaning over the opening from the top of the frame, hat off, holding a lantern low so its light falls into the box. His face is mostly shadow, lit from below.
- **Keep:** the dark plate and the seam plates. They are right as they are.
- **Replaces:** `art/backgrounds/room-32-coffin-lantern.png`, same size.

## 2. The coffin top, open (art/props/room-31-hearse.png, the coffin region only)
- **Why:** the coffin on the trestles is drawn shut, with a second lid leaning on it; the lines describe it open, with a cushion in it, and USE THE COFFIN is the step into the dark.
- **What:** the same pine coffin on the same trestles, lid off and leaning against the near trestle (as drawn now), the box open, a small pale cushion at the head end. Only the coffin top changes.

## 3. The séance chalkboard (art/props/room-44-seance-sign.png, new)
- **Why:** THE SÉANCE SIGN in the Lane (E1's first step) is a hotspot over bare canvas; its LOOK describes a board that is not there.
- **What:** a small sandwich-board chalkboard leaning by the tent flap, about knee to waist height on Thad, lettered in chalk: SÉANCE TONIGHT, a line under it, and $2 written larger than the rest. Shown while `T_SEANCE_ON` (a prop with `when`, as Room 31's are).

## 4. The graveside hearse, redrawn to match the gate's (art/props/room-31-hearse.png, the hearse)
- **Why:** the hearse at Boot Hill's gate and at the graveside are two different vehicles on consecutive screens (gate: glass sides, tan curtains, two brass lamps, a plume; graveside: a black panelled box with no lamps).
- **What:** the gate's hearse (`art/actors/room-14-hearse-grievance.png`) seen from three-quarter rear at the graveside, empty (the coffin is out on the trestles), same lamps, glass and finial, at one consistent size against a man.

## Later, not in this brief
- The duel crowd and Fanshawe in the street are a different proportion and finish from Thad (Act IV art finding 4).
- Rooms 33 and 34 are drawn on a coarser pixel than their neighbours (Act IV art finding 5).

## Paste this into the image session

> Read `reference/acts-two-to-four-art/brief.md` on main and draw items 1 to 4 in that order. Add a cap entry for each to `art/staging/caps.json` (asset ids `room-32-coffin-lantern`, `room-31-coffin-open`, `room-44-seance-sign`, `room-31-hearse-match`, cap 2 each); Tyler authorizes up to eight operations in all for this brief. Stop at the token ceiling. Generate each against a frame of Thad in its room, flat and soft-shaded like him. Put the results on a branch named `acts-two-to-four-art` with a `reference/acts-two-to-four-art/handback.md` saying what was spent, and do not wire anything into the game: the main session wires it.
