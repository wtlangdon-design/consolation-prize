> **Provenance.** Produced by ChatGPT from the Monkey Island manual, the Video Game History Foundation's preservation material, the ScummVM source, and an audit of this repository at `d39cc25`, at Tyler's direction, 31 July 2026. Pushed substantially as received.
>
> **Status: binding.** See errata 50.

---

BINDING IMPLEMENTATION FIELD GUIDE
Character Animation and Performance
Monkey Island performance grammar for The Last Claim in Consolation
Prepared for Claude as an animation, runtime, content, and QA contract
Functional reference: The Secret of Monkey Island (1990)
Repository audit: main at d39cc25748687f803579da34f5eac31c4331c9b5
Scope: chores, arbitration, interruption, idles, direction and scale, talk, comic reaction, NPC performance, data, runtime, and tests

# How to use this guide
Status  This guide is binding for character animation and performance. It does not replace canonical movement, dialogue, puzzle, room, art, or errata documents. Where older road-map prose conflicts with binding errata, the errata and this guide control.
Claude must preserve the existing procedural pixel-art pipeline, palette, canonical staging and written beats. Repair the runtime contract and author missing performance data; do not redesign the game around today's clip timer.
The Secret of Monkey Island is a functional reference, not a source of characters, drawings, jokes, frames, code, or choreography. Copy the grammar of readable poses, purposeful holds, directional acting, and authored reactions—not protected expression.
A historical citation supports the reference grammar. An [R] citation supports the repository audit. Exact fields, thresholds, priorities, and tests in this guide are original implementation requirements for Consolation.
Non-negotiable  Motion is never information. A person, animal, lamp, prop, or environmental sprite may not begin, stop, brighten, accelerate, face, gesture, or become more conspicuous because a puzzle has made it relevant. [R6]

# 1. Executive contract
A chore is a named, authored performance timeline—not a clip name plus a guessed duration. It defines frames and holds, anchoring, coverage, markers, playback, interruption, and a deterministic settle pose.
One scheduler arbitrates every body performance. A character cannot independently walk, turn, talk, idle, and chore on the same body track. A prop/effect track may synchronize through explicit markers.
Interaction choreography waits for arrival, a planted foot, and facing before the action chore. A new walk during a chore is queued or admitted at a declared safe interrupt; it never silently creates a route behind a frozen actor.
Skipping text ends the talk performance, not the transaction. A half-played gesture or action follows its declared skip policy, reaches a legal settle, and commits required effects exactly once.
Idles are low-information performances on the same animation controller. They stop while a higher-priority body performance owns the actor and resume without synchronizing the room.
Reusable player animations provide four cardinal facings. Reachable depth-changing performances provide both drawn sizes and preserve pose through continuous decimation and the measured one-snap threshold.
Talk animation is deliberately small at roughly forty pixels: a short, asymmetric loop while text is visible. It does not determine reading duration and yields to a meaningful gesture.
Comic performance comes from pose, anticipation, hold, and release. A silent shrug is a real utterance with a real chore and settle, not an empty line or arbitrary delay.
NPC ambient performance uses the same clip data, controller, scheduler, renderer and visibility rules as foreground performance. Behavior scheduling is separate; animation playback is not.
No validator, optimization, or art shortcut may silently substitute an unrelated idle for a required missing clip. Missing required performance is a build error.

# 2. Evidence boundary
The preserved Monkey Island production material describes a costume as an actor's animation set, notes that most human costumes carried walking and talking animations in all four directions, and shows that even clouds could be implemented as an actor with a costume. It also records a late comic simplification: a head turn was replaced by an eye movement because the smaller action played better and saved space. [S1]
ScummVM's SCUMM actor implementation preserves distinct init, walk, stand, talk-start and talk-stop frames, starts a walk animation when locomotion begins, returns to a stand animation at arrival, and treats turning/direction as actor state. Its costume decoder selects animation from direction and frame. The v5 script layer exposes walking, facing, animation, waiting, animation counters and sound as separate script operations. [S2-S4]
The original manual presents the world at 320-pixel-era scale and makes clear that actors are directed through verbs and sentences; it does not substitute animation for readable interaction text. The reference conclusion is functional: a small number of discrete poses, well-timed and explicitly sequenced, carry the performance. [S5]
Consolation already specifies staged interactions, four-direction movement, two drawn sizes, talk loops owned by visible text, and a binding successful-action order. It never defines the chore that connects those systems. [R2-R6]
Functional conclusion  The target is not smooth animation. It is legible intention: feet stay planted, direction is honest, a physical action has contact and recovery, a spoken line owns its loop, and a still frame is held long enough for the joke to land.

# 

3. Chore: the binding definition

## 3.1 What a chore is
A chore is a finite or looping performance authored on an actor's animation track. It says what the body does and when observable performance events occur. It does not itself write puzzle flags, mutate inventory, move an object, or determine line duration.
Frame timing belongs to the clip timeline. Global walkRate, idleRate and reactRate may remain migration defaults only; they are not the final authoring model.
The runtime returns a ChoreHandle with completion, marker, cancellation and final-pose status. Sequence code waits on the handle, never on a separately calculated number of seconds.
An action chore is normally foot-locked. Travel belongs to a walk or authored transition step. If a performance truly translates—coach departure, mount, fall—it declares root motion or object movement explicitly and is tested against the path/prop.
The same named chore may have facing variants with different cell counts, but all variants expose the same required semantic markers and compatible duration bounds.

## 3.2 Minimum chore vocabulary
No silent fallback  A required missing recoil, talk, facing, surface or size is an authoring error. ActorSprite's current fallback to the first available clip can display an unrelated front idle and make a broken build look plausible; remove that behavior for required performances. [R9]

# 4. Performance arbitration

## 4.1 One body track
A speech channel and body track may coexist: text can remain visible while a one-shot gesture owns the body. This is not two body animations.
Prop/effect tracks—Hob's lamp and its face/coat light cells, a carried case, dust, a held object—may run in parallel only when bound to the same actor clock and markers.
Ambient opportunity selection never pre-empts player-driven staging, speech, a reaction, or an action transaction. It defers or drops the opportunity; it does not queue a backlog.

## 4.2 Requests that cross states
Foot-plant rule  A transition from locomotion to acting must not freeze a splayed stride, slide the feet into pose, or rotate and change scale in one rendered frame. The controller reaches a named planted frame, then turns, then acts. [R3, R6]

# 5. Skip, cancel and transaction safety

## 5.1 Line skip
A click that skips the current line advances that utterance only. It does not cancel the exchange, action transaction, room sequence or player route unless a separate input rule says so. [R4]
Neutral talk stops immediately on the speaker's declared closed/settled frame—within one rendered frame. The next speaker's turn/talk may then begin; two speakers do not keep flapping through the handoff.
A line-accompanying gesture follows its skip policy. fastForwardToSettle traverses required contact/commit markers once, omits optional holds, and renders a legal final pose. It never teleports the anchor.
A silent utterance such as a shrug is skipped like one utterance: complete or fast-forward its recover tail, then advance the tree. It may not disappear because its text is null.

## 5.2 Why the successful-action order matters
The binding puzzle order is stage → chore → sound → line → object state → flags → inventory → settle. The ordinary line skip therefore usually occurs after the physical chore has completed. It still must drain the line and commit the remaining state phases exactly once. [R5]
Reserve the transaction and stage walk/face.
Start the action chore and subscribe to markers through its ChoreHandle.
At contact, play the authored sound; finish or settle the physical action.
Present the line. A skip ends talk/gesture performance but does not discard the transaction.
Apply object state, flag writes and inventory mutation atomically in canonical order.
Select the declared end pose, release the controller, admit one queued intent, and return control.

## 5.3 Sequence and cutscene cancellation
SequenceRunner.cancel() must call the animation host for every live ChoreHandle. Clearing only the runner is insufficient: the current Actor.special continues to own the body until its timer expires. [R8, R11]
Whole-sequence skip executes every mustRun/completeOnSkip marker in order, writes stable final state once, terminates talk and loop clips, resolves prop attachments, settles actors, then returns control.
Room unload cancels replaceable ambient performance, serializes only story-relevant stable pose/state, and never saves a half-frame timer. Save/load during an atomic transaction either resumes a declared checkpoint or loads the last stable state.
A cancelled optional reaction writes no gameplay state. An irreversible transaction may not be cancelled after its commit boundary; it completes through settle.

# 

6. Idle system

## 6.1 Thad
Thad's base idle is a quiet held pose. A deterministic, seeded idle program schedules a two-frame breath after roughly 3–7 quiet seconds and a two-frame weight shift after another roughly 5–11 seconds. These are starting ranges to tune at native scale, not historical claims. [R6]
The current six-frame idle authored at a fixed 2.4 fps repeats every 2.5 seconds. Preserve its useful drawn poses, but turn them into sparse activities separated by irregular holds rather than a conspicuous loop. [R13, R14]
Idle time advances only while the actor is eligible. Walk, turn, talk, action, reaction, dialogue choice, menu pause and cutscene ownership suspend it. Resume the deterministic program; do not reset it on every redraw or synchronize it to room entry.
The frame scheduler itself invalidates the actor bounds when an idle frame changes. Currently Actor.update reports no change for clock-derived idle turnover, so GameScene may not redraw Thad until some unrelated cycling or ambient event happens. Fix this before judging the art. [R7, R11]

## 6.2 Crowds, fixed NPCs and phase
Errata 20's crowd rule remains intentionally cheap: a crowd of four or more has at least three animated members; Nugget's eleven drinkers require four. Two-frame postures at slow irregular-looking rates are sufficient when composition and phases differ. [R6]
Use one AnimationController contract. Existing IdleLayer data can migrate through a lightweight adapter, but it may not remain a separate set of playback, pause, visibility and skip semantics.
Each ambient actor derives a deterministic phase/seed from room id + actor id + save seed. Rates and first opportunities differ. Re-entry may resume a stable deterministic schedule; a full room must never restart in lockstep.
An actor painted into the background must not also be drawn as a sprite. The existing duplicate guard in the idle generator is right and must remain. [R15]
Puzzle flags may change dialogue or object state, but may not make an idle begin, stop, point at, face, light, or emphasize the newly relevant element. [R6]
Performance, not busyness  A room satisfies the motion rule with one or more calm, persistent, compositionally appropriate performances. It does not need every figure to loop, and adding more motion can weaken deadpan staging.

# 

7. Direction, scale and anchoring

## 7.1 Four-direction coverage
Do not mirror left into right at runtime. Frame-left lighting, costume asymmetry, props, hands and comic eye direction make mirroring visibly dishonest.
Diagonal paths still choose a cardinal facing by dominant travel direction and retain it until the movement logic crosses its directional threshold. A visible turn uses an authored turn or planted transition; it is not a one-frame sprite swap. [R3]
The older road-to-done phrase 'three sizes, three views' is stale. Binding errata requires four directions and two drawn sizes with continuous decimation plus one measured snap. Current Thad data already follows the latter structure. [R1, R6, R13]

## 7.2 Two sizes and one snap
Near and far source sheets are authored. Above the measured eye-death threshold, continuously decimate the near frame. At the threshold, snap once to the far source whose width matches the curve; continue scaling from that source. [R6, R9, R14]
Every clip reachable across room depth exists in both sources. A fixed-position actor may use one authored source only if its camera/world range never crosses the threshold.
Carry clip id, facing, anchor and normalized phase through source change. Choose the nearest semantically equivalent frame; do not restart a gait, talk loop or reaction at frame zero.
Never change drawn source size and facing on the same rendered frame. Turn first then snap, or snap first then turn, according to the measured crossing and staging. [R6]
Anchor at the feet, not the sprite rectangle. Per-cell trim, hat height, raised arms and recoil must not move the world-space foot point unless root motion is explicitly authored.

# 

8. Talk animation at forty pixels

## 8.1 Visual vocabulary
Use two to four frames at an initial 5–7 frames per second, with asymmetric holds and a clearly closed/settled frame. Tune by rendered readability at 320×144, not by enlarged sprite-sheet appearance.
Front/side talk may use a one-pixel jaw or mouth change plus a restrained head, shoulder or hand variation. Back talk uses head tilt, shoulder, hat or silhouette; do not invent a visible mouth.
The loop conveys 'this actor is speaking,' not phonemes. There is no voice acting and no lip sync. Text duration owns line length; the animation samples its own timeline until the utterance ends. [R4]
Start on a readable speaking pose, avoid mechanical open/closed alternation, and stop through the closed settle. Long text may repeat the loop; a short line may show only one readable change.
If a line has a meaningful one-shot gesture, that chore owns the body. When it settles, neutral talk may continue only if the text is still visible. If a character speaks while walking, walk owns the body.

## 8.2 Speaker handoff
The current speaker's line completes or is skipped.
Its talk/gesture reaches the declared settle and releases the body.
Apply the authored reply pause from the dialogue bible.
Turn the next speaker if needed; then start its text and talk/gesture performance.
Deadpan rule  Do not fill the reply pause with random flapping. Stillness is a performance state. The joke often lives in a held closed mouth, a late eye movement, or one restrained recoil before the reply.

# 

9. Reactions and comic beats

## 9.1 Timeline grammar
Deadpan is usually anticipation reduced, reveal held, recovery unhurried. A fast exchange reduces the reply gap and reaction hold; it does not globally increase animation speed.
A double take may be still → glance → still → second eye/head move. A shrug may be rise → hold → settle. A recoil may shift the body one or two pixels while the foot anchor remains fixed.
Prefer the least animation that reads. The preserved MI1 production note about replacing a head turn with an eye shift is the right functional lesson: economy can improve both comedy and clarity. [S1]

## 9.2 Silent utterances
A silent utterance has speaker, null text, chore, authored duration/holds and the same queue position as speech. It owns the body and participates in skip, pause and sequence completion. [R4]
The dialogue runner waits on the ChoreHandle, not a duplicated silent duration. If a pause is needed after settle, author that as dialogue pacing, not hidden inside a looping clip.
A missing silent chore fails validation. Substituting idle would erase the authored joke while allowing the tree to appear technically complete.

# 

10. NPC and ambient performance

## 10.1 One animation system, two layers of authoring
The animation layer knows clips, tracks, anchors, markers, arbitration, scale, draw invalidation and settling. The behavior layer chooses when an eligible ambient opportunity is offered. Behavior never draws frames directly and animation never decides story relevance.
AmbientPerformance {
  actorId: "driver";
  base: "idle_hold_case";
  opportunities: [
    { clip: "shift_case", waitTicks: [420, 780],
      when: ["notSpeaking", "notInTransaction"] },
    { clip: "straighten", waitTicks: [600, 1100], when: ["notSpeaking"] },
    { clip: "look_road", waitTicks: [500, 900], when: ["notSpeaking"] }
  ];
  seedKey: "stage-road:driver";
  puzzleSignal: false;
}

## 10.2 Binding Room 1 performances
The procedural Room 1 ambient preview already demonstrates lamp and horse ideas, but its own source says the generated GIF is not the shipping mechanism; Hob and the team remain painted into the stage-road background, and stage-road.json has no runtime ambient/idles entries. Wire them as sprites/actors and restore the underlying clean plate. [R16, R19]

## 10.3 Nugget and other crowds
Preserve Nugget's four animated drinkers among eleven and its distinct postures, rates and phases. This already satisfies errata 20's density. Migrate playback to the unified controller without turning all eleven into actors. [R17]
Map seller, letter writer and similar fixed figures can keep two-frame sheets and fixed orientation. They still receive controller pause, visibility, dirty-rectangle and deterministic phase semantics.
Ambient barks use the dialogue queue. An actor does not run a talk loop merely because its behavior clock fired while player-driven text is active; the bark waits or is dropped according to dialogue rules.

# 11. Data model
Author tick counts directly or compile integer milliseconds into 60 Hz ticks. Runtime playback is deterministic and testable; render rate may vary without changing performance timing.
Markers are idempotent per handle. Reaching, fast-forwarding across, or completing-on-skip emits a required marker once; rewinding or repeated cancel cannot emit it again.
Costume data validates variant coverage independently of room behavior. Room data validates that each call site can stage a supported facing/surface/size.
Keep puzzle/world effects outside ChoreDef. A chore marker tells the transaction when contact occurred; the transaction owns sound, line, state, flags and inventory. [R5]
type Facing = "front" | "back" | "left" | "right";
type AnimationRole = "idle" | "walk" | "turn" | "talk" |
  "action" | "reaction" | "transition";
type EndPolicy = "actorBase" | "idle" | "walk" | "holdLast";
type InterruptPolicy = "atomic" | "settleThenInterrupt" |
  "interruptAtMarker" | "replaceable";

interface FrameSpan {
  cell: number;                 // source-sheet cell
  ticks: number;                // integer ticks at 60 Hz
  anchor?: { x: number; y: number };
  markers?: string[];           // contact, sound, release, settle...
}

interface ChoreVariant {
  facing: Facing;
  surface?: "mud" | "boardwalk";
  size: "near" | "far";
  timeline: FrameSpan[];
}

interface ChoreDef {
  id: string;
  role: AnimationRole;
  playback: "once" | "loop" | "pingpong";
  variants: ChoreVariant[];
  requiredMarkers?: string[];
  interrupt: InterruptPolicy;
  skip: "finish" | "fastForwardToSettle" | "cancelToSettle";
  completeOnSkip?: string[];
  end: EndPolicy;
  followUp?: string;
  propTracks?: string[];
}

interface ChoreHandle {
  id: string;
  state: "running" | "settling" | "complete" | "cancelled";
  waitFor(marker: string): Promise<void>;
  finish(reason: "natural" | "lineSkip" | "sequenceSkip" | "roomExit"): void;
}

interface AnimationRuntime {
  actorId: string;
  choreId: string;
  variantKey: string;
  span: number;
  tickInSpan: number;
  normalizedPhase: number;
  worldAnchor: { x: number; y: number };
  queuedIntent?: ActorIntent;
  emittedMarkers: Set<string>;
}

interface IdleProgram {
  actorId: string;
  base: string;
  activities: Array<{ chore: string; waitTicks: [number, number];
    when: Eligibility[] }>;
  seedKey: string;
  reset: "resume" | "onRoomEntry";
  puzzleSignal: false;
}

# 

12. Runtime sequence
Resolve the actor, target, requested verb/held item, staging point and chore id without mutating game state.
Ask AnimationController for a validated variant at the actor's facing, surface and current source size. Failure is explicit; no unrelated fallback.
Reserve the actor body and relevant prop tracks. Suspend the idle program without resetting its seed/phase.
Run walk-to-stage. Finish on a planted locomotion frame, settle feet, perform any size snap and turn on separate rendered frames, then confirm facing.
Start the chore and return a ChoreHandle. Every frame advances timeline ticks, draws the selected cell at the fixed world anchor, emits markers once and invalidates old/new bounds.
At contact/sound markers, notify the sequence/transaction. The transaction—not the animation—plays sound or updates attached props/state in its declared phase.
On natural completion or skip, execute the clip's policy, reach settle, choose the declared return pose and release body/prop tracks.
Continue the binding puzzle or dialogue sequence. On line start, stationary talk owns the body only if no explicit gesture does; on line end it settles within one frame.
Apply stable world/object state, flags and inventory in their canonical order. Admit at most one queued player intent after settle.
Resume eligible idle scheduling from its deterministic state and redraw only invalidated regions. Palette cycles and ambient clocks continue independently of story relevance.
Clock rule  SequenceRunner waits on handles and semantic markers. It never recomputes clip duration from the near sheet, assumes uniform frame rate, or sleeps for a scene-authored duplicate number of seconds.

# 

13. Current-build audit

## 13.1 Already right—preserve these
The procedural Python actor pipeline is deterministic, palette-locked and built for native pixel art. It generates distinct boardwalk and mud walks, readable recoil, near/far sheets and measured eye-death decimation. [R13, R14]
Current Thad content already has two drawn sizes, four facings, six-frame idles, eight-frame walks and four-frame recoil across mud/boardwalk variants. This is materially ahead of the stale three-size/three-view checklist. [R1, R13]
ActorSprite draws crisply, caches decimation and anchors cells at bottom-centre. The renderer already handles actor depth sorting and occlusion. [R9, R18]
SequenceRunner is deterministic and supports walk, wait-for-actor, face, chore, say and wait. GameScene already uses the correct broad staging skeleton: walk, face, chore, say. [R8, R11]
IdleLayer and the generator provide useful two-frame crowd idles, deterministic phases and protection against painting a figure twice. Nugget already uses four animated postures among eleven. [R15, R17]
The Room 1 procedural preview contains concrete lamp-swing and out-of-phase horse-graze studies that can be converted to runtime sprites rather than reinvented. [R16]
At the audited commit, all 42 unit tests and all 24 repository validators pass. They protect useful foundations, but none establishes the chore contract defined here.

## 13.2 Failing the binding contract
Audit verdict  The art generator has the beginnings of a strong costume system. The runtime is the blocker: it can display rows, but it cannot yet guarantee performance, interruption, speaker ownership, settling, or frame-accurate causality.
Local TypeScript type checking was not independently completed during this audit because the workspace's installed dependencies did not include a runnable tsc binary. Unit and validation results above are reported exactly; no typecheck pass is implied.

# 14. What a naive implementation gets wrong
How to tell  Capture native-resolution frame sequences with actor world-anchor overlays and an event trace. If a reviewer needs the 10× sprite sheet to explain the action, the performance has not passed.

# 

15. Migration plan and proof scenes
Introduce ChoreDef, variants, FrameSpan timing, markers, end/interrupt/skip policy, ChoreHandle and AnimationController behind the current Actor API.
Migrate Thad idle, walk and recoil first. Fix idle dirty invalidation, preserve bottom-centre anchoring, and convert the regular idle loop into sparse breath/weight activities.
Replace SequenceRunner's duration wait with handle/marker waits. Propagate line skip, sequence cancel and room unload to the controller; add explicit intent queueing and foot-plant settling.
Add four-direction turn and neutral talk, then reusable reach/use/give/take chores. Remove unrelated required-clip fallback and add call-site coverage validation.
Convert one complete successful puzzle action to the exact stage/chore/sound/line/state/flags/inventory trace, including held-item choreography and skip equivalence.
Build Room 1 as the ambient proof: clean plate; driver, Hob/lamp and horse actors; synchronized prop/effect tracks; calm deterministic scheduling; coach departure transition.
Adapt IdleLayer/ambient two-frame sprites to the shared controller. Preserve Nugget's economical four-of-eleven composition and existing generator duplicate guard.
Migrate remaining animation-list chores by actual call-site priority. Do not generate unused directional art merely to satisfy an outdated checklist; do satisfy every reachable stage.

## 15.1 Required Room 1 demonstration
With palette cycling and every other ambient sprite disabled, Thad visibly breathes and later shifts weight because his own controller dirties the frame.
The driver shifts the case, straightens and looks road at sparse independent opportunities. During a line, only the chosen talk/gesture owns the body; no queued ambient backlog fires afterward.
The horses graze or move their heads at roughly 10–20-second independent intervals, never in lockstep and never in response to puzzle state.
Hob's body, lamp swing and face/coat light remain synchronized through movement, talk, stop and room exit. The painted background contains none of those moving pixels.
Coach departure uses an explicit moving actor/prop transition, resolves attachments and lands in a coherent stable room state on watch, line skip and sequence skip.

# 

16. Automated acceptance checks

## 16.1 Data and coverage
Every ChoreDef has positive integer tick holds, valid cells, a declared anchor, playback, interrupt, skip and end policy. Once clips expose settle; looping clips expose a legal release cell.
Every required marker exists in every reachable variant. completeOnSkip markers are a subset of required markers and emit at most once.
Every Thad idle/walk/turn/talk and reusable arbitrary-target action resolves in all four facings and both drawn sizes for its reachable surfaces.
Every one-off subset-facing chore has call sites whose staging facing is explicit and supported. Fixed actors cannot be moved/scaled outside their declared contract.
No required clip resolution uses sizes.clips[0], another role, another surface or another facing as a silent fallback.
A near/far transition preserves chore id, facing, world foot anchor and normalized phase within one source-frame tolerance. Facing and source-size snap never change on the same rendered frame.
Palette validation proves every cell uses the locked palette; procedural generation is deterministic byte-for-byte for a fixed seed/tool version.

## 16.2 Arbitration, interruption and timing
At most one body owner exists per actor. Talk, idle, walk and chore cannot simultaneously advance body cells; declared prop/effect tracks share the actor clock.
Chore requested during interaction walk begins only after arrival, a planted frame and facing. Forced mid-walk chore and new walk mid-chore follow declared policy and never produce foot drift or a hidden path.
Sequence cancel, line skip, whole-sequence skip and room unload leave no live special/talk/loop handle. The actor reaches a legal settle and accepts the next permitted intent.
Watching versus skipping a successful line yields identical object state, flags, inventory, attachments, actor final pose and emitted transaction markers. Each commit marker occurs once.
A frame trace for a successful action is stage → planted → face → chore/contact → sound → chore settle → line/talk → line settle → state → flags → inventory → control.
Changing render cadence between 30, 60 and irregular frame delivery does not change tick-defined marker order or stable final state.

# 

16.3 Idles, dialogue and scene proofs
With no palette cycle or other dirty source, Thad's idle frame transitions invalidate exactly his old/new bounds and appear at their scheduled times.
Thad's breath and weight-shift activities occur on deterministic irregular intervals, suspend under higher ownership and resume without resetting to room-clock phase.
Nugget has eleven drinkers, four animated members, at least four authored postures and distinct phases. No figure exists in both background and sprite layers.
Talk begins with the visible utterance, loops independently of reading duration, yields to a gesture, and reaches the closed settle within one rendered frame of line completion/skip. The previous speaker stops before the next starts.
A silent shrug blocks dialogue advancement until its handle settles; line skip fast-forwards legally, and a missing shrug fails content validation.
Room 1 runtime contains explicit driver, Hob/lamp and horse performance entries; the shipping scene does not rely on the preview GIF or painted moving figures.
Hob's lamp/body/light cells share markers; horse opportunity times are 10–20 seconds and phase-offset; driver ambient opportunities never pre-empt or backlog behind player dialogue.
Static and dynamic scans prove that puzzle flags and item possession do not gate ambient motion, animation rates, phase, facing, light or salience except where a canonical physical state change necessarily removes/transforms the performer.
Native 320×144 captures prove each required action reads at 1× scale. Enlarged sheets are diagnostic only and cannot be the acceptance artifact.

## 16.4 Existing regression suite
Retain the current 42 unit tests and 24 validators. Add animation tests; do not replace movement, dialogue, puzzle, room, palette, inventory, save/load or deterministic-generation coverage.
Restore and run the repository's TypeScript typecheck in a complete dependency installation before merge. The audit's missing local tsc binary is not a waiver.

# 

17. Human playtest protocol
Test at native 320×144 presentation and normal game scale. Record video and input, but ask the player before showing slowed or enlarged footage.
When Thad stops walking to act, did his feet feel planted? Did you notice a slide, pop, wrong-facing pose or scale jump?
Without reading the verb line, what physical action did Thad just perform? Which frame or hold made it readable?
Did any animation feel too smooth, too busy, too repetitive or too fast to read? Did any still moment feel purposeful rather than broken?
During dialogue, who was speaking at every moment? Did one speaker keep moving after another answered? Did short and long lines both feel natural without voice acting?
When you skipped a line, did the body or prop jump? Did the conversation advance one line, and did the world still end in the expected state?
Describe the shrug/double take/recoil joke. Was the laugh in the movement, the held pose, the pause, the line, or their order?
After standing still twice in the same room, did Thad seem alive without appearing restless? Did his idle feel like a repeating loop?
Which people or animals moved in the room? Did any two appear synchronized? Did any movement make you assume an object or person was puzzle-important?
Could you tell Hob's lamp belonged to his hand/body rather than to the background? Did its swing and light remain coherent while he crossed and stopped?
Did the driver's case shift, posture and road glance enrich the wait without competing with the conversation?
Did the horses feel calm and independently alive? Did their motion persist as ordinary world behavior rather than an instruction?
Walk Thad across the measured size threshold while talking or in a long animation. Did the pose, phase, facing or feet visibly pop?
At 1×, can you distinguish idle, talk, listen, recoil, reach and use? If not, which silhouettes collapse together?
After rapidly clicking walk, interact, skip and another walk, did the character ever ignore input, resume an old route or remain secretly busy?
Pass standard  A naive player can read intention, speaker and contact at native scale; comic holds land; feet and props remain coherent; skip never damages state; the room feels alive without teaching puzzles through motion.

# 

18. Copy-paste directive for Claude
Use this instruction with the repository  Treat this document as binding for character animation and performance. Preserve canonical writing, puzzle order, movement, palette, procedural art and existing correct foundations. Implement the grammar; do not import Monkey Island content.
Before editing, inspect docs/15-road-to-done.md,
docs/22-scumm-deep-dive.md section 6, docs/29-movement.md,
docs/30-dialogue-pacing.md, docs/31-puzzle-feel.md,
docs/00-errata.md rulings 20, 24, 35, 38, 44, 45 and 48,
Actor.ts, Sequence.ts, ActorSprite.ts, IdleLayer.ts, Ambient.ts,
Renderer.ts, GameScene.ts, types.ts, content/actors/thad.json,
content/rooms/stage-road.json, content/rooms/nugget.json, and the
procedural actor, idle and Room 1 ambient generators.

Treat the Character Animation and Performance Bible as binding.

1. Produce a current-code gap table against sections 3-16. Preserve
   everything in section 13.1.
2. Replace clip-name-plus-seconds with ChoreDef variants, per-frame tick
   holds, anchors, semantic markers, interrupt/skip/end policy, a
   ChoreHandle and one AnimationController.
3. Make SequenceRunner wait on handles/markers. Propagate line skip,
   sequence skip/cancel and room unload. Never leave an orphaned Actor
   special or talk/idle loop.
4. Implement explicit body arbitration and intent queueing. Stage every
   ordinary action through walk, planted foot, turn, chore and settle.
5. Fix idle dirty invalidation. Convert Thad's regular idle loop into
   sparse deterministic breath and weight-shift activities.
6. Add four-direction turn and neutral talk plus reusable action chores.
   Validate both drawn sizes/surfaces at every reachable call site.
   Remove unrelated required-clip fallback.
7. Preserve the binding successful-action order: stage, chore, sound,
   line, object state, flags, inventory, settle. Held-item actions retain
   choreography; line skip commits the identical result exactly once.
8. Build Room 1 as the proof: clean plate; driver case/posture/road
   performance; Hob body/lamp/light synchronization; phase-offset horse
   grazing; coherent coach departure. Do not ship the preview GIF.
9. Adapt crowd/ambient two-frame playback to the same controller while
   preserving Nugget's four-of-eleven economy and duplicate guard.
10. Add every automated check in section 16 and run section 17's naive
    native-resolution playtest.

Motion is never information. Do not gate or emphasize ambient motion by
puzzle relevance, item possession, attempt count or inactivity. Do not
mirror directional art at runtime, animate every figure, author uniform
FPS loops, snap a skipped chore to an unsafe frame, or redraw the whole
screen to conceal invalidation bugs.

Do not call the work complete because rows display or tests compile.
Demonstrate native-resolution frame traces for Thad idle, one dialogue
handoff, one silent shrug, one held-item puzzle success with line skip,
the depth-size threshold, and Room 1's ambient cast. Report unsupported
chores/facings explicitly; never substitute idle.

# 

Sources
[S1] Video Game History Foundation: The Secrets of Monkey Island's Source Code. Primary-source production material; costume/directional coverage, actor-as-animation abstraction, unused actions, and the smaller eye-movement comic revision.
[S2] ScummVM SCUMM actor implementation. Executable reference for distinct walk, stand, talk-start/talk-stop, facing and arrival behavior.
[S3] ScummVM SCUMM costume implementation. Executable reference showing direction and frame as inputs to costume animation selection.
[S4] ScummVM SCUMM v5 script implementation. Executable reference exposing separate walking, facing, actor animation, wait, animation-counter and sound operations.
[S5] The Secret of Monkey Island original manual. Primary player-facing reference for native-era interface, directed actions and text-first interaction.
[S6] The SCUMM Diary: stories behind the engine. Historical engineering context for scriptable rooms, actors and extensible adventure-game behavior.
[R1] Consolation road to done. Current animation production list; its older three-size/three-view wording is superseded by errata.
[R2] Consolation SCUMM deep dive. Staged interaction and costume/chore inventory; it names but does not define a chore.
[R3] Consolation movement bible. Four-direction performance, foot anchoring, turning, scale continuity and native-resolution tuning.
[R4] Consolation dialogue pacing bible. Talk ownership, line skip, silent shrug and speaker pacing.
[R5] Consolation puzzle-feel bible. Binding successful-action performance order and transaction skip safety.
[R6] Consolation errata. Crowd idles, two-size/four-direction rules, ambient performers, motion-never-information, and binding-doc rulings.
[R7] Consolation Actor. Current clip, timer, walk, turn, frame and special-action behavior.
[R8] Consolation Sequence runner. Current deterministic step runner, chore-duration wait and cancellation boundary.
[R9] Consolation ActorSprite. Current two-source rendering, decimation, bottom-centre draw and permissive clip fallback.
[R10] Consolation engine types. Current ActorClip, ActorFile, ambient sprite and idle figure schemas.
[R11] Consolation GameScene. Current staging, duration calculation, dirty invalidation, interaction cancellation and idle updates.
[R12] Consolation IdleLayer. Current economical two-frame fixed-figure playback.
[R13] Current Thad costume data. Current four-facing, near/far, surface-aware idle, walk and recoil clips.
[R14] Procedural actor generator. Current walk, idle, recoil, surface variation, decimation and eye-threshold generation.
[R15] Procedural idle generator. Current two-frame idle generation, deterministic seeds and duplicate-painted-figure guard.
[R16] Room 1 ambient preview generator. Current non-shipping lamp/horse animation study and explicit remaining wiring step.
[R17] Nugget room data. Eleven-drinker composition with four phase-offset animated postures.
[R18] Consolation Renderer. Current depth sort, occlusion and sprite composition.
[R19] Room 1 stage-road data. Current room data lacking runtime Hob, driver and horse ambient actors.
Evidence note: Historical sources establish functional grammar. The exact schema, timing defaults, arbitration order, migration plan and acceptance tests are original requirements for Consolation, not claims about literal 1990 source identifiers.

**Table 1**

| Required field | Contract |
|---|---|
| id / role | Stable content id plus semantic role: locomotion, turn, talk, reaction, action, idle or transition |
| coverage | Declared facings, surfaces and drawn sizes; every reachable call site must be satisfiable |
| timeline | Ordered frame cells with integer 60 Hz tick holds; repeated cells may be explicit holds |
| anchor | Named foot/world anchor per cell; default bottom-centre; anchor drift is validated |
| playback | once, loop or ping-pong; action/reaction defaults once, talk/idle may loop |
| markers | Named boundaries such as contact, sound, release, safeInterrupt and settle |
| interrupt | atomic, settleThenInterrupt, interruptAtMarker or replaceable |
| end | returnTo idle, returnTo walk, holdLast, named follow-up, or actor-declared base pose |
| skip | finish, fastForwardToSettle, or cancelToSettle plus complete-on-skip markers |

**Table 2**

| Actor class | Required performances |
|---|---|
| Thad, reusable | idle, walk, turn, neutral talk, reach-low, use-waist, use-overhead, give, take; all reachable cardinal facings |
| Thad, authored | tuning fork, glance, double take, recoil, listening hold, arrival/departure and scene-specific reactions |
| Speaking NPC | base idle, neutral talk, at least one listen/reaction settle; directional breadth follows actual blocking |
| Fixed crowd/animal | base pose plus authored two-frame or short activity clip; fixed facing/size is allowed when position is fixed |
| Prop-linked actor | body performance plus synchronized prop/effect cells or markers; one authoritative clock |

**Table 3**

| Priority | Body owner | Rule |
|---|---|---|
| 1 | Atomic scripted/action chore | Owns the body through its required marker/settle; semantic effects remain in the transaction |
| 2 | Turn / walk / transition | Owns feet and facing; walking speech does not add an independent mouth loop |
| 3 | Gesture or reaction with line | Replaces neutral talk while it performs; may settle into talk if text remains |
| 4 | Stationary talk | Loops only while that speaker's text is visible |
| 5 | Idle | Runs only while no higher owner claims the body |

**Table 4**

| Request | Binding result |
|---|---|
| Chore during ordinary walk-to-interact | The sequence waits for arrival, planted foot and facing, then starts the chore |
| Forced chore during free walk | Stop at the next safe foot plant, cancel remaining path unless explicitly preserved, turn if authored, then perform |
| Ambient chore during walk/talk/action | Drop or defer without accumulating; choose another opportunity later |
| Walk during replaceable idle/talk | Settle within one frame, start the turn/walk, preserve text if dialogue rules allow |
| Walk during reaction | Follow clip policy: fast-forward recovery to settle, then begin walk |
| Walk during atomic action | Queue the destination; begin only after the required marker, transaction phase and settle |
| Second chore during chore | Reject, queue one declared follow-up, or replace at safeInterrupt; never layer two bodies |

**Table 5**

| Performance | Coverage requirement |
|---|---|
| Thad idle / walk / turn | front, back, left, right; mud and boardwalk where locomotion differs |
| Thad neutral talk | all four; back may use head/shoulder silhouette rather than mouth pixels |
| Reusable use / reach / give / take | all four whenever arbitrary targets can stage in all directions |
| One-off authored reaction | Only staged facings are allowed, provided every call site declares and validates the facing |
| Fixed NPC / crowd / animal | Only actual blocked orientation and size; the actor may not later move outside that contract |

**Table 6**

| Beat | Animation obligation |
|---|---|
| Anticipation | A brief readable preparation only when the action needs it; no generic wind-up on every verb |
| Action / change | The smallest pose change that makes intention legible at native scale |
| Contact / realization | A named marker for sound, prop handoff or semantic reaction; not a guessed frame index in scene code |
| Hold | An explicit duration on the revealing pose; duplicated cells are allowed but timing remains data |
| Recovery | A short path to a stable facing/anchor, then the declared return pose |

**Table 7**

| Performer | Authoring and scheduling contract |
|---|---|
| Driver | Idle while holding/near the case; shift case, straighten and look road as sparse eligible chores. During speech, talk or a specific gesture owns the body. Departure resolves case/coach attachment. |
| Hob | Crosses under movement staging while one synchronized clock drives body, lamp swing and face/coat light cells. The lamp is a prop/effect track, not a full-screen animated background. |
| Horse team | Separate fixed actors with calm base poses; graze/head activity opportunities every roughly 10–20 seconds, phase-offset. Coach travel uses an authored transition and coherent settle/unload. |
| Thad | Walk, planted turn, action/reaction/talk and sparse idle through the same controller. Suitcase possession is state/prop attachment, not a second body animation system. |

**Table 8**

| Gap | Current evidence | Required correction |
|---|---|---|
| Chore is only timer | Actor.special stores clip, startedAt, seconds; types have global rates only | Add timeline, markers, anchors, policies, end state and handle |
| Runner guesses duration | GameScene derives seconds from near frame count/reactRate | Wait on ChoreHandle/marker; variant owns timing |
| Cancellation is orphaned | Sequence cancel clears runner; Actor.special survives and blocks body | Propagate cancel/skip and settle through controller |
| Implicit cross-state queue | walkTo during special writes a path that waits silently; react mid-walk freezes then resumes | Use explicit intent/arbitration and foot-plant policy |
| Turn is a timer | Facing changes immediately and holds 0.2 s; no transition frames | Author planted directional transition or validated discrete turn |
| Idle redraw defect | Idle frame comes from wall clock but Actor.update does not dirty the actor | Schedule next frame boundary and invalidate bounds |
| Idle rhythm too regular | Six cells loop at 2.4 fps, about 2.5 s | Split breath/weight shift into sparse deterministic activities |
| Talk missing | No neutral talk clips/controller ownership for Thad or NPCs | Author small loops, speaker handoff and gesture arbitration |
| Silent bad fallback | Missing clip can fall through to sizes.clips[0] | Fail validation for required coverage; explicit optional fallback only |
| Held-item chore suppressed | GameScene skips target reaction when a held item exists | Select item-target action chore; preserve doc 31 order |
| Room 1 motion is preview | Animated GIF is non-shipping; Hob/team stay painted; room JSON has no ambient actors | Create clean plate and wire actor/prop clips |
| Two animation systems | Actor, IdleLayer, ambient sprite and preview GIF have different clocks/semantics | Unify playback/controller; keep lightweight behavior adapters |

**Table 9**

| Naive choice | Visible symptom / detection |
|---|---|
| Every clip is uniform FPS | Comic holds vanish; walk, talk and recoil all feel metronomic |
| Every activity loops | Shrugs repeat, crowds twitch, actions never settle, stillness disappears |
| Clip name + seconds | Scene and sheet disagree; cancel leaves an invisible busy actor |
| Runtime mirroring | Light, props, hands and costume details flip; left/right acting feels counterfeit |
| Rectangle anchoring | Hat/arm/recoil changes make feet bob or slide |
| Arbitrary mid-stride stop | The actor freezes on split feet, glides into use pose, then resumes wrong phase |
| Reset idle on redraw/entry | Actors synchronize or never reach the second idle activity |
| Talk plus gesture loops | Mouth flaps through the shrug and after another character answers |
| Missing clip falls to idle | The script advances, but the physical joke/action silently disappears |
| Cancel runner only | The next click appears ignored until the old special timer expires |
| Skip snaps to end cell | Actor/prop teleports; commit marker may be missed or doubled |
| Animated full background | Occlusion, scaling, input, save state and prop synchronization cannot compose |
| Motion signals relevance | Players solve by waiting for something to wiggle, violating errata 35e |
| Animate at enlarged zoom | One-pixel facial chatter looks expressive large and noisy at 320×144 |
| Redraw every frame | Correctness appears to improve by brute force while dirty-region semantics remain broken |