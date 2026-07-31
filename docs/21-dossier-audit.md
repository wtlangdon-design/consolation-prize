# THE LAST CLAIM IN CONSOLATION
## Audit against the Monkey Island design dossier

*Source: a synthesis of the Video Game History Foundation's source-code archive, supplied 30 July. Audited against the project as it stands. Confirmations listed briefly; gaps in full.*

---

# CORRECTION — this table was wrong when written

*Added after an external audit against `main`. The table below listed principles as "already in place" on the strength of Claude Code's reports rather than the code. **Occlusion, staging marks and entrance coordinates were not on `main` and several still are not.** The implementation work was sitting on an unmerged branch six commits ahead while documents were pushed directly to `main`.*

**Rule going forward: a principle counts as in place when it is on `main`, verified in the schema or the renderer. Not when it is ruled, and not when it is reported.**

Specifically corrected below: occlusion was **ruled**, implemented on a branch, and **not merged**. `RoomFile` on `main` had no foreground field, no occlusion mask, no entrances and no staging marks.

# CONFIRMED — already in place

| Dossier principle | Ours |
|---|---|
| Z-planes: occlusion as functional room data | Ruling 21a — **ruled, not merged when this was written.** See correction above |
| Depth scaling by position | Ruling 15 |
| Ambient motion as actors, not baked into background | Ruling 20's architectural consequence |
| Dependency charts, parallel goals over one corridor | Doc 02's three trials |
| Maps to compress travel | Doc 20 |
| Failed actions are authored content | Docs 13, 14 |
| Humour embedded in nouns | The whole examine layer |
| Graybox before finish | **Stated, not practised — see gap 1** |
| Room spec as data: walk polygons, occlusion, entrances, exits, hotspots | **Partially wrong as written.** `RoomFile` carries hotspots, exits, walkable regions with depth zones, cycling and ambient. It does **not** carry occlusion, entrances or staging marks. Entrance placement is a real gap: on a room change Thad is placed in the centre of the last walkable rectangle rather than arriving at the door he used |

**On "do not copy insult-swordfighting":** the Liar's Assay occupies the same structural slot — dialogue as combat, learn the counters by losing. The content is entirely different (boasting about gold, not insults), as is the joke, and its payoff inverts the mechanic when Thad wins by telling the truth. The transferable lesson is the structure; the proprietary noun is the insult duel. Judged clear, and recorded here so the judgement is visible rather than assumed.

---

# GAP 1 · Production order — **severity: high, and we have already been bitten twice**

**Dossier:** grayscale value block → walkable band and exits → object silhouettes → character placement and reach → occlusion test → lighting and palette → texture → ambient animation.

> *"Never let a beautifully finished background become the first time the team discovers that the character has nowhere good to stand."*

**Ours:** compose a finished room, then check legibility, then discover a problem.

**Evidence we have done exactly the thing warned against:**
- **Room 1** shipped unplayable — 80% of the first screen anyone plays inside a 58-point band, Thad's coat invisible against the road. Found after composition.
- **Room 5** had a fully composed office before anyone asked where a bright counter put a character's face.
- **Room 2** was composed four times before the false fronts read as false.

**Change: adopt the dossier's order for all 39 remaining rooms.** Value block and walkable band first, character placed and legibility-checked at graybox, lighting and texture last. `surface_plan.py` already audits intended surfaces before drawing — that is graybox in embryo, and it should become a required gate rather than an optional tool.

**This is the highest-value change in the audit.** It costs nothing and it applies thirty-nine more times.

---

# GAP 2 · Thad has no colour cue at small scale — **severity: high**

**Dossier:** *"Give the protagonist one persistent high-contrast colour cue. Do not rely on facial detail for identification."* Test every principal at portrait, room, silhouette-only, and **four-to-eight-pixel map-token** scale.

**Ours:** Thad is carried by a pale face and a dull bottle-green coat at luminance 33. Ruling 16's two-anchor system works at 40px, 32px and 26px. **Below that it fails** — at 8px the face is one or two pixels and the coat is a dark smudge. Guybrush had a white shirt, unmistakable at any size.

Doc 20 introduces a map screen. If characters appear on it as tokens, Thad currently has nothing to be recognised by.

**Change:** give Thad one persistent high-contrast cue that survives to 8px. Candidates, in preference order:

1. **Enlarge the white shirt front** so it reads as a bright vertical stripe rather than a collar triangle. Closest to Guybrush's solution and it strengthens the light anchor in dark rooms, which ruling 18a flagged as weak in Room 1.
2. A single saturated accent — a waistcoat in `accent_rust` or `accent_gold`, small but never occluded.
3. Something carried and always visible.

**Then test at 8px and 4px before any other character is drawn**, since every ambient and named character inherits the answer.

---

# GAP 3 · No palette proportion discipline — **severity: medium**

**Dossier:** palette scripts per room, not colour chosen object by object:

```
Dominant field            55–70%
Structural shadow family  15–25%
Secondary local colour    10–15%
Narrative accent / light   3–8%
UI-safe highlight          reserved
```

**Ours:** ruling 17b assigns each interior a material *identity*, which is a hue decision. Nothing governs **proportion**, and the measured distributions show why that matters — Room 3 is 60% in one 74-point band and reads monotone; Room 5 spreads across 101 points and reads composed.

**Change:** declare a palette script per room alongside its material identity, and add a check reporting actual proportions against target. Not a build failure — a warning, since a deliberate near-monochrome room (the undertaker's, per doc 09) is a legitimate choice that must be visibly deliberate rather than accidental.

---

# GAP 4 · Character animation scope is under-specified — **severity: medium**

**Dossier minimum for a protagonist:** four-direction walk; four-direction idle; **face-direction change without walking**; talk in left, right and near-front; **pick up low, use at waist height, use overhead**; give and take; a short comic reaction; an eye or head glance.

**Ours:** doc 15 lists walk, talk, reach/pickup and three scripted specials. Missing: direction change without walking, three distinct use heights, give/take, and the small reactions the dossier singles out as the source of comic timing — *"prefer the smallest readable reaction."*

**Change:** expand Thad's animation list in doc 15 before any of it is drawn. Note that the eye-shift and head-turn are cited specifically as economy wins: a two-frame eye movement does the work of a full reaction.

---

# GAP 5 · Atmosphere-only rooms are unexamined — **severity: medium**

**Dossier:** the Trail room was gorgeous, finished, and cut late for being atmosphere without play. *"Make atmospheric scenes earn traversal time."*

**Ours, unaudited:** the six ancillary interiors, Room 27 (abandoned claim row), Room 30 (Mott's supposed site), Room 29 (high ridge, though it doubles as the title composition).

Doc 15 already commits to writing every room at full standard, so this is not a cost argument — it is a pacing one. A room the player walks into, examines and leaves with nothing costs traversal time whatever it cost to build.

**Change:** audit each against a single test — does it carry a puzzle, a reveal, a running gag payoff, or a required object? The schoolhouse passes on the last count (it carries a joke the ridge sets up). Others may not.

---

# GAP 6 · The Nugget may exceed the ambient budget — **severity: low**

**Dossier:** one to three ambient loops per room — one atmospheric, one comic/life, one state-responsive.

**Ours:** the Nugget has the stove cycling, the chandelier cycling, and four crowd idles. Six moving elements, arguably two categories.

**Change:** none yet. Watch it in the GIF. If it reads as busy, drop the chandelier — it is the weakest of the six and doc 05 describes it as unlit anyway.

---

# GAP 7 · Entrance placement — **severity: medium, added by external audit**

On a room change the actor is placed at the centre of the last walkable rectangle rather than at the entrance he arrived through. Walking out of the Nugget's front door should put Thad on Main Street's boardwalk outside the Nugget, not in the middle of the road.

`RoomFile` needs an `entrances` field: named arrival points, one per incoming exit, each with a position and a facing. Ruling 22's step 2 already asks for entrances at graybox; the schema does not yet hold them.

---

# PRIORITY

1. **Gap 1** — production order. Costs nothing, applies 39 more times.
2. **Gap 2** — Thad's colour cue. Every other character inherits the answer.
3. **Gap 4** — animation scope, before any of it is drawn.
4. **Gap 3** — palette proportion.
5. **Gap 5** — atmosphere-only rooms.
6. **Gap 6** — watch and decide.
