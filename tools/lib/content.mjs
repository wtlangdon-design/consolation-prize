import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = fileURLToPath(new URL('../..', import.meta.url));
export const MANIFEST_PATH = 'content/manifest.json';

export function readJson(relPath) {
  return JSON.parse(readFileSync(resolve(ROOT, relPath), 'utf8'));
}

/** Loads the manifest and everything it references, exactly as the engine does. */
export function loadContent() {
  const manifest = readJson(MANIFEST_PATH);
  return {
    manifest,
    font: readJson(manifest.font),
    palette: readJson(manifest.palette),
    ui: readJson(manifest.ui),
    verbs: readJson(manifest.verbs),
    flags: readJson(manifest.flags),
    scaling: readJson(manifest.scaling),
    reputation: readJson(manifest.reputation),
    verbFallbacks: readJson(manifest.verbFallbacks),
    ambient: (manifest.ambient ?? []).map((path) => ({ path, data: readJson(path) })),
    rooms: manifest.rooms.map((path) => ({ path, data: readJson(path) })),
    dialogue: manifest.dialogue.map((path) => ({ path, data: readJson(path) })),
    puzzles: manifest.puzzles.map((path) => ({ path, data: readJson(path) })),
  };
}

/** Every hotspot and exit across every room, tagged with its room. */
export function allInteractables(content) {
  const out = [];
  for (const { path, data } of content.rooms) {
    for (const hotspot of data.hotspots ?? []) {
      out.push({ path, roomId: data.id, kind: 'hotspot', target: hotspot });
    }
    for (const exit of data.exits ?? []) {
      out.push({ path, roomId: data.id, kind: 'exit', target: exit });
    }
  }
  return out;
}

/** Every dialogue option across every tree, tagged with its tree and node. */
export function allDialogueOptions(content) {
  const out = [];
  for (const { path, data } of content.dialogue) {
    for (const [nodeId, node] of Object.entries(data.nodes ?? {})) {
      for (const option of node.options ?? []) {
        out.push({ path, treeId: data.id, nodeId, node, option });
      }
    }
  }
  return out;
}

export function listFiles(dir, extensions) {
  const absolute = resolve(ROOT, dir);
  const out = [];
  const walk = (current) => {
    for (const entry of readdirSync(current)) {
      const full = join(current, entry);
      if (statSync(full).isDirectory()) {
        walk(full);
      } else if (extensions.some((ext) => entry.endsWith(ext))) {
        out.push(relative(ROOT, full));
      }
    }
  };
  try {
    walk(absolute);
  } catch {
    return [];
  }
  return out.sort();
}

/** Collects the results of one check into a pass/fail report. */
export class Report {
  constructor(name) {
    this.name = name;
    this.failures = [];
    this.notes = [];
  }

  fail(message) {
    this.failures.push(message);
  }

  note(message) {
    this.notes.push(message);
  }

  get passed() {
    return this.failures.length === 0;
  }
}

export function runCheck(report) {
  const status = report.passed ? 'PASS' : 'FAIL';
  console.log(`${status}  ${report.name}`);
  for (const note of report.notes) {
    console.log(`      - ${note}`);
  }
  for (const failure of report.failures) {
    console.log(`      x ${failure}`);
  }
  return report.passed;
}
