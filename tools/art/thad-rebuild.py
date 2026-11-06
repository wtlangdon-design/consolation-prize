"""Rebuild every RIGGED Thad clip from its source, with the arguments its own
rig.json recorded -- so redrawing a source (errata 112: one level of
pixelation) rebuilds every clip made from it, nothing hand-copied.

  thad-rebuild.py [--out-root DIR] [--only clip-dir ...]

A clip is rigged when its rig.json names a `source` under reference/casting/.
Authored clips (walks from authored poses, marker chores) are not touched.
"""
import json, os, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
out_root = sys.argv[sys.argv.index('--out-root') + 1] if '--out-root' in sys.argv else os.path.join(ROOT, 'art/actors')
only = sys.argv[sys.argv.index('--only') + 1:] if '--only' in sys.argv else None
done = []
for d in sorted(os.listdir(os.path.join(ROOT, 'art/actors'))):
    if not d.startswith('thad-') or (only and d not in only): continue
    p = os.path.join(ROOT, 'art/actors', d, 'rig.json')
    if not os.path.exists(p): continue
    r = json.load(open(p))
    inv = r.get('invocation') or {}
    src = inv.get('source') or r.get('source')
    if src and os.path.isabs(src): src = os.path.relpath(src, ROOT)   # a repository path, always
    if not src or not str(src).startswith('reference/casting/'): continue
    args = [sys.executable, 'tools/rig/character.py', src, '--out', os.path.relpath(os.path.join(out_root, d), ROOT),
            '--key', (inv.get('key') or r.get('key') or 'magenta'), '--clip', (inv.get('clip') or r.get('clip')),
            '--view', (inv.get('view') or r.get('view') or 'profile'), '--facing', (inv.get('facing') or r.get('facing') or 'right'),
            '--pad', str(inv.get('pad') or r.get('padding') or 260)]
    for k in ('pose',):
        if inv.get(k) or r.get(k): args += [f'--{k}', str(inv.get(k) or r.get(k))]
    for k in ('swing', 'knee', 'breath', 'arm_swing'):
        if k in inv and inv[k] is not None: args += [f'--{k.replace("_", "-")}', str(inv[k])]
    if not (inv.get('clip') or r.get('clip')): continue
    res = subprocess.run(args, capture_output=True, text=True, cwd=ROOT)   # repository paths in rig.json
    done.append((d, res.returncode, (res.stderr or res.stdout).strip().splitlines()[-1:] ))
for d, rc, msg in done: print(d, rc, msg)
subprocess.check_call([sys.executable, os.path.join(ROOT, 'tools/art/despill-frames.py'), *[os.path.join(out_root, d) for d, rc, _ in done if rc == 0]])
