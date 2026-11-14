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
import { protectPdf, isPdfEncryptedFile } from '../../utils/pdfSecurityHelper';
import { bytesToBlob } from '../../utils/pdfHelper';
import { downloadBlob, revokeAllObjectUrls } from '../../utils/downloadHelper';
import { formatBytes } from '../../utils/formatters';
import { Lock, Eye, EyeOff, Shield, FileText, AlertCircle } from 'lucide-react';

export const ProtectPdfPage: React.FC = () => {
  const tool = TOOLS.find((t) => t.id === 'protect-pdf')!;
  const [file, setFile] = useState<File | null>(null);
  const [alreadyEncrypted, setAlreadyEncrypted] = useState(false);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const [allowPrint, setAllowPrint] = useState(true);
  const [allowCopy, setAllowCopy] = useState(false);
  const [allowModify, setAllowModify] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultFilename, setResultFilename] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setAlreadyEncrypted(false);
      return;
    }
    setErrorMessage(null);
    isPdfEncryptedFile(file)
      .then((enc) => {
        setAlreadyEncrypted(enc);
        if (enc) {
          setErrorMessage(
            'This PDF is already password-protected. Please unlock it first using Unlock PDF before applying a new password.'
          );
        }
      })
      .catch((err) => setErrorMessage(err?.message || 'Invalid PDF file.'));
  }, [file]);

  const strengthScore = (() => {
    let s = 0;
    if (password.length >= 6) s++;
    if (password.length >= 10) s++;
    if (/[A-Z]/.test(password) && /[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  })();

  const handleProtect = async () => {
    if (!file || alreadyEncrypted) return;
    if (!password.trim()) {
      setErrorMessage('Please enter a password to lock this PDF.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter carefully.');
      return;
    }

    setIsProcessing(true);
    setProgress(40);
    setErrorMessage(null);

    try {
      const encryptedBytes = await protectPdf(file, {
        userPassword: password,
        ownerPassword: ownerPassword.trim() || password,
        permissions: {
          printing: allowPrint ? 'highResolution' : false,
          copying: allowCopy,
          modifying: allowModify,
        },
      });
      setProgress(100);
      const blob = bytesToBlob(encryptedBytes);
      setResultBlob(blob);
      setResultFilename(`protected_${file.name}`);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to encrypt PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearAll = () => {
    revokeAllObjectUrls();
    setFile(null);
    setPassword('');
    setConfirmPassword('');
    setOwnerPassword('');
    setAlreadyEncrypted(false);
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
          title="PDF Encrypted & Protected!"
          details="Anyone opening this PDF will now be prompted for your password."
          onDownload={() => downloadBlob(resultBlob, resultFilename)}
          onReset={handleClearAll}
        />
      ) : isProcessing ? (
        <ProgressBar progress={progress} statusMessage="Encrypting PDF structure in browser memory..." />
      ) : !file ? (
        <FileDropzone
          accept={tool.accept}
          multiple={false}
          onFilesSelected={(files) => setFile(files[0])}
          title="Choose a PDF to password-protect"
          description="Add RC4/AES encryption password and configure print or copy permissions offline"
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
                <p className="text-xs font-mono text-slate-500 dark:text-slate-400">{formatBytes(file.size)}</p>
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

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Document Open Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter strong password..."
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
              {password && (
                <div className="flex items-center gap-2 pt-1">
                  <div className="flex-1 grid grid-cols-4 gap-1 h-1.5">
                    {[1, 2, 3, 4].map((lvl) => (
                      <div
                        key={lvl}
                        className={`rounded-full ${
                          strengthScore >= lvl
                            ? strengthScore >= 3
                              ? 'bg-emerald-500'
                              : strengthScore === 2
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                            : 'bg-slate-200 dark:bg-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {strengthScore >= 3 ? 'Strong' : strengthScore === 2 ? 'Medium' : 'Weak'}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Confirm Password
              </label>
              <input
                type={showPass ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password..."
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Owner Permissions Password (Optional)
              </label>
              <input
                type={showPass ? 'text' : 'password'}
                value={ownerPassword}
                onChange={(e) => setOwnerPassword(e.target.value)}
                placeholder="Defaults to same open password if left blank"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                <Shield className="w-3.5 h-3.5 text-blue-600" />
                <span>Document Restrictions</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowPrint}
                    onChange={(e) => setAllowPrint(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600"
                  />
                  <span>Allow Printing</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowCopy}
                    onChange={(e) => setAllowCopy(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600"
                  />
                  <span>Allow Copying Text</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowModify}
                    onChange={(e) => setAllowModify(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600"
                  />
                  <span>Allow Modifying</span>
                </label>
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
              onClick={handleProtect}
              disabled={alreadyEncrypted || !password.trim()}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>Encrypt &amp; Download PDF</span>
            </button>
          </div>
        </div>
      )}
    </ToolLayout>
  );
};
