'use client';

import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calculator } from 'lucide-react';

export function CalculatorWidget() {
  const [inputValue, setInputValue] = useState('');
  const [sequentialMode, setSequentialMode] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 清理輸入：移除中文、轉換全形為半形、移除空白
  const cleanInput = (text: string): string => {
    let result = text;

    // 移除中文字符
    result = result.replace(/[\u4e00-\u9fa5]/g, '');

    // 轉換全形數字為半形
    result = result.replace(/[\uff10-\uff19]/g, (char) =>
      String.fromCharCode(char.charCodeAt(0) - 0xfee0)
    );

    // 轉換全形符號為半形
    result = result.replace(/[\uff0b\uff0d\uff0a\uff0f\uff08\uff09\uff0e]/g, (char) => {
      const fullToHalf: Record<string, string> = {
        '＋': '+', '－': '-', '＊': '*', '／': '/',
        '（': '(', '）': ')', '．': '.'
      };
      return fullToHalf[char] || char;
    });

    // 移除所有空白
    result = result.replace(/\s/g, '');

    // 只保留數字、運算符號、小數點、括號
    result = result.replace(/[^0-9+\-*/.()]/g, '');

    return result;
  };

  // 順序計算（從左到右）
  const calculateSequential = (expression: string): number => {
    // 移除括號（順序計算不支援括號）
    const expr = expression.replace(/[()]/g, '');

    // 拆分數字和運算符號
    const tokens: (number | string)[] = [];
    let currentNumber = '';

    for (let i = 0; i < expr.length; i++) {
      const char = expr[i];
      if (char >= '0' && char <= '9' || char === '.') {
        currentNumber += char;
      } else if (['+', '-', '*', '/'].includes(char)) {
        // 處理負號：如果是第一個字符或前一個是運算符號，視為負號
        if (char === '-' && (i === 0 || ['+', '-', '*', '/'].includes(expr[i - 1]))) {
          currentNumber += char;
        } else {
          if (currentNumber) {
            tokens.push(parseFloat(currentNumber));
            currentNumber = '';
          }
          tokens.push(char);
        }
      }
    }
    if (currentNumber) {
      tokens.push(parseFloat(currentNumber));
    }

    // 從左到右計算
    if (tokens.length === 0) return 0;
    let result = tokens[0] as number;
    for (let i = 1; i < tokens.length; i += 2) {
      const operator = tokens[i] as string;
      const nextNum = tokens[i + 1] as number;

      if (operator === '+') result += nextNum;
      else if (operator === '-') result -= nextNum;
      else if (operator === '*') result *= nextNum;
      else if (operator === '/') result /= nextNum;
    }

    return result;
  };

  // 即時計算結果
  const calculateResult = (): string => {
    if (!inputValue.trim()) return '0';

    try {
      const sanitized = inputValue.replace(/[^0-9+\-*/.()]/g, '');
      if (!sanitized) return '0';

      // 檢查是否只有運算符號，沒有數字
      if (!/\d/.test(sanitized)) {
        return '0';
      }

      // 檢查是否以運算符號開頭或結尾（除了負號）
      if (/[+*\/]$/.test(sanitized)) {
        return inputValue; // 顯示原始輸入
      }

      let calculationResult: number;

      if (sequentialMode) {
        // 順序計算模式
        calculationResult = calculateSequential(sanitized);
      } else {
        // 數學優先模式
        calculationResult = Function('"use strict"; return (' + sanitized + ')')();
      }

      if (typeof calculationResult === 'number' && !isNaN(calculationResult)) {
        // 格式化數字，最多顯示 8 位小數
        return parseFloat(calculationResult.toFixed(8)).toString();
      }
      return inputValue;
    } catch (error) {
      // 如果計算失敗，返回原始輸入而不是「錯誤」
      return inputValue;
    }
  };

  // 處理輸入變更
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = cleanInput(e.target.value);
    setInputValue(cleaned);
  };

  // 處理貼上事件
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const cleaned = cleanInput(pastedText);
    setInputValue(cleaned);
  };

  // 處理按鍵事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const result = calculateResult();
      setInputValue(result);
    } else if (e.key === 'Escape') {
      setInputValue('');
    }
  };

  // 快速插入按鈕點擊
  const handleButtonClick = (value: string) => {
    if (value === '=') {
      const result = calculateResult();
      setInputValue(result);
    } else if (value === 'C') {
      setInputValue('');
    } else {
      setInputValue(prev => prev + value);
    }
  };

  const displayResult = calculateResult();

  return (
    <Card className="overflow-hidden flex flex-col border border-morandi-gold/20 shadow-sm rounded-2xl hover:shadow-md hover:border-morandi-gold/20 transition-all duration-200">
      <div className="bg-morandi-container px-4 py-3 border-b border-morandi-gold/20 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-morandi-gold" />
            <h3 className="font-semibold text-sm text-morandi-primary">計算機</h3>
          </div>
          <label className="flex items-center gap-1.5 cursor-pointer group">
            <input
              type="checkbox"
              checked={sequentialMode}
              onChange={(e) => setSequentialMode(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-morandi-gold/20 text-morandi-gold focus:ring-morandi-gold/20 cursor-pointer"
            />
            <span className="text-xs text-morandi-secondary group-hover:text-morandi-primary transition-colors">順序計算</span>
          </label>
        </div>
      </div>
      <div className="p-4 flex flex-col">
        <div className="space-y-3 flex flex-col">
        {/* iPhone 風格顯示區 */}
        <div
          className="bg-white rounded-xl p-4 min-h-[80px] flex flex-col justify-end border border-morandi-gold/20 cursor-text shadow-sm"
          onClick={() => inputRef.current?.focus()}
        >
          {/* 算式輸入（小字灰色） */}
          <input
            ref={inputRef}
            type="text"
            inputMode="text"
            value={inputValue}
            onChange={handleInputChange}
            onPaste={handlePaste}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            className="w-full bg-transparent border-none outline-none text-right font-mono text-sm text-morandi-secondary mb-1 placeholder:text-morandi-muted/40"
            placeholder="直接輸入或點擊按鈕"
          />
          {/* 即時結果（大字黑色） */}
          <div className="text-right text-2xl font-bold text-morandi-primary font-mono tracking-tight">
            {displayResult}
          </div>
        </div>

        {/* 快速按鈕 */}
        <div className="grid grid-cols-4 gap-1.5 flex-shrink-0">
          {['7', '8', '9', '/'].map((btn) => (
            <Button
              key={btn}
              variant="outline"
              size="sm"
              onClick={() => handleButtonClick(btn)}
              className="h-9 text-sm font-medium bg-white border-morandi-gold/20 hover:border-morandi-gold transition-all rounded-xl"
            >
              {btn}
            </Button>
          ))}
          {['4', '5', '6', '*'].map((btn) => (
            <Button
              key={btn}
              variant="outline"
              size="sm"
              onClick={() => handleButtonClick(btn)}
              className="h-9 text-sm font-medium bg-white border-morandi-gold/20 hover:border-morandi-gold transition-all rounded-xl"
            >
              {btn}
            </Button>
          ))}
          {['1', '2', '3', '-'].map((btn) => (
            <Button
              key={btn}
              variant="outline"
              size="sm"
              onClick={() => handleButtonClick(btn)}
              className="h-9 text-sm font-medium bg-white border-morandi-gold/20 hover:border-morandi-gold transition-all rounded-xl"
            >
              {btn}
            </Button>
          ))}
          {['0', '.', '(', ')'].map((btn) => (
            <Button
              key={btn}
              variant="outline"
              size="sm"
              onClick={() => handleButtonClick(btn)}
              className="h-9 text-sm font-medium bg-white border-morandi-gold/20 hover:border-morandi-gold transition-all rounded-xl"
            >
              {btn}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleButtonClick('+')}
            className="h-9 text-sm font-medium bg-white/80 border-morandi-gold/20 hover:bg-white hover:border-morandi-gold/20 hover:scale-105 transition-all rounded-xl"
          >
            +
          </Button>
          <Button
            size="sm"
            onClick={() => handleButtonClick('=')}
            className="h-9 text-sm font-medium bg-gradient-to-r from-[#B5986A] to-[#D4C4A8] border-0 text-white shadow-lg transition-all duration-200 active:scale-95 rounded-xl"
          >
            =
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleButtonClick('C')}
            className="h-9 text-sm font-medium col-span-2 bg-white/80 border-morandi-gold/20 hover:bg-red-50 hover:text-red-600 hover:border-red-300 hover:scale-105 transition-all rounded-xl"
          >
            清除
          </Button>
        </div>
        </div>
      </div>
    </Card>
  );
}
