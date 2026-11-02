import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { easeOut } from '../../lib/motion'

/**
 * One word that rises out of its own mask. Screen readers and tests get the
 * sentence from an sr-only copy, so the animated pieces stay aria-hidden.
 */
export const MaskWord = ({
  children,
  delay = 0,
  className = '',
}: {
  children: ReactNode
  delay?: number
  className?: string
}) => {
  const reduce = useReducedMotion()
  return (
    <span className="-mb-[0.2em] inline-block overflow-hidden pb-[0.2em] align-bottom">
      <motion.span
        className={`inline-block ${className}`}
        initial={reduce ? false : { y: '100%', rotate: 0 }}
        animate={{ y: '0%', rotate: 0 }}
        transition={{ duration: 0.45, ease: easeOut, delay }}
      >
        {children}
      </motion.span>
    </span>
  )
}

/** A heading that rises in word by word on mount. */
const SplitText = ({
  text,
  delay = 0,
  gap = 0.04,
  className = '',
}: {
  text: string
  delay?: number
  gap?: number
  className?: string
}) => {
  const words = text.split(' ')
  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className={className}>
        {words.map((word, index) => (
          <span key={`${word}-${index}`}>
            <MaskWord delay={delay + index * gap}>{word}</MaskWord>
            {index < words.length - 1 ? ' ' : null}
          </span>
        ))}
      </span>
    </>
  )
}

export default SplitText
