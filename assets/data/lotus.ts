/**
 * Lotus geometry for the breath visual.
 *
 * Ten petals — Manipura, the third chakra, is drawn with ten. The breath tab is
 * the one place in the app with room for a symbol rather than a shape, and a
 * lotus that opens on the inhale and closes on the exhale says what the ring
 * could only imply.
 *
 * Pure geometry, no React: the shapes are just strings, so they can be asserted
 * without rendering anything. Kept minimal on purpose — one colour, no gradients,
 * no per-petal detail. The look is meant to iterate.
 */

/** A petal pointing straight up from the origin, tip at `-outer`. */
export function petalPath(outer: number, inner: number, width: number, waist: number): string {
  const r = (n: number) => Number(n.toFixed(2));
  // Two mirrored quadratics from the base to the tip. The control points sit at
  // `waist` — pull it toward the tip for a narrow, calm petal, toward the base
  // for a fat one.
  return [
    `M 0 ${r(-inner)}`,
    `Q ${r(width)} ${r(-waist)} 0 ${r(-outer)}`,
    `Q ${r(-width)} ${r(-waist)} 0 ${r(-inner)}`,
    "Z",
  ].join(" ");
}

/** Rotation in degrees for petal `i` of `count`, first petal pointing up. */
export function petalAngle(i: number, count: number): number {
  return (360 / count) * i;
}

export const LOTUS_PETALS = 10;

/**
 * The whole flower as one transform-per-petal list, drawn around (0,0). The
 * caller supplies the SVG viewBox offset, so this stays unit-agnostic.
 */
export function lotus(
  count: number = LOTUS_PETALS,
  outer: number = 50,
  inner: number = 13,
  width: number = 13,
  waist: number = 33,
): { d: string; angle: number }[] {
  const d = petalPath(outer, inner, width, waist);
  return Array.from({ length: count }, (_, i) => ({ d, angle: petalAngle(i, count) }));
}
