/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SvgDimensionsInfo {
  width: number;
  height: number;
  aspectRatio: number;
}

function parseSvgNumericAttr(val?: string | null): number | null {
  if (!val) return null;
  const trimmed = val.trim();
  if (trimmed.endsWith('%')) return null;
  const match = trimmed.match(/^([0-9]+(?:\.[0-9]+)?)\s*(px|pt|in|cm|mm)?$/i);
  if (!match) return null;
  const num = parseFloat(match[1]);
  const unit = (match[2] || 'px').toLowerCase();
  if (!isFinite(num) || num <= 0) return null;
  if (unit === 'pt') return Math.round(num * 1.3333);
  if (unit === 'in') return Math.round(num * 96);
  if (unit === 'cm') return Math.round(num * 37.795);
  if (unit === 'mm') return Math.round(num * 3.7795);
  return Math.round(num);
}

export function parseSvgInfo(svgText: string): SvgDimensionsInfo {
  const trimmed = (svgText || '').trim();
  const svgTagMatch = trimmed.match(/<svg\b([^>]*)>/i);
  if (!svgTagMatch) {
    throw new Error('Input is not a valid SVG document (missing <svg> root tag).');
  }

  const attrs = svgTagMatch[1];
  const widthMatch = attrs.match(/\bwidth\s*=\s*["']([^"']+)["']/i);
  const heightMatch = attrs.match(/\bheight\s*=\s*["']([^"']+)["']/i);
  const viewBoxMatch = attrs.match(/\bviewBox\s*=\s*["']([^"']+)["']/i);

  let width = parseSvgNumericAttr(widthMatch?.[1]);
  let height = parseSvgNumericAttr(heightMatch?.[1]);

  if ((!width || !height) && viewBoxMatch) {
    const parts = viewBoxMatch[1]
      .trim()
      .split(/[\s,]+/)
      .map(Number);
    if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
      if (!width) width = Math.round(parts[2]);
      if (!height) height = Math.round(parts[3]);
    }
  }

  const finalW = Math.max(1, width || 512);
  const finalH = Math.max(1, height || 512);
  return {
    width: finalW,
    height: finalH,
    aspectRatio: finalW / finalH,
  };
}

export function computeRasterSize(
  intrinsicWidth: number,
  intrinsicHeight: number,
  scale: number
): { width: number; height: number } {
  const s = Math.max(0.1, scale);
  return {
    width: Math.max(1, Math.round(intrinsicWidth * s)),
    height: Math.max(1, Math.round(intrinsicHeight * s)),
  };
}

export function normalizeSvgMarkup(
  svgText: string,
  targetWidth: number,
  targetHeight: number
): string {
  const info = parseSvgInfo(svgText);
  return svgText.replace(/<svg\b([^>]*)>/i, (_full, attrStr: string) => {
    let cleaned = attrStr
      .replace(/\bwidth\s*=\s*["'][^"']*["']/gi, '')
      .replace(/\bheight\s*=\s*["'][^"']*["']/gi, '')
      .trim();

    if (!/\bxmlns\s*=/i.test(cleaned)) {
      cleaned = `xmlns="http://www.w3.org/2000/svg" ${cleaned}`.trim();
    }
    if (!/\bviewBox\s*=/i.test(cleaned)) {
      cleaned = `${cleaned} viewBox="0 0 ${info.width} ${info.height}"`.trim();
    }

    return `<svg ${cleaned} width="${Math.round(targetWidth)}" height="${Math.round(targetHeight)}">`;
  });
}

export async function renderSvgToRaster(
  svgMarkup: string,
  options: {
    width: number;
    height: number;
    format: 'image/png' | 'image/jpeg' | 'image/webp';
    quality?: number;
    backgroundColor?: string | null;
  }
): Promise<{ blob: Blob; dataUrl: string; width: number; height: number; size: number }> {
  const normalized = normalizeSvgMarkup(svgMarkup, options.width, options.height);
  const svgBlob = new Blob([normalized], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Could not render SVG graphics cleanly.'));
      el.src = svgUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(options.width));
    canvas.height = Math.max(1, Math.round(options.height));

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not initialize canvas context.');

    if (options.format === 'image/jpeg' || options.backgroundColor) {
      ctx.fillStyle = options.backgroundColor || '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const q = options.quality ?? 0.94;
    const dataUrl = canvas.toDataURL(options.format, q);
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b || new Blob()), options.format, q);
    });

    const w = canvas.width;
    const h = canvas.height;
    canvas.width = 0;
    canvas.height = 0;

    return { blob, dataUrl, width: w, height: h, size: blob.size };
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}
