'use client';

import { create } from 'zustand';
import { AlertCircle, CheckCircle, Info, XCircle, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

type AlertType = 'info' | 'success' | 'warning' | 'error';

interface AlertState {
  isOpen: boolean;
  type: AlertType;
  title?: string;
  message: string;
  onClose?: () => void;
}

interface ConfirmState {
  isOpen: boolean;
  type: AlertType;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface DialogStore {
  alert: AlertState;
  confirm: ConfirmState;
  showAlert: (message: string, type?: AlertType, title?: string) => Promise<void>;
  showConfirm: (message: string, options?: {
    type?: AlertType;
    title?: string;
    confirmText?: string;
    cancelText?: string;
  }) => Promise<boolean>;
  closeAlert: () => void;
  closeConfirm: (confirmed: boolean) => void;
}

const useDialogStore = create<DialogStore>((set, get) => ({
  alert: {
    isOpen: false,
    type: 'info',
    message: '',
  },
  confirm: {
    isOpen: false,
    type: 'warning',
    message: '',
  },
  showAlert: (message, type = 'info', title) => {
    return new Promise((resolve) => {
      set({
        alert: {
          isOpen: true,
          type,
          title,
          message,
          onClose: () => {
            get().closeAlert();
            resolve();
          },
        },
      });
    });
  },
  showConfirm: (message, options = {}) => {
    return new Promise((resolve) => {
      set({
        confirm: {
          isOpen: true,
          type: options.type || 'warning',
          title: options.title,
          message,
          confirmText: options.confirmText || '確認',
          cancelText: options.cancelText || '取消',
          onConfirm: () => {
            get().closeConfirm(true);
            resolve(true);
          },
          onCancel: () => {
            get().closeConfirm(false);
            resolve(false);
          },
        },
      });
    });
  },
  closeAlert: () => {
    set((state) => ({
      alert: { ...state.alert, isOpen: false },
    }));
  },
  closeConfirm: (confirmed) => {
    set((state) => ({
      confirm: { ...state.confirm, isOpen: false },
    }));
  },
}));

const typeConfig: Record<AlertType, { icon: React.ReactNode; color: string; bgColor: string }> = {
  info: {
    icon: <Info className="h-6 w-6" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  success: {
    icon: <CheckCircle className="h-6 w-6" />,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  warning: {
    icon: <AlertTriangle className="h-6 w-6" />,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
  error: {
    icon: <XCircle className="h-6 w-6" />,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
};

function AlertDialogComponent() {
  const { alert, closeAlert } = useDialogStore();
  const config = typeConfig[alert.type];

  return (
    <Dialog open={alert.isOpen} onOpenChange={(open) => !open && closeAlert()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className={`${config.bgColor} ${config.color} p-2 rounded-lg`}>
              {config.icon}
            </div>
            <div className="flex-1">
              {alert.title && (
                <DialogTitle className="text-morandi-primary mb-2">
                  {alert.title}
                </DialogTitle>
              )}
              <DialogDescription className="text-morandi-secondary whitespace-pre-wrap">
                {alert.message}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter>
          <Button
            onClick={() => alert.onClose?.()}
            className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
          >
            確定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ConfirmDialogComponent() {
  const { confirm, closeConfirm } = useDialogStore();
  const config = typeConfig[confirm.type];

  return (
    <Dialog open={confirm.isOpen} onOpenChange={(open) => !open && confirm.onCancel?.()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className={`${config.bgColor} ${config.color} p-2 rounded-lg`}>
              {config.icon}
            </div>
            <div className="flex-1">
              {confirm.title && (
                <DialogTitle className="text-morandi-primary mb-2">
                  {confirm.title}
                </DialogTitle>
              )}
              <DialogDescription className="text-morandi-secondary whitespace-pre-wrap">
                {confirm.message}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => confirm.onCancel?.()}
            className="border-border hover:border-morandi-gold/20"
          >
            {confirm.cancelText}
          </Button>
          <Button
            onClick={() => confirm.onConfirm?.()}
            className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
          >
            {confirm.confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// 全局對話框容器
export function GlobalDialogs() {
  return (
    <>
      <AlertDialogComponent />
      <ConfirmDialogComponent />
    </>
  );
}

// 導出易用的 API
export const alert = (message: string, type: AlertType = 'info', title?: string) => {
  return useDialogStore.getState().showAlert(message, type, title);
};

export const confirm = (message: string, options?: {
  type?: AlertType;
  title?: string;
  confirmText?: string;
  cancelText?: string;
}) => {
  return useDialogStore.getState().showConfirm(message, options);
};

// 便捷方法
export const alertSuccess = (message: string, title?: string) => alert(message, 'success', title);
export const alertError = (message: string, title?: string) => alert(message, 'error', title);
export const alertWarning = (message: string, title?: string) => alert(message, 'warning', title);
export const alertInfo = (message: string, title?: string) => alert(message, 'info', title);
