import { useEffect, useState } from 'react'
import { animate, useReducedMotion } from 'framer-motion'

/**
 * Types `text` out like a streamed model reply. The full text is laid out
 * invisibly underneath, so the box never grows while it types, and screen
 * readers get the whole thing at once.
 */
const Typewriter = ({
  text,
  charsPerSecond = 140,
  className = '',
}: {
  text: string
  charsPerSecond?: number
  className?: string
}) => {
  const reduce = useReducedMotion()
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (reduce) {
      setCount(text.length)
      return
    }
    setCount(0)
    const controls = animate(0, text.length, {
      duration: Math.min(2.4, text.length / charsPerSecond),
      ease: 'linear',
      onUpdate: (latest) => setCount(Math.round(latest)),
    })
    return () => controls.stop()
  }, [text, reduce, charsPerSecond])

  const typing = count < text.length

  return (
    <span className={`relative block ${className}`}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="invisible block">
        {text}
      </span>
      <span aria-hidden="true" className="absolute inset-0 block">
        {text.slice(0, count)}
        {typing && (
          <span className="ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[3px] animate-blink bg-current" />
        )}
      </span>
    </span>
  )
}

export default Typewriter
