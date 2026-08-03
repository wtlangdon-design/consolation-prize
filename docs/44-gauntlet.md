# THE GAUNTLET
## An automated play-through that fails with a beat number, a name, and a difference

*Doc 43 is prose: it says where everyone stands. This is its machine-readable sibling — the same facts in a form a script can compare against a running game — plus the harness that does the comparing.*

**The goal is that the project owner is only ever asked about taste.** Every question of the form "is the coach in the right place / is he facing the right way / did the clip resolve" should be answered by a script on every push. Every question of the form "is this scene any good" should be answered by a person, and only that kind should reach one.

---

# READ THIS FIRST — THE THREE HONESTIES

These are not caveats appended at the end. They are the reason the design has the shape it has, and each one changed something above.

## 1. IT CANNOT JUDGE COMPOSITION

**"He is speaking to nobody" is a real fault and no assertion here catches it.**

Every check in this document is of the form *this number is within this tolerance of that number*. A scene in which Thad stands correctly at (1330, 812), faces right correctly, plays the correct clip, speaks the correct line at the correct moment — and is addressing a coach that left two beats ago, or a driver whose head is turned away, or is nine hundred pixels from the man he is talking to — passes every assertion in a green run.

The gauntlet's scope is **the script being executed as written**. Whether the script describes a scene worth watching is outside it, permanently and by construction. Nothing in a future version fixes this; a harness that could judge composition would be a different kind of program.

**So a green gauntlet is not a reason to stop looking at the game.** It is a reason to stop looking for *this list of faults*, which is a smaller and much duller claim.

## 2. THE APPARATUS IS PART OF THE SYSTEM — R5h

**An instrument can change the system, not only report on it.** That rule was earned: `BODY_ONE_OWNER` was reported as an instrument artifact and was not one, and the reasoning that dismissed it was that the harness must have perturbed the timing. It had not. But it could have.

The gauntlet perturbs the game in three ways, all of them real:

| What | Cost |
|---|---|
| The per-frame watch records violations inside the draw loop | An allocation and a few comparisons per mover per frame |
| The probe is called from outside, up to 20 times a second | A synchronous read of every mover, on the main thread |
| Headless Chromium under CI is not a Chromebook | Different frame pacing entirely |

So the harness **runs the opening twice: once with the watch on and once with it off**, and asserts that every beat's measured duration agrees between the two runs within the same tolerance the beats themselves use. If it does not, the harness says so and the run is not green — because a timing that only holds while being measured is not a timing.

This is R5h's four-way table (R5i) in the one place it is cheapest to build: the instrument agreeing with itself proves nothing, so the instrument is compared against its own absence.

## 3. A GREEN GAUNTLET AGAINST A WRONG SCRIPT IS WORSE THAN NONE

**The expected positions below are guesses until somebody looks at them.**

This is the failure mode the whole design is arranged around, and it is worth stating in the strongest form: if the script says Thad talks from (1330, 812) and (1330, 812) is a bad mark, then the gauntlet's entire contribution is to defend a bad mark against correction, on every push, with a green tick. It converts an error into an invariant.

Two consequences, both load-bearing:

**The script is written BY HAND from doc 43. It is never generated from `content/sequences/opening.json` or from the staging table in `tools/extract-content.mjs`.** A script generated from the staging table would pass no matter what the staging said, because it would be the staging, compared against itself. That is R5i exactly — *a mechanism agreeing with itself is the failure* — and it is the single most tempting shortcut in this document. `tools/check-gauntlet-script.mjs` asserts the two files agree on **structure** (which beats exist, in what order, under what control) and deliberately does **not** compare a single coordinate, because the coordinates are the independent half.

**Every number carries where it came from.** A mark whose `note` says *"measured, 2026-08-03"* and one whose `note` says *"guess, nobody has looked"* are treated identically by the harness and very differently by a person reading a failure. Write the second kind honestly. A script that claims more confidence than it has is how a bad mark becomes permanent.

---

# THE PREREQUISITE, NOW IN PLACE

**The runner could not say which beat was playing.** It knew — and threw the fact away when it flattened beats into steps. Every diagnosis in the last two sessions had to reconstruct the beat number from timings and positions.

`SequenceRunner.beat` now reports it. Two details that matter for reading a failure:

- It is the beat of **the last step dispatched**, not `steps[index]`. Chores, waits and lines advance the index *before* they hold, so for most of a cutscene's wall-clock the indexed step is the one that has not started — and at a beat boundary that is the *next* beat.
- It is `undefined` when no sequence is running. Player-control beats carried by a tree report through the same field, because `carriedStepsFor` tags its steps too.

A beat number is structure, not content: doc 17 authored it and the extractor already carries it into `content/sequences/opening.json`.

---

# WHERE THE FILES LIVE

| Path | What | Whose |
|---|---|---|
| `tools/gauntlet/opening.json` | **The script.** Every beat, every mark, every expected position | **Tyler's.** Written by hand from doc 43 |
| `tools/gauntlet/schema.mjs` | The schema, as a validator. One definition, used by both the check and the harness | Engine |
| `tools/check-gauntlet-script.mjs` | Runs in `npm run validate`. Structure only | Engine |
| `tools/gauntlet/run.mjs` | The harness. Drives a browser, samples, compares | Engine |
| `engine/dev/Watch.ts` | The per-frame negative assertions, recorded inside the draw loop | Engine |
| `engine/dev/Probe.ts` | What the harness reads. One function, one shape | Engine |

---
---

# PART ONE — THE SCRIPT SCHEMA

*This is the part to write. Everything below is a field with a type and a rule; nothing is left to be inferred.*

## The file

```jsonc
{
  "schema": 1,
  "sequence": "opening",              // must name a file in content/sequences/
  "room": "stage-road",               // must equal manifest.startRoom
  "source": "docs/43-room-01-staging-script.md",

  "defaults": {
    "position": 24,                   // px. Feet anchor, both axes, unless a mark overrides
    "height": 8,                      // px. Drawn figure height
    "slack": 3.0                      // s. Added to every beat's stated duration for `within`
  },

  "band": [660, 864],                 // every mover's feet Y must be inside this, every frame
  "bandExempt": [],                   // movers the band does not govern. Name them or leave empty

  "until": { "beat": "10", "on": "enter" },   // where the run stops

  "beats": [ /* Beat, in the order they play */ ]
}
```

**`band` is Y only.** X is deliberately unconstrained: Hob is placed at x −260 and the coach departs to x 3000, and both are correct. Off-frame is a real place.

**`bandExempt` names movers, and naming one is a claim.** It says *this thing is not a person standing on the ground*. Today nothing needs it — the coach's wheels sit at y 742, inside the band. Leave it empty until something genuinely does not belong on the floor.

## Beat

```jsonc
{
  "beat": "2",                        // must match a beat id in the sequence file
  "control": "none",                  // "none" | "player" | "menu". Asserted against the sequence file
  "seconds": 8,                       // what doc 43 says this beat should take. Optional
  "within": 12,                       // hard ceiling, s. Defaults to seconds + defaults.slack
  "marks": [ /* Mark */ ],
  "input": [ /* Input */ ],           // what the harness does to get out of a player beat
  "unscripted": "why not"             // present => THIS BEAT IS NOT CHECKED, and the run says so
}
```

**`unscripted` is how a beat is left out honestly.** A beat absent from `beats` entirely is a failure — the harness compares the beat list against the sequence file and refuses a script with holes in it. A beat present with an `unscripted` string is skipped, and the run prints *"beat 6 not checked: the case never comes off the roof, so there is nothing to assert"* in its summary. **No silent caps.** A partial script that says which parts are partial is useful; one that quietly covers half the opening reads as covering all of it.

**`within` is asserted for every beat, scripted or not.** A beat that never ends is the one failure mode that costs a CI run rather than reporting one.

**`control` is asserted against `content/sequences/opening.json`.** This is the whole of the structural agreement between the two files, and it catches the drift that matters: a beat whose control changed in doc 17 and whose expectations did not.

## Mark

**A beat is not one state.** Beat 2 runs eight seconds through a placement, a facing, two chores and a walk. A single per-beat snapshot would be sampled at an arbitrary moment inside that and would be worth very little.

So the unit of positive assertion is a **mark**: a stated moment inside a beat, and the full cast state expected at it.

```jsonc
{
  "note": "in the doorway, hand on a rail that is not drawn. Doc 43 beat 2 row 3",
  "when": { "clip": "aboard-coach", "who": "thad" },

  "cast": {                           // EXHAUSTIVE. A mover on screen and not named here fails
    "thad":  { "at": [1170, 794], "facing": "right", "clip": "aboard-coach", "height": 254 },
    "coach": { "at": [1390, 742], "facing": "right", "clip": "idle", "height": 389 }
  },

  "overlays": { "driver": "neutral" },   // by overlay id. null means "not drawn"
  "says": null                            // speaker id of the line on screen, or null for none
}
```

**`note` is REQUIRED and the check refuses a mark without one.** It is not decoration: it is the only thing on the page that helps whoever reads a failure decide whether the game is wrong or the script is. *"measured against the deployed build, 2026-08-03"* and *"guess, nobody has looked"* produce identical behaviour and completely different decisions.

### `when` — exactly one of these

| Form | Fires on the first frame at which… |
|---|---|
| `{ "enter": true }` | this beat is the one playing, and was not on the previous frame |
| `{ "clip": "alight-coach", "who": "thad" }` | that mover's clip becomes that, inside this beat |
| `{ "settled": "thad" }` | that mover stops moving, having moved inside this beat |
| `{ "line": 0 }` | this beat's line 0 is on screen |
| `{ "leave": true }` | the last frame of this beat — sampled on the frame the beat changes |
| `{ "seconds": 2.0 }` | 2.0s after the beat was entered |

**A mark whose `when` never fires is a failure**, reported as *"beat 2 mark 3 never fired: thad's clip never became alight-coach"*. That is not a technicality — it is precisely the shape of the chore-clips-in-the-deferred-half defect, where the clip was asked for, did not resolve, and the beat carried on anyway.

**`{"seconds": N}` is the escape hatch and is discouraged.** It is the only form whose firing depends on frame pacing rather than on something the game did, so it is the only form that can go flaky under CI. Prefer `clip` or `settled`. Use `seconds` for a beat where genuinely nothing happens except time passing.

**`when` may be circular in its own first clause and that is fine.** A mark triggered on `thad`'s clip becoming `alight-coach` and asserting that `thad`'s clip is `alight-coach` asserts nothing by that one field — but it asserts *where he is while it plays*, *which way he faces*, *how tall he is drawn*, *what everyone else is doing*, and *that the moment happened at all*. Those are the four things that were wrong.

### `cast` — exhaustive, by design

**Every mover in the room must be named. A mover present and unnamed is a failure; a mover named and absent is a failure.**

This is the assertion the black figure would have failed. It was Thad, at the coach's own feet Y, drawing behind it — the cast was right and the positions were wrong. It is also the assertion that catches a mover created by something that should not have created one.

Each entry's fields are all optional, but **an empty entry is a failure** — name at least one thing, or the entry claims only presence and should say so with `{"present": true}`.

| Field | Type | Means |
|---|---|---|
| `at` | `[x, y]` | The **feet anchor**, in play-area coordinates (1920 × 864). Never the sprite's top, centre or rectangle |
| `tol` | number | Overrides `defaults.position` for this entry |
| `facing` | `"left"` `"right"` `"front"` `"back"` | |
| `clip` | string | The clip id being drawn. Not the facing, not the frame |
| `height` | number | The **drawn** height in px. Catches a figure at 3× and a coach handed the human depth curve |
| `moving` | boolean | Whether it is walking or gliding right now |
| `present` | `true` | Presence and nothing else. For a mover deliberately not pinned down |

**`height` is the field most worth writing and easiest to skip.** Two of the worst faults so far were size faults that every position assertion would have passed.

### `overlays` — head overlays, by id

Head overlays are not movers: they composite over a body that does not change. Doc 43 part two, draw order step 4.

| Id | States | Over |
|---|---|---|
| `driver` | `neutral` · `speaking` · `looking-down` | the coach, at the coach's scale |
| `thad` | `talking` · `closed` | Thad's own body clip |

**`{"driver": null}` asserts the overlay is not drawn at all**, which is different from `neutral`.

**Do not assert a talk overlay's frame index.** The loop is irregular by design — `0,1,0,2,1` — and talk timing never controls line duration. `talking` versus `closed` is the assertable fact.

### `says` — the line on screen

`null` for no line, or the **speaker id** (`"thad"`, `"stage_driver"`, `"hob"`) for a line by that speaker.

**Never the text.** The words live in doc 17 and are extracted into `content/sequences/opening.json`; a copy of them here would make this file a second home for dialogue, which is how every pair of documents in this project has drifted. The harness asserts the *speaker* and that the line on screen is one of the beat's own lines — which it can check against the content file without either file quoting the other.

## Input — getting out of a player beat

A beat whose `control` is `player` does not end on its own. The gauntlet's terminal condition is the end of beat 10, so the harness must play the driver's tree and Hob's crossing.

```jsonc
"input": [
  { "do": "choose", "option": 1 },      // 1-based, as a player sees them
  { "do": "wait", "seconds": 1.5 },
  { "do": "click", "at": [900, 780] }   // play-area coordinates
]
```

Actions run **after every mark in the beat has fired**, in order. A beat with `control: "player"` and no `input` is a failure at check time, not a hang at run time — with one exception: the beat named by `until`.

**Choosing by index, not by text.** Errata 37 is revoked and the tags survive, so all four of the driver's options are present at the end and three are dimmed; an index is stable under that and a text match would not be.

**Input belongs to a RUN of player beats, not to each of them.** Beats 4, 5 and 6 are one dialogue tree; beats 8, 9 and 10 are one uncarried run. Input on any beat of a run drives that run, and the check requires it once per run — requiring it per beat would be requiring an answer to the question below, which has none.

## WHAT CANNOT BE ATTRIBUTED TO A BEAT

*Three places where the probe reports `beat: null`, honestly, and a mark could not fire. Each is `unscripted` in the script with this as its reason.*

| Beats | Why |
|---|---|
| **4, 5, 6** | Errata 30b makes them one dialogue tree. Which of doc 17's three beats a given option belongs to is not a fact the engine holds — a tree is a graph and the beats are a list, and no mapping between them was ever authored |
| **8** | Nothing is staged. No runner holds it; what changes is `handedOver` |
| **10** | Nothing is staged, deliberately — going west is the player's move to make. There is nothing to observe entering it |

**Which is why `until` names beat 9, not beat 10.** The observable end of the opening is beat 9 completing: Hob has crossed, spoken and gone, and control is the player's. Naming beat 10 would be naming a moment nothing reports.

---

# PART TWO — WHAT THE HARNESS ASSERTS WITHOUT BEING TOLD

*These need no script. They hold from navigation to the end of beat 10, on every frame, for every mover.*

**They are recorded INSIDE the draw loop, not sampled from outside it.** "Never, at any frame" cannot be established by polling at 20 Hz — the black-figure defect lived in the first second and a half and a harness that waits for the game to be ready cannot see it. `engine/dev/Watch.ts` records a violation the moment it occurs and the harness drains the list; what it reports is every frame, not every sampled frame.

| # | Never, at any frame | How it is seen |
|---|---|---|
| 1 | `drawMover` takes its graybox branch | The renderer says which branch it took, by name |
| 2 | A clip is asked for and does not resolve | `frameCount` returned 0 — the record does not cover clip/facing/surface/state |
| 3 | A texture is asked for before it has loaded | `frameCount` was positive and `draw` returned false |
| 4 | Two movers share a feet Y with overlapping x | `\|Δy\| < 1` and their drawn x-extents intersect. Feet Y is the only depth key, so this is the one ordering the sort genuinely leaves undefined |
| 5 | A mover is drawn outside the walkable band | Feet Y outside `band`, for a mover not in `bandExempt` |
| 6 | A walk clip plays on a mover that is not moving | `clip === "walk"` and neither walking nor gliding |

**1, 2 and 3 are three different faults and the harness names which.** They have been conflated before: the coach drawing as a black rectangle was #1 (no record), the chores throwing `CLIP_FALLBACK` was #2, and the chores drawing a placeholder for the whole of beat 2 was #3 — a deferred texture asked for before it arrived. One message saying "graybox" for all three would have cost a session each time.

**#4 has a threshold and it is 1 pixel, not 20.** Near-equal feet Y is not a defect: whoever is lower is nearer, and the sort answers correctly. *Exactly* equal is the coin flip, decided by insertion order, which is a fact about `create()` versus staging and not about the picture.

**A violation carries the beat.** That is what the beat tag was added for: *"beat 2, thad, graybox:not-loaded, frame 91"* is a diagnosis, and *"a graybox was drawn at some point"* is a session.

---

# PART THREE — WHAT THE PROBE REPORTS

*The shape the engine hands out and the harness reads. Written down because two halves that disagree about a field name fail silently.*

```jsonc
{
  "frame": 1234,
  "clock": 12.53,                     // scene seconds
  "beat": "2",                        // SequenceRunner.beat, or null
  "control": "none",
  "movers": {
    "thad": {
      "at": [1170, 794], "facing": "right", "clip": "aboard-coach",
      "height": 254, "moving": false,
      "drawn": "sprite"               // or graybox:no-record | graybox:no-clip | graybox:not-loaded
    }
  },
  "overlays": { "driver": "neutral" },
  "says": "thad",                     // speaker id, or null
  "options": 4,                       // dialogue options on offer, or 0
  "handedOver": false,                // true once the opening has handed over control
  "segment": {                        // the opening segment playing, or null
    "kind": "player",
    "beats": ["4", "5", "6"],
    "carriedBy": "STAGE_DRIVER"
  }
}
```

**`segment` exists because the first version of this harness hung on its own deadline**, and the reason is worth keeping. `beat` is null for the whole of the driver's conversation — no runner holds beats 4, 5 or 6 while the tree is up — so a harness waiting for beat 4 to appear was waiting for something that never happens. It sat at beat 3 for its full 180 seconds and reported a timeout.

The fix is not to guess a beat. The segment says which beats it covers and does **not** claim which of them is playing, and the harness drives a player run's input when its *segment* starts. **Found by running it**, which is the only way it was ever going to be found — the schema, the validator and the engine all agreed with each other and all of them were wrong about the same thing.

**`__game` is stripped from the production bundle** by `import.meta.env.DEV`, and so is the probe. That is not an oversight to work around: the probe reads private engine state and the watch costs work per frame, and neither belongs in what a player runs.

**Which means the state assertions run against the dev server, not the deployed artifact.** Every fault found by playing this project has reproduced on the dev server, so this is not a coverage gap in practice — but it is a real difference and it is stated rather than glossed. What runs against the built artifact is a **screencast smoke pass**: navigate, record from the first frame, assert the canvas is present, the scene starts, no page error is thrown, and the first second is not uniformly one colour. That catches a build that does not boot, which is the class of fault that only the built artifact has.

---

# PART FOUR — HOW IT RUNS

```
npm run gauntlet          # dev server + full script, state assertions on
npm run gauntlet -- --smoke   # built artifact, screencast only
```

On CI, on every push, both. The state run is the one that fails with a beat number.

**A failure names the beat, the mover, and what differed.** The format is fixed:

```
FAIL beat 2 · mark 4 "clear of the door, a step forward" · thad
     at        expected 1180, 754   got 1240, 802   (Δ 60, 48 > tol 24)
     facing    expected right       got right
     clip      expected idle        got walk
     note      guess, nobody has looked
```

The `note` is printed on every failure on purpose. Honesty 3 is only useful if it reaches the person reading the failure at the moment they are deciding whether the game is wrong or the script is.

---

# WHAT THIS DOES NOT COVER TODAY, AND WHY

*The list travels, so nothing here is quietly dropped.*

| # | Not covered | Because |
|---|---|---|
| 1 | Beat 2's `straighten-coat` | The clip does not exist. Doc 17 asks for it; doc 42's prompt was the one skipped |
| 2 | Beat 6, the case leaving the roof | Nothing moves it. There is no mover for the case |
| 3 | Beat 6, the driver climbing aboard | He is a head overlay. There is nowhere for a `climbing` pose to play |
| 4 | The wheels turning | Nothing drives them from distance travelled; they are composited into the body |
| 5 | Q37 — the flag between alighting and the case | There is no flag, so there is nothing to assert |
| 6 | Anything about how the scene reads | Honesty 1. Permanently |

**1 through 5 become checkable the day each is built**, and each is one `unscripted` string removed from `tools/gauntlet/opening.json`. 6 does not.
