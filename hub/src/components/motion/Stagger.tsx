import type { ReactNode } from 'react'
import { motion, type Variants } from 'framer-motion'
import { revealProps } from '../../lib/inview'
import { cardIn, fadeUp } from '../../lib/motion'

const group = (delay: number, gap: number): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: gap, delayChildren: delay } },
})

export const Stagger = ({
  children,
  className,
  delay = 0,
  gap = 0.08,
  trigger = 'viewport',
  as = 'div',
}: {
  children: ReactNode
  className?: string
  delay?: number
  gap?: number
  trigger?: 'mount' | 'viewport'
  as?: 'div' | 'ul' | 'ol'
}) => {
  const Component = motion[as]
  const props = trigger === 'mount' ? ({ initial: 'hidden', animate: 'show' } as const) : revealProps()
  return (
    <Component className={className} variants={group(delay, gap)} {...props}>
      {children}
    </Component>
  )
}

export const StaggerItem = ({
  children,
  className,
  as = 'div',
  pop = false,
}: {
  children: ReactNode
  className?: string
  as?: 'div' | 'li'
  /** Cards drop in with a spring and a slight tilt instead of a plain rise. */
  pop?: boolean
}) => {
  const Component = motion[as]
  return (
    <Component className={className} variants={pop ? cardIn : fadeUp}>
      {children}
    </Component>
  )
}
