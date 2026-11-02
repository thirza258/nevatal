import { useEffect, useRef, useState } from 'react'
import { animate, useReducedMotion } from 'framer-motion'
import { canObserve, useInViewport } from '../../lib/inview'
import { easeOut } from '../../lib/motion'

const AnimatedCounter = ({
  value,
  suffix = '',
  duration = 0.7,
}: {
  value: number
  suffix?: string
  duration?: number
}) => {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInViewport(ref, { once: true, margin: '0px' })
  const reduceMotion = useReducedMotion()
  // Without an observer (server, tests) there is nothing to count up from.
  const [display, setDisplay] = useState(canObserve ? 0 : value)
  const current = useRef(canObserve ? 0 : value)

  useEffect(() => {
    if (!inView) return
    if (reduceMotion) {
      current.current = value
      setDisplay(value)
      return
    }
    const controls = animate(current.current, value, {
      duration,
      ease: easeOut,
      onUpdate: (latest) => {
        current.current = Math.round(latest)
        setDisplay(current.current)
      },
    })
    return () => controls.stop()
  }, [inView, reduceMotion, value, duration])

  return (
    <span ref={ref} className="tabular-nums">
      <span aria-hidden="true">
        {display}
        {suffix}
      </span>
      <span className="sr-only">
        {value}
        {suffix}
      </span>
    </span>
  )
}

export default AnimatedCounter
