/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import { TOOLS } from '../../types/tool';
import { ToolLayout } from '../../components/ToolLayout';
import { FileDropzone } from '../../components/FileDropzone';
import {
  buildUrlPayload,
  buildWifiPayload,
  buildUpiPayload,
  buildEmailPayload,
  buildVCardPayload,
  generateQrDataUrl,
  generateQrSvgString,
} from '../../utils/qrHelper';
import { downloadBlob, revokeAllObjectUrls } from '../../utils/downloadHelper';
import {
  QrCode,
  Camera,
  CameraOff,
  Copy,
  Check,
  Download,
  ExternalLink,
  AlertCircle,
  Upload,
} from 'lucide-react';

type QrContentType = 'url' | 'text' | 'wifi' | 'upi' | 'email' | 'vcard';

export const QrCodePage: React.FC = () => {
  const tool = TOOLS.find((t) => t.id === 'qr-code')!;
  const [activeTab, setActiveTab] = useState<'generate' | 'scan'>('generate');

  // Generator state
  const [contentType, setContentType] = useState<QrContentType>('url');
  const [urlInput, setUrlInput] = useState('https://example.com');
  const [textInput, setTextInput] = useState('Hello from fileMakeR!');
  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiPass, setWifiPass] = useState('');
  const [wifiEnc, setWifiEnc] = useState<'WPA' | 'WEP' | 'nopass'>('WPA');
  const [wifiHidden, setWifiHidden] = useState(false);

  const [upiVpa, setUpiVpa] = useState('');
  const [upiName, setUpiName] = useState('');
  const [upiAmount, setUpiAmount] = useState('');
  const [upiNote, setUpiNote] = useState('');

  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  const [vcardName, setVcardName] = useState('');
  const [vcardPhone, setVcardPhone] = useState('');
  const [vcardEmail, setVcardEmail] = useState('');
  const [vcardOrg, setVcardOrg] = useState('');

  const [darkColor, setDarkColor] = useState('#0f172a');
  const [lightColor, setLightColor] = useState('#ffffff');
  const [ecc, setEcc] = useState<'L' | 'M' | 'Q' | 'H'>('M');
  const [qrSize, setQrSize] = useState(512);
  const [logoDataUrl, setLogoDataUrl] = useState('');

  const [qrPreviewDataUrl, setQrPreviewDataUrl] = useState('');
  const [qrSvgMarkup, setQrSvgMarkup] = useState('');

  // Scanner state
  const [scannedText, setScannedText] = useState('');
  const [scanError, setScanError] = useState<string | null>(null);
  const [copiedScan, setCopiedScan] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const scanCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const activePayload = (() => {
    switch (contentType) {
      case 'url':
        return buildUrlPayload(urlInput);
      case 'text':
        return textInput.trim();
      case 'wifi':
        return wifiSsid.trim()
          ? buildWifiPayload({
              ssid: wifiSsid,
              password: wifiPass,
              encryption: wifiEnc,
              hidden: wifiHidden,
            })
          : '';
      case 'upi':
        return upiVpa.trim()
          ? buildUpiPayload({ vpa: upiVpa, payeeName: upiName, amount: upiAmount, note: upiNote })
          : '';
      case 'email':
        return emailTo.trim()
          ? buildEmailPayload({ to: emailTo, subject: emailSubject, body: emailBody })
          : '';
      case 'vcard':
        return vcardName.trim()
          ? buildVCardPayload({
              fullName: vcardName,
              phone: vcardPhone,
              email: vcardEmail,
              org: vcardOrg,
            })
          : '';
      default:
        return '';
    }
  })();

  // Render QR preview whenever payload or options change
  useEffect(() => {
    if (!activePayload) {
      setQrPreviewDataUrl('');
      setQrSvgMarkup('');
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const effectiveEcc = logoDataUrl ? 'H' : ecc;
        const [rawUrl, svg] = await Promise.all([
          generateQrDataUrl(activePayload, {
            darkColor,
            lightColor,
            errorCorrectionLevel: effectiveEcc,
            width: qrSize,
            margin: 2,
          }),
          generateQrSvgString(activePayload, {
            darkColor,
            lightColor,
            errorCorrectionLevel: effectiveEcc,
            width: qrSize,
            margin: 2,
          }),
        ]);

        if (cancelled) return;
        setQrSvgMarkup(svg);

        if (!logoDataUrl) {
          setQrPreviewDataUrl(rawUrl);
          return;
        }

        // Composite center logo on QR PNG
        const baseImg = new Image();
        const logoImg = new Image();
        await Promise.all([
          new Promise<void>((res, rej) => {
            baseImg.onload = () => res();
            baseImg.onerror = rej;
            baseImg.src = rawUrl;
          }),
          new Promise<void>((res, rej) => {
            logoImg.onload = () => res();
            logoImg.onerror = rej;
            logoImg.src = logoDataUrl;
          }),
        ]);

        if (cancelled) return;
        const canvas = document.createElement('canvas');
        canvas.width = qrSize;
        canvas.height = qrSize;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(baseImg, 0, 0, qrSize, qrSize);
          const boxSize = Math.round(qrSize * 0.22);
          const pad = Math.round(boxSize * 0.14);
          const bx = Math.round((qrSize - boxSize) / 2);
          ctx.fillStyle = lightColor;
          ctx.fillRect(bx - pad, bx - pad, boxSize + pad * 2, boxSize + pad * 2);
          ctx.drawImage(logoImg, bx, bx, boxSize, boxSize);
          setQrPreviewDataUrl(canvas.toDataURL('image/png'));
          canvas.width = 0;
          canvas.height = 0;
        }
      } catch {
        if (!cancelled) {
          setQrPreviewDataUrl('');
          setQrSvgMarkup('');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activePayload, darkColor, lightColor, ecc, qrSize, logoDataUrl]);

  const stopCamera = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    setScanError(null);
    setScannedText('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      setIsCameraActive(true);

      requestAnimationFrame(() => {
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        video.play().catch(() => {});

        const tick = () => {
          if (!streamRef.current || !videoRef.current || !scanCanvasRef.current) return;
          const v = videoRef.current;
          if (v.readyState === v.HAVE_ENOUGH_DATA && v.videoWidth > 0) {
            const canvas = scanCanvasRef.current;
            canvas.width = v.videoWidth;
            canvas.height = v.videoHeight;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (ctx) {
              ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
              const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const code = jsQR(imgData.data, imgData.width, imgData.height);
              if (code?.data) {
                setScannedText(code.data);
                stopCamera();
                return;
              }
            }
          }
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      });
    } catch {
      setScanError(
        'Camera permission denied or unavailable. Please upload a QR code image instead.'
      );
      stopCamera();
    }
  };

  const handleScanImageFiles = (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setScanError(null);
    setScannedText('');
    const objUrl = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      URL.revokeObjectURL(objUrl);
      if (!ctx) {
        setScanError('Could not initialize image decoder.');
        return;
      }
      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const decoded = jsQR(imgData.data, imgData.width, imgData.height);
      canvas.width = 0;
      canvas.height = 0;
      if (decoded?.data) {
        setScannedText(decoded.data);
      } else {
        setScanError('No valid QR code found in this image. Ensure clear lighting and framing.');
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objUrl);
      setScanError('Could not load uploaded image.');
    };
    img.src = objUrl;
  };

  const handleDownloadPng = async () => {
    if (!qrPreviewDataUrl) return;
    const blob = await fetch(qrPreviewDataUrl).then((r) => r.blob());
    downloadBlob(blob, 'qr_code.png');
  };

  const handleDownloadSvg = () => {
    if (!qrSvgMarkup) return;
    const blob = new Blob([qrSvgMarkup], { type: 'image/svg+xml;charset=utf-8' });
    downloadBlob(blob, 'qr_code.svg');
  };

  const handleClearAll = () => {
    stopCamera();
    revokeAllObjectUrls();
    setScannedText('');
    setScanError(null);
    setLogoDataUrl('');
  };

  const isSafeHttpUrl = /^https?:\/\/\S+$/i.test(scannedText.trim());

  return (
    <ToolLayout tool={tool} onClearFiles={handleClearAll} hasFiles={!!scannedText || !!logoDataUrl}>
      <div className="space-y-6">
        <div className="flex justify-center">
          <div className="inline-flex p-1 rounded-xl bg-slate-200/70 dark:bg-slate-800 text-xs sm:text-sm font-semibold">
            <button
              type="button"
              onClick={() => {
                stopCamera();
                setActiveTab('generate');
              }}
              className={`px-5 py-2.5 rounded-lg transition-all ${
                activeTab === 'generate'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Generate QR Code
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('scan')}
              className={`px-5 py-2.5 rounded-lg transition-all ${
                activeTab === 'scan'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Scan / Decode QR
            </button>
          </div>
        </div>

        {activeTab === 'generate' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              {/* Payload Type Selector */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {[
                  { id: 'url', label: 'URL' },
                  { id: 'text', label: 'Text' },
                  { id: 'wifi', label: 'Wi-Fi' },
                  { id: 'upi', label: 'UPI Pay' },
                  { id: 'email', label: 'Email' },
                  { id: 'vcard', label: 'vCard' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setContentType(t.id as QrContentType)}
                    className={`py-2 px-2 rounded-xl border text-xs font-semibold transition-all ${
                      contentType === t.id
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Dynamic Form Fields */}
              {contentType === 'url' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Website URL</label>
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {contentType === 'text' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Plain Text</label>
                  <textarea
                    rows={3}
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Enter any text, note, or code..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {contentType === 'wifi' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={wifiSsid}
                    onChange={(e) => setWifiSsid(e.target.value)}
                    placeholder="Wi-Fi Network Name (SSID)"
                    className="px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  />
                  <input
                    type="text"
                    value={wifiPass}
                    disabled={wifiEnc === 'nopass'}
                    onChange={(e) => setWifiPass(e.target.value)}
                    placeholder="Password"
                    className="px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm disabled:opacity-40"
                  />
                  <select
                    value={wifiEnc}
                    onChange={(e) => setWifiEnc(e.target.value as any)}
                    className="px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  >
                    <option value="WPA">WPA / WPA2 / WPA3</option>
                    <option value="WEP">WEP</option>
                    <option value="nopass">No Password (Open)</option>
                  </select>
                  <label className="flex items-center gap-2 text-xs font-medium px-2">
                    <input
                      type="checkbox"
                      checked={wifiHidden}
                      onChange={(e) => setWifiHidden(e.target.checked)}
                    />
                    <span>Hidden Network</span>
                  </label>
                </div>
              )}

              {contentType === 'upi' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={upiVpa}
                    onChange={(e) => setUpiVpa(e.target.value)}
                    placeholder="UPI ID (e.g. name@upi)"
                    className="px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  />
                  <input
                    type="text"
                    value={upiName}
                    onChange={(e) => setUpiName(e.target.value)}
                    placeholder="Payee Name"
                    className="px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={upiAmount}
                    onChange={(e) => setUpiAmount(e.target.value)}
                    placeholder="Amount in INR (optional)"
                    className="px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  />
                  <input
                    type="text"
                    value={upiNote}
                    onChange={(e) => setUpiNote(e.target.value)}
                    placeholder="Transaction Note (optional)"
                    className="px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  />
                </div>
              )}

              {contentType === 'email' && (
                <div className="space-y-3">
                  <input
                    type="email"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    placeholder="Recipient Email"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  />
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Email Subject"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  />
                  <textarea
                    rows={2}
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    placeholder="Message body..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  />
                </div>
              )}

              {contentType === 'vcard' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={vcardName}
                    onChange={(e) => setVcardName(e.target.value)}
                    placeholder="Full Name *"
                    className="px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  />
                  <input
                    type="tel"
                    value={vcardPhone}
                    onChange={(e) => setVcardPhone(e.target.value)}
                    placeholder="Phone Number"
                    className="px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  />
                  <input
                    type="email"
                    value={vcardEmail}
                    onChange={(e) => setVcardEmail(e.target.value)}
                    placeholder="Email Address"
                    className="px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  />
                  <input
                    type="text"
                    value={vcardOrg}
                    onChange={(e) => setVcardOrg(e.target.value)}
                    placeholder="Company / Organization"
                    className="px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  />
                </div>
              )}

              {/* Styling Options */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="space-y-1">
                  <span className="font-bold uppercase text-slate-500 block">QR Color</span>
                  <input
                    type="color"
                    value={darkColor}
                    onChange={(e) => setDarkColor(e.target.value)}
                    className="w-full h-9 rounded-lg cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <span className="font-bold uppercase text-slate-500 block">Background</span>
                  <input
                    type="color"
                    value={lightColor}
                    onChange={(e) => setLightColor(e.target.value)}
                    className="w-full h-9 rounded-lg cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <span className="font-bold uppercase text-slate-500 block">Correction</span>
                  <select
                    value={logoDataUrl ? 'H' : ecc}
                    disabled={!!logoDataUrl}
                    onChange={(e) => setEcc(e.target.value as any)}
                    className="w-full h-9 px-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="L">Low (7%)</option>
                    <option value="M">Medium (15%)</option>
                    <option value="Q">Quartile (25%)</option>
                    <option value="H">High (30%)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <span className="font-bold uppercase text-slate-500 block">Resolution</span>
                  <select
                    value={qrSize}
                    onChange={(e) => setQrSize(Number(e.target.value))}
                    className="w-full h-9 px-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value={256}>256 px</option>
                    <option value={512}>512 px</option>
                    <option value={1024}>1024 px</option>
                  </select>
                </div>
              </div>

              {/* Optional Center Logo */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 cursor-pointer text-xs font-semibold">
                  <Upload className="w-3.5 h-3.5 text-blue-600" />
                  <span>{logoDataUrl ? 'Change Center Logo' : 'Add Center Logo (Optional)'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const reader = new FileReader();
                      reader.onload = () => setLogoDataUrl(String(reader.result || ''));
                      reader.readAsDataURL(f);
                    }}
                  />
                </label>
                {logoDataUrl && (
                  <button
                    type="button"
                    onClick={() => setLogoDataUrl('')}
                    className="text-xs font-semibold text-rose-600 hover:underline"
                  >
                    Remove Logo
                  </button>
                )}
              </div>
            </div>

            {/* Live QR Card & Downloads */}
            <div className="lg:col-span-5 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center space-y-5">
              {qrPreviewDataUrl ? (
                <>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-inner">
                    <img
                      src={qrPreviewDataUrl}
                      alt="Generated QR Code"
                      className="w-56 h-56 object-contain rounded"
                    />
                  </div>
                  <div className="w-full grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={handleDownloadPng}
                      className="py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download PNG</span>
                    </button>
                    <button
                      type="button"
                      disabled={!!logoDataUrl}
                      onClick={handleDownloadSvg}
                      title={logoDataUrl ? 'SVG export is disabled when raster logo is embedded' : 'Download crisp vector SVG'}
                      className="py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 disabled:opacity-40 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download SVG</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center text-slate-400 space-y-2 py-12">
                  <QrCode className="w-12 h-12 mx-auto opacity-40" />
                  <p className="text-xs">Enter required fields on the left to generate your QR code</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-center gap-3">
              {!isCameraActive ? (
                <button
                  type="button"
                  onClick={startCamera}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-sm"
                >
                  <Camera className="w-4 h-4" />
                  <span>Scan with Camera</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopCamera}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-semibold shadow-sm"
                >
                  <CameraOff className="w-4 h-4" />
                  <span>Stop Camera</span>
                </button>
              )}
            </div>

            {isCameraActive ? (
              <div className="relative rounded-2xl overflow-hidden bg-black border border-slate-700">
                <video ref={videoRef} playsInline muted className="w-full max-h-80 object-cover" />
                <canvas ref={scanCanvasRef} className="hidden" />
              </div>
            ) : (
              <FileDropzone
                accept={['.png', '.jpg', '.jpeg', '.webp', 'image/*']}
                multiple={false}
                onFilesSelected={handleScanImageFiles}
                title="Drop a QR code screenshot or photo"
                description="Decodes QR images instantly in browser RAM using jsQR"
              />
            )}

            {scanError && (
              <div className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{scanError}</span>
              </div>
            )}

            {scannedText && (
              <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                  Decoded QR Content
                </span>
                <p className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900 font-mono text-xs sm:text-sm break-all text-slate-900 dark:text-slate-100">
                  {scannedText}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(scannedText);
                      setCopiedScan(true);
                      setTimeout(() => setCopiedScan(false), 1800);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
                  >
                    {copiedScan ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedScan ? 'Copied!' : 'Copy Content'}</span>
                  </button>
                  {isSafeHttpUrl && (
                    <a
                      href={scannedText.trim()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:text-blue-600"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open URL</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </ToolLayout>
  );
};
