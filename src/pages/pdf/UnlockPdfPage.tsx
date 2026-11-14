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
import { unlockPdf, isPdfEncryptedFile } from '../../utils/pdfSecurityHelper';
import { bytesToBlob } from '../../utils/pdfHelper';
import { downloadBlob, revokeAllObjectUrls } from '../../utils/downloadHelper';
import { formatBytes } from '../../utils/formatters';
import { Unlock, Eye, EyeOff, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';

export const UnlockPdfPage: React.FC = () => {
  const tool = TOOLS.find((t) => t.id === 'unlock-pdf')!;
  const [file, setFile] = useState<File | null>(null);
  const [isEncrypted, setIsEncrypted] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultFilename, setResultFilename] = useState('');
  const [unlockedPages, setUnlockedPages] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setIsEncrypted(null);
      return;
    }
    setErrorMessage(null);
    isPdfEncryptedFile(file)
      .then((enc) => setIsEncrypted(enc))
      .catch((err) => setErrorMessage(err?.message || 'Could not inspect PDF file.'));
  }, [file]);

  const handleUnlock = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!file) return;
    if (isEncrypted && !password) {
      setErrorMessage('Please enter the PDF password to unlock this document.');
      return;
    }

    setIsProcessing(true);
    setProgress(45);
    setErrorMessage(null);

    try {
      const res = await unlockPdf(file, password);
      setProgress(100);
      const blob = bytesToBlob(res.bytes);
      setResultBlob(blob);
      setUnlockedPages(res.pageCount);
      setResultFilename(`unlocked_${file.name}`);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to unlock PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearAll = () => {
    revokeAllObjectUrls();
    setFile(null);
    setPassword('');
    setIsEncrypted(null);
    setResultBlob(null);
    setErrorMessage(null);
  };

  return (
    <ToolLayout tool={tool} onClearFiles={handleClearAll} hasFiles={!!file || !!resultBlob}>
      {resultBlob ? (
        <DownloadResult
          filename={resultFilename}
          resultSize={resultBlob.size}
          originalSize={file?.size}
          title="PDF Unlocked Successfully!"
          details={`Password protection permanently removed across ${unlockedPages} page(s).`}
          onDownload={() => downloadBlob(resultBlob, resultFilename)}
          onReset={handleClearAll}
        />
      ) : isProcessing ? (
        <ProgressBar progress={progress} statusMessage="Decrypting and rebuilding clean PDF..." />
      ) : !file ? (
        <FileDropzone
          accept={tool.accept}
          multiple={false}
          onFilesSelected={(files) => setFile(files[0])}
          title="Choose a password-protected PDF"
          description="Enter your password to permanently strip PDF open restrictions offline"
        />
      ) : (
        <form
          onSubmit={handleUnlock}
          className="max-w-xl mx-auto p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6"
        >
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 dark:text-slate-100 truncate text-sm">{file.name}</p>
                <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  {formatBytes(file.size)} &bull;{' '}
                  {isEncrypted === true ? 'Encrypted PDF' : isEncrypted === false ? 'Unencrypted PDF' : 'Checking...'}
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

          {isEncrypted === false && (
            <div className="flex items-start gap-2.5 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                This PDF has no open password lock. You can still click below to save a clean, normalized copy.
              </span>
            </div>
          )}

          {isEncrypted !== false && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Enter PDF Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter the password used to open this PDF..."
                  autoFocus
                  className="w-full px-4 py-3 pr-11 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label="Toggle password visibility"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
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
              type="submit"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Unlock className="w-4 h-4" />
              <span>Unlock &amp; Download PDF</span>
            </button>
          </div>
        </form>
      )}
    </ToolLayout>
  );
};
