'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface HotelData {
  image?: string
  images?: string[]
  name?: string
  description?: string
  location?: string
}

interface TourData {
  showHotels?: boolean
  hotels?: HotelData[]
}

interface TourHotelsSectionArtProps {
  data: TourData
  viewMode: 'desktop' | 'mobile'
}

// 取得飯店圖片（相容新舊版）
function getHotelImages(hotel: HotelData): string[] {
  if (hotel.images && hotel.images.length > 0) {
    return hotel.images
  }
  if (hotel.image) {
    return [hotel.image]
  }
  return []
}

// 圖片輪播組件
function ImageCarousel({ images, hotelName }: { images: string[]; hotelName: string }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  if (images.length === 0) {
    return (
      <div
        className="aspect-[4/3] w-full flex items-center justify-center"
        style={{ backgroundColor: '#1C1C1C' }}
      >
        <span
          className="text-6xl font-light"
          style={{ fontFamily: "'Cinzel', serif", color: '#F2F0E9' }}
        >
          {hotelName?.charAt(0) || 'H'}
        </span>
      </div>
    )
  }

  if (images.length === 1) {
    return (
      <div className="aspect-[4/3] w-full overflow-hidden">
        <img
          src={images[0]}
          alt={hotelName}
          className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
        />
      </div>
    )
  }

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden group">
      <img
        src={images[currentIndex]}
        alt={`${hotelName} ${currentIndex + 1}`}
        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
      />

      {/* 左右箭頭 */}
      <button
        onClick={() => setCurrentIndex(prev => (prev === 0 ? images.length - 1 : prev - 1))}
        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ backgroundColor: '#1C1C1C', color: '#F2F0E9' }}
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={() => setCurrentIndex(prev => (prev === images.length - 1 ? 0 : prev + 1))}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ backgroundColor: '#1C1C1C', color: '#F2F0E9' }}
      >
        <ChevronRight size={20} />
      </button>

      {/* 圖片指示器 */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className="w-2 h-2 transition-colors"
            style={{
              backgroundColor: index === currentIndex ? '#BF5B3D' : 'rgba(255,255,255,0.5)',
            }}
          />
        ))}
      </div>
    </div>
  )
}

export function TourHotelsSectionArt({ data, viewMode }: TourHotelsSectionArtProps) {
  const hotels = data.hotels || []
  const isMobile = viewMode === 'mobile'

  if (!data.showHotels && hotels.length === 0) {
    return null
  }

  // Art 風格色彩
  const colors = {
    ink: '#1C1C1C',
    paper: '#F2F0E9',
    clay: '#BF5B3D',
    accent: '#C6A87C',
  }

  // Brutalist 陰影
  const brutalistShadow = '6px 6px 0px 0px rgba(28,28,28,1)'

  return (
    <section className="py-24 relative overflow-hidden" style={{ backgroundColor: colors.paper }}>
      {/* 背景裝飾線條 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-px h-full" style={{ backgroundColor: `${colors.ink}08` }} />
        <div className="absolute top-0 right-1/4 w-px h-full" style={{ backgroundColor: `${colors.ink}08` }} />
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        {/* 標題區 - Editorial Magazine 風格 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <div className="flex items-start gap-8">
            {/* 垂直文字 */}
            <div
              className="hidden lg:block text-sm tracking-[0.3em] uppercase"
              style={{
                fontFamily: "'Cinzel', serif",
                color: colors.clay,
                writingMode: 'vertical-rl',
                textOrientation: 'mixed',
              }}
            >
              Accommodations
            </div>

            <div className="flex-1">
              <span
                className="text-sm tracking-[0.2em] uppercase block mb-4"
                style={{ fontFamily: "'Italiana', serif", color: colors.clay }}
              >
                Where You Stay
              </span>
              <h2
                className="text-5xl lg:text-7xl font-light mb-6"
                style={{ fontFamily: "'Zen Old Mincho', serif", color: colors.ink }}
              >
                精選住宿
              </h2>
              <div className="w-24 h-1" style={{ backgroundColor: colors.clay }} />
            </div>
          </div>
        </motion.div>

        {/* 飯店卡片網格 */}
        <div className={`grid ${
          isMobile
            ? 'grid-cols-1 gap-8'
            : hotels.length === 1
              ? 'grid-cols-1 max-w-2xl mx-auto gap-8'
              : hotels.length === 2
                ? 'md:grid-cols-2 max-w-4xl mx-auto gap-8'
                : 'md:grid-cols-2 lg:grid-cols-3 gap-8'
        }`}>
          {hotels.map((hotel, index) => {
            const images = getHotelImages(hotel)

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group"
              >
                <div
                  className="border-2 bg-card overflow-hidden transition-transform duration-300 hover:-translate-y-2"
                  style={{
                    borderColor: colors.ink,
                    boxShadow: brutalistShadow,
                  }}
                >
                  {/* 圖片區 */}
                  <ImageCarousel images={images} hotelName={hotel.name || '飯店'} />

                  {/* 資訊區 */}
                  <div className="p-6">
                    {/* 地點標籤 */}
                    {hotel.location && (
                      <span
                        className="text-xs tracking-[0.2em] uppercase px-3 py-1 border inline-block mb-4"
                        style={{
                          fontFamily: "'Cinzel', serif",
                          color: colors.clay,
                          borderColor: colors.clay,
                        }}
                      >
                        {hotel.location}
                      </span>
                    )}

                    {/* 飯店名稱 */}
                    <h3
                      className="text-xl font-light mb-3"
                      style={{ fontFamily: "'Zen Old Mincho', serif", color: colors.ink }}
                    >
                      {hotel.name || '飯店名稱'}
                    </h3>

                    {/* 描述 */}
                    {hotel.description && (
                      <p
                        className="text-sm leading-relaxed line-clamp-3"
                        style={{ fontFamily: "'Noto Serif TC', serif", color: `${colors.ink}99` }}
                      >
                        {hotel.description}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
