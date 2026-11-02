import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import ProjectPreview from './ProjectPreview'
import Shape from './decor/Shape'
import type { Project } from '../data/projects'
import { CATEGORY_SHAPE } from '../lib/categories'
import { revealProps } from '../lib/inview'
import { cardIn, spring } from '../lib/motion'
import { ArrowUpRight, Eye } from './icons'

const ProjectCard = ({ project, showScreenshot = false }: { project: Project; showScreenshot?: boolean }) => {
  const [previewOpen, setPreviewOpen] = useState(false)
  const [shotVisible, setShotVisible] = useState(true)
  const previewTriggerRef = useRef<HTMLButtonElement>(null)
  const glyph = CATEGORY_SHAPE[project.category]

  return (
    <>
      <motion.article
        layout
        variants={cardIn}
        {...revealProps()}
        exit="out"
        whileHover={{ y: -8 }}
        transition={spring}
        className="group flex h-full flex-col rounded-[30px] border border-ink/10 bg-paper p-2.5 transition-[border-color,box-shadow] duration-300 hover:border-ink/20 hover:shadow-[0_34px_70px_-40px_rgba(11,11,13,0.45)]"
      >
        {showScreenshot && shotVisible && (
          <div className="relative overflow-hidden rounded-[22px] bg-paper-2">
            <img
              src={`/previews/${project.slug}.jpg`}
              alt={`Screenshot of ${project.name}`}
              loading="lazy"
              decoding="async"
              width={1280}
              height={800}
              onError={() => setShotVisible(false)}
              className="aspect-[16/10] w-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.05]"
            />
            <Shape
              kind={glyph.kind}
              color={glyph.color === 'ink' ? 'sun' : glyph.color}
              className="absolute -bottom-6 -right-6 h-20 w-20 rotate-12 scale-0 transition-transform duration-500 ease-out group-hover:rotate-45 group-hover:scale-100"
            />
          </div>
        )}

        <div className="flex flex-1 flex-col px-3.5 pb-3.5 pt-5">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 font-mono text-[10.5px] font-medium uppercase tracking-[0.16em] text-ink/60">
              <Shape kind={glyph.kind} color={glyph.color} className="h-3.5 w-3.5" />
              {project.category}
            </span>
            {project.url ? (
              <span className="flex items-center gap-1.5">
                <motion.button
                  ref={previewTriggerRef}
                  type="button"
                  onClick={() => setPreviewOpen(true)}
                  aria-label={`Preview ${project.name}`}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.94 }}
                  className="flex items-center gap-1.5 rounded-full border border-ink/15 px-3 py-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-ink/70 transition-colors hover:border-ink hover:bg-ink hover:text-paper"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Preview</span>
                </motion.button>
                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open ${project.name} in a new tab`}
                  className="grid h-8 w-8 place-items-center rounded-full bg-sun text-ink transition-transform duration-300 hover:rotate-45"
                >
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              </span>
            ) : (
              <span className="rounded-full border border-ink/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink/60">
                Internal
              </span>
            )}
          </div>

          <h3 className="mt-5 font-display text-2xl font-semibold tracking-[-0.035em]">{project.name}</h3>
          <p className="mt-1.5 font-medium text-ink/75">{project.tagline}</p>
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-ink/60">{project.description}</p>

          <div className="mt-auto flex flex-wrap gap-1.5 pt-6">
            {project.tags.map((tag) => (
              <span key={tag} className="tag">
                {tag}
              </span>
            ))}
          </div>
        </div>
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
