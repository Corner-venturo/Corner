'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { MutableRefObject, useState, useRef } from 'react'
import { MapPin, X, ChevronLeft, ChevronRight, Utensils, Building2 } from 'lucide-react'
import { TourFormData, DailyItinerary, DayDisplayStyle } from '@/components/editor/tour-form/types'

// Art/Magazine 配色 - 根據 HTML 模板
const ART = {
  black: '#0a0a0a',
  paper: '#f4f1ea',
  accent: '#D4AF37',
  ink: '#1a1a1a',
  clay: '#c76d54',
  sage: '#8da399',
  timeline: '#4a6fa5',
}

interface TourItinerarySectionArtProps {
  data: TourFormData
  viewMode: 'desktop' | 'mobile'
  activeDayIndex: number
  dayRefs: MutableRefObject<(HTMLDivElement | null)[]>
  handleDayNavigate: (index: number) => void
}

// 計算 dayLabel - 處理建議方案編號
function calculateDayLabels(itinerary: TourFormData['dailyItinerary']): string[] {
  const labels: string[] = []
  let currentDayNumber = 0
  let alternativeCount = 0

  for (let i = 0; i < itinerary.length; i++) {
    const day = itinerary[i]
    if (day.isAlternative) {
      alternativeCount++
      const suffix = String.fromCharCode(65 + alternativeCount)
      labels.push(`Day ${currentDayNumber}-${suffix}`)
    } else {
      currentDayNumber++
      alternativeCount = 0
      labels.push(`Day ${currentDayNumber}`)
    }
  }
  return labels
}

// 格式化日期為雜誌風格
function formatDateDisplay(dateStr: string | undefined): string {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return ''
    const day = date.getDate()
    const month = date.getMonth()
    if (isNaN(day) || isNaN(month)) return ''
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
    return `${day} ${months[month]}`
  } catch {
    return ''
  }
}

// 根據出發日期計算該天日期
function calculateDayDate(departureDate: string | undefined, actualDayNumber: number): string {
  if (!departureDate || isNaN(actualDayNumber) || actualDayNumber < 1) return ''
  try {
    const date = new Date(departureDate)
    if (isNaN(date.getTime())) return ''
    date.setDate(date.getDate() + (actualDayNumber - 1))
    const day = date.getDate()
    const month = date.getMonth()
    if (isNaN(day) || isNaN(month)) return ''
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
    return `${day} ${months[month]}`
  } catch {
    return ''
  }
}

// 判斷是否為最後一天
function isLastMainDay(itinerary: TourFormData['dailyItinerary'], currentIndex: number): boolean {
  let lastMainDayIndex = -1
  for (let i = itinerary.length - 1; i >= 0; i--) {
    if (!itinerary[i].isAlternative) {
      lastMainDayIndex = i
      break
    }
  }
  if (currentIndex === lastMainDayIndex) return true
  if (itinerary[currentIndex].isAlternative) {
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (!itinerary[i].isAlternative) {
        return i === lastMainDayIndex
      }
    }
  }
  return false
}

export function TourItinerarySectionArt({
  data,
  viewMode,
  activeDayIndex,
  dayRefs,
  handleDayNavigate,
}: TourItinerarySectionArtProps) {
  const dailyItinerary = Array.isArray(data.dailyItinerary) ? data.dailyItinerary : []
  const dayLabels = calculateDayLabels(dailyItinerary)
  const isMobile = viewMode === 'mobile'
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const [selectedActivity, setSelectedActivity] = useState<{
    title: string
    description?: string
    image?: string
  } | null>(null)

  const [imageGallery, setImageGallery] = useState<{
    images: string[]
    currentIndex: number
    title?: string
  } | null>(null)

  const openImageGallery = (images: string[], startIndex: number, title?: string) => {
    setImageGallery({ images, currentIndex: startIndex, title })
  }

  const prevImage = () => {
    if (!imageGallery) return
    setImageGallery({
      ...imageGallery,
      currentIndex: imageGallery.currentIndex > 0
        ? imageGallery.currentIndex - 1
        : imageGallery.images.length - 1
    })
  }

  const nextImage = () => {
    if (!imageGallery) return
    setImageGallery({
      ...imageGallery,
      currentIndex: imageGallery.currentIndex < imageGallery.images.length - 1
        ? imageGallery.currentIndex + 1
        : 0
    })
  }

  // 水平捲動控制
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -400, behavior: 'smooth' })
    }
  }

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 400, behavior: 'smooth' })
    }
  }

  return (
    <section
      id="itinerary"
      className={isMobile ? 'py-12' : 'py-24'}
      style={{ backgroundColor: ART.paper }}
    >
      {/* 12 欄網格佈局 - 桌面版 */}
      {!isMobile ? (
        <div className="grid grid-cols-12 gap-0 min-h-[80vh]">
          {/* 左側垂直導航 - 2 欄 */}
          <div
            className="col-span-2 border-r flex flex-col justify-center items-center py-12"
            style={{ borderColor: `${ART.ink}20` }}
          >
            {/* 垂直標題 */}
            <div
              className="tracking-[0.5em] uppercase text-xs mb-8"
              style={{
                writingMode: 'vertical-rl',
                fontFamily: "'Cinzel', serif",
                color: ART.clay,
              }}
            >
              Chronicles
            </div>

            {/* 日期導航 */}
            <div className="flex flex-col gap-6">
              {dailyItinerary.map((day, index) => {
                const dayNumber = dayLabels[index].replace('Day ', '')
                const numericDay = parseInt(dayNumber.split('-')[0], 10)
                const isActive = activeDayIndex === index

                return (
                  <button
                    key={index}
                    onClick={() => handleDayNavigate(index)}
                    className={`group relative transition-all duration-300 ${
                      isActive ? 'scale-110' : 'opacity-50 hover:opacity-100'
                    }`}
                  >
                    <span
                      className="block text-3xl font-black tracking-tighter"
                      style={{
                        fontFamily: "'Cinzel', serif",
                        color: isActive ? ART.clay : ART.ink,
                      }}
                    >
                      {String(numericDay).padStart(2, '0')}
                    </span>
                    {isActive && (
                      <div
                        className="absolute -right-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                        style={{ backgroundColor: ART.clay }}
                      />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 主要內容區 - 10 欄 */}
          <div className="col-span-10 relative">
            {/* 標題區 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="px-12 pt-12 pb-8"
            >
              <span
                className="block text-xs tracking-[0.3em] uppercase mb-4"
                style={{
                  fontFamily: "'Cinzel', serif",
                  color: ART.clay,
                }}
              >
                Daily Itinerary
              </span>
              <h2
                className="text-6xl font-black leading-none tracking-tighter"
                style={{
                  fontFamily: "'Cinzel', 'Noto Serif TC', serif",
                  color: ART.ink,
                }}
              >
                每日行程
              </h2>
            </motion.div>

            {/* 水平捲動控制按鈕 */}
            <div className="absolute top-12 right-12 flex gap-2 z-10">
              <button
                onClick={scrollLeft}
                className="w-10 h-10 border flex items-center justify-center transition-colors hover:bg-black hover:text-white"
                style={{ borderColor: ART.ink }}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={scrollRight}
                className="w-10 h-10 border flex items-center justify-center transition-colors hover:bg-black hover:text-white"
                style={{ borderColor: ART.ink }}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* 水平捲動卡片容器 */}
            <div
              ref={scrollContainerRef}
              className="flex gap-6 overflow-x-auto pb-12 px-12 snap-x snap-mandatory"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              {dailyItinerary.map((day, index) => {
                const dayNumber = dayLabels[index].replace('Day ', '')
                const numericDay = parseInt(dayNumber.split('-')[0], 10)
                const dateDisplay = formatDateDisplay(day.date) || calculateDayDate(data.departureDate, numericDay)
                const dayImages = day.showDailyImages === true && day.images && day.images.length > 0 ? day.images : []
                const activityImages = day.activities?.filter(a => a.image).map(a => a.image!) || []
                const normalizedDayImages = dayImages.map(img => typeof img === 'string' ? img : img.url)
                const allImages: string[] = normalizedDayImages.length > 0 ? normalizedDayImages : activityImages
                const isLastDay = isLastMainDay(dailyItinerary, index)
                const displayStyle = day.displayStyle || 'single-image'

                return (
                  <motion.div
                    key={`day-${index}`}
                    id={`day-${index + 1}`}
                    ref={el => { dayRefs.current[index] = el as HTMLDivElement | null }}
                    initial={{ opacity: 0, x: 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex-shrink-0 snap-start group ${
                      displayStyle === 'timeline' ? 'w-[500px]' : 'w-[400px]'
                    }`}
                  >
                    <DayCard
                      day={day}
                      index={index}
                      numericDay={numericDay}
                      dateDisplay={dateDisplay}
                      allImages={allImages}
                      isLastDay={isLastDay}
                      displayStyle={displayStyle}
                      onActivityClick={setSelectedActivity}
                      onImageClick={openImageGallery}
                    />
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>
      ) : (
        /* 手機版 - 垂直堆疊 */
        <div className="px-4">
          {/* 標題 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <span
              className="block text-xs tracking-[0.3em] uppercase mb-3"
              style={{
                fontFamily: "'Cinzel', serif",
                color: ART.clay,
              }}
            >
              Chronicles
            </span>
            <h2
              className="text-4xl font-black leading-none tracking-tighter"
              style={{
                fontFamily: "'Cinzel', 'Noto Serif TC', serif",
                color: ART.ink,
              }}
            >
              每日行程
            </h2>
          </motion.div>

          {/* 手機版卡片 */}
          <div className="space-y-6">
            {dailyItinerary.map((day, index) => {
              const dayNumber = dayLabels[index].replace('Day ', '')
              const numericDay = parseInt(dayNumber.split('-')[0], 10)
              const dateDisplay = formatDateDisplay(day.date) || calculateDayDate(data.departureDate, numericDay)
              const dayImages = day.showDailyImages === true && day.images && day.images.length > 0 ? day.images : []
              const activityImages = day.activities?.filter(a => a.image).map(a => a.image!) || []
              const normalizedDayImages = dayImages.map(img => typeof img === 'string' ? img : img.url)
              const allImages: string[] = normalizedDayImages.length > 0 ? normalizedDayImages : activityImages
              const isLastDay = isLastMainDay(dailyItinerary, index)
              const displayStyle = day.displayStyle || 'single-image'

              return (
                <motion.div
                  key={`day-${index}`}
                  id={`day-${index + 1}`}
                  ref={el => { dayRefs.current[index] = el as HTMLDivElement | null }}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                >
                  <DayCard
                    day={day}
                    index={index}
                    numericDay={numericDay}
                    dateDisplay={dateDisplay}
                    allImages={allImages}
                    isLastDay={isLastDay}
                    displayStyle={displayStyle}
                    onActivityClick={setSelectedActivity}
                    onImageClick={openImageGallery}
                    isMobile
                  />
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {/* Image Gallery Modal */}
      <AnimatePresence>
        {imageGallery && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: ART.black }}
            onClick={() => setImageGallery(null)}
          >
            <button
              onClick={() => setImageGallery(null)}
              className="absolute top-6 right-6 z-10 w-12 h-12 flex items-center justify-center border transition-colors hover:bg-white hover:text-black"
              style={{ borderColor: '#fff' }}
            >
              <X className="w-6 h-6 text-white" />
            </button>

            <div className="absolute top-6 left-6 z-10">
              <span
                className="text-sm tracking-wider"
                style={{
                  fontFamily: 'monospace',
                  color: 'rgba(255,255,255,0.6)',
                }}
              >
                {imageGallery.currentIndex + 1} / {imageGallery.images.length}
              </span>
            </div>

            {imageGallery.images.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prevImage() }}
                  className="absolute left-6 z-10 w-12 h-12 flex items-center justify-center border transition-colors hover:bg-white hover:text-black"
                  style={{ borderColor: '#fff' }}
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); nextImage() }}
                  className="absolute right-6 z-10 w-12 h-12 flex items-center justify-center border transition-colors hover:bg-white hover:text-black"
                  style={{ borderColor: '#fff' }}
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </button>
              </>
            )}

            <motion.div
              key={imageGallery.currentIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="max-w-5xl max-h-[85vh] mx-6"
              onClick={e => e.stopPropagation()}
            >
              <img
                src={imageGallery.images[imageGallery.currentIndex]}
                alt={imageGallery.title || '行程圖片'}
                className="max-w-full max-h-[85vh] object-contain"
              />
            </motion.div>

            {imageGallery.images.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                {imageGallery.images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation()
                      setImageGallery({ ...imageGallery, currentIndex: idx })
                    }}
                    className={`w-2 h-2 transition-all ${
                      idx === imageGallery.currentIndex
                        ? 'bg-white w-8'
                        : 'bg-white/30 hover:bg-white/50'
                    }`}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Activity Detail Modal - Brutalist 風格 */}
      <AnimatePresence>
        {selectedActivity && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
            onClick={() => setSelectedActivity(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="max-w-lg w-full overflow-hidden relative border"
              style={{
                backgroundColor: ART.paper,
                borderColor: ART.ink,
                boxShadow: '8px 8px 0px 0px rgba(0,0,0,1)',
              }}
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedActivity(null)}
                className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center border transition-colors hover:bg-black hover:text-white"
                style={{ borderColor: ART.ink }}
              >
                <X className="w-4 h-4" />
              </button>

              {selectedActivity.image && (
                <div className="relative aspect-[16/9]">
                  <img
                    src={selectedActivity.image}
                    alt={selectedActivity.title}
                    className="w-full h-full object-cover"
                    style={{ filter: 'sepia(20%)' }}
                  />
                </div>
              )}

              <div className="p-8">
                <h3
                  className="text-2xl font-bold mb-4 pr-8"
                  style={{
                    fontFamily: "'Noto Serif TC', serif",
                    color: ART.ink,
                  }}
                >
                  {selectedActivity.title}
                </h3>
                {selectedActivity.description && (
                  <p
                    className="leading-relaxed"
                    style={{ color: '#6B7280' }}
                  >
                    {selectedActivity.description}
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
