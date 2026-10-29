import { describe, expect, it } from 'vitest'
import { decodeHtml, excerptText, formatDate, readingTime } from './text'

describe('text helpers', () => {
  it('decodes the HTML entities WordPress returns', () => {
    expect(decodeHtml('Tom &amp; Jerry&#039;s &quot;show&quot;')).toBe('Tom & Jerry\'s "show"')
  })

  it('turns an excerpt into readable text without the trailing ellipsis', () => {
    expect(excerptText('<p>Hello&nbsp;<strong>world</strong> &hellip; […]</p>')).toBe('Hello world')
  })

  it('estimates reading time from the word count', () => {
    const html = `<p>${'word '.repeat(400)}</p>`
    expect(readingTime(html)).toBe(2)
  })

  it('formats WordPress dates for display', () => {
    expect(formatDate('2026-10-28T12:00:00')).toBe('Oct 28, 2026')
  })
})
