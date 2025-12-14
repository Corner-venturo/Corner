import { motion } from 'framer-motion'
import { SectionTitle } from './SectionTitle'

interface TourDisplayData {
  leader?: {
    name?: string | null
    domesticPhone?: string | null
    overseasPhone?: string | null
  } | null
  meetingInfo?: {
    time?: string | null
    location?: string | null
  } | null
}

type CoverStyleType = 'original' | 'gemini' | 'nature' | 'serene' | 'art'

interface TourLeaderSectionProps {
  data: TourDisplayData
  viewMode: 'desktop' | 'mobile'
  coverStyle?: CoverStyleType
}

export function TourLeaderSection({ data, viewMode, coverStyle = 'original' }: TourLeaderSectionProps) {
  return (
    <section id="contact" className={viewMode === 'mobile' ? 'bg-white pt-6 pb-8' : 'bg-white pt-8 pb-16'}>
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
                ? 'bg-white rounded-xl shadow-md p-5 border border-border'
                : 'bg-white rounded-2xl shadow-lg p-8 border border-border'
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
            <div className={viewMode === 'mobile' ? 'space-y-3' : 'space-y-4'}>
              <div>
                <p className="text-xs text-morandi-secondary mb-1">領隊姓名</p>
                <p className={viewMode === 'mobile' ? 'text-base font-semibold text-morandi-primary' : 'text-lg font-semibold text-morandi-primary'}>
                  {data.leader?.name || '待定'}
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
          </motion.div>

          {/* 集合資訊 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className={
              viewMode === 'mobile'
                ? 'bg-white rounded-xl shadow-md p-5 border border-border'
                : 'bg-white rounded-2xl shadow-lg p-8 border border-border'
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
                <p className={viewMode === 'mobile' ? 'text-lg font-semibold text-blue-600' : 'text-xl font-semibold text-blue-600'}>
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
