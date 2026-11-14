/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Ensure Promise.try is available in Node <23 and Safari <18.2 (used by pdfjs-dist v6+)
if (typeof (Promise as any).try !== 'function') {
  (Promise as any).try = function <T>(
    fn: (...args: any[]) => T | PromiseLike<T>,
    ...args: any[]
  ): Promise<T> {
    return new Promise((resolve) => {
      resolve(fn(...args));
    });
  };
}

// Ensure Math.sumPrecise is available in Node <24 and browsers pre-Chrome 133 (used by pdfjs-dist v6+)
if (typeof (Math as any).sumPrecise !== 'function') {
  (Math as any).sumPrecise = function (items: Iterable<number>): number {
    let total = 0;
    for (const val of items) {
      total += Number(val);
    }
    return total;
  };
}
