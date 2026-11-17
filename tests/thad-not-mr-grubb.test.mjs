/**
 * ERRATA 372: NOBODY CALLS HIMSELF "MR. GRUBB" (the Act IV playtest). Winnie's refusal at the filing, "Not now, Mr.
 * Grubb...", was written in doc 133 with no speaker and so was said by Thad. A line that addresses Mr. Grubb is
 * somebody else's: this fails on any line Thad would say with the name in it. Fails on main before errata 372.
 */
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';

const ROOT = new URL('../', import.meta.url);
const json = (path) => JSON.parse(readFileSync(new URL(path, ROOT), 'utf8'));
const NAMED = /\bMr\.? Grubb\b/;

/** Every line a verb rule gives Thad: a `say` with no `by`, its repeats, and the `then` lines that are his. */
function thadsLines(rules) {
  const out = [];
  for (const rule of rules ?? []) {
    if (typeof rule === 'string') { out.push(rule); continue; }
    if (!rule || typeof rule !== 'object') continue;
    if (rule.say && rule.by === undefined && !rule.direction) out.push(rule.say, ...(rule.repeat ?? []));
    for (const line of rule.then ?? []) {
      if (typeof line === 'string') out.push(line);
      else if (line?.speaker === 'thad' && !line.direction) out.push(line.line);
    }
  }
  return out;
}

test('no verb line in any room is Thad calling himself Mr. Grubb', () => {
  const found = [];
  for (const file of readdirSync(new URL('content/rooms/', ROOT))) {
    const walk = (node, path) => {
      if (Array.isArray(node)) { node.forEach((one) => walk(one, path)); return; }
      if (!node || typeof node !== 'object') return;
      for (const [key, value] of Object.entries(node)) {
        if (/^[A-Z_]+$/.test(key) && Array.isArray(value)) {
          for (const line of thadsLines(value)) if (NAMED.test(line)) found.push(`${file} ${path}.${key}: ${line}`);
        } else walk(value, `${path}.${key}`);
      }
    };
    walk(json(`content/rooms/${file}`), '');
  }
  assert.deepEqual(found, []);
});

test('no dialogue line given to Thad calls him Mr. Grubb', () => {
  const found = [];
  for (const file of readdirSync(new URL('content/dialogue/', ROOT))) {
    const walk = (node) => {
      if (Array.isArray(node)) { node.forEach(walk); return; }
      if (!node || typeof node !== 'object') return;
      if (node.speaker === 'thad' && typeof node.line === 'string' && NAMED.test(node.line)) found.push(`${file}: ${node.line}`);
      Object.values(node).forEach(walk);
    };
    walk(json(`content/dialogue/${file}`));
  }
  assert.deepEqual(found, []);
});
