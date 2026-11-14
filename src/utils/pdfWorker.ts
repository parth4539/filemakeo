/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import './polyfills';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

// Initialize PDF.js worker using bundler-safe URL with fallback
if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
  } catch {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/legacy/build/pdf.worker.min.mjs`;
  }
}

export { pdfjsLib };
