import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import App from './App'

const renderAt = (path: string) =>
  renderToString(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  )

describe('app shell', () => {
  it('renders the landing page with the portfolio and blog sections', () => {
    const html = renderAt('/')
    expect(html).toContain('AI products that')
    expect(html).toContain('From intelligent systems to products')
    expect(html).toContain('One ecosystem. Many ways in.')
    expect(html).toContain('One hub. More ways to work with AI.')
    expect(html).toContain('Beyond the prompt. Into the system.')
    expect(html).toContain('From an idea to a working product.')
    expect(html).toContain('Made to be explored.')
    expect(html).toContain('Learn by building.')
    expect(html).toContain('The systems behind the experience.')
    expect(html).toContain('A studio built across disciplines.')
    expect(html).toContain('Notes from the workshop.')
    expect(html).toContain('Put the portfolio to work.')
    expect(html).toContain('chat.nevatal.id')
  })

  it('renders every public route without throwing', () => {
    expect(renderAt('/projects')).toContain('Work that ships.')
    expect(renderAt('/blog')).toContain('Notes from the workshop.')
    expect(renderAt('/about')).toContain('Independent by design.')
    expect(renderAt('/missing-page')).toContain('404')
  })

  it('keeps the excluded telenursing work out of the portfolio', () => {
    expect(renderAt('/projects').toLowerCase()).not.toContain('telenursing')
  })

  it('offers a live preview control for public projects', () => {
    const html = renderAt('/projects')
    expect(html).toContain('aria-label="Preview Webisaurus"')
    expect(html).toContain('aria-label="Preview Literal Storyboard"')
    expect(html).toContain('aria-label="Preview VideoTex"')
  })
})
