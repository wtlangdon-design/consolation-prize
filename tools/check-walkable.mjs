import { loadContent, PLAY_HEIGHT, Report, roomWidth, runCheck } from './lib/content.mjs';

/**
 * Errata ruling 15: every walkable region must declare a zone, and a region
 * without one fails the build.
 *
 * The zone is not cosmetic. Actors snap between three drawn heights on
 * crossing a boundary, so an undeclared region means an actor with no
 * defined size standing on it -- which surfaces as a sprite that keeps
 * whatever height it happened to have, in the wrong place, intermittently.
 */
export function check() {
  const report = new Report('Every walkable region declares a depth zone');
  const content = loadContent();
  const zones = new Set(content.scaling.zones.map((zone) => zone.index));

  if (content.scaling.zones.length === 0) {
    report.fail('no depth zones declared');
  }
  for (const zone of content.scaling.zones) {
    if (typeof zone.height !== 'number' || zone.height <= 0) {
      report.fail(`zone ${zone.index} has no usable drawn height`);
    }
  }

  let regionCount = 0;
  let exempt = 0;
  for (const { data } of content.rooms) {
    // Doc 20 rule 5: the map is a menu that looks like a place. Nobody
    // stands on it, errata 25 withdrew the character token, and a depth zone
    // for a screen with no actor on it would be a number nothing reads.
    if (data.kind === 'map') {
      exempt += 1;
      continue;
    }
    const regions = data.walkable ?? [];
    if (regions.length === 0) {
      report.fail(`${data.id}: no walkable regions -- a room with no floor cannot be entered`);
      continue;
    }
    const seen = new Set();
    for (const region of regions) {
      regionCount += 1;
      const where = `${data.id}/${region.id ?? '(unnamed)'}`;

      if (region.zone === undefined || region.zone === null) {
        report.fail(`${where}: no zone declared`);
      } else if (!zones.has(region.zone)) {
        report.fail(`${where}: zone ${region.zone} is not declared in the scaling file`);
      }
      if (seen.has(region.id)) report.fail(`${where}: duplicate region id`);
      seen.add(region.id);

      // THE ROOM'S WIDTH, NOT THE WINDOW'S. Main Street's floor is 3700 wide
      // and the window is 1920; the band is still bounded, by the room.
      const width = roomWidth(data);
      const [x, y, w, h] = region.rect ?? [];
      if ([x, y, w, h].some((value) => typeof value !== 'number')) {
        report.fail(`${where}: rect must be four numbers`);
      } else if (x < 0 || y < 0 || x + w > width || y + h > PLAY_HEIGHT) {
        report.fail(`${where}: rect leaves the ${width}x${PLAY_HEIGHT} room`);
      }
    }
  }

  const heights = content.scaling.zones.map((zone) => `${zone.name} ${zone.height}px`).join(', ');
  report.note(`${regionCount} regions across ${content.rooms.length - exempt} rooms; zones: ${heights}`);
  if (exempt > 0) report.note(`${exempt} room(s) exempt -- kind: map, nobody stands on them`);
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(runCheck(check()) ? 0 : 1);
}
