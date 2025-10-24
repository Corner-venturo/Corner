'use client';

import { _useRef } from 'react';
import { _Calculator } from 'lucide-react';
// import { use_Calculator } from './calculator/useCalculator';
// import { useCalculatorKeyboard } from './calculator/useCalculatorKeyboard';
// import { CalculatorDisplay } from './calculator/CalculatorDisplay';
// import { CalculatorButtons } from './calculator/CalculatorButtons';

/**
 * 計算機主元件
 * - 支援鍵盤輸入（0-9, +, -, *, /, Enter, Esc, Backspace）
 * - 支援貼上功能（自動移除文字、轉換全形半形）
 * - 顯示完整計算式與即時結果
 * - 雙擊 Backspace（在 0 狀態下）快速清除記錄
 */
export function CalculatorWidget() {
  // TODO: 實作計算機功能
  // 需要實作 calculator 子模組才能啟用此功能
  return <div className="p-4 text-morandi-secondary">計算機功能開發中...</div>;
}
