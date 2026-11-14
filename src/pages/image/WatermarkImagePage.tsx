/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TOOLS } from '../../types/tool';
import { ToolLayout } from '../../components/ToolLayout';
import { FileDropzone } from '../../components/FileDropzone';
import { ProgressBar } from '../../components/ProgressBar';
import { DownloadResult } from '../../components/DownloadResult';
import { watermarkImage } from '../../utils/imageHelper';
import { WatermarkPosition } from '../../utils/imageProcessingMath';
import { downloadBlob, createZipBlob, revokeAllObjectUrls } from '../../utils/downloadHelper';
import { formatBytes } from '../../utils/formatters';
import { Stamp, Type as TypeIcon, Image as ImageIcon, Upload, AlertCircle } from 'lucide-react';

const POSITIONS: { id: WatermarkPosition; label: string }[] = [
  { id: 'top-left', label: 'Top Left' },
  { id: 'top-center', label: 'Top Center' },
  { id: 'top-right', label: 'Top Right' },
  { id: 'center', label: 'Center' },
  { id: 'bottom-left', label: 'Bottom Left' },
  { id: 'bottom-center', label: 'Bottom Center' },
  { id: 'bottom-right', label: 'Bottom Right' },
  { id: 'tiled', label: 'Tiled Pattern' },
];

export const WatermarkImagePage: React.FC = () => {
  const tool = TOOLS.find((t) => t.id === 'watermark-image')!;
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrl, setPreviewUrl] = useState('');

  const [mode, setMode] = useState<'text' | 'logo'>('text');
  const [text, setText] = useState('© fileMakeR');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState('');

  const [position, setPosition] = useState<WatermarkPosition>('bottom-right');
  const [opacity, setOpacity] = useState(0.55);
  const [scaleRatio, setScaleRatio] = useState(0.06);
  const [logoScaleRatio, setLogoScaleRatio] = useState(0.22);
  const [rotationDeg, setRotationDeg] = useState(0);
  const [colorHex, setColorHex] = useState('#ffffff');

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ blob: Blob; dataUrl: string; filename: string }[]>([]);
  const [zipBlob, setZipBlob] = useState<Blob | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (files.length === 0) {
      setPreviewUrl('');
      return;
    }
    const url = URL.createObjectURL(files[0]);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [files]);

  useEffect(() => {
    if (!logoFile) {
      setLogoPreviewUrl('');
      return;
    }
    const url = URL.createObjectURL(logoFile);
    setLogoPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  const handleApply = async () => {
    if (files.length === 0) return;
    if (mode === 'text' && !text.trim()) {
      setErrorMessage('Please enter watermark text.');
      return;
    }
    if (mode === 'logo' && !logoFile) {
      setErrorMessage('Please upload a logo image for logo watermark mode.');
      return;
    }

    setIsProcessing(true);
    setProgress(10);
    setErrorMessage(null);

    try {
      const processed: { blob: Blob; dataUrl: string; filename: string }[] = [];
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const mime = ['image/jpeg', 'image/png', 'image/webp'].includes(f.type)
          ? (f.type as 'image/jpeg' | 'image/png' | 'image/webp')
          : 'image/png';
        const res = await watermarkImage(f, {
          mode,
          text,
          logoFile: logoFile || undefined,
          fontSizeRatio: scaleRatio,
          logoScaleRatio,
          opacity,
          colorHex,
          rotationDeg,
          position,
          outputType: mime,
          quality: 0.93,
        });

        const ext = mime === 'image/jpeg' ? 'jpg' : mime === 'image/webp' ? 'webp' : 'png';
        const base = f.name.replace(/\.[^/.]+$/, '');
        processed.push({
          blob: res.blob,
          dataUrl: res.dataUrl,
          filename: `${base}_watermarked.${ext}`,
        });
        setProgress(Math.round(((i + 1) / files.length) * 85));
      }

      setResults(processed);
      if (processed.length > 1) {
        const z = await createZipBlob(
          processed.map((r) => ({ name: r.filename, blob: r.blob })),
          (pct) => setProgress(85 + Math.round(pct * 0.15))
        );
        setZipBlob(z);
      } else {
        setZipBlob(null);
      }
      setProgress(100);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to apply image watermark.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearAll = () => {
    revokeAllObjectUrls();
    setFiles([]);
    setResults([]);
    setZipBlob(null);
    setErrorMessage(null);
  };

  const totalOrig = files.reduce((a, f) => a + f.size, 0);
  const totalOut = results.reduce((a, r) => a + r.blob.size, 0);

  return (
    <ToolLayout tool={tool} onClearFiles={handleClearAll} hasFiles={files.length > 0 || results.length > 0}>
      {results.length > 0 ? (
        <DownloadResult
          filename={results[0].filename}
          resultSize={totalOut}
          originalSize={totalOrig}
          previewUrl={results[0].dataUrl}
          isImage={true}
          zipBlob={zipBlob || undefined}
          zipFilename="watermarked_images.zip"
          title={results.length === 1 ? 'Watermark Applied!' : `${results.length} Images Watermarked!`}
          details={`Rendered ${mode === 'text' ? `"${text}"` : 'logo stamp'} cleanly at ${Math.round(opacity * 100)}% opacity.`}
          onDownload={() =>
            results.length === 1
              ? downloadBlob(results[0].blob, results[0].filename)
              : zipBlob && downloadBlob(zipBlob, 'watermarked_images.zip')
          }
          onDownloadZip={zipBlob ? () => downloadBlob(zipBlob, 'watermarked_images.zip') : undefined}
          onReset={handleClearAll}
        />
      ) : isProcessing ? (
        <ProgressBar progress={progress} statusMessage="Rendering image watermark overlay..." />
      ) : files.length === 0 ? (
        <FileDropzone
          accept={tool.accept}
          multiple={true}
          onFilesSelected={(sel) => setFiles(sel)}
          title="Choose image(s) to watermark"
          description="Stamp text copyright or transparent PNG logos onto photos individually or in batch"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700">
              <div className="flex items-center gap-2.5 min-w-0">
                <ImageIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate">{files.length === 1 ? files[0].name : `${files.length} images selected`}</p>
                  <p className="text-[11px] font-mono text-slate-500">{formatBytes(totalOrig)}</p>
                </div>
              </div>
              <button type="button" onClick={handleClearAll} className="text-xs font-semibold text-rose-600 hover:underline">
                Change
              </button>
            </div>

            {/* Text vs Logo Tabs */}
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setMode('text')}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                  mode === 'text' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <TypeIcon className="w-3.5 h-3.5" />
                <span>Text Watermark</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('logo')}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                  mode === 'logo' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Logo Overlay</span>
              </button>
            </div>

            {mode === 'text' ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter watermark text..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase text-slate-500">Color:</span>
                  {['#ffffff', '#0f172a', '#ef4444', '#2563eb', '#f59e0b'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColorHex(c)}
                      style={{ backgroundColor: c }}
                      className={`w-6 h-6 rounded-full border-2 ${
                        colorHex === c ? 'border-blue-500 scale-110' : 'border-slate-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 cursor-pointer text-center">
                <Upload className="w-5 h-5 text-blue-600 mb-1" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  {logoFile ? logoFile.name : 'Upload transparent PNG/SVG/JPG logo'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && setLogoFile(e.target.files[0])}
                />
              </label>
            )}

            {/* Placement Grid */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Placement</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {POSITIONS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPosition(p.id)}
                    className={`py-1.5 px-2 rounded-lg border text-[11px] font-semibold transition-all ${
                      position === p.id
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sliders */}
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="space-y-1">
                <span className="font-semibold text-slate-500">Opacity {Math.round(opacity * 100)}%</span>
                <input
                  type="range"
                  min={0.1}
                  max={1}
                  step={0.05}
                  value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <span className="font-semibold text-slate-500">
                  Size {mode === 'text' ? Math.round(scaleRatio * 100) : Math.round(logoScaleRatio * 100)}%
                </span>
                <input
                  type="range"
                  min={mode === 'text' ? 0.025 : 0.08}
                  max={mode === 'text' ? 0.16 : 0.5}
                  step={0.01}
                  value={mode === 'text' ? scaleRatio : logoScaleRatio}
                  onChange={(e) =>
                    mode === 'text'
                      ? setScaleRatio(Number(e.target.value))
                      : setLogoScaleRatio(Number(e.target.value))
                  }
                  className="w-full h-1.5 bg-slate-200 rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <span className="font-semibold text-slate-500">Angle {rotationDeg}°</span>
                <input
                  type="range"
                  min={-60}
                  max={60}
                  step={5}
                  value={rotationDeg}
                  onChange={(e) => setRotationDeg(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg"
                />
              </div>
            </div>

            {errorMessage && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleApply}
              className="w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Stamp className="w-4 h-4" />
              <span>Apply Watermark &amp; Download</span>
            </button>
          </div>

          {/* Preview Stage */}
          <div className="lg:col-span-7 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center min-h-[380px]">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Live Overlay Preview
            </span>
            <div className="relative inline-block rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 max-h-80">
              {previewUrl && (
                <img src={previewUrl} alt="Watermark target" className="max-h-80 w-auto block object-contain" />
              )}
              <div
                className={`absolute inset-0 pointer-events-none flex p-4 ${
                  position === 'top-left'
                    ? 'items-start justify-start'
                    : position === 'top-center'
                    ? 'items-start justify-center'
                    : position === 'top-right'
                    ? 'items-start justify-end'
                    : position === 'bottom-left'
                    ? 'items-end justify-start'
                    : position === 'bottom-center'
                    ? 'items-end justify-center'
                    : position === 'bottom-right'
                    ? 'items-end justify-end'
                    : 'items-center justify-center'
                }`}
              >
                {mode === 'text' ? (
                  <span
                    style={{
                      opacity,
                      color: colorHex,
                      transform: `rotate(${rotationDeg}deg)`,
                      fontSize: `${Math.max(12, Math.round(scaleRatio * 340))}px`,
                      textShadow: '0 2px 6px rgba(0,0,0,0.45)',
                    }}
                    className="font-bold whitespace-nowrap select-none"
                  >
                    {position === 'tiled' ? `${text}   ${text}` : text}
                  </span>
                ) : (
                  logoPreviewUrl && (
                    <img
                      src={logoPreviewUrl}
                      alt="Logo stamp"
                      style={{
                        opacity,
                        width: `${Math.round(logoScaleRatio * 100)}%`,
                        transform: `rotate(${rotationDeg}deg)`,
                      }}
                      className="object-contain drop-shadow"
                    />
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </ToolLayout>
  );
};
