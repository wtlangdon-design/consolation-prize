/**
 * EVERY LINE A PLAYER SEES ON THE MAIN PATH, IN ORDER (errata 226).
 *
 * The run is the one `tests/full-game.test.ts` makes: a fresh GameState, the
 * real content, and `tests/data/full-game-walkthrough.json` played step by
 * step through `tests/lib/headless-player.ts`. Nothing here plays anything
 * the headless player does not; it LISTENS, by wrapping the calls the player
 * already makes, and writes down what the screen would have shown at each:
 *
 *   opening   the sequence's automatic beats and its carried beats (stepsFor, carriedStepsFor)
 *   arrival   a room's arrival lines and arrival scenes (GameScene.arrivalLines)
 *   act       an act's opening line (GameState.openAct)
 *   greeting  a tree's opening, said before its list (GameScene: openingOf / duelIntro / greetsWithBark)
 *   echo      Thad saying the option he chose (GameScene: option.echo ?? the wording drawn)
 *   reply     what an option is answered with, every line of it (DialogueRunner.select)
 *   verb      a verb's line and the lines after it (GameState.interact), exits and their scenes too
 *   bark      what each figure present calls out as Thad walks up to him (AmbientLayer.checkApproach)
 *   cutaway   a cut-away's lines, at the first quiet moment once it is due (GameScene.tickCutaway)
 *
 * A stage direction that a figure in the room ACTS is played and never
 * printed (doc 95), so it is not a line anyone reads and is not recorded.
 *
 * WHAT IS NOT MODELLED, AND WHY. Barks are the run's one assumption: a
 * player is taken to walk up to everyone in every room he enters, which is
 * the most a player could hear. A figure who greets with his bark
 * (`greetsWithBark`) says it to Thad's face when Thad goes to talk to him, so
 * he is not barked at on the way in as well. A calling-out break's shout runs
 * on the wall clock, which a headless run does not have; errata 222 and 224
 * hold that one.
 *
 * Cut-aways write their `done` flag as the scene does; barks write their run
 * counters as the scene does. The run is held to the walkthrough's known
 * breaks exactly, so a recorder that changed the path would be noticed.
 */
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { loadContent } from '../../engine/core/ContentLoader.ts';
import { GameState } from '../../engine/core/GameState.ts';
import { MemoryStorage } from '../../engine/core/SaveManager.ts';
import { carriedStepsFor, stepsFor } from '../../engine/core/Opening.ts';
import { actOf, performersWith } from '../../engine/core/ActedDirections.ts';
import { HeadlessPlayer, PlayError, applyBypass, playStep, unmet } from '../../tests/lib/headless-player.ts';
import { ROOT } from './content.mjs';

export const WALKTHROUGH_PATH = 'tests/data/full-game-walkthrough.json';

const reader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));

/**
 * Plays the main path and returns what it showed.
 *
 * `mutate(content)` may change the loaded bundle before play starts. It is
 * for the tests, which put a fixed defect back to prove the check finds it.
 */
export async function playMainPath({ mutate } = {}) {
  const content = await loadContent(reader);
  if (mutate) mutate(content);
  const walkthrough = await reader(WALKTHROUGH_PATH);
  const state = new GameState(content, new MemoryStorage());
  const player = new HeadlessPlayer(state);
  const actor = content.actor.id;
  const lines = [];
  let step = null;
  /** What the next tree start is: whose greeting, said through an action or not, a called duel. */
  let greeting = null;

  const record = (kind, speaker, text, extra = {}) => {
    if (typeof text !== 'string' || !text.trim()) return;
    if (extra.direction && actOf(performersWith(player.present(), content.actor), text)) return;
    lines.push({ seq: lines.length, step, room: state.roomId, kind, speaker: speaker ?? actor, text, ...extra });
  };
  const recordAll = (kind, spoken, extra = {}) => {
    for (const one of spoken ?? []) {
      record(kind, one.speaker, one.line, { ...extra, ...(one.direction ? { direction: true } : {}) });
    }
  };
  const within = (context, run) => {
    const before = greeting;
    greeting = context;
    try { return run(); } finally { greeting = before; }
  };

  // ---- the dialogue runner -------------------------------------------------
  const dialogue = state.dialogue;
  const start = dialogue.start.bind(dialogue);
  dialogue.start = (treeId) => {
    const how = greeting;
    greeting = null;
    if (how && !how.duel) {
      let said = dialogue.openingOf(treeId, how.viaAction === true);
      const host = how.host ? player.present().find((one) => one.id === how.host) : undefined;
      if (!said.length && host?.greetsWithBark) {
        said = player.ambient.barkLinesFor(host);
        player.ambient.markBarked(host);
      }
      recordAll('greeting', said, { tree: treeId });
    }
    return start(treeId);
  };
  const startDuel = dialogue.startDuel.bind(dialogue);
  dialogue.startDuel = (treeId, duelId) => {
    recordAll('greeting', dialogue.duelIntro(duelId), { tree: treeId, duel: duelId });
    return within({ duel: duelId }, () => startDuel(treeId, duelId));
  };
  const select = dialogue.select.bind(dialogue);
  dialogue.select = (optionId) => {
    const tree = dialogue.activeTreeId;
    const node = dialogue.positionSnapshot().node;
    const shown = dialogue.presentOptions().find((one) => one.option.id === optionId);
    const about = {
      tree, node, option: optionId, tag: shown?.option.tag ?? null,
      reselected: (shown?.selections ?? 0) > 0,
      ...(dialogue.inDuel ? { duel: dialogue.duelId } : {}),
    };
    const said = select(optionId);
    if (shown && shown.option.echo !== false) record('echo', actor, shown.option.echo ?? shown.text, about);
    if (said.say) record('reply', said.sayer, said.say, { ...about, ...(said.direction ? { direction: true } : {}) });
    recordAll('reply', said.rest, about);
    return said;
  };

  // ---- the game state ------------------------------------------------------
  const interact = state.interact.bind(state);
  state.interact = (target, verb) => {
    // A tree a response opens is opened by the state, with no greeting (GameState.applyInteraction).
    const result = within(null, () => interact(target, verb));
    const about = { target: target.id, verb };
    if (result.say) record('verb', result.by ?? actor, result.say, { ...about, ...(result.direction ? { direction: true } : {}) });
    recordAll('verb', result.then, about);
    return result;
  };
  const openAct = state.openAct.bind(state);
  state.openAct = () => {
    const said = openAct();
    for (const line of said) record('act', actor, line);
    return said;
  };

  // ---- the headless player's own steps (GameScene's, mirrored) -------------
  const arrivalLines = player.arrivalLines.bind(player);
  player.arrivalLines = () => {
    const entry = state.room.onEnter;
    if (entry) {
      const { held, scenes } = state.arrivalOf();
      if (!held) for (const line of entry.say ?? []) record('arrival', actor, line);
      for (const scene of scenes) recordAll('arrival', scene.lines);
    }
    return arrivalLines();
  };
  const arrival = player.arrival.bind(player);
  player.arrival = (from) => {
    arrival(from);
    // Thad walks up to everyone here: each says what he has for him (see the header).
    for (const npc of player.present()) {
      if (npc.greetsWithBark) continue;
      for (let guard = 0; guard < 4; guard += 1) {
        const fired = player.ambient.checkApproach(npc.x, npc.y, npc.id);
        if (!fired) break;
        if (fired.exchange) recordAll('bark', fired.exchange, { npc: npc.id });
        else record('bark', npc.id, fired.line, { npc: npc.id });
      }
    }
  };
  const talk = player.talk.bind(player);
  player.talk = (npcId) => within({ host: npcId, viaAction: false }, () => talk(npcId));
  const use = player.use.bind(player);
  player.use = (item, targetId) => within({ host: targetId, viaAction: true }, () => use(item, targetId));
  const accost = player.accost.bind(player);
  player.accost = () => {
    const due = state.room.onEnter?.accost;
    return within(due ? { host: due.npc, viaAction: Boolean(due.completes) } : null, () => accost());
  };
  const timelineStep = player.timelineStep.bind(player);
  player.timelineStep = (due) => {
    const action = due.completes !== undefined && !state.puzzleComplete(due.completes);
    return within({ viaAction: action }, () => timelineStep(due));
  };
  const playOpening = player.playOpening.bind(player);
  player.playOpening = () => {
    for (let at = player.openingAt; player.opening?.[at]?.kind === 'automatic'; at += 1) {
      for (const one of stepsFor(player.opening[at])) if (one.kind === 'say' && one.line) record('opening', one.actor, one.line);
    }
    return playOpening();
  };
  const playCarried = player.playCarried.bind(player);
  player.playCarried = () => {
    const before = [...player.carried];
    playCarried();
    const gone = before.slice(0, before.length - player.carried.length);
    // A beat that travels empties the rest; what came after it never played.
    const travels = gone.findIndex((beat) => (beat.staging ?? []).some((one) => one.do === 'travel'));
    for (const beat of travels < 0 ? gone : gone.slice(0, travels + 1)) {
      for (const one of carriedStepsFor(beat)) if (one.kind === 'say' && one.line) record('opening', one.actor, one.line);
    }
  };

  /** GameScene.tickCutaway: at a quiet moment, with Thad elsewhere, each due cut-away plays once. */
  const cutaways = () => {
    if (dialogue.isActive) return;
    for (const cut of content.cutaways) {
      if (cut.room === state.roomId || !state.flags.test(cut.when) || state.flags.test({ [cut.done]: true })) continue;
      state.flags.applyWrites({ [cut.done]: true });
      recordAll('cutaway', cut.lines, { cutaway: cut.id });
    }
  };

  // ---- the walk: tests/lib/headless-player.ts playThrough, with the step named ----
  const breaks = [];
  for (const one of walkthrough.steps) {
    step = one.id;
    let problem = null;
    let threw = false;
    try {
      playStep(player, one);
      const missing = unmet(player, one.expect);
      if (missing.length) problem = missing.join('; ');
    } catch (error) {
      if (!(error instanceof PlayError)) throw error;
      problem = error.message;
      threw = true;
    }
    if (problem !== null) {
      breaks.push({ step: one.id, problem });
      if (one.bypass) applyBypass(player, one.bypass);
      else if (threw && dialogue.isActive && !dialogue.inDuel) {
        try { player.leave(); } catch { dialogue.end(); player.settle(); }
      }
    }
    cutaways();
  }
  return {
    lines, breaks,
    knownBreaks: walkthrough.knownBreaks.map((one) => one.step),
    exitPool: content.exitPool ?? [],
    actor,
  };
}
