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
import { rotatePdf, loadPdfJsDoc, bytesToBlob } from '../../utils/pdfHelper';
import { downloadBlob, revokeAllObjectUrls } from '../../utils/downloadHelper';
import { parsePageRanges, formatBytes } from '../../utils/formatters';
import { RotateCw, FileText, AlertCircle, Check } from 'lucide-react';

export const RotatePdfPage: React.FC = () => {
  const tool = TOOLS.find((t) => t.id === 'rotate-pdf')!;
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [angle, setAngle] = useState<number>(90);
  const [targetScope, setTargetScope] = useState<'all' | 'custom'>('all');
  const [pagesInput, setPagesInput] = useState('');
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
        console.error('Failed to load PDF doc', err);
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

  const handleRotate = async () => {
    if (!file) return;

    let selectedPages: number[] | undefined = undefined;
    if (targetScope === 'custom') {
      const parsed = parsePageRanges(pagesInput, totalPages);
      if (parsed.length === 0) {
        setErrorMessage('Please enter valid page numbers to rotate (e.g. 1, 3, 5-7).');
        return;
      }
      selectedPages = parsed;
    }

    setIsProcessing(true);
    setProgress(15);
    setStatusMessage('Rotating pages in browser memory...');
    setErrorMessage(null);

    try {
      const rotatedBytes = await rotatePdf(file, angle, selectedPages, (pct, msg) => {
        setProgress(pct);
        setStatusMessage(msg);
      });

      const blob = bytesToBlob(rotatedBytes);
      setResultBlob(blob);
      setResultFilename(`rotated_${angle}deg_${file.name}`);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to rotate PDF.');
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
          title="PDF Rotated Successfully!"
          details={`Rotated by ${angle}° (${targetScope === 'all' ? 'All pages' : pagesInput}).`}
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
          title="Choose a PDF to rotate"
          description="Rotate all pages or specific pages by 90°, 180°, or 270°"
        />
      ) : (
        <div className="max-w-2xl mx-auto p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          {/* File Header */}
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

          {/* Angle Selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Rotation Direction
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: '90° Clockwise', value: 90, icon: '↷' },
                { label: '180° Flip', value: 180, icon: '⤸' },
                { label: '270° (90° CCW)', value: 270, icon: '↶' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setAngle(opt.value)}
                  className={`p-4 rounded-2xl border text-center transition-all ${
                    angle === opt.value
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <span className="text-2xl block mb-1">{opt.icon}</span>
                  <span className="text-xs font-semibold block">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Scope selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Pages to Rotate
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTargetScope('all')}
                className={`p-3.5 rounded-xl border text-left flex items-center justify-between text-xs font-semibold ${
                  targetScope === 'all'
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <span>Rotate All Pages ({totalPages})</span>
                {targetScope === 'all' && <Check className="w-4 h-4 text-blue-600" />}
              </button>
              <button
                type="button"
                onClick={() => setTargetScope('custom')}
                className={`p-3.5 rounded-xl border text-left flex items-center justify-between text-xs font-semibold ${
                  targetScope === 'custom'
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <span>Specific Pages Only</span>
                {targetScope === 'custom' && <Check className="w-4 h-4 text-blue-600" />}
              </button>
            </div>

            {targetScope === 'custom' && (
              <div className="pt-2 space-y-1">
                <input
                  type="text"
                  value={pagesInput}
                  onChange={(e) => setPagesInput(e.target.value)}
                  placeholder="e.g. 1, 3, 5-8"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-mono focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[11px] text-slate-400">
                  Enter comma-separated page numbers or ranges between 1 and {totalPages}.
                </p>
              </div>
            )}
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
              onClick={handleRotate}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <RotateCw className="w-4 h-4" />
              <span>Rotate PDF by {angle}°</span>
            </button>
          </div>
        </div>
      )}
    </ToolLayout>
  );
};
