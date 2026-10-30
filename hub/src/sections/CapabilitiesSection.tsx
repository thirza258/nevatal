import { Link } from 'react-router-dom'
import Reveal from '../components/motion/Reveal'
import { ArrowRight, ArrowUpRight } from '../components/icons'

const CAPABILITIES = [
  {
    number: '01',
    title: 'Applied AI and retrieval',
    body: 'AI applications, retrieval pipelines, RAG systems, evaluation and practical LLM integration — grounded in real sources.',
    link: { label: 'RAGReader', href: 'https://rag.nevatal.id', external: true },
  },
  {
    number: '02',
    title: 'Full-product engineering',
    body: 'Frontend interfaces, backend APIs, databases, integrations and production application development.',
    link: { label: 'The portfolio', href: '/projects', external: false },
  },
  {
    number: '03',
    title: 'Learning platforms',
    body: 'Interactive educational experiences, programming labs and technical learning resources that work without an API key.',
    link: { label: 'LeetBug', href: 'https://leetbug.nevatal.id', external: true },
  },
  {
    number: '04',
    title: 'Self-hosted infrastructure',
    body: 'Deployment, containers, automation, observability and infrastructure for independent projects.',
    link: { label: 'Uptime Medics', href: 'https://uptime.nevatal.id', external: true },
  },
]

const CapabilitiesSection = () => (
  <section className="bg-ink py-20 text-paper sm:py-28">
    <div className="container-x grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
      <Reveal>
        <p className="eyebrow text-brand">How we work</p>
        <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Built across the entire stack.
        </h2>
        <p className="mt-5 max-w-md leading-relaxed text-paper/55">
          Different products, the same habits: ground the model, own the stack, ship the whole
          thing, and keep it running after the launch post.
        </p>
        <Link
          to="/about"
          className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-brand transition hover:text-paper"
        >
          Inside the studio <ArrowRight className="h-4 w-4" />
        </Link>
      </Reveal>

      <div className="grid gap-x-10 gap-y-9 sm:grid-cols-2">
        {CAPABILITIES.map((capability, index) => (
          <Reveal key={capability.title} delay={index * 0.06}>
            <div className="group border-t border-white/10 pt-5 transition-colors hover:border-brand/40">
              <span className="font-mono text-xs font-semibold text-brand">{capability.number}</span>
              <h3 className="mt-2 font-display text-lg font-semibold transition-colors group-hover:text-brand">
                {capability.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-paper/60">{capability.body}</p>
              {capability.link.external ? (
                <a
                  href={capability.link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-paper/45 transition group-hover:text-paper"
                >
                  {capability.link.label} <ArrowUpRight className="h-3 w-3" />
                </a>
              ) : (
                <Link
                  to={capability.link.href}
                  className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-paper/45 transition group-hover:text-paper"
                >
                  {capability.link.label} <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
)

export default CapabilitiesSection
