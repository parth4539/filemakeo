/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type WatermarkPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'center'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'
  | 'tiled';

export interface RedactRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  shape: 'rect' | 'ellipse';
}

export function computeRotatedBoundingBox(
  width: number,
  height: number,
  angleDeg: number
): { width: number; height: number } {
  const normalized = ((angleDeg % 360) + 360) % 360;
  if (normalized === 0 || normalized === 180) {
    return { width: Math.round(width), height: Math.round(height) };
  }
  if (normalized === 90 || normalized === 270) {
    return { width: Math.round(height), height: Math.round(width) };
  }
  const rad = (normalized * Math.PI) / 180;
  const sin = Math.abs(Math.sin(rad));
  const cos = Math.abs(Math.cos(rad));
  return {
    width: Math.max(1, Math.round(width * cos + height * sin)),
    height: Math.max(1, Math.round(width * sin + height * cos)),
  };
}

export function computeWatermarkPositions(
  canvasWidth: number,
  canvasHeight: number,
  markWidth: number,
  markHeight: number,
  position: WatermarkPosition,
  margin: number = 32
): { x: number; y: number }[] {
  if (position === 'tiled') {
    const stepX = Math.max(markWidth + margin * 2, 120);
    const stepY = Math.max(markHeight + margin * 2, 100);
    const coords: { x: number; y: number }[] = [];
    for (let y = margin; y < canvasHeight; y += stepY) {
      for (let x = margin; x < canvasWidth; x += stepX) {
        coords.push({ x, y });
      }
    }
    return coords.length ? coords : [{ x: margin, y: margin }];
  }

  let x = (canvasWidth - markWidth) / 2;
  let y = (canvasHeight - markHeight) / 2;

  if (position.includes('left')) x = margin;
  if (position.includes('right')) x = canvasWidth - markWidth - margin;

  if (position.includes('top')) y = margin;
  if (position.includes('bottom')) y = canvasHeight - markHeight - margin;

  return [{ x: Math.round(x), y: Math.round(y) }];
}

function isInsideRegion(px: number, py: number, region: RedactRegion): boolean {
  const x0 = Math.floor(region.x);
  const y0 = Math.floor(region.y);
  const x1 = Math.ceil(region.x + region.width);
  const y1 = Math.ceil(region.y + region.height);

  if (px < x0 || px >= x1 || py < y0 || py >= y1) return false;
  if (region.shape === 'rect') return true;

  const rx = Math.max(1, region.width / 2);
  const ry = Math.max(1, region.height / 2);
  const cx = region.x + rx;
  const cy = region.y + ry;
  const norm = ((px + 0.5 - cx) / rx) ** 2 + ((py + 0.5 - cy) / ry) ** 2;
  return norm <= 1.0;
}

/**
 * Pixelates a target region of an RGBA pixel buffer in-place.
 */
export function pixelateRgbaBuffer(
  data: Uint8ClampedArray,
  imgWidth: number,
  imgHeight: number,
  region: RedactRegion,
  blockSize: number = 16
): void {
  const step = Math.max(2, Math.round(blockSize));
  const minX = Math.max(0, Math.floor(region.x));
  const minY = Math.max(0, Math.floor(region.y));
  const maxX = Math.min(imgWidth, Math.ceil(region.x + region.width));
  const maxY = Math.min(imgHeight, Math.ceil(region.y + region.height));

  for (let by = minY; by < maxY; by += step) {
    for (let bx = minX; bx < maxX; bx += step) {
      let rSum = 0;
      let gSum = 0;
      let bSum = 0;
      let aSum = 0;
      let count = 0;

      const blockEndX = Math.min(maxX, bx + step);
      const blockEndY = Math.min(maxY, by + step);

      for (let py = by; py < blockEndY; py++) {
        for (let px = bx; px < blockEndX; px++) {
          if (!isInsideRegion(px, py, region)) continue;
          const idx = (py * imgWidth + px) * 4;
          rSum += data[idx];
          gSum += data[idx + 1];
          bSum += data[idx + 2];
          aSum += data[idx + 3];
          count++;
        }
      }

      if (count === 0) continue;
      const rAvg = Math.round(rSum / count);
      const gAvg = Math.round(gSum / count);
      const bAvg = Math.round(bSum / count);
      const aAvg = Math.round(aSum / count);

      for (let py = by; py < blockEndY; py++) {
        for (let px = bx; px < blockEndX; px++) {
          if (!isInsideRegion(px, py, region)) continue;
          const idx = (py * imgWidth + px) * 4;
          data[idx] = rAvg;
          data[idx + 1] = gAvg;
          data[idx + 2] = bAvg;
          data[idx + 3] = aAvg;
        }
      }
    }
  }
}

/**
 * Deterministic multi-pass separable box blur limited strictly to the selected region.
 * Does not rely on CSS/Canvas `ctx.filter` (which is unavailable on some mobile Safari builds).
 */
export function blurRgbaBuffer(
  data: Uint8ClampedArray,
  imgWidth: number,
  imgHeight: number,
  region: RedactRegion,
  radius: number = 10
): void {
  const r = Math.max(1, Math.min(40, Math.round(radius)));
  const minX = Math.max(0, Math.floor(region.x));
  const minY = Math.max(0, Math.floor(region.y));
  const maxX = Math.min(imgWidth, Math.ceil(region.x + region.width));
  const maxY = Math.min(imgHeight, Math.ceil(region.y + region.height));

  if (maxX <= minX || maxY <= minY) return;

  const temp = new Uint8ClampedArray(data);

  // Two passes approximate Gaussian softness cleanly and fast
  for (let pass = 0; pass < 2; pass++) {
    // Horizontal pass reading from current buffer into temp
    const src = pass === 0 ? data : temp;
    const dst = new Uint8ClampedArray(src);

    for (let py = minY; py < maxY; py++) {
      for (let px = minX; px < maxX; px++) {
        if (!isInsideRegion(px, py, region)) continue;
        let rs = 0;
        let gs = 0;
        let bs = 0;
        let as = 0;
        let cnt = 0;

        const kx0 = Math.max(minX, px - r);
        const kx1 = Math.min(maxX - 1, px + r);
        for (let kx = kx0; kx <= kx1; kx++) {
          const kIdx = (py * imgWidth + kx) * 4;
          rs += src[kIdx];
          gs += src[kIdx + 1];
          bs += src[kIdx + 2];
          as += src[kIdx + 3];
          cnt++;
        }

        const outIdx = (py * imgWidth + px) * 4;
        dst[outIdx] = Math.round(rs / cnt);
        dst[outIdx + 1] = Math.round(gs / cnt);
        dst[outIdx + 2] = Math.round(bs / cnt);
        dst[outIdx + 3] = Math.round(as / cnt);
      }
    }

    // Vertical pass reading from dst back into buffer
    for (let py = minY; py < maxY; py++) {
      for (let px = minX; px < maxX; px++) {
        if (!isInsideRegion(px, py, region)) continue;
        let rs = 0;
        let gs = 0;
        let bs = 0;
        let as = 0;
        let cnt = 0;

        const ky0 = Math.max(minY, py - r);
        const ky1 = Math.min(maxY - 1, py + r);
        for (let ky = ky0; ky <= ky1; ky++) {
          const kIdx = (ky * imgWidth + px) * 4;
          rs += dst[kIdx];
          gs += dst[kIdx + 1];
          bs += dst[kIdx + 2];
          as += dst[kIdx + 3];
          cnt++;
        }

        const outIdx = (py * imgWidth + px) * 4;
        temp[outIdx] = Math.round(rs / cnt);
        temp[outIdx + 1] = Math.round(gs / cnt);
        temp[outIdx + 2] = Math.round(bs / cnt);
        temp[outIdx + 3] = Math.round(as / cnt);
      }
    }
  }

  for (let py = minY; py < maxY; py++) {
    for (let px = minX; px < maxX; px++) {
      if (!isInsideRegion(px, py, region)) continue;
      const idx = (py * imgWidth + px) * 4;
      data[idx] = temp[idx];
      data[idx + 1] = temp[idx + 1];
      data[idx + 2] = temp[idx + 2];
      data[idx + 3] = temp[idx + 3];
    }
  }
}

export function blackoutRgbaBuffer(
  data: Uint8ClampedArray,
  imgWidth: number,
  imgHeight: number,
  region: RedactRegion,
  color: [number, number, number] = [0, 0, 0]
): void {
  const minX = Math.max(0, Math.floor(region.x));
  const minY = Math.max(0, Math.floor(region.y));
  const maxX = Math.min(imgWidth, Math.ceil(region.x + region.width));
  const maxY = Math.min(imgHeight, Math.ceil(region.y + region.height));

  for (let py = minY; py < maxY; py++) {
    for (let px = minX; px < maxX; px++) {
      if (!isInsideRegion(px, py, region)) continue;
      const idx = (py * imgWidth + px) * 4;
      data[idx] = color[0];
      data[idx + 1] = color[1];
      data[idx + 2] = color[2];
      data[idx + 3] = 255;
    }
  }
}
