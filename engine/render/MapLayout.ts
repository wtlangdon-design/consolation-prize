/**
 * THE TOWN MAP'S LABELS AND WHAT A CLICK ON THEM MEANS, as plain arithmetic.
 *
 * Kept out of the Renderer so a test can run it without a canvas: the label
 * boxes are wide at the play area's type scale and in town they overlap, and
 * whether a place can be clicked is a property of this arithmetic, not of a
 * picture. Found building Room 7: the undertaker's label ran across the
 * registrar's marker, the first box under the click won, and the registrar --
 * whose only way in is the map -- could not be reached.
 */
import type { MapLocation } from '../core/types.ts';

export interface MapRect { x: number; y: number; width: number; height: number }
export interface MapBox {
  location: MapLocation;
  label: string;
  built: boolean;
  labelX: number;
  rect: MapRect;
}

/** Where each location's marker and label go (the Renderer draws these). */
export function mapLayout(
  places: { location: MapLocation; label: string; built: boolean }[],
  measure: (text: string) => number,
  dims: { marker: number; labelHeight: number; glyph: number; width: number },
): MapBox[] {
  return places.map(({ location, label, built }) => {
    const [x, y] = location.at;
    const width = measure(label);
    // A label near the right edge is drawn to the LEFT of its marker instead of
    // running off the screen.
    const fits = x + dims.marker + dims.glyph * 2 + width <= dims.width - dims.glyph * 2;
    const labelX = fits ? x + dims.marker + dims.glyph * 2 : x - dims.glyph * 2 - width;
    const left = Math.min(x, labelX);
    const right = Math.max(x + dims.marker, labelX + width);
    return {
      location, label, built, labelX,
      rect: { x: left - dims.glyph, y: y - dims.glyph * 2, width: (right - left) + dims.glyph * 2, height: dims.labelHeight },
    };
  });
}

/**
 * THE PLACE A CLICK MEANS. Of the boxes under the point, a place that can be
 * travelled to wins over one that cannot, and then the one whose marker is
 * nearest: a click on a marker is always that marker's place.
 */
export function mapPlaceAt(boxes: MapBox[], x: number, y: number): MapBox | undefined {
  const under = boxes.filter(({ rect }) => x >= rect.x && x < rect.x + rect.width
    && y >= rect.y && y < rect.y + rect.height);
  const distance = (box: MapBox) => (box.location.at[0] - x) ** 2 + (box.location.at[1] - y) ** 2;
  return under.sort((a, b) => Number(b.built) - Number(a.built) || distance(a) - distance(b))[0];
}
