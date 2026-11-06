"""Cut each walker out of a walk-gifs.mjs recording into a GIF that follows him.

    python3 tools/gauntlet/walk-gifs.py <raw dir> <out dir>

<raw dir> holds one folder per scene (the frames, record.json). Followed by:
  thad / movers  the probe's draw bounds for a mover (room coordinates, less the camera)
  path           a departing character: found along his file's own route, from where he stands out
  diff           the frame's difference from the last frame, after the walker has gone
Frames are kept at game size (1:1) so the GIF shows the pixels the game draws.
Only the stretch where the walker moves is kept, with a beat of standing either side, and at most
the middle five seconds of it.
"""
import json, os, sys
import numpy as np
from PIL import Image

PLAY_H = 864
PAD_S = 0.5


def load(scene_dir):
    rec = json.load(open(os.path.join(scene_dir, 'record.json')))
    # The paint time is the moment the frame showed; the receipt is a tenth of a second later.
    frames = [dict(f, t=f.get('painted', f['t'])) for f in rec['frames']]
    return rec, frames


def interp(samples, t, fn):
    """A value from the probe samples at time t, linear between the two either side."""
    ts = [s['t'] for s in samples]
    i = int(np.searchsorted(ts, t))
    if i <= 0: return fn(samples[0])
    if i >= len(samples): return fn(samples[-1])
    a, b = samples[i - 1], samples[i]
    k = (t - a['t']) / max(1e-6, b['t'] - a['t'])
    return fn(a) + (fn(b) - fn(a)) * k


def sample_at(samples, t):
    best = min(samples, key=lambda s: abs(s['t'] - t))
    return best


def runs(times, gap=1.2):
    out = []
    for t in times:
        if out and t - out[-1][1] <= gap: out[-1][1] = t
        else: out.append([t, t])
    return out


MAX_S = 5.0


def write_gif(path, crops, times):
    if len(crops) < 3: return False
    if times[-1] - times[0] > MAX_S:   # the middle five seconds: several strides, a file a phone opens
        mid = (times[0] + times[-1]) / 2
        keep = [i for i, t in enumerate(times) if abs(t - mid) <= MAX_S / 2]
        crops = [crops[i] for i in keep]; times = [times[i] for i in keep]
    crops = [c.convert('RGB') for c in crops]
    if crops[0].height < 200:   # a small figure is shown twice size, nearest-neighbour, so the pixels read
        crops = [c.resize((c.width * 2, c.height * 2), Image.NEAREST) for c in crops]
    # One palette for the whole GIF, from a spread of its frames, so the colours hold still frame to frame.
    probe = Image.new('RGB', (crops[0].width, crops[0].height * 4))
    for k, i in enumerate(np.linspace(0, len(crops) - 1, 4).astype(int)): probe.paste(crops[i], (0, crops[0].height * k))
    palette = probe.quantize(colors=255, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    pal = [c.quantize(palette=palette, dither=Image.Dither.NONE) for c in crops]
    durs = [max(20, int(round((times[i + 1] - times[i]) * 1000 / 10)) * 10) for i in range(len(times) - 1)] + [600]
    pal[0].save(path, save_all=True, append_images=pal[1:], duration=durs, loop=0, disposal=1, optimize=True)
    return True


def window(cx, cy_bottom, w, h, W=1920):
    x0 = int(round(cx - w / 2)); x0 = max(0, min(W - w, x0))
    y1 = int(round(cy_bottom)); y0 = max(0, min(PLAY_H - h, y1 - h))
    return x0, y0, x0 + w, y0 + h


def smooth(v, k=5):
    v = np.asarray(v, float); out = v.copy()
    for i in range(len(v)):
        out[i] = np.median(v[max(0, i - k):i + k + 1])
    return out


def follow_mover(scene_dir, rec, frames, mover, name, out_dir, results):
    samples = [s for s in rec['samples'] if s['movers'].get(mover, {}).get('bounds')]
    if not samples: return
    moving_t = [s['t'] for s in samples if s['movers'][mover]['moving']]
    for k, (a, b) in enumerate(runs(moving_t)):
        if b - a < 0.8: continue
        sel = [f for f in frames if a - PAD_S <= f['t'] <= b + PAD_S]
        if not sel: continue
        ss = [sample_at(samples, f['t']) for f in sel]
        bw = max(s['movers'][mover]['bounds'][2] for s in ss); bh = max(s['movers'][mover]['bounds'][3] for s in ss)
        w = int(min(1920, max(bw * 1.8, bh * 0.9, 160))); h = int(min(PLAY_H, bh * 1.2 + 20))
        cx = smooth([interp(samples, f['t'], lambda s: s['movers'][mover]['bounds'][0] + s['movers'][mover]['bounds'][2] / 2 - s['camera']) for f in sel], 2)
        cb = smooth([interp(samples, f['t'], lambda s: s['movers'][mover]['bounds'][1] + s['movers'][mover]['bounds'][3] + 12) for f in sel], 2)
        crops, times = [], []
        for f, x, y in zip(sel, cx, cb):
            im = Image.open(os.path.join(scene_dir, f['name']))
            crops.append(im.crop(window(x, y, w, h, im.width))); times.append(f['t'])
        clips = sorted({s['movers'][mover]['clip'] for s in ss if s['movers'][mover]['moving']})
        suffix = f'-{k + 1}' if len(runs(moving_t)) > 1 else ''
        path = os.path.join(out_dir, f'{name}{suffix}.gif')
        if write_gif(path, crops, times):
            results.append((path, mover, clips, len(crops), round(times[-1] - times[0], 1), (w, h)))


def follow_diff(scene_dir, rec, frames, name, out_dir, results):
    last = np.asarray(Image.open(os.path.join(scene_dir, frames[-1]['name'])).convert('RGB')).astype(np.int16)[:PLAY_H]
    with_thad = [s for s in rec['samples'] if s['movers'].get('thad', {}).get('bounds')]
    boxes = []
    for f in frames:
        thad = None
        if with_thad:   # Thad where he was at this frame, so his idle is not taken for the walker
            thad = [interp(with_thad, f['t'], lambda s, k=k: s['movers']['thad']['bounds'][k] - (s['camera'] if k == 0 else 0)) for k in range(4)]
        a = np.asarray(Image.open(os.path.join(scene_dir, f['name'])).convert('RGB')).astype(np.int16)[:PLAY_H]
        m = np.abs(a - last).max(-1) > 40
        if thad:
            x0, y0, bw, bh = thad
            m[max(0, int(y0) - 10):int(y0 + bh) + 10, max(0, int(x0) - 20):int(x0 + bw) + 20] = False
        cols = np.where(m.sum(0) > 3)[0]
        if len(cols) < 6: boxes.append(None); continue
        # the biggest cluster of changed columns is the walker
        groups = np.split(cols, np.where(np.diff(cols) > 25)[0] + 1)
        g = max(groups, key=lambda g: m[:, g].sum())
        rows = np.where(m[:, g].sum(1) > 0)[0]
        if m[:, g].sum() < 150: boxes.append(None); continue
        boxes.append((g[0], rows[0], g[-1], rows[-1]))
    idx = [i for i, b in enumerate(boxes) if b]
    if not idx: return
    t = [frames[i]['t'] for i in idx]
    for k, (a, b) in enumerate(runs(t)):
        sel = [i for i in idx if a <= frames[i]['t'] <= b]
        if len(sel) < 4: continue
        hs = sorted(boxes[i][3] - boxes[i][1] for i in sel); ws = sorted(boxes[i][2] - boxes[i][0] for i in sel)
        bh = hs[int(len(hs) * 0.8)]; bw = ws[int(len(ws) * 0.8)]
        w = int(min(1920, max(bw * 1.6, bh * 0.9, 200))); h = int(min(PLAY_H, bh * 1.25 + 30))
        lo = max(0, sel[0] - 8); hi = min(len(frames) - 1, sel[-1] + 2)
        keep = list(range(lo, hi + 1))
        cx_known = {i: (boxes[i][0] + boxes[i][2]) / 2 for i in sel}
        cy_known = {i: boxes[i][3] + 15 for i in sel}
        def nearest(d, i): return d[min(d, key=lambda j: abs(j - i))]
        cx = smooth([nearest(cx_known, i) for i in keep]); cb = smooth([nearest(cy_known, i) for i in keep])
        crops, times = [], []
        for i, x, y in zip(keep, cx, cb):
            im = Image.open(os.path.join(scene_dir, frames[i]['name']))
            crops.append(im.crop(window(x, y, w, h, im.width))); times.append(frames[i]['t'])
        suffix = f'-{k + 1}' if len(runs(t)) > 1 else ''
        path = os.path.join(out_dir, f'{name}{suffix}.gif')
        if write_gif(path, crops, times):
            results.append((path, 'diff', [], len(crops), round(times[-1] - times[0], 1), (w, h)))


def ambient_file(walker):
    root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    d = os.path.join(root, 'content', 'ambient')
    for n in os.listdir(d):
        j = json.load(open(os.path.join(d, n)))
        if j.get('id') == walker: return j
    raise SystemExit(f'no ambient file has id {walker}')


def follow_path(scene_dir, rec, frames, name, out_dir, results):
    """A departing character, found in every frame ALONG THE ROUTE HIS FILE DECLARES: from where he
    stands, through his exit path. Each frame is compared with the last (he has gone by then) and he is
    the figure-sized box on that route with the most change in it. Searching only his route keeps the
    mourners' and the hearse's own life out (following the whole frame's difference took them for Hob),
    and finding him rather than timing him keeps a walk that starts after a line (Pratt) in step."""
    npc = ambient_file(rec['walker']); ex = npc['exit']
    route = [[npc['x'], npc['y']]] + ex['path']
    pts = []
    for (x0, y0), (x1, y1) in zip(route, route[1:]):
        n = max(1, int(np.hypot(x1 - x0, y1 - y0) / 6))
        pts += [(x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n) for k in range(n)]
    pts.append(tuple(route[-1])); pts = np.asarray(pts)
    cam = lambda t: interp(rec['samples'], t, lambda s: s['camera']) if rec['samples'] else 0
    last = np.asarray(Image.open(os.path.join(scene_dir, frames[-1]['name'])).convert('RGB')).astype(np.int16)[:PLAY_H]
    def mask(f):
        a = np.asarray(Image.open(os.path.join(scene_dir, f['name'])).convert('RGB')).astype(np.int16)[:PLAY_H]
        return np.abs(a - last).max(-1) > 40
    # His drawn size, from the first frame: what differs around where he stands.
    m0 = mask(frames[0]); sx, sy = npc['x'] - cam(frames[0]['t']), npc['y']
    x0, x1 = int(max(0, sx - 250)), int(min(m0.shape[1], sx + 250))
    sub = m0[:int(sy) + 12, x0:x1]
    rows = np.where(sub.sum(1) > 2)[0]; cols = np.where(sub.sum(0) > 2)[0]
    bh = float(sy - rows[0]) if len(rows) else 300.0
    bw = float(cols[-1] - cols[0]) if len(cols) else bh * 0.5
    bx = max(12, int(bw * 0.6)); by = max(12, int(bh * 0.9))
    found = []
    for f in frames:
        m = mask(f).astype(np.int32)
        ii = np.pad(m.cumsum(0).cumsum(1), ((1, 0), (1, 0)))
        c = cam(f['t']); best, where = 0, None
        for (px, py) in pts:
            X = int(px - c); Y = int(py)
            xa, xb = max(0, X - bx // 2), min(m.shape[1], X + bx // 2); ya, yb = max(0, Y - by), min(m.shape[0], Y + 4)
            if xb <= xa or yb <= ya: continue
            v = ii[yb, xb] - ii[ya, xb] - ii[yb, xa] + ii[ya, xa]
            if v > best: best, where = v, (X, Y)
        found.append(where if best > 0.08 * bx * by else None)
    idx = [i for i, w in enumerate(found) if w]
    if len(idx) < 4: return
    # From half a second before he first moves to the moment he is gone.
    xs = [found[i][0] for i in idx]
    moved = next((k for k in range(len(idx)) if abs(xs[k] - xs[0]) > 6), 0)
    first = idx[max(0, moved - 8)]; lastf = idx[-1]
    keep = list(range(first, lastf + 1))
    known = {i: found[i] for i in idx}
    def near(i): return known[min(known, key=lambda j: abs(j - i))]
    cx = smooth([near(i)[0] for i in keep], 2); cb = smooth([near(i)[1] for i in keep], 2)
    w = int(min(1920, max(bw * 1.6, bh * 0.9, 200))); h = int(min(PLAY_H, bh * 1.25 + 30))
    crops, times = [], []
    for i, x, y in zip(keep, cx, cb):
        im = Image.open(os.path.join(scene_dir, frames[i]['name']))
        crops.append(im.crop(window(x, y + 15, w, h, im.width))); times.append(frames[i]['t'])
    path = os.path.join(out_dir, f'{name}.gif')
    if write_gif(path, crops, times):
        results.append((path, rec['walker'], [], len(crops), round(times[-1] - times[0], 1), (w, h)))


def main():
    raw, out_dir = sys.argv[1], sys.argv[2]
    os.makedirs(out_dir, exist_ok=True)
    results = []
    for scene in sorted(os.listdir(raw)):
        d = os.path.join(raw, scene)
        if not os.path.exists(os.path.join(d, 'record.json')): continue
        rec, frames = load(d)
        if rec['track'] == 'thad':
            follow_mover(d, rec, frames, 'thad', scene, out_dir, results)
        elif rec['track'] == 'movers':
            ids = sorted({m for s in rec['samples'] for m, v in s['movers'].items() if v.get('moving')})
            for m in ids:
                follow_mover(d, rec, frames, m, f'{scene}-{m}', out_dir, results)
        elif rec['track'] == 'path':
            follow_path(d, rec, frames, scene, out_dir, results)
        else:
            follow_diff(d, rec, frames, scene, out_dir, results)
    for r in results:
        print(f'{os.path.basename(r[0])}: {r[1]} {",".join(r[2])} -- {r[3]} frames, {r[4]}s, {r[5][0]}x{r[5][1]}')


main()
