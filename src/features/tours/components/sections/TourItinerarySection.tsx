import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { DailyImageCarousel } from './DailyImageCarousel'
import { MutableRefObject } from 'react'
import {
  DayLabel,
  DateSubtitle,
  AttractionCard,
  DecorativeDivider,
} from '@/components/tour-preview'
import { ArrowRight, Sparkles } from 'lucide-react'
import { TourFormData } from '@/components/editor/tour-form/types'

interface TourItinerarySectionProps {
  data: TourFormData
  viewMode: 'desktop' | 'mobile'
  activeDayIndex: number
  dayRefs: MutableRefObject<(HTMLDivElement | null)[]>
  handleDayNavigate: (index: number) => void
}

// 將標題中的文字符號轉換成 SVG 圖標
function renderTitleWithIcons(title: string, viewMode: 'desktop' | 'mobile') {
  const parts = title.split(/(\s→\s|\s·\s|\s\|\s|\s⭐\s)/g)
  const iconSize = viewMode === 'mobile' ? 10 : 16

  return parts.map((part, index) => {
    if (part === ' → ') {
      return (
        <ArrowRight
          key={index}
          size={iconSize}
          className="inline-block mx-0.5 text-morandi-primary align-middle"
          style={{ verticalAlign: 'middle', marginTop: '-1px' }}
        />
      )
    } else if (part === ' ⭐ ') {
      return (
        <Sparkles
          key={index}
          size={iconSize}
          className="inline-block mx-0.5 text-morandi-gold align-middle"
          style={{ verticalAlign: 'middle', marginTop: '-1px' }}
        />
      )
    } else if (part === ' · ' || part === ' | ') {
      return <span key={index} className="mx-0.5 text-morandi-secondary">{part.trim()}</span>
    } else {
      return <span key={index}>{part}</span>
    }
  })
}

export function TourItinerarySection({
  data,
  viewMode,
  activeDayIndex,
  dayRefs,
  handleDayNavigate,
}: TourItinerarySectionProps) {
  const dailyItinerary = Array.isArray(data.dailyItinerary) ? data.dailyItinerary : []

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
          className="text-center mb-12"
        >
          <h2
            className={
              viewMode === 'mobile'
                ? 'text-2xl font-bold text-morandi-primary mb-4'
                : 'text-4xl font-bold text-morandi-primary mb-4'
            }
          >
            詳細行程
          </h2>
        </motion.div>

        <div>
          <div>
            <div className="space-y-12">
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
                  <div className={cn(
                    "relative overflow-hidden rounded-2xl bg-gradient-to-r from-morandi-gold/10 via-morandi-gold/5 to-transparent p-4",
                    viewMode === 'mobile' ? 'mb-4' : 'mb-6'
                  )}>
                    <div className="absolute -top-4 -left-4 w-24 h-24 bg-morandi-gold/20 rounded-full blur-2xl" />
                    <div className="relative flex flex-wrap items-center gap-3 md:gap-4 mb-2 md:mb-3">
                      <DayLabel dayNumber={index + 1} variant={viewMode === 'mobile' ? 'small' : 'default'} />
                      {day.date && <DateSubtitle date={day.date} />}
                    </div>
                    {day.title && (
                      <h3 className={cn(
                        "relative leading-relaxed text-morandi-primary flex items-center flex-wrap",
                        viewMode === 'mobile'
                          ? 'text-xs font-semibold'
                          : 'text-xl font-bold'
                      )}>
                        {renderTitleWithIcons(day.title, viewMode)}
                      </h3>
                    )}
                  </div>

                  {day.highlight && (
                    <div className="mb-6 flex items-start gap-2 px-4 py-3 rounded-xl bg-amber-50/80 border border-amber-200/50">
                      <Sparkles size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm md:text-base font-medium leading-relaxed text-amber-800">
                        {day.highlight}
                      </p>
                    </div>
                  )}

                  <DailyImageCarousel
                    images={day.images || []}
                    title={day.title || day.dayLabel || `Day ${index + 1}`}
                  />

                  {day.description && (
                    <p className={cn(
                      "text-sm md:text-base leading-relaxed md:leading-7 text-morandi-secondary",
                      viewMode === 'mobile' ? 'mt-0 mb-4 px-4' : 'mt-4 mb-4'
                    )}>
                      {day.description}
                    </p>
                  )}

                  {day.activities && day.activities.length > 0 && (
                    <div className="mb-6 space-y-3 overflow-hidden">
                      <DecorativeDivider variant="simple" />
                      {viewMode === 'mobile' ? (
                        // 手機版：智能排版
                        <div className="space-y-3 px-4">
                          {(() => {
                            const withImage = day.activities.filter(a => a.image)
                            const withoutImage = day.activities.filter(a => !a.image)

                            // 如果有圖片的活動存在，顯示為大卡片
                            // 無圖片的活動顯示為小卡片列表
                            return (
                              <>
                                {withImage.map((activity, actIndex) => (
                                  <AttractionCard
                                    key={`activity-img-${index}-${actIndex}`}
                                    title={activity.title}
                                    description={activity.description || ''}
                                    image={activity.image}
                                    layout="vertical"
                                    className="w-full"
                                  />
                                ))}
                                {withoutImage.length > 0 && (
                                  <div className="space-y-2">
                                    {withoutImage.map((activity, actIndex) => (
                                      <AttractionCard
                                        key={`activity-noimg-${index}-${actIndex}`}
                                        title={activity.title}
                                        description={activity.description || ''}
                                        layout="horizontal"
                                        className="w-full"
                                      />
                                    ))}
                                  </div>
                                )}
                              </>
                            )
                          })()}
                        </div>
                      ) : (
                        // 桌面版：智能混合排版
                        (() => {
                          const withImage = day.activities.filter(a => a.image)
                          const withoutImage = day.activities.filter(a => !a.image)

                          // 情境1：全部都有圖片 → 等寬 Grid
                          if (withoutImage.length === 0) {
                            return (
                              <div className={cn(
                                "grid gap-5",
                                withImage.length === 1 && "grid-cols-1",
                                withImage.length === 2 && "grid-cols-2",
                                withImage.length >= 3 && "grid-cols-3"
                              )}>
                                {withImage.map((activity, actIndex) => (
                                  <AttractionCard
                                    key={`activity-${index}-${actIndex}`}
                                    title={activity.title}
                                    description={activity.description || ''}
                                    image={activity.image}
                                    layout="vertical"
                                    className="transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                                  />
                                ))}
                              </div>
                            )
                          }

                          // 情境2：全部都沒圖片 → 橫向小卡片
                          if (withImage.length === 0) {
                            return (
                              <div className={cn(
                                "grid gap-4",
                                withoutImage.length === 1 && "grid-cols-1",
                                withoutImage.length === 2 && "grid-cols-2",
                                withoutImage.length >= 3 && "grid-cols-3"
                              )}>
                                {withoutImage.map((activity, actIndex) => (
                                  <AttractionCard
                                    key={`activity-${index}-${actIndex}`}
                                    title={activity.title}
                                    description={activity.description || ''}
                                    layout="horizontal"
                                    className="transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                                  />
                                ))}
                              </div>
                            )
                          }

                          // 情境3：混合（有圖 + 無圖）→ 左大右小佈局
                          return (
                            <div className="flex gap-5 items-stretch">
                              {/* 左側：有圖片的大卡片 */}
                              <div className={cn(
                                "flex-1 grid gap-5 content-start",
                                withImage.length === 1 && "grid-cols-1",
                                withImage.length >= 2 && "grid-cols-2"
                              )}>
                                {withImage.map((activity, actIndex) => (
                                  <AttractionCard
                                    key={`activity-img-${index}-${actIndex}`}
                                    title={activity.title}
                                    description={activity.description || ''}
                                    image={activity.image}
                                    layout="vertical"
                                    className="transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                                  />
                                ))}
                              </div>
                              {/* 右側：無圖片的小卡片堆疊（均勻分配高度） */}
                              <div className="w-72 flex-shrink-0 flex flex-col gap-3">
                                {withoutImage.map((activity, actIndex) => (
                                  <AttractionCard
                                    key={`activity-noimg-${index}-${actIndex}`}
                                    title={activity.title}
                                    description={activity.description || ''}
                                    layout="horizontal"
                                    className="flex-1 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                                  />
                                ))}
                              </div>
                            </div>
                          )
                        })()
                      )}
                    </div>
                  )}

                  {day.recommendations && day.recommendations.length > 0 && (
                    <div className="mb-8 rounded-3xl border border-emerald-200 bg-emerald-50/80 p-6 shadow-inner">
                      <h4 className="mb-3 flex items-center gap-2 text-lg font-semibold text-emerald-900">
                        推薦行程
                      </h4>
                      <ul className="space-y-2 text-emerald-800">
                        {day.recommendations.map((rec: string, recIndex: number) => (
                          <li
                            key={recIndex}
                            className="flex items-start gap-2 text-sm leading-relaxed"
                          >
                            <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500"></span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className={cn(
                    "grid grid-cols-3",
                    viewMode === 'mobile' ? 'gap-2' : 'gap-3'
                  )}>
                    <div className={cn(
                      "border border-morandi-gold/30 bg-morandi-gold/5",
                      viewMode === 'mobile'
                        ? 'rounded-xl px-2 py-2 flex flex-col'
                        : 'rounded-2xl px-4 py-3 flex flex-row items-center gap-3'
                    )}>
                      <p className={cn(
                        "text-morandi-secondary/80",
                        viewMode === 'mobile' ? 'text-xs text-center' : 'text-sm text-left whitespace-nowrap'
                      )}>早餐</p>
                      <p className={cn(
                        "font-semibold text-morandi-primary line-clamp-2",
                        viewMode === 'mobile' ? 'text-xs text-center' : 'text-sm flex-1 text-center'
                      )}>
                        {day.meals?.breakfast || '敬請自理'}
                      </p>
                    </div>
                    <div className={cn(
                      "border border-morandi-gold/30 bg-morandi-gold/5",
                      viewMode === 'mobile'
                        ? 'rounded-xl px-2 py-2 flex flex-col'
                        : 'rounded-2xl px-4 py-3 flex flex-row items-center gap-3'
                    )}>
                      <p className={cn(
                        "text-morandi-secondary/80",
                        viewMode === 'mobile' ? 'text-xs text-center' : 'text-sm text-left whitespace-nowrap'
                      )}>午餐</p>
                      <p className={cn(
                        "font-semibold text-morandi-primary line-clamp-2",
                        viewMode === 'mobile' ? 'text-xs text-center' : 'text-sm flex-1 text-center'
                      )}>
                        {day.meals?.lunch || '敬請自理'}
                      </p>
                    </div>
                    <div className={cn(
                      "border border-morandi-gold/30 bg-morandi-gold/5",
                      viewMode === 'mobile'
                        ? 'rounded-xl px-2 py-2 flex flex-col'
                        : 'rounded-2xl px-4 py-3 flex flex-row items-center gap-3'
                    )}>
                      <p className={cn(
                        "text-morandi-secondary/80",
                        viewMode === 'mobile' ? 'text-xs text-center' : 'text-sm text-left whitespace-nowrap'
                      )}>晚餐</p>
                      <p className={cn(
                        "font-semibold text-morandi-primary line-clamp-2",
                        viewMode === 'mobile' ? 'text-xs text-center' : 'text-sm flex-1 text-center'
                      )}>
                        {day.meals?.dinner || '敬請自理'}
                      </p>
                    </div>
                  </div>

                  {day.accommodation && (
                    <div className={cn(
                      "mt-6 border border-morandi-gold/30 bg-morandi-gold/10 text-morandi-primary shadow-inner",
                      viewMode === 'mobile' ? 'rounded-xl p-3' : 'rounded-3xl p-5'
                    )}>
                      <p className={cn(
                        "font-medium tracking-wide text-morandi-secondary",
                        viewMode === 'mobile' ? 'text-xs' : 'text-sm'
                      )}>住宿</p>
                      <p className={cn(
                        "mt-1 font-semibold",
                        viewMode === 'mobile' ? 'text-sm' : 'text-lg'
                      )}>{day.accommodation}</p>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
