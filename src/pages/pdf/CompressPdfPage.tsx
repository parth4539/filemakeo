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
import { compressPdf, loadPdfJsDoc, bytesToBlob } from '../../utils/pdfHelper';
import { downloadBlob, revokeAllObjectUrls } from '../../utils/downloadHelper';
import { formatBytes } from '../../utils/formatters';
import { Minimize2, FileText, AlertCircle, AlertTriangle, Sparkles, Check } from 'lucide-react';

export const CompressPdfPage: React.FC = () => {
  const tool = TOOLS.find((t) => t.id === 'compress-pdf')!;
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [level, setLevel] = useState<'low' | 'medium' | 'high'>('medium');
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

  const handleCompress = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(5);
    setStatusMessage('Preparing in-browser compression pipeline...');
    setErrorMessage(null);

    try {
      const compressedBytes = await compressPdf(file, level, (pct, msg) => {
        setProgress(pct);
        setStatusMessage(msg);
      });

      const blob = bytesToBlob(compressedBytes);
      setResultBlob(blob);
      setResultFilename(`compressed_${file.name}`);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(
        err.message || 'Failed to compress PDF. Please check if the file is encrypted or corrupted.'
      );
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
          title="PDF Compressed Successfully!"
          details={`Processed ${totalPages} pages at ${level.toUpperCase()} compression.`}
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
          title="Choose a heavy PDF to compress"
          description="Reduce file size significantly for email and government portal uploads"
        />
      ) : (
        <div className="max-w-2xl mx-auto p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          {/* File Card */}
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
                  Original: {formatBytes(file.size)} • {totalPages} {totalPages === 1 ? 'page' : 'pages'}
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

          {/* Compression Level Selector */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Select Compression Level
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Low */}
              <button
                type="button"
                onClick={() => setLevel('low')}
                className={`p-4 rounded-2xl border text-left transition-all relative ${
                  level === 'low'
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm">Low</span>
                  {level === 'low' && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                </div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  High Quality
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Gentle compression. Best for retaining fine text and printing.
                </p>
              </button>

              {/* Medium */}
              <button
                type="button"
                onClick={() => setLevel('medium')}
                className={`p-4 rounded-2xl border text-left transition-all relative ${
                  level === 'medium'
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <span className="absolute -top-2.5 right-3 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-600 text-white shadow-xs">
                  Recommended
                </span>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm">Medium</span>
                  {level === 'medium' && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                </div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Good Quality &amp; Size
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Balanced compromise. Great for sharing via email or chat.
                </p>
              </button>

              {/* High */}
              <button
                type="button"
                onClick={() => setLevel('high')}
                className={`p-4 rounded-2xl border text-left transition-all relative ${
                  level === 'high'
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm">High</span>
                  {level === 'high' && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                </div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Maximum Savings
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Smallest possible size. Best for strict file upload quotas.
                </p>
              </button>
            </div>
          </div>

          {/* User Warning for High Compression */}
          {level === 'high' && (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 text-xs">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <p className="font-bold">High Compression Notice</p>
                <p className="mt-0.5 text-amber-800 dark:text-amber-300 leading-relaxed">
                  High compression rasterizes pages into optimized JPEG streams to achieve maximum size reduction. Text will remain visually sharp for reading, but will no longer be selectable as text.
                </p>
              </div>
            </div>
          )}

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
              <Minimize2 className="w-4 h-4" />
              <span>Compress PDF ({level.toUpperCase()})</span>
            </button>
          </div>
        </div>
      )}
    </ToolLayout>
  );
};
