import type { PaletteFile, RoomFile } from '../core/types.ts';
import { mappingAt, resolve, sameMapping, type ResolvedElement } from '../core/PaletteCycling.ts';

/**
 * A composed background whose reserved bands can be rotated at runtime.
 *
 * The pipeline stores indices and colour resolves at export, so by the time
 * a background reaches the browser it is a PNG of RGB and the indices are
 * gone. They are recovered here rather than shipped alongside, because the
 * reservation rule makes the recovery exact: doc 18 note 1 guarantees a
 * reserved index appears nowhere but inside its own element, and the palette
 * check guarantees a reserved index's colour is unique in the palette. So
 * every pixel matching a band colour IS that band, and one scan at room-load
 * finds all of them.
 *
 * That scan is the only per-room cost. After it, a frame is either the cached
 * canvas as-is, or -- at most a few times a second, and only for a few hundred
 * pixels -- a patch and a redraw.
 */
export class CyclingBackground {
  private readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;
  private readonly image: ImageData;
  private readonly elements: ResolvedElement[];
  /** Palette index -> every pixel drawn with it, as byte offsets into image. */
  private readonly pixels = new Map<number, number[]>();
  private readonly rgb = new Map<number, [number, number, number]>();
  private shown: Map<number, number> | null = null;

  constructor(source: CanvasImageSource, room: RoomFile, palette: PaletteFile,
              width: number, height: number) {
    this.elements = (room.cycling ?? []).map((element) => resolve(palette, element));

    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    const context = this.canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('Could not get a 2d context for the background');
    this.context = context;
    this.context.imageSmoothingEnabled = false;
    this.context.drawImage(source, 0, 0);
    this.image = this.context.getImageData(0, 0, width, height);

    // Keyed by packed RGB rather than by a string: one integer compare per
    // pixel over 46,080 of them, and no allocation in the loop.
    const wanted = new Map<number, number>();
    for (const element of this.elements) {
      for (let index = element.first; index < element.first + element.count; index += 1) {
        const [r, g, b] = parseHex(palette.colours[index] ?? BLACK);
        this.rgb.set(index, [r, g, b]);
        wanted.set(pack(r, g, b), index);
        this.pixels.set(index, []);
      }
    }
    if (wanted.size === 0) return;

    const data = this.image.data;
    for (let offset = 0; offset < data.length; offset += 4) {
      const index = wanted.get(
        pack(data[offset] as number, data[offset + 1] as number, data[offset + 2] as number));
      if (index !== undefined) this.pixels.get(index)!.push(offset);
    }
  }

  get cycles(): boolean {
    return this.elements.length > 0;
  }

  /**
   * The background as it looks at `seconds`, or its still form when cycling
   * is off. Repaints only when the mapping actually changed -- at 0.25 and
   * 0.6 Hz that is a handful of times a minute, not sixty times a second.
   */
  frameAt(seconds: number, enabled: boolean): CanvasImageSource {
    const mapping = enabled ? mappingAt(this.elements, seconds) : new Map<number, number>();
    if (this.shown && sameMapping(this.shown, mapping)) return this.canvas;

    const data = this.image.data;
    for (const [index, offsets] of this.pixels) {
      // With cycling off every band shows its own colour, which is the
      // composed frame -- the same picture the legibility check measured.
      const [r, g, b] = this.rgb.get(mapping.get(index) ?? index)!;
      for (const offset of offsets) {
        data[offset] = r;
        data[offset + 1] = g;
        data[offset + 2] = b;
      }
    }
    this.context.putImageData(this.image, 0, 0);
    this.shown = mapping;
    return this.canvas;
  }
}

const BLACK = '#000000';

function pack(r: number, g: number, b: number): number {
  return (r << 16) | (g << 8) | b;
}

function parseHex(value: string): [number, number, number] {
  return [
    parseInt(value.slice(1, 3), 16),
    parseInt(value.slice(3, 5), 16),
    parseInt(value.slice(5, 7), 16),
  ];
}
