import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PostCard from '../components/PostCard'
import { ArrowRight, ArrowUpRight } from '../components/icons'
import { SITE_URL, WP_SITE_URL } from '../lib/constants'
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
  const categoryName = post?.categories?.[0]
    ? categoryNames[String(post.categories[0])]
    : undefined
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
        author: author
          ? { '@type': 'Person', name: author }
          : { '@type': 'Organization', name: 'Nevatal' },
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
      <div>
        <div className="hero-surface text-paper">
          <div className="container-x py-20">
            <div className="h-3 w-24 rounded bg-white/10" />
            <div className="mt-6 h-10 w-3/4 rounded bg-white/10" />
            <div className="mt-3 h-10 w-1/2 rounded bg-white/10" />
          </div>
        </div>
        <div className="container-x py-16">
          <div className="mx-auto max-w-3xl space-y-4">
            <div className="h-4 w-full animate-pulse rounded bg-ink/10" />
            <div className="h-4 w-11/12 animate-pulse rounded bg-ink/10" />
            <div className="h-4 w-4/5 animate-pulse rounded bg-ink/10" />
          </div>
        </div>
      </div>
    )
  }

  if (status === 'missing' || status === 'error' || !post) {
    return (
      <section className="hero-surface text-paper">
        <div className="container-x py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow text-brand">Writing</p>
            <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight">
              {status === 'missing' ? 'That article is not here.' : 'The archive is taking a break.'}
            </h1>
            <p className="mt-4 text-paper/60">
              {status === 'missing'
                ? 'The slug may have changed, or the post was unpublished. The full archive is still on WordPress.'
                : 'WordPress could not be reached from this browser. The posts are still online.'}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/blog" className="btn btn-primary">
                Back to all writing
              </Link>
              <a
                href={WP_SITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost-light"
              >
                Open WordPress <ArrowUpRight className="h-4 w-4" />
              </a>
              {status === 'error' && (
                <button
                  type="button"
                  onClick={() => setRetryToken((token) => token + 1)}
                  className="btn btn-ghost-light"
                >
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
      <article>
        <header className="hero-surface text-paper">
          <div className="container-x py-14 sm:py-20">
            <nav className="text-xs text-paper/60" aria-label="Breadcrumb">
              <Link to="/blog" className="transition hover:text-paper">
                Writing
              </Link>
              <span className="mx-2">/</span>
              <span>Article</span>
            </nav>

            <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-paper/60">
              {categoryName && (
                <span className="rounded-full bg-brand px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink">
                  {categoryName}
                </span>
              )}
              <time dateTime={post.date}>{formatDate(post.date)}</time>
              <span aria-hidden="true">·</span>
              <span>{readingTime(post.content.rendered)} min read</span>
            </div>

            <h1 className="mt-5 max-w-4xl font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              {title}
            </h1>

            {summary && <p className="mt-5 max-w-2xl text-paper/60">{summary}</p>}
            {author && (
              <p className="mt-6 text-xs uppercase tracking-[0.16em] text-paper/50">By {author}</p>
            )}
          </div>
        </header>

        <div className="bg-paper">
          <div className="container-x py-12 sm:py-16">
            <div className="mx-auto max-w-3xl">
              {featured && (
                <img
                  src={featured}
                  alt=""
                  loading="eager"
                  className="mb-10 w-full rounded-2xl border border-ink/10 object-cover"
                />
              )}

              <div
                className="article-body prose prose-lg prose-stone max-w-none prose-headings:font-display prose-headings:tracking-tight prose-headings:text-ink prose-p:text-ink/75 prose-a:text-blue prose-a:underline prose-a:decoration-brand prose-a:decoration-2 prose-a:underline-offset-4 prose-strong:text-ink prose-blockquote:border-l-brand prose-blockquote:not-italic prose-li:text-ink/75 prose-pre:bg-ink prose-pre:text-paper prose-code:text-maroon prose-code:before:content-none prose-code:after:content-none"
                dangerouslySetInnerHTML={{ __html: prepared }}
              />

              <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-ink/10 pt-6 text-sm">
                <Link
                  to="/blog"
                  className="inline-flex items-center gap-2 font-semibold text-ink/60 transition hover:text-ink"
                >
                  <ArrowRight className="h-4 w-4 rotate-180" /> Back to all writing
                </Link>
                <a
                  href={post.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-ink/50 transition hover:text-ink"
                >
                  Read on WordPress <ArrowUpRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section className="bg-paper-2/60 py-16">
          <div className="container-x">
            <div className="flex items-end justify-between gap-4">
              <h2 className="font-display text-2xl font-semibold tracking-tight">
                More from the workshop
              </h2>
              <Link to="/blog" className="text-sm font-semibold text-ink/60 transition hover:text-ink">
                All writing
              </Link>
            </div>
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              {related.map((item) => (
                <PostCard
                  key={item.id}
                  post={item}
                  categoryName={categoryNames[String(item.categories[0])]}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}

export default PostPage
