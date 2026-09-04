import { allInteractables, loadContent, Report, runCheck } from './lib/content.mjs';

const REQUIRED_ROLES = [
  'overlayBg',
  'panelBg',
  'buttonBg',
  'buttonBgActive',
  'outline',
  'inkDim',
  'ink',
  'inkBright',
];

/**
 * The palette is locked and everything indexes into it.
 *
 * Doc 11 step 1: the 256-colour table cannot be revised later without
 * redoing every asset, so this check is the guard rail on that. It also
 * confirms every colour is representable on 6-bit VGA hardware -- a colour
 * the target hardware could not produce is exactly the kind of detail a
 * player who wants this game would notice.
 */
export function check() {
  // ERRATA 54 RETIRED THE LOCKED PALETTE, AND THREE OF THIS CHECK'S FOUR
  // ASSERTIONS WENT WITH IT. The ruling says `consolation-256.json` "ceases to
  // be authoritative. Retained for reference only." So:
  //
  //   locked flag   SUPERSEDED as design, LIVE as a runtime precondition --
  //                 Screen.ts still throws on a palette that is not locked,
  //                 which is doc 36 Q19 ("errata 54 retired a thing the engine
  //                 cannot start without") and is debt, not a rule.
  //   256 entries   SUPERSEDED. Full RGB has no entry count.
  //   6-bit VGA     SUPERSEDED. Nothing quantises to 6-bit any more.
  //   the 8 roles   CURRENT. Screen.ts reads roles by name for every piece of
  //                 interface chrome, so a missing role is a live crash.
  //   index ranges  CURRENT. Renderer draws room.colours.sky/ground and a
  //                 target's own colour for rooms with no plate.
  //
  // All four were mutation-proved detectable. Detectable is not the same as
  // required, and the title said the retired half.
  const report = new Report('The palette file the engine still boots from is well formed');
  const content = loadContent();
  const palette = content.palette;

  if (!palette.locked) {
    report.fail('palette is not marked locked');
  }
  if (palette.colours.length !== 256) {
    report.fail(`palette has ${palette.colours.length} entries, must be exactly 256`);
  }

  for (const role of REQUIRED_ROLES) {
    const index = palette.roles?.[role];
    if (index === undefined) {
      report.fail(`palette has no role "${role}"`);
    } else if (index < 0 || index >= palette.colours.length) {
      report.fail(`role "${role}" points outside the palette (${index})`);
    }
  }

  // 6-bit VGA: every channel must land on a multiple of 255/63.
  const step = 255 / 63;
  let offGrid = 0;
  palette.colours.forEach((value, index) => {
    if (!/^#[0-9a-f]{6}$/.test(value)) {
      report.fail(`colour ${index} is not a lowercase hex triplet: ${value}`);
      return;
    }
    for (let channel = 0; channel < 3; channel += 1) {
      const raw = parseInt(value.slice(1 + channel * 2, 3 + channel * 2), 16);
      if (Math.abs(Math.round(raw / step) * step - raw) > 0.5) offGrid += 1;
    }
  });
  if (offGrid > 0) {
    report.fail(`${offGrid} channel values are not representable on 6-bit VGA`);
  }

  // Every index referenced by content must exist.
  for (const { roomId, target } of allInteractables(content)) {
    if (target.colour === undefined) continue;
    if (target.colour < 0 || target.colour >= palette.colours.length) {
      report.fail(`${roomId}/${target.id}: colour index ${target.colour} is out of range`);
    }
  }
  for (const { data } of content.rooms) {
    for (const [key, index] of Object.entries(data.colours ?? {})) {
      if (index < 0 || index >= palette.colours.length) {
        report.fail(`${data.id}: colours.${key} index ${index} is out of range`);
      }
    }
  }

  const families = Object.keys(palette.families ?? {});
  report.note(`${palette.colours.length} colours, ${families.length} families, ${REQUIRED_ROLES.length} UI roles`);
  report.note(`families: ${families.join(', ')}`);
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(runCheck(check()) ? 0 : 1);
}
