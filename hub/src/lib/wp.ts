import DOMPurify from 'dompurify'
import { WP_API_BASES } from './constants'

export interface WPCategory {
  id: number
  name: string
  slug: string
  count: number
}

export interface WPPost {
  id: number
  slug: string
  date: string
  link: string
  title: { rendered: string }
  excerpt: { rendered: string }
  content: { rendered: string }
  categories: number[]
  featured_media: number
  _embedded?: {
    'wp:featuredmedia'?: Array<{
      source_url?: string
      alt_text?: string
    }>
    author?: Array<{ name?: string }>
  }
}

export interface PostPage {
  posts: WPPost[]
  total: number
  totalPages: number
}

export interface PostQuery {
  page?: number
  perPage?: number
  category?: number
  search?: string
}

const CACHE_TTL = 5 * 60 * 1000
const REQUEST_TIMEOUT = 12000

const cache = new Map<string, { expiresAt: number; data: unknown }>()
let activeBase: string | null = null

export class WpError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'WpError'
    this.status = status
  }
}

const basesInOrder = (): string[] => {
  if (!activeBase) return WP_API_BASES
  return [activeBase, ...WP_API_BASES.filter((base) => base !== activeBase)]
}

const getJson = async <T>(path: string): Promise<{ data: T; headers: Headers }> => {
  const cacheKey = path
  const cached = cache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data as { data: T; headers: Headers }
  }

  let lastError: unknown = null

  for (const base of basesInOrder()) {
    const url = `${base.replace(/\/+$/, '')}${path}`
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)
    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      })
      if (!response.ok) {
        throw new WpError(`WordPress responded with ${response.status}`, response.status)
      }
      const data = (await response.json()) as T
      activeBase = base
      const result = { data, headers: response.headers }
      cache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL, data: result })
      return result
    } catch (error) {
      lastError = error
    } finally {
      clearTimeout(timer)
    }
  }

  if (lastError instanceof WpError) throw lastError
  throw new WpError('WordPress could not be reached')
}

export const getPosts = async (query: PostQuery = {}): Promise<PostPage> => {
  const params = new URLSearchParams()
  params.set('per_page', String(query.perPage ?? 9))
  params.set('page', String(query.page ?? 1))
  params.set('_fields', 'id,slug,date,link,title,excerpt,categories')
  if (query.category) params.set('categories', String(query.category))
  if (query.search) params.set('search', query.search)

  const { data, headers } = await getJson<WPPost[]>(`/posts?${params.toString()}`)
  return {
    posts: data,
    total: Number(headers.get('x-wp-total') ?? data.length),
    totalPages: Math.max(1, Number(headers.get('x-wp-totalpages') ?? 1)),
  }
}

export const getCategories = async (): Promise<WPCategory[]> => {
  const params = new URLSearchParams({
    per_page: '100',
    orderby: 'count',
    order: 'desc',
    _fields: 'id,name,slug,count',
  })
  const { data } = await getJson<WPCategory[]>(`/categories?${params.toString()}`)
  return data.filter((category) => category.count > 0 && category.slug !== 'uncategorized')
}

export const getPostBySlug = async (slug: string): Promise<WPPost | null> => {
  const params = new URLSearchParams({
    slug,
    _embed: 'wp:featuredmedia,author',
  })
  const { data } = await getJson<WPPost[]>(`/posts?${params.toString()}`)
  return data[0] ?? null
}

export const getFeaturedImage = (post: WPPost): string | null =>
  post._embedded?.['wp:featuredmedia']?.[0]?.source_url ?? null

export const getAuthorName = (post: WPPost): string | null =>
  post._embedded?.author?.[0]?.name ?? null

export const preparePostHtml = (html: string, title: string): string => {
  const clean = DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['script', 'style', 'form', 'input', 'button', 'textarea', 'select', 'option'],
  })
  const doc = new DOMParser().parseFromString(clean, 'text/html')

  const first = doc.body.firstElementChild
  if (first?.tagName === 'H1') {
    const heading = (first.textContent ?? '').replace(/\s+/g, ' ').trim().toLowerCase()
    const expected = title.replace(/\s+/g, ' ').trim().toLowerCase()
    if (!expected || heading === expected) first.remove()
  }

  doc.body.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((anchor) => {
    const href = anchor.getAttribute('href') ?? ''
    if (/^https?:\/\//i.test(href)) {
      anchor.setAttribute('target', '_blank')
      anchor.setAttribute('rel', 'noopener noreferrer')
    }
  })

  doc.body.querySelectorAll<HTMLImageElement>('img').forEach((image) => {
    image.setAttribute('loading', 'lazy')
    image.setAttribute('decoding', 'async')
  })

  return doc.body.innerHTML
}
