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
import { transformImage } from '../../utils/imageHelper';
import { computeRotatedBoundingBox } from '../../utils/imageProcessingMath';
import { downloadBlob, createZipBlob, revokeAllObjectUrls } from '../../utils/downloadHelper';
import { formatBytes } from '../../utils/formatters';
import {
  RotateCcw,
  RotateCw,
  FlipHorizontal2,
  FlipVertical2,
  Image as ImageIcon,
  Download,
  AlertCircle,
} from 'lucide-react';

export const RotateFlipImagePage: React.FC = () => {
  const tool = TOOLS.find((t) => t.id === 'rotate-flip-image')!;
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrl, setPreviewUrl] = useState('');
  const [angleDeg, setAngleDeg] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [outputFormat, setOutputFormat] = useState<'auto' | 'image/png' | 'image/jpeg' | 'image/webp'>('auto');

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ blob: Blob; dataUrl: string; filename: string; width: number; height: number }[]>([]);
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

  const handleApply = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setProgress(10);
    setErrorMessage(null);

    try {
      const processed: { blob: Blob; dataUrl: string; filename: string; width: number; height: number }[] = [];
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const mime =
          outputFormat === 'auto'
            ? (['image/jpeg', 'image/png', 'image/webp'].includes(f.type)
                ? (f.type as 'image/jpeg' | 'image/png' | 'image/webp')
                : 'image/png')
            : outputFormat;

        const res = await transformImage(f, {
          angleDeg,
          flipHorizontal: flipH,
          flipVertical: flipV,
          outputType: mime,
          quality: 0.94,
        });

        const ext = mime === 'image/jpeg' ? 'jpg' : mime === 'image/webp' ? 'webp' : 'png';
        const base = f.name.replace(/\.[^/.]+$/, '');
        processed.push({
          blob: res.blob,
          dataUrl: res.dataUrl,
          filename: `${base}_transformed.${ext}`,
          width: res.width,
          height: res.height,
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
      setErrorMessage(err?.message || 'Failed to rotate or flip image(s).');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearAll = () => {
    revokeAllObjectUrls();
    setFiles([]);
    setResults([]);
    setZipBlob(null);
    setAngleDeg(0);
    setFlipH(false);
    setFlipV(false);
    setErrorMessage(null);
  };

  const totalOrigSize = files.reduce((acc, f) => acc + f.size, 0);
  const totalOutSize = results.reduce((acc, r) => acc + r.blob.size, 0);

  return (
    <ToolLayout tool={tool} onClearFiles={handleClearAll} hasFiles={files.length > 0 || results.length > 0}>
      {results.length > 0 ? (
        <DownloadResult
          filename={results[0].filename}
          resultSize={totalOutSize}
          originalSize={totalOrigSize}
          previewUrl={results[0].dataUrl}
          isImage={true}
          zipBlob={zipBlob || undefined}
          zipFilename="transformed_images.zip"
          title={results.length === 1 ? 'Image Transformed Successfully!' : `${results.length} Images Transformed!`}
          details={`${results[0].width} × ${results[0].height} px • Angle: ${angleDeg}°${flipH ? ' • Flip H' : ''}${flipV ? ' • Flip V' : ''}`}
          onDownload={() =>
            results.length === 1
              ? downloadBlob(results[0].blob, results[0].filename)
              : zipBlob && downloadBlob(zipBlob, 'transformed_images.zip')
          }
          onDownloadZip={zipBlob ? () => downloadBlob(zipBlob, 'transformed_images.zip') : undefined}
          onReset={handleClearAll}
        />
      ) : isProcessing ? (
        <ProgressBar progress={progress} statusMessage="Applying lossless canvas transform..." />
      ) : files.length === 0 ? (
        <FileDropzone
          accept={tool.accept}
          multiple={true}
          onFilesSelected={(selected) => setFiles(selected)}
          title="Choose image(s) to rotate or flip"
          description="Quick 90° turns, mirror flips, or custom fine-angle rotation for JPG, PNG, and WebP"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700">
              <div className="flex items-center gap-2.5 min-w-0">
                <ImageIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {files.length === 1 ? files[0].name : `${files.length} images selected`}
                  </p>
                  <p className="text-[11px] font-mono text-slate-500">
                    {formatBytes(totalOrigSize)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-xs font-semibold text-rose-600 hover:underline shrink-0"
              >
                Change
              </button>
            </div>

            {/* Quick Rotate & Flip Buttons */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Quick Actions
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setAngleDeg((a) => ((a - 90 + 540) % 360) - 180)}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 text-xs font-semibold transition-all"
                >
                  <RotateCcw className="w-4 h-4 text-blue-600" />
                  <span>Rotate 90° Left</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAngleDeg((a) => ((a + 90 + 540) % 360) - 180)}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 text-xs font-semibold transition-all"
                >
                  <RotateCw className="w-4 h-4 text-blue-600" />
                  <span>Rotate 90° Right</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFlipH((f) => !f)}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                    flipH
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <FlipHorizontal2 className="w-4 h-4" />
                  <span>Flip Horizontal</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFlipV((f) => !f)}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                    flipV
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <FlipVertical2 className="w-4 h-4" />
                  <span>Flip Vertical</span>
                </button>
              </div>
            </div>

            {/* Fine Angle Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold uppercase tracking-wider text-slate-500">Custom Angle</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-blue-600">{angleDeg}°</span>
                  {angleDeg !== 0 && (
                    <button
                      type="button"
                      onClick={() => setAngleDeg(0)}
                      className="text-[11px] text-slate-500 hover:text-slate-900 underline"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
              <input
                type="range"
                min={-180}
                max={180}
                step={1}
                value={angleDeg}
                onChange={(e) => setAngleDeg(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
              />
            </div>

            {/* Output Format */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Output Format
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'auto', label: 'Original' },
                  { id: 'image/png', label: 'PNG' },
                  { id: 'image/jpeg', label: 'JPG' },
                  { id: 'image/webp', label: 'WebP' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setOutputFormat(opt.id as any)}
                    className={`py-2 rounded-xl border text-xs font-semibold transition-all ${
                      outputFormat === opt.id
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {errorMessage && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleApply}
              className="w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Apply &amp; Export {files.length > 1 ? `(${files.length} Files)` : 'Image'}</span>
            </button>
          </div>

          {/* Live Preview */}
          <div className="lg:col-span-7 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center min-h-[380px]">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
              Live Transform Preview ({computeRotatedBoundingBox(100, 100, angleDeg).width > 0 ? `${angleDeg}°` : '0°'})
            </span>
            <div className="w-full h-80 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-hidden flex items-center justify-center p-6">
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Transform preview"
                  style={{
                    transform: `rotate(${angleDeg}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
                  }}
                  className="max-h-56 max-w-full object-contain transition-transform duration-150 rounded shadow"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </ToolLayout>
  );
};
