'use client'

import { motion } from 'framer-motion'
import type { TourPageData, HotelInfo } from '@/features/tours/types/tour-display.types'

interface TourHotelsSectionCollageProps {
  data: TourPageData
  viewMode: 'desktop' | 'mobile'
}

// 圖釘顏色
const pushpinColors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500']

// 旋轉角度
const rotations = ['rotate-1', '-rotate-2', 'rotate-2', '-rotate-1']
const hoverRotations = ['-rotate-1', 'rotate-1', 'rotate-0', 'rotate-2']

// 取得飯店圖片
function getHotelImage(hotel: HotelInfo): string | null {
  if (hotel.images && hotel.images.length > 0) {
    return hotel.images[0]
  }
  if (hotel.image) {
    return hotel.image
  }
  return null
}

export function TourHotelsSectionCollage({ data, viewMode }: TourHotelsSectionCollageProps) {
  const hotels = data.hotels || []
  const isMobile = viewMode === 'mobile'

  if (!data.showHotels && hotels.length === 0) {
    return null
  }

  return (
    <section className="py-24 bg-[#fdfbf7] relative border-t-4 border-black border-dashed">
      <div className="max-w-7xl mx-auto px-6">
        {/* 標題 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <h2
            className="text-6xl inline-block bg-[#FFEB3B] px-4 transform rotate-1 border-2 border-black"
            style={{
              fontFamily: "'Permanent Marker', cursive",
              boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
            }}
          >
            REST STOPS
          </h2>
        </motion.div>

        {/* 飯店卡片網格 */}
        <div className={`grid ${
          isMobile
            ? 'grid-cols-1 gap-8'
            : hotels.length === 1
              ? 'grid-cols-1 max-w-md mx-auto gap-8'
              : hotels.length === 2
                ? 'md:grid-cols-2 max-w-3xl mx-auto gap-8'
                : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8'
        }`}>
          {hotels.map((hotel, index) => {
            const image = getHotelImage(hotel)
            const pushpinColor = pushpinColors[index % pushpinColors.length]
            const rotation = rotations[index % rotations.length]
            const hoverRotation = hoverRotations[index % hoverRotations.length]
            const hasOffset = index % 2 === 1 && !isMobile

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`bg-card p-3 pb-8 relative group ${hasOffset ? 'mt-8 lg:mt-0' : ''}`}
                style={{
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                }}
              >
                {/* 圖釘 */}
                <div
                  className={`absolute -top-4 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full ${pushpinColor} shadow-sm z-20 border border-black/20`}
                />

                {/* 圖片區 */}
                <div className="overflow-hidden h-48 mb-4 border border-border">
                  {image ? (
                    <img src={image}
                      alt={hotel.name || '飯店'}
                      className={`w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 transform ${rotation} group-hover:${hoverRotation}`}
                    />
                  ) : (
                    <div className="w-full h-full bg-morandi-container flex items-center justify-center">
                      <span className="text-4xl text-morandi-secondary">🏨</span>
                    </div>
                  )}
                </div>

                {/* 飯店資訊 */}
                <h3 className="font-bold text-lg" style={{ fontFamily: "'Noto Serif TC', serif" }}>
                  {hotel.name || '飯店名稱'}
                </h3>
                <p
                  className="text-xs text-morandi-secondary uppercase"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  {hotel.location || '地點'}
                </p>

                {/* 裝飾性描述 */}
                {hotel.description && (
                  <div
                    className="absolute bottom-4 right-4 transform -rotate-[15deg] text-lg font-bold text-[#FF0080]"
                    style={{ fontFamily: "'Gloria Hallelujah', cursive" }}
                  >
                    {hotel.description.length > 20 ? hotel.description.substring(0, 20) + '...' : hotel.description}
                  </div>
                )}

                {/* 星星評分裝飾 */}
                <div className="mt-4 flex gap-1">
                  {[1, 2, 3, 4].map((star) => (
                    <svg
                      key={star}
                      className="w-4 h-4 text-[#FFEB3B]"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
