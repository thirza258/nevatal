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

interface CacheEntry<T> {
  expiresAt: number
  data: T
  headers: Record<string, string>
}

const DEFAULT_POSTS_TTL = 10 * 60 * 1000 // 10 minutes
const CATEGORIES_TTL = 30 * 60 * 1000 // 30 minutes
const SINGLE_POST_TTL = 20 * 60 * 1000 // 20 minutes
const REQUEST_TIMEOUT = 12000
const STORAGE_PREFIX = 'nv_wp_v1_'

const memoryCache = new Map<string, CacheEntry<unknown>>()
let activeBase: string | null = null

export class WpError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'WpError'
    this.status = status
  }
}

const createHeadersWrapper = (record: Record<string, string>): Headers => {
  if (typeof Headers !== 'undefined') {
    try {
      return new Headers(record)
    } catch {
      // Fall through to object wrapper
    }
  }
  return {
    get: (name: string) => record[name.toLowerCase()] ?? null,
  } as unknown as Headers
}

const readStorage = <T>(key: string): CacheEntry<T> | null => {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return null
    const raw = window.sessionStorage.getItem(`${STORAGE_PREFIX}${key}`)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CacheEntry<T>
    if (!parsed || typeof parsed.expiresAt !== 'number' || parsed.expiresAt <= Date.now()) {
      window.sessionStorage.removeItem(`${STORAGE_PREFIX}${key}`)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

const writeStorage = <T>(key: string, entry: CacheEntry<T>): void => {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return
    window.sessionStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(entry))
  } catch {
    // sessionStorage quota exceeded or restricted; gracefully ignore
  }
}

const basesInOrder = (): string[] => {
  if (!activeBase) return WP_API_BASES
  return [activeBase, ...WP_API_BASES.filter((base) => base !== activeBase)]
}

const getJson = async <T>(
  path: string,
  ttl: number = DEFAULT_POSTS_TTL
): Promise<{ data: T; headers: Headers }> => {
  const cacheKey = path

  // Tier 1: In-memory cache
  const memoryHit = memoryCache.get(cacheKey) as CacheEntry<T> | undefined
  if (memoryHit && memoryHit.expiresAt > Date.now()) {
    return { data: memoryHit.data, headers: createHeadersWrapper(memoryHit.headers) }
  }

  // Tier 2: Persistent sessionStorage cache
  const storageHit = readStorage<T>(cacheKey)
  if (storageHit) {
    memoryCache.set(cacheKey, storageHit as CacheEntry<unknown>)
    return { data: storageHit.data, headers: createHeadersWrapper(storageHit.headers) }
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

      const headersRecord: Record<string, string> = {}
      if (response.headers) {
        if (typeof response.headers.forEach === 'function') {
          response.headers.forEach((value, name) => {
            headersRecord[name.toLowerCase()] = value
          })
        } else if (typeof response.headers.get === 'function') {
          for (const key of ['x-wp-total', 'x-wp-totalpages']) {
            const val = response.headers.get(key)
            if (val !== null) headersRecord[key] = val
          }
        }
      }

      const entry: CacheEntry<T> = {
        expiresAt: Date.now() + ttl,
        data,
        headers: headersRecord,
      }

      memoryCache.set(cacheKey, entry as CacheEntry<unknown>)
      writeStorage(cacheKey, entry)

      return { data, headers: response.headers }
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

  const { data, headers } = await getJson<WPPost[]>(`/posts?${params.toString()}`, DEFAULT_POSTS_TTL)
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
  const { data } = await getJson<WPCategory[]>(`/categories?${params.toString()}`, CATEGORIES_TTL)
  return data.filter((category) => category.count > 0 && category.slug !== 'uncategorized')
}

export const getPostBySlug = async (slug: string): Promise<WPPost | null> => {
  const params = new URLSearchParams({
    slug,
    _embed: 'wp:featuredmedia,author',
  })
  const { data } = await getJson<WPPost[]>(`/posts?${params.toString()}`, SINGLE_POST_TTL)
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
