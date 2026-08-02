#!/usr/bin/env python3
"""Cut a keyed character generation into a rigged 8-frame walk cycle.

Every rule here is from docs/38-character-pipeline.md. Read it before
changing anything -- each guard exists because its absence cost a round.

    python3 tools/rig/character.py hob.png --out art/actors/hob --key magenta
"""
from __future__ import annotations
import argparse, json
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage

HIP_SWING = [14, 10, 0, -10, -14, -10, 0, 10]
ARM_RATIO = 0.55      # arms swing less than legs; past ~0.7 it reads as marching
FORE_LEAD = 0.85      # forearm leads the upper arm -- this is what reads as an elbow


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


def find_hem(mask: np.ndarray, fig_h: int) -> int:
    """R1: the hem is just below the last sustained block of SINGLE-RUN rows.

    Width drop was the original rule and it is wrong. It assumes a standing
    pose where the coat is wider than the legs; in the mid-stride pose the
    pipeline now requires, the leg span is as wide as the coat and there is no
    drop at all -- measured 1.54 standing, 1.09 striding.

    What holds for both: the coat is one continuous shape and below it there
    are two. So find the lowest sustained stretch of single-run rows; the hem
    is immediately below it. This also steps over the gap a carried lantern
    opens higher up, which defeated two earlier attempts.
    """
    nruns = [len(runs(mask[y])) for y in range(fig_h)]
    min_block = max(6, int(fig_h * 0.02))
    hem, streak = None, 0
    for y in range(int(fig_h * 0.35), fig_h):
        if nruns[y] == 1:
            streak += 1
        else:
            if streak >= min_block:
                hem = y
            streak = 0
    if hem is None:
        raise SystemExit("no hem found -- need a continuous coat above and two legs below")
    below = list(range(hem, fig_h))
    share = sum(1 for y in below if nruns[y] == 2) / max(len(below), 1)
    if share < 0.55:
        raise SystemExit(
            f"hem at {hem} but only {share:.0%} of rows below show two legs -- "
            "regenerate with a wider stride (doc 38 part one section 2)")
    return hem


def split_legs(mask, hem, fig_h):
    """R3: seam fit from the rows that DO separate, then small strays only."""
    known = {}
    for y in range(hem, fig_h):
        rr = runs(mask[y])
        if len(rr) == 2:
            w1, w2 = rr[0][1] - rr[0][0], rr[1][1] - rr[1][0]
            if 0.35 < w1 / max(w2, 1) < 3:
                known[y] = (rr[0][1] + rr[1][0]) / 2
    if len(known) < 12:
        raise SystemExit("legs never separate -- regenerate with legs clearly apart")
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
            if i != biggest and sz[i - 1] < 0.10 * total:   # SIZE LIMIT IS LOAD-BEARING
                sel = lab == i
                b_[sel] = True; a_[sel] = False
    return near, far, len(known)


def split_arms(mask, hem, fig_h):
    """Lift both arms off the coat.

    The required pose has both arms hanging clear of the torso, so across a
    band of rows the silhouette reads arm | coat | arm. The widest run on each
    row is the coat; a narrow run outside it is an arm.

    WHICH ARM IS NEAR IS DECIDED BY MASS, NOT BY SIDE. The near arm is drawn
    whole; the far one is partly behind the body and carries far less -- on
    Thad, 31,302px against 11,748. Assigning by side inverted them, putting
    the fully drawn arm behind the coat and the half-hidden one in front.
    """
    H, W = mask.shape
    left = np.zeros((H, W), bool)
    right = np.zeros((H, W), bool)
    rows = []
    for y in range(int(fig_h * 0.25), hem):
        rr = runs(mask[y])
        if len(rr) < 2:
            continue
        widths = [e - s for s, e in rr]
        body = int(np.argmax(widths))
        got = False
        for i, (s, e) in enumerate(rr):
            if i == body or (e - s) > widths[body] * 0.55:
                continue
            (left if i < body else right)[y, s:e] = mask[y, s:e]
            got = True
        if got:
            rows.append(y)
    if not rows:
        return None, None, None
    near, far = (left, right) if left.sum() >= right.sum() else (right, left)
    return near, far, min(rows)


def parse_mask_code(code: str, fig_w: int, fig_h: int):
    """Decode an ARMMASK code painted in tools/rig/mark-the-arm.html.

    Auto-detection can only see the part of a limb that clears the torso as
    its own run. On Thad that was 11,748px of a 27,535px arm -- 43% -- and
    rotating the sliver while the rest stayed welded to the coat is what read
    as a hinge at the wrist. A painted mask states the whole limb.
    """
    body = code.strip().splitlines()[-1]
    cols = rows = None
    for line in code.strip().splitlines():
        if "grid=" in line:
            g = line.split("grid=")[1].split()[0]
            cols, rows = (int(v) for v in g.split("x"))
    if cols is None:
        cols, rows = 48, 114
    m = np.zeros((fig_h, fig_w), bool)
    for tok in body.split(","):
        if ":" not in tok:
            continue
        r, rng = tok.split(":")
        lo, hi = rng.split("-")
        r, lo, hi = int(r), int(lo), int(hi)
        y0, y1 = int(r * fig_h / rows), int((r + 1) * fig_h / rows)
        x0, x1 = int(lo * fig_w / cols), int((hi + 1) * fig_w / cols)
        m[y0:y1, x0:x1] = True
    return m


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


def swing_arm(seg_mask, canvas, shoulder, ang, elbow_frac=0.45, fore_lead=FORE_LEAD):
    """Two-segment arm: upper from the shoulder, forearm from the elbow.

    One rigid rotation makes a long arm read as a stick hinged at the hand.
    A short arm looks right by accident, because its upper half sits inside
    the coat and the eye supplies the joint. Supply it properly instead.
    """
    ys = np.nonzero(seg_mask.any(1))[0]
    if not len(ys):
        return None
    top, bot = int(ys.min()), int(ys.max())
    cx = float(np.nonzero(seg_mask.any(0))[0].mean())
    L = np.zeros(canvas.shape); L[..., :3] = canvas[..., :3]
    rows = np.arange(L.shape[0])[:, None]
    elbow = int(top + elbow_frac * (bot - top))
    upper = L.copy(); upper[..., 3] = (seg_mask & (rows < elbow)) * 255.0
    fore = L.copy();  fore[..., 3] = (seg_mask & (rows >= elbow)) * 255.0
    fore = rot(fore, ang * fore_lead, cx, elbow)
    return rot(over(fore, upper), ang, cx, shoulder)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("source"); ap.add_argument("--out", required=True)
    ap.add_argument("--key", default="magenta", choices=["green", "magenta"])
    ap.add_argument("--pad", type=int, default=260)
    ap.add_argument("--swing", type=float, default=1.0)
    ap.add_argument("--arm-swing", type=float, default=ARM_RATIO)
    ap.add_argument("--near-mask", help="ARMMASK code or file for the near arm")
    ap.add_argument("--far-mask", help="ARMMASK code or file for the far arm")
    ap.add_argument("--facing", default="right", choices=["left", "right"],
                    help="which way the source looks; recorded so callers "
                         "translate the right way. Got this backwards twice by hand.")
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
    near_lm, far_lm, sep_rows = split_legs(mask, hem, fig_h)
    near_am, far_am, shoulder = split_arms(mask, hem, fig_h)

    def painted(arg):
        if not arg:
            return None
        txt = Path(arg).read_text() if Path(arg).exists() else arg
        m = parse_mask_code(txt, fig_w, fig_h)
        pad = np.zeros((H, W), bool); pad[:fig_h, P:P + fig_w] = m
        return pad & mask                       # never outside the figure

    pm_near, pm_far = painted(args.near_mask), painted(args.far_mask)
    if pm_far is not None:
        print(f"far arm from painted mask: {int(pm_far.sum())}px "
              f"(auto found {int(far_am.sum()) if far_am is not None else 0})")
        far_am = pm_far
    if pm_near is not None:
        print(f"near arm from painted mask: {int(pm_near.sum())}px "
              f"(auto found {int(near_am.sum()) if near_am is not None else 0})")
        near_am = pm_near
    if near_am is not None and far_am is not None:
        near_am = near_am & ~far_am             # a pixel belongs to one arm only
        ys_all = np.nonzero((near_am | far_am).any(1))[0]
        if len(ys_all):
            shoulder = int(ys_all.min())

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

    near_leg = extend_up(as_layer(near_lm))
    far_leg = extend_up(as_layer(far_lm))
    coat_m = np.zeros((H, W), bool); coat_m[:hem] = mask[:hem]
    if near_am is not None:
        coat_m &= ~(near_am | far_am)          # arms come OUT of the coat layer
        print(f"arms: near {int(near_am.sum())}px, far {int(far_am.sum())}px, "
              f"shoulder row {shoulder}")
    else:
        print("arms: not separable -- they must hang clear of the torso (doc 38)")
    coat = as_layer(coat_m)
    cxn = float(np.nonzero(near_lm.any(0))[0].mean())
    cxf = float(np.nonzero(far_lm.any(0))[0].mean())

    out = Path(args.out); out.mkdir(parents=True, exist_ok=True)
    travel = 0
    for i, s in enumerate(HIP_SWING):
        s *= args.swing
        a = s * args.arm_swing
        f = np.zeros((H, W, 4))
        f = over(rot(far_leg, -s, cxf, pivot), f)
        f = over(rot(near_leg, s, cxn, pivot), f)
        # FAR arm, then coat over it: it swings behind the body and is meant to
        # pass out of sight. Barely any elbow -- it is mostly occluded anyway.
        if far_am is not None:
            arm = swing_arm(far_am, canvas, shoulder, -a, elbow_frac=0.15, fore_lead=0.25)
            if arm is not None:
                f = over(arm, f)
        f = over(coat, f)
        # NEAR arm last, in front of the coat, with a full elbow.
        if near_am is not None:
            arm = swing_arm(near_am, canvas, shoulder, a)
            if arm is not None:
                f = over(arm, f)
        cols = np.nonzero((f[..., 3] > 90).any(0))[0]
        travel = max(travel, int(cols.max()) - (P + fig_w), P - int(cols.min()))
        Image.fromarray(f.astype(np.uint8)).save(out / f"walk-{i:02d}.png")

    meta = dict(source=args.source, key=args.key, facing=args.facing,
                walk_dx=(1 if args.facing == "right" else -1),
                figure=[fig_w, fig_h], hem_row=hem,
                hem_pct=round(hem / fig_h * 100, 1), pivot_row=pivot, padding=P,
                rows_legs_separate=sep_rows,
                near_leg_px=int(near_lm.sum()), far_leg_px=int(far_lm.sum()),
                arms_rigged=near_am is not None, shoulder_row=shoulder,
                near_arm_px=int(near_am.sum()) if near_am is not None else 0,
                far_arm_px=int(far_am.sum()) if far_am is not None else 0,
                measured_foot_travel=travel, hip_swing=HIP_SWING,
                arm_ratio=args.arm_swing, frames=len(HIP_SWING))
    (out / "rig.json").write_text(json.dumps(meta, indent=2))

    print(f"hem {hem} ({meta['hem_pct']}%)  pivot {pivot}  "
          f"legs {meta['near_leg_px']}/{meta['far_leg_px']}px")
    print(f"legs separate on {sep_rows} rows; foot travels {travel}px past the silhouette")
    if travel > P - 20:
        print(f"  WARNING: raise --pad above {travel + 40}, the heel will clip")
    print(f"wrote {len(HIP_SWING)} frames + rig.json to {out}")


if __name__ == "__main__":
    main()
