import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { easeOut } from '../../lib/motion'

interface RevealProps {
  children: ReactNode
  className?: string
  delay?: number
  y?: number
  once?: boolean
}

const Reveal = ({ children, className, delay = 0, y = 24, once = true }: RevealProps) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once, margin: '-12% 0px -8% 0px' }}
    transition={{ duration: 0.65, ease: easeOut, delay }}
  >
    {children}
  </motion.div>
)

export default Reveal
