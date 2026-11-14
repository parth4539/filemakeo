/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import jsQR from 'jsqr';
import {
  buildUrlPayload,
  buildWifiPayload,
  buildUpiPayload,
  buildEmailPayload,
  buildVCardPayload,
  generateQrSvgString,
  generateQrRgbaMatrix,
} from '../qrHelper';

describe('qrHelper', () => {
  describe('payload builders', () => {
    it('normalizes URL payloads', () => {
      expect(buildUrlPayload('example.com')).toBe('https://example.com');
      expect(buildUrlPayload('https://filemaker.app/tools')).toBe('https://filemaker.app/tools');
      expect(buildUrlPayload('http://localhost:3000')).toBe('http://localhost:3000');
    });

    it('builds valid Wi-Fi QR strings with proper escaping', () => {
      expect(
        buildWifiPayload({ ssid: 'Home;Net\\1', password: 'secret:pass', encryption: 'WPA', hidden: true })
      ).toBe('WIFI:T:WPA;S:Home\\;Net\\\\1;P:secret\\:pass;H:true;;');

      expect(
        buildWifiPayload({ ssid: 'CafeFree', password: '', encryption: 'nopass', hidden: false })
      ).toBe('WIFI:T:nopass;S:CafeFree;P:;H:false;;');
    });

    it('builds valid UPI payment URIs', () => {
      const upi = buildUpiPayload({
        vpa: 'parth@upi',
        payeeName: 'Parth Prajapati',
        amount: '250.00',
        note: 'Invoice 42',
      });
      expect(upi).toContain('upi://pay?');
      expect(upi).toContain('pa=parth%40upi');
      expect(upi).toContain('pn=Parth%20Prajapati');
      expect(upi).toContain('am=250.00');
      expect(upi).toContain('cu=INR');
    });

    it('builds valid mailto and vCard 3.0 strings', () => {
      const mail = buildEmailPayload({ to: 'hi@example.com', subject: 'Hello', body: 'Test' });
      expect(mail).toBe('mailto:hi@example.com?subject=Hello&body=Test');

      const vcard = buildVCardPayload({
        fullName: 'Parth Prajapati',
        phone: '+919999999999',
        email: 'parth@example.com',
        org: 'fileMakeR',
        url: 'https://example.com',
      });
      expect(vcard).toContain('BEGIN:VCARD');
      expect(vcard).toContain('FN:Parth Prajapati');
      expect(vcard).toContain('TEL:+919999999999');
      expect(vcard).toContain('END:VCARD');
    });
  });

  describe('QR generation and jsQR round-trip decoding', () => {
    it('generates valid SVG markup for a QR payload', async () => {
      const svg = await generateQrSvgString('https://filemaker.example.com', {
        darkColor: '#0f172a',
        lightColor: '#ffffff',
        errorCorrectionLevel: 'M',
        margin: 2,
      });
      expect(svg).toContain('<svg');
      expect(svg).toContain('viewBox=');
      expect(svg).toContain('</svg>');
    });

    it('encodes a QR pixel matrix that decodes back cleanly via jsQR', async () => {
      const secretText = 'fileMakeR-TDD-Verified-2026!';
      const { data, width, height } = await generateQrRgbaMatrix(secretText, {
        scale: 6,
        margin: 4,
        errorCorrectionLevel: 'H',
      });

      const decoded = jsQR(data, width, height);
      expect(decoded).not.toBeNull();
      expect(decoded?.data).toBe(secretText);
    });
  });
});
