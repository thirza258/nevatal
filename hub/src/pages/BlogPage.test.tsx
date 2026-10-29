import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import BlogPage from './BlogPage'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const jsonResponse = (data: unknown, headers: Record<string, string> = {}) => ({
  ok: true,
  status: 200,
  json: async () => data,
  headers: { get: (name: string) => headers[name.toLowerCase()] ?? null },
})

const flush = async (times = 3) => {
  for (let index = 0; index < times; index += 1) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
  }
}

describe('BlogPage', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string) => {
        if (input.includes('/categories')) {
          return jsonResponse([
            { id: 2, name: 'Artificial Intelligence &amp; Machine Learning', slug: 'ai', count: 58 },
          ])
        }
        if (input.includes('/posts')) {
          return jsonResponse(
            [
              {
                id: 1,
                slug: 'hello-world',
                date: '2026-10-28T09:25:29',
                link: 'https://wordpress.nevatal.id/hello-world/',
                title: { rendered: 'Hello &amp; World' },
                excerpt: { rendered: '<p>A useful note about building things.</p>' },
                content: { rendered: '<p>Body.</p>' },
                categories: [2],
                featured_media: 0,
              },
            ],
            { 'x-wp-total': '1', 'x-wp-totalpages': '1' }
          )
        }
        throw new Error(`Unexpected request: ${input}`)
      })
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders posts and categories from the WordPress API', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    await act(async () => {
      root.render(
        <MemoryRouter>
          <BlogPage />
        </MemoryRouter>
      )
    })
    await flush()

    expect(container.textContent).toContain('Hello & World')
    expect(container.textContent).toContain('A useful note about building things.')
    expect(container.textContent).toContain('1 article')
    expect(container.textContent).toContain('Artificial Intelligence & Machine Learning')

    await act(async () => {
      root.unmount()
    })
    container.remove()
  })
})
