import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { loadContent } from './lib/content.mjs';

/**
 * DRAWS THE STAGING, so it can be looked at before it is played.
 *
 * WHY. Half the faults in the session that produced this were obvious in a
 * picture and invisible in JSON. Thad standing among the horses is a DRAWING
 * problem -- it took a screenshot of the running game to see, and the numbers
 * that caused it looked perfectly reasonable in a table. So did a coach placed
 * seven beats after it was first seen.
 *
 * Two views, because they fail differently:
 *
 *   THE MAP  -- every position plotted on the room's own plate, so a mark
 *               inside a vehicle or off the walkable band is visible as a
 *               shape rather than inferred from a pair of numbers.
 *
 *   THE TIMELINE -- rows are ENTITIES, columns are BEATS. Where the coach is
 *               at beat 2 becomes a cell you look at, rather than something
 *               you work out from a `from` seven beats later. That is the view
 *               that would have shown the coach's placement gap at a glance,
 *               and the per-beat tables never could.
 *
 * Output is SVG, into renders/, and it is a render rather than a shipping
 * asset: it is regenerated from the staging table and never edited.
 */

const PLAY_W = 1920;
const PLAY_H = 864;

const COLOUR = {
  thad: '#6fb3ff',
  hob: '#ffb454',
  coach: '#ff6f8f',
  other: '#9f7fff',
};
const of = (who) => COLOUR[who] ?? COLOUR.other;

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Everything that happens to one actor, in order, with the beat it happens in.
 *
 * A STAGED `say` CARRIES NO ACTOR -- it names one of the beat's own lines by
 * index -- so `staged.actor` is undefined and it was being dropped. The label
 * branch for it existed and was unreachable, which is the worst state for a
 * drawing to be in: the tool looked like it handled the step and silently left
 * three of them off Hob's row. His beat 9 read `walk / walk`, the exact shape
 * the say-step was added to fix.
 *
 * THE SPEAKER IS THE ROW. `beat.lines[i].speaker` is an entity id, so a line
 * lands on the row of whoever says it, between the two walks -- which is the
 * whole point of being able to place one.
 */
function timeline(sequence) {
  const rows = new Map();
  const push = (who, entry) => {
    if (!who) return;
    if (!rows.has(who)) rows.set(who, []);
    rows.get(who).push(entry);
  };
  for (const beat of sequence.beats ?? []) {
    for (const staged of beat.staging ?? []) {
      const spoken = staged.do === 'say' ? (beat.lines ?? [])[staged.line] : undefined;
      push(staged.actor ?? spoken?.speaker, { beat: String(beat.beat), ...staged, spoken });
    }
  }
  return rows;
}

function drawMap(sequence, room) {
  const rows = timeline(sequence);
  const parts = [];
  parts.push(`<image href="../${room.background}" x="0" y="0" width="${PLAY_W}" height="${PLAY_H}"/>`);
  parts.push(`<rect x="0" y="0" width="${PLAY_W}" height="${PLAY_H}" fill="#000" opacity="0.45"/>`);

  // The walkable band and the walk box, so a mark outside them is visible.
  for (const zone of room.walkable ?? []) {
    const [x, y, w, h] = zone.rect;
    parts.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#4f8" opacity="0.10"/>`);
    parts.push(`<line x1="${x}" y1="${y}" x2="${x + w}" y2="${y}" stroke="#4f8" stroke-opacity="0.5"/>`);
    parts.push(`<text x="8" y="${y + 20}" fill="#9fe" font-size="16" font-family="monospace">y${y} · ${zone.id ?? ''}</text>`);
  }

  for (const [who, steps] of rows) {
    const colour = of(who);
    let last = null;
    for (const step of steps) {
      const to = step.to ?? step.from;
      if (!to) continue;
      const [x, y] = to;
      const inFrame = x >= 0 && x <= PLAY_W;
      const cx = Math.max(24, Math.min(PLAY_W - 24, x));
      if (last) {
        parts.push(
          `<line x1="${last[0]}" y1="${last[1]}" x2="${cx}" y2="${y}" stroke="${colour}"`
          + ' stroke-width="3" stroke-opacity="0.55" stroke-dasharray="10 8"/>',
        );
      }
      const placed = step.do === 'move' && step.from;
      parts.push(
        `<circle cx="${cx}" cy="${y}" r="${placed ? 16 : 11}" fill="${placed ? colour : 'none'}"`
        + ` stroke="${colour}" stroke-width="4"/>`,
      );
      parts.push(
        `<text x="${cx + 22}" y="${y + 6}" fill="${colour}" font-size="22" font-family="monospace">`
        + `${esc(who)} b${esc(step.beat)}${inFrame ? '' : ' (off frame)'}</text>`,
      );
      last = [cx, y];
    }
  }
  return parts.join('\n');
}

function drawTimeline(sequence) {
  const rows = timeline(sequence);
  const beats = (sequence.beats ?? []).map((b) => String(b.beat));
  const COL = 150;
  const LEFT = 150;
  const TOP = 90;
  // THE ROW IS AS TALL AS ITS BUSIEST CELL. A cell's labels are stacked and
  // centred on the row line, so Thad's six steps in beat 2 ran fifty units
  // either side of it and printed through the coach's row above -- two
  // "PLACED" labels overlapping on a picture whose only job is to be read.
  const stack = Math.max(1, ...[...rows.values()].flatMap((steps) => {
    const per = new Map();
    for (const step of steps) per.set(step.beat, (per.get(step.beat) ?? 0) + 1);
    return [...per.values()];
  }));
  const ROW = Math.max(64, stack * 20 + 28);
  const w = LEFT + beats.length * COL + 40;
  const h = TOP + rows.size * ROW + 60;
  const parts = [`<rect x="0" y="0" width="${w}" height="${h}" fill="#14141c"/>`];

  beats.forEach((b, i) => {
    const x = LEFT + i * COL;
    const beat = sequence.beats[i];
    const control = beat.control ?? '';
    parts.push(`<rect x="${x}" y="40" width="${COL - 6}" height="${h - 90}" fill="${
      control === 'player' ? '#1e2430' : '#181822'}"/>`);
    parts.push(`<text x="${x + 8}" y="26" fill="#e8e8f4" font-size="22" font-family="monospace">beat ${esc(b)}</text>`);
    parts.push(`<text x="${x + 8}" y="52" fill="#7f7f96" font-size="15" font-family="monospace">${esc(control)}</text>`);
  });

  let r = 0;
  for (const [who, steps] of rows) {
    const y = TOP + r * ROW + 30;
    const colour = of(who);
    parts.push(`<text x="12" y="${y + 6}" fill="${colour}" font-size="24" font-family="monospace">${esc(who)}</text>`);
    // Where they are known to be, beat by beat -- the thing the per-beat
    // tables could never show.
    let alive = false;
    beats.forEach((b, i) => {
      const x = LEFT + i * COL;
      const here = steps.filter((s) => s.beat === b);
      const places = here.some((s) => s.do === 'move' && s.from);
      if (places) alive = true;
      if (alive) {
        parts.push(`<line x1="${x}" y1="${y}" x2="${x + COL - 6}" y2="${y}" stroke="${colour}"`
          + ' stroke-width="3" stroke-opacity="0.35"/>');
      }
      here.forEach((s, k) => {
        // EVERY STEP KIND IS NAMED HERE, INCLUDING THE ONES WHOSE LABEL IS
        // THEIR OWN NAME. `walk` is the commonest step in the file and it used
        // to reach the drawing through the default branch -- correct by
        // accident, and the same latent shape that left `say` unreachable: the
        // next kind added would also fall through, silently, and look drawn.
        // `tools/check-drawer-coverage.mjs` fails the build if a kind appears
        // in a staging table and is not named on one of these lines.
        const label = s.do === 'move' ? (s.from ? 'PLACED' : 'move')
          : s.do === 'say' ? `"${(s.spoken?.line ?? `say ${s.line}`).slice(0, 22)}"`
            : s.do === 'chore' ? s.clip
              : s.do === 'face' ? `face ${s.facing}`
                : s.do === 'walk' ? 'walk'
                  // The eighth kind. A cleared state reads as the default
                  // rather than as a blank, because "setState" with nothing
                  // after it looks like a truncation.
                  : s.do === 'setState' ? `${s.object} -> ${s.state ?? 'default'}`
                    // The ninth. Named with its verb, because "interact" alone
                    // does not say which of nine it is.
                    : s.do === 'interact' ? `${s.verb} ${s.target}`
                      // The tenth. Named with its duration, because a wait
                      // whose length is invisible is the one step you cannot
                      // read the timing of from the picture.
                      : s.do === 'wait' ? `wait ${s.seconds}s`
                        : `UNDRAWN: ${s.do}`;
        parts.push(`<circle cx="${x + 14}" cy="${y}" r="7" fill="${places && k === 0 ? colour : '#14141c'}"`
          + ` stroke="${colour}" stroke-width="3"/>`);
        parts.push(`<text x="${x + 28}" y="${y + 6 + k * 20 - (here.length - 1) * 10}" fill="${colour}"`
          + ` font-size="15" font-family="monospace">${esc(label)}</text>`);
      });
      if (!alive && here.length) {
        parts.push(`<text x="${x + 8}" y="${y + 24}" fill="#ff5f5f" font-size="15"`
          + ' font-family="monospace">USED BEFORE PLACED</text>');
      }
    });
    r += 1;
  }
  return { body: parts.join('\n'), w, h };
}

const content = loadContent();
mkdirSync('renders', { recursive: true });
for (const { data: sequence } of content.sequences ?? []) {
  const room = content.rooms.find(({ data }) => data.id === 'stage_road')?.data;
  if (!room) continue;

  const map = `<svg xmlns="http://www.w3.org/2000/svg" width="${PLAY_W}" height="${PLAY_H}"`
    + ` viewBox="0 0 ${PLAY_W} ${PLAY_H}">\n${drawMap(sequence, room)}\n</svg>\n`;
  writeFileSync(`renders/staging-map-${sequence.id}.svg`, map);

  const t = drawTimeline(sequence);
  writeFileSync(
    `renders/staging-timeline-${sequence.id}.svg`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="${t.w}" height="${t.h}"`
    + ` viewBox="0 0 ${t.w} ${t.h}">\n${t.body}\n</svg>\n`,
  );
  process.stdout.write(
    `wrote renders/staging-map-${sequence.id}.svg and renders/staging-timeline-${sequence.id}.svg\n`,
  );
}
