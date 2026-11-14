/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  computeRotatedBoundingBox,
  computeWatermarkPositions,
  pixelateRgbaBuffer,
  blurRgbaBuffer,
  blackoutRgbaBuffer,
} from '../imageProcessingMath';

describe('imageProcessingMath', () => {
  it('computes exact rotated bounding box dimensions for 0, 90, 180, 270, and 45 degrees', () => {
    expect(computeRotatedBoundingBox(200, 100, 0)).toEqual({ width: 200, height: 100 });
    expect(computeRotatedBoundingBox(200, 100, 90)).toEqual({ width: 100, height: 200 });
    expect(computeRotatedBoundingBox(200, 100, 180)).toEqual({ width: 200, height: 100 });
    expect(computeRotatedBoundingBox(200, 100, 270)).toEqual({ width: 100, height: 200 });

    const rot45 = computeRotatedBoundingBox(100, 100, 45);
    expect(rot45.width).toBe(141);
    expect(rot45.height).toBe(141);
  });

  it('computes watermark placement coordinates for corners, center, and tiled grid', () => {
    const center = computeWatermarkPositions(1000, 800, 200, 50, 'center', 40);
    expect(center).toEqual([{ x: 400, y: 375 }]);

    const br = computeWatermarkPositions(1000, 800, 200, 50, 'bottom-right', 40);
    expect(br).toEqual([{ x: 760, y: 710 }]);

    const tiled = computeWatermarkPositions(1000, 800, 200, 50, 'tiled', 40);
    expect(tiled.length).toBeGreaterThanOrEqual(4);
  });

  it('pixelates target rectangle pixels while leaving surrounding pixels completely untouched', () => {
    // 4x4 RGBA image: left half red (255,0,0,255), right half blue (0,0,255,255), bottom-right green
    const width = 4;
    const height = 4;
    const data = new Uint8ClampedArray(width * height * 4);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        data[idx] = x === 0 ? 255 : 0;
        data[idx + 1] = y === 3 && x === 3 ? 200 : 0;
        data[idx + 2] = x === 1 ? 255 : 0;
        data[idx + 3] = 255;
      }
    }

    // Snapshot corner pixel outside target region (3,3)
    const outsideBefore = Array.from(data.slice((3 * 4 + 3) * 4, (3 * 4 + 3) * 4 + 4));

    pixelateRgbaBuffer(data, width, height, { x: 0, y: 0, width: 2, height: 2, shape: 'rect' }, 2);

    // Target 2x2 block should be averaged (127/128 red, 0 green, 127/128 blue)
    expect(data[0]).toBeGreaterThan(120);
    expect(data[0]).toBeLessThan(135);
    expect(data[2]).toBeGreaterThan(120);
    expect(data[2]).toBeLessThan(135);

    // Pixel at (1,1) should match pixel at (0,0) in the same 2x2 block
    const idx11 = (1 * 4 + 1) * 4;
    expect(data[idx11]).toBe(data[0]);
    expect(data[idx11 + 2]).toBe(data[2]);

    // Outside pixel (3,3) must remain 100% untouched
    const outsideAfter = Array.from(data.slice((3 * 4 + 3) * 4, (3 * 4 + 3) * 4 + 4));
    expect(outsideAfter).toEqual(outsideBefore);
  });

  it('blurs target rectangle without modifying external pixels', () => {
    const width = 6;
    const height = 6;
    const data = new Uint8ClampedArray(width * height * 4);
    // White pixel at (2,2), black elsewhere, bright green marker at outside (5,5)
    const centerIdx = (2 * width + 2) * 4;
    data[centerIdx] = 255;
    data[centerIdx + 1] = 255;
    data[centerIdx + 2] = 255;
    data[centerIdx + 3] = 255;

    const markerIdx = (5 * width + 5) * 4;
    data[markerIdx + 1] = 222;
    data[markerIdx + 3] = 255;

    blurRgbaBuffer(data, width, height, { x: 1, y: 1, width: 3, height: 3, shape: 'rect' }, 2);

    // White spike at (2,2) must be smoothed/attenuated and spread to neighbor (2,1)
    expect(data[centerIdx]).toBeLessThan(200);
    expect(data[(1 * width + 2) * 4]).toBeGreaterThan(0);

    // Marker at (5,5) untouched
    expect(data[markerIdx + 1]).toBe(222);
  });

  it('blacks out rectangle or ellipse region accurately', () => {
    const width = 4;
    const height = 4;
    const data = new Uint8ClampedArray(width * height * 4).fill(255);

    blackoutRgbaBuffer(data, width, height, { x: 1, y: 1, width: 2, height: 2, shape: 'rect' });

    // (1,1) is blacked out
    const insideIdx = (1 * 4 + 1) * 4;
    expect(data[insideIdx]).toBe(0);
    expect(data[insideIdx + 1]).toBe(0);
    expect(data[insideIdx + 2]).toBe(0);

    // (0,0) remains white
    expect(data[0]).toBe(255);
  });
});
