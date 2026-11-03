import PillPile from '../components/decor/PillPile'
import Shape from '../components/decor/Shape'
import ShapeField from '../components/decor/ShapeField'
import Reveal from '../components/motion/Reveal'
import ScrollWords from '../components/motion/ScrollWords'
import { ArrowDown } from '../components/icons'
import { scrollToSection } from '../lib/scroll'

const DISCIPLINES = [
  'Applied AI',
  'Product engineering',
  'Developer tools',
  'Learning platforms',
  'Self-hosted infrastructure',
]

const StudioIntroduction = () => (
  <section id="studio" className="relative scroll-mt-24 overflow-clip bg-paper py-20 sm:scroll-mt-28 sm:py-40">
    <ShapeField seed="studio" count={5} mobileCount={2} sizes={[40, 96]} />
    <div className="container-x relative">
      <Reveal>
        <p className="eyebrow text-ink">
          <Shape kind="circle" color="plum" className="h-2.5 w-2.5" /> A small studio. A wide technical scope.
        </p>
      </Reveal>

      <h2 className="mt-8 max-w-5xl font-display text-[clamp(2.3rem,5.4vw,4.8rem)] font-semibold leading-[1.02] tracking-[-0.045em]">
        <ScrollWords text="From intelligent systems to products people can actually use." />
      </h2>

      <div className="mt-16 grid grid-cols-1 gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
        <PillPile items={DISCIPLINES} seed="disciplines" size="lg" className="min-h-[220px] max-w-2xl" />
        <Reveal delay={0.1}>
          <p className="max-w-md text-lg leading-relaxed text-ink/65">
            Nevatal explores the intersection of artificial intelligence, software engineering, and
            accessible technology. The focus is turning technical ideas into practical products,
            tools, and learning experiences.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => scrollToSection('ecosystem')}
              className="btn btn-ink"
            >
              Explore the ecosystem <ArrowDown className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('ai-hub')}
              className="btn btn-line"
            >
              Flagship AI Hub <ArrowDown className="h-4 w-4" />
            </button>
          </div>
        </Reveal>
      </div>
    </div>
  </section>
)

export default StudioIntroduction
