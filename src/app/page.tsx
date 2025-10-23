'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { ResponsiveHeader } from '@/components/layout/responsive-header';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Calculator, DollarSign, Clock, Clipboard, BarChart3, CheckSquare, TrendingUp, Briefcase, Calendar } from 'lucide-react';
import { useTourStore, useOrderStore } from '@/stores';

// 可用的小工具類型
type WidgetType = 'calculator' | 'currency' | 'timer' | 'notes' | 'stats';

interface WidgetConfig {
  id: WidgetType;
  name: string;
  icon: any;
  component: React.ComponentType;
  span?: number; // 佔據的列數（1 或 2）
}

// 簡易計算機組件（iPhone 風格）
function CalculatorWidget() {
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
    <Card className="overflow-hidden flex flex-col h-full border border-[#E6DDD4] shadow-sm rounded-2xl hover:shadow-md hover:border-morandi-gold/50 transition-all duration-200">
      <div className="bg-morandi-container px-4 py-3 border-b border-[#E6DDD4] flex-shrink-0">
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
              className="w-3.5 h-3.5 rounded border-morandi-gold/30 text-morandi-gold focus:ring-morandi-gold/20 cursor-pointer"
            />
            <span className="text-xs text-morandi-secondary group-hover:text-morandi-primary transition-colors">順序計算</span>
          </label>
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col overflow-hidden">
        <div className="space-y-3 flex-1 flex flex-col min-h-0">
        {/* iPhone 風格顯示區 */}
        <div
          className="bg-white rounded-xl p-4 min-h-[80px] flex flex-col justify-end border border-[#E6DDD4] cursor-text shadow-sm"
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
              className="h-9 text-sm font-medium bg-white border-[#E6DDD4] hover:border-morandi-gold transition-all rounded-xl"
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
              className="h-9 text-sm font-medium bg-white border-[#E6DDD4] hover:border-morandi-gold transition-all rounded-xl"
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
              className="h-9 text-sm font-medium bg-white border-[#E6DDD4] hover:border-morandi-gold transition-all rounded-xl"
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
              className="h-9 text-sm font-medium bg-white border-[#E6DDD4] hover:border-morandi-gold transition-all rounded-xl"
            >
              {btn}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleButtonClick('+')}
            className="h-9 text-sm font-medium bg-white/80 border-[#E6DDD4]/50 hover:bg-white hover:border-morandi-gold hover:scale-105 transition-all rounded-xl"
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
            className="h-9 text-sm font-medium col-span-2 bg-white/80 border-[#E6DDD4]/50 hover:bg-red-50 hover:text-red-600 hover:border-red-300 hover:scale-105 transition-all rounded-xl"
          >
            清除
          </Button>
        </div>
        </div>
      </div>
    </Card>
  );
}

// 匯率轉換組件（雙向轉換）
function CurrencyWidget() {
  // 預設匯率（1 外幣 = ? 台幣）
  const DEFAULT_RATES = {
    USD: { rate: 31.5, symbol: '$', name: '美金' },
    JPY: { rate: 0.21, symbol: '¥', name: '日幣' },
    KRW: { rate: 0.024, symbol: '₩', name: '韓元' },
    CNY: { rate: 4.35, symbol: '¥', name: '人民幣' },
    VND: { rate: 0.00127, symbol: '₫', name: '越南盾' },
    IDR: { rate: 0.002, symbol: 'Rp', name: '印尼盾' },
  };

  const [twdAmount, setTwdAmount] = useState('10000');
  const [foreignAmount, setForeignAmount] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState<keyof typeof DEFAULT_RATES>('USD');
  const [customRate, setCustomRate] = useState(DEFAULT_RATES.USD.rate.toString());
  const [useCustomRate, setUseCustomRate] = useState(false);
  const [direction, setDirection] = useState<'twd-to-foreign' | 'foreign-to-twd'>('twd-to-foreign');

  // 當切換貨幣時，更新匯率
  useEffect(() => {
    if (!useCustomRate) {
      setCustomRate(DEFAULT_RATES[selectedCurrency].rate.toString());
    }
  }, [selectedCurrency, useCustomRate]);

  // 計算外幣金額（台幣 → 外幣）
  const calculateForeign = (twd: string): string => {
    const amount = parseFloat(twd) || 0;
    const rate = parseFloat(customRate) || 0;
    if (rate === 0) return '0';
    return (amount / rate).toFixed(2);
  };

  // 計算台幣金額（外幣 → 台幣）
  const calculateTWD = (foreign: string): string => {
    const amount = parseFloat(foreign) || 0;
    const rate = parseFloat(customRate) || 0;
    return (amount * rate).toFixed(2);
  };

  // 當台幣金額變更
  const handleTwdChange = (value: string) => {
    setTwdAmount(value);
    setDirection('twd-to-foreign');
    setForeignAmount(calculateForeign(value));
  };

  // 當外幣金額變更
  const handleForeignChange = (value: string) => {
    setForeignAmount(value);
    setDirection('foreign-to-twd');
    setTwdAmount(calculateTWD(value));
  };

  // 當匯率變更時，重新計算
  useEffect(() => {
    if (direction === 'twd-to-foreign') {
      setForeignAmount(calculateForeign(twdAmount));
    } else {
      setTwdAmount(calculateTWD(foreignAmount));
    }
  }, [customRate]);

  // 初始化外幣金額
  useEffect(() => {
    setForeignAmount(calculateForeign(twdAmount));
  }, []);

  const currencyInfo = DEFAULT_RATES[selectedCurrency];

  // 切換方向
  const swapDirection = () => {
    setDirection(prev => prev === 'twd-to-foreign' ? 'foreign-to-twd' : 'twd-to-foreign');
  };

  return (
    <Card className="overflow-hidden flex flex-col h-full border border-[#E6DDD4] shadow-sm rounded-2xl hover:shadow-md hover:border-morandi-gold/50 transition-all duration-200">
      <div className="bg-morandi-container px-4 py-3 border-b border-[#E6DDD4] flex-shrink-0">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-morandi-gold" />
          <h3 className="font-semibold text-sm text-morandi-primary">匯率換算</h3>
        </div>
      </div>
      <div className="p-4 space-y-3 flex-1 overflow-y-auto min-h-0">
        {/* 貨幣選擇 */}
        <div>
          <label className="text-xs font-medium text-morandi-primary mb-1.5 block">選擇貨幣</label>
          <select
            value={selectedCurrency}
            onChange={(e) => {
              setSelectedCurrency(e.target.value as keyof typeof DEFAULT_RATES);
              setUseCustomRate(false);
            }}
            className="w-full px-3 py-2 text-sm border border-[#E6DDD4] rounded-xl bg-white hover:border-morandi-gold focus:border-morandi-gold focus:ring-2 focus:ring-morandi-gold/10 transition-all outline-none"
          >
            {Object.entries(DEFAULT_RATES).map(([code, info]) => (
              <option key={code} value={code}>
                {info.symbol} {info.name} ({code})
              </option>
            ))}
          </select>
        </div>

        {/* 台幣和外幣輸入（左右並排） */}
        <div className="flex items-end gap-2">
          {/* 台幣輸入 */}
          <div className="flex-1">
            <label className="text-xs font-medium text-morandi-primary mb-1.5 block">台幣 (TWD)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-morandi-muted text-xs font-medium">NT$</span>
              <input
                type="number"
                value={twdAmount}
                onChange={(e) => handleTwdChange(e.target.value)}
                className="w-full px-3 py-2 pl-[42px] border border-[#E6DDD4] rounded-xl font-mono text-sm bg-white hover:border-morandi-gold focus:border-morandi-gold focus:ring-2 focus:ring-morandi-gold/10 transition-all outline-none"
                placeholder="10000"
              />
            </div>
          </div>

          {/* 雙向箭頭 */}
          <button
            onClick={swapDirection}
            className="p-2 hover:bg-morandi-gold/10 rounded-xl transition-all group mb-0.5"
            title="切換方向"
          >
            <svg
              className="h-4 w-4 text-morandi-gold group-hover:scale-110 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
              />
            </svg>
          </button>

          {/* 外幣輸入 */}
          <div className="flex-1">
            <label className="text-xs font-medium text-morandi-primary mb-1.5 block">
              {currencyInfo.name} ({selectedCurrency})
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-morandi-muted text-xs font-medium">
                {currencyInfo.symbol}
              </span>
              <input
                type="number"
                value={foreignAmount}
                onChange={(e) => handleForeignChange(e.target.value)}
                className="w-full px-3 py-2 pl-[42px] border border-[#E6DDD4] rounded-xl font-mono text-sm bg-white hover:border-morandi-gold focus:border-morandi-gold focus:ring-2 focus:ring-morandi-gold/10 transition-all outline-none"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {/* 匯率設定 */}
        <div className="pt-4 border-t border-morandi-container/20">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-morandi-primary">
              匯率 (1 {selectedCurrency} = ? TWD)
            </label>
            <button
              onClick={() => {
                setUseCustomRate(false);
                setCustomRate(DEFAULT_RATES[selectedCurrency].rate.toString());
              }}
              className="text-xs text-morandi-gold hover:text-morandi-gold/80 font-medium transition-colors"
            >
              重設預設值
            </button>
          </div>
          <input
            type="number"
            step="0.001"
            value={customRate}
            onChange={(e) => {
              setCustomRate(e.target.value);
              setUseCustomRate(true);
            }}
            className="w-full px-4 py-2.5 border border-[#E6DDD4] rounded-xl font-mono text-sm bg-white hover:border-morandi-gold focus:border-morandi-gold focus:ring-2 focus:ring-morandi-gold/10 transition-all outline-none"
            placeholder="輸入匯率"
          />
          <p className="text-xs text-morandi-muted mt-2 flex items-center gap-1.5">
            {useCustomRate ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-morandi-gold"></span>
                已自訂匯率
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-morandi-muted"></span>
                使用預設匯率: {DEFAULT_RATES[selectedCurrency].rate}
              </>
            )}
          </p>
        </div>
      </div>
    </Card>
  );
}

// 計時器組件
function TimerWidget() {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval: any;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (s: number) => {
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="overflow-hidden flex flex-col h-full border border-[#E6DDD4] shadow-sm rounded-2xl hover:shadow-md hover:border-morandi-gold/50 transition-all duration-200">
      <div className="bg-morandi-container px-4 py-3 border-b border-[#E6DDD4] flex-shrink-0">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-morandi-gold" />
          <h3 className="font-semibold text-sm text-morandi-primary">計時器</h3>
        </div>
      </div>
      <div className="p-6 flex-1 flex flex-col justify-center min-h-0">
        <div className="bg-white rounded-2xl p-8 border border-[#E6DDD4] shadow-sm mb-6">
          <div className="text-center">
            <div className="text-5xl font-mono font-bold text-morandi-primary tracking-wider">
              {formatTime(seconds)}
            </div>
            <div className="text-xs text-morandi-muted mt-3 font-medium">
              {isRunning ? '計時中...' : '已暫停'}
            </div>
          </div>
        </div>
        <div className="flex gap-3 flex-shrink-0">
          <Button
            size="lg"
            className={`flex-1 rounded-xl transition-all duration-200 ${
              isRunning
                ? 'bg-white border border-[#E6DDD4] text-morandi-primary hover:border-morandi-gold'
                : 'bg-gradient-to-r from-[#B5986A] to-[#D4C4A8] text-white border-0 shadow-lg active:scale-95'
            }`}
            onClick={() => setIsRunning(!isRunning)}
          >
            {isRunning ? '暫停' : '開始'}
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              setSeconds(0);
              setIsRunning(false);
            }}
            className="bg-white border-[#E6DDD4] hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-all rounded-xl"
          >
            重設
          </Button>
        </div>
      </div>
    </Card>
  );
}

// 便條紙組件（支援分頁）
function NotesWidget() {
  const STORAGE_KEY = 'homepage-notes-tabs';
  const MAX_TABS = 5;

  // 載入分頁資料
  const loadTabs = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
    return [{ id: '1', name: '筆記', content: '' }];
  };

  const [tabs, setTabs] = useState<{ id: string; name: string; content: string }[]>(loadTabs);
  const [activeTabId, setActiveTabId] = useState(tabs[0].id);
  const [isEditingTab, setIsEditingTab] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // 儲存到 localStorage
  const saveTabs = (newTabs: typeof tabs) => {
    setTabs(newTabs);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newTabs));
  };

  // 更新內容
  const updateContent = (tabId: string, content: string) => {
    const newTabs = tabs.map(tab =>
      tab.id === tabId ? { ...tab, content } : tab
    );
    saveTabs(newTabs);
  };

  // 新增分頁
  const addTab = () => {
    if (tabs.length >= MAX_TABS) return;
    const newTab = {
      id: Date.now().toString(),
      name: `筆記 ${tabs.length + 1}`,
      content: ''
    };
    const newTabs = [...tabs, newTab];
    saveTabs(newTabs);
    setActiveTabId(newTab.id);
  };

  // 刪除分頁
  const deleteTab = (tabId: string) => {
    if (tabs.length === 1) return; // 至少保留一個
    const newTabs = tabs.filter(tab => tab.id !== tabId);
    saveTabs(newTabs);
    if (activeTabId === tabId) {
      setActiveTabId(newTabs[0].id);
    }
  };

  // 重新命名分頁
  const renameTab = (tabId: string, newName: string) => {
    const newTabs = tabs.map(tab =>
      tab.id === tabId ? { ...tab, name: newName.trim() || tab.name } : tab
    );
    saveTabs(newTabs);
    setIsEditingTab(null);
  };

  const activeTab = tabs.find(tab => tab.id === activeTabId) || tabs[0];

  return (
    <Card className="overflow-hidden flex flex-col h-full border border-[#E6DDD4] shadow-sm rounded-2xl hover:shadow-md hover:border-morandi-gold/50 transition-all duration-200">
      <div className="bg-morandi-container px-4 py-3 border-b border-[#E6DDD4] flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clipboard className="h-4 w-4 text-morandi-gold" />
            <h3 className="font-semibold text-sm text-morandi-primary">便條紙</h3>
          </div>

          {/* 分頁標籤 */}
          <div className="flex items-center gap-1">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className={`group relative flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activeTabId === tab.id
                    ? 'bg-[#B5986A]/10 text-morandi-gold scale-105'
                    : 'text-morandi-muted hover:bg-morandi-gold/5 hover:text-morandi-primary'
                }`}
              >
                {isEditingTab === tab.id ? (
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={() => renameTab(tab.id, editingName)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') renameTab(tab.id, editingName);
                      if (e.key === 'Escape') setIsEditingTab(null);
                    }}
                    className="w-16 px-1 bg-white border border-morandi-gold rounded outline-none"
                    autoFocus
                  />
                ) : (
                  <span
                    onClick={() => setActiveTabId(tab.id)}
                    onDoubleClick={() => {
                      setIsEditingTab(tab.id);
                      setEditingName(tab.name);
                    }}
                    className="truncate max-w-[60px]"
                  >
                    {tab.name}
                  </span>
                )}

                {/* 刪除按鈕（只在多於一個分頁時顯示） */}
                {tabs.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTab(tab.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 ml-0.5 text-morandi-muted hover:text-red-500 transition-opacity"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}

            {/* 新增分頁按鈕 */}
            {tabs.length < MAX_TABS && (
              <button
                onClick={addTab}
                className="p-1 rounded-lg text-morandi-muted hover:bg-morandi-gold/10 hover:text-morandi-gold transition-all"
                title="新增分頁"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col min-h-0">
        <textarea
          value={activeTab.content}
          onChange={(e) => updateContent(activeTab.id, e.target.value)}
          className="w-full h-full p-4 border border-[#E6DDD4] rounded-xl resize-none bg-white hover:border-morandi-gold focus:border-morandi-gold focus:ring-2 focus:ring-morandi-gold/10 transition-all outline-none font-mono text-sm leading-relaxed"
          placeholder="在這裡寫下你的筆記..."
        />
        <p className="text-xs text-morandi-muted mt-2">自動儲存 • 雙擊分頁名稱可重新命名</p>
      </div>
    </Card>
  );
}

// 統計報表組件
function StatsWidget() {
  const { items: tours } = useTourStore();
  const { items: orders } = useOrderStore();

  // 載入使用者設定
  const loadStatsConfig = () => {
    const saved = localStorage.getItem('homepage-stats-config');
    if (saved) {
      return JSON.parse(saved);
    }
    return ['todos', 'paymentsThisWeek', 'paymentsNextWeek', 'depositsThisWeek', 'toursThisWeek', 'toursThisMonth'];
  };

  const [activeStats, setActiveStats] = useState<string[]>(loadStatsConfig);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // 儲存設定
  const toggleStat = (statId: string) => {
    const newStats = activeStats.includes(statId)
      ? activeStats.filter(id => id !== statId)
      : [...activeStats, statId];
    setActiveStats(newStats);
    localStorage.setItem('homepage-stats-config', JSON.stringify(newStats));
  };

  // 過濾掉特殊團
  const normalTours = tours.filter(t => t.status !== 'special');

  // 計算本週時間範圍
  const today = new Date();
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() + mondayOffset);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  // 下週時間範圍
  const nextWeekStart = new Date(weekStart);
  nextWeekStart.setDate(weekStart.getDate() + 7);
  const nextWeekEnd = new Date(nextWeekStart);
  nextWeekEnd.setDate(nextWeekStart.getDate() + 6);

  // 本月時間範圍
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

  // 本週出團數量（排除特殊團）
  const toursThisWeek = normalTours.filter(tour => {
    const departureDate = new Date(tour.departure_date);
    return departureDate >= weekStart && departureDate <= weekEnd;
  }).length;

  // 本月出團數量（排除特殊團）
  const toursThisMonth = normalTours.filter(tour => {
    const departureDate = new Date(tour.departure_date);
    return departureDate >= monthStart && departureDate <= monthEnd;
  }).length;

  // 本週請款金額（本週出發的團，排除特殊團）
  const paymentsThisWeek = orders
    .filter(order => {
      const tour = normalTours.find(t => t.id === order.tour_id);
      if (!tour) return false;
      const departureDate = new Date(tour.departure_date);
      return departureDate >= weekStart && departureDate <= weekEnd;
    })
    .reduce((sum, order) => sum + (order.total_amount || 0), 0);

  // 下週請款金額（下週出發的團，排除特殊團）
  const paymentsNextWeek = orders
    .filter(order => {
      const tour = normalTours.find(t => t.id === order.tour_id);
      if (!tour) return false;
      const departureDate = new Date(tour.departure_date);
      return departureDate >= nextWeekStart && departureDate <= nextWeekEnd;
    })
    .reduce((sum, order) => sum + (order.total_amount || 0), 0);

  // 本週甲存金額（本週出發的團已付款，排除特殊團）
  const depositsThisWeek = orders
    .filter(order => {
      const tour = normalTours.find(t => t.id === order.tour_id);
      if (!tour) return false;
      const departureDate = new Date(tour.departure_date);
      return departureDate >= weekStart && departureDate <= weekEnd;
    })
    .reduce((sum, order) => sum + (order.paid_amount || 0), 0);

  // 待辦事項數量（簡化版：未收齊款且即將出發的訂單，排除特殊團）
  const todosCount = orders.filter(order => {
    if (order.payment_status === 'paid') return false;
    const tour = normalTours.find(t => t.id === order.tour_id);
    if (!tour) return false;
    const departureDate = new Date(tour.departure_date);
    const daysUntilDeparture = Math.ceil((departureDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilDeparture <= 14 && daysUntilDeparture >= 0;
  }).length;

  const allStats = [
    {
      id: 'todos',
      label: '待辦事項',
      value: todosCount,
      icon: CheckSquare,
      color: 'text-morandi-gold',
      bgColor: 'bg-morandi-gold/10',
    },
    {
      id: 'paymentsThisWeek',
      label: '本週請款',
      value: `NT$ ${paymentsThisWeek.toLocaleString()}`,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      id: 'paymentsNextWeek',
      label: '下週請款',
      value: `NT$ ${paymentsNextWeek.toLocaleString()}`,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      id: 'depositsThisWeek',
      label: '本週甲存',
      value: `NT$ ${depositsThisWeek.toLocaleString()}`,
      icon: Briefcase,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      id: 'toursThisWeek',
      label: '本週出團',
      value: `${toursThisWeek} 團`,
      icon: Calendar,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      id: 'toursThisMonth',
      label: '本月出團',
      value: `${toursThisMonth} 團`,
      icon: Calendar,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
    },
  ];

  // 只顯示使用者選擇的統計
  const stats = allStats.filter(stat => activeStats.includes(stat.id));

  return (
    <Card className="overflow-hidden flex flex-col h-full border border-[#E6DDD4] shadow-sm rounded-2xl hover:shadow-md hover:border-morandi-gold/50 transition-all duration-200">
      <div className="bg-morandi-container px-4 py-3 border-b border-[#E6DDD4] flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-morandi-gold" />
            <h3 className="font-semibold text-sm text-morandi-primary">統計資訊</h3>
          </div>
          <button
            onClick={() => setIsConfigOpen(!isConfigOpen)}
            className="p-1 rounded-lg text-morandi-secondary hover:text-morandi-primary hover:bg-morandi-gold/10 transition-all"
            title="統計設定"
          >
            <Settings className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* 設定面板 */}
        {isConfigOpen && (
          <div className="mt-3 pt-3 border-t border-[#E6DDD4]/50">
            <div className="text-xs text-morandi-secondary mb-2">選擇要顯示的統計項目</div>
            <div className="grid grid-cols-2 gap-2">
              {allStats.map((stat) => (
                <label
                  key={stat.id}
                  className="flex items-center gap-2 cursor-pointer text-xs p-2 rounded-lg hover:bg-white/50 transition-all"
                >
                  <input
                    type="checkbox"
                    checked={activeStats.includes(stat.id)}
                    onChange={() => toggleStat(stat.id)}
                    className="w-3 h-3 rounded border-morandi-gold/30 text-morandi-gold focus:ring-morandi-gold/20"
                  />
                  <span className="text-morandi-primary">{stat.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="p-4 flex-1 overflow-auto min-h-0">
        {stats.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-morandi-muted text-sm">
              <Settings className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>尚未選擇任何統計項目</p>
              <p className="text-xs mt-1">點擊右上角設定圖示選擇</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.id}
                  className="bg-white rounded-xl p-4 border border-[#E6DDD4] hover:border-morandi-gold/50 transition-all"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                      <Icon className={`h-4 w-4 ${stat.color}`} />
                    </div>
                  </div>
                  <div className="text-xs text-morandi-secondary mb-1">{stat.label}</div>
                  <div className="text-lg font-bold text-morandi-primary">{stat.value}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}

// 小工具配置
const AVAILABLE_WIDGETS: WidgetConfig[] = [
  { id: 'stats', name: '統計資訊', icon: BarChart3, component: StatsWidget, span: 2 },
  { id: 'calculator', name: '計算機', icon: Calculator, component: CalculatorWidget },
  { id: 'currency', name: '匯率換算', icon: DollarSign, component: CurrencyWidget },
  { id: 'timer', name: '計時器', icon: Clock, component: TimerWidget },
  { id: 'notes', name: '便條紙', icon: Clipboard, component: NotesWidget },
];

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [activeWidgets, setActiveWidgets] = useState<WidgetType[]>([
    'calculator',
    'currency',
  ]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    } else {
      setIsLoading(false);
      // 從 localStorage 載入小工具設定
      const saved = localStorage.getItem('homepage-widgets');
      if (saved) {
        setActiveWidgets(JSON.parse(saved));
      }
    }
  }, [isAuthenticated, router]);

  const toggleWidget = (widgetId: WidgetType) => {
    const newWidgets = activeWidgets.includes(widgetId)
      ? activeWidgets.filter((id) => id !== widgetId)
      : [...activeWidgets, widgetId];
    setActiveWidgets(newWidgets);
    localStorage.setItem('homepage-widgets', JSON.stringify(newWidgets));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-morandi-gold mx-auto"></div>
          <p className="mt-4 text-morandi-muted">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="首頁"
        breadcrumb={[{ label: '首頁', href: '/' }]}
        actions={
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 bg-white border-[#E6DDD4] hover:border-morandi-gold transition-all rounded-xl">
                <Settings className="h-4 w-4" />
                小工具設定
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md border-[#E6DDD4] shadow-lg rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl text-morandi-primary">選擇要顯示的小工具</DialogTitle>
                <p className="text-sm text-morandi-muted mt-1">勾選你想在首頁顯示的小工具</p>
              </DialogHeader>
              <div className="space-y-2 py-4">
                {AVAILABLE_WIDGETS.map((widget) => {
                  const Icon = widget.icon;
                  return (
                    <div
                      key={widget.id}
                      className="flex items-center space-x-3 p-4 rounded-xl border border-[#E6DDD4] bg-white hover:border-morandi-gold cursor-pointer transition-all shadow-sm"
                      onClick={() => toggleWidget(widget.id)}
                    >
                      <Checkbox
                        checked={activeWidgets.includes(widget.id)}
                        onCheckedChange={() => toggleWidget(widget.id)}
                      />
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#B5986A]/10 to-[#D4C4A8]/10 flex items-center justify-center shadow-sm">
                          <Icon className="h-5 w-5 text-morandi-gold" />
                        </div>
                        <span className="font-medium text-morandi-primary">{widget.name}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="flex-1 overflow-auto min-h-0">
        {activeWidgets.length === 0 ? (
          <Card className="p-12 text-center border-[#E6DDD4] shadow-sm rounded-2xl bg-white">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-[#B5986A]/10 to-[#D4C4A8]/10 flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Settings className="h-8 w-8 text-morandi-gold" />
              </div>
              <h3 className="text-lg font-semibold text-morandi-primary mb-2">尚未選擇任何小工具</h3>
              <p className="text-sm text-morandi-muted mb-6">
                點擊右上角「小工具設定」來新增你需要的工具
              </p>
            </div>
          </Card>
        ) : (
          <div className="h-full grid md:grid-cols-2 xl:grid-cols-3 md:grid-rows-3 xl:grid-rows-2 gap-6 auto-rows-fr">
            {AVAILABLE_WIDGETS.filter((w) => activeWidgets.includes(w.id)).map(
              (widget) => {
                const Component = widget.component;
                return (
                  <div key={widget.id} className={`h-full ${widget.span === 2 ? 'md:col-span-2' : ''}`}>
                    <Component />
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>
    </div>
  );
}
