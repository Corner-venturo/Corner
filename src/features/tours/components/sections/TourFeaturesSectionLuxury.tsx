'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, ArrowRight, ChevronDown } from 'lucide-react'

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
  tag?: string // 自訂標籤文字
  tagColor?: string // 自訂標籤顏色
}

interface TourFeaturesSectionLuxuryProps {
  data: {
    features?: TourFeature[]
    showFeatures?: boolean
  }
  viewMode: 'desktop' | 'mobile'
}

// icon 對應標籤名稱
const iconToTag: Record<string, string> = {
  restaurant: 'Gastronomy',
  utensils: 'Gastronomy',
  dining: 'Gastronomy',
  food: 'Gastronomy',
  spa: 'Wellness',
  hot_tub: 'Wellness',
  wellness: 'Wellness',
  onsen: 'Wellness',
  nature: 'Discovery',
  landscape: 'Discovery',
  explore: 'Discovery',
  hiking: 'Discovery',
  temple: 'Culture',
  museum: 'Culture',
  culture: 'Culture',
  history: 'Culture',
  adventure: 'Adventure',
  sports: 'Adventure',
  activity: 'Adventure',
  star: 'Luxury',
  diamond: 'Luxury',
  premium: 'Luxury',
}

export function TourFeaturesSectionLuxury({ data, viewMode }: TourFeaturesSectionLuxuryProps) {
  const isMobile = viewMode === 'mobile'
  const features = data.features || []
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
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

  // 取得標籤文字：優先使用自訂 tag，其次用 icon 對應，最後用預設
  const getFeatureTag = (feature: TourFeature, index: number) => {
    // 優先使用自訂標籤
    if (feature.tag && feature.tag.trim()) return feature.tag.trim()
    // 其次用 icon 對應
    const iconLower = feature.icon.toLowerCase()
    if (iconToTag[iconLower]) return iconToTag[iconLower]
    // 預設標籤輪流
    const defaultTags = ['Gastronomy', 'Wellness', 'Discovery', 'Culture', 'Adventure', 'Luxury']
    return defaultTags[index % defaultTags.length]
  }

  // 取得標籤顏色：優先使用自訂 tagColor，其次根據索引交替
  const getTagColor = (feature: TourFeature, index: number) => {
    // 優先使用自訂顏色
    if (feature.tagColor) return feature.tagColor
    // 預設交替使用主色和次色
    return index % 2 === 0 ? LUXURY.primary : LUXURY.secondary
  }

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index)
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
              tag={getFeatureTag(feature, index)}
              tagColor={getTagColor(feature, index)}
              isExpanded={expandedIndex === index}
              onToggleExpand={() => toggleExpand(index)}
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
  isExpanded,
  onToggleExpand,
  onImageClick
}: {
  feature: TourFeature
  index: number
  isMobile: boolean
  tag: string
  tagColor: string
  isExpanded: boolean
  onToggleExpand: () => void
  onImageClick: (images: string[], index: number) => void
}) {
  const validImages = feature.images?.filter(img => img && img.trim() !== '') || []
  const hasImages = validImages.length > 0
  const hasMultipleImages = validImages.length > 1
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev < validImages.length - 1 ? prev + 1 : 0))
  }

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : validImages.length - 1))
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="group"
    >
      {/* 圖片區 */}
      <div
        className="relative h-64 rounded-sm overflow-hidden mb-6 shadow-md border border-gray-100 cursor-pointer"
        onClick={() => hasImages && onImageClick(validImages, currentImageIndex)}
      >
        {hasImages ? (
          <img
            src={validImages[isExpanded ? currentImageIndex : 0]}
            alt={feature.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
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

        {/* 展開時顯示圖片切換按鈕 */}
        {isExpanded && hasMultipleImages && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
            >
              <ChevronRight size={20} />
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white px-2 py-0.5 rounded-full text-xs">
              {currentImageIndex + 1} / {validImages.length}
            </div>
          </>
        )}
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

        {/* 描述 - 收合時只顯示3行 */}
        <p
          className={`text-sm leading-relaxed mb-4 ${!isExpanded ? 'line-clamp-3' : ''}`}
          style={{ color: LUXURY.muted }}
        >
          {feature.description}
        </p>

        {/* Read More / 收合按鈕 */}
        <button
          onClick={onToggleExpand}
          className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest pb-0.5 transition-colors hover:opacity-80"
          style={{
            color: LUXURY.secondary,
            borderBottom: `1px solid ${LUXURY.secondary}`
          }}
        >
          {isExpanded ? (
            <>收起 <ChevronDown size={14} className="rotate-180" /></>
          ) : (
            <>Read More <ArrowRight size={14} /></>
          )}
        </button>

        {/* 展開時顯示縮圖列表 */}
        <AnimatePresence>
          {isExpanded && hasMultipleImages && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 overflow-hidden"
            >
              <div className="flex gap-2 overflow-x-auto pb-2">
                {validImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-all ${
                      idx === currentImageIndex ? 'border-secondary opacity-100' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                    style={{ borderColor: idx === currentImageIndex ? LUXURY.secondary : 'transparent' }}
                  >
                    <img src={img} alt={`縮圖 ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
