// The whiskey barrel beside Deke (Tyler, 2026-11-01, cap 2). Calls the edits endpoint with NO
// Authorization header: the environment's network secret is attached by the agent proxy, so the key
// never enters the session. Checks the cap before the call and records every row in the ledger.
// usage: NODE_USE_ENV_PROXY=1 node tools/art/barrel-generate.mjs <promptFile> <out under art/staging> <image>...
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
const R = new URL('../..', import.meta.url).pathname.replace(/\/$/, '');
const S = await import(`${R}/tools/art/staging.mjs`);
const I = await import(`${R}/tools/art/openai-image.mjs`);
const [promptFile, out, ...images] = process.argv.slice(2);
const assetId = 'room-03-barrel', subject = 'room-03-barrel', model = 'gpt-image-2', size = '1024x1024';
const role = process.env.ROLE || 'canonical-design';
const b = S.budgetFor(assetId);
if (!b.ok) { console.error('REFUSED:', b.reasons.join(' ')); process.exit(2); }
S.assertRecordable({ assetId, subject, operation: 'edit', model, role,
  ...(process.env.DERIVED_FROM ? { derivedFrom: +process.env.DERIVED_FROM } : {}) });
I.assertStaged(out);
const text = readFileSync(resolve(R, promptFile), 'utf8');
const form = new FormData();
form.append('model', model); form.append('prompt', text); form.append('size', size);
const references = [];
for (const p of images) {
  const bytes = readFileSync(resolve(R, p));
  references.push({ path: p, hash: I.sha256(bytes), transmitted: true });
  form.append('image[]', new Blob([bytes], { type: 'image/png' }), basename(p));
}
const res = await fetch('https://api.openai.com/v1/images/edits', { method: 'POST', body: form });
const body = await res.text();
const rawPath = resolve(R, dirname(out), 'response-meta.json');
if (!res.ok) { console.error(res.status, body.slice(0, 2000)); process.exit(3); }
const json = JSON.parse(body);
const bytes = Buffer.from(json.data[0].b64_json, 'base64');
mkdirSync(resolve(R, dirname(out)), { recursive: true });
writeFileSync(resolve(R, out), bytes);
const row = S.record({ assetId, subject, role, operation: 'edit', model,
  ...(process.env.DERIVED_FROM ? { derivedFrom: +process.env.DERIVED_FROM } : {}),
  parameters: { size, quality: null }, prompt: null, promptFile, promptHash: I.sha256(Buffer.from(text)),
  references, baseline: null, mask: null, sourceHash: references[0]?.hash ?? null, sourcePath: references[0]?.path ?? null,
  out, outputHash: I.sha256(bytes), bytes: bytes.length, usage: json.usage ?? null,
  revisedPrompt: json.data[0].revised_prompt ?? null, at: new Date().toISOString(),
  auth: 'environment network secret attached by the agent proxy; no key in the session',
  authorizedBy: 'Tyler, 2026-11-01, room-03-barrel cap 2' });
console.log('recorded attempt', row.attempt, out, row.outputHash, JSON.stringify(row.usage));
