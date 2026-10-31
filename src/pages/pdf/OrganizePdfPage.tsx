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
import { generatePdfThumbnails, organizePdf, bytesToBlob } from '../../utils/pdfHelper';
import { downloadBlob, revokeAllObjectUrls } from '../../utils/downloadHelper';
import {
  RotateCw,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Save,
  RotateCcw,
  AlertCircle,
  Copy,
} from 'lucide-react';
import { formatBytes } from '../../utils/formatters';

interface PageItem {
  id: string;
  originalIndex: number;
  displayNumber: number;
  rotation: number;
  dataUrl: string;
}

export const OrganizePdfPage: React.FC = () => {
  const tool = TOOLS.find((t) => t.id === 'organize-pdf')!;
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [initialPages, setInitialPages] = useState<PageItem[]>([]);
  const [isLoadingPages, setIsLoadingPages] = useState(false);
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
    setIsLoadingPages(true);
    setProgress(10);
    setStatusMessage('Generating page thumbnails...');
    setErrorMessage(null);

    try {
      const thumbs = await generatePdfThumbnails(selected, 120, (curr, total) => {
        setProgress(Math.round((curr / total) * 100));
        setStatusMessage(`Rendering page preview ${curr} of ${total}...`);
      });

      const loadedPages: PageItem[] = thumbs.map((t, idx) => ({
        id: `page-${idx}-${Date.now()}`,
        originalIndex: idx,
        displayNumber: idx + 1,
        rotation: 0,
        dataUrl: t.dataUrl,
      }));

      setPages(loadedPages);
      setInitialPages(loadedPages);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(
        err.message || 'Failed to read PDF pages. Please verify the file is not encrypted.'
      );
      setFile(null);
    } finally {
      setIsLoadingPages(false);
    }
  };

  const handleRotatePage = (index: number) => {
    setPages((prev) =>
      prev.map((p, i) => (i === index ? { ...p, rotation: (p.rotation + 90) % 360 } : p))
    );
  };

  const handleDeletePage = (index: number) => {
    if (pages.length <= 1) {
      setErrorMessage('A PDF document must retain at least one page.');
      return;
    }
    setErrorMessage(null);
    setPages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDuplicatePage = (index: number) => {
    const target = pages[index];
    const newPage: PageItem = {
      ...target,
      id: `copy-${Date.now()}-${Math.random()}`,
    };
    const next = [...pages];
    next.splice(index + 1, 0, newPage);
    setPages(next);
  };

  const handleMoveLeft = (index: number) => {
    if (index === 0) return;
    setPages((prev) => {
      const next = [...prev];
      const temp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  const handleMoveRight = (index: number) => {
    if (index === pages.length - 1) return;
    setPages((prev) => {
      const next = [...prev];
      const temp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  const handleRotateAll = () => {
    setPages((prev) =>
      prev.map((p) => ({
        ...p,
        rotation: (p.rotation + 90) % 360,
      }))
    );
  };

  const handleResetOrder = () => {
    setPages([...initialPages]);
    setErrorMessage(null);
  };

  const handleClearAll = () => {
    revokeAllObjectUrls();
    setFile(null);
    setPages([]);
    setInitialPages([]);
    setResultBlob(null);
    setIsProcessing(false);
    setIsLoadingPages(false);
    setErrorMessage(null);
  };

  const handleSave = async () => {
    if (!file || pages.length === 0) return;

    setIsProcessing(true);
    setProgress(15);
    setStatusMessage('Rebuilding PDF with your page order and rotations...');
    setErrorMessage(null);

    try {
      const orderPayload = pages.map((p) => ({
        originalIndex: p.originalIndex,
        rotation: p.rotation,
      }));

      const bytes = await organizePdf(file, orderPayload, (pct, msg) => {
        setProgress(pct);
        setStatusMessage(msg);
      });

      const blob = bytesToBlob(bytes);
      setResultBlob(blob);
      setResultFilename(`organized_${file.name}`);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to save organized PDF.');
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
          title="PDF Reorganized!"
          details={`Saved with ${pages.length} pages in your chosen order.`}
          onDownload={() => downloadBlob(resultBlob, resultFilename)}
          onReset={handleClearAll}
        />
      ) : isProcessing || isLoadingPages ? (
        <ProgressBar progress={progress} statusMessage={statusMessage} />
      ) : !file ? (
        <FileDropzone
          accept={tool.accept}
          multiple={false}
          onFilesSelected={handleFileSelected}
          title="Upload PDF to organize pages"
          description="View, reorder, rotate, or delete individual pages visually"
        />
      ) : (
        <div className="space-y-6">
          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {pages.length} Pages remaining
              </span>
              <span className="text-xs text-slate-400 font-mono">({formatBytes(file.size)})</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleRotateAll}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Rotate All 90°</span>
              </button>

              <button
                type="button"
                onClick={handleResetOrder}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md transition-all"
              >
                <Save className="w-4 h-4" />
                <span>Save PDF</span>
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="flex items-center gap-2 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Page Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {pages.map((p, idx) => (
              <div
                key={p.id}
                className="group relative flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 transition-all overflow-hidden p-3"
              >
                {/* Page Badge & Action Buttons */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                    #{idx + 1}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleRotatePage(idx)}
                      title="Rotate page 90 degrees"
                      className="p-1 rounded-md text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDuplicatePage(idx)}
                      title="Duplicate page"
                      className="p-1 rounded-md text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePage(idx)}
                      title="Delete page"
                      className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Thumbnail Display with Rotation */}
                <div className="relative aspect-[3/4] w-full bg-slate-50 dark:bg-slate-800/40 rounded-xl overflow-hidden flex items-center justify-center p-2 border border-slate-100 dark:border-slate-800/80">
                  <img
                    src={p.dataUrl}
                    alt={`Page ${idx + 1}`}
                    className="max-h-full max-w-full object-contain shadow-xs transition-transform duration-200"
                    style={{ transform: `rotate(${p.rotation}deg)` }}
                  />
                  {p.rotation !== 0 && (
                    <span className="absolute bottom-1 right-1 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-600 text-white shadow-xs">
                      {p.rotation}°
                    </span>
                  )}
                </div>

                {/* Reorder Buttons */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMoveLeft(idx)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 disabled:hover:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Move page left"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <span className="text-[10px] text-slate-400">Orig: #{p.originalIndex + 1}</span>
                  <button
                    type="button"
                    disabled={idx === pages.length - 1}
                    onClick={() => handleMoveRight(idx)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 disabled:hover:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Move page right"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center pt-4">
            <button
              type="button"
              onClick={handleSave}
              className="px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 flex items-center gap-2 transition-all"
            >
              <Save className="w-5 h-5" />
              <span>Save &amp; Download Organized PDF ({pages.length} Pages)</span>
            </button>
          </div>
        </div>
      )}
    </ToolLayout>
  );
};
