'use client'

import { motion } from 'framer-motion'
import { isHtmlString, cleanTiptapHtml } from '@/lib/utils/rich-text'
import { formatDateShort } from '@/lib/utils/format-date'
import { ART } from './utils/art-theme'
import type { TourPageData } from '@/features/tours/types/tour-display.types'

// 渲染可能包含 HTML 的文字（保留內聯樣式）
function RichText({ html, className }: { html: string | null | undefined; className?: string }) {
  if (!html) return null
  if (isHtmlString(html)) {
    const cleanHtml = cleanTiptapHtml(html)
    return <span className={className} dangerouslySetInnerHTML={{ __html: cleanHtml }} />
  }
  return <span className={className}>{html}</span>
}

// Brutalist 陰影
const brutalistShadow = '6px 6px 0px 0px rgba(28,28,28,1)'

// 無封面時不顯示圖片
const DEFAULT_COVER = ''

interface TourHeroArtProps {
  data: TourPageData
  viewMode: 'desktop' | 'mobile'
}

// 從標題或行程陣列中提取天數
function extractDayNumber(title: string | undefined, dailyItinerary?: Array<{ dayLabel?: string }>): number {
  // 優先從 dailyItinerary 計算天數
  if (dailyItinerary && dailyItinerary.length > 0) {
    // 檢查最後一個 dayLabel，可能是 "Day 5" 或 "Day 3-4" 這種格式
    const lastDay = dailyItinerary[dailyItinerary.length - 1]
    if (lastDay?.dayLabel) {
      // 嘗試匹配 "Day 3-4" 格式（取較大的數字）
      const rangeMatch = lastDay.dayLabel.match(/(\d+)\s*-\s*(\d+)/)
      if (rangeMatch) {
        return parseInt(rangeMatch[2], 10)
      }
      // 嘗試匹配 "Day 5" 格式
      const singleMatch = lastDay.dayLabel.match(/(\d+)/)
      if (singleMatch) {
        return parseInt(singleMatch[1], 10)
      }
    }
    // 如果無法從 dayLabel 解析，就用陣列長度
    return dailyItinerary.length
  }

  // fallback: 從標題中提取天數
  if (title) {
    const match = title.match(/(\d+)\s*[天日]/)
    if (match) {
      return parseInt(match[1], 10)
    }
  }

  // 最後 fallback: 返回 0（不顯示或顯示 --）
  return 0
}

export function TourHeroArt({ data, viewMode }: TourHeroArtProps) {
  const isMobile = viewMode === 'mobile'
  const dayNumber = data.days || extractDayNumber(data.title, data.dailyItinerary)
  const dateDisplay = formatDateShort(data.departureDate)
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
            <div className="w-[40%] flex-shrink-0 relative pl-[130px]">
              {/* 裝飾圓環 */}
              <div
                className="absolute left-[60px] top-1/2 -translate-y-1/2 w-48 h-48 rounded-full border opacity-10 pointer-events-none"
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
                  <RichText html={data.tagline || data.tourCode || 'COLLECTION'} />
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
                  className="text-6xl xl:text-7xl leading-[0.9] tracking-tight"
                  style={{
                    fontFamily: "'Cinzel', 'Noto Serif TC', serif",
                    fontWeight: 700,
                    color: ART.ink,
                  }}
                >
                  <RichText html={data.title} />
                </h1>

                <div
                  className="italic text-5xl xl:text-6xl mt-4 ml-8"
                  style={{
                    fontFamily: "'Noto Serif TC', serif",
                    color: ART.clay,
                  }}
                >
                  <RichText html={data.subtitle || 'Odyssey'} />
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
            <div className="w-[55%] flex-shrink-0 relative h-[550px]">
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
                  {coverImage ? (
                    <img src={coverImage}
                      alt={data.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${ART.clay}33, ${ART.ink}11)` }} />
                  )}
                </div>

                {/* 引言卡片 */}
                {data.description && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="absolute -bottom-4 -left-8 p-5 max-w-[280px] z-20 border-2"
                    style={{
                      backgroundColor: ART.paper,
                      borderColor: ART.ink,
                      boxShadow: brutalistShadow,
                    }}
                  >
                    <p
                      className="italic text-sm leading-relaxed"
                      style={{ fontFamily: "'Noto Serif TC', serif", color: ART.ink }}
                    >
                      "<RichText html={data.description} />"
                    </p>
                  </motion.div>
                )}
              </motion.div>
            </div>
          </div>
        ) : (
          /* 手機版：上下佈局 */
          <div className="relative space-y-6">
            {/* 右上：資訊（絕對定位） */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-[30px] right-0 flex flex-col gap-2 text-right"
            >
              <div>
                <span className="text-[9px] uppercase tracking-[0.15em] mr-2" style={{ color: '#9CA3AF' }}>
                  Departure
                </span>
                <span className="text-sm" style={{ fontFamily: "'Cinzel', serif", color: ART.ink }}>
                  {dateDisplay || '--'}
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase tracking-[0.15em] mr-2" style={{ color: '#9CA3AF' }}>
                  Duration
                </span>
                <span className="text-sm" style={{ fontFamily: "'Cinzel', serif", color: ART.ink }}>
                  {dayNumber} DAYS
                </span>
              </div>
              {data.price && (
                <div>
                  <span className="text-[9px] uppercase tracking-[0.15em] mr-2" style={{ color: '#9CA3AF' }}>
                    Price
                  </span>
                  <span className="text-sm" style={{ fontFamily: "'Cinzel', serif", color: ART.ink }}>
                    {data.price}
                  </span>
                </div>
              )}
            </motion.div>

            {/* 標題 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="pl-[20px]"
            >
              <h1
                className="text-4xl leading-[0.9] tracking-tight"
                style={{
                  fontFamily: "'Cinzel', 'Noto Serif TC', serif",
                  fontWeight: 700,
                  color: ART.ink,
                }}
              >
                <RichText html={data.title} />
              </h1>
              {/* 副標題 + 標籤 */}
              <div className="flex items-center gap-3 mt-2 ml-4">
                <div
                  className="italic text-3xl"
                  style={{
                    fontFamily: "'Noto Serif TC', serif",
                    color: ART.clay,
                  }}
                >
                  <RichText html={data.subtitle || 'Odyssey'} />
                </div>
                <div
                  className="inline-block border px-3 py-1 rounded-full"
                  style={{ borderColor: ART.ink }}
                >
                  <span
                    className="text-[10px] tracking-[0.2em] uppercase"
                    style={{ fontFamily: "'Cinzel', serif", color: ART.ink }}
                  >
                    <RichText html={data.tagline || data.tourCode || 'COLLECTION'} />
                  </span>
                </div>
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
                {coverImage ? (
                  <img src={coverImage}
                    alt={data.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${ART.clay}33, ${ART.ink}11)` }} />
                )}
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </header>
  )
}
