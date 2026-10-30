import { motion, type Variants } from 'framer-motion'
import { Link } from 'react-router-dom'
import AnimatedCounter from '../components/motion/AnimatedCounter'
import { ArrowRight, ArrowUpRight, Spark } from '../components/icons'
import { PROJECTS } from '../data/projects'
import { AI_HUB_URL, AI_TOOL_COUNT, BLOG_TOTAL_FALLBACK } from '../lib/constants'
import { easeOut, fadeUp } from '../lib/motion'

const group: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
}

const HomeHero = ({ postTotal }: { postTotal: number | null }) => {
  const stats = [
    { value: AI_TOOL_COUNT, suffix: '', label: 'AI tools in the flagship workspace' },
    { value: PROJECTS.length, suffix: '', label: 'products across the portfolio' },
    {
      value: postTotal ?? BLOG_TOTAL_FALLBACK,
      suffix: postTotal ? '' : '+',
      label: 'articles published on the blog',
    },
  ]

  return (
    <section className="hero-surface relative overflow-hidden text-paper">
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-24 h-80 w-80 rounded-full bg-blue/20 blur-3xl"
        animate={{ y: [0, 30, 0], opacity: [0.5, 0.85, 0.5] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="container-x relative grid items-center gap-16 py-20 sm:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
        <motion.div initial="hidden" animate="show" variants={group}>
          <motion.p variants={fadeUp} className="eyebrow flex items-center gap-2 text-brand">
            <Spark className="h-4 w-4" /> Independent AI studio
          </motion.p>

          <h1 className="mt-6 font-display text-[clamp(2.8rem,7vw,5.6rem)] font-semibold leading-[1.02] tracking-tight">
            <span className="block overflow-hidden pb-1">
              <motion.span
                initial={{ y: '110%' }}
                animate={{ y: '0%' }}
                transition={{ duration: 0.85, ease: easeOut, delay: 0.16 }}
                className="block"
              >
                AI products that
              </motion.span>
            </span>
            <span className="block overflow-hidden pb-1">
              <motion.span
                initial={{ y: '110%' }}
                animate={{ y: '0%' }}
                transition={{ duration: 0.85, ease: easeOut, delay: 0.28 }}
                className="block text-brand"
              >
                earn their place.
              </motion.span>
            </span>
          </h1>

          <motion.p variants={fadeUp} className="mt-6 max-w-xl text-lg leading-relaxed text-paper/65">
            Nevatal builds practical AI products, developer tools, and intelligent experiences
            designed to solve real problems.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-9 flex flex-wrap gap-3">
            <Link to="/projects" className="btn btn-primary">
              Explore the portfolio <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href={AI_HUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost-light"
            >
              Open the AI Hub <ArrowUpRight className="h-4 w-4" />
            </a>
          </motion.div>

          <motion.dl
            variants={fadeUp}
            className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-white/10 pt-6"
          >
            {stats.map((stat) => (
              <div key={stat.label}>
                <dt className="sr-only">{stat.label}</dt>
                <dd className="font-display text-3xl font-semibold text-paper">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </dd>
                <dd className="mt-1 text-[11px] leading-snug text-paper/55">{stat.label}</dd>
              </div>
            ))}
          </motion.dl>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="show"
          variants={group}
          className="w-full max-w-md lg:justify-self-end"
        >
          <div className="relative">
            <div className="absolute -inset-8 rounded-full bg-brand/10 blur-3xl" aria-hidden="true" />
            <div className="relative grid grid-cols-2 gap-3">
              <motion.a
                variants={fadeUp}
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                href={AI_HUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative col-span-2 overflow-hidden rounded-3xl bg-brand p-6 text-ink"
              >
                <div
                  className="absolute -right-12 -top-12 h-40 w-40 rounded-full border-[18px] border-ink/10"
                  aria-hidden="true"
                />
                <div className="flex items-center justify-between">
                  <span className="eyebrow">Flagship product</span>
                  <ArrowUpRight className="h-5 w-5 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </div>
                <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight">
                  Nevatal AI Hub
                </h2>
                <p className="mt-1 text-sm font-medium text-ink/70">
                  Seventeen focused tools. One key. No subscription.
                </p>
                <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/55">
                  OpenAI · Gemini · OpenRouter
                </p>
              </motion.a>

              <motion.a
                variants={fadeUp}
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                href="https://rag.nevatal.id"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition-colors hover:border-white/25"
              >
                <p className="text-[10px] uppercase tracking-[0.16em] text-paper/50">
                  Grounded retrieval
                </p>
                <h3 className="mt-2 font-display text-lg font-semibold">RAGReader</h3>
                <p className="mt-1 text-xs leading-relaxed text-paper/60">
                  Compare dense, sparse and hybrid search — then let the models vote.
                </p>
              </motion.a>

              <motion.a
                variants={fadeUp}
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                href="https://leetbug.nevatal.id"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition-colors hover:border-white/25"
              >
                <p className="text-[10px] uppercase tracking-[0.16em] text-paper/50">Practice</p>
                <h3 className="mt-2 font-display text-lg font-semibold">LeetBug</h3>
                <p className="mt-1 text-xs leading-relaxed text-paper/60">
                  Debugging challenges that grade the fix, not the answer.
                </p>
              </motion.a>

              <motion.a
                variants={fadeUp}
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                href="https://uptime.nevatal.id"
                target="_blank"
                rel="noopener noreferrer"
                className="col-span-2 flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition-colors hover:border-white/25"
              >
                <div>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-paper/50">
                    Uptime Medics
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-paper/60">
                    Rust-powered probes, public status pages, alerts that actually arrive.
                  </p>
                </div>
                <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Live
                </span>
              </motion.a>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="marquee-mask relative border-y border-white/10 bg-white/[0.02] py-3">
        <div className="marquee-track flex w-max items-center gap-8 pr-8">
          {[0, 1].map((copy) => (
            <div
              key={copy}
              className="flex items-center gap-8"
              aria-hidden={copy === 1 ? 'true' : undefined}
            >
              {PROJECTS.map((project) => (
                <span
                  key={project.slug}
                  className="whitespace-nowrap text-xs font-medium uppercase tracking-[0.18em] text-paper/40"
                >
                  {project.name}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default HomeHero
