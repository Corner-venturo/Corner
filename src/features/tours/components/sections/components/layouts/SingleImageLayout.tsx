'use client'

import { motion } from 'framer-motion'
import { Plane } from 'lucide-react'
import { DailyItinerary } from '@/components/editor/tour-form/types'
import { ART } from '../../utils/art-theme'
import { DayDateInfo } from '../../hooks/useDayCalculations'

interface SingleImageLayoutProps {
  day: DailyItinerary
  index: number
  numericDay: number
  dateInfo: DayDateInfo | null
  allImages: string[]
  isLastDay: boolean
  onImageClick: (images: string[], startIndex: number, title?: string) => void
}

export function SingleImageLayout({
  day,
  index,
  numericDay,
  dateInfo,
  allImages,
  isLastDay,
  onImageClick,
}: SingleImageLayoutProps) {
  const hasImage = allImages.length > 0
  const mainImage = allImages[0]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-50px' }}
      className="grid grid-cols-12 gap-8 mb-32 items-center group max-w-7xl mx-auto px-4 lg:px-12"
    >
      {/* 左側日期面板 - 2欄 */}
      <div className="col-span-2 text-right flex flex-col justify-start gap-4 h-full py-4 border-r border-white/20 pr-8">
        <div>
          <span
            className="block text-6xl font-black text-white/20 group-hover:text-white transition-colors duration-500"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            {String(numericDay).padStart(2, '0')}
          </span>
          {dateInfo && (
            <span className="block text-xs tracking-[0.3em] mt-2 text-white/60">
              {dateInfo.monthShort} {dateInfo.day}
            </span>
          )}
        </div>
        <div
          className="text-xs uppercase tracking-widest pt-12 hidden lg:block"
          style={{
            writingMode: 'vertical-rl',
            color: ART.clay,
          }}
        >
          {day.isAlternative ? 'Alternative' : 'Arrival'}
        </div>
      </div>

      {/* 中央大圖 - 5欄 */}
      <div className="col-span-5 relative">
        <div
          className="relative overflow-hidden aspect-[4/5] cursor-pointer group/img"
          style={{ filter: 'grayscale(100%)' }}
          onMouseEnter={(e) => { e.currentTarget.style.filter = 'grayscale(0%)' }}
          onMouseLeave={(e) => { e.currentTarget.style.filter = 'grayscale(100%)' }}
          onClick={() => onImageClick(allImages, 0, day.title)}
        >
          {hasImage ? (
            <>
              <img src={mainImage}
                alt={day.title || ''}
                className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6">
                <span
                  className="text-xs border border-white/30 px-2 py-1 uppercase tracking-widest bg-black/30 backdrop-blur-md text-white"
                >
                  {day.locationLabel || day.title?.split('→')[0]?.trim() || 'Destination'}
                </span>
              </div>
            </>
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ backgroundColor: `${ART.clay}20` }}
            >
              <Plane className="w-16 h-16 text-white/20" />
            </div>
          )}
        </div>
        {/* 裝飾角落 */}
        <div
          className="absolute -top-4 -right-4 w-24 h-24 border-t-2 border-r-2 hidden lg:block"
          style={{ borderColor: ART.clay }}
        />
      </div>

      {/* 右側內容 - 5欄 */}
      <div className="col-span-5 pl-0 lg:pl-12">
        <h3
          className="text-4xl mb-6 leading-tight text-white"
          style={{ fontFamily: "'Noto Serif TC', serif" }}
        >
          {day.title?.split('→').map((part, i, arr) => (
            <span key={i}>
              {i > 0 && <span className="text-white/40"> → </span>}
              {i === arr.length - 1 ? (
                <span style={{ color: ART.clay }} className="italic">{part.trim()}</span>
              ) : (
                part.trim()
              )}
            </span>
          )) || `第 ${index + 1} 天`}
        </h3>

        {day.description && (
          <p
            className="text-lg leading-loose mb-8"
            style={{ color: 'rgba(255,255,255,0.6)', fontFamily: "'Noto Serif TC', serif" }}
          >
            {day.description}
          </p>
        )}

        {/* 景點標籤 */}
        {day.activities && day.activities.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {day.activities.slice(0, 4).map((activity, actIdx) => (
              <span
                key={actIdx}
                className="px-3 py-1 text-sm border border-white/20 text-white/70 hover:bg-card hover:text-black transition-colors cursor-pointer"
              >
                {activity.title}
              </span>
            ))}
          </div>
        )}

        {/* 餐食住宿 */}
        <div className="grid grid-cols-2 gap-8 border-t border-white/10 pt-8">
          {(day.meals?.lunch || day.meals?.dinner) && (
            <div>
              <h4
                className="text-xs tracking-widest mb-2"
                style={{ fontFamily: "'Cinzel', serif", color: ART.clay }}
              >
                DINING
              </h4>
              <p className="text-white/80" style={{ fontFamily: "'Noto Serif TC', serif" }}>
                {[day.meals?.lunch, day.meals?.dinner].filter(Boolean).join(' · ')}
              </p>
            </div>
          )}
          {!isLastDay && day.accommodation && (
            <div>
              <h4
                className="text-xs tracking-widest mb-2"
                style={{ fontFamily: "'Cinzel', serif", color: ART.clay }}
              >
                STAY
              </h4>
              <p className="text-white/80" style={{ fontFamily: "'Noto Serif TC', serif" }}>
                {day.accommodation}
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
