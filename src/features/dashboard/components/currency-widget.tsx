'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { DollarSign, ArrowRightLeft, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CurrencyWidget() {
  // 預設匯率（1 外幣 = ? 台幣）
  const DEFAULT_RATES = useMemo(() => ({
    USD: { rate: 31.5, symbol: '$', name: '美金', color: 'from-blue-200/60 to-cyan-100/60', gradient: 'bg-gradient-to-br from-blue-50 via-white to-cyan-50' },
    JPY: { rate: 0.21, symbol: '¥', name: '日幣', color: 'from-red-200/60 to-pink-100/60', gradient: 'bg-gradient-to-br from-red-50 via-white to-pink-50' },
    KRW: { rate: 0.024, symbol: '₩', name: '韓元', color: 'from-purple-200/60 to-violet-100/60', gradient: 'bg-gradient-to-br from-purple-50 via-white to-violet-50' },
    CNY: { rate: 4.35, symbol: '¥', name: '人民幣', color: 'from-orange-200/60 to-amber-100/60', gradient: 'bg-gradient-to-br from-orange-50 via-white to-amber-50' },
    VND: { rate: 0.00127, symbol: '₫', name: '越南盾', color: 'from-emerald-200/60 to-teal-100/60', gradient: 'bg-gradient-to-br from-emerald-50 via-white to-teal-50' },
    IDR: { rate: 0.002, symbol: 'Rp', name: '印尼盾', color: 'from-rose-200/60 to-pink-100/60', gradient: 'bg-gradient-to-br from-rose-50 via-white to-pink-50' },
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
    <div className="h-full">
      <div
        className={cn(
          'h-full rounded-2xl border border-white/70 shadow-xl backdrop-blur-md transition-all duration-300 hover:shadow-2xl hover:border-white/80',
          currencyInfo.gradient
        )}
      >
        <div className="p-5 space-y-4 h-full flex flex-col">
          {/* Header with Icon */}
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'rounded-full p-2.5 text-white shadow-lg shadow-black/10',
                'bg-gradient-to-br',
                currencyInfo.color,
                'ring-2 ring-white/50 ring-offset-1 ring-offset-white/20'
              )}
            >
              <DollarSign className="w-5 h-5 drop-shadow-sm" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-morandi-primary leading-tight tracking-wide">匯率換算</p>
              <p className="text-xs text-morandi-secondary/90 mt-1.5 leading-relaxed">
                輕鬆計算各國貨幣，掌握即時匯率
              </p>
            </div>
          </div>

          {/* Currency Selection */}
          <div className="rounded-xl bg-white/70 p-3.5 shadow-md border border-white/40">
            <label className="text-xs font-semibold text-morandi-primary mb-2 block">選擇貨幣</label>
            <select
              value={selectedCurrency}
              onChange={(e) => {
                setSelectedCurrency(e.target.value as keyof typeof DEFAULT_RATES);
                setUseCustomRate(false);
              }}
              className="w-full px-3.5 py-2.5 text-sm font-medium border border-white/60 rounded-xl bg-white/90 hover:bg-white focus:bg-white focus:border-morandi-gold/60 focus:ring-2 focus:ring-morandi-gold/20 transition-all outline-none shadow-sm backdrop-blur-sm"
            >
              {Object.entries(DEFAULT_RATES).map(([code, info]) => (
                <option key={code} value={code}>
                  {info.symbol} {info.name} ({code})
                </option>
              ))}
            </select>
          </div>

          {/* Currency Conversion - Side by Side */}
          <div className="rounded-xl bg-white/70 p-3.5 shadow-md border border-white/40">
            <div className="flex items-end gap-2">
              {/* TWD Input */}
              <div className="flex-1">
                <label className="text-xs font-semibold text-morandi-primary mb-2 block">台幣 (TWD)</label>
                <div className="relative group">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-morandi-secondary/70 text-xs font-semibold">NT$</span>
                  <input
                    type="number"
                    value={twdAmount}
                    onChange={(e) => handleTwdChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 pl-[46px] border border-white/60 rounded-xl font-mono text-sm font-medium bg-white/90 hover:bg-white hover:shadow-sm focus:bg-white focus:border-morandi-gold/60 focus:ring-2 focus:ring-morandi-gold/20 transition-all outline-none shadow-sm backdrop-blur-sm"
                    placeholder="10000"
                  />
                </div>
              </div>

              {/* Arrow Button */}
              <button
                onClick={swapDirection}
                className="p-2.5 hover:bg-white/80 rounded-xl transition-all group mb-0.5 shadow-sm hover:shadow-md border border-transparent hover:border-white/60"
                title="切換方向"
              >
                <ArrowRightLeft className="h-4 w-4 text-morandi-gold group-hover:scale-110 group-hover:rotate-180 transition-all duration-300" />
              </button>

              {/* Foreign Currency Input */}
              <div className="flex-1">
                <label className="text-xs font-semibold text-morandi-primary mb-2 block">
                  {currencyInfo.name} ({selectedCurrency})
                </label>
                <div className="relative group">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-morandi-secondary/70 text-xs font-semibold">
                    {currencyInfo.symbol}
                  </span>
                  <input
                    type="number"
                    value={foreignAmount}
                    onChange={(e) => handleForeignChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 pl-[46px] border border-white/60 rounded-xl font-mono text-sm font-medium bg-white/90 hover:bg-white hover:shadow-sm focus:bg-white focus:border-morandi-gold/60 focus:ring-2 focus:ring-morandi-gold/20 transition-all outline-none shadow-sm backdrop-blur-sm"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Exchange Rate Setting */}
          <div className="rounded-xl bg-white/70 p-3.5 shadow-md border border-white/40 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-morandi-primary">
                匯率 (1 {selectedCurrency} = ? TWD)
              </label>
              <button
                onClick={() => {
                  setUseCustomRate(false);
                  setCustomRate(DEFAULT_RATES[selectedCurrency].rate.toString());
                }}
                className="text-xs text-morandi-gold hover:text-morandi-gold/80 font-semibold transition-all hover:scale-105 px-2 py-1 rounded-lg hover:bg-morandi-gold/10"
              >
                重設
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
              className="w-full px-3.5 py-2.5 border border-white/60 rounded-xl font-mono text-sm font-medium bg-white/90 hover:bg-white hover:shadow-sm focus:bg-white focus:border-morandi-gold/60 focus:ring-2 focus:ring-morandi-gold/20 transition-all outline-none shadow-sm backdrop-blur-sm"
              placeholder="輸入匯率"
            />
            <div className="flex items-center gap-1.5 text-xs text-morandi-secondary/90 bg-white/40 px-2.5 py-1.5 rounded-lg">
              <TrendingUp className="w-3.5 h-3.5 text-morandi-gold" />
              <span className="font-medium">
                {useCustomRate
                  ? '已自訂匯率'
                  : `預設匯率: ${DEFAULT_RATES[selectedCurrency].rate}`
                }
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
