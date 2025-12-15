'use client'

import { motion } from 'framer-motion'
import { MutableRefObject, useState } from 'react'
import { MapPin, X, ChevronLeft, ChevronRight, Utensils, Building2, Plane } from 'lucide-react'
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

// 根據出發日期計算該天日期
function calculateDayDate(departureDate: string | undefined, actualDayNumber: number): { day: number; month: string; monthShort: string; year: number } | null {
  if (!departureDate || isNaN(actualDayNumber) || actualDayNumber < 1) return null
  try {
    const date = new Date(departureDate)
    if (isNaN(date.getTime())) return null
    date.setDate(date.getDate() + (actualDayNumber - 1))
    const day = date.getDate()
    const month = date.getMonth()
    const year = date.getFullYear()
    if (isNaN(day) || isNaN(month)) return null
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
    const monthsFull = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    return { day, month: monthsFull[month], monthShort: months[month], year }
  } catch {
    return null
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

  const [imageGallery, setImageGallery] = useState<{
    images: string[]
    currentIndex: number
    title?: string
  } | null>(null)

  const openImageGallery = (images: string[], startIndex: number, title?: string) => {
    if (images.length > 0) {
      setImageGallery({ images, currentIndex: startIndex, title })
    }
  }

  return (
    <section
      id="itinerary"
      className="relative overflow-hidden"
      style={{ backgroundColor: ART.ink }}
    >
      {/* 背景裝飾線 */}
      <div className="absolute top-0 left-1/4 w-px h-full bg-white/10 hidden lg:block" />
      <div className="absolute top-0 left-2/4 w-px h-full bg-white/10 hidden lg:block" />
      <div className="absolute top-0 left-3/4 w-px h-full bg-white/10 hidden lg:block" />

      {/* Section 標題 */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className={`text-center relative z-10 ${isMobile ? 'py-16 px-4' : 'py-24'}`}
      >
        <h2
          className={`font-black leading-none tracking-tight text-white ${isMobile ? 'text-5xl' : 'text-7xl'}`}
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          CHRONICLES
        </h2>
        <div className="w-24 h-1 mx-auto mt-6" style={{ backgroundColor: ART.clay }} />
      </motion.div>

      {/* 每日行程 - 根據 displayStyle 切換不同佈局 */}
      <div className="relative z-10">
        {dailyItinerary.map((day, index) => {
          const dayNumber = dayLabels[index].replace('Day ', '')
          const numericDay = parseInt(dayNumber.split('-')[0], 10)
          const dateInfo = calculateDayDate(data.departureDate, numericDay)
          const dayImages = day.showDailyImages === true && day.images && day.images.length > 0 ? day.images : []
          const activityImages = day.activities?.filter(a => a.image).map(a => a.image!) || []
          const normalizedDayImages = dayImages.map(img => typeof img === 'string' ? img : img.url)
          const allImages: string[] = normalizedDayImages.length > 0 ? normalizedDayImages : activityImages
          const isLastDay = isLastMainDay(dailyItinerary, index)
          const displayStyle = day.displayStyle || 'single-image'

          return (
            <div
              key={`day-${index}`}
              id={`day-${index + 1}`}
              ref={el => { dayRefs.current[index] = el as HTMLDivElement | null }}
            >
              {isMobile ? (
                <MobileDaySection
                  day={day}
                  index={index}
                  numericDay={numericDay}
                  dateInfo={dateInfo}
                  allImages={allImages}
                  isLastDay={isLastDay}
                  onImageClick={openImageGallery}
                />
              ) : (
                <DaySection
                  day={day}
                  index={index}
                  numericDay={numericDay}
                  dateInfo={dateInfo}
                  allImages={allImages}
                  isLastDay={isLastDay}
                  displayStyle={displayStyle}
                  onImageClick={openImageGallery}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Image Gallery Modal */}
      {imageGallery && (
        <ImageGalleryModal
          imageGallery={imageGallery}
          onClose={() => setImageGallery(null)}
          onPrev={() => setImageGallery({
            ...imageGallery,
            currentIndex: imageGallery.currentIndex > 0
              ? imageGallery.currentIndex - 1
              : imageGallery.images.length - 1
          })}
          onNext={() => setImageGallery({
            ...imageGallery,
            currentIndex: imageGallery.currentIndex < imageGallery.images.length - 1
              ? imageGallery.currentIndex + 1
              : 0
          })}
          onSelectIndex={(idx) => setImageGallery({ ...imageGallery, currentIndex: idx })}
        />
      )}
    </section>
  )
}

// ========== 桌面版 - 根據 displayStyle 切換佈局 ==========
interface DaySectionProps {
  day: DailyItinerary
  index: number
  numericDay: number
  dateInfo: { day: number; month: string; monthShort: string; year: number } | null
  allImages: string[]
  isLastDay: boolean
  displayStyle: DayDisplayStyle
  onImageClick: (images: string[], startIndex: number, title?: string) => void
}

function DaySection({
  day,
  index,
  numericDay,
  dateInfo,
  allImages,
  isLastDay,
  displayStyle,
  onImageClick,
}: DaySectionProps) {
  switch (displayStyle) {
    case 'single-image':
      return (
        <SingleImageLayout
          day={day}
          index={index}
          numericDay={numericDay}
          dateInfo={dateInfo}
          allImages={allImages}
          isLastDay={isLastDay}
          onImageClick={onImageClick}
        />
      )
    case 'multi-image':
      return (
        <MultiImageLayout
          day={day}
          index={index}
          numericDay={numericDay}
          dateInfo={dateInfo}
          allImages={allImages}
          isLastDay={isLastDay}
          onImageClick={onImageClick}
        />
      )
    case 'card-grid':
      return (
        <CardGridLayout
          day={day}
          index={index}
          numericDay={numericDay}
          dateInfo={dateInfo}
          allImages={allImages}
          isLastDay={isLastDay}
          onImageClick={onImageClick}
        />
      )
    case 'timeline':
      return (
        <TimelineLayout
          day={day}
          index={index}
          numericDay={numericDay}
          dateInfo={dateInfo}
          allImages={allImages}
          isLastDay={isLastDay}
          onImageClick={onImageClick}
        />
      )
    default:
      return (
        <SingleImageLayout
          day={day}
          index={index}
          numericDay={numericDay}
          dateInfo={dateInfo}
          allImages={allImages}
          isLastDay={isLastDay}
          onImageClick={onImageClick}
        />
      )
  }
}

// ========== 佈局 1: single-image - 左側日期 + 中央大圖 + 右側內容 ==========
interface LayoutProps {
  day: DailyItinerary
  index: number
  numericDay: number
  dateInfo: { day: number; month: string; monthShort: string; year: number } | null
  allImages: string[]
  isLastDay: boolean
  onImageClick: (images: string[], startIndex: number, title?: string) => void
}

function SingleImageLayout({
  day,
  index,
  numericDay,
  dateInfo,
  allImages,
  isLastDay,
  onImageClick,
}: LayoutProps) {
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
              <img
                src={mainImage}
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
                className="px-3 py-1 text-sm border border-white/20 text-white/70 hover:bg-white hover:text-black transition-colors cursor-pointer"
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

// ========== 佈局 2: multi-image - 反向佈局 + 雙圖網格 ==========
function MultiImageLayout({
  day,
  index,
  numericDay,
  dateInfo,
  allImages,
  isLastDay,
  onImageClick,
}: LayoutProps) {
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

// ========== 佈局 3: card-grid - 斜切背景 + 大圖 + 疊加內容 ==========
function CardGridLayout({
  day,
  index,
  numericDay,
  dateInfo,
  allImages,
  isLastDay,
  onImageClick,
}: LayoutProps) {
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

// ========== 佈局 4: timeline - 時間軸卡片風格 ==========
function TimelineLayout({
  day,
  index,
  numericDay,
  dateInfo,
  allImages,
  isLastDay,
  onImageClick,
}: LayoutProps) {
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
            className="flex-1 p-6 flex flex-col justify-center border border-white/10 hover:bg-white/10 transition-colors"
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
        className="min-w-[300px] lg:min-w-[400px] border border-white/10 p-8 hover:bg-white/10 transition-colors cursor-pointer group"
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
            <img
              src={allImages[0]}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        )}
        {!hasImage && (
          <div className="h-40 overflow-hidden mb-6 bg-white/5 flex items-center justify-center">
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

// ========== 手機版 Section ==========
interface MobileDaySectionProps {
  day: DailyItinerary
  index: number
  numericDay: number
  dateInfo: { day: number; month: string; monthShort: string; year: number } | null
  allImages: string[]
  isLastDay: boolean
  onImageClick: (images: string[], startIndex: number, title?: string) => void
}

function MobileDaySection({
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
          <img
            src={mainImage}
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

// ========== 圖片 Gallery Modal ==========
interface ImageGalleryModalProps {
  imageGallery: {
    images: string[]
    currentIndex: number
    title?: string
  }
  onClose: () => void
  onPrev: () => void
  onNext: () => void
  onSelectIndex: (idx: number) => void
}

function ImageGalleryModal({
  imageGallery,
  onClose,
  onPrev,
  onNext,
  onSelectIndex,
}: ImageGalleryModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: ART.black }}
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-6 right-6 z-10 w-12 h-12 flex items-center justify-center border border-white transition-colors hover:bg-white hover:text-black"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      <div className="absolute top-6 left-6 z-10">
        <span className="text-sm tracking-wider font-mono text-white/60">
          {imageGallery.currentIndex + 1} / {imageGallery.images.length}
        </span>
      </div>

      {imageGallery.images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); onPrev() }}
            className="absolute left-6 z-10 w-12 h-12 flex items-center justify-center border border-white transition-colors hover:bg-white hover:text-black"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onNext() }}
            className="absolute right-6 z-10 w-12 h-12 flex items-center justify-center border border-white transition-colors hover:bg-white hover:text-black"
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
              onClick={(e) => { e.stopPropagation(); onSelectIndex(idx) }}
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
  )
}
