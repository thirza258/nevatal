import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import Shape, { type ShapeColor, type ShapeKind } from './decor/Shape'
import ShapeField from './decor/ShapeField'
import { MaskWord } from './motion/SplitText'
import { easeOut } from '../lib/motion'

/**
 * The opening of every inner page: a big title rising in word by word, its
 * last phrase in the serif italic, over a scatter of loose shapes.
 */
const PageHero = ({
  eyebrow,
  shape = 'sparkle',
  shapeColor = 'sun',
  title,
  accent,
  lead,
  seed,
  children,
}: {
  eyebrow: string
  shape?: ShapeKind
  shapeColor?: ShapeColor
  title: string
  accent?: string
  lead?: ReactNode
  seed: string
  children?: ReactNode
}) => {
  const accentAt = accent ? title.lastIndexOf(accent) : -1
  let cursor = 0
  const words = title.split(' ').map((word) => {
    const start = title.indexOf(word, cursor)
    cursor = start + word.length
    return { word, accented: accentAt >= 0 && start >= accentAt }
  })

  return (
    <section className="relative overflow-clip bg-paper">
      <ShapeField seed={seed} count={6} mobileCount={3} sizes={[44, 116]} />
      <div className="container-x relative pb-16 pt-14 sm:pb-24 sm:pt-20">
        <motion.p
          className="eyebrow text-ink"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: easeOut }}
        >
          <Shape kind={shape} color={shapeColor} className="h-4 w-4" /> {eyebrow}
        </motion.p>
        <h1 className="h-page mt-7 max-w-5xl">
          <span className="sr-only">{title}</span>
          <span aria-hidden="true">
            {words.map(({ word, accented }, index) => (
              <span key={`${word}-${index}`}>
                <MaskWord
                  delay={0.08 + index * 0.06}
                  className={accented ? 'pr-[0.04em] font-serif font-normal italic tracking-[-0.02em]' : ''}
                >
                  {word}
                </MaskWord>
                {index < words.length - 1 ? ' ' : null}
              </span>
            ))}
          </span>
        </h1>
        {lead && (
          <motion.div
            className="mt-7 max-w-2xl text-lg leading-relaxed text-ink/65 sm:text-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: easeOut, delay: 0.35 }}
          >
            {lead}
          </motion.div>
        )}
        {children}
      </div>
    </section>
  )
}

export default PageHero
