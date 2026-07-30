"""Room 2 -- Main Street, day."""

from __future__ import annotations

from pathlib import Path

from street_scene import DAY, HEIGHT, WIDTH, compose

ROOT = Path(__file__).resolve().parents[2]


def main() -> None:
    canvas, palette = compose(DAY)
    native = ROOT / "art" / "backgrounds" / "room-02-main-street.png"
    preview = ROOT / "art" / "backgrounds" / "preview" / "room-02-main-street@4x.png"
    canvas.save(native, palette)
    canvas.save(preview, palette, scale=4)
    print(f"wrote {native.relative_to(ROOT)}  ({WIDTH}x{HEIGHT})")
    print(f"wrote {preview.relative_to(ROOT)}  ({WIDTH * 4}x{HEIGHT * 4})")
    print(f"colours used: {len(canvas.used_indices())} of 256")


if __name__ == "__main__":
    main()
