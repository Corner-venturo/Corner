import { useEffect, useState } from 'react';
import { processPastedText } from './calculatorUtils';

interface UseCalculatorKeyboardProps {
  isFocused: boolean;
  display: string;
  inputNumber: (num: string) => void;
  inputOperation: (op: string) => void;
  performCalculation: () => void;
  clear: () => void;
  deleteLastDigit: () => void;
  handlePasteContent: (text: string) => void;
}

/**
 * 計算機鍵盤與貼上事件處理 Hook
 */
export const useCalculatorKeyboard = ({
  isFocused,
  display,
  inputNumber,
  inputOperation,
  performCalculation,
  clear,
  deleteLastDigit,
  handlePasteContent,
}: UseCalculatorKeyboardProps) => {
  const [lastBackspaceTime, setLastBackspaceTime] = useState(0);

  // 貼上事件處理
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!isFocused) return;

      e.preventDefault();
      const pastedText = e.clipboardData?.getData('text') || '';
      const processedText = processPastedText(pastedText);
      handlePasteContent(processedText);
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isFocused, handlePasteContent]);

  // 鍵盤事件處理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isFocused) return;

      // 數字鍵
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        inputNumber(e.key);
      }
      // 小數點
      else if (e.key === '.') {
        e.preventDefault();
        if (!display.includes('.')) {
          inputNumber('.');
        }
      }
      // 運算符號
      else if (e.key === '+') {
        e.preventDefault();
        inputOperation('+');
      }
      else if (e.key === '-') {
        e.preventDefault();
        inputOperation('-');
      }
      else if (e.key === '*') {
        e.preventDefault();
        inputOperation('×');
      }
      else if (e.key === '/') {
        e.preventDefault();
        inputOperation('÷');
      }
      // Enter 或 = 執行計算
      else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        performCalculation();
      }
      // Escape 或 c 清除
      else if (e.key === 'Escape' || e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        clear();
      }
      // Backspace 刪除最後一位
      else if (e.key === 'Backspace') {
        e.preventDefault();
        const now = Date.now();

        // 如果顯示是 0 且在 500ms 內連按兩次 Backspace，清除所有記錄
        if (display === '0' && now - lastBackspaceTime < 500) {
          clear();
        } else {
          deleteLastDigit();
        }

        setLastBackspaceTime(now);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isFocused,
    display,
    inputNumber,
    inputOperation,
    performCalculation,
    clear,
    deleteLastDigit,
    lastBackspaceTime,
  ]);
};
