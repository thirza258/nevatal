import { useId } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import Shape, { type ShapeColor, type ShapeKind } from './Shape'

/** Circular type that turns as the page scrolls, with a shape at its centre. */
const RotatingBadge = ({
  text,
  className = '',
  center = 'sparkle',
  centerColor = 'sun',
}: {
  text: string
  className?: string
  center?: ShapeKind
  centerColor?: ShapeColor
}) => {
  const id = `badge-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const reduce = useReducedMotion()
  const { scrollY } = useScroll()
  const rotate = useTransform(scrollY, [0, 1800], [0, 360], { clamp: false })

  return (
    <div aria-hidden="true" className={className}>
      <div className="relative h-full w-full">
        <motion.svg viewBox="0 0 200 200" className="h-full w-full" style={{ rotate: reduce ? 0 : rotate }}>
          <defs>
            <path id={id} d="M100 100m-78 0a78 78 0 1 1 156 0a78 78 0 1 1-156 0" />
          </defs>
          <text className="fill-current font-mono text-[14.5px] font-medium uppercase" letterSpacing="4.2">
            <textPath href={`#${id}`}>{text}</textPath>
          </text>
        </motion.svg>
        <Shape kind={center} color={centerColor} className="absolute inset-[31%]" />
      </div>
    </div>
  )
}

export default RotatingBadge
