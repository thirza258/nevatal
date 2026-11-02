import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import PageHero from '../components/PageHero'
import MorphSection from '../components/decor/MorphSection'
import PillPile from '../components/decor/PillPile'
import Shape, { type ShapeColor, type ShapeKind } from '../components/decor/Shape'
import AnimatedCounter from '../components/motion/AnimatedCounter'
import Heading from '../components/motion/Heading'
import Magnetic from '../components/motion/Magnetic'
import Reveal from '../components/motion/Reveal'
import { Stagger, StaggerItem } from '../components/motion/Stagger'
import { ArrowRight, ArrowUpRight } from '../components/icons'
import { LIVE_PROJECTS, PROJECTS } from '../data/projects'
import { AI_HUB_URL, GITHUB_PROFILE_URL } from '../lib/constants'
import { easeOut, spring } from '../lib/motion'
import { usePageMeta } from '../lib/seo'

const PRINCIPLES: Array<{ title: string; body: string; shape: ShapeKind; color: ShapeColor }> = [
  {
    title: 'Ground the model',
    body: 'Retrieval, citations and narrow scopes come before clever prompting. If the source cannot support an answer, the product says so.',
    shape: 'sparkle',
    color: 'cobalt',
  },
  {
    title: 'Own the stack',
    body: 'React, Django, FastAPI, Rust and Postgres, packaged with Docker and run on infrastructure we control.',
    shape: 'square',
    color: 'ink',
  },
  {
    title: 'Charge for work, not access',
    body: 'The AI Hub is free with your own provider key, and the courses stay readable without a key at all.',
    shape: 'circle',
    color: 'plum',
  },
  {
    title: 'Ship the whole thing',
    body: 'Auth, queues, sandboxes, certificates and analytics — the unglamorous parts that make a product usable.',
    shape: 'burst',
    color: 'paper',
  },
]

const STACK = [
  'React',
  'TypeScript',
  'Django',
  'FastAPI',
  'Rust',
  'PostgreSQL',
  'ChromaDB',
  'Docker',
  'Cloudflare',
  'WordPress',
]

const STATS = [
  { value: 17, suffix: '', label: 'AI tools in the workspace' },
  { value: PROJECTS.length, suffix: '', label: 'products in the portfolio' },
  { value: LIVE_PROJECTS.length, suffix: '', label: 'live services' },
  { value: 400, suffix: '+', label: 'articles published' },
]

const AboutPage = () => {
  usePageMeta({
    title: 'About — Nevatal',
    description:
      'Nevatal is an independent personal open-source software project developed in Indonesia, documented as technical articles, case studies, and educational tools.',
    path: '/about',
  })

  return (
    <>
      <PageHero
        eyebrow="About"
        shape="flower"
        shapeColor="sun"
        title="Independent by design. AI-first by default."
        accent="AI-first by default."
        seed="about-hero"
        lead={
          <p>
            Nevatal is an independent, personal open-source software project developed in Indonesia. We design, build and operate AI products end
            to end — the model layer, the retrieval, the interface and the server it runs on.
          </p>
        }
      >
        <motion.dl
          className="mt-14 grid max-w-3xl grid-cols-2 border-t border-ink/10 sm:grid-cols-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: easeOut, delay: 0.5 }}
        >
          {STATS.map((stat) => (
            <div key={stat.label} className="pr-5 pt-6">
              <dt className="sr-only">{stat.label}</dt>
              <dd className="font-display text-4xl font-semibold tracking-[-0.04em]">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              </dd>
              <dd className="mt-2 text-xs leading-snug text-ink/60">{stat.label}</dd>
            </div>
          ))}
        </motion.dl>
      </PageHero>

      <section className="border-t border-ink/10 bg-paper py-24 sm:py-32">
        <div className="container-x grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <Reveal>
            <p className="eyebrow text-ink">
              <Shape kind="circle" color="cobalt" className="h-3 w-3" /> The work
            </p>
            <Heading text="One studio, many products." accent="many products." className="h-section mt-6" />
          </Reveal>
          <Reveal delay={0.08} className="space-y-5 text-lg leading-relaxed text-ink/70">
            <p>
              The portfolio began with the Nevatal AI Hub — seventeen purpose-built AI tools in one
              workspace, running on the visitor&apos;s own OpenAI, Gemini or OpenRouter key. No
              account, no subscription, no credential sitting on someone else&apos;s server.
            </p>
            <p>
              The same approach carries into the rest of the catalogue: retrieval tools that cite
              their sources, learning platforms that work without a key, sandboxes that run real
              code, and the monitors, shorteners and bots that keep the whole surface area
              observable.
            </p>
            <p>
              Everything is built in-house and deployed on hardware we control. That makes the
              portfolio slower to expand than a folder of prototypes — and considerably harder to
              break.
            </p>
            <Link to="/projects" className="btn btn-ink !mt-8">
              Explore all {PROJECTS.length} projects <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
        </div>
      </section>

      <MorphSection morph="flower" className="py-24 sm:py-32">
        <div className="container-x">
          <Reveal className="max-w-2xl">
            <p className="eyebrow text-ink">
              <Shape kind="sparkle" color="paper" className="h-4 w-4" /> Principles
            </p>
            <Heading text="How the work gets built." accent="gets built." className="h-section mt-6" />
          </Reveal>

          <Stagger className="mt-14 grid gap-4 sm:grid-cols-2">
            {PRINCIPLES.map((principle, index) => (
              <StaggerItem key={principle.title} pop>
                <motion.div
                  whileHover={{ y: -6, rotate: index % 2 ? 0.8 : -0.8 }}
                  transition={spring}
                  className="group h-full rounded-[30px] bg-paper p-7"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-medium text-ink/60">0{index + 1}</span>
                    <motion.span className="block h-9 w-9" whileHover={{ rotate: 180 }} transition={spring}>
                      <Shape
                        kind={principle.shape}
                        color={principle.color === 'paper' ? 'sun' : principle.color}
                        className="h-full w-full"
                      />
                    </motion.span>
                  </div>
                  <h3 className="mt-8 font-display text-2xl font-semibold tracking-[-0.03em]">{principle.title}</h3>
                  <p className="mt-3 max-w-md leading-relaxed text-ink/70">{principle.body}</p>
                </motion.div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </MorphSection>

      <section className="bg-paper py-24 sm:py-32">
        <div className="container-x grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-end lg:gap-20">
          <Reveal>
            <p className="eyebrow text-ink">
              <Shape kind="dots" color="plum" className="h-3.5 w-3.5" /> The stack
            </p>
            <Heading text="Boring where it counts." accent="it counts." squiggle className="h-section mt-6" />
            <p className="mt-6 text-lg leading-relaxed text-ink/65">
              The tools are chosen for what they make possible under load, not for a launch post.
              Everything ships in containers and can be rebuilt from source.
            </p>
          </Reveal>
          <PillPile items={STACK} seed="about-stack" className="min-h-[220px]" />
        </div>
      </section>

      <section className="border-t border-ink/10 bg-paper py-20 sm:py-24">
        <div className="container-x">
          <Reveal>
            <div className="relative overflow-hidden rounded-[32px] border border-ink/10 p-8 sm:p-12">
              <Shape kind="quarter" color="sun" className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rotate-90" />
              <p className="eyebrow relative text-ink">
                <Shape kind="circle" color="plum" className="h-2.5 w-2.5" /> Transparency &amp; Legal Notice
              </p>
              <h2 className="relative mt-4 max-w-3xl font-display text-2xl font-semibold tracking-[-0.03em] text-ink sm:text-3xl">
                Independent Personal Project &amp; Non-Affiliation Disclaimer
              </h2>
              <div className="relative mt-6 max-w-4xl space-y-4 text-sm leading-relaxed text-ink/80">
                <p>
                  <strong>Nevatal</strong> is an independent, personal open-source software project developed in Indonesia, documented as technical articles, case studies, and educational resources. All projects under the Nevatal umbrella are strictly personal software projects and are not affiliated with any commercial entity.
                </p>
                <p>
                  The name &ldquo;Nevatal&rdquo; was sourced purely from an automated business name generator for hackathons and personal developer experiments. Any similarity in name with any other entity is pure coincidence.
                </p>
                <p>
                  Nevatal operates on a 100% free, non-profit basis under the MIT License and takes zero commercial profit. Any marketing, search engine optimization (SEO), and social media outreach conducted for this project is undertaken purely for educational and experimental purposes to study and observe the effectiveness of organic distribution.
                </p>
                <p>
                  Nevatal is not affiliated with, sponsored by, or endorsed by any external corporate entities, commercial enterprises, or medical EMR (Electronic Medical Records) software platforms, nor does it use their branding or logos.
                </p>
                <p className="pt-2">
                  For questions, collaborations, or notices, contact us at:{' '}
                  <a href="mailto:nevatalapp@gmail.com" className="font-semibold text-cobalt underline underline-offset-2 hover:text-ink">
                    nevatalapp@gmail.com
                  </a>
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-paper pb-24">
        <div className="container-x">
          <Reveal y={60}>
            <div className="relative flex flex-col items-start justify-between gap-8 overflow-hidden rounded-[40px] bg-sun p-8 sm:flex-row sm:items-center sm:p-14">
              <Shape kind="half" color="paper" className="pointer-events-none absolute -bottom-6 right-[30%] h-24 w-24" />
              <div className="relative">
                <p className="eyebrow text-ink">
                  <Shape kind="sparkle" color="paper" className="h-4 w-4" /> The shortest tour
                </p>
                <Heading
                  text="Use the work."
                  accent="work."
                  className="mt-4 font-display text-[clamp(2.4rem,5vw,4rem)] font-semibold leading-[1] tracking-[-0.045em]"
                />
                <p className="mt-4 max-w-xl text-ink/80">
                  The fastest way to understand how Nevatal builds is to open the AI Hub, or to read the
                  source on GitHub.
                </p>
              </div>
              <div className="relative flex flex-wrap gap-3">
                <Magnetic>
                  <a href={AI_HUB_URL} target="_blank" rel="noopener noreferrer" className="btn btn-ink">
                    Open the AI Hub <ArrowUpRight className="h-4 w-4" />
                  </a>
                </Magnetic>
                <Magnetic>
                  <a href={GITHUB_PROFILE_URL} target="_blank" rel="noopener noreferrer" className="btn btn-paper">
                    GitHub <ArrowUpRight className="h-4 w-4" />
                  </a>
                </Magnetic>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}

export default AboutPage
