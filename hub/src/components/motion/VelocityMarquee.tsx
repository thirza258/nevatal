import { useRef, type ReactNode } from 'react'
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  wrap,
} from 'framer-motion'
import { useInViewport } from '../../lib/inview'

/**
 * An endless strip that drifts on its own and speeds up — or turns around —
 * with the scroll. It stops entirely while off screen.
 */
const VelocityMarquee = ({
  children,
  baseVelocity = -2.5,
  className = '',
}: {
  children: ReactNode
  /** Percent of one copy per second; the sign is the resting direction. */
  baseVelocity?: number
  className?: string
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const onScreen = useInViewport(ref, { margin: '80px' })
  const baseX = useMotionValue(0)
  const { scrollY } = useScroll()
  const velocity = useVelocity(scrollY)
  const smooth = useSpring(velocity, { damping: 50, stiffness: 400 })
  const factor = useTransform(smooth, [0, 1000], [0, 4], { clamp: false })
  const x = useTransform(baseX, (value) => `${wrap(-50, 0, value)}%`)
  const direction = useRef(1)

  useAnimationFrame((_, delta) => {
    if (reduce || !onScreen) return
    let moveBy = direction.current * baseVelocity * (delta / 1000)
    const boost = factor.get()
    if (boost < 0) direction.current = -1
    else if (boost > 0) direction.current = 1
    moveBy += direction.current * moveBy * boost
    baseX.set(baseX.get() + moveBy)
  })

  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <motion.div className="flex w-max flex-nowrap will-change-transform" style={{ x, willChange: 'transform' }}>
        <div className="flex flex-none items-center">{children}</div>
        <div className="flex flex-none items-center" aria-hidden="true">
          {children}
        </div>
      </motion.div>
    </div>
  )
}

export default VelocityMarquee
