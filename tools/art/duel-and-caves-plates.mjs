// Rooms 33 and 34 redrawn, and their after-plates, derived to 1920x864 for the main session to judge and wire
// (reference/duel-and-caves-art/brief.md Part B; handback.md). No image operation here, and nothing is promoted:
// each candidate is written beside its source under art/staging/duel-and-caves-art/, by the same fixed-room
// derivation every plate takes (errata 63: the standard crop x 8-1528, y 170-854, resampled to 1920x864).
// The shipping paths in art/backgrounds/ are untouched until the main session wires them.
import { deriveFixedRoomPlate } from './derive.mjs';

const S = 'art/staging/duel-and-caves-art';
const PLATES = [
  ['room-33/redraw-2.png', 'room-33/room-33-listening-chamber-1920x864.png'],
  ['room-33/after-1.png', 'room-33/room-33-listening-chamber-after-1920x864.png'],
  ['room-34/redraw-1.png', 'room-34/room-34-under-prosperity-1920x864.png'],
  ['room-34/after-1.png', 'room-34/room-34-under-prosperity-after-1920x864.png'],
];
for (const [source, out] of PLATES) {
  const record = deriveFixedRoomPlate({ source: `${S}/${source}`, out: `${S}/${out}` });
  console.log(out, record.derived.hash.slice(0, 12));
}
