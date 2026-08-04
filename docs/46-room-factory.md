# 46 · THE ROOM FACTORY — how Room 3 through Room 42 get built without rebuilding Room 1

> **Status: proposed.** Commissioned by Tyler at the close of Room 1 — "I want things as perfect
> as possible before I tweak and fine tune" — and written against doc 34's stop condition, which
> gates it. Nothing here is built yet. The build order is Part Five, and it starts by *not*
> starting: the dialogue performance loop and doc 34's integrated proof come first.

---

# PART ONE — WHERE ROOM 1'S TIME ACTUALLY WENT

An honest accounting, because it decides what is worth automating.

| Share | What | Recurs? |
|---|---|---|
| ~70% | **Engine.** Movement, gait, sequences, dialogue runner, verbs, saves, music, the map, the title, approach radii, body ownership, the renderer | **No.** Room 2 inherits all of it free |
| ~15% | **Pipeline invention.** The palette war, keying, despilling, the casting-sheet method, the rig, the plate rules | **No.** Errata 54 and doc 38 are the residue |
| ~15% | **The room itself.** Content wiring, staging, geometry, and the iteration loop with Tyler | **Yes — and only this** |

So the factory's job is the last 15%, and the honest target is not "no input from Tyler" but
**a different kind of input**: from debugging collaborator — who plays, finds the freeze, reports
it, waits, plays again — to **editor**, who receives a complete, validated, screenshotted room
and spends his time on taste.

**What cannot be automated, named up front so this document does not overpromise:**

- **Art quality.** ChatGPT generates; Tyler's eye judges. No check measures whether a plate is good.
- **Comedy timing.** The mud beat's pauses were tuned by watching. 0.7s and 1.1s are rulings, not derivations.
- **Placement judgement.** "Which façade is the barber's" is a decision. The factory can *propose*
  from the script, as the map markers were proposed, but proposals are inferences and marked so.
- **The writing itself.** Doc 05 Part Four is right that generated volume-writing degrades fastest.
  The lines exist because a person wrote them; the factory only *carries* them.

---

# PART TWO — THE THREE BUILDS

## 1 · The room compiler (`tools/compile-room.mjs`) — highest value, because the writing already exists

**The finding that makes this cheap:** doc 05 is already structured. Every scripted room is:

```
## ROOM 2 — MAIN STREET *(hub)*
*The most-visited screen in the game. Nine hotspots. Lines must survive two hundred selections.*

**THE FALSE FRONTS**
> **LOOK:** "Every building on this street is two storeys tall in front and one storey deep. ..."
> **LISTEN:** "Wind. There is a great deal of nothing behind these."

**THE COACH** *(before it departs)*
> **LOOK:** "It is leaving. ..."
```

Bold name → hotspot id and display name. Italic annotation → state gate. Quoted pairs → LOOK_AT /
LISTEN_TO responses. That is 80% of a room's content file, sitting in a document, parseable today.
Doc 20's graph supplies every exit and its destination. Doc 04 supplies the dialogue trees in a
similarly regular shape.

**The compiler is `extract-content.mjs` generalised.** The opening's extractor is bespoke to doc
17; the compiler is the same idea with the room number as a parameter. It reads doc 05's room
section, doc 20's row for that room, and the room's dialogue from doc 04, and emits
`content/rooms/<room>.json` plus `content/dialogue/*.json` — complete except for the geometry
that only the annotator (build 2) can supply.

**The three rules that made the opening extractor trustworthy are the constitution:**

1. **The words stay in the docs.** The compiler carries them; it never contains them. The mud
   beat's generator refused lines written into the staging table, in those words — that refusal
   is why doc 17 and the shipped opening cannot drift, and it is the single discipline that
   survived every failure this week.
2. **Refuse loudly, never guess.** A hotspot with no LISTEN line, a state annotation naming no
   known flag, an exit absent from doc 20's graph: each is a build failure with the room and the
   name in it. The alternative — inferring — is how the four-days line shipped wrong.
3. **Generated files say so at the top**, and `check-generated` (already on CC's queue) catches
   hand-edits by commit inspection. Both reverts this week were Claude editing generated output.

**What the compiler emits for gaps, it emits as STUBS THAT FAIL LOUDLY:** a hotspot with no rect
gets `rect: null` and the room fails validation until the annotator supplies one — visible in
the report by name, not silently absent.

## 2 · The room annotator (`tools/annotate/room.html`) — Tyler's fifteen minutes, batched

Some inputs are irreducibly Tyler's, because they are readings of the plate: the walk box, the
depth samples (near/far heights), hotspot rects, exit rects, actor spawn points, `walkTo`
overrides. Room 1 produced these by Claude inferring and Tyler correcting, over days.

**The pattern that already beat inference twice:** the beat-11 tracer produced a path Tyler was
happy with on the first attempt; the marker placer replaced fifteen wrong inferences in fifteen
clicks. Both work the same way — the actual plate on screen, click, export coordinates in the
plate's own space.

The annotator is those two tools grown up and combined: load the plate, and in one sitting draw
the walk box, drop the two depth samples, drag a rect for each hotspot the compiler found in doc
05 (it knows the list — the annotator presents it as a checklist, exactly as the marker placer
presented the locations), mark the exits, place the spawn. Export one JSON. The compiler folds it
in. **Days of inference-and-correction become minutes of authority.**

Published with the site like the existing tools, so it opens on the Chromebook.

## 3 · The room gauntlet (`tools/gauntlet/room.mjs`) — replacing "Tyler plays it and finds the problem"

**The week's most consistent finding:** every serious defect passed all 38 validators and was
found by *looking*. The stacked map labels. The frozen wheels. The freeze after the first mud
line. The profile staging that read wrong in the game. The exit that said "Walk to" and nothing
else. No validator can judge these — they are questions about what a frame *looks like*.

But a machine can *produce the looking* in one batch. Per room, headless (the Chromium launcher
is already shared in `tools/lib/chromium.mjs`):

- enter the room; screenshot
- hover every hotspot; capture the sentence line each time
- run every verb against every target; capture each response and each response's *absence*
- walk to each exit; capture the departure frame
- open every dialogue tree; click every option once; capture each exchange
- for each state-gated pair (ruling 19a's shape), set the flag and re-shoot both halves
- assemble a **contact sheet**: one page of captioned screenshots per room

Tyler reviews a page over coffee. The freeze this week cost a deploy, a play-through, a report,
a diagnosis, and a second deploy; the contact sheet finds the same freeze in the build, before
anyone plays anything, because the run *hangs on the broken beat* and says which step.

CC's gauntlet skeleton (doc 44) is the seed; this is that skeleton fed by the compiler's output
so it knows what to click without being told.

---

# PART THREE — THE TWO DISCIPLINES THAT ARE ALREADY PAYING

**Every bug becomes a check, at the layer that could have caught it.** Tonight's chore-clip check
is the model: the freeze was a one-word field error, invisible to 38 validators and 144 tests,
and the check that now catches it was proved by *reintroducing the bug* — both halves, the
missing field and the undrawn clip, each failing by name. The facing half was added the same
night when the back-only strain made facing part of the contract. A factory without this
discipline mass-produces the same defect into forty rooms; with it, each room is safer to build
than the last.

**Measure before ruling; render before judging.** The strain went sink → profile → rock because
a render at drawn size beat reasoning, three times in one evening. The four acceptance metrics
Claude invented and got wrong went the other way for the same reason. The factory inherits this
as: **the gauntlet's contact sheet is part of the definition of "built."** A room without its
sheet is not done, whatever the validators say.

---

# PART FOUR — WHAT A ROOM BUILD LOOKS LIKE AFTERWARD

| Step | Who | Time |
|---|---|---|
| 1. Room brief gate (doc 35) — is the room specified? | Claude checks, Tyler rules on gaps | minutes |
| 2. Plate + casting prompts from docs 37/39 method | Claude writes, ChatGPT generates, Tyler picks | the art loop, unchanged |
| 3. Compile: doc 05 + doc 20 + doc 04 → content | `compile-room.mjs` | seconds |
| 4. Annotate: walk box, depths, rects, spawn | **Tyler, in the annotator** | ~15 minutes |
| 5. Rig any room-specific movers by doc 38's method | Claude | as needed |
| 6. Validators + tests | `run-all` | minutes |
| 7. Gauntlet → contact sheet | machine | minutes |
| 8. **Review the sheet; tune what taste demands** | **Tyler** | coffee |

Tyler appears twice with a tool and once with coffee. Everything else is the machine following
documents that already exist — which was the request: *"follow a detailed script to build all
the beats, movement, insert dialogue... as perfect as possible before I tweak and fine tune."*

Rooms with bespoke systems — the Assay duels, the Act IV set pieces — will always need real
engineering on top. The factory gets the *room* out of the way so that work starts from a
standing room instead of from nothing.

---

# PART FIVE — BUILD ORDER, AND WHY IT STARTS BY WAITING

**Doc 34's stop condition gates this document.** Integrated proof, the canonical street loop,
save/load/title executable — not yet met, and a room factory is precisely the kind of global
design ruling doc 34 exists to gate. Errata 52 made doc 34 binding. So:

1. **CC lands the dialogue performance loop** (doc 30 §1–7, in flight). The factory compiles
   dialogue; compiling it into a presentation that is about to change shape is waste.
2. **Doc 34's stop condition is satisfied on the street loop.** Room 2 is the hub and is next
   regardless of anything in this document.
3. **The compiler is built against Room 2 while Room 2 is built by hand** — every place the
   hand-build makes a decision the compiler cannot, that is a schema gap found on the proving
   room instead of on room 30. Doc 05 calls Room 2's lines the ones that must survive two
   hundred selections; they can also survive being the test corpus.
4. **The annotator absorbs the tracer and placer patterns** once the compiler knows what it
   needs from it. Tool before schema is backwards.
5. **The gauntlet grows from CC's skeleton** as the checks it needs (frame-measuring 1–3) land.
6. **Rooms 3+ go through Part Four's table.** The first one that does is the factory's real
   acceptance test.

One more constraint, standing: **act variation (Q5) needs a gating field in the compiled
output, not duplicated hotspot ids.** The compiler's schema should carry it from the start —
doc 05 already annotates states in italics, and ruling 19a's paired-gate shape is what they
compile to. Retrofitting act awareness into forty compiled rooms is the expensive version.

---

# APPENDIX — THE COMPILER'S CONTRACT, DRAFTED AGAINST DOC 05 AS IT IS WRITTEN

Input: the room's section of doc 05, verbatim, e.g.:

```
**THE COACH** *(before it departs)*
> **LOOK:** "It is leaving. It has the confident manner of a thing that will not be coming back."
> **LISTEN:** "The near axle is dry. It will be heard from."
```

Output (abridged):

```json
{
  "id": "coach",
  "name": "THE COACH",
  "rect": null,
  "rectNote": "ANNOTATOR: unset. The room fails validation until the annotator supplies this.",
  "when": { "T_COACH_DEPARTED": false },
  "whenNote": "From doc 05's annotation '(before it departs)', resolved against the flag registry. An annotation that resolves to no known flag is a build failure, not a guess.",
  "responses": {
    "LOOK_AT": [{ "say": "It is leaving. It has the confident manner of a thing that will not be coming back." }],
    "LISTEN_TO": [{ "say": "The near axle is dry. It will be heard from." }]
  }
}
```

The annotation-to-flag table starts small and honest: the compiler ships with the mappings the
scripted twelve rooms need, refuses anything outside them, and grows by being refused. That is
how the opening extractor became trustworthy, and it is the only way a compiler earns the right
to run unattended.
