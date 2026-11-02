import { useMemo, useRef, type RefObject } from 'react'
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from 'framer-motion'
import { useFinePointer, useWide } from '../../lib/hooks'
import { useInViewport } from '../../lib/inview'
import { createRandom, SESSION_SALT } from '../../lib/random'
import Shape, { SHAPE_KINDS, type ShapeColor, type ShapeKind } from './Shape'

type Tone = 'paper' | 'sun'

const PALETTES: Record<Tone, ShapeColor[]> = {
  paper: ['sun', 'sun', 'cobalt', 'plum', 'ink', 'sun', 'cobalt'],
  sun: ['paper', 'paper', 'cobalt', 'plum', 'ink', 'paper', 'ink'],
}

interface Spec {
  kind: ShapeKind
  color: ShapeColor
  /** Left / top in percent of the field, for wide and narrow screens. */
  x: number
  mx: number
  y: number
  size: number
  rotate: number
  depth: number
  spin: number
  float: number
  wobble: number
  period: number
  delay: number
}

const buildSpecs = (
  seed: string,
  count: number,
  tone: Tone,
  layout: 'gutters' | 'scatter',
  [minSize, maxSize]: [number, number],
  kinds: readonly ShapeKind[]
): Spec[] => {
  const random = createRandom(seed)
  const palette = PALETTES[tone]
  const slot = 88 / count
  let lastKind: ShapeKind | null = null

  return Array.from({ length: count }, (_, index) => {
    let kind = random.pick(kinds)
    if (kind === lastKind) kind = random.pick(kinds)
    lastKind = kind
    const left = index % 2 === 0
    const size = random.range(minSize, maxSize)
    const x =
      layout === 'scatter'
        ? random.range(2, 88)
        : left
          ? random.range(-5, 5)
          : random.range(87, 96)
    return {
      kind,
      color: random.pick(palette),
      x,
      // On narrow screens the shapes peek in from the very edges instead.
      mx: layout === 'scatter' ? x : left ? random.range(-13, -8) : random.range(95, 99),
      y: layout === 'scatter' ? random.range(4, 84) : 4 + index * slot + random.range(0, slot * 0.55),
      size,
      rotate: random.range(-35, 35),
      depth: random.range(0.35, 1.1) * random.sign(),
      spin: random.range(20, 70) * random.sign(),
      float: random.range(6, 16),
      wobble: random.range(4, 12) * random.sign(),
      period: random.range(6, 11),
      delay: random.range(0, 2.5),
    }
  })
}

const FieldShape = ({
  spec,
  index,
  progress,
  wide,
  entered,
  floating,
  draggable,
  constraints,
  reduce,
}: {
  spec: Spec
  index: number
  progress: MotionValue<number>
  wide: boolean
  entered: boolean
  floating: boolean
  draggable: boolean
  constraints: RefObject<HTMLDivElement | null>
  reduce: boolean
}) => {
  const y = useTransform(progress, [0, 1], [spec.depth * 110, spec.depth * -110])
  const rotate = useTransform(progress, [0, 1], [spec.rotate - spec.spin, spec.rotate + spec.spin])
  const size = wide ? spec.size : spec.size * 0.5

  return (
    <motion.div
      className="absolute"
      style={{
        left: `${wide ? spec.x : spec.mx}%`,
        top: `${spec.y}%`,
        width: size,
        height: size,
        y: reduce ? 0 : y,
        rotate: reduce ? spec.rotate : rotate,
      }}
    >
      <motion.div
        data-cursor={draggable ? 'drag' : undefined}
        className={`h-full w-full ${draggable ? 'pointer-events-auto cursor-grab touch-none active:cursor-grabbing' : ''}`}
        initial={{ scale: 0 }}
        animate={{ scale: entered ? 1 : 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 14, delay: entered ? 0.15 + index * 0.07 : 0 }}
        drag={draggable}
        dragConstraints={constraints}
        dragElastic={0.18}
        dragTransition={{ bounceStiffness: 260, bounceDamping: 14, power: 0.35 }}
        whileHover={draggable ? { scale: 1.12, rotate: spec.wobble * 1.5 } : undefined}
        whileTap={draggable ? { scale: 0.92 } : undefined}
        whileDrag={{ scale: 1.2, rotate: spec.wobble * 3 }}
      >
        <motion.div
          className="h-full w-full"
          animate={floating ? { y: [0, -spec.float, 0], rotate: [0, spec.wobble, 0] } : { y: 0, rotate: 0 }}
          transition={
            floating
              ? { duration: spec.period, repeat: Infinity, ease: 'easeInOut', delay: spec.delay }
              : { duration: 0.6 }
          }
        >
          <Shape kind={spec.kind} color={spec.color} className="h-full w-full" />
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

/**
 * A scatter of flat shapes for a section: random per visit, parallaxing and
 * spinning with the scroll, floating while on screen, and — with a mouse —
 * draggable and flingable around the section.
 */
const ShapeField = ({
  seed,
  tone = 'paper',
  count = 6,
  mobileCount = 3,
  layout = 'gutters',
  sizes = [44, 112],
  kinds = SHAPE_KINDS,
  shuffleKey = 0,
  interactive = true,
  className = '',
}: {
  seed: string
  tone?: Tone
  count?: number
  mobileCount?: number
  layout?: 'gutters' | 'scatter'
  sizes?: [number, number]
  kinds?: readonly ShapeKind[]
  shuffleKey?: number
  interactive?: boolean
  className?: string
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = Boolean(useReducedMotion())
  const fine = useFinePointer()
  const wide = useWide()
  const entered = useInViewport(ref, { once: true, margin: '0px 0px -15% 0px' })
  const onScreen = useInViewport(ref, { margin: '120px' })
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })

  const specs = useMemo(
    () => buildSpecs(`${seed}:${SESSION_SALT}:${shuffleKey}`, count, tone, layout, sizes, kinds),
    // `sizes` and `kinds` are literals at every call site; the seed is what changes.
    [seed, shuffleKey, count, tone, layout]
  )

  const visible = wide ? specs : specs.slice(0, mobileCount)

  return (
    <div ref={ref} aria-hidden="true" className={`pointer-events-none absolute inset-0 ${className}`}>
      {visible.map((spec, index) => (
        <FieldShape
          key={`${shuffleKey}-${index}`}
          spec={spec}
          index={index}
          progress={scrollYProgress}
          wide={wide}
          entered={entered}
          floating={onScreen && !reduce}
          draggable={interactive && fine}
          constraints={ref}
          reduce={reduce}
        />
      ))}
    </div>
  )
}

export default ShapeField
