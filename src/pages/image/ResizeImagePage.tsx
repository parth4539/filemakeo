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
import { resizeImage, getImageDimensions } from '../../utils/imageHelper';
import { downloadBlob, revokeAllObjectUrls } from '../../utils/downloadHelper';
import { formatBytes } from '../../utils/formatters';
import { Scaling, Image as ImageIcon, Lock, Unlock, AlertCircle } from 'lucide-react';

export const ResizeImagePage: React.FC = () => {
  const tool = TOOLS.find((t) => t.id === 'resize-image')!;
  const [file, setFile] = useState<File | null>(null);
  const [origWidth, setOrigWidth] = useState<number>(0);
  const [origHeight, setOrigHeight] = useState<number>(0);

  const [mode, setMode] = useState<'pixels' | 'percentage' | 'presets'>('pixels');
  const [width, setWidth] = useState<number>(800);
  const [height, setHeight] = useState<number>(600);
  const [keepAspect, setKeepAspect] = useState<boolean>(true);
  const [percentage, setPercentage] = useState<number>(50);
  const [outputFormat, setOutputFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/jpeg');

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultDataUrl, setResultDataUrl] = useState<string>('');
  const [resultFilename, setResultFilename] = useState('');
  const [resWidth, setResWidth] = useState<number>(0);
  const [resHeight, setResHeight] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setOrigWidth(0);
      setOrigHeight(0);
      return;
    }
    getImageDimensions(file)
      .then((dim) => {
        setOrigWidth(dim.width);
        setOrigHeight(dim.height);
        setWidth(dim.width);
        setHeight(dim.height);
      })
      .catch((err) => console.error(err));
  }, [file]);

  const handleWidthChange = (val: number) => {
    setWidth(val);
    if (keepAspect && origWidth > 0 && origHeight > 0) {
      const ratio = origHeight / origWidth;
      setHeight(Math.round(val * ratio));
    }
  };

  const handleHeightChange = (val: number) => {
    setHeight(val);
    if (keepAspect && origWidth > 0 && origHeight > 0) {
      const ratio = origWidth / origHeight;
      setWidth(Math.round(val * ratio));
    }
  };

  const applyPreset = (w: number, h: number) => {
    setMode('pixels');
    setKeepAspect(false);
    setWidth(w);
    setHeight(h);
  };

  const handleClearAll = () => {
    revokeAllObjectUrls();
    setFile(null);
    setOrigWidth(0);
    setOrigHeight(0);
    setResultBlob(null);
    setResultDataUrl('');
    setIsProcessing(false);
    setErrorMessage(null);
  };

  const handleResize = async () => {
    if (!file) return;

    let targetW = width;
    let targetH = height;

    if (mode === 'percentage') {
      targetW = Math.max(1, Math.round(origWidth * (percentage / 100)));
      targetH = Math.max(1, Math.round(origHeight * (percentage / 100)));
    }

    if (targetW <= 0 || targetH <= 0) {
      setErrorMessage('Width and height must be greater than 0.');
      return;
    }

    setIsProcessing(true);
    setProgress(30);
    setStatusMessage('Resampling image pixels in browser...');
    setErrorMessage(null);

    try {
      const res = await resizeImage(file, targetW, targetH, outputFormat, 0.92);
      setResultBlob(res.blob);
      setResultDataUrl(res.dataUrl);
      setResWidth(res.width);
      setResHeight(res.height);

      const ext = outputFormat === 'image/jpeg' ? 'jpg' : outputFormat === 'image/png' ? 'png' : 'webp';
      const base = file.name.replace(/\.[^/.]+$/, '');
      setResultFilename(`${base}_${targetW}x${targetH}.${ext}`);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to resize image.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ToolLayout tool={tool} onClearFiles={handleClearAll} hasFiles={!!file || !!resultBlob}>
      {resultBlob ? (
        <DownloadResult
          filename={resultFilename}
          resultSize={resultBlob.size}
          originalSize={file?.size}
          previewUrl={resultDataUrl}
          isImage={true}
          title="Image Resized Successfully!"
          details={`Scaled from ${origWidth}×${origHeight} px to ${resWidth}×${resHeight} px.`}
          onDownload={() => downloadBlob(resultBlob, resultFilename)}
          onReset={handleClearAll}
        />
      ) : isProcessing ? (
        <ProgressBar progress={progress} statusMessage={statusMessage} />
      ) : !file ? (
        <FileDropzone
          accept={tool.accept}
          multiple={false}
          onFilesSelected={(files) => setFile(files[0])}
          title="Choose an image to resize"
          description="Resize by exact pixels, percentage, or govt exam & passport presets"
        />
      ) : (
        <div className="max-w-2xl mx-auto p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 dark:text-slate-100 truncate text-sm">
                  {file.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {formatBytes(file.size)} • Original: {origWidth} × {origHeight} px
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline px-2"
            >
              Change
            </button>
          </div>

          {/* Mode Selector */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
            <button
              type="button"
              onClick={() => setMode('pixels')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'pixels'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Exact Pixels
            </button>
            <button
              type="button"
              onClick={() => setMode('percentage')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'percentage'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Percentage
            </button>
            <button
              type="button"
              onClick={() => setMode('presets')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'presets'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Exam &amp; Passport Presets
            </button>
          </div>

          {/* Mode Form */}
          {mode === 'pixels' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Width (px)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={width}
                    onChange={(e) => handleWidthChange(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Height (px)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={height}
                    onChange={(e) => handleHeightChange(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setKeepAspect(!keepAspect)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    keepAspect
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                      : 'border-slate-300 dark:border-slate-700 text-slate-500'
                  }`}
                >
                  {keepAspect ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  <span>Maintain Aspect Ratio ({origWidth}:{origHeight})</span>
                </button>
              </div>
            </div>
          )}

          {mode === 'percentage' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs">
                <label className="font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Scale Percentage
                </label>
                <span className="font-mono font-bold text-blue-600 text-sm">{percentage}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={200}
                value={percentage}
                onChange={(e) => setPercentage(Number(e.target.value))}
                className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
              />
              <div className="grid grid-cols-4 gap-2">
                {[25, 50, 75, 150].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPercentage(p)}
                    className={`py-1.5 rounded-lg border text-xs font-semibold ${
                      percentage === p
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950 text-blue-600'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {p}%
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                New dimensions: {Math.round(origWidth * (percentage / 100))} ×{' '}
                {Math.round(origHeight * (percentage / 100))} px
              </p>
            </div>
          )}

          {mode === 'presets' && (
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Click a Preset to Apply
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { name: 'Passport Photo (Standard)', size: '600 × 600 px', w: 600, h: 600, desc: '2x2 inch at 300 DPI' },
                  { name: 'Govt / SSC / UPSC Photo', size: '200 × 230 px', w: 200, h: 230, desc: '3.5 x 4.5 cm' },
                  { name: 'Signature Scan Upload', size: '140 × 60 px', w: 140, h: 60, desc: 'Standard exam form size' },
                  { name: 'Instagram Square', size: '1080 × 1080 px', w: 1080, h: 1080, desc: '1:1 ratio' },
                  { name: 'YouTube Thumbnail', size: '1280 × 720 px', w: 1280, h: 720, desc: '16:9 HD' },
                  { name: 'Twitter / X Header', size: '1500 × 500 px', w: 1500, h: 500, desc: '3:1 wide' },
                ].map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => applyPreset(item.w, item.h)}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 text-left transition-all group"
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 group-hover:text-blue-600">
                        {item.name}
                      </span>
                      <span className="font-mono text-[11px] font-bold text-blue-600">
                        {item.size}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Format */}
          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Output Format
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'JPG / JPEG', val: 'image/jpeg' },
                { label: 'PNG (Lossless)', val: 'image/png' },
                { label: 'WebP', val: 'image/webp' },
              ].map((fmt) => (
                <button
                  key={fmt.val}
                  type="button"
                  onClick={() => setOutputFormat(fmt.val as any)}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center ${
                    outputFormat === fmt.val
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {fmt.label}
                </button>
              ))}
            </div>
          </div>

          {errorMessage && (
            <div className="flex items-center gap-2 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              type="button"
              onClick={handleResize}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Scaling className="w-4 h-4" />
              <span>Resize Image</span>
            </button>
          </div>
        </div>
      )}
    </ToolLayout>
  );
};
