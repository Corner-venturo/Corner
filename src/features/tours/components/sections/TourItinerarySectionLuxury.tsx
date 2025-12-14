'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { MutableRefObject, useState } from 'react'
import { Plane, Hotel, UtensilsCrossed, MapPin, X, Star, Sparkles, ArrowRight } from 'lucide-react'
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

// 格式化日期為 Dec 24 格式
function formatDateShort(dateStr: string | undefined): string {
  if (!dateStr) return '--'
  try {
    const date = new Date(dateStr)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${months[date.getMonth()]} ${date.getDate()}`
  } catch {
    return dateStr
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
            const hasImages = day.images && day.images.length > 0
            const mainImage = hasImages
              ? (typeof day.images![0] === 'string' ? day.images![0] : day.images![0].url)
              : null

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
                  className="bg-white rounded-none md:rounded-3xl shadow-lg overflow-hidden group"
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
                        <span
                          className="inline-block px-2 py-1 mb-2 border border-white/30 text-[10px] tracking-widest uppercase"
                        >
                          {formatDateShort(day.date)}
                        </span>
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
                          {day.title?.split(' ')[0] || '探索'}
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

                      {/* 圖片區 */}
                      {mainImage && (
                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div className="relative h-48 overflow-hidden rounded-sm">
                            <img
                              src={mainImage}
                              alt={day.title || '行程圖片'}
                              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <div className="absolute bottom-4 left-4 text-white">
                              <span className="block text-sm font-medium">
                                {day.title?.split(' ')[0] || ''}
                              </span>
                            </div>
                          </div>

                          {/* Highlight 區塊 */}
                          {day.activities && day.activities.length > 0 && (
                            <div
                              className="flex flex-col justify-center p-6"
                              style={{ backgroundColor: LUXURY.background }}
                            >
                              <h4
                                className="text-lg mb-2"
                                style={{
                                  color: LUXURY.primary,
                                  fontFamily: "'Noto Serif TC', serif"
                                }}
                              >
                                Highlight
                              </h4>
                              <ul className="space-y-2">
                                {day.activities.slice(0, 3).map((activity, actIdx) => (
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
                                      className="w-1 h-1 rounded-full"
                                      style={{ backgroundColor: LUXURY.secondary }}
                                    />
                                    {activity.title}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      {/* 無圖片時直接顯示活動列表 */}
                      {!mainImage && day.activities && day.activities.length > 0 && (
                        <div className="space-y-3">
                          {day.activities.map((activity, actIdx) => (
                            <div
                              key={actIdx}
                              className="flex items-start gap-4 p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() => setSelectedActivity({
                                title: activity.title || '',
                                description: activity.description,
                                image: activity.image
                              })}
                            >
                              <MapPin
                                className="w-5 h-5 mt-0.5 flex-shrink-0"
                                style={{ color: LUXURY.primary }}
                              />
                              <div>
                                <span
                                  className="block font-bold text-sm"
                                  style={{ color: LUXURY.text }}
                                >
                                  {activity.title}
                                </span>
                                {activity.description && (
                                  <span
                                    className="block text-xs mt-1"
                                    style={{ color: LUXURY.muted }}
                                  >
                                    {activity.description.substring(0, 60)}
                                    {activity.description.length > 60 ? '...' : ''}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
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
                              <span className="font-medium" style={{ color: LUXURY.text }}>
                                {day.meals.breakfast}
                              </span>
                            </div>
                          )}
                          {day.meals?.lunch && (
                            <div className="flex justify-between text-sm">
                              <span style={{ color: LUXURY.muted }}>Lunch</span>
                              <span className="font-medium" style={{ color: LUXURY.text }}>
                                {day.meals.lunch}
                              </span>
                            </div>
                          )}
                          {day.meals?.dinner && (
                            <div className="flex justify-between text-sm">
                              <span style={{ color: LUXURY.muted }}>Dinner</span>
                              <span className="font-medium" style={{ color: LUXURY.primary }}>
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

                      {/* 住宿 */}
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
                    </div>

                  </div>
                </motion.div>
              </article>
            )
          })}
        </div>
      </div>

      {/* Activity Detail Modal */}
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
              className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
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
                    className="text-xl font-bold mb-4"
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
                <button
                  onClick={() => setSelectedActivity(null)}
                  className="mt-6 w-full py-3 rounded-lg font-medium text-white transition-colors"
                  style={{ backgroundColor: LUXURY.primary }}
                >
                  關閉
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
