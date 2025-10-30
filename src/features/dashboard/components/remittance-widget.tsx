'use client'

import { useState } from 'react'
import { Banknote, Search, Loader2, AlertCircle, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RemittanceOption {
  provider: string
  fee: number
  exchangeRate: number
  total: number
  deliveryTime: string
}

const COUNTRIES = [
  { code: 'TW', name: '台灣', currency: 'TWD', symbol: 'NT$' },
  { code: 'TH', name: '泰國', currency: 'THB', symbol: '฿' },
  { code: 'JP', name: '日本', currency: 'JPY', symbol: '¥' },
  { code: 'KR', name: '韓國', currency: 'KRW', symbol: '₩' },
  { code: 'CN', name: '中國', currency: 'CNY', symbol: '¥' },
  { code: 'VN', name: '越南', currency: 'VND', symbol: '₫' },
  { code: 'US', name: '美國', currency: 'USD', symbol: '$' },
  { code: 'GB', name: '英國', currency: 'GBP', symbol: '£' },
  { code: 'AU', name: '澳洲', currency: 'AUD', symbol: 'A$' },
]

export function RemittanceWidget() {
  const [from, setFrom] = useState('TW')
  const [to, setTo] = useState('TH')
  const [amount, setAmount] = useState('10000')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<RemittanceOption[]>([])

  const fromCountry = COUNTRIES.find(c => c.code === from)
  const toCountry = COUNTRIES.find(c => c.code === to)

  const compareRates = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('請輸入有效金額')
      return
    }

    if (from === to) {
      setError('匯款國家和收款國家不能相同')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // TODO: 接入 World Bank API
      // const response = await fetch(`https://api.worldbank.org/v2/country/${from}/indicator/SI.RMT.COST.IB.ZS?format=json`);

      await new Promise(resolve => setTimeout(resolve, 1000))

      // 模擬資料
      const mockResults: RemittanceOption[] = [
        {
          provider: '銀行電匯',
          fee: parseFloat(amount) * 0.015,
          exchangeRate: getMockExchangeRate(from, to),
          total: 0,
          deliveryTime: '3-5 工作天',
        },
        {
          provider: 'Western Union',
          fee: parseFloat(amount) * 0.02,
          exchangeRate: getMockExchangeRate(from, to) * 0.98,
          total: 0,
          deliveryTime: '即時',
        },
        {
          provider: 'Wise (TransferWise)',
          fee: parseFloat(amount) * 0.005,
          exchangeRate: getMockExchangeRate(from, to) * 0.995,
          total: 0,
          deliveryTime: '1-2 工作天',
        },
      ]

      // 計算總成本
      mockResults.forEach(option => {
        option.total = (parseFloat(amount) - option.fee) * option.exchangeRate
      })

      // 按最划算排序
      mockResults.sort((a, b) => b.total - a.total)

      setResults(mockResults)
    } catch (err) {
      setError(err instanceof Error ? err.message : '查詢失敗，請稍後再試')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const getMockExchangeRate = (from: string, to: string): number => {
    const rates: Record<string, Record<string, number>> = {
      TW: { TH: 1.05, JP: 4.5, US: 0.032 },
      US: { TW: 31.5, TH: 33, JP: 140 },
    }

    return rates[from]?.[to] || 1
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      compareRates()
    }
  }

  return (
    <div className="h-full">
      <div
        className={cn(
          'h-full rounded-2xl border border-white/70 shadow-xl backdrop-blur-md transition-all duration-300 hover:shadow-2xl hover:border-white/80',
          'bg-gradient-to-br from-amber-50 via-white to-orange-50'
        )}
      >
        <div className="p-5 space-y-4 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'rounded-full p-2.5 text-white shadow-lg shadow-black/10',
                'bg-gradient-to-br from-amber-200/60 to-orange-100/60',
                'ring-2 ring-white/50 ring-offset-1 ring-offset-white/20'
              )}
            >
              <Banknote className="w-5 h-5 drop-shadow-sm" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-morandi-primary leading-tight tracking-wide">
                匯款比較
              </p>
              <p className="text-xs text-morandi-secondary/90 mt-1.5 leading-relaxed">
                比較不同匯款管道的手續費
              </p>
            </div>
          </div>

          {/* 查詢表單 */}
          <div className="rounded-xl bg-white/70 p-3.5 shadow-md border border-white/40 space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs font-semibold text-morandi-primary mb-2 block">
                  匯出國
                </label>
                <select
                  value={from}
                  onChange={e => setFrom(e.target.value)}
                  className="w-full px-2 py-2 text-xs font-medium border border-white/60 rounded-xl bg-white/90 hover:bg-white focus:bg-white transition-all outline-none shadow-sm backdrop-blur-sm"
                >
                  {COUNTRIES.map(country => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-morandi-primary mb-2 block">
                  收款國
                </label>
                <select
                  value={to}
                  onChange={e => setTo(e.target.value)}
                  className="w-full px-2 py-2 text-xs font-medium border border-white/60 rounded-xl bg-white/90 hover:bg-white focus:bg-white transition-all outline-none shadow-sm backdrop-blur-sm"
                >
                  {COUNTRIES.map(country => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-morandi-primary mb-2 block">
                  金額
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="10000"
                  className="w-full px-2 py-2 text-xs font-medium border border-white/60 rounded-xl bg-white/90 hover:bg-white focus:bg-white transition-all outline-none shadow-sm backdrop-blur-sm"
                />
              </div>
            </div>

            <button
              onClick={compareRates}
              disabled={loading}
              className={cn(
                'w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 shadow-md',
                'bg-gradient-to-br from-amber-200/60 to-orange-100/60 hover:from-amber-300/60 hover:to-orange-200/60',
                'text-morandi-primary disabled:opacity-50 disabled:cursor-not-allowed',
                'flex items-center justify-center gap-2'
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  比較中...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  比較
                </>
              )}
            </button>
          </div>

          {/* 錯誤訊息 */}
          {error && (
            <div className="rounded-xl bg-red-50/80 border border-red-200/50 p-3.5 backdrop-blur-sm">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-600 font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* 比較結果 */}
          {results.length > 0 && !error && (
            <div className="flex-1 overflow-auto space-y-2">
              {results.map((option, index) => (
                <div
                  key={index}
                  className={cn(
                    'rounded-xl p-3 shadow-md border transition-all',
                    index === 0
                      ? 'bg-gradient-to-br from-green-100/90 to-emerald-100/90 border-green-300/50'
                      : 'bg-white/70 border-white/40'
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {index === 0 && (
                        <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center">
                          <TrendingDown className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                      <p
                        className={cn(
                          'font-bold text-sm',
                          index === 0 ? 'text-green-700' : 'text-morandi-primary'
                        )}
                      >
                        {option.provider}
                      </p>
                      {index === 0 && (
                        <span className="text-xs px-2 py-0.5 bg-green-600 text-white rounded-full font-semibold">
                          最划算
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-morandi-secondary">{option.deliveryTime}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white/50 rounded-lg p-2">
                      <p className="text-xs text-morandi-secondary mb-1">手續費</p>
                      <p className="font-semibold text-xs text-red-600">
                        -{fromCountry?.symbol}
                        {option.fee.toFixed(0)}
                      </p>
                    </div>
                    <div className="bg-white/50 rounded-lg p-2">
                      <p className="text-xs text-morandi-secondary mb-1">匯率</p>
                      <p className="font-semibold text-xs text-morandi-primary">
                        {option.exchangeRate.toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-white/50 rounded-lg p-2">
                      <p className="text-xs text-morandi-secondary mb-1">實收</p>
                      <p className="font-bold text-sm text-green-600">
                        {toCountry?.symbol}
                        {option.total.toFixed(0)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {/* 提示 */}
              <div className="bg-amber-50/80 rounded-lg p-3 border border-amber-200/50 mt-3">
                <p className="text-xs text-amber-800">
                  ⚠️ 此資訊僅供參考，實際費率請以各管道最新公告為準
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
