import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import PostCard from '../components/PostCard'
import Shape from '../components/decor/Shape'
import ShapeField from '../components/decor/ShapeField'
import Reveal from '../components/motion/Reveal'
import { ArrowLeft, ArrowUpRight } from '../components/icons'
import { SITE_URL, WP_SITE_URL } from '../lib/constants'
import { easeOut } from '../lib/motion'
import { usePageMeta } from '../lib/seo'
import { decodeHtml, excerptText, formatDate, readingTime } from '../lib/text'
import {
  getAuthorName,
  getCategories,
  getFeaturedImage,
  getPostBySlug,
  getPosts,
  preparePostHtml,
  type WPPost,
} from '../lib/wp'

const trimDescription = (text: string): string => {
  if (text.length <= 160) return text
  return `${text.slice(0, 157).trimEnd()}…`
}

/** The featured image settles from a rounded, slightly shrunk card as it scrolls in. */
const FeaturedImage = ({ src }: { src: string }) => {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'start 0.35'] })
  const scale = useTransform(scrollYProgress, [0, 1], [0.9, 1])
  return (
    <div ref={ref} className="mb-12">
      <motion.img
        src={src}
        alt=""
        loading="eager"
        style={reduce ? undefined : { scale }}
        className="w-full rounded-[32px] border border-ink/10 object-cover"
      />
    </div>
  )
}

const PostPage = () => {
  const { slug = '' } = useParams()
  const [post, setPost] = useState<WPPost | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading')
  const [retryToken, setRetryToken] = useState(0)
  const [categoryNames, setCategoryNames] = useState<Record<string, string>>({})
  const [related, setRelated] = useState<WPPost[]>([])

  useEffect(() => {
    let alive = true
    setStatus('loading')

    getPostBySlug(slug)
      .then((result) => {
        if (!alive) return
        if (!result) {
          setStatus('missing')
          return
        }
        setPost(result)
        setStatus('ready')
      })
      .catch(() => {
        if (alive) setStatus('error')
      })

    return () => {
      alive = false
    }
  }, [slug, retryToken])

  useEffect(() => {
    let alive = true
    getCategories()
      .then((categories) => {
        if (!alive) return
        setCategoryNames(
          Object.fromEntries(categories.map((category) => [String(category.id), decodeHtml(category.name)]))
        )
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (!post) return
    let alive = true
    getPosts({ category: post.categories[0], perPage: 4 })
      .then((result) => {
        if (!alive) return
        setRelated(result.posts.filter((item) => item.slug !== post.slug).slice(0, 2))
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [post])

  const title = post ? decodeHtml(post.title.rendered) : 'Writing — Nevatal'
  const summary = post ? excerptText(post.excerpt.rendered) : ''
  const featured = post ? getFeaturedImage(post) : null
  const author = post ? getAuthorName(post) : null
  const categoryName = post?.categories?.[0] ? categoryNames[String(post.categories[0])] : undefined
  const prepared = useMemo(
    () => (post ? preparePostHtml(post.content.rendered, decodeHtml(post.title.rendered)) : ''),
    [post]
  )

  const articleLd = post
    ? {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: title,
        description: trimDescription(summary),
        datePublished: post.date,
        url: `${SITE_URL}/blog/${post.slug}`,
        mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
        author: author ? { '@type': 'Person', name: author } : { '@type': 'Organization', name: 'Nevatal' },
        publisher: {
          '@type': 'Organization',
          name: 'Nevatal',
          logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` },
        },
        ...(featured ? { image: [featured] } : {}),
      }
    : undefined

  usePageMeta({
    title: post ? `${title} — Nevatal` : 'Writing — Nevatal',
    description: summary
      ? trimDescription(summary)
      : 'Architecture notes, build logs and lessons from the Nevatal portfolio.',
    path: `/blog/${slug}`,
    type: 'article',
    image: featured ?? undefined,
    jsonLd: articleLd,
  })

  if (status === 'loading') {
    return (
      <div className="bg-paper">
        <div className="container-x pb-12 pt-20">
          <div className="h-3 w-28 animate-pulse rounded-full bg-sun-soft" />
          <div className="mt-8 h-12 w-3/4 animate-pulse rounded-full bg-ink/10" />
          <div className="mt-4 h-12 w-1/2 animate-pulse rounded-full bg-ink/10" />
        </div>
        <div className="container-x pb-24">
          <div className="mx-auto max-w-3xl space-y-4">
            <div className="h-4 w-full animate-pulse rounded-full bg-ink/10" />
            <div className="h-4 w-11/12 animate-pulse rounded-full bg-ink/10" />
            <div className="h-4 w-4/5 animate-pulse rounded-full bg-ink/10" />
          </div>
        </div>
      </div>
    )
  }

  if (status === 'missing' || status === 'error' || !post) {
    return (
      <section className="relative overflow-clip bg-paper">
        <ShapeField seed="post-missing" count={6} mobileCount={3} sizes={[44, 110]} />
        <div className="container-x relative py-28">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow justify-center text-ink">
              <Shape kind="squiggle" color="cobalt" className="h-4 w-5" /> Writing
            </p>
            <h1 className="mt-6 font-display text-[clamp(2.4rem,6vw,4.4rem)] font-semibold leading-[1] tracking-[-0.045em]">
              {status === 'missing' ? 'That article is not here.' : 'The archive is taking a break.'}
            </h1>
            <p className="mt-5 text-lg text-ink/65">
              {status === 'missing'
                ? 'The slug may have changed, or the post was unpublished. The full archive is still on WordPress.'
                : 'WordPress could not be reached from this browser. The posts are still online.'}
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Link to="/blog" className="btn btn-ink">
                Back to all writing
              </Link>
              <a href={WP_SITE_URL} target="_blank" rel="noopener noreferrer" className="btn btn-line">
                Open WordPress <ArrowUpRight className="h-4 w-4" />
              </a>
              {status === 'error' && (
                <button type="button" onClick={() => setRetryToken((token) => token + 1)} className="btn btn-line">
                  Try again
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <>
      <article className="bg-paper">
        <header className="relative overflow-clip">
          <ShapeField seed={`post-${post.slug}`} count={5} mobileCount={2} sizes={[40, 100]} />
          <div className="container-x relative pb-14 pt-14 sm:pb-20 sm:pt-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: easeOut }}
              className="mx-auto max-w-4xl"
            >
              <nav className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink/60" aria-label="Breadcrumb">
                <Link to="/blog" className="link-underline transition hover:text-ink">
                  Writing
                </Link>
                <span className="mx-2">/</span>
                <span>Article</span>
              </nav>

              <div className="mt-7 flex flex-wrap items-center gap-3 font-mono text-[11px] uppercase tracking-[0.12em] text-ink/60">
                {categoryName && (
                  <span className="rounded-full bg-sun px-3 py-1.5 font-medium text-ink">{categoryName}</span>
                )}
                <time dateTime={post.date}>{formatDate(post.date)}</time>
                <span aria-hidden="true">·</span>
                <span>{readingTime(post.content.rendered)} min read</span>
              </div>

              <h1 className="mt-6 font-display text-[clamp(2.2rem,5.4vw,4.4rem)] font-semibold leading-[1.02] tracking-[-0.045em]">
                {title}
              </h1>

              {summary && <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink/65">{summary}</p>}
              {author && (
                <p className="mt-7 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-ink/60">
                  <Shape kind="circle" color="sun" className="h-3 w-3" /> By {author}
                </p>
              )}
            </motion.div>
          </div>
        </header>

        <div className="container-x pb-20">
          <div className="mx-auto max-w-3xl">
            {featured && <FeaturedImage src={featured} />}

            <div
              className="article-body prose prose-lg prose-stone max-w-none prose-headings:font-display prose-headings:tracking-[-0.03em] prose-headings:text-ink prose-p:text-ink/80 prose-a:text-cobalt prose-a:underline prose-a:decoration-sun prose-a:decoration-2 prose-a:underline-offset-4 prose-strong:text-ink prose-blockquote:border-l-sun prose-blockquote:not-italic prose-li:text-ink/80 prose-pre:rounded-[20px] prose-pre:bg-ink prose-pre:text-paper prose-code:text-plum prose-code:before:content-none prose-code:after:content-none"
              dangerouslySetInnerHTML={{ __html: prepared }}
            />

            <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-ink/10 pt-6 text-sm">
              <Link to="/blog" className="btn btn-line">
                <ArrowLeft className="h-4 w-4" /> Back to all writing
              </Link>
              <a
                href={post.link}
                target="_blank"
                rel="noopener noreferrer"
                className="link-underline inline-flex items-center gap-1.5 text-ink/70 transition hover:text-ink"
              >
                Read on WordPress <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section className="border-t border-ink/10 bg-paper py-20">
          <div className="container-x">
            <Reveal className="flex items-end justify-between gap-4">
              <h2 className="font-display text-3xl font-semibold tracking-[-0.04em]">
                More from the <span className="font-serif font-normal italic tracking-[-0.02em]">workshop</span>
              </h2>
              <Link to="/blog" className="btn btn-line !py-2.5">
                All writing
              </Link>
            </Reveal>
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {related.map((item) => (
                <PostCard key={item.id} post={item} categoryName={categoryNames[String(item.categories[0])]} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}

export default PostPage
