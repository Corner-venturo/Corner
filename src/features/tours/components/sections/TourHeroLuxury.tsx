'use client'

import { Calendar, Users, Utensils, MapPin } from 'lucide-react'

interface TourHeroLuxuryProps {
  data: {
    coverImage?: string | null
    tagline?: string | null
    title: string
    subtitle?: string | null
    description?: string | null
    departureDate: string
    tourCode: string
    country?: string
    city?: string
    price?: string
    priceNote?: string
    days?: number
  }
  viewMode: 'desktop' | 'mobile'
}

// Luxury 配色
const LUXURY = {
  primary: '#2C5F4D',
  secondary: '#C69C6D',
  accent: '#8F4F4F',
  background: '#FDFBF7',
  text: '#2D3436',
  muted: '#636E72',
}

/**
 * Luxury 風格 Hero Section
 * 參考 Corner Travel Collection 設計
 * 特點：左右分欄、標籤系統、數據卡片、襯線字體混排
 */
export function TourHeroLuxury({ data, viewMode }: TourHeroLuxuryProps) {
  const isMobile = viewMode === 'mobile'
  const dayNumber = data.days || extractDayNumber(data.title) || 7

  // 從標題中解析國家和主題
  const titleParts = parseTitle(data.title)

  return (
    <header
      className="relative w-full"
      style={{ backgroundColor: LUXURY.background }}
    >
      {/* 微妙的背景圖案 */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232C5F4D' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className={`relative max-w-7xl mx-auto ${isMobile ? 'px-4 py-8' : 'px-8 py-16 lg:py-24'}`}>
        <div className={`grid ${isMobile ? 'grid-cols-1 gap-8' : 'lg:grid-cols-12 gap-12'} items-center`}>

          {/* 左側：文字內容 */}
          <div className={`${isMobile ? '' : 'lg:col-span-5'} space-y-6 relative z-10`}>

            {/* 標籤 */}
            <div
              className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white border shadow-sm"
              style={{ borderColor: `${LUXURY.secondary}30` }}
            >
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: LUXURY.accent }}
              />
              <span
                className="text-xs font-medium tracking-widest uppercase"
                style={{
                  color: LUXURY.secondary,
                  fontFamily: "'Noto Serif TC', serif"
                }}
              >
                {data.tourCode || 'Signature Collection'}
              </span>
            </div>

            {/* 主標題區塊 - 靠左對齊 */}
            <div className="space-y-2">
              {/* 主標題 - 黑字 */}
              <h1
                className={`font-medium leading-tight ${isMobile ? 'text-4xl' : 'text-5xl lg:text-7xl'}`}
                style={{
                  color: LUXURY.text,
                  fontFamily: "'Noto Serif TC', serif"
                }}
              >
                <span className="relative inline-block">
                  {data.title}
                  <span
                    className="absolute -bottom-2 left-0 w-full h-3 -rotate-1"
                    style={{ backgroundColor: `${LUXURY.secondary}20` }}
                  />
                </span>
              </h1>

              {/* 副標題 - 綠字 */}
              {data.subtitle && (
                <h2
                  className={`font-medium ${isMobile ? 'text-2xl' : 'text-3xl lg:text-4xl'}`}
                  style={{
                    color: LUXURY.primary,
                    fontFamily: "'Noto Serif TC', serif"
                  }}
                >
                  {data.subtitle}
                </h2>
              )}
            </div>

            {/* 描述 - 靠左對齊 */}
            {data.description && (
              <div className="flex gap-6 items-start pt-2">
                <div
                  className="w-12 h-px mt-3 opacity-50"
                  style={{ backgroundColor: LUXURY.text }}
                />
                <p
                  className={`leading-relaxed font-light max-w-md ${isMobile ? 'text-base' : 'text-lg'}`}
                  style={{
                    color: LUXURY.muted,
                    fontFamily: "'Noto Sans TC', sans-serif"
                  }}
                >
                  {data.description}
                </p>
              </div>
            )}

            {/* 數據卡片 */}
            <div className={`grid grid-cols-3 gap-4 pt-6 ${isMobile ? 'gap-3' : 'gap-6'}`}>
              <DataCard
                icon={<Calendar className="w-6 h-6" />}
                value={dayNumber}
                label="Days Journey"
                isMobile={isMobile}
              />
              <DataCard
                icon={<Users className="w-6 h-6" />}
                value={4}
                label="Onsen Stops"
                isMobile={isMobile}
              />
              <DataCard
                icon={<Utensils className="w-6 h-6" />}
                value={3}
                label="Fine Dining"
                isMobile={isMobile}
              />
            </div>
          </div>

          {/* 右側：主視覺圖片 */}
          <div className={`${isMobile ? '' : 'lg:col-span-7'} relative`}>
            <div className="relative h-[400px] lg:h-[600px] rounded-2xl overflow-hidden shadow-2xl">
              <img
                src={data.coverImage || 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=1600&q=80&auto=format&fit=crop'}
                alt={data.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
              {/* 漸層遮罩 */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              {/* 出發日期卡片 */}
              <div
                className="absolute bottom-6 right-6 bg-white/95 backdrop-blur p-5 rounded-lg shadow-lg max-w-xs"
                style={{ borderLeft: `4px solid ${LUXURY.secondary}` }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <MapPin className="w-5 h-5" style={{ color: LUXURY.secondary }} />
                  <span
                    className="text-xs font-bold tracking-widest uppercase"
                    style={{ color: LUXURY.muted }}
                  >
                    Next Departure
                  </span>
                </div>
                <p
                  className="text-xl font-medium"
                  style={{
                    color: LUXURY.text,
                    fontFamily: "'Noto Serif TC', serif"
                  }}
                >
                  {data.departureDate || 'Coming Soon'}
                </p>
                <p className="text-xs mt-1" style={{ color: LUXURY.muted }}>
                  Limited Availability
                </p>
              </div>
            </div>

            {/* 裝飾圓圈 */}
            {!isMobile && (
              <>
                <div
                  className="absolute -top-6 -right-6 w-24 h-24 border rounded-full z-0"
                  style={{ borderColor: `${LUXURY.secondary}30` }}
                />
                <div
                  className="absolute -bottom-6 -left-6 w-32 h-32 border rounded-full z-0"
                  style={{ borderColor: `${LUXURY.primary}20` }}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

// 數據卡片組件
function DataCard({
  icon,
  value,
  label,
  isMobile
}: {
  icon: React.ReactNode
  value: number
  label: string
  isMobile: boolean
}) {
  return (
    <div
      className={`group bg-white rounded-xl border shadow-sm hover:shadow-md transition-all duration-300 ${
        isMobile ? 'p-3' : 'p-4'
      }`}
      style={{ borderColor: '#f0f0f0' }}
    >
      <div
        className="mb-2 group-hover:scale-110 transition-transform"
        style={{ color: LUXURY.primary }}
      >
        {icon}
      </div>
      <div
        className={`font-medium ${isMobile ? 'text-2xl' : 'text-3xl'}`}
        style={{
          color: LUXURY.text,
          fontFamily: "'Noto Serif TC', serif"
        }}
      >
        {value}
      </div>
      <div
        className="text-[10px] tracking-widest uppercase mt-1"
        style={{ color: LUXURY.muted }}
      >
        {label}
      </div>
    </div>
  )
}

// 解析標題
function parseTitle(title: string): { country?: string; highlight?: string; theme?: string } {
  // 嘗試匹配 "九州冬日聖誕奇蹟" 這樣的格式
  const patterns = [
    /^(.+?)(冬日|春日|夏日|秋日|之旅|遊)(.+)$/,
    /^(.+?)(\d+[天日])(.*)$/,
  ]

  for (const pattern of patterns) {
    const match = title.match(pattern)
    if (match) {
      return {
        country: match[1],
        highlight: match[2],
        theme: match[3] || undefined
      }
    }
  }

  return { theme: title }
}

// 從標題提取天數
function extractDayNumber(title: string): number | null {
  const chineseNumbers: Record<string, number> = {
    '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
    '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
  }

  const patterns = [
    /(\d+)\s*[天日]/,
    /(十[一二三四五]?|[一二三四五六七八九])\s*[天日]/
  ]

  for (const pattern of patterns) {
    const match = title.match(pattern)
    if (match) {
      const num = match[1]
      if (/^\d+$/.test(num)) return parseInt(num, 10)
      if (chineseNumbers[num]) return chineseNumbers[num]
    }
  }

  return null
}
