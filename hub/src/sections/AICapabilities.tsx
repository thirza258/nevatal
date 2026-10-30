import { useState } from 'react'
import { motion } from 'framer-motion'
import AbstractShape from '../components/decor/AbstractShape'
import Reveal from '../components/motion/Reveal'
import { ArrowUpRight } from '../components/icons'

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

const AICapabilities = () => {
  const [activeId, setActiveId] = useState('reranking')
  const active = STAGES.find((stage) => stage.id === activeId) ?? STAGES[0]

  return (
    <section className="relative overflow-hidden bg-paper py-20 sm:py-28">
      <AbstractShape
        shape="triangle-outline"
        tone="blue"
        className="-right-6 top-8 h-40 w-40 sm:-right-8 sm:h-56 sm:w-56"
      />
      <AbstractShape
        shape="trapezoid-outline"
        tone="maroon"
        className="bottom-6 left-3 h-24 w-24 sm:left-6 sm:h-32 sm:w-32"
      />
      <div className="container-x relative">
        <Reveal>
          <p className="eyebrow text-blue">Applied AI</p>
          <h2 className="mt-4 max-w-3xl font-display text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            Beyond the prompt. Into the system.
          </h2>
          <p className="mt-4 max-w-2xl leading-relaxed text-ink/60">
            AI applications built around retrieval, context, evaluation, and the engineering
            required to turn model capabilities into software that can show its work.
          </p>
        </Reveal>

        <Reveal delay={0.08} className="mt-10">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {STAGES.map((stage, index) => {
              const isActive = stage.id === activeId
              return (
                <button
                  key={stage.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setActiveId(stage.id)}
                  className={`flex flex-none items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-ink bg-ink text-paper'
                      : 'border-ink/15 bg-white text-ink/55 hover:border-ink/35 hover:text-ink'
                  }`}
                >
                  <span className={`text-[10px] tabular-nums ${isActive ? 'text-brand' : 'text-ink/35'}`}>
                    0{index + 1}
                  </span>
                  {stage.label}
                </button>
              )
            })}
          </div>
        </Reveal>

        <div className="mt-4 grid gap-4 rounded-2xl border border-ink/10 bg-white p-5 lg:grid-cols-[1.1fr_0.9fr] sm:p-6">
          <div>
            <motion.div
              key={`${active.id}-text`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/40">
                Stage active — {active.label}
              </p>
              <p className="mt-3 max-w-xl leading-relaxed text-ink/70">{active.detail}</p>
            </motion.div>

            <div className="mt-6 flex flex-wrap items-center gap-3 text-xs">
              <a
                href="https://rag.nevatal.id"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-ink underline underline-offset-4 hover:text-blue"
              >
                Explore it in RAGReader <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
              <a
                href="https://crag.nevatal.id"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-ink/55 underline underline-offset-4 hover:text-blue"
              >
                Corrective RAG with CRAG MultiHop <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          <div className="rounded-xl border border-ink/10 bg-ink p-4 text-paper/75">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-paper/35">
              Sample stage output
            </p>
            <pre className="mt-3 overflow-x-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-paper/70">
              {active.sample}
            </pre>
          </div>
        </div>

        <p className="mt-3 text-[11px] text-ink/40">
          A representative retrieval workflow based on RAGReader and CRAG MultiHop; individual
          implementations differ.
        </p>
      </div>
    </section>
  )
}

export default AICapabilities