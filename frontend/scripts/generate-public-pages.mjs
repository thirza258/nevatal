import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const root = fileURLToPath(new URL('../', import.meta.url));
const sitemapOnly = process.argv.includes('--sitemap-only');
// Use Vite's TypeScript/TSX loader only at build time. No production Node server
// or backend request is needed to render these public, session-free pages.
const vite = await createServer({
  root,
  appType: 'custom',
  logLevel: 'error',
  server: { middlewareMode: true, hmr: false, watch: null },
});

try {
  const { buildSitemap, PUBLIC_PAGES, renderPublicPage } = await vite.ssrLoadModule('/src/prerender.tsx');
  const sitemap = buildSitemap();
  await writeFile(resolve(root, 'public/sitemap.xml'), sitemap);

  if (!sitemapOnly) {
    const template = await readFile(resolve(root, 'dist/index.html'), 'utf8');
    const headMarker = /<!-- page-meta:start -->[\s\S]*?<!-- page-meta:end -->/;
    if (!headMarker.test(template) || !template.includes('<div id="root"></div>')) {
      throw new Error('The public-page template is missing its metadata or root placeholder.');
    }
    for (const pathname of [...PUBLIC_PAGES.map((page) => page.path), '/404']) {
      const { head, body } = renderPublicPage(pathname);
      const html = template
        .replace(headMarker, () => `<!-- page-meta:start -->\n    ${head}\n    <!-- page-meta:end -->`)
        .replace('<div id="root"></div>', () => `<div id="root">${body}</div>`)
        // The rendered page is already readable without JavaScript; do not
        // append the landing page's fallback content to every course.
        .replace(/<noscript>[\s\S]*?<\/noscript>/, '');
      // nginx serves the directory index; Vite preview and other static hosts
      // resolve a clean URL through its .html sibling. Both carry the same
      // canonical URL so a direct request never falls back to homepage metadata.
      const relativePaths = pathname === '/404' ? ['404.html']
        : pathname === '/' ? ['index.html']
        : [`${pathname.slice(1)}/index.html`, `${pathname.slice(1)}.html`];
      for (const relativePath of relativePaths) {
        const destination = resolve(root, 'dist', relativePath);
        await mkdir(dirname(destination), { recursive: true });
        await writeFile(destination, html);
      }
    }
    await writeFile(resolve(root, 'dist/sitemap.xml'), sitemap);
    console.log(`Rendered ${PUBLIC_PAGES.length} public pages and a 404 page.`);
  }
  console.log(`Sitemap contains ${PUBLIC_PAGES.length} public URLs.`);
} finally {
  await vite.close();
}
