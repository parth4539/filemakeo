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
import { addPageNumbers, loadPdfJsDoc, bytesToBlob } from '../../utils/pdfHelper';
import { downloadBlob, revokeAllObjectUrls } from '../../utils/downloadHelper';
import { Hash, FileText, AlertCircle, Check } from 'lucide-react';
import { formatBytes } from '../../utils/formatters';

type Position =
  | 'bottom-center'
  | 'bottom-right'
  | 'bottom-left'
  | 'top-center'
  | 'top-right'
  | 'top-left';

export const AddPageNumbersPage: React.FC = () => {
  const tool = TOOLS.find((t) => t.id === 'add-page-numbers')!;
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [position, setPosition] = useState<Position>('bottom-center');
  const [format, setFormat] = useState<string>('Page {n}');
  const [startNumber, setStartNumber] = useState<number>(1);
  const [fontSize, setFontSize] = useState<number>(11);
  const [margin, setMargin] = useState<number>(25);
  const [colorHex, setColorHex] = useState<string>('#334155');
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

    setIsProcessing(true);
    setProgress(10);
    setStatusMessage('Stamping page numbers in browser...');
    setErrorMessage(null);

    try {
      const bytes = await addPageNumbers(
        file,
        {
          position,
          startNumber,
          format,
          fontSize,
          margin,
          colorHex,
        },
        (pct, msg) => {
          setProgress(pct);
          setStatusMessage(msg);
        }
      );

      const blob = bytesToBlob(bytes);
      setResultBlob(blob);
      setResultFilename(`numbered_${file.name}`);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to add page numbers.');
    } finally {
      setIsProcessing(false);
    }
  };

  const samplePreviewText = format
    .replace('{n}', startNumber.toString())
    .replace('{total}', (startNumber + (totalPages || 10) - 1).toString());

  return (
    <ToolLayout tool={tool} onClearFiles={handleClearAll} hasFiles={!!file || !!resultBlob}>
      {resultBlob ? (
        <DownloadResult
          filename={resultFilename}
          resultSize={resultBlob.size}
          originalSize={file?.size}
          title="Page Numbers Applied!"
          details={`Added page numbers across ${totalPages} pages starting at ${startNumber}.`}
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
          title="Choose a PDF to number"
          description="Add customizable page numbers with position, start index, and format control"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings Column */}
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

            {/* Position Picker */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Position on Page
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'top-left', label: 'Top Left' },
                  { id: 'top-center', label: 'Top Center' },
                  { id: 'top-right', label: 'Top Right' },
                  { id: 'bottom-left', label: 'Bottom Left' },
                  { id: 'bottom-center', label: 'Bottom Center' },
                  { id: 'bottom-right', label: 'Bottom Right' },
                ].map((pos) => (
                  <button
                    key={pos.id}
                    type="button"
                    onClick={() => setPosition(pos.id as Position)}
                    className={`py-3 px-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                      position === pos.id
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Format & Start Index */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Numbering Format
                </label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium"
                >
                  <option value="Page {n}">Page &#123;n&#125; (e.g. Page 1)</option>
                  <option value="Page {n} of {total}">Page &#123;n&#125; of &#123;total&#125; (e.g. Page 1 of 12)</option>
                  <option value="{n}">&#123;n&#125; (e.g. 1)</option>
                  <option value="{n} of {total}">&#123;n&#125; of &#123;total&#125; (e.g. 1 of 12)</option>
                  <option value="- {n} -">- &#123;n&#125; - (e.g. - 1 -)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  First Number
                </label>
                <input
                  type="number"
                  min={1}
                  value={startNumber}
                  onChange={(e) => setStartNumber(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-mono"
                />
              </div>
            </div>

            {/* Font & Color */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Font Size ({fontSize}pt)
                </label>
                <input
                  type="range"
                  min={8}
                  max={20}
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Margin from Edge ({margin}pt)
                </label>
                <input
                  type="range"
                  min={10}
                  max={50}
                  value={margin}
                  onChange={(e) => setMargin(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Color
                </label>
                <div className="flex items-center gap-2 pt-1">
                  {['#334155', '#000000', '#2563eb', '#dc2626'].map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => setColorHex(hex)}
                      style={{ backgroundColor: hex }}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${
                        colorHex === hex ? 'scale-110 border-blue-500 ring-2 ring-blue-500/20' : 'border-white dark:border-slate-700'
                      }`}
                    />
                  ))}
                </div>
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
                <Hash className="w-4 h-4" />
                <span>Apply to All {totalPages} Pages</span>
              </button>
            </div>
          </div>

          {/* Live Mockup Preview Column */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Live Placement Preview
            </span>

            <div className="relative w-52 aspect-[1/1.414] bg-white rounded-lg border-2 border-slate-300 shadow-lg p-3 flex flex-col justify-between text-slate-400 select-none">
              {/* Fake doc lines */}
              <div className="space-y-2 opacity-30 pointer-events-none">
                <div className="h-2 w-3/4 bg-slate-300 rounded" />
                <div className="h-1.5 w-full bg-slate-200 rounded" />
                <div className="h-1.5 w-5/6 bg-slate-200 rounded" />
                <div className="h-1.5 w-4/5 bg-slate-200 rounded" />
              </div>

              {/* Number element positioned based on chosen state */}
              <div
                className={`absolute transition-all duration-200 font-mono font-medium ${
                  position.includes('top') ? 'top-3' : 'bottom-3'
                } ${
                  position.includes('left')
                    ? 'left-3 text-left'
                    : position.includes('right')
                    ? 'right-3 text-right'
                    : 'left-1/2 -translate-x-1/2 text-center'
                }`}
                style={{ color: colorHex, fontSize: `${Math.max(10, fontSize)}px` }}
              >
                {samplePreviewText}
              </div>
            </div>

            <p className="text-xs text-center text-slate-500 dark:text-slate-400 max-w-xs">
              Preview of page #{startNumber}. Will be applied to all {totalPages} pages identically.
            </p>
          </div>
        </div>
      )}
    </ToolLayout>
  );
};
