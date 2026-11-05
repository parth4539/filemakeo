/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { Download, CheckCircle2, RotateCcw, Archive, FileText, Image as ImageIcon, ArrowDownRight } from 'lucide-react';
import { formatBytes, calculateSavings } from '../utils/formatters';
import { recordOperation } from '../utils/metricsManager';
import { AdSlot } from './AdSlot';

interface DownloadResultProps {
  filename: string;
  blob?: Blob;
  dataUrl?: string;
  originalSize?: number;
  resultSize?: number;
  previewUrl?: string;
  isImage?: boolean;
  zipBlob?: Blob;
  zipFilename?: string;
  onDownload: () => void;
  onDownloadZip?: () => void;
  onReset: () => void;
  title?: string;
  details?: string;
}

export const DownloadResult: React.FC<DownloadResultProps> = ({
  filename,
  resultSize,
  originalSize,
  previewUrl,
  isImage = false,
  zipBlob,
  zipFilename = 'converted_files.zip',
  onDownload,
  onDownloadZip,
  onReset,
  title = 'Your file is ready!',
  details,
}) => {
  const savings = originalSize && resultSize ? calculateSavings(originalSize, resultSize) : null;

  useEffect(() => {
    const toolId = window.location.pathname.replace('/', '') || 'general';
    recordOperation(toolId, resultSize || originalSize || 0);
  }, [resultSize, originalSize]);

  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-800/60 shadow-sm">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{title}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {details || 'Completed safely in your browser. No files were uploaded or logged.'}
          </p>
        </div>

        {/* Compression / Size comparison card */}
        {savings && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-medium">Before</p>
              <p className="text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-300 font-mono mt-0.5">
                {formatBytes(originalSize!)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-medium">After</p>
              <p className="text-sm sm:text-base font-bold text-blue-600 dark:text-blue-400 font-mono mt-0.5">
                {formatBytes(resultSize!)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-medium">Saved</p>
              <div className="inline-flex items-center gap-0.5 text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                {savings.isSmaller && <ArrowDownRight className="w-4 h-4" />}
                <span>{savings.isSmaller ? `${savings.percent}%` : '0%'}</span>
              </div>
            </div>
          </div>
        )}

        {/* File info when no comparison */}
        {!savings && resultSize && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300">
            {isImage ? <ImageIcon className="w-4 h-4 text-blue-500" /> : <FileText className="w-4 h-4 text-rose-500" />}
            <span className="truncate max-w-xs">{filename}</span>
            <span className="text-slate-400 dark:text-slate-500 font-mono text-xs">({formatBytes(resultSize)})</span>
          </div>
        )}

        {/* Preview thumbnail if available */}
        {previewUrl && (
          <div className="max-w-xs mx-auto overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm max-h-56 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <img src={previewUrl} alt="Result Preview" className="object-contain max-h-52 w-auto" />
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={onDownload}
            className="w-full flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold text-base shadow-lg shadow-blue-500/25 transition-all"
          >
            <Download className="w-5 h-5" />
            <span>Download {filename}</span>
          </button>

          {zipBlob && onDownloadZip && (
            <button
              type="button"
              onClick={onDownloadZip}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800 font-medium text-sm transition-all"
            >
              <Archive className="w-4 h-4" />
              <span>Download All as ZIP ({zipFilename})</span>
            </button>
          )}

          <button
            type="button"
            onClick={onReset}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60 font-medium text-sm transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Process Another File</span>
          </button>
        </div>
      </div>

      {/* Ad slot placed below results container */}
      <AdSlot slotId="ad-slot-below-results" label="Results Page Advertisement" />
    </div>
  );
};
