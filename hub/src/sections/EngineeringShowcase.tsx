import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import MorphSection from '../components/decor/MorphSection'
import Shape, { type ShapeColor, type ShapeKind } from '../components/decor/Shape'
import ShapeField from '../components/decor/ShapeField'
import Heading from '../components/motion/Heading'
import Reveal from '../components/motion/Reveal'
import Typewriter from '../components/motion/Typewriter'
import { ArrowDown } from '../components/icons'
import { spring } from '../lib/motion'
import { scrollToSection } from '../lib/scroll'

const LAYERS: Array<{
  id: string
  label: string
  tech: string
  detail: string
  code: string
  shape: ShapeKind
  color: ShapeColor
}> = [
  {
    id: 'interface',
    label: 'Interface',
    tech: 'React · Vite · Tailwind',
    detail:
      'Task-specific screens instead of one generic form — inputs shaped around the job and states that explain what happened.',
    code: `const submit = async () => {
  const res = await fetch('/api/runs', {
    method: 'POST',
    body: JSON.stringify({ tool, prompt }),
  })
  setRun(await res.json())
}`,
    shape: 'circle',
    color: 'cobalt',
  },
  {
    id: 'logic',
    label: 'Application logic',
    tech: 'Django · FastAPI',
    detail:
      'Request validation, provider routing and queue hand-off live in services that can be tested without a model in the loop.',
    code: `@router.post("/runs")
def create_run(payload: RunIn, user: User = Depends(current)):
    job = queue.enqueue(payload, owner=user.id)
    return {"id": job.id, "status": job.status}`,
    shape: 'square',
    color: 'ink',
  },
  {
    id: 'api',
    label: 'API',
    tech: 'JSON · typed clients',
    detail:
      'A small, explicit contract between the interface and the services — the same shape the frontend types against.',
    code: `{
  "id": "run_42",
  "status": "queued",
  "tool": "prompt",
  "created_at": "2026-10-30T08:00:00Z"
}`,
    shape: 'pill',
    color: 'plum',
  },
  {
    id: 'data',
    label: 'Data',
    tech: 'Postgres · Redis · Chroma',
    detail:
      'Relational records for runs and accounts, Redis for queues and rate limits, vector stores for retrieval projects.',
    code: `SELECT id, status, created_at
FROM runs
WHERE owner_id = $1
ORDER BY created_at DESC
LIMIT 20;`,
    shape: 'quarter',
    color: 'cobalt',
  },
  {
    id: 'deploy',
    label: 'Deployment',
    tech: 'Docker · Cloudflare Tunnel',
    detail:
      'Containers on hardware we control, with a CI pipeline that builds, tests and ships the same images it deployed yesterday.',
    code: `services:
  hub:
    image: nevatal/hub:latest
    restart: unless-stopped
    ports:
      - "8080:80"`,
    shape: 'arch',
    color: 'paper',
  },
]

const EngineeringShowcase = () => {
  const [activeId, setActiveId] = useState(LAYERS[0].id)
  const active = LAYERS.find((layer) => layer.id === activeId) ?? LAYERS[0]

  return (
    <MorphSection morph="arch" id="engineering" className="py-28 sm:py-36">
      <ShapeField seed="engineering" tone="sun" count={5} mobileCount={2} sizes={[40, 96]} />
      <div className="container-x relative">
        <Reveal>
          <p className="eyebrow text-ink">
            <Shape kind="square" color="ink" className="h-3 w-3" /> Product engineering
          </p>
          <Heading
            text="From an idea to a working product."
            accent="working product."
            className="h-section mt-6 max-w-4xl"
          />
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink/80">
            Interfaces, application logic, APIs, data and deployment — the layers that turn a
            model capability into something you can open in a browser.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <Reveal delay={0.06} y={60} rotate={-2}>
            <div className="overflow-hidden rounded-[32px] bg-paper p-2.5 shadow-[0_40px_90px_-50px_rgba(11,11,13,0.55)]">
              <div className="flex items-center gap-2 px-3 pb-3 pt-1.5">
                <span className="rounded-full bg-paper-2 px-3 py-1 font-mono text-[11px] text-ink/70">
                  chat.nevatal.id
                </span>
                <span className="ml-auto font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-ink/60">
                  Interface layer
                </span>
              </div>
              <img
                src="/previews/ai-hub.jpg"
                alt="Nevatal AI Hub interface"
                width={1280}
                height={800}
                loading="lazy"
                decoding="async"
                className="aspect-[16/10] w-full rounded-[22px] object-cover object-top"
              />
              <p className="px-3 pb-2 pt-3 text-xs text-ink/60">
                The same product shown in the ecosystem above — here as an engineering surface.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.12}>
            <div className="flex flex-wrap gap-2">
              {LAYERS.map((layer) => {
                const isActive = layer.id === activeId
                return (
                  <button
                    key={layer.id}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setActiveId(layer.id)}
                    className={`relative flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${
                      isActive ? 'text-paper' : 'bg-paper text-ink hover:bg-sun-soft'
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="engineering-layer"
                        className="absolute inset-0 rounded-full bg-ink"
                        transition={spring}
                      />
                    )}
                    <Shape
                      kind={layer.shape}
                      color={isActive && layer.color === 'ink' ? 'sun' : layer.color === 'paper' && !isActive ? 'ink' : layer.color}
                      className="relative h-3.5 w-3.5"
                    />
                    <span className="relative">{layer.label}</span>
                  </button>
                )
              })}
            </div>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={active.id}
                initial={{ opacity: 0, y: 16, rotate: 1 }}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="mt-5 rounded-[28px] bg-paper p-6"
              >
                <p className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-ink/60">
                  {active.tech}
                </p>
                <p className="mt-3 leading-relaxed text-ink/80">{active.detail}</p>
                <div className="mt-5 rounded-[20px] bg-ink p-4">
                  <Typewriter
                    text={active.code}
                    charsPerSecond={220}
                    className="overflow-x-auto whitespace-pre font-mono text-[12px] leading-relaxed text-sun"
                  />
                </div>
                <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-ink/60">
                  Illustrative sample code.
                </p>
              </motion.div>
            </AnimatePresence>
          </Reveal>
        </div>

        <Reveal delay={0.15} className="mt-14 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => scrollToSection('featured-projects')}
            className="btn btn-ink"
          >
            Browse selected projects <ArrowDown className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('infrastructure')}
            className="btn btn-line"
          >
            Infrastructure details <ArrowDown className="h-4 w-4" />
          </button>
        </Reveal>
      </div>
    </MorphSection>
  )
}

export default EngineeringShowcase
