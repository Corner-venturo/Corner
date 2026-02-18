'use client'

import { motion } from 'framer-motion'
import { MapPin, Plane } from 'lucide-react'
import { DailyItinerary } from '@/components/editor/tour-form/types'
import { ART } from '../../utils/art-theme'
import { DayDateInfo } from '../../hooks/useDayCalculations'

interface TimelineLayoutProps {
  day: DailyItinerary
  index: number
  numericDay: number
  dateInfo: DayDateInfo | null
  allImages: string[]
  isLastDay: boolean
  onImageClick: (images: string[], startIndex: number, title?: string) => void
}

export function TimelineLayout({
  day,
  index,
  numericDay,
  dateInfo,
  allImages,
  isLastDay,
  onImageClick,
}: TimelineLayoutProps) {
  const hasImage = allImages.length > 0

  // 判斷是否為最後一天（顯示特殊樣式）
  const isReturnDay = isLastDay

  if (isReturnDay) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-7xl mx-auto px-4 lg:px-12 pb-16"
      >
        <div className="flex flex-col lg:flex-row gap-6">
          {/* 普通卡片 */}
          <div
            className="flex-1 p-6 flex flex-col justify-center border border-white/10 hover:bg-card/10 transition-colors"
            style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
          >
            <div className="flex items-center gap-4 mb-2">
              <span
                className="text-2xl font-black"
                style={{ fontFamily: "'Cinzel', serif", color: ART.clay }}
              >
                {String(numericDay).padStart(2, '0')}
              </span>
              <h4
                className="text-xl text-white"
                style={{ fontFamily: "'Noto Serif TC', serif" }}
              >
                {day.title || `第 ${index + 1} 天`}
              </h4>
            </div>
            {day.description && (
              <p className="text-sm text-white/50 pl-10">{day.description}</p>
            )}
          </div>

          {/* 特殊回程卡片 */}
          <div
            className="flex-1 p-6 flex flex-col justify-center relative overflow-hidden"
            style={{ backgroundColor: ART.clay, color: ART.ink }}
          >
            <div
              className="absolute -right-4 -bottom-4 text-8xl opacity-20 rotate-[-20deg]"
            >
              <Plane className="w-24 h-24" />
            </div>
            <div className="flex items-center gap-4 mb-2 relative z-10">
              <span
                className="text-2xl font-black"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                {String(numericDay).padStart(2, '0')}
              </span>
              <h4
                className="text-xl font-bold"
                style={{ fontFamily: "'Noto Serif TC', serif" }}
              >
                Homecoming
              </h4>
            </div>
            <p className="text-sm font-bold opacity-70 pl-10 relative z-10">
              {day.description || 'Memories packed.'}
            </p>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="max-w-7xl mx-auto px-4 lg:px-12 mb-8"
    >
      <div
        className="min-w-[300px] lg:min-w-[400px] border border-white/10 p-8 hover:bg-card/10 transition-colors cursor-pointer group"
        style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
      >
        {/* 頂部日期 */}
        <div className="flex justify-between items-start mb-12">
          <span
            className="text-4xl font-black"
            style={{ fontFamily: "'Cinzel', serif", color: ART.clay }}
          >
            {String(numericDay).padStart(2, '0')}
          </span>
          {dateInfo && (
            <span className="text-xs font-mono text-white/40">
              {dateInfo.monthShort} {dateInfo.day}
            </span>
          )}
        </div>

        {/* 標題 */}
        <h4
          className="text-2xl mb-4 group-hover:text-white transition-colors"
          style={{ fontFamily: "'Noto Serif TC', serif", color: ART.clay }}
        >
          {day.title || `第 ${index + 1} 天`}
        </h4>

        {/* 描述 */}
        {day.description && (
          <p className="text-sm text-white/60 mb-6 leading-relaxed">
            {day.description}
          </p>
        )}

        {/* 圖片 */}
        {hasImage && (
          <div
            className="h-40 overflow-hidden mb-6 cursor-pointer"
            style={{ filter: 'grayscale(100%)' }}
            onMouseEnter={(e) => { e.currentTarget.style.filter = 'grayscale(0%)' }}
            onMouseLeave={(e) => { e.currentTarget.style.filter = 'grayscale(100%)' }}
            onClick={() => onImageClick(allImages, 0, day.title)}
          >
            <img src={allImages[0]}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        )}
        {!hasImage && (
          <div className="h-40 overflow-hidden mb-6 bg-card/5 flex items-center justify-center">
            <MapPin className="w-8 h-8 text-white/20" />
          </div>
        )}

        {/* 底部住宿 */}
        {!isLastDay && day.accommodation && (
          <div className="border-t border-white/10 pt-4 mt-auto">
            <span className="text-xs uppercase tracking-widest text-white/40">
              Stay: {day.accommodation}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  )
}
