/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { TOOLS } from '../../types/tool';
import { ToolLayout } from '../../components/ToolLayout';
import { FileDropzone } from '../../components/FileDropzone';
import { ProgressBar } from '../../components/ProgressBar';
import { DownloadResult } from '../../components/DownloadResult';
import {
  createZipFromEntries,
  inspectZipArchiveBytes,
  extractSingleZipEntry,
  ZipEntryInfo,
} from '../../utils/zipHelper';
import { downloadBlob, revokeAllObjectUrls } from '../../utils/downloadHelper';
import { formatBytes } from '../../utils/formatters';
import { Archive, FolderPlus, Trash2, Download, File as FileIcon, AlertCircle } from 'lucide-react';

export const ZipArchivePage: React.FC = () => {
  const tool = TOOLS.find((t) => t.id === 'zip-archive')!;
  const [activeTab, setActiveTab] = useState<'create' | 'extract'>('create');

  // Create ZIP state
  const [filesToZip, setFilesToZip] = useState<{ path: string; file: File }[]>([]);
  const [archiveName, setArchiveName] = useState('archive.zip');
  const [compressionLevel, setCompressionLevel] = useState<number>(6);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);

  // Extract ZIP state
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [zipBuffer, setZipBuffer] = useState<ArrayBuffer | null>(null);
  const [entries, setEntries] = useState<ZipEntryInfo[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const folderInputRef = useRef<HTMLInputElement>(null);

  const addFilesForZip = (selected: File[]) => {
    setErrorMessage(null);
    setFilesToZip((prev) => {
      const next = [...prev];
      for (const f of selected) {
        const relPath = (f as any).webkitRelativePath || f.name;
        if (!next.some((item) => item.path === relPath && item.file.size === f.size)) {
          next.push({ path: relPath, file: f });
        }
      }
      return next;
    });
  };

  const handleBuildZip = async () => {
    if (filesToZip.length === 0) return;
    setIsProcessing(true);
    setProgress(10);
    setErrorMessage(null);

    try {
      const zipBytes = await createZipFromEntries(
        filesToZip.map((f) => ({ path: f.path, data: f.file })),
        {
          compressionLevel,
          onProgress: (pct) => setProgress(pct),
        }
      );
      const blob = new Blob([zipBytes as any], { type: 'application/zip' });
      setResultBlob(blob);
      setProgress(100);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Could not build ZIP archive.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleZipSelected = async (selected: File[]) => {
    const f = selected[0];
    if (!f) return;
    setErrorMessage(null);
    setZipFile(f);
    try {
      const buf = await f.arrayBuffer();
      setZipBuffer(buf);
      const info = await inspectZipArchiveBytes(buf);
      setEntries(info.entries);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to read ZIP archive.');
      setEntries([]);
    }
  };

  const handleExtractEntry = async (entry: ZipEntryInfo) => {
    if (!zipBuffer) return;
    try {
      const bytes = await extractSingleZipEntry(zipBuffer, entry.path);
      const blob = new Blob([bytes as any], { type: 'application/octet-stream' });
      downloadBlob(blob, entry.name);
    } catch (err: any) {
      setErrorMessage(err?.message || `Could not extract ${entry.name}`);
    }
  };

  const handleExtractAll = async () => {
    if (!zipBuffer || entries.length === 0) return;
    for (const entry of entries) {
      await handleExtractEntry(entry);
    }
  };

  const handleClearAll = () => {
    revokeAllObjectUrls();
    setFilesToZip([]);
    setResultBlob(null);
    setZipFile(null);
    setZipBuffer(null);
    setEntries([]);
    setErrorMessage(null);
  };

  const totalInputBytes = filesToZip.reduce((acc, f) => acc + f.file.size, 0);
  const safeArchiveName = (archiveName.trim() || 'archive').replace(/\.zip$/i, '') + '.zip';

  return (
    <ToolLayout
      tool={tool}
      onClearFiles={handleClearAll}
      hasFiles={filesToZip.length > 0 || !!resultBlob || !!zipFile}
    >
      <div className="space-y-6">
        <div className="flex justify-center">
          <div className="inline-flex p-1 rounded-xl bg-slate-200/70 dark:bg-slate-800 text-xs sm:text-sm font-semibold">
            <button
              type="button"
              onClick={() => {
                setActiveTab('create');
                setErrorMessage(null);
              }}
              className={`px-5 py-2.5 rounded-lg transition-all ${
                activeTab === 'create'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Create ZIP Archive
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('extract');
                setErrorMessage(null);
              }}
              className={`px-5 py-2.5 rounded-lg transition-all ${
                activeTab === 'extract'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Inspect &amp; Extract ZIP
            </button>
          </div>
        </div>

        {activeTab === 'create' ? (
          resultBlob ? (
            <DownloadResult
              filename={safeArchiveName}
              resultSize={resultBlob.size}
              originalSize={totalInputBytes}
              title="ZIP Archive Created!"
              details={`Compressed ${filesToZip.length} file(s) locally into a portable .zip archive.`}
              onDownload={() => downloadBlob(resultBlob, safeArchiveName)}
              onReset={handleClearAll}
            />
          ) : isProcessing ? (
            <ProgressBar progress={progress} statusMessage="Compressing files into ZIP archive..." />
          ) : (
            <div className="space-y-6">
              <FileDropzone
                accept={[]}
                multiple={true}
                maxFiles={200}
                onFilesSelected={addFilesForZip}
                title="Drop any files to bundle into a ZIP"
                description="Documents, photos, code, PDFs — packed with DEFLATE compression directly in browser RAM"
              />

              <div className="flex justify-center">
                <input
                  ref={folderInputRef}
                  type="file"
                  {...({ webkitdirectory: '', directory: '' } as any)}
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) addFilesForZip(Array.from(e.target.files));
                    e.target.value = '';
                  }}
                />
                <button
                  type="button"
                  onClick={() => folderInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-blue-500 text-xs font-semibold shadow-xs"
                >
                  <FolderPlus className="w-4 h-4 text-blue-600" />
                  <span>Or Add Entire Folder</span>
                </button>
              </div>

              {filesToZip.length > 0 && (
                <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Queued Files ({filesToZip.length}) &bull;{' '}
                      <span className="font-mono text-slate-500">{formatBytes(totalInputBytes)}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setFilesToZip([])}
                      className="text-xs font-semibold text-rose-600 hover:underline"
                    >
                      Clear Queue
                    </button>
                  </div>

                  <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl">
                    {filesToZip.map((item, idx) => (
                      <div
                        key={`${item.path}-${idx}`}
                        className="flex items-center justify-between px-4 py-2.5 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <span className="truncate font-medium text-slate-800 dark:text-slate-200">
                            {item.path}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-mono text-slate-500">{formatBytes(item.file.size)}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setFilesToZip((prev) => prev.filter((_, i) => i !== idx))
                            }
                            className="text-rose-500 hover:text-rose-700"
                            aria-label={`Remove ${item.path}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Archive Filename
                      </label>
                      <input
                        type="text"
                        value={archiveName}
                        onChange={(e) => setArchiveName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Compression Level
                      </label>
                      <select
                        value={compressionLevel}
                        onChange={(e) => setCompressionLevel(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                      >
                        <option value={0}>Store Only (0 - Fastest, Zero Compression)</option>
                        <option value={3}>Fast DEFLATE (3)</option>
                        <option value={6}>Balanced DEFLATE (6 - Recommended)</option>
                        <option value={9}>Maximum DEFLATE (9 - Smallest File)</option>
                      </select>
                    </div>
                  </div>

                  {errorMessage && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleBuildZip}
                      className="px-7 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow flex items-center gap-2"
                    >
                      <Archive className="w-4 h-4" />
                      <span>Create &amp; Download ZIP</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        ) : !zipFile ? (
          <FileDropzone
            accept={['.zip', 'application/zip', 'application/x-zip-compressed']}
            multiple={false}
            onFilesSelected={handleZipSelected}
            title="Choose a .ZIP archive to inspect & extract"
            description="View contents, inspect file sizes, and extract individual files without uploading"
          />
        ) : (
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <div>
                <p className="font-semibold text-sm">{zipFile.name}</p>
                <p className="text-xs font-mono text-slate-500">
                  {formatBytes(zipFile.size)} &bull; {entries.length} file(s) inside
                </p>
              </div>
              <div className="flex items-center gap-2">
                {entries.length > 0 && (
                  <button
                    type="button"
                    onClick={handleExtractAll}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download All ({entries.length})</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-xs font-semibold text-rose-600 hover:underline px-2"
                >
                  Change ZIP
                </button>
              </div>
            </div>

            {errorMessage && (
              <div className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {entries.length === 0 && !errorMessage ? (
              <p className="text-center text-sm text-slate-500 py-8">This ZIP archive is empty.</p>
            ) : (
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {entries.map((entry) => (
                    <div
                      key={entry.path}
                      className="flex items-center justify-between px-4 py-3 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        <span className="truncate font-mono text-slate-800 dark:text-slate-200">
                          {entry.path}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-mono text-slate-500">
                          {entry.uncompressedSize ? formatBytes(entry.uncompressedSize) : '—'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleExtractEntry(entry)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white font-semibold transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Extract</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </ToolLayout>
  );
};
