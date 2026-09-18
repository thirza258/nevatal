import { renderToStaticMarkup } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import LandingPage from './pages/landing/LandingPage';
import PublicPages from './pages/public/PublicPages';
import { escapeMarkup, getPageMetadata, metadataTags } from './seo';

export { buildSitemap, PUBLIC_PAGES } from './seo';

export function renderPublicPage(pathname: string) {
  const metadata = getPageMetadata(pathname);
  const head = [
    `<title>${escapeMarkup(metadata.title)}</title>`,
    `<link rel="canonical" href="${escapeMarkup(metadata.canonical)}" />`,
    ...metadataTags(metadata).map((tag) => {
      const attribute = tag.name ? `name="${tag.name}"` : `property="${tag.property}"`;
      return `<meta ${attribute} content="${escapeMarkup(tag.content)}" />`;
    }),
  ].join('\n    ');
  const body = renderToStaticMarkup(
    <StaticRouter location={pathname}>
      {pathname === '/' ? <LandingPage onKeySubmit={() => undefined} /> : <PublicPages />}
    </StaticRouter>
  );
  return { head, body };
}
