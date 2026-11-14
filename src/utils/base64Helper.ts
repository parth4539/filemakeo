/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function mimeToExtension(mimeType: string): string {
  const map: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/svg+xml': 'svg',
    'image/bmp': 'bmp',
    'image/x-icon': 'ico',
  };
  return map[mimeType.toLowerCase()] || 'png';
}

export function detectImageMimeFromBase64(rawOrDataUri: string): string {
  const trimmed = rawOrDataUri.trim();
  const dataUriMatch = trimmed.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,/i);
  if (dataUriMatch) {
    return dataUriMatch[1].toLowerCase();
  }

  const clean = trimmed.replace(/^data:[^;]+;base64,/i, '').replace(/\s+/g, '');
  if (clean.startsWith('iVBOR')) return 'image/png';
  if (clean.startsWith('/9j/')) return 'image/jpeg';
  if (clean.startsWith('UklGR')) return 'image/webp';
  if (clean.startsWith('R0lGOD')) return 'image/gif';
  if (clean.startsWith('PHN2Zy') || clean.startsWith('PD94bW')) return 'image/svg+xml';
  if (clean.startsWith('Qk')) return 'image/bmp';
  if (clean.startsWith('AAABAAE')) return 'image/x-icon';
  return 'image/png';
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export function parseBase64Input(input: string): {
  bytes: Uint8Array;
  mimeType: string;
  extension: string;
  rawBase64: string;
  dataUri: string;
} {
  const trimmed = (input || '').trim();
  if (!trimmed) {
    throw new Error('Please paste a valid Base64 string or Data URI.');
  }

  const mimeType = detectImageMimeFromBase64(trimmed);
  const rawBase64 = trimmed
    .replace(/^data:[^;]+;base64,/i, '')
    .replace(/\s+/g, '');

  if (!rawBase64 || !/^[A-Za-z0-9+/=_-]+$/.test(rawBase64)) {
    throw new Error('Invalid Base64 format. Check for unexpected characters.');
  }

  // Support URL-safe Base64 variants as well
  const standardB64 = rawBase64.replace(/-/g, '+').replace(/_/g, '/');

  let binary: string;
  try {
    binary = atob(standardB64);
  } catch {
    throw new Error('Could not decode Base64 string. Ensure padding and length are valid.');
  }

  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return {
    bytes,
    mimeType,
    extension: mimeToExtension(mimeType),
    rawBase64: standardB64,
    dataUri: `data:${mimeType};base64,${standardB64}`,
  };
}

export function formatBase64OutputSnippets(
  dataUri: string,
  mimeType: string,
  altName = 'image'
): {
  dataUri: string;
  rawBase64: string;
  htmlImg: string;
  cssUrl: string;
  mimeType: string;
} {
  const rawBase64 = dataUri.includes(',') ? dataUri.split(',')[1] : dataUri;
  const fullDataUri = dataUri.startsWith('data:')
    ? dataUri
    : `data:${mimeType};base64,${rawBase64}`;

  const safeAlt = altName.replace(/"/g, '&quot;');
  return {
    dataUri: fullDataUri,
    rawBase64,
    htmlImg: `<img src="${fullDataUri}" alt="${safeAlt}" />`,
    cssUrl: `background-image: url("${fullDataUri}");`,
    mimeType,
  };
}

export async function fileToBase64Snippets(file: File) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const mimeType = file.type || 'image/png';
  const b64 = bytesToBase64(bytes);
  const dataUri = `data:${mimeType};base64,${b64}`;
  return {
    ...formatBase64OutputSnippets(dataUri, mimeType, file.name),
    size: file.size,
    name: file.name,
  };
}
