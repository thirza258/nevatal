import { useEffect, useRef, useState } from 'react'
import { animate, useInView, useReducedMotion } from 'framer-motion'
import { easeOut } from '../../lib/motion'

const AnimatedCounter = ({
  value,
  suffix = '',
  duration = 1.1,
}: {
  value: number
  suffix?: string
  duration?: number
}) => {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-10% 0px' })
  const reduceMotion = useReducedMotion()
  const [display, setDisplay] = useState(0)
  const current = useRef(0)

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
