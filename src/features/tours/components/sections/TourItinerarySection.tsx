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
function renderTitleWithIcons(title: string) {
  const parts = title.split(/(\s→\s|\s·\s|\s\|\s|\s⭐\s)/g)

  return parts.map((part, index) => {
    if (part === ' → ') {
      return (
        <ArrowRight
          key={index}
          size={16}
          className="inline-block mx-1 text-morandi-primary align-middle"
          style={{ verticalAlign: 'middle', marginTop: '-2px' }}
        />
      )
    } else if (part === ' ⭐ ') {
      return (
        <Sparkles
          key={index}
          size={16}
          className="inline-block mx-1 text-morandi-gold align-middle"
          style={{ verticalAlign: 'middle', marginTop: '-2px' }}
        />
      )
    } else if (part === ' · ' || part === ' | ') {
      return <span key={index} className="mx-1 text-morandi-secondary">{part.trim()}</span>
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
                  className="relative overflow-hidden rounded-[36px] border border-morandi-container/30 bg-white/95 p-8 shadow-lg backdrop-blur-sm"
                >
                  <div className="flex flex-wrap items-center gap-4 mb-6">
                    <DayLabel dayNumber={index + 1} variant="default" />
                    {day.date && <DateSubtitle date={day.date} />}
                  </div>

                  {day.title && (
                    <h3 className="text-lg font-bold leading-relaxed text-morandi-primary md:text-xl mb-6 flex items-center flex-wrap">
                      {renderTitleWithIcons(day.title)}
                    </h3>
                  )}

                  {day.highlight && (
                    <div className="mb-6 flex items-center gap-3 text-amber-700">
                      <Sparkles size={18} className="text-amber-500 flex-shrink-0" />
                      <p className="text-base font-medium leading-relaxed">{day.highlight}</p>
                    </div>
                  )}

                  <DailyImageCarousel
                    images={day.images || []}
                    title={day.title || day.dayLabel || `Day ${index + 1}`}
                  />

                  {day.description && (
                    <p className="mt-6 mb-8 text-base leading-7 text-morandi-secondary">
                      {day.description}
                    </p>
                  )}

                  {day.activities && day.activities.length > 0 && (
                    <div className="mb-8 space-y-4">
                      <DecorativeDivider variant="simple" />
                      <div className={cn(
                        "grid gap-5",
                        // 動態調整欄數：1個=1欄, 2個=2欄, 3個=3欄, 4個以上=2欄
                        day.activities.length === 1 && "grid-cols-1",
                        day.activities.length === 2 && "grid-cols-1 md:grid-cols-2",
                        day.activities.length === 3 && "grid-cols-1 md:grid-cols-3",
                        day.activities.length >= 4 && "grid-cols-1 md:grid-cols-2"
                      )}>
                        {day.activities.map((activity, actIndex: number) => (
                          <AttractionCard
                            key={`activity-${index}-${actIndex}`}
                            title={activity.title}
                            description={activity.description || ''}
                            image={activity.image}
                            layout={activity.image ? 'vertical' : 'horizontal'}
                            className="transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                          />
                        ))}
                      </div>
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

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="rounded-2xl border border-morandi-gold/30 bg-morandi-gold/5 px-4 py-3 flex items-center gap-3">
                      <span className="text-sm text-morandi-secondary/80 whitespace-nowrap">早餐</span>
                      <span className="font-semibold text-morandi-primary text-sm flex-1 text-center">
                        {day.meals?.breakfast || '敬請自理'}
                      </span>
                    </div>
                    <div className="rounded-2xl border border-morandi-gold/30 bg-morandi-gold/5 px-4 py-3 flex items-center gap-3">
                      <span className="text-sm text-morandi-secondary/80 whitespace-nowrap">午餐</span>
                      <span className="font-semibold text-morandi-primary text-sm flex-1 text-center">
                        {day.meals?.lunch || '敬請自理'}
                      </span>
                    </div>
                    <div className="rounded-2xl border border-morandi-gold/30 bg-morandi-gold/5 px-4 py-3 flex items-center gap-3">
                      <span className="text-sm text-morandi-secondary/80 whitespace-nowrap">晚餐</span>
                      <span className="font-semibold text-morandi-primary text-sm flex-1 text-center">
                        {day.meals?.dinner || '敬請自理'}
                      </span>
                    </div>
                  </div>

                  {day.accommodation && (
                    <div className="mt-6 rounded-3xl border border-blue-100 bg-blue-50/70 p-5 text-blue-900 shadow-inner">
                      <p className="text-sm font-medium tracking-wide">住宿</p>
                      <p className="mt-1 text-lg font-semibold">{day.accommodation}</p>
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
