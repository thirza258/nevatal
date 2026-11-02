import { useRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useInViewport } from '../../lib/inview'
import { easeInOut } from '../../lib/motion'
import { polygonOf, type PolarShape } from '../../lib/shapes'
import { SHAPE_FILL, type ShapeColor } from './Shape'

/** One big shape that melts into another whenever `shape` changes, slowly turning while on screen. */
const MorphShape = ({
  shape,
  color = 'sun',
  className = '',
  spin = true,
}: {
  shape: Exclude<PolarShape, 'rect'>
  color?: ShapeColor
  className?: string
  spin?: boolean
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const onScreen = useInViewport(ref, { margin: '120px' })
  const turning = spin && onScreen && !reduce

  return (
    <div ref={ref} aria-hidden="true" className={className}>
      <motion.div
        className="h-full w-full"
        animate={turning ? { rotate: 360 } : { rotate: 0 }}
        transition={turning ? { duration: 48, repeat: Infinity, ease: 'linear' } : { duration: 0 }}
      >
        <motion.div
          className="h-full w-full"
          initial={false}
          animate={{ clipPath: polygonOf(shape), backgroundColor: SHAPE_FILL[color] }}
          transition={reduce ? { duration: 0 } : { duration: 0.9, ease: easeInOut }}
        />
      </motion.div>
    </div>
  )
}

export default MorphShape
