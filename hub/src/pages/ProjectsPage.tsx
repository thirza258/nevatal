import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import ProjectCard from '../components/ProjectCard'
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
      'The Nevatal portfolio: the AI Hub workspace, grounded RAG research tools, learning platforms, creative experiments and developer utilities.',
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
        <div className="container-x relative py-16 sm:py-20">
          <motion.div initial="hidden" animate="show" variants={stagger}>
            <motion.p variants={fadeUp} className="eyebrow text-brand">
              Portfolio
            </motion.p>
            <motion.h1
              variants={fadeUp}
              className="mt-4 max-w-3xl font-display text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl"
            >
              Work that ships.
            </motion.h1>
            <motion.p variants={fadeUp} className="mt-5 max-w-2xl text-lg leading-relaxed text-paper/65">
              {PROJECTS.length} products across AI, learning, creative work, data and operations.
              Live where they can be, clearly marked where they are internal.
            </motion.p>
          </motion.div>
        </div>
      </section>

      <section className="bg-paper py-12 sm:py-16">
        <div className="container-x">
          <div className="flex flex-col gap-5 border-b border-ink/10 pb-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              {FILTERS.map((option) => {
                const active = filter === option
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setFilter(option)}
                    className={`relative whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium ${
                      active
                        ? 'border-ink text-paper'
                        : 'border-ink/15 bg-white text-ink/60 hover:border-ink/35 hover:text-ink'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="project-filter-pill"
                        className="absolute inset-0 rounded-full bg-ink"
                        transition={spring}
                      />
                    )}
                    <span className="relative z-10">{option}</span>
                  </button>
                )
              })}
            </div>

            <label className="flex w-full items-center gap-2 rounded-full border border-ink/15 bg-white px-4 py-2.5 focus-within:border-ink/40 lg:w-72">
              <Search className="h-4 w-4 flex-none text-ink/50" />
              <span className="sr-only">Search projects</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search the portfolio…"
                className="w-full bg-transparent text-sm text-ink placeholder:text-ink/35 focus:outline-none"
              />
            </label>
          </div>

          <p className="mt-6 text-xs uppercase tracking-[0.16em] text-ink/55">
            Showing {visible.length} of {PROJECTS.length} projects
          </p>

          <motion.div
            layout
            className={
              visible.length > 0 ? 'mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3' : 'hidden'
            }
          >
            <AnimatePresence initial={false}>
              {visible.map((project) => (
                <ProjectCard key={project.slug} project={project} />
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
                className="mt-10 rounded-2xl border border-ink/10 bg-white p-10 text-center"
              >
                <p className="font-display text-xl font-semibold">Nothing matches that search.</p>
                <p className="mt-2 text-sm text-ink/55">
                  Try a broader term, or clear the filters to see the whole portfolio.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setFilter('All')
                    setQuery('')
                  }}
                  className="btn btn-dark mt-5"
                >
                  Clear filters
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      <motion.section
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.6, ease: easeOut }}
        className="bg-ink py-16 text-paper"
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

      <div className="bg-paper">
        <div className="container-x py-8 text-center text-xs text-ink/50">
          Looking for the writing instead?{' '}
          <Link to="/blog" className="font-semibold text-ink/60 underline underline-offset-4 hover:text-ink">
            Visit the blog
          </Link>
          .
        </div>
      </div>
    </>
  )
}

export default ProjectsPage
