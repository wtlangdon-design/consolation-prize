> **Provenance.** Produced by ChatGPT from the Monkey Island manual, the Video Game History Foundation's source-code preservation work, and the ScummVM engine source, at Tyler's direction, 31 July 2026. Pushed substantially as received rather than paraphrased.
>
> **Status: binding.** Where this document and the errata disagree, see errata 44, which carries the only exceptions.

---

IMPLEMENTATION FIELD GUIDE
Movement Between Rooms and Streets
Monkey Island transition grammar for The Last Claim in Consolation
Prepared as a binding implementation and room-authoring reference for Claude
Primary reference: The Secret of Monkey Island (1990), original VGA-era movement language
Scope: player-visible movement, room topology, entrances, exits, camera, scaling, occlusion, and transition implementation

# How to use this guide
This is not a request to copy Monkey Island's copyrighted characters, rooms, dialogue, puzzles, animation frames, or artwork. It isolates the functional movement grammar that makes its painted rooms feel connected and inhabitable, then translates that grammar into original implementation requirements for The Last Claim in Consolation.
The recommendations labeled CURRENT BUILD are based on the checked-out Consolation repository and its existing TypeScript room runtime. Historical claims are tied to the source list at the end.

# Executive specification
Guybrush's movement works because five systems agree: the background tells the player where travel is possible; walk boxes constrain and route the actor; scale and masking place him in depth; exit scripts decide when the old room yields; and the destination room receives him at a paired entrance with deliberate facing. The screen change is only the middle beat.
Keep most exploration rooms as authored fixed views, not a continuously scrolling world.
Every clickable exit needs an approach point, a visible threshold, an egress path, a destination entrance, and a short ingress or settle beat.
Use the same four-direction actor state machine for ordinary walking, exit choreography, and scripted arrivals.
Let foreground geometry swallow or reveal the actor at doors, alleys, awnings, street turns, stairs, and screen edges.
Preserve geographic logic: the side, facing, apparent depth, and landmark relationship at the destination must explain where the actor came from.
Do not grant control during the irreversible half of a room transition. Ordinary walking may be canceled; threshold crossing may not.
Author these data while grayboxing a room. Finished art is too late to discover that there is nowhere for an entrance to land.

# 1. What the player actually experiences

## 1.1 Movement begins as an intention, not direct control
The original manual tells the player to point where Guybrush should go and click; WALK TO is the default because walking is the most frequent action. When an interaction is chosen, Guybrush walks to the object's staging position before performing it. During a cutscene, control is temporarily removed. [S1]
This produces an important feel: the player chooses destinations and actions, while the game authors the performance between them. The actor is not steered with acceleration, physics, or a free camera. The room decides how a request becomes blocking.

## 1.2 The character is a four-direction stage performer
Surviving Monkey Island costume material shows human actors with walking and talking coverage in four directions. [S2] A diagonal click therefore does not require eight bespoke direction sets. The route can be diagonal, but the displayed animation resolves to the clearest cardinal facing and changes at path legs or turns.
Left/right reads as travel across the theatrical frame.
Back reads as entering a door, alley, road, stairs, or depth lane.
Front reads as returning toward the player or settling after an entrance.
A turn is visible and brief. Instant sprite mirroring makes the actor feel cursor-driven rather than self-propelled.

## 1.3 The room quietly corrects the click
A click does not authorize movement through every painted pixel. SCUMM routes actors through connected walk boxes; if a requested destination is outside valid floor, the engine can resolve a legal destination. The path is a sequence of authored spatial zones rather than arbitrary collision avoidance. ScummVM's implementation asks the box matrix for the next connected box, then computes a path through successive box boundaries. [S3][S4]
For the player, this should feel permissive: a click near a door, boardwalk edge, trough, or road should produce a sensible walk, not no response. The correction must be subtle enough that the actor appears to obey the click rather than snap to an unrelated point.

## 1.4 Depth changes while walking
The actor's feet are the ground anchor. As the feet move through a scale-enabled box, the costume changes size; the same box can also select the clip plane that masks the actor behind foreground art. ScummVM resolves actor scale from the current walk box and interpolates scaling-slot values from position. [S3][S4]
The practical result is not merely 'far sprite, near sprite.' The character belongs to the perspective continuously: smaller near the storefronts or receding roads, larger in the foreground, and partially hidden by posts, counters, troughs, wheels, doorframes, or awnings when the room says those forms are nearer.

# 2. The complete movement loop
Claude should treat the following as one state machine. Omitting any stage creates the modern prototype feeling the current build is trying to escape.
Resolve intent: Determine whether the click means bare-ground walking, an object interaction, a doorway, a screen-edge exit, or map travel.
Choose staging: For objects and exits, use an authored approach point and required facing; do not invent a point from the hotspot center at runtime.
Route: Snap to valid floor, identify start and destination walk boxes, and route through their adjacency graph.
Perform the walk: Advance feet along waypoints; update facing, walk cycle, surface sound, scale, Y ordering, and occlusion every frame.
Reach the threshold: At an exit approach point, turn or play the door/step/duck/dismount chore required by that threshold.
Commit: Once the actor begins crossing the threshold, stop accepting cancellation input; persist room state and run the source exit sequence.
Switch rooms: Use the configured short room effect, load the destination, restore its state, set its camera, and place the actor at the paired entrance.
Complete ingress: Reveal the actor from behind the reciprocal doorframe/edge or walk him a short distance to a settle point.
Return control: Only after the actor is visibly in the new room, standing on valid floor, at a coherent scale and facing.

# 3. How rooms connect

## 3.1 A room is a functional unit, even outdoors
Lucasfilm used 'room' for outdoor streets, docks, maps, paths, and interiors as well as literal rooms. VGHF's recovered material includes separate street rooms, map rooms, room-connectivity notes, box files, and objects that function as pathways to other rooms. [S2] This is why a town can feel geographically continuous while still being assembled from fixed painted views.

## 3.2 Source and destination are a paired contract

## 3.3 What SCUMM itself supplies
ScummVM's scene-start pipeline shows the underlying contract clearly: it invokes the configured room-switch effect, runs the old room's exit script, loads and prepares the destination room, places the actor using an object position, reverses the facing relative to that object, and then runs the new room's entry script. [S5] The exact visible choreography is authored by those room and object scripts; the engine does not need one universal door animation.
Therefore, avoid a single global rule such as 'walk to hotspot center, fade, spawn at room center.' The general system should support several authored transition patterns while preserving one shared lifecycle.

# 4. Transition patterns Claude must support

# 5. Camera and framing

## 5.1 Prefer authored views
The early Monkey Island look depends on rooms composed like stage sets. The camera usually gives the player a stable relationship among actor, exits, landmarks, and interface. SCUMM can follow or pan horizontally in rooms wider than the viewport; its camera code uses follow triggers, clamps, and controlled movement. [S6] Capability is not a mandate.
For Consolation, most 320 x 144 playfields should remain fixed. Use a wider scrolling room only when one continuous spatial joke, pursuit, reveal, or navigation problem genuinely needs it. Do not smooth-scroll merely because a background is wide; that changes composition from authored picture to moving strip.

## 5.2 A fixed frame still needs depth
A fixed room is not a flat band. The Main Street revision correctly creates depth with a road receding to the lower right, a turned building at the left edge, middle-ground street objects, and a near wagon wheel. The movement system must honor that art: walk boxes should route around the trough, wagon, rail, and lumber; scale should change along the recession; and masks should place Thad behind the correct objects.
If a room's finished art leaves only one horizontal strip on which the actor can move, no transition code can repair the lost depth. The ground plane, exits, occluders, and staging marks must be resolved before surface detail.

# 6. Geographic continuity rules
Side continuity: leaving right normally means arriving from left, unless the destination camera deliberately rotates; if it rotates, preserve a strong landmark or path direction to explain the change.
Depth continuity: leaving through a far alley should not place the actor giant in the destination foreground. Pair apparent distance, not raw screen coordinates.
Door continuity: the exterior and interior doorway need not have identical dimensions, but the actor must enter and emerge through the same conceptual threshold and face the logical direction.
Surface continuity: mud-to-boardwalk, road-to-floor, and stair-to-landing transitions need a believable footfall and standing sink on each side.
State continuity: an opened door, departed coach, removed object, or repaired board remains changed after returning unless a script explicitly resets it.
NPC continuity: do not invite the player to follow a visible NPC through an exit unless the NPC will plausibly exist or be accounted for in the destination. VGHF reports that random pirates entering the SCUMM Bar were cut because players could follow and then fail to find them inside. [S2]
Audio continuity: location music may bridge or transition at the room boundary, but it must not cause the visual cut to wait awkwardly after the actor has disappeared.

# 7. Map movement: imitate the function, choose the presentation
Monkey Island uses a tiny map-scale Guybrush; VGHF notes that the final overhead map reduces him to a four-pixel sprite. [S2] That moving token preserves the fiction that travel is happening while compressing distance. It also gives the island's topology a physical rhythm distinct from local-room walking.
CURRENT BUILD: Consolation's town map is intentionally an instant menu with no actor token. That is a valid original design choice, but Claude should understand that it does not reproduce Monkey Island's travel feel. Keep it only as an explicit tradeoff: faster navigation and less animation work in exchange for weaker geographic embodiment.
If the map remains instant, local street-to-street and door transitions must carry more continuity work. If a moving token is later added, it needs its own paths, discovery gates, destination triggers, and travel speed; it should not be a decorative cursor sliding in a straight line through buildings.

# 8. Room-authoring data required before final art

# 9. Proposed transition data model
The exact names may change, but the separation of approach, threshold, offscreen/reveal, and settle points is important. One coordinate cannot do all four jobs.
type RoomExit = {
  id: string;
  targetRoom: string;
  targetEntrance: string;
  approach: { x: number; y: number; facing: Facing };
  threshold: { x: number; y: number };
  egress?: { x: number; y: number };       // may be behind mask/offscreen
  transition: "cut" | "shortFade" | "wipe" | "scripted";
  doorObject?: string;
  exitChore?: string;
  cancellableUntil: "approach" | "threshold";
};

type RoomEntrance = {
  id: string;
  from?: string[];
  spawn: { x: number; y: number; facing: Facing };
  ingressTarget?: { x: number; y: number };
  revealPlane?: number;
  cameraAnchor?: { x: number; y: number };
  entryChore?: string;
};

# 10. Runtime sequence
async function transit(exit: RoomExit) {
  await actor.walkTo(exit.approach);
  await actor.face(exit.approach.facing);

  // New clicks may redirect before this point.
  lockTransitionInput();
  await playOptionalDoorOrExitChore(exit);
  await actor.walkThrough(exit.threshold, exit.egress);

  persistSourceRoom();
  runSourceExitScript(exit.id);
  await applyRoomEffect(exit.transition);

  loadRoom(exit.targetRoom);
  const entrance = resolveEntrance(exit.targetEntrance);
  placeActor(entrance.spawn);
  setCamera(entrance.cameraAnchor);
  runDestinationEntryScript(entrance.id);
  await revealAndWalkIn(entrance);

  unlockInput();
  autosave();
}
Autosave may occur immediately after destination state is committed or after ingress completes, but the save schema must restore a stable post-transition state. Never serialize the actor in an unrecoverable half-threshold state unless the sequence runner explicitly supports it.

# 11. Current Consolation build: what is already right
The checked-out build has moved well beyond the earlier prototype. Claude should preserve these systems rather than replacing them:
engine/core/WalkBoxes.ts routes through authored box adjacency and computes boundary portals instead of walking straight through the trough.
engine/core/Actor.ts follows waypoints, keeps feet as the anchor, turns visibly, and derives surface and scale while walking.
engine/scenes/GameScene.ts stages ordinary interactions as walk, wait, face, wait, optional chore, then line.
engine/core/types.ts now includes WalkBox, Entrance, StagingMark, object states, clip planes, and occlusion-plane definitions.
Main Street already declares source-specific entrances, named staging marks, polygonal walk boxes, scale modes, and two occlusion planes.
The renderer applies per-plane masking rather than drawing Thad over every foreground object.

# 12. Current gap: exits still end too early
CURRENT BUILD: an exit is still structurally little more than an interactable with a destination room. GameScene can walk Thad to exit.walkTo and face him, but applying the interaction then changes rooms immediately and placeIn drops him at the destination entrance. That is a substantial improvement over spawning in the room center, but it omits the two beats that make Monkey Island transitions feel physical:
Egress: Thad does not yet cross the door, edge, road bend, or alley threshold before the old room yields.
Ingress: Thad is placed at the destination coordinate rather than being revealed from the reciprocal threshold and settling into the room.
The next implementation step should extend Exit and Entrance rather than build one-off timers into Room 1. The generic system should then be used by Main Street doors, the road to the claims, Stage Road, and later interiors.

# 13. Specific application to Stage Road and Main Street

## 13.1 Stage Road arrival
The arrival is a scripted vehicle transition, not an ordinary spawn. To make the scene legible:
Begin with Thad visibly associated with the coach: seated, descending, or standing beside it as his case is unloaded. The conversation must not look like two disembodied men near an unrelated wagon.
Keep control locked through the driver's final line, Thad's acknowledgment, dismount/unloading, and the coach's initial departure movement.
Do not delete the coach layer on the same frame as the final dialogue click. Animate or slide it far enough that departure is understood, then commit T_COACH_DEPARTED.
After the coach leaves, place Thad and his case at stable authored marks. Only then reveal the ordinary verb interface and permit walking.
The exit toward Main Street should use the road's real perspective lane. Thad walks into depth or along the road, becomes smaller as appropriate, reaches an occluded bend/edge, then Main Street receives him from its west entrance.
Delay the act card until the arrival blocking has established place and character. The card must not interrupt a line, cover the first readable movement beat, or appear before ACT I is visibly separated from its title.

## 13.2 Main Street
Main Street is the game's most visited room and should demonstrate the complete system. Its finished frame already provides three depths of props and a receding right-hand road. The runtime should now make those choices playable.
West arrival from Stage Road: spawn just behind or at the left-edge framing building, walk Thad a short distance into the street, then return control. Do not simply pop him onto x=14.
Road to the claims: use the existing east/right recession. Thad should walk down the ruts, scale smaller, pass the hitching rail/lumber or final building mask, and disappear at the turn before the next room loads.
Storefront doors: approach from mud or boardwalk, step onto the correct surface, face back, open/swing the door if state art exists, and let the doorframe/awning mask the last pixels of the actor.
Return from interiors: reveal Thad from the corresponding door and give him a short step onto the boardwalk before control. The exterior and interior entrances must share identity, not merely room IDs.
The dark alley currently reads as town continuing, but it need not be an exit. If it is atmosphere only, give it no misleading hotspot. If it becomes traversable, it needs a real walk lane, destination room, paired entrance, and enough width for Thad's far-scale silhouette.
Foreground props may create depth but must not visually barricade the east road or conceal the actor's route. Debug overlays should prove the route around the trough remains legible at native scale.

# 14. Authoring defaults for new rooms
These are project starting values, not claims about exact Monkey Island measurements. Tune them at native 320 x 144 scale.

# 15. Movement QA and room acceptance tests

## 15.1 Debug views
Walk-box overlay with IDs, adjacency lines, and enabled/disabled state.
Scale overlay showing actor height at cursor and current feet position.
Clip-plane overlay with the actor's active plane highlighted.
Entrance/exit overlay showing approach, threshold, egress, spawn, and settle marks in distinct colors.
Camera bounds and anchor overlay for any room wider than the playfield.
Reciprocal-link report listing every exit and the destination entrance that receives it.

## 15.2 Automated acceptance checks
Every non-map exit names an existing room and existing entrance; every required reciprocal link is declared.
Every approach, threshold where standable, spawn, ingress target, and staging mark lies on or intentionally beyond a valid walk box.
An exit can be reached from every enabled walk-box component that should reach it.
The actor never crosses a disabled box or obstacle while routing to an exit.
Scale changes monotonically along designated depth lanes unless an authored fixed-scale box explains the exception.
The actor is masked by the expected plane at representative points before, during, and after a threshold.
Input cancels an approach but cannot interrupt committed threshold crossing.
Skipping a transition sequence yields the same destination room, actor placement, facing, object states, flags, and inventory as watching it.
Save/load after arrival restores a stable destination state, not the source room with destination flags or vice versa.
A native-resolution screenshot sequence shows no one-frame pop in position, facing, scale, mask, door state, or UI visibility.

## 15.3 Human playtest questions
Without using the map, can the tester tell where the last room is relative to this one?
Did the actor seem to enter/leave, or did the game swap paintings underneath him?
Was the exit visually available before the tester hunted for a hotspot?
Did a foreground object improve depth without hiding the route?
Did any transition take longer than the information or joke it delivered?
Could the tester click during the transition and produce a half-finished state?
On returning through the same doorway, did the room remember the correct state and side?

# 16. Copy-paste directive for Claude
Before changing any art, inspect the current movement runtime and produce a gap table against this guide. Then implement one reusable exit/entrance transition lifecycle, not Room 1-only timers.

Required order:
1. Extend room data so exits distinguish approach, threshold, egress, target entrance, effect, and cancellation boundary.
2. Extend entrances so they distinguish spawn, ingress target, initial facing, reveal mask, and optional camera anchor.
3. Make transition commitment atomic: cancelable before threshold, non-cancelable after it.
4. Preserve and reuse the existing WalkBoxes, Actor, Sequence, object-state, scaling, and occlusion systems.
5. Convert Stage Road -> Main Street and at least one Main Street storefront into complete egress/load/ingress transitions.
6. Add reciprocal-link, reachability, skip-state, save/load, and frame-pop tests.
7. Verify the running game at native resolution and full-screen presentation.

Do not call the work complete because coordinates or data fields exist. Demonstrate each changed transition in the executable game and report exactly what was observed.

# Sources
[S1] The Secret of Monkey Island original manual. Player-facing instructions for point-and-click walking, WALK TO, object approaches, and cutscene control.
[S2] Video Game History Foundation: The Secrets of Monkey Island's Source Code. Preservation analysis of costumes, map-scale Guybrush, z-planes, box files, room links, and pathway objects.
[S3] ScummVM SCUMM actor implementation. Open engine code for actor walking, directional animation, scaling, and path progression.
[S4] ScummVM SCUMM walk-box implementation. Open engine code for box adjacency, next-hop routing, path geometry, and scale interpolation.
[S5] ScummVM SCUMM room-loading implementation. Open engine code for room effects, exit scripts, loading, actor placement, facing, and entry scripts.
[S6] ScummVM SCUMM camera implementation. Open engine code for actor-follow triggers, camera clamping, and panning in wide rooms.
Evidence boundary: Sources establish engine capabilities; the transition recommendations apply them to Consolation. Pixel distances and timings are project starting points, not historical Monkey Island measurements.

**Table 1**

| Binding principle  A transition is not a teleport between backgrounds. It is a short piece of blocking that begins in one authored room, crosses a legible threshold, and finishes in the next. |
|---|

**Table 2**

| Cancellation boundary  Before commitment, a new click may redirect or cancel ordinary walking. After the actor crosses an exit threshold, complete the transition atomically. Never strand him half inside a doorway or save a room change without its arrival state. |
|---|

**Table 3**

| Source-room requirement | Destination-room requirement | Continuity test |
|---|---|---|
| Visible door, road, alley, stair, or frame edge | Matching doorway, road direction, stair landing, or reciprocal edge | A player can explain the connection without a map. |
| Approach point on valid floor | Spawn point inside a valid entrance pocket | No snapping from scenery into walkable space. |
| Egress facing and final scale | Incoming facing and compatible apparent scale | The actor does not reverse direction or change size inexplicably. |
| Foreground mask or offscreen sink | Reciprocal reveal mask or offscreen source | The sprite enters and emerges instead of popping. |
| Exit state and one-time triggers | Entry state, presence, music, and one-time triggers | Autosave and cutscene state agree after arrival. |

**Table 4**

| Pattern | Player-visible behavior | Room-build obligations |
|---|---|---|
| Adjacent street / frame edge | Actor walks toward the street continuation, reaches or partly crosses the edge, then appears from the reciprocal edge of the next view. | Reserve a clear edge lane; pair side and facing; avoid props that make the exit look blocked. |
| Door into an interior | Actor reaches a mark, faces the door, door changes state if needed, and the frame/mask swallows him before the interior loads. | Door state art, approach mark, threshold mark, destination doorway, reciprocal facing, mask. |
| Road or alley into depth | Actor walks away from camera, scales down, passes behind architecture or shadow, and the next room begins at a far-depth entrance. | Perspective lane, continuous scale curve, narrow mask, far spawn, short walk-in. |
| Stair / vertical connector | Actor follows a deliberately stepped or diagonal route; cuts may occur at a landing or occluded bend. | Waypoints that match stair geometry; scale must not be based blindly on Y if the stairs violate floor perspective. |
| Map compression | Leaving a local cluster yields a map; long travel is represented rather than simulated. The destination then loads at a named entrance. | Explicit local-to-map exits, discovered locations, destination entrances, intentional policy on instant travel versus moving token. |
| Scripted vehicle / ferry / coach | Player control yields; boarding, departure, travel ellipsis, arrival, and disembarkation form one sequence. | Vehicle/object states, actor placement or hidden state, destination sequence, skip-safe final state. |
| Cutscene relocation | A story beat moves the actor without pretending it was ordinary walking. | Clearly signaled loss of control; final room, position, facing, flags, objects, and music applied even if skipped. |

**Table 5**

| Field | Required content | Why art depends on it |
|---|---|---|
| walkBoxes | Convex floor polygons, adjacency, surface, scale mode, clip plane | Defines where open ground must exist and where props may safely overlap it. |
| stagingMarks | Object, dialogue, entrance, exit, and cutscene positions with facing | Proves characters fit and remain legible at important beats. |
| exit | Approach, threshold, egress, target room, target entrance, effect, lock policy | Determines how the edge, door, alley, road, or stairs must be painted. |
| entrance | Spawn, ingress target, initial facing, camera anchor, source filter | Prevents center-room teleporting and accidental back-facing arrivals. |
| occlusionPlanes | Masks for foreground structures and stateful objects | Lets architecture create depth instead of merely decorating the background. |
| scaleProfile | Fixed or interpolated actor size by box/position | Ensures doors, railings, counters, and horizons are proportioned to the actor. |
| camera | Fixed, followed, panned; bounds and initial anchor | Prevents later cropping from hiding exits or breaking composition. |
| entry/exit sequence | Door state, chore, sound, flags, ambient start/stop, music cue | Connects spatial movement to narrative and persistent room state. |

**Table 6**

| Parameter | Starting default | Tune when |
|---|---|---|
| Exit approach distance | 8-24 native pixels before threshold | A turn, door chore, or object blocks the approach. |
| Egress endpoint | 4-12 pixels beyond visible edge or behind mask | The actor remains visibly stuck in the frame. |
| Ingress walk | 8-20 pixels from spawn to settle | The destination is cramped or the doorway is already fully visible. |
| Turn hold | About 0.15-0.25 seconds | The change is comic, urgent, or hidden by a door. |
| Room effect | Immediate cut or very short configured effect | A story transition intentionally marks distance or time. |
| Control restoration | After settle and stable idle frame | A room intentionally opens on dialogue or another cutscene. |

**Table 7**

| Use this instruction with the repository  Treat this document as binding for movement and room transitions. Preserve the current original setting, characters, writing, puzzles, and artwork; implement the functional grammar, not copied Monkey Island content. |
|---|