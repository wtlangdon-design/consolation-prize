import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { allInteractables, loadContent, ROOT, Report, runCheck } from './lib/content.mjs';

/**
 * Ruling 19b: LOOK may not describe what is not rendered. LISTEN may.
 *
 * A LOOK line naming eleven men in a visibly empty room is a contradiction
 * the player can see. A LISTEN line describing an argument through a window
 * is not, and that asymmetry is a large part of why LISTEN carries this
 * game's texture.
 *
 * This reports CANDIDATES, over docs and wired content alike. Whether a
 * candidate is a violation depends on what the room's composition actually
 * draws, which no script can know -- so, like the variant-1 audit, it reports
 * as notes and never fails. Doc 19 resolved the twenty-one found by the first
 * pass; anything appearing here now is either resolved-at-composition-time or
 * new.
 *
 * WHAT IT DOES NOT FLAG, deliberately. 19b is about what a line claims is
 * VISIBLE, and none of these claim anything:
 *   - inferences about absent people -- "Somebody built that properly"
 *   - statements about the population -- "Ten thousand men have dug for
 *     twelve years"
 *   - hypotheticals -- "A man could wait here a long time and not mind"
 *   - Thad on his own reflection
 */

//: Present-tense figures and activity. Not "somebody did", which is an
//: inference about a person who is not here and is most of doc 05's charm.
const PRESENT = [
  /\bthere (?:is|are) (?:a |an |one |two |three |several )?(?:other )?(?:\w+ )?(man|woman|boy|girl|dog|cat|figure|men|people)\b/i,
  /\b(?:eleven|ten|nine|eight|seven|six|five|four|three|two)\s+(?:\w+\s+){0,2}(men|women|people|miners|mules|horses|mourners)\b/i,
  /\bmen\b(?=[^.]*\b(?:are|walking|going|coming|working|drinking|talking|sitting|standing)\b)/i,
  /\b(?:he|she|they)\s+(?:is|are)\s+(?:\w+ing)\b/i,
  /\b(?:everyone|nobody|somebody)\s+in\s+(?:the|this|here)\b/i,
  /\bpeople are\b/i,
  /\bqueue|\blines?\b(?=[^.]*\b(?:inquiring|filing|waiting)\b)/i,
  /\ba man, (?:crouched|standing|sitting|leaning)\b/i,
];

/**
 * Doc 19's decisions, so a re-run says which candidates are SETTLED.
 *
 * Without this the audit reports the same list forever: the Nugget's patrons
 * line still names eleven men after eleven men were drawn, because the line
 * was never the problem. `drawn` means the composition now renders it and the
 * candidate is closed. `rewritten` means the line no longer asserts it.
 * `at composition` means the room is not drawn yet and the decision applies
 * when it is -- open, but not a defect.
 *
 * Anything matching none of these is genuinely new and is what a re-run is
 * for.
 */
const RESOLVED = [
  ['nugget/patrons', 'drawn', 'eleven men at the bar and the two far tables'],
  ['nugget/stove', 'drawn', 'one of the eleven, beside the stove'],
  ['nugget/stairs', 'drawn', 'the man on the landing, on the seventh tread'],
  ['nugget/portrait', 'drawn', 'the room is occupied, so "nobody in here" has a here'],
  ['nugget/back_room_door', 'rewritten', 'the men moved to LISTEN; the door is now shut'],
  ['nugget/cards', 'drawn', 'the near table is vacated and the crowd is elsewhere'],
  ['16-room-03-content', 'drawn', 'doc 16 is the Nugget; see the nugget entries'],
  ['ROOM 29', 'drawn', 'single-pixel traffic on Main Street, two rows'],
  ['claims_registrar/two_lines', 'rewritten', 'doc 19 section 2: the queues are empty'],
  // Doc 19 keeps the spindle, which means the room owes ONE drawn man. That
  // falls out of the decision rather than being stated in it, and it is the
  // kind of consequence that gets lost between a ruling and a composition.
  ['claims_registrar/number_spindle', 'at composition', 'one other man, and exactly one'],
  ['NUMBER SPINDLE', 'at composition', 'one other man, and exactly one'],
  ['ROOM 7', 'rewritten', 'doc 05 superseded by doc 19 section 2'],
  ['stage_road/team', 'drawn', 'the wheel pair, ruling 19a'],
  ['stage_road/lamp', 'drawn', 'Hob and his lamp'],
  ['main_street/posted_notices', 'ambient', 'the letter-writer is an ambient sprite'],
  ['POSTED NOTICES', 'ambient', 'doc 05 carries the same line; the letter-writer is an ambient'],
  ['main_street/dog', 'drawn', 'street_dog, x88'],
  ['13-room-02-content', 'drawn', 'doc 13 is Main Street; the dog is drawn'],
  ['00-errata', 'drawn', 'the errata quotes lines that are wired and drawn elsewhere'],
  ['17-opening-sequence', 'drawn', 'doc 17 is Room 1; Hob is drawn'],
  ['main_street/to_company', 'accepted', 'doc 19 section 4: habitual, not a claim about the frame'],
  ['ROOM 12', 'at composition', 'the man looking at the peaches'],
  ['ROOM 15', 'at composition', 'four numbered mules'],
  ['ROOM 19', 'at composition', 'the cat, in two window states'],
  ['ROOM 20', 'at composition', 'the alley cat, as an ambient sprite'],
  ['ROOM 22', 'at composition', 'both crowds, one composition per time of day'],
  ['ROOM 26', 'at composition', 'the sluice men drawn, the panning man an ambient'],
  ['ROOM 31', 'at composition', 'nine mourners, and Hob at the back'],
  ['ROOM 36', 'at composition', 'the somebody the dog is sitting with'],
  ['ROOM 8', 'accepted', 'ten thousand men over twelve years is the population, not the frame'],
  ['ROOM 13', 'accepted', 'two thousand people over twelve years, likewise'],
  ['ROOM 28', 'accepted', 'Sheng is a speaking character with his own sprite'],
  ['ROOM 30', 'accepted', 'ten thousand men who came here individually, over twelve years'],
  ['PHOTOGRAPHER', 'accepted', 'four dozen men in Ohio, which is the joke'],
];

export function check() {
  const report = new Report('LOOK describes only what is rendered (ruling 19b)');
  const buckets = new Map();
  const open = [];
  let scanned = 0;

  for (const { where, line } of docLines().concat(wiredLines())) {
    scanned += 1;
    if (!PRESENT.some((pattern) => pattern.test(line))) continue;
    const hit = RESOLVED.find(([match]) => where.includes(match));
    if (hit) {
      const key = `${hit[1]} -- ${hit[2]}`;
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    } else {
      open.push({ where, line });
    }
  }

  report.note(`${scanned} LOOK lines scanned across docs and wired content`);
  for (const [key, count] of [...buckets].sort()) {
    report.note(`  ${count} line(s)  ${key}`);
  }
  report.note(`${open.length} candidate(s) doc 19 does not cover:`);
  for (const { where, line } of open) {
    report.note(`  names a figure  ${where}: "${truncate(line)}"`);
  }
  if (open.length === 0) report.note('  none');
  return report;
}

/**
 * LOOK lines from the design documents.
 *
 * The LISTEN half of a combined line is dropped, which the first pass of this
 * audit did not do. Docs 08 to 10 write their lighter hotspots as
 * `(The chair -- **LOOK:** "..." **LISTEN:** "...")` on ONE line, so taking
 * every quoted string from any line mentioning LOOK attributed Room 34's
 * LISTEN to its LOOK and reported a violation in a room that never had one.
 */
function docLines() {
  const out = [];
  for (const file of readdirSync(resolve(ROOT, 'docs')).filter((n) => n.endsWith('.md')).sort()) {
    let room = '';
    let spot = '';
    for (const raw of readFileSync(resolve(ROOT, 'docs', file), 'utf8').split('\n')) {
      const text = raw.trim();
      const head = text.match(/^(#{1,6})\s+(.*)$/);
      if (head) {
        const title = head[2].replace(/[*_]/g, '').trim();
        if (head[1].length <= 2) { room = title; spot = ''; } else { spot = title; }
        continue;
      }
      const bold = text.match(/^>?\s*\*\*([^*]+)\*\*/);
      if (bold && !/^>?\s*\*\*(LOOK|LISTEN)/i.test(text)) {
        spot = bold[1].replace(/[—·].*$/, '').trim();
      }
      const look = text.split(/\*\*LISTEN/i)[0];
      if (!/\bLOOK\b/.test(look)) continue;
      for (const quoted of look.matchAll(/"([^"]{10,})"/g)) {
        out.push({ where: `${file} ${room} / ${spot}`, line: quoted[1] });
      }
    }
  }
  return out;
}

function wiredLines() {
  const content = loadContent();
  const out = [];
  for (const { roomId, target } of allInteractables(content)) {
    for (const rule of target.responses?.LOOK_AT ?? []) {
      for (const line of [rule.say, ...(rule.repeat ?? [])]) {
        if (line) out.push({ where: `WIRED ${roomId}/${target.id}`, line });
      }
    }
  }
  return out;
}

function truncate(line) {
  return line.length > 78 ? `${line.slice(0, 75)}...` : line;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(runCheck(check()) ? 0 : 1);
}
