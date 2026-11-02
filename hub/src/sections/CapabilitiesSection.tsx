import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import MorphShape from '../components/decor/MorphShape'
import Shape, { type ShapeColor } from '../components/decor/Shape'
import Heading from '../components/motion/Heading'
import Reveal from '../components/motion/Reveal'
import { ArrowDown, ArrowRight, ArrowUpRight } from '../components/icons'
import type { PolarShape } from '../lib/shapes'
import { spring } from '../lib/motion'
import { scrollToSection } from '../lib/scroll'

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
  shape: Exclude<PolarShape, 'rect'>
  color: ShapeColor
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
    shape: 'sparkle',
    color: 'sun',
  },
  {
    id: 'product',
    number: '02',
    title: 'Product engineering',
    body: 'Frontend interfaces, backend APIs, data systems and integrations — shipped as complete products rather than prototypes.',
    links: [{ label: 'The portfolio', href: '/projects', internal: true }],
    shape: 'square',
    color: 'cobalt',
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
    shape: 'flower',
    color: 'plum',
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
    shape: 'burst',
    color: 'sun',
  },
]

const CapabilitiesSection = () => {
  const [activeId, setActiveId] = useState(CAPABILITIES[0].id)
  const active = CAPABILITIES.find((capability) => capability.id === activeId) ?? CAPABILITIES[0]

  return (
    <section id="capabilities" className="relative overflow-clip bg-paper py-28 sm:py-36">
      <div className="container-x relative grid gap-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <Reveal>
          <p className="eyebrow text-ink">
            <Shape kind="half" color="cobalt" className="h-3.5 w-3.5" /> How we work
          </p>
          <Heading
            text="A studio built across disciplines."
            accent="disciplines."
            squiggle
            className="h-section mt-6"
          />

          <div className="mt-10 border-t border-ink/10">
            {CAPABILITIES.map((capability) => {
              const isActive = capability.id === activeId
              return (
                <button
                  key={capability.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setActiveId(capability.id)}
                  className={`group relative flex w-full items-center justify-between gap-4 border-b border-ink/10 py-5 text-left transition-colors ${
                    isActive ? 'text-ink' : 'text-ink/45 hover:text-ink'
                  }`}
                >
                  <span className="flex items-baseline gap-5">
                    <span className="font-mono text-xs">{capability.number}</span>
                    <span className="font-display text-[clamp(1.6rem,3.2vw,2.5rem)] font-semibold tracking-[-0.04em]">
                      {capability.title}
                    </span>
                  </span>
                  {isActive && (
                    <motion.span layoutId="capability-dot" transition={spring} className="flex-none">
                      <Shape kind={capability.shape} color={capability.color === 'sun' ? 'cobalt' : capability.color} className="h-5 w-5" />
                    </motion.span>
                  )}
                </button>
              )
            })}
          </div>

          <Link to="/about" className="btn btn-line mt-10">
            Inside the studio <ArrowRight className="h-4 w-4" />
          </Link>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="relative mx-auto grid aspect-square w-full max-w-[520px] place-items-center">
            <MorphShape shape={active.shape} color={active.color} className="absolute inset-0" />
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={active.id}
                initial={{ opacity: 0, y: 14, rotate: -2 }}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                exit={{ opacity: 0, y: -10, rotate: 2 }}
                transition={{ duration: 0.28 }}
                className="relative w-[78%] rounded-[28px] bg-paper p-6 shadow-[0_40px_90px_-40px_rgba(11,11,13,0.5)] sm:w-[70%]"
              >
                <p className="font-mono text-xs font-medium text-ink/60">{active.number}</p>
                <h3 className="mt-2 font-display text-2xl font-semibold tracking-[-0.03em]">{active.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink/70">{active.body}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {active.links.map((link) =>
                    link.internal ? (
                      <Link key={link.label} to={link.href} className="btn btn-ink !px-4 !py-2 text-xs">
                        {link.label} <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    ) : (
                      <a
                        key={link.label}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-line !px-4 !py-2 text-xs"
                      >
                        {link.label} <ArrowUpRight className="h-3.5 w-3.5" />
                      </a>
                    )
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </Reveal>
      </div>

      <div className="container-x mt-14 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => scrollToSection('writing')}
          className="btn btn-ink"
        >
          Read latest writing <ArrowDown className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => scrollToSection('final-cta')}
          className="btn btn-line"
        >
          Get in touch <ArrowDown className="h-4 w-4" />
        </button>
      </div>
    </section>
  )
}

export default CapabilitiesSection
