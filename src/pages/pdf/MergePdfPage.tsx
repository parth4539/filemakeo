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
import { mergePdfs, bytesToBlob } from '../../utils/pdfHelper';
import { downloadBlob, revokeAllObjectUrls } from '../../utils/downloadHelper';
import { Files, AlertCircle } from 'lucide-react';

export const MergePdfPage: React.FC = () => {
  const tool = TOOLS.find((t) => t.id === 'merge-pdf')!;
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultFilename, setResultFilename] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFilesSelected = (newFiles: File[]) => {
    setErrorMessage(null);
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setFiles((prev) => {
      const next = [...prev];
      const temp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  const handleMoveDown = (index: number) => {
    if (index === files.length - 1) return;
    setFiles((prev) => {
      const next = [...prev];
      const temp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  const handleClearAll = () => {
    revokeAllObjectUrls();
    setFiles([]);
    setResultBlob(null);
    setIsProcessing(false);
    setErrorMessage(null);
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      setErrorMessage('Please add at least 2 PDF files to merge.');
      return;
    }

    setIsProcessing(true);
    setProgress(5);
    setStatusMessage('Reading PDF documents in browser memory...');
    setErrorMessage(null);

    try {
      const mergedBytes = await mergePdfs(files, (pct, msg) => {
        setProgress(pct);
        setStatusMessage(msg);
      });

      const blob = bytesToBlob(mergedBytes);
      setResultBlob(blob);
      setResultFilename(`merged_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(
        err.message || 'Failed to merge PDFs. Please check if any file is corrupted or password-protected.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const totalOriginalBytes = files.reduce((acc, f) => acc + f.size, 0);

  return (
    <ToolLayout tool={tool} onClearFiles={handleClearAll} hasFiles={files.length > 0 || !!resultBlob}>
      {resultBlob ? (
        <DownloadResult
          filename={resultFilename}
          resultSize={resultBlob.size}
          originalSize={totalOriginalBytes}
          title="PDFs Merged Successfully!"
          details={`Combined ${files.length} documents into one clean PDF.`}
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
            title="Drop multiple PDFs here"
            description="Select 2 or more PDF documents to combine into a single file"
          />

          {errorMessage && (
            <div className="flex items-center gap-2 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {files.length > 0 && (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <FileList
                files={files}
                onRemove={handleRemoveFile}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
                allowReorder={true}
              />

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Tip: Use the arrow buttons to adjust the sequence of documents before merging.
                </span>

                <button
                  type="button"
                  onClick={handleMerge}
                  disabled={files.length < 2}
                  className="w-full sm:w-auto px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Files className="w-4 h-4" />
                  <span>Merge {files.length} PDFs</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </ToolLayout>
  );
};
