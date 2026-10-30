import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Reveal from '../components/motion/Reveal'
import { ArrowRight, ArrowUpRight } from '../components/icons'
import { spring } from '../lib/motion'

interface CapabilityLink {
  label: string
  href: string
  internal?: boolean
}

interface Capability {
  id: string
  number: string
  title: string
  body: string
  links: CapabilityLink[]
}

const CAPABILITIES: Capability[] = [
  {
    id: 'ai',
    number: '01',
    title: 'Applied AI',
    body: 'Retrieval, LLM integration, evaluation and intelligent applications designed around a real task — grounded, observable and honest about its sources.',
    links: [
      { label: 'RAGReader', href: 'https://rag.nevatal.id' },
      { label: 'Recommendica', href: 'https://recommendica.nevatal.id' },
    ],
  },
  {
    id: 'product',
    number: '02',
    title: 'Product engineering',
    body: 'Frontend interfaces, backend APIs, data systems and integrations — shipped as complete products rather than prototypes.',
    links: [{ label: 'The portfolio', href: '/projects', internal: true }],
  },
  {
    id: 'learning',
    number: '03',
    title: 'Learning experiences',
    body: 'Interactive education, programming labs and technical resources that stay useful without an API key.',
    links: [
      { label: 'LeetBug', href: 'https://leetbug.nevatal.id' },
      { label: 'Gemini Japanese', href: 'https://hira.nevatal.id' },
    ],
  },
  {
    id: 'infrastructure',
    number: '04',
    title: 'Infrastructure',
    body: 'Deployment, automation, observability and self-hosted systems that keep independent projects online.',
    links: [
      { label: 'Uptime Medics', href: 'https://uptime.nevatal.id' },
      { label: 'VideoTex', href: 'https://video.nevatal.id' },
    ],
  },
]

const CapabilitiesSection = () => {
  const [activeId, setActiveId] = useState(CAPABILITIES[0].id)
  const active = CAPABILITIES.find((capability) => capability.id === activeId) ?? CAPABILITIES[0]

  return (
    <section className="bg-paper-2/40 py-20 sm:py-28">
      <div className="container-x grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        <Reveal>
          <p className="eyebrow text-blue">How we work</p>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            A studio built across disciplines.
          </h2>

          <div className="mt-8 space-y-1">
            {CAPABILITIES.map((capability) => {
              const isActive = capability.id === activeId
              return (
                <button
                  key={capability.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setActiveId(capability.id)}
                  className={`relative w-full border-t border-ink/10 px-3 py-4 text-left transition-colors ${
                    isActive ? 'text-ink' : 'text-ink/40 hover:text-ink/75'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="capability-active"
                      className="absolute inset-0 bg-white/60"
                      transition={spring}
                    />
                  )}
                  <span className="relative z-10 flex items-baseline gap-4">
                    <span className={`font-mono text-xs ${isActive ? 'text-blue' : 'text-ink/30'}`}>
                      {capability.number}
                    </span>
                    <span className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
                      {capability.title}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>

          <Link
            to="/about"
            className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-ink transition hover:text-blue"
          >
            Inside the studio <ArrowRight className="h-4 w-4" />
          </Link>
        </Reveal>

        <Reveal delay={0.08}>
          <motion.div
            key={active.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
            className="rounded-2xl border border-ink/10 bg-white p-6 shadow-[0_20px_60px_-40px_rgba(10,13,18,0.4)]"
          >
            <p className="font-mono text-xs font-semibold text-blue">{active.number}</p>
            <h3 className="mt-2 font-display text-2xl font-semibold tracking-tight">{active.title}</h3>
            <p className="mt-3 leading-relaxed text-ink/60">{active.body}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {active.links.map((link) =>
                link.internal ? (
                  <Link
                    key={link.label}
                    to={link.href}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-ink underline underline-offset-4 hover:text-blue"
                  >
                    {link.label} <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                ) : (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-semibold text-ink underline underline-offset-4 hover:text-blue"
                  >
                    {link.label} <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                )
              )}
            </div>
          </motion.div>
        </Reveal>
      </div>
    </section>
  )
}

export default CapabilitiesSection