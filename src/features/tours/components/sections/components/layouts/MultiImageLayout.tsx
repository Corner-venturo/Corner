'use client'

import { motion } from 'framer-motion'
import { MapPin } from 'lucide-react'
import { DailyItinerary } from '@/components/editor/tour-form/types'
import { ART } from '../../utils/art-theme'
import { DayDateInfo } from '../../hooks/useDayCalculations'

interface MultiImageLayoutProps {
  day: DailyItinerary
  index: number
  numericDay: number
  dateInfo: DayDateInfo | null
  allImages: string[]
  isLastDay: boolean
  onImageClick: (images: string[], startIndex: number, title?: string) => void
}

export function MultiImageLayout({
  day,
  index,
  numericDay,
  dateInfo,
  allImages,
  isLastDay,
  onImageClick,
}: MultiImageLayoutProps) {
  const hasImage = allImages.length > 0

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-50px' }}
      className="grid grid-cols-12 gap-8 mb-32 items-center group max-w-7xl mx-auto px-4 lg:px-12"
    >
      {/* 左側內容 - 5欄 (反向) */}
      <div className="col-span-5 pr-0 lg:pr-12 text-right">
        <h3
          className="text-4xl mb-6 leading-tight text-white"
          style={{ fontFamily: "'Noto Serif TC', serif" }}
        >
          {day.title?.split('→').map((part, i, arr) => (
            <span key={i}>
              {i > 0 && <br />}
              {i === arr.length - 1 ? (
                <span style={{ color: ART.sage }} className="italic">{part.trim()}</span>
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

        {/* 景點 highlight */}
        <div className="flex justify-end gap-8 border-t border-white/10 pt-8">
          {day.activities?.slice(0, 2).map((activity, actIdx) => (
            <div key={actIdx} className="text-right">
              <h4
                className="text-xs tracking-widest mb-2"
                style={{ fontFamily: "'Cinzel', serif", color: ART.sage }}
              >
                HIGHLIGHT
              </h4>
              <p className="text-white/80" style={{ fontFamily: "'Noto Serif TC', serif" }}>
                {activity.title}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 中央雙圖 - 5欄 */}
      <div className="col-span-5">
        <div className="grid grid-cols-2 gap-2">
          {hasImage && (
            <>
              <div
                className="overflow-hidden aspect-square cursor-pointer"
                onClick={() => onImageClick(allImages, 0, day.title)}
              >
                <img
                  src={allImages[0]}
                  alt=""
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-700"
                  style={{ filter: 'grayscale(100%)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.filter = 'grayscale(0%)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.filter = 'grayscale(100%)' }}
                />
              </div>
              <div
                className="overflow-hidden aspect-square translate-y-8 cursor-pointer"
                onClick={() => onImageClick(allImages, allImages.length > 1 ? 1 : 0, day.title)}
              >
                <img
                  src={allImages[1] || allImages[0]}
                  alt=""
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-700"
                  style={{ filter: 'grayscale(100%)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.filter = 'grayscale(0%)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.filter = 'grayscale(100%)' }}
                />
              </div>
            </>
          )}
          {!hasImage && (
            <div className="col-span-2 aspect-video bg-white/5 flex items-center justify-center">
              <MapPin className="w-12 h-12 text-white/20" />
            </div>
          )}
        </div>
      </div>

      {/* 右側日期面板 - 2欄 */}
      <div className="col-span-2 text-left pl-8 border-l border-white/20 h-full flex flex-col justify-between py-4">
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
          className="text-xs uppercase tracking-widest pt-12"
          style={{
            writingMode: 'vertical-rl',
            color: ART.sage,
          }}
        >
          Adventure
        </div>
      </div>
    </motion.div>
  )
}
