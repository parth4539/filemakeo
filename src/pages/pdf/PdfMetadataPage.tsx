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
import { readPdfMetadata, updatePdfMetadata, PdfMetadataValues } from '../../utils/pdfSecurityHelper';
import { bytesToBlob } from '../../utils/pdfHelper';
import { downloadBlob, revokeAllObjectUrls } from '../../utils/downloadHelper';
import { formatBytes } from '../../utils/formatters';
import { FileText, Save, Eraser, AlertCircle } from 'lucide-react';

export const PdfMetadataPage: React.FC = () => {
  const tool = TOOLS.find((t) => t.id === 'pdf-metadata')!;
  const [file, setFile] = useState<File | null>(null);
  const [meta, setMeta] = useState<PdfMetadataValues>({
    title: '',
    author: '',
    subject: '',
    keywords: [],
    creator: '',
    producer: '',
    pageCount: 0,
  });
  const [keywordsInput, setKeywordsInput] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultFilename, setResultFilename] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!file) return;
    setErrorMessage(null);
    readPdfMetadata(file)
      .then((info) => {
        setMeta(info);
        setKeywordsInput(info.keywords.join(', '));
      })
      .catch((err) => setErrorMessage(err?.message || 'Failed to read PDF metadata.'));
  }, [file]);

  const handleSave = async (stripAll = false) => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(45);
    setErrorMessage(null);

    try {
      const payload: PdfMetadataValues = stripAll
        ? { title: '', author: '', subject: '', keywords: [], creator: '', producer: '' }
        : {
            ...meta,
            keywords: keywordsInput
              .split(',')
              .map((k) => k.trim())
              .filter(Boolean),
          };

      const bytes = await updatePdfMetadata(file, payload);
      setProgress(100);
      setResultBlob(bytesToBlob(bytes));
      setResultFilename(stripAll ? `stripped_metadata_${file.name}` : `metadata_${file.name}`);
      setStatusNote(
        stripAll
          ? 'All identifiable Info dictionary metadata fields were scrubbed.'
          : 'Updated Title, Author, Subject, Keywords, Creator, and Producer tags.'
      );
    } catch (err: any) {
      setErrorMessage(err?.message || 'Could not update PDF metadata.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearAll = () => {
    revokeAllObjectUrls();
    setFile(null);
    setResultBlob(null);
    setErrorMessage(null);
    setKeywordsInput('');
  };

  return (
    <ToolLayout tool={tool} onClearFiles={handleClearAll} hasFiles={!!file || !!resultBlob}>
      {resultBlob ? (
        <DownloadResult
          filename={resultFilename}
          resultSize={resultBlob.size}
          originalSize={file?.size}
          title="PDF Metadata Updated!"
          details={statusNote}
          onDownload={() => downloadBlob(resultBlob, resultFilename)}
          onReset={handleClearAll}
        />
      ) : isProcessing ? (
        <ProgressBar progress={progress} statusMessage="Updating PDF properties dictionary..." />
      ) : !file ? (
        <FileDropzone
          accept={tool.accept}
          multiple={false}
          onFilesSelected={(files) => setFile(files[0])}
          title="Choose a PDF to view or edit metadata"
          description="Inspect hidden properties (Author, Title, Producer) or scrub all tags in one click"
        />
      ) : (
        <div className="max-w-2xl mx-auto p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 dark:text-slate-100 truncate text-sm">{file.name}</p>
                <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  {formatBytes(file.size)} &bull; {meta.pageCount || 1} pages
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Document Title
              </label>
              <input
                type="text"
                value={meta.title}
                onChange={(e) => setMeta((m) => ({ ...m, title: e.target.value }))}
                placeholder="e.g. Annual Financial Report 2026"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Author
              </label>
              <input
                type="text"
                value={meta.author}
                onChange={(e) => setMeta((m) => ({ ...m, author: e.target.value }))}
                placeholder="e.g. Jane Doe"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Subject
              </label>
              <input
                type="text"
                value={meta.subject}
                onChange={(e) => setMeta((m) => ({ ...m, subject: e.target.value }))}
                placeholder="e.g. Executive Summary"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Keywords (comma separated)
              </label>
              <input
                type="text"
                value={keywordsInput}
                onChange={(e) => setKeywordsInput(e.target.value)}
                placeholder="e.g. finance, tax, invoice"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Creator Application
              </label>
              <input
                type="text"
                value={meta.creator}
                onChange={(e) => setMeta((m) => ({ ...m, creator: e.target.value }))}
                placeholder="e.g. fileMakeR Studio"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                PDF Producer
              </label>
              <input
                type="text"
                value={meta.producer}
                onChange={(e) => setMeta((m) => ({ ...m, producer: e.target.value }))}
                placeholder="e.g. fileMakeR Engine"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {errorMessage && (
            <div className="flex items-center gap-2 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => handleSave(true)}
              className="px-4 py-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-semibold text-xs sm:text-sm transition-all flex items-center gap-2"
            >
              <Eraser className="w-4 h-4" />
              <span>Strip All Metadata &amp; Download</span>
            </button>

            <button
              type="button"
              onClick={() => handleSave(false)}
              className="px-7 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Save &amp; Download PDF</span>
            </button>
          </div>
        </div>
      )}
    </ToolLayout>
  );
};
