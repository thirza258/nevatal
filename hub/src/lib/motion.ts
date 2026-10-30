import type { Transition, Variants } from 'framer-motion'

export const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1]

export const spring: Transition = { type: 'spring', stiffness: 400, damping: 32, mass: 0.9 }

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: easeOut } },
}

export const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
}

export const cardIn: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: easeOut } },
  out: { opacity: 0, scale: 0.96, transition: { duration: 0.18 } },
}
