import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ChevronLeft, ChevronRight } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { morandiColors } from '@/lib/constants/morandi-colors'
import { SectionTitle } from './SectionTitle'
import { TourFeaturesSectionCollage, type FeatureCardStyle } from './TourFeaturesSectionCollage'
import { TourFeaturesSectionArt } from './TourFeaturesSectionArt'
import type { TourPageData, CoverStyleType, FeaturesStyleType } from '@/features/tours/types/tour-display.types'
import { TOURS_LABELS } from './constants/labels'

// 擴展 Feature 類型（增加 icon component 和 collage 專用欄位）
interface TourFeature {
  icon: string
  title: string
  description: string
  images?: string[]
  iconComponent?: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  cardStyle?: FeatureCardStyle
  tags?: string[]
}

interface TourFeaturesSectionProps {
  data: TourPageData
  viewMode: 'desktop' | 'mobile'
  coverStyle?: CoverStyleType
  featuresStyle?: FeaturesStyleType
  collageDisplayMode?: 'large' | 'small'
}

export function TourFeaturesSection({ data, viewMode, coverStyle = 'original', featuresStyle, collageDisplayMode = 'large' }: TourFeaturesSectionProps) {
  // 決定實際使用的風格：優先使用 featuresStyle，否則根據 coverStyle 推斷
  const effectiveStyle = featuresStyle || (coverStyle === 'collage' ? 'collage' : coverStyle === 'art' ? 'art' : 'original')

  // Collage 風格使用專用組件
  if (effectiveStyle === 'collage') {
    return (
      <TourFeaturesSectionCollage
        data={data}
        viewMode={viewMode}
        coverStyle={coverStyle}
        displayMode={collageDisplayMode}
      />
    )
  }

  // Art 風格使用專用組件
  if (effectiveStyle === 'art') {
    return (
      <TourFeaturesSectionArt
        data={data}
        viewMode={viewMode}
      />
    )
  }

  const features = data.features || []
  const [lightboxImages, setLightboxImages] = useState<string[]>([])
  const [lightboxIndex, setLightboxIndex] = useState(0)
  // 每個特色卡片內的圖片輪播索引
  const [featureImageIndex, setFeatureImageIndex] = useState<Record<number, number>>({})

  const openLightbox = (images: string[], startIndex: number) => {
    setLightboxImages(images)
    setLightboxIndex(startIndex)
  }

  const closeLightbox = () => {
    setLightboxImages([])
    setLightboxIndex(0)
  }

  const goToPrev = () => {
    setLightboxIndex((prev) => (prev > 0 ? prev - 1 : lightboxImages.length - 1))
  }

  const goToNext = () => {
    setLightboxIndex((prev) => (prev < lightboxImages.length - 1 ? prev + 1 : 0))
  }

  return (
    <section className={viewMode === 'mobile' ? 'pt-4 pb-8 bg-card' : 'pt-8 pb-16 bg-card'}>
      <div className={viewMode === 'mobile' ? 'px-4' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}>
        <SectionTitle
          title={TOURS_LABELS.LABEL_6890}
          coverStyle={coverStyle}
          className={viewMode === 'mobile' ? 'mb-6' : 'mb-12'}
        />

        <div
          className={
            viewMode === 'mobile'
              ? 'space-y-4'
              : features.length === 1
                ? 'grid grid-cols-1 gap-7'
                : 'grid grid-cols-2 gap-7'
          }
        >
          {features.map((feature: TourFeature, index: number) => {
            const FeatureIcon = feature.iconComponent || Sparkles
            const validImages = feature.images?.filter(img => img && img.trim() !== '') || []
            const hasImages = validImages.length > 0
            const imageCount = validImages.length
            const currentImgIndex = featureImageIndex[index] || 0

            // 判斷是否為落單的最後一個（奇數個特色且超過1個時的最後一個）
            const isLastOdd = features.length > 1 && features.length % 2 === 1 && index === features.length - 1 && viewMode === 'desktop'
            // 判斷是否為單個特色
            const isSingleFeature = features.length === 1 && viewMode === 'desktop'

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
                    : isLastOdd
                      ? 'col-span-2 p-6 rounded-[24px] w-full'
                      : 'p-6 rounded-[24px] w-full'
                }
                style={{
                  backgroundColor: morandiColors.background.white,
                  border: `1px solid ${morandiColors.border.light}`,
                  boxShadow: `0 2px 12px ${morandiColors.shadow.soft}`,
                }}
              >
                {hasImages ? (
                  /* 垂直佈局：圖上文下（一般卡片） */
                  (() => {
                    // 1 張圖：滿版 16:9
                    if (imageCount === 1) {
                      return (
                        <>
                          <div className={viewMode === 'mobile' ? 'mb-2' : 'mb-4'}>
                            <div
                              className="overflow-hidden rounded-lg aspect-[16/9] cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => openLightbox(validImages, 0)}
                            >
                              <img src={validImages[0]}
                                alt={feature.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>
                          <div>
                            <h3
                              className={viewMode === 'mobile' ? 'font-bold text-base mb-1' : 'font-bold text-lg mb-2'}
                              style={{ color: morandiColors.text.primary }}
                            >
                              {feature.title}
                            </h3>
                            <p className="text-sm leading-relaxed" style={{ color: morandiColors.text.secondary }}>
                              {feature.description}
                            </p>
                          </div>
                        </>
                      )
                    }

                    // 2 張圖：並排顯示
                    if (imageCount === 2) {
                      return (
                        <>
                          <div className={`relative ${viewMode === 'mobile' ? 'mb-2' : 'mb-4'}`}>
                            <div className={viewMode === 'mobile' ? 'grid grid-cols-2 gap-2' : 'grid grid-cols-2 gap-3'}>
                              {validImages.map((imgUrl, imgIndex) => (
                                <div
                                  key={imgIndex}
                                  className="relative overflow-hidden rounded-lg aspect-[4/3] cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => openLightbox(validImages, imgIndex)}
                                >
                                  <img src={imgUrl}
                                    alt={`${feature.title} ${imgIndex + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h3
                              className={viewMode === 'mobile' ? 'font-bold text-base mb-1' : 'font-bold text-lg mb-2'}
                              style={{ color: morandiColors.text.primary }}
                            >
                              {feature.title}
                            </h3>
                            <p className="text-sm leading-relaxed" style={{ color: morandiColors.text.secondary }}>
                              {feature.description}
                            </p>
                          </div>
                        </>
                      )
                    }

                    // 3 張以上圖：輪播顯示（中間完整 + 左右露半邊）
                    // 建立無限循環的圖片陣列：[最後一張, ...原始, 第一張]
                    const extendedImages = [
                      validImages[imageCount - 1], // 最後一張放在前面
                      ...validImages,
                      validImages[0] // 第一張放在後面
                    ]

                    const handlePrevImage = (e: React.MouseEvent) => {
                      e.stopPropagation()
                      setFeatureImageIndex(prev => ({
                        ...prev,
                        [index]: (currentImgIndex - 1 + imageCount) % imageCount
                      }))
                    }

                    const handleNextImage = (e: React.MouseEvent) => {
                      e.stopPropagation()
                      setFeatureImageIndex(prev => ({
                        ...prev,
                        [index]: (currentImgIndex + 1) % imageCount
                      }))
                    }

                    // 實際顯示的索引（加1因為前面多了一張）
                    const displayIndex = currentImgIndex + 1
                    // 卡片寬度約 45%（和兩張並排時的單張差不多大），gap 12px
                    // 左邊露出約 27.5%（讓中間那張置中）
                    const cardWidth = 45
                    const gap = 12
                    const leftOffset = 27.5

                    return (
                      <>
                        <div className={`relative ${viewMode === 'mobile' ? 'mb-2' : 'mb-4'}`}>
                          {/* 輪播容器：中間完整 + 左右露半邊 */}
                          <div className="relative overflow-hidden rounded-lg">
                            <div
                              className="flex transition-transform duration-300 ease-out"
                              style={{
                                transform: `translateX(calc(-${displayIndex * cardWidth}% - ${displayIndex * gap}px + ${leftOffset}%))`
                              }}
                            >
                              {extendedImages.map((imgUrl, imgIndex) => {
                                // 計算這張圖對應原始陣列的索引
                                const originalIndex = imgIndex === 0
                                  ? imageCount - 1
                                  : imgIndex === extendedImages.length - 1
                                    ? 0
                                    : imgIndex - 1
                                const isActive = originalIndex === currentImgIndex

                                return (
                                  <div
                                    key={`${imgIndex}-${imgUrl}`}
                                    className={`flex-shrink-0 aspect-[4/3] cursor-pointer transition-all duration-300 rounded-lg overflow-hidden ${
                                      isActive
                                        ? 'opacity-100 scale-100'
                                        : 'opacity-70 scale-[0.92]'
                                    }`}
                                    style={{
                                      width: `${cardWidth}%`,
                                      marginRight: `${gap}px`
                                    }}
                                    onClick={() => openLightbox(validImages, originalIndex)}
                                  >
                                    <img src={imgUrl}
                                      alt={`${feature.title} ${originalIndex + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                )
                              })}
                            </div>
                          </div>

                          {/* 左右切換按鈕 */}
                          <button
                            onClick={handlePrevImage}
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center text-white transition-colors z-10"
                          >
                            <ChevronLeft size={18} />
                          </button>
                          <button
                            onClick={handleNextImage}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center text-white transition-colors z-10"
                          >
                            <ChevronRight size={18} />
                          </button>

                          {/* 圖片指示器 */}
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                            {validImages.map((_, dotIndex) => (
                              <button
                                key={dotIndex}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setFeatureImageIndex(prev => ({ ...prev, [index]: dotIndex }))
                                }}
                                className={`h-2 rounded-full transition-all ${
                                  dotIndex === currentImgIndex
                                    ? 'w-4 bg-card'
                                    : 'w-2 bg-card/50'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <div>
                          <h3
                            className={viewMode === 'mobile' ? 'font-bold text-base mb-1' : 'font-bold text-lg mb-2'}
                            style={{ color: morandiColors.text.primary }}
                          >
                            {feature.title}
                          </h3>
                          <p className="text-sm leading-relaxed" style={{ color: morandiColors.text.secondary }}>
                            {feature.description}
                          </p>
                        </div>
                      </>
                    )
                  })()
                ) : (
                  /* 沒有圖片時顯示圖標 + 文字 */
                  <>
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
                        className={viewMode === 'mobile' ? 'font-bold text-base mb-1' : 'font-bold text-lg mb-2'}
                        style={{ color: morandiColors.text.primary }}
                      >
                        {feature.title}
                      </h3>
                      <p className="text-sm leading-relaxed" style={{ color: morandiColors.text.secondary }}>
                        {feature.description}
                      </p>
                    </div>
                  </>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Lightbox 圖片放大檢視 */}
      <Dialog open={lightboxImages.length > 0} onOpenChange={(open) => !open && closeLightbox()}>
        <DialogContent level={1} className="max-w-5xl bg-black/90 border-none p-0">
          <div className="relative flex items-center justify-center min-h-[60vh]">
            {/* 左箭頭 */}
            {lightboxImages.length > 1 && (
              <button
                onClick={goToPrev}
                className="absolute left-4 w-12 h-12 bg-card/10 hover:bg-card/20 rounded-full flex items-center justify-center text-white transition-colors z-10"
              >
                <ChevronLeft size={28} />
              </button>
            )}

            {/* 圖片容器 */}
            <AnimatePresence mode="wait">
              <motion.div
                key={lightboxIndex}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center justify-center px-16"
              >
                <img src={lightboxImages[lightboxIndex]}
                  alt={`圖片 ${lightboxIndex + 1}`}
                  className="max-w-full max-h-[85vh] object-contain rounded-lg"
                />
              </motion.div>
            </AnimatePresence>

            {/* 右箭頭 */}
            {lightboxImages.length > 1 && (
              <button
                onClick={goToNext}
                className="absolute right-4 w-12 h-12 bg-card/10 hover:bg-card/20 rounded-full flex items-center justify-center text-white transition-colors z-10"
              >
                <ChevronRight size={28} />
              </button>
            )}

            {/* 圖片計數 */}
            {lightboxImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                {lightboxIndex + 1} / {lightboxImages.length}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}
