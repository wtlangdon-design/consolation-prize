import { loadContent, readJson } from './content.mjs';

/**
 * THE PUZZLE GRAPH, DERIVED FROM THE CONTENT THE ENGINE PLAYS.
 *
 * Invariant 6 and CLAUDE.md's validation list ask for two things "by
 * automated graph traversal, not by inspection": every canonical puzzle
 * reachable from a fresh save, and the win reachable from every reachable
 * state. Until errata 219 the traversal had nothing to traverse: the
 * manifest's `puzzles` was empty and the check said so in a note while
 * passing. This module builds the graph instead of asking anyone to type it.
 *
 * WHAT A NODE IS. Every place in content where something the player does (or
 * the engine does on his behalf when he walks in, waits, or loses a duel)
 * changes state is a SITE: a response rule on a hotspot, exit, item or person;
 * a dialogue option; an item used on something; an exit taken; an arrival
 * scene, accost, timeline step, act opening, cutaway or listening tap; a duel
 * ending. Each site has what it READS (its gates, in the engine's own terms)
 * and what it WRITES (flags, items, puzzles, rooms, conversations). Nothing
 * here names the fiction: every id comes from the content files.
 *
 * WHAT A STATE IS -- THE MODEL, AND WHAT IT IS NOT. A state is a set of facts
 * that have been true at some point: `f:FLAG=value`, `f:FLAG+` (a counter has
 * grown), `i:item` / `-i:item` (held / not held), `p:PUZZLE` / `-p:PUZZLE`
 * (complete / not), `r:room` (stood in), `t:TREE` (conversation opened),
 * `n:TREE/NODE`, `o:TREE/NODE/OPTION` (chosen), `d:duel` (called).
 *
 *   - REACHABILITY is a fixpoint: facts only accumulate. A gate holds if each
 *     flag it names has SOME reachable value that passes, independently of the
 *     others. That over-approximates the game -- it can call a puzzle
 *     reachable that a real order of play could not reach -- and never the
 *     other way round. tests/puzzle-graph.test.ts holds it to that: every fact
 *     the continuous playthrough (tests/full-game.test.ts) produces must be one
 *     this model reaches, so a site the model failed to see fails a test.
 *   - FIRST MATCH IS KEPT where the engine has it (response rules, an exit's
 *     transit scenes, a tree's entries): rule i fires only where every earlier
 *     rule's gate can fail.
 *   - DEAD ENDS (`lossAnalysis`) are where monotonicity breaks: a site that
 *     takes an item, sets a flag to a value some gate does not want, or
 *     completes a puzzle some gate wants incomplete. For each such site the
 *     analysis puts the game in the worst state the model can build -- the
 *     loss taken before anything that wanted the lost fact, with every
 *     one-time site already spent -- and asks whether the win is still
 *     reachable. One loss at a time: two losses that only strand the player
 *     together are not looked for.
 */

const BOOLEAN_TYPES = new Set(['boolean', 'bool']);

/* ---- loading ------------------------------------------------------------ */

/** Everything the model reads, loaded the way the tools load content. */
export function loadModelContent() {
  const content = loadContent();
  const manifest = content.manifest;
  return {
    ...content,
    assay: manifest.assay ? readJson(manifest.assay) : null,
    actCards: manifest.actCards ? readJson(manifest.actCards) : null,
    cutaways: manifest.cutaways ? readJson(manifest.cutaways) : null,
    puzzleFindings: readJson('proofs/puzzle-graph-findings.json'),
  };
}

/* ---- requirements --------------------------------------------------------- */

const tok = (token) => ({ tok: token });
const flagReq = (flag, test, neg = false) => ({ flag, test, neg });

function conditionReqs(condition) {
  return Object.entries(condition ?? {}).map(([flag, test]) => flagReq(flag, test));
}

/** NOT(condition): any one of its literals fails. Null when the condition is empty (it cannot fail). */
function negation(condition, holds = [], afterPuzzles = [], untilPuzzles = []) {
  const alternatives = [
    ...Object.entries(condition ?? {}).map(([flag, test]) => [flagReq(flag, test, true)]),
    ...holds.map((item) => [tok(`-i:${item}`)]),
    ...afterPuzzles.map((puzzle) => [tok(`-p:${puzzle}`)]),
    ...untilPuzzles.map((puzzle) => [tok(`p:${puzzle}`)]),
  ];
  return alternatives.length ? { any: alternatives } : null;
}

function holdingReqs(holding) {
  return Object.entries(holding ?? {}).map(([item, held]) => tok(held ? `i:${item}` : `-i:${item}`));
}

function matchesTest(value, test) {
  if (typeof test === 'boolean' || typeof test === 'number') return value === test;
  if (typeof value !== 'number') value = 0;
  if (test.atLeast !== undefined && value < test.atLeast) return false;
  if (test.atMost !== undefined && value > test.atMost) return false;
  if (test.equals !== undefined && value !== test.equals) return false;
  return true;
}

/* ---- the model ------------------------------------------------------------ */

class ModelBuilder {
  constructor(content) {
    this.content = content;
    this.sites = [];
    this.flagDefs = new Map(content.flags.flags.map((flag) => [flag.id, flag]));
    this.items = new Map(content.items.map(({ data }) => [data.id, data]));
    this.ambient = new Map(content.ambient.map(({ data }) => [data.id, data]));
    this.trees = new Map(content.dialogue.map(({ data }) => [data.id, data]));
    this.rooms = new Map(content.rooms.map(({ data }) => [data.id, data]));
    this.transitVerbs = new Set(content.verbs.transitVerbs ?? [content.verbs.walkVerb?.id ?? 'WALK_TO']);
    this.unresolved = [];
  }

  add(id, req, effects, extra = {}) {
    this.sites.push({ id, req: req.filter(Boolean), effects, ...extra });
  }

  /** What a response rule writes (VerbSystem.resolve / GameState.resolvePure). */
  ruleEffects(rule, target) {
    const effects = [];
    for (const [flag, value] of Object.entries(rule.set ?? {})) effects.push({ set: flag, value });
    for (const flag of Object.keys(rule.add ?? {})) effects.push({ add: flag });
    if (rule.completes) effects.push({ tok: `p:${rule.completes}` });
    for (const item of rule.items ?? []) effects.push({ gain: item });
    for (const item of rule.grants ?? []) effects.push({ gain: item });
    for (const item of rule.takes ?? []) effects.push({ drop: item });
    if (rule.take && target?.item) effects.push({ gain: target.item });
    if (rule.goto && this.rooms.has(rule.goto)) effects.push({ tok: `r:${rule.goto}` });
    if (rule.dialogue && this.trees.has(rule.dialogue)) effects.push({ tok: `t:${rule.dialogue}` });
    return effects;
  }

  /** A first-match list of rules: rule i needs its own gate and every earlier one's to fail. */
  firstMatch(prefix, base, rules, target, { holdsKey = 'holds', once = () => false } = {}) {
    const earlier = [];
    rules.forEach((rule, index) => {
      const holds = Array.isArray(rule[holdsKey]) ? rule[holdsKey] : [];
      const own = [
        ...conditionReqs(rule.when),
        ...holds.map((item) => tok(`i:${item}`)),
        ...(rule.afterPuzzles ?? []).map((puzzle) => tok(`p:${puzzle}`)),
        ...(rule.untilPuzzles ?? []).map((puzzle) => tok(`-p:${puzzle}`)),
      ];
      this.add(`${prefix}#${index}`, [...base, ...own, ...earlier], this.ruleEffects(rule, target),
        { once: once(rule) });
      const not = negation(rule.when, holds, rule.afterPuzzles ?? [], rule.untilPuzzles ?? []);
      // A rule with no gate at all shadows everything after it.
      if (!not) earlier.push({ any: [] });
      else earlier.push(not);
    });
  }

  presence(roomId, npcId) {
    const npc = this.ambient.get(npcId);
    if (!npc) return null;
    const placed = npc.placements?.[roomId];
    const req = [tok(`r:${roomId}`)];
    if (placed?.when !== undefined) return [...req, ...conditionReqs(placed.when)];
    req.push(...conditionReqs(npc.when));
    if (npc.whenAny?.length) req.push({ any: npc.whenAny.map(conditionReqs) });
    return req;
  }

  treeOf(roomId, npcId) {
    const npc = this.ambient.get(npcId);
    return npc?.placements?.[roomId]?.tree ?? npc?.tree ?? null;
  }

  /** Every room an ambient figure can be present in, with the gate that puts him there. */
  placementsOf(npcId) {
    const out = [];
    for (const [roomId, room] of this.rooms) {
      if ((room.ambient ?? []).includes(npcId)) out.push({ roomId, req: this.presence(roomId, npcId) });
    }
    return out;
  }

  build() {
    const { content } = this;
    const manifest = content.manifest;

    this.buildOpening(manifest);
    for (const room of this.rooms.values()) this.buildRoom(room);
    this.buildItems();
    this.buildCombinations();
    for (const tree of this.trees.values()) this.buildTree(tree);
    this.buildDuels();
    this.buildAmbientCounters();
    this.buildActOpenings();
    this.buildCutaways();

    const initial = new Set([`r:${manifest.startRoom}`]);
    for (const flag of this.flagDefs.values()) initial.add(`f:${flag.id}=${JSON.stringify(flag.initial)}`);
    for (const item of this.items.values()) initial.add(item.startsHeld ? `i:${item.id}` : `-i:${item.id}`);
    const puzzleIds = new Set(this.sites.flatMap((site) => site.effects
      .filter((effect) => effect.tok?.startsWith('p:')).map((effect) => effect.tok.slice(2))));
    for (const id of puzzleIds) initial.add(`-p:${id}`);
    // Facts a gate reads that no initial value names (a puzzle nothing completes) start false too.
    for (const site of this.sites) {
      for (const token of tokensOf(site.req)) {
        if (token.startsWith('-p:')) initial.add(token);
      }
    }

    const win = [...this.rooms.values()].filter((room) => room.endsGame).map((room) => `r:${room.id}`);
    return { sites: this.sites, initial, win, flagDefs: this.flagDefs, unresolved: this.unresolved };
  }

  buildOpening(manifest) {
    const id = manifest.openingSequence;
    const file = this.content.sequences.find(({ data }) => data.id === id)?.data;
    if (!file) return;
    const start = tok(`r:${manifest.startRoom}`);
    if (file.doneFlag) this.add(`sequence:${id}:done`, [start], [{ set: file.doneFlag, value: true }]);
    for (const beat of file.beats ?? []) {
      const req = [start, beat.awaitFlag ? flagReq(beat.awaitFlag, true) : null];
      const effects = [];
      for (const [flag, value] of Object.entries(beat.set ?? {})) effects.push({ set: flag, value });
      if (beat.carriedBy && this.trees.has(beat.carriedBy)) effects.push({ tok: `t:${beat.carriedBy}` });
      for (const step of beat.staging ?? []) {
        if (step.do !== 'travel' || !step.through) continue;
        const exit = this.rooms.get(manifest.startRoom)?.exits?.find((one) => one.id === step.through);
        if (exit) effects.push({ tok: `r:${exit.to}` });
      }
      if (effects.length) this.add(`sequence:${id}:beat ${beat.beat}`, req, effects);
    }
  }

  buildRoom(room) {
    const R = room.id;
    const inRoom = tok(`r:${R}`);

    // The map: a destination from any ordinary room (doc 20 rule 2), and its places.
    if (room.kind === 'map') {
      for (const location of room.locations ?? []) {
        if (!this.rooms.has(location.room)) continue;
        this.add(`map:${location.id}`, [inRoom, ...conditionReqs(location.when), ...holdingReqs(location.holding)],
          [{ tok: `r:${location.room}` }]);
      }
    } else if (room.interface !== 'none') {
      for (const map of this.rooms.values()) {
        if (map.kind === 'map') this.add(`room:${R}:map`, [inRoom], [{ tok: `r:${map.id}` }]);
      }
    }

    // Hotspots and exits (GameState.targets, resolvePure).
    for (const target of [...(room.exits ?? []), ...(room.hotspots ?? [])]) {
      const base = [inRoom, ...conditionReqs(target.when), ...holdingReqs(target.holding),
        target.whenAny?.length ? { any: target.whenAny.map(conditionReqs) } : null].filter(Boolean);
      const isExit = typeof target.to === 'string';
      if (isExit) this.buildTransit(room, target, base);
      for (const [verb, rules] of Object.entries(target.responses ?? {})) {
        if (isExit && this.transitVerbs.has(verb)) continue;
        this.firstMatch(`room:${R}:${target.id}:${verb}`, base, rules, target, {
          once: (rule) => Boolean(rule.take || rule.items?.length),
        });
      }
    }

    // People: TALK TO opens their tree; other verbs answer from the room's or the tree's own lines.
    for (const npcId of room.ambient ?? []) {
      const present = this.presence(R, npcId);
      if (!present) continue;
      const tree = this.treeOf(R, npcId);
      if (tree && this.trees.has(tree)) this.add(`room:${R}:talk:${npcId}`, present, [{ tok: `t:${tree}` }]);
      for (const [verb, rules] of Object.entries(room.peopleResponses?.[npcId] ?? {})) {
        this.firstMatch(`room:${R}:person:${npcId}:${verb}`, present, rules, null);
      }
      const layer = tree ? this.trees.get(tree)?.examine : undefined;
      for (const [verb, rules] of Object.entries(layer ?? {})) {
        this.firstMatch(`room:${R}:examine:${npcId}:${verb}`, present, rules, null);
      }
    }

    const entry = room.onEnter;
    if (entry) {
      if (entry.set) this.add(`room:${R}:onEnter`, [inRoom], writes(entry.set));
      (entry.setWhen ?? []).forEach((rule, index) => {
        this.add(`room:${R}:onEnter:setWhen#${index}`, [inRoom, ...conditionReqs(rule.when)], writes(rule.set));
      });
      if (entry.say?.length) {
        const said = [inRoom, ...conditionReqs(entry.sayWhen), entry.sayOnce ? flagReq(entry.sayOnce, true, true) : null];
        const effects = [...writes(entry.saySet)];
        if (entry.sayWhen !== undefined && entry.sayOnce) effects.push({ set: entry.sayOnce, value: true });
        if (effects.length) this.add(`room:${R}:onEnter:say`, said, effects);
      }
      (entry.scenes ?? []).forEach((scene, index) => {
        const after = scene.after ?? {};
        const effects = [...writes(after.set), ...(after.gives ?? []).map((item) => ({ gain: item }))];
        if (after.completes) effects.push({ tok: `p:${after.completes}` });
        if (effects.length) this.add(`room:${R}:onEnter:scene#${index}`, [inRoom, ...conditionReqs(scene.when)], effects);
      });
      const accost = entry.accost;
      if (accost) {
        const present = this.presence(R, accost.npc) ?? [inRoom];
        const req = [...present, ...conditionReqs(accost.when),
          accost.whenAny?.length ? { any: accost.whenAny.map(conditionReqs) } : null,
          accost.completes ? tok(`-p:${accost.completes}`) : null];
        const effects = [...writes(accost.set)];
        if (accost.completes) effects.push({ tok: `p:${accost.completes}` });
        const tree = this.treeOf(R, accost.npc);
        if (tree && this.trees.has(tree)) effects.push({ tok: `t:${tree}` });
        if (accost.duel) effects.push({ tok: `d:${accost.duel}` });
        this.add(`room:${R}:accost`, req, effects);
      }
    }

    (room.timeline ?? []).forEach((step, index) => {
      if (step.do !== 'dialogue') return;
      const effects = [];
      if (step.completes) effects.push({ tok: `p:${step.completes}` });
      if (step.tree && this.trees.has(step.tree)) effects.push({ tok: `t:${step.tree}` });
      this.add(`room:${R}:timeline#${index}`, [inRoom], effects);
    });
    if (room.afterTimeline && this.rooms.has(room.afterTimeline.goto)) {
      this.add(`room:${R}:afterTimeline`, [inRoom, ...conditionReqs(room.afterTimeline.when)],
        [{ tok: `r:${room.afterTimeline.goto}` }]);
    }

    const listening = room.listening;
    if (listening) {
      this.add(`room:${R}:listening:tap`, [inRoom],
        [...this.ruleEffects(listening.found, null), { set: listening.tune.doneFlag, value: true }]);
      this.add(`room:${R}:listening:arrive`, [inRoom, flagReq(listening.foundFlag, true)],
        [{ set: listening.tune.doneFlag, value: true }]);
      if (listening.fork) this.add(`room:${R}:listening:fork`, [inRoom], [{ set: listening.fork.onceFlag, value: true }]);
    }
  }

  /** An exit taken (GameState.resolvePure's transit branch). */
  buildTransit(room, exit, base) {
    const prefix = `room:${room.id}:${exit.id}:transit`;
    const arrives = this.rooms.has(exit.to) ? [{ tok: `r:${exit.to}` }] : [];
    const sideWrites = [...writes(exit.setOnTransit)];
    if (exit.completesOnTransit) sideWrites.push({ tok: `p:${exit.completesOnTransit}` });
    if (sideWrites.length) {
      this.add(`${prefix}:writes`, [...base, ...conditionReqs(exit.setOnTransitWhen)], sideWrites);
    }
    const earlier = [];
    (exit.transitScene ?? []).forEach((rule, index) => {
      const effects = [...writes(rule.set)];
      if (!exit.travelWhenTold && !rule.stays) effects.push(...arrives);
      this.add(`${prefix}:scene#${index}`, [...base, ...conditionReqs(rule.when), ...earlier], effects);
      earlier.push(negation(rule.when) ?? { any: [] });
    });
    // No scene's gate holds: a plain walk through.
    if (!exit.travelWhenTold) this.add(`${prefix}`, [...base, ...earlier], arrives);
  }

  buildItems() {
    for (const item of this.items.values()) {
      const held = tok(`i:${item.id}`);
      for (const [verb, rules] of Object.entries(item.responses ?? {})) {
        this.firstMatch(`item:${item.id}:${verb}`, [held], rules, null);
      }
      if (item.heldWhen) this.add(`item:${item.id}:heldWhen`, conditionReqs(item.heldWhen), [{ gain: item.id }]);
      // Lost while a condition holds (GameState.carried): a loss, caused by whatever writes the condition.
      if (item.lostWhen) this.add(`item:${item.id}:lostWhen`, [held, ...conditionReqs(item.lostWhen)], [{ drop: item.id }]);
    }
  }

  /** The person or thing in a room an item is used on, and the gate that puts it there. */
  targetIn(roomId, targetId) {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    const target = [...(room.exits ?? []), ...(room.hotspots ?? [])].find((one) => one.id === targetId);
    if (target) {
      return { target, req: [tok(`r:${roomId}`), ...conditionReqs(target.when), ...holdingReqs(target.holding),
        target.whenAny?.length ? { any: target.whenAny.map(conditionReqs) } : null].filter(Boolean) };
    }
    if ((room.ambient ?? []).includes(targetId)) return { target: null, req: this.presence(roomId, targetId) };
    return null;
  }

  buildCombinations() {
    const file = this.content.combinations?.data ?? this.content.combinations;
    for (const pair of file?.pairs ?? []) {
      const where = this.targetIn(pair.room, pair.target);
      const prefix = `with:${pair.room}:${pair.target}:${pair.item}`;
      if (!where) { this.unresolved.push(`${prefix}: no "${pair.target}" in ${pair.room}`); continue; }
      const base = [tok(`i:${pair.item}`), ...where.req];
      if (pair.opens) {
        // An evidence pair (GameState.evidencePairFor / commitEvidence), then the tree it opens.
        if (!pair.completes) continue;
        const req = [...base, ...(pair.requiresPuzzles ?? []).map((id) => tok(`p:${id}`)),
          ...Object.entries(pair.requiresFlags ?? {}).map(([flag, value]) => (value
            ? flagReq(flag, true) : flagReq(flag, true, true))),
          tok(`-p:${pair.completes}`)];
        const effects = [{ tok: `p:${pair.completes}` }, ...writes(pair.set)];
        if (this.trees.has(pair.opens)) effects.push({ tok: `t:${pair.opens}` });
        this.add(prefix, req, effects);
        continue;
      }
      if (pair.rules?.length) {
        this.firstMatch(prefix, base, pair.rules, null);
      } else if (pair.otherwise !== 'pool' && pair.set) {
        this.add(prefix, base, writes(pair.set));
      }
    }
  }

  buildTree(tree) {
    const T = tree.id;
    const opened = tok(`t:${T}`);
    const arrive = (nodeId, gate, label) => {
      const node = tree.nodes[nodeId];
      if (!node) { this.unresolved.push(`${T}: opens on "${nodeId}", which has no node`); return; }
      const effects = [{ tok: `n:${T}/${nodeId}` }];
      if (node.openingOnce) effects.push({ set: node.openingOnce, value: true });
      if (!(node.openingOnce && node.onOpen)) { this.add(`dialogue:${T}:${label}`, gate, effects); return; }
      // DialogueRunner.start: the node's onOpen lands with its once-flag, the first time only -- one act, not two.
      const onOpen = [...writes(node.onOpen.set), ...(node.onOpen.gives ?? []).map((item) => ({ gain: item })),
        ...Object.entries(node.onOpen.puzzle ?? {}).filter(([, status]) => status === 'complete')
          .map(([puzzle]) => ({ tok: `p:${puzzle}` }))];
      this.add(`dialogue:${T}:${label}:first`, [...gate, flagReq(node.openingOnce, true, true)], [...effects, ...onOpen],
        { once: true });
      this.add(`dialogue:${T}:${label}`, [...gate, flagReq(node.openingOnce, true)], effects);
    };
    // DialogueRunner.opensOn: the first entry whose gate holds, else the start node.
    const earlier = [];
    let shadowed = false;
    for (const [index, entry] of (tree.entries ?? []).entries()) {
      const own = [...conditionReqs(entry.when), entry.puzzle ? tok(`p:${entry.puzzle}`) : null];
      arrive(entry.node, [opened, ...own, ...earlier], `entry#${index}`);
      const not = negation(entry.when, [], entry.puzzle ? [entry.puzzle] : []);
      if (!not) { shadowed = true; break; }
      earlier.push(not);
    }
    if (!shadowed) arrive(tree.start, [opened, ...earlier], 'start');

    for (const [nodeId, node] of Object.entries(tree.nodes ?? {})) {
      const at = tok(`n:${T}/${nodeId}`);
      for (const option of node.options ?? []) {
        const req = [at, ...conditionReqs(option.when),
          option.whenAny?.length ? { any: option.whenAny.map(conditionReqs) } : null,
          ...(option.holds ?? []).map((item) => tok(`i:${item}`)),
          ...(option.lacks ?? []).map((item) => tok(`-i:${item}`)),
          ...(option.after ?? []).map((id) => tok(`o:${T}/${nodeId}/${id}`)),
          option.afterAny?.length ? { any: option.afterAny.map((id) => [tok(`o:${T}/${nodeId}/${id}`)]) } : null];
        this.add(`dialogue:${T}:${nodeId}:${option.id}`, req, this.optionEffects(tree, nodeId, option, option.id),
          { once: Boolean(option.gives?.length || option.takes?.length) });
        if (option.afterUse === 'replace' && option.replaceWith) {
          this.add(`dialogue:${T}:${nodeId}:${option.id}:replaced`, [...req, tok(`o:${T}/${nodeId}/${option.id}`)],
            this.optionEffects(tree, nodeId, option.replaceWith, option.replaceWith.id));
        }
      }
    }
  }

  /** DialogueRunner.resolvePure's effects, plus the items it hands over or takes. */
  optionEffects(tree, nodeId, option, takenId) {
    const effects = [{ tok: `o:${tree.id}/${nodeId}/${takenId}` }, ...writes(option.set)];
    for (const flag of Object.keys(option.add ?? {})) effects.push({ add: flag });
    for (const item of option.gives ?? []) effects.push({ gain: item });
    for (const item of option.takes ?? []) effects.push({ drop: item });
    for (const [puzzle, status] of Object.entries(option.puzzle ?? {})) {
      if (status === 'complete') effects.push({ tok: `p:${puzzle}` });
    }
    const ends = option.tag === 'EXIT' || option.ends === true;
    if (ends && tree.closing?.counter) effects.push({ add: tree.closing.counter });
    if (option.universal && this.flagDefs.has('EXIT_TURN')) effects.push({ add: 'EXIT_TURN' });
    if (!ends && option.goto && tree.nodes[option.goto]) {
      effects.push({ tok: `n:${tree.id}/${option.goto}` });
      const target = tree.nodes[option.goto];
      if (target.opening?.length && target.openingOnce) effects.push({ set: target.openingOnce, value: true });
    }
    if (option.duel) effects.push({ tok: `d:${option.duel}` });
    return effects;
  }

  /** The Liar's Assay's duels (Assay.ts DuelSession): how each one ends, and what ending it writes. */
  buildDuels() {
    const assay = this.content.assay;
    if (!assay) return;
    const flagOf = new Map(assay.pairs.map((pair) => [pair.n, pair]));
    const learnWrites = (numbers) => numbers.map((n) => flagOf.get(n)?.flag).filter(Boolean)
      .map((flag) => ({ set: flag, value: true }));
    for (const [id, duel] of Object.entries(assay.duels ?? {})) {
      const called = tok(`d:${id}`);
      const thrown = duel.pool ?? duel.sequence ?? [];
      const ending = [...learnWrites(duel.learns ?? []), ...writes(duel.sets)];
      if (duel.winnable === false) {
        this.add(`duel:${id}:ends`, [called], [...ending, ...(duel.puzzle ? [{ tok: `p:${duel.puzzle}` }] : [])]);
        continue;
      }
      const won = [...ending, ...writes(duel.setsOnWin), ...(duel.yields ?? []).map((item) => ({ gain: item })),
        ...(duel.puzzle ? [{ tok: `p:${duel.puzzle}` }] : [])];
      if (duel.rethrow?.length) {
        // A lost exchange is thrown again: the duel cannot be lost.
        this.add(`duel:${id}:won`, [called], won);
        continue;
      }
      // Won by knowing enough of what is thrown; lost otherwise, and a loss can teach (learnsByLosing).
      const known = thrown.map((n) => flagOf.get(n)).filter(Boolean);
      this.add(`duel:${id}:won`, [called, {
        count: known.map((pair) => (pair.flag ? flagReq(pair.flag, true) : tok(`p:${pair.learnedAt}`))),
        atLeast: duel.threshold ?? assay.exchangesToWin ?? 0,
      }], won);
      const lost = [...ending, ...(duel.learnsByLosing ? learnWrites(thrown) : [])];
      if (duel.mocks?.counter) lost.push({ add: duel.mocks.counter });
      this.add(`duel:${id}:lost`, [called], lost);
    }
  }

  /** Counters the ambient layer keeps (Ambient.ts barkTurns / barkRun), written on a visit. */
  buildAmbientCounters() {
    for (const npc of this.ambient.values()) {
      const runs = [...(npc.barkTurns ?? []), ...(npc.barkRun ? [npc.barkRun] : [])];
      if (!runs.length) continue;
      for (const { roomId, req } of this.placementsOf(npc.id)) {
        runs.forEach((run, index) => {
          this.add(`ambient:${npc.id}:${roomId}:barks#${index}`, [...req, ...conditionReqs(run.when)], [{ add: run.counter }]);
        });
      }
    }
  }

  buildActOpenings() {
    for (const [act, opening] of Object.entries(this.content.actCards?.openings ?? {})) {
      if (!this.rooms.has(opening.room)) continue;
      this.add(`act:${act}:opening`, [flagReq(opening.due, true)],
        [{ set: opening.due, value: false }, { tok: `r:${opening.room}` }]);
    }
  }

  buildCutaways() {
    for (const cut of this.content.cutaways?.cutaways ?? []) {
      this.add(`cutaway:${cut.id}`, [tok(`r:${cut.room}`), ...conditionReqs(cut.when), flagReq(cut.done, true, true)],
        [{ set: cut.done, value: true }]);
    }
  }
}

function writes(set) {
  return Object.entries(set ?? {}).map(([flag, value]) => ({ set: flag, value }));
}

/** Every plain token a requirement list names, through `any` and `count`. */
function tokensOf(reqs) {
  const out = [];
  const walk = (list) => {
    for (const req of list) {
      if (req.tok) out.push(req.tok);
      else if (req.any) req.any.forEach(walk);
      else if (req.count) walk(req.count);
    }
  };
  walk(reqs);
  return out;
}

function flagsOf(reqs) {
  const out = [];
  const walk = (list) => {
    for (const req of list) {
      if (req.flag) out.push(req.flag);
      else if (req.any) req.any.forEach(walk);
      else if (req.count) walk(req.count);
    }
  };
  walk(reqs);
  return out;
}

/** The facts an effect makes true. */
function effectTokens(effect) {
  if (effect.tok) return [effect.tok];
  if (effect.set !== undefined) return [`f:${effect.set}=${JSON.stringify(effect.value)}`];
  if (effect.add !== undefined) return [`f:${effect.add}+`];
  if (effect.gain !== undefined) return [`i:${effect.gain}`];
  if (effect.drop !== undefined) return [`-i:${effect.drop}`];
  return [];
}

export function buildModel(content = loadModelContent()) {
  const model = new ModelBuilder(content).build();
  model.sites.forEach((site, index) => {
    site.index = index;
    site.yields = [...new Set(site.effects.flatMap(effectTokens))];
    site.reads = { tokens: [...new Set(tokensOf(site.req))], flags: [...new Set(flagsOf(site.req))] };
  });
  // Who reads what, so a fixpoint wakes only the sites a new fact can matter to.
  model.byToken = new Map();
  model.byFlag = new Map();
  for (const site of model.sites) {
    for (const token of site.reads.tokens) push(model.byToken, token, site);
    for (const flag of site.reads.flags) push(model.byFlag, flag, site);
  }
  model.puzzleSites = new Map();
  for (const site of model.sites) {
    for (const token of site.yields) if (token.startsWith('p:')) push(model.puzzleSites, token.slice(2), site);
  }
  return model;
}

function push(map, key, value) {
  if (!map.has(key)) map.set(key, []);
  map.get(key).push(value);
}

/* ---- evaluation ----------------------------------------------------------- */

/** The values a flag has had, as the state records them. */
class FactState {
  constructor(tokens) {
    this.tokens = new Set(tokens);
    this.values = new Map();
    this.grows = new Set();
    for (const token of this.tokens) this.index(token);
  }

  index(token) {
    if (!token.startsWith('f:')) return;
    if (token.endsWith('+')) { this.grows.add(token.slice(2, -1)); return; }
    const at = token.indexOf('=');
    const flag = token.slice(2, at);
    if (!this.values.has(flag)) this.values.set(flag, []);
    this.values.get(flag).push(JSON.parse(token.slice(at + 1)));
  }

  add(token) {
    if (this.tokens.has(token)) return false;
    this.tokens.add(token);
    this.index(token);
    return true;
  }

  has(token) {
    return this.tokens.has(token);
  }

  flagPasses(flag, test, neg) {
    const values = this.values.get(flag) ?? [];
    const passes = (value) => matchesTest(value, test) !== neg;
    if (values.some(passes)) return true;
    // A counter that has grown has been every integer from where it stood upward.
    if (this.grows.has(flag) && values.length) {
      const from = Math.min(...values.filter((value) => typeof value === 'number'));
      for (let value = from; value <= from + 64; value += 1) if (passes(value)) return true;
    }
    return false;
  }

  satisfies(reqs) {
    for (const req of reqs) {
      if (req.tok !== undefined) { if (!this.tokens.has(req.tok)) return false; continue; }
      if (req.flag !== undefined) { if (!this.flagPasses(req.flag, req.test, req.neg)) return false; continue; }
      if (req.any !== undefined) { if (!req.any.some((alt) => this.satisfies(alt))) return false; continue; }
      if (req.count !== undefined) {
        if (req.count.filter((one) => this.satisfies([one])).length < req.atLeast) return false;
        continue;
      }
    }
    return true;
  }
}

/**
 * The fixpoint: every site whose gates hold fires, and its facts are added,
 * until nothing new is learned. `exclude` is a set of site indices that may
 * not fire.
 */
export function reach(model, { from = model.initial, exclude = null } = {}) {
  const count = model.sites.length;
  const state = new FactState(from);
  // 0 waiting, 1 queued, 2 fired, 3 excluded. Typed, because the dead-end pass runs this thousands of times.
  const mark = new Uint8Array(count);
  if (exclude) for (const index of exclude) mark[index] = 3;
  /** The site that first made each fact true: the way a reader asks "how did it get there?". */
  const by = new Map();
  const queue = [];
  for (let index = count - 1; index >= 0; index -= 1) if (mark[index] === 0) { queue.push(index); mark[index] = 1; }
  while (queue.length) {
    const index = queue.pop();
    const site = model.sites[index];
    if (!state.satisfies(site.req)) { mark[index] = 0; continue; }
    mark[index] = 2;
    for (const token of site.yields) {
      if (!state.add(token)) continue;
      by.set(token, site);
      for (const next of wakes(model, token)) {
        if (mark[next] !== 0) continue;
        queue.push(next);
        mark[next] = 1;
      }
    }
  }
  const fired = {
    has: (index) => mark[index] === 2,
    get size() { return mark.reduce((sum, one) => sum + (one === 2 ? 1 : 0), 0); },
    [Symbol.iterator]: function* iterate() { for (let index = 0; index < count; index += 1) if (mark[index] === 2) yield index; },
  };
  return { state, fired, tokens: state.tokens, by };
}

/** The sites a new fact can matter to, by the token itself or the flag it is a value of. */
function wakes(model, token) {
  model.wakeCache ??= new Map();
  let out = model.wakeCache.get(token);
  if (!out) {
    const sites = [...(model.byToken.get(token) ?? [])];
    if (token.startsWith('f:')) {
      const flag = token.endsWith('+') ? token.slice(2, -1) : token.slice(2, token.indexOf('='));
      sites.push(...(model.byFlag.get(flag) ?? []));
    }
    out = sites.map((site) => site.index);
    model.wakeCache.set(token, out);
  }
  return out;
}

/** How a fact was reached: the chain of sites, each with the facts it needed that came from earlier sites. */
export function explain(model, result, token, depth = 0, seen = new Set()) {
  const site = result.by.get(token);
  if (!site || seen.has(site.index) || depth > 40) return [];
  seen.add(site.index);
  const lines = [`${'  '.repeat(depth)}${token} <- ${site.id}`];
  for (const need of site.reads.tokens) {
    if (result.tokens.has(need) && !model.initial.has(need)) lines.push(...explain(model, result, need, depth + 1, seen));
  }
  return lines;
}

export function winReached(model, result) {
  return model.win.length > 0 && model.win.some((token) => result.tokens.has(token));
}

/**
 * NO FLAG READ BEFORE IT CAN BE WRITTEN, in play order (check-flag-order's
 * deferred half). A site the player can stand at -- its room, conversation,
 * node or held item reached -- whose gate reads a flag value that nothing he
 * can reach from a fresh save ever writes, is content waiting on a write that
 * never comes. Engine-written and pending flags are named by check-flag-order;
 * here they are judged by what the model can see happen.
 */
export function unwrittenReads(model, full = reach(model)) {
  const out = [];
  for (const site of model.sites) {
    if (full.fired.has(site.index)) continue;
    const atHand = site.req.every((req) => req.tok === undefined || !/^[rntid]:/.test(req.tok) || full.tokens.has(req.tok));
    if (!atHand) continue;
    for (const req of site.req) {
      if (req.flag === undefined || full.state.flagPasses(req.flag, req.test, req.neg)) continue;
      out.push({ site: site.id, flag: req.flag, wants: `${req.neg ? 'not ' : ''}${JSON.stringify(req.test)}` });
    }
  }
  return out;
}

/* ---- losses: where the facts stop accumulating ----------------------------- */

/** The facts a site's effects take away (a flag's other values, an item, a puzzle's being incomplete). */
export function lossesOf(model, site) {
  const lost = new Set();
  for (const effect of site.effects) {
    if (effect.set !== undefined) {
      const def = model.flagDefs.get(effect.set);
      if (def && BOOLEAN_TYPES.has(def.type)) lost.add(`f:${effect.set}=${JSON.stringify(!effect.value)}`);
      else lost.add(`f:${effect.set}~${JSON.stringify(effect.value)}`);
    }
    // A count moved on is no longer what it was: every value it has had goes up by one.
    if (effect.add !== undefined) lost.add(`f:${effect.add}~+`);
    if (effect.gain !== undefined) lost.add(`-i:${effect.gain}`);
    if (effect.drop !== undefined) lost.add(`i:${effect.drop}`);
    if (effect.tok?.startsWith('p:')) lost.add(`-${effect.tok}`);
  }
  return lost;
}

/** Applies a loss to a fact set: `f:X~v` means "X is now v", so every other value of X goes. */
function withoutLosses(tokens, lost) {
  const out = new Set(tokens);
  for (const loss of lost) {
    const tilde = loss.indexOf('~');
    if (loss.startsWith('f:') && tilde > 0 && loss.slice(tilde + 1) === '+') {
      const flag = loss.slice(2, tilde);
      for (const token of [...out]) {
        if (!token.startsWith(`f:${flag}=`)) continue;
        const value = JSON.parse(token.slice(token.indexOf('=') + 1));
        if (typeof value !== 'number') continue;
        out.delete(token);
        out.add(`f:${flag}=${value + 1}`);
      }
      out.add(`f:${flag}+`);
    } else if (loss.startsWith('f:') && tilde > 0) {
      const flag = loss.slice(2, tilde);
      const keep = `f:${flag}=${loss.slice(tilde + 1)}`;
      for (const token of [...out]) {
        if ((token.startsWith(`f:${flag}=`) && token !== keep) || token === `f:${flag}+`) out.delete(token);
      }
      out.add(keep);
    } else {
      out.delete(loss);
    }
  }
  return out;
}

/** Does this site's gate need any of the facts lost? */
function needsLost(site, lost) {
  for (const loss of lost) {
    const tilde = loss.indexOf('~');
    if (loss.startsWith('f:') && tilde > 0) {
      const flag = loss.slice(2, tilde);
      if (site.reads.flags.includes(flag)) return true;
    } else if (loss.startsWith('f:')) {
      const flag = loss.slice(2, loss.indexOf('='));
      if (site.reads.flags.includes(flag)) return true;
    } else if (site.reads.tokens.includes(loss)) {
      return true;
    }
  }
  return false;
}

/**
 * A site that, once it has fired, cannot fire again: the engine says once (a
 * dialogue option's gift, a thing picked up), or it spends its own gate and
 * nothing else in the game puts the gate back (the Nugget piano's "tuned this
 * visit" is spent by tuning and put back by walking in again; it pays again).
 */
function spendsItself(model, site, full) {
  if (site.once) return true;
  const lost = lossesOf(model, site);
  if (!lost.size || !needsLost(site, lost)) return false;
  const after = reach(model, { from: withoutLosses(new Set([...full.tokens, ...site.yields]), lost),
    exclude: new Set([site.index]) });
  return !after.state.satisfies(site.req);
}

/**
 * WIN FROM EVERY REACHABLE STATE, ONE LOSS AT A TIME.
 *
 * For each site that takes something away, the worst case the model can
 * build: play reaches the site WITHOUT having fired anything that wanted what
 * it takes (if it can; else without each such thing in turn), the loss lands,
 * and every one-time site already played stays spent. A dead end is a loss
 * after which the win is unreachable.
 */
export function lossAnalysis(model, full = reach(model)) {
  const findings = [];
  const spentCache = new Map();
  const spent = (site) => {
    if (!spentCache.has(site.index)) spentCache.set(site.index, spendsItself(model, site, full));
    return spentCache.get(site.index);
  };
  const firedCache = new Map();
  const firedWithout = (index) => {
    if (!firedCache.has(index)) firedCache.set(index, reach(model, { exclude: new Set([index]) }).fired);
    return firedCache.get(index);
  };
  for (const site of model.sites) {
    if (!full.fired.has(site.index)) continue;
    const lost = lossesOf(model, site);
    if (!lost.size) continue;
    // Who wanted it? Nobody reachable: nothing to strand.
    const wanted = model.sites.filter((other) => other !== site && full.fired.has(other.index) && needsLost(other, lost));
    if (!wanted.length) continue;
    // The loss taken before everything that wanted it -- or, where it needs some of them first
    // itself, before all the rest; or, failing that, before each in turn.
    let before = wanted;
    let pre = reach(model, { exclude: new Set(wanted.map((one) => one.index)) });
    if (!pre.fired.has(site.index)) {
      before = wanted.filter((one) => firedWithout(one.index).has(site.index));
      pre = reach(model, { exclude: new Set(before.map((one) => one.index)) });
    }
    if (before.length && !pre.fired.has(site.index)) {
      const alone = before.find((one) => firedWithout(one.index).has(site.index));
      before = [alone];
      pre = reach(model, { exclude: new Set([alone.index]) });
    }
    if (!before.length) continue;
    // What could give the lost facts back, if it has not already been spent.
    const restores = model.sites.filter((other) => pre.fired.has(other.index) && other !== site
      && other.yields.some((token) => restoresLoss(token, lost)));
    const exclude = new Set([site.index, ...restores.filter(spent).map((one) => one.index)]);
    const start = withoutLosses(new Set([...pre.tokens, ...site.yields]), lost);
    const after = reach(model, { from: start, exclude });
    if (winReached(model, after)) continue;
    const missing = [...model.puzzleSites.keys()].filter((id) => !after.tokens.has(`p:${id}`));
    findings.push({ site: site.id, lost: [...lost].sort(), before: before.map((one) => one.id).sort(), missing: missing.sort() });
  }
  return findings;
}

/** Would this fact undo one of the losses? */
function restoresLoss(token, lost) {
  for (const loss of lost) {
    const tilde = loss.indexOf('~');
    if (loss.startsWith('f:') && tilde > 0) {
      const flag = loss.slice(2, tilde);
      if (token.startsWith(`f:${flag}=`) || token === `f:${flag}+`) return true;
    } else if (token === loss) {
      return true;
    }
  }
  return false;
}

/**
 * THE DECLARED GRAPH: per canonical puzzle, the sites that complete it, what
 * each reads and what each writes. Derived, never typed; content/puzzles/
 * puzzle-graph.json is this, written by tools/derive-puzzle-graph.mjs, and
 * check-puzzle-graph fails the day the file and the content disagree.
 */
export function declaredGraph(model, canonical) {
  const describe = (reqs) => reqs.map((req) => {
    if (req.tok !== undefined) return req.tok;
    if (req.flag !== undefined) return `${req.neg ? 'not ' : ''}${req.flag}=${JSON.stringify(req.test)}`;
    if (req.any !== undefined) return { any: req.any.map(describe) };
    if (req.count !== undefined) return { atLeast: req.atLeast, of: describe(req.count) };
    return null;
  });
  return {
    schema: 1,
    note: 'DERIVED -- DO NOT EDIT. Written by tools/derive-puzzle-graph.mjs from the content the engine plays (tools/lib/puzzle-model.mjs). Per canonical puzzle (errata ruling 5; errata 213): every site that completes it, what that site reads and what it writes. tools/check-puzzle-graph.mjs traverses the whole site graph this is drawn from and fails if this file and the content disagree. Ids only.',
    win: model.win,
    puzzles: canonical.map((id) => ({
      id,
      completedBy: (model.puzzleSites.get(id) ?? []).map((site) => ({
        site: site.id,
        requires: describe(site.req),
        yields: site.yields,
      })),
    })),
  };
}
