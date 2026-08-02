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
IDLE_BREATH = [0.0, 0.45, 0.85, 1.0, 0.7, 0.3]   # 6 frames, doc 22's rest state
ARM_RATIO = 0.55      # profile: arms swing less than legs; past ~0.7 it reads as marching
ARM_RATIO_HEADON = 0.20   # head-on: a front-view arm barely moves at 233px
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
    """R1: the hem is where a sustained band of TWO SIMILAR-WIDTH runs begins.

    Two earlier rules each worked on the view they were derived from and broke
    on the next one:

      width drop        -- assumes the coat is wider than the legs. In the
                           mid-stride pose this pipeline requires, the leg span
                           equals the coat: 1.54 standing, 1.09 striding.
      end of the last
      single-run block  -- assumes the coat reads as ONE run. True in profile,
                           where the far arm hides behind the body. Head-on
                           with both arms clear it reads as three, and the rule
                           found the feet crossing at 90% instead.

    What survives all four views: below the hem there are two legs of roughly
    equal width, and that persists. The similar-width test is what rejects a
    carried lantern beside the body, which is a 2-run row with a ratio near
    0.13 rather than near 1.
    """
    widest = max(int(mask[y].sum()) for y in range(fig_h)) or 1

    def legs_row(y):
        rr = runs(mask[y])
        if len(rr) != 2:
            return False
        w1, w2 = rr[0][1] - rr[0][0], rr[1][1] - rr[1][0]
        if not 0.4 < w1 / max(w2, 1) < 2.5:
            return False
        # AND both must be NARROW. Without this, an arm held out beside the
        # torso is a 2-run row of acceptable ratio and Hob's hem was found at
        # 45.8% instead of 72%. A leg is a small fraction of the figure's
        # widest row; a torso is most of it.
        return max(w1, w2) < 0.45 * widest

    flags = [legs_row(y) for y in range(fig_h)]
    window = max(10, int(fig_h * 0.05))
    for y in range(int(fig_h * 0.35), fig_h - window):
        tail = flags[y:]
        if sum(flags[y:y + window]) >= window * 0.7 and sum(tail) >= len(tail) * 0.55:
            return y
    raise SystemExit(
        "no hem found -- below the coat there must be two legs of roughly equal "
        "width, sustained. Regenerate with a wider stride (doc 38 part one 2).")


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


def shift_scale(layer, dy, scale, cx, cy):
    """Move a limb TOWARD or AWAY from the camera, for head-on views.

    Rotation is the wrong operation facing the viewer. A leg swinging forward
    does not move sideways -- it moves closer, which projects as a downward
    shift and a slight enlargement, and a leg swinging back does the reverse.
    Applying the profile rig head-on made the legs cross and the arms bounce
    out to the sides.

    WHEN THERE IS NO SCALING, TRANSLATE BY WHOLE PIXELS AND DO NOT RESAMPLE.
    A fractional shift through a bicubic filter rings along the hard edge of a
    hand and drags colour downward -- the smear grows and shrinks with the
    step, which reads as the hand stretching. An integer roll cannot do that
    because it touches no pixel values at all.
    """
    if abs(scale - 1.0) < 1e-6:
        return np.roll(layer, int(round(dy)), axis=0)
    al = layer[..., 3:] / 255.0
    inv = 1.0 / scale
    a, e = inv, inv
    c = cx - inv * cx
    f = cy - inv * (cy + dy)
    def xf(img):
        return img.transform(img.size, Image.AFFINE, (a, 0, c, 0, e, f), Image.BICUBIC)
    pm = np.array(xf(Image.fromarray((layer[..., :3] * al).astype(np.uint8)))).astype(float)
    aa = np.array(xf(Image.fromarray(layer[..., 3].astype(np.uint8)))).astype(float)
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
    ap.add_argument("--arm-swing", type=float, default=None,
                    help="0 for headon. An arm swinging toward the camera "
                         "foreshortens, it does not travel down the frame; "
                         "translating it opens a gap at the shoulder that "
                         "reads as the hand stretching.")
    ap.add_argument("--near-mask", help="ARMMASK code or file for the near arm")
    ap.add_argument("--far-mask", help="ARMMASK code or file for the far arm")
    ap.add_argument("--clip", default="walk", choices=["walk", "idle"],
                    help="idle is the rest state every chore settles into (doc 22)")
    ap.add_argument("--breath", type=float, default=1.0,
                    help="scales the idle breath; 1.0 is about one display pixel")
    ap.add_argument("--view", default="profile", choices=["profile", "headon"],
                    help="headon = front or back. Limbs shift and scale toward "
                         "the camera instead of rotating.")
    ap.add_argument("--facing", default="right", choices=["left", "right"],
                    help="which way the source looks; recorded so callers "
                         "translate the right way. Got this backwards twice by hand.")
    args = ap.parse_args()

    if args.arm_swing is None:
        args.arm_swing = ARM_RATIO_HEADON if args.view == "headon" else ARM_RATIO
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
        # EACH ARM PIVOTS FROM ITS OWN SHOULDER. A shared pivot taken from the
        # higher of the two masks swings the other arm about a point well above
        # its own top -- on Thad's left profile that was 213px of false radius.
        def top_of(m):
            ys = np.nonzero(m.any(1))[0]
            return int(ys.min()) if len(ys) else shoulder
        sh_near, sh_far = top_of(near_am), top_of(far_am)
    else:
        sh_near = sh_far = shoulder

    def as_layer(m):
        L = np.zeros_like(canvas); L[..., :3] = canvas[..., :3]; L[..., 3] = m * 255.0
        return L

    def extend_up(seg, limit=None):
        """Extend a leg upward under the coat so rotation opens no gap at the hem.

        LIMIT IT. Extending all the way to the pivot puts ~230px of replicated
        leg above the hem, and because the arms are cut out of the coat, those
        holes look straight through onto it. The strip then slides with the
        legs, which reads as colour bleeding around the hands. Extend only as
        far as the limb can actually move.
        """
        mm = seg[..., 3] > 128
        if not mm.any():
            return seg
        top = int(np.nonzero(mm.any(1))[0].min())
        stop = top - int(limit) if limit is not None else pivot
        stop = max(stop, pivot)
        strip = seg[top:top + 6].copy()
        for y in range(stop, top):
            seg[y] = strip[(y - stop) % 6]
        return seg

    coat_m = np.zeros((H, W), bool); coat_m[:hem] = mask[:hem]
    if near_am is not None:
        arms_all = near_am | far_am
        # ARMS MUST NOT BE PART OF THE LEGS, AND THIS MUST HAPPEN BEFORE THE
        # LEG LAYERS ARE BUILT. A painted arm mask runs below the hem --
        # Thad's hands reach 22px past it -- so 1,576 hand pixels were being
        # assigned to the near leg, moving with the stride while extend_up
        # replicated those skin rows upward. That is the hand stretching and
        # the colour flashing. Subtracting after the layers exist changes
        # nothing, which is how this survived a round.
        below = int((arms_all[hem:]).sum())
        if below:
            near_lm = near_lm & ~arms_all
            far_lm = far_lm & ~arms_all
            print(f"removed {below}px of arm from the leg layers "
                  f"(arm masks reach below the hem)")
        coat_m &= ~arms_all
        print(f"arms: near {int(near_am.sum())}px, far {int(far_am.sum())}px")
    else:
        print("arms: not separable -- they must hang clear of the torso (doc 38)")

    leg_reach = int(0.030 * fig_h) + 12 if args.view == "headon" else None
    near_leg = extend_up(as_layer(near_lm), leg_reach)
    far_leg = extend_up(as_layer(far_lm), leg_reach)
    coat = as_layer(coat_m)
    cxn = float(np.nonzero(near_lm.any(0))[0].mean())
    cxf = float(np.nonzero(far_lm.any(0))[0].mean())

    out = Path(args.out); out.mkdir(parents=True, exist_ok=True)
    travel = 0

    if args.clip == "idle":
        # BREATHING. The legs are planted; everything above the hem rises and
        # settles. Amplitude is set as a fraction of figure height so it lands
        # at roughly one pixel once scaled to 233px -- at full resolution that
        # is ~8px, and anything smaller vanishes entirely on screen.
        amp = 0.005 * fig_h * args.breath
        for i, t in enumerate(IDLE_BREATH):
            dy = -int(round(amp * t))
            f = np.zeros((H, W, 4))
            f = over(far_leg, f)
            f = over(near_leg, f)
            if far_am is not None:
                f = over(np.roll(as_layer(far_am), dy, axis=0), f)
            f = over(np.roll(coat, dy, axis=0), f)
            if near_am is not None:
                f = over(np.roll(as_layer(near_am), dy, axis=0), f)
            Image.fromarray(f.astype(np.uint8)).save(out / f"idle-{i:02d}.png")
        meta = dict(source=args.source, key=args.key, clip="idle", view=args.view,
                    facing=args.facing, figure=[fig_w, fig_h], hem_row=hem,
                    padding=P, breath_px=round(amp, 1), frames=len(IDLE_BREATH))
        (out / "rig.json").write_text(json.dumps(meta, indent=2))
        print(f"idle: {len(IDLE_BREATH)} frames, breath {amp:.0f}px at source "
              f"(~{amp*233/fig_h:.1f}px on screen)")
        return
    for i, s in enumerate(HIP_SWING):
        s *= args.swing
        a = s * args.arm_swing
        f = np.zeros((H, W, 4))
        if args.view == "headon":
            k = s / max(HIP_SWING)                      # -1 .. 1
            dy = 0.030 * fig_h * k                      # forward limb drops
            sc = 1.0 + 0.045 * k                        # and enlarges slightly
            # legs alternate: one forward, one back
            f = over(shift_scale(far_leg, -dy, 2 - sc, cxf, pivot), f)
            f = over(shift_scale(near_leg, dy, sc, cxn, pivot), f)
            if far_am is not None:
                f = over(shift_scale(as_layer(far_am), dy * args.arm_swing, 1.0,
                                     float(np.nonzero(far_am.any(0))[0].mean()), sh_far), f)
            f = over(coat, f)
            if near_am is not None:
                f = over(shift_scale(as_layer(near_am), -dy * args.arm_swing, 1.0,
                                     float(np.nonzero(near_am.any(0))[0].mean()), sh_near), f)
        else:
            f = over(rot(far_leg, -s, cxf, pivot), f)
            f = over(rot(near_leg, s, cxn, pivot), f)
            if far_am is not None:
                arm = swing_arm(far_am, canvas, sh_far, -a, elbow_frac=0.15, fore_lead=0.25)
                if arm is not None:
                    f = over(arm, f)
            f = over(coat, f)
            if near_am is not None:
                arm = swing_arm(near_am, canvas, sh_near, a)
                if arm is not None:
                    f = over(arm, f)
        cols = np.nonzero((f[..., 3] > 90).any(0))[0]
        travel = max(travel, int(cols.max()) - (P + fig_w), P - int(cols.min()))
        Image.fromarray(f.astype(np.uint8)).save(out / f"walk-{i:02d}.png")

    meta = dict(source=args.source, key=args.key, view=args.view, facing=args.facing,
                walk_dx=(1 if args.facing == "right" else -1),
                figure=[fig_w, fig_h], hem_row=hem,
                hem_pct=round(hem / fig_h * 100, 1), pivot_row=pivot, padding=P,
                rows_legs_separate=sep_rows,
                near_leg_px=int(near_lm.sum()), far_leg_px=int(far_lm.sum()),
                arms_rigged=near_am is not None,
                shoulder_near=int(sh_near), shoulder_far=int(sh_far),
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
