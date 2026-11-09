"""THE PLAYTHROUGH'S CONTACT SHEETS, one per act.

    python3 tools/gauntlet/playthrough-sheets.py <run.json> <out dir>

Reads the frames `npm run gauntlet:full -- --record <dir>` listed in its
run.json (`frames`: file, name, room, act) and writes `act-N.webp` to the out
dir: every frame COMPLETE, downscaled to a quarter (480x270) and never
cropped (CLAUDE.md, Renders), labelled with its order, step and room, in play
order. The raw frames stay out of git; these sheets are what is kept.
"""
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

SCALE = 4
COLS = 4
PAD = 8
LABEL = 20


def font():
    for path in ('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
                 '/usr/share/fonts/dejavu/DejaVuSans.ttf'):
        if Path(path).exists():
            return ImageFont.truetype(path, 13)
    return ImageFont.load_default()


def main():
    run = json.loads(Path(sys.argv[1]).read_text())
    out = Path(sys.argv[2])
    out.mkdir(parents=True, exist_ok=True)
    acts = {}
    act = 1
    for index, frame in enumerate(run.get('frames', []), start=1):
        # The act a frame was taken in; the opening's frames come before ACT is written.
        if frame.get('act'):
            act = frame['act']
        acts.setdefault(act, []).append((index, frame))
    face = font()
    for act, frames in sorted(acts.items()):
        first = Image.open(frames[0][1]['file'])
        cw, ch = first.width // SCALE, first.height // SCALE
        rows = (len(frames) + COLS - 1) // COLS
        sheet = Image.new('RGB', (COLS * cw + (COLS + 1) * PAD, rows * (ch + LABEL) + (rows + 1) * PAD), (20, 20, 26))
        draw = ImageDraw.Draw(sheet)
        for k, (index, frame) in enumerate(frames):
            col, row = k % COLS, k // COLS
            x = PAD + col * (cw + PAD)
            y = PAD + row * (ch + LABEL + PAD)
            draw.text((x, y + 3), f"{index:04d}  {frame['name']}  ·  {frame.get('room') or ''}", fill=(232, 232, 238), font=face)
            with Image.open(frame['file']) as image:
                sheet.paste(image.convert('RGB').resize((cw, ch), Image.LANCZOS), (x, y + LABEL))
        target = out / f'act-{act}.webp'
        sheet.save(target, 'WEBP', quality=72, method=6)
        print(f'{target}  {len(frames)} frames  {target.stat().st_size // 1024} KB')


if __name__ == '__main__':
    main()
