import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import ProjectCard from '../components/ProjectCard'
import Shape from '../components/decor/Shape'
import ShapeField from '../components/decor/ShapeField'
import Heading from '../components/motion/Heading'
import Reveal from '../components/motion/Reveal'
import { ArrowDown, ArrowRight } from '../components/icons'
import { PROJECT_CATEGORIES, PROJECTS, type ProjectCategory } from '../data/projects'
import { CATEGORY_SHAPE } from '../lib/categories'
import { spring } from '../lib/motion'
import { scrollToSection } from '../lib/scroll'

type Filter = 'All' | ProjectCategory

const FILTERS: Filter[] = ['All', ...PROJECT_CATEGORIES]

const FeaturedProjects = () => {
  const [filter, setFilter] = useState<Filter>('All')

  const visible = useMemo(
    () => (filter === 'All' ? PROJECTS : PROJECTS.filter((project) => project.category === filter)),
    [filter]
  )

  return (
    <section id="featured-projects" className="relative overflow-clip bg-paper py-28 sm:py-36">
      <ShapeField seed="featured" count={6} mobileCount={2} sizes={[40, 100]} />
      <div className="container-x relative">
        <Reveal className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow text-ink">
              <Shape kind="burst" color="plum" className="h-3.5 w-3.5" /> Selected projects
            </p>
            <Heading text="Made to be explored." accent="explored." squiggle className="h-section mt-6" />
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink/65">
              Every project below is live, maintained and openable — filter by discipline, preview
              the interface, or jump straight into the product.
            </p>
          </div>
          <Link to="/projects" className="btn btn-line flex-none">
            All {PROJECTS.length} projects <ArrowRight className="h-4 w-4" />
          </Link>
        </Reveal>

        <Reveal delay={0.06}>
          <div className="no-scrollbar mt-10 flex gap-2 overflow-x-auto pb-1">
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
                      layoutId="home-project-filter"
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
                </button>
              )
            })}
          </div>
        </Reveal>

        <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.16em] text-ink/60">
          Showing {visible.length} of {PROJECTS.length} projects
        </p>

        <motion.div layout className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence initial={false}>
            {visible.map((project) => (
              <ProjectCard key={project.slug} project={project} showScreenshot />
            ))}
          </AnimatePresence>
        </motion.div>

        <div className="mt-14 flex flex-wrap items-center justify-center gap-3">
          <Link to="/projects" className="btn btn-ink">
            View full portfolio ({PROJECTS.length} projects) <ArrowRight className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={() => scrollToSection('learning')}
            className="btn btn-line"
          >
            Explore learning platforms <ArrowDown className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  )
}

export default FeaturedProjects
