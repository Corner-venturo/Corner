'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'

// Luxury 配色
const LUXURY = {
  primary: '#2C5F4D',
  secondary: '#C69C6D',
  accent: '#8F4F4F',
  background: '#FDFBF7',
  surface: '#FFFFFF',
  text: '#2D3436',
  muted: '#636E72',
}

interface TourFeature {
  icon: string
  title: string
  description: string
  images?: string[]
}

interface TourFeaturesSectionLuxuryProps {
  data: {
    features?: TourFeature[]
    showFeatures?: boolean
  }
  viewMode: 'desktop' | 'mobile'
}

export function TourFeaturesSectionLuxury({ data, viewMode }: TourFeaturesSectionLuxuryProps) {
  const isMobile = viewMode === 'mobile'
  const features = data.features || []
  const [lightboxImages, setLightboxImages] = useState<string[]>([])
  const [lightboxIndex, setLightboxIndex] = useState(0)

  if (data.showFeatures === false || features.length === 0) return null

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

  // 根據特色數量決定標籤類型
  const getFeatureTag = (index: number) => {
    const tags = ['Gastronomy', 'Wellness', 'Discovery', 'Culture', 'Adventure', 'Luxury']
    return tags[index % tags.length]
  }

  // 根據索引交替使用主色和次色
  const getTagColor = (index: number) => {
    return index % 2 === 0 ? LUXURY.primary : LUXURY.secondary
  }

  return (
    <section
      className={isMobile ? 'py-12' : 'py-20'}
      style={{ backgroundColor: LUXURY.background }}
    >
      <div className={isMobile ? 'px-4' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}>
        {/* 標題區 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 md:mb-16"
        >
          <span
            className="block mb-2 italic"
            style={{
              color: LUXURY.secondary,
              fontFamily: "'Noto Serif TC', serif",
              fontSize: isMobile ? '1rem' : '1.125rem'
            }}
          >
            Exclusive Experiences
          </span>
          <h2
            className={`font-bold ${isMobile ? 'text-2xl' : 'text-3xl'}`}
            style={{
              color: LUXURY.text,
              fontFamily: "'Noto Serif TC', serif"
            }}
          >
            行程特色
          </h2>
        </motion.div>

        {/* 特色網格 */}
        <div className={`grid ${
          isMobile
            ? 'grid-cols-1 gap-8'
            : features.length === 1
              ? 'grid-cols-1 max-w-2xl mx-auto gap-8'
              : features.length === 2
                ? 'md:grid-cols-2 gap-8'
                : 'md:grid-cols-2 lg:grid-cols-3 gap-8'
        }`}>
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              feature={feature}
              index={index}
              isMobile={isMobile}
              tag={getFeatureTag(index)}
              tagColor={getTagColor(index)}
              onImageClick={(images, idx) => openLightbox(images, idx)}
            />
          ))}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxImages.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center"
            onClick={closeLightbox}
          >
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-10"
            >
              <X size={24} />
            </button>

            {lightboxImages.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); goToPrev() }}
                className="absolute left-4 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-10"
              >
                <ChevronLeft size={28} />
              </button>
            )}

            <motion.div
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={lightboxImages[lightboxIndex]}
                alt={`圖片 ${lightboxIndex + 1}`}
                className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
              />
            </motion.div>

            {lightboxImages.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); goToNext() }}
                className="absolute right-4 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-10"
              >
                <ChevronRight size={28} />
              </button>
            )}

            {lightboxImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                {lightboxIndex + 1} / {lightboxImages.length}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

// 特色卡片組件
function FeatureCard({
  feature,
  index,
  isMobile,
  tag,
  tagColor,
  onImageClick
}: {
  feature: TourFeature
  index: number
  isMobile: boolean
  tag: string
  tagColor: string
  onImageClick: (images: string[], index: number) => void
}) {
  const validImages = feature.images?.filter(img => img && img.trim() !== '') || []
  const hasImages = validImages.length > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="group cursor-pointer"
    >
      {/* 圖片區 */}
      <div className="relative h-64 rounded-sm overflow-hidden mb-6 shadow-md border border-gray-100">
        {hasImages ? (
          <img
            src={validImages[0]}
            alt={feature.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            onClick={() => onImageClick(validImages, 0)}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: '#f5f5f5' }}
          >
            <span className="text-gray-400 text-sm">暫無圖片</span>
          </div>
        )}

        {/* 標籤 */}
        <div
          className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1"
          style={{ borderLeft: `2px solid ${tagColor}` }}
        >
          <span
            className="text-[10px] font-bold uppercase tracking-widest"
            style={{ color: tagColor }}
          >
            {tag}
          </span>
        </div>
      </div>

      {/* 文字區 */}
      <div className="px-2">
        <h3
          className={`font-bold mb-3 ${isMobile ? 'text-lg' : 'text-xl'}`}
          style={{
            color: LUXURY.text,
            fontFamily: "'Noto Serif TC', serif"
          }}
        >
          {feature.title}
        </h3>
        <p
          className="text-sm leading-relaxed mb-4 line-clamp-3"
          style={{ color: LUXURY.muted }}
        >
          {feature.description}
        </p>
        <span
          className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest pb-0.5"
          style={{
            color: LUXURY.secondary,
            borderBottom: `1px solid ${LUXURY.secondary}`
          }}
        >
          Read More <ArrowRight size={14} />
        </span>
      </div>
    </motion.div>
  )
}
