'use client';

import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Send, Smile, Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FilePreview } from './FilePreview';
import { UploadProgress } from './UploadProgress';
import { QuickActionMenu, createQuickActions, type QuickAction } from './QuickActionMenu';
import { validateFile } from './utils';

interface MessageInputProps {
  channelName: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  attachedFiles: File[];
  onFilesChange: (files: File[]) => void;
  uploadingFiles: boolean;
  uploadProgress: number;
  onShowShareOrders: () => void;
  onShowShareQuote: () => void;
  onShowNewPayment: () => void;
  onShowNewReceipt: () => void;
  onShowShareAdvance: () => void;
  onShowNewTask: () => void;
}

export function MessageInput({
  channelName,
  value,
  onChange,
  onSubmit,
  attachedFiles,
  onFilesChange,
  uploadingFiles,
  uploadProgress,
  onShowShareOrders,
  onShowShareQuote,
  onShowNewPayment,
  onShowNewReceipt,
  onShowShareAdvance,
  onShowNewTask
}: MessageInputProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLDivElement>(null);
  const quickMenuRef = useRef<HTMLDivElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles: File[] = [];
    const errors: string[] = [];

    files.forEach(file => {
      const validation = validateFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else if (validation.error) {
        errors.push(validation.error);
      }
    });

    if (errors.length > 0) {
      alert(errors.join('\n'));
    }

    if (validFiles.length > 0) {
      onFilesChange([...attachedFiles, ...validFiles]);
    }

    if (e.target) {
      e.target.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    onFilesChange(attachedFiles.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    const validFiles: File[] = [];
    const errors: string[] = [];

    files.forEach(file => {
      const validation = validateFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else if (validation.error) {
        errors.push(validation.error);
      }
    });

    if (errors.length > 0) {
      alert(errors.join('\n'));
    }

    if (validFiles.length > 0) {
      onFilesChange([...attachedFiles, ...validFiles]);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    const files: File[] = [];

    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === 'file') {
        const file = items[i].getAsFile();
        if (file) files.push(file);
      }
    }

    if (files.length > 0) {
      e.preventDefault();
      const validFiles: File[] = [];
      const errors: string[] = [];

      files.forEach(file => {
        const validation = validateFile(file);
        if (validation.valid) {
          validFiles.push(file);
        } else if (validation.error) {
          errors.push(validation.error);
        }
      });

      if (errors.length > 0) {
        alert(errors.join('\n'));
      }

      if (validFiles.length > 0) {
        onFilesChange([...attachedFiles, ...validFiles]);
      }
    }
  };

  const quickActions: QuickAction[] = createQuickActions({
    onShareOrders: () => {
      onShowShareOrders();
      setShowQuickMenu(false);
    },
    onShareQuote: () => {
      onShowShareQuote();
      setShowQuickMenu(false);
    },
    onNewPayment: () => {
      onShowNewPayment();
      setShowQuickMenu(false);
    },
    onNewReceipt: () => {
      onShowNewReceipt();
      setShowQuickMenu(false);
    },
    onShareAdvance: () => {
      onShowShareAdvance();
      setShowQuickMenu(false);
    },
    onNewTask: () => {
      onShowNewTask();
      setShowQuickMenu(false);
    },
    onUploadFile: () => {
      fileInputRef.current?.click();
      setShowQuickMenu(false);
    }
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (quickMenuRef.current && !quickMenuRef.current.contains(event.target as Node)) {
        setShowQuickMenu(false);
      }
    };

    if (showQuickMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showQuickMenu]);

  return (
    <div
      className={cn(
        "p-4 border-t border-morandi-gold/20 bg-morandi-container/5 shrink-0 transition-colors",
        isDragging && "bg-morandi-gold/10 border-morandi-gold"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <FilePreview files={attachedFiles} onRemove={handleRemoveFile} />

      <UploadProgress progress={uploadingFiles ? uploadProgress : 0} />

      <form onSubmit={onSubmit} className="flex gap-2">
        <div className="flex items-center gap-1 relative">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="w-9 h-9 text-morandi-secondary hover:text-morandi-gold hover:bg-morandi-gold/10"
            onClick={() => setShowQuickMenu(!showQuickMenu)}
          >
            <Plus size={18} />
          </Button>

          <QuickActionMenu
            ref={quickMenuRef}
            isOpen={showQuickMenu}
            actions={quickActions}
          />

          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
          />
        </div>

        <div
          className="flex-1 relative"
          ref={messageInputRef}
          onPaste={handlePaste}
        >
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`在 #${channelName} 中輸入訊息...`}
            className="pr-10 bg-white border-morandi-container"
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-morandi-secondary hover:text-morandi-gold transition-colors pointer-events-auto z-10"
          >
            <Smile size={16} />
          </button>
        </div>

        <Button
          type="submit"
          disabled={(!value.trim() && attachedFiles.length === 0) || uploadingFiles}
          className="bg-morandi-gold hover:bg-morandi-gold-hover text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploadingFiles ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send size={16} />
          )}
        </Button>
      </form>

      {isDragging && (
        <div className="absolute inset-0 flex items-center justify-center bg-morandi-gold/5 border-2 border-dashed border-morandi-gold rounded-lg pointer-events-none">
          <div className="text-center">
            <Paperclip size={32} className="mx-auto mb-2 text-morandi-gold" />
            <p className="text-morandi-gold font-medium">放開以上傳檔案</p>
          </div>
        </div>
      )}
    </div>
  );
}
