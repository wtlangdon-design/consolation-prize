#!/usr/bin/env python3
"""THE HYBRID PROFILE WALK: authored whole upper bodies, one set of legs rephased under the coat.

    python3 tools/rig/hybrid-walk.py --spec <spec.json> --out <dir>

TYLER'S RULING (2026-09-05, zero-image hybrid pass), after three image
operations returned the same contact pose: the profile gait is built from the
COMPLETE AUTHORED POSES that exist -- each frame's upper body (head, hair,
neck, shoulders, torso, waistcoat, the whole coat, both sleeves, both hands)
is one authored figure's pixels down to its own coat hem, byte for byte and
never rearranged -- and the ONLY thing constructed is the legs beneath the
coat. The legs come from ONE authored frame (the contact pose): split at its
hem into the forward and trailing leg, each levelled by its own measured
angle, its root extended straight up under the coat to the hip pivot so no
join can ever show below the hem, then swung about that concealed hip to the
phase the frame needs, the far leg half a cycle behind the near. Real pixels
rotate; nothing is redrawn, mirrored or duplicated. The planted foot is
grounded per frame and the whole authored upper body drops with it, so the
man bobs rather than the feet floating.

The spec lists the frames in loop order: which authored frame's upper body,
its provenance, the leg phase in degrees (0 = the contact pose's own stride,
180 = the other leg leading), and the hand columns measured on that upper
body so the record carries the arm arc.
"""
import argparse, hashlib, importlib.util, json, sys, math
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage

here = Path(__file__).resolve().parent
spec_ = importlib.util.spec_from_file_location("character", here / "character.py"); ch = importlib.util.module_from_spec(spec_)
_argv = sys.argv; sys.argv = ["x"]; spec_.loader.exec_module(ch); sys.argv = _argv

ap = argparse.ArgumentParser()
ap.add_argument("--spec", required=True); ap.add_argument("--out", required=True)
ap.add_argument("--swing", type=float, default=None, help="hip amplitude in degrees; default: the contact source's own measured stride")
args = ap.parse_args()
spec = json.loads(Path(args.spec).read_text())
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()

def load(path):
    return np.array(Image.open(path).convert("RGBA")).astype(float)

def hem_row(rgba):
    """The coat's lowest row: the last row (from the bottom) where coat colour spans 40% of the torso's width."""
    m = rgba[..., 3] > 128; rgb = rgba[..., :3]
    rows = np.nonzero(m.any(1))[0]; top, bot = rows.min(), rows.max(); h = bot - top + 1
    torso = m[top + int(0.3 * h):top + int(0.6 * h)]; cols = np.nonzero(torso.any(0))[0]; tw = cols.max() - cols.min()
    coat = (rgb[..., 2] - rgb[..., 0] > 5) & (rgb[..., 2] > 55) & (rgb[..., 2] < 150) & m
    for y in range(top + int(0.8 * h), top + int(0.5 * h), -1):
        if coat[y].sum() > 0.4 * tw:
            return int(y), float(cols.mean())
    raise SystemExit("no coat hem found")

# ---- the legs, from the contact source ----
src = spec["legs"]["source"]
legs_src = load(src); H, W = legs_src.shape[:2]
mask = legs_src[..., 3] > 128
rows = np.nonzero(mask.any(1))[0]; fig_top, fig_bot = int(rows.min()), int(rows.max()); fig_h = fig_bot - fig_top + 1
hem, hip_cx = hem_row(legs_src)
cut = hem + spec["legs"].get("cutBelowHem", 3)          # the legs begin a few rows under the coat's last row
pivot = int(hem - spec["legs"].get("pivotAboveHem", 50))   # the concealed hip: high enough to be under the coat, low enough that the roots barely travel
near_m, far_m, sep = ch.split_legs(mask, cut, fig_bot + 1)

def limb_angle(m):
    ys = np.nonzero(m.any(1))[0]; lo = ys.max()
    band = m[max(int(lo - 0.08 * (lo - pivot)), pivot + 1):lo + 1]
    end_cx = float(np.nonzero(band.any(0))[0].mean())
    return float(np.degrees(np.arctan2(end_cx - hip_cx, lo - pivot)))
ang = {"near": limb_angle(near_m), "far": limb_angle(far_m)}
amp = args.swing if args.swing is not None else (abs(ang["near"]) + abs(ang["far"])) / 2

def leg_layer(m):
    """The leg's own pixels, levelled about the hip, its root extended straight up to the pivot."""
    layer = np.zeros((H, W, 4)); layer[m] = legs_src[m]
    a = ang["near"] if m is near_m else ang["far"]
    lev = ch.rot(layer, -a, hip_cx, pivot)                 # +a rotates the foot right; take the angle out
    lm = lev[..., 3] > 128
    ys = np.nonzero(lm.any(1))[0]; top = int(ys.min())
    # THE CUT EDGE IS A SLANT ONCE LEVELLED: a horizontal cut through a leg
    # that hung at 20 degrees becomes a diagonal, two pixels wide at its
    # tip. The root is therefore extended from the first rows where the leg
    # is its full width, and everything above them -- the slant included --
    # is replaced by those rows repeated up to the pivot, under the coat.
    widths = np.array([int(lm[y].sum()) for y in range(top, top + int(0.3 * len(ys)))])
    full = int(np.median(widths[len(widths) // 2:]))
    first = top + int(np.argmax(widths >= 0.92 * full))
    strip = lev[first:first + 6].copy()
    for y in range(pivot, first):
        lev[y] = strip[(y - pivot) % len(strip)]
    return lev

near_lv, far_lv = leg_layer(near_m), leg_layer(far_m)

def legs_at(phase_deg):
    """Both legs at a gait phase: the near leg at +amp*cos(phase), the far leg half a cycle behind. Far first, near on top."""
    a_near = amp * math.cos(math.radians(phase_deg)); a_far = -a_near
    f = ch.over(ch.rot(near_lv, a_near, hip_cx, pivot), ch.rot(far_lv, a_far, hip_cx, pivot))
    return f, a_near, a_far

# ---- compose ----
out = Path(args.out); out.mkdir(parents=True, exist_ok=True)
for old in out.glob("*.png"):
    old.unlink()
frames = []
for i, fr in enumerate(spec["frames"]):
    up = load(fr["upper"]); uh, ucx = hem_row(up)
    upper = up.copy(); upper[uh + 1:] = 0                 # the authored figure down to and including its own hem row
    legs, a_near, a_far = legs_at(fr["phase"])
    dx = int(round(ucx - hip_cx))                          # the legs' hip under this upper body's coat centre
    legs = np.roll(legs, dx, axis=1) if dx else legs
    # ABOVE THE HEM THE LEGS EXIST ONLY UNDER THE COAT. The extended roots
    # are there to be hidden; where a root would reach past the coat's own
    # outline it is cut away, so no leg pixel is ever visible above the hem.
    under = up[..., 3] > 128
    legs = legs.copy(); legs[:uh + 1][~under[:uh + 1]] = 0
    frames.append(dict(spec=fr, upper=upper, legs=legs, a_near=a_near, a_far=a_far, hem=uh, dx=dx))
lows = [int(np.nonzero((f["legs"][..., 3] > 90).any(1))[0].max()) for f in frames]
# THE GROUND IS THE CYCLE'S LOWEST SOLE, and every frame drops to meet it --
# character.py's rule. Levelled legs are longer than the contact pose's angled
# ones (the artist drew the stride at standing height), so the man is tallest
# at mid-stance and dips at the contacts: the walking bob, about 3% of height
# here. Nothing rises above the canvas top; the figure height is the tallest
# frame's, and the renderer scales it to the actor's drawn height as it does
# every clip.
ground = max(lows)
record = []
for i, f in enumerate(frames):
    drop = ground - lows[i]
    legs = ch.shift_rows(f["legs"], drop) if drop else f["legs"]
    body = ch.shift_rows(f["upper"], drop) if drop else f["upper"]
    at = body[..., 3:] / 255.0
    comp = np.dstack([body[..., :3] * at + legs[..., :3] * (1 - at), np.maximum(body[..., 3], legs[..., 3])])
    # DESPILL AFTER THE ROTATION, downscale.py's own rule: a bicubic
    # rotation blends a soft edge's residual magenta into a few visible
    # pixels; red and blue are pulled down together to 22 above green,
    # keeping their ratio, so the fringe check's line is never crossed.
    comp = np.clip(comp, 0, 255)
    rgb = comp[..., :3]; avg = (rgb[..., 0] + rgb[..., 2]) / 2
    over = (comp[..., 3] > 0) & (avg > rgb[..., 1] + 22)
    scale = np.where(over, (rgb[..., 1] + 22) / np.maximum(avg, 1e-6), 1.0)
    rgb[..., 0] *= scale; rgb[..., 2] *= scale
    Image.fromarray(np.clip(comp, 0, 255).astype(np.uint8), "RGBA").save(out / f"walk-{i:02d}.png")
    a = comp[..., 3] > 128
    record.append(dict(frame=f"walk-{i:02d}.png", role=f["spec"]["role"], upper=dict(path=f["spec"]["upper"], sha256=sha(f["spec"]["upper"]), provenance=f["spec"]["provenance"], rowsUsed=f"0..{f['hem']}", hem=f["hem"]),
                       legs=dict(phase=f["spec"]["phase"], nearLegDeg=round(f["a_near"], 1), farLegDeg=round(f["a_far"], 1), forwardLeg=("near" if f["a_near"] > 0.5 else "far" if f["a_near"] < -0.5 else "together"), hipShift=f["dx"], groundDrop=int(drop)),
                       hands=f["spec"].get("hands"), placedHeight=int(a.any(1).sum()), soleRow=int(np.nonzero(a.any(1))[0].max())))
fig_w = int(np.nonzero(mask.any(0))[0].max() - np.nonzero(mask.any(0))[0].min() + 1); pad = int(np.nonzero(mask.any(0))[0].min())
min_h = min(r["placedHeight"] for r in record)
meta = dict(method="hybrid-authored-upper-bodies", clip="walk", view="profile", facing="right", walk_dx=1,
            figure=[fig_w, ground + 1], padding=pad, frames=len(record),
            legs=dict(source=src, sourceSha256=sha(src), hem=hem, cutRow=cut, pivotRow=pivot, hipColumn=round(hip_cx, 1), separatedRows=int(sep),
                      sourceAngles={k: round(v, 1) for k, v in ang.items()}, amplitudeDeg=round(amp, 1), knee=0,
                      method="split at the hem, levelled by the measured angle, root extended straight up to the pivot under the coat, swung about the concealed hip; far leg half a cycle behind; real pixels rotated, nothing redrawn"),
            upperBodies="each frame's authored figure down to its own coat hem, pixel-identical, moved only as one unit by the frame's ground drop",
            extracted=record,
            ruling="Tyler, 2026-09-05: authored whole upper bodies preserved; only the legs beneath the coat are rephased. tools/rig/hybrid-walk.py.")
(out / "rig.json").write_text(json.dumps(meta, indent=2))
print(f"hybrid walk: {len(record)} frames -> {out}; legs from {src} (hem {hem}, cut {cut}, pivot {pivot}, hip {hip_cx:.0f}, angles near {ang['near']:+.1f} far {ang['far']:+.1f}, amplitude {amp:.1f}); drops {[r['legs']['groundDrop'] for r in record]}; forward legs {[r['legs']['forwardLeg'] for r in record]}")
