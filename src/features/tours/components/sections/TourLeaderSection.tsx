import { motion } from 'framer-motion'
import { User } from 'lucide-react'
import { SectionTitle } from './SectionTitle'
import { TourLeaderSectionArt } from './TourLeaderSectionArt'
import { TourLeaderSectionCollage } from './TourLeaderSectionCollage'
import { TourLeaderSectionLuxury } from './TourLeaderSectionLuxury'
import type { TourPageData, CoverStyleType } from '@/features/tours/types/tour-display.types'

/**
 * TourLeaderSection 需要的欄位
 * - leader: { name, domesticPhone, overseasPhone }
 * - meetingInfo: { time, location }
 */
interface TourLeaderSectionProps {
  data: TourPageData
  viewMode: 'desktop' | 'mobile'
  coverStyle?: CoverStyleType
}

export function TourLeaderSection({ data, viewMode, coverStyle = 'original' }: TourLeaderSectionProps) {
  // Art 風格使用專用組件
  if (coverStyle === 'art') {
    return <TourLeaderSectionArt data={data} viewMode={viewMode} />
  }

  // Collage 風格使用專用組件
  if (coverStyle === 'collage') {
    return <TourLeaderSectionCollage data={data} viewMode={viewMode} />
  }

  // Luxury 風格使用專用組件
  if (coverStyle === 'luxury') {
    return <TourLeaderSectionLuxury data={data} viewMode={viewMode} />
  }

  return (
    <section id="contact" className={viewMode === 'mobile' ? 'bg-card pt-6 pb-8' : 'bg-card pt-8 pb-16'}>
      <div className={viewMode === 'mobile' ? 'px-4' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <SectionTitle
            title="領隊與集合資訊"
            coverStyle={coverStyle}
            className={viewMode === 'mobile' ? 'mb-6' : 'mb-12'}
          />
        </motion.div>

        <div className={viewMode === 'mobile' ? 'space-y-4' : 'grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto'}>
          {/* 領隊資訊 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className={
              viewMode === 'mobile'
                ? 'bg-card rounded-xl shadow-md p-5 border border-border'
                : 'bg-card rounded-2xl shadow-lg p-8 border border-border'
            }
          >
            <h3
              className={
                viewMode === 'mobile'
                  ? 'text-lg font-bold text-morandi-primary mb-4'
                  : 'text-2xl font-bold text-morandi-primary mb-6'
              }
            >
              領隊資訊
            </h3>
            <div className={viewMode === 'mobile' ? 'flex items-start gap-4' : 'flex items-start gap-6'}>
              {/* 領隊頭像 */}
              {data.leader?.photo ? (
                <img
                  src={data.leader.photo}
                  alt={data.leader?.name || 'Tour Leader'}
                  className={viewMode === 'mobile' ? 'w-16 h-16 rounded-full object-cover flex-shrink-0 border-2 border-morandi-container' : 'w-20 h-20 rounded-full object-cover flex-shrink-0 border-2 border-morandi-container'}
                />
              ) : (
                <div
                  className={viewMode === 'mobile' ? 'w-16 h-16 rounded-full bg-morandi-container/30 flex items-center justify-center flex-shrink-0' : 'w-20 h-20 rounded-full bg-morandi-container/30 flex items-center justify-center flex-shrink-0'}
                >
                  <User className={viewMode === 'mobile' ? 'w-8 h-8 text-morandi-secondary' : 'w-10 h-10 text-morandi-secondary'} />
                </div>
              )}
              <div className={viewMode === 'mobile' ? 'space-y-3 flex-1' : 'space-y-4 flex-1'}>
                <div>
                  <p className="text-xs text-morandi-secondary mb-1">領隊姓名</p>
                  <p className={viewMode === 'mobile' ? 'text-base font-semibold text-morandi-primary' : 'text-lg font-semibold text-morandi-primary'}>
                    {data.leader?.name || '待定'}
                    {data.leader?.englishName && ` ${data.leader.englishName}`}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-morandi-secondary mb-1">國內電話</p>
                  <p className={viewMode === 'mobile' ? 'text-base font-semibold text-morandi-primary' : 'text-lg font-semibold text-morandi-primary'}>
                    {data.leader?.domesticPhone || '待定'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-morandi-secondary mb-1">國外電話</p>
                  <p className={viewMode === 'mobile' ? 'text-base font-semibold text-morandi-primary' : 'text-lg font-semibold text-morandi-primary'}>
                    {data.leader?.overseasPhone || '待定'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 集合資訊 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className={
              viewMode === 'mobile'
                ? 'bg-card rounded-xl shadow-md p-5 border border-border'
                : 'bg-card rounded-2xl shadow-lg p-8 border border-border'
            }
          >
            <h3
              className={
                viewMode === 'mobile'
                  ? 'text-lg font-bold text-morandi-primary mb-4'
                  : 'text-2xl font-bold text-morandi-primary mb-6'
              }
            >
              集合資訊
            </h3>
            <div className={viewMode === 'mobile' ? 'space-y-3' : 'space-y-4'}>
              <div>
                <p className="text-xs text-morandi-secondary mb-1">集合時間</p>
                <p className={viewMode === 'mobile' ? 'text-lg font-semibold text-status-info' : 'text-xl font-semibold text-status-info'}>
                  {data.meetingInfo?.time || '待定'}
                </p>
              </div>
              <div>
                <p className="text-xs text-morandi-secondary mb-1">集合地點</p>
                <p className={viewMode === 'mobile' ? 'text-base font-semibold text-morandi-primary' : 'text-lg font-semibold text-morandi-primary'}>
                  {data.meetingInfo?.location || '待定'}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
