import { motion } from 'framer-motion'
import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { SectionTitle } from './SectionTitle'

interface HotelData {
  image?: string // 舊版單張圖片（向後相容）
  images?: string[] // 新版多張圖片
  name?: string
  description?: string
}

interface TourData {
  showHotels?: boolean
  hotels?: HotelData[]
}

type CoverStyleType = 'original' | 'gemini' | 'nature' | 'serene' | 'luxury' | 'art' | 'dreamscape' | 'collage'

interface TourHotelsSectionProps {
  data: TourData
  viewMode: 'desktop' | 'mobile'
  coverStyle?: CoverStyleType
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
    return null
  }

  if (images.length === 1) {
    return (
      <div className="aspect-video w-full overflow-hidden">
        <img src={images[0]} alt={hotelName} className="w-full h-full object-cover" />
      </div>
    )
  }

  const goToPrevious = () => {
    setCurrentIndex(prev => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex(prev => (prev === images.length - 1 ? 0 : prev + 1))
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden group">
      <img
        src={images[currentIndex]}
        alt={`${hotelName} ${currentIndex + 1}`}
        className="w-full h-full object-cover transition-opacity duration-300"
      />

      {/* 左右箭頭 */}
      <button
        onClick={goToPrevious}
        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ChevronRight size={20} />
      </button>

      {/* 圖片指示器 */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentIndex ? 'bg-white' : 'bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

export function TourHotelsSection({ data, viewMode, coverStyle = 'original' }: TourHotelsSectionProps) {
  const hotels = data.hotels || []

  if (!data.showHotels && hotels.length === 0) {
    return null
  }

  // 根據飯店數量決定 grid 樣式
  const getGridClass = () => {
    const count = hotels.length
    if (count === 1) {
      return 'grid-cols-1 max-w-2xl' // 1個飯店：滿版但限制寬度
    } else if (count === 2) {
      return 'grid-cols-1 md:grid-cols-2 max-w-5xl' // 2個飯店：2欄
    } else {
      return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-7xl' // 3個飯店：3欄
    }
  }

  return (
    <section className="bg-white pt-8 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <SectionTitle
            title="飯店資訊"
            coverStyle={coverStyle}
            className="mb-12"
          />
        </motion.div>

        <div className={`grid ${getGridClass()} gap-8 mx-auto`}>
          {hotels.map((hotel, index) => {
            const images = getHotelImages(hotel)

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden border border-border"
              >
                <ImageCarousel images={images} hotelName={hotel.name || '飯店'} />
                <div className="p-6">
                  <h3 className="text-xl font-bold text-morandi-primary mb-3">
                    {hotel.name || '飯店名稱'}
                  </h3>
                  <p className="text-morandi-secondary leading-relaxed whitespace-pre-wrap">
                    {hotel.description || '飯店簡介...'}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
