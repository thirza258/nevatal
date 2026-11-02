import { useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import Shape from '../components/decor/Shape'
import ShapeField from '../components/decor/ShapeField'
import { useFinePointer } from '../lib/hooks'
import { easeOut, springPop } from '../lib/motion'
import { usePageMeta } from '../lib/seo'

const NotFoundPage = () => {
  const { pathname } = useLocation()
  const stage = useRef<HTMLDivElement>(null)
  const fine = useFinePointer()

  usePageMeta({
    title: 'Page not found — Nevatal',
    description: 'This page could not be found. Explore the Nevatal portfolio or read the blog.',
    path: pathname,
    noindex: true,
  })

  return (
    <section className="relative flex min-h-[78vh] items-center overflow-clip bg-paper">
      <ShapeField seed="not-found" count={7} mobileCount={3} sizes={[44, 120]} />
      <div className="container-x relative py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="sr-only">404</p>
          <div
            ref={stage}
            aria-hidden="true"
            className="mx-auto flex items-center justify-center gap-2 font-display text-[clamp(7rem,24vw,15rem)] font-semibold leading-none tracking-[-0.06em]"
          >
            <motion.span initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, ease: easeOut }}>
              4
            </motion.span>
            {/* The zero is a loose ring: pick it up and throw it. */}
            <motion.span
              data-cursor={fine ? 'drag' : undefined}
              drag={fine}
              dragConstraints={stage}
              dragElastic={0.6}
              dragTransition={{ bounceStiffness: 200, bounceDamping: 9 }}
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ ...springPop, delay: 0.2 }}
              whileHover={fine ? { rotate: 20, scale: 1.06 } : undefined}
              whileDrag={{ scale: 1.15 }}
              className={`block h-[0.72em] w-[0.72em] ${fine ? 'cursor-grab touch-none active:cursor-grabbing' : ''}`}
            >
              <Shape kind="ring" color="sun" className="h-full w-full" />
            </motion.span>
            <motion.span initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, ease: easeOut, delay: 0.1 }}>
              4
            </motion.span>
          </div>
          <h1 className="mt-6 font-display text-[clamp(2rem,4.6vw,3.4rem)] font-semibold leading-[1.02] tracking-[-0.04em]">
            This page hasn&apos;t been built yet.
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-lg text-ink/65">
            The link may be old, or the page may have moved. The portfolio and the writing archive
            are both one click away.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link to="/" className="btn btn-ink">
              Back home
            </Link>
            <Link to="/projects" className="btn btn-line">
              See the projects
            </Link>
            <Link to="/blog" className="btn btn-line">
              Read the blog
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default NotFoundPage
