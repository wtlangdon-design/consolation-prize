# THE LAST CLAIM IN CONSOLATION
## 127 · GIVE

*Tyler, 2026-11-11, shown the game's deliberate differences from Monkey Island: "Add GIVE as a 10th verb." Then: "Are we going to incorporate the Give action so that it actually has a purpose in a few places?" Errata 282 records it. This document is the source: `tools/extract-content.mjs` reads it.*

Monkey Island needed GIVE about seven times (the troll's fish, Otis, the circus brothers' helmet, the monkey's bananas, the cannibals' idol and leaflet, Herman's banana picker), and each of them is a hand-over: the thing changes hands. This game had twenty-three hand-overs, all written as USE because the verb did not exist. They are GIVE now, and only GIVE: USE THE FILING FEE ON SUMP gets the fee's own wrong-answer line, as USE THE FISH ON THE TROLL would have. The tools used on someone stay USE: the fork struck at Grievance, the chalk on Pratt.

## The hand-overs

Each row is a pair the game already has, by item and person. The verb it now answers is in the third column. *Either* is a pair that reads as both (a blanket put on a dog, a hen held out to a raccoon), and answers USE and GIVE alike.

| Item | To | Verb |
|---|---|---|
| `filing_fee` | `sump` | GIVE |
| `filing_fee` | `ozymandia` | GIVE |
| `company_map` | `ozymandia` | GIVE |
| `padded_log` | `winnie` | GIVE |
| `death_certificate` | `frame` | GIVE |
| `capital_b` | `frame` | GIVE |
| `loan` | `undertaker` | GIVE |
| `pratt_money` | `undertaker` | GIVE |
| `raccoon_in_coat` | `undertaker` | GIVE |
| `raccoon_in_coat` | `pratt` | GIVE |
| `raccoon_in_coat` | `sheng` | GIVE |
| `hen` | `pratt` | GIVE |
| `executor_form` | `sump` | GIVE |
| `executor_form` | `winnie` | GIVE |
| `executor_form` | `frame` | GIVE |
| `executor_form` | `sheng` | GIVE |
| `executor_form` | `pratt` | GIVE |
| `executor_form` | `sowerby` | GIVE |
| `letter` | `sowerby` | GIVE |
| `funeral_notice` | `sowerby` | GIVE |
| `clarion` | `gulch_lookout` | GIVE |
| `deed` | `gulch_lookout` | GIVE |
| `deed` | `pratt_jump` | GIVE |
| `blanket` | `dog` | Either |
| `hen` | `raccoon` | Either |

Doc 109's *THE LOOKOUT · GIVE anything else* was built as USE for want of the verb; it answers GIVE.

## When nothing is written for it

Monkey Island answered a hand-over it had not planned for with a short refusal. These are Thad's, said in turn.

**GIVE, to a person:**

- "I held it out with my warmest smile. Both were declined, politely."
- "A gift, freely given! It was looked at, then I was, and we were both found wanting."
- "I'd have loved to see it go to a good home. Not this one, apparently."

**GIVE, to a thing that is not a person:**

- "I'd have given it gladly. It has no hands, which I checked only after offering."
- "It isn't in a position to accept, though I like to think it was touched."
- "Generosity, wasted on it. I'd do it again. I'm like that."

**GIVE, with nothing in hand, to a person:**

- "Give what? I'm holding nothing, and I've grown rather attached to it."

**GIVE, with nothing in hand, to a thing:**

- "I'd have to be holding something first. It's the one rule of giving."
