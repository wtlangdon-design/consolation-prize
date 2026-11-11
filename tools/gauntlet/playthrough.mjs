/**
 * THE PLAYTHROUGH RECORD: what `npm run gauntlet:full -- --record` keeps of a
 * whole game played in the real build (Tyler, 2026-11-09: "do a full play
 * through of the whole game again now, making sure there are no errors and it
 * shares the feel and vibe of MI").
 *
 * The probe reports identifiers and never words (engine/dev/Probe.ts), which
 * is right for a check and useless to a reader judging feel. This records the
 * words as the screen showed them, READ-ONLY, by wrapping the scene's own
 * say/bark/caption/notice calls and the bitmap face's draw in the running page:
 *
 *   transcript  every line put on screen, in play order, with the room, the
 *               act and the step (verb, item, option) that produced it, and
 *               every option menu offered, with the rows picked marked
 *   text        every string drawn outside its canvas, or with a character
 *               the face has no glyph for (CLAUDE.md, Typography)
 *   fps         Phaser's measured frame rate, sampled once a second
 *
 * Nothing is written into the game: the wrappers call through unchanged. Dev
 * build only (window.__game), as the probe is.
 */
import { readJson } from '../lib/content.mjs';

/** Installed before the page's own scripts; arms itself once the game scene exists. */
export function recorderInit() {
  const log = [];
  const text = [];
  const fps = [];
  window.__playthrough = { log, text, fps };
  const where = (scene) => {
    let room = null; let act = null;
    try { room = scene.state?.room?.id ?? null; } catch { /* not yet */ }
    try { act = scene.state?.flags?.counters?.().ACT ?? null; } catch { /* not yet */ }
    return { room, act };
  };
  let lastSay = null;
  let lastCard = null;
  const seenText = new Set();
  const arm = () => {
    const game = window.__game;
    const scene = game?.scene?.getScene?.('game');
    if (!scene || !scene.font) return false;
    const proto = Object.getPrototypeOf(scene);
    if (proto.__playthroughArmed) return true;
    proto.__playthroughArmed = true;
    const wrap = (name, record) => {
      const original = proto[name];
      if (typeof original !== 'function') { log.push({ kind: 'recorder', text: `no ${name} on the scene to record` }); return; }
      proto[name] = function wrapped(...args) {
        try { record(this, ...args); } catch (error) { log.push({ kind: 'recorder', text: String(error) }); }
        return original.apply(this, args);
      };
    };
    // AN ACTED DIRECTION (doc 95; errata 131 B, 141) is played, not printed: the
    // speech channel gets nothing. A reader is told what was acted, marked so.
    let lastActed = null;
    const acted = (self, speaker, line) => {
      const key = `${speaker}\u0000${line}`;
      if (!line || key === lastActed) return;
      lastActed = key;
      log.push({ kind: 'acted', t: performance.now(), speaker: speaker ?? null, text: line, ...where(self) });
    };
    const advance = proto.advanceSay;
    if (typeof advance === 'function') {
      proto.advanceSay = function advanced(...args) {
        const next = this.pendingSay?.[0];
        const out = advance.apply(this, args);
        try { if (next?.direction && (this.sayLines?.length ?? 0) === 0) acted(this, next.speaker, next.line); } catch { /* recording only */ }
        return out;
      };
    }
    wrap('setSay', (self, said, speaker, direction, echo) => {
      if (said === '' && self.performance?.current?.silent) { acted(self, speaker, self.performance.current.line); return; }
      // A HELD SILENCE (a `quiet` beat with no line: "Silence on Main Street. Long.").
      if (said === '') { log.push({ kind: 'silence', t: performance.now(), speaker: speaker ?? null, ...where(self) }); lastSay = null; return; }
      if (said === null || said === undefined) { lastSay = null; return; }
      const key = `${speaker}\u0000${said}`;
      if (key === lastSay) return;
      lastSay = key;
      log.push({ kind: 'say', t: performance.now(), speaker: speaker ?? null, text: said, direction: !!direction, echo: !!echo, ...where(self) });
    });
    wrap('showBark', (self, speaker, line) => log.push({ kind: 'bark', t: performance.now(), speaker, text: line, ...where(self) }));
    wrap('showCaption', (self, said) => log.push({ kind: 'caption', t: performance.now(), text: said, ...where(self) }));
    wrap('showNotice', (self, said) => { if (said) log.push({ kind: 'notice', t: performance.now(), text: said, ...where(self) }); });
    // THE FACE'S OWN DRAW: every string that reaches a canvas, checked against that canvas.
    const font = Object.getPrototypeOf(scene.font);
    const draw = font.draw;
    font.draw = function drawn(ctx, said, x, y, colour) {
      try {
        const key = `${said}|${Math.round(x)}|${Math.round(y)}`;
        if (said && !seenText.has(key)) {
          seenText.add(key);
          if (seenText.size > 20000) seenText.clear();
          const width = this.measure(said);
          const canvas = ctx?.canvas;
          const w = canvas?.width ?? 1920; const h = canvas?.height ?? 1080;
          // One glyph pixel of slack: the outline is drawn a glyph pixel out either way.
          const slack = this.scale;
          const missing = this.unsupported(said).filter((c) => c !== ' ');
          const off = x < -slack || y < -slack || x + width > w + slack || y + this.height > h + slack;
          if (off || missing.length) {
            text.push({ t: performance.now(), text: said, x: Math.round(x), y: Math.round(y), width, height: this.height,
              canvas: [w, h], off, missing, ...where(scene) });
          }
        }
      } catch { /* the draw itself must never be disturbed */ }
      return draw.apply(this, [ctx, said, x, y, colour]);
    };
    // THE ACT CARD and THE FRAME RATE, once a second and on change.
    let lastSample = performance.now();
    const tick = () => {
      try {
        const card = scene.actCard ?? null;
        if (card !== lastCard) {
          lastCard = card;
          if (card) log.push({ kind: 'card', t: performance.now(), text: card, ...where(scene) });
        }
        const now = performance.now();
        if (now - lastSample >= 1000) {
          lastSample = now;
          fps.push([Math.round(now), Math.round(game.loop.actualFps * 10) / 10, where(scene).room]);
        }
      } catch { /* sampling only */ }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    return true;
  };
  const poll = setInterval(() => { if (arm()) clearInterval(poll); }, 50);
}

/** A marker in the log: the step a player is taking, so every line after it is that step's. */
export async function mark(page, entry) {
  await page.evaluate((one) => window.__playthrough?.log.push({ ...one, t: performance.now() }), entry);
}

/** The option list on screen now, with the words a player reads, and which is about to be picked. */
export async function markMenu(page, picked) {
  await page.evaluate((pick) => {
    const scene = window.__game?.scene?.getScene?.('game');
    const dialogue = scene?.state?.dialogue;
    if (!dialogue?.isActive) return;
    const at = dialogue.positionSnapshot?.() ?? {};
    const options = dialogue.presentOptions().map((one) => ({
      id: one.option.id, text: one.text, tag: one.option.tag ?? null, exhausted: !!one.exhausted,
    }));
    window.__playthrough?.log.push({ kind: 'menu', t: performance.now(), tree: at.tree ?? null, node: at.node ?? null,
      options, picked: pick, room: scene.state?.room?.id ?? null, act: scene.state?.flags?.counters?.().ACT ?? null });
  }, picked);
}

export async function drain(page) {
  return page.evaluate(() => {
    const out = window.__playthrough ?? { log: [], text: [], fps: [] };
    return { log: out.log.splice(0), text: out.text.splice(0), fps: out.fps.splice(0) };
  });
}

/* ---- writing it down ---------------------------------------------------------- */

const manifest = readJson('content/manifest.json');
const names = new Map();
for (const path of manifest.ambient ?? []) {
  const npc = readJson(path);
  if (npc.id && npc.name) names.set(npc.id, npc.name);
}
const actor = readJson(manifest.actor);
const roomNames = new Map(manifest.rooms.map((path) => readJson(path)).filter((r) => r.id).map((r) => [r.id, r.name ?? r.id]));
const itemNames = new Map();
for (const path of [manifest.items].flat().filter(Boolean)) {
  const item = readJson(path);
  if (item?.id) itemNames.set(item.id, item.name ?? item.id);
}
const VERB_FILE = readJson('content/ui/verbs.json');
const verbNames = new Map([...VERB_FILE.verbs, VERB_FILE.walkVerb].filter(Boolean)
  .map((v) => [v.id, (v.label ?? v.id.replace(/_/g, ' ')).toUpperCase()]));
const roomFiles = new Map(manifest.rooms.map((p) => readJson(p)).filter((r) => r.id).map((r) => [r.id, r]));
const targetName = (roomId, id) => {
  const room = roomFiles.get(roomId);
  const found = [...(room?.exits ?? []), ...(room?.hotspots ?? [])].find((one) => one.id === id);
  return found?.name ?? names.get(id) ?? id;
};

const who = (speaker) => {
  if (!speaker) return '';
  if (speaker === actor.id) return 'THAD';
  return names.get(speaker) ?? speaker.replace(/_/g, ' ').toUpperCase();
};

/** What a step did, in a player's words. */
export function stepWords(step, room) {
  switch (step.do) {
    case 'opening': return 'NEW GAME -- the opening plays';
    case 'go': return `goes to ${roomNames.get(step.room) ?? step.room}`;
    case 'talk': return `TALK TO ${who(step.npc)}`;
    case 'use': return `USE ${itemNames.get(step.item) ?? step.item} ON ${targetName(room, step.on)}`;
    case 'give': return `GIVE ${itemNames.get(step.item) ?? step.item} TO ${targetName(room, step.on)}`;
    case 'verb': return `${verbNames.get(step.verb) ?? step.verb} ${targetName(room, step.on)}`;
    case 'duel': return 'the duel';
    case 'tap': return 'LISTEN TO the rock (the tap)';
    case 'wait': return 'waits';
    case 'leave': return 'leaves the conversation';
    case 'choose': return 'chooses';
    default: return step.do;
  }
}

const ACT_NAMES = { 1: 'ACT I', 2: 'ACT II', 3: 'ACT III', 4: 'ACT IV' };

/** The transcript a reader reads: plain markdown, in play order. */
export function transcriptMarkdown(log, { started, commit }) {
  const out = [];
  out.push('# The Last Claim in Consolation -- playthrough transcript', '');
  out.push(`Played in the real build (Chromium, dev server) by \`npm run gauntlet:full -- --record\`, ${started}, at commit ${commit}.`);
  out.push('Every line the screen showed, in play order. `>` marks the player\'s action; option menus list every row offered, `[x]` the one picked, `(asked)` a row already chosen before. Directions are in parentheses as the game shows them; a direction marked *[acted, no words on screen]* is played by the figures and never printed (doc 95), and *[a silence is held]* is a written pause. Barks (remarks thrown in passing) and written sounds are marked.', '');
  let act = null; let room = null;
  for (const one of log) {
    if (one.act !== undefined && one.act !== null && one.act !== act && one.kind !== 'step') {
      act = one.act;
      out.push('', `## ${ACT_NAMES[act] ?? `ACT ${act}`}`, '');
      room = null;
    }
    if (one.room && one.room !== room && one.kind !== 'step') {
      room = one.room;
      out.push('', `### ${roomNames.get(room) ?? room}`, '');
    }
    switch (one.kind) {
      case 'step': out.push(`> **${one.id}** -- ${one.words}`); break;
      case 'say': {
        const speaker = who(one.speaker);
        out.push(one.direction ? `${speaker ? `${speaker}: ` : ''}*${one.text}*` : `**${speaker || '(caption)'}:** ${one.text}`);
        break;
      }
      case 'acted': {
        const words = one.text.trim().startsWith('(') ? one.text.trim() : `(${one.text.trim()})`;
        out.push(`*[acted, no words on screen]* ${who(one.speaker) ? `${who(one.speaker)}: ` : ''}*${words}*`);
        break;
      }
      case 'silence': out.push(`*[a silence is held${one.speaker ? ` (${who(one.speaker)})` : ''}]*`); break;
      case 'bark': out.push(`*(bark)* **${who(one.speaker)}:** ${one.text}`); break;
      case 'caption': out.push(`*(sound)* ${one.text}`); break;
      case 'notice': out.push(`*(notice)* ${one.text}`); break;
      case 'card': out.push('', `**[ ${one.text} ]**`, ''); break;
      case 'menu': {
        out.push(`*Options${one.tree ? ` (${one.tree}/${one.node})` : ''}:*`);
        for (const option of one.options) {
          const mark = option.id === one.picked ? '[x]' : '[ ]';
          out.push(`- ${mark} ${option.text}${option.exhausted ? ' (asked)' : ''}`);
        }
        break;
      }
      case 'end': out.push('', `**[ ${one.text} ]**`); break;
      case 'recorder': out.push(`*(recorder: ${one.text})*`); break;
      default: break;
    }
  }
  out.push('');
  return out.join('\n').replace(/\n{3,}/g, '\n\n');
}
