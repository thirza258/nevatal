import { useMemo, useRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useFinePointer } from '../../lib/hooks'
import { useInViewport } from '../../lib/inview'
import { createRandom, SESSION_SALT } from '../../lib/random'

const STYLES = {
  paper: [
    'bg-sun text-ink',
    'bg-ink text-paper',
    'bg-cobalt text-paper',
    'bg-plum text-paper',
    'border border-ink/25 bg-paper text-ink',
  ],
  sun: [
    'bg-paper text-ink',
    'bg-ink text-paper',
    'bg-cobalt text-paper',
    'bg-plum text-paper',
    'border border-ink/30 bg-sun text-ink',
  ],
}

/**
 * A list that drops in like a handful of tossed pills, each landing at its own
 * angle. With a mouse, every pill can be picked up and thrown around the pile.
 */
const PillPile = ({
  items,
  seed,
  tone = 'paper',
  className = '',
  size = 'md',
}: {
  items: string[]
  seed: string
  tone?: 'paper' | 'sun'
  className?: string
  size?: 'md' | 'lg'
}) => {
  const ref = useRef<HTMLUListElement>(null)
  const fine = useFinePointer()
  const reduce = useReducedMotion()
  const entered = useInViewport(ref, { once: true, margin: '0px 0px 40px 0px' })

  const specs = useMemo(
    () =>
      items.map((_, index) => {
        const random = createRandom(`${seed}:${SESSION_SALT}:${index}`)
        return {
          rotate: random.range(-10, 10),
          style: STYLES[tone][index % STYLES[tone].length],
        }
      }),
    [items, seed, tone]
  )

  return (
    <ul ref={ref} className={`relative flex flex-wrap content-end items-end gap-2.5 ${className}`}>
      {items.map((item, index) => (
        <motion.li
          key={item}
          data-cursor={fine ? 'drag' : undefined}
          initial={reduce ? false : { y: 20, opacity: 0 }}
          animate={entered || reduce ? { y: 0, opacity: 1, rotate: specs[index].rotate } : undefined}
          transition={{ type: 'spring', stiffness: 320, damping: 22, delay: index * 0.04 }}
          drag={fine}
          dragConstraints={ref}
          dragElastic={0.22}
          whileHover={fine ? { scale: 1.06 } : undefined}
          whileDrag={{ scale: 1.12, rotate: 0, zIndex: 20 }}
          className={`relative select-none rounded-full font-medium tracking-[-0.01em] ${
            size === 'lg' ? 'px-6 py-3.5 text-lg sm:text-xl' : 'px-4 py-2.5 text-sm sm:text-base'
          } ${specs[index].style} ${fine ? 'cursor-grab touch-none active:cursor-grabbing' : ''}`}
        >
          {item}
        </motion.li>
      ))}
    </ul>
  )
}

export default PillPile
