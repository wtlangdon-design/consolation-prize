/**
 * Path-matched round trip: every number in every migrated file, before vs
 * after, compared by JSON POINTER rather than by position. An allowlist says
 * which keys moved; this says each one moved by the right factor.
 */
import { execSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';

const BASE = process.argv[2] ?? 'c4e333c^';
const flat = (o, trail = '', out = new Map()) => {
  if (o === null || typeof o !== 'object') return out;
  if (Array.isArray(o)) {
    o.forEach((v, i) => (typeof v === 'number' ? out.set(`${trail}/${i}`, v) : flat(v, `${trail}/${i}`, out)));
    return out;
  }
  for (const [k, v] of Object.entries(o)) {
    if (typeof v === 'number') out.set(`${trail}/${k}`, v);
    else flat(v, `${trail}/${k}`, out);
  }
  return out;
};

const files = [
  ...readdirSync('content/rooms').filter(f => f.endsWith('.json')).map(f => `content/rooms/${f}`),
  'content/actors/scaling.json',
  'content/actors/thad.json',
];

let same = 0, x6 = 0, edge = 0;
const odd = [], onlyBefore = [], onlyAfter = [];
for (const path of files) {
  const before = flat(JSON.parse(execSync(`git show ${BASE}:${path}`, { encoding: 'utf8' })));
  const after = flat(JSON.parse(readFileSync(path, 'utf8')));
  for (const [ptr, b] of before) {
    if (!after.has(ptr)) { onlyBefore.push(`${path}${ptr}`); continue; }
    const a = after.get(ptr);
    if (a === b) same += 1;
    else if (a === b * 6) x6 += 1;
    else if (a === b * 6 + 5) edge += 1;
    else odd.push(`${path}${ptr}: ${b} -> ${a}   (x6 would be ${b * 6}, x6+5 would be ${b * 6 + 5})`);
  }
  for (const ptr of after.keys()) if (!before.has(ptr)) onlyAfter.push(`${path}${ptr}`);
}

console.log(`unchanged ${same} · x6 ${x6} · x6+5 (inclusive edge) ${edge} · NEITHER ${odd.length}`);
console.log(`paths only before: ${onlyBefore.length}   only after: ${onlyAfter.length}`);
odd.forEach(o => console.log('  ODD  ' + o));
onlyBefore.forEach(o => console.log('  GONE ' + o));
onlyAfter.forEach(o => console.log('  NEW  ' + o));
