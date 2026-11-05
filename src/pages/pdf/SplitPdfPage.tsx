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
import { splitPdf, loadPdfJsDoc, bytesToBlob } from '../../utils/pdfHelper';
import { downloadBlob, createZipBlob, revokeAllObjectUrls } from '../../utils/downloadHelper';
import { Split, AlertCircle, FileText, Check } from 'lucide-react';
import { formatBytes } from '../../utils/formatters';

export const SplitPdfPage: React.FC = () => {
  const tool = TOOLS.find((t) => t.id === 'split-pdf')!;
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [mode, setMode] = useState<'range' | 'all'>('range');
  const [rangeInput, setRangeInput] = useState('1-2');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [results, setResults] = useState<{ name: string; blob: Blob }[]>([]);
  const [zipBlob, setZipBlob] = useState<Blob | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load page count when file is selected
  useEffect(() => {
    if (!file) {
      setTotalPages(0);
      return;
    }
    const loadInfo = async () => {
      try {
        const doc = await loadPdfJsDoc(file);
        setTotalPages(doc.numPages);
        if (doc.numPages > 1) {
          setRangeInput(`1-${Math.min(3, doc.numPages)}`);
        } else {
          setRangeInput('1');
        }
      } catch (err) {
        console.error('Failed to load PDF info:', err);
      }
    };
    loadInfo();
  }, [file]);

  const handleClearAll = () => {
    revokeAllObjectUrls();
    setFile(null);
    setTotalPages(0);
    setResults([]);
    setZipBlob(null);
    setIsProcessing(false);
    setErrorMessage(null);
  };

  const handleSplit = async () => {
    if (!file) return;

    if (mode === 'range' && !rangeInput.trim()) {
      setErrorMessage('Please enter a valid page range (e.g. 1-3, 5).');
      return;
    }

    setIsProcessing(true);
    setProgress(10);
    setStatusMessage('Splitting PDF in browser...');
    setErrorMessage(null);

    try {
      const generated = await splitPdf(file, mode, rangeInput, (pct, msg) => {
        setProgress(pct);
        setStatusMessage(msg);
      });

      const converted = generated.map((item) => ({
        name: item.name,
        blob: bytesToBlob(item.data),
      }));

      setResults(converted);

      if (converted.length > 1) {
        setStatusMessage('Creating ZIP archive...');
        const zip = await createZipBlob(converted);
        setZipBlob(zip);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to split PDF. Please check page numbers.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ToolLayout tool={tool} onClearFiles={handleClearAll} hasFiles={!!file || results.length > 0}>
      {results.length > 0 ? (
        <div className="space-y-6">
          <DownloadResult
            filename={results[0].name}
            resultSize={results[0].blob.size}
            originalSize={file?.size}
            title={results.length > 1 ? `Split into ${results.length} PDFs!` : 'PDF Split Complete!'}
            details={`Extracted pages from ${file?.name}.`}
            zipBlob={zipBlob || undefined}
            zipFilename={`${file?.name.replace(/\.[^/.]+$/, '')}_split.zip`}
            onDownload={() => downloadBlob(results[0].blob, results[0].name)}
            onDownloadZip={
              zipBlob
                ? () => downloadBlob(zipBlob, `${file?.name.replace(/\.[^/.]+$/, '')}_split.zip`)
                : undefined
            }
            onReset={handleClearAll}
          />

          {results.length > 1 && (
            <div className="max-w-xl mx-auto p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
                Individual Files ({results.length})
              </h4>
              <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                {results.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-rose-500 flex-shrink-0" />
                      <span className="truncate font-medium text-slate-700 dark:text-slate-300">
                        {item.name}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => downloadBlob(item.blob, item.name)}
                      className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium flex-shrink-0 ml-2"
                    >
                      Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : isProcessing ? (
        <ProgressBar progress={progress} statusMessage={statusMessage} />
      ) : (
        <div className="space-y-6">
          {!file ? (
            <FileDropzone
              accept={tool.accept}
              multiple={false}
              onFilesSelected={(files) => setFile(files[0])}
              title="Choose a PDF to split"
              description="Upload a single PDF to extract pages or divide by ranges"
            />
          ) : (
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
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
                      {formatBytes(file.size)} • {totalPages || '...'} {totalPages === 1 ? 'page' : 'pages'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline px-2"
                >
                  Change File
                </button>
              </div>

              {/* Mode Selection */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Split Mode
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMode('range')}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      mode === 'range'
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">Split by Page Ranges</span>
                      {mode === 'range' && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Extract custom ranges (e.g. 1-3, 5, 7-9).
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('all')}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      mode === 'all'
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">Extract All Pages</span>
                      {mode === 'all' && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Save every single page as its own individual PDF.
                    </p>
                  </button>
                </div>
              </div>

              {/* Range Input */}
              {mode === 'range' && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Page Ranges to Extract
                    </label>
                    <span className="text-slate-400">Total pages: {totalPages}</span>
                  </div>
                  <input
                    type="text"
                    value={rangeInput}
                    onChange={(e) => setRangeInput(e.target.value)}
                    placeholder="e.g. 1-3, 5, 7-9"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Use commas to separate ranges or single pages. Example: &ldquo;1-3, 5, 7-9&rdquo; will create distinct PDFs for each range.
                  </p>
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
                  onClick={handleSplit}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Split className="w-4 h-4" />
                  <span>{mode === 'all' ? `Extract All ${totalPages} Pages` : 'Split PDF Range'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </ToolLayout>
  );
};
