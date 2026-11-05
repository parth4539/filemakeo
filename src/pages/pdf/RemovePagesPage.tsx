/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TOOLS } from '../../types/tool';
import { ToolLayout } from '../../components/ToolLayout';
import { FileDropzone } from '../../components/FileDropzone';
import { ProgressBar } from '../../components/ProgressBar';
import { DownloadResult } from '../../components/DownloadResult';
import { generatePdfThumbnails, removePages, bytesToBlob } from '../../utils/pdfHelper';
import { downloadBlob, revokeAllObjectUrls } from '../../utils/downloadHelper';
import { parsePageRanges, formatBytes } from '../../utils/formatters';
import { Trash2, AlertCircle } from 'lucide-react';

interface ThumbnailItem {
  pageNumber: number;
  dataUrl: string;
}

export const RemovePagesPage: React.FC = () => {
  const tool = TOOLS.find((t) => t.id === 'remove-pages')!;
  const [file, setFile] = useState<File | null>(null);
  const [thumbnails, setThumbnails] = useState<ThumbnailItem[]>([]);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [rangeInput, setRangeInput] = useState('');
  const [isLoadingThumbs, setIsLoadingThumbs] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultFilename, setResultFilename] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileSelected = async (files: File[]) => {
    const selected = files[0];
    if (!selected) return;

    setFile(selected);
    setIsLoadingThumbs(true);
    setProgress(10);
    setStatusMessage('Rendering page thumbnails in browser...');
    setErrorMessage(null);

    try {
      const thumbs = await generatePdfThumbnails(selected, 150, (curr, total) => {
        setProgress(Math.round((curr / total) * 100));
        setStatusMessage(`Rendering page ${curr} of ${total}...`);
      });

      setThumbnails(thumbs);
      setSelectedPages(new Set());
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to read PDF pages.');
      setFile(null);
    } finally {
      setIsLoadingThumbs(false);
    }
  };

  const togglePageSelection = (pageNumber: number) => {
    setSelectedPages((prev) => {
      const next = new Set(prev);
      if (next.has(pageNumber)) {
        next.delete(pageNumber);
      } else {
        next.add(pageNumber);
      }
      return next;
    });
  };

  const handleApplyRange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rangeInput.trim()) return;
    const parsed = parsePageRanges(rangeInput, thumbnails.length);
    setSelectedPages(new Set(parsed));
  };

  const selectOdd = () => {
    const odds = thumbnails.map((t) => t.pageNumber).filter((p) => p % 2 !== 0);
    setSelectedPages(new Set(odds));
  };

  const selectEven = () => {
    const evens = thumbnails.map((t) => t.pageNumber).filter((p) => p % 2 === 0);
    setSelectedPages(new Set(evens));
  };

  const clearSelection = () => {
    setSelectedPages(new Set());
    setRangeInput('');
  };

  const handleClearAll = () => {
    revokeAllObjectUrls();
    setFile(null);
    setThumbnails([]);
    setSelectedPages(new Set());
    setResultBlob(null);
    setIsProcessing(false);
    setIsLoadingThumbs(false);
    setErrorMessage(null);
  };

  const handleRemove = async () => {
    if (!file) return;

    if (selectedPages.size === 0) {
      setErrorMessage('Please select at least one page to remove.');
      return;
    }

    if (selectedPages.size >= thumbnails.length) {
      setErrorMessage('You cannot remove all pages. At least one page must remain in the PDF.');
      return;
    }

    setIsProcessing(true);
    setProgress(15);
    setStatusMessage('Removing selected pages in browser memory...');
    setErrorMessage(null);

    try {
      const pagesArray = Array.from(selectedPages);
      const newBytes = await removePages(file, pagesArray, (pct, msg) => {
        setProgress(pct);
        setStatusMessage(msg);
      });

      const blob = bytesToBlob(newBytes);
      setResultBlob(blob);
      setResultFilename(`trimmed_${file.name}`);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to remove pages.');
    } finally {
      setIsProcessing(false);
    }
  };

  const remainingCount = thumbnails.length - selectedPages.size;

  return (
    <ToolLayout tool={tool} onClearFiles={handleClearAll} hasFiles={!!file || !!resultBlob}>
      {resultBlob ? (
        <DownloadResult
          filename={resultFilename}
          resultSize={resultBlob.size}
          originalSize={file?.size}
          title="Pages Removed Successfully!"
          details={`Deleted ${selectedPages.size} pages. ${remainingCount} pages remaining.`}
          onDownload={() => downloadBlob(resultBlob, resultFilename)}
          onReset={handleClearAll}
        />
      ) : isProcessing || isLoadingThumbs ? (
        <ProgressBar progress={progress} statusMessage={statusMessage} />
      ) : !file ? (
        <FileDropzone
          accept={tool.accept}
          multiple={false}
          onFilesSelected={handleFileSelected}
          title="Upload PDF to remove pages"
          description="Click to select pages you want to delete or enter page ranges"
        />
      ) : (
        <div className="space-y-6">
          {/* Controls bar */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {selectedPages.size} pages marked for deletion • {remainingCount} remaining
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {file.name} ({formatBytes(file.size)})
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={selectOdd}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  Select Odd
                </button>
                <button
                  type="button"
                  onClick={selectEven}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  Select Even
                </button>
                {selectedPages.size > 0 && (
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  >
                    Clear Selection
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={selectedPages.size === 0 || remainingCount <= 0}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-xs shadow-md transition-all flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete {selectedPages.size} Pages</span>
                </button>
              </div>
            </div>

            {/* Quick Range input */}
            <form onSubmit={handleApplyRange} className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500 whitespace-nowrap">Or specify range:</span>
              <input
                type="text"
                value={rangeInput}
                onChange={(e) => setRangeInput(e.target.value)}
                placeholder="e.g. 2, 4-6"
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono w-40 focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                Apply Range
              </button>
            </form>
          </div>

          {errorMessage && (
            <div className="flex items-center gap-2 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Thumbnail Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {thumbnails.map((item) => {
              const isMarked = selectedPages.has(item.pageNumber);

              return (
                <div
                  key={item.pageNumber}
                  onClick={() => togglePageSelection(item.pageNumber)}
                  className={`group relative rounded-2xl cursor-pointer transition-all duration-150 p-2 border-2 flex flex-col items-center select-none ${
                    isMarked
                      ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/40 opacity-70'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-400 dark:hover:border-slate-600 shadow-sm'
                  }`}
                >
                  <div className="w-full flex items-center justify-between mb-1.5 px-1">
                    <span
                      className={`text-[11px] font-bold font-mono px-1.5 py-0.5 rounded ${
                        isMarked
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      #{item.pageNumber}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {isMarked ? 'Delete' : 'Keep'}
                    </span>
                  </div>

                  <div className="relative aspect-[3/4] w-full bg-slate-100 dark:bg-slate-800/40 rounded-xl overflow-hidden flex items-center justify-center p-1.5">
                    <img
                      src={item.dataUrl}
                      alt={`Page ${item.pageNumber}`}
                      className="max-h-full max-w-full object-contain"
                    />

                    {isMarked && (
                      <div className="absolute inset-0 bg-rose-600/30 flex items-center justify-center backdrop-blur-[0.5px]">
                        <div className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg">
                          <Trash2 className="w-4 h-4" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-center pt-4">
            <button
              type="button"
              onClick={handleRemove}
              disabled={selectedPages.size === 0 || remainingCount <= 0}
              className="px-8 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-semibold text-sm shadow-lg shadow-rose-500/25 flex items-center gap-2 transition-all"
            >
              <Trash2 className="w-5 h-5" />
              <span>Remove {selectedPages.size} Selected Pages</span>
            </button>
          </div>
        </div>
      )}
    </ToolLayout>
  );
};
