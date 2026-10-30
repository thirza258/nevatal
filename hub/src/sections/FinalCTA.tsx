import { Link } from 'react-router-dom'
import Reveal from '../components/motion/Reveal'
import { ArrowUpRight } from '../components/icons'
import { AI_HUB_URL } from '../lib/constants'

const FinalCTA = () => (
  <section className="relative overflow-hidden bg-brand text-ink">
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -right-24 -top-40 h-[26rem] w-[26rem] rounded-full bg-white/25 blur-3xl"
    />
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_120%_at_0%_100%,rgba(10,13,18,0.12),transparent_60%)]"
    />
    <Reveal className="container-x relative flex flex-col items-start justify-between gap-8 py-16 sm:flex-row sm:items-center sm:py-20">
      <div>
        <p className="eyebrow">Start here</p>
        <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Put the portfolio to work.
        </h2>
        <p className="mt-3 max-w-xl text-ink/70">
          Explore the products, experiment with the AI Hub, and discover what Nevatal is building.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <a
          href={AI_HUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-dark"
        >
          Open the AI Hub <ArrowUpRight className="h-4 w-4" />
        </a>
        <Link to="/projects" className="btn btn-ghost !border-ink/30">
          See all projects
        </Link>
      </div>
    </Reveal>
  </section>
)

export default FinalCTA
