> **Provenance.** Produced by ChatGPT from public historical and technical sources on SCUMM, at Tyler's direction, 31 July 2026. Pushed to `/docs` substantially as received rather than paraphrased — it is a better technical specification of the SCUMM room model than the project had, and rewriting it would only add a layer.
>
> **Status: binding, with three exceptions ruled in errata 27.** Where this document and the errata disagree, the errata wins — but only on the three points it names.

---

# The Last Claim in Consolation
## Monkey Island Construction Deep Dive for Claude

### Purpose

This document supplements the earlier VGHF-based Monkey Island design dossier with a deeper study of:

- the SCUMM room and scripting model;
- walk boxes, path routing, perspective scaling, and clipping;
- objects, object states, verbs, staging points, and facing;
- actor costumes and asynchronous choreography;
- the original interface and interaction contract;
- room prototyping and art-production practice;
- pixel-art color, dithering, and palette cycling;
- dialogue, puzzle, and comedy production;
- adaptive music;
- specific corrections and implementation requirements for *The Last Claim in Consolation*.

The objective is to reproduce the *functional design grammar* and aesthetic discipline of the early Monkey Island games while retaining wholly original fiction, characters, puzzles, writing, setting, and artwork.

This is a synthesis of public historical and technical sources. It does not reproduce game code or proprietary assets.

---

# 1. Executive finding

The most important discovery is that Monkey Island’s visual depth, comic timing, and interaction clarity were not separate achievements. They emerged from one integrated room model.

In SCUMM, a room could contain:

- a background bitmap and room palette;
- walk boxes;
- a precomputed box-to-box routing table;
- perspective scaling information;
- per-box clipping depth;
- one or more foreground occlusion masks;
- interactive objects with visual states;
- a walk-to point and required facing for each object;
- verb-specific scripts;
- entrance, exit, and room-local scripts;
- palette-cycle definitions;
- actors running independent scripts concurrently.

The practical lesson is decisive:

> A Monkey Island-like room is not a painting with clickable rectangles. It is an authored theatrical machine in which geometry, blocking, depth, interaction, animation, and scripting share the same spatial data.

*The Last Claim in Consolation* currently treats too many of those as separate future features. They need to become one coherent room runtime before additional finished backgrounds are produced.

---

# 2. Historically verified SCUMM room anatomy

Technical reconstruction of SCUMM v5 identifies the room as the unit containing or associating:

```text
ROOM
├── geometry
│   ├── walk-box quadrilaterals
│   ├── box adjacency / next-hop routing
│   └── per-box or per-Y actor scale
├── appearance
│   ├── room palette
│   ├── background bitmap
│   ├── foreground occlusion masks
│   └── palette-cycle ranges
├── objects
│   ├── image states
│   ├── interaction bounds
│   ├── walk-to point
│   ├── facing direction
│   ├── name
│   └── verb scripts
└── code
    ├── enter-room script
    ├── exit-room script
    └── room-local scripts
```

Sources:

- [SCUMM v5 ROOM block technical reconstruction](https://grogvm.dev/docs/scumm/room/)
- [Aric Wilmunder’s SCUMM development account](https://www.gamedeveloper.com/design/the-scumm-diary-stories-behind-one-of-the-greatest-game-engines-ever-made)

## Why this matters for The Last Claim

The present repository has:

- background;
- hotspot rectangle;
- walkable rectangle;
- one of three depth-zone sizes;
- exits;
- JSON response rules;
- ambient character placements;
- palette cycling.

It does **not** yet have a unified representation for:

- polygonal walk geometry;
- walk-box adjacency;
- path routing;
- per-box clip plane;
- occlusion masks;
- object walk-to points;
- object-facing requirements;
- entrance coordinates and facing;
- actor-to-actor depth sorting;
- interactive visual object states;
- room-local enter/exit scripts;
- generic asynchronous choreography.

Those are not polish. They are the missing connective tissue.

---

# 3. Walk boxes: more than “where the player may stand”

SCUMM walk boxes were convex quadrilaterals fitted to the perspective of the room artwork. Their data also carried:

- connection/routing information;
- a clip-plane mask level;
- actor scale, either fixed or referencing a room scaling slot.

The paired box matrix functioned as a next-hop routing table: given a start box and destination box, it identified the next box the actor should enter. This made authored routing stable and inexpensive.

Source: [SCUMM v5 walk-box reconstruction](https://grogvm.dev/docs/scumm/walk-boxes/)

## What this explains visually

Walk boxes made several aesthetic effects reliable:

- characters followed the painted street or floor rather than moving through arbitrary rectangles;
- actors could turn corners around counters, tables, posts, and walls;
- size changed consistently with depth;
- the same spatial zone determined which foreground geometry masked the actor;
- an artist could use diagonal lanes, narrow paths, stairs, and trapezoidal floors without needing general-purpose simulation.

## Required change

Replace or extend `WalkableRegion.rect` with a real authored walk-box model:

```ts
type WalkBox = {
  id: string;
  points: [
    { x: number; y: number },
    { x: number; y: number },
    { x: number; y: number },
    { x: number; y: number }
  ];
  neighbours: string[];
  clipPlane: number;
  scaleMode:
    | { kind: "fixed"; height: number }
    | { kind: "curve"; nearY: number; nearHeight: number; farY: number; farHeight: number }
    | { kind: "drawnSizes"; thresholds: { y: number; spriteSet: string }[] };
  enabledWhen?: Condition;
};
```

The engine should:

1. Snap a clicked destination to the nearest valid point in a walk box.
2. Resolve the start and destination boxes.
3. Route across box adjacency.
4. Walk through portal points shared by successive boxes.
5. Maintain the actor’s current box during movement.
6. Derive actor scale and clip plane from that box.

## Consolation-specific application

Main Street should not be four full-width horizontal rectangles. It should use trapezoidal and shaped boxes that:

- distinguish boardwalk from mud;
- route around the water trough;
- create credible approach lanes to each storefront;
- establish door staging positions;
- hide size changes near boardwalk/mud boundaries or vertical foreground elements;
- allow foreground posts, railings, carts, signs, and people to create depth.

---

# 4. Scaling: a correction to the current design documents

The Consolation errata calls three discrete drawn sizes “SCUMM-style depth scaling.” That is only partially accurate.

SCUMM room data supported scaling as a function of position. Walk boxes could use fixed scale values or reference room scale slots, and actor-rendering code had specialized scaled variants. This means classic SCUMM could scale an actor through room depth rather than only snapping among three authored sizes.

Sources:

- [SCUMM room scaling data](https://grogvm.dev/docs/scumm/room/)
- [Walk-box scale fields](https://grogvm.dev/docs/scumm/walk-boxes/)
- [Wilmunder on specialized actor-rendering paths](https://www.gamedeveloper.com/design/the-scumm-diary-stories-behind-one-of-the-greatest-game-engines-ever-made)

## Recommendation

Do not blindly abandon the three hand-drawn Thad sizes. They protect deliberate pixel clusters.

Instead:

- acknowledge that stepped scaling is a Consolation-specific aesthetic compromise, not historical replication;
- add more depth thresholds where popping is visible;
- place thresholds at occlusions, surface breaks, doorways, stairs, or other visual interruptions;
- test the snap while walking, not only in still comparisons;
- consider authored intermediate sizes for hub rooms;
- keep the actor’s feet locked to the ground point throughout a size transition;
- never change size and facing on the same frame unless deliberately hidden.

The actual acceptance criterion is not “three sizes exist.” It is:

> A player should perceive depth, not a sprite changing size.

---

# 5. Z-planes: the exact depth model

SCUMM foreground planes were 1-bit masks. They determined which actor pixels should be hidden behind room geometry.

Important technical details:

- a room could have multiple planes;
- an actor carried one clip level;
- that actor was masked by its assigned plane, not by a simple cumulative union of every plane;
- an actor’s default clip level could come from its current walk box;
- actor-to-actor depth was handled by back-to-front Y ordering;
- objects could carry their own z-plane masks;
- moving or changing an object could therefore change both its visible image and how it occluded actors.

Source: [SCUMM v5 z-plane reconstruction](https://grogvm.dev/docs/scumm/zplane/)

## Correction to the current repository

`docs/21-dossier-audit.md` classifies z-planes as “confirmed — already in place.”

They are not implemented in the runtime:

- `RoomFile` has no occlusion-mask field;
- walkable regions carry a scale zone but no clip plane;
- the renderer draws the room, then every person;
- no foreground mask is drawn over actors;
- actor-to-actor rendering is not Y-sorted;
- object state cannot replace a foreground mask.

The documentation has a foreground-plane ruling, but the player cannot experience it.

## Required room representation

```ts
type OcclusionPlane = {
  id: string;
  image: string;       // 1-bit or alpha mask at native room resolution
};

type WalkBox = {
  // ...
  clipPlane: number;   // 0 = always in front
};
```

Required compositor order:

1. Draw room background.
2. Draw behind-room ambient actors.
3. Sort actors and depth-aware object sprites by feet-Y.
4. Draw each actor through the mask associated with its current clip plane.
5. Apply stateful object masks at the object’s runtime position.
6. Draw always-front overlays and UI.

## Consolation-specific uses

High-value occluders include:

- Main Street boardwalk posts and railings;
- the water trough;
- signs and hanging awnings;
- saloon tables, chairs, and patrons;
- the assay-office counter;
- shelves or cabinets passed behind;
- mine timbers;
- grave markers;
- the coffin lip;
- door frames during entrance choreography.

These should not all be decorative foreground PNGs. Their depth behavior should be authored.

---

# 6. Objects: the biggest missing SCUMM concept

In SCUMM, an object was not merely a hotspot. Its object-code and image data could include:

- identifier and display name;
- screen position and bounds;
- walk-to position;
- facing direction;
- a table mapping verbs to scripts;
- visual image states;
- ownership: room or actor/inventory;
- runtime state;
- class flags controlling behavior and hit testing;
- per-state occlusion masks.

Source: [SCUMM v5 room objects](https://grogvm.dev/docs/scumm/objects/)

## Why Monkey Island interactions feel staged

When the player chose an action, the object already knew where the actor should stand and which way they should face. The action could therefore become:

```text
resolve object
→ walk to object’s staging point
→ wait until actor arrives
→ turn to required facing
→ wait until facing completes
→ play chore
→ run verb script
→ change object state / ownership
→ deliver response
```

This is far more coherent than executing a line immediately wherever the player happens to stand.

## Required Consolation object model

```ts
type RoomObject = {
  id: string;
  name: string;
  hitShape: Rect | Polygon;
  walkTo?: { x: number; y: number; facing: Facing };
  defaultVerb?: VerbId;
  owner: { kind: "room"; roomId: string } | { kind: "actor"; actorId: string };
  state: string;
  states?: Record<string, {
    image?: string;
    bounds?: Rect;
    occlusionMasks?: Record<number, string>;
  }>;
  classes?: string[];
  responses?: Record<VerbId, InteractionRule[]>;
};
```

## Replace duplicate-hotspot state modeling where appropriate

The current project often represents one changing entity as multiple overlapping hotspots with opposite conditions—for example, the coach versus the road after the coach departs.

That is useful when the entity’s semantic identity truly changes. But a general object-state system is still needed for:

- open/closed doors;
- taken/not-taken items;
- full/empty containers;
- broken/repaired machinery;
- posted/removed notices;
- lit/unlit lamps;
- changed desk or shelf contents;
- puzzle assemblies;
- foreground geometry that changes with the state.

Do not force every visible state into separate overlapping semantic records.

---

# 7. SCUMM choreography: scripts that sleep and wait

Aric Wilmunder identifies SCUMM’s multitasking model as one of its most distinctive characteristics. Multiple scripts could effectively run at once. A script could:

- sleep for a duration;
- wait for an actor to finish walking;
- wait for an actor to face a direction;
- resume linearly from that point.

This let a designer author performances in an intuitive order without blocking unrelated room activity.

Source: [The SCUMM Diary](https://www.gamedeveloper.com/design/the-scumm-diary-stories-behind-one-of-the-greatest-game-engines-ever-made)

## Why this matters

Monkey Island scenes contain many tiny coordinated beats:

- actor walks while an ambient loop continues;
- an NPC turns before speaking;
- a prop changes state between two lines;
- the protagonist pauses before reacting;
- two actors trade positions;
- music or a sound cue enters at an exact point;
- the interface temporarily yields to a cutscene;
- a room script continues independently.

A generic callback chain or one-off timer per scene becomes brittle very quickly.

## Required Consolation sequence system

```ts
type SequenceStep =
  | { kind: "walk"; actor: string; x: number; y: number }
  | { kind: "face"; actor: string; facing: Facing }
  | { kind: "chore"; actor: string; chore: string }
  | { kind: "say"; actor?: string; line: string }
  | { kind: "wait"; milliseconds: number }
  | { kind: "waitForActor"; actor: string }
  | { kind: "sound"; cue: string }
  | { kind: "musicTransition"; cue: string }
  | { kind: "setObjectState"; object: string; state: string }
  | { kind: "setFlag"; flag: string; value: FlagValue }
  | { kind: "parallel"; tracks: SequenceStep[][] }
  | { kind: "camera"; target: string; mode: string };
```

The runner should support:

- pausing and resuming;
- independent room-local processes;
- deterministic cancellation on room exit;
- cutscene skip that applies final required state;
- save/load at explicitly supported sequence boundaries;
- test hooks that can advance time deterministically.

## Immediate use

Build this before:

- the 90-second opening;
- the funeral;
- the public duel;
- the coffin sequence;
- the final Listening resolution.

It should also power ordinary object staging, not only cutscenes.

---

# 8. The original interface contract

The original manual specifies several interaction behaviors that are easy to overlook:

- the animation window, sentence line, verbs, and inventory form a single interface;
- sentences combine a verb with one or two nouns;
- connecting words such as “with” or “on” are inserted automatically;
- `Walk to` is the default because movement is the most frequent action;
- hovering a named object exposes its name on the sentence line;
- unnamed scenery is reliably non-interactive;
- an appropriate verb can auto-highlight over a useful object;
- the secondary mouse button performs that default action;
- the highlighted action is not necessarily the object’s only useful verb;
- one click is used consistently; the manual explicitly says double-clicking is unnecessary;
- inventory capacity is effectively unlimited and scrolls;
- dialogue choices cannot punish the player for choosing the funny option;
- cutscenes can be skipped;
- message speed is adjustable.

Source: [The Secret of Monkey Island original manual](https://mocagh.org/lucasfilm/mi-manual.pdf)

## Important difference in the current game

The current README says:

> “Double-click the same hotspot to walk.”

The original Monkey Island interaction contract emphasized consistent single clicks and a secondary-button default action. Double-click recognition introduces timing ambiguity into a verb interface.

## Recommended Consolation controls

Preserve the full nine-verb panel, but implement:

### Left click

- With `WALK TO` active: walk to clicked floor or object staging point.
- With another verb active: build/execute the selected sentence.

### Right click

- Execute the hovered object’s authored default verb.
- For bare floor: `WALK TO`.
- Never reveal a puzzle-specific solution verb merely because it is correct.

### Hover

- Populate the sentence line with the object’s visible name.
- Optionally brighten the default verb text without altering the world art.

### Inventory

- Text label or icon plus accessible name;
- unlimited logical capacity with scrolling;
- every item supports LOOK and LISTEN;
- item-to-object and item-to-item sentences remain visible before execution.

### Accessibility

- adjustable text dwell speed;
- click/keypress to advance speech;
- skippable previously seen cutscenes;
- configurable palette cycling;
- do not add a conventional hint system if that remains a binding creative decision.

---

# 9. Room entry, exit, and local scripts

SCUMM rooms carried explicit enter and exit scripts plus room-local scripts. This matters because entering a room is more than changing a background.

Possible room-enter responsibilities:

- choose actor entrance position;
- choose facing;
- set camera;
- start ambient processes;
- restore object state;
- play a transition;
- initiate a one-time scene;
- select music state;
- determine which actors are present.

Possible room-exit responsibilities:

- stop local processes;
- park or preserve actors;
- apply continuity state;
- record the exit used;
- trigger a transition;
- release room-local resources.

## Required Consolation representation

```ts
type Entrance = {
  id: string;
  x: number;
  y: number;
  facing: Facing;
  from?: string[];
  sequence?: SequenceStep[];
};

type Exit = {
  id: string;
  destinationRoom: string;
  destinationEntrance: string;
  walkTo: { x: number; y: number; facing: Facing };
  transition?: string;
};
```

The player must emerge from the correct destination door or path. The current behavior—placing Thad at the center of the last walkable rectangle—is not acceptable beyond an engine placeholder.

---

# 10. Actors and costumes

SCUMM’s BYLE tool supported animation cycles and directional facing. Costumes were reusable animation programs rather than a folder of unrelated GIFs.

Source: [Wilmunder on BYLE and costumes](https://www.gamedeveloper.com/design/the-scumm-diary-stories-behind-one-of-the-greatest-game-engines-ever-made)

## Required actor state

```ts
type ActorState = {
  room: string;
  x: number;
  y: number;
  currentWalkBox: string;
  facing: "left" | "right" | "front" | "back";
  costume: string;
  chore: string;
  frame: number;
  scaleSet: string;
  clipPlane: number;
  visible: boolean;
  target?: WalkTarget;
};
```

## Minimum Thad chores

- idle in four directions;
- walk in four directions;
- turn without translating;
- neutral talk left/right/front-ish;
- reach low;
- use at waist height;
- use overhead;
- give;
- take;
- tuning-fork-specific performance;
- small eye/head glance;
- restrained double take;
- one discomfort/recoil;
- one held listening pose;
- scripted arrival and departure poses.

## Animation timing principle

Animate for performance, not smoothness:

- holds are meaningful;
- asymmetric timing is often funnier;
- eye movement can replace a full head turn;
- a reaction may begin after a deliberate pause;
- the last frame of a chore must settle cleanly into a directional idle;
- footfalls must line up with movement distance;
- character scale and room lighting must match the background enough that the actor belongs in the set.

---

# 11. Actor and object drawing order

SCUMM separated:

- actor-versus-room depth, handled by clip masks;
- actor-versus-actor depth, handled largely by feet-Y paint order.

Source: [Z-plane compositor semantics](https://grogvm.dev/docs/scumm/zplane/)

## Required Consolation renderer

At minimum:

```text
background
stateful rear objects
far ambient actors
Y-sorted actors and depth-aware objects
per-actor clip masking
always-front objects / overlays
speech
sentence line
verbs and inventory
menus
```

Ambient actors must not always draw before Thad. If an NPC’s feet are below Thad’s, that NPC should normally appear in front unless explicitly forced.

---

# 12. Multitasking and ambient life

SCUMM’s concurrent scripts made simple autonomous details cheap: a clock could tick in its own loop while dialogue, walking, and other scripts proceeded.

This suggests a better model than a single global room-update switch.

## Consolation ambient processes

Each ambient process should be small, independent, and suspendable:

```ts
type AmbientProcess = {
  id: string;
  room: string;
  conditions?: Condition;
  track: SequenceStep[];
  loop: boolean;
  randomDelay?: [number, number];
};
```

Examples:

- dog changes sleeping pose occasionally;
- sign creaks after irregular pauses;
- pie woman adjusts her tray;
- letter writer pauses, thinks, resumes;
- lamp cycles independently;
- distant worker crosses a doorway and resolves somewhere coherent;
- saloon patron raises and lowers a cup;
- fiddler idles in time with the musical bar grid.

Do not make every character move continuously. Stillness plus infrequent purposeful motion is closer to the source aesthetic and better for comic attention.

---

# 13. Dirty rendering and why it still matters

The original engine rendered into a memory buffer and tracked “dirty rectangles,” copying only changed areas to the display. Graphics, controls, and audio were modularized for multiple target machines.

Source: [The SCUMM Diary](https://www.gamedeveloper.com/design/the-scumm-diary-stories-behind-one-of-the-greatest-game-engines-ever-made)

The current Consolation engine already uses a conceptually related optimization: redraw the native canvas only when something changes. That is a sound choice.

## Preserve this property

Do not replace it with indiscriminate React/DOM re-rendering or a heavy scene graph.

But ensure dirty detection includes:

- actor frame changes;
- actor position;
- actor size/clip changes;
- object image state;
- object position;
- palette-cycle mapping;
- room-local ambient frames;
- speech;
- hover/sentence state;
- inventory scrolling;
- music-independent visual sequences.

Testing should include a room that is visually still for extended periods and a crowded room with several independent processes.

---

# 14. Prototype with crude rooms and borrowed actors

Historical SCUMM production used:

- many quickly drawn room sketches;
- preliminary walk boxes;
- actors borrowed from prior games;
- early wiring of large parts of the game;
- later conversion of successful sketches into final backgrounds and animation.

Rooms could be flipped or redrawn after discovering that their connections did not work. Placeholder content made those decisions inexpensive.

Source: [Wilmunder on rapid prototyping](https://www.gamedeveloper.com/design/the-scumm-diary-stories-behind-one-of-the-greatest-game-engines-ever-made)

Ron Gilbert later described a similar process for *Thimbleweed Park*:

1. quick wireframe room;
2. leave it playable for an extended period;
3. adjust dimensions and composition;
4. black-and-white tight layout;
5. final color and light;
6. whole-game polish pass only after rooms exist.

Source: [Thimbleweed Park room-production example](https://blog.thimbleweedpark.com/quickiepal.html)

## Binding production gate for The Last Claim

No additional final room should be accepted until it has passed:

1. room adjacency review;
2. wireframe/background block-in;
3. walk-box routing;
4. entrance/exit staging;
5. Thad traversal at all depths;
6. hotspot reach testing;
7. occlusion-mask test;
8. conversation staging;
9. required puzzle interaction test;
10. grayscale/value review.

Only then:

11. material identity;
12. palette script;
13. final pixel detail;
14. palette cycling;
15. ambient population;
16. final polish.

This directly addresses the repeated Consolation failure mode of discovering staging problems after finishing rooms.

---

# 15. Pixel art: dithering as color design, not texture

Mark Ferrari describes working with a fixed set of sixteen harsh system colors. He used checkerboard dithering to create perceptually mixed colors. On the CRTs of the period, adjacent pixels visually blended into an apparent third color. The technique initially conflicted with compression until the toolchain was improved; it later became part of the studio’s visual language.

Source: [Mark Ferrari interview](https://www.cgmagonline.com/articles/an-interview-with-pixel-artist-extraordinaire-mark-ferrari/)

## Implications for Consolation

The current 256-color locked palette and procedural dithering are technically controlled, but they risk treating dithering as a uniform surface effect.

Dithering should do one of four jobs:

1. create an apparent intermediate color;
2. transition between light levels;
3. distinguish a material;
4. create atmospheric depth.

It should not be applied merely to make a flat fill look “retro.”

## Required art checks

- View every room at native scale, not only 4× or 8×.
- View it on the Chromebook display used for review.
- Confirm that dither clusters merge perceptually rather than reading as noise.
- Compare a clean large-shape version with the dithered version.
- Measure whether character edges disappear into patterned backgrounds.
- Reduce dither frequency around faces, hands, object silhouettes, and interaction boundaries.
- Preserve calm negative areas; not every wall, sky, or mud patch requires high-frequency pattern.

## Aesthetic recommendation

Main Street currently has consistent component detail but insufficient hierarchy. Use larger quiet masses, fewer equally weighted façade details, and stronger selective diagonals. Pixel density should increase near focal landmarks and decrease in passive scenery.

---

# 16. Room palettes versus one global palette

SCUMM v5 room resources could carry a room palette and local palette cycles. Monkey Island’s visuals therefore did not have to distribute all available colors evenly across every location.

Source: [SCUMM ROOM appearance data](https://grogvm.dev/docs/scumm/room/)

The Consolation palette is globally locked at 256 colors. That provides continuity and deterministic tooling, so changing to arbitrary per-room palettes would introduce risk.

## Recommended compromise

Keep the global master palette, but give each room:

- an allowed subset;
- target proportions;
- reserved accent indices;
- local cycle bands;
- UI colors that remain protected;
- actor colors that may not be remapped;
- an explicit exception record for deliberate near-monochrome rooms.

Example:

```yaml
paletteScript:
  dominant:
    families: [pine_weathered, mud_dark]
    target: [0.55, 0.70]
  structuralShadow:
    families: [ink_neutral]
    target: [0.15, 0.25]
  secondary:
    families: [sage_dull]
    target: [0.08, 0.15]
  narrativeAccent:
    families: [accent_gold]
    target: [0.03, 0.07]
  reserved:
    - ui
    - thad_skin
    - thad_shirt
```

Add a report comparing actual pixel distribution with the script. Warn rather than fail when an authored exception is documented.

---

# 17. Palette cycling

Palette cycling was stored as room-level data in SCUMM. Because the bitmap’s pixel indices stay still while the palette entries change, substantial apparent motion can be achieved without replacing image frames.

Sources:

- [SCUMM ROOM palette cycles](https://grogvm.dev/docs/scumm/room/)
- [Mark Ferrari on color-cycling expertise](https://www.cgmagonline.com/articles/an-interview-with-pixel-artist-extraordinaire-mark-ferrari/)

The Consolation engine’s current cycle implementation is directionally excellent.

## Extend it carefully

Support:

- phase offsets;
- rotation;
- ping-pong;
- pulsing;
- rate automation;
- scripted enable/disable;
- deterministic time in tests;
- exact reserved bounds validation.

Do not use cycling for:

- facial animation;
- puzzle hints;
- broad continuous sparkle;
- every light source;
- motion that requires silhouette displacement.

Keep the existing ending exception in which visual motion resolves with the score.

---

# 18. The writing was programmed in place

Dave Grossman describes ordinary work on Monkey Island as both:

- programming Guybrush to move from point A to point B;
- inventing several funny things for him to say when he arrived.

Puzzle thinking, staging, coding, and dialogue writing were intertwined rather than thrown over a wall.

Source: [Dave Grossman interview](https://legendofmi.com/interviews/dave-grossman-talks-monkey-island-17)

## Implication

The current Consolation rule—no written content in TypeScript—is excellent. But “content outside code” must not become “writers never see the running interaction.”

Every writing batch needs an in-game performance pass:

- Does the line fit the walk and pause before it?
- Does it remain funny after waiting for Thad to cross the room?
- Is it too long over a visually busy background?
- Does it repeat too often?
- Should the response happen before, during, or after the chore?
- Does the selected verb create comic anticipation on the sentence line?
- Does a line describe something the art does not show?

The unit of review is the performed interaction, not the JSON sentence.

---

# 19. Comedy voices were assigned, not averaged

Historical accounts describe different writers contributing different comic sensibilities. Gilbert directed those strengths toward appropriate characters or moments rather than flattening everything into one voice.

The transferable lesson is not “use several AI writers.” Consolation correctly prohibits parallelized generation of Thad’s writing.

The useful lesson is:

- maintain a single canonical voice for Thad;
- permit other characters to have sharply different comic mechanisms;
- assign revisions by character/voice rather than indiscriminately averaging tone;
- read dialogue in performance context;
- use straight characters to support, resist, or expose Thad’s dryness.

The project’s existing voice-batching strategy is sound.

---

# 20. Dialogue choices and player trust

The original manual explicitly promises that the player will not be punished for choosing a wrong or funny dialogue response.

Source: [The Secret of Monkey Island manual](https://mocagh.org/lucasfilm/mi-manual.pdf)

Consolation’s `[COMIC]` invariant is strongly aligned with this principle.

## Required tests

- Every comic option can be selected without losing required information permanently.
- Critical dialogue states remain recoverable.
- Silent state changes never produce a soft lock.
- Repeated conversations re-enter at coherent nodes.
- Act or reputation changes can update dialogue.
- Exhausted lines remain visually understandable without looking like disabled mandatory progress.
- Save/load restores the exact dialogue and selection state.

---

# 21. Puzzle implementation: build backward from the payoff

The historical record shows frequent revision when a puzzle’s literal implementation did not work. The idol-room sequence became funnier when the elaborate mechanics occurred behind a wall. Rooms, objects, and animations were cut even after substantial work.

Dave Grossman’s account emphasizes thinking through a puzzle’s dynamics, bringing proposals to Gilbert, receiving a precise explanation of what was wrong, and revising.

Sources:

- [Dave Grossman interview](https://legendofmi.com/interviews/dave-grossman-talks-monkey-island-17)
- [VGHF source-code study](https://gamehistory.org/monkeyisland/)

## Consolation puzzle implementation template

For each of the 45 puzzles, specify:

```yaml
playerGoal:
payoff:
requiredKnowledge:
knowledgeSources:
requiredState:
requiredObjects:
availableWrongHypotheses:
failedActionFeedback:
staging:
choreography:
objectStateChanges:
audioResponse:
visibleConfirmation:
downstreamUnlocks:
recoveryPaths:
automatedPathTests:
```

Then implement from payoff backward.

The graph validator proves reachability. It does not prove:

- that clues are perceptible;
- that the player can form the intended hypothesis;
- that the animation explains causality;
- that success is satisfying;
- that the puzzle is paced correctly.

Those require executable player-path tests and naive playtesting.

---

# 22. Cutscenes as information-bearing gameplay

The original manual describes cutscenes as sources of clues, character information, and special animated sequences. They are not merely rewards.

Source: [The Secret of Monkey Island manual](https://mocagh.org/lucasfilm/mi-manual.pdf)

## Consolation requirements

Every cutscene should be tagged with its job:

- clue;
- setup;
- character reversal;
- geographic transition;
- comic payoff;
- emotional shift;
- consequence.

Implement skipping safely:

- skip applies every essential flag, object state, actor placement, and inventory mutation;
- repeated scenes may be skipped;
- first-view skipping should remain possible for accessibility unless a deliberate exception is approved;
- test watched and skipped outcomes for state equivalence.

The coffin sequence may intentionally suppress interface and control, but it still needs explicit save, pause, accessibility, and skip decisions.

---

# 23. Adaptive music: Monkey Island 1 versus Monkey Island 2

Do not conflate the two games.

*The Secret of Monkey Island* established the musical identity, but iMUSE was developed for *Monkey Island 2*. iMUSE could:

- synchronize musical changes with visual events;
- switch instrumentation;
- choose transitional cues based on musical position;
- create coherent transitions between location variants;
- allow the score to feel continuous and reactive.

Sources:

- [iMUSE transition capabilities discussed by LucasArts composers](https://mixnmojo.com/features/interviews/Jesse-Harlin-and-Wilbert-Roget-Interview/2)
- [GDC session on the Monkey Island scoring lineage](https://www.gdcvault.com/play/1029371/Thirty-Years-Later-Scoring-Return)

## Consolation’s tuning concept is excellent but incomplete

The planned global −35-cent detune resolving to zero is thematically powerful. It is not, by itself, an adaptive score.

The music manager also needs:

- shared tempo and bar grid;
- room-state stem definitions;
- bar-aware transitions;
- short transition cues;
- event stingers used sparingly;
- instrument continuity between adjacent rooms;
- deterministic scripted automation;
- saved musical state;
- recovery after tab suspension;
- user volume controls;
- tests for rapid room changes.

## Recommended music data

```ts
type RoomMusicState = {
  cue: string;
  tempo: number;
  meter: [number, number];
  stems: {
    id: string;
    asset: string;
    gain: number;
    detuneCents?: number;
  }[];
  transitions: Record<string, {
    quantize: "beat" | "bar" | "phrase";
    bridgeCue?: string;
  }>;
};
```

The Listening puzzle must not be built last. It depends on this architecture and needs an early audio prototype.

---

# 24. What the current repository already gets right

Preserve these decisions:

- Phaser 3 + TypeScript + native 320×200 rendering;
- nearest-neighbor presentation;
- player-facing content in JSON rather than TypeScript;
- locked master palette;
- 1-bit custom font;
- sentence line and nine visible verbs;
- distinct LOOK and LISTEN writing;
- global flag store;
- save/load state;
- dialogue options with `[COMIC]` routes;
- puzzle reachability and dead-end validation;
- sparse palette cycling;
- deterministic procedural art source;
- no player death or permanent unwinnable state;
- Thad’s coherent voice;
- the Liar’s Assay as an original thematic transformation;
- the global tuning-resolution concept;
- the town of Consolation as an original setting.

---

# 25. What must change before scaling production

## Critical

1. Implement polygonal walk boxes and routing.
2. Add entrance positions and destination entrance IDs.
3. Add object walk-to points and required facing.
4. Implement foreground occlusion masks.
5. Link walk boxes to clip levels and scale behavior.
6. Y-sort actors and depth-aware objects.
7. Wire real Thad sprite costumes into the runtime.
8. Build the asynchronous sequence/choreography runner.
9. Implement object visual states and ownership.
10. Build one complete inventory interaction.

## High

11. Replace double-click walking with a consistent single-click/secondary-default model, or document a tested reason not to.
12. Add room enter/exit/local process hooks.
13. Create the music-system prototype and Listening proof.
14. Enforce wireframe → grayscale → final-color room production.
15. Add performed-interaction tests, not only JSON validation.
16. Audit atmosphere-only rooms for pacing.
17. Add palette-proportion reports.

## Medium

18. Add adjustable message speed.
19. Add safe cutscene skipping.
20. Add more intermediate actor scales or hide step transitions.
21. Add object polygons where rectangles produce misleading hit areas.
22. Test native-scale dither on the target Chromebook.
23. Add per-room processes for sparse ambient life.

---

# 26. The proof vertical slice

Before producing the remaining rooms, Main Street should prove the whole grammar.

## Required contents

- final Main Street background;
- revised walk-box polygons;
- working routes around the trough and foreground obstacles;
- at least two clip planes;
- Thad’s real four-direction walk and idle sprites;
- Y-sorted ambient characters;
- one foreground NPC pass;
- proper arrival from Stage Road;
- correct exits and destination entrances;
- three storefront object staging points;
- one open/closed door state;
- one inventory object;
- one item-to-world interaction;
- one item-to-NPC interaction;
- one conversation with comic and progress options;
- one short cutscene or choreography;
- one palette-cycled detail;
- one autonomous ambient process;
- one music state with a bar-aware transition;
- save/load;
- cutscene skip state equivalence;
- automated player-path tests.

## Acceptance test

A player should be able to:

1. arrive visibly from the correct road;
2. walk behind and in front of room geometry;
3. move naturally around an obstacle;
4. identify Thad at every depth;
5. use the verb panel without double-click ambiguity;
6. perform a staged object interaction;
7. collect and use an inventory item;
8. hold a conversation;
9. observe ambient life that does not distract;
10. leave through a specific door and emerge correctly inside;
11. save, reload, and find the exact world state restored.

Until this is playable, additional backgrounds do not reduce the project’s largest risk.

---

# 27. Proposed engine schema

```ts
type Room = {
  id: string;
  background: string;
  paletteScript: PaletteScript;
  walkBoxes: WalkBox[];
  occlusionPlanes: OcclusionPlane[];
  entrances: Entrance[];
  exits: Exit[];
  objects: RoomObject[];
  actors: ActorPlacement[];
  ambientProcesses: AmbientProcess[];
  enterSequence?: SequenceStep[];
  exitSequence?: SequenceStep[];
  music: RoomMusicState;
};

type WalkBox = {
  id: string;
  points: [Point, Point, Point, Point];
  neighbours: string[];
  clipPlane: number;
  scale: ActorScaleRule;
  enabledWhen?: Condition;
};

type RoomObject = {
  id: string;
  name: string;
  hitShape: Rect | Polygon;
  walkTo?: { point: Point; facing: Facing };
  defaultVerb?: VerbId;
  owner: ObjectOwner;
  state: string;
  states: Record<string, ObjectVisualState>;
  interactions: Partial<Record<VerbId, InteractionRule[]>>;
};

type InteractionRule = {
  when?: Condition;
  withItem?: string;
  sequence?: SequenceStep[];
  response?: string;
  effects?: StateEffect[];
};
```

The implementation need not copy SCUMM’s binary formats. It should copy the useful authored relationships.

---

# 28. Automated tests Claude should add

## Geometry

- every entrance point belongs to an enabled walk box;
- every object staging point belongs to an enabled walk box;
- every required exit is reachable from every entrance;
- all neighbour references resolve;
- no critical path crosses a disabled box;
- route points remain within walk geometry;
- actor scale rule is defined for every traversable box;
- clip plane exists for every nonzero box clip level.

## Staging

- actor reaches each object’s walk-to point;
- actor ends facing the required direction;
- interaction fires only after arrival;
- retargeting cancels or queues predictably;
- room transition uses the named destination entrance.

## Rendering

- foreground mask hides known actor pixels;
- clip-0 actor remains in front;
- Y order reverses when actors exchange vertical position;
- object state changes its image and occlusion mask;
- actor feet remain anchored across scale changes.

## Sequences

- skip and full playback produce equivalent essential state;
- room exit cancels local looping processes;
- save/load restores supported sequence boundaries;
- concurrent tracks do not deadlock;
- `waitForActor` resumes deterministically.

## Interaction

- right-click/default action matches object metadata;
- selected verb remains visible in the sentence line;
- item-to-item and item-to-object combinations preserve both nouns;
- funny dialogue choices cannot lose mandatory information;
- every meaningful state change has visible or audible confirmation.

## Full paths

- executable routes through each puzzle, not graph-only edges;
- no soft lock after every reachable inventory and dialogue state;
- act completion from fresh save;
- naive-tester telemetry records attempts without changing game behavior.

---

# 29. Instructions for Claude

Use this prompt with the repository and both dossiers:

> Treat the two Monkey Island dossiers as engineering and production references, not as permission to copy Monkey Island’s protected expression. Audit the current repository against the supplemental technical deep dive. Correct any documentation that calls a feature implemented when it exists only as a ruling or plan. Before producing another final background, build the Main Street proof vertical slice defined in Section 26. Implement the room relationships—not SCUMM’s proprietary binary format—including polygonal walk boxes, adjacency routing, scale rules, clip planes, occlusion masks, object walk-to/facing metadata, entrance placement, Y sorting, object visual states, a sequence runner with wait/sleep semantics, real Thad costumes, one inventory chain, one staged NPC interaction, and executable player-path tests. Preserve existing canonical writing and fiction. Do not generate replacement dialogue. Demonstrate every claimed feature in the running game and identify the exact test or visible path that proves it.

---

# 30. Source guide

## Primary or near-primary development accounts

- [Video Game History Foundation: The Secrets of Monkey Island’s Source Code](https://gamehistory.org/monkeyisland/)
- [The Secrets of Monkey Island — An Evening with Ron Gilbert](https://www.youtube.com/watch?v=ikaqus5_QIg)
- [Aric Wilmunder: The SCUMM Diary](https://www.gamedeveloper.com/design/the-scumm-diary-stories-behind-one-of-the-greatest-game-engines-ever-made)
- [Dave Grossman Talks Monkey Island](https://legendofmi.com/interviews/dave-grossman-talks-monkey-island-17)
- [Mark Ferrari interview on dithering and Lucasfilm art](https://www.cgmagonline.com/articles/an-interview-with-pixel-artist-extraordinaire-mark-ferrari/)
- [The Secret of Monkey Island original manual](https://mocagh.org/lucasfilm/mi-manual.pdf)
- [Thimbleweed Park: wireframe-to-final room process](https://blog.thimbleweedpark.com/quickiepal.html)
- [GDC: Thirty Years Later — Scoring Return to Monkey Island](https://www.gdcvault.com/play/1029371/Thirty-Years-Later-Scoring-Return)

## Technical reconstructions cross-checked against game data

- [SCUMM v5 ROOM block](https://grogvm.dev/docs/scumm/room/)
- [SCUMM v5 walk boxes](https://grogvm.dev/docs/scumm/walk-boxes/)
- [SCUMM v5 z-plane masks](https://grogvm.dev/docs/scumm/zplane/)
- [SCUMM v5 room objects](https://grogvm.dev/docs/scumm/objects/)
- [ScummVM project documentation](https://wiki.scummvm.org/index.php/SCUMM/Technical_Reference)

---

# Final conclusion

The Last Claim already understands many of Monkey Island’s visible conventions. The next leap will not come from more detailed pixel art or more dialogue. It will come from implementing the invisible authored relationships that made those games feel coherent:

- every object knows where the actor stands;
- every walk area knows how it connects, scales, and clips;
- every actor action can wait for movement and facing;
- every room controls entry, exit, objects, and ambient processes;
- every foreground shape participates in depth;
- every puzzle is experienced as staged cause and effect;
- every final painting has already survived weeks as a playable crude room.

That is the construction discipline Claude should reproduce.
