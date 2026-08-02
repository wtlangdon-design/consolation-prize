#!/usr/bin/env python3
"""Cut a keyed character generation into a rigged 8-frame walk cycle.

Every rule here is from docs/38-character-pipeline.md. Read it before
changing anything -- each guard exists because its absence cost a round.

    python3 tools/rig/character.py hob.png --out art/actors/hob --key green
"""
from __future__ import annotations
import argparse, json
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage

HIP_SWING = [14, 10, 0, -10, -14, -10, 0, 10]


def key_out(path: Path, key: str):
    """Remove the backdrop, despill, and BLEED edge colour outward (rule R4)."""
    a = np.array(Image.open(path).convert("RGB")).astype(float)
    if key == "green":
        bad = a[..., 1] - np.maximum(a[..., 0], a[..., 2])
    elif key == "magenta":
        bad = (a[..., 0] + a[..., 2]) / 2 - a[..., 1]
    else:
        raise SystemExit(f"unknown key {key!r}")
    obj = ~(bad > 40)
    lab, n = ndimage.label(obj)
    if n == 0:
        raise SystemExit("nothing found outside the key colour")
    sizes = ndimage.sum(obj, lab, range(1, n + 1))
    obj = ndimage.binary_fill_holes(lab == int(np.argmax(sizes)) + 1)

    if key == "green":
        spill = (a[..., 1] > (a[..., 0] + a[..., 2]) / 2 + 8) & obj
        a[..., 1][spill] = ((a[..., 0] + a[..., 2]) / 2 + 8)[spill]
    else:
        spill = (a[..., 0] > a[..., 1] + 30) & (a[..., 2] > a[..., 1] + 30) & obj
        a[..., 0][spill] = (a[..., 1] + 30)[spill]
        a[..., 2][spill] = (a[..., 1] + 30)[spill]

    idx = ndimage.distance_transform_edt(~obj, return_distances=False, return_indices=True)
    bled = a[tuple(idx)]
    ys, xs = np.nonzero(obj)
    return np.dstack([bled, obj * 255.0])[ys.min():ys.max() + 1, xs.min():xs.max() + 1]


def find_hem(mask: np.ndarray, fig_h: int) -> int:
    """R1: the hem is where the silhouette NARROWS, not where the legs part."""
    w = mask.sum(1)
    best = None
    for y in range(int(fig_h * 0.55), int(fig_h * 0.92)):
        if w[y] <= 0 or w[y + 8] >= w[y] * 0.72:
            continue
        # A width drop alone is ambiguous -- an arm leaving the silhouette
        # looks exactly like a hem. What distinguishes the hem is that BELOW
        # it you see two legs. Requiring that is what finally separated 72%
        # (coat) from 66% (lantern arm) and 84% (mid-shin).
        below = range(y + 8, fig_h)
        two = sum(1 for yy in below if len(runs(mask[yy])) == 2)
        share = two / max(len(list(below)), 1)
        if share > 0.55 and (best is None or share > best[1]):
            best = (y + 8, share)
    if best is None:
        raise SystemExit(
            "no hem found -- the legs must be visibly apart below the coat. "
            "Regenerate with 'mid-stride, legs clearly apart' (doc 38 part one section 2).")
    return best[0]


def runs(row):
    out, s = [], None
    for x in range(len(row)):
        if row[x] and s is None:
            s = x
        if not row[x] and s is not None:
            out.append((s, x)); s = None
    if s is not None:
        out.append((s, len(row)))
    return out


def split_legs(mask, hem, fig_h, pivot):
    """R3: seam fit from the rows that DO separate, then small strays only."""
    known = {}
    for y in range(hem, fig_h):
        rr = runs(mask[y])
        if len(rr) == 2:
            w1, w2 = rr[0][1] - rr[0][0], rr[1][1] - rr[1][0]
            if 0.35 < w1 / max(w2, 1) < 3:
                known[y] = (rr[0][1] + rr[1][0]) / 2
    if len(known) < 12:
        raise SystemExit(
            "legs never separate -- regenerate with 'mid-stride, legs clearly apart, "
            "gap visible up to the coat hem' (doc 38 part one section 2)")
    kys = sorted(known)
    fit = np.polyfit(kys, [known[y] for y in kys], 1)

    H, W = mask.shape
    legs = np.zeros((H, W), bool); legs[hem:fig_h] = mask[hem:fig_h]
    near = np.zeros((H, W), bool); far = np.zeros((H, W), bool)
    for y in range(hem, fig_h):
        s = int(round(known[y] if y in known else float(np.polyval(fit, y))))
        near[y, s:] = legs[y, s:]; far[y, :s] = legs[y, :s]

    total = legs.sum()
    for a_, b_ in ((near, far), (far, near)):
        lab, k = ndimage.label(a_)
        if k <= 1:
            continue
        sz = ndimage.sum(a_, lab, range(1, k + 1))
        biggest = int(np.argmax(sz)) + 1
        for i in range(1, k + 1):
            if i != biggest and sz[i - 1] < 0.10 * total:   # SIZE LIMIT IS LOad-BEARING
                sel = lab == i
                b_[sel] = True; a_[sel] = False
    return near, far, len(known)


def rot(layer, ang, cx, cy):
    """R4: premultiplied rotate. Never rotate RGBA straight."""
    al = layer[..., 3:] / 255.0
    pm = np.array(Image.fromarray((layer[..., :3] * al).astype(np.uint8))
                  .rotate(ang, Image.BICUBIC, center=(cx, cy))).astype(float)
    aa = np.array(Image.fromarray(layer[..., 3].astype(np.uint8))
                  .rotate(ang, Image.BICUBIC, center=(cx, cy))).astype(float)
    out = np.zeros_like(layer); nz = aa > 2
    out[..., :3][nz] = np.clip(pm[nz] / (aa[nz][:, None] / 255.0), 0, 255)
    out[..., 3] = aa
    return out


def over(top, base):
    at = top[..., 3:] / 255.0
    return np.dstack([top[..., :3] * at + base[..., :3] * (1 - at),
                      np.maximum(top[..., 3], base[..., 3])])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("source"); ap.add_argument("--out", required=True)
    ap.add_argument("--key", default="green", choices=["green", "magenta"])
    ap.add_argument("--pad", type=int, default=260)
    ap.add_argument("--swing", type=float, default=1.0, help="scales the hip angles")
    args = ap.parse_args()

    core = key_out(Path(args.source), args.key)
    fig_h, fig_w = core.shape[:2]
    P = args.pad
    canvas = np.zeros((fig_h + P // 4, fig_w + 2 * P, 4))
    canvas[:fig_h, P:P + fig_w] = core
    H, W = canvas.shape[:2]
    mask = canvas[..., 3] > 128

    hem = find_hem(mask, fig_h)
    pivot = int(hem - 0.14 * fig_h)
    near_m, far_m, sep_rows = split_legs(mask, hem, fig_h, pivot)

    def as_layer(m):
        L = np.zeros_like(canvas); L[..., :3] = canvas[..., :3]; L[..., 3] = m * 255.0
        return L

    def extend_up(seg):
        mm = seg[..., 3] > 128
        if not mm.any():
            return seg
        top = int(np.nonzero(mm.any(1))[0].min())
        strip = seg[top:top + 6].copy()
        for y in range(pivot, top):
            seg[y] = strip[(y - pivot) % 6]
        return seg

    near = extend_up(as_layer(near_m))
    far = extend_up(as_layer(far_m))
    coat_m = np.zeros((H, W), bool); coat_m[:hem] = mask[:hem]
    coat = as_layer(coat_m)
    cxn = float(np.nonzero(near_m.any(0))[0].mean())
    cxf = float(np.nonzero(far_m.any(0))[0].mean())

    out = Path(args.out); out.mkdir(parents=True, exist_ok=True)
    travel = 0
    for i, s in enumerate(HIP_SWING):
        s *= args.swing
        f = np.zeros((H, W, 4))
        f = over(rot(far, -s, cxf, pivot), f)
        f = over(rot(near, s, cxn, pivot), f)
        f = over(coat, f)
        cols = np.nonzero((f[..., 3] > 90).any(0))[0]
        travel = max(travel, int(cols.max()) - (P + fig_w), P - int(cols.min()))
        Image.fromarray(f.astype(np.uint8)).save(out / f"walk-{i:02d}.png")

    meta = dict(source=args.source, key=args.key, figure=[fig_w, fig_h],
                hem_row=hem, hem_pct=round(hem / fig_h * 100, 1),
                pivot_row=pivot, padding=P, rows_legs_separate=sep_rows,
                near_px=int(near_m.sum()), far_px=int(far_m.sum()),
                measured_foot_travel=travel, hip_swing=HIP_SWING, frames=len(HIP_SWING))
    (out / "rig.json").write_text(json.dumps(meta, indent=2))

    print(f"hem {hem} ({meta['hem_pct']}%)  pivot {pivot}  legs {meta['near_px']}/{meta['far_px']}px")
    print(f"legs separate on {sep_rows} rows; foot travels {travel}px past the silhouette")
    if travel > P - 20:
        print(f"  WARNING: raise --pad above {travel + 40}, the heel will clip")
    print(f"wrote {len(HIP_SWING)} frames + rig.json to {out}")


if __name__ == "__main__":
    main()
