import { describe, expect, it } from 'vitest'
import { preparePostHtml } from './wp'

describe('preparePostHtml', () => {
  it('removes the duplicate leading title heading', () => {
    const html = '<h1>Hello &amp; World</h1><p>Body copy.</p>'
    const result = preparePostHtml(html, 'Hello & World')
    expect(result).not.toContain('<h1')
    expect(result).toContain('<p>Body copy.</p>')
  })

  it('strips scripts even when WordPress content carries them', () => {
    const html = '<p>Safe</p><script>alert("x")</script><style>body{display:none}</style>'
    const result = preparePostHtml(html, 'T')
    expect(result).toContain('<p>Safe</p>')
    expect(result).not.toContain('script')
    expect(result).not.toContain('display:none')
  })

  it('marks external links as safe new-tab links', () => {
    const result = preparePostHtml('<p><a href="https://example.com/x">x</a></p>', 'T')
    expect(result).toContain('target="_blank"')
    expect(result).toContain('rel="noopener noreferrer"')
  })
})
