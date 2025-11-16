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

interface TourItinerarySectionProps {
  data: any
  viewMode: 'desktop' | 'mobile'
  activeDayIndex: number
  dayRefs: MutableRefObject<(HTMLDivElement | null)[]>
  handleDayNavigate: (index: number) => void
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
            {/* Mobile horizontal navigation */}
            {viewMode === 'mobile' && dailyItinerary.length > 0 && (
              <div className="-mx-4 mb-6 flex gap-3 overflow-x-auto px-4">
                {dailyItinerary.map((day: any, index: number) => (
                  <button
                    key={`mobile-day-${day.dayLabel || index}`}
                    type="button"
                    onClick={() => handleDayNavigate(index)}
                    className={cn(
                      'flex min-w-[160px] flex-col rounded-2xl border border-morandi-border/40 px-4 py-3 text-left transition',
                      activeDayIndex === index
                        ? 'bg-morandi-primary text-white'
                        : 'bg-white/80 text-morandi-primary/80'
                    )}
                  >
                    <span className="text-[11px] font-semibold uppercase tracking-[0.4em]">
                      {day.dayLabel || `Day ${index + 1}`}
                    </span>
                    <span className="mt-2 line-clamp-2 text-sm font-medium leading-snug">
                      {day.title || `行程第 ${index + 1} 天`}
                    </span>
                    {day.date && <span className="mt-1 text-xs text-white/80">{day.date}</span>}
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-12">
              {dailyItinerary.map((day: any, index: number) => (
                <article
                  key={`day-section-${index}`}
                  id={`day-${index + 1}`}
                  ref={el => {
                    dayRefs.current[index] = el
                  }}
                  className="relative overflow-hidden rounded-[36px] border border-morandi-container/30 bg-white/95 p-8 shadow-lg backdrop-blur-sm"
                >
                  <div className="flex flex-wrap items-center gap-4 mb-6">
                    <DayLabel dayNumber={index + 1} variant="default" />
                    {day.date && <DateSubtitle date={day.date} />}
                  </div>

                  <h3 className="text-2xl font-bold leading-snug text-morandi-primary md:text-3xl">
                    {day.title || `行程第 ${index + 1} 天`}
                  </h3>

                  {day.highlight && (
                    <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50/80 p-5 text-amber-900 shadow-inner">
                      <p className="text-base font-semibold leading-relaxed">{day.highlight}</p>
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
                      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        {day.activities.map((activity: any, actIndex: number) => (
                          <AttractionCard
                            key={`activity-${index}-${actIndex}`}
                            title={activity.icon ? `${activity.icon} ${activity.title}` : activity.title}
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

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-morandi-gold/30 bg-morandi-gold/5 p-5">
                      <p className="text-sm text-morandi-secondary/80">早餐</p>
                      <p className="mt-2 font-semibold text-morandi-primary">
                        {day.meals?.breakfast || '敬請自理'}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-morandi-gold/30 bg-morandi-gold/5 p-5">
                      <p className="text-sm text-morandi-secondary/80">午餐</p>
                      <p className="mt-2 font-semibold text-morandi-primary">
                        {day.meals?.lunch || '敬請自理'}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-morandi-gold/30 bg-morandi-gold/5 p-5">
                      <p className="text-sm text-morandi-secondary/80">晚餐</p>
                      <p className="mt-2 font-semibold text-morandi-primary">
                        {day.meals?.dinner || '敬請自理'}
                      </p>
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
