import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Shape, { type ShapeColor, type ShapeKind } from '../components/decor/Shape'
import ShapeField from '../components/decor/ShapeField'
import Heading from '../components/motion/Heading'
import Magnetic from '../components/motion/Magnetic'
import Reveal from '../components/motion/Reveal'
import { Stagger, StaggerItem } from '../components/motion/Stagger'
import Typewriter from '../components/motion/Typewriter'
import { ArrowDown, ArrowUpRight } from '../components/icons'
import { AI_HUB_COURSES_URL, AI_HUB_URL } from '../lib/constants'
import { spring } from '../lib/motion'
import { scrollToSection } from '../lib/scroll'

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

const FEATURES: Array<{ title: string; body: string; shape: ShapeKind; color: ShapeColor }> = [
  {
    title: 'A form per job',
    body: 'Task-specific inputs for prompting, writing, translation, documents and data.',
    shape: 'square',
    color: 'sun',
  },
  {
    title: 'Your key, your bill',
    body: 'OpenAI, Gemini or OpenRouter — no markup, no subscription.',
    shape: 'circle',
    color: 'cobalt',
  },
  {
    title: 'Seventeen tools, one history',
    body: 'Every result lands in a session history you can revisit, reply to or delete.',
    shape: 'sparkle',
    color: 'plum',
  },
  {
    title: 'Learn while you use it',
    body: 'Free courses with worked examples, readable without an API key.',
    shape: 'half',
    color: 'ink',
  },
]

const AIHubSection = () => {
  const [activeId, setActiveId] = useState(DEMO_TOOLS[0].id)
  const active = DEMO_TOOLS.find((tool) => tool.id === activeId) ?? DEMO_TOOLS[0]

  return (
    <section id="ai-hub" className="relative scroll-mt-24 overflow-clip bg-paper py-20 sm:scroll-mt-28 sm:py-36">
      <ShapeField seed="ai-hub" count={5} mobileCount={2} sizes={[40, 100]} />
      <div className="container-x relative grid grid-cols-1 items-center gap-16 lg:grid-cols-[0.92fr_1.08fr]">
        <div>
          <Reveal>
            <p className="eyebrow text-ink">
              <Shape kind="sparkle" color="sun" className="h-4 w-4" /> The flagship
            </p>
            <Heading
              text="One hub. More ways to work with AI."
              accent="More ways"
              squiggle
              className="h-section mt-6"
            />
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink/65">
              A single workspace for prompting, writing, translation, documents and data — each
              tool asks for exactly what it needs, on the key you bring.
            </p>
          </Reveal>

          <Stagger as="ul" className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {FEATURES.map((feature) => (
              <StaggerItem as="li" key={feature.title} className="flex gap-3.5">
                <motion.span whileHover={{ rotate: 180, scale: 1.2 }} transition={spring} className="mt-0.5 flex-none">
                  <Shape kind={feature.shape} color={feature.color} className="h-6 w-6" />
                </motion.span>
                <div>
                  <p className="font-semibold tracking-[-0.01em]">{feature.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-ink/60">{feature.body}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>

          <Reveal delay={0.1} className="mt-10 flex flex-wrap gap-3">
            <Magnetic>
              <a href={AI_HUB_URL} target="_blank" rel="noopener noreferrer" className="btn btn-ink">
                Open the AI Hub <ArrowUpRight className="h-4 w-4" />
              </a>
            </Magnetic>
            <Magnetic>
              <a href={AI_HUB_COURSES_URL} className="btn btn-line">
                Browse free courses
              </a>
            </Magnetic>
          </Reveal>
        </div>

        <Reveal delay={0.08} y={60} rotate={2}>
          <div
            role="region"
            aria-label="Interactive AI Hub sample"
            className="relative overflow-hidden rounded-[32px] border border-ink/10 bg-paper shadow-[0_50px_100px_-60px_rgba(11,11,13,0.5)]"
          >
            <div className="flex items-center gap-3 border-b border-ink/10 px-5 py-4">
              <span className="flex gap-1.5" aria-hidden="true">
                <span className="h-2.5 w-2.5 rounded-full bg-sun" />
                <span className="h-2.5 w-2.5 rounded-full bg-cobalt" />
                <span className="h-2.5 w-2.5 rounded-full bg-plum" />
              </span>
              <span className="rounded-full bg-paper-2 px-3 py-1 font-mono text-[11px] text-ink/70">
                chat.nevatal.id
              </span>
              <span className="ml-auto hidden font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-ink/60 sm:inline">
                Local sample
              </span>
            </div>

            <div className="no-scrollbar flex gap-1.5 overflow-x-auto px-4 pt-4">
              {DEMO_TOOLS.map((tool) => {
                const isActive = tool.id === activeId
                return (
                  <button
                    key={tool.id}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setActiveId(tool.id)}
                    className={`relative flex-none whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      isActive ? 'text-paper' : 'text-ink/65 hover:text-ink'
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="aihub-active-tool"
                        className="absolute inset-0 rounded-full bg-ink"
                        transition={spring}
                      />
                    )}
                    <span className="relative">{tool.label}</span>
                  </button>
                )
              })}
            </div>

            <div className="flex min-h-[320px] flex-col p-5 sm:p-6">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activeId}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.22 }}
                  className="flex flex-1 flex-col"
                >
                  <div className="ml-auto max-w-[88%] rounded-[22px] rounded-br-md bg-ink px-4 py-3 text-sm leading-relaxed text-paper">
                    {active.prompt}
                  </div>
                  <div className="mt-4 max-w-[94%] rounded-[22px] rounded-bl-md bg-sun-soft px-4 py-3.5 text-sm text-ink/85">
                    <p className="flex items-center gap-2 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-ink/70">
                      <Shape kind="sparkle" color="ink" className="h-3 w-3" />
                      {active.label} · sample response
                    </p>
                    <Typewriter text={active.reply} className="mt-2 whitespace-pre-line leading-relaxed" />
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="mt-5 flex min-w-0 items-center justify-between rounded-full border border-ink/10 py-1.5 pl-4 pr-1.5 font-mono text-[11px] text-ink/60">
                <span className="min-w-0 truncate">{active.meta}</span>
                <span className="ml-2 flex-none whitespace-nowrap rounded-full bg-sun px-3 py-1 font-medium text-ink">
                  Run
                </span>
              </div>
            </div>
          </div>
          <p className="mt-4 text-center font-mono text-[11px] text-ink/60">
            Interactive sample with local data — nothing is sent to a model from this page.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Magnetic>
              <a href={AI_HUB_URL} target="_blank" rel="noopener noreferrer" className="btn btn-ink">
                Open the AI Hub <ArrowUpRight className="h-4 w-4" />
              </a>
            </Magnetic>
            <Magnetic>
              <button
                type="button"
                onClick={() => scrollToSection('applied-ai')}
                className="btn btn-line"
              >
                See applied AI pipeline <ArrowDown className="h-4 w-4" />
              </button>
            </Magnetic>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

export default AIHubSection
