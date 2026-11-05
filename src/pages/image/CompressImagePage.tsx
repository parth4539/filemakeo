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
import { compressImage, compressToTargetSize, getImageDimensions } from '../../utils/imageHelper';
import { downloadBlob, revokeAllObjectUrls } from '../../utils/downloadHelper';
import { formatBytes } from '../../utils/formatters';
import { FileDown, Image as ImageIcon, AlertCircle, Sparkles, Check } from 'lucide-react';

export const CompressImagePage: React.FC = () => {
  const tool = TOOLS.find((t) => t.id === 'compress-image')!;
  const [file, setFile] = useState<File | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [mode, setMode] = useState<'target' | 'quality'>('target');
  const [targetKb, setTargetKb] = useState<number>(50);
  const [quality, setQuality] = useState<number>(75);
  const [outputFormat, setOutputFormat] = useState<'image/jpeg' | 'image/webp'>('image/jpeg');

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultDataUrl, setResultDataUrl] = useState<string>('');
  const [resultFilename, setResultFilename] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setDimensions(null);
      return;
    }
    getImageDimensions(file)
      .then((dim) => setDimensions(dim))
      .catch((err) => console.error('Error getting image dimensions:', err));
  }, [file]);

  const handleClearAll = () => {
    revokeAllObjectUrls();
    setFile(null);
    setDimensions(null);
    setResultBlob(null);
    setResultDataUrl('');
    setIsProcessing(false);
    setErrorMessage(null);
  };

  const handleCompress = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(15);
    setStatusMessage('Compressing image in browser memory...');
    setErrorMessage(null);

    try {
      const ext = outputFormat === 'image/jpeg' ? 'jpg' : 'webp';
      const base = file.name.replace(/\.[^/.]+$/, '');

      if (mode === 'target') {
        setStatusMessage(`Auto-searching optimal quality for < ${targetKb} KB...`);
        const targetBytes = targetKb * 1024;
        const res = await compressToTargetSize(file, targetBytes, outputFormat, (p) => {
          setProgress(p);
        });
        setResultBlob(res.blob);
        setResultDataUrl(res.dataUrl);
        setResultFilename(`${base}_under_${targetKb}kb.${ext}`);
      } else {
        const factor = quality / 100;
        const res = await compressImage(file, factor, outputFormat);
        setResultBlob(res.blob);
        setResultDataUrl(res.dataUrl);
        setResultFilename(`${base}_compressed_q${quality}.${ext}`);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to compress image.');
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
          title="Image Compressed Successfully!"
          details={
            mode === 'target'
              ? `Optimized to ${formatBytes(resultBlob.size)} (Target: < ${targetKb} KB). Perfect for govt & exam forms!`
              : `Compressed with quality ${quality}%.`
          }
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
          title="Choose an image to compress"
          description="Supports JPG, PNG, WebP. Compress with quality slider or target size mode for Indian government forms."
        />
      ) : (
        <div className="max-w-2xl mx-auto p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          {/* File Card */}
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
                  {formatBytes(file.size)} {dimensions ? `• ${dimensions.width}×${dimensions.height} px` : ''}
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

          {/* Mode Tabs */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Compression Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMode('target')}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  mode === 'target'
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm">Target Size Mode</span>
                  {mode === 'target' && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Auto-searches quality to stay strictly under a specific KB limit (Govt forms, UPSC, Passport).
                </p>
              </button>

              <button
                type="button"
                onClick={() => setMode('quality')}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  mode === 'quality'
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm">Manual Quality Slider</span>
                  {mode === 'quality' && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select an exact visual quality percentage between 1% and 100%.
                </p>
              </button>
            </div>
          </div>

          {/* Mode Controls */}
          {mode === 'target' ? (
            <div className="space-y-4 p-4 rounded-2xl bg-blue-50/40 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-blue-950 dark:text-blue-200">
                  Target Size Limit (KB)
                </span>
              </div>

              {/* Quick Preset Buttons for Govt portals */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: '< 20 KB', desc: 'Signatures', val: 20 },
                  { label: '< 50 KB', desc: 'Govt Exam / SSC', val: 50 },
                  { label: '< 100 KB', desc: 'Passport Portal', val: 100 },
                  { label: '< 200 KB', desc: 'Job Applications', val: 200 },
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => setTargetKb(item.val)}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      targetKb === item.val
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                    }`}
                  >
                    <span className="block font-bold text-xs">{item.label}</span>
                    <span
                      className={`block text-[10px] ${
                        targetKb === item.val ? 'text-blue-100' : 'text-slate-400'
                      }`}
                    >
                      {item.desc}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                  Custom Target:
                </span>
                <input
                  type="number"
                  min={5}
                  max={5000}
                  value={targetKb}
                  onChange={(e) => setTargetKb(Math.max(5, parseInt(e.target.value, 10) || 50))}
                  className="w-28 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold"
                />
                <span className="text-xs text-slate-500">KB</span>
              </div>
            </div>
          ) : (
            <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-center text-xs">
                <label className="font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Quality Percentage
                </label>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">
                  {quality}%
                </span>
              </div>
              <input
                type="range"
                min={5}
                max={100}
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>5% (Smallest file)</span>
                <span>75% (Balanced)</span>
                <span>100% (Maximum quality)</span>
              </div>
            </div>
          )}

          {/* Output Format */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Output Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setOutputFormat('image/jpeg')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                  outputFormat === 'image/jpeg'
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                JPG / JPEG (Standard for forms)
              </button>
              <button
                type="button"
                onClick={() => setOutputFormat('image/webp')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                  outputFormat === 'image/webp'
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                WebP (Modern high-efficiency)
              </button>
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
              onClick={handleCompress}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <FileDown className="w-4 h-4" />
              <span>
                {mode === 'target'
                  ? `Compress to < ${targetKb} KB`
                  : `Compress Image (${quality}%)`}
              </span>
            </button>
          </div>
        </div>
      )}
    </ToolLayout>
  );
};
