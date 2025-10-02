import { useState } from 'react';
import { evaluateExpression, isOperator } from './calculatorUtils';

/**
 * 計算機核心邏輯 Hook
 */
export const useCalculator = () => {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  /**
   * 輸入數字
   */
  const inputNumber = (num: string) => {
    if (waitingForOperand) {
      setDisplay(num);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  /**
   * 輸入運算符號
   */
  const inputOperation = (op: string) => {
    if (waitingForOperand && expression && !expression.endsWith('=')) {
      // 如果已經在等待下一個數字，只更新運算符號（替換最後一個）
      setExpression(expression.slice(0, -1) + op);
    } else if (expression.endsWith('=')) {
      // 如果已經按過 =，開始新的計算
      setExpression(display + op);
      setWaitingForOperand(true);
    } else {
      // 添加當前數字和運算符號到算式
      const newExpression = expression + display + op;
      setExpression(newExpression);

      // 計算並顯示即時結果
      const result = evaluateExpression(newExpression.slice(0, -1), parseFloat(display) || 0);
      setDisplay(String(result));
      setWaitingForOperand(true);
    }
  };

  /**
   * 執行計算（按 = 號）
   */
  const performCalculation = () => {
    if (expression && !expression.endsWith('=')) {
      const finalExpression = expression + display;
      const result = evaluateExpression(finalExpression, parseFloat(display) || 0);
      setDisplay(String(result));
      setExpression(finalExpression + '=');
      setWaitingForOperand(true);
    }
  };

  /**
   * 清除所有
   */
  const clear = () => {
    setDisplay('0');
    setExpression('');
    setWaitingForOperand(false);
  };

  /**
   * 刪除最後一位數字
   */
  const deleteLastDigit = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  /**
   * 處理貼上事件
   */
  const handlePasteContent = (processedText: string) => {
    if (!processedText) return;

    // 如果包含等號，直接設置為算式並計算
    if (processedText.includes('=')) {
      const exprWithoutEquals = processedText.replace(/=+$/, '');
      try {
        const result = evaluateExpression(exprWithoutEquals);
        setExpression(exprWithoutEquals + '=');
        setDisplay(String(result));
        setWaitingForOperand(true);
      } catch {
        setExpression(processedText);
        setDisplay('錯誤');
      }
    } else {
      // 分析貼上的內容
      const lastChar = processedText[processedText.length - 1];
      const endsWithOperator = isOperator(lastChar);

      if (endsWithOperator) {
        // 如果結尾是運算符號
        const exprWithoutOp = processedText.slice(0, -1);
        try {
          const result = evaluateExpression(exprWithoutOp);
          setExpression(processedText);
          setDisplay(String(result));
          setWaitingForOperand(true);
        } catch {
          setExpression(processedText);
        }
      } else {
        // 沒有運算符號在結尾，嘗試計算整個算式
        try {
          const result = evaluateExpression(processedText);
          setExpression(processedText);
          setDisplay(String(result));
          setWaitingForOperand(false);
        } catch {
          // 如果無法計算，可能只是單純的數字
          setDisplay(processedText);
        }
      }
    }
  };

  return {
    display,
    expression,
    waitingForOperand,
    inputNumber,
    inputOperation,
    performCalculation,
    clear,
    deleteLastDigit,
    handlePasteContent,
  };
};
