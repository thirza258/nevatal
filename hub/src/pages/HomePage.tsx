import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PostCard from '../components/PostCard'
import ProjectCard from '../components/ProjectCard'
import { ArrowRight, ArrowUpRight, Check, Spark } from '../components/icons'
import { FEATURED_PROJECTS, PROJECTS } from '../data/projects'
import {
  AI_HUB_COURSES_URL,
  AI_HUB_URL,
  AI_TOOLS,
  GITHUB_PROFILE_URL,
  SITE_URL,
} from '../lib/constants'
import { usePageMeta } from '../lib/seo'
import { getCategories, getPosts, type WPPost } from '../lib/wp'

const ORGANIZATION_LD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Nevatal',
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  description:
    'An independent AI studio building AI workspaces, grounded retrieval tools, learning platforms and developer utilities.',
  sameAs: [GITHUB_PROFILE_URL],
}

const STATS = [
  { value: '17', label: 'AI tools in the flagship workspace' },
  { value: String(PROJECTS.length), label: 'products across the portfolio' },
  { value: '400+', label: 'articles published on the blog' },
]

const FEATURES = [
  {
    title: 'A form per job',
    body: 'Purpose-built inputs for writing, translation, documents, images and data — not one blank chat box.',
  },
  {
    title: 'Your key, your bill',
    body: 'OpenAI, Gemini or OpenRouter. The workspace adds no markup and never keeps a credential in plain text.',
  },
  {
    title: 'Seventeen tools, one history',
    body: 'Every result lands in a session history you can revisit, reply to or delete in one go.',
  },
  {
    title: 'Learn while you use it',
    body: 'Free courses with worked examples, exercises and checks — readable without an API key.',
  },
]

const CAPABILITIES = [
  {
    title: 'Applied AI and retrieval',
    body: 'RAG pipelines, grounded assistants and multi-model workflows that cite their sources instead of guessing.',
  },
  {
    title: 'Full-product engineering',
    body: 'React front ends, Django and FastAPI services, queues, sandboxes and the deployment around them.',
  },
  {
    title: 'Learning platforms',
    body: 'Courses, exercises, exams and certificates that stay useful even when the reader has no API key.',
  },
  {
    title: 'Self-hosted infrastructure',
    body: 'Docker-first services, monitoring and backups running on hardware we control.',
  },
]

const HomePage = () => {
  const [posts, setPosts] = useState<WPPost[]>([])
  const [categoryNames, setCategoryNames] = useState<Record<string, string>>({})
  const [postsState, setPostsState] = useState<'loading' | 'ready' | 'error'>('loading')

  usePageMeta({
    title: 'Nevatal — AI products that earn their place',
    description:
      'An independent AI studio: a seventeen-tool AI workspace, grounded RAG research tools, learning platforms, developer utilities and the Nevatal blog.',
    path: '/',
    jsonLd: ORGANIZATION_LD,
  })

  useEffect(() => {
    let alive = true

    Promise.allSettled([getPosts({ perPage: 3 }), getCategories()]).then(([postsResult, categoriesResult]) => {
      if (!alive) return
      if (postsResult.status === 'fulfilled') {
        setPosts(postsResult.value.posts)
        setPostsState('ready')
      } else {
        setPostsState('error')
      }
      if (categoriesResult.status === 'fulfilled') {
        setCategoryNames(
          Object.fromEntries(categoriesResult.value.map((category) => [String(category.id), category.name]))
        )
      }
    })

    return () => {
      alive = false
    }
  }, [])

  return (
    <>
      <section className="hero-surface relative overflow-hidden text-paper">
        <div className="container-x py-16 sm:py-20 lg:py-28">
          <div className="grid items-center gap-14 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="animate-fade-up">
              <p className="eyebrow flex items-center gap-2 text-brand">
                <Spark className="h-4 w-4" /> Independent AI studio
              </p>
              <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.04] tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl">
                AI products that <span className="text-brand">earn their place.</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-paper/70">
                Nevatal designs, ships and runs a portfolio of AI-first software: a seventeen-tool
                workspace, grounded research assistants, learning platforms and the small utilities
                that keep the lights on.
              </p>

              <div className="mt-9 flex flex-wrap gap-3">
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
              </div>

              <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-white/10 pt-6">
                {STATS.map((stat) => (
                  <div key={stat.label}>
                    <dt className="sr-only">{stat.label}</dt>
                    <dd className="font-display text-3xl font-semibold text-paper">{stat.value}</dd>
                    <dd className="mt-1 text-[11px] leading-snug text-paper/55">{stat.label}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="w-full max-w-md animate-fade-up lg:justify-self-end [animation-delay:120ms]">
              <div className="relative">
                <div className="absolute -inset-8 rounded-full bg-brand/10 blur-3xl" aria-hidden="true" />
                <div className="relative grid grid-cols-2 gap-3">
                  <a
                    href={AI_HUB_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative col-span-2 overflow-hidden rounded-3xl bg-brand p-6 text-ink transition duration-300 hover:-translate-y-1"
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
                    <div className="mt-5 flex flex-wrap gap-1.5">
                      {AI_TOOLS.map((tool) => (
                        <span
                          key={tool}
                          className="rounded-full border border-ink/15 bg-ink/5 px-2.5 py-1 text-[11px] font-medium"
                        >
                          {tool}
                        </span>
                      ))}
                    </div>
                  </a>

                  <a
                    href="https://rag.nevatal.id"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition duration-300 hover:-translate-y-1 hover:border-white/25"
                  >
                    <p className="text-[10px] uppercase tracking-[0.16em] text-paper/50">
                      Grounded retrieval
                    </p>
                    <h3 className="mt-2 font-display text-lg font-semibold">RAGReader</h3>
                    <p className="mt-1 text-xs leading-relaxed text-paper/60">
                      Compare dense, sparse and hybrid search — then let the models vote.
                    </p>
                  </a>

                  <a
                    href="https://leetbug.nevatal.id"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition duration-300 hover:-translate-y-1 hover:border-white/25"
                  >
                    <p className="text-[10px] uppercase tracking-[0.16em] text-paper/50">
                      Practice
                    </p>
                    <h3 className="mt-2 font-display text-lg font-semibold">LeetBug</h3>
                    <p className="mt-1 text-xs leading-relaxed text-paper/60">
                      Debugging challenges that grade the fix, not the answer.
                    </p>
                  </a>

                  <a
                    href="https://uptime.nevatal.id"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="col-span-2 flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition duration-300 hover:-translate-y-1 hover:border-white/25"
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
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="marquee-mask border-y border-white/10 bg-white/[0.02] py-3">
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

      <section className="bg-paper py-20 sm:py-28">
        <div className="container-x grid items-center gap-14 lg:grid-cols-2">
          <div>
            <p className="eyebrow text-blue">The flagship</p>
            <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
              Seventeen tools. Zero subscriptions.
            </h2>
            <p className="mt-5 max-w-lg leading-relaxed text-ink/60">
              The Nevatal AI Hub is a workspace, not a chat box. Each tool asks for exactly what it
              needs — a brief, a document, a CSV — and every request runs on the provider key you
              bring.
            </p>

            <ul className="mt-8 space-y-5">
              {FEATURES.map((feature) => (
                <li key={feature.title} className="flex gap-3">
                  <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-ink text-brand">
                    <Check className="h-3 w-3" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{feature.title}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-ink/55">{feature.body}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-9 flex flex-wrap gap-3">
              <a
                href={AI_HUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-dark"
              >
                Open the AI Hub <ArrowUpRight className="h-4 w-4" />
              </a>
              <a href={AI_HUB_COURSES_URL} className="btn btn-ghost">
                Browse free courses
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-[2rem] bg-blue/5 blur-2xl" aria-hidden="true" />
            <div className="relative overflow-hidden rounded-[1.6rem] border border-ink/10 bg-ink shadow-2xl">
              <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                <span className="ml-3 rounded-full bg-white/5 px-3 py-0.5 text-[10px] text-paper/40">
                  chat.nevatal.id
                </span>
              </div>

              <div className="grid grid-cols-[0.95fr_1.45fr] text-paper">
                <div className="border-r border-white/10 p-4">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-paper/50">Tools</p>
                  <ul className="mt-3 space-y-1.5 text-xs">
                    {[
                      'Prompt',
                      'Explainer',
                      'Writer',
                      'Translator',
                      'Document AI',
                      'Data Analysis',
                      'Batch Runner',
                    ].map((tool, index) => (
                      <li
                        key={tool}
                        className={`flex items-center gap-2 rounded-md px-2 py-1.5 ${
                          index === 0 ? 'bg-brand font-semibold text-ink' : 'text-paper/55'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            index === 0 ? 'bg-ink' : 'bg-white/20'
                          }`}
                        />
                        {tool}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-[#0D1119] p-4">
                  <div className="flex items-center justify-between text-[10px] text-paper/35">
                    <span>AI Hub / Prompt</span>
                    <span>OpenRouter</span>
                  </div>
                  <div className="mt-4 space-y-3">
                    <div className="ml-auto max-w-[88%] rounded-xl rounded-br-sm bg-blue px-3 py-2 text-xs leading-relaxed">
                      Draft a launch note for a developer tool — honest, no hype.
                    </div>
                    <div className="max-w-[94%] rounded-xl rounded-bl-sm bg-white/[0.06] px-3 py-2.5 text-xs text-paper/70">
                      <p className="font-semibold text-paper">Launch note — first draft</p>
                      <p className="mt-1 leading-relaxed">
                        We built it because the work kept breaking in the same three places...
                      </p>
                      <div className="mt-3 h-1.5 w-3/4 rounded bg-white/10" />
                      <div className="mt-1.5 h-1.5 w-1/2 rounded bg-white/10" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[10px] text-paper/35">
                    <span>Markdown · 412 tokens</span>
                    <span className="rounded bg-brand px-2 py-0.5 font-semibold text-ink">Run</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-paper-2/60 py-20 sm:py-28">
        <div className="container-x">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="eyebrow text-maroon">The portfolio</p>
              <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
                Built, shipped and still running.
              </h2>
              <p className="mt-4 max-w-2xl leading-relaxed text-ink/60">
                AI workspaces, retrieval tools, learning platforms and infrastructure — every
                project below is maintained, not a placeholder in a deck.
              </p>
            </div>
            <Link
              to="/projects"
              className="inline-flex flex-none items-center gap-2 text-sm font-semibold text-ink transition hover:text-blue"
            >
              All {PROJECTS.length} projects <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURED_PROJECTS.map((project) => (
              <ProjectCard key={project.slug} project={project} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-ink py-20 text-paper sm:py-28">
        <div className="container-x grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
          <div>
            <p className="eyebrow text-brand">How we work</p>
            <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              A wide surface area, one standard.
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
          </div>

          <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {CAPABILITIES.map((capability, index) => (
              <div key={capability.title} className="border-t border-white/10 pt-5">
                <span className="text-xs font-semibold text-brand">0{index + 1}</span>
                <h3 className="mt-2 font-display text-lg font-semibold">{capability.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-paper/60">{capability.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-paper py-20 sm:py-28">
        <div className="container-x">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="eyebrow text-blue">Writing</p>
              <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
                Notes from the workshop.
              </h2>
              <p className="mt-4 max-w-2xl leading-relaxed text-ink/60">
                Architecture notes, build logs and the occasional post-mortem — published from
                WordPress and read right here.
              </p>
            </div>
            <Link
              to="/blog"
              className="inline-flex flex-none items-center gap-2 text-sm font-semibold text-ink transition hover:text-blue"
            >
              All writing <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {postsState === 'loading' &&
              [0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="h-72 animate-pulse rounded-2xl border border-ink/10 bg-white p-6"
                >
                  <div className="h-5 w-24 rounded-full bg-ink/10" />
                  <div className="mt-6 h-5 w-4/5 rounded bg-ink/10" />
                  <div className="mt-3 h-4 w-3/5 rounded bg-ink/5" />
                  <div className="mt-8 h-3 w-full rounded bg-ink/5" />
                  <div className="mt-2 h-3 w-2/3 rounded bg-ink/5" />
                </div>
              ))}

            {postsState === 'ready' &&
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  categoryName={categoryNames[String(post.categories[0])]}
                />
              ))}
          </div>

          {postsState === 'error' && (
            <div className="mt-10 rounded-2xl border border-ink/10 bg-white p-8 text-center">
              <p className="font-display text-xl font-semibold">The archive is taking a break.</p>
              <p className="mt-2 text-sm text-ink/55">
                WordPress could not be reached from this browser. The posts are still online.
              </p>
              <Link to="/blog" className="btn btn-dark mt-5">
                Go to the blog <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="bg-brand text-ink">
        <div className="container-x flex flex-col items-start justify-between gap-8 py-16 sm:flex-row sm:items-center">
          <div>
            <p className="eyebrow">Start here</p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Put the portfolio to work.
            </h2>
            <p className="mt-3 max-w-xl text-ink/70">
              The AI Hub is live and free to use with your own provider key. Everything else is one
              click away.
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
            <Link to="/projects" className="btn btn-ghost !border-ink/30">
              See all projects
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}

export default HomePage
