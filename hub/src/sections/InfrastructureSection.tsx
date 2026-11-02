import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import MorphSection from '../components/decor/MorphSection'
import Shape, { type ShapeKind } from '../components/decor/Shape'
import ShapeField from '../components/decor/ShapeField'
import Heading from '../components/motion/Heading'
import Reveal from '../components/motion/Reveal'
import { ArrowUpRight } from '../components/icons'
import { spring } from '../lib/motion'

const COMPONENTS: Array<{
  id: string
  label: string
  tech: string
  detail: string
  link: { label: string; href: string }
  shape: ShapeKind
}> = [
  {
    id: 'edge',
    label: 'Edge & delivery',
    tech: 'Cloudflare Tunnel',
    detail:
      'Public hostnames terminate at the edge and tunnel back to services on hardware we control — no inbound ports for each app.',
    link: { label: 'Uptime Medics', href: 'https://uptime.nevatal.id' },
    shape: 'arch',
  },
  {
    id: 'apps',
    label: 'Web applications',
    tech: 'React 19 · Vite',
    detail:
      'Static and server-backed frontends built as small, focused products rather than one monolith.',
    link: { label: 'The portfolio', href: 'https://nevatal.id/projects' },
    shape: 'circle',
  },
  {
    id: 'services',
    label: 'Services & APIs',
    tech: 'Django · FastAPI',
    detail:
      'Typed API surfaces, background queues and provider routing, with tests that run without an external model.',
    link: { label: 'Recommendica', href: 'https://recommendica.nevatal.id' },
    shape: 'square',
  },
  {
    id: 'data',
    label: 'Data & retrieval',
    tech: 'Postgres · Redis · Chroma',
    detail:
      'Relational records, queues and rate limits, plus vector stores for retrieval projects that need them.',
    link: { label: 'CRAG MultiHop', href: 'https://crag.nevatal.id' },
    shape: 'dots',
  },
  {
    id: 'jobs',
    label: 'Background work',
    tech: 'Workers · FFmpeg',
    detail:
      'Long-running work leaves the request path: transcoding, batch runs and leased queues that survive restarts.',
    link: { label: 'VideoTex', href: 'https://video.nevatal.id' },
    shape: 'flower',
  },
  {
    id: 'observability',
    label: 'Observability',
    tech: 'Probes · alerts · status pages',
    detail:
      'Second-level probes, public status pages and alerts that fire after consecutive failures instead of noise.',
    link: { label: 'Uptime Medics', href: 'https://uptime.nevatal.id' },
    shape: 'burst',
  },
]

const InfrastructureSection = () => {
  const [activeId, setActiveId] = useState('services')
  const active = COMPONENTS.find((component) => component.id === activeId) ?? COMPONENTS[0]

  return (
    <MorphSection morph="blob" className="py-28 sm:py-36">
      <ShapeField seed="infrastructure" tone="sun" count={5} mobileCount={2} sizes={[40, 96]} />
      <div className="container-x relative">
        <Reveal>
          <p className="eyebrow text-ink">
            <Shape kind="dots" color="ink" className="h-3.5 w-3.5" /> Infrastructure
          </p>
          <Heading
            text="The systems behind the experience."
            accent="experience."
            className="h-section mt-6 max-w-4xl"
          />
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink/80">
            Deployment, queues, data and observability — the operational layer that keeps the
            portfolio running after the launch post.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <Reveal delay={0.06}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {COMPONENTS.map((component) => {
                const isActive = component.id === activeId
                return (
                  <button
                    key={component.id}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setActiveId(component.id)}
                    className={`group relative flex min-h-[150px] flex-col justify-between rounded-[26px] border p-4 text-left transition-colors ${
                      isActive ? 'border-ink' : 'border-ink/20 hover:border-ink'
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="infra-active"
                        className="absolute inset-0 rounded-[26px] bg-paper"
                        transition={spring}
                      />
                    )}
                    <motion.span
                      className="relative block h-9 w-9"
                      animate={{ rotate: isActive ? 180 : 0, scale: isActive ? 1.1 : 1 }}
                      transition={spring}
                    >
                      <Shape
                        kind={component.shape}
                        color={isActive ? 'cobalt' : 'ink'}
                        className="h-full w-full"
                      />
                    </motion.span>
                    <span className="relative">
                      <span className="block font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-ink/75">
                        {component.tech}
                      </span>
                      <span className="mt-1 block font-semibold tracking-[-0.01em]">{component.label}</span>
                    </span>
                  </button>
                )
              })}
            </div>
            <p className="mt-4 font-mono text-[11px] text-ink/75">
              Conceptual view across the portfolio — individual projects use different subsets.
            </p>
          </Reveal>

          <Reveal delay={0.12}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={active.id}
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="relative overflow-hidden rounded-[32px] bg-paper p-7 text-ink shadow-[0_40px_90px_-50px_rgba(11,11,13,0.55)]"
              >
                <Shape
                  kind={active.shape}
                  color="sun"
                  className="pointer-events-none absolute -bottom-12 -right-12 h-44 w-44 opacity-90"
                />
                <p className="relative font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-ink/60">
                  {active.tech}
                </p>
                <h3 className="relative mt-3 font-display text-3xl font-semibold tracking-[-0.035em]">
                  {active.label}
                </h3>
                <p className="relative mt-4 max-w-sm leading-relaxed text-ink/75">{active.detail}</p>
                <a
                  href={active.link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ink relative mt-8 !py-2.5"
                >
                  See it in {active.link.label} <ArrowUpRight className="h-4 w-4" />
                </a>
              </motion.div>
            </AnimatePresence>
          </Reveal>
        </div>
      </div>
    </MorphSection>
  )
}

export default InfrastructureSection
