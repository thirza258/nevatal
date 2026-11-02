import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion'
import { useFinePointer } from '../lib/hooks'

type Mode = 'hidden' | 'idle' | 'link' | 'drag'

const SIZE: Record<Mode, number> = { hidden: 0, idle: 12, link: 52, drag: 76 }

/**
 * A soft dot that trails the pointer — it swells over links and turns into a
 * "drag" handle over the shapes you can throw around. Mouse only; the native
 * cursor stays, so nothing about pointing changes.
 */
const Cursor = () => {
  const fine = useFinePointer()
  const reduce = useReducedMotion()
  const [mode, setMode] = useState<Mode>('hidden')
  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const springX = useSpring(x, { stiffness: 520, damping: 42, mass: 0.5 })
  const springY = useSpring(y, { stiffness: 520, damping: 42, mass: 0.5 })
  const enabled = fine && !reduce

  useEffect(() => {
    if (!enabled) return
    const onMove = (event: PointerEvent) => {
      x.set(event.clientX)
      y.set(event.clientY)
      const target = event.target instanceof Element ? event.target : null
      if (target?.closest('[data-cursor="drag"]')) setMode('drag')
      else if (target?.closest('a, button, input, select, textarea, label, [role="button"]')) setMode('link')
      else setMode('idle')
    }
    const onLeave = () => setMode('hidden')
    // An iframe (the live project preview) swallows pointer events, so the dot
    // would freeze at its edge. Hide it until the pointer comes back.
    const onOver = (event: PointerEvent) => {
      if (event.target instanceof HTMLIFrameElement) setMode('hidden')
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerover', onOver, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerover', onOver)
      document.documentElement.removeEventListener('pointerleave', onLeave)
    }
  }, [enabled, x, y])

  if (!enabled) return null

  const size = SIZE[mode]

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[90] mix-blend-difference"
      style={{ x: springX, y: springY }}
    >
      <motion.div
        className="flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white"
        animate={{ width: size, height: size, opacity: mode === 'hidden' ? 0 : 1 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      >
        <AnimatePresence>
          {mode === 'drag' && (
            <motion.span
              key="drag"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              className="font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-black"
            >
              Drag
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}

export default Cursor
