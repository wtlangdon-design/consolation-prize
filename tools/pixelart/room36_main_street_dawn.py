"""Room 36 -- Main Street, dawn. The closing screen.

Same street, same seed, same every plank. Only the light changes, and one
thing in the world: somebody has taken the gilt lettering down off the
Improvement Company in the night, leaving the paint underneath unfaded.
"""

from __future__ import annotations

from pathlib import Path

from street_scene import DAWN, HEIGHT, WIDTH, compose

ROOT = Path(__file__).resolve().parents[2]


def main() -> None:
    canvas, palette = compose(DAWN)
    native = ROOT / "art" / "backgrounds" / "room-36-main-street-dawn.png"
    preview = ROOT / "art" / "backgrounds" / "preview" / "room-36-main-street-dawn@4x.png"
    canvas.save(native, palette)
    canvas.save(preview, palette, scale=4)
    print(f"wrote {native.relative_to(ROOT)}  ({WIDTH}x{HEIGHT})")
    print(f"wrote {preview.relative_to(ROOT)}  ({WIDTH * 4}x{HEIGHT * 4})")
    print(f"colours used: {len(canvas.used_indices())} of 256")


if __name__ == "__main__":
    main()
