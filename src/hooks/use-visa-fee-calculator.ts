import { useCallback } from 'react';

/**
 * 簽證費用計算 Hook
 * 處理急件費用調整（±1000）
 */
export const useVisaFeeCalculator = () => {
  /**
   * 計算急件費用調整
   * @param baseCost 基礎費用
   * @param isUrgent 是否為急件
   * @param wasUrgent 之前是否為急件（用於計算差異）
   */
  const calculateUrgentFee = useCallback((
    baseCost: number,
    isUrgent: boolean,
    wasUrgent: boolean = false
  ): number => {
    if (isUrgent && !wasUrgent) {
      // 勾選急件：+1000
      return baseCost + 1000;
    } else if (!isUrgent && wasUrgent) {
      // 取消急件：-1000
      return Math.max(0, baseCost - 1000);
    }
    return baseCost;
  }, []);

  return {
    calculateUrgentFee,
  };
};
