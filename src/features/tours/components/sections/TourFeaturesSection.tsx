import { motion } from 'framer-motion'
import { IconSparkles } from '@tabler/icons-react'
import { morandiColors } from '@/lib/constants/morandi-colors'

interface TourFeaturesSectionProps {
  data: any
  viewMode: 'desktop' | 'mobile'
}

export function TourFeaturesSection({ data, viewMode }: TourFeaturesSectionProps) {
  const features = data.features || []

  return (
    <section
      className={viewMode === 'mobile' ? 'pt-4 pb-8' : 'pt-8 pb-16'}
      style={{ backgroundColor: morandiColors.background.main }}
    >
      <div className={viewMode === 'mobile' ? 'px-4' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={viewMode === 'mobile' ? 'text-center mb-6' : 'text-center mb-12'}
        >
          <h2
            className={viewMode === 'mobile' ? 'text-2xl font-bold' : 'text-4xl font-bold'}
            style={{ color: morandiColors.text.primary }}
          >
            行程特色
          </h2>
        </motion.div>

        <div
          className={viewMode === 'mobile' ? 'space-y-4' : 'grid grid-cols-2 md:grid-cols-3 gap-7'}
        >
          {features.map((feature: any, index: number) => {
            const FeatureIcon = feature.iconComponent || IconSparkles
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -4 }}
                className={
                  viewMode === 'mobile'
                    ? 'flex items-center gap-4 p-4 rounded-[20px]'
                    : 'p-6 rounded-[24px]'
                }
                style={{
                  backgroundColor: morandiColors.background.white,
                  border: `1px solid ${morandiColors.border.light}`,
                  boxShadow: `0 2px 12px ${morandiColors.shadow.soft}`,
                }}
              >
                <div
                  className={
                    viewMode === 'mobile'
                      ? 'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0'
                      : 'w-16 h-16 rounded-xl flex items-center justify-center mb-4'
                  }
                  style={{
                    backgroundColor: morandiColors.goldLight,
                    border: `1px solid ${morandiColors.border.gold}`,
                  }}
                >
                  <FeatureIcon
                    className={viewMode === 'mobile' ? 'w-6 h-6' : 'w-8 h-8'}
                    style={{ color: morandiColors.gold }}
                  />
                </div>
                <div className={viewMode === 'mobile' ? 'flex-1 min-w-0' : ''}>
                  <h3
                    className={
                      viewMode === 'mobile' ? 'font-bold text-base mb-1' : 'font-bold text-lg mb-2'
                    }
                    style={{ color: morandiColors.text.primary }}
                  >
                    {feature.title}
                  </h3>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: morandiColors.text.secondary }}
                  >
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
