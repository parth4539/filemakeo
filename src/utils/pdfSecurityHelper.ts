/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PDFDocument } from '@cantoo/pdf-lib';
import { pdfjsLib } from './pdfWorker';

export interface PdfProtectOptions {
  userPassword: string;
  ownerPassword?: string;
  permissions?: {
    printing?: 'highResolution' | 'lowResolution' | false;
    modifying?: boolean;
    copying?: boolean;
    annotating?: boolean;
    fillingForms?: boolean;
    contentAccessibility?: boolean;
    documentAssembly?: boolean;
  };
}

export interface PdfMetadataValues {
  title: string;
  author: string;
  subject: string;
  keywords: string[];
  creator: string;
  producer: string;
  pageCount?: number;
  creationDate?: string;
  modificationDate?: string;
}

export interface SignaturePlacement {
  pageNumber: number; // 1-indexed
  xPercent: number; // 0..1 from left edge
  yPercent: number; // 0..1 from top edge
  widthPercent: number; // 0..1 of page width
  heightPercent: number; // 0..1 of page height
}

/**
 * Checks whether a PDF byte buffer is password-protected / encrypted.
 */
export async function isPdfEncryptedBytes(pdfBytes: Uint8Array | ArrayBuffer): Promise<boolean> {
  try {
    const doc = await PDFDocument.load(pdfBytes);
    return doc.isEncrypted;
  } catch (err: any) {
    const msg = String(err?.message || err || '').toLowerCase();
    if (msg.includes('encrypt') || msg.includes('password')) {
      return true;
    }
    throw new Error('Could not parse the PDF file. The file may be corrupted.');
  }
}

export async function isPdfEncryptedFile(file: File): Promise<boolean> {
  const buf = await file.arrayBuffer();
  return isPdfEncryptedBytes(buf);
}

/**
 * Encrypts a PDF with a user password (required) and optional owner password & permissions.
 */
export async function protectPdfBytes(
  pdfBytes: Uint8Array | ArrayBuffer,
  options: PdfProtectOptions
): Promise<Uint8Array> {
  const userPassword = options.userPassword?.trim();
  if (!userPassword) {
    throw new Error('Please provide a non-empty password to protect the PDF.');
  }

  let pdfDoc: PDFDocument;
  try {
    pdfDoc = await PDFDocument.load(pdfBytes, { updateMetadata: false });
  } catch (err: any) {
    const msg = String(err?.message || err || '').toLowerCase();
    if (msg.includes('encrypt') || msg.includes('password')) {
      throw new Error('This PDF is already password-protected. Please unlock it first before setting a new password.');
    }
    throw new Error('Could not load PDF document. Please check that the file is a valid PDF.');
  }

  const ownerPassword = options.ownerPassword?.trim() || userPassword;
  const perms = options.permissions || {};

  await pdfDoc.encrypt({
    userPassword,
    ownerPassword,
    permissions: {
      printing: perms.printing === false ? undefined : perms.printing || 'highResolution',
      modifying: perms.modifying ?? false,
      copying: perms.copying ?? false,
      annotating: perms.annotating ?? true,
      fillingForms: perms.fillingForms ?? true,
      contentAccessibility: perms.contentAccessibility ?? true,
      documentAssembly: perms.documentAssembly ?? false,
    },
  });

  return await pdfDoc.save();
}

export async function protectPdf(file: File, options: PdfProtectOptions): Promise<Uint8Array> {
  const buf = await file.arrayBuffer();
  return protectPdfBytes(buf, options);
}

/**
 * Unlocks/decrypts an encrypted PDF using the provided password by cloning pages
 * and document metadata into a clean, unencrypted PDFDocument.
 */
export async function unlockPdfBytes(
  pdfBytes: Uint8Array | ArrayBuffer,
  password: string
): Promise<{ bytes: Uint8Array; pageCount: number; wasEncrypted: boolean }> {
  let isEncrypted = false;
  try {
    const testDoc = await PDFDocument.load(pdfBytes);
    isEncrypted = testDoc.isEncrypted;
    if (!isEncrypted) {
      return {
        bytes: await testDoc.save(),
        pageCount: testDoc.getPageCount(),
        wasEncrypted: false,
      };
    }
  } catch (err: any) {
    const msg = String(err?.message || err || '').toLowerCase();
    if (msg.includes('encrypt') || msg.includes('password')) {
      isEncrypted = true;
    } else {
      throw new Error('Could not read PDF. The file appears corrupted or invalid.');
    }
  }

  let loadedDoc: PDFDocument;
  try {
    loadedDoc = await PDFDocument.load(pdfBytes, { password });
  } catch (err: any) {
    const msg = String(err?.message || err || '').toLowerCase();
    if (msg.includes('password') || msg.includes('incorrect') || msg.includes('decrypt')) {
      throw new Error('Incorrect password. Please verify the PDF password and try again.');
    }
    if (msg.includes('algorithm') || msg.includes('aes-256') || msg.includes('unsupported')) {
      throw new Error(
        'This PDF uses an unsupported encryption revision or requires a different owner key.'
      );
    }
    throw new Error('Incorrect password or unsupported PDF encryption.');
  }

  const unlockedDoc = await PDFDocument.create({ updateMetadata: false });
  const pageIndices = loadedDoc.getPageIndices();
  const copiedPages = await unlockedDoc.copyPages(loadedDoc, pageIndices);
  for (const page of copiedPages) {
    unlockedDoc.addPage(page);
  }

  // Safely copy metadata (falling back to pdfjsLib when encrypted Info dictionary strings aren't decoded by pdf-lib)
  try {
    let title = loadedDoc.getTitle();
    let author = loadedDoc.getAuthor();
    let subject = loadedDoc.getSubject();
    let keywords = loadedDoc.getKeywords();
    let creator = loadedDoc.getCreator();
    let producer = loadedDoc.getProducer();

    if (!title && !author && !subject && !keywords) {
      try {
        const rawCopy =
          pdfBytes instanceof Uint8Array
            ? new Uint8Array(pdfBytes)
            : new Uint8Array(pdfBytes.slice(0));
        const pjDoc = await pdfjsLib.getDocument({
          data: rawCopy,
          password,
          verbosity: 0,
        }).promise;
        const pjMeta = await pjDoc.getMetadata();
        const info = (pjMeta?.info || {}) as Record<string, any>;
        if (typeof info.Title === 'string' && info.Title) title = info.Title;
        if (typeof info.Author === 'string' && info.Author) author = info.Author;
        if (typeof info.Subject === 'string' && info.Subject) subject = info.Subject;
        if (typeof info.Keywords === 'string' && info.Keywords) keywords = info.Keywords;
        if (typeof info.Creator === 'string' && info.Creator) creator = info.Creator;
        if (typeof info.Producer === 'string' && info.Producer) producer = info.Producer;
      } catch {
        // Optional fallback failed; continue gracefully
      }
    }

    if (title) unlockedDoc.setTitle(title);
    if (author) unlockedDoc.setAuthor(author);
    if (subject) unlockedDoc.setSubject(subject);
    if (keywords) {
      const splitTokens = /[,;]/.test(keywords) ? keywords.split(/[,;]/) : keywords.split(/\s+/);
      unlockedDoc.setKeywords([
        splitTokens
          .map((k) => k.trim())
          .filter(Boolean)
          .join(', '),
      ]);
    }
    if (creator) unlockedDoc.setCreator(creator);
    if (producer) unlockedDoc.setProducer(producer);
  } catch {
    // Ignore optional metadata copy failures
  }

  return {
    bytes: await unlockedDoc.save(),
    pageCount: unlockedDoc.getPageCount(),
    wasEncrypted: isEncrypted,
  };
}

export async function unlockPdf(
  file: File,
  password: string
): Promise<{ bytes: Uint8Array; pageCount: number; wasEncrypted: boolean }> {
  const buf = await file.arrayBuffer();
  return unlockPdfBytes(buf, password);
}

/**
 * Reads standard Info dictionary metadata from a PDF.
 */
export async function readPdfMetadataFromBytes(
  pdfBytes: Uint8Array | ArrayBuffer
): Promise<PdfMetadataValues> {
  let pdfDoc: PDFDocument;
  try {
    pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true, updateMetadata: false });
  } catch {
    throw new Error('Could not read metadata from this PDF.');
  }

  const rawKeywords = pdfDoc.getKeywords() || '';
  const keywords = (/[,;]/.test(rawKeywords)
    ? rawKeywords.split(/[,;]/)
    : rawKeywords.split(/\s+/)
  )
    .map((k) => k.trim())
    .filter(Boolean);

  let creationDate: string | undefined;
  let modificationDate: string | undefined;
  try {
    creationDate = pdfDoc.getCreationDate()?.toISOString();
    modificationDate = pdfDoc.getModificationDate()?.toISOString();
  } catch {
    // ignore invalid dates
  }

  return {
    title: pdfDoc.getTitle() || '',
    author: pdfDoc.getAuthor() || '',
    subject: pdfDoc.getSubject() || '',
    keywords,
    creator: pdfDoc.getCreator() || '',
    producer: pdfDoc.getProducer() || '',
    pageCount: pdfDoc.getPageCount(),
    creationDate,
    modificationDate,
  };
}

export async function readPdfMetadata(file: File): Promise<PdfMetadataValues> {
  const buf = await file.arrayBuffer();
  return readPdfMetadataFromBytes(buf);
}

/**
 * Updates (or clears when empty strings / []) PDF document metadata fields.
 */
export async function updatePdfMetadataBytes(
  pdfBytes: Uint8Array | ArrayBuffer,
  metadata: PdfMetadataValues
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true, updateMetadata: false });

  pdfDoc.setTitle(metadata.title || '');
  pdfDoc.setAuthor(metadata.author || '');
  pdfDoc.setSubject(metadata.subject || '');
  pdfDoc.setKeywords(
    metadata.keywords && metadata.keywords.length > 0 ? [metadata.keywords.join(', ')] : []
  );
  pdfDoc.setCreator(metadata.creator || '');
  pdfDoc.setProducer(metadata.producer || '');

  return await pdfDoc.save();
}

export async function updatePdfMetadata(
  file: File,
  metadata: PdfMetadataValues
): Promise<Uint8Array> {
  const buf = await file.arrayBuffer();
  return updatePdfMetadataBytes(buf, metadata);
}

/**
 * Embeds a transparent PNG signature image onto one or more PDF pages.
 * Coordinates are normalized relative to page top-left (xPercent, yPercent).
 */
export async function signPdfBytes(
  pdfBytes: Uint8Array | ArrayBuffer,
  signaturePngBytes: Uint8Array | ArrayBuffer,
  placements: SignaturePlacement[]
): Promise<Uint8Array> {
  if (!placements || placements.length === 0) {
    throw new Error('Please place your signature on at least one page before saving.');
  }

  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();
  const totalPages = pages.length;

  for (const p of placements) {
    if (p.pageNumber < 1 || p.pageNumber > totalPages) {
      throw new Error(`Invalid page number ${p.pageNumber}. Document has ${totalPages} pages.`);
    }
  }

  const embeddedSig = await pdfDoc.embedPng(signaturePngBytes);

  for (const placement of placements) {
    const page = pages[placement.pageNumber - 1];
    const { width: pageW, height: pageH } = page.getSize();

    const drawW = Math.max(10, placement.widthPercent * pageW);
    const drawH = Math.max(10, placement.heightPercent * pageH);
    const drawX = Math.max(0, Math.min(pageW - drawW, placement.xPercent * pageW));
    // PDF origin is bottom-left; placement.yPercent is measured from top edge
    const drawY = Math.max(
      0,
      Math.min(pageH - drawH, pageH - placement.yPercent * pageH - drawH)
    );

    page.drawImage(embeddedSig, {
      x: drawX,
      y: drawY,
      width: drawW,
      height: drawH,
    });
  }

  return await pdfDoc.save();
}

export async function signPdf(
  file: File,
  signaturePngDataUrl: string,
  placements: SignaturePlacement[]
): Promise<Uint8Array> {
  const base64Part = signaturePngDataUrl.includes(',')
    ? signaturePngDataUrl.split(',')[1]
    : signaturePngDataUrl;
  const binStr = atob(base64Part);
  const pngBytes = new Uint8Array(binStr.length);
  for (let i = 0; i < binStr.length; i++) {
    pngBytes[i] = binStr.charCodeAt(i);
  }
  const pdfBuf = await file.arrayBuffer();
  return signPdfBytes(pdfBuf, pngBytes, placements);
}
