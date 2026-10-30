import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import AbstractShape from '../components/decor/AbstractShape'
import Reveal from '../components/motion/Reveal'
import { spring } from '../lib/motion'

const LAYERS = [
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
  },
]

const EngineeringShowcase = () => {
  const [activeId, setActiveId] = useState(LAYERS[0].id)
  const active = LAYERS.find((layer) => layer.id === activeId) ?? LAYERS[0]

  return (
    <section className="relative overflow-hidden border-t border-white/5 bg-ink py-20 text-paper sm:py-28">
      <AbstractShape
        shape="square"
        tone="brand"
        rotate={false}
        className="right-8 top-10 hidden h-28 w-28 lg:block"
      />
      <AbstractShape shape="triangle-outline" tone="light" className="-left-20 bottom-10 h-52 w-52" />
      <div className="container-x relative">
        <Reveal className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow text-brand">Product engineering</p>
            <h2 className="mt-4 max-w-2xl font-display text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
              From an idea to a working product.
            </h2>
            <p className="mt-4 max-w-2xl leading-relaxed text-paper/55">
              Interfaces, application logic, APIs, data and deployment — the layers that turn a
              model capability into something you can open in a browser.
            </p>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <Reveal delay={0.06}>
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0F1216]">
              <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
                <span className="flex gap-1.5" aria-hidden="true">
                  <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                </span>
                <span className="rounded-full bg-white/5 px-3 py-0.5 text-[10px] text-paper/40">
                  chat.nevatal.id
                </span>
                <span className="ml-auto text-[9px] font-semibold uppercase tracking-[0.12em] text-paper/30">
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
                className="aspect-[16/10] w-full object-cover object-top"
              />
              <p className="border-t border-white/10 px-4 py-2.5 text-[11px] text-paper/35">
                The same product shown in the ecosystem above — here as an engineering surface.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="flex flex-wrap gap-1.5">
              {LAYERS.map((layer) => {
                const isActive = layer.id === activeId
                return (
                  <button
                    key={layer.id}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setActiveId(layer.id)}
                    className={`relative rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors ${
                      isActive
                        ? 'text-ink'
                        : 'border border-white/15 text-paper/50 hover:border-white/30 hover:text-paper'
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="engineering-layer"
                        className="absolute inset-0 rounded-full bg-brand"
                        transition={spring}
                      />
                    )}
                    <span className="relative z-10">{layer.label}</span>
                  </button>
                )
              })}
            </div>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={active.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="mt-4 rounded-2xl border border-white/10 bg-[#0F1216] p-5"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand">
                  {active.tech}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-paper/60">{active.detail}</p>
                <pre className="mt-4 overflow-x-auto rounded-lg border border-white/10 bg-black/30 p-3 font-mono text-[11px] leading-relaxed text-emerald-200/85">
                  {active.code}
                </pre>
                <p className="mt-2 text-[10px] text-paper/30">Illustrative sample code.</p>
              </motion.div>
            </AnimatePresence>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

export default EngineeringShowcase