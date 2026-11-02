import { useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring } from 'framer-motion'
import Shape from '../components/decor/Shape'
import ShapeField from '../components/decor/ShapeField'
import Heading from '../components/motion/Heading'
import Reveal from '../components/motion/Reveal'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight } from '../components/icons'
import { AI_PROJECTS, type Project } from '../data/projects'
import { CATEGORY_SHAPE } from '../lib/categories'
import { revealProps } from '../lib/inview'
import { cardIn, spring } from '../lib/motion'
import { shuffle } from '../lib/random'
import { scrollToSection } from '../lib/scroll'

const STAGES = [
  {
    id: 'documents',
    label: 'Documents',
    detail: 'Source papers and pages are ingested as the ground truth. Nothing is answered from memory alone.',
    sample: 'reader-paper.pdf\n42 pages · 6 sections · 18 figures',
  },
  {
    id: 'chunking',
    label: 'Chunking',
    detail: 'Text is split into overlapping passages so retrieval can point at a specific claim, not a whole document.',
    sample: 'chunk 041  "…the reranker lifts the passage…"\nchunk 042  "…evaluation measures faithfulness…"',
  },
  {
    id: 'retrieval',
    label: 'Retrieval',
    detail: 'Dense, sparse and hybrid search run side by side, so keyword and semantic matches both have a path in.',
    sample: 'dense   0.81  passage 042\nauto    0.74  passage 117\nhybrid  0.79  passage 042',
  },
  {
    id: 'reranking',
    label: 'Reranking',
    detail: 'A reranker reorders the candidates by how well they support the question before anything is generated.',
    sample: 'before  [042, 117, 003, 088]\nafter   [042, 088, 117, 003]',
  },
  {
    id: 'context',
    label: 'Context',
    detail: 'The strongest passages are assembled into a bounded context window with their source references attached.',
    sample: 'context  3 passages · 1,840 tokens\nsources  paper.pdf p.12, p.19, p.31',
  },
  {
    id: 'answer',
    label: 'Answer',
    detail: 'The model answers only from the assembled context and cites what it used, or says the corpus is not enough.',
    sample: 'answer  "…grounded in the cited passages."\ncitations  [p.12] [p.19]',
  },
]

// Every AI project is framed in a shape, dealt at random along with the order.
const FRAMES = [
  'rounded-full',
  'rounded-[38%]',
  'rounded-b-[28px] rounded-t-[999px]',
  'rounded-b-[999px] rounded-t-[28px]',
  'rounded-bl-[28px] rounded-br-[999px] rounded-tl-[999px] rounded-tr-[28px]',
  'rounded-bl-[999px] rounded-br-[28px] rounded-tl-[28px] rounded-tr-[999px]',
]

const deal = () =>
  shuffle(AI_PROJECTS).map((project) => ({
    project,
    frame: FRAMES[Math.floor(Math.random() * FRAMES.length)],
  }))

const AICard = ({ project, frame }: { project: Project; frame: string }) => {
  const glyph = CATEGORY_SHAPE[project.category]
  return (
    <motion.a
      layout
      variants={cardIn}
      transition={spring}
      href={project.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block w-[248px] flex-none snap-start sm:w-[288px]"
    >
      <div className={`relative aspect-square overflow-hidden bg-paper-2 ${frame}`}>
        <img
          src={`/previews/${project.slug}.jpg`}
          alt={`${project.name} interface`}
          width={1280}
          height={800}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.08]"
        />
        {/* A yellow print of the screenshot; the real colours come through on hover. */}
        <span aria-hidden="true" className="absolute inset-0 bg-sun mix-blend-multiply transition-opacity duration-500 group-hover:opacity-0" />
        <span className="absolute bottom-[14%] right-[14%] grid h-10 w-10 scale-0 place-items-center rounded-full bg-sun text-ink transition-transform duration-300 group-hover:scale-100">
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-5 flex items-center gap-2 font-mono text-[10.5px] font-medium uppercase tracking-[0.16em] text-ink/60">
        <Shape kind={glyph.kind} color={glyph.color} className="h-3 w-3" />
        {project.tags.slice(0, 2).join(' · ')}
      </p>
      <h4 className="mt-2 font-display text-xl font-semibold tracking-[-0.03em]">{project.name}</h4>
      <p className="mt-1 text-sm leading-relaxed text-ink/60">{project.tagline}</p>
    </motion.a>
  )
}

const AICapabilities = () => {
  const [activeId, setActiveId] = useState('reranking')
  const [deck] = useState(deal)
  const active = STAGES.find((stage) => stage.id === activeId) ?? STAGES[0]
  const reduce = useReducedMotion()

  const pipelineRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: pipelineRef, offset: ['start 0.85', 'end 0.5'] })
  const line = useSpring(scrollYProgress, { stiffness: 120, damping: 30 })

  const railRef = useRef<HTMLDivElement>(null)
  const { scrollXProgress } = useScroll({ container: railRef })

  const nudge = (direction: 1 | -1) =>
    railRef.current?.scrollBy({ left: direction * 620, behavior: reduce ? 'auto' : 'smooth' })

  return (
    <section id="applied-ai" className="relative overflow-clip border-t border-ink/10 bg-paper py-28 sm:py-36">
      <ShapeField seed="applied-ai" count={5} mobileCount={2} sizes={[40, 96]} />
      <div className="container-x relative">
        <Reveal>
          <p className="eyebrow text-ink">
            <Shape kind="sparkle" color="cobalt" className="h-4 w-4" /> Applied AI
          </p>
          <Heading
            text="Beyond the prompt. Into the system."
            accent="Into the system."
            className="h-section mt-6 max-w-4xl"
          />
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink/65">
            AI applications built around retrieval, context, evaluation, and the engineering
            required to turn model capabilities into software that can show its work.
          </p>
        </Reveal>

        <div ref={pipelineRef} className="relative mt-16">
          <div aria-hidden="true" className="absolute left-[8%] right-[8%] top-7 hidden h-[2px] bg-ink/10 sm:block" />
          <motion.div
            aria-hidden="true"
            className="absolute left-[8%] right-[8%] top-7 hidden h-[2px] origin-left bg-ink sm:block"
            style={{ scaleX: reduce ? 1 : line }}
          />
          <div className="relative grid grid-cols-3 gap-y-8 sm:grid-cols-6">
            {STAGES.map((stage, index) => {
              const isActive = stage.id === activeId
              return (
                <button
                  key={stage.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setActiveId(stage.id)}
                  className="group flex flex-col items-center gap-3 rounded-3xl"
                >
                  <motion.span
                    animate={{ scale: isActive ? 1.18 : 1 }}
                    whileHover={{ scale: isActive ? 1.18 : 1.08 }}
                    transition={spring}
                    className={`relative grid h-14 w-14 place-items-center rounded-full border-2 font-mono text-xs font-medium transition-colors ${
                      isActive ? 'border-ink bg-sun text-ink' : 'border-ink/15 bg-paper text-ink/60 group-hover:border-ink'
                    }`}
                  >
                    0{index + 1}
                  </motion.span>
                  <span className={`text-sm font-medium ${isActive ? 'text-ink' : 'text-ink/60'}`}>{stage.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="mt-12 grid gap-4 rounded-[32px] border border-ink/10 bg-paper p-4 sm:p-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="p-2">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`${active.id}-text`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <p className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-ink/60">
                  Stage active — {active.label}
                </p>
                <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink/80">{active.detail}</p>
              </motion.div>
            </AnimatePresence>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a href="https://rag.nevatal.id" target="_blank" rel="noopener noreferrer" className="btn btn-ink !py-2.5">
                Explore it in RAGReader <ArrowUpRight className="h-4 w-4" />
              </a>
              <a href="https://crag.nevatal.id" target="_blank" rel="noopener noreferrer" className="btn btn-line !py-2.5">
                Corrective RAG with CRAG MultiHop <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="rounded-[24px] bg-ink p-5 text-paper/80">
            <p className="flex items-center gap-2 font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-paper/60">
              <span className="h-1.5 w-1.5 rounded-full bg-sun" /> Sample stage output
            </p>
            <AnimatePresence mode="wait" initial={false}>
              <motion.pre
                key={active.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="mt-4 overflow-x-auto whitespace-pre-wrap font-mono text-[12px] leading-relaxed text-paper/85"
              >
                {active.sample}
              </motion.pre>
            </AnimatePresence>
          </div>
        </div>

        <p className="mt-4 font-mono text-[11px] text-ink/60">
          A representative retrieval workflow based on RAGReader and CRAG MultiHop; individual
          implementations differ.
        </p>

        <div className="mt-24 flex flex-col justify-between gap-6 border-t border-ink/10 pt-10 sm:flex-row sm:items-end">
          <div>
            <h3 className="font-display text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              Where the models ship.
            </h3>
            <p className="mt-3 max-w-lg text-ink/65">
              {deck.length} projects put AI or machine learning to work across production environments.
            </p>
          </div>
          <div className="flex flex-none items-center gap-2">
            <button
              type="button"
              onClick={() => scrollToSection('engineering')}
              className="btn btn-ink !px-4"
            >
              Engineering stack <ArrowDown className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => nudge(-1)} className="btn btn-line !px-3" aria-label="Scroll the AI projects back">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => nudge(1)} className="btn btn-line !px-3" aria-label="Scroll the AI projects forward">
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <motion.div
        ref={railRef}
        role="region"
        aria-label="Projects that use AI"
        className="no-scrollbar relative mt-10 flex snap-x snap-mandatory scroll-px-5 gap-6 overflow-x-auto px-5 pb-6 sm:scroll-px-8 sm:px-8 lg:scroll-px-[max(2rem,calc((100vw_-_72rem)/2_+_2rem))] lg:px-[max(2rem,calc((100vw_-_72rem)/2_+_2rem))]"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
        {...revealProps()}
      >
        {deck.map(({ project, frame }) => (
          <AICard key={project.slug} project={project} frame={frame} />
        ))}
      </motion.div>
      <div className="container-x">
        <div className="h-[3px] overflow-hidden rounded-full bg-ink/10">
          <motion.div className="h-full origin-left rounded-full bg-ink" style={{ scaleX: scrollXProgress }} />
        </div>
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => scrollToSection('engineering')}
            className="btn btn-line"
          >
            Explore engineering architecture <ArrowDown className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  )
}

export default AICapabilities
