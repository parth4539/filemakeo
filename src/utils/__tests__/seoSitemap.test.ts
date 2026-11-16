import { describe, it, expect } from 'vitest';
import { buildSitemapXml, buildRobotsTxt } from '../sitemapBuilder';
import { TOOLS } from '../../types/tool';
import { TOOLS_SEO_DATA } from '../../data/toolsSeoData';

describe('sitemapBuilder & SEO registry coverage', () => {
  it('covers every tool in TOOLS within TOOLS_SEO_DATA', () => {
    for (const tool of TOOLS) {
      expect(TOOLS_SEO_DATA[tool.id]).toBeDefined();
      expect(TOOLS_SEO_DATA[tool.id].slug).toBe(tool.slug);
    }
  });

  it('generates valid XML sitemap with dynamic Netlify/site origin and no HTML tags', () => {
    const xml = buildSitemapXml('https://filemaker.netlify.app/', '2026-11-16');
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml).toContain('</urlset>');
    expect(xml.toLowerCase()).not.toContain('<html');
    expect(xml.toLowerCase()).not.toContain('<!doctype');

    expect(xml).toContain('<loc>https://filemaker.netlify.app/</loc>');
    expect(xml).toContain('<loc>https://filemaker.netlify.app/merge-pdf</loc>');
    expect(xml).toContain('<loc>https://filemaker.netlify.app/qr-code</loc>');
    expect(xml).toContain('<loc>https://filemaker.netlify.app/about</loc>');
    expect(xml).toContain('<lastmod>2026-11-16</lastmod>');

    for (const tool of TOOLS) {
      expect(xml).toContain(`<loc>https://filemaker.netlify.app${tool.slug}</loc>`);
    }
  });

  it('avoids duplicate URLs and double slashes', () => {
    const xml = buildSitemapXml('https://example.com///');
    const matches = xml.match(/<loc>/g) ?? [];
    expect(matches.length).toBe(TOOLS.length + 4); // home + 26 tools + about/privacy/contact
    expect(xml).not.toContain('https://example.com//');
  });

  it('generates valid robots.txt pointing to active sitemap.xml', () => {
    const robots = buildRobotsTxt('https://filemaker.netlify.app/');
    expect(robots).toContain('User-agent: *');
    expect(robots).toContain('Allow: /');
    expect(robots).toContain('Sitemap: https://filemaker.netlify.app/sitemap.xml');
  });
});
