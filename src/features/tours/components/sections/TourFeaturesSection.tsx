import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { morandiColors } from '@/lib/constants/morandi-colors'

interface TourFeature {
  icon: string
  title: string
  description: string
  images?: string[] // 圖片陣列（支援任意數量）
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
          className={
            viewMode === 'mobile'
              ? 'space-y-4'
              : features.length === 1
                ? 'grid grid-cols-1 max-w-4xl mx-auto gap-7'
                : features.length === 2
                  ? 'grid grid-cols-2 gap-7'
                  : 'grid grid-cols-2 md:grid-cols-3 gap-7'
          }
        >
          {features.map((feature: TourFeature, index: number) => {
            const FeatureIcon = feature.iconComponent || Sparkles
            const validImages = feature.images?.filter(img => img && img.trim() !== '') || []
            const hasImages = validImages.length > 0

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
                {/* 根據圖片數量自動調整版面 */}
                {hasImages ? (
                  (() => {
                    const imageCount = validImages.length

                    if (imageCount === 0) return null

                    // 1 張圖：滿版 16:9
                    if (imageCount === 1) {
                      return (
                        <div className={viewMode === 'mobile' ? 'mb-2' : 'mb-4'}>
                          <div className="overflow-hidden rounded-lg aspect-[16/9]">
                            <img
                              src={validImages[0]}
                              alt={feature.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      )
                    }

                    // 2 張圖：左右並排
                    if (imageCount === 2) {
                      return (
                        <div className={viewMode === 'mobile' ? 'grid grid-cols-2 gap-2 mb-2' : 'grid grid-cols-2 gap-3 mb-4'}>
                          {validImages.map((imgUrl, imgIndex) => (
                            <div key={imgIndex} className="overflow-hidden rounded-lg aspect-[4/3]">
                              <img
                                src={imgUrl}
                                alt={`${feature.title} ${imgIndex + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      )
                    }

                    // 3 張圖：橫排一列
                    if (imageCount === 3) {
                      return (
                        <div className={viewMode === 'mobile' ? 'grid grid-cols-3 gap-2 mb-2' : 'grid grid-cols-3 gap-3 mb-4'}>
                          {validImages.map((imgUrl, imgIndex) => (
                            <div key={imgIndex} className="overflow-hidden rounded-lg aspect-[4/3]">
                              <img
                                src={imgUrl}
                                alt={`${feature.title} ${imgIndex + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      )
                    }

                    // 4 張以上：2x2 網格
                    return (
                      <div className={viewMode === 'mobile' ? 'grid grid-cols-2 gap-2 mb-2' : 'grid grid-cols-2 gap-3 mb-4'}>
                        {validImages.slice(0, 4).map((imgUrl, imgIndex) => (
                          <div key={imgIndex} className="overflow-hidden rounded-lg aspect-[4/3]">
                            <img
                              src={imgUrl}
                              alt={`${feature.title} ${imgIndex + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )
                  })()
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
                <div className={viewMode === 'mobile' && !hasImages ? 'flex-1 min-w-0' : ''}>
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
