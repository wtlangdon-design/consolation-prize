"""The title screen: Room 29 with a drawn title over it.

The title is NOT the 5x7 game font. That font exists to fit three lines of
Thad into a 320px frame and it is built for density, not for presence -- set
CONSOLATION PRIZE in it and you get a caption. So the letters here are drawn
at 11 rows with a heavier stem, still strictly on the pixel grid and still
drawn only from the locked palette.

The letterforms are a slab: flat serifs, even weight, no curves that need
more than one step. That is a period-plausible display face and, more
usefully, it is a shape that survives being one colour on a busy landscape.

MUSIC: there is none. The score does not exist yet, and errata invariant 5
makes the score's detuning the emotional arc of the whole game -- so a
placeholder here would be actively misleading rather than merely absent.
`MUSIC_CUE` below is the hook and the gap is noted in the render output.
"""

from __future__ import annotations

import json
from pathlib import Path

import room29_ridge
from canvas import IndexedCanvas
from palette import Palette, Ramp
from renders import RENDERS

ROOT = Path(__file__).resolve().parents[2]

#: The one thing the title screen will eventually ask the audio layer for.
#: Nothing plays it. Doc 06 will own the cue list when the score exists.
MUSIC_CUE = "title.theme"

TITLE_TOP = 22
#: Menu down the left, not centred. Centred, it landed squarely on the town
#: -- and the town is the picture. Title top-centre, menu lower-left, town
#: centre-right is a composition rather than three things stacked.
MENU_LEFT = 20
MENU_TOP = 94
MENU_ROW = 13

#: 11-row slab letterforms. Wider than the game font and heavier in the
#: stem, so the title has presence at 320px instead of reading as a caption.
GLYPHS: dict[str, list[str]] = {
    "C": ["████████", "████████", "██░░░░██", "██░░░░░░", "██░░░░░░", "██░░░░░░",
          "██░░░░░░", "██░░░░██", "████████", "████████", "░░░░░░░░"],
    "O": ["████████", "████████", "██░░░░██", "██░░░░██", "██░░░░██", "██░░░░██",
          "██░░░░██", "██░░░░██", "████████", "████████", "░░░░░░░░"],
    "N": ["██░░░░██", "███░░░██", "████░░██", "██░██░██", "██░░████", "██░░░███",
          "██░░░░██", "██░░░░██", "██░░░░██", "██░░░░██", "░░░░░░░░"],
    "S": ["████████", "████████", "██░░░░░░", "██░░░░░░", "████████", "████████",
          "░░░░░░██", "░░░░░░██", "████████", "████████", "░░░░░░░░"],
    "L": ["██░░░░░░", "██░░░░░░", "██░░░░░░", "██░░░░░░", "██░░░░░░", "██░░░░░░",
          "██░░░░░░", "██░░░░░░", "████████", "████████", "░░░░░░░░"],
    "A": ["████████", "████████", "██░░░░██", "██░░░░██", "████████", "████████",
          "██░░░░██", "██░░░░██", "██░░░░██", "██░░░░██", "░░░░░░░░"],
    "T": ["████████", "████████", "░░░██░░░", "░░░██░░░", "░░░██░░░", "░░░██░░░",
          "░░░██░░░", "░░░██░░░", "░░░██░░░", "░░░██░░░", "░░░░░░░░"],
    "I": ["████████", "████████", "░░░██░░░", "░░░██░░░", "░░░██░░░", "░░░██░░░",
          "░░░██░░░", "░░░██░░░", "████████", "████████", "░░░░░░░░"],
    "P": ["████████", "████████", "██░░░░██", "██░░░░██", "████████", "████████",
          "██░░░░░░", "██░░░░░░", "██░░░░░░", "██░░░░░░", "░░░░░░░░"],
    "R": ["████████", "████████", "██░░░░██", "██░░░░██", "██████░░", "██████░░",
          "██░░██░░", "██░░░███", "██░░░░██", "██░░░░██", "░░░░░░░░"],
    "Z": ["████████", "████████", "░░░░░███", "░░░░██░░", "░░░██░░░", "░░██░░░░",
          "░██░░░░░", "██░░░░░░", "████████", "████████", "░░░░░░░░"],
    "E": ["████████", "████████", "██░░░░░░", "██░░░░░░", "██████░░", "██████░░",
          "██░░░░░░", "██░░░░░░", "████████", "████████", "░░░░░░░░"],
    " ": ["░░░░░░░░"] * 11,
}

GLYPH_W, GLYPH_H, TRACK = 8, 11, 1


def measure(text: str) -> int:
    return len(text) * (GLYPH_W + TRACK) - TRACK


def draw_title(
    canvas: IndexedCanvas, text: str, x: int, y: int, face: Ramp, shadow: Ramp,
) -> None:
    """Slab letters with a hard drop shadow and a lit top edge.

    The shadow is not decoration: the title sits over a landscape whose
    luminance varies from 30 to 190 across its width, and a single-colour
    title would disappear somewhere along it. A dark offset copy guarantees
    an edge everywhere regardless of what is behind.
    """
    for offset, ramp, step in ((2, shadow, 0.04), (0, face, 0.86)):
        cursor = x
        for character in text:
            glyph = GLYPHS.get(character, GLYPHS[" "])
            for row, bits in enumerate(glyph):
                for column, mark in enumerate(bits):
                    if mark != "█":
                        continue
                    canvas.put(cursor + column + offset, y + row + offset, ramp.frac(step))
            cursor += GLYPH_W + TRACK
    # Lit top edge on the face only, so the slab has a light source.
    cursor = x
    for character in text:
        glyph = GLYPHS.get(character, GLYPHS[" "])
        for column, mark in enumerate(glyph[0]):
            if mark == "█":
                canvas.put(cursor + column, y, face.frac(0.98))
        cursor += GLYPH_W + TRACK


#: The real 5x7 game font, read from the same JSON the engine reads. The
#: preview draws the menu with the actual glyphs rather than placeholder
#: blocks -- a render whose text is fake is a render you cannot judge.
#: Path comes from the manifest, so the preview cannot drift onto a
#: different font from the one the engine loads.
_MANIFEST = json.loads((ROOT / "content" / "manifest.json").read_text(encoding="utf-8"))
_FONT = json.loads((ROOT / _MANIFEST["font"]).read_text(encoding="utf-8"))


def _game_font(canvas: IndexedCanvas, text: str, x: int, y: int, ramp: Ramp, tone: float) -> int:
    glyphs = _FONT["glyphs"]
    # Per-glyph advance overrides, with a font-wide default. Same two fields
    # BitmapFont reads, so the preview spaces text exactly as the game does.
    per_glyph = _FONT.get("advances", {})
    default = _FONT.get("advance", 6)
    cursor = x
    for character in text:
        if character == " ":
            cursor += _FONT.get("spaceAdvance", default)
            continue
        rows = glyphs.get(character) or glyphs.get(character.upper())
        if rows is None:
            cursor += default
            continue
        for row, bits in enumerate(rows):
            for column, mark in enumerate(bits):
                if mark == "#":
                    canvas.put(cursor + column, y + row, ramp.frac(tone))
        cursor += per_glyph.get(character, default)
    return cursor - x



def compose(has_save: bool = False) -> tuple[IndexedCanvas, Palette, dict]:
    canvas, palette = room29_ridge.compose()
    menu = json.loads((ROOT / "content" / "ui" / "title.json").read_text(encoding="utf-8"))

    bone = palette.family("bone")
    umber = palette.family("umber")
    grey = palette.family("grey")

    # A band behind the title, one step down from whatever it covers, so the
    # letters never have to fight the sky's dither.
    for y in range(TITLE_TOP - 5, TITLE_TOP + GLYPH_H * 2 + 8):
        for x in range(canvas.width):
            canvas.put(x, y, palette.darken(canvas.get(x, y), 2))

    for index, line in enumerate(menu["title"]["lines"]):
        width = measure(line)
        draw_title(canvas, line, (canvas.width - width) // 2,
                   TITLE_TOP + index * (GLYPH_H + 3), bone, umber)

    hitboxes = []
    for index, item in enumerate(menu["menu"]["items"]):
        y = MENU_TOP + index * MENU_ROW
        enabled = item["id"] != "continue" or has_save
        label = item["label"]
        width = len(label) * (_FONT.get("advance", 6)) + 10
        # A darkened plate behind each row, so the labels read over whatever
        # part of the hillside they happen to fall on.
        for offset_y in range(-3, MENU_ROW - 3):
            for x in range(MENU_LEFT - 5, MENU_LEFT + width):
                canvas.put(x, y + offset_y, palette.darken(canvas.get(x, y + offset_y), 3))
        hitboxes.append({"id": item["id"], "label": label,
                         "rect": [MENU_LEFT - 5, y - 3, width + 5, MENU_ROW],
                         "enabled": enabled})
        # CONTINUE is drawn dim, not omitted: a title menu that changes
        # length depending on whether you have played before is worse than
        # one with a dead row in it.
        _game_font(canvas, label, MENU_LEFT, y, bone if enabled else grey,
                   0.92 if enabled else 0.44)

    return canvas, palette, {"items": hitboxes, "music": MUSIC_CUE}


def main() -> None:
    canvas, palette, meta = compose(has_save=False)
    RENDERS.mkdir(parents=True, exist_ok=True)
    canvas.save(RENDERS / "title-screen.png", palette)
    canvas.save(RENDERS / "title-screen@4x.png", palette, scale=4)
    print("wrote renders/title-screen@4x.png")
    print(f"colours used: {len(canvas.used_indices())}")
    print(f"menu items: {', '.join(item['label'] for item in meta['items'])}")
    print(f"MUSIC: none. Cue hook is '{meta['music']}' and nothing plays it --")
    print("  the score does not exist, and invariant 5 makes its detuning the")
    print("  emotional arc of the game, so a placeholder would mislead.")


if __name__ == "__main__":
    main()
