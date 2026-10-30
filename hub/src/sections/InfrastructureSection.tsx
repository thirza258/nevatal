import { useState } from 'react'
import { motion } from 'framer-motion'
import Reveal from '../components/motion/Reveal'
import { ArrowUpRight } from '../components/icons'
import { spring } from '../lib/motion'

const COMPONENTS = [
  {
    id: 'edge',
    label: 'Edge & delivery',
    tech: 'Cloudflare Tunnel',
    detail:
      'Public hostnames terminate at the edge and tunnel back to services on hardware we control — no inbound ports for each app.',
    link: { label: 'Uptime Medics', href: 'https://uptime.nevatal.id' },
  },
  {
    id: 'apps',
    label: 'Web applications',
    tech: 'React 19 · Vite',
    detail:
      'Static and server-backed frontends built as small, focused products rather than one monolith.',
    link: { label: 'The portfolio', href: 'https://nevatal.id/projects' },
  },
  {
    id: 'services',
    label: 'Services & APIs',
    tech: 'Django · FastAPI',
    detail:
      'Typed API surfaces, background queues and provider routing, with tests that run without an external model.',
    link: { label: 'Recommendica', href: 'https://recommendica.nevatal.id' },
  },
  {
    id: 'data',
    label: 'Data & retrieval',
    tech: 'Postgres · Redis · Chroma',
    detail:
      'Relational records, queues and rate limits, plus vector stores for retrieval projects that need them.',
    link: { label: 'CRAG MultiHop', href: 'https://crag.nevatal.id' },
  },
  {
    id: 'jobs',
    label: 'Background work',
    tech: 'Workers · FFmpeg',
    detail:
      'Long-running work leaves the request path: transcoding, batch runs and leased queues that survive restarts.',
    link: { label: 'VideoTex', href: 'https://video.nevatal.id' },
  },
  {
    id: 'observability',
    label: 'Observability',
    tech: 'Probes · alerts · status pages',
    detail:
      'Second-level probes, public status pages and alerts that fire after consecutive failures instead of noise.',
    link: { label: 'Uptime Medics', href: 'https://uptime.nevatal.id' },
  },
]

const InfrastructureSection = () => {
  const [activeId, setActiveId] = useState('services')
  const active = COMPONENTS.find((component) => component.id === activeId) ?? COMPONENTS[0]

  return (
    <section className="border-t border-white/5 bg-ink py-20 text-paper sm:py-28">
      <div className="container-x">
        <Reveal>
          <p className="eyebrow text-brand">Infrastructure</p>
          <h2 className="mt-4 max-w-2xl font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            The systems behind the experience.
          </h2>
          <p className="mt-4 max-w-2xl leading-relaxed text-paper/55">
            Deployment, queues, data and observability — the operational layer that keeps the
            portfolio running after the launch post.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <Reveal delay={0.06}>
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0F1216] p-5">
              <div className="grid gap-2 sm:grid-cols-2">
                {COMPONENTS.map((component) => {
                  const isActive = component.id === activeId
                  return (
                    <button
                      key={component.id}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => setActiveId(component.id)}
                      className={`relative rounded-xl border p-3 text-left transition-colors ${
                        isActive
                          ? 'border-brand/50 text-paper'
                          : 'border-white/10 text-paper/55 hover:border-white/25 hover:text-paper'
                      }`}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="infra-active"
                          className="absolute inset-0 rounded-xl bg-brand/10"
                          transition={spring}
                        />
                      )}
                      <span className="relative z-10 block text-[10px] font-semibold uppercase tracking-[0.14em] text-paper/35">
                        {component.tech}
                      </span>
                      <span className="relative z-10 mt-1 block text-sm font-semibold">
                        {component.label}
                      </span>
                    </button>
                  )
                })}
              </div>
              <p className="mt-3 text-[10px] leading-relaxed text-paper/30">
                Conceptual view across the portfolio — individual projects use different subsets.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <motion.div
              key={active.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="rounded-2xl border border-white/10 bg-[#0F1216] p-5"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand">
                {active.tech}
              </p>
              <h3 className="mt-2 font-display text-lg font-semibold">{active.label}</h3>
              <p className="mt-2 text-sm leading-relaxed text-paper/55">{active.detail}</p>
              <a
                href={active.link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-paper/60 underline underline-offset-4 hover:text-brand"
              >
                See it in {active.link.label} <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </motion.div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

export default InfrastructureSection