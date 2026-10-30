import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

type Shape =
  | 'triangle'
  | 'triangle-outline'
  | 'trapezoid'
  | 'trapezoid-outline'
  | 'ring'
  | 'square'
  | 'cross'
  | 'arc'
type Tone = 'light' | 'dark' | 'brand' | 'blue' | 'maroon'

const TONES: Record<Tone, { stroke: string; fill: string }> = {
  light: { stroke: 'rgba(255,255,255,0.24)', fill: 'rgba(255,255,255,0.04)' },
  dark: { stroke: 'rgba(10,13,18,0.2)', fill: 'rgba(10,13,18,0.035)' },
  brand: { stroke: 'rgba(255,197,61,0.65)', fill: 'rgba(255,197,61,0.08)' },
  blue: { stroke: 'rgba(47,107,255,0.35)', fill: 'rgba(47,107,255,0.05)' },
  maroon: { stroke: 'rgba(159,18,57,0.3)', fill: 'rgba(159,18,57,0.05)' },
}

const AbstractShape = ({
  shape,
  tone = 'light',
  className,
  rotate = true,
}: {
  shape: Shape
  tone?: Tone
  className?: string
  rotate?: boolean
}) => {
  const reduceMotion = useReducedMotion()
  const colors = TONES[tone]

  const shapes: Record<Shape, ReactNode> = {
    triangle: <path d="M100 16 184 176H16Z" fill={colors.fill} stroke={colors.stroke} />,
    'triangle-outline': <path d="M100 16 184 176H16Z" fill="none" stroke={colors.stroke} />,
    trapezoid: <path d="M42 166 70 34h60l28 132Z" fill={colors.fill} stroke={colors.stroke} />,
    'trapezoid-outline': (
      <path d="M42 166 70 34h60l28 132Z" fill="none" stroke={colors.stroke} />
    ),
    ring: (
      <circle
        cx="100"
        cy="100"
        r="76"
        fill="none"
        stroke={colors.stroke}
        strokeDasharray="2 7"
      />
    ),
    square: (
      <rect
        x="42"
        y="42"
        width="116"
        height="116"
        rx="6"
        transform="rotate(18 100 100)"
        fill={colors.fill}
        stroke={colors.stroke}
      />
    ),
    cross: (
      <>
        <path d="M100 30v140" stroke={colors.stroke} />
        <path d="M30 100h140" stroke={colors.stroke} />
      </>
    ),
    arc: <path d="M18 100a82 82 0 0 1 164 0" fill="none" stroke={colors.stroke} />,
  }

  return (
    <motion.svg
      aria-hidden="true"
      viewBox="0 0 200 200"
      strokeWidth="1.4"
      className={`pointer-events-none absolute select-none ${className ?? ''}`}
      animate={reduceMotion || !rotate ? undefined : { rotate: [0, 5, 0], y: [0, -8, 0] }}
      transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
    >
      {shapes[shape]}
    </motion.svg>
  )
}

export default AbstractShape