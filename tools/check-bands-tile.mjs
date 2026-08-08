/**
 * BANDS THAT SHARE A REGION MUST TILE IT WITHOUT GAPS.
 *
 * The Nugget draws its people in horizontal bands above a static plate: the
 * plate holds everything below the tabletop and the counter, and the bands
 * hold everything above. That means a column not covered by any band is not
 * drawn by ANYTHING -- a hole straight through the furniture.
 *
 * It happened. The bar's three drinkers were cut to each man's own extent, so
 * the 48 columns between the first and second belonged to nobody, and Tyler
 * saw a notch missing from the counter left of the man in blue. Nothing caught
 * it: three valid sprites, three valid records, 47 checks passing.
 *
 * Bands are recognised by sharing a room, a y, and a frame height. Within such
 * a group each sprite's right edge must meet the next one's left edge.
 */
import { Report, loadContent } from './lib/content.mjs';

export function check() {
  const report = new Report('Sprite bands tile their region without gaps');
  const content = loadContent();
  const groups = new Map();

  for (const { data: npc } of content.ambient ?? []) {
    const frame = npc.sprite?.frames?.[0];
    if (!frame || npc.sprite.beatEvery === undefined) continue;
    const key = `${npc.room}:${npc.y}:${frame[3]}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ id: npc.id, left: npc.x - Math.floor(frame[2] / 2), width: frame[2] });
  }

  let checked = 0;
  for (const [key, band] of groups) {
    if (band.length < 2) continue;
    checked += 1;
    band.sort((a, b) => a.left - b.left);
    for (let i = 0; i + 1 < band.length; i += 1) {
      const gap = band[i + 1].left - (band[i].left + band[i].width);
      if (gap !== 0) {
        report.fail(`${key}: ${gap > 0 ? `${gap}px GAP` : `${-gap}px overlap`} between `
          + `${band[i].id} and ${band[i + 1].id} -- a column no band covers is a hole `
          + 'through whatever the plate does not draw');
      }
    }
  }

  report.note(`${checked} band group(s) checked for gaps`);
  return report;
}
