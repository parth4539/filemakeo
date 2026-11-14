/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { PDFDocument } from '@cantoo/pdf-lib';
import {
  protectPdfBytes,
  unlockPdfBytes,
  readPdfMetadataFromBytes,
  updatePdfMetadataBytes,
  signPdfBytes,
  isPdfEncryptedBytes,
} from '../pdfSecurityHelper';

async function createSamplePdfBytes(pageCount = 2, title?: string): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    const page = doc.addPage([400, 600]);
    page.drawText(`Sample Page ${i + 1}`, { x: 50, y: 500, size: 18 });
  }
  if (title) doc.setTitle(title);
  doc.setAuthor('Initial Author');
  return await doc.save();
}

// 1x1 solid blue RGBA PNG bytes
const SAMPLE_PNG_BYTES = Uint8Array.from(
  Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVQIW2NkYPj/n4EBFTAyMAAAFxAEAQV8d5wAAAAASUVORK5CYII=',
    'base64'
  )
);

describe('pdfSecurityHelper (Protect, Unlock, Metadata, Sign)', () => {
  describe('protectPdfBytes & unlockPdfBytes', () => {
    it('encrypts a PDF with user password so unauthenticated load fails', async () => {
      const srcBytes = await createSamplePdfBytes(2, 'Secret Report');
      const encrypted = await protectPdfBytes(srcBytes, {
        userPassword: 'open123',
        ownerPassword: 'admin456',
        permissions: { printing: 'highResolution', copying: false, modifying: false },
      });

      expect(encrypted.byteLength).toBeGreaterThan(100);
      expect(await isPdfEncryptedBytes(encrypted)).toBe(true);

      // Loading without password should reject
      await expect(PDFDocument.load(encrypted)).rejects.toThrow();

      // Loading with wrong password should reject
      await expect(PDFDocument.load(encrypted, { password: 'wrong' })).rejects.toThrow();

      // Loading with user password succeeds and preserves page count
      const opened = await PDFDocument.load(encrypted, { password: 'open123' });
      expect(opened.getPageCount()).toBe(2);
    });

    it('rejects empty user password when protecting', async () => {
      const srcBytes = await createSamplePdfBytes(1);
      await expect(
        protectPdfBytes(srcBytes, { userPassword: '   ' })
      ).rejects.toThrow(/password/i);
    });

    it('unlocks an encrypted PDF into a genuinely unencrypted copy preserving pages and metadata', async () => {
      const srcBytes = await createSamplePdfBytes(3, 'Confidential Contract');
      const encrypted = await protectPdfBytes(srcBytes, {
        userPassword: 'pass!2026',
        ownerPassword: 'owner!2026',
      });

      const { bytes: unlocked, pageCount, wasEncrypted } = await unlockPdfBytes(
        encrypted,
        'pass!2026'
      );

      expect(wasEncrypted).toBe(true);
      expect(pageCount).toBe(3);

      // Must open with ZERO password!
      expect(await isPdfEncryptedBytes(unlocked)).toBe(false);
      const reloaded = await PDFDocument.load(unlocked);
      expect(reloaded.getPageCount()).toBe(3);
      expect(reloaded.getTitle()).toBe('Confidential Contract');
    });

    it('throws a clear friendly error on incorrect password during unlock', async () => {
      const srcBytes = await createSamplePdfBytes(1);
      const encrypted = await protectPdfBytes(srcBytes, { userPassword: 'correct' });

      await expect(unlockPdfBytes(encrypted, 'wrong-pass')).rejects.toThrow(
        /incorrect password/i
      );
    });

    it('handles already-unencrypted PDF gracefully during unlock', async () => {
      const srcBytes = await createSamplePdfBytes(2, 'Open File');
      const res = await unlockPdfBytes(srcBytes, '');
      expect(res.wasEncrypted).toBe(false);
      expect(res.pageCount).toBe(2);
      const doc = await PDFDocument.load(res.bytes);
      expect(doc.getTitle()).toBe('Open File');
    });
  });

  describe('readPdfMetadataFromBytes & updatePdfMetadataBytes', () => {
    it('reads, updates, and strips PDF metadata fields cleanly', async () => {
      const srcBytes = await createSamplePdfBytes(1, 'Old Title');
      const initial = await readPdfMetadataFromBytes(srcBytes);
      expect(initial.pageCount).toBe(1);
      expect(initial.title).toBe('Old Title');
      expect(initial.author).toBe('Initial Author');

      const updatedBytes = await updatePdfMetadataBytes(srcBytes, {
        title: 'Annual Financial Summary',
        author: 'Parth Prajapati',
        subject: 'Q4 Audit',
        keywords: ['finance', 'audit', '2026'],
        creator: 'fileMakeR Studio',
        producer: 'fileMakeR Client Engine',
      });

      const updatedMeta = await readPdfMetadataFromBytes(updatedBytes);
      expect(updatedMeta.title).toBe('Annual Financial Summary');
      expect(updatedMeta.author).toBe('Parth Prajapati');
      expect(updatedMeta.subject).toBe('Q4 Audit');
      expect(updatedMeta.keywords).toEqual(['finance', 'audit', '2026']);
      expect(updatedMeta.creator).toBe('fileMakeR Studio');
      expect(updatedMeta.producer).toBe('fileMakeR Client Engine');

      // Strip all metadata cleanly
      const strippedBytes = await updatePdfMetadataBytes(updatedBytes, {
        title: '',
        author: '',
        subject: '',
        keywords: [],
        creator: '',
        producer: '',
      });

      const strippedMeta = await readPdfMetadataFromBytes(strippedBytes);
      expect(strippedMeta.title).toBe('');
      expect(strippedMeta.author).toBe('');
      expect(strippedMeta.subject).toBe('');
      expect(strippedMeta.keywords).toEqual([]);
      expect(strippedMeta.creator).toBe('');
      expect(strippedMeta.producer).toBe('');
    });
  });

  describe('signPdfBytes', () => {
    it('places a PNG signature onto targeted pages without changing page count', async () => {
      const srcBytes = await createSamplePdfBytes(3);
      const signedBytes = await signPdfBytes(srcBytes, SAMPLE_PNG_BYTES, [
        {
          pageNumber: 1,
          xPercent: 0.6,
          yPercent: 0.75,
          widthPercent: 0.25,
          heightPercent: 0.1,
        },
        {
          pageNumber: 3,
          xPercent: 0.1,
          yPercent: 0.8,
          widthPercent: 0.2,
          heightPercent: 0.08,
        },
      ]);

      expect(signedBytes.byteLength).toBeGreaterThan(srcBytes.byteLength);
      const reloaded = await PDFDocument.load(signedBytes);
      expect(reloaded.getPageCount()).toBe(3);
    });

    it('rejects empty placements or invalid page numbers', async () => {
      const srcBytes = await createSamplePdfBytes(2);
      await expect(signPdfBytes(srcBytes, SAMPLE_PNG_BYTES, [])).rejects.toThrow();
      await expect(
        signPdfBytes(srcBytes, SAMPLE_PNG_BYTES, [
          { pageNumber: 5, xPercent: 0.5, yPercent: 0.5, widthPercent: 0.2, heightPercent: 0.1 },
        ])
      ).rejects.toThrow();
    });
  });
});
