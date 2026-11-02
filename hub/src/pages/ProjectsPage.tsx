import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import PageHero from '../components/PageHero'
import ProjectCard from '../components/ProjectCard'
import MorphSection from '../components/decor/MorphSection'
import Shape from '../components/decor/Shape'
import AnimatedCounter from '../components/motion/AnimatedCounter'
import Magnetic from '../components/motion/Magnetic'
import Reveal from '../components/motion/Reveal'
import VelocityMarquee from '../components/motion/VelocityMarquee'
import { ArrowUpRight, Search } from '../components/icons'
import { PROJECT_CATEGORIES, PROJECTS, type ProjectCategory } from '../data/projects'
import { CATEGORY_SHAPE } from '../lib/categories'
import { AI_HUB_URL, SITE_URL } from '../lib/constants'
import { easeOut, spring } from '../lib/motion'
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
  { value: PROJECTS.length, label: 'live projects', shape: 'circle' as const, color: 'cobalt' as const },
  { value: PROJECT_CATEGORIES.length, label: 'categories', shape: 'flower' as const, color: 'sun' as const },
  { value: TECH_TAGS.length, label: 'technologies in use', shape: 'square' as const, color: 'ink' as const },
  {
    value: PROJECTS.filter((project) => project.featured).length,
    label: 'featured projects',
    shape: 'sparkle' as const,
    color: 'plum' as const,
  },
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
      const haystack = [project.name, project.tagline, project.description, project.category, ...project.tags]
        .join(' ')
        .toLowerCase()
      return haystack.includes(needle)
    })
  }, [filter, query])

  return (
    <>
      <PageHero
        eyebrow="Portfolio"
        shape="circle"
        shapeColor="cobalt"
        title="Work that ships."
        accent="ships."
        seed="projects-hero"
        lead={
          <p>
            {PROJECTS.length} products across AI, learning, creative work, data and operations. Every
            one is live — open a preview or jump straight in.
          </p>
        }
      >
        <motion.dl
          className="mt-14 grid max-w-3xl grid-cols-2 border-t border-ink/10 sm:grid-cols-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: easeOut, delay: 0.5 }}
        >
          {PORTFOLIO_STATS.map((stat) => (
            <div key={stat.label} className="pr-5 pt-6">
              <dt className="sr-only">{stat.label}</dt>
              <dd className="flex items-center gap-2 font-display text-4xl font-semibold tracking-[-0.04em]">
                <AnimatedCounter value={stat.value} />
                <Shape kind={stat.shape} color={stat.color} className="h-4 w-4" />
              </dd>
              <dd className="mt-2 text-xs text-ink/60">{stat.label}</dd>
            </div>
          ))}
        </motion.dl>
      </PageHero>

      <section className="relative bg-paper pb-24">
        <div
          className="sticky z-30 border-y border-ink/10 bg-paper/90 backdrop-blur-xl transition-[top] duration-300"
          style={{ top: 'var(--header-offset)' }}
        >
          <div className="container-x flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              {FILTERS.map((option) => {
                const active = filter === option
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setFilter(option)}
                    className={`relative flex flex-none items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2.5 text-sm font-medium transition-colors ${
                      active ? 'border-ink text-paper' : 'border-ink/15 text-ink/70 hover:border-ink hover:text-ink'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="project-filter-pill"
                        className="absolute inset-0 rounded-full bg-ink"
                        transition={spring}
                      />
                    )}
                    {option !== 'All' && (
                      <Shape
                        kind={CATEGORY_SHAPE[option].kind}
                        color={active && CATEGORY_SHAPE[option].color === 'ink' ? 'sun' : CATEGORY_SHAPE[option].color}
                        className="relative h-3.5 w-3.5"
                      />
                    )}
                    <span className="relative">{option}</span>
                    <span className={`relative font-mono text-[10px] tabular-nums ${active ? 'text-sun' : 'text-ink/60'}`}>
                      {CATEGORY_COUNTS[option]}
                    </span>
                  </button>
                )
              })}
            </div>

            <label className="flex w-full items-center gap-2 rounded-full border border-ink/15 bg-paper px-4 py-2.5 transition-colors focus-within:border-ink lg:w-72">
              <Search className="h-4 w-4 flex-none text-ink/60" />
              <span className="sr-only">Search projects</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search the portfolio…"
                className="w-full bg-transparent text-sm text-ink placeholder:text-ink/45 focus:outline-none"
              />
            </label>
          </div>
        </div>

        <div className="container-x relative">
          <div className="mt-8 flex items-center justify-between gap-4 font-mono text-[11px] uppercase tracking-[0.16em] text-ink/60">
            <p className="flex items-baseline gap-1.5">
              Showing
              <motion.span
                key={visible.length}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-medium tabular-nums text-ink"
              >
                {visible.length}
              </motion.span>
              of {PROJECTS.length} projects
            </p>
            <p className="hidden sm:block">{filter === 'All' ? 'All categories' : filter}</p>
          </div>

          <motion.div
            layout
            className={visible.length > 0 ? 'mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3' : 'hidden'}
          >
            <AnimatePresence initial={false}>
              {visible.map((project) => (
                <ProjectCard key={project.slug} project={project} showScreenshot />
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
                className="mt-10 rounded-[30px] border border-ink/10 p-12 text-center"
              >
                <Shape kind="squiggle" color="cobalt" className="mx-auto h-12 w-16" />
                <p className="mt-5 font-display text-2xl font-semibold tracking-[-0.03em]">
                  Nothing matches that search.
                </p>
                <p className="mt-2 text-sm text-ink/60">
                  Try a broader term, or clear the filters to see the whole portfolio.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setFilter('All')
                    setQuery('')
                  }}
                  className="btn btn-ink mt-6"
                >
                  Clear filters
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-24">
          <div className="container-x">
            <p className="eyebrow text-ink">
              <Shape kind="dots" color="ink" className="h-3.5 w-3.5" /> Stack across the portfolio
            </p>
          </div>
          <div className="mt-6 border-y border-ink/10 py-4">
            <VelocityMarquee baseVelocity={1.5}>
              {TECH_TAGS.map((tag, index) => (
                <span
                  key={tag}
                  className={`mx-1.5 whitespace-nowrap rounded-full px-4 py-2 font-mono text-[11px] font-medium uppercase tracking-[0.12em] ${
                    index % 3 === 0 ? 'bg-sun text-ink' : 'border border-ink/15 text-ink/70'
                  }`}
                >
                  {tag}
                </span>
              ))}
            </VelocityMarquee>
          </div>
        </div>
      </section>

      <MorphSection morph="pill" className="py-20 sm:py-24">
        <Reveal className="container-x flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
          <div>
            <p className="eyebrow text-ink">
              <Shape kind="sparkle" color="paper" className="h-4 w-4" /> Flagship
            </p>
            <h2 className="mt-4 font-display text-[clamp(2rem,4vw,3.2rem)] font-semibold leading-[1] tracking-[-0.04em]">
              Start with the Nevatal AI Hub.
            </h2>
            <p className="mt-3 max-w-xl text-ink/80">
              Seventeen tools, one workspace, your own OpenAI, Gemini or OpenRouter key.
            </p>
          </div>
          <Magnetic>
            <a href={AI_HUB_URL} target="_blank" rel="noopener noreferrer" className="btn btn-ink">
              Open the AI Hub <ArrowUpRight className="h-4 w-4" />
            </a>
          </Magnetic>
        </Reveal>
      </MorphSection>

      <div className="bg-paper">
        <div className="container-x py-10 text-center text-sm text-ink/60">
          Looking for the writing instead?{' '}
          <Link to="/blog" className="font-medium text-ink underline underline-offset-4 hover:text-cobalt">
            Visit the blog
          </Link>
          .
        </div>
      </div>
    </>
  )
}

export default ProjectsPage
