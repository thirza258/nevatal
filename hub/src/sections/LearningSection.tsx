import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import MorphShape from '../components/decor/MorphShape'
import Shape from '../components/decor/Shape'
import ShapeField from '../components/decor/ShapeField'
import Heading from '../components/motion/Heading'
import Reveal from '../components/motion/Reveal'
import { ArrowDown, ArrowUpRight } from '../components/icons'
import type { PolarShape } from '../lib/shapes'
import { spring } from '../lib/motion'
import { scrollToSection } from '../lib/scroll'

const TOPICS: Array<{
  id: string
  label: string
  project: string
  course: string
  title: string
  code: string
  output: string
  url: string
  shape: Exclude<PolarShape, 'rect'>
}> = [
  {
    id: 'voltquest',
    label: 'VoltQuest',
    project: 'VoltQuest',
    course: 'Computer architecture · Lab 03',
    title: 'From truth tables to gates',
    code: `A B | Y
0 0 | 0
0 1 | 0
1 0 | 0
1 1 | 1`,
    output: 'Y = A · B — this is an AND gate.',
    url: 'https://pcb.nevatal.id',
    shape: 'square',
  },
  {
    id: 'leetbug',
    label: 'LeetBug',
    project: 'LeetBug',
    course: 'Python debugging · Case 118',
    title: 'Fix the failing test',
    code: `def total(coins):
    # coins are not integers
    return sum(coins)`,
    output: '3 tests · 2 pass · 1 failing → total([25, 10])',
    url: 'https://leetbug.nevatal.id',
    shape: 'burst',
  },
  {
    id: 'japanese',
    label: 'Gemini Japanese',
    project: 'Gemini Japanese',
    course: 'N5 · Kanji card 012',
    title: 'Kanji in context',
    code: `水 (mizu) — water
水曜日 (suiyōbi) — Wednesday
洪水 (kōzui) — flood`,
    output: '3 readings · 1 listening passage',
    url: 'https://hira.nevatal.id',
    shape: 'flower',
  },
]

const LearningSection = () => {
  const [activeId, setActiveId] = useState(TOPICS[0].id)
  const active = TOPICS.find((topic) => topic.id === activeId) ?? TOPICS[0]

  return (
    <section id="learning" className="relative overflow-clip border-t border-ink/10 bg-paper py-28 sm:py-36">
      <ShapeField seed="learning" count={4} mobileCount={2} sizes={[40, 90]} />
      <div className="container-x relative grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <Reveal>
          <p className="eyebrow text-ink">
            <Shape kind="flower" color="sun" className="h-4 w-4" /> Learning
          </p>
          <Heading text="Learn by building." accent="building." className="h-section mt-6" />
          <p className="mt-6 max-w-md text-lg leading-relaxed text-ink/65">
            Technical concepts explained through working examples — courses, labs and practice that
            stay useful even when you do not have an API key.
          </p>

          <div className="mt-10 border-t border-ink/10">
            {TOPICS.map((topic, index) => {
              const isActive = topic.id === activeId
              return (
                <button
                  key={topic.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setActiveId(topic.id)}
                  className={`relative flex w-full items-center justify-between gap-3 border-b border-ink/10 px-4 py-5 text-left transition-colors ${
                    isActive ? 'text-ink' : 'text-ink/60 hover:text-ink'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="learning-topic"
                      className="absolute inset-0 rounded-2xl bg-sun"
                      transition={spring}
                    />
                  )}
                  <span className="relative flex items-baseline gap-4">
                    <span className="font-mono text-xs">0{index + 1}</span>
                    <span className="font-display text-2xl font-semibold tracking-[-0.03em]">{topic.label}</span>
                  </span>
                  <span className="relative font-mono text-[10px] uppercase tracking-[0.14em]">
                    {topic.course.split(' · ')[0]}
                  </span>
                </button>
              )
            })}
          </div>
        </Reveal>

        <Reveal delay={0.08} y={60} rotate={2}>
          <div className="relative">
            <MorphShape
              shape={active.shape}
              color="sun"
              className="absolute -right-10 -top-12 h-56 w-56 sm:-right-16 sm:-top-16 sm:h-72 sm:w-72"
            />
            <div className="relative overflow-hidden rounded-[32px] border border-ink/10 bg-paper shadow-[0_50px_100px_-60px_rgba(11,11,13,0.5)]">
              <div className="flex items-center justify-between gap-3 border-b border-ink/10 px-6 py-4">
                <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-ink/60">
                  {active.course}
                </span>
                <span className="rounded-full bg-sun-soft px-3 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-ink">
                  Sample lesson
                </span>
              </div>

              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={active.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.22 }}
                  className="p-6"
                >
                  <h3 className="font-display text-2xl font-semibold tracking-[-0.03em]">{active.title}</h3>
                  <pre className="mt-5 overflow-x-auto rounded-[20px] bg-ink p-5 font-mono text-[13px] leading-relaxed text-paper/85">
                    {active.code}
                  </pre>
                  <div className="mt-3 flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2.5 font-mono text-[11px] text-emerald-800">
                    <span className="h-1.5 w-1.5 flex-none rounded-full bg-emerald-500" />
                    {active.output}
                  </div>
                  <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-ink/60">Sample content from the live curriculum.</p>
                    <a href={active.url} target="_blank" rel="noopener noreferrer" className="btn btn-ink !py-2.5">
                      Open {active.project} <ArrowUpRight className="h-4 w-4" />
                    </a>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </Reveal>
      </div>

      <div className="container-x mt-14 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => scrollToSection('infrastructure')}
          className="btn btn-ink"
        >
          Next: Self-hosted infrastructure <ArrowDown className="h-4 w-4" />
        </button>
      </div>
    </section>
  )
}

export default LearningSection
