import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import ProjectCard from '../components/ProjectCard'
import AbstractShape from '../components/decor/AbstractShape'
import AnimatedCounter from '../components/motion/AnimatedCounter'
import { Search } from '../components/icons'
import {
  PROJECT_CATEGORIES,
  PROJECTS,
  type ProjectCategory,
} from '../data/projects'
import { AI_HUB_URL, SITE_URL } from '../lib/constants'
import { easeOut, fadeUp, spring, stagger } from '../lib/motion'
import { usePageMeta } from '../lib/seo'

type Filter = 'All' | ProjectCategory

const FILTERS: Filter[] = ['All', ...PROJECT_CATEGORIES]

const CATEGORY_COUNTS = FILTERS.reduce<Record<Filter, number>>(
  (acc, option) => {
    acc[option] =
      option === 'All' ? PROJECTS.length : PROJECTS.filter((project) => project.category === option).length
    return acc
  },
  { All: PROJECTS.length } as Record<Filter, number>
)

const TECH_TAGS = Array.from(new Set(PROJECTS.flatMap((project) => project.tags))).sort((a, b) =>
  a.localeCompare(b)
)

const PORTFOLIO_STATS = [
  { value: PROJECTS.length, label: 'live projects' },
  { value: PROJECT_CATEGORIES.length, label: 'categories' },
  { value: TECH_TAGS.length, label: 'technologies in use' },
  { value: PROJECTS.filter((project) => project.featured).length, label: 'featured projects' },
]

const PROJECTS_LD = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Nevatal projects',
  url: `${SITE_URL}/projects`,
  mainEntity: {
    '@type': 'ItemList',
    itemListElement: PROJECTS.map((project, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: project.name,
      ...(project.url ? { url: project.url } : {}),
    })),
  },
}

const ProjectsPage = () => {
  const [filter, setFilter] = useState<Filter>('All')
  const [query, setQuery] = useState('')

  usePageMeta({
    title: 'Projects — Nevatal',
    description:
      'The Nevatal portfolio: the AI Hub workspace, grounded RAG research tools, learning platforms, creative experiments and developer utilities — every project live.',
    path: '/projects',
    jsonLd: PROJECTS_LD,
  })

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return PROJECTS.filter((project) => {
      const inCategory = filter === 'All' || project.category === filter
      if (!inCategory) return false
      if (!needle) return true
      const haystack = [
        project.name,
        project.tagline,
        project.description,
        project.category,
        ...project.tags,
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(needle)
    })
  }, [filter, query])

  return (
    <>
      <section className="hero-surface relative overflow-hidden text-paper">
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 top-8 h-72 w-72 rounded-full bg-blue/25 blur-3xl"
          animate={{ x: [0, 16, 0], y: [0, 26, 0], scale: [1, 1.12, 1] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full bg-brand/20 blur-3xl"
          animate={{ y: [0, -22, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
        <AbstractShape shape="triangle-outline" tone="light" className="-left-16 bottom-10 h-48 w-48" />
        <AbstractShape
          shape="square"
          tone="light"
          rotate={false}
          className="right-10 top-14 hidden h-20 w-20 lg:block"
        />
        <div className="container-x relative py-16 sm:py-20 lg:py-24">
          <motion.div initial="hidden" animate="show" variants={stagger} className="max-w-4xl">
            <motion.p variants={fadeUp} className="eyebrow text-brand">
              Portfolio
            </motion.p>
            <motion.h1
              variants={fadeUp}
              className="mt-4 font-display text-[clamp(2.8rem,7vw,5.6rem)] font-semibold leading-[1.02] tracking-tight"
            >
              Work that ships.
            </motion.h1>
            <motion.p variants={fadeUp} className="mt-5 max-w-2xl text-lg leading-relaxed text-paper/65">
              {PROJECTS.length} products across AI, learning, creative work, data and operations.
              Every one is live — open a preview or jump straight in.
            </motion.p>
            <motion.dl
              variants={fadeUp}
              className="mt-10 grid max-w-3xl grid-cols-2 gap-6 border-t border-white/10 pt-6 sm:grid-cols-4"
            >
              {PORTFOLIO_STATS.map((stat) => (
                <div key={stat.label}>
                  <dt className="sr-only">{stat.label}</dt>
                  <dd className="font-display text-2xl font-semibold text-paper">
                    <AnimatedCounter value={stat.value} />
                  </dd>
                  <dd className="mt-1 text-[11px] leading-snug text-paper/55">{stat.label}</dd>
                </div>
              ))}
            </motion.dl>
          </motion.div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#08090B] pb-16 text-paper sm:pb-24">
        <AbstractShape shape="ring" tone="brand" className="-right-24 top-16 h-64 w-64" />
        <AbstractShape shape="triangle-outline" tone="light" className="-left-20 bottom-16 h-48 w-48" />
        <div className="sticky top-24 z-30 border-y border-white/10 bg-[#08090B]/90 backdrop-blur">
          <div className="container-x flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              {FILTERS.map((option) => {
                const active = filter === option
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setFilter(option)}
                    className={`relative whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                      active
                        ? 'border-brand text-ink'
                        : 'border-white/15 text-paper/55 hover:border-white/30 hover:text-paper'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="project-filter-pill"
                        className="absolute inset-0 rounded-full bg-brand"
                        transition={spring}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5">
                      {option}
                      <span
                        className={`text-[10px] tabular-nums ${
                          active ? 'text-ink/60' : 'text-paper/30'
                        }`}
                      >
                        {CATEGORY_COUNTS[option]}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>

            <label className="flex w-full items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2.5 focus-within:border-white/40 lg:w-72">
              <Search className="h-4 w-4 flex-none text-paper/40" />
              <span className="sr-only">Search projects</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search the portfolio…"
                className="w-full bg-transparent text-sm text-paper placeholder:text-paper/30 focus:outline-none"
              />
            </label>
          </div>
        </div>

        <div className="container-x relative">
          <div className="mt-6 flex items-center justify-between gap-4 text-xs uppercase tracking-[0.16em] text-paper/45">
            <p className="flex items-baseline gap-1.5">
              Showing
              <motion.span
                key={visible.length}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-semibold tabular-nums text-paper"
              >
                {visible.length}
              </motion.span>
              of {PROJECTS.length} projects
            </p>
            <p className="hidden sm:block">{filter === 'All' ? 'All categories' : filter}</p>
          </div>

          <motion.div
            layout
            className={
              visible.length > 0 ? 'mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3' : 'hidden'
            }
          >
            <AnimatePresence initial={false}>
              {visible.map((project) => (
                <ProjectCard key={project.slug} project={project} tone="dark" showScreenshot />
              ))}
            </AnimatePresence>
          </motion.div>

          <AnimatePresence>
            {visible.length === 0 && (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="mt-10 rounded-2xl border border-white/10 bg-[#101216] p-10 text-center"
              >
                <p className="font-display text-xl font-semibold text-paper">
                  Nothing matches that search.
                </p>
                <p className="mt-2 text-sm text-paper/50">
                  Try a broader term, or clear the filters to see the whole portfolio.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setFilter('All')
                    setQuery('')
                  }}
                  className="btn btn-primary mt-5"
                >
                  Clear filters
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="container-x relative mt-16">
          <p className="eyebrow text-brand">Stack across the portfolio</p>
          <div className="marquee-mask mt-4 border-y border-white/10 bg-white/[0.02] py-3">
            <div className="marquee-track flex w-max items-center gap-4 pr-4">
              {[0, 1].map((copy) => (
                <div
                  key={copy}
                  className="flex items-center gap-4"
                  aria-hidden={copy === 1 ? 'true' : undefined}
                >
                  {TECH_TAGS.map((tag) => (
                    <span
                      key={tag}
                      className="whitespace-nowrap rounded-full border border-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-paper/40"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <motion.section
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.6, ease: easeOut }}
        className="border-t border-white/10 bg-[#0B0D10] py-16 text-paper"
      >
        <div className="container-x flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <p className="eyebrow text-brand">Flagship</p>
            <h2 className="mt-3 font-display text-2xl font-semibold sm:text-3xl">
              Start with the Nevatal AI Hub.
            </h2>
            <p className="mt-2 max-w-xl text-sm text-paper/55">
              Seventeen tools, one workspace, your own OpenAI, Gemini or OpenRouter key.
            </p>
          </div>
          <a
            href={AI_HUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
          >
            Open the AI Hub
          </a>
        </div>
      </motion.section>

      <div className="border-t border-white/10 bg-[#08090B]">
        <div className="container-x py-8 text-center text-xs text-paper/45">
          Looking for the writing instead?{' '}
          <Link
            to="/blog"
            className="font-semibold text-paper underline underline-offset-4 hover:text-brand"
          >
            Visit the blog
          </Link>
          .
        </div>
      </div>
    </>
  )
}

export default ProjectsPage
