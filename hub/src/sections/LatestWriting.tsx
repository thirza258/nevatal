import { Link } from 'react-router-dom'
import PostCard from '../components/PostCard'
import AbstractShape from '../components/decor/AbstractShape'
import Reveal from '../components/motion/Reveal'
import { Stagger, StaggerItem } from '../components/motion/Stagger'
import { ArrowRight } from '../components/icons'
import type { WPPost } from '../lib/wp'

interface LatestWritingProps {
  posts: WPPost[]
  categories: Record<string, string>
  state: 'loading' | 'ready' | 'error'
}

const LatestWriting = ({ posts, categories, state }: LatestWritingProps) => (
  <section className="relative overflow-hidden bg-paper-2/50 py-20 sm:py-28">
    <AbstractShape shape="triangle-outline" tone="dark" className="-right-16 top-20 h-48 w-48" />
    <AbstractShape shape="ring" tone="brand" className="-left-20 bottom-10 h-44 w-44" />
    <div className="container-x relative">
      <Reveal className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow text-blue">Writing</p>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            Notes from the workshop.
          </h2>
          <p className="mt-4 max-w-2xl leading-relaxed text-ink/60">
            Architecture notes, build logs and the occasional post-mortem — published from
            WordPress and read right here.
          </p>
        </div>
        <Link
          to="/blog"
          className="inline-flex flex-none items-center gap-2 text-sm font-semibold text-ink transition hover:text-blue"
        >
          All writing <ArrowRight className="h-4 w-4" />
        </Link>
      </Reveal>

      <Stagger className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {state === 'loading' &&
          [0, 1, 2].map((item) => (
            <StaggerItem key={item} className="h-full">
              <div className="h-72 animate-pulse rounded-2xl border border-ink/10 bg-white p-6">
                <div className="h-5 w-24 rounded-full bg-ink/10" />
                <div className="mt-6 h-5 w-4/5 rounded bg-ink/10" />
                <div className="mt-3 h-4 w-3/5 rounded bg-ink/5" />
                <div className="mt-8 h-3 w-full rounded bg-ink/5" />
                <div className="mt-2 h-3 w-2/3 rounded bg-ink/5" />
              </div>
            </StaggerItem>
          ))}

        {state === 'ready' &&
          posts.map((post) => (
            <StaggerItem key={post.id} className="h-full">
              <PostCard
                post={post}
                categoryName={categories[String(post.categories[0])]}
              />
            </StaggerItem>
          ))}
      </Stagger>

      {state === 'error' && (
        <Reveal className="mt-10 rounded-2xl border border-ink/10 bg-white p-8 text-center">
          <p className="font-display text-xl font-semibold">The archive is taking a break.</p>
          <p className="mt-2 text-sm text-ink/55">
            WordPress could not be reached from this browser. The posts are still online.
          </p>
          <Link to="/blog" className="btn btn-dark mt-5">
            Go to the blog <ArrowRight className="h-4 w-4" />
          </Link>
        </Reveal>
      )}
    </div>
  </section>
)

export default LatestWriting
