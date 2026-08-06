/**
 * EVERY DIALOGUE TREE NAMES WHO SPEAKS ITS REPLIES.
 *
 * Without `speaker`, DialogueRunner leaves `sayer` null. The renderer then has
 * no head to put the words over, so they drop to the top-centre fallback, and
 * the colour logic treats them as unattributed -- which reads as the wrong
 * character speaking. Tyler saw the map seller's reply at the top of the
 * screen in Thad's colour.
 *
 * ONE TREE IN THE GAME DECLARED IT. stage-driver did, because it was written
 * first and by hand; the extractor knew each minor character's speaker id in
 * its own WHO table and never wrote it out, and the three ambient trees were
 * authored without it. So the defect was in six of seven trees and had never
 * been seen, because only the driver's tree had ever been played.
 *
 * A harness tree is exempt: it exists to exercise the runner and attributes
 * nobody on purpose.
 */
import { Report, loadContent } from './lib/content.mjs';

export function check() {
  const report = new Report('Every dialogue tree names who speaks its replies');
  const content = loadContent();
  const trees = content.dialogue ?? [];
  let named = 0;

  for (const { path, data } of trees) {
    if (/harness/.test(path)) continue;
    if (typeof data.speaker === 'string' && data.speaker.length) { named += 1; continue; }
    report.fail(`${path} declares no speaker, so its replies attribute nobody: they will `
      + 'draw at top-centre in the wrong colour instead of over the character');
  }

  report.note(`${named} of ${trees.length} tree(s) name a speaker; harness trees are exempt`);
  return report;
}
