import { motion } from 'framer-motion'
import { revealProps } from '../../lib/inview'
import { easeOut } from '../../lib/motion'

const draw = {
  hidden: { pathLength: 0 },
  show: { pathLength: 1, transition: { duration: 1.1, ease: easeOut, delay: 0.35 } },
}

/**
 * A heading with one phrase set in the serif italic, optionally underlined by
 * a squiggle that draws itself in. The plain sentence sits in an sr-only copy,
 * so assistive tech — and the tests — read it as one unbroken string.
 */
const Heading = ({
  as: Tag = 'h2',
  text,
  accent,
  squiggle = false,
  className = '',
}: {
  as?: 'h1' | 'h2' | 'h3'
  text: string
  accent?: string
  squiggle?: boolean
  className?: string
}) => {
  const at = accent ? text.lastIndexOf(accent) : -1
  if (!accent || at < 0) return <Tag className={className}>{text}</Tag>

  return (
    <Tag className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {text.slice(0, at)}
        <span className="relative inline-block whitespace-nowrap">
          <span className="font-serif font-normal italic tracking-[-0.02em]">{accent}</span>
          {squiggle && (
            <motion.svg
              viewBox="0 0 300 24"
              preserveAspectRatio="none"
              className="absolute -bottom-[0.14em] left-0 h-[0.22em] w-full overflow-visible text-sun"
              {...revealProps()}
            >
              <motion.path
                d="M4 14C40 2 64 22 100 12s60-10 96 2 66 6 100-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="7"
                strokeLinecap="round"
                variants={draw}
              />
            </motion.svg>
          )}
        </span>
        {text.slice(at + accent.length)}
      </span>
    </Tag>
  )
}

export default Heading
