import { Link, useLocation } from 'react-router-dom'
import { usePageMeta } from '../lib/seo'

const NotFoundPage = () => {
  const { pathname } = useLocation()

  usePageMeta({
    title: 'Page not found — Nevatal',
    description: 'This page could not be found. Explore the Nevatal portfolio or read the blog.',
    path: pathname,
    noindex: true,
  })

  return (
    <section className="hero-surface flex min-h-[70vh] items-center text-paper">
      <div className="container-x py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-display text-7xl font-semibold text-brand">404</p>
          <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            This page hasn&apos;t been built yet.
          </h1>
          <p className="mt-4 text-paper/60">
            The link may be old, or the page may have moved. The portfolio and the writing archive
            are both one click away.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/" className="btn btn-primary">
              Back home
            </Link>
            <Link to="/projects" className="btn btn-ghost-light">
              See the projects
            </Link>
            <Link to="/blog" className="btn btn-ghost-light">
              Read the blog
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default NotFoundPage
