import { PROJECT_CATEGORY_TONE, type Project } from '../data/projects'
import { ArrowUpRight } from './icons'

const ProjectCard = ({ project }: { project: Project }) => {
  const content = (
    <>
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/60">
          <span className={`h-1.5 w-1.5 rounded-full ${PROJECT_CATEGORY_TONE[project.category]}`} />
          {project.category}
        </span>
        {project.url ? (
          <ArrowUpRight className="h-4 w-4 text-ink/30 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink" />
        ) : (
          <span className="rounded-full border border-ink/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-ink/50">
            Internal
          </span>
        )}
      </div>

      <h3 className="mt-5 font-display text-xl font-semibold tracking-tight">{project.name}</h3>
      <p className="mt-2 text-sm font-medium text-ink/70">{project.tagline}</p>
      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-ink/60">{project.description}</p>

      <div className="mt-auto flex flex-wrap gap-1.5 pt-6">
        {project.tags.map((tag) => (
          <span key={tag} className="tag">
            {tag}
          </span>
        ))}
      </div>
    </>
  )

  const className =
    'group flex h-full flex-col rounded-2xl border border-ink/10 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-ink/25 hover:shadow-[0_18px_50px_-24px_rgba(10,13,18,0.35)]'

  if (project.url) {
    return (
      <a href={project.url} target="_blank" rel="noopener noreferrer" className={className}>
        {content}
      </a>
    )
  }

  return <article className={className}>{content}</article>
}

export default ProjectCard
