import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { DailyImageCarousel } from './DailyImageCarousel'
import { MutableRefObject, useState } from 'react'
import {
  DayLabel,
  DateSubtitle,
  AttractionCard,
  DecorativeDivider,
  MobileActivityCarousel,
  DesktopActivityCarousel,
  JapaneseActivityCard,
  JapaneseAccommodationCard,
  JapaneseMealsCard,
} from '@/components/tour-preview'
import { ArrowRight, Sparkles, X } from 'lucide-react'
import Image from 'next/image'
import { TourFormData } from '@/components/editor/tour-form/types'
import { SectionTitle } from './SectionTitle'

interface TourItinerarySectionProps {
  data: TourFormData
  viewMode: 'desktop' | 'mobile'
  activeDayIndex: number
  dayRefs: MutableRefObject<(HTMLDivElement | null)[]>
  handleDayNavigate: (index: number) => void
  coverStyle?: 'original' | 'gemini' | 'nature' | 'serene'
}

// 將標題中的文字符號轉換成 SVG 圖標
function renderTitleWithIcons(title: string, viewMode: 'desktop' | 'mobile') {
  // 支援有空格和沒空格的符號：→ ⇀ · | ⭐
  const parts = title.split(/(\s*→\s*|\s*⇀\s*|\s*·\s*|\s*\|\s*|\s*⭐\s*)/g)
  const iconSize = viewMode === 'mobile' ? 10 : 16

  return parts.map((part, index) => {
    const trimmedPart = part.trim()
    if (trimmedPart === '→' || trimmedPart === '⇀') {
      return (
        <ArrowRight
          key={index}
          size={iconSize}
          className="inline-block text-morandi-primary"
          style={{ verticalAlign: 'middle', margin: viewMode === 'mobile' ? '0 2px' : '0 4px' }}
        />
      )
    } else if (trimmedPart === '⭐') {
      return (
        <Sparkles
          key={index}
          size={iconSize}
          className="inline-block text-morandi-gold"
          style={{ verticalAlign: 'middle', margin: viewMode === 'mobile' ? '0 2px' : '0 4px' }}
        />
      )
    } else if (trimmedPart === '·' || trimmedPart === '|') {
      return (
        <span
          key={index}
          className="text-morandi-secondary inline-block"
          style={{ verticalAlign: 'middle', margin: viewMode === 'mobile' ? '0 2px' : '0 4px' }}
        >
          {trimmedPart}
        </span>
      )
    } else if (part) {
      return <span key={index}>{part}</span>
    }
    return null
  })
}

// 計算 dayLabel 的函數 - 處理建議方案編號
function calculateDayLabels(itinerary: TourFormData['dailyItinerary']): string[] {
  const labels: string[] = []
  let currentDayNumber = 0
  let alternativeCount = 0 // 當前建議方案的計數 (B=1, C=2, ...)

  for (let i = 0; i < itinerary.length; i++) {
    const day = itinerary[i]

    if (day.isAlternative) {
      // 這是建議方案，使用前一個正規天數的編號 + 字母
      alternativeCount++
      const suffix = String.fromCharCode(65 + alternativeCount) // B, C, D...
      labels.push(`Day ${currentDayNumber}-${suffix}`)
    } else {
      // 這是正規天數
      currentDayNumber++
      alternativeCount = 0 // 重置建議方案計數
      labels.push(`Day ${currentDayNumber}`)
    }
  }

  return labels
}

export function TourItinerarySection({
  data,
  viewMode,
  activeDayIndex,
  dayRefs,
  handleDayNavigate,
  coverStyle = 'original',
}: TourItinerarySectionProps) {
  const dailyItinerary = Array.isArray(data.dailyItinerary) ? data.dailyItinerary : []
  const dayLabels = calculateDayLabels(dailyItinerary)
  const [selectedActivity, setSelectedActivity] = useState<{
    title: string
    description?: string
    image?: string
  } | null>(null)

  // 收集整個行程的所有每日照片
  const allTourImages = dailyItinerary.flatMap(day =>
    (day.images || []).map(img =>
      typeof img === 'string' ? img : img.url
    ).filter(url => url && url.trim() !== '')
  )

  // 創建點擊處理函數
  const handleActivityClick = (activity: { title?: string; description?: string; image?: string }) => {
    if (!activity.title) return
    setSelectedActivity({
      title: activity.title,
      description: activity.description,
      image: activity.image
    })
  }

  return (
    <section
      id="itinerary"
      className={viewMode === 'mobile' ? 'bg-white pt-4 pb-8' : 'bg-white pt-8 pb-16'}
    >
      <div className={viewMode === 'mobile' ? 'px-4' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <SectionTitle
            title="詳細行程"
            coverStyle={coverStyle}
            className={viewMode === 'mobile' ? 'mb-4' : 'mb-12'}
          />
        </motion.div>

        <div>
          <div>
            <div className={viewMode === 'mobile' ? 'space-y-2' : 'space-y-12'}>
              {dailyItinerary.map((day, index: number) => (
                <article
                  key={`day-section-${index}`}
                  id={`day-${index + 1}`}
                  ref={el => {
                    dayRefs.current[index] = el as HTMLDivElement | null
                  }}
                  className={
                    viewMode === 'mobile'
                      ? 'relative py-6 border-b border-morandi-container/30 last:border-b-0'
                      : 'relative overflow-hidden rounded-[36px] border border-morandi-container/30 bg-white/95 p-8 shadow-lg backdrop-blur-sm'
                  }
                >
                  {/* 日式和風風格的標題區塊 */}
                  {coverStyle === 'nature' ? (
                    <div className={cn(
                      "relative mb-4 md:mb-6",
                      viewMode === 'mobile' ? 'px-4' : ''
                    )}>
                      <DayLabel
                        dayLabel={dayLabels[index]}
                        isAlternative={day.isAlternative}
                        coverStyle="nature"
                        title={day.title}
                      />
                      {day.isAlternative && (
                        <span className="ml-4 px-2 py-0.5 bg-[#30abe8]/10 text-[#30abe8] text-xs rounded-full">
                          建議方案
                        </span>
                      )}
                    </div>
                  ) : (
                    /* 預設風格的標題區塊 */
                    <div className={cn(
                      "relative overflow-hidden rounded-2xl bg-gradient-to-r from-morandi-gold/10 via-morandi-gold/5 to-transparent p-4",
                      viewMode === 'mobile' ? 'mb-4' : 'mb-6'
                    )}>
                      <div className="absolute -top-4 -left-4 w-24 h-24 bg-morandi-gold/20 rounded-full blur-2xl" />
                      {viewMode === 'mobile' ? (
                        <div className="relative flex items-center gap-3">
                          <DayLabel dayLabel={dayLabels[index]} isAlternative={day.isAlternative} variant="small" />
                          {day.isAlternative && (
                            <span className="px-2 py-0.5 bg-morandi-container text-morandi-secondary text-[10px] rounded-full">
                              建議方案
                            </span>
                          )}
                          <div className="flex-1 min-w-0">
                            {day.date && <DateSubtitle date={day.date} />}
                            {day.title && (
                              <h3 className="text-[10px] font-semibold leading-relaxed text-morandi-primary flex items-center flex-wrap mt-1">
                                {renderTitleWithIcons(day.title, viewMode)}
                              </h3>
                            )}
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="relative flex items-center gap-3 md:gap-4 mb-2 md:mb-3">
                            <DayLabel dayLabel={dayLabels[index]} isAlternative={day.isAlternative} variant="default" />
                            {day.isAlternative && (
                              <span className="px-2 py-0.5 bg-morandi-container text-morandi-secondary text-xs rounded-full">
                                建議方案
                              </span>
                            )}
                            {day.date && <DateSubtitle date={day.date} />}
                          </div>
                          {day.title && (
                            <h3 className="relative text-xl font-bold leading-relaxed text-morandi-primary">
                              {renderTitleWithIcons(day.title, viewMode)}
                            </h3>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {day.highlight && (
                    <div className={cn(
                      "flex items-start gap-2 rounded-xl bg-amber-50/80 border border-amber-200/50",
                      viewMode === 'mobile' ? 'mb-4 px-3 py-2' : 'mb-6 px-4 py-3'
                    )}>
                      <Sparkles size={viewMode === 'mobile' ? 14 : 16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className={cn(
                        "font-medium leading-relaxed text-amber-800",
                        viewMode === 'mobile' ? 'text-xs' : 'text-sm md:text-base'
                      )}>
                        {day.highlight}
                      </p>
                    </div>
                  )}

                  {day.description && (
                    <p className={cn(
                      "text-sm md:text-base leading-relaxed md:leading-7 text-morandi-secondary",
                      viewMode === 'mobile' ? 'mt-0 mb-4 px-4' : 'mt-4 mb-4'
                    )}>
                      {day.description}
                    </p>
                  )}

                  {day.activities && day.activities.length > 0 && (
                    <div className={cn(
                      "space-y-3 overflow-hidden",
                      viewMode === 'mobile' ? 'mb-4' : 'mb-6'
                    )}>
                      {/* 日式風格不需要分隔線 */}
                      {coverStyle !== 'nature' && coverStyle !== 'serene' && (
                        <DecorativeDivider variant="simple" />
                      )}
                      {viewMode === 'mobile' ? (
                        // 手機版：使用滿版滑動輪播組件
                        <MobileActivityCarousel
                          activities={day.activities.map(a => ({
                            title: a.title,
                            description: a.description,
                            image: a.image || '',
                          }))}
                        />
                      ) : (coverStyle === 'nature' || coverStyle === 'serene') ? (
                        // 日式和風風格：根據景點數量調整排版
                        day.activities.length === 1 ? (
                          // 只有一個景點：滿版顯示
                          <JapaneseActivityCard
                            title={day.activities[0].title}
                            description={day.activities[0].description || ''}
                            image={day.activities[0].image}
                            onClick={() => handleActivityClick(day.activities[0])}
                          />
                        ) : (
                          // 多個景點：根據數量智能排版
                          (() => {
                            const count = day.activities.length
                            // 計算最後一排的數量
                            const remainder = count % 3
                            const hasLastRow = remainder > 0 && count > 3

                            if (!hasLastRow || count <= 3) {
                              // 2-3 個景點，或剛好整除，直接網格排列
                              return (
                                <div className={cn(
                                  "grid gap-6",
                                  count === 2 && "grid-cols-1 md:grid-cols-2",
                                  count >= 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                                )}>
                                  {day.activities.map((activity, actIndex) => (
                                    <JapaneseActivityCard
                                      key={`activity-${actIndex}`}
                                      title={activity.title}
                                      description={activity.description || ''}
                                      image={activity.image}
                                      onClick={() => handleActivityClick(activity)}
                                    />
                                  ))}
                                </div>
                              )
                            }

                            // 有餘數：分開處理前面整排和最後一排
                            const mainCount = count - remainder
                            const mainActivities = day.activities.slice(0, mainCount)
                            const lastActivities = day.activities.slice(mainCount)

                            return (
                              <div className="space-y-6">
                                {/* 前面整排 */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                  {mainActivities.map((activity, actIndex) => (
                                    <JapaneseActivityCard
                                      key={`activity-${actIndex}`}
                                      title={activity.title}
                                      description={activity.description || ''}
                                      image={activity.image}
                                      onClick={() => handleActivityClick(activity)}
                                    />
                                  ))}
                                </div>
                                {/* 最後一排：置中排列 */}
                                <div className={cn(
                                  "grid gap-6 justify-center",
                                  remainder === 1 && "grid-cols-1 max-w-md mx-auto",
                                  remainder === 2 && "grid-cols-1 md:grid-cols-2 max-w-2xl mx-auto"
                                )}>
                                  {lastActivities.map((activity, actIndex) => (
                                    <JapaneseActivityCard
                                      key={`activity-last-${actIndex}`}
                                      title={activity.title}
                                      description={activity.description || ''}
                                      image={activity.image}
                                      onClick={() => handleActivityClick(activity)}
                                    />
                                  ))}
                                </div>
                              </div>
                            )
                          })()
                        )
                      ) : (
                        // 桌面版：智能排版 - 根據圖片數量自動調整
                        (() => {
                          const withImage = day.activities.filter(a => a.image && a.image.trim() !== '')
                          const withoutImage = day.activities.filter(a => !a.image || a.image.trim() === '')

                          // 情況1：都有圖片 - 標準網格排列
                          if (withoutImage.length === 0) {
                            return (
                              <div className={cn(
                                "grid gap-4",
                                withImage.length === 1 && "grid-cols-1",
                                withImage.length === 2 && "grid-cols-1 md:grid-cols-2",
                                withImage.length >= 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                              )}>
                                {withImage.map((activity, actIndex) => (
                                  <AttractionCard
                                    key={`activity-${actIndex}`}
                                    title={activity.title}
                                    description={activity.description || ''}
                                    image={activity.image}
                                    layout="vertical"
                                    className="transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                                    onClick={() => handleActivityClick(activity)}
                                  />
                                ))}
                              </div>
                            )
                          }
                          
                          // 情況2：都沒圖片 - 標準網格，用 horizontal layout
                          if (withImage.length === 0) {
                            return (
                              <div className={cn(
                                "grid gap-4",
                                withoutImage.length === 1 && "grid-cols-1",
                                withoutImage.length === 2 && "grid-cols-1 md:grid-cols-2", 
                                withoutImage.length === 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
                                withoutImage.length >= 4 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                              )}>
                                {withoutImage.map((activity, actIndex) => (
                                  <AttractionCard
                                    key={`activity-${actIndex}`}
                                    title={activity.title}
                                    description={activity.description || ''}
                                    image={activity.image}
                                    layout="horizontal"
                                    className="transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                                    onClick={() => handleActivityClick(activity)}
                                  />
                                ))}
                              </div>
                            )
                          }
                          
                          // 情況3：1張有圖 + 其他沒圖 - 左一右多
                          if (withImage.length === 1) {
                            return (
                              <div className="flex flex-col md:flex-row gap-4">
                                {/* 左側：有圖片的景點 */}
                                <div className="flex-1 md:flex-[2]">
                                  <AttractionCard
                                    title={withImage[0].title}
                                    description={withImage[0].description || ''}
                                    image={withImage[0].image}
                                    layout="fullwidth"
                                    className="transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                                    onClick={() => handleActivityClick(withImage[0])}
                                  />
                                </div>
                                
                                {/* 右側：沒圖片的景點，垂直排列 */}
                                <div className="flex-1 flex flex-col gap-4">
                                  {withoutImage.map((activity, actIndex) => (
                                    <div key={`without-image-${actIndex}`} className="flex-1">
                                      <AttractionCard
                                        title={activity.title}
                                        description={activity.description || ''}
                                        image={activity.image}
                                        layout="horizontal"
                                        className="transition-all duration-300 hover:-translate-y-1 hover:shadow-xl h-full"
                                        onClick={() => handleActivityClick(activity)}
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )
                          }
                          
                          // 情況4：多張有圖 + 少數沒圖 - 先排有圖的，沒圖的補在後面
                          if (withImage.length >= 2 && withoutImage.length <= 2) {
                            return (
                              <div className="space-y-4">
                                {/* 有圖片的景點 - 3 張以上用輪播，否則網格 */}
                                {withImage.length >= 3 ? (
                                  <DesktopActivityCarousel
                                    activities={withImage.map(a => ({
                                      title: a.title,
                                      description: a.description,
                                      image: a.image,
                                    }))}
                                    onActivityClick={(activity) => handleActivityClick(activity as typeof withImage[0])}
                                  />
                                ) : (
                                  <div className={cn(
                                    "grid gap-4",
                                    withImage.length === 2 && "grid-cols-1 md:grid-cols-2"
                                  )}>
                                    {withImage.map((activity, actIndex) => (
                                      <AttractionCard
                                        key={`with-image-${actIndex}`}
                                        title={activity.title}
                                        description={activity.description || ''}
                                        image={activity.image}
                                        layout="vertical"
                                        className="transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                                        onClick={() => handleActivityClick(activity)}
                                      />
                                    ))}
                                  </div>
                                )}

                                {/* 沒圖片的景點 - 水平排列 */}
                                {withoutImage.length > 0 && (
                                  <div className={cn(
                                    "grid gap-4",
                                    withoutImage.length === 1 && "grid-cols-1",
                                    withoutImage.length >= 2 && "grid-cols-1 md:grid-cols-2"
                                  )}>
                                    {withoutImage.map((activity, actIndex) => (
                                      <AttractionCard
                                        key={`without-image-${actIndex}`}
                                        title={activity.title}
                                        description={activity.description || ''}
                                        image={activity.image}
                                        layout="horizontal"
                                        className="transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                                        onClick={() => handleActivityClick(activity)}
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                            )
                          }
                          
                          // 情況5：太多景點 - 統一網格
                          return (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                              {day.activities.map((activity, actIndex) => (
                                <AttractionCard
                                  key={`activity-${actIndex}`}
                                  title={activity.title}
                                  description={activity.description || ''}
                                  image={activity.image}
                                  layout={activity.image ? "vertical" : "horizontal"}
                                  className="transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                                  onClick={() => handleActivityClick(activity)}
                                />
                              ))}
                            </div>
                          )
                        })()
                      )}
                    </div>
                  )}

                  {day.recommendations && day.recommendations.length > 0 && (
                    <div className={cn(
                      "rounded-2xl sm:rounded-3xl border border-emerald-200 bg-emerald-50/80 shadow-inner",
                      viewMode === 'mobile' ? 'mb-4 p-3' : 'mb-8 p-6'
                    )}>
                      <h4 className={cn(
                        "flex items-center gap-2 font-semibold text-emerald-900",
                        viewMode === 'mobile' ? 'mb-2 text-sm' : 'mb-3 text-lg'
                      )}>
                        推薦行程
                      </h4>
                      <ul className={cn(
                        "text-emerald-800",
                        viewMode === 'mobile' ? 'space-y-1.5' : 'space-y-2'
                      )}>
                        {day.recommendations.map((rec: string, recIndex: number) => (
                          <li
                            key={recIndex}
                            className={cn(
                              "flex items-start gap-2 leading-relaxed",
                              viewMode === 'mobile' ? 'text-xs' : 'text-sm'
                            )}
                          >
                            <span className={cn(
                              "rounded-full bg-emerald-500 flex-shrink-0",
                              viewMode === 'mobile' ? 'mt-1 h-1.5 w-1.5' : 'mt-1 h-2 w-2'
                            )}></span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 餐食區塊 */}
                  {(coverStyle === 'nature' || coverStyle === 'serene') && viewMode !== 'mobile' ? (
                    // 日式和風風格餐食卡片
                    <JapaneseMealsCard
                      meals={{
                        breakfast: day.meals?.breakfast || '敬請自理',
                        lunch: day.meals?.lunch || '敬請自理',
                        dinner: day.meals?.dinner || '敬請自理',
                      }}
                    />
                  ) : (
                    // 原版餐食樣式
                    <div className={cn(
                      "grid",
                      viewMode === 'mobile'
                        ? 'grid-cols-3 gap-1'
                        : 'grid-cols-1 md:grid-cols-3 gap-4'
                    )}>
                      <div className={cn(
                        "border border-morandi-gold/30 bg-morandi-gold/5 transition-all hover:shadow-md",
                        viewMode === 'mobile'
                          ? 'rounded-lg px-1.5 py-1.5 flex flex-col'
                          : 'rounded-2xl px-4 py-4 flex flex-col items-center text-center min-h-[80px] justify-center'
                      )}>
                        <p className={cn(
                          "text-morandi-secondary/80 mb-1",
                          viewMode === 'mobile' ? 'text-[10px] text-center' : 'text-sm font-medium'
                        )}>早餐</p>
                        <p className={cn(
                          "font-semibold text-morandi-primary",
                          viewMode === 'mobile' ? 'text-[10px] text-center leading-tight line-clamp-1' : 'text-base leading-snug'
                        )}>
                          {day.meals?.breakfast || '敬請自理'}
                        </p>
                      </div>
                      <div className={cn(
                        "border border-morandi-gold/30 bg-morandi-gold/5 transition-all hover:shadow-md",
                        viewMode === 'mobile'
                          ? 'rounded-lg px-1.5 py-1.5 flex flex-col'
                          : 'rounded-2xl px-4 py-4 flex flex-col items-center text-center min-h-[80px] justify-center'
                      )}>
                        <p className={cn(
                          "text-morandi-secondary/80 mb-1",
                          viewMode === 'mobile' ? 'text-[10px] text-center' : 'text-sm font-medium'
                        )}>午餐</p>
                        <p className={cn(
                          "font-semibold text-morandi-primary",
                          viewMode === 'mobile' ? 'text-[10px] text-center leading-tight line-clamp-1' : 'text-base leading-snug'
                        )}>
                          {day.meals?.lunch || '敬請自理'}
                        </p>
                      </div>
                      <div className={cn(
                        "border border-morandi-gold/30 bg-morandi-gold/5 transition-all hover:shadow-md",
                        viewMode === 'mobile'
                          ? 'rounded-lg px-1.5 py-1.5 flex flex-col'
                          : 'rounded-2xl px-4 py-4 flex flex-col items-center text-center min-h-[80px] justify-center'
                      )}>
                        <p className={cn(
                          "text-morandi-secondary/80 mb-1",
                          viewMode === 'mobile' ? 'text-[10px] text-center' : 'text-sm font-medium'
                        )}>晚餐</p>
                        <p className={cn(
                          "font-semibold text-morandi-primary",
                          viewMode === 'mobile' ? 'text-[10px] text-center leading-tight line-clamp-1' : 'text-base leading-snug'
                        )}>
                          {day.meals?.dinner || '敬請自理'}
                        </p>
                      </div>
                    </div>
                  )}

                  {day.accommodation && (
                    (coverStyle === 'nature' || coverStyle === 'serene') && viewMode !== 'mobile' ? (
                      // 日式和風風格住宿卡片
                      <JapaneseAccommodationCard
                        name={day.accommodation}
                        url={day.accommodationUrl}
                        rating={day.accommodationRating}
                        className="mt-4 sm:mt-6"
                      />
                    ) : (
                      // 原版住宿樣式
                      <div className={cn(
                        "border border-morandi-gold/30 bg-morandi-gold/10 text-morandi-primary shadow-inner",
                        viewMode === 'mobile' ? 'mt-3 rounded-lg p-2' : 'mt-6 rounded-2xl px-4 py-3'
                      )}>
                        <div className={cn(
                          "flex items-baseline gap-x-3",
                          viewMode === 'mobile' ? 'text-xs' : 'text-sm'
                        )}>
                          <span className="font-medium tracking-wide text-morandi-secondary flex-shrink-0">住宿</span>
                          {day.accommodationUrl ? (
                            <a
                              href={day.accommodationUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={cn(
                                "font-semibold flex-1 text-center hover:underline transition-all",
                                viewMode === 'mobile' ? '' : 'text-base'
                              )}
                            >
                              {day.accommodation}
                            </a>
                          ) : (
                            <span className={cn(
                              "font-semibold flex-1 text-center",
                              viewMode === 'mobile' ? '' : 'text-base'
                            )}>{day.accommodation}</span>
                          )}
                        </div>
                      </div>
                    )
                  )}

                  {/* 每日圖片輪播 - 放在住宿下方 */}
                  <DailyImageCarousel
                    images={day.images || []}
                    title={day.title || day.dayLabel || `Day ${index + 1}`}
                    allTourImages={allTourImages}
                  />
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 懸浮視窗 Modal - 桌面版景點詳情 */}
      <AnimatePresence>
        {selectedActivity !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setSelectedActivity(null)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh'
            }}
          >
            {/* 懸浮卡片 */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative bg-white rounded-2xl overflow-hidden max-w-[85vw] max-h-[70vh] w-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 圖片 - 有圖片才顯示 */}
              {selectedActivity?.image && selectedActivity.image.trim() !== '' && (
                <div className="relative w-full aspect-[3/2] max-h-[40vh]">
                  <Image
                    src={selectedActivity.image}
                    alt={selectedActivity.title}
                    fill
                    className="object-cover"
                    sizes="85vw"
                  />
                </div>
              )}

              {/* 關閉按鈕 - 固定在右上角 */}
              <button
                onClick={() => setSelectedActivity(null)}
                className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white z-30 transition-all"
              >
                <X size={20} />
              </button>

              {/* 內容區 */}
              <div className="p-6">
                <h3 className="font-bold text-xl mb-3 text-morandi-primary">
                  {selectedActivity?.title}
                </h3>
                {selectedActivity?.description && (
                  <p className="text-sm leading-relaxed text-morandi-secondary">
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
