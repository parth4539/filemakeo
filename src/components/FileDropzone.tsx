/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { UploadCloud, FileType, AlertCircle } from 'lucide-react';
import { formatBytes } from '../utils/formatters';

interface FileDropzoneProps {
  accept: string[]; // e.g. ['.pdf'] or ['.jpg', '.png', '.webp']
  multiple?: boolean;
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
  title?: string;
  description?: string;
  className?: string;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  accept,
  multiple = false,
  onFilesSelected,
  maxFiles = 50,
  title,
  description,
  className = '',
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const acceptString = accept.join(',');

  const validateAndAddFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setErrorMessage(null);

    const validFiles: File[] = [];
    const filesArray = Array.from(fileList);

    for (const file of filesArray) {
      // Check 0-byte file edge case
      if (file.size === 0) {
        setErrorMessage(`"${file.name}" is an empty 0-byte file and cannot be processed.`);
        return;
      }

      // Check max size recommendation (150MB warning)
      if (file.size > 150 * 1024 * 1024) {
        setErrorMessage(
          `"${file.name}" is ${formatBytes(file.size)}. Files over 150MB may exceed browser memory limits.`
        );
      }

      // Check extension match
      const ext = `.${file.name.split('.').pop()?.toLowerCase()}`;
      const matchesType = accept.some((a) => {
        if (a.startsWith('.')) {
          return a.toLowerCase() === ext;
        }
        if (a.includes('/*')) {
          const prefix = a.split('/')[0];
          return file.type.startsWith(`${prefix}/`);
        }
        return file.type === a;
      });

      if (!matchesType && accept.length > 0) {
        setErrorMessage(
          `Invalid file format for "${file.name}". Please upload ${accept.filter((a) => a.startsWith('.')).join(', ')} files.`
        );
        return;
      }

      validFiles.push(file);
      if (!multiple) break;
    }

    if (validFiles.length > 0) {
      if (multiple && validFiles.length > maxFiles) {
        setErrorMessage(`Please select up to ${maxFiles} files at once.`);
        onFilesSelected(validFiles.slice(0, maxFiles));
      } else {
        onFilesSelected(validFiles);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    validateAndAddFiles(e.dataTransfer.files);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    validateAndAddFiles(e.target.files);
    // Reset input value so same file can be re-selected if removed
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        aria-label="File upload dropzone. Click or drag files here."
        className={`relative group cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-200 p-8 sm:p-12 flex flex-col items-center justify-center text-center ${
          isDragOver
            ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/30 scale-[1.01]'
            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/60 hover:border-blue-500 hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={acceptString}
          multiple={multiple}
          onChange={handleInputChange}
          className="hidden"
          aria-hidden="true"
        />

        <div className="w-16 h-16 mb-4 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/50 group-hover:scale-110 transition-transform duration-200 shadow-sm">
          <UploadCloud className="w-8 h-8" />
        </div>

        <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100 mb-1">
          {title || (multiple ? 'Choose or drop files here' : 'Choose or drop a file here')}
        </h3>

        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-4">
          {description ||
            `Supports ${accept.filter((a) => a.startsWith('.')).join(', ').toUpperCase()} files up to ~100 MB. Zero uploads.`}
        </p>

        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-md hover:shadow-lg transition-all">
          <FileType className="w-4 h-4" />
          <span>Select {multiple ? 'Files' : 'File'}</span>
        </div>
      </div>

      {errorMessage && (
        <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
