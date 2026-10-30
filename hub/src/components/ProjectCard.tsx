import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import ProjectPreview from './ProjectPreview'
import { PROJECT_CATEGORY_TONE, type Project } from '../data/projects'
import { cardIn, spring } from '../lib/motion'
import { ArrowUpRight, Eye } from './icons'

const ProjectCard = ({ project }: { project: Project }) => {
  const [previewOpen, setPreviewOpen] = useState(false)

  const content = (
    <>
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/60">
          <span className={`h-1.5 w-1.5 rounded-full ${PROJECT_CATEGORY_TONE[project.category]}`} />
          {project.category}
        </span>
        {project.url ? (
          <span className="flex items-center gap-1">
            <motion.button
              type="button"
              onClick={() => setPreviewOpen(true)}
              aria-label={`Preview ${project.name}`}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.94 }}
              className="flex items-center gap-1 rounded-full border border-ink/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink/50 transition-colors hover:border-ink/30 hover:bg-ink hover:text-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
            >
              <Eye className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Preview</span>
            </motion.button>
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open ${project.name} in a new tab`}
              className="rounded-full p-1 text-ink/30 transition hover:bg-ink/5 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
            >
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </span>
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

  return (
    <>
      <motion.article
        layout
        variants={cardIn}
        initial="hidden"
        whileInView="show"
        exit="out"
        viewport={{ once: true, margin: '-40px' }}
        whileHover={{ y: -6 }}
        transition={spring}
        className="group flex h-full flex-col rounded-2xl border border-ink/10 bg-white p-6 transition-shadow hover:border-ink/25 hover:shadow-[0_18px_50px_-24px_rgba(10,13,18,0.35)]"
      >
        {content}
      </motion.article>
      <AnimatePresence>
        {previewOpen && project.url && (
          <ProjectPreview
            key="preview"
            project={project}
            url={project.url}
            onClose={() => setPreviewOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}

export default ProjectCard
