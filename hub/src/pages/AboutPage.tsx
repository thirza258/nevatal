import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight } from '../components/icons'
import { LIVE_PROJECTS, PROJECTS } from '../data/projects'
import { AI_HUB_URL, GITHUB_PROFILE_URL } from '../lib/constants'
import { usePageMeta } from '../lib/seo'

const PRINCIPLES = [
  {
    title: 'Ground the model',
    body: 'Retrieval, citations and narrow scopes come before clever prompting. If the source cannot support an answer, the product says so.',
  },
  {
    title: 'Own the stack',
    body: 'React, Django, FastAPI, Rust and Postgres, packaged with Docker and run on infrastructure we control.',
  },
  {
    title: 'Charge for work, not access',
    body: 'The AI Hub is free with your own provider key, and the courses stay readable without a key at all.',
  },
  {
    title: 'Ship the whole thing',
    body: 'Auth, queues, sandboxes, certificates and analytics — the unglamorous parts that make a product usable.',
  },
]

const STACK = [
  'React',
  'TypeScript',
  'Django',
  'FastAPI',
  'Rust',
  'PostgreSQL',
  'ChromaDB',
  'Docker',
  'Cloudflare',
  'WordPress',
]

const AboutPage = () => {
  usePageMeta({
    title: 'Studio — Nevatal',
    description:
      'Nevatal is an independent AI studio building and operating AI workspaces, grounded retrieval tools, learning platforms and developer utilities.',
    path: '/about',
  })

  return (
    <>
      <section className="hero-surface text-paper">
        <div className="container-x py-16 sm:py-24">
          <p className="eyebrow text-brand">Studio</p>
          <h1 className="mt-4 max-w-4xl font-display text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            Independent by design. AI-first by default.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-paper/65">
            Nevatal is an independent software studio. We design, build and operate AI products end
            to end — the model layer, the retrieval, the interface and the server it runs on.
          </p>

          <dl className="mt-12 grid max-w-2xl grid-cols-2 gap-8 border-t border-white/10 pt-7 sm:grid-cols-4">
            {[
              { value: '17', label: 'AI tools in the workspace' },
              { value: String(PROJECTS.length), label: 'products in the portfolio' },
              { value: String(LIVE_PROJECTS.length), label: 'live services' },
              { value: '400+', label: 'articles published' },
            ].map((stat) => (
              <div key={stat.label}>
                <dt className="sr-only">{stat.label}</dt>
                <dd className="font-display text-3xl font-semibold">{stat.value}</dd>
                <dd className="mt-1 text-[11px] leading-snug text-paper/55">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="bg-paper py-20 sm:py-28">
        <div className="container-x grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div>
            <p className="eyebrow text-blue">The work</p>
            <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              One studio, many products.
            </h2>
          </div>
          <div className="space-y-5 leading-relaxed text-ink/65">
            <p>
              The portfolio began with the Nevatal AI Hub — seventeen purpose-built AI tools in one
              workspace, running on the visitor&apos;s own OpenAI, Gemini or OpenRouter key. No
              account, no subscription, no credential sitting on someone else&apos;s server.
            </p>
            <p>
              The same approach carries into the rest of the catalogue: retrieval tools that cite
              their sources, learning platforms that work without a key, sandboxes that run real
              code, and the monitors, shorteners and bots that keep the whole surface area
              observable.
            </p>
            <p>
              Everything is built in-house and deployed on hardware we control. That makes the
              portfolio slower to expand than a folder of prototypes — and considerably harder to
              break.
            </p>
            <Link
              to="/projects"
              className="inline-flex items-center gap-2 pt-2 text-sm font-semibold text-ink transition hover:text-blue"
            >
              Explore all {PROJECTS.length} projects <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-ink py-20 text-paper sm:py-28">
        <div className="container-x">
          <div className="max-w-2xl">
            <p className="eyebrow text-brand">Principles</p>
            <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              How the work gets built.
            </h2>
          </div>

          <div className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2">
            {PRINCIPLES.map((principle, index) => (
              <div key={principle.title} className="border-t border-white/10 pt-6">
                <span className="text-xs font-semibold text-brand">0{index + 1}</span>
                <h3 className="mt-2 font-display text-xl font-semibold">{principle.title}</h3>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-paper/55">
                  {principle.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-paper py-20 sm:py-28">
        <div className="container-x grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div>
            <p className="eyebrow text-maroon">The stack</p>
            <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Boring where it counts.
            </h2>
            <p className="mt-5 leading-relaxed text-ink/60">
              The tools are chosen for what they make possible under load, not for a launch post.
              Everything ships in containers and can be rebuilt from source.
            </p>
          </div>
          <div className="flex flex-wrap content-start gap-2.5">
            {STACK.map((item) => (
              <span
                key={item}
                className="rounded-full border border-ink/10 bg-white px-4 py-2 text-sm font-medium text-ink/70"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-brand text-ink">
        <div className="container-x flex flex-col items-start justify-between gap-8 py-16 sm:flex-row sm:items-center">
          <div>
            <p className="eyebrow">The shortest tour</p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Use the work.
            </h2>
            <p className="mt-3 max-w-xl text-ink/70">
              The fastest way to understand how Nevatal builds is to open the AI Hub, or to read the
              source on GitHub.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href={AI_HUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-dark"
            >
              Open the AI Hub <ArrowUpRight className="h-4 w-4" />
            </a>
            <a
              href={GITHUB_PROFILE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost !border-ink/30"
            >
              GitHub <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>
    </>
  )
}

export default AboutPage
