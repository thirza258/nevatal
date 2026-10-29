import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import PostCard from '../components/PostCard'
import { ArrowRight, ArrowUpRight, Search } from '../components/icons'
import { WP_SITE_URL } from '../lib/constants'
import { usePageMeta } from '../lib/seo'
import { decodeHtml, formatNumber } from '../lib/text'
import { getCategories, getPosts, WpError, type WPCategory, type WPPost } from '../lib/wp'

const PER_PAGE = 9

const PostSkeleton = () => (
  <div className="h-72 animate-pulse rounded-2xl border border-ink/10 bg-white p-6">
    <div className="h-5 w-24 rounded-full bg-ink/10" />
    <div className="mt-6 h-5 w-4/5 rounded bg-ink/10" />
    <div className="mt-3 h-4 w-3/5 rounded bg-ink/5" />
    <div className="mt-8 h-3 w-full rounded bg-ink/5" />
    <div className="mt-2 h-3 w-2/3 rounded bg-ink/5" />
  </div>
)

const BlogPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const pageValue = Number(searchParams.get('page') ?? '1')
  const page = Number.isFinite(pageValue) && pageValue > 0 ? Math.floor(pageValue) : 1
  const categorySlug = searchParams.get('category') ?? ''
  const query = searchParams.get('q') ?? ''

  const [categories, setCategories] = useState<WPCategory[] | null>(null)
  const [posts, setPosts] = useState<WPPost[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [retryToken, setRetryToken] = useState(0)
  const [searchInput, setSearchInput] = useState(query)
  const resultsRef = useRef<HTMLDivElement>(null)

  usePageMeta({
    title: 'Writing — Nevatal',
    description:
      'Architecture notes, build logs and lessons from the Nevatal portfolio — published from WordPress and readable here.',
    path: '/blog',
  })

  useEffect(() => {
    setSearchInput(query)
  }, [query])

  useEffect(() => {
    let alive = true
    getCategories()
      .then((data) => {
        if (alive) setCategories(data)
      })
      .catch(() => {
        if (alive) setCategories([])
      })
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (!categories) return
    let alive = true
    setStatus('loading')

    const category = categorySlug
      ? categories.find((item) => item.slug === categorySlug)?.id
      : undefined

    getPosts({ page, perPage: PER_PAGE, category, search: query || undefined })
      .then((result) => {
        if (!alive) return
        setPosts(result.posts)
        setTotal(result.total)
        setTotalPages(result.totalPages)
        setStatus('ready')
      })
      .catch((error) => {
        if (!alive) return
        if (error instanceof WpError && error.status === 400 && page > 1) {
          const next = new URLSearchParams(searchParams)
          next.delete('page')
          setSearchParams(next, { replace: true })
          return
        }
        setStatus('error')
      })

    return () => {
      alive = false
    }
  }, [categories, categorySlug, page, query, retryToken])

  const categoryNames = useMemo(() => {
    const map: Record<string, string> = {}
    for (const category of categories ?? []) {
      map[String(category.id)] = decodeHtml(category.name)
    }
    return map
  }, [categories])

  const updateParams = (mutate: (next: URLSearchParams) => void) => {
    const next = new URLSearchParams(searchParams)
    mutate(next)
    setSearchParams(next)
  }

  const selectCategory = (slug: string) => {
    updateParams((next) => {
      if (slug) next.set('category', slug)
      else next.delete('category')
      next.delete('page')
    })
  }

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const value = searchInput.trim()
    updateParams((next) => {
      if (value) next.set('q', value)
      else next.delete('q')
      next.delete('page')
    })
  }

  const goToPage = (target: number) => {
    updateParams((next) => {
      if (target <= 1) next.delete('page')
      else next.set('page', String(target))
    })
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const activeCategory = categorySlug !== ''

  return (
    <>
      <section className="hero-surface text-paper">
        <div className="container-x py-16 sm:py-20">
          <p className="eyebrow text-brand">Writing</p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            Notes from the workshop.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-paper/65">
            Architecture notes, build logs and lessons from the products in the portfolio —
            published from WordPress, read right here.
          </p>

          <form
            onSubmit={submitSearch}
            className="mt-8 flex max-w-xl items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] p-1.5 transition focus-within:border-brand/60"
          >
            <Search className="ml-3 h-5 w-5 flex-none text-paper/40" />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search the archive…"
              aria-label="Search articles"
              className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm text-paper placeholder:text-paper/35 focus:outline-none"
            />
            <button type="submit" className="btn btn-primary !px-4 !py-2">
              Search
            </button>
          </form>
        </div>
      </section>

      <section className="bg-paper py-12 sm:py-16">
        <div className="container-x" ref={resultsRef}>
          <div className="flex flex-col gap-3 border-b border-ink/10 pb-6">
            <p className="text-xs uppercase tracking-[0.16em] text-ink/55">
              {status === 'ready'
                ? `${formatNumber(total)} article${total === 1 ? '' : 's'}`
                : 'Loading the archive'}
              {query && status === 'ready' ? ` for “${query}”` : ''}
            </p>

            <div className="chips-scroll -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:flex-wrap lg:overflow-visible">
              <button
                type="button"
                onClick={() => selectCategory('')}
                className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition sm:px-4 sm:py-2 sm:text-sm ${
                  !activeCategory
                    ? 'border-ink bg-ink text-paper'
                    : 'border-ink/15 bg-white text-ink/60 hover:border-ink/35 hover:text-ink'
                }`}
              >
                All writing
              </button>
              {(categories ?? []).slice(0, 8).map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => selectCategory(category.slug)}
                  className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition sm:px-4 sm:py-2 sm:text-sm ${
                    categorySlug === category.slug
                      ? 'border-ink bg-ink text-paper'
                      : 'border-ink/15 bg-white text-ink/60 hover:border-ink/35 hover:text-ink'
                  }`}
                >
                  {decodeHtml(category.name)}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {status === 'loading' &&
              Array.from({ length: 6 }, (_, index) => <PostSkeleton key={index} />)}

            {status === 'ready' &&
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  categoryName={categoryNames[String(post.categories[0])]}
                />
              ))}

            {status === 'error' && (
              <div className="rounded-2xl border border-ink/10 bg-white p-8 text-center sm:col-span-2 lg:col-span-3">
                <p className="font-display text-xl font-semibold">The archive is taking a break.</p>
                <p className="mx-auto mt-2 max-w-lg text-sm text-ink/55">
                  WordPress could not be reached from this browser. The posts are still online at
                  wordpress.nevatal.id.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setRetryToken((token) => token + 1)}
                    className="btn btn-dark"
                  >
                    Try again
                  </button>
                  <a
                    href={WP_SITE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost"
                  >
                    Open WordPress <ArrowUpRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            )}

            {status === 'ready' && posts.length === 0 && (
              <div className="rounded-2xl border border-ink/10 bg-white p-8 text-center sm:col-span-2 lg:col-span-3">
                <p className="font-display text-xl font-semibold">No articles found.</p>
                <p className="mt-2 text-sm text-ink/55">
                  Try a different search term or browse every category.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const next = new URLSearchParams()
                    setSearchParams(next)
                    setSearchInput('')
                  }}
                  className="btn btn-dark mt-5"
                >
                  Clear search and filters
                </button>
              </div>
            )}
          </div>

          {status === 'ready' && totalPages > 1 && (
            <div className="mt-10 flex items-center justify-between border-t border-ink/10 pt-6">
              <button
                type="button"
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1}
                className="btn btn-ghost disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <p className="text-sm text-ink/50">
                Page {page} of {totalPages}
              </p>
              <button
                type="button"
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages}
                className="btn btn-ghost disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  )
}

export default BlogPage
