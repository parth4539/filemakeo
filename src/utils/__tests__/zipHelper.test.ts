/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  createZipFromEntries,
  inspectZipArchiveBytes,
  extractSingleZipEntry,
  sanitizeArchivePath,
} from '../zipHelper';

describe('zipHelper', () => {
  it('sanitizes unsafe zip paths against directory traversal', () => {
    expect(sanitizeArchivePath('../../etc/passwd')).toBe('etc/passwd');
    expect(sanitizeArchivePath('/abs/path/doc.pdf')).toBe('abs/path/doc.pdf');
    expect(sanitizeArchivePath('folder\\sub\\file.txt')).toBe('folder/sub/file.txt');
  });

  it('creates a ZIP archive, inspects entries, and extracts exact bytes', async () => {
    const textBytes = new TextEncoder().encode('Hello from fileMakeR ZIP Studio! '.repeat(20));
    const binBytes = new Uint8Array([0, 1, 2, 255, 128, 64, 32, 16]);

    const zipBytes = await createZipFromEntries(
      [
        { path: 'notes/readme.txt', data: textBytes },
        { path: 'data/sample.bin', data: binBytes },
      ],
      { compressionLevel: 9 }
    );

    expect(zipBytes.byteLength).toBeGreaterThan(30);

    const inspection = await inspectZipArchiveBytes(zipBytes);
    expect(inspection.entries.length).toBe(2);
    expect(inspection.totalUncompressedSize).toBe(textBytes.byteLength + binBytes.byteLength);

    const readmeEntry = inspection.entries.find((e) => e.path === 'notes/readme.txt');
    const binEntry = inspection.entries.find((e) => e.path === 'data/sample.bin');
    expect(readmeEntry).toBeDefined();
    expect(binEntry).toBeDefined();

    const extractedText = await extractSingleZipEntry(zipBytes, 'notes/readme.txt');
    expect(new TextDecoder().decode(extractedText)).toBe(new TextDecoder().decode(textBytes));

    const extractedBin = await extractSingleZipEntry(zipBytes, 'data/sample.bin');
    expect(Array.from(extractedBin)).toEqual(Array.from(binBytes));
  });

  it('throws clear error on corrupt or empty archive bytes', async () => {
    await expect(inspectZipArchiveBytes(new Uint8Array([1, 2, 3, 4]))).rejects.toThrow();
    await expect(createZipFromEntries([])).rejects.toThrow(/at least one file/i);
  });
});
