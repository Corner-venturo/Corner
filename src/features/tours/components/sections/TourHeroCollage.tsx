'use client'

import { motion } from 'framer-motion'
import { isHtmlString, cleanTiptapHtml } from '@/lib/utils/rich-text'
import { formatDateShort } from '@/lib/utils/format-date'
import type { TourPageData } from '@/features/tours/types/tour-display.types'
import { TOURS_LABELS } from './constants/labels'

// 渲染可能包含 HTML 的文字
function RichText({ html, className }: { html: string | null | undefined; className?: string }) {
  if (!html) return null
  if (isHtmlString(html)) {
    const cleanHtml = cleanTiptapHtml(html)
    return <span className={className} dangerouslySetInnerHTML={{ __html: cleanHtml }} />
  }
  return <span className={className}>{html}</span>
}

// Collage 配色
const POP = {
  pink: '#FF0080',
  yellow: '#FFEB3B',
  blue: '#00E5FF',
  purple: '#D500F9',
  lime: '#C6FF00',
  paper: '#fdfbf7',
  dark: '#121212',
}

// 無封面時不顯示圖片
const DEFAULT_COVER = ''

interface TourHeroCollageProps {
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

// 分割標題
function splitTitle(title: string | undefined): { main: string; sub: string } {
  if (!title) return { main: '', sub: '' }
  const separators = ['｜', '|', '·', '—', '-']
  for (const sep of separators) {
    if (title.includes(sep)) {
      const parts = title.split(sep)
      return { main: parts[0].trim(), sub: parts.slice(1).join(sep).trim() }
    }
  }
  const dayMatch = title.match(/(.+?)(\d+[天日].*)/)
  if (dayMatch) {
    return { main: dayMatch[1].trim(), sub: dayMatch[2].trim() }
  }
  return { main: title, sub: '' }
}

export function TourHeroCollage({ data, viewMode }: TourHeroCollageProps) {
  const isMobile = viewMode === 'mobile'
  const coverImage = data.coverImage || DEFAULT_COVER
  const dayCount = extractDayNumber(data.title, data.dailyItinerary)
  const { main: mainTitle, sub: subTitle } = splitTitle(data.title)
  const dateFormatted = formatDateShort(data.departureDate)

  return (
    <section
      className="relative w-full overflow-hidden min-h-screen flex flex-col justify-center items-center"
      style={{
        backgroundColor: POP.paper,
        fontFamily: "'Space Mono', monospace",
      }}
    >
      {/* 網點背景 */}
      <div
        className="absolute inset-0 opacity-40 pointer-events-none z-0"
        style={{
          backgroundImage: 'radial-gradient(#ddd 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />

      {/* 浮動色塊 */}
      <motion.div
        className="absolute rounded-full mix-blend-multiply filter blur-xl opacity-70"
        style={{
          top: '10%',
          left: isMobile ? '5%' : '15%',
          width: isMobile ? '6rem' : '10rem',
          height: isMobile ? '6rem' : '10rem',
          backgroundColor: POP.blue,
        }}
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute rounded-full mix-blend-multiply filter blur-xl opacity-70"
        style={{
          bottom: '15%',
          right: isMobile ? '5%' : '15%',
          width: isMobile ? '8rem' : '12rem',
          height: isMobile ? '8rem' : '12rem',
          backgroundColor: POP.pink,
        }}
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />

      {/* 主要內容 */}
      <div className={`relative z-10 text-center max-w-5xl mx-auto ${isMobile ? 'px-4 py-16' : 'px-6 py-20'}`}>
        {/* 標籤 */}
        {data.tagline && (
          <motion.div
            className="inline-block bg-black text-white px-3 py-1 text-sm mb-6 shadow-lg"
            style={{
              fontFamily: "'Space Mono', monospace",
              transform: 'rotate(-4deg)',
            }}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <RichText html={data.tagline} />
          </motion.div>
        )}

        {/* 主標題 */}
        <motion.h1
          className={`leading-none mb-8 relative ${isMobile ? 'text-5xl' : 'text-7xl lg:text-[10rem]'}`}
          style={{ fontFamily: "'Permanent Marker', cursive" }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <span
            className="inline-block hover:-rotate-6 transition-transform cursor-default"
            style={{ WebkitTextStroke: '2px black' }}
          >
            <RichText html={mainTitle.slice(0, Math.ceil(mainTitle.length / 2))} />
          </span>
          <span
            className="inline-block hover:rotate-6 transition-transform cursor-default"
            style={{
              color: POP.pink,
              filter: 'drop-shadow(5px 5px 0px rgba(0,0,0,1))',
            }}
          >
            <RichText html={mainTitle.slice(Math.ceil(mainTitle.length / 2))} />
          </span>
          {(subTitle || data.subtitle) && (
            <span
              className={`block mt-4 ${isMobile ? 'text-2xl' : 'text-4xl lg:text-7xl'}`}
              style={{
                fontFamily: "'Zen Old Mincho', 'Noto Serif TC', serif",
                fontStyle: 'italic',
                backgroundColor: POP.yellow,
                padding: isMobile ? '0.5rem 1rem' : '0.5rem 2rem',
                boxShadow: '10px 10px 0px 0px rgba(0,0,0,1)',
                transform: 'rotate(2deg)',
                display: 'inline-block',
                color: POP.dark,
              }}
            >
              <RichText html={subTitle || data.subtitle} />
            </span>
          )}
        </motion.h1>

        {/* 拍立得圖片區 */}
        <div className={`relative mt-12 w-full max-w-3xl mx-auto ${isMobile ? 'h-[300px]' : 'h-[400px] lg:h-[500px]'}`}>
          {/* 主圖片（拍立得風格） */}
          <motion.div
            className="absolute inset-0 w-4/5 h-full mx-auto bg-card p-4 pb-16 z-10"
            style={{
              boxShadow: '10px 10px 0px 0px rgba(0,0,0,1)',
              transform: 'rotate(-3deg)',
            }}
            whileHover={{ rotate: 0 }}
            transition={{ duration: 0.5 }}
          >
            {coverImage ? (
              <img src={coverImage}
                alt={data.title}
                className="w-full h-full object-cover border border-black"
                style={{ filter: 'grayscale(100%) contrast(1.25)' }}
              />
            ) : (
              <div
                className="w-full h-full border border-black"
                style={{ background: `repeating-linear-gradient(45deg, ${POP.yellow}22, ${POP.yellow}22 10px, ${POP.pink}11 10px, ${POP.pink}11 20px)` }}
              />
            )}
            {/* 手寫文字 */}
            <div
              className="absolute bottom-4 left-0 w-full text-center"
              style={{
                fontFamily: "'Gloria Hallelujah', cursive",
                fontSize: isMobile ? '1.25rem' : '1.5rem',
              }}
            >
              {data.description ? (
                <RichText html={data.description} />
              ) : (
                `${data.city || data.country || 'Adventure'} awaits...`
              )}
            </div>
            {/* 膠帶 */}
            <div
              className="absolute -top-4 left-1/2 -translate-x-1/2 w-32 h-8"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.4)',
                backdropFilter: 'blur(2px)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                transform: 'rotate(-2deg)',
              }}
            />
          </motion.div>

          {/* 裝飾色塊 - 藍色方塊 */}
          {!isMobile && (
            <div
              className="absolute top-10 -right-10 w-64 h-64 border-2 border-black hidden md:block"
              style={{
                backgroundColor: POP.blue,
                transform: 'rotate(12deg)',
              }}
            />
          )}

          {/* 裝飾色塊 - 綠色圓形 */}
          {!isMobile && (
            <div
              className="absolute -bottom-10 -left-10 w-64 h-64 border-2 border-black rounded-full hidden md:block"
              style={{
                backgroundColor: POP.lime,
                transform: 'rotate(-6deg)',
              }}
            />
          )}
        </div>

        {/* 底部資訊 */}
        <motion.div
          className={`flex flex-wrap justify-center gap-4 ${isMobile ? 'mt-8' : 'mt-16'}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          {/* 日期標籤 */}
          {dateFormatted && (
            <div
              className="px-4 py-2 border-2 border-black"
              style={{
                backgroundColor: POP.yellow,
                boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
                transform: 'rotate(-2deg)',
                fontFamily: "'Space Mono', monospace",
              }}
            >
              <span className="font-bold">{dateFormatted}</span>
              <span className="ml-2">{TOURS_LABELS.LABEL_5480}</span>
            </div>
          )}

          {/* 天數標籤 */}
          {dayCount > 0 && (
            <div
              className="px-4 py-2 border-2 border-black"
              style={{
                backgroundColor: POP.blue,
                boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
                transform: 'rotate(2deg)',
                fontFamily: "'Permanent Marker', cursive",
              }}
            >
              {dayCount} DAYS
            </div>
          )}

          {/* 價格標籤 */}
          {data.price && (
            <div
              className="px-4 py-2 border-2 border-black text-white"
              style={{
                backgroundColor: POP.pink,
                boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
                transform: 'rotate(-1deg)',
                fontFamily: "'Space Mono', monospace",
              }}
            >
              <span className="font-bold">NT$ {data.price}</span>
              {data.priceNote && <span className="ml-1 text-sm">{data.priceNote}</span>}
            </div>
          )}
        </motion.div>
      </div>

      {/* 向下箭頭 */}
      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </motion.div>

      {/* 載入 Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Permanent+Marker&family=Gloria+Hallelujah&family=Space+Mono:wght@400;700&family=Zen+Old+Mincho:wght@700&display=swap');
      `}</style>
    </section>
  )
}
