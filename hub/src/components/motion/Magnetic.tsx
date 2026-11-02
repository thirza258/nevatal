import { useRef, type ReactNode } from 'react'
import { motion, useReducedMotion, useSpring } from 'framer-motion'
import { useFinePointer } from '../../lib/hooks'

/** Leans whatever it wraps towards the pointer, then springs back. Mouse only. */
const Magnetic = ({
  children,
  strength = 0.28,
  className = '',
}: {
  children: ReactNode
  strength?: number
  className?: string
}) => {
  const ref = useRef<HTMLSpanElement>(null)
  const fine = useFinePointer()
  const reduce = useReducedMotion()
  const x = useSpring(0, { stiffness: 240, damping: 16, mass: 0.6 })
  const y = useSpring(0, { stiffness: 240, damping: 16, mass: 0.6 })
  const enabled = fine && !reduce

  return (
    <motion.span
      ref={ref}
      className={`inline-flex ${className}`}
      style={{ x, y }}
      onPointerMove={(event) => {
        if (!enabled || !ref.current) return
        const box = ref.current.getBoundingClientRect()
        x.set((event.clientX - (box.left + box.width / 2)) * strength)
        y.set((event.clientY - (box.top + box.height / 2)) * strength)
      }}
      onPointerLeave={() => {
        x.set(0)
        y.set(0)
      }}
    >
      {children}
    </motion.span>
  )
}

export default Magnetic
