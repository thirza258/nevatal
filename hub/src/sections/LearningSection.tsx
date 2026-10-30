import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import AbstractShape from '../components/decor/AbstractShape'
import Reveal from '../components/motion/Reveal'
import { ArrowUpRight } from '../components/icons'
import { spring } from '../lib/motion'

const TOPICS = [
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
  },
]

const LearningSection = () => {
  const [activeId, setActiveId] = useState(TOPICS[0].id)
  const active = TOPICS.find((topic) => topic.id === activeId) ?? TOPICS[0]

  return (
    <section className="relative overflow-hidden bg-paper py-20 sm:py-28">
      <AbstractShape
        shape="trapezoid"
        tone="maroon"
        className="-right-6 bottom-0 h-32 w-32 sm:-right-10 sm:h-44 sm:w-44"
      />
      <AbstractShape
        shape="triangle"
        tone="brand"
        rotate={false}
        className="left-4 top-6 h-14 w-14 sm:left-8 sm:top-10 sm:h-20 sm:w-20"
      />
      <div className="container-x relative grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <Reveal>
          <p className="eyebrow text-maroon">Learning</p>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Learn by building.
          </h2>
          <p className="mt-4 max-w-md leading-relaxed text-ink/60">
            Technical concepts explained through working examples — courses, labs and practice that
            stay useful even when you do not have an API key.
          </p>

          <div className="mt-7 space-y-1">
            {TOPICS.map((topic) => {
              const isActive = topic.id === activeId
              return (
                <button
                  key={topic.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setActiveId(topic.id)}
                  className={`relative w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                    isActive ? 'text-ink' : 'text-ink/45 hover:text-ink'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="learning-topic"
                      className="absolute inset-0 rounded-xl border border-ink/10 bg-white shadow-sm"
                      transition={spring}
                    />
                  )}
                  <span className="relative z-10 flex items-center justify-between gap-3">
                    {topic.label}
                    <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-ink/35">
                      {topic.project}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-[0_24px_70px_-40px_rgba(10,13,18,0.4)]">
            <div className="flex items-center justify-between gap-3 border-b border-ink/10 px-4 py-3">
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/45">
                {active.course}
              </span>
              <span className="rounded-full bg-brand/30 px-2.5 py-0.5 text-[10px] font-semibold text-ink/70">
                Sample lesson
              </span>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={active.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="p-5"
              >
                <h3 className="font-display text-xl font-semibold tracking-tight">{active.title}</h3>
                <pre className="mt-4 overflow-x-auto rounded-xl bg-ink p-4 font-mono text-[12px] leading-relaxed text-paper/80">
                  {active.code}
                </pre>
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-600/20 bg-emerald-50 px-3 py-2 font-mono text-[11px] text-emerald-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {active.output}
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <p className="text-[11px] text-ink/40">Sample content from the live curriculum.</p>
                  <a
                    href={active.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-ink underline underline-offset-4 hover:text-blue"
                  >
                    Open {active.project} <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

export default LearningSection