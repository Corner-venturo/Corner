'use client';

import { useState, useRef } from 'react';
import { Calculator } from 'lucide-react';
import { useCalculator } from './calculator/useCalculator';
import { useCalculatorKeyboard } from './calculator/useCalculatorKeyboard';
import { CalculatorDisplay } from './calculator/CalculatorDisplay';
import { CalculatorButtons } from './calculator/CalculatorButtons';

/**
 * 計算機主元件
 * - 支援鍵盤輸入（0-9, +, -, *, /, Enter, Esc, Backspace）
 * - 支援貼上功能（自動移除文字、轉換全形半形）
 * - 顯示完整計算式與即時結果
 * - 雙擊 Backspace（在 0 狀態下）快速清除記錄
 */
export function CalculatorWidget() {
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 計算邏輯
  const calculator = useCalculator();

  // 鍵盤與貼上事件處理
  useCalculatorKeyboard({
    isFocused,
    display: calculator.display,
    inputNumber: calculator.inputNumber,
    inputOperation: calculator.inputOperation,
    performCalculation: calculator.performCalculation,
    clear: calculator.clear,
    deleteLastDigit: calculator.deleteLastDigit,
    handlePasteContent: calculator.handlePasteContent,
  });

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      className={`p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all border outline-none ${
        isFocused ? 'border-morandi-gold ring-2 ring-morandi-gold/20' : 'border-border/50'
      }`}
    >
      {/* 標題列 */}
      <div className="flex items-center gap-2 mb-3">
        <Calculator className="w-4 h-4 text-morandi-gold" />
        <h3 className="text-sm font-semibold text-morandi-primary">計算機</h3>
        {isFocused && (
          <span className="ml-auto text-[10px] text-morandi-secondary">鍵盤+貼上已啟用</span>
        )}
      </div>

      {/* 顯示器 */}
      <CalculatorDisplay expression={calculator.expression} display={calculator.display} />

      {/* 按鈕區 */}
      <CalculatorButtons
        onNumberClick={calculator.inputNumber}
        onOperationClick={calculator.inputOperation}
        onClear={calculator.clear}
        onCalculate={calculator.performCalculation}
      />
    </div>
  );
}
