import { useEffect } from 'react'
import { SITE_NAME, SITE_URL } from './constants'

interface PageMeta {
  title: string
  description: string
  path: string
  type?: 'website' | 'article'
  image?: string
  jsonLd?: Record<string, unknown>
  noindex?: boolean
}

const upsertMeta = (attribute: 'name' | 'property', key: string, content: string) => {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

const upsertCanonical = (href: string) => {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!element) {
    element = document.createElement('link')
    element.rel = 'canonical'
    document.head.appendChild(element)
  }
  element.href = href
}

export const usePageMeta = ({
  title,
  description,
  path,
  type = 'website',
  image = `${SITE_URL}/og-image.png`,
  jsonLd,
  noindex = false,
}: PageMeta) => {
  const jsonLdString = jsonLd ? JSON.stringify(jsonLd) : ''

  useEffect(() => {
    const canonical = `${SITE_URL}${path}`
    document.title = title
    upsertCanonical(canonical)
    upsertMeta('name', 'description', description)
    upsertMeta(
      'name',
      'robots',
      noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large, max-snippet:-1'
    )
    upsertMeta('property', 'og:site_name', SITE_NAME)
    upsertMeta('property', 'og:type', type)
    upsertMeta('property', 'og:title', title)
    upsertMeta('property', 'og:description', description)
    upsertMeta('property', 'og:url', canonical)
    upsertMeta('property', 'og:image', image)
    upsertMeta('name', 'twitter:card', 'summary_large_image')
    upsertMeta('name', 'twitter:title', title)
    upsertMeta('name', 'twitter:description', description)
    upsertMeta('name', 'twitter:image', image)

    const existing = document.getElementById('page-jsonld')
    if (!jsonLdString) {
      existing?.remove()
      return
    }

    let script = existing as HTMLScriptElement | null
    if (!script) {
      script = document.createElement('script')
      script.id = 'page-jsonld'
      script.type = 'application/ld+json'
      document.head.appendChild(script)
    }
    script.textContent = jsonLdString
  }, [title, description, path, type, image, jsonLdString, noindex])
}
