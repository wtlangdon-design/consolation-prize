"""Main Street's walk boxes, drawn over the room. Errata 28a item 1.

Walk boxes are the one piece of room data that is invisible in the game and
catastrophic when it is wrong: a box that does not follow the painted street
puts the actor through a wall, and nothing in the JSON says so. Ruling 22 step
2 puts the walkable band at graybox for exactly this reason, and this is what
it looks like once the room is composed.

Drawn: every box outlined and labelled, its staging points, and the route the
engine would take across the room -- the same adjacency walk the engine does,
reimplemented here from the same JSON, so a route that looks wrong in the
picture is wrong in the game.
"""

from __future__ import annotations

import json
from collections import deque
from pathlib import Path

from PIL import Image

from canvas import IndexedCanvas
from palette import Palette
from renders import RENDERS

ROOT = Path(__file__).resolve().parents[2]

#: The two ends of the demonstration route: west of the trough, and east of
#: it, at the same depth. There is no straight line between them.
ROUTE = ((60, 112), (300, 112))


def load_room(room_id: str) -> dict:
    manifest = json.loads((ROOT / "content" / "manifest.json").read_text(encoding="utf-8"))
    for relative in manifest["rooms"]:
        data = json.loads((ROOT / relative).read_text(encoding="utf-8"))
        if data["id"] == room_id:
            return data
    raise KeyError(room_id)


def inside(box: dict, x: float, y: float) -> bool:
    positive = negative = False
    points = box["points"]
    for index in range(len(points)):
        a, b = points[index], points[(index + 1) % len(points)]
        cross = (b["x"] - a["x"]) * (y - a["y"]) - (b["y"] - a["y"]) * (x - a["x"])
        positive |= cross > 0
        negative |= cross < 0
        if positive and negative:
            return False
    return True


def box_at(boxes: list[dict], x: float, y: float) -> dict | None:
    return next((box for box in boxes if inside(box, x, y)), None)


def bounds(box: dict) -> tuple[float, float, float, float]:
    xs = [point["x"] for point in box["points"]]
    ys = [point["y"] for point in box["points"]]
    return min(xs), max(xs), min(ys), max(ys)


def route(boxes: list[dict], start: tuple[int, int], end: tuple[int, int]) -> list[tuple[float, float]]:
    """The same breadth-first walk the engine does, over the same adjacency."""
    by_id = {box["id"]: box for box in boxes}
    first, last = box_at(boxes, *start), box_at(boxes, *end)
    if not first or not last:
        return []
    came: dict[str, str] = {}
    queue = deque([first["id"]])
    seen = {first["id"]}
    while queue:
        current = queue.popleft()
        if current == last["id"]:
            break
        for neighbour in by_id[current]["neighbours"]:
            if neighbour in seen:
                continue
            seen.add(neighbour)
            came[neighbour] = current
            queue.append(neighbour)
    chain = [last["id"]]
    while chain[0] != first["id"]:
        chain.insert(0, came[chain[0]])

    points = [(float(start[0]), float(start[1]))]
    for index in range(len(chain) - 1):
        one, two = bounds(by_id[chain[index]]), bounds(by_id[chain[index + 1]])
        left, right = max(one[0], two[0]), min(one[1], two[1])
        top, bottom = max(one[2], two[2]), min(one[3], two[3])
        points.append((
            max(min(left, right), min(max(left, right), end[0])),
            max(min(top, bottom), min(max(top, bottom), end[1])),
        ))
    points.append((float(end[0]), float(end[1])))
    return points


def canvas_source(pixels, width: int, x: int, y: int) -> int:
    return pixels[y * width + x]


def main() -> None:
    palette = Palette.load()
    room = load_room("main_street")
    boxes = room["walkBoxes"]

    image = Image.open(ROOT / room["background"])
    canvas = IndexedCanvas(image.width, image.height)
    pixels = list(image.getdata())
    for y in range(image.height):
        for x in range(image.width):
            canvas.put(x, y, pixels[y * image.width + x])

    edge = palette.family("accent_teal")
    fixed = palette.family("accent_gold")
    mark = palette.family("accent_red")
    path = palette.family("bone")

    for box in boxes:
        ramp = fixed if box["scaleMode"]["kind"] == "fixed" else edge
        points = box["points"]
        for index in range(len(points)):
            a, b = points[index], points[(index + 1) % len(points)]
            canvas.line(a["x"], a["y"], b["x"], b["y"], ramp.frac(0.88))

    for target in room["hotspots"] + room["exits"]:
        staging = target.get("walkTo")
        if not staging:
            continue
        x, y = staging["x"], staging["y"]
        canvas.rect(x - 1, y - 1, 3, 3, mark.frac(0.90))

    legs = route(boxes, *ROUTE)
    for index in range(len(legs) - 1):
        (x0, y0), (x1, y1) = legs[index], legs[index + 1]
        canvas.line(round(x0), round(y0), round(x1), round(y1), path.frac(0.96))
    for x, y in legs:
        canvas.rect(round(x) - 1, round(y) - 1, 3, 3, path.frac(0.60))

    # A second picture: the two z-planes, tinted, over the room. Doc 22
    # section 5's masks are invisible in play by design -- they only decide
    # which pixels of the background win against a figure -- so this is the
    # only way to look at them.
    planes = IndexedCanvas(image.width, image.height)
    for y in range(image.height):
        for x in range(image.width):
            planes.put(x, y, palette.darken(canvas_source(pixels, image.width, x, y), 3))
    tints = {1: palette.family("accent_red"), 2: palette.family("accent_teal")}
    for plane in room["occlusionPlanes"]:
        mask = Image.open(ROOT / plane["mask"]).convert("RGBA")
        cells = mask.load()
        for y in range(mask.height):
            for x in range(mask.width):
                if cells[x, y][3] > 0:
                    planes.put(x, y, tints[plane["level"]].frac(0.30 + 0.30 * plane["level"]))
    planes.save(RENDERS / "room-02-occlusion-planes.png", palette)
    planes.save(RENDERS / "room-02-occlusion-planes@4x.png", palette, scale=4)

    canvas.save(RENDERS / "room-02-walk-boxes.png", palette)
    canvas.save(RENDERS / "room-02-walk-boxes@4x.png", palette, scale=4)
    print("wrote renders/room-02-walk-boxes.png and @4x.png")
    print("wrote renders/room-02-occlusion-planes.png and @4x.png")
    for plane in room["occlusionPlanes"]:
        boxes_at = [b["id"] for b in boxes if b["clipPlane"] == plane["level"]]
        print(f"  plane {plane['level']}: {', '.join(boxes_at) or 'no box uses it'}")
    for box in boxes:
        mode = box["scaleMode"]
        described = (f"fixed {mode['height']}" if mode["kind"] == "fixed"
                     else f"curve {mode['farHeight']}->{mode['nearHeight']}")
        print(f"  {box['id']:<15}clip {box['clipPlane']}  {described:<18}"
              f"-> {', '.join(box['neighbours'])}")
    print(f"  route {ROUTE[0]} to {ROUTE[1]}: "
          + " -> ".join(f"({round(x)},{round(y)})" for x, y in legs))
    crossed = [box_at(boxes, x, y)["id"] for x, y in legs if box_at(boxes, x, y)]
    print(f"  boxes crossed: {' -> '.join(dict.fromkeys(crossed))}")


if __name__ == "__main__":
    main()
