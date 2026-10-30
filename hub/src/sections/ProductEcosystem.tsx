import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import AbstractShape from '../components/decor/AbstractShape'
import Reveal from '../components/motion/Reveal'
import { ArrowUpRight } from '../components/icons'
import { PROJECTS, type Project } from '../data/projects'
import { spring } from '../lib/motion'

const ECOSYSTEM_SLUGS = ['ai-hub', 'ragreader', 'leetbug', 'uptime-medics', 'decalove']

const ECOSYSTEM = ECOSYSTEM_SLUGS.map((slug) =>
  PROJECTS.find((project) => project.slug === slug)
).filter((project): project is Project => Boolean(project))

const ProductEcosystem = () => {
  const [activeSlug, setActiveSlug] = useState(ECOSYSTEM[0].slug)
  const active = ECOSYSTEM.find((project) => project.slug === activeSlug) ?? ECOSYSTEM[0]

  return (
    <section className="relative overflow-hidden border-t border-white/5 bg-[#0B0D10] py-24 text-paper sm:py-32">
      <AbstractShape shape="triangle-outline" tone="brand" className="-right-16 top-8 h-56 w-56" />
      <AbstractShape
        shape="square"
        tone="light"
        rotate={false}
        className="-left-10 bottom-12 hidden h-24 w-24 md:block"
      />
      <div className="container-x relative grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <div>
          <Reveal>
            <p className="eyebrow text-brand">The ecosystem</p>
            <h2 className="mt-4 font-display text-[clamp(2.2rem,4.5vw,3.5rem)] font-semibold leading-[1.05] tracking-tight">
              One ecosystem. Many ways in.
            </h2>
            <p className="mt-5 max-w-md leading-relaxed text-paper/60">
              Different products, one standard: real interfaces, real data, and something you can
              open and use right now.
            </p>
          </Reveal>

          <div className="mt-8 space-y-1">
            {ECOSYSTEM.map((project) => {
              const isActive = project.slug === activeSlug
              return (
                <button
                  key={project.slug}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setActiveSlug(project.slug)}
                  className={`relative w-full rounded-xl px-3 py-3 text-left transition-colors ${
                    isActive ? 'text-paper' : 'text-paper/55 hover:text-paper'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="ecosystem-active"
                      className="absolute inset-0 rounded-xl border border-white/10 bg-white/[0.05]"
                      transition={spring}
                    />
                  )}
                  <span className="relative z-10 flex items-center justify-between gap-3">
                    <span>
                      <span className="block text-sm font-semibold">{project.name}</span>
                      <span className="mt-0.5 block text-[10px] uppercase tracking-[0.14em] text-paper/40">
                        {project.category}
                      </span>
                    </span>
                    <ArrowUpRight
                      className={`h-4 w-4 transition ${isActive ? 'text-brand' : 'text-paper/20'}`}
                    />
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <Reveal delay={0.08}>
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#0F1216] shadow-[0_30px_100px_-50px_rgba(0,0,0,0.9)]">
            <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
              <span className="flex gap-1.5" aria-hidden="true">
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
              </span>
              <span className="truncate rounded-full bg-white/5 px-3 py-0.5 text-[10px] text-paper/40">
                {active.url ? new URL(active.url).hostname : 'internal'}
              </span>
              <span className="ml-auto flex flex-none items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Live
              </span>
            </div>

            <div className="relative aspect-[16/10] overflow-hidden bg-[#141820]">
              <AnimatePresence mode="wait" initial={false}>
                <motion.img
                  key={active.slug}
                  src={`/previews/${active.slug}.jpg`}
                  alt={`${active.name} interface`}
                  width={1280}
                  height={800}
                  loading="lazy"
                  decoding="async"
                  initial={{ opacity: 0, scale: 1.02 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="h-full w-full object-cover object-top"
                />
              </AnimatePresence>
            </div>

            <div className="flex flex-col gap-4 border-t border-white/10 p-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand">
                  {active.category}
                </p>
                <h3 className="mt-1 font-display text-xl font-semibold">{active.name}</h3>
                <p className="mt-1 max-w-md text-sm leading-relaxed text-paper/55">
                  {active.tagline}
                </p>
              </div>
              {active.url && (
                <a
                  href={active.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary flex-none"
                >
                  Open {active.name} <ArrowUpRight className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

export default ProductEcosystem