/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TOOLS_SEO_DATA } from '../data/toolsSeoData';

export function normalizeBaseUrl(rawUrl: string): string {
  return rawUrl.trim().replace(/\/+$/, '');
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function buildSitemapXml(
  baseUrl: string,
  lastmod: string = new Date().toISOString().slice(0, 10)
): string {
  const origin = normalizeBaseUrl(baseUrl);
  const seen = new Set<string>();
  const urls: { loc: string; changefreq: string; priority: string }[] = [];

  const addUrl = (path: string, changefreq: string, priority: string) => {
    const cleanPath = path === '/' ? '/' : `/${path.replace(/^\/+/, '').replace(/\/+$/, '')}`;
    if (seen.has(cleanPath)) return;
    seen.add(cleanPath);
    urls.push({
      loc: `${origin}${cleanPath}`,
      changefreq,
      priority,
    });
  };

  addUrl('/', 'daily', '1.0');

  for (const seo of Object.values(TOOLS_SEO_DATA)) {
    addUrl(seo.slug, 'weekly', seo.category === 'utility' ? '0.9' : '0.85');
  }

  addUrl('/about', 'monthly', '0.7');
  addUrl('/privacy', 'monthly', '0.7');
  addUrl('/contact', 'monthly', '0.7');

  const entries = urls
    .map(
      (item) => `  <url>
    <loc>${escapeXml(item.loc)}</loc>
    <lastmod>${escapeXml(lastmod)}</lastmod>
    <changefreq>${item.changefreq}</changefreq>
    <priority>${item.priority}</priority>
  </url>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`;
}

export function buildRobotsTxt(baseUrl: string): string {
  const origin = normalizeBaseUrl(baseUrl);
  return `User-agent: *
Allow: /

Sitemap: ${origin}/sitemap.xml
`;
}
