import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const key = '04a963523d6742bdaa613b3c41e8c13e';
const host = 'nevatal.id';
const keyLocation = `https://${host}/${key}.txt`;

let sitemapPath = join(here, '..', 'dist', 'sitemap.xml');
let content;
try {
  content = await readFile(sitemapPath, 'utf8');
} catch {
  sitemapPath = join(here, '..', 'public', 'sitemap.xml');
  content = await readFile(sitemapPath, 'utf8');
}

const urlMatches = content.match(/<loc>(.*?)<\/loc>/g) || [];
const urlList = urlMatches.map((tag) => tag.replace(/<\/?loc>/g, '').trim());

if (urlList.length === 0) {
  console.error('No URLs found in sitemap.');
  process.exit(1);
}

console.log(`Submitting ${urlList.length} URLs for ${host} to IndexNow...`);

const payload = {
  host,
  key,
  keyLocation,
  urlList,
};

const response = await fetch('https://api.indexnow.org/IndexNow', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
  },
  body: JSON.stringify(payload),
});

if (response.ok || response.status === 202) {
  console.log(`Successfully submitted ${urlList.length} URLs to IndexNow (Status: ${response.status}).`);
} else {
  const text = await response.text();
  console.error(`IndexNow submission failed: ${response.status} ${response.statusText}\n${text}`);
  process.exit(1);
}
