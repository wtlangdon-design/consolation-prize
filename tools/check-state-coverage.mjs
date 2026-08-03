import { Report, readJson } from './lib/content.mjs';

/**
 * A state a character can be IN is a state every clip it can PLAY declares.
 *
 * THE DOOR FLASHED AND THE DRIVER DOUBLED, AND IT WAS ONE FAULT. The coach's
 * `idle` had a `door-open` variant and its `idle-break` had none, so every
 * time the horse pawed the coach fell back to the stateless clip -- the SHUT
 * door -- and the driver's overlay rect, keyed `clip/state`, fell back with
 * it. Both clips were well-formed, declared, loaded and correctly sized.
 *
 * A STATE THAT EXISTS ON ONE CLIP AND NOT ANOTHER UNSETS ITSELF WHENEVER THE
 * OTHER PLAYS. `clipOf` is exact-match-then-fall-back, which is right -- a
 * mover with no state must get the stateless clip -- and the same fallback,
 * reached by a mover that DOES have a state, is a silent state change.
 *
 * THIS IS THE THIRD DIRECTION ON THE SAME FAMILY. check-clip-agreement asks
 * whether two clips agree about their PIXELS. This asks whether they agree
 * about their STATE SET. Neither is answerable by looking at one clip, and
 * every check that came before looked at one clip.
 *
 * PARTIAL IS DECLARABLE, AND IT HAS TO BE. Thad has `idle/left/lookup` and no
 * lookup variant on any other clip or facing, and that is correct: he stops
 * looking up when he turns, by design, because he has no art that looks up in
 * any other direction. A check that failed on that would be failing on
 * correct work (R5j) and would be switched off. So a record may declare
 * `partialStates`, and what it buys is not silence -- the coverage is still
 * printed -- but the difference between a decision and an oversight.
 */
export function check() {
  const report = new Report('Every state a character can be in is declared by every clip it plays');
  const manifest = readJson('content/manifest.json');
  let actors = 0;
  let states = 0;
  const partial = [];

  for (const path of manifest.actors ?? []) {
    const actor = readJson(path);
    const clips = actor.clips ?? [];
    if (clips.length === 0) continue;
    actors += 1;
    const declared = new Set(clips.map((clip) => clip.state).filter(Boolean));
    // PER CLIP, NOT PER STATE. Excusing a whole state would have excused the
    // one that mattered: Thad's `lookup` is genuinely partial for `walk`,
    // `recoil` and `stand` -- he does not do any of those while looking up --
    // and NOT partial for `idle-break`, which fires on its own timer while he
    // stands there for the whole conversation. A blanket exception would have
    // silenced the defect along with the three non-defects.
    const excused = actor.partialStates ?? {};

    for (const state of [...declared].sort()) {
      states += 1;
      // Which (id, facing) pairs exist at all, and which of them carry it.
      const bodies = new Map();
      for (const clip of clips) {
        const key = `${clip.id}/${clip.facing}`;
        if (!bodies.has(key)) bodies.set(key, new Set());
        if (clip.state) bodies.get(key).add(clip.state);
      }
      // ONLY THE FACINGS THE STATE EXISTS IN. A state declared for `left`
      // alone says nothing about what `right` should do -- turning away from
      // a pose is a different question from playing a different clip while
      // holding it, and it is the one clipOf's fallback answers correctly.
      const facings = new Set(clips.filter((clip) => clip.state === state)
        .map((clip) => clip.facing));
      const missing = [...bodies.entries()]
        .filter(([key, has]) => facings.has(key.split('/')[1]) && !has.has(state))
        .map(([key]) => key)
        .sort();
      if (missing.length === 0) continue;
      const allowed = new Set(excused[state] ?? []);
      const said = missing.filter((key) => allowed.has(key.split('/')[0]));
      const bad = missing.filter((key) => !allowed.has(key.split('/')[0]));
      if (said.length) {
        partial.push(`${actor.id}/${state} declared partial for ${said.join(', ')} -- `
          + 'those fall back to the stateless clip while it is set, deliberately');
      }
      if (bad.length === 0) continue;
      report.fail(`${actor.id}: state "${state}" is declared on some clips and not on `
        + `${bad.join(', ')}. Whenever one of those plays, clipOf falls back to the `
        + 'stateless clip and THE STATE SILENTLY UNSETS ITSELF -- the door flashes, the '
        + `pose drops. Add the variant, or list the clip under partialStates.${state}`);
    }
  }

  report.note(`${states} state(s) across ${actors} actor(s) checked for clip coverage`);
  // NO SILENT CAPS: a declared exception is printed every run, so a decision
  // made once stays visible rather than becoming invisible by being accepted.
  for (const line of partial) report.note(line);
  return report;
}
