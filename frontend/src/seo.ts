import { DEFAULT_PAGE_TITLE, SITE_NAME, SITE_URL } from './constant';
import { COURSES, coursePath } from './courses/catalog';
import { findToolByPath } from './tools';

export const normalizePath = (pathname: string) => pathname.replace(/\/+$/, '') || '/';
export const isPublicContentPath = (pathname: string) =>
  normalizePath(pathname) === '/about' || /^\/courses(?:\/|$)/.test(pathname);

export const PUBLIC_PAGES = [
  { path: '/', updated: '2026-09-18' },
  { path: '/about', updated: '2026-09-18' },
  { path: '/courses', updated: '2026-09-18' },
  ...COURSES.map((course) => ({ path: coursePath(course), updated: course.updated })),
];

export interface PageMetadata {
  title: string;
  description: string;
  canonical: string;
  robots: string;
}

export const getPageMetadata = (pathname: string): PageMetadata => {
  const path = normalizePath(pathname);
  let title = DEFAULT_PAGE_TITLE;
  let description = 'An open source AI tools hub: writing, translation, summarising, document Q&A and image generation, all running on your own OpenAI, Gemini or OpenRouter API key.';
  const course = COURSES.find((item) => coursePath(item) === path);

  if (course) {
    title = `${course.title} — Free AI Course — ${SITE_NAME}`;
    description = course.description;
  } else if (path === '/courses') {
    title = `Free AI Courses — Learn with ${SITE_NAME}`;
    description = `Learn to prompt, write, translate, work with documents and clean data with ${COURSES.length} practical Nevatal courses. Free lessons, examples and exercises; no API key needed to read.`;
  } else if (path === '/about') {
    title = `About — ${SITE_NAME}`;
    description = 'Explore Nevatal’s AI tools, supported providers and how to use your own API key for writing, translation, document questions, image generation and data workflows.';
  } else if (path !== '/') {
    const tool = findToolByPath(path);
    title = tool ? `${tool.name} — ${SITE_NAME}` : `Page not found — ${SITE_NAME}`;
    description = tool?.description ?? 'This page could not be found. Explore Nevatal’s courses or return to the workspace.';
  }

  return {
    title,
    description,
    canonical: `${SITE_URL}${path}`,
    robots: PUBLIC_PAGES.some((page) => page.path === path)
      ? 'index, follow, max-image-preview:large, max-snippet:-1'
      : 'noindex, follow',
  };
};

export const metadataTags = (metadata: PageMetadata) => [
  { name: 'description', content: metadata.description },
  { name: 'robots', content: metadata.robots },
  { property: 'og:url', content: metadata.canonical },
  { property: 'og:title', content: metadata.title },
  { property: 'og:description', content: metadata.description },
  { name: 'twitter:title', content: metadata.title },
  { name: 'twitter:description', content: metadata.description },
];

/** Update the existing head tags, including when navigating back to the landing page. */
export const applyPageMetadata = (pathname: string) => {
  const metadata = getPageMetadata(pathname);
  document.title = metadata.title;
  let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.href = metadata.canonical;
  for (const tag of metadataTags(metadata)) {
    const attribute = tag.name ? 'name' : 'property';
    const value = tag.name ?? tag.property!;
    let element = document.querySelector<HTMLMetaElement>(`meta[${attribute}="${value}"]`);
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(attribute, value);
      document.head.appendChild(element);
    }
    element.content = tag.content;
  }
};

export const escapeMarkup = (value: string) => value.replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]!);

export const buildSitemap = () => `<?xml version="1.0" encoding="UTF-8"?>
<!-- Generated from src/seo.ts and src/courses/catalog.ts. Run npm run sitemap after editing public pages. -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${PUBLIC_PAGES.map((page) => `  <url>
    <loc>${escapeMarkup(`${SITE_URL}${page.path}`)}</loc>
    <lastmod>${page.updated}</lastmod>
  </url>`).join('\n')}
</urlset>
`;
