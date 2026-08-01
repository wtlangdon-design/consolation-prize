/**
 * Regenerates every render into renders/, and every shipping background.
 *
 * One command, because "push after each pass" only works if a pass is one
 * thing. Running seven Python scripts by hand and forgetting the eighth is
 * how renders/ and the code that made them drift apart.
 *
 * Order matters: the room compositions run before the proofs that composite
 * Thad into them, and the background writer runs after the composition it
 * reads from.
 */
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PIXELART = resolve(ROOT, 'tools/pixelart');

/** Each entry is one script, what it is for, and any arguments it takes. */
const SCRIPTS = [
  ['sheets.py', 'locked palette and the exterior component library'],
  ['primitives_sheet.py', 'non-rectangular primitives -- ellipse, arch, wheel, rope, cylinder'],
  ['proofs.py', 'Room 2 vs Room 36, and the Room 2 scale check'],
  ['room02_main_street.py', 'Room 2 background (shipping asset)'],
  ['room36_main_street_dawn.py', 'Room 36 background (shipping asset)'],
  ['actor_export.py', "Thad's two shipping sheets and his clip table -- ruling 24"],
  ['ambient_sprites.py', "the three Main Street ambient sprites -- ruling 20"],
  ['actor_sheet.py', "Thad's reference sheet and his Room 2 composites"],
  ['thad_inspect.py', 'Thad at 8x -- ruling 16 rule 5, and the recoil'],
  ['scaling_test.py', 'the snap and the colour cue -- ruling 24, doc 21 gap 2'],
  ['room03_nugget.py', 'Room 3, the Bountiful Nugget'],
  ['room03_background.py', 'Room 3 background (shipping asset)'],
  ['room03_proof.py', 'Room 3 with Thad, and the ruling 17c audit'],
  ['idle_render.py', "the Nugget's four idles at real rates -- ruling 20"],
  ['room05_assay.py', 'Room 5, the Assay Office'],
  ['room05_background.py', 'Room 5 background (shipping asset)'],
  ['room05_proof.py', 'Room 5 with Thad, and the ruling 17c audit'],
  // Batch A. It was never in this list: three rooms' shipping backgrounds
  // regenerated only when somebody remembered to run the module by hand,
  // which is the exact thing 'one command regenerates everything' exists to
  // stop. Found because git reported the audit overlays changed and the
  // backgrounds they were drawn over did not.
  ['rooms_batch_a.py', 'Rooms 18, 19 and 13 -- backgrounds and foregrounds (shipping assets)'],
  ['room01_stage_road.py', 'Room 1, the stage road at night'],
  ['cycling_render.py', 'Room 1 palette cycling -- GIF at real rates, plus the states'],
  ['room01_ambient.py', "Room 1 ambient motion -- errata 35d's lamp swing and grazing team"],
  ['void_audit.py', "errata 40's four numbers, every composed room"],
  ['room00_map.py', 'Room 0, the town map -- doc 20. A plan, not a place'],
  ['room29_ridge.py', 'Room 29, the high ridge (also the title image)'],
  ['title_screen.py', 'Title screen -- doc 17 revised: hierarchy, night, overlap'],
  ['item_icons.py', "the eight Act I inventory icons -- errata 29"],
  ['panel_render.py', 'the verb panel and inventory -- errata ruling 26'],
  ['walkbox_render.py', "Room 2's walk boxes, staging points and a route -- errata 28a"],
  ['identity_plan.py', 'errata 30f step 0 -- eleven Act I interior identities'],
  ['overlap_audit.py', 'errata 32a and 32b, measured -- overlap, baseline rows, floor load'],
  ['legibility_audit.py', 'legibility across every composed room -- rulings 16, 17c, 18'],
  ['legibility_audit.py', 'the sample geometry, drawn over each room', ['--overlay']],
  ['atmospheric_audit.py', 'errata 33b -- no scenery lighter than the sky'],
  ['shadow_audit.py', 'pale families at their floor -- ruling 21b'],
];

let failed = 0;
for (const [script, what, args = []] of SCRIPTS) {
  process.stdout.write(`\n=== ${script} -- ${what}\n`);
  const run = spawnSync('python3', [script, ...args], { cwd: PIXELART, stdio: 'inherit' });
  if (run.status !== 0) {
    failed += 1;
    process.stdout.write(`    FAILED (exit ${run.status})\n`);
  }
}

const produced = readdirSync(resolve(ROOT, 'renders')).filter((name) => name.endsWith('.png'));
process.stdout.write(`\n${produced.length} renders in renders/\n`);
if (failed > 0) {
  process.stdout.write(`${failed} script(s) failed\n`);
  process.exit(1);
}
