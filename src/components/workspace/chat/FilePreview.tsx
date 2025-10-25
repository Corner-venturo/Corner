'use client';

import { X, FileText, Image as ImageIcon } from 'lucide-react';
import { formatFileSize } from './utils';

interface FilePreviewProps {
  files: File[];
  onRemove: (index: number) => void;
}

export function FilePreview({ files, onRemove }: FilePreviewProps) {
  if (files.length === 0) return null;

  return (
    <div className="mb-3 flex flex-wrap gap-2">
      {files.map((file, index) => {
        const isImage = file.type.startsWith('image/');
        return (
          <div
            key={index}
            className="relative bg-white border border-morandi-container rounded-lg p-2 pr-8 flex items-center gap-2 max-w-xs"
          >
            {isImage ? (
              <ImageIcon size={16} className="text-morandi-gold shrink-0" />
            ) : (
              <FileText size={16} className="text-morandi-secondary shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-morandi-primary truncate">{file.name}</p>
              <p className="text-xs text-morandi-secondary">{formatFileSize(file.size)}</p>
            </div>
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-morandi-secondary hover:text-morandi-red transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
