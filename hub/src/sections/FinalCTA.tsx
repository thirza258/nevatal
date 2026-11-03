import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import MorphShape from '../components/decor/MorphShape'
import Shape from '../components/decor/Shape'
import ShapeField from '../components/decor/ShapeField'
import Heading from '../components/motion/Heading'
import Magnetic from '../components/motion/Magnetic'
import { ArrowDown, ArrowRight, ArrowUpRight } from '../components/icons'
import { AI_HUB_URL } from '../lib/constants'
import { useWide } from '../lib/hooks'
import type { PolarShape } from '../lib/shapes'
import { scrollToSection } from '../lib/scroll'

/**
 * The call to action lives inside one big yellow shape: it swells into place
 * as it scrolls up, turns slowly, and changes form under each button.
 */
const FinalCTA = () => {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const wide = useWide()
  const [shape, setShape] = useState<Exclude<PolarShape, 'rect'>>('blob')
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'center 0.55'] })
  const scale = useTransform(scrollYProgress, [0, 1], [0.6, 1])
  const rotate = useTransform(scrollYProgress, [0, 1], [-25, 0])

  return (
    <section id="final-cta" className="relative scroll-mt-24 overflow-clip bg-paper pb-20 pt-8 sm:scroll-mt-28 sm:pb-32 sm:pt-10">
      <div ref={ref} className="container-x">
        <motion.div
          style={reduce ? undefined : { scale, rotate }}
          className="relative mx-auto grid w-full max-w-[860px] grid-cols-1 place-items-center py-16 sm:aspect-square sm:py-0"
        >
          {wide ? (
            <MorphShape shape={shape} color="sun" className="absolute inset-0" />
          ) : (
            <div aria-hidden="true" className="absolute inset-0 rounded-[40px] bg-sun" />
          )}
          <ShapeField seed="cta" tone="sun" count={6} mobileCount={2} sizes={[34, 72]} />

          <div className="relative max-w-sm px-6 text-center md:max-w-md">
            <p className="eyebrow justify-center text-ink">
              <Shape kind="sparkle" color="paper" className="h-4 w-4" /> Start here
            </p>
            <Heading
              text="Put the portfolio to work."
              accent="work."
              className="mt-5 font-display text-[clamp(2.3rem,5vw,4rem)] font-semibold leading-[0.98] tracking-[-0.045em]"
            />
            <p className="mx-auto mt-5 max-w-xs text-ink/80 sm:max-w-sm">
              Explore the products, experiment with the AI Hub, and discover what Nevatal is building.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Magnetic>
                <a
                  href={AI_HUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ink"
                  onMouseEnter={() => setShape('sparkle')}
                  onMouseLeave={() => setShape('blob')}
                >
                  Open the AI Hub <ArrowUpRight className="h-4 w-4" />
                </a>
              </Magnetic>
              <Magnetic>
                <Link
                  to="/projects"
                  className="btn btn-paper"
                  onMouseEnter={() => setShape('flower')}
                  onMouseLeave={() => setShape('blob')}
                >
                  See all projects <ArrowRight className="h-4 w-4" />
                </Link>
              </Magnetic>
              <Magnetic>
                <button
                  type="button"
                  onClick={() => scrollToSection('ecosystem')}
                  className="btn btn-paper"
                  onMouseEnter={() => setShape('circle')}
                  onMouseLeave={() => setShape('blob')}
                >
                  Explore ecosystem <ArrowDown className="h-4 w-4" />
                </button>
              </Magnetic>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default FinalCTA
