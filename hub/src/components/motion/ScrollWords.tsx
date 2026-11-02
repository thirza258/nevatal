import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'framer-motion'

const Word = ({
  word,
  progress,
  range,
}: {
  word: string
  progress: MotionValue<number>
  range: [number, number]
}) => {
  const opacity = useTransform(progress, range, [0.14, 1])
  const y = useTransform(progress, range, ['0.25em', '0em'])
  return (
    <motion.span className="inline-block" style={{ opacity, y }}>
      {word}
    </motion.span>
  )
}

/** A statement that lights up word by word as it is scrolled through. */
const ScrollWords = ({ text, className = '' }: { text: string; className?: string }) => {
  const ref = useRef<HTMLSpanElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.88', 'end 0.42'] })
  const words = text.split(' ')

  return (
    <span ref={ref} className={`block ${className}`}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((word, index) => (
          <span key={`${word}-${index}`}>
            {reduce ? (
              <span className="inline-block">{word}</span>
            ) : (
              <Word
                word={word}
                progress={scrollYProgress}
                range={[index / words.length, Math.min(1, (index + 1.6) / words.length)]}
              />
            )}
            {index < words.length - 1 ? ' ' : null}
          </span>
        ))}
      </span>
    </span>
  )
}

export default ScrollWords
