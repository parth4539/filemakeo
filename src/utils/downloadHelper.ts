/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import JSZip from 'jszip';
import confetti from 'canvas-confetti';

const activeObjectUrls = new Set<string>();

export function registerObjectUrl(url: string): string {
  activeObjectUrls.add(url);
  return url;
}

export function revokeObjectUrl(url: string): void {
  if (url && activeObjectUrls.has(url)) {
    URL.revokeObjectURL(url);
    activeObjectUrls.delete(url);
  }
}

export function revokeAllObjectUrls(): void {
  for (const url of activeObjectUrls) {
    URL.revokeObjectURL(url);
  }
  activeObjectUrls.clear();
}

export function formatBrandedFilename(filename: string): string {
  const normalized = (filename || '').trim().replace(/\\/g, '/');
  const baseOnly = normalized.split('/').pop()?.trim() || '';
  if (!baseOnly) return 'fileMakeR_download';

  const finalName = baseOnly.startsWith('.') ? `file${baseOnly}` : baseOnly;
  if (/filemaker/i.test(finalName)) {
    return finalName;
  }
  return `fileMakeR_${finalName}`;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const brandedName = formatBrandedFilename(filename);
  const url = URL.createObjectURL(blob);
  registerObjectUrl(url);

  const a = document.createElement('a');
  a.href = url;
  a.download = brandedName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  // Trigger celebration confetti
  try {
    confetti({
      particleCount: 45,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#3b82f6', '#10b981', '#6366f1'],
    });
  } catch {
    // ignore if canvas-confetti fails in restricted environments
  }

  // Revoke after a brief delay so the browser can finish initiating the download stream
  setTimeout(() => {
    revokeObjectUrl(url);
  }, 4000);
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const brandedName = formatBrandedFilename(filename);
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = brandedName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  try {
    confetti({
      particleCount: 45,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#3b82f6', '#10b981', '#6366f1'],
    });
  } catch {
    // ignore
  }
}

export async function createZipBlob(
  files: { name: string; blob: Blob }[],
  onProgress?: (percent: number) => void
): Promise<Blob> {
  const zip = new JSZip();

  for (const file of files) {
    zip.file(file.name, file.blob);
  }

  return await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    },
    (metadata) => {
      if (onProgress) {
        onProgress(Math.round(metadata.percent));
      }
    }
  );
}
