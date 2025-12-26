'use client'

import { Button } from '@/components/ui/button'

interface TourHeroSereneProps {
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

/**
 * Serene 風格 Hero Section
 * ZenTravel 風格：全屏背景圖 + 垂直日文字體 + 漸層疊加 + 玻璃擬態按鈕
 * 參考：Japan - The Art of Silence 設計
 */
export function TourHeroSerene({ data, viewMode }: TourHeroSereneProps) {
  const isMobile = viewMode === 'mobile'

  // 從標題提取天數
  const dayNumber = data.days || extractDayNumber(data.title) || 7

  // 手機版：獨立的全屏設計
  if (isMobile) {
    return (
      <section className="relative min-h-screen overflow-hidden">
        {/* 背景圖片 - 佔據上半部 */}
        <div className="absolute inset-0 z-0">
          <img
            src={data.coverImage || 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=1600&q=80&auto=format&fit=crop'}
            alt={data.title}
            className="w-full h-full object-cover"
          />
          {/* 漸層疊加 - 從上到下漸深 */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/70" />
        </div>

        {/* 左側垂直標題 */}
        <div
          className="absolute left-4 top-16 bottom-32 z-20 flex items-center"
          style={{
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
          }}
        >
          <h1
            className="text-3xl font-black text-white tracking-widest leading-none drop-shadow-lg"
            style={{
              fontFamily: "'Noto Serif JP', 'Noto Sans TC', serif",
              textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
            }}
          >
            {data.title}
          </h1>
        </div>

        {/* 底部資訊區 */}
        <div className="absolute bottom-0 left-0 right-0 z-10 p-6 pb-8">
          {/* 玻璃擬態卡片 */}
          <div className="backdrop-blur-md bg-white/90 rounded-2xl p-5 shadow-xl">
            {/* 標籤 */}
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-block px-2.5 py-1 rounded-full bg-[#30c9e8]/10 text-xs font-bold text-[#30c9e8]">
                {dayNumber} Days
              </span>
              <span className="text-xs text-morandi-secondary">
                {data.city || data.country}
              </span>
            </div>

            {/* 主標題 */}
            <h2
              className="text-2xl font-bold text-[#111e21] leading-tight mb-2"
              style={{ fontFamily: "'Noto Serif JP', 'Noto Sans TC', serif" }}
            >
              {data.title}
            </h2>

            {/* 副標題 */}
            {data.subtitle && (
              <p className="text-sm text-[#30c9e8] font-medium mb-2">
                {data.subtitle}
              </p>
            )}

            {/* 描述 */}
            {data.description && (
              <p className="text-sm text-morandi-secondary leading-relaxed mb-4 line-clamp-3">
                {data.description}
              </p>
            )}

            {/* 底部資訊列 */}
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <div className="flex items-center gap-4 text-xs text-morandi-secondary">
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  {data.city || data.country}
                </span>
                <span>{data.departureDate}</span>
              </div>
              {data.price && (
                <span className="font-bold text-[#111e21]">
                  NT$ {data.price}
                </span>
              )}
            </div>
          </div>

          {/* 標語 */}
          <p className="text-center text-xs text-white/70 mt-3">
            {data.tagline || 'Corner Travel 2025'}
          </p>
        </div>
      </section>
    )
  }

  // 桌面版：原有設計
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* 背景圖片 */}
      <div className="absolute inset-0 z-0">
        <img
          src={data.coverImage || 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=1600&q=80&auto=format&fit=crop'}
          alt={data.title}
          className="w-full h-full object-cover opacity-90"
        />
        {/* 漸層疊加 */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-[#f6f8f8]" />
      </div>

      {/* 主要內容 */}
      <div className="relative z-10 w-full max-w-7xl mx-auto grid grid-cols-2 gap-12 px-8 items-center">

        {/* 左側：垂直日文字體 */}
        <div className="h-[600px] flex justify-center items-start gap-8 select-none opacity-80 mix-blend-multiply">
          <h1
            className="text-7xl md:text-8xl font-black text-[#111e21] tracking-widest leading-none"
            style={{
              writingMode: 'vertical-rl',
              textOrientation: 'mixed',
              fontFamily: "'Noto Serif JP', 'Noto Sans TC', serif"
            }}
          >
            {data.title}
          </h1>
          {data.subtitle && (
            <p
              className="text-xl font-light text-[#111e21] tracking-[0.2em] pt-20"
              style={{
                writingMode: 'vertical-rl',
                textOrientation: 'mixed',
                fontFamily: "'Noto Serif JP', 'Noto Sans TC', serif"
              }}
            >
              {data.subtitle}
            </p>
          )}
        </div>

        {/* 右側：主要內容卡片 */}
        <div className="flex flex-col gap-8 md:pl-10">
          <div className="space-y-4">
            {/* 標籤 */}
            <span className="inline-block px-3 py-1 rounded-full bg-white/60 backdrop-blur-md text-xs font-bold uppercase tracking-widest text-[#30c9e8] border border-white/20">
              {dayNumber} Days Experience
            </span>

            {/* 主標題 */}
            <h1 className="text-5xl md:text-7xl font-bold text-[#111e21] leading-[1.1] tracking-tight">
              {data.country || data.city || 'Journey'}:<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#30c9e8] to-teal-400">
                {data.title}
              </span>
            </h1>

            {/* 描述 */}
            {data.description && (
              <p className="text-lg md:text-xl text-[#111e21]/80 font-light max-w-md leading-relaxed">
                {data.description}
              </p>
            )}
          </div>

          {/* 按鈕區 */}
          <div className="flex flex-wrap gap-4 pt-4">
            <Button size="lg" className="h-12 rounded-full font-bold tracking-wide transition-transform hover:scale-105">
              Start Journey
            </Button>
            <Button variant="outline" size="lg" className="group h-12 rounded-full border-white/40 bg-white/50 font-bold tracking-wide text-[#111e21] backdrop-blur-md hover:bg-white/70 hover:text-[#111e21]">
              <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              <span>Watch Film</span>
            </Button>
          </div>

          {/* 價格資訊（如果有） */}
          {data.price && (
            <div className="mt-4 p-4 rounded-xl bg-white/40 backdrop-blur-sm border border-white/30 inline-flex items-baseline gap-2">
              <span className="text-sm text-[#111e21]/60 uppercase tracking-widest">From</span>
              <span className="text-3xl font-bold text-[#111e21]">
                NT$ {data.price}
              </span>
              {data.priceNote && (
                <span className="text-sm text-[#111e21]/60">{data.priceNote}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

/**
 * 從標題中提取天數數字
 */
function extractDayNumber(title: string): number | null {
  const chineseNumbers: Record<string, number> = {
    '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
    '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
    '十一': 11, '十二': 12, '十三': 13, '十四': 14, '十五': 15
  }

  const patterns = [
    /(\d+)\s*[天日]/,
    /(十[一二三四五]?|[一二三四五六七八九])\s*[天日]/
  ]

  for (const pattern of patterns) {
    const match = title.match(pattern)
    if (match) {
      const num = match[1]
      if (/^\d+$/.test(num)) {
        return parseInt(num, 10)
      }
      if (chineseNumbers[num]) {
        return chineseNumbers[num]
      }
    }
  }

  return null
}
