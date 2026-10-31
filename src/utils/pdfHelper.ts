/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import { pdfjsLib } from './pdfWorker';
import { parsePageRanges } from './formatters';

export interface PageThumbnailInfo {
  pageNumber: number;
  dataUrl: string;
  width: number;
  height: number;
}

export function bytesToBlob(bytes: Uint8Array, mimeType: string = 'application/pdf'): Blob {
  return new Blob([bytes as any], { type: mimeType });
}

/**
 * Loads a PDF file into PDF.js document proxy
 */
export async function loadPdfJsDoc(fileOrBuffer: File | ArrayBuffer | Uint8Array) {
  let data: any;
  if (fileOrBuffer instanceof File) {
    data = await fileOrBuffer.arrayBuffer();
  } else if (fileOrBuffer instanceof Uint8Array) {
    data = fileOrBuffer.buffer.slice(
      fileOrBuffer.byteOffset,
      fileOrBuffer.byteOffset + fileOrBuffer.byteLength
    );
  } else {
    data = fileOrBuffer;
  }

  const loadingTask = pdfjsLib.getDocument({ data });
  return await loadingTask.promise;
}

/**
 * Renders a specific page to an HTML Canvas
 */
export async function renderPdfPageToCanvas(
  pdfDoc: any,
  pageNumber: number,
  scale: number = 1.0
): Promise<HTMLCanvasElement> {
  const page = await pdfDoc.getPage(pageNumber);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not get 2D canvas context');

  const renderContext = {
    canvasContext: ctx,
    viewport: viewport,
    canvas: canvas,
  };

  await (page.render as any)(renderContext).promise;
  return canvas;
}

/**
 * Renders a page to a JPEG/PNG Data URL
 */
export async function renderPdfPageToDataUrl(
  pdfDoc: any,
  pageNumber: number,
  scale: number = 0.5,
  quality: number = 0.8
): Promise<string> {
  const canvas = await renderPdfPageToCanvas(pdfDoc, pageNumber, scale);
  const dataUrl = canvas.toDataURL('image/jpeg', quality);
  // Release canvas dimensions to free memory
  canvas.width = 0;
  canvas.height = 0;
  return dataUrl;
}

/**
 * Generates thumbnails for a PDF file with progress callback
 */
export async function generatePdfThumbnails(
  file: File,
  maxPages: number = 100,
  onProgress?: (current: number, total: number) => void
): Promise<PageThumbnailInfo[]> {
  const pdfDoc = await loadPdfJsDoc(file);
  const totalPages = Math.min(pdfDoc.numPages, maxPages);
  const thumbnails: PageThumbnailInfo[] = [];

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdfDoc.getPage(i);
    const originalViewport = page.getViewport({ scale: 1.0 });

    // Calculate scale so thumbnail width is around 220px
    const targetWidth = 220;
    const scale = targetWidth / originalViewport.width;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    const ctx = canvas.getContext('2d');
    if (ctx) {
      await (page.render as any)({ canvasContext: ctx, viewport, canvas }).promise;
      thumbnails.push({
        pageNumber: i,
        dataUrl: canvas.toDataURL('image/jpeg', 0.75),
        width: Math.floor(viewport.width),
        height: Math.floor(viewport.height),
      });
      canvas.width = 0;
      canvas.height = 0;
    }

    if (onProgress) {
      onProgress(i, totalPages);
    }
  }

  return thumbnails;
}

/**
 * Merge multiple PDFs into one
 */
export async function mergePdfs(
  files: File[],
  onProgress?: (percent: number, msg: string) => void
): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();
  const totalFiles = files.length;

  for (let i = 0; i < totalFiles; i++) {
    const file = files[i];
    if (onProgress) {
      onProgress(
        Math.round((i / totalFiles) * 90),
        `Merging ${file.name} (${i + 1} of ${totalFiles})...`
      );
    }

    const fileBuffer = await file.arrayBuffer();
    const pdfToMerge = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
    const copiedPages = await mergedPdf.copyPages(pdfToMerge, pdfToMerge.getPageIndices());

    for (const page of copiedPages) {
      mergedPdf.addPage(page);
    }
  }

  if (onProgress) {
    onProgress(95, 'Finalizing merged document...');
  }

  return await mergedPdf.save();
}

/**
 * Split a PDF into ranges or individual pages
 */
export async function splitPdf(
  file: File,
  mode: 'range' | 'all',
  rangeString: string,
  onProgress?: (percent: number, msg: string) => void
): Promise<{ name: string; data: Uint8Array }[]> {
  const fileBuffer = await file.arrayBuffer();
  const srcPdf = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
  const totalPages = srcPdf.getPageCount();
  const baseName = file.name.replace(/\.[^/.]+$/, '');
  const results: { name: string; data: Uint8Array }[] = [];

  if (mode === 'all') {
    // Extract each page as individual PDF
    for (let i = 0; i < totalPages; i++) {
      if (onProgress) {
        onProgress(
          Math.round(((i + 1) / totalPages) * 90),
          `Extracting page ${i + 1} of ${totalPages}...`
        );
      }
      const newPdf = await PDFDocument.create();
      const [copiedPage] = await newPdf.copyPages(srcPdf, [i]);
      newPdf.addPage(copiedPage);
      const data = await newPdf.save();
      results.push({
        name: `${baseName}_page_${i + 1}.pdf`,
        data,
      });
    }
  } else {
    // Split by comma-separated ranges e.g. "1-3, 5, 7-9"
    const ranges = rangeString.split(',').map((r) => r.trim()).filter(Boolean);
    if (ranges.length === 0) {
      throw new Error('Please enter at least one page or range (e.g. 1-3, 5).');
    }

    for (let idx = 0; idx < ranges.length; idx++) {
      const rangeItem = ranges[idx];
      const pageNumbers = parsePageRanges(rangeItem, totalPages);
      if (pageNumbers.length === 0) continue;

      if (onProgress) {
        onProgress(
          Math.round(((idx + 1) / ranges.length) * 90),
          `Creating PDF for range ${rangeItem}...`
        );
      }

      const newPdf = await PDFDocument.create();
      // zero-indexed pages
      const indices = pageNumbers.map((p) => p - 1);
      const copiedPages = await newPdf.copyPages(srcPdf, indices);
      for (const page of copiedPages) {
        newPdf.addPage(page);
      }

      const data = await newPdf.save();
      results.push({
        name: `${baseName}_pages_${rangeItem.replace(/[\s/\\:]/g, '_')}.pdf`,
        data,
      });
    }
  }

  if (results.length === 0) {
    throw new Error('No valid pages found in the specified range.');
  }

  return results;
}

/**
 * Organize PDF: reorder, delete, and rotate pages
 */
export async function organizePdf(
  file: File,
  pages: { originalIndex: number; rotation: number }[],
  onProgress?: (percent: number, msg: string) => void
): Promise<Uint8Array> {
  if (pages.length === 0) {
    throw new Error('Cannot save an empty PDF. Keep at least one page.');
  }

  const fileBuffer = await file.arrayBuffer();
  const srcPdf = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
  const newPdf = await PDFDocument.create();

  const total = pages.length;
  for (let i = 0; i < total; i++) {
    if (onProgress) {
      onProgress(Math.round(((i + 1) / total) * 90), `Processing page ${i + 1} of ${total}...`);
    }

    const { originalIndex, rotation } = pages[i];
    const [copiedPage] = await newPdf.copyPages(srcPdf, [originalIndex]);

    if (rotation !== 0) {
      const currentRotation = copiedPage.getRotation().angle;
      copiedPage.setRotation(degrees((currentRotation + rotation) % 360));
    }

    newPdf.addPage(copiedPage);
  }

  return await newPdf.save();
}

/**
 * Rotate PDF pages by angle (90, 180, 270)
 */
export async function rotatePdf(
  file: File,
  rotationDegrees: number,
  selectedPages?: number[], // 1-indexed, if omitted rotates all
  onProgress?: (percent: number, msg: string) => void
): Promise<Uint8Array> {
  const fileBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();
  const total = pages.length;

  for (let i = 0; i < total; i++) {
    const pageNum = i + 1;
    if (!selectedPages || selectedPages.includes(pageNum)) {
      const current = pages[i].getRotation().angle;
      pages[i].setRotation(degrees((current + rotationDegrees) % 360));
    }

    if (onProgress) {
      onProgress(Math.round(((i + 1) / total) * 90), `Rotating page ${pageNum}...`);
    }
  }

  return await pdfDoc.save();
}

/**
 * Compress PDF: Renders pages with pdf.js to JPEG at controlled scale and rebuilds with pdf-lib
 */
export async function compressPdf(
  file: File,
  level: 'low' | 'medium' | 'high',
  onProgress?: (percent: number, msg: string) => void
): Promise<Uint8Array> {
  const pdfDoc = await loadPdfJsDoc(file);
  const totalPages = pdfDoc.numPages;

  // Settings per level
  const settings = {
    low: { scale: 1.5, quality: 0.82 },
    medium: { scale: 1.2, quality: 0.68 },
    high: { scale: 0.95, quality: 0.48 },
  }[level];

  const compressedDoc = await PDFDocument.create();

  for (let i = 1; i <= totalPages; i++) {
    if (onProgress) {
      onProgress(
        Math.round(((i - 0.5) / totalPages) * 90),
        `Rendering & compressing page ${i} of ${totalPages}...`
      );
    }

    const page = await pdfDoc.getPage(i);
    const origViewport = page.getViewport({ scale: 1.0 });
    const renderViewport = page.getViewport({ scale: settings.scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(renderViewport.width);
    canvas.height = Math.floor(renderViewport.height);

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not create canvas context');

    await (page.render as any)({ canvasContext: ctx, viewport: renderViewport, canvas }).promise;

    // Convert to JPEG blob
    const imgDataUrl = canvas.toDataURL('image/jpeg', settings.quality);
    canvas.width = 0;
    canvas.height = 0;

    const imgBytes = await fetch(imgDataUrl).then((res) => res.arrayBuffer());
    const embeddedImg = await compressedDoc.embedJpg(imgBytes);

    // Create page matching original dimensions
    const newPage = compressedDoc.addPage([origViewport.width, origViewport.height]);
    newPage.drawImage(embeddedImg, {
      x: 0,
      y: 0,
      width: origViewport.width,
      height: origViewport.height,
    });
  }

  if (onProgress) {
    onProgress(95, 'Optimizing output PDF stream...');
  }

  return await compressedDoc.save();
}

/**
 * Convert Images (JPG, PNG, WebP) to PDF
 */
export async function imagesToPdf(
  images: { file: File }[],
  options: {
    pageSize: 'A4' | 'Letter' | 'Fit';
    margin: number;
    orientation: 'portrait' | 'landscape' | 'auto';
  },
  onProgress?: (percent: number, msg: string) => void
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const total = images.length;

  // Standard dimensions in points (72 points = 1 inch)
  const pageSizes = {
    A4: { width: 595.28, height: 841.89 },
    Letter: { width: 612.0, height: 792.0 },
  };

  for (let i = 0; i < total; i++) {
    const { file } = images[i];
    if (onProgress) {
      onProgress(Math.round(((i + 1) / total) * 90), `Processing image ${i + 1} of ${total}...`);
    }

    // Read image into an HTML image element to get natural dimensions
    const objectUrl = URL.createObjectURL(file);
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = objectUrl;
    });

    const isJpeg = file.type === 'image/jpeg' || file.name.match(/\.(jpe?g)$/i);
    const isPng = file.type === 'image/png' || file.name.match(/\.png$/i);

    let embeddedImage;
    if (isJpeg) {
      const bytes = await file.arrayBuffer();
      embeddedImage = await pdfDoc.embedJpg(bytes);
    } else if (isPng) {
      const bytes = await file.arrayBuffer();
      embeddedImage = await pdfDoc.embedPng(bytes);
    } else {
      // For WebP or other formats, convert to PNG via Canvas
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);
      const pngDataUrl = canvas.toDataURL('image/png');
      const pngBytes = await fetch(pngDataUrl).then((r) => r.arrayBuffer());
      embeddedImage = await pdfDoc.embedPng(pngBytes);
      canvas.width = 0;
      canvas.height = 0;
    }

    URL.revokeObjectURL(objectUrl);

    const imgWidth = img.naturalWidth;
    const imgHeight = img.naturalHeight;

    let targetPageWidth: number;
    let targetPageHeight: number;

    if (options.pageSize === 'Fit') {
      targetPageWidth = imgWidth + options.margin * 2;
      targetPageHeight = imgHeight + options.margin * 2;
    } else {
      const standard = pageSizes[options.pageSize];
      let isLandscape = false;
      if (options.orientation === 'auto') {
        isLandscape = imgWidth > imgHeight;
      } else if (options.orientation === 'landscape') {
        isLandscape = true;
      }

      targetPageWidth = isLandscape ? standard.height : standard.width;
      targetPageHeight = isLandscape ? standard.width : standard.height;
    }

    const page = pdfDoc.addPage([targetPageWidth, targetPageHeight]);

    // Available area inside margins
    const availWidth = Math.max(1, targetPageWidth - options.margin * 2);
    const availHeight = Math.max(1, targetPageHeight - options.margin * 2);

    // Calculate scale to fit image within available area preserving aspect ratio
    const scale = Math.min(availWidth / imgWidth, availHeight / imgHeight);
    const drawWidth = imgWidth * scale;
    const drawHeight = imgHeight * scale;

    // Center image on the page
    const drawX = options.margin + (availWidth - drawWidth) / 2;
    const drawY = options.margin + (availHeight - drawHeight) / 2;

    page.drawImage(embeddedImage, {
      x: drawX,
      y: drawY,
      width: drawWidth,
      height: drawHeight,
    });
  }

  return await pdfDoc.save();
}

/**
 * Convert PDF pages to JPG or PNG images
 */
export async function pdfToImages(
  file: File,
  format: 'image/jpeg' | 'image/png' = 'image/jpeg',
  scale: number = 2.0,
  onProgress?: (percent: number, msg: string) => void
): Promise<{ name: string; blob: Blob; dataUrl: string; width: number; height: number }[]> {
  const pdfDoc = await loadPdfJsDoc(file);
  const total = pdfDoc.numPages;
  const ext = format === 'image/jpeg' ? 'jpg' : 'png';
  const baseName = file.name.replace(/\.[^/.]+$/, '');
  const images = [];

  for (let i = 1; i <= total; i++) {
    if (onProgress) {
      onProgress(Math.round(((i - 0.5) / total) * 90), `Rendering page ${i} of ${total}...`);
    }

    const page = await pdfDoc.getPage(i);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    const ctx = canvas.getContext('2d');
    if (!ctx) continue;

    // Fill white background for JPG
    if (format === 'image/jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    await (page.render as any)({ canvasContext: ctx, viewport, canvas }).promise;

    const dataUrl = canvas.toDataURL(format, 0.92);
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b || new Blob()), format, 0.92);
    });

    images.push({
      name: `${baseName}_page_${i}.${ext}`,
      blob,
      dataUrl,
      width: canvas.width,
      height: canvas.height,
    });

    canvas.width = 0;
    canvas.height = 0;
  }

  return images;
}

/**
 * Helper to parse hex color to pdf-lib rgb
 */
function hexToRgb(hex: string) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  return rgb(isNaN(r) ? 0 : r, isNaN(g) ? 0 : g, isNaN(b) ? 0 : b);
}

/**
 * Add Page Numbers to PDF
 */
export async function addPageNumbers(
  file: File,
  options: {
    position: 'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-center' | 'top-right' | 'top-left';
    startNumber: number;
    format: string; // e.g. "{n}", "Page {n}", "Page {n} of {total}"
    fontSize: number;
    margin: number;
    colorHex: string;
  },
  onProgress?: (percent: number, msg: string) => void
): Promise<Uint8Array> {
  const fileBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();
  const totalPages = pages.length;
  const textColor = hexToRgb(options.colorHex || '#1e293b');

  for (let i = 0; i < totalPages; i++) {
    if (onProgress) {
      onProgress(Math.round(((i + 1) / totalPages) * 90), `Numbering page ${i + 1} of ${totalPages}...`);
    }

    const page = pages[i];
    const { width, height } = page.getSize();
    const currentNum = options.startNumber + i;

    let text = options.format || 'Page {n}';
    text = text.replace(/\{n\}/g, currentNum.toString());
    text = text.replace(/\{total\}/g, (options.startNumber + totalPages - 1).toString());

    const textWidth = font.widthOfTextAtSize(text, options.fontSize);
    const textHeight = font.heightAtSize(options.fontSize);

    let x = 0;
    let y = 0;

    // Calculate X coordinate
    if (options.position.includes('left')) {
      x = options.margin;
    } else if (options.position.includes('right')) {
      x = width - options.margin - textWidth;
    } else {
      // Center
      x = (width - textWidth) / 2;
    }

    // Calculate Y coordinate
    if (options.position.includes('top')) {
      y = height - options.margin - textHeight;
    } else {
      // Bottom
      y = options.margin;
    }

    page.drawText(text, {
      x,
      y,
      size: options.fontSize,
      font,
      color: textColor,
    });
  }

  return await pdfDoc.save();
}

/**
 * Add Text Watermark to PDF
 */
export async function addWatermark(
  file: File,
  options: {
    text: string;
    fontSize: number;
    opacity: number; // 0.1 to 1.0
    rotation: number; // -90 to 90
    colorHex: string;
    isBehind: boolean;
  },
  onProgress?: (percent: number, msg: string) => void
): Promise<Uint8Array> {
  const fileBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pages = pdfDoc.getPages();
  const total = pages.length;
  const textColor = hexToRgb(options.colorHex || '#ef4444');

  for (let i = 0; i < total; i++) {
    if (onProgress) {
      onProgress(Math.round(((i + 1) / total) * 90), `Applying watermark on page ${i + 1}...`);
    }

    const page = pages[i];
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(options.text, options.fontSize);
    const textHeight = font.heightAtSize(options.fontSize);

    // Center calculation with rotation
    const rad = (options.rotation * Math.PI) / 180;
    const x = width / 2 - (textWidth / 2) * Math.cos(rad) + (textHeight / 2) * Math.sin(rad);
    const y = height / 2 - (textWidth / 2) * Math.sin(rad) - (textHeight / 2) * Math.cos(rad);

    page.drawText(options.text, {
      x,
      y,
      size: options.fontSize,
      font,
      color: textColor,
      opacity: options.opacity,
      rotate: degrees(options.rotation),
    });
  }

  return await pdfDoc.save();
}

/**
 * Remove pages from a PDF
 */
export async function removePages(
  file: File,
  pagesToRemove: number[], // 1-indexed
  onProgress?: (percent: number, msg: string) => void
): Promise<Uint8Array> {
  const fileBuffer = await file.arrayBuffer();
  const srcPdf = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
  const totalPages = srcPdf.getPageCount();

  const pagesToKeep = [];
  for (let i = 1; i <= totalPages; i++) {
    if (!pagesToRemove.includes(i)) {
      pagesToKeep.push(i - 1);
    }
  }

  if (pagesToKeep.length === 0) {
    throw new Error('You cannot remove all pages. At least one page must remain.');
  }

  if (onProgress) {
    onProgress(30, 'Rebuilding PDF without removed pages...');
  }

  const newPdf = await PDFDocument.create();
  const copiedPages = await newPdf.copyPages(srcPdf, pagesToKeep);

  for (let i = 0; i < copiedPages.length; i++) {
    newPdf.addPage(copiedPages[i]);
  }

  if (onProgress) {
    onProgress(90, 'Finalizing PDF...');
  }

  return await newPdf.save();
}

export type SheetSize = 'A4' | 'A3' | 'Letter' | 'Legal';
export type SheetOrientation = 'Auto' | 'Portrait' | 'Landscape';
export type PageOrder = 'ltr' | 'rtl';
export type NUpCount = 2 | 4 | 6 | 8 | 9;

export interface NUpOptions {
  pagesPerSheet: NUpCount;
  sheetSize: SheetSize;
  orientation: SheetOrientation;
  pageOrder: PageOrder;
  marginMm: number;
  gapMm: number;
  drawBorder: boolean;
}

export const SHEET_DIMENSIONS: Record<SheetSize, [number, number]> = {
  A4: [595.28, 841.89],
  A3: [841.89, 1190.55],
  Letter: [612.0, 792.0],
  Legal: [612.0, 1008.0],
};

export function getNUpGrid(
  nup: NUpCount,
  orient: SheetOrientation
): { rows: number; cols: number; isLandscape: boolean } {
  if (nup === 2) {
    if (orient === 'Portrait') return { rows: 2, cols: 1, isLandscape: false };
    return { rows: 1, cols: 2, isLandscape: true };
  }
  if (nup === 4) {
    if (orient === 'Landscape') return { rows: 2, cols: 2, isLandscape: true };
    return { rows: 2, cols: 2, isLandscape: false };
  }
  if (nup === 6) {
    if (orient === 'Portrait') return { rows: 3, cols: 2, isLandscape: false };
    return { rows: 2, cols: 3, isLandscape: true };
  }
  if (nup === 8) {
    if (orient === 'Portrait') return { rows: 4, cols: 2, isLandscape: false };
    return { rows: 2, cols: 4, isLandscape: true };
  }
  // 9
  return { rows: 3, cols: 3, isLandscape: orient === 'Landscape' };
}

/**
 * Generate N-Up PDF (multiple pages per sheet)
 */
export async function generateNUpPdf(
  fileOrBuffer: File | ArrayBuffer | Uint8Array,
  options: NUpOptions,
  onProgress?: (percent: number, msg: string) => void
): Promise<Uint8Array> {
  let fileBuffer: ArrayBuffer;
  if (fileOrBuffer instanceof File) {
    fileBuffer = await fileOrBuffer.arrayBuffer();
  } else if (fileOrBuffer instanceof Uint8Array) {
    fileBuffer = fileOrBuffer.buffer.slice(
      fileOrBuffer.byteOffset,
      fileOrBuffer.byteOffset + fileOrBuffer.byteLength
    ) as ArrayBuffer;
  } else {
    fileBuffer = fileOrBuffer;
  }

  let srcPdf: PDFDocument;
  try {
    srcPdf = await PDFDocument.load(fileBuffer);
  } catch (err: any) {
    if (err.message && (err.message.includes('encrypted') || err.message.includes('password'))) {
      throw new Error('This PDF is password-protected. Please provide an unlocked standard PDF.');
    }
    throw new Error('Could not read PDF. The file may be corrupted or in an unsupported format.');
  }

  const srcPages = srcPdf.getPages();
  const totalPages = srcPages.length;
  if (totalPages === 0) {
    throw new Error('The PDF document contains no pages.');
  }

  // Ensure any blank or uninitialized pages have a content stream so embedPages never fails
  srcPages.forEach((p) => {
    if (!p.node.Contents()) {
      p.getContentStream();
    }
  });

  if (onProgress) {
    onProgress(10, 'Embedding pages in destination document...');
  }

  const destPdf = await PDFDocument.create();
  const embeddedPages = await destPdf.embedPages(srcPages);

  const grid = getNUpGrid(options.pagesPerSheet, options.orientation);
  const baseDim = SHEET_DIMENSIONS[options.sheetSize] || SHEET_DIMENSIONS.A4;
  const sheetWidth = grid.isLandscape
    ? Math.max(baseDim[0], baseDim[1])
    : Math.min(baseDim[0], baseDim[1]);
  const sheetHeight = grid.isLandscape
    ? Math.min(baseDim[0], baseDim[1])
    : Math.max(baseDim[0], baseDim[1]);

  const MM_TO_PT = 2.83464567;
  const marginPt = Math.max(0, options.marginMm) * MM_TO_PT;
  const gapPt = Math.max(0, options.gapMm) * MM_TO_PT;

  const availW = Math.max(10, sheetWidth - 2 * marginPt - (grid.cols - 1) * gapPt);
  const availH = Math.max(10, sheetHeight - 2 * marginPt - (grid.rows - 1) * gapPt);
  const cellW = availW / grid.cols;
  const cellH = availH / grid.rows;

  const perSheet = options.pagesPerSheet;
  const totalSheets = Math.ceil(totalPages / perSheet);

  for (let s = 0; s < totalSheets; s++) {
    if (onProgress) {
      const pct = Math.round(15 + (s / totalSheets) * 75);
      onProgress(pct, `Arranging sheet ${s + 1} of ${totalSheets}...`);
    }

    const sheet = destPdf.addPage([sheetWidth, sheetHeight]);

    for (let slot = 0; slot < perSheet; slot++) {
      const pageIdx = s * perSheet + slot;
      if (pageIdx >= totalPages) break;

      const row = Math.floor(slot / grid.cols);
      const col = slot % grid.cols;
      const colIndex = options.pageOrder === 'rtl' ? grid.cols - 1 - col : col;

      const cellX = marginPt + colIndex * (cellW + gapPt);
      // PDF y=0 is bottom: row 0 is top
      const cellY = sheetHeight - marginPt - (row + 1) * cellH - row * gapPt;

      const origPage = srcPages[pageIdx];
      const origRot = (origPage.getRotation().angle % 360 + 360) % 360;
      const emb = embeddedPages[pageIdx];

      const is90or270 = origRot === 90 || origRot === 270;
      const visualW = is90or270 ? emb.height : emb.width;
      const visualH = is90or270 ? emb.width : emb.height;

      const scale = Math.min(cellW / visualW, cellH / visualH);
      const targetW = visualW * scale;
      const targetH = visualH * scale;

      const offsetX = cellX + (cellW - targetW) / 2;
      const offsetY = cellY + (cellH - targetH) / 2;

      const drawW = emb.width * scale;
      const drawH = emb.height * scale;

      let drawX = offsetX;
      let drawY = offsetY;
      let rotDeg = 0;

      if (origRot === 0) {
        drawX = offsetX;
        drawY = offsetY;
        rotDeg = 0;
      } else if (origRot === 90) {
        drawX = offsetX;
        drawY = offsetY + targetH;
        rotDeg = 270;
      } else if (origRot === 180) {
        drawX = offsetX + targetW;
        drawY = offsetY + targetH;
        rotDeg = 180;
      } else if (origRot === 270) {
        drawX = offsetX + targetW;
        drawY = offsetY;
        rotDeg = 90;
      }

      sheet.drawPage(emb, {
        x: drawX,
        y: drawY,
        width: drawW,
        height: drawH,
        rotate: degrees(rotDeg),
      });

      if (options.drawBorder) {
        sheet.drawRectangle({
          x: offsetX,
          y: offsetY,
          width: targetW,
          height: targetH,
          borderColor: rgb(0.65, 0.65, 0.65),
          borderWidth: 0.5,
        });
      }
    }
  }

  if (onProgress) {
    onProgress(95, 'Saving N-Up PDF...');
  }

  return await destPdf.save();
}

