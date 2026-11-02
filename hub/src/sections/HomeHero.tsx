import { useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion'
import RotatingBadge from '../components/decor/RotatingBadge'
import Shape, { type ShapeColor, type ShapeKind } from '../components/decor/Shape'
import ShapeField from '../components/decor/ShapeField'
import AnimatedCounter from '../components/motion/AnimatedCounter'
import Magnetic from '../components/motion/Magnetic'
import { MaskWord } from '../components/motion/SplitText'
import VelocityMarquee from '../components/motion/VelocityMarquee'
import { ArrowDown, ArrowRight, ArrowUpRight } from '../components/icons'
import { PROJECTS } from '../data/projects'
import { AI_HUB_URL, AI_TOOL_COUNT, BLOG_TOTAL_FALLBACK } from '../lib/constants'
import { useFinePointer } from '../lib/hooks'
import { cardIn, easeOut, fadeUp } from '../lib/motion'
import { scrollToSection } from '../lib/scroll'

const SEPARATORS: Array<{ kind: ShapeKind; color: ShapeColor }> = [
  { kind: 'sparkle', color: 'sun' },
  { kind: 'circle', color: 'cobalt' },
  { kind: 'flower', color: 'plum' },
  { kind: 'square', color: 'sun' },
  { kind: 'half', color: 'cobalt' },
  { kind: 'burst', color: 'plum' },
]

const group = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.45 } },
}

/** A product screenshot cut into a shape, which tilts towards the pointer. */
const ShapeCard = ({
  href,
  slug,
  name,
  tagline,
  frame,
  className = '',
  imageClassName = 'aspect-square',
  progress,
  depth,
  chip,
  tint = false,
  eager = false,
}: {
  href: string
  slug: string
  name: string
  tagline: string
  frame: string
  className?: string
  imageClassName?: string
  progress: MotionValue<number>
  depth: number
  chip?: string
  /** Print the screenshot in yellow until hovered, so a pale UI still shows its shape. */
  tint?: boolean
  eager?: boolean
}) => {
  const fine = useFinePointer()
  const reduce = useReducedMotion()
  const tiltX = useMotionValue(0)
  const tiltY = useMotionValue(0)
  const rotateX = useSpring(tiltX, { stiffness: 200, damping: 18 })
  const rotateY = useSpring(tiltY, { stiffness: 200, damping: 18 })
  const y = useTransform(progress, [0, 1], [0, depth])
  const tilts = fine && !reduce

  return (
    <motion.div variants={cardIn} className={className}>
      <motion.a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="group block"
        style={{ y: reduce ? 0 : y, rotateX, rotateY, transformPerspective: 900 }}
        onPointerMove={(event) => {
          if (!tilts) return
          const box = event.currentTarget.getBoundingClientRect()
          tiltY.set(((event.clientX - box.left) / box.width - 0.5) * 12)
          tiltX.set(-((event.clientY - box.top) / box.height - 0.5) * 12)
        }}
        onPointerLeave={() => {
          tiltX.set(0)
          tiltY.set(0)
        }}
      >
        <div className={`relative overflow-hidden bg-paper-2 ${frame} ${imageClassName}`}>
          <img
            src={`/previews/${slug}.jpg`}
            alt={`${name} interface`}
            width={1280}
            height={800}
            loading={eager ? 'eager' : 'lazy'}
            fetchPriority={eager ? 'high' : undefined}
            decoding="async"
            className="h-full w-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.07]"
          />
          {tint && (
            <span
              aria-hidden="true"
              className="absolute inset-0 bg-sun mix-blend-multiply transition-opacity duration-500 group-hover:opacity-0"
            />
          )}
          <span className="absolute right-3 top-3 grid h-9 w-9 scale-0 place-items-center rounded-full bg-sun text-ink transition-transform duration-300 group-hover:scale-100">
            <ArrowUpRight className="h-4 w-4" />
          </span>
          {chip && (
            <span className="absolute bottom-4 left-4 rounded-full bg-paper px-3 py-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-ink shadow-[0_8px_24px_-12px_rgba(11,11,13,0.5)]">
              {chip}
            </span>
          )}
        </div>
        <p className="mt-3 text-sm font-semibold tracking-[-0.01em]">{name}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-ink/60">{tagline}</p>
      </motion.a>
    </motion.div>
  )
}

const HomeHero = ({ postTotal }: { postTotal: number | null }) => {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const titleY = useTransform(scrollYProgress, [0, 1], ['0%', '38%'])

  const stats = [
    { value: AI_TOOL_COUNT, suffix: '', label: 'AI tools in the flagship workspace', shape: 'sparkle' as const, color: 'sun' as const },
    { value: PROJECTS.length, suffix: '', label: 'products across the portfolio', shape: 'circle' as const, color: 'cobalt' as const },
    {
      value: postTotal ?? BLOG_TOTAL_FALLBACK,
      suffix: postTotal ? '' : '+',
      label: 'articles published on the blog',
      shape: 'flower' as const,
      color: 'plum' as const,
    },
  ]

  return (
    <section ref={ref} className="relative overflow-clip bg-paper">
      <ShapeField seed="hero" count={8} mobileCount={3} sizes={[46, 124]} />

      <div className="container-x relative pt-12 sm:pt-16 lg:pt-20">
        <div className="flex items-center justify-between gap-4">
          <motion.p
            className="eyebrow text-ink"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: easeOut }}
          >
            <Shape kind="sparkle" color="sun" className="h-4 w-4" /> Independent AI studio
          </motion.p>
          <motion.button
            type="button"
            onClick={() => scrollToSection('studio')}
            whileTap={{ scale: 0.95 }}
            className="eyebrow rounded-full border border-ink/15 px-3 py-2 text-ink/75 transition-colors hover:border-ink hover:bg-ink hover:text-paper"
            aria-label="Scroll to studio section"
          >
            <span>Explore studio</span>
            <ArrowDown className="h-3.5 w-3.5" />
          </motion.button>
        </div>

        <motion.h1
          style={{ y: reduce ? 0 : titleY }}
          className="mt-8 font-display text-[clamp(3rem,8.6vw,8rem)] font-semibold leading-[0.92] tracking-[-0.055em]"
        >
          <span className="sr-only">AI products that earn their place.</span>
          <span aria-hidden="true" className="block">
            <MaskWord delay={0.1}>AI</MaskWord> <MaskWord delay={0.17}>products</MaskWord>{' '}
            <MaskWord delay={0.24}>that</MaskWord>
          </span>
          <span aria-hidden="true" className="block">
            <MaskWord delay={0.31}>earn</MaskWord> <MaskWord delay={0.38}>their</MaskWord>{' '}
            <span className="relative isolate inline-block">
              <motion.span
                className="absolute -inset-x-[0.06em] bottom-[0.04em] top-[0.2em] -z-10 origin-left rounded-[0.18em] bg-sun"
                initial={reduce ? false : { scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.95, duration: 0.8, ease: easeOut }}
              />
              <MaskWord delay={0.45} className="pr-[0.06em] font-serif font-normal italic tracking-[-0.02em]">
                place.
              </MaskWord>
            </span>
          </span>
        </motion.h1>

        <div className="mt-12 grid gap-14 pb-16 lg:mt-16 lg:grid-cols-[0.92fr_1.08fr] lg:items-start lg:gap-12">
          <motion.div initial="hidden" animate="show" variants={group}>
            <motion.p variants={fadeUp} className="max-w-md text-lg leading-relaxed text-ink/65 sm:text-xl">
              Nevatal builds practical AI products, developer tools, and intelligent experiences
              designed to solve real problems.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-9 flex flex-wrap items-center gap-3">
              <Magnetic>
                <Link to="/projects" className="btn btn-ink">
                  Explore the portfolio <ArrowRight className="h-4 w-4" />
                </Link>
              </Magnetic>
              <Magnetic>
                <a href={AI_HUB_URL} target="_blank" rel="noopener noreferrer" className="btn btn-line">
                  Open the AI Hub <ArrowUpRight className="h-4 w-4" />
                </a>
              </Magnetic>
              <Magnetic>
                <button
                  type="button"
                  onClick={() => scrollToSection('ecosystem')}
                  className="btn btn-line"
                >
                  View ecosystem <ArrowDown className="h-4 w-4" />
                </button>
              </Magnetic>
            </motion.div>

            <motion.dl variants={fadeUp} className="mt-14 grid max-w-lg grid-cols-3 border-t border-ink/10">
              {stats.map((stat, index) => (
                <div key={stat.label} className={`pt-6 ${index > 0 ? 'border-l border-ink/10 pl-5' : 'pr-5'}`}>
                  <dt className="sr-only">{stat.label}</dt>
                  <dd className="flex items-center gap-2 font-display text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                    <Shape kind={stat.shape} color={stat.color} className="h-4 w-4 flex-none" />
                  </dd>
                  <dd className="mt-2 text-xs leading-snug text-ink/60">{stat.label}</dd>
                </div>
              ))}
            </motion.dl>

            <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-ink/50">Jump to:</span>
              {[
                { id: 'studio', label: 'Studio' },
                { id: 'ecosystem', label: 'Ecosystem' },
                { id: 'ai-hub', label: 'AI Hub' },
                { id: 'applied-ai', label: 'Applied AI' },
                { id: 'engineering', label: 'Stack' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => scrollToSection(item.id)}
                  className="flex items-center gap-1 rounded-full border border-ink/10 bg-paper-2 px-2.5 py-1 font-mono text-[11px] text-ink/70 transition-colors hover:border-ink hover:text-ink"
                >
                  <span>{item.label}</span>
                  <ArrowDown className="h-3 w-3 opacity-60" />
                </button>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="show"
            variants={group}
            className="relative grid grid-cols-6 gap-x-4 gap-y-6"
          >
            <RotatingBadge
              text="Independent AI studio • Nevatal • "
              className="absolute -left-10 -top-12 z-10 hidden h-32 w-32 text-ink lg:block"
            />
            <ShapeCard
              href={AI_HUB_URL}
              slug="ai-hub"
              name="Nevatal AI Hub"
              chip="Flagship · chat.nevatal.id"
              tagline="Seventeen focused tools. One key. No subscription."
              frame="rounded-b-[28px] rounded-t-[999px]"
              imageClassName="aspect-[4/5] sm:aspect-[3/4]"
              className="col-span-6 sm:col-span-4 sm:row-span-2"
              progress={scrollYProgress}
              depth={-40}
              eager
            />
            <ShapeCard
              href="https://rag.nevatal.id"
              slug="ragreader"
              tint
              name="RAGReader"
              tagline="Dense, sparse and hybrid search — then the models vote."
              frame="rounded-full"
              className="col-span-3 sm:col-span-2"
              progress={scrollYProgress}
              depth={-110}
              eager
            />
            <ShapeCard
              href="https://leetbug.nevatal.id"
              slug="leetbug"
              tint
              name="LeetBug"
              tagline="Debugging challenges that grade the fix, not the answer."
              frame="rounded-[38%]"
              className="col-span-3 sm:col-span-2"
              progress={scrollYProgress}
              depth={-70}
              eager
            />
            <motion.a
              variants={cardIn}
              href="https://uptime.nevatal.id"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.015 }}
              className="col-span-6 flex items-center justify-between gap-4 rounded-full bg-sun py-3 pl-6 pr-3"
            >
              <span className="min-w-0">
                <span className="block font-mono text-[10px] font-medium uppercase tracking-[0.18em]">
                  Uptime Medics
                </span>
                <span className="mt-0.5 block truncate text-sm text-ink/80">
                  Rust-powered probes, public status pages, alerts that actually arrive.
                </span>
              </span>
              <span className="flex flex-none items-center gap-1.5 rounded-full bg-paper px-3 py-2 font-mono text-[10px] font-medium uppercase tracking-[0.14em]">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500/60" />
                  <span className="relative h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                Live
              </span>
            </motion.a>
          </motion.div>
        </div>
      </div>

      <div className="relative border-y border-ink/10 bg-paper py-5">
        <VelocityMarquee baseVelocity={-2}>
          {PROJECTS.map((project, index) => {
            const separator = SEPARATORS[index % SEPARATORS.length]
            return (
              <span key={project.slug} className="flex items-center">
                <span className="whitespace-nowrap px-6 font-display text-[clamp(1.6rem,3.6vw,3rem)] font-semibold tracking-[-0.04em]">
                  {project.name}
                </span>
                <Shape kind={separator.kind} color={separator.color} className="h-7 w-7 flex-none sm:h-9 sm:w-9" />
              </span>
            )
          })}
        </VelocityMarquee>
      </div>
    </section>
  )
}

export default HomeHero
