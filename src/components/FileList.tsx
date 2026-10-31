/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FileText, Image as ImageIcon, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { formatBytes } from '../utils/formatters';

interface FileListProps {
  files: File[];
  onRemove: (index: number) => void;
  onMoveUp?: (index: number) => void;
  onMoveDown?: (index: number) => void;
  allowReorder?: boolean;
}

export const FileList: React.FC<FileListProps> = ({
  files,
  onRemove,
  onMoveUp,
  onMoveDown,
  allowReorder = false,
}) => {
  if (files.length === 0) return null;

  const totalBytes = files.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
        <span>Selected Files ({files.length})</span>
        <span>Total: {formatBytes(totalBytes)}</span>
      </div>

      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {files.map((file, index) => {
          const isPdf = file.name.toLowerCase().endsWith('.pdf');

          return (
            <div
              key={`${file.name}-${file.size}-${index}`}
              className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all"
            >
              <div className="flex items-center gap-3 min-w-0 pr-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isPdf
                      ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
                      : 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
                  }`}
                >
                  {isPdf ? <FileText className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    {formatBytes(file.size)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                {allowReorder && onMoveUp && (
                  <button
                    type="button"
                    onClick={() => onMoveUp(index)}
                    disabled={index === 0}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Move up"
                    aria-label={`Move ${file.name} up`}
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                )}

                {allowReorder && onMoveDown && (
                  <button
                    type="button"
                    onClick={() => onMoveDown(index)}
                    disabled={index === files.length - 1}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Move down"
                    aria-label={`Move ${file.name} down`}
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  title="Remove file"
                  aria-label={`Remove ${file.name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
