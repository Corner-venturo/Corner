'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { MutableRefObject, useState } from 'react'
import { MapPin, Star, ArrowRight, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { TourFormData } from '@/components/editor/tour-form/types'

// Luxury 配色
const LUXURY = {
  primary: '#2C5F4D',
  secondary: '#C69C6D',
  accent: '#8F4F4F',
  background: '#FDFBF7',
  surface: '#FFFFFF',
  text: '#2D3436',
  muted: '#636E72',
  tableHeader: '#F0F4F3',
}

interface TourItinerarySectionLuxuryProps {
  data: TourFormData
  viewMode: 'desktop' | 'mobile'
  activeDayIndex: number
  dayRefs: MutableRefObject<(HTMLDivElement | null)[]>
  handleDayNavigate: (index: number) => void
}

// Day 卡片背景色循環
const DAY_COLORS = [
  LUXURY.primary,    // 深綠
  LUXURY.text,       // 深灰
  LUXURY.secondary,  // 金銅
  LUXURY.accent,     // 酒紅
]

// 計算 dayLabel
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

// 格式化日期為 DEC 24 格式（大寫月份）
function formatDateShort(dateStr: string | undefined): string {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return ''
    const month = date.getMonth()
    const day = date.getDate()
    if (isNaN(month) || isNaN(day)) return ''
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
    return `${months[month]} ${day}`
  } catch {
    return ''
  }
}

// 根據出發日期和實際天數（非 index）計算該天的日期
// actualDayNumber 是從 1 開始的實際天數，建議行程不增加天數
function calculateDayDate(departureDate: string | undefined, actualDayNumber: number): string {
  if (!departureDate || isNaN(actualDayNumber) || actualDayNumber < 1) return ''
  try {
    const date = new Date(departureDate)
    if (isNaN(date.getTime())) return ''
    // actualDayNumber 從 1 開始，所以 Day 1 = 出發日，Day 2 = 出發日 +1
    date.setDate(date.getDate() + (actualDayNumber - 1))
    const month = date.getMonth()
    const day = date.getDate()
    if (isNaN(month) || isNaN(day)) return ''
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
    return `${months[month]} ${day}`
  } catch {
    return ''
  }
}

// 獲取星期幾縮寫
function getDayOfWeek(dateStr: string | undefined): string {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return days[date.getDay()]
  } catch {
    return ''
  }
}

// 判斷是否為實際的最後一天（考慮替代行程）
function isLastMainDay(itinerary: TourFormData['dailyItinerary'], currentIndex: number): boolean {
  // 找出最後一個「非替代行程」的索引
  let lastMainDayIndex = -1
  for (let i = itinerary.length - 1; i >= 0; i--) {
    if (!itinerary[i].isAlternative) {
      lastMainDayIndex = i
      break
    }
  }

  // 如果當前是最後一個主行程，則為最後一天
  if (currentIndex === lastMainDayIndex) return true

  // 如果當前是替代行程，檢查其對應的主行程是否為最後一天
  // 替代行程（如 Day 3-B）跟隨在主行程（Day 3）之後，也視為最後一天
  if (itinerary[currentIndex].isAlternative) {
    // 向前找到對應的主行程
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (!itinerary[i].isAlternative) {
        return i === lastMainDayIndex
      }
    }
  }

  return false
}

export function TourItinerarySectionLuxury({
  data,
  viewMode,
  activeDayIndex,
  dayRefs,
  handleDayNavigate,
}: TourItinerarySectionLuxuryProps) {
  const dailyItinerary = Array.isArray(data.dailyItinerary) ? data.dailyItinerary : []
  const dayLabels = calculateDayLabels(dailyItinerary)
  const isMobile = viewMode === 'mobile'

  const [selectedActivity, setSelectedActivity] = useState<{
    title: string
    description?: string
    image?: string
  } | null>(null)

  // 圖片瀏覽器狀態 - 每張圖片可以有自己的標題和描述
  const [imageGallery, setImageGallery] = useState<{
    images: { url: string; title?: string; description?: string }[]
    currentIndex: number
  } | null>(null)

  // 開啟圖片瀏覽器
  const openImageGallery = (images: { url: string; title?: string; description?: string }[], startIndex: number) => {
    setImageGallery({ images, currentIndex: startIndex })
  }

  // 切換上一張
  const prevImage = () => {
    if (!imageGallery) return
    setImageGallery({
      ...imageGallery,
      currentIndex: imageGallery.currentIndex > 0
        ? imageGallery.currentIndex - 1
        : imageGallery.images.length - 1
    })
  }

  // 切換下一張
  const nextImage = () => {
    if (!imageGallery) return
    setImageGallery({
      ...imageGallery,
      currentIndex: imageGallery.currentIndex < imageGallery.images.length - 1
        ? imageGallery.currentIndex + 1
        : 0
    })
  }

  return (
    <section
      id="itinerary"
      className={isMobile ? 'py-8' : 'py-16 pb-24'}
      style={{ backgroundColor: LUXURY.background }}
    >
      <div className={isMobile ? 'px-4' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}>
        {/* 標題區塊 - 靠左對齊 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={`flex items-center justify-between ${isMobile ? 'mb-8' : 'mb-16'} relative`}
        >
          <div>
            <span
              className="block mb-2 italic"
              style={{
                color: LUXURY.secondary,
                fontFamily: "'Noto Serif TC', serif",
                fontSize: isMobile ? '1rem' : '1.125rem'
              }}
            >
              Day by Day
            </span>
            <h2
              className={`font-medium ${isMobile ? 'text-2xl' : 'text-4xl'}`}
              style={{
                color: LUXURY.text,
                fontFamily: "'Noto Serif TC', serif"
              }}
            >
              每日行程詳情
            </h2>
          </div>
          {/* 裝飾線 */}
          {!isMobile && (
            <div
              className="absolute bottom-0 left-0 w-full h-px -z-10 translate-y-4"
              style={{ backgroundColor: '#E5E7EB' }}
            />
          )}
        </motion.div>

        {/* 每日行程卡片 */}
        <div className="space-y-12">
          {dailyItinerary.map((day, index) => {
            const dayColor = DAY_COLORS[index % DAY_COLORS.length]
            const dayNumber = dayLabels[index].replace('Day ', '')
            // 檢查圖片來源：1. day.images（需 showDailyImages=true） 2. activities 裡的 image
            const dayImages = day.showDailyImages === true && day.images && day.images.length > 0 ? day.images : []
            // 建構帶有標題和描述的圖片陣列
            const normalizedDayImages = dayImages.map((img, idx) => ({
              url: typeof img === 'string' ? img : img.url,
              title: day.activities?.[idx]?.title || '',
              description: day.activities?.[idx]?.description || ''
            }))
            const activityImagesWithInfo = day.activities?.filter(a => a.image).map(a => ({
              url: a.image!,
              title: a.title || '',
              description: a.description || ''
            })) || []
            // 合併所有圖片來源
            const allImages = normalizedDayImages.length > 0 ? normalizedDayImages : activityImagesWithInfo
            const hasImages = allImages.length > 0

            return (
              <article
                key={`day-${index}`}
                id={`day-${index + 1}`}
                ref={el => { dayRefs.current[index] = el as HTMLDivElement | null }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl md:rounded-3xl shadow-lg overflow-hidden group"
                  style={{ borderColor: '#f0f0f0' }}
                >
                  <div className={`grid ${isMobile ? 'grid-cols-1' : 'lg:grid-cols-12'} h-full`}>

                    {/* 左側：日期區塊 */}
                    <div
                      className={`${isMobile ? 'p-6' : 'lg:col-span-2 p-8'} text-white flex flex-col justify-between items-start relative overflow-hidden`}
                      style={{ backgroundColor: dayColor }}
                    >
                      {/* 大數字背景 */}
                      <div
                        className="absolute -right-4 top-1/2 -translate-y-1/2 text-9xl font-bold select-none"
                        style={{
                          fontFamily: "'Noto Serif TC', serif",
                          color: 'rgba(255,255,255,0.05)'
                        }}
                      >
                        {dayNumber.padStart(2, '0')}
                      </div>

                      <div>
                        {/* 日期標籤 - DEC 25 格式 */}
                        {/* 使用 dayNumber（從 dayLabel 提取）而非 index，這樣建議行程會使用正確的天數 */}
                        {(() => {
                          // 從 dayNumber 提取數字部分（如 "5" 或 "5-B" → 5）
                          const numericDay = parseInt(dayNumber.split('-')[0], 10)
                          const dateDisplay = formatDateShort(day.date) || calculateDayDate(data.departureDate, numericDay)
                          return dateDisplay ? (
                            <span
                              className="inline-block px-3 py-1.5 mb-3 bg-white/10 backdrop-blur-sm rounded text-xs font-medium tracking-widest"
                            >
                              {dateDisplay}
                            </span>
                          ) : null
                        })()}
                        <h3
                          className="text-5xl font-medium"
                          style={{ fontFamily: "'Noto Serif TC', serif" }}
                        >
                          Day {dayNumber}
                        </h3>
                      </div>

                      <div className="space-y-1 z-10">
                        <div className="text-xs uppercase tracking-widest opacity-70">
                          {day.isAlternative ? 'Alternative' : 'Location'}
                        </div>
                        <div
                          className="font-medium text-lg"
                          style={{ color: day.isAlternative ? '#fff' : LUXURY.secondary }}
                        >
                          {day.locationLabel || day.title?.split(' ')[0] || '探索'}
                        </div>
                      </div>
                    </div>

                    {/* 中間：主要內容 */}
                    <div
                      className={`${isMobile ? 'p-6' : 'lg:col-span-7 p-8 lg:p-10'} border-r`}
                      style={{ borderColor: '#f0f0f0' }}
                    >
                      {/* 標題區 */}
                      <div className="flex items-start justify-between mb-6">
                        <h3
                          className={`font-bold ${isMobile ? 'text-xl' : 'text-2xl'}`}
                          style={{
                            color: LUXURY.text,
                            fontFamily: "'Noto Sans TC', sans-serif"
                          }}
                        >
                          {day.title || `第 ${index + 1} 天行程`}
                        </h3>
                        {day.isAlternative && (
                          <span
                            className="px-2 py-1 text-xs rounded-full"
                            style={{
                              backgroundColor: `${LUXURY.secondary}20`,
                              color: LUXURY.secondary
                            }}
                          >
                            建議方案
                          </span>
                        )}
                      </div>

                      {/* 描述 */}
                      {day.description && (
                        <p
                          className={`leading-loose mb-8 font-light ${isMobile ? 'text-sm' : ''}`}
                          style={{
                            color: LUXURY.muted,
                            fontFamily: "'Noto Sans TC', sans-serif"
                          }}
                        >
                          {day.description}
                        </p>
                      )}

                      {/* 圖片區 - 有圖片時顯示圖片，無圖片時顯示景點列表 */}
                      {hasImages ? (
                        <div className="mb-6">
                          {/* 單張圖片：左圖右文 */}
                          {allImages.length === 1 && (
                            <div className="grid grid-cols-2 gap-6">
                              {/* 左側圖片 */}
                              <div
                                className="relative h-56 overflow-hidden rounded-sm cursor-pointer group/img"
                                onClick={() => openImageGallery(allImages, 0)}
                              >
                                <img
                                  src={allImages[0].url}
                                  alt={allImages[0].title || '行程圖片'}
                                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-colors" />
                              </div>
                              {/* 右側說明 */}
                              <div
                                className="flex flex-col justify-center p-5"
                                style={{ backgroundColor: LUXURY.background }}
                              >
                                {/* 1. 標題 */}
                                <h4
                                  className="text-lg font-medium mb-3"
                                  style={{
                                    color: LUXURY.primary,
                                    fontFamily: "'Noto Serif TC', serif"
                                  }}
                                >
                                  Highlight
                                </h4>
                                {/* 2. 景點列表 */}
                                <ul className="space-y-2 mb-4">
                                  {day.activities?.map((activity, actIdx) => (
                                    <li
                                      key={actIdx}
                                      className="flex items-center gap-2 text-sm cursor-pointer hover:opacity-80"
                                      style={{ color: LUXURY.muted }}
                                      onClick={() => setSelectedActivity({
                                        title: activity.title || '',
                                        description: activity.description,
                                        image: activity.image
                                      })}
                                    >
                                      <span
                                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: LUXURY.secondary }}
                                      />
                                      {activity.title}
                                    </li>
                                  ))}
                                </ul>
                                {/* 3. 說明文字 */}
                                {day.activities?.[0]?.description && (
                                  <p
                                    className="text-xs leading-relaxed border-t pt-3"
                                    style={{
                                      color: LUXURY.muted,
                                      borderColor: '#e5e5e5'
                                    }}
                                  >
                                    {day.activities[0].description}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* 多張圖片：橫向排列，最多顯示3張 */}
                          {allImages.length >= 2 && (
                            <div className={`grid gap-4 ${allImages.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                              {allImages.slice(0, 3).map((img, imgIdx) => (
                                <div
                                  key={imgIdx}
                                  className="relative h-44 overflow-hidden rounded-sm cursor-pointer group/img"
                                  onClick={() => openImageGallery(allImages, imgIdx)}
                                >
                                  <img
                                    src={img.url}
                                    alt={img.title || ''}
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-105"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                                  {/* 左下角標籤 */}
                                  <div className="absolute bottom-3 left-3">
                                    <span
                                      className="text-white text-xs font-bold uppercase tracking-wider"
                                      style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                                    >
                                      {img.title}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* 如果超過3張，顯示查看更多按鈕 */}
                          {allImages.length > 3 && (
                            <button
                              className="mt-3 text-sm font-medium flex items-center gap-1 hover:opacity-80 transition-opacity"
                              style={{ color: LUXURY.secondary }}
                              onClick={() => openImageGallery(allImages, 3)}
                            >
                              <span>查看更多 +{allImages.length - 3}</span>
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ) : (
                        /* 無圖片時：顯示 Highlight 景點列表 */
                        day.activities && day.activities.length > 0 && (
                          <div
                            className="p-5 rounded-sm mb-4"
                            style={{ backgroundColor: LUXURY.background }}
                          >
                            <h4
                              className="text-base font-medium mb-3"
                              style={{
                                color: LUXURY.primary,
                                fontFamily: "'Noto Serif TC', serif"
                              }}
                            >
                              Highlight
                            </h4>
                            <ul className="space-y-2">
                              {day.activities.map((activity, actIdx) => (
                                <li
                                  key={actIdx}
                                  className="flex items-center gap-2 text-sm cursor-pointer hover:opacity-80"
                                  style={{ color: LUXURY.muted }}
                                  onClick={() => setSelectedActivity({
                                    title: activity.title || '',
                                    description: activity.description,
                                    image: activity.image
                                  })}
                                >
                                  <span
                                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: LUXURY.secondary }}
                                  />
                                  {activity.title}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )
                      )}

                    </div>

                    {/* 右側：餐食與住宿 */}
                    <div
                      className={`${isMobile ? 'p-6' : 'lg:col-span-3 p-8'} flex flex-col justify-center space-y-8`}
                      style={{ backgroundColor: '#f9fafb' }}
                    >
                      {/* 餐食 */}
                      <div
                        className="relative pl-6 border-l"
                        style={{ borderColor: '#E5E7EB' }}
                      >
                        <span
                          className="absolute -left-1.5 top-0 w-3 h-3 rounded-full border-2 border-white"
                          style={{ backgroundColor: LUXURY.secondary }}
                        />
                        <h5
                          className="text-xs font-bold uppercase tracking-widest mb-3"
                          style={{ color: LUXURY.muted }}
                        >
                          Dining
                        </h5>
                        <div className="space-y-2">
                          {day.meals?.breakfast && (
                            <div className="flex justify-between text-sm">
                              <span style={{ color: LUXURY.muted }}>Breakfast</span>
                              <span className="font-medium" style={{ color: dayColor }}>
                                {day.meals.breakfast}
                              </span>
                            </div>
                          )}
                          {day.meals?.lunch && (
                            <div className="flex justify-between text-sm">
                              <span style={{ color: LUXURY.muted }}>Lunch</span>
                              <span className="font-medium" style={{ color: dayColor }}>
                                {day.meals.lunch}
                              </span>
                            </div>
                          )}
                          {day.meals?.dinner && (
                            <div className="flex justify-between text-sm">
                              <span style={{ color: LUXURY.muted }}>Dinner</span>
                              <span className="font-medium" style={{ color: dayColor }}>
                                {day.meals.dinner}
                              </span>
                            </div>
                          )}
                          {!day.meals?.breakfast && !day.meals?.lunch && !day.meals?.dinner && (
                            <div className="text-sm" style={{ color: LUXURY.muted }}>
                              請參考行程安排
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 住宿 - 最後一天（包含替代行程）不顯示 */}
                      {!isLastMainDay(dailyItinerary, index) && (
                        <div
                          className="relative pl-6 border-l"
                          style={{ borderColor: '#E5E7EB' }}
                        >
                          <span
                            className="absolute -left-1.5 top-0 w-3 h-3 rounded-full border-2 border-white"
                            style={{ backgroundColor: LUXURY.primary }}
                          />
                          <h5
                            className="text-xs font-bold uppercase tracking-widest mb-3"
                            style={{ color: LUXURY.muted }}
                          >
                            Stay
                          </h5>
                          {day.accommodation ? (
                            <div
                              className="bg-white p-4 shadow-sm rounded-sm border"
                              style={{ borderColor: '#f0f0f0' }}
                            >
                              {/* 續住標示 */}
                              {day.isSameAccommodation && (
                                <div className="flex items-center gap-2 mb-2">
                                  <div
                                    className="w-4 h-4 rounded border-2 flex items-center justify-center"
                                    style={{ borderColor: LUXURY.secondary, backgroundColor: `${LUXURY.secondary}15` }}
                                  >
                                    <svg className="w-3 h-3" style={{ color: LUXURY.secondary }} fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                  <span className="text-xs" style={{ color: LUXURY.secondary }}>續住</span>
                                </div>
                              )}
                              <div
                                className="font-bold text-lg mb-1"
                                style={{
                                  fontFamily: "'Noto Serif TC', serif",
                                  color: LUXURY.text
                                }}
                              >
                                {day.accommodation}
                              </div>
                              {/* 星級 */}
                              {day.accommodationRating && day.accommodationRating > 0 && (
                                <div className="flex gap-0.5">
                                  {[1, 2, 3, 4, 5].slice(0, day.accommodationRating).map(i => (
                                    <Star
                                      key={i}
                                      className="w-3 h-3 fill-current"
                                      style={{ color: LUXURY.secondary }}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-sm" style={{ color: LUXURY.muted }}>
                              待確認
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                  </div>
                </motion.div>
              </article>
            )
          })}
        </div>
      </div>

      {/* Image Gallery Modal - 全螢幕圖片瀏覽器 */}
      <AnimatePresence>
        {imageGallery && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
            onClick={() => setImageGallery(null)}
          >
            {/* X 關閉按鈕 */}
            <button
              onClick={() => setImageGallery(null)}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            {/* 圖片計數 */}
            <div className="absolute top-4 left-4 z-10 text-white/80 text-sm">
              {imageGallery.currentIndex + 1} / {imageGallery.images.length}
            </div>

            {/* 左箭頭 */}
            {imageGallery.images.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  prevImage()
                }}
                className="absolute left-4 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="w-8 h-8 text-white" />
              </button>
            )}

            {/* 圖片 */}
            <motion.div
              key={imageGallery.currentIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-4xl max-h-[80vh] mx-4"
              onClick={e => e.stopPropagation()}
            >
              <img
                src={imageGallery.images[imageGallery.currentIndex].url}
                alt={imageGallery.images[imageGallery.currentIndex].title || '行程圖片'}
                className="max-w-full max-h-[60vh] object-contain rounded-lg"
              />
              {/* 景點標題和描述 */}
              <div className="text-center mt-4 max-w-2xl mx-auto">
                {imageGallery.images[imageGallery.currentIndex].title && (
                  <h3
                    className="text-white text-xl font-bold mb-2"
                    style={{ fontFamily: "'Noto Serif TC', serif" }}
                  >
                    {imageGallery.images[imageGallery.currentIndex].title}
                  </h3>
                )}
                {imageGallery.images[imageGallery.currentIndex].description && (
                  <p className="text-white/80 text-sm leading-relaxed">
                    {imageGallery.images[imageGallery.currentIndex].description}
                  </p>
                )}
              </div>
            </motion.div>

            {/* 右箭頭 */}
            {imageGallery.images.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  nextImage()
                }}
                className="absolute right-4 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <ChevronRight className="w-8 h-8 text-white" />
              </button>
            )}

            {/* 縮圖列表 */}
            {imageGallery.images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {imageGallery.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation()
                      setImageGallery({ ...imageGallery, currentIndex: idx })
                    }}
                    className={`w-16 h-12 rounded overflow-hidden border-2 transition-all ${
                      idx === imageGallery.currentIndex
                        ? 'border-white opacity-100'
                        : 'border-transparent opacity-50 hover:opacity-75'
                    }`}
                  >
                    <img
                      src={img.url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Activity Detail Modal - 景點詳情彈窗（保留給無圖片的景點列表點擊） */}
      <AnimatePresence>
        {selectedActivity && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedActivity(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl relative"
              onClick={e => e.stopPropagation()}
            >
              {/* X 關閉按鈕 */}
              <button
                onClick={() => setSelectedActivity(null)}
                className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>

              {selectedActivity.image && (
                <div className="relative h-48">
                  <img
                    src={selectedActivity.image}
                    alt={selectedActivity.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3
                      className="text-xl font-bold"
                      style={{ fontFamily: "'Noto Serif TC', serif" }}
                    >
                      {selectedActivity.title}
                    </h3>
                  </div>
                </div>
              )}
              <div className="p-6">
                {!selectedActivity.image && (
                  <h3
                    className="text-xl font-bold mb-4 pr-8"
                    style={{
                      color: LUXURY.text,
                      fontFamily: "'Noto Serif TC', serif"
                    }}
                  >
                    {selectedActivity.title}
                  </h3>
                )}
                {selectedActivity.description && (
                  <p
                    className="leading-relaxed"
                    style={{ color: LUXURY.muted }}
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
