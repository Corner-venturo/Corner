/**
 * useDialogState Hook
 *
 * 統一管理多個 Dialog 的開啟/關閉狀態
 * 適用於需要管理多個獨立 Dialog 的組件
 *
 * @example
 * ```tsx
 * const DIALOG_KEYS = ['createOrder', 'editOrder', 'deleteOrder'] as const;
 * type DialogKey = typeof DIALOG_KEYS[number];
 *
 * function MyComponent() {
 *   const { isOpen, open, close, toggle } = useDialogState<DialogKey>(DIALOG_KEYS);
 *
 *   return (
 *     <>
 *       <Button onClick={() => open('createOrder')}>新增訂單</Button>
 *       <Dialog open={isOpen('createOrder')} onOpenChange={() => toggle('createOrder')}>
 *         {/* Dialog content *\/}
 *       </Dialog>
 *     </>
 *   );
 * }
 * ```
 */

import { useState, useCallback } from 'react';

export interface UseDialogStateReturn<K extends string> {
  /**
   * 檢查指定 Dialog 是否開啟
   */
  isOpen: (key: K) => boolean;

  /**
   * 開啟指定 Dialog
   */
  open: (key: K) => void;

  /**
   * 關閉指定 Dialog
   */
  close: (key: K) => void;

  /**
   * 切換指定 Dialog 的開啟/關閉狀態
   */
  toggle: (key: K) => void;

  /**
   * 關閉所有 Dialog
   */
  closeAll: () => void;

  /**
   * 取得所有開啟的 Dialog keys
   */
  getOpenDialogs: () => K[];
}

/**
 * Dialog 狀態管理 Hook
 *
 * @param keys - Dialog key 陣列（建議使用 const assertion）
 * @returns Dialog 狀態管理方法
 */
export function useDialogState<K extends string>(
  keys: readonly K[]
): UseDialogStateReturn<K> {
  const [openDialogs, setOpenDialogs] = useState<Set<K>>(new Set());

  const isOpen = useCallback(
    (key: K): boolean => {
      return openDialogs.has(key);
    },
    [openDialogs]
  );

  const open = useCallback((key: K) => {
    setOpenDialogs(prev => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  }, []);

  const close = useCallback((key: K) => {
    setOpenDialogs(prev => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }, []);

  const toggle = useCallback((key: K) => {
    setOpenDialogs(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const closeAll = useCallback(() => {
    setOpenDialogs(new Set());
  }, []);

  const getOpenDialogs = useCallback((): K[] => {
    return Array.from(openDialogs);
  }, [openDialogs]);

  return {
    isOpen,
    open,
    close,
    toggle,
    closeAll,
    getOpenDialogs,
  };
}

/**
 * useDialogState 的替代方案：使用物件狀態
 * 適用於需要儲存額外資料的情況
 *
 * @example
 * ```tsx
 * interface DialogState {
 *   createOrder: boolean;
 *   editOrder: { isOpen: boolean; orderId?: string };
 *   deleteOrder: boolean;
 * }
 *
 * const [dialogs, setDialogs] = useState<DialogState>({
 *   createOrder: false,
 *   editOrder: { isOpen: false },
 *   deleteOrder: false,
 * });
 *
 * const toggleDialog = (key: keyof DialogState) => {
 *   setDialogs(prev => ({
 *     ...prev,
 *     [key]: typeof prev[key] === 'boolean' ? !prev[key] : { ...prev[key], isOpen: !prev[key].isOpen }
 *   }));
 * };
 * ```
 */
