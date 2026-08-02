> **Provenance.** Produced by ChatGPT from the Monkey Island manual, Ron Gilbert's 1989 design essay, the ScummVM source, and an audit of this repository at `c19beba`, at Tyler's direction, 31 July 2026. Pushed substantially as received.
>
> **Status: binding.** See errata 48.

---

BINDING IMPLEMENTATION FIELD GUIDE
Puzzle Feel and Player Feedback
Monkey Island puzzle grammar for The Last Claim in Consolation
Prepared for Claude as an implementation, content, and QA contract
Functional reference: The Secret of Monkey Island (1990)
Repository audit: main at c19bebad66ca07ac83342c87aef8b3782a394659
Scope: puzzle advertisement, response gradients, success performance, near misses, three-trial pacing, recoverability, tension, data, runtime, and tests

# How to use this guide
Status  This guide is binding for puzzle feel and player feedback. It does not replace the canonical puzzle graph, combination writing, room content, dialogue, or errata. It defines what the player must perceive when those systems run.
Claude must preserve canonical puzzle solutions and prose. Change the engine contract and author missing performance metadata; do not redesign the game around the current runtime's limitations.
The Secret of Monkey Island is a functional reference, not a source of characters, jokes, art, code, or puzzle content. Copy the grammar of legible problems, authored reactions, safe experimentation, and rewarding state change—not protected expression.
The requirements below are original Consolation rules inferred from the reference, the repository, and the project's stated intent. Citations establish the evidence boundary; they do not claim that every named enum or sequence existed verbatim in 1990.
Two invariants  There is no hint system and there never will be. Roughly forty percent of selectable dialogue options—and many authored item combinations—do nothing mechanically on purpose. They are the product. Neither category may be labeled, highlighted, scored, or 'fixed' into progress content.

# 1. Executive contract
A puzzle becomes thinkable before its solution becomes useful: the player first encounters an unresolved condition, contradiction, desire, or obstruction in the world.
Feedback is semantic, not merely verbal. WRONG, COMIC_NOOP, PLAUSIBLE_WRONG, RIGHT_TOO_EARLY, NEAR_MISS, and SUCCESS are distinct authored outcomes with different permissions and performance expectations.
A successful action performs in this visible order: chore, sound, line, object/world state change, flag writes, inventory mutation. Walk and face staging may precede the chore; downstream unlock and autosave follow the stable commit.
A near miss confirms the player's hypothesis without naming the answer. A funny dead end rewards curiosity without implying progress. No UI badge, color, glint, animation emphasis, quest entry, or hint text distinguishes them.
Stateful hotspots may become more informative later, but their visual salience does not change merely because they became useful. Changed knowledge or world state earns a changed response when the player acts.
Act II keeps three trials concurrently present through geography, people, consequences, and cross-trial materials—not reminders. Being stuck in one lane must leave two other intelligible lanes open.
No-dead-ends must be felt through consistent recoverability: items remain obtainable, failures remain reversible, conversations remain revisit-able, and the game never trains the player to save-scum.
There is no death, timer, game over, or unwinnable state. Tension comes from social exposure, accumulating complications, delayed revelations, performance, and comic cost—not threatened loss of the player's time.
Every critical solution has a specific authored outcome. A pool response may entertain, but it may never silently solve a puzzle or impersonate a near miss.
A puzzle is not complete because graph reachability passes. Completion requires player-visible causality, transactional effects, recovery tests, and a naive playtest proving the problem and result were understood.

# 2. Evidence boundary
The 1990 manual describes named objects, sentence construction, experimentation, finding connections among objects, places and people, and a design philosophy oriented toward entertainment rather than punishment. It also tells a stuck player to pursue another puzzle. The manual's external hint-book references are historical and are explicitly rejected for Consolation. [S1]
Ron Gilbert's 1989 design essay argues that the player should encounter the problem before the solution, that experimentation should not lead to death or lost inventory, that puzzles should advance the story, that progress should yield incremental reward, and that several open problems keep a stuck player moving. [S2]
The preserved Monkey Island source and production material show iteration: a more mechanical ants-and-idol idea was replaced with a staged comic sequence. ScummVM's v5 interpreter exposes separate operations for sentence execution, printing, sound, object state, ownership, pickup, scripts, waits, and walking. The safe inference is that puzzle meaning came from authored sequences of separable actions and effects—not from one generic refusal channel. This is an inference, not a claim that every MI1 puzzle used the exact Consolation order below. [S3-S5]
The repository already states the right high-level doctrine: nothing essential is destroyable, Act II's trials are independent, timed failures are forbidden, meaningful state changes need visible or audible confirmation, and graph validation does not prove clue perceptibility or satisfying payoff. [R1, R6, R7]
Functional conclusion  Monkey Island feel does not come from obscurity. It comes from a clear world problem, freedom to form hypotheses, specific reactions to those hypotheses, and a performed payoff that makes causality legible.

# 

3. How the player learns a puzzle exists

## 3.1 Problem-before-solution contract
The first encounter must establish an unresolved world fact, not merely expose a clickable noun. Acceptable forms are: blocked access; an NPC's unmet desire; a broken or contradictory system; a visible consequence with an unknown cause; or a sensory regularity the player can test.
The problem is described in period language by scenery, action response, conversation, or repeated sound. It is never restated in a quest log, checklist, objective toast, hint button, highlighted hotspot, special cursor, pulsing animation, or camera push.
For a critical-path puzzle, author at least two independent knowledge sources unless the puzzle is explicitly self-teaching through a continuous response gradient. One source may establish the problem; another may establish a property of the world or tool. They must not repeat the same sentence in two places.
At least one advertisement remains available until success. A one-shot bark or missable cutscene cannot carry the only statement of a critical problem.
Encounter ordering is validated: the unresolved condition must be reachable before, or no later than, the first moment the player can reasonably infer the solution item's relevance. Possessing a tool early is allowed; the world still supplies a later 'light goes on' problem.
The player may be uncertain which facts connect. They may not be uncertain whether the world contains any unresolved condition at all.

## 3.2 Advertisement patterns
Hotspots are vocabulary, not objectives  A named/selectable object means Thad can act on it. It does not promise a puzzle, and it must not become visually louder when it becomes load-bearing. This protects both comic no-ops and future-use objects. [R3, R8]

# 

4. The response gradient
All selectable actions must resolve, but they need not all progress. The engine must classify the authored intent before it chooses presentation and effects. A line alone is insufficient because identical rendering makes every hypothesis feel equally wrong.
Outcome classes are authoring and QA semantics. Do not display their names, colors, icons, meters, or confidence values to the player.
PLAUSIBLE_WRONG is not automatically a near miss. A near miss must preserve a productive hypothesis; a plausible failure may instead teach why that entire approach cannot work.
RIGHT_TOO_EARLY is authored only when the action would solve the puzzle after a known prerequisite. It must not become a universal 'come back later' pool.
COMIC_NOOP is a successful entertainment beat. Validators protect it from accidental progress; they do not demand that it teach, foreshadow, or apologize for doing nothing.

# 

5. Successful puzzle actions

## 5.1 Binding visible order
Stage: reserve the action transaction, lock conflicting input, walk to the authored point, and face the target. Staging is not a puzzle result.
Chore: perform the physical verb—place, pry, pour, tune, hand over, listen, stamp, or manipulate. A held-item action must not suppress its chore.
Sound: play the contact or consequence cue at the authored chore marker. If the cue carries information, supply an equivalent visual response.
Line: Thad or the affected character delivers the authored response using the dialogue bible's speaker, reading, and skip rules. The line states observation or attitude; it does not narrate hidden flags.
Object/world state: after the line drains, apply the visible stable change—open, cold, moved, repaired, absent, revealed, or newly traversable.
Flag writes: write puzzle and story facts exactly once, after the visible state exists. Apply counters/additions atomically with them.
Inventory mutation: give, remove, transform, or re-home items last. If an item leaves inventory, the visible performance must show where it went or why it changed.
Settle: apply downstream availability, clear the transaction, persist at the stable state, then return control. Skipping the line commits steps 5-8 exactly once; it never cancels or doubles the result.
Why the order is binding  The player sees cause before consequence. The current build writes flags inside resolution and applies state/inventory before the line is finished, making success mechanically true before it has been performed. That must be reversed.

## 5.2 Confirmation minimum
Every success changes at least one persistent thing the player can perceive on the same screen or on the immediately revealed destination: sprite/object state, access, inventory, actor location, dialogue stance, or a durable sound/visual condition.
A spoken 'that worked' over an unchanged room is not sufficient. A silent state change with no chore, sound, or line is not sufficient unless silence is explicitly the authored payoff and the state change is unmistakable.
No success may fall through a global or item pool. Every success has a named action ID, puzzle ID, performance, commit bundle, and recovery contract.
The engine records an ordered trace in test builds: reserve, chore, sound, lineStart, lineEnd/skip, state, flags, inventory, settle.

# 

6. Near misses and authored dead ends

## 6.1 A5 as the proof puzzle
Doc 02's raccoon problem is the canonical demonstration. Bait attracts three more raccoons; smoke keeps Thad out; Pratt is bitten and turns against Thad. The real solution blocks the draught with the horse blanket, making the hole cold so the raccoon leaves. These are not four interchangeable refusals. [R1]
The first three responses may escalate in authored order, but the engine must not infer them from how long the player has been stuck. They trigger only from the named actions. An attempt counter is narrative state, not a hidden hint timer.

## 6.2 Protecting the forty percent
Authored combination pairs that do nothing remain first-class content. Keep the existing specific-pair → item pool → global pool resolution order. Do not mass-author pairs merely to avoid a pool. [R2]
A comic no-op requires a written line and zero progress effects. It may have a small chore or reaction if that is the joke; it must not borrow the distinctive sound, state change, or escalation reserved for a near miss.
The game does not tell the player 'dead end' or 'right track.' The distinction emerges from causal specificity: a near miss changes or tests the obstacle; a joke comments on the attempted relationship and returns the world unchanged.
Repeat variants may improve or cap a joke without adding mechanical value. The last authored repeat clamps; repetition is never converted into a hint.

# 

7. Objects that become interesting later
Keep the same hotspot name, geometry, default verb, and ordinary visual weight across acts unless the world itself visibly changed. Future relevance never creates a glint, bob, outline, special animation, cursor, sound sting, or camera emphasis. Errata 35e forbids motion as information. [R3]
Branch the response on facts Thad has learned and on honest world state. In Act I he may notice the current material or social fact; in Act III he may test a newly meaningful property. Neither line should announce that the object has 'become important.'
If the physical object state changes, each state needs its own lines under errata 19a. If only player knowledge changes, preserve visual identity and change the interpretation only when the player acts.
A hotspot that does not yet exist is not an inert hotspot. Create it only when the physical thing exists in the scene. Conversely, do not delete an old hotspot solely to reduce experimentation.
Critical later use needs an earlier ordinary reason for the object's presence. Foreshadowing may be mundane, comic, or atmospheric; it must not read like a deposited puzzle token.
Canonical tone test  Doc 05 requires three load-bearing LISTEN lines to be indistinguishable in emphasis from ordinary lines. The same rule applies here: content earns meaning through connection, not presentation priority. [R8]

# 

8. Pacing the three Act II trials
The three trials are parallel lanes, not a quest checklist. The player should be able to name their unresolved people/places from memory because the world remains available and reactive—not because the UI remembers for them. [R1, S1-S2]
At every stable Act II state before all trials are complete, at least one unsolved lane must expose a reachable problem advertisement. If one lane is temporarily blocked by knowledge or material, the other two remain explorable.
B6's required counters from the other trials are an authored interlock, not a reason to close the trial. Its arithmetic must remain unblockable under errata: B5 contributes four, Winnie five, Pratt six, totaling the mandatory fifteen. [R1, R3]
Do not react to attempt count, elapsed time, room loops, cursor wandering, or low progress with increasingly explicit reminders. Escalation occurs only when the player performs authored escalating actions such as A5's three failed approaches.

# 

9. No dead ends as a felt property
A graph can prove that some winning route exists; it cannot make the player trust the game. Trust is learned from repeated, visible consistency.
Every inventory-removal effect declares one of: consumed safely after solution; transformed into another owned item; placed as a recoverable world object; transferred to a reachable owner; or permanently surrendered only after it has no remaining use.
A refusal may say 'not now' only when a later valid condition exists. Generic pools must not imply permanent failure, hidden deadlines, or item damage.
Early puzzles should visibly return a misused object and allow immediate retry. This establishes the contract before later puzzles ask for bolder experiments.
No solution depends on an ambient one-shot, an exhausted comic option, a precise action during animation, a timer, or an unrecoverable room transition.

# 

10. Tension without death, timers, or lockouts
Use social exposure: Thad may look foolish, annoy Pratt, reveal ignorance, lose face, or incur a funny obligation. The relationship can remember the beat without closing the winning route.
Use complication: a plausible attempt creates more raccoons, makes a room temporarily unpleasant, attracts an audience, or adds a second chore. Complication expands performance; it does not consume a finite chance.
Use delayed revelation: the player understands the consequence after a line, object change, or later conversation. Withholding meaning is allowed; withholding the fact that anything happened is not.
Use commitment in staged scenes: once a success transaction begins, control can remain locked through the punchline and consequence. This produces dramatic inevitability without real-time failure.
Use stakes in story and identity: what claim Thad proves, whom he embarrasses, what the town believes, and what institutional absurdity is exposed. Do not counterfeit urgency with countdown language unless it has no mechanical deadline and cannot mislead the player.
Failure is material for comedy and characterization. It is not punishment by replay, lost progress, death animation, or unwinnable save.

# 

11. Binding data model
type PuzzleFeedback =
  | 'comic_noop' | 'wrong' | 'plausible_wrong'
  | 'right_too_early' | 'near_miss' | 'success';

interface PuzzlePerformance {
  walkTo?: PointRef;
  face?: FacingRef;
  chore: ChoreRef;                 // success and near miss required
  sound?: { cue: SoundRef; atMarker?: string; accessibleVisual?: FxRef };
  line: UtteranceRef;              // canonical content ID, not duplicate prose
  postBeatMs?: number;
}

interface PuzzleEffects {
  objectStates?: Record<ObjectId, string>;
  set?: Record<FlagId, boolean | number | string>;
  add?: Record<FlagId, number>;
  give?: ItemId[];
  remove?: ItemId[];
  transform?: Array<{ from: ItemId; to: ItemId }>;
  rehome?: Array<{ item: ItemId; ownerOrRoom: string }>;
  unlocks?: string[];
}

interface PuzzleAction {
  id: string;
  puzzleId?: string;               // omitted for pure entertainment pairs
  verb: VerbId;
  item?: ItemId;
  target: ObjectId;
  when?: Condition;
  feedback: PuzzleFeedback;
  intent?: string;                 // author/QA note, never shown
  performance: PuzzlePerformance;
  commit?: PuzzleEffects;
  attemptTrack?: { id: string; stage: number; clampAt: number };
  recovery?: RecoveryContract;
}

interface PuzzleAdvertisement {
  id: string;
  puzzleId: string;
  availableWhen: Condition;
  observedFact: FlagId;
  source: { kind: 'room'|'object'|'dialogue'|'sound'|'consequence'; ref: string };
  persistentUntilSolved: boolean;
  noUiSignal: true;
}

interface PuzzleDefinition {
  id: string;
  goalFact: FlagId;
  advertisements: string[];
  prerequisites: Condition;
  solutions: string[];
  productiveHypotheses?: string[];
  recoveryPaths: RecoveryContract[];
  parallelLane?: 'trial-a'|'trial-b'|'trial-d';
}

interface PuzzleTransaction {
  actionId: string;
  phase: 'reserved'|'chore'|'sound'|'line'|'state'|'flags'|'inventory'|'settled';
  commit: PuzzleEffects;
  committed: boolean;
}

## 

11.1 Data invariants
Keep line text in canonical content files and reference it by ID. Do not duplicate prose in the puzzle graph, combination table, and room response arrays.
COMIC_NOOP and WRONG normally omit commit. PLAUSIBLE_WRONG and NEAR_MISS may write only declared reversible scene/attempt state. RIGHT_TOO_EARLY may write an observed fact only when the performed action truly revealed it. SUCCESS requires a commit and recovery contract.
PuzzleTransaction is save-safe and idempotent. If serialization during a locked sequence is unsupported, forbid saving until settled; line skip still completes the same transaction.
Generic verb and item pools remain ResponseRule content and are implicitly non-progressing. They are not converted into hundreds of PuzzleAction records.

# 

12. Runtime sequence
Resolve room, target, selected verb, and held item without mutating state. Evaluate the most-specific authored PuzzleAction first; otherwise preserve current target override, item pool, and global pool precedence.
Evaluate when. If the solution relationship matches but its prerequisite does not, resolve an authored RIGHT_TOO_EARLY branch; never silently fall through to a generic pool.
Validate effect permissions for the feedback class. Reject a no-op with puzzle flags, a near miss with solved state, or a success without persistent confirmation.
Reserve PuzzleTransaction and lock conflicting input. Record the resolved action ID and immutable commit bundle; do not apply it yet.
Walk to and face the authored interaction point. Cancel safely before chore only if pathing cannot complete; no effects have occurred.
Perform chore. At the authored marker, play sound and its information-equivalent visual response where required.
Queue the authored line through the dialogue presentation system. A player skip drains the line but does not skip the transaction's remaining phases.
After line completion, apply object/world states and render at least one frame with the stable visible result.
Apply flag writes/additions atomically, then inventory give/remove/transform/re-home effects. Each phase is idempotent and advances the transaction marker.
Apply downstream unlocks, emit the ordered test trace, autosave only at the stable state, clear held-item mode if appropriate, and release control.
For non-progress outcomes, settle after their authorized reversible/attempt effects. Return the player to the same open puzzle space without a hint, objective update, or punitive delay.

# 

13. Current-build audit

## 13.1 Already right—preserve these
VerbSystem resolves authored combinations before item pools and global pools, matching doc 24's specificity order.
Pool selection rotates deterministically without immediate repetition, and authored repeat arrays clamp at their last variant.
Target-specific overrides and state-gated response rules already take precedence over general fallbacks.
GameScene stages ordinary interactions with walk, face, optional reaction chore, then speech. This is the correct skeleton for the richer transaction.
ResponseRule already supports object state, take, flags, counters, dialogue, and transit as separate data concepts.
The combination checker requires a written line and detects duplicates/unknown items; current data preserves funny non-progress pairs rather than authoring every possible combination.
The puzzle-graph checker explicitly reports itself inert when manifest.puzzles is empty instead of claiming proof. That honesty should remain.
Canonical docs guarantee no destroyable essentials, no timed failures, independent Act II trials, and long-range item reuse. The design foundation is stronger than the executable coverage.

## 13.2 Failing the binding contract
Audit verdict  The content layer already values specific jokes and safe graph structure. The runtime collapses those intentions into 'say plus immediate mutations.' The engine—not the prose—is the primary blocker.

# 

14. Migration plan and proof scenes

## 14.1 Do not rewrite the whole game first
Add the pure resolver, PuzzleAction schema, outcome permission validator, PuzzleTransaction, and ordered trace while preserving existing non-progress responses.
Convert A5 into the reference vertical slice: advertisement, generic wrong action, the three authored failures, true solution, line skip, exit/re-entry, and save/load.
Convert the five currently tagged puzzle combinations, resolving targetPending entries only when their rooms are built. No tagged pair may remain 'puzzle' while producing only an uncommitted line.
Populate the canonical 45-puzzle manifest from doc 02 and errata. Add advertisements, recovery paths, and parallel-lane metadata incrementally, but keep the checker explicit about incomplete coverage.
Exercise one full Act II interlock from each reachable partial-trial state. Then migrate remaining puzzles in dependency order, not room-number order.

## 14.2 Required A5 demonstration
A new player can state the unresolved raccoon/hole condition before trying a solution.
Bait, smoke, and Pratt each have a visibly different, authored result. None writes the solved flag or consumes a critical item.
Random comic combinations remain funny and neutral; they do not borrow the raccoon's distinctive reaction or cue.
Blanket success produces the exact ordered trace and a stable cold-hole/raccoon result. The blanket's final ownership/location matches doc 02's returnability doctrine.
Skipping the success line yields the identical object state, flags, inventory, downstream access, and save state as watching it.
Leaving and returning preserves both failed attempt consequences and the solved state coherently; no hint or recap is injected.

# 

15. Automated acceptance checks

## 15.1 Content and graph
Manifest declares exactly the errata-canonical 45 puzzle definitions; until then, the graph check reports coverage as incomplete and never prints a misleading pass.
Every critical puzzle has a reachable advertisement before success and at least one persistent advertisement until solved. Critical puzzles have two independent sources unless marked selfTeachingGradient.
Every SUCCESS action names one puzzle, has a performance, nonempty commit, visible confirmation, and recovery contract. No pool response can write progress.
Every RIGHT_TOO_EARLY action has an explicit unmet prerequisite, a specific line, and zero progress/inventory effects. Its paired SUCCESS branch becomes reachable when the prerequisite is true.
COMIC_NOOP and WRONG actions have no persistent puzzle effects. PLAUSIBLE_WRONG and NEAR_MISS effects are allowlisted, reversible, and cannot set the puzzle goal fact.
Every puzzle-tagged combination has a built target or an explicit build-phase failure. targetPending cannot ship in a playable room.
Every inventory removal declares consume/transform/rehome/transfer and proves that no future required use becomes unreachable.
No validator demands an authored pair for every item-target combination. Authored no-op density and roughly forty-percent optional dialogue remain protected, not treated as test debt.
No puzzle metadata contains hint text, quest-log fields, urgency timers, UI highlight roles, reveal glints, or inactivity thresholds.

## 15.2 Runtime and frame-order
Resolver purity: resolving any action cannot change flags, counters, object state, inventory, room, or ownership.
A success trace is exactly reserve → stage → chore → sound (if any) → lineStart → lineEnd/skip → state → flags → inventory → settle. State, flags, and inventory occur once.
At least one rendered frame after line completion contains the new stable object state before control returns. The confirmation is visible at native 320-pixel width.
Line skip and full watch produce byte-equivalent stable game state and identical ordered commit phases.
A held-item solution plays its authored chore; ordinary item no-ops do not accidentally play the success chore or cue.
Save/load before an attempt, after an authored near miss, and after success restores attempt stage, world response, item ownership, and puzzle availability.
From every reachable Act II partial-completion state, all required final states remain reachable and at least one unresolved lane exposes a persistent problem advertisement.
F2's sound response changes monotonically across authored sampling positions and its visual ripple/tail carries equivalent directional information with audio muted. Only the threshold action commits success. [R9]

## 

15.2 Runtime and frame-order (continued)
Static scan and route tests find no death, game-over, timed failure, one-chance branch, or unrecoverable consumption on a required route.
Motion-state tests enforce errata 35e: an object's idle motion cannot begin or stop solely because its puzzle relevance changed.

## 15.3 Regression checks already present
Retain current checks for specific pair → item pool → global pool precedence, pool rotation, duplicate pairs, unknown items, target availability, and written authored-pair lines.
Retain repeat clamping and state-specific response precedence. Add response-class assertions without flattening their writing into one generic schema.
The new graph suite supplements, not replaces, room loading, exit, inventory, dialogue, save/load, and native-resolution frame tests.

# 

16. Human playtest protocol
Run these questions with a naive tester who has not read the puzzle graph. Do not explain the no-hint doctrine beforehand, and do not count a prompted answer as evidence.
After the first act opens, what unresolved situations can you name? Which room, person, sound, or object made each one feel unfinished?
Before using the correct item, what did you think the obstacle was doing, and why? Did the world give you a problem to solve or only a collection of nouns?
Show one action that felt simply wrong, one that was funny but mechanically final, one that seemed plausible, one that felt promising, and one that clearly succeeded. What made them feel different?
Did any response falsely suggest you were close? Did any near miss feel like a generic joke or a scolding hint?
When a correct action was too early, could you name the present blocker without being told the missing future solution?
On success, what did you see or hear change? Could you explain the cause-and-effect order without referring to an objective message?
After trying the raccoon failures, did you want to continue experimenting? Did the escalating results feel authored rather than punitive?
When stuck in one Act II trial, which other two situations did you remember, and what made you remember them? Did you leave voluntarily or only after prompting?
Did you ever reload because you feared losing an item, choosing bad dialogue, leaving a room, or failing an attempt? When did you begin trusting that the game would let you recover?
Did any object suddenly look, move, or sound 'important' merely because the story reached its use?
With game audio muted, could you solve the sound-bearing puzzle from its visual response without extra text?
Without death or timers, where did you feel tension? Was it social, comic, mysterious, or performative—and did it matter?
How many optional jokes or combinations did you try for their own sake? Did the game make non-progress experimentation feel worthwhile?
At any point did you want a quest log or hint because the game failed to establish a problem, rather than because the solution was difficult? Identify that moment precisely.
Pass standard  A tester need not solve every puzzle unaided in one sitting. They must reliably perceive open problems, form evidence-based hypotheses, recognize performed success, leave a stuck lane without instruction, and trust that experimentation cannot ruin the game.

# 

17. Copy-paste directive for Claude
Use this instruction with the repository  Treat this document as binding for puzzle feel and player feedback. Preserve canonical puzzle solutions, lines, comic no-ops, dialogue-option density, art rules, and errata. Implement the grammar; do not import Monkey Island content.
Before editing, inspect docs/02-puzzle-graph.md,
docs/24-combinations.md, docs/13-room-02-content.md,
docs/14-room-02-exits.md, docs/00-errata.md, docs/05-examine-layer.md,
docs/22-scumm-deep-dive.md, docs/28-audio.md, VerbSystem.ts, types.ts,
GameState.ts, GameScene.ts, content/combinations.json,
content/manifest.json, and the existing combination/graph tests.

Treat the Puzzle Feel and Player Feedback Bible as binding.

1. Produce a current-code gap table against sections 3-15. Preserve what
   section 13.1 says is already right.
2. Make action resolution pure. Add PuzzleFeedback, PuzzleAction,
   PuzzleTransaction, advertisement, recovery, and ordered trace data.
3. Preserve specific-pair -> item-pool -> global-pool precedence. Do not
   mass-author combinations and do not turn comic no-ops into clues.
4. Enforce distinct WRONG, COMIC_NOOP, PLAUSIBLE_WRONG,
   RIGHT_TOO_EARLY, NEAR_MISS, and SUCCESS permissions.
5. Enforce the visible success order: chore, sound, line, world/object
   state, flag writes, inventory mutation. Walk/face may precede it.
   Skipping the line must commit the same stable result exactly once.
6. Build A5 as the first executable proof: advertisement, ordinary wrong
   action, bait, smoke, Pratt, blanket success, re-entry, and save/load.
7. Populate the canonical 45-puzzle graph with advertisements, solutions,
   recovery paths, and Act II lane metadata. Never let an empty or partial
   graph claim comprehensive passage.
8. Add every automated check in section 15 and run the human protocol in
   section 16 with a naive tester.

Never add a hint system, quest log, objective toast, inactivity reminder,
highlight, glint, special cursor, relevance animation, progress meter,
death, timed failure, or unwinnable state. Never use telemetry or attempt
count to make an unrequested response more explicit. Authored escalating
failures may use their own saved narrative counter.

Do not call the work complete because schemas compile or graph reachability
passes. Demonstrate A5 in the running game at native resolution, capture the
ordered event trace and before/after frames, verify skip equivalence, and
report exactly which canonical puzzles are executable versus declarative.

# 

Sources
[S1] The Secret of Monkey Island original manual. Primary player-facing evidence for named objects, sentence construction, safe experimentation, alternate puzzles, and the original design philosophy.
[S2] Ron Gilbert, Why Adventure Games Suck (1989). Contemporaneous design principles: problem before solution, no death-as-learning, recoverable objects, story-advancing puzzles, incremental reward, and several open problems.
[S3] VGHF: The Secrets of Monkey Island's Source Code. Primary-source production material and preserved code showing iteration and room/puzzle authorship.
[S4] VGHF: Making of Monkey Island. Production history and primary-source gallery context.
[S5] ScummVM SCUMM v5 script implementation. Executable reference exposing distinct sentence, print, sound, object-state, ownership, pickup, script, wait, and walk operations.
[R1] Consolation puzzle graph. Canonical puzzle chains, A5 escalating failures, Act II parallel trials, B6 interlock, and no-dead-end ledger.
[R2] Consolation item combinations. Three-tier resolution, authored funny no-ops, and the rule against pair proliferation.
[R3] Consolation errata. Canonical 45-puzzle count, B6 correction, per-state lines, default verbs, and motion-is-not-information ruling.
[R4] Room 02 verb fallbacks and repeats. Global pools, object overrides, and first/second/third repeat behavior.
[R5] Room 02 exits and fallback behavior. Transit behavior, exit responses, and ambient clue seeding.
[R6] Consolation SCUMM deep dive. Performed-interaction template and the explicit limits of graph validation.
[R7] Consolation VerbSystem. Current precedence, immediate flag mutation, state branches, pools, and combination resolution.
[R8] Consolation examine layer. LOOK/LISTEN doctrine and no-emphasis requirement for load-bearing observations.
[R9] Consolation audio design. F2 resonance gradient and equivalent visual-tail accessibility rule.
[R10] Consolation engine types. Current response, interactable, reaction, and combination data shapes.
[R11] Consolation GameState. Current state and inventory mutation order after resolution.
[R12] Consolation GameScene. Current walk/face/chore staging and line display behavior.
[R13] Current combination content. Current authored puzzle and funny no-op pairs.
[R14] Current manifest. Current empty puzzles list.
[R15] Current puzzle-graph checker. Current monotonic reachability analysis and explicit inert-state report.
Evidence note: The historical sources establish design and scripting grammar. Outcome enums, transaction order, validation thresholds, and data structures are original requirements for Consolation, not claims about literal 1990 source identifiers.

**Table 1**

| Pattern | Player-visible form | Not allowed |
|---|---|---|
| Obstruction | A path, office, mechanism, animal, or person refuses a concrete action for an observable reason | LOCKED icon, red outline, objective text |
| Contradiction | Two ordinary facts do not fit: a claim versus a ledger, heat versus a draught, tune versus resonance | Narrator saying 'this is important' |
| Desire | An NPC asks, complains, bargains, or behaves around a lack | NPC repeating a solution-shaped hint after inactivity |
| Consequence | The player sees what a system does wrong before being asked to repair it | Hidden flag with no visible symptom |
| Testable gradient | Repeated actions vary continuously by place/material; F2's sound and visual tail are the canonical exception | Binary right/wrong hotspot coloring |

**Table 2**

| Outcome | What the player should infer | Required feedback | Effect permission |
|---|---|---|---|
| COMIC_NOOP | That was worth trying because the response is the reward | Specific or pooled joke; ordinary chore allowed; no promising material cue | No puzzle/state/inventory mutation |
| WRONG | This action has no useful relationship here | Brief, honest refusal or pool; avoid inventing mechanics | No mutation |
| PLAUSIBLE_WRONG | The intention made sense, but an observable property defeats it | Specific line plus material/actor response; name the failure, not the missing answer | Transient/reversible scene effect only |
| RIGHT_TOO_EARLY | This is the right relationship under the wrong present condition | Specific blocker visible now; do not name a future item or step | No progress; a learned-fact write only if the player truly observed it |
| NEAR_MISS | The hypothesis is productive; this execution did not complete it | Unique chore/sound/line and, where authored, an escalating failed state | Attempt stage or reversible state only; no solved flag |
| SUCCESS | My action caused a lasting, useful change | Full performed transaction and visible confirmation | Declared state, flags, and inventory effects at commit |

**Table 3**

| Attempt | Class | What must perform | What persists |
|---|---|---|---|
| Random irrelevant item | WRONG or COMIC_NOOP | Normal item/target response; no special raccoon reaction | Nothing |
| Bait | NEAR_MISS | Place bait; rustle/sniff cue; specific line; three additional raccoons arrive | Attempt stage and reversible crowd state |
| Smoke | PLAUSIBLE_WRONG / escalating failure | Smoke chore and cough cue; Thad retreats; line explains present failure | Authored attempt stage; puzzle remains open |
| Send Pratt | NEAR_MISS / comic cost | Pratt approaches, bite reaction, exchange | Pratt attitude/attempt stage, never a lockout |
| Blanket on hole | SUCCESS | Place, cloth/air cue, line, hole becomes cold, puzzle flag, blanket re-homed as authored | Solved stable state with explicit recovery policy |

**Table 4**

| Pacing need | Diegetic implementation | Forbidden substitute |
|---|---|---|
| Remember another lane | Persistent obstacle, revisit-able NPC, visible worksite, ordinary town talk, or an inventory object with an established owner/use | Objective list, reminder bark triggered by inactivity |
| Notice cross-trial relation | A character/material naturally appears in more than one social context; lines acknowledge consequences after they occur | Map arrows or 'use this in Trial B' text |
| Leave a stuck lane | Exits stay open; failure concludes promptly; no item or NPC is trapped by the attempt | Popup telling the player to try another puzzle |
| Sense progress | Each completed trial changes a place, relationship, performance, or available exchange | Three-part progress meter |
| Return later | The obstacle's current condition and response remain coherent after room exit/save-load | NPC recapping all prior attempts |

**Table 5**

| Player fear | Engine/content promise | How the game demonstrates it |
|---|---|---|
| I used an item wrong | Non-solution use does not destroy or consume a critical item | Item remains in inventory or visibly returns after the chore |
| I gave something away | Critical ownership changes have a defined re-acquisition or later-world location | The handoff is shown and the new holder/location responds consistently |
| I chose bad dialogue | Choices may alter tone and comedy, never erase the only winning route | Conversations can be revisited; required information remains obtainable |
| I failed an experiment | Failure changes only authored reversible state or social texture | The obstacle remains present and accepts another attempt |
| I left too soon | Rooms and NPCs preserve stable state across transit and save/load | Returning shows the same causal world, not a reset puzzle |
| I should reload | No hidden timer, death roll, one-chance input, or secret resource depletion | The game never rewards save-scumming as ordinary play |

**Table 6**

| Gap | Current evidence | Required correction |
|---|---|---|
| No response semantics | ResolvedAction is essentially say/dialogue/goto plus state/take | Add feedback class, performance, permission checks, and transaction |
| Effects happen inside resolution | VerbSystem applies pair/rule flag writes before returning | Make resolution pure; reserve effects, then commit after performance |
| Wrong visible order | GameState applies object state and inventory before GameScene displays the returned line | Enforce chore → sound → line → state → flags → inventory |
| Held item loses choreography | Combination path does not select the target reaction chore | Allow authored item-target chore and marker |
| No sound path | Puzzle actions and scene interaction have no audio outcome service | Add cue hook plus accessible visual for informational sound |
| Pairs cannot express timing/effects | CombinationPair lacks when, feedback, chore, sound, take/give/remove, dialogue, or recovery | Migrate progress pairs to PuzzleAction; retain no-op pairs cheaply |
| No premature-solution branch | Combination pairs have no condition; unmet cases fall through or require ad hoc room rules | Author RIGHT_TOO_EARLY with current blocker and zero progress |
| Graph proof is empty | content/manifest.json has puzzles: [] | Declare all canonical 45 puzzles and knowledge/recovery contracts |
| Current puzzle pairs mostly just speak | Five pairs are tagged puzzle; several targets remain pending and no executable success trace exists | Make A5 the first running end-to-end proof, then migrate by graph order |
| Tests check precedence, not feel | Existing tests assert pools/lines/repeats; no causal-order or mutation-permission tests | Add trace, frame, skip-equivalence, advertisement, and recovery suites |