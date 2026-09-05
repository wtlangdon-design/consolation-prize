#!/usr/bin/env python3
"""Crop COMPLETE figures out of an authored walk-cycle sheet.

    python3 tools/rig/cut-cycle-sheet.py <sheet.png> --poses 1,2,3 --stand art/actors/thad-stand-right/stand-00.png --out <dir>
    python3 tools/rig/cut-cycle-sheet.py <sheetA.png> --poses 1,2,3 --also <sheetB.png>:1,2,3 --stand ... --out <dir>

TWO SHEETS, ONE CYCLE (Tyler, 2026-09-05, the opposite half): `--also` appends
the listed figures of a second sheet after the first sheet's, in loop order,
so a cycle whose halves were acquired in two operations is still cut by one
tool with ONE scale. The scale is still set by the upright pose and applied to
every figure of both sheets; nothing else differs.

TYLER'S RULING (2026-09-05): the principal character's profile walk comes
from authored whole-body poses, cropped whole. This tool cuts each figure of
the sheet out as one piece -- keyed with character.py's own key_out, so the
despill and edge bleed are the pipeline's -- and does nothing to its anatomy.
The only transforms are the permitted ones: ONE uniform scale for every
frame (so the man in the sheet is the man in the stand: the scale is chosen
so the upright passing pose stands as tall as the stand frame), integer
placement on the stand's canvas with the soles on the stand's ground row and
the torso's centre column on the stand's, and nothing else.

Poses are numbered left to right on the sheet. Frames are written in the
order given, so the cycle's loop order is the argument's order.
"""
import argparse, hashlib, importlib.util, json, sys
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage

ap = argparse.ArgumentParser()
ap.add_argument("sheet"); ap.add_argument("--poses", required=True, help="comma list, 1-based, left to right, in loop order")
ap.add_argument("--stand", required=True, help="the standing frame whose canvas, ground row, torso column and stature the frames match")
ap.add_argument("--upright", type=int, default=None, help="which listed pose is the upright one whose height is set to the stand's (default: the shortest-wide one)")
ap.add_argument("--also", default=None, help="<sheet.png>:<poses> -- a second sheet whose listed figures follow the first sheet's in loop order")
ap.add_argument("--out", required=True); ap.add_argument("--key", default="magenta")
args = ap.parse_args()

here = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("character", here / "character.py"); ch = importlib.util.module_from_spec(spec)
_argv = sys.argv; sys.argv = ["x"]; spec.loader.exec_module(ch); sys.argv = _argv
spec2 = importlib.util.spec_from_file_location("downscale", here / "downscale.py"); ds = importlib.util.module_from_spec(spec2)
sys.argv = ["x"]; spec2.loader.exec_module(ds); sys.argv = _argv

def figures(path):
    sheet = np.array(Image.open(path).convert("RGB")).astype(int)
    key = (sheet[..., 0] > 180) & (sheet[..., 1] < 90) & (sheet[..., 2] > 180)
    lab, n = ndimage.label(~key)
    sizes = ndimage.sum(~key, lab, range(1, n + 1))
    comps = sorted([i + 1 for i in range(n) if sizes[i] > 5000], key=lambda i: np.nonzero(lab == i)[1].min())
    return sheet, lab, comps

# (sheet path, pose number) per frame, in loop order
sources = [(args.sheet, int(p)) for p in args.poses.split(",")]
if args.also:
    also_path, also_poses = args.also.rsplit(":", 1)
    sources += [(also_path, int(p)) for p in also_poses.split(",")]
sheets = {path: figures(path) for path in dict.fromkeys(p for p, _ in sources)}
for path, p in sources:
    if p > len(sheets[path][2]):
        raise SystemExit(f"{path} has {len(sheets[path][2])} figures; pose {p} does not exist")
poses = [p for _, p in sources]

stand = np.array(Image.open(args.stand).convert("RGBA"))
sa = stand[..., 3] > 128
H, W = sa.shape
ground = int(np.nonzero(sa.any(1))[0].max())
rows_s = np.nonzero(sa.any(1))[0]; stature = int(rows_s.max() - rows_s.min() + 1)
torso_rows = slice(rows_s.min() + int(0.30 * stature), rows_s.min() + int(0.60 * stature))
torso_cx_stand = float(np.nonzero(sa[torso_rows].any(0))[0].mean())
pad = int(np.nonzero(sa.any(0))[0].min()); fig_w_stand = int(np.nonzero(sa.any(0))[0].max() - pad + 1)

# key each figure out of its own crop (with margin), as character.py keys a source
keyed = []
for path, p in sources:
    sheet, lab, comps = sheets[path]
    ys, xs = np.nonzero(lab == comps[p - 1]); m = 24
    y0, y1, x0, x1 = max(0, ys.min() - m), min(sheet.shape[0], ys.max() + m + 1), max(0, xs.min() - m), min(sheet.shape[1], xs.max() + m + 1)
    crop = Image.fromarray(sheet[y0:y1, x0:x1].astype(np.uint8))
    tmp = Path(args.out) / f"_crop-{p}.png"; Path(args.out).mkdir(parents=True, exist_ok=True); crop.save(tmp)
    rgba = ch.key_out(tmp, args.key); tmp.unlink()
    keyed.append(rgba)

heights = [int((k[..., 3] > 128).any(1).sum()) for k in keyed]
widths = [int((k[..., 3] > 128).any(0).sum()) for k in keyed]
up = (args.upright - 1) if args.upright else int(np.argmin(widths))
factor = stature / heights[up]
out = Path(args.out); out.mkdir(parents=True, exist_ok=True)
for old in out.glob("walk-*.png"):
    old.unlink()
record = []
for i, ((path, p), k) in enumerate(zip(sources, keyed)):
    frame = Image.fromarray(k.astype(np.uint8), "RGBA")
    size = (max(1, round(frame.width * factor)), max(1, round(frame.height * factor)))
    small = np.array(ds.reduce_frame(frame, size) if factor < 1 else frame.resize(size, Image.LANCZOS)).astype(float)
    a = small[..., 3] > 128
    rows = np.nonzero(a.any(1))[0]; sole = int(rows.max()); top = int(rows.min()); h = sole - top + 1
    trs = slice(top + int(0.30 * h), top + int(0.60 * h))
    cx = float(np.nonzero(a[trs].any(0))[0].mean())
    canvas = np.zeros((H, W, 4))
    dy = ground - sole; dx = int(round(torso_cx_stand - cx))
    sh, sw = small.shape[:2]
    ys0, ys1 = max(0, -dy), min(sh, H - dy); xs0, xs1 = max(0, -dx), min(sw, W - dx)
    canvas[dy + ys0:dy + ys1, dx + xs0:dx + xs1] = small[ys0:ys1, xs0:xs1]
    Image.fromarray(np.clip(canvas, 0, 255).astype(np.uint8), "RGBA").save(out / f"walk-{i:02d}.png")
    ca = canvas[..., 3] > 128
    record.append({"frame": f"walk-{i:02d}.png", "sheet": path, "pose": p, "sheetHeight": heights[i], "sheetWidth": widths[i], "placedHeight": int(ca.any(1).sum()), "placedWidth": int(ca.any(0).sum()), "soleRow": int(np.nonzero(ca.any(1))[0].max()), "torsoShift": dx})
min_h = min(r["placedHeight"] for r in record)
meta = dict(method="authored-cycle-sheet", source=args.sheet, sourceSha256=hashlib.sha256(Path(args.sheet).read_bytes()).hexdigest(),
            sources=[{"path": path, "sha256": hashlib.sha256(Path(path).read_bytes()).hexdigest()} for path in sheets], key=args.key,
            clip="walk", view="profile", facing="right", walk_dx=1, poses=poses, uprightPose=poses[up], scale=round(factor, 4),
            figure=[fig_w_stand, min_h], padding=pad, standCanvas={"path": args.stand, "ground": ground, "torsoColumn": round(torso_cx_stand, 1), "stature": stature},
            frames=len(poses), extracted=record,
            ruling="Tyler, 2026-09-05: authored whole-body walk poses cropped whole; no limb cut, rotated, transplanted or reattached. tools/rig/cut-cycle-sheet.py.")
(out / "rig.json").write_text(json.dumps(meta, indent=2))
print(f"cut {len(poses)} whole figures from {', '.join(sheets)}: sheet heights {heights}, scale x{factor:.4f}, placed heights {[r['placedHeight'] for r in record]}, torso shifts {[r['torsoShift'] for r in record]}, soles {[r['soleRow'] for r in record]}")
