import type { CSSProperties, ReactNode } from 'react'
import { pathOf } from '../../lib/shapes'

export type ShapeKind =
  | 'circle'
  | 'half'
  | 'quarter'
  | 'pill'
  | 'square'
  | 'arch'
  | 'sparkle'
  | 'flower'
  | 'burst'
  | 'ring'
  | 'plus'
  | 'squiggle'
  | 'blob'
  | 'dots'

export const SHAPE_KINDS: ShapeKind[] = [
  'circle',
  'half',
  'quarter',
  'pill',
  'square',
  'arch',
  'sparkle',
  'flower',
  'burst',
  'ring',
  'plus',
  'squiggle',
  'blob',
  'dots',
]

export const SHAPE_FILL = {
  sun: '#FFC700',
  cobalt: '#0069D6',
  plum: '#600061',
  ink: '#0B0B0D',
  paper: '#FFFFFF',
} as const

export type ShapeColor = keyof typeof SHAPE_FILL

const SPARKLE = pathOf('sparkle')
const FLOWER = pathOf('flower')
const BURST = pathOf('burst')
const BLOB = pathOf('blob')

const draw = (kind: ShapeKind, fill: string): ReactNode => {
  switch (kind) {
    case 'circle':
      return <circle cx="50" cy="50" r="50" fill={fill} />
    case 'half':
      return <path d="M0 75A50 50 0 0 1 100 75Z" fill={fill} />
    case 'quarter':
      return <path d="M0 100V0A100 100 0 0 1 100 100Z" fill={fill} />
    case 'pill':
      return <rect x="0" y="30" width="100" height="40" rx="20" fill={fill} />
    case 'square':
      return <rect x="8" y="8" width="84" height="84" rx="18" fill={fill} />
    case 'arch':
      return <path d="M10 100V45a40 40 0 0 1 80 0v55Z" fill={fill} />
    case 'sparkle':
      return <path d={SPARKLE} fill={fill} />
    case 'flower':
      return <path d={FLOWER} fill={fill} />
    case 'burst':
      return <path d={BURST} fill={fill} />
    case 'blob':
      return <path d={BLOB} fill={fill} />
    case 'ring':
      return <circle cx="50" cy="50" r="38" fill="none" stroke={fill} strokeWidth="16" />
    case 'plus':
      return (
        <>
          <rect x="38" y="4" width="24" height="92" rx="12" fill={fill} />
          <rect x="4" y="38" width="92" height="24" rx="12" fill={fill} />
        </>
      )
    case 'squiggle':
      return (
        <path
          d="M6 58C18 30 30 30 38 50s20 22 28 0 20-22 28-4"
          fill="none"
          stroke={fill}
          strokeWidth="12"
          strokeLinecap="round"
        />
      )
    case 'dots':
      return (
        <>
          {[18, 50, 82].flatMap((cy) =>
            [18, 50, 82].map((cx) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="8" fill={fill} />)
          )}
        </>
      )
  }
}

/** A flat, decorative shape. Always hidden from assistive tech. */
const Shape = ({
  kind,
  color = 'sun',
  className,
  style,
}: {
  kind: ShapeKind
  color?: ShapeColor
  className?: string
  style?: CSSProperties
}) => (
  <svg
    viewBox="0 0 100 100"
    aria-hidden="true"
    focusable="false"
    overflow="visible"
    className={className}
    style={style}
  >
    {draw(kind, SHAPE_FILL[color])}
  </svg>
)

export default Shape
