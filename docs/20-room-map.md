# CONSOLATION PRIZE
## Room Connectivity Map

*Never written. Doc 02 graphs the puzzles; nothing graphed the rooms, which is why Room 7 had no way in. Binding.*

---

# THE PROBLEM

Composed Main Street has exactly **six** enterable businesses — the store, the newspaper, the saloon, the Improvement Company, the hotel, the assay office. The town has **twenty-one** screens plus six ancillary interiors. Fifteen rooms had no stated route.

Widening Main Street to fit them is wrong twice over: at 320 pixels the false fronts stop reading as false, and Consolation becomes one street with everything on it, which is not what a boomtown looks like.

---

# THE SOLUTION — a town map screen

Monkey Island reached most of Mêlée Island through a map. Consolation does the same, and it costs one screen.

**Room 0 · THE MAP.** Not a painted location — a drawn plan of the district in the same palette: Main Street as a line of façades, side lanes, the road out to the diggings, the hills. Locations appear on it as they become known, and are clicked to travel.

**A location appears on the map once Thad has heard of it**, not once he has been there. The undertaker appears when the stage driver mentions him in the opening. The map is therefore a quiet record of what the player has learned, and it needs no tutorial: the first time it opens it has three things on it.

---

# THE GRAPH

## Direct, from Main Street (Room 2)

Six façades, clicked to enter. These are the six the composition draws.

| Exit | To |
|---|---|
| The Nugget's doors | 3 |
| The Clarion office | 9 |
| The Improvement Company | 10 |
| The mercantile | 12 |
| The hotel | 18 |
| The assay office | 5 |

Plus two ends and the map:

| Exit | To |
|---|---|
| West, out of town | 1 · stage road |
| East, the back lots | 20 · back alley |
| **THE MAP** | 0 |

## Interiors — one way in, one way back

| Room | Reached from | Leads on to |
|---|---|---|
| 3 · The Nugget | Main Street | 4 · back room |
| 5 · Assay office | Main Street | 6 · records room |
| 7 · Claims Registrar | **the map** | 8 · archive |
| 9 · The Clarion | Main Street | — |
| 10 · Improvement Co. lobby | Main Street | 11 · Fanshawe's office |
| 12 · Mercantile | Main Street | — |
| 13 · Undertaker's | the map | — |
| 15 · Livery stable | the map | — |
| 16 · Ozymandia's tent | the map | — |
| 17 · Church & meeting hall | the map | — |
| 18 · Hotel lobby | Main Street | 19 · Thad's room |
| 20 · Back alley | Main Street, east end | 21 · watchman's shack |
| 21 · Watchman's shack | the back alley | — |

**Room 8, the archive, is gated** — reachable only as an executor, per E2. Before that the door is a hotspot in Room 7 that does not open.

**Room 35, the Company vault**, opens off Fanshawe's office (11) and is gated to Act IV.

## From the map — the diggings

| Room | Note |
|---|---|
| 22 · Road to the claims | The junction. Everything below reaches through it |
| 23 · Prosperity | via 22 |
| 24 · The hole | via 23 |
| 25 · Pratt's claim | via 22 |
| 26 · Creek & sluice | via 22 |
| 27 · Abandoned claim row | via 22 |
| 28 · Sheng's laundry | via 22 |
| 29 · The high ridge | via 22 |
| 30 · Mott's supposed site | via 22 |
| 14 · Boot Hill | via 22. Also directly on the map once Pike is mentioned |

## Act III and IV

| Room | Reached from | Gate |
|---|---|---|
| 31 · The funeral | Boot Hill | E6 |
| 32 · Inside the coffin | the funeral | E7. No exit — resolves on a timer |
| 34 · Under Prosperity | the hole (24) | F1 |
| 33 · The listening chamber | 34 | F2 |
| 35 · The Company vault | Fanshawe's office | Act IV |
| 36 · Main Street, dawn | replaces Room 2 | after F5 |

## The six ancillary interiors

All from the map: the barber's, the boarding house parlour, the photographer's studio, the bakehouse, the empty storefront, the schoolhouse. None gates anything. All appear on the map from Act I.

---

# RULES

1. **Every room has a stated route in.** A room with no entry is a build failure, not an oversight. Add a validator.
2. **The map is never the only route to a story location.** Anything Act I requires is either on Main Street or one click from the map, and the map is always reachable.
3. **A location appears when heard of, not when visited.** The map records what Thad knows.
4. **No location is ever removed**, including after Act IV.
5. **Travel is instant.** No transition screens, no timed walks. The map is a menu that looks like a place.

---

# WHAT THIS ADDS TO SCOPE

**One screen** — Room 0, the map. Drawn, not painted: a plan in the locked palette, with location markers and labels rendered by the engine in the game font, so nothing is baked into art and nothing needs redrawing when a name changes.

It also gives the opening its shape. The map's first state has three things on it — Main Street, the hotel, and the undertaker, the last because the stage driver mentioned him. A player who has talked to nobody has two.
