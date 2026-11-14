/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  detectImageMimeFromBase64,
  parseBase64Input,
  bytesToBase64,
  formatBase64OutputSnippets,
  mimeToExtension,
} from '../base64Helper';
import { parseSvgInfo, normalizeSvgMarkup, computeRasterSize } from '../svgHelper';

describe('base64Helper', () => {
  it('detects MIME types from raw base64 signatures', () => {
    expect(detectImageMimeFromBase64('iVBORw0KGgoAAAANSUhEUg==')).toBe('image/png');
    expect(detectImageMimeFromBase64('/9j/4AAQSkZJRgABAQAAAQ==')).toBe('image/jpeg');
    expect(detectImageMimeFromBase64('UklGRiIAAABXRUJQVlA4')).toBe('image/webp');
    expect(detectImageMimeFromBase64('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7')).toBe('image/gif');
    expect(detectImageMimeFromBase64('PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjwvc3ZnPg==')).toBe('image/svg+xml');
  });

  it('parses Data URIs and whitespace-wrapped Base64 into exact byte arrays', () => {
    const sample = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]); // PNG magic header
    const b64 = bytesToBase64(sample);
    const wrapped = `  data:image/png;base64,${b64.slice(0, 4)}\n${b64.slice(4)}  `;

    const parsed = parseBase64Input(wrapped);
    expect(parsed.mimeType).toBe('image/png');
    expect(parsed.extension).toBe('png');
    expect(Array.from(parsed.bytes)).toEqual(Array.from(sample));
    expect(parsed.dataUri).toBe(`data:image/png;base64,${b64}`);
  });

  it('rejects malformed or empty base64 strings', () => {
    expect(() => parseBase64Input('')).toThrow();
    expect(() => parseBase64Input('not!valid@base64#string')).toThrow();
  });

  it('builds formatted Data URI, Raw, HTML img, and CSS url snippets', () => {
    const snippets = formatBase64OutputSnippets('data:image/png;base64,iVBORw0KGgo=', 'image/png', 'logo.png');
    expect(snippets.rawBase64).toBe('iVBORw0KGgo=');
    expect(snippets.dataUri).toBe('data:image/png;base64,iVBORw0KGgo=');
    expect(snippets.htmlImg).toContain('<img src="data:image/png;base64,iVBORw0KGgo="');
    expect(snippets.cssUrl).toBe('background-image: url("data:image/png;base64,iVBORw0KGgo=");');
    expect(mimeToExtension('image/jpeg')).toBe('jpg');
    expect(mimeToExtension('image/svg+xml')).toBe('svg');
  });
});

describe('svgHelper', () => {
  it('parses width, height, and viewBox from SVG markup', () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240px" height="120px" viewBox="0 0 240 120"><rect width="240" height="120"/></svg>`;
    const info = parseSvgInfo(svg);
    expect(info.width).toBe(240);
    expect(info.height).toBe(120);
  });

  it('falls back to viewBox dimensions when width/height attributes are absent', () => {
    const svg = `<svg viewBox="0 0 800 400"><circle cx="400" cy="200" r="100"/></svg>`;
    const info = parseSvgInfo(svg);
    expect(info.width).toBe(800);
    expect(info.height).toBe(400);

    const normalized = normalizeSvgMarkup(svg, 1600, 800);
    expect(normalized).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(normalized).toContain('width="1600"');
    expect(normalized).toContain('height="800"');
  });

  it('computes scaled raster dimensions and rejects invalid SVG input', () => {
    expect(computeRasterSize(300, 150, 3)).toEqual({ width: 900, height: 450 });
    expect(() => parseSvgInfo('<div>Not an SVG</div>')).toThrow(/valid svg/i);
  });
});
