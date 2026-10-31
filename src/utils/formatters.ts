/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 B';
  if (!bytes || isNaN(bytes) || bytes < 0) return '0 B';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const clampedIndex = Math.min(i, sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, clampedIndex)).toFixed(dm))} ${sizes[clampedIndex]}`;
}

export function calculateSavings(original: number, current: number): {
  savedBytes: number;
  percent: number;
  isSmaller: boolean;
} {
  if (!original || original <= 0) {
    return { savedBytes: 0, percent: 0, isSmaller: false };
  }
  const diff = original - current;
  const percent = Math.round((diff / original) * 100);
  return {
    savedBytes: Math.abs(diff),
    percent: Math.abs(percent),
    isSmaller: diff > 0,
  };
}

export function parsePageRanges(rangesStr: string, totalPages: number): number[] {
  // e.g. "1-3, 5, 7-9" -> [1, 2, 3, 5, 7, 8, 9] (1-indexed)
  const pagesSet = new Set<number>();
  const clean = rangesStr.replace(/\s+/g, '');
  if (!clean) return [];

  const parts = clean.split(',');
  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end)) {
        const from = Math.max(1, Math.min(start, end));
        const to = Math.min(totalPages, Math.max(start, end));
        for (let i = from; i <= to; i++) {
          pagesSet.add(i);
        }
      }
    } else {
      const p = parseInt(part, 10);
      if (!isNaN(p) && p >= 1 && p <= totalPages) {
        pagesSet.add(p);
      }
    }
  }

  return Array.from(pagesSet).sort((a, b) => a - b);
}
