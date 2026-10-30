import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import ProjectPreview from './ProjectPreview'
import { PROJECT_CATEGORY_TONE, type Project } from '../data/projects'
import { cardIn, spring } from '../lib/motion'
import { ArrowUpRight, Eye } from './icons'

type CardTone = 'light' | 'dark'

const ProjectCard = ({ project, tone = 'light' }: { project: Project; tone?: CardTone }) => {
  const dark = tone === 'dark'
  const [previewOpen, setPreviewOpen] = useState(false)
  const previewTriggerRef = useRef<HTMLButtonElement>(null)

  const content = (
    <>
      <div className="flex items-center justify-between gap-3">
        <span
          className={`flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] ${
            dark ? 'text-paper/60' : 'text-ink/60'
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${PROJECT_CATEGORY_TONE[project.category]} ${
              dark ? 'ring-1 ring-white/20' : ''
            }`}
          />
          {project.category}
        </span>
        {project.url ? (
          <span className="flex items-center gap-1">
            <motion.button
              ref={previewTriggerRef}
              type="button"
              onClick={() => setPreviewOpen(true)}
              aria-label={`Preview ${project.name}`}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.94 }}
              className={`flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 ${
                dark
                  ? 'border-white/15 text-paper/50 hover:border-white/35 hover:bg-brand hover:text-ink'
                  : 'border-ink/10 text-ink/50 hover:border-ink/30 hover:bg-ink hover:text-paper'
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Preview</span>
            </motion.button>
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open ${project.name} in a new tab`}
              className={`rounded-full p-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 ${
                dark
                  ? 'text-paper/30 hover:bg-white/5 hover:text-paper'
                  : 'text-ink/30 hover:bg-ink/5 hover:text-ink'
              }`}
            >
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </span>
        ) : (
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] ${
              dark ? 'border-white/10 text-paper/50' : 'border-ink/10 text-ink/50'
            }`}
          >
            Internal
          </span>
        )}
      </div>

      <h3
        className={`mt-5 font-display text-xl font-semibold tracking-tight ${
          dark ? 'text-paper' : 'text-ink'
        }`}
      >
        {project.name}
      </h3>
      <p className={`mt-2 text-sm font-medium ${dark ? 'text-paper/70' : 'text-ink/70'}`}>
        {project.tagline}
      </p>
      <p
        className={`mt-3 line-clamp-2 text-sm leading-relaxed ${
          dark ? 'text-paper/55' : 'text-ink/60'
        }`}
      >
        {project.description}
      </p>

      <div className="mt-auto flex flex-wrap gap-1.5 pt-6">
        {project.tags.map((tag) =>
          dark ? (
            <span
              key={tag}
              className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-paper/65"
            >
              {tag}
            </span>
          ) : (
            <span key={tag} className="tag">
              {tag}
            </span>
          )
        )}
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
        className={`group flex h-full flex-col rounded-2xl border p-6 transition-shadow ${
          dark
            ? 'border-white/10 bg-[#101216] text-paper hover:border-white/25 hover:shadow-[0_24px_70px_-30px_rgba(0,0,0,0.95)]'
            : 'border-ink/10 bg-white hover:border-ink/25 hover:shadow-[0_18px_50px_-24px_rgba(10,13,18,0.35)]'
        }`}
      >
        {content}
      </motion.article>
      <AnimatePresence onExitComplete={() => previewTriggerRef.current?.focus()}>
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
