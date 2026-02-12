'use client'

import { motion } from 'framer-motion'
import { isHtmlString, cleanTiptapHtml } from '@/lib/utils/rich-text'
import { formatDateShort } from '@/lib/utils/format-date'
import type { TourPageData } from '@/features/tours/types/tour-display.types'

// 渲染可能包含 HTML 的文字
function RichText({ html, className }: { html: string | null | undefined; className?: string }) {
  if (!html) return null
  if (isHtmlString(html)) {
    const cleanHtml = cleanTiptapHtml(html)
    return <span className={className} dangerouslySetInnerHTML={{ __html: cleanHtml }} />
  }
  return <span className={className}>{html}</span>
}

// Dreamscape 配色
const DREAM = {
  base: '#fdfbf7',
  lavender: '#e6e6fa',
  peach: '#ffe5b4',
  sky: '#e0f7fa',
  text: '#4a4a4a',
  accent: '#ff7f50',
  purple: '#9370db',
  sand: '#fcf6e9',
}

// 預設封面圖片（當城市沒有設定圖片時顯示空白）
const DEFAULT_COVER = ''

interface TourHeroDreamscapeProps {
  data: TourPageData
  viewMode: 'desktop' | 'mobile'
}

// 從標題或行程陣列中提取天數
function extractDayNumber(title: string | undefined, dailyItinerary?: Array<{ dayLabel?: string }>): number {
  if (dailyItinerary && dailyItinerary.length > 0) {
    const lastDay = dailyItinerary[dailyItinerary.length - 1]
    if (lastDay?.dayLabel) {
      const rangeMatch = lastDay.dayLabel.match(/(\d+)\s*-\s*(\d+)/)
      if (rangeMatch) return parseInt(rangeMatch[2], 10)
      const singleMatch = lastDay.dayLabel.match(/(\d+)/)
      if (singleMatch) return parseInt(singleMatch[1], 10)
    }
    return dailyItinerary.length
  }
  if (title) {
    const match = title.match(/(\d+)\s*[天日]/)
    if (match) return parseInt(match[1], 10)
  }
  return 0
}

// 分割標題（取得主標題和副標題）
function splitTitle(title: string | undefined): { main: string; sub: string } {
  if (!title) return { main: '', sub: '' }
  // 嘗試用常見分隔符分割
  const separators = ['｜', '|', '·', '—', '-']
  for (const sep of separators) {
    if (title.includes(sep)) {
      const parts = title.split(sep)
      return { main: parts[0].trim(), sub: parts.slice(1).join(sep).trim() }
    }
  }
  // 如果沒有分隔符，檢查是否有天數
  const dayMatch = title.match(/(.+?)(\d+[天日].*)/)
  if (dayMatch) {
    return { main: dayMatch[1].trim(), sub: dayMatch[2].trim() }
  }
  return { main: title, sub: '' }
}

export function TourHeroDreamscape({ data, viewMode }: TourHeroDreamscapeProps) {
  const isMobile = viewMode === 'mobile'
  const coverImage = data.coverImage || DEFAULT_COVER
  const dayCount = extractDayNumber(data.title, data.dailyItinerary)
  const { main: mainTitle, sub: subTitle } = splitTitle(data.title)
  const dateFormatted = formatDateShort(data.departureDate)

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{
        backgroundColor: DREAM.base,
        backgroundImage: `
          radial-gradient(at 10% 10%, rgba(224, 247, 250, 0.4) 0px, transparent 50%),
          radial-gradient(at 90% 10%, rgba(255, 229, 180, 0.4) 0px, transparent 50%),
          radial-gradient(at 90% 90%, rgba(147, 112, 219, 0.15) 0px, transparent 50%),
          radial-gradient(at 10% 90%, rgba(255, 127, 80, 0.1) 0px, transparent 50%)
        `,
        minHeight: isMobile ? '100vh' : '100vh',
      }}
    >
      {/* 背景光暈 */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <motion.div
          className="absolute rounded-full blur-3xl mix-blend-multiply"
          style={{
            top: '-10%',
            right: '-10%',
            width: '80vw',
            height: '80vw',
            background: `linear-gradient(to bottom, ${DREAM.sky}4d, ${DREAM.lavender}4d)`,
          }}
          animate={{ opacity: [0.6, 0.8, 0.6] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div
          className="absolute rounded-full blur-3xl mix-blend-multiply"
          style={{
            bottom: '-10%',
            left: '-10%',
            width: '60vw',
            height: '60vw',
            backgroundColor: `${DREAM.peach}33`,
          }}
        />
      </div>

      <div
        className={`relative z-10 w-full max-w-[1800px] mx-auto px-6 ${
          isMobile ? 'py-16' : 'py-20 min-h-screen flex items-center'
        }`}
      >
        <div className={`w-full grid ${isMobile ? 'grid-cols-1 gap-8' : 'lg:grid-cols-12 gap-8'} items-center`}>
          {/* 左側文字區 */}
          <div className={`${isMobile ? 'order-2' : 'lg:col-span-5 order-2 lg:order-1'} relative ${isMobile ? '' : 'pl-4 lg:pl-12'}`}>
            {/* 大數字背景 */}
            <div
              className="absolute select-none leading-none z-0"
              style={{
                left: isMobile ? '-1rem' : '-5rem',
                top: isMobile ? '-2rem' : '-5rem',
                fontSize: isMobile ? '8rem' : '15rem',
                fontFamily: "'Cinzel', serif",
                color: `${DREAM.purple}0d`,
              }}
            >
              {dayCount > 0 ? String(dayCount).padStart(2, '0') : '00'}
            </div>

            {/* 主標題 */}
            <motion.h1
              className="relative z-10"
              style={{
                fontSize: isMobile ? '3rem' : '7rem',
                fontFamily: "'Cinzel', serif",
                color: DREAM.text,
                opacity: 0.9,
                lineHeight: 0.9,
              }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <RichText html={mainTitle} />
              {(subTitle || data.subtitle) && (
                <span
                  className="block mt-2"
                  style={{
                    fontFamily: "'La Belle Aurore', cursive",
                    fontSize: isMobile ? '2.5rem' : '5rem',
                    color: DREAM.purple,
                    marginLeft: '1rem',
                  }}
                >
                  <RichText html={subTitle || data.subtitle} />
                </span>
              )}
            </motion.h1>

            {/* 描述文字 */}
            {(data.tagline || data.description) && (
              <motion.p
                className="mt-8 max-w-md leading-relaxed ml-2 pl-6"
                style={{
                  fontSize: isMobile ? '1rem' : '1.25rem',
                  fontFamily: "'Cormorant Garamond', serif",
                  color: `${DREAM.text}b3`,
                  borderLeft: `2px solid ${DREAM.accent}4d`,
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                <RichText html={data.tagline || data.description} />
              </motion.p>
            )}

            {/* 日期與按鈕 */}
            <motion.div
              className="mt-12 flex gap-6 items-center flex-wrap"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              {dateFormatted && (
                <div
                  className="px-6 py-3 rounded-full flex items-center gap-3 backdrop-blur-md border shadow-lg"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.3)',
                    borderColor: 'rgba(255,255,255,0.4)',
                    color: `${DREAM.text}cc`,
                  }}
                >
                  <span className="uppercase tracking-[0.2em] text-sm font-bold">{dateFormatted}</span>
                  <span style={{ color: DREAM.purple }}>出發</span>
                </div>
              )}
              {data.price && (
                <div
                  className="px-6 py-3 rounded-full"
                  style={{
                    backgroundColor: `${DREAM.purple}1a`,
                    color: DREAM.purple,
                  }}
                >
                  <span className="font-bold">NT$ {data.price}</span>
                  {data.priceNote && <span className="text-sm ml-1">{data.priceNote}</span>}
                </div>
              )}
            </motion.div>
          </div>

          {/* 右側圖片區 */}
          <div className={`${isMobile ? 'order-1' : 'lg:col-span-7 order-1 lg:order-2'} relative ${isMobile ? 'h-[50vh]' : 'h-[80vh]'}`}>
            {/* Blob 背景動畫 */}
            <motion.div
              className="absolute inset-0"
              style={{
                borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
                background: `linear-gradient(to top right, ${DREAM.purple}33, ${DREAM.accent}33)`,
              }}
              animate={{
                y: [0, -20, 0],
                rotate: [0, 1, 0],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
            />

            {/* 主圖片 (Blob 形狀) */}
            <motion.div
              className="relative w-full h-full overflow-hidden shadow-lg"
              style={{
                borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
                boxShadow: `0 25px 50px -12px ${DREAM.purple}33`,
              }}
              animate={{
                y: [0, -20, 0],
                rotate: [0, 1, 0],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            >
              <img
                src={coverImage}
                alt={data.title}
                className="w-full h-full object-cover scale-110"
                style={{ filter: 'brightness(1.05) contrast(1.1)' }}
              />
              <div
                className="absolute inset-0 mix-blend-overlay"
                style={{ background: `linear-gradient(to top, ${DREAM.purple}33, transparent)` }}
              />
            </motion.div>

            {/* 浮動卡片 - 天氣/城市 */}
            {data.city && (
              <motion.div
                className="absolute z-20 p-4 rounded-2xl backdrop-blur-lg border shadow-lg"
                style={{
                  top: '20%',
                  left: isMobile ? '0' : '-3rem',
                  backgroundColor: 'rgba(255,255,255,0.6)',
                  borderColor: 'rgba(255,255,255,0.6)',
                  maxWidth: '200px',
                }}
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span style={{ color: DREAM.accent }}>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" />
                    </svg>
                  </span>
                  <span className="text-xs uppercase tracking-widest" style={{ color: `${DREAM.text}99` }}>
                    Destination
                  </span>
                </div>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.125rem' }}>
                  {data.city}
                </p>
              </motion.div>
            )}

            {/* 浮動卡片 - 天數 */}
            {dayCount > 0 && (
              <motion.div
                className="absolute z-20 rounded-full backdrop-blur-lg border shadow-lg flex flex-col justify-center items-center text-center"
                style={{
                  bottom: '15%',
                  right: isMobile ? '0' : '-2rem',
                  width: isMobile ? '8rem' : '12rem',
                  height: isMobile ? '8rem' : '12rem',
                  backgroundColor: 'rgba(255,255,255,0.6)',
                  borderColor: 'rgba(255,255,255,0.6)',
                }}
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
              >
                <span
                  style={{
                    fontFamily: "'Cinzel', serif",
                    fontSize: isMobile ? '2.5rem' : '3rem',
                    color: `${DREAM.purple}cc`,
                  }}
                >
                  {dayCount}
                </span>
                <span
                  className="text-xs uppercase tracking-widest mt-1"
                  style={{ color: `${DREAM.text}99` }}
                >
                  Days of
                  <br />
                  Wonder
                </span>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* 載入 Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=La+Belle+Aurore&display=swap');
      `}</style>
    </section>
  )
}
