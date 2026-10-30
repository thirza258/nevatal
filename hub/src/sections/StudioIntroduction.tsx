import { motion, type Variants } from 'framer-motion'
import AbstractShape from '../components/decor/AbstractShape'
import Reveal from '../components/motion/Reveal'
import { easeOut, stagger } from '../lib/motion'

const disciplineItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: easeOut } },
}

const DISCIPLINES = [
  'Applied AI',
  'Product engineering',
  'Developer tools',
  'Learning platforms',
  'Self-hosted infrastructure',
]

const StudioIntroduction = () => (
  <section className="relative overflow-hidden bg-paper py-24 sm:py-32">
    <AbstractShape shape="triangle-outline" tone="dark" className="-right-20 top-10 h-64 w-64" />
    <AbstractShape shape="ring" tone="dark" className="-left-16 bottom-0 hidden h-44 w-44 sm:block" />
    <div className="container-x relative">
      <Reveal>
        <p className="eyebrow text-maroon">A small studio. A wide technical scope.</p>
      </Reveal>

      <Reveal delay={0.08}>
        <h2 className="mt-6 max-w-4xl font-display text-[clamp(2.2rem,5vw,4.2rem)] font-semibold leading-[1.05] tracking-tight">
          From intelligent systems to products people can actually use.
        </h2>
      </Reveal>

      <div className="mt-10 flex justify-end">
        <Reveal delay={0.14}>
          <p className="max-w-md leading-relaxed text-ink/60">
            Nevatal explores the intersection of artificial intelligence, software engineering, and
            accessible technology. The focus is turning technical ideas into practical products,
            tools, and learning experiences.
          </p>
        </Reveal>
      </div>

      <motion.ul
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-10% 0px' }}
        variants={stagger}
        className="mt-14 flex flex-wrap gap-x-8 gap-y-3 border-t border-ink/10 pt-6"
      >
        {DISCIPLINES.map((discipline) => (
          <motion.li
            key={discipline}
            variants={disciplineItem}
            className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/45"
          >
            {discipline}
          </motion.li>
        ))}
      </motion.ul>
    </div>
  </section>
)

export default StudioIntroduction