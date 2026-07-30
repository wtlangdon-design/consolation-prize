"""Ships Room 3's background into art/backgrounds, where the engine reads it.

Same shape as room02_main_street.py. Separate from room03_nugget.py so the
composition module stays importable by the proof and the audit without
writing shipping assets as a side effect.
"""

from __future__ import annotations

from pathlib import Path

import room03_nugget
from palette import Palette

ROOT = Path(__file__).resolve().parents[2]


def main() -> None:
    canvas, palette, _ = room03_nugget.compose()
    native = ROOT / "art" / "backgrounds" / "room-03-nugget.png"
    preview = ROOT / "art" / "backgrounds" / "preview" / "room-03-nugget@4x.png"
    canvas.save(native, palette)
    canvas.save(preview, palette, scale=4)
    print(f"wrote {native.relative_to(ROOT)} ({canvas.width}x{canvas.height})")
    print(f"wrote {preview.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
