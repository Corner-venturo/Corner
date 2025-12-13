'use client'

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
      <div className={`relative z-10 w-full max-w-7xl mx-auto grid items-center ${
        isMobile ? 'grid-cols-1 gap-8 px-4 pt-20' : 'grid-cols-2 gap-12 px-8'
      }`}>

        {/* 左側：垂直日文字體（桌面版） */}
        {!isMobile && (
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
        )}

        {/* 右側：主要內容卡片 */}
        <div className={`flex flex-col gap-8 ${
          isMobile
            ? 'backdrop-blur-sm bg-white/30 p-6 rounded-2xl'
            : 'md:pl-10 backdrop-blur-sm bg-white/30 p-8 rounded-2xl md:backdrop-blur-none md:bg-transparent'
        }`}>
          <div className="space-y-4">
            {/* 標籤 */}
            <span className="inline-block px-3 py-1 rounded-full bg-white/60 backdrop-blur-md text-xs font-bold uppercase tracking-widest text-[#30c9e8] border border-white/20">
              {dayNumber} Days Experience
            </span>

            {/* 主標題 */}
            <h1 className={`font-bold text-[#111e21] leading-[1.1] tracking-tight ${
              isMobile ? 'text-4xl' : 'text-5xl md:text-7xl'
            }`}>
              {data.country || data.city || 'Journey'}:<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#30c9e8] to-teal-400">
                {data.title}
              </span>
            </h1>

            {/* 描述 */}
            {data.description && (
              <p className={`text-[#111e21]/80 font-light max-w-md leading-relaxed ${
                isMobile ? 'text-base' : 'text-lg md:text-xl'
              }`}>
                {data.description}
              </p>
            )}
          </div>

          {/* 按鈕區 */}
          <div className="flex flex-wrap gap-4 pt-4">
            <button className={`rounded-full bg-[#111e21] text-white font-bold tracking-wide hover:scale-105 transition-transform ${
              isMobile ? 'h-10 px-6 text-sm' : 'h-12 px-8 text-sm'
            }`}>
              Start Journey
            </button>
            <button className={`rounded-full bg-white/50 backdrop-blur-md border border-white/40 text-[#111e21] font-bold tracking-wide hover:bg-white/70 transition-colors flex items-center gap-2 group ${
              isMobile ? 'h-10 px-6 text-sm' : 'h-12 px-8 text-sm'
            }`}>
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
              Watch Film
            </button>
          </div>

          {/* 價格資訊（如果有） */}
          {data.price && (
            <div className="mt-4 p-4 rounded-xl bg-white/40 backdrop-blur-sm border border-white/30 inline-flex items-baseline gap-2">
              <span className="text-sm text-[#111e21]/60 uppercase tracking-widest">From</span>
              <span className={`font-bold text-[#111e21] ${isMobile ? 'text-2xl' : 'text-3xl'}`}>
                NT$ {data.price}
              </span>
              {data.priceNote && (
                <span className="text-sm text-[#111e21]/60">{data.priceNote}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 手機版也顯示標題 */}
      {isMobile && (
        <div className="absolute bottom-8 left-4 right-4 z-10">
          <div className="flex items-center gap-4 text-[#111e21]/60 text-sm">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {data.city || data.country}
            </span>
            <span>•</span>
            <span>{data.departureDate}</span>
          </div>
        </div>
      )}
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
