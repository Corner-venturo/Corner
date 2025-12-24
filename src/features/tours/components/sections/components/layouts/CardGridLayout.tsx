'use client'

import { motion } from 'framer-motion'
import { MapPin, Building2 } from 'lucide-react'
import { DailyItinerary } from '@/components/editor/tour-form/types'
import { ART } from '../../utils/art-theme'
import { DayDateInfo } from '../../hooks/useDayCalculations'

interface CardGridLayoutProps {
  day: DailyItinerary
  index: number
  numericDay: number
  dateInfo: DayDateInfo | null
  allImages: string[]
  isLastDay: boolean
  onImageClick: (images: string[], startIndex: number, title?: string) => void
}

export function CardGridLayout({
  day,
  index,
  numericDay,
  dateInfo,
  allImages,
  isLastDay,
  onImageClick,
}: CardGridLayoutProps) {
  const hasImage = allImages.length > 0
  const mainImage = allImages[0]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-50px' }}
      className="relative mb-32 group"
    >
      {/* 斜切背景 */}
      <div
        className="absolute inset-0 transform -skew-y-2 scale-105 z-0"
        style={{ backgroundColor: 'rgba(244,241,234,0.05)' }}
      />

      <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center p-8 lg:p-16 max-w-7xl mx-auto">
        {/* 左側大圖 */}
        <div className="relative h-[400px] w-full">
          {hasImage ? (
            <img
              src={mainImage}
              alt={day.title || ''}
              className="absolute inset-0 w-full h-full object-cover shadow-2xl cursor-pointer"
              style={{ filter: 'contrast(125%) sepia(30%)' }}
              onMouseEnter={(e) => { e.currentTarget.style.filter = 'contrast(125%) sepia(0%)' }}
              onMouseLeave={(e) => { e.currentTarget.style.filter = 'contrast(125%) sepia(30%)' }}
              onClick={() => onImageClick(allImages, 0, day.title)}
            />
          ) : (
            <div className="absolute inset-0 bg-white/5 flex items-center justify-center">
              <MapPin className="w-16 h-16 text-white/20" />
            </div>
          )}
          {/* 日期標籤 */}
          <div
            className="absolute -bottom-6 -right-6 p-4 font-black text-4xl shadow-lg"
            style={{
              backgroundColor: ART.clay,
              color: ART.ink,
              fontFamily: "'Cinzel', serif",
              boxShadow: '8px 8px 0px 0px rgba(0,0,0,1)',
            }}
          >
            {String(numericDay).padStart(2, '0')}
          </div>
        </div>

        {/* 右側內容 */}
        <div>
          <div className="flex items-center gap-4 mb-4">
            <span className="w-12 h-px" style={{ backgroundColor: ART.clay }} />
            <span className="text-xs uppercase tracking-[0.3em] text-white/60">
              {dateInfo ? `${dateInfo.monthShort} ${dateInfo.day}` : ''} · {day.locationLabel || 'Destination'}
            </span>
          </div>

          <h3
            className="text-5xl mb-6 text-white"
            style={{ fontFamily: "'Noto Serif TC', serif" }}
          >
            {day.title?.split('→').slice(-1)[0]?.trim() || `第 ${index + 1} 天`}
          </h3>

          {day.description && (
            <p
              className="text-lg leading-relaxed mb-8"
              style={{ color: 'rgba(255,255,255,0.7)', fontFamily: "'Noto Serif TC', serif" }}
            >
              {day.description}
            </p>
          )}

          {/* 景點列表 with icons */}
          <ul className="space-y-4 font-mono text-sm text-white/50">
            {day.activities?.slice(0, 3).map((activity, actIdx) => (
              <li key={actIdx} className="flex items-center gap-3">
                <span className="material-symbols-outlined" style={{ color: ART.clay }}>
                  {activity.icon || 'place'}
                </span>
                {activity.title}
              </li>
            ))}
            {!isLastDay && day.accommodation && (
              <li className="flex items-center gap-3">
                <Building2 className="w-5 h-5" style={{ color: ART.clay }} />
                {day.accommodation}
              </li>
            )}
          </ul>
        </div>
      </div>
    </motion.div>
  )
}
