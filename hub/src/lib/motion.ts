import type { Transition, Variants } from 'framer-motion'

export const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1]
export const easeInOut: [number, number, number, number] = [0.65, 0, 0.35, 1]

export const spring: Transition = { type: 'spring', stiffness: 400, damping: 32, mass: 0.9 }
export const springSoft: Transition = { type: 'spring', stiffness: 150, damping: 20, mass: 0.9 }
export const springPop: Transition = { type: 'spring', stiffness: 260, damping: 15 }

/** Shared viewport settings so every reveal fires at the same point. */
export const viewportOnce = { once: true, margin: '-12% 0px -8% 0px' } as const

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: easeOut } },
}

export const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
}

export const cardIn: Variants = {
  hidden: { opacity: 0, y: 48, rotate: -2.5, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    rotate: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 130, damping: 18, mass: 0.9 },
  },
  out: { opacity: 0, scale: 0.9, transition: { duration: 0.18 } },
}
