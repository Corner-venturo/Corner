'use client'

import { motion } from 'framer-motion'

// Art/Magazine 配色 - 根據 HTML 模板
const ART = {
  black: '#0a0a0a',
  paper: '#f4f1ea',
  accent: '#D4AF37',
  ink: '#1a1a1a',
  clay: '#c76d54',
  sage: '#8da399',
}

// 預設封面圖片
const DEFAULT_COVER = 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=1600&q=80&auto=format&fit=crop'

interface TourHeroArtProps {
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

// 從標題中提取天數
function extractDayNumber(title: string): number {
  const match = title.match(/(\d+)\s*[天日]/)
  return match ? parseInt(match[1], 10) : 7
}

// 格式化日期為 DEC 24 格式
function formatDateShort(dateStr: string): string {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return ''
    const month = date.getMonth()
    const day = date.getDate()
    if (isNaN(month) || isNaN(day)) return ''
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
    return `${months[month]} ${day}`
  } catch {
    return ''
  }
}

// 從國家名稱提取顯示文字
function formatCountryDisplay(country: string | undefined): { main: string; sub: string } {
  if (!country) return { main: 'JP', sub: '' }

  if (/[\u4e00-\u9fa5]/.test(country)) {
    return {
      main: country.slice(0, 2),
      sub: country.slice(2) || ''
    }
  }

  return {
    main: country.slice(0, 3).toUpperCase(),
    sub: country.slice(3).toUpperCase()
  }
}

export function TourHeroArt({ data, viewMode }: TourHeroArtProps) {
  const isMobile = viewMode === 'mobile'
  const dayNumber = data.days || extractDayNumber(data.title)
  const dateDisplay = formatDateShort(data.departureDate)
  const countryDisplay = formatCountryDisplay(data.country)
  const coverImage = (data.coverImage && data.coverImage.trim() !== '') ? data.coverImage : DEFAULT_COVER

  return (
    <header
      className="relative w-full overflow-hidden"
      style={{ backgroundColor: ART.paper }}
    >
      {/* 背景斜切色塊 */}
      <div
        className="absolute top-0 right-0 w-1/2 h-full pointer-events-none"
        style={{
          backgroundColor: `${ART.clay}08`,
          clipPath: 'polygon(20% 0, 100% 0, 100% 100%, 0 100%)',
        }}
      />

      {/* 主要內容容器 */}
      <div className={`relative z-10 ${isMobile ? 'px-6 pt-24 pb-12' : 'max-w-7xl mx-auto px-8 py-16 lg:py-20'}`}>

        {/* 桌面版：左右佈局 */}
        {!isMobile ? (
          <div className="flex items-center gap-12 min-h-[600px]">
            {/* 左側文字區 - 固定寬度 */}
            <div className="w-1/2 flex-shrink-0 relative">
              {/* 裝飾圓環 */}
              <div
                className="absolute -left-8 top-1/2 -translate-y-1/2 w-48 h-48 rounded-full border opacity-10 pointer-events-none"
                style={{ borderColor: ART.ink }}
              />

              {/* 標籤 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-block border px-4 py-1.5 rounded-full mb-8"
                style={{ borderColor: ART.ink }}
              >
                <span
                  className="text-[11px] tracking-[0.25em] uppercase"
                  style={{ fontFamily: "'Cinzel', serif", color: ART.ink }}
                >
                  {data.tagline || data.tourCode || 'COLLECTION'}
                </span>
              </motion.div>

              {/* 主標題 */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-8"
              >
                <h1
                  className="text-8xl xl:text-9xl leading-[0.85] tracking-tight"
                  style={{
                    fontFamily: "'Cinzel', 'Noto Serif TC', serif",
                    fontWeight: 700,
                    color: ART.ink,
                  }}
                >
                  {countryDisplay.main}
                  {countryDisplay.sub && (
                    <>
                      <br />
                      <span
                        className="text-7xl xl:text-8xl"
                        style={{
                          WebkitTextStroke: `1px ${ART.ink}`,
                          color: 'transparent',
                        }}
                      >
                        {countryDisplay.sub}
                      </span>
                    </>
                  )}
                </h1>

                <div
                  className="italic text-5xl xl:text-6xl mt-4 ml-8"
                  style={{
                    fontFamily: "'Noto Serif TC', serif",
                    color: ART.clay,
                  }}
                >
                  {data.subtitle || 'Odyssey'}
                </div>
              </motion.div>

              {/* 資訊列 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex gap-12 pt-8 border-t"
                style={{ borderColor: `${ART.ink}15` }}
              >
                <div>
                  <span className="block text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: '#9CA3AF' }}>
                    Departure
                  </span>
                  <span className="text-xl" style={{ fontFamily: "'Cinzel', serif", color: ART.ink }}>
                    {dateDisplay || '--'}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: '#9CA3AF' }}>
                    Duration
                  </span>
                  <span className="text-xl" style={{ fontFamily: "'Cinzel', serif", color: ART.ink }}>
                    {dayNumber} DAYS
                  </span>
                </div>
                {data.price && (
                  <div>
                    <span className="block text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: '#9CA3AF' }}>
                      Price
                    </span>
                    <span className="text-xl" style={{ fontFamily: "'Cinzel', serif", color: ART.ink }}>
                      {data.price}
                    </span>
                  </div>
                )}
              </motion.div>
            </div>

            {/* 右側圖片區 - 固定寬度 */}
            <div className="w-1/2 flex-shrink-0 relative h-[550px]">
              {/* 大數字背景 */}
              <div
                className="absolute -top-4 -right-4 text-[200px] leading-none font-black pointer-events-none select-none"
                style={{
                  fontFamily: "'Cinzel', serif",
                  color: `${ART.ink}05`,
                }}
              >
                01
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="relative w-full h-full"
              >
                {/* Brutalist 陰影 */}
                <div
                  className="absolute top-4 left-4 right-0 bottom-0"
                  style={{ backgroundColor: ART.ink }}
                />

                {/* 主圖片 */}
                <div
                  className="absolute top-0 left-0 right-4 bottom-4 border overflow-hidden"
                  style={{ borderColor: ART.ink, backgroundColor: '#e5e5e5' }}
                >
                  <img
                    src={coverImage}
                    alt={data.title}
                    className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700 ease-in-out cursor-pointer"
                  />
                </div>

                {/* 引言卡片 */}
                {data.description && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="absolute -bottom-4 -left-8 p-5 max-w-[280px] z-20 border"
                    style={{
                      backgroundColor: ART.paper,
                      borderColor: ART.ink,
                      boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
                    }}
                  >
                    <p
                      className="italic text-sm leading-relaxed"
                      style={{ fontFamily: "'Noto Serif TC', serif", color: ART.ink }}
                    >
                      "{data.description}"
                    </p>
                  </motion.div>
                )}
              </motion.div>
            </div>
          </div>
        ) : (
          /* 手機版：上下佈局 */
          <div className="space-y-8">
            {/* 標籤 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-block border px-3 py-1 rounded-full"
              style={{ borderColor: ART.ink }}
            >
              <span
                className="text-[10px] tracking-[0.2em] uppercase"
                style={{ fontFamily: "'Cinzel', serif", color: ART.ink }}
              >
                {data.tagline || data.tourCode || 'COLLECTION'}
              </span>
            </motion.div>

            {/* 標題 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h1
                className="text-5xl leading-[0.9] tracking-tight"
                style={{
                  fontFamily: "'Cinzel', 'Noto Serif TC', serif",
                  fontWeight: 700,
                  color: ART.ink,
                }}
              >
                {countryDisplay.main}
              </h1>
              <div
                className="italic text-3xl mt-2 ml-4"
                style={{
                  fontFamily: "'Noto Serif TC', serif",
                  color: ART.clay,
                }}
              >
                {data.subtitle || 'Odyssey'}
              </div>
            </motion.div>

            {/* 圖片 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="relative h-[300px]"
            >
              <div
                className="absolute top-3 left-3 right-0 bottom-0"
                style={{ backgroundColor: ART.ink }}
              />
              <div
                className="absolute top-0 left-0 right-3 bottom-3 border overflow-hidden"
                style={{ borderColor: ART.ink }}
              >
                <img
                  src={coverImage}
                  alt={data.title}
                  className="w-full h-full object-cover grayscale"
                />
              </div>
            </motion.div>

            {/* 資訊列 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex gap-6 pt-6 border-t"
              style={{ borderColor: `${ART.ink}15` }}
            >
              <div>
                <span className="block text-[9px] uppercase tracking-[0.15em] mb-0.5" style={{ color: '#9CA3AF' }}>
                  Departure
                </span>
                <span className="text-base" style={{ fontFamily: "'Cinzel', serif", color: ART.ink }}>
                  {dateDisplay || '--'}
                </span>
              </div>
              <div>
                <span className="block text-[9px] uppercase tracking-[0.15em] mb-0.5" style={{ color: '#9CA3AF' }}>
                  Duration
                </span>
                <span className="text-base" style={{ fontFamily: "'Cinzel', serif", color: ART.ink }}>
                  {dayNumber} DAYS
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </header>
  )
}
