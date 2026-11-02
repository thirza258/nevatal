import type { Transition, Variants } from 'framer-motion'

export const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1]
export const easeInOut: [number, number, number, number] = [0.65, 0, 0.35, 1]

export const spring: Transition = { type: 'spring', stiffness: 400, damping: 32, mass: 0.9 }
export const springSoft: Transition = { type: 'spring', stiffness: 220, damping: 24 }
export const springPop: Transition = { type: 'spring', stiffness: 300, damping: 20 }

/** Shared viewport settings so reveals trigger promptly without lagging behind the scroll. */
export const viewportOnce = { once: true, margin: '0px 0px -40px 0px' } as const

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: easeOut } },
}

export const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.02 } },
}

export const cardIn: Variants = {
  hidden: { opacity: 0, y: 18, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 280, damping: 24 },
  },
  out: { opacity: 0, scale: 0.96, transition: { duration: 0.15 } },
}
