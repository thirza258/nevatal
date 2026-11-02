import type { ReactNode } from 'react'
import { motion, type Variants } from 'framer-motion'
import { revealProps } from '../../lib/inview'
import { easeOut } from '../../lib/motion'

interface RevealProps {
  children: ReactNode
  className?: string
  delay?: number
  y?: number
  rotate?: number
  scale?: number
  once?: boolean
}

/** Rises, settles and un-tilts into place as it scrolls into view. */
const Reveal = ({ children, className, delay = 0, y = 36, rotate = 0, scale = 1, once = true }: RevealProps) => {
  const variants: Variants = {
    hidden: { opacity: 0, y, rotate, scale },
    show: {
      opacity: 1,
      y: 0,
      rotate: 0,
      scale: 1,
      transition: { duration: 0.85, ease: easeOut, delay },
    },
  }

  return (
    <motion.div className={className} variants={variants} {...revealProps(once)}>
      {children}
    </motion.div>
  )
}

export default Reveal
