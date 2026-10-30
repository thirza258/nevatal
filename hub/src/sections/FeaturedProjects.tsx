import { Link } from 'react-router-dom'
import ProjectCard from '../components/ProjectCard'
import Reveal from '../components/motion/Reveal'
import { ArrowRight } from '../components/icons'
import { FEATURED_PROJECTS, PROJECTS } from '../data/projects'

const featured = FEATURED_PROJECTS.slice(0, 3)

const FeaturedProjects = () => (
  <section className="bg-paper py-20 sm:py-28">
    <div className="container-x">
      <Reveal className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow text-maroon">Selected projects</p>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            Built, shipped and still running.
          </h2>
          <p className="mt-4 max-w-2xl leading-relaxed text-ink/60">
            AI workspaces, retrieval tools, learning platforms and infrastructure — every project
            below is maintained, not a placeholder in a deck.
          </p>
        </div>
        <Link
          to="/projects"
          className="inline-flex flex-none items-center gap-2 text-sm font-semibold text-ink transition hover:text-blue"
        >
          All {PROJECTS.length} projects <ArrowRight className="h-4 w-4" />
        </Link>
      </Reveal>

      <div className="mt-10 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <ProjectCard project={featured[0]} />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
          {featured.slice(1).map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
      </div>
    </div>
  </section>
)

export default FeaturedProjects
