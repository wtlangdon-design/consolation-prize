import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { loadContent, Report } from './lib/content.mjs';

/**
 * Every asset path a content record declares must resolve on disk.
 *
 * WHY THIS EXISTS, AND WHY IT DID NOT.
 *
 * `art/actors/thad-near.png` and `art/actors/thad-far.png` were deleted by a
 * glob -- `rm -rf art/actors/thad-*` intended to clear stale rig output --
 * and the deletion was committed. `content/actors/thad.json` still named both
 * sheets. The protagonist had no art, the deployed page rendered black, and
 * the project owner found it by opening the link.
 *
 * The full suite passed. Twenty-four checks, all green, on a tree where the
 * player character could not be drawn.
 *
 * Worse than the gap: the gap was reported as closed. The restore commit was
 * described as arriving "with an asset-reference check that would have caught
 * it at commit time." It contained two PNGs and nothing else. The check had
 * been run once as an ad-hoc command in a shell and never written down.
 *
 * That is why this file's failure mode is the one it is. A check believed to
 * exist is worse than a check known to be missing, because the belief closes
 * the question. The empirical confirmation -- move the file aside, run the
 * suite, watch it pass -- is the only kind that would have caught it, and it
 * took one command that nobody ran.
 *
 * WHAT IT COVERS. Any string in any content record that looks like a
 * repository asset path: actor sheets, backgrounds, foregrounds, objects,
 * audio, fonts. It walks records generically rather than naming fields,
 * because the next field nobody thought of is the one this is for.
 *
 * WHAT IT DOES NOT COVER. Clip directories, which the ActorFile schema cannot
 * yet address at all -- that is Q14 and it is a schema question, not a
 * missing-file one.
 */

const ASSET = /^(art|assets|audio|fonts)\/[^\s"']+\.[a-z0-9]{2,5}$/i;

function walk(node, path, out) {
  if (typeof node === 'string') {
    if (ASSET.test(node)) out.push({ ref: node, at: path });
    return;
  }
  if (Array.isArray(node)) {
    node.forEach((v, i) => walk(v, `${path}[${i}]`, out));
    return;
  }
  if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) walk(v, `${path}/${k}`, out);
  }
}

export function check() {
  const report = new Report('Every declared asset path resolves on disk');
  const content = loadContent();
  const root = process.cwd();

  const groups = [
    // { path, data } collections
    ...(content.rooms ?? []),
    ...(content.items ?? []),
    ...(content.ambient ?? []),
    ...(content.sequences ?? []),
    ...(content.dialogue ?? []),
    ...(content.puzzles ?? []),
    // bare records loaded straight off the manifest -- these have no path of
    // their own, so name them by the manifest key that declared them
    ...['actor', 'ui', 'font', 'palette', 'panel', 'itemIcons', 'scaling']
      .filter((k) => content[k])
      .map((k) => ({ path: `manifest.${k}`, data: content[k] })),
  ].filter(Boolean);

  let declared = 0;
  for (const entry of groups) {
    const { path, data } = entry;
    const refs = [];
    walk(data, '', refs);
    declared += refs.length;
    for (const { ref, at } of refs) {
      if (!existsSync(join(root, ref))) {
        report.fail(`${path}${at} declares ${ref} -- no such file`);
      }
    }
  }

  if (declared === 0) {
    // A zero here is not a pass. It means the walker found nothing, which on a
    // repository with backgrounds and actor sheets means the shape changed and
    // this check has quietly stopped checking.
    report.fail(
      'no asset paths found in any content record -- this check has stopped '
      + 'checking. Verify loadContent()\'s groups and the ASSET pattern.',
    );
  } else {
    report.note(`${declared} asset paths declared, all resolved`);
  }

  return report;
}
