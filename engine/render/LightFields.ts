import type { RoomLamp } from '../core/types.ts';

/**
 * PRACTICAL LIGHT ON THE PEOPLE. The opening-set audit (doc 36 Q115) found
 * the one lighting fault every room shares: `drawLamps` breathes a warm pool
 * over the PLATE, after the plate and before the people, so a mover never
 * stands in the light the room declares. Thad crossed the saloon's orange
 * pool in his cool blue coat beside a pie woman who had been statically relit
 * for the spot, and read as pasted on.
 *
 * WHAT THIS IS. A room's lamp may declare `movers`: a strength and a colour.
 * A mover whose feet stand inside that lamp's radius is tinted toward the
 * colour, by the strength times a square falloff from the lamp -- flat, per
 * sprite, once per frame. That is the authored per-position relight
 * (docs/38 "LIGHT A SPRITE BY WHERE IT STANDS") applied at runtime to the
 * things that move, and nothing more.
 *
 * WHAT THIS IS NOT. Not a lighting engine: no normals, no shadows, no
 * per-pixel gradient across the figure, no smoothing. A flat tint over the
 * sprite's own pixels keeps every edge and every dither exactly where the
 * artist put it, which is why it is a tint and not a blend of the pool over
 * the man. Not a global grade: a lamp that declares no `movers` lights the
 * plate exactly as before and touches nobody, so a room that declares none
 * is unchanged to the pixel. Not the flicker: the plate's pool breathes; a
 * man does not strobe.
 *
 * Deterministic: the same feet, the same lamps, the same state, the same
 * tint. Pure, so a test can hand it lamps and a point.
 */

export interface MoverTint {
  /** 0..1 -- the alpha of the flat colour laid over the sprite's pixels. */
  alpha: number;
  colour: [number, number, number];
}

/** The lamp's default colour when `movers.colour` is absent: the pool's own. */
const POOL_COLOUR: [number, number, number] = [255, 180, 96];

/**
 * The tint a mover standing at (feetX, feetY) receives from the room's lamps
 * under the named visual state, or null when no lamp reaches it.
 *
 * Several lamps add; the sum is clamped. A lamp with `when` that the caller
 * has already found false is simply not passed in -- this function reads
 * geometry, not flags.
 */
export function moverTint(
  lamps: readonly RoomLamp[] | undefined,
  feetX: number,
  feetY: number,
  state: string | null,
): MoverTint | null {
  if (!lamps?.length) return null;
  let alpha = 0;
  let red = 0;
  let green = 0;
  let blue = 0;
  for (const lamp of lamps) {
    const field = lamp.movers;
    if (!field) continue;
    const strength = (state && field.strengthByState?.[state] !== undefined)
      ? field.strengthByState[state] as number
      : field.strength;
    if (!(strength > 0)) continue;
    const radius = field.radius ?? lamp.radius;
    if (!(radius > 0)) continue;
    // The field is measured at the feet: a man is lit by where he STANDS,
    // which is the rule the static relights already follow. `reach` widens
    // the field vertically for a lamp that hangs high over a low floor.
    const dx = feetX - lamp.at[0];
    const dy = (feetY - lamp.at[1]) / (field.reach ?? 1);
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance >= radius) continue;
    const falloff = 1 - distance / radius;
    const weight = strength * falloff * falloff;
    const colour = field.colour ?? POOL_COLOUR;
    red += colour[0] * weight;
    green += colour[1] * weight;
    blue += colour[2] * weight;
    alpha += weight;
  }
  if (alpha <= 0.002) return null;
  const clamped = Math.min(alpha, 0.6);
  return {
    alpha: clamped,
    colour: [Math.round(red / alpha), Math.round(green / alpha), Math.round(blue / alpha)],
  };
}

/**
 * Lay the tint over a rectangle of the canvas, touching only pixels that are
 * already drawn there. `source-atop` paints where the destination has alpha,
 * so the sprite's own silhouette is the mask and the plate beneath is not
 * touched -- provided the caller draws through a scratch layer that holds the
 * sprite alone, which is what the renderer does.
 */
export function applyTint(
  context: CanvasRenderingContext2D,
  tint: MoverTint,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  context.save();
  context.globalCompositeOperation = 'source-atop';
  const [red, green, blue] = tint.colour;
  context.fillStyle = ['rgba(', red, ',', green, ',', blue, ',', tint.alpha.toFixed(3), ')'].join('');
  context.fillRect(x, y, width, height);
  context.restore();
}
