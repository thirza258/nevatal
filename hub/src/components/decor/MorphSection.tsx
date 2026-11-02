import { useRef, type ReactNode } from 'react'
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'framer-motion'
import { useWide } from '../../lib/hooks'
import { polarPoints, polygonOf, toPolygon, type PolarShape } from '../../lib/shapes'

export type Morph = 'pill' | 'arch' | 'circle' | Exclude<PolarShape, 'rect' | 'square' | 'circle'>

const RECT = polygonOf('rect')

/** A polar shape shrunk towards the middle, so it starts as a shape *inside* the section. */
const shrunk = (shape: PolarShape, scale: number) =>
  toPolygon(polarPoints(shape).map(([x, y]) => [50 + (x - 50) * scale, 50 + (y - 50) * scale]))

const rangeFor = (morph: Morph, wide: boolean): [string, string] => {
  switch (morph) {
    case 'pill':
      return wide
        ? ['inset(5% 6% 5% 6% round 240px)', 'inset(0% 0% 0% 0% round 0px)']
        : ['inset(2% 4% 2% 4% round 48px)', 'inset(0% 0% 0% 0% round 0px)']
    case 'arch':
      return wide
        ? ['inset(4% 8% 0% 8% round 50% 50% 0% 0%)', 'inset(0% 0% 0% 0% round 0% 0% 0% 0%)']
        : ['inset(2% 4% 0% 4% round 48% 48% 0% 0%)', 'inset(0% 0% 0% 0% round 0% 0% 0% 0%)']
    case 'circle':
      return ['circle(12% at 50% 35%)', 'circle(150% at 50% 35%)']
    default:
      return [shrunk(morph, wide ? 0.78 : 0.92), RECT]
  }
}

const MorphLayer = ({
  progress,
  range,
  className,
}: {
  progress: MotionValue<number>
  range: [string, string]
  className: string
}) => {
  const clipPath = useTransform(progress, [0, 1], range)
  return <motion.div aria-hidden="true" className={className} style={{ clipPath }} />
}

/**
 * A section whose background starts life as a shape — a sparkle, a pill, an
 * arch, a circle — and blooms into the full section as it scrolls in. Only the
 * background is clipped, never the content, so type stays sharp and focus
 * rings are never cut off; ink type reads on both the white and the yellow.
 */
const MorphSection = ({
  morph,
  tone = 'sun',
  id,
  className = '',
  children,
  ariaLabel,
}: {
  morph: Morph
  tone?: 'sun' | 'paper'
  id?: string
  className?: string
  children: ReactNode
  ariaLabel?: string
}) => {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const wide = useWide()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.95', 'start 0.1'] })
  const fill = `absolute inset-0 -z-10 ${tone === 'sun' ? 'bg-sun' : 'bg-paper'}`

  return (
    <section ref={ref} id={id} aria-label={ariaLabel} className={`relative isolate overflow-clip ${className}`}>
      {reduce ? (
        <div aria-hidden="true" className={fill} />
      ) : (
        <MorphLayer
          key={wide ? 'wide' : 'narrow'}
          progress={scrollYProgress}
          range={rangeFor(morph, wide)}
          className={fill}
        />
      )}
      {children}
    </section>
  )
}

export default MorphSection
