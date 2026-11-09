import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

/**
 * WHAT OF art/staging/ THE GAME LOADS (errata 236). art/staging/ holds every generation, sheet and master the art
 * was made from -- 1.3 GB, against GitHub Pages' 1 GB limit for a deploy -- and the build copied it whole, so the
 * site's deploys began to time out. The game loads a handful of those files directly (Room 5's floorboard, the
 * miners' walk frames, Main Street's and the Nugget's candidate rooms). This finds them the way the engine does:
 * every string in the game's content that names a path under art/staging/, skipping the build records
 * (content/build-contracts, content/build-ledger.json) and the keys that only document where art came from.
 */
const SKIP_KEYS = new Set(['provenance', 'note', 'evidence']);

function* jsonFiles(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* jsonFiles(path);
    else if (name.endsWith('.json')) yield path;
  }
}

function strings(value, out) {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) for (const one of value) strings(one, out);
  else if (value && typeof value === 'object') {
    for (const [key, one] of Object.entries(value)) if (!SKIP_KEYS.has(key)) strings(one, out);
  }
  return out;
}

/** The art/staging/ paths (files or folders) the game's content names, relative to the repository root. */
export function runtimeStagingPaths(root = resolve(new URL('../..', import.meta.url).pathname)) {
  const content = join(root, 'content');
  const found = new Set();
  for (const file of jsonFiles(content)) {
    const relative = file.slice(root.length + 1);
    if (relative.startsWith('content/build-contracts/') || relative === 'content/build-ledger.json') continue;
    for (const text of strings(JSON.parse(readFileSync(file, 'utf8')), [])) {
      if (text.startsWith('art/staging/') && !/\s/.test(text) && existsSync(join(root, text))) found.add(text);
    }
  }
  return [...found].sort();
}
