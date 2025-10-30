'use client'

import { useState, useEffect } from 'react'
import {
  Shield,
  Search,
  Loader2,
  AlertCircle,
  Globe,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface VisaResult {
  passport: string
  passportName: string
  destination: string
  destinationName: string
  visaRequired: 'visa-free' | 'visa-on-arrival' | 'e-visa' | 'visa-required'
  stayDuration?: string
  notes?: string
}

const STORAGE_KEY = 'visa-widget-last-query'

// 常見護照國家
const PASSPORT_COUNTRIES = [
  { code: 'TW', name: '台灣' },
  { code: 'CN', name: '中國' },
  { code: 'HK', name: '香港' },
  { code: 'JP', name: '日本' },
  { code: 'KR', name: '韓國' },
  { code: 'SG', name: '新加坡' },
  { code: 'MY', name: '馬來西亞' },
  { code: 'TH', name: '泰國' },
  { code: 'US', name: '美國' },
  { code: 'GB', name: '英國' },
  { code: 'CA', name: '加拿大' },
  { code: 'AU', name: '澳洲' },
]

// 常見目的地
const DESTINATIONS = [
  { code: 'JP', name: '日本' },
  { code: 'KR', name: '韓國' },
  { code: 'TH', name: '泰國' },
  { code: 'SG', name: '新加坡' },
  { code: 'MY', name: '馬來西亞' },
  { code: 'ID', name: '印尼' },
  { code: 'VN', name: '越南' },
  { code: 'PH', name: '菲律賓' },
  { code: 'US', name: '美國' },
  { code: 'GB', name: '英國' },
  { code: 'FR', name: '法國' },
  { code: 'IT', name: '義大利' },
  { code: 'ES', name: '西班牙' },
  { code: 'AU', name: '澳洲' },
  { code: 'NZ', name: '紐西蘭' },
  { code: 'CA', name: '加拿大' },
  { code: 'AE', name: '阿聯酋' },
  { code: 'TR', name: '土耳其' },
]

// 簽證狀態資訊
const VISA_STATUS = {
  'visa-free': {
    label: '免簽證',
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    description: '可直接入境，無需事先申請簽證',
  },
  'visa-on-arrival': {
    label: '落地簽',
    icon: Clock,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    description: '抵達時於機場/口岸申請簽證',
  },
  'e-visa': {
    label: '電子簽證',
    icon: Globe,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    description: '需事先上網申請電子簽證',
  },
  'visa-required': {
    label: '需要簽證',
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    description: '需事先至使館/領事館申請簽證',
  },
}

export function VisaWidget() {
  const [passport, setPassport] = useState('TW')
  const [destination, setDestination] = useState('JP')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<VisaResult | null>(null)

  // 載入上次查詢
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const query = JSON.parse(saved)
      setPassport(query.passport || 'TW')
      setDestination(query.destination || 'JP')
    }
  }, [])

  // 查詢簽證資訊
  const checkVisa = async () => {
    if (!passport || !destination) {
      setError('請選擇護照國家和目的地')
      return
    }

    if (passport === destination) {
      setError('護照國家和目的地不能相同')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // TODO: 替換為真實 API 呼叫
      // const response = await fetch('https://visa-requirement.p.rapidapi.com/v2/visa/check', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'X-RapidAPI-Key': process.env.NEXT_PUBLIC_RAPIDAPI_KEY || '',
      //   },
      //   body: JSON.stringify({ passport, destination }),
      // });

      // 模擬 API 延遲
      await new Promise(resolve => setTimeout(resolve, 1000))

      // 模擬資料
      const mockData: VisaResult = {
        passport,
        passportName: PASSPORT_COUNTRIES.find(c => c.code === passport)?.name || passport,
        destination,
        destinationName: DESTINATIONS.find(c => c.code === destination)?.name || destination,
        visaRequired: getMockVisaStatus(passport, destination),
        stayDuration: getMockStayDuration(passport, destination),
        notes: getMockNotes(passport, destination),
      }

      setResult(mockData)

      // 儲存查詢記錄
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ passport, destination }))
    } catch (err) {
      setError(err instanceof Error ? err.message : '查詢失敗，請稍後再試')
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  // 模擬簽證狀態（實際使用時會從 API 取得）
  const getMockVisaStatus = (passport: string, destination: string): VisaResult['visaRequired'] => {
    // 台灣護照範例
    if (passport === 'TW') {
      if (['JP', 'KR', 'SG', 'MY', 'TH'].includes(destination)) return 'visa-free'
      if (['ID', 'VN'].includes(destination)) return 'visa-on-arrival'
      if (['AU', 'NZ', 'TR'].includes(destination)) return 'e-visa'
      return 'visa-required'
    }
    return 'visa-required'
  }

  const getMockStayDuration = (passport: string, destination: string): string => {
    if (passport === 'TW') {
      if (['JP', 'KR', 'SG'].includes(destination)) return '90 天'
      if (['TH'].includes(destination)) return '30 天'
      if (['MY'].includes(destination)) return '30 天'
    }
    return '依規定'
  }

  const getMockNotes = (passport: string, destination: string): string => {
    if (passport === 'TW' && destination === 'JP') {
      return '需持有效護照，停留期限為 90 天'
    }
    return ''
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      checkVisa()
    }
  }

  const visaStatus = result ? VISA_STATUS[result.visaRequired] : null

  return (
    <div className="h-full">
      <div
        className={cn(
          'h-full rounded-2xl border border-white/70 shadow-xl backdrop-blur-md transition-all duration-300 hover:shadow-2xl hover:border-white/80',
          'bg-gradient-to-br from-emerald-50 via-white to-teal-50'
        )}
      >
        <div className="p-5 space-y-4 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'rounded-full p-2.5 text-white shadow-lg shadow-black/10',
                'bg-gradient-to-br from-emerald-200/60 to-teal-100/60',
                'ring-2 ring-white/50 ring-offset-1 ring-offset-white/20'
              )}
            >
              <Shield className="w-5 h-5 drop-shadow-sm" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-morandi-primary leading-tight tracking-wide">
                簽證查詢
              </p>
              <p className="text-xs text-morandi-secondary/90 mt-1.5 leading-relaxed">
                查詢簽證需求與停留期限
              </p>
            </div>
          </div>

          {/* 查詢表單 */}
          <div className="rounded-xl bg-white/70 p-3.5 shadow-md border border-white/40 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-morandi-primary mb-2 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  護照國家
                </label>
                <select
                  value={passport}
                  onChange={e => setPassport(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full px-3 py-2.5 text-sm font-medium border border-white/60 rounded-xl bg-white/90 hover:bg-white focus:bg-white transition-all outline-none shadow-sm backdrop-blur-sm"
                >
                  {PASSPORT_COUNTRIES.map(country => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-morandi-primary mb-2 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  目的地
                </label>
                <select
                  value={destination}
                  onChange={e => setDestination(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full px-3 py-2.5 text-sm font-medium border border-white/60 rounded-xl bg-white/90 hover:bg-white focus:bg-white transition-all outline-none shadow-sm backdrop-blur-sm"
                >
                  {DESTINATIONS.map(country => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={checkVisa}
              disabled={loading}
              className={cn(
                'w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 shadow-md',
                'bg-gradient-to-br from-emerald-200/60 to-teal-100/60 hover:from-emerald-300/60 hover:to-teal-200/60',
                'text-morandi-primary disabled:opacity-50 disabled:cursor-not-allowed',
                'flex items-center justify-center gap-2'
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  查詢中...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  查詢
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

          {/* 查詢結果 */}
          {result && visaStatus && !error && (
            <div className="flex-1 rounded-xl bg-white/70 p-4 shadow-md border border-white/40 overflow-auto space-y-4">
              {/* 路線資訊 */}
              <div className="flex items-center justify-center gap-3 pb-3 border-b border-morandi-container/30">
                <div className="text-center">
                  <p className="text-xs text-morandi-secondary mb-1">護照</p>
                  <p className="font-bold text-base text-morandi-primary">{result.passportName}</p>
                </div>
                <div className="text-morandi-secondary">→</div>
                <div className="text-center">
                  <p className="text-xs text-morandi-secondary mb-1">目的地</p>
                  <p className="font-bold text-base text-morandi-primary">
                    {result.destinationName}
                  </p>
                </div>
              </div>

              {/* 簽證狀態 */}
              <div className={cn('rounded-lg p-4', visaStatus.bgColor)}>
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full bg-white/50 flex items-center justify-center'
                    )}
                  >
                    <visaStatus.icon className={cn('w-6 h-6', visaStatus.color)} />
                  </div>
                  <div className="flex-1">
                    <p className={cn('font-bold text-lg', visaStatus.color)}>{visaStatus.label}</p>
                    <p className="text-xs text-morandi-secondary mt-0.5">
                      {visaStatus.description}
                    </p>
                  </div>
                </div>

                {/* 停留期限 */}
                {result.stayDuration && (
                  <div className="bg-white/50 rounded-lg p-3 mt-3">
                    <p className="text-xs text-morandi-secondary mb-1">停留期限</p>
                    <p className="font-semibold text-sm text-morandi-primary">
                      {result.stayDuration}
                    </p>
                  </div>
                )}

                {/* 備註 */}
                {result.notes && (
                  <div className="bg-white/50 rounded-lg p-3 mt-3">
                    <p className="text-xs text-morandi-secondary mb-1">注意事項</p>
                    <p className="text-xs text-morandi-primary">{result.notes}</p>
                  </div>
                )}
              </div>

              {/* 提示 */}
              <div className="bg-amber-50/80 rounded-lg p-3 border border-amber-200/50">
                <p className="text-xs text-amber-800">
                  ⚠️ 此資訊僅供參考，實際簽證要求請以目的地國家官方公告為準
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
