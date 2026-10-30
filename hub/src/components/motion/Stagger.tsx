import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { fadeUp } from '../../lib/motion'

const group = (delay: number) => ({
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: delay } },
})

export const Stagger = ({
  children,
  className,
  delay = 0,
  trigger = 'viewport',
}: {
  children: ReactNode
  className?: string
  delay?: number
  trigger?: 'mount' | 'viewport'
}) =>
  trigger === 'mount' ? (
    <motion.div className={className} initial="hidden" animate="show" variants={group(delay)}>
      {children}
    </motion.div>
  ) : (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-12% 0px -8% 0px' }}
      variants={group(delay)}
    >
      {children}
    </motion.div>
  )

export const StaggerItem = ({ children, className }: { children: ReactNode; className?: string }) => (
  <motion.div className={className} variants={fadeUp}>
    {children}
  </motion.div>
)
