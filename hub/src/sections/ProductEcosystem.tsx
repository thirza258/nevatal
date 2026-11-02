import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import MorphSection from '../components/decor/MorphSection'
import Shape from '../components/decor/Shape'
import ShapeField from '../components/decor/ShapeField'
import Heading from '../components/motion/Heading'
import Magnetic from '../components/motion/Magnetic'
import Reveal from '../components/motion/Reveal'
import { ArrowDown, ArrowRight, ArrowUpRight, Pause, Play } from '../components/icons'
import { LIVE_PROJECTS } from '../data/projects'
import { CATEGORY_SHAPE, hostOf } from '../lib/categories'
import { useInViewport } from '../lib/inview'
import { easeOut, spring } from '../lib/motion'
import { shuffle } from '../lib/random'
import { scrollToSection } from '../lib/scroll'

const AUTO_ADVANCE_MS = 5200

/**
 * Every live project, dealt in a fresh order on each visit. The preview walks
 * through the deck on its own while the section is on screen; picking a
 * project hands control to the visitor, and Shuffle deals again.
 */
const ProductEcosystem = () => {
  const [deck] = useState(() => shuffle(LIVE_PROJECTS))
  const [activeSlug, setActiveSlug] = useState(() => deck[0].slug)
  const [autoplay, setAutoplay] = useState(true)
  const [paused, setPaused] = useState(false)
  const stageRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const onScreen = useInViewport(stageRef, { margin: '-15% 0px' })
  const reduce = useReducedMotion()

  const index = Math.max(0, deck.findIndex((project) => project.slug === activeSlug))
  const active = deck[index]
  const running = autoplay && !paused && onScreen && !reduce

  useEffect(() => {
    if (!running) return
    const timer = window.setTimeout(() => {
      setActiveSlug(deck[(index + 1) % deck.length].slug)
    }, AUTO_ADVANCE_MS)
    return () => window.clearTimeout(timer)
  }, [running, index, deck])

  // Under `lg` the projects sit in one scrolling row; keep the current one in view.
  useEffect(() => {
    const list = listRef.current
    if (!list || list.scrollWidth <= list.clientWidth) return
    const chip = list.querySelector<HTMLElement>(`[data-slug="${active.slug}"]`)
    if (!chip) return
    list.scrollTo({
      left: chip.offsetLeft - (list.clientWidth - chip.offsetWidth) / 2,
      behavior: reduce ? 'auto' : 'smooth',
    })
  }, [active.slug, reduce])

  const pick = (slug: string) => {
    setActiveSlug(slug)
    setAutoplay(false)
  }

  return (
    <MorphSection morph="sparkle" id="ecosystem" className="py-28 sm:py-36">
      <ShapeField seed="ecosystem" tone="sun" count={5} mobileCount={2} sizes={[40, 96]} />
      <div className="container-x relative">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <Reveal>
            <p className="eyebrow text-ink">
              <Shape kind="burst" color="paper" className="h-3.5 w-3.5" /> The ecosystem
            </p>
            <Heading
              text="One ecosystem. Many ways in."
              accent="Many ways in."
              className="h-section mt-6 max-w-3xl"
            />
            <p className="mt-6 max-w-md text-lg leading-relaxed text-ink/80">
              Different products, one standard: real interfaces, real data, and something you can
              open and use right now.
            </p>
          </Reveal>
          <Reveal delay={0.1} className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink/80">
              All {deck.length} live products
            </span>
            <button
              type="button"
              onClick={() => scrollToSection('ai-hub')}
              className="btn btn-ink !px-4"
            >
              Next: AI Workspace <ArrowDown className="h-4 w-4" />
            </button>
          </Reveal>
        </div>

        <div
          ref={stageRef}
          className="mt-14 grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
        >
          <motion.ul
            ref={listRef}
            layout
            className="no-scrollbar relative -mx-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:-mx-8 sm:px-8 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0"
            aria-label="Projects in the ecosystem"
          >
            {deck.map((project) => {
              const isActive = project.slug === active.slug
              const glyph = CATEGORY_SHAPE[project.category]
              return (
                <motion.li key={project.slug} data-slug={project.slug} layout transition={spring} className="flex-none">
                  <button
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => pick(project.slug)}
                    className={`relative flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${
                      isActive ? 'text-paper' : 'bg-paper text-ink hover:bg-sun-soft'
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="ecosystem-active"
                        className="absolute inset-0 rounded-full bg-ink"
                        transition={spring}
                      />
                    )}
                    <Shape
                      kind={glyph.kind}
                      color={isActive && glyph.color === 'ink' ? 'paper' : glyph.color}
                      className="relative h-3.5 w-3.5"
                    />
                    <span className="relative">{project.name}</span>
                  </button>
                </motion.li>
              )
            })}
          </motion.ul>

          <div className="overflow-hidden rounded-[32px] bg-paper shadow-[0_40px_90px_-50px_rgba(11,11,13,0.55)]">
            <div className="flex items-center gap-3 px-5 py-4">
              <span className="truncate rounded-full bg-paper-2 px-3 py-1 font-mono text-[11px] text-ink/70">
                {active.url ? hostOf(active.url) : 'internal'}
              </span>
              <span className="ml-auto flex flex-none items-center gap-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Live
              </span>
              <span className="flex-none font-mono text-[11px] tabular-nums text-ink/60">
                {String(index + 1).padStart(2, '0')} / {deck.length}
              </span>
              <button
                type="button"
                onClick={() => setAutoplay((value) => !value)}
                aria-label={autoplay ? 'Pause the project slideshow' : 'Play the project slideshow'}
                className="grid h-8 w-8 flex-none place-items-center rounded-full border border-ink/15 text-ink transition-colors hover:border-ink hover:bg-ink hover:text-paper"
              >
                {autoplay ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              </button>
            </div>

            <div className="relative mx-3 aspect-[16/10] overflow-hidden rounded-[22px] bg-paper-2">
              <AnimatePresence initial={false}>
                <motion.img
                  key={active.slug}
                  src={`/previews/${active.slug}.jpg`}
                  alt={`${active.name} interface`}
                  width={1280}
                  height={800}
                  loading="lazy"
                  decoding="async"
                  initial={{ clipPath: 'circle(0% at 50% 50%)', zIndex: 1 }}
                  animate={{ clipPath: 'circle(75% at 50% 50%)', zIndex: 1 }}
                  exit={{ zIndex: 0, transition: { duration: 0.7 } }}
                  transition={{ duration: 0.7, ease: easeOut }}
                  className="absolute inset-0 h-full w-full object-cover object-top"
                />
              </AnimatePresence>
              {running && (
                <motion.span
                  key={`${active.slug}-timer`}
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 z-10 h-1 origin-left bg-sun"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: AUTO_ADVANCE_MS / 1000, ease: 'linear' }}
                />
              )}
            </div>

            <div className="flex flex-col gap-5 p-6">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={active.slug}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="min-w-0"
                  // Announce picks the visitor makes, not the autoplay every five seconds.
                  aria-live={autoplay ? 'off' : 'polite'}
                >
                  <p className="flex items-center gap-2 font-mono text-[10.5px] font-medium uppercase tracking-[0.16em] text-ink/60">
                    <Shape
                      kind={CATEGORY_SHAPE[active.category].kind}
                      color={CATEGORY_SHAPE[active.category].color}
                      className="h-3 w-3"
                    />
                    {active.category}
                  </p>
                  <h3 className="mt-2 font-display text-2xl font-semibold tracking-[-0.03em]">
                    {active.name}
                  </h3>
                  <p className="mt-1 max-w-md text-sm leading-relaxed text-ink/65">{active.tagline}</p>
                </motion.div>
              </AnimatePresence>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => pick(deck[(index + 1) % deck.length].slug)}
                  className="btn btn-line !px-4"
                  aria-label="Show the next project"
                >
                  Next <ArrowRight className="h-4 w-4" />
                </button>
                {active.url && (
                  <Magnetic>
                    <a href={active.url} target="_blank" rel="noopener noreferrer" className="btn btn-ink">
                      Open {active.name} <ArrowUpRight className="h-4 w-4" />
                    </a>
                  </Magnetic>
                )}
                <button
                  type="button"
                  onClick={() => scrollToSection('ai-hub')}
                  className="btn btn-line !px-4"
                >
                  AI workspace <ArrowDown className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MorphSection>
  )
}

export default ProductEcosystem
