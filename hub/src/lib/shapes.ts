/**
 * Polar shape geometry shared by the decorative shapes, the morphing shapes
 * and the shape-to-section reveals.
 *
 * Every shape is sampled at the same 64 angles, starting at twelve o'clock, so
 * any two of them can be interpolated point for point — that is what lets a
 * sparkle melt into a flower, or a blob open up into a full section.
 */
export type PolarShape = 'circle' | 'square' | 'sparkle' | 'flower' | 'burst' | 'blob' | 'rect'

export const POLAR_POINTS = 64

const radius = (shape: PolarShape, theta: number): number => {
  const cos = Math.cos(theta)
  const sin = Math.sin(theta)
  switch (shape) {
    case 'circle':
      return 50
    case 'square':
      return 36 / Math.max(Math.abs(cos), Math.abs(sin))
    case 'rect':
      // Lands exactly on the bounding box, so as a clip-path it is the full rectangle.
      return 50 / Math.max(Math.abs(cos), Math.abs(sin))
    case 'sparkle': {
      // A superellipse with p < 1: four sharp tips and concave sides, like ✦.
      const p = 0.62
      return 50 / Math.pow(Math.pow(Math.abs(cos), p) + Math.pow(Math.abs(sin), p), 1 / p)
    }
    case 'flower':
      return 50 * (0.78 + 0.22 * Math.cos(6 * theta))
    case 'burst':
      return 50 * (0.85 + 0.15 * Math.cos(14 * theta))
    case 'blob':
      return 50 * (0.84 + 0.09 * Math.sin(3 * theta + 0.6) + 0.07 * Math.cos(5 * theta + 1.2))
  }
}

export const polarPoints = (shape: PolarShape, points = POLAR_POINTS): Array<[number, number]> =>
  Array.from({ length: points }, (_, index) => {
    const theta = -Math.PI / 2 + (index / points) * Math.PI * 2
    const r = radius(shape, theta)
    return [50 + r * Math.cos(theta), 50 + r * Math.sin(theta)]
  })

export const toPolygon = (points: Array<[number, number]>): string =>
  `polygon(${points.map(([x, y]) => `${x.toFixed(2)}% ${y.toFixed(2)}%`).join(', ')})`

export const toPath = (points: Array<[number, number]>): string =>
  `M${points.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join('L')}Z`

export const polygonOf = (shape: PolarShape) => toPolygon(polarPoints(shape))
export const pathOf = (shape: PolarShape) => toPath(polarPoints(shape))
