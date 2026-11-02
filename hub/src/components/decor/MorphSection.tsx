import { useRef, type ReactNode } from 'react'
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'framer-motion'
import { useWide } from '../../lib/hooks'
import type { PolarShape } from '../../lib/shapes'

export type Morph = 'pill' | 'arch' | 'circle' | Exclude<PolarShape, 'rect' | 'square' | 'circle'>

const rangeFor = (morph: Morph, wide: boolean): [string, string] => {
  switch (morph) {
    case 'pill':
      return wide
        ? ['inset(4% 5% 4% 5% round 180px)', 'inset(0% 0% 0% 0% round 0px)']
        : ['inset(2% 3% 2% 3% round 48px)', 'inset(0% 0% 0% 0% round 0px)']
    case 'arch':
      return wide
        ? ['inset(3% 6% 0% 6% round 50% 50% 0% 0%)', 'inset(0% 0% 0% 0% round 0% 0% 0% 0%)']
        : ['inset(2% 3% 0% 3% round 48% 48% 0% 0%)', 'inset(0% 0% 0% 0% round 0% 0% 0% 0%)']
    case 'circle':
      return ['circle(12% at 50% 35%)', 'circle(150% at 50% 35%)']
    case 'sparkle':
      return wide
        ? ['inset(3% 5% 3% 5% round 96px)', 'inset(0% 0% 0% 0% round 0px)']
        : ['inset(2% 3% 2% 3% round 48px)', 'inset(0% 0% 0% 0% round 0px)']
    case 'blob':
      return wide
        ? ['inset(3% 5% 3% 5% round 120px)', 'inset(0% 0% 0% 0% round 0px)']
        : ['inset(2% 3% 2% 3% round 48px)', 'inset(0% 0% 0% 0% round 0px)']
    default:
      return wide
        ? ['inset(3% 5% 3% 5% round 64px)', 'inset(0% 0% 0% 0% round 0px)']
        : ['inset(2% 3% 2% 3% round 32px)', 'inset(0% 0% 0% 0% round 0px)']
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
  return <motion.div aria-hidden="true" className={className} style={{ clipPath, willChange: 'clip-path' }} />
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
