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
import { addWatermark, loadPdfJsDoc, bytesToBlob } from '../../utils/pdfHelper';
import { downloadBlob, revokeAllObjectUrls } from '../../utils/downloadHelper';
import { Stamp, FileText, AlertCircle } from 'lucide-react';
import { formatBytes } from '../../utils/formatters';

export const AddWatermarkPage: React.FC = () => {
  const tool = TOOLS.find((t) => t.id === 'add-watermark')!;
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [text, setText] = useState<string>('CONFIDENTIAL');
  const [fontSize, setFontSize] = useState<number>(44);
  const [opacity, setOpacity] = useState<number>(0.25);
  const [rotation, setRotation] = useState<number>(45);
  const [colorHex, setColorHex] = useState<string>('#ef4444');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultFilename, setResultFilename] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setTotalPages(0);
      return;
    }
    const loadInfo = async () => {
      try {
        const doc = await loadPdfJsDoc(file);
        setTotalPages(doc.numPages);
      } catch (err) {
        console.error('Failed to load PDF info', err);
      }
    };
    loadInfo();
  }, [file]);

  const handleClearAll = () => {
    revokeAllObjectUrls();
    setFile(null);
    setTotalPages(0);
    setResultBlob(null);
    setIsProcessing(false);
    setErrorMessage(null);
  };

  const handleApply = async () => {
    if (!file) return;
    if (!text.trim()) {
      setErrorMessage('Please enter watermark text.');
      return;
    }

    setIsProcessing(true);
    setProgress(10);
    setStatusMessage('Stamping text watermark on all pages...');
    setErrorMessage(null);

    try {
      const bytes = await addWatermark(
        file,
        {
          text,
          fontSize,
          opacity,
          rotation,
          colorHex,
          isBehind: false,
        },
        (pct, msg) => {
          setProgress(pct);
          setStatusMessage(msg);
        }
      );

      const blob = bytesToBlob(bytes);
      setResultBlob(blob);
      setResultFilename(`watermarked_${file.name}`);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to add watermark.');
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
          title="Watermark Applied!"
          details={`Stamped "${text}" across ${totalPages} pages.`}
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
          title="Choose a PDF to watermark"
          description="Add customizable security or branding watermarks across every page"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-slate-100 truncate text-sm">
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    {formatBytes(file.size)} • {totalPages} {totalPages === 1 ? 'page' : 'pages'}
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

            {/* Text input & quick chips */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Watermark Text
              </label>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter text (e.g. CONFIDENTIAL)"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold tracking-wider uppercase focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex flex-wrap gap-2 pt-1">
                {['CONFIDENTIAL', 'DRAFT', 'COPY ONLY', 'INTERNAL', 'SAMPLE'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setText(preset)}
                    className="px-2.5 py-1 rounded-lg text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Controls: Opacity, Size, Rotation */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <label className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Opacity ({Math.round(opacity * 100)}%)
                  </label>
                </div>
                <input
                  type="range"
                  min={0.05}
                  max={0.9}
                  step={0.05}
                  value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <label className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Font Size ({fontSize}pt)
                  </label>
                </div>
                <input
                  type="range"
                  min={18}
                  max={72}
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <label className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Rotation ({rotation}°)
                  </label>
                </div>
                <input
                  type="range"
                  min={-90}
                  max={90}
                  step={5}
                  value={rotation}
                  onChange={(e) => setRotation(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Color selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Watermark Color
              </label>
              <div className="flex items-center gap-2">
                {[
                  { hex: '#ef4444', label: 'Red' },
                  { hex: '#2563eb', label: 'Blue' },
                  { hex: '#475569', label: 'Slate' },
                  { hex: '#000000', label: 'Black' },
                  { hex: '#16a34a', label: 'Green' },
                ].map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setColorHex(c.hex)}
                    style={{ backgroundColor: c.hex }}
                    className={`w-7 h-7 rounded-full border-2 transition-all ${
                      colorHex === c.hex ? 'scale-110 border-blue-500 ring-2 ring-blue-500/20' : 'border-white dark:border-slate-700'
                    }`}
                    title={c.label}
                  />
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
                onClick={handleApply}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Stamp className="w-4 h-4" />
                <span>Apply Watermark to All {totalPages} Pages</span>
              </button>
            </div>
          </div>

          {/* Visual Preview */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Live Mockup Preview
            </span>

            <div className="relative w-52 aspect-[1/1.414] bg-white rounded-lg border-2 border-slate-300 shadow-lg p-3 flex flex-col justify-between overflow-hidden select-none">
              {/* Document background lines */}
              <div className="space-y-2 opacity-30 pointer-events-none">
                <div className="h-2 w-3/4 bg-slate-300 rounded" />
                <div className="h-1.5 w-full bg-slate-200 rounded" />
                <div className="h-1.5 w-5/6 bg-slate-200 rounded" />
                <div className="h-1.5 w-4/5 bg-slate-200 rounded" />
                <div className="h-1.5 w-full bg-slate-200 rounded" />
                <div className="h-1.5 w-3/4 bg-slate-200 rounded" />
              </div>

              {/* Centered Rotated Watermark */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span
                  style={{
                    color: colorHex,
                    opacity: opacity,
                    transform: `rotate(${rotation}deg)`,
                    fontSize: `${Math.max(12, Math.floor(fontSize * 0.4))}px`,
                  }}
                  className="font-extrabold uppercase tracking-widest whitespace-nowrap"
                >
                  {text || 'WATERMARK'}
                </span>
              </div>
            </div>

            <p className="text-xs text-center text-slate-500 dark:text-slate-400 max-w-xs">
              Live representation of watermark angle and opacity.
            </p>
          </div>
        </div>
      )}
    </ToolLayout>
  );
};
