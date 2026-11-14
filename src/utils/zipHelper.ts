/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import JSZip from 'jszip';

export interface ZipInputEntry {
  path: string;
  data: Uint8Array | ArrayBuffer | Blob | File | string;
}

export interface ZipEntryInfo {
  path: string;
  name: string;
  uncompressedSize: number;
  compressedSize: number;
  date: Date;
}

export interface ZipInspectionResult {
  entries: ZipEntryInfo[];
  totalUncompressedSize: number;
  totalCompressedSize: number;
}

/**
 * Prevents Zip-Slip directory traversal by removing leading slashes, Windows backslashes,
 * and relative `..` path segments.
 */
export function sanitizeArchivePath(rawPath: string): string {
  const normalized = rawPath.replace(/\\/g, '/').replace(/^\/+/, '');
  const parts = normalized
    .split('/')
    .map((p) => p.trim())
    .filter((p) => p && p !== '.' && p !== '..');
  return parts.join('/') || 'unnamed_file';
}

export async function createZipFromEntries(
  entries: ZipInputEntry[],
  options: { compressionLevel?: number; onProgress?: (percent: number) => void } = {}
): Promise<Uint8Array> {
  if (!entries || entries.length === 0) {
    throw new Error('Please add at least one file to create a ZIP archive.');
  }

  const level = Math.max(0, Math.min(9, options.compressionLevel ?? 6));
  const zip = new JSZip();

  for (const entry of entries) {
    const safePath = sanitizeArchivePath(entry.path);
    zip.file(safePath, entry.data);
  }

  return await zip.generateAsync(
    {
      type: 'uint8array',
      compression: level === 0 ? 'STORE' : 'DEFLATE',
      compressionOptions: { level },
    },
    (meta) => {
      options.onProgress?.(Math.round(meta.percent));
    }
  );
}

export async function inspectZipArchiveBytes(
  zipData: Uint8Array | ArrayBuffer | Blob
): Promise<ZipInspectionResult> {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(zipData);
  } catch {
    throw new Error('Could not open ZIP archive. The file may be corrupted or not a valid .zip.');
  }

  const entries: ZipEntryInfo[] = [];
  let totalUncompressedSize = 0;
  let totalCompressedSize = 0;

  zip.forEach((relativePath, file) => {
    if (file.dir) return;
    const internalData = (file as any)._data || {};
    const uncompressedSize = Number(internalData.uncompressedSize) || 0;
    const compressedSize = Number(internalData.compressedSize) || 0;
    const cleanPath = sanitizeArchivePath(relativePath);
    const name = cleanPath.split('/').pop() || cleanPath;

    entries.push({
      path: cleanPath,
      name,
      uncompressedSize,
      compressedSize,
      date: file.date || new Date(),
    });

    totalUncompressedSize += uncompressedSize;
    totalCompressedSize += compressedSize;
  });

  // Sort alphabetically
  entries.sort((a, b) => a.path.localeCompare(b.path));

  return {
    entries,
    totalUncompressedSize,
    totalCompressedSize,
  };
}

export async function extractSingleZipEntry(
  zipData: Uint8Array | ArrayBuffer | Blob,
  targetPath: string
): Promise<Uint8Array> {
  const zip = await JSZip.loadAsync(zipData);
  const entry =
    zip.file(targetPath) ||
    Object.values(zip.files).find(
      (f) => !f.dir && sanitizeArchivePath(f.name) === sanitizeArchivePath(targetPath)
    );

  if (!entry || entry.dir) {
    throw new Error(`File "${targetPath}" was not found inside the ZIP archive.`);
  }

  return await entry.async('uint8array');
}
