"""Put the CURRENT stand back on a chore's first and last frames.

    python3 tools/rig/reseat_chore.py thad-shrug-right [...]
    python3 tools/rig/reseat_chore.py --all-returning

DOC 40'S CHORE CONTRACT, IN THE CLIPS' OWN WORDS: "Frame 0 and frame 4 ARE the
stand frame, byte for byte, so the chore cannot pop on either end." Seven clips
say that in their rig.json and not one of them was still true: `9c84012`
replaced `thad-stand-right` -- it had been built from a striding source, feet
spanning 40% of figure height where the new one spans 17% -- and every chore
went on opening and closing on the old pose. Every chore in the game cut to a
different man for one frame on the way in and again on the way out.

THIS IS NOT A RE-RIG AND DELIBERATELY CANNOT BECOME ONE. The key poses in
frames 1-3 come from separate art in `reference/casting/` and no rig.json
records which; rebuilding those needs knowledge nobody wrote down. Frames 0 and
4 need none of it, because the contract says exactly what they are. So this
touches only those two, from art that already ships, and leaves the middle
alone.

THE CANVASES DIFFER AND THAT IS THE WHOLE OF THE WORK. A chore is 526px of
figure on a 390x547 canvas at padding 85; the stand is 625px on 648x690 at
padding 260. Both draw at the same height in the game -- those are source
resolutions, not sizes. So the stand is resampled to the chore's figure height
and seated on the chore's anchor: soles on the sole row, centre line on the
centre line. That is the same projection the renderer does, done once, offline.

A CUT FROM THE STAND TO THE KEY POSE IS THE DESIGN, not a defect this
introduces. The rigs say so in the next sentence: "No in-betweens: a
rigid-segment rig cannot interpolate between two different drawings." What was
wrong was a cut to a stand nobody stands in any more.
"""
import argparse
import json
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
ACTORS = ROOT / "art/actors"


def load_rig(name):
    return json.loads((ACTORS / name / "rig.json").read_text())


def frames_of(name):
    return sorted(p for p in (ACTORS / name).iterdir() if p.suffix == ".png")


def seat(stand_dir, chore_rig, canvas):
    """The stand, resampled and placed on the chore's canvas at its anchor."""
    stand_rig = load_rig(stand_dir)
    source = Image.open(frames_of(stand_dir)[0]).convert("RGBA")
    fig_w, fig_h = stand_rig["figure"]
    scale = chore_rig["figure"][1] / fig_h
    # PREMULTIPLY BEFORE RESAMPLING (R4). The keyed source keeps whatever colour
    # sat under alpha 0, and a straight RGBA resize drags it inward along every
    # hard edge -- which is what put a magenta fringe on a coat and skin tone on
    # a collar. Multiply, resample, divide back.
    src = np.asarray(source).astype(float)
    alpha = src[..., 3:] / 255.0
    pm = Image.fromarray((src[..., :3] * alpha).astype(np.uint8))
    am = Image.fromarray(src[..., 3].astype(np.uint8))
    size = (max(1, round(source.width * scale)), max(1, round(source.height * scale)))
    pm = np.asarray(pm.resize(size, Image.LANCZOS)).astype(float)
    am = np.asarray(am.resize(size, Image.LANCZOS)).astype(float)
    out = np.zeros((size[1], size[0], 4), float)
    lit = am > 2
    out[..., :3][lit] = np.clip(pm[lit] / (am[lit][:, None] / 255.0), 0, 255)
    out[..., 3] = am
    scaled = Image.fromarray(out.astype(np.uint8))

    # THE ANCHOR IS THE SEAT. Both records place the soles at `figure height`
    # rows down and the centre line at `padding + width/2` columns across, so
    # aligning the two anchors puts him on the same ground on the same axis.
    stand_anchor = (stand_rig["padding"] + round(fig_w / 2), fig_h)
    chore_anchor = (chore_rig["padding"] + round(chore_rig["figure"][0] / 2),
                    chore_rig["figure"][1])
    left = chore_anchor[0] - round(stand_anchor[0] * scale)
    top = chore_anchor[1] - round(stand_anchor[1] * scale)
    seated = Image.new("RGBA", canvas, (0, 0, 0, 0))
    seated.alpha_composite(scaled, (left, top))
    return seated


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("clips", nargs="*")
    ap.add_argument("--all-returning", action="store_true",
                    help="every clip whose rig declares returns_to")
    ap.add_argument("--dry", action="store_true")
    args = ap.parse_args()

    names = list(args.clips)
    if args.all_returning:
        for path in sorted(ACTORS.iterdir()):
            rig = path / "rig.json"
            if rig.is_file() and json.loads(rig.read_text()).get("returns_to"):
                names.append(path.name)
    if not names:
        raise SystemExit("name a clip, or pass --all-returning")

    for name in sorted(set(names)):
        rig = load_rig(name)
        returns = rig.get("returns_to")
        if not returns:
            raise SystemExit(f"{name}: rig.json declares no returns_to, so there is no "
                             "clip to seat it on. Declare one or leave it alone.")
        # The clip it returns to, in the same facing. Named from the data rather
        # than guessed: `returns_to` says WHICH clip, and the facing is this
        # clip's own -- a chore returns to the stand it is standing in.
        facing = rig["facing"]
        stand_dir = f"{name.split('-')[0]}-{returns}-{facing}"
        if not (ACTORS / stand_dir).is_dir():
            raise SystemExit(f"{name}: returns_to '{returns}' names {stand_dir}, "
                             "which does not exist")
        frames = frames_of(name)
        if len(frames) < 2:
            raise SystemExit(f"{name}: {len(frames)} frame(s); a chore needs a first "
                             "and a last to return on")
        canvas = Image.open(frames[0]).size
        seated = seat(stand_dir, rig, canvas)
        before = [frames[0].read_bytes(), frames[-1].read_bytes()]
        if args.dry:
            print(f"{name}: would seat {stand_dir} on frames "
                  f"{frames[0].name} and {frames[-1].name}")
            continue
        for path in (frames[0], frames[-1]):
            seated.save(path)
        after = frames[0].read_bytes()
        same = after == frames[-1].read_bytes()
        moved = sum(1 for b in before if b != after)
        print(f"{name}: seated {stand_dir} on {frames[0].name} and {frames[-1].name} "
              f"({moved} of 2 changed, ends identical: {same})")


if __name__ == "__main__":
    main()
