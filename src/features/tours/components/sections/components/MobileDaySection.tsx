'use client'

import { motion } from 'framer-motion'
import { Utensils, Building2 } from 'lucide-react'
import { DailyItinerary } from '@/components/editor/tour-form/types'
import { ART } from '../utils/art-theme'
import { DayDateInfo } from '../hooks/useDayCalculations'

interface MobileDaySectionProps {
  day: DailyItinerary
  index: number
  numericDay: number
  dateInfo: DayDateInfo | null
  allImages: string[]
  isLastDay: boolean
  onImageClick: (images: string[], startIndex: number, title?: string) => void
}

export function MobileDaySection({
  day,
  index,
  numericDay,
  dateInfo,
  allImages,
  isLastDay,
  onImageClick,
}: MobileDaySectionProps) {
  const hasImage = allImages.length > 0
  const mainImage = allImages[0]

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="border-t border-white/10 mx-4 py-8"
    >
      {/* 日期標題行 */}
      <div className="flex items-center gap-4 mb-4">
        <div
          className="w-14 h-14 flex flex-col items-center justify-center"
          style={{ backgroundColor: ART.clay }}
        >
          <span
            className="text-xl font-black text-white"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            {String(numericDay).padStart(2, '0')}
          </span>
        </div>
        <div>
          <h3
            className="text-lg font-bold text-white"
            style={{ fontFamily: "'Noto Serif TC', serif" }}
          >
            {day.title || `第 ${index + 1} 天`}
          </h3>
          {dateInfo && (
            <div className="text-xs text-white/50">
              {dateInfo.monthShort} {dateInfo.day}
            </div>
          )}
        </div>
      </div>

      {/* 圖片 */}
      {hasImage && (
        <div
          className="relative aspect-[16/9] mb-4 cursor-pointer"
          onClick={() => onImageClick(allImages, 0, day.title)}
        >
          <img src={mainImage}
            alt=""
            className="w-full h-full object-cover"
          />
          {allImages.length > 1 && (
            <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 text-white text-xs">
              +{allImages.length - 1}
            </div>
          )}
        </div>
      )}

      {/* 描述 */}
      {day.description && (
        <p className="text-sm text-white/60 mb-4 leading-relaxed">
          {day.description}
        </p>
      )}

      {/* 景點 */}
      {day.activities && day.activities.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {day.activities.slice(0, 3).map((activity, actIdx) => (
            <span
              key={actIdx}
              className="px-2 py-1 text-xs border border-white/20 text-white/60"
            >
              {activity.title}
            </span>
          ))}
        </div>
      )}

      {/* 餐食住宿 */}
      <div className="pt-3 border-t border-white/10 space-y-2 text-xs text-white/50">
        {(day.meals?.lunch || day.meals?.dinner) && (
          <div className="flex items-center gap-2">
            <Utensils className="w-3 h-3" style={{ color: ART.clay }} />
            <span>{[day.meals?.lunch, day.meals?.dinner].filter(Boolean).join(' · ')}</span>
          </div>
        )}
        {!isLastDay && day.accommodation && (
          <div className="flex items-center gap-2">
            <Building2 className="w-3 h-3" style={{ color: ART.clay }} />
            <span>{day.accommodation}</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}
