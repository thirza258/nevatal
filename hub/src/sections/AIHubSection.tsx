import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import AbstractShape from '../components/decor/AbstractShape'
import Reveal from '../components/motion/Reveal'
import { Stagger, StaggerItem } from '../components/motion/Stagger'
import { ArrowUpRight, Check } from '../components/icons'
import { AI_HUB_COURSES_URL, AI_HUB_URL } from '../lib/constants'
import { spring } from '../lib/motion'

interface DemoTool {
  id: string
  label: string
  prompt: string
  reply: string
  meta: string
}

const DEMO_TOOLS: DemoTool[] = [
  {
    id: 'prompt',
    label: 'Prompt',
    prompt: 'Draft a launch note for a developer tool — honest, no hype.',
    reply:
      'Launch note — first draft\nWe rebuilt the upload path because it broke in the same three places: disconnects, large files, retries. Uploads now resume, checksums run before publish, and failures explain themselves.',
    meta: 'Markdown · 412 tokens',
  },
  {
    id: 'writer',
    label: 'Writer',
    prompt: 'Turn these release notes into a changelog people will actually read.',
    reply:
      'v2.4 — Faster uploads\n• Uploads resume after a dropped connection.\n• Checksums run before anything goes public.\n• Failed jobs now say why, in one sentence.',
    meta: 'Markdown · 286 tokens',
  },
  {
    id: 'translator',
    label: 'Translator',
    prompt: 'Translate the onboarding email to Bahasa Indonesia. Keep it warm, not formal.',
    reply:
      'Selamat datang di Nevatal.\nAkunmu sudah siap. Mulai dari satu alat kecil — tulis satu prompt, unggah satu dokumen — lalu lihat hasilnya. Tidak ada langganan, tidak ada biaya tersembunyi.',
    meta: 'Plain text · 198 tokens',
  },
  {
    id: 'documents',
    label: 'Document AI',
    prompt: 'Summarise this report and list the three decisions it needs.',
    reply:
      'Summary — Q3 infrastructure review\nThe stack held through a 3× traffic spike. Costs stayed flat.\nDecisions: 1) keep the single-node database for another quarter, 2) move image processing to the queue, 3) schedule the backup drill.',
    meta: 'Document Q&A · 5 sources cited',
  },
  {
    id: 'data',
    label: 'Data',
    prompt: 'Profile this CSV and flag the columns with suspect values.',
    reply:
      '14 columns · 2,318 rows\nFlagged: signup_date has 12 impossible dates; revenue has 2 negative entries; country mixes ISO codes and full names.',
    meta: 'CSV · 2,318 rows',
  },
  {
    id: 'batch',
    label: 'Batch',
    prompt: 'Run this prompt across 120 product descriptions.',
    reply:
      'Queued 120 items\nCompleted 118 · 2 need review\nAverage runtime 3.4s per item. Results are in session history.',
    meta: 'Batch · 120 items',
  },
]

const FEATURES = [
  {
    title: 'A form per job',
    body: 'Task-specific inputs for prompting, writing, translation, documents and data.',
  },
  {
    title: 'Your key, your bill',
    body: 'OpenAI, Gemini or OpenRouter — no markup, no subscription.',
  },
  {
    title: 'Seventeen tools, one history',
    body: 'Every result lands in a session history you can revisit, reply to or delete.',
  },
  {
    title: 'Learn while you use it',
    body: 'Free courses with worked examples, readable without an API key.',
  },
]

const AIHubSection = () => {
  const [activeId, setActiveId] = useState(DEMO_TOOLS[0].id)
  const active = DEMO_TOOLS.find((tool) => tool.id === activeId) ?? DEMO_TOOLS[0]

  return (
    <section className="relative overflow-hidden border-t border-white/5 bg-ink py-24 text-paper sm:py-32">
      <AbstractShape
        shape="ring"
        tone="brand"
        className="-right-8 bottom-8 h-36 w-36 sm:-right-14 sm:h-56 sm:w-56"
      />
      <AbstractShape
        shape="trapezoid-outline"
        tone="light"
        className="-left-8 top-12 h-32 w-32 sm:-left-12 sm:h-52 sm:w-52"
      />
      <div className="container-x relative grid items-center gap-14 lg:grid-cols-[0.95fr_1.05fr]">
        <div>
          <Reveal>
            <p className="eyebrow text-brand">The flagship</p>
            <h2 className="mt-4 font-display text-[clamp(2.2rem,4.5vw,3.5rem)] font-semibold leading-[1.05] tracking-tight">
              One hub. More ways to work with AI.
            </h2>
            <p className="mt-5 max-w-lg leading-relaxed text-paper/60">
              A single workspace for prompting, writing, translation, documents and data — each
              tool asks for exactly what it needs, on the key you bring.
            </p>
          </Reveal>

          <Stagger className="mt-8 space-y-5">
            {FEATURES.map((feature) => (
              <StaggerItem key={feature.title} className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-brand text-ink">
                  <Check className="h-3 w-3" />
                </span>
                <div>
                  <p className="text-sm font-semibold">{feature.title}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-paper/55">{feature.body}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>

          <Reveal delay={0.1} className="mt-9 flex flex-wrap gap-3">
            <a
              href={AI_HUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              Open the AI Hub <ArrowUpRight className="h-4 w-4" />
            </a>
            <a href={AI_HUB_COURSES_URL} className="btn btn-ghost-light">
              Browse free courses
            </a>
          </Reveal>
        </div>

        <Reveal delay={0.08}>
          <div
            role="region"
            aria-label="Interactive AI Hub sample"
            className="overflow-hidden rounded-3xl border border-white/10 bg-[#0F1216] shadow-[0_40px_120px_-60px_rgba(0,0,0,0.9)]"
          >
            <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
              <span className="flex gap-1.5" aria-hidden="true">
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
              </span>
              <span className="rounded-full bg-white/5 px-3 py-0.5 text-[10px] text-paper/40">
                chat.nevatal.id
              </span>
              <span className="ml-auto rounded-full border border-white/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-paper/35">
                Local sample
              </span>
            </div>

            <div className="grid sm:grid-cols-[180px_1fr]">
              <div className="border-b border-white/10 p-3 sm:border-b-0 sm:border-r">
                <p className="px-2 pb-2 pt-1 text-[10px] uppercase tracking-[0.16em] text-paper/40">
                  Tools
                </p>
                <div className="flex gap-1 overflow-x-auto pb-1 sm:flex-col sm:overflow-visible">
                  {DEMO_TOOLS.map((tool) => {
                    const isActive = tool.id === activeId
                    return (
                      <button
                        key={tool.id}
                        type="button"
                        aria-pressed={isActive}
                        onClick={() => setActiveId(tool.id)}
                        className={`relative flex-none rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors sm:w-full ${
                          isActive ? 'text-ink' : 'text-paper/55 hover:text-paper'
                        }`}
                      >
                        {isActive && (
                          <motion.span
                            layoutId="aihub-active-tool"
                            className="absolute inset-0 rounded-lg bg-brand"
                            transition={spring}
                          />
                        )}
                        <span className="relative z-10 flex items-center gap-2 whitespace-nowrap">
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-ink' : 'bg-white/20'}`}
                          />
                          {tool.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex min-h-[300px] flex-col p-4 sm:p-5">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={activeId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-1 flex-col"
                  >
                    <div className="ml-auto max-w-[92%] rounded-xl rounded-br-sm bg-blue px-3.5 py-2.5 text-xs leading-relaxed text-white">
                      {active.prompt}
                    </div>
                    <div className="mt-3 max-w-[95%] rounded-xl rounded-bl-sm bg-white/[0.06] px-3.5 py-3 text-xs text-paper/70">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-paper/40">
                        {active.label} · sample response
                      </p>
                      <p className="mt-2 whitespace-pre-line leading-relaxed">{active.reply}</p>
                    </div>
                  </motion.div>
                </AnimatePresence>

                <div className="mt-4 flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[10px] text-paper/35">
                  <span>{active.meta}</span>
                  <span className="rounded bg-brand px-2 py-0.5 font-semibold text-ink">Run</span>
                </div>
              </div>
            </div>
          </div>
          <p className="mt-3 text-center text-[11px] text-paper/35">
            Interactive sample with local data — nothing is sent to a model from this page.
          </p>
        </Reveal>
      </div>
    </section>
  )
}

export default AIHubSection
