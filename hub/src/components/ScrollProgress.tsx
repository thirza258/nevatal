import { motion, useScroll, useSpring } from 'framer-motion'

/** A hairline across the top of the window that fills as the page is read. */
const ScrollProgress = () => {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 160, damping: 30, restDelta: 0.001 })

  return (
    <motion.div
      aria-hidden="true"
      className="fixed inset-x-0 top-0 z-[70] h-[3px] origin-left bg-cobalt"
      style={{ scaleX }}
    />
  )
}

export default ScrollProgress
