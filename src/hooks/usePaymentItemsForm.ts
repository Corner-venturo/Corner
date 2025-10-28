import { useState, useCallback, useMemo } from 'react';

/**
 * 付款項目介面
 */
export interface PaymentItem {
  id: string;
  payment_method: '現金' | '匯款' | '刷卡' | '支票' | '其他';
  amount: number;
  bank_account_id?: string;
  check_number?: string;
  card_last_four?: string;
  notes?: string;
}

/**
 * Hook 返回值介面
 */
export interface UsePaymentItemsFormReturn {
  paymentItems: PaymentItem[];
  addPaymentItem: () => void;
  removePaymentItem: (id: string) => void;
  updatePaymentItem: (id: string, updates: Partial<PaymentItem>) => void;
  resetForm: () => void;
  totalAmount: number;
  setPaymentItems: (items: PaymentItem[]) => void;
}

/**
 * 創建預設付款項目
 */
function createDefaultPaymentItem(): PaymentItem {
  return {
    id: `payment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    payment_method: '現金',
    amount: 0,
    notes: '',
  };
}

/**
 * 付款項目表單管理 Hook
 *
 * 用於管理多個付款項目的狀態，包含新增、刪除、更新和總金額計算
 *
 * @param initialItems - 初始付款項目（選填）
 * @returns 付款項目狀態和操作方法
 *
 * @example
 * ```tsx
 * const {
 *   paymentItems,
 *   addPaymentItem,
 *   removePaymentItem,
 *   updatePaymentItem,
 *   totalAmount
 * } = usePaymentItemsForm();
 *
 * // 新增付款項目
 * <button onClick={addPaymentItem}>新增付款方式</button>
 *
 * // 更新付款金額
 * <input
 *   value={item.amount}
 *   onChange={(e) => updatePaymentItem(item.id, 'amount', Number(e.target.value))}
 * />
 *
 * // 顯示總金額
 * <div>總計: NT$ {totalAmount.toLocaleString()}</div>
 * ```
 */
export function usePaymentItemsForm(
  initialItems?: PaymentItem[]
): UsePaymentItemsFormReturn {
  const [paymentItems, setPaymentItems] = useState<PaymentItem[]>(
    initialItems && initialItems.length > 0
      ? initialItems
      : [createDefaultPaymentItem()]
  );

  /**
   * 新增付款項目
   */
  const addPaymentItem = useCallback(() => {
    setPaymentItems(prev => [...prev, createDefaultPaymentItem()]);
  }, []);

  /**
   * 移除付款項目
   * 至少保留一個項目
   */
  const removePaymentItem = useCallback((id: string) => {
    setPaymentItems(prev => {
      if (prev.length === 1) {
        // 至少保留一個項目，重置為預設值
        return [createDefaultPaymentItem()];
      }
      return prev.filter(item => item.id !== id);
    });
  }, []);

  /**
   * 更新付款項目
   */
  const updatePaymentItem = useCallback(
    (id: string, updates: Partial<PaymentItem>) => {
      setPaymentItems(prev =>
        prev.map(item => {
          if (item.id !== id) return item;

          const updatedItem = { ...item, ...updates };

          // 當付款方式改變時，清除不相關的欄位
          if (updates.payment_method) {
            switch (updates.payment_method) {
              case '現金':
                // 現金付款，清除銀行和支票相關欄位
                delete updatedItem.bank_account_id;
                delete updatedItem.check_number;
                delete updatedItem.card_last_four;
                break;
              case '匯款':
                // 匯款，清除支票和卡號
                delete updatedItem.check_number;
                delete updatedItem.card_last_four;
                break;
              case '刷卡':
                // 刷卡，清除支票
                delete updatedItem.check_number;
                break;
              case '支票':
                // 支票，清除卡號
                delete updatedItem.bank_account_id;
                delete updatedItem.card_last_four;
                break;
              default:
                break;
            }
          }

          return updatedItem;
        })
      );
    },
    []
  );

  /**
   * 重置表單
   */
  const resetForm = useCallback(() => {
    setPaymentItems([createDefaultPaymentItem()]);
  }, []);

  /**
   * 計算總金額
   */
  const totalAmount = useMemo(() => {
    return paymentItems.reduce((sum, item) => {
      const amount = Number(item.amount) || 0;
      return sum + amount;
    }, 0);
  }, [paymentItems]);

  return {
    paymentItems,
    addPaymentItem,
    removePaymentItem,
    updatePaymentItem,
    resetForm,
    totalAmount,
    setPaymentItems,
  };
}

/**
 * 驗證付款項目
 *
 * @param item - 要驗證的付款項目
 * @returns 錯誤訊息陣列，如果沒有錯誤則返回空陣列
 */
export function validatePaymentItem(item: PaymentItem): string[] {
  const errors: string[] = [];

  // 驗證金額
  if (!item.amount || item.amount <= 0) {
    errors.push('金額必須大於 0');
  }

  // 驗證付款方式特定欄位
  switch (item.payment_method) {
    case '匯款':
      if (!item.bank_account_id) {
        errors.push('請選擇銀行帳戶');
      }
      break;
    case '支票':
      if (!item.check_number || item.check_number.trim() === '') {
        errors.push('請輸入支票號碼');
      }
      break;
    case '刷卡':
      if (!item.card_last_four || item.card_last_four.length !== 4) {
        errors.push('請輸入卡號後四碼');
      }
      break;
  }

  return errors;
}

/**
 * 驗證所有付款項目
 *
 * @param items - 付款項目陣列
 * @returns 如果所有項目都有效則返回 true
 */
export function validateAllPaymentItems(items: PaymentItem[]): {
  isValid: boolean;
  errors: Record<string, string[]>;
} {
  const errors: Record<string, string[]> = {};
  let isValid = true;

  items.forEach(item => {
    const itemErrors = validatePaymentItem(item);
    if (itemErrors.length > 0) {
      errors[item.id] = itemErrors;
      isValid = false;
    }
  });

  return { isValid, errors };
}
