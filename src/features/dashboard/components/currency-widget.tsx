'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';

export function CurrencyWidget() {
  // 預設匯率（1 外幣 = ? 台幣）
  const DEFAULT_RATES = useMemo(() => ({
    USD: { rate: 31.5, symbol: '$', name: '美金' },
    JPY: { rate: 0.21, symbol: '¥', name: '日幣' },
    KRW: { rate: 0.024, symbol: '₩', name: '韓元' },
    CNY: { rate: 4.35, symbol: '¥', name: '人民幣' },
    VND: { rate: 0.00127, symbol: '₫', name: '越南盾' },
    IDR: { rate: 0.002, symbol: 'Rp', name: '印尼盾' },
  }), []);

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
  }, [selectedCurrency, useCustomRate, DEFAULT_RATES]);

  // 計算外幣金額（台幣 → 外幣）
  const calculateForeign = useCallback((twd: string): string => {
    const amount = parseFloat(twd) || 0;
    const rate = parseFloat(customRate) || 0;
    if (rate === 0) return '0';
    return (amount / rate).toFixed(2);
  }, [customRate]);

  // 計算台幣金額（外幣 → 台幣）
  const calculateTWD = useCallback((foreign: string): string => {
    const amount = parseFloat(foreign) || 0;
    const rate = parseFloat(customRate) || 0;
    return (amount * rate).toFixed(2);
  }, [customRate]);

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
  }, [customRate, direction, twdAmount, foreignAmount, calculateForeign, calculateTWD]);

  // 初始化外幣金額
  useEffect(() => {
    setForeignAmount(calculateForeign(twdAmount));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 只在組件掛載時執行一次

  const currencyInfo = DEFAULT_RATES[selectedCurrency];

  // 切換方向
  const swapDirection = () => {
    setDirection(prev => prev === 'twd-to-foreign' ? 'foreign-to-twd' : 'twd-to-foreign');
  };

  return (
    <Card className="overflow-hidden flex flex-col h-full border border-morandi-gold/20 shadow-sm rounded-2xl hover:shadow-md hover:border-morandi-gold/20 transition-all duration-200">
      <div className="bg-morandi-container px-4 py-3 border-b border-morandi-gold/20 flex-shrink-0">
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
            className="w-full px-3 py-2 text-sm border border-morandi-gold/20 rounded-xl bg-white hover:border-morandi-gold focus:border-morandi-gold focus:ring-2 focus:ring-morandi-gold/10 transition-all outline-none"
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
                className="w-full px-3 py-2 pl-[42px] border border-morandi-gold/20 rounded-xl font-mono text-sm bg-white hover:border-morandi-gold focus:border-morandi-gold focus:ring-2 focus:ring-morandi-gold/10 transition-all outline-none"
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
                className="w-full px-3 py-2 pl-[42px] border border-morandi-gold/20 rounded-xl font-mono text-sm bg-white hover:border-morandi-gold focus:border-morandi-gold focus:ring-2 focus:ring-morandi-gold/10 transition-all outline-none"
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
            className="w-full px-4 py-2.5 border border-morandi-gold/20 rounded-xl font-mono text-sm bg-white hover:border-morandi-gold focus:border-morandi-gold focus:ring-2 focus:ring-morandi-gold/10 transition-all outline-none"
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
