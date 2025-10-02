import { useState, useCallback } from 'react';

interface DialogState<T = unknown> {
  isOpen: boolean;
  type: string | null;
  data: T | null;
  meta?: unknown;
}

export function useDialog<T = unknown>() {
  const [dialog, setDialog] = useState<DialogState<T>>({
    isOpen: false,
    type: null,
    data: null,
    meta: undefined
  });

  const openDialog = useCallback((type: string, data?: T, meta?: unknown) => {
    setDialog({
      isOpen: true,
      type,
      data: data || null,
      meta
    });
  }, []);

  const closeDialog = useCallback(() => {
    setDialog({
      isOpen: false,
      type: null,
      data: null,
      meta: undefined
    });
  }, []);

  const updateDialogData = useCallback((data: Partial<T>) => {
    setDialog(prev => ({
      ...prev,
      data: prev.data ? { ...prev.data, ...data } : data as T
    }));
  }, []);

  return {
    dialog,
    openDialog,
    closeDialog,
    updateDialogData,
    isOpen: dialog.isOpen,
    dialogType: dialog.type,
    dialogData: dialog.data,
    dialogMeta: dialog.meta
  };
}

// 使用範例：
// const { dialog, openDialog, closeDialog } = useDialog<Tour>();
// openDialog('edit', tourData);
// openDialog('create');
// openDialog('delete', tourData, { confirmMessage: '確定要刪除嗎？' });