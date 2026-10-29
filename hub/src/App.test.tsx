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
    expect(html).toContain('Built, shipped and still running.')
    expect(html).toContain('Notes from the workshop.')
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
})
