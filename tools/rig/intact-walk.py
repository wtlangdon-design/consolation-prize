#!/usr/bin/env python3
"""A profile walk with an INTACT upper body: the standing still above the hem,
byte for byte, and only the legs animating beneath it.

    python3 tools/rig/intact-walk.py --stand art/actors/thad-stand-right/stand-00.png \\
        --legs <legs-only frames at the stand's scale> --legs-rig <their source rig.json> \\
        --factor 0.5365 --hem 434 --hip 311 --out art/actors/thad-walk-right

TYLER'S RULING (2026-09-05), after four cuts of puppet-style arm articulation
that each showed a seam somewhere: the profile upper body, coat, shoulders
and arms stay ONE authored silhouette while walking. No arm is cut, rotated
or layered. So the walk is the approved standing frame down to the coat's
lowest hem row -- head, hair, face, shoulders, coat, sleeves, hands, exactly
the pixels the game already draws when he stands -- set over the two legs
that character.py --legs-only levelled, swung and grounded from the stride
source, shifted so their hip column sits under the coat's centre and their
soles on the stand's ground row. The coat hides the legs' upper ends, as it
hides them on every other clip. The upper body drops by the frame's ground
shift so the whole man bobs a few pixels at double support rather than the
legs alone; nothing else about him moves.

The legs are colour-matched to the stand's own trousers by one per-channel
gain, so two generations of the same trousers read as one pair.
"""
import argparse, hashlib, json
from pathlib import Path
import numpy as np
from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument("--stand", required=True); ap.add_argument("--legs", required=True); ap.add_argument("--legs-rig", required=True)
ap.add_argument("--factor", type=float, required=True, help="the scale the legs were reduced by (source -> stand scale)")
ap.add_argument("--hem", type=int, required=True, help="the stand frame's lowest coat-hem row; everything above it is the upper body")
ap.add_argument("--hip", type=int, required=True, help="the stand frame's hip column (the coat's centre at the hem)")
ap.add_argument("--out", required=True)
ap.add_argument("--no-bob", action="store_true", help="hold the upper body still instead of dropping it with the ground shift")
args = ap.parse_args()

stand = np.array(Image.open(args.stand).convert("RGBA")).astype(float)
H, W = stand.shape[:2]
rig = json.loads(Path(args.legs_rig).read_text())
hip_legs = rig["hip_column"] * args.factor
shifts = [int(round(g * args.factor)) for g in rig["ground_shifts"]]
dx = int(round(args.hip - hip_legs))

# the upper body: the stand above and including the hem row, nothing below it
upper = stand.copy(); upper[args.hem + 1:] = 0

# colour match: the stand's trousers against the legs' trousers, one gain per channel
def trouser_mean(img, y0, y1):
    m = img[y0:y1, :, 3] > 128
    return img[y0:y1, :, :3][m].mean(0)
files = sorted(Path(args.legs).glob("walk-*.png"))
legs0 = np.array(Image.open(files[0]).convert("RGBA")).astype(float)
gain = np.ones(3)

out = Path(args.out); out.mkdir(parents=True, exist_ok=True)
for old in out.glob("*.png"):
    old.unlink()
hashes = {}
for i, f in enumerate(files):
    legs = np.array(Image.open(f).convert("RGBA")).astype(float)
    # THE STRIDE'S OWN COAT AND ITS SHADOW COME OFF THE THIGHS, SHAPE KEPT.
    # The stride source's coat hangs lower on its legs than the stand's does
    # (74% of height against 69%), so the leg segment the rig cut carries the
    # bottom of that coat and the dark band it cast: a pale patch, then a
    # black one, under the stand's hem. Repeating clean rows upward instead
    # gave straight stubs where the thighs should slant. So the thighs keep
    # their pixels and shapes and only their COLOUR changes: every pixel
    # above the first clean trouser row takes the colour of the nearest clean
    # trouser pixel below it in its own column.
    vis = legs[..., 3] > 128
    lum = lambda y: (legs[y, :, :3][legs[y, :, 3] > 128].mean() if (legs[y, :, 3] > 128).any() else 0.0)
    ref = np.mean([lum(y) for y in range(args.hem + 60, args.hem + 120)])
    fallback = trouser_mean(legs, args.hem + 60, args.hem + 120)
    r, g, b = legs[..., 0], legs[..., 1], legs[..., 2]
    l = (r + g + b) / 3
    # a trouser pixel: not the coat's blue-grey, not the coat's cast shadow
    trouserlike = (legs[..., 3] > 128) & ~((b - r > 8) & (l > 44)) & (l >= 0.7 * ref) & (l <= 1.3 * ref)
    trouserlike[args.hem + 130:] = True
    # ONE TONE PER COLUMN, SMOOTHED ACROSS COLUMNS. Taking each column's
    # first clean pixel painted the thighs in vertical streaks. Each column's
    # tone is the mean of its first dozen clean trouser rows, then blended
    # over its neighbours, so the recoloured thighs read as cloth.
    Wc = legs.shape[1]
    first_row = np.full(Wc, -1); tone = np.zeros((Wc, 3)); has = np.zeros(Wc, bool)
    for x in range(Wc):
        clean = np.nonzero(trouserlike[:, x])[0]
        if len(clean):
            first_row[x] = int(clean[0]); tone[x] = legs[clean[:12], x, :3].mean(0); has[x] = True
    sm = tone.copy()
    for x in range(Wc):
        lo, hi = max(0, x - 4), min(Wc, x + 5)
        if has[lo:hi].any():
            sm[x] = tone[lo:hi][has[lo:hi]].mean(0)
    for x in range(Wc):
        col_a = legs[:, x, 3] > 0
        if not col_a[:args.hem + 130].any():
            continue
        first = first_row[x] if has[x] else args.hem + 130
        colour = sm[x] if has[lo:hi].any() or has[x] else fallback
        if not has[x]:
            lo, hi = max(0, x - 4), min(Wc, x + 5)
            colour = sm[lo:hi][has[lo:hi]].mean(0) if has[lo:hi].any() else fallback
        rows_ = np.nonzero(col_a[:first])[0]
        legs[rows_, x, :3] = colour
        bad = np.nonzero(col_a[first:args.hem + 130] & ~trouserlike[first:args.hem + 130, x])[0]
        if len(bad):
            legs[first + bad, x, :3] = colour
    g_now = trouser_mean(stand, args.hem + 30, args.hem + 130) / np.maximum(trouser_mean(legs, args.hem + 30, args.hem + 130), 1e-6)
    legs[..., :3] = np.clip(legs[..., :3] * g_now, 0, 255)
    gain = g_now
    canvas = np.zeros((H, W, 4))
    # place the legs: soles already on the ground row (both figures end at row H-padding), hips under the coat's centre
    # ALIGN THE SOLES, NOT THE CANVAS BOTTOMS: the two canvases carry
    # different padding below the feet (the legs' 17 rows, the stand's 65),
    # and aligning bottoms put the legs 48 px too low.
    lh, lw = legs.shape[:2]
    sole_legs = int(np.nonzero((legs[..., 3] > 128).any(1))[0].max())
    sole_stand = int(np.nonzero((stand[..., 3] > 128).any(1))[0].max())
    x0 = dx; y0 = sole_stand - sole_legs
    sx0, sx1 = max(0, -x0), min(lw, W - x0)
    sy0, sy1 = max(0, -y0), min(lh, H - y0)
    canvas[y0 + sy0:y0 + sy1, x0 + sx0:x0 + sx1] = legs[sy0:sy1, sx0:sx1]
    body = upper if args.no_bob else np.roll(upper, shifts[i], axis=0) if shifts[i] > 0 else upper
    if not args.no_bob and shifts[i] > 0:
        body = body.copy(); body[:shifts[i]] = 0
    at = body[..., 3:] / 255.0
    frame = np.dstack([body[..., :3] * at + canvas[..., :3] * (1 - at), np.maximum(body[..., 3], canvas[..., 3])])
    Image.fromarray(np.clip(frame, 0, 255).astype(np.uint8)).save(out / f"walk-{i:02d}.png")
    hashes[f.name] = hashlib.sha256(f.read_bytes()).hexdigest()

sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
fig_w = int(np.nonzero((stand[..., 3] > 128).any(0))[0].max() - np.nonzero((stand[..., 3] > 128).any(0))[0].min() + 1)
pad = int(np.nonzero((stand[..., 3] > 128).any(0))[0].min())
meta = dict(
    method="intact-upper-body", source=args.stand, key="magenta", clip="walk", view="profile", facing="right", walk_dx=1,
    figure=[fig_w, int(np.nonzero((stand[..., 3] > 128).any(1))[0].max()) + 1], hem_row=args.hem, padding=pad, hip_column=args.hip,
    upper_body={"path": args.stand, "sha256": sha(args.stand), "rowsUsed": f"0..{args.hem}", "note": "the approved standing frame's pixels, unchanged"},
    legs={"dir": args.legs, "frames": hashes, "sourceRig": args.legs_rig, "sourceRigSha256": sha(args.legs_rig), "invocation": rig.get("invocation"),
          "scale": args.factor, "hipColumnShift": dx, "colourGain": [round(float(g), 3) for g in gain]},
    ground_shifts=shifts, bob=("none" if args.no_bob else "upper body drops with the legs' ground shift"),
    frames=len(files),
    ruling="Tyler, 2026-09-05: the profile upper body, coat, shoulders and arms remain one intact authored silhouette while walking; no arm is cut, rotated or layered. tools/rig/intact-walk.py.")
(out / "rig.json").write_text(json.dumps(meta, indent=2))
print(f"intact walk: {len(files)} frames -> {out}; upper body rows 0..{args.hem} of {args.stand}; legs shifted {dx:+d} px to hip {args.hip}; gain {np.round(gain, 3).tolist()}; bob {shifts}")
