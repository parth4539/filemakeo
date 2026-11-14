/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import QRCode from 'qrcode';

export interface WifiPayloadOptions {
  ssid: string;
  password: string;
  encryption: 'WPA' | 'WEP' | 'nopass';
  hidden: boolean;
}

export interface UpiPayloadOptions {
  vpa: string;
  payeeName?: string;
  amount?: string;
  note?: string;
}

export interface EmailPayloadOptions {
  to: string;
  subject?: string;
  body?: string;
}

export interface VCardPayloadOptions {
  fullName: string;
  phone?: string;
  email?: string;
  org?: string;
  url?: string;
}

export interface QrRenderOptions {
  darkColor?: string;
  lightColor?: string;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  margin?: number;
  width?: number;
}

function escapeWifiField(val: string): string {
  return val.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/:/g, '\\:');
}

export function buildUrlPayload(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function buildWifiPayload(opts: WifiPayloadOptions): string {
  const ssid = escapeWifiField(opts.ssid.trim());
  const pass = opts.encryption === 'nopass' ? '' : escapeWifiField(opts.password);
  return `WIFI:T:${opts.encryption};S:${ssid};P:${pass};H:${opts.hidden ? 'true' : 'false'};;`;
}

export function buildUpiPayload(opts: UpiPayloadOptions): string {
  const params: string[] = [];
  params.push(`pa=${encodeURIComponent(opts.vpa.trim())}`);
  if (opts.payeeName?.trim()) params.push(`pn=${encodeURIComponent(opts.payeeName.trim())}`);
  if (opts.amount?.trim()) params.push(`am=${encodeURIComponent(opts.amount.trim())}`);
  if (opts.note?.trim()) params.push(`tn=${encodeURIComponent(opts.note.trim())}`);
  params.push('cu=INR');
  return `upi://pay?${params.join('&')}`;
}

export function buildEmailPayload(opts: EmailPayloadOptions): string {
  const query: string[] = [];
  if (opts.subject?.trim()) query.push(`subject=${encodeURIComponent(opts.subject.trim())}`);
  if (opts.body?.trim()) query.push(`body=${encodeURIComponent(opts.body.trim())}`);
  return `mailto:${opts.to.trim()}${query.length ? '?' + query.join('&') : ''}`;
}

export function buildVCardPayload(opts: VCardPayloadOptions): string {
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${opts.fullName.trim()}`,
  ];
  if (opts.org?.trim()) lines.push(`ORG:${opts.org.trim()}`);
  if (opts.phone?.trim()) lines.push(`TEL:${opts.phone.trim()}`);
  if (opts.email?.trim()) lines.push(`EMAIL:${opts.email.trim()}`);
  if (opts.url?.trim()) lines.push(`URL:${buildUrlPayload(opts.url)}`);
  lines.push('END:VCARD');
  return lines.join('\n');
}

export async function generateQrSvgString(
  text: string,
  opts: QrRenderOptions = {}
): Promise<string> {
  if (!text.trim()) throw new Error('QR code content cannot be empty.');
  return await QRCode.toString(text, {
    type: 'svg',
    errorCorrectionLevel: opts.errorCorrectionLevel || 'M',
    margin: opts.margin ?? 2,
    width: opts.width ?? 400,
    color: {
      dark: opts.darkColor || '#0f172a',
      light: opts.lightColor || '#ffffff',
    },
  });
}

export async function generateQrDataUrl(
  text: string,
  opts: QrRenderOptions = {}
): Promise<string> {
  if (!text.trim()) throw new Error('QR code content cannot be empty.');
  return await QRCode.toDataURL(text, {
    errorCorrectionLevel: opts.errorCorrectionLevel || 'M',
    margin: opts.margin ?? 2,
    width: opts.width ?? 512,
    color: {
      dark: opts.darkColor || '#0f172a',
      light: opts.lightColor || '#ffffff',
    },
  });
}

/**
 * Generates an uncompressed RGBA pixel grid directly from the QR matrix modules.
 * Works cleanly in both Node (for TDD verification with jsQR) and browsers.
 */
export async function generateQrRgbaMatrix(
  text: string,
  opts: { scale?: number; margin?: number; errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H' } = {}
): Promise<{ data: Uint8ClampedArray; width: number; height: number }> {
  if (!text.trim()) throw new Error('QR code content cannot be empty.');
  const qr = QRCode.create(text, {
    errorCorrectionLevel: opts.errorCorrectionLevel || 'M',
  });

  const scale = opts.scale ?? 6;
  const margin = opts.margin ?? 4;
  const moduleCount = qr.modules.size;
  const imgSize = (moduleCount + margin * 2) * scale;
  const data = new Uint8ClampedArray(imgSize * imgSize * 4);

  // Fill white background
  data.fill(255);

  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      const isDark = qr.modules.get(row, col);
      if (!isDark) continue;

      const startX = (col + margin) * scale;
      const startY = (row + margin) * scale;

      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          const px = ((startY + dy) * imgSize + (startX + dx)) * 4;
          data[px] = 0;
          data[px + 1] = 0;
          data[px + 2] = 0;
          data[px + 3] = 255;
        }
      }
    }
  }

  return { data, width: imgSize, height: imgSize };
}
