'use client'

import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import { HotelInfo } from '@/components/editor/tour-form/types'

// Luxury 配色
const LUXURY = {
  primary: '#2C5F4D',
  secondary: '#C69C6D',
  accent: '#8F4F4F',
  background: '#FDFBF7',
  surface: '#FFFFFF',
  text: '#2D3436',
  muted: '#636E72',
}

interface TourHotelsSectionLuxuryProps {
  data: {
    hotels?: HotelInfo[] | null
    showHotels?: boolean
  }
  viewMode: 'desktop' | 'mobile'
}

export function TourHotelsSectionLuxury({ data, viewMode }: TourHotelsSectionLuxuryProps) {
  const isMobile = viewMode === 'mobile'
  const hotels = data.hotels || []

  if (!data.showHotels || hotels.length === 0) return null

  return (
    <section
      className={isMobile ? 'py-12' : 'py-24'}
      style={{ backgroundColor: '#151515' }}
    >
      <div className={isMobile ? 'px-4' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}>
        {/* 標題區 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 md:mb-16"
        >
          <span
            className="block mb-2 italic"
            style={{
              color: LUXURY.secondary,
              fontFamily: "'Noto Serif TC', serif",
              fontSize: isMobile ? '1rem' : '1.125rem'
            }}
          >
            Rest & Relax
          </span>
          <h2
            className={`font-bold ${isMobile ? 'text-2xl' : 'text-3xl'}`}
            style={{
              color: '#ECECEC',
              fontFamily: "'Noto Serif TC', serif"
            }}
          >
            精選極致宿旅
          </h2>
        </motion.div>

        {/* 飯店卡片網格 */}
        <div className={`grid ${isMobile ? 'grid-cols-1 gap-8' : 'md:grid-cols-2 lg:grid-cols-4 gap-8'}`}>
          {hotels.map((hotel, index) => (
            <HotelCard
              key={index}
              hotel={hotel}
              isMobile={isMobile}
              delay={index * 0.1}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

// 飯店卡片組件
function HotelCard({
  hotel,
  isMobile,
  delay
}: {
  hotel: HotelInfo
  isMobile: boolean
  delay: number
}) {
  // 優先使用 images[0]，其次使用 image
  const hotelImage = hotel.images?.[0] || hotel.image || null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="group cursor-pointer"
    >
      {/* 圖片區 */}
      <div className="relative h-64 rounded-sm overflow-hidden mb-6 shadow-lg">
        {hotelImage ? (
          <img
            src={hotelImage}
            alt={hotel.name || '飯店'}
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: LUXURY.text }}
          >
            <span className="text-white/50 text-sm">暫無圖片</span>
          </div>
        )}
        {/* 遮罩 */}
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
      </div>

      {/* 文字區 */}
      <div className="text-center px-2">
        <h3
          className={`font-medium mb-2 ${isMobile ? 'text-lg' : 'text-xl'}`}
          style={{
            color: '#ECECEC',
            fontFamily: "'Noto Serif TC', serif"
          }}
        >
          {hotel.name || '精選飯店'}
        </h3>

        {/* 分隔線 */}
        <div
          className="w-8 h-px mx-auto mb-3"
          style={{ backgroundColor: LUXURY.secondary }}
        />

        {/* 描述 */}
        {hotel.description && (
          <p
            className="text-xs leading-relaxed"
            style={{ color: '#B2BEC3' }}
          >
            {hotel.description}
          </p>
        )}
      </div>
    </motion.div>
  )
}
