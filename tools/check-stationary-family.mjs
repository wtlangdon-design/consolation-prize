import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadContent, readJson, Report, ROOT, runCheck } from './lib/content.mjs';

/**
 * A character standing still is drawn from ONE drawing per facing.
 *
 * Tyler's Room 5 playthrough (2026-09-04): Thad, stationary at the counter,
 * facing back, "changes into a walking-looking pose with one foot raised
 * behind him". The state machine was right -- he was idle and the clip was
 * `idle-break` -- and the ART was wrong: `thad-idlebreak-back` had been rigged
 * from `reference/casting/thad-back.png`, a STRIDING generation of an earlier
 * Thad, while `thad-stand-back` and `thad-idle-back` come from the standing
 * casting still. Every few seconds the idle break swapped him for a different
 * drawing of a man mid-step, and nothing said so.
 *
 * So the invariant is on the rig records rather than on the engine: for each
 * facing, every clip that plays WHILE HE IS STANDING STILL -- stand, idle,
 * idle-break, recoil (the chores settle back into stand) -- must name the same
 * `source` as that facing's stand clip. A frame rigged from a different
 * drawing cannot be the same man, whatever it is called.
 *
 * Walk clips are reported rather than failed: their sources are the
 * continuity question this check's companion sheet puts to Tyler, and a
 * profile walk cannot be rigged from a standing still by the current tool.
 */
const STATIONARY = ['stand', 'idle', 'idle-break', 'recoil'];

function sourceOf(dir) {
  const path = resolve(ROOT, dir, 'rig.json');
  if (!existsSync(path)) return null;
  const rig = JSON.parse(readFileSync(path, 'utf8'));
  return rig.source ?? rig.invocation?.source ?? null;
}

export function check() {
  const report = new Report('Every stationary clip of a facing derives from that facing\'s stand source');
  const content = loadContent();
  let checked = 0;
  const records = (content.manifest.actors ?? [content.manifest.actor]).map((path) => readJson(path));
  for (const actor of records) {
    const id = actor.id;
    const clips = actor.clips ?? [];
    for (const facing of actor.facings ?? []) {
      const stand = clips.find((clip) => clip.id === 'stand' && clip.facing === facing && !clip.state);
      if (!stand) continue;
      const standDir = stand.frames[0].replace(/\/[^/]+$/, '');
      const standSource = sourceOf(standDir);
      if (!standSource) { report.fail(`${id} ${facing}: ${standDir} has no source in its rig.json`); continue; }
      for (const clip of clips) {
        if (clip.facing !== facing || clip.state) continue;
        const dir = clip.frames[0].replace(/\/[^/]+$/, '');
        const source = sourceOf(dir);
        if (!STATIONARY.includes(clip.id)) {
          if (source && source !== standSource) report.note(`${id} ${facing} ${clip.id}: ${dir} is rigged from ${source}, not the stand's ${standSource} (a walk; see the continuity sheet)`);
          continue;
        }
        checked += 1;
        if (source !== standSource) {
          report.fail(`${id} ${facing} ${clip.id}: ${dir} is rigged from ${source ?? 'no recorded source'}, `
            + `but he stands from ${standSource}. A stationary man drawn from two drawings is two men.`);
        }
      }
    }
  }
  report.note(`${checked} stationary clips checked against their stand sources`);
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(runCheck(check()) ? 0 : 1);
}
