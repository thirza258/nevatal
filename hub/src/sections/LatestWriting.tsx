import { Link } from 'react-router-dom'
import PostCard, { PostSkeleton } from '../components/PostCard'
import Shape from '../components/decor/Shape'
import ShapeField from '../components/decor/ShapeField'
import Heading from '../components/motion/Heading'
import Reveal from '../components/motion/Reveal'
import { Stagger, StaggerItem } from '../components/motion/Stagger'
import { ArrowDown, ArrowRight } from '../components/icons'
import type { WPPost } from '../lib/wp'
import { scrollToSection } from '../lib/scroll'

interface LatestWritingProps {
  posts: WPPost[]
  categories: Record<string, string>
  state: 'loading' | 'ready' | 'error'
}

const LatestWriting = ({ posts, categories, state }: LatestWritingProps) => (
  <section id="writing" className="relative overflow-clip border-t border-ink/10 bg-paper py-28 sm:py-36">
    <ShapeField seed="writing" count={4} mobileCount={2} sizes={[40, 90]} />
    <div className="container-x relative">
      <Reveal className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow text-ink">
            <Shape kind="squiggle" color="cobalt" className="h-4 w-5" /> Writing
          </p>
          <Heading text="Notes from the workshop." accent="workshop." className="h-section mt-6" />
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink/65">
            Architecture notes, build logs and the occasional post-mortem — published from
            WordPress and read right here.
          </p>
        </div>
        <Link to="/blog" className="btn btn-line flex-none">
          All writing <ArrowRight className="h-4 w-4" />
        </Link>
      </Reveal>

      <Stagger className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {state === 'loading' &&
          [0, 1, 2].map((item) => (
            <StaggerItem key={item} className="h-full" pop>
              <PostSkeleton />
            </StaggerItem>
          ))}

        {state === 'ready' &&
          posts.map((post) => (
            <StaggerItem key={post.id} className="h-full" pop>
              <PostCard post={post} categoryName={categories[String(post.categories[0])]} />
            </StaggerItem>
          ))}
      </Stagger>

      {state === 'error' && (
        <Reveal className="mt-12 rounded-[30px] border border-ink/10 bg-paper p-10 text-center">
          <Shape kind="flower" color="sun" className="mx-auto h-12 w-12" />
          <p className="mt-5 font-display text-2xl font-semibold tracking-[-0.03em]">
            The archive is taking a break.
          </p>
          <p className="mt-2 text-sm text-ink/60">
            WordPress could not be reached from this browser. The posts are still online.
          </p>
          <Link to="/blog" className="btn btn-ink mt-6">
            Go to the blog <ArrowRight className="h-4 w-4" />
          </Link>
        </Reveal>
      )}

      <div className="mt-14 flex flex-wrap items-center justify-center gap-3">
        <Link to="/blog" className="btn btn-ink">
          Browse full writing archive <ArrowRight className="h-4 w-4" />
        </Link>
        <button
          type="button"
          onClick={() => scrollToSection('final-cta')}
          className="btn btn-line"
        >
          Get started with Nevatal <ArrowDown className="h-4 w-4" />
        </button>
      </div>
    </div>
  </section>
)

export default LatestWriting
