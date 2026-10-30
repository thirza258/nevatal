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
    expect(html).toContain('One hub. Seventeen ways to think.')
    expect(html).toContain('Built, shipped and still running.')
    expect(html).toContain('Built across the entire stack.')
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
    expect(html).toContain('Internal')
  })
})
