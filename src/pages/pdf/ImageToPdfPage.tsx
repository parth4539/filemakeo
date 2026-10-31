/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TOOLS } from '../../types/tool';
import { ToolLayout } from '../../components/ToolLayout';
import { FileDropzone } from '../../components/FileDropzone';
import { FileList } from '../../components/FileList';
import { ProgressBar } from '../../components/ProgressBar';
import { DownloadResult } from '../../components/DownloadResult';
import { imagesToPdf, bytesToBlob } from '../../utils/pdfHelper';
import { downloadBlob, revokeAllObjectUrls } from '../../utils/downloadHelper';
import { Image as ImageIcon, FileText, AlertCircle, ArrowUp, ArrowDown } from 'lucide-react';
import { formatBytes } from '../../utils/formatters';

export const ImageToPdfPage: React.FC = () => {
  const tool = TOOLS.find((t) => t.id === 'image-to-pdf')!;
  const [images, setImages] = useState<File[]>([]);
  const [pageSize, setPageSize] = useState<'A4' | 'Letter' | 'Fit'>('A4');
  const [orientation, setOrientation] = useState<'auto' | 'portrait' | 'landscape'>('auto');
  const [margin, setMargin] = useState<number>(15);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultFilename, setResultFilename] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFilesSelected = (newFiles: File[]) => {
    setErrorMessage(null);
    setImages((prev) => [...prev, ...newFiles]);
  };

  const handleRemove = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setImages((prev) => {
      const next = [...prev];
      const temp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  const handleMoveDown = (index: number) => {
    if (index === images.length - 1) return;
    setImages((prev) => {
      const next = [...prev];
      const temp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  const handleClearAll = () => {
    revokeAllObjectUrls();
    setImages([]);
    setResultBlob(null);
    setIsProcessing(false);
    setErrorMessage(null);
  };

  const handleConvert = async () => {
    if (images.length === 0) return;

    setIsProcessing(true);
    setProgress(10);
    setStatusMessage('Converting images to PDF in browser...');
    setErrorMessage(null);

    try {
      const pdfBytes = await imagesToPdf(
        images.map((f) => ({ file: f })),
        { pageSize, margin, orientation },
        (pct, msg) => {
          setProgress(pct);
          setStatusMessage(msg);
        }
      );

      const blob = bytesToBlob(pdfBytes);
      setResultBlob(blob);
      setResultFilename(`images_converted_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to convert images to PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  const totalImageBytes = images.reduce((acc, f) => acc + f.size, 0);

  return (
    <ToolLayout tool={tool} onClearFiles={handleClearAll} hasFiles={images.length > 0 || !!resultBlob}>
      {resultBlob ? (
        <DownloadResult
          filename={resultFilename}
          resultSize={resultBlob.size}
          originalSize={totalImageBytes}
          title="Images Converted to PDF!"
          details={`Created a ${pageSize} PDF document with ${images.length} images.`}
          onDownload={() => downloadBlob(resultBlob, resultFilename)}
          onReset={handleClearAll}
        />
      ) : isProcessing ? (
        <ProgressBar progress={progress} statusMessage={statusMessage} />
      ) : (
        <div className="space-y-6">
          <FileDropzone
            accept={tool.accept}
            multiple={true}
            onFilesSelected={handleFilesSelected}
            title="Choose or drop images here"
            description="Supports JPG, PNG, and WebP photos. Add multiple and reorder them."
          />

          {errorMessage && (
            <div className="flex items-center gap-2 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {images.length > 0 && (
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <FileList
                files={images}
                onRemove={handleRemove}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
                allowReorder={true}
              />

              {/* Options Panel */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Page Size */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Page Format
                  </label>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                  >
                    <option value="A4">A4 (Standard 210 × 297 mm)</option>
                    <option value="Letter">US Letter (8.5 × 11 in)</option>
                    <option value="Fit">Fit to Image Size</option>
                  </select>
                </div>

                {/* Orientation */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Orientation
                  </label>
                  <select
                    value={orientation}
                    disabled={pageSize === 'Fit'}
                    onChange={(e) => setOrientation(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm disabled:opacity-40"
                  >
                    <option value="auto">Auto (Match Image)</option>
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                  </select>
                </div>

                {/* Margins */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Page Margin
                  </label>
                  <select
                    value={margin}
                    onChange={(e) => setMargin(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                  >
                    <option value="0">No Margin (Border to Border)</option>
                    <option value="15">Small Margin (15 pt)</option>
                    <option value="30">Big Margin (30 pt)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={handleConvert}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Convert {images.length} {images.length === 1 ? 'Image' : 'Images'} to PDF</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </ToolLayout>
  );
};
