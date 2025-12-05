import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { morandiColors } from '@/lib/constants/morandi-colors'

interface TourFeature {
  icon: string
  title: string
  description: string
  template?: string // 模板 PNG（有透明區域）
  images?: [string, string] // 左右兩張圖片（放在模板下層）
  iconComponent?: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
}

interface TourData {
  features?: TourFeature[]
  [key: string]: unknown
}

interface TourFeaturesSectionProps {
  data: TourData
  viewMode: 'desktop' | 'mobile'
}

export function TourFeaturesSection({ data, viewMode }: TourFeaturesSectionProps) {
  const features = data.features || []

  return (
    <section className={viewMode === 'mobile' ? 'pt-4 pb-8 bg-white' : 'pt-8 pb-16 bg-white'}>
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
          {features.map((feature: TourFeature, index: number) => {
            const FeatureIcon = feature.iconComponent || Sparkles
            const hasTemplate = !!feature.template
            const hasImages = feature.images && (feature.images[0] || feature.images[1])

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
                    ? 'flex flex-col gap-3 p-4 rounded-[20px]'
                    : 'p-6 rounded-[24px]'
                }
                style={{
                  backgroundColor: morandiColors.background.white,
                  border: `1px solid ${morandiColors.border.light}`,
                  boxShadow: `0 2px 12px ${morandiColors.shadow.soft}`,
                }}
              >
                {/* 如果有模板，顯示模板+底圖疊加效果 */}
                {hasTemplate ? (
                  <div className={`relative overflow-hidden rounded-lg ${viewMode === 'mobile' ? 'aspect-[16/9] mb-2' : 'aspect-[16/9] mb-4'}`}>
                    {/* 底層圖片 */}
                    <div className="absolute inset-0 grid grid-cols-2">
                      {feature.images?.map((imgUrl, imgIndex) => (
                        imgUrl ? (
                          <img
                            key={imgIndex}
                            src={imgUrl}
                            alt={`${feature.title} ${imgIndex + 1}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div key={imgIndex} className="w-full h-full bg-gray-100" />
                        )
                      )) || (
                        <>
                          <div className="w-full h-full bg-gray-100" />
                          <div className="w-full h-full bg-gray-100" />
                        </>
                      )}
                    </div>
                    {/* 模板 PNG 覆蓋在上面 */}
                    <img
                      src={feature.template}
                      alt="模板"
                      className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                    />
                  </div>
                ) : hasImages ? (
                  /* 沒有模板但有圖片，顯示左右兩張圖片 */
                  <div className={viewMode === 'mobile' ? 'grid grid-cols-2 gap-2' : 'grid grid-cols-2 gap-3 mb-4'}>
                    {feature.images?.map((imgUrl, imgIndex) => (
                      imgUrl ? (
                        <div
                          key={imgIndex}
                          className={`overflow-hidden rounded-lg ${viewMode === 'mobile' ? 'aspect-[4/3]' : 'aspect-[4/3]'}`}
                        >
                          <img
                            src={imgUrl}
                            alt={`${feature.title} ${imgIndex + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div
                          key={imgIndex}
                          className={`rounded-lg bg-gray-100 ${viewMode === 'mobile' ? 'aspect-[4/3]' : 'aspect-[4/3]'}`}
                        />
                      )
                    ))}
                  </div>
                ) : (
                  /* 沒有模板也沒有圖片時顯示原本的圖標 */
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
                )}
                <div className={viewMode === 'mobile' && !hasImages && !hasTemplate ? 'flex-1 min-w-0' : ''}>
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
