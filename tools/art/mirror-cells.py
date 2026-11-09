#!/usr/bin/env python3
"""Mirror every cell of a sprite sheet left-to-right, in place, so the frame rectangles stay valid.

A figure reused in another room has to face what it watches there (docs/55 section 8). Mirroring each cell about its
own centre keeps the cell's centre, and so the figure's registration, where it was.

  python3 tools/art/mirror-cells.py SOURCE.png OUT.png X,Y,W,H [X,Y,W,H ...]
"""
import sys
from PIL import Image, ImageOps

src, out, *cells = sys.argv[1:]
if not cells:
    sys.exit('mirror-cells: name at least one cell as X,Y,W,H')
sheet = Image.open(src).convert('RGBA')
result = sheet.copy()
for cell in cells:
    x, y, w, h = (int(v) for v in cell.split(','))
    result.paste(ImageOps.mirror(sheet.crop((x, y, x + w, y + h))), (x, y))
result.save(out)
print(f'{out}: {len(cells)} cell(s) mirrored from {src}')
