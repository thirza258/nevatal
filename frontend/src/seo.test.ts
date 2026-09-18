import { describe, expect, it } from 'vitest';
import sitemap from '../public/sitemap.xml?raw';
import { COURSES, coursePath } from './courses/catalog';
import { COURSE_LESSONS } from './courses/lessons';
import { SITE_URL } from './constant';
import { ALL_TOOLS } from './tools';
import { buildSitemap, getPageMetadata, PUBLIC_PAGES } from './seo';
import { renderPublicPage } from './prerender';

describe('indexable public content', () => {
  it('ships a valid, current sitemap containing only public canonical URLs', () => {
    expect(sitemap).toBe(buildSitemap());
    const xml = new DOMParser().parseFromString(sitemap, 'application/xml');
    expect(xml.querySelector('parsererror')).toBeNull();
    const locations = Array.from(xml.querySelectorAll('loc'), (node) => node.textContent);
    expect(locations).toEqual(PUBLIC_PAGES.map((page) => `${SITE_URL}${page.path}`));
    expect(new Set(locations).size).toBe(locations.length);
    expect(locations).toContain(`${SITE_URL}/courses`);
    expect(locations).toContain(`${SITE_URL}/about`);
    for (const path of [...ALL_TOOLS.map((tool) => tool.path), '/usage', '/memory', '/history/42', '/courses/missing']) {
      expect(locations).not.toContain(`${SITE_URL}${path}`);
      expect(getPageMetadata(path).robots).toBe('noindex, follow');
    }
  });

  it.each(COURSES)('renders crawlable HTML, unique metadata and working lesson anchors for $title', (course) => {
    const { head, body } = renderPublicPage(coursePath(course));
    const page = new DOMParser().parseFromString(`<html><head>${head}</head><body>${body}</body></html>`, 'text/html');
    expect(page.querySelector('h1')?.textContent).toBe(course.title);
    expect(page.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(`${SITE_URL}${coursePath(course)}`);
    expect(page.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(course.description);
    for (const lesson of COURSE_LESSONS[course.slug]) {
      expect(page.getElementById(lesson.id)?.textContent).toContain(lesson.exercise);
      expect(page.querySelector(`a[href="#${lesson.id}"]`)).not.toBeNull();
    }
    for (const path of course.toolPaths) expect(ALL_TOOLS.some((tool) => tool.path === path)).toBe(true);
    const data = JSON.parse(page.querySelector('script[type="application/ld+json"]')!.textContent!);
    expect(data['@graph'][0]).toMatchObject({ '@type': 'Course', name: course.title, isAccessibleForFree: true });
    expect(data['@graph'][0].hasPart).toHaveLength(COURSE_LESSONS[course.slug].length);
    expect(getPageMetadata(`${coursePath(course)}/`).canonical).toBe(`${SITE_URL}${coursePath(course)}`);
  });
});
