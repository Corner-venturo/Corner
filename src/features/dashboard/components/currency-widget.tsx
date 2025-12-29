'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { DollarSign, ArrowRightLeft, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function CurrencyWidget() {
  // 預設匯率（1 外幣 = ? 台幣）
  const DEFAULT_RATES = useMemo(
    () => ({
      USD: {
        rate: 31.5,
        symbol: '$',
        name: '美金',
        color: 'from-morandi-green/30 to-morandi-green/10',
        gradient: 'bg-gradient-to-br from-status-success-bg via-white to-morandi-green/5',
      },
      JPY: {
        rate: 0.21,
        symbol: '¥',
        name: '日幣',
        color: 'from-morandi-red/30 to-morandi-red/10',
        gradient: 'bg-gradient-to-br from-status-danger-bg via-white to-morandi-red/5',
      },
      KRW: {
        rate: 0.024,
        symbol: '₩',
        name: '韓元',
        color: 'from-morandi-secondary/40 to-morandi-container/60',
        gradient: 'bg-gradient-to-br from-morandi-container/20 via-white to-morandi-secondary/10',
      },
      CNY: {
        rate: 4.35,
        symbol: '¥',
        name: '人民幣',
        color: 'from-status-warning-bg to-morandi-gold/20',
        gradient: 'bg-gradient-to-br from-status-warning-bg via-white to-morandi-gold/10',
      },
      VND: {
        rate: 0.00127,
        symbol: '₫',
        name: '越南盾',
        color: 'from-morandi-green/40 to-morandi-green/20',
        gradient: 'bg-gradient-to-br from-morandi-green/10 via-white to-morandi-container/20',
      },
      IDR: {
        rate: 0.002,
        symbol: 'Rp',
        name: '印尼盾',
        color: 'from-morandi-red/30 to-morandi-container/40',
        gradient: 'bg-gradient-to-br from-morandi-red/5 via-white to-morandi-container/10',
      },
    }),
    []
  )

  const [twdAmount, setTwdAmount] = useState('10000')
  const [foreignAmount, setForeignAmount] = useState('')
  const [selectedCurrency, setSelectedCurrency] = useState<keyof typeof DEFAULT_RATES>('USD')
  const [customRate, setCustomRate] = useState(DEFAULT_RATES.USD.rate.toString())
  const [useCustomRate, setUseCustomRate] = useState(false)
  const [direction, setDirection] = useState<'twd-to-foreign' | 'foreign-to-twd'>('twd-to-foreign')

  // 當切換貨幣時，更新匯率
  useEffect(() => {
    if (!useCustomRate) {
      setCustomRate(DEFAULT_RATES[selectedCurrency].rate.toString())
    }
  }, [selectedCurrency, useCustomRate, DEFAULT_RATES])

  // 計算外幣金額（台幣 → 外幣）
  const calculateForeign = useCallback(
    (twd: string): string => {
      const amount = parseFloat(twd) || 0
      const rate = parseFloat(customRate) || 0
      if (rate === 0) return '0'
      return (amount / rate).toFixed(2)
    },
    [customRate]
  )

  // 計算台幣金額（外幣 → 台幣）
  const calculateTWD = useCallback(
    (foreign: string): string => {
      const amount = parseFloat(foreign) || 0
      const rate = parseFloat(customRate) || 0
      return (amount * rate).toFixed(2)
    },
    [customRate]
  )

  // 當台幣金額變更
  const handleTwdChange = (value: string) => {
    setTwdAmount(value)
    setDirection('twd-to-foreign')
    setForeignAmount(calculateForeign(value))
  }

  // 當外幣金額變更
  const handleForeignChange = (value: string) => {
    setForeignAmount(value)
    setDirection('foreign-to-twd')
    setTwdAmount(calculateTWD(value))
  }

  // 當匯率變更時，重新計算
  useEffect(() => {
    if (direction === 'twd-to-foreign') {
      setForeignAmount(calculateForeign(twdAmount))
    } else {
      setTwdAmount(calculateTWD(foreignAmount))
    }
  }, [customRate, direction, twdAmount, foreignAmount, calculateForeign, calculateTWD])

  // 初始化外幣金額
  useEffect(() => {
    setForeignAmount(calculateForeign(twdAmount))
     
  }, []) // 只在組件掛載時執行一次

  const currencyInfo = DEFAULT_RATES[selectedCurrency]

  // 切換方向
  const swapDirection = () => {
    setDirection(prev => (prev === 'twd-to-foreign' ? 'foreign-to-twd' : 'twd-to-foreign'))
  }

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
              <p className="text-sm font-semibold text-morandi-primary leading-tight tracking-wide">
                匯率換算
              </p>
              <p className="text-xs text-morandi-secondary/90 mt-1.5 leading-relaxed">
                輕鬆計算各國貨幣，掌握即時匯率
              </p>
            </div>
          </div>

          {/* Currency Selection */}
          <div className="rounded-xl bg-white/70 p-3.5 shadow-md border border-white/40">
            <label className="text-xs font-semibold text-morandi-primary mb-2 block">
              選擇貨幣
            </label>
            <Select
              value={selectedCurrency}
              onValueChange={(value) => {
                setSelectedCurrency(value as keyof typeof DEFAULT_RATES)
                setUseCustomRate(false)
              }}
            >
              <SelectTrigger className="w-full px-3.5 py-2.5 text-sm font-medium border border-white/60 rounded-xl bg-white/90 hover:bg-white focus:bg-white transition-all outline-none shadow-sm backdrop-blur-sm">
                <SelectValue placeholder="選擇貨幣" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DEFAULT_RATES).map(([code, info]) => (
                  <SelectItem key={code} value={code}>
                    {info.symbol} {info.name} ({code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Currency Conversion - Side by Side */}
          <div className="rounded-xl bg-white/70 p-3.5 shadow-md border border-white/40">
            <div className="flex items-end gap-2">
              {/* Left Input - 根據 direction 決定顯示哪個貨幣 */}
              <div className="flex-1">
                <label className="text-xs font-semibold text-morandi-primary mb-2 block">
                  {direction === 'twd-to-foreign' ? '台幣 (TWD)' : `${currencyInfo.name} (${selectedCurrency})`}
                </label>
                <div className="relative group">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-morandi-secondary/70 text-xs font-semibold">
                    {direction === 'twd-to-foreign' ? 'NT$' : currencyInfo.symbol}
                  </span>
                  <input
                    type="number"
                    value={direction === 'twd-to-foreign' ? twdAmount : foreignAmount}
                    onChange={e => direction === 'twd-to-foreign' ? handleTwdChange(e.target.value) : handleForeignChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 pl-[46px] border border-white/60 rounded-xl font-mono text-sm font-medium bg-white/90 hover:bg-white hover:shadow-sm focus:bg-white transition-all outline-none shadow-sm backdrop-blur-sm"
                    placeholder={direction === 'twd-to-foreign' ? '10000' : '0.00'}
                  />
                </div>
              </div>

              {/* Arrow Button - 交換左右位置 */}
              <button
                onClick={swapDirection}
                className="p-2.5 hover:bg-white/80 rounded-xl transition-all group mb-0.5 shadow-sm hover:shadow-md border border-transparent hover:border-white/60"
                title="交換左右位置"
              >
                <ArrowRightLeft className={cn(
                  "h-4 w-4 text-morandi-gold group-hover:scale-110 transition-all duration-300",
                  direction === 'foreign-to-twd' && "rotate-180"
                )} />
              </button>

              {/* Right Input - 根據 direction 決定顯示哪個貨幣 */}
              <div className="flex-1">
                <label className="text-xs font-semibold text-morandi-primary mb-2 block">
                  {direction === 'twd-to-foreign' ? `${currencyInfo.name} (${selectedCurrency})` : '台幣 (TWD)'}
                </label>
                <div className="relative group">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-morandi-secondary/70 text-xs font-semibold">
                    {direction === 'twd-to-foreign' ? currencyInfo.symbol : 'NT$'}
                  </span>
                  <input
                    type="number"
                    value={direction === 'twd-to-foreign' ? foreignAmount : twdAmount}
                    onChange={e => direction === 'twd-to-foreign' ? handleForeignChange(e.target.value) : handleTwdChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 pl-[46px] border border-white/60 rounded-xl font-mono text-sm font-medium bg-white/90 hover:bg-white hover:shadow-sm focus:bg-white transition-all outline-none shadow-sm backdrop-blur-sm"
                    placeholder={direction === 'twd-to-foreign' ? '0.00' : '10000'}
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
                  setUseCustomRate(false)
                  setCustomRate(DEFAULT_RATES[selectedCurrency].rate.toString())
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
              onChange={e => {
                setCustomRate(e.target.value)
                setUseCustomRate(true)
              }}
              className="w-full px-3.5 py-2.5 border border-white/60 rounded-xl font-mono text-sm font-medium bg-white/90 hover:bg-white hover:shadow-sm focus:bg-white transition-all outline-none shadow-sm backdrop-blur-sm"
              placeholder="輸入匯率"
            />
            <div className="flex items-center gap-1.5 text-xs text-morandi-secondary/90 bg-white/40 px-2.5 py-1.5 rounded-lg">
              <TrendingUp className="w-3.5 h-3.5 text-morandi-gold" />
              <span className="font-medium">
                {useCustomRate ? '已自訂匯率' : `預設匯率: ${DEFAULT_RATES[selectedCurrency].rate}`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
