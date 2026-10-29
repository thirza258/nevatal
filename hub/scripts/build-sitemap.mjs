import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const dist = join(here, '..', 'dist')
const site = 'https://nevatal.id'
const apiBase = process.env.VITE_WP_API_BASE || 'https://wordpress.nevatal.id/wp-json/wp/v2'

const staticPages = [
  { path: '/', lastmod: new Date().toISOString().slice(0, 10) },
  { path: '/projects', lastmod: new Date().toISOString().slice(0, 10) },
  { path: '/blog', lastmod: new Date().toISOString().slice(0, 10) },
  { path: '/about', lastmod: new Date().toISOString().slice(0, 10) },
]

const posts = []

try {
  let page = 1
  let totalPages = 1
  do {
    const url = `${apiBase}/posts?per_page=100&page=${page}&_fields=slug,modified`
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!response.ok) break
    const batch = await response.json()
    if (!Array.isArray(batch) || batch.length === 0) break
    for (const post of batch) {
      if (post.slug) posts.push({ slug: post.slug, lastmod: (post.modified || '').slice(0, 10) })
    }
    totalPages = Number(response.headers.get('x-wp-totalpages') || page)
    page += 1
  } while (page <= totalPages)
} catch (error) {
  console.warn(`Sitemap: WordPress posts unavailable (${error.message}); writing static pages only.`)
}

const escapeXml = (value) =>
  value.replace(/[<>&'"]/g, (character) => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    "'": '&apos;',
    '"': '&quot;',
  })[character])

const entries = [
  ...staticPages.map((entry) => ({
    loc: `${site}${entry.path}`,
    lastmod: entry.lastmod,
  })),
  ...posts.map((post) => ({
    loc: `${site}/blog/${encodeURIComponent(post.slug)}`,
    lastmod: post.lastmod,
  })),
]

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (entry) => `  <url>
    <loc>${escapeXml(entry.loc)}</loc>${entry.lastmod ? `\n    <lastmod>${entry.lastmod}</lastmod>` : ''}
  </url>`
  )
  .join('\n')}
</urlset>
`

await writeFile(join(dist, 'sitemap.xml'), sitemap, 'utf8')
console.log(`Sitemap: ${entries.length} URLs (${posts.length} posts).`)
