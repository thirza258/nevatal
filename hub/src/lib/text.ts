export const decodeHtml = (html: string): string => {
  if (!html) return ''
  if (typeof DOMParser === 'undefined') {
    return html
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&nbsp;/g, ' ')
  }
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return doc.documentElement.textContent ?? ''
}

export const plainText = (html: string): string => {
  if (!html) return ''
  const withoutTags = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
  return decodeHtml(withoutTags).replace(/\s+/g, ' ').trim()
}

export const excerptText = (html: string): string =>
  plainText(html)
    .replace(/\s*\[(?:…|\.\.\.)\]\s*$/, '')
    .replace(/\s*(?:…|\.\.\.)\s*$/, '')
    .trim()

export const formatDate = (iso: string): string => {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

export const readingTime = (html: string): number => {
  const words = plainText(html).split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

export const formatNumber = (value: number): string =>
  new Intl.NumberFormat('en-US').format(value)
