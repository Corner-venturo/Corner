/**
 * ConfirmDialog - 統一的確認對話框組件
 * 用於刪除、警告、確認等操作
 */

'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, AlertTriangle, Info, Trash2 } from 'lucide-react';

export type ConfirmDialogType = 'danger' | 'warning' | 'info';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type?: ConfirmDialogType;
  title: string;
  message: string;
  details?: string[];
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
}

const TYPE_CONFIG = {
  danger: {
    icon: Trash2,
    iconColor: 'text-morandi-red',
    titleColor: 'text-morandi-red',
    buttonClass: 'bg-morandi-red hover:bg-morandi-red/90 text-white',
    detailsBg: 'bg-morandi-red/5 border-morandi-red/20',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-amber-500',
    titleColor: 'text-amber-600',
    buttonClass: 'bg-amber-500 hover:bg-amber-600 text-white',
    detailsBg: 'bg-amber-50 border-amber-200',
  },
  info: {
    icon: Info,
    iconColor: 'text-morandi-blue',
    titleColor: 'text-morandi-primary',
    buttonClass: 'bg-morandi-gold hover:bg-morandi-gold-hover text-white',
    detailsBg: 'bg-morandi-blue/5 border-morandi-blue/20',
  },
};

export function ConfirmDialog({
  open,
  onOpenChange,
  type = 'danger',
  title,
  message,
  details,
  confirmLabel = '確認',
  cancelLabel = '取消',
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDialogProps) {
  const config = TYPE_CONFIG[type];
  const Icon = config.icon;

  const handleConfirm = async () => {
    await onConfirm();
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className={`flex items-center gap-2 ${config.titleColor}`}>
            <Icon size={20} className={config.iconColor} />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-morandi-primary">{message}</p>

          {details && details.length > 0 && (
            <div className={`border rounded-lg p-3 ${config.detailsBg}`}>
              <ul className="space-y-1 text-sm text-morandi-secondary">
                {details.map((detail, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className={config.buttonClass}
          >
            {loading ? '處理中...' : confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
