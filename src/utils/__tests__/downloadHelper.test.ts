/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { formatBrandedFilename } from '../downloadHelper';

describe('formatBrandedFilename', () => {
  it('prefixes standard PDF and image filenames with fileMakeR_', () => {
    expect(formatBrandedFilename('merged.pdf')).toBe('fileMakeR_merged.pdf');
    expect(formatBrandedFilename('vacation_photo.jpg')).toBe('fileMakeR_vacation_photo.jpg');
    expect(formatBrandedFilename('converted_files.zip')).toBe('fileMakeR_converted_files.zip');
  });

  it('does not double-prefix filenames that already contain fileMakeR', () => {
    expect(formatBrandedFilename('fileMakeR_merged.pdf')).toBe('fileMakeR_merged.pdf');
    expect(formatBrandedFilename('filemaker_export.png')).toBe('filemaker_export.png');
    expect(formatBrandedFilename('My_fileMakeR_archive.zip')).toBe('My_fileMakeR_archive.zip');
  });

  it('strips directory path prefixes and normalizes slashes safely', () => {
    expect(formatBrandedFilename('C:\\fakepath\\resume.pdf')).toBe('fileMakeR_resume.pdf');
    expect(formatBrandedFilename('folder/subfolder/diagram.png')).toBe('fileMakeR_diagram.png');
  });

  it('handles empty, whitespace, or dot-only names safely', () => {
    expect(formatBrandedFilename('')).toBe('fileMakeR_download');
    expect(formatBrandedFilename('   ')).toBe('fileMakeR_download');
    expect(formatBrandedFilename('.pdf')).toBe('fileMakeR_file.pdf');
  });

  it('sanitizes trailing whitespace while preserving extension case', () => {
    expect(formatBrandedFilename('  report final.PDF  ')).toBe('fileMakeR_report final.PDF');
  });
});
