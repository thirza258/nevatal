import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import ProjectCard from '../components/ProjectCard'
import AbstractShape from '../components/decor/AbstractShape'
import Reveal from '../components/motion/Reveal'
import { ArrowRight } from '../components/icons'
import { PROJECT_CATEGORIES, PROJECTS, type ProjectCategory } from '../data/projects'
import { spring } from '../lib/motion'

type Filter = 'All' | ProjectCategory

const FILTERS: Filter[] = ['All', ...PROJECT_CATEGORIES]

const FeaturedProjects = () => {
  const [filter, setFilter] = useState<Filter>('All')

  const visible = useMemo(
    () => (filter === 'All' ? PROJECTS : PROJECTS.filter((project) => project.category === filter)),
    [filter]
  )

  return (
    <section className="relative overflow-hidden bg-paper py-20 sm:py-28">
      <AbstractShape
        shape="trapezoid-outline"
        tone="blue"
        className="-right-8 top-10 h-36 w-36 sm:-right-12 sm:h-52 sm:w-52"
      />
      <AbstractShape
        shape="triangle"
        tone="maroon"
        className="-left-8 bottom-8 h-32 w-32 sm:-left-12 sm:h-48 sm:w-48"
      />
      <div className="container-x relative">
        <Reveal className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow text-maroon">Selected projects</p>
            <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
              Made to be explored.
            </h2>
            <p className="mt-4 max-w-2xl leading-relaxed text-ink/60">
              Every project below is live, maintained and openable — filter by discipline, preview
              the interface, or jump straight into the product.
            </p>
          </div>
          <Link
            to="/projects"
            className="inline-flex flex-none items-center gap-2 text-sm font-semibold text-ink transition hover:text-blue"
          >
            All {PROJECTS.length} projects <ArrowRight className="h-4 w-4" />
          </Link>
        </Reveal>

        <Reveal delay={0.06}>
          <div className="mt-8 flex gap-2 overflow-x-auto pb-1">
            {FILTERS.map((option) => {
              const active = filter === option
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFilter(option)}
                  className={`relative flex-none whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                    active
                      ? 'border-ink text-paper'
                      : 'border-ink/15 bg-white text-ink/55 hover:border-ink/35 hover:text-ink'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="home-project-filter"
                      className="absolute inset-0 rounded-full bg-ink"
                      transition={spring}
                    />
                  )}
                  <span className="relative z-10">{option}</span>
                </button>
              )
            })}
          </div>
        </Reveal>

        <p className="mt-5 text-xs uppercase tracking-[0.16em] text-ink/45">
          Showing {visible.length} of {PROJECTS.length} projects
        </p>

        <motion.div layout className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence initial={false}>
            {visible.map((project) => (
              <ProjectCard key={project.slug} project={project} showScreenshot />
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  )
}

export default FeaturedProjects