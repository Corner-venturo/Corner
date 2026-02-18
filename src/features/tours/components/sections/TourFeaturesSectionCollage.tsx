'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'

// Collage 配色
const POP = {
  pink: '#FF0080',
  yellow: '#FFEB3B',
  blue: '#00E5FF',
  purple: '#D500F9',
  lime: '#C6FF00',
  paper: '#fdfbf7',
  dark: '#121212',
}

// Scrapbook 配色
const SCRAPBOOK = {
  pink: '#ff8fab',
  yellow: '#fff0ad',
  blue: '#a2d2ff',
  mint: '#9bf6ff',
  purple: '#bdb2ff',
}

import type { TourPageData, CoverStyleType } from '@/features/tours/types/tour-display.types'

// 卡片風格類型
export type FeatureCardStyle = 'polaroid' | 'diptych' | 'frame' | 'recipe'

// Collage 專用的 Feature 擴展類型
interface CollageFeature {
  icon?: string
  title: string
  description: string
  images?: string[]
  cardStyle?: FeatureCardStyle
  tags?: string[]
}

interface TourFeaturesSectionCollageProps {
  data: TourPageData
  viewMode: 'desktop' | 'mobile'
  coverStyle?: CoverStyleType
  displayMode?: 'large' | 'small'
}

// ============================================
// Style 1: Polaroid + Sticky Note (拍立得+便條紙)
// ============================================
function PolaroidCard({
  feature,
  index,
  isMobile,
  onImageClick,
}: {
  feature: CollageFeature
  index: number
  isMobile: boolean
  onImageClick: (images: string[], startIndex: number) => void
}) {
  const image = feature.images?.[0]
  const bgColors = [SCRAPBOOK.yellow, SCRAPBOOK.pink, SCRAPBOOK.mint, SCRAPBOOK.blue]
  const noteColor = bgColors[index % bgColors.length]
  const rotation = (index % 2 === 0 ? -3 : 3) + (index % 3)

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotate: rotation }}
      whileInView={{ opacity: 1, y: 0, rotate: rotation }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -8, rotate: 0 }}
      className="relative group cursor-pointer"
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      {/* 背後的便條紙 */}
      <div
        className="absolute -top-4 -left-4 w-[calc(100%+2rem)] h-[calc(100%+3rem)] rounded-md"
        style={{
          backgroundColor: noteColor,
          transform: `rotate(${-rotation * 0.5}deg)`,
          boxShadow: '3px 3px 10px rgba(0,0,0,0.15)',
        }}
      />

      {/* 主拍立得卡片 */}
      <div
        className="relative bg-card p-3 pb-14"
        style={{
          boxShadow: '8px 8px 0px 0px rgba(0,0,0,0.9)',
        }}
      >
        {/* 膠帶 */}
        <div
          className="absolute -top-3 left-1/2 -translate-x-1/2 w-20 h-6"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
            backdropFilter: 'blur(2px)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
            transform: 'rotate(-2deg)',
          }}
        />

        {/* 圖片 */}
        <div
          className={`relative overflow-hidden ${isMobile ? 'h-40' : 'h-52'}`}
          onClick={() => image && onImageClick(feature.images || [], 0)}
        >
          {image ? (
            <img src={image}
              alt={feature.title}
              className="w-full h-full object-cover border border-border grayscale group-hover:grayscale-0 transition-all duration-500"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center text-4xl">
              {feature.icon || '📷'}
            </div>
          )}

          {/* Day 標籤 */}
          <div
            className="absolute bottom-2 right-2 bg-card px-2 py-1 text-xs font-bold shadow-md"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            #{String(index + 1).padStart(2, '0')}
          </div>
        </div>

        {/* 手寫標題 */}
        <div
          className="absolute bottom-3 left-0 w-full text-center"
          style={{ fontFamily: "'Gloria Hallelujah', cursive" }}
        >
          <h3 className="text-lg text-foreground">{feature.title}</h3>
        </div>
      </div>

      {/* 描述浮層 */}
      <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-4 rounded">
        <p className="text-white text-sm text-center" style={{ fontFamily: "'Space Mono', monospace" }}>
          {feature.description}
        </p>
      </div>
    </motion.div>
  )
}

// ============================================
// Style 2: Diptych (雙圖拼貼)
// ============================================
function DiptychCard({
  feature,
  index,
  isMobile,
  onImageClick,
}: {
  feature: CollageFeature
  index: number
  isMobile: boolean
  onImageClick: (images: string[], startIndex: number) => void
}) {
  const images = feature.images || []
  const hasTwo = images.length >= 2

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="relative group cursor-pointer"
    >
      {/* 畫框外框 */}
      <div
        className="bg-card p-6"
        style={{
          boxShadow: `
            0 0 0 12px #ffffff,
            0 0 0 14px #000000,
            12px 18px 30px rgba(0,0,0,0.2)
          `,
        }}
      >
        {/* 圖片區域 */}
        <div className={`grid ${hasTwo ? 'grid-cols-2' : 'grid-cols-1'} gap-1 ${isMobile ? 'h-40' : 'h-52'}`}>
          {hasTwo ? (
            <>
              <div
                className="overflow-hidden border border-border/50"
                onClick={() => onImageClick(images, 0)}
              >
                <img src={images[0]}
                  alt={`${feature.title} 1`}
                  className="w-full h-full object-cover"
                />
              </div>
              <div
                className="overflow-hidden border border-border/50"
                onClick={() => onImageClick(images, 1)}
              >
                <img src={images[1]}
                  alt={`${feature.title} 2`}
                  className="w-full h-full object-cover"
                />
              </div>
            </>
          ) : images[0] ? (
            <div
              className="overflow-hidden border border-border/50"
              onClick={() => onImageClick(images, 0)}
            >
              <img src={images[0]}
                alt={feature.title}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center text-4xl">
              {feature.icon || '🖼️'}
            </div>
          )}

          {/* Day 標籤 */}
          <div
            className="absolute bottom-8 right-8 bg-card px-2 py-1 text-xs font-bold shadow-md"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            #{String(index + 1).padStart(2, '0')}
          </div>
        </div>

        {/* 標題 */}
        <div className="mt-4 text-center">
          <h3 className="font-bold text-lg" style={{ fontFamily: "'Zen Old Mincho', serif" }}>
            {feature.title}
          </h3>
          <p className="text-xs text-morandi-muted mt-1" style={{ fontFamily: "'Space Mono', monospace" }}>
            {feature.description.slice(0, 30)}...
          </p>
        </div>
      </div>

      {/* 膠帶裝飾 - 左上 */}
      <div
        className="absolute -top-2 -left-2 w-12 h-5"
        style={{
          backgroundColor: 'rgba(255, 235, 59, 0.7)',
          transform: 'rotate(-45deg)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      />

      {/* 膠帶裝飾 - 右下 */}
      <div
        className="absolute -bottom-2 -right-2 w-12 h-5"
        style={{
          backgroundColor: 'rgba(255, 235, 59, 0.7)',
          transform: 'rotate(-45deg)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      />
    </motion.div>
  )
}

// ============================================
// Style 3: Note Frame (便條框風格)
// ============================================
function FrameCard({
  feature,
  index,
  isMobile,
  onImageClick,
}: {
  feature: CollageFeature
  index: number
  isMobile: boolean
  onImageClick: (images: string[], startIndex: number) => void
}) {
  const image = feature.images?.[0]
  const bgColors = [SCRAPBOOK.mint, SCRAPBOOK.pink, SCRAPBOOK.blue, SCRAPBOOK.yellow, SCRAPBOOK.purple]
  const bgColor = bgColors[index % bgColors.length]
  const stickerEmojis = ['🎯', '⭐', '🔥', '💫', '✨', '🌟', '🎪', '🎨']
  const stickerEmoji = stickerEmojis[index % stickerEmojis.length]

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -6 }}
      className="relative group cursor-pointer p-5 rounded-md"
      style={{
        backgroundColor: bgColor,
        boxShadow: '5px 5px 0px 0px rgba(0,0,0,0.8)',
      }}
    >
      {/* 圖片 */}
      <div
        className={`relative overflow-hidden border-4 border-white ${isMobile ? 'h-40' : 'h-52'}`}
        onClick={() => image && onImageClick(feature.images || [], 0)}
        style={{
          boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
        }}
      >
        {image ? (
          <img src={image}
            alt={feature.title}
            className="w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full bg-card flex items-center justify-center text-4xl">
            {feature.icon || '🎫'}
          </div>
        )}

        {/* 貼紙 */}
        <div
          className="absolute -top-2 -right-2 w-12 h-12 rounded-full bg-card flex items-center justify-center text-2xl shadow-lg"
          style={{ transform: 'rotate(15deg)' }}
        >
          {stickerEmoji}
        </div>
      </div>

      {/* 標題區 */}
      <div className="mt-4">
        <h3
          className="font-bold text-lg text-foreground"
          style={{ fontFamily: "'Permanent Marker', cursive" }}
        >
          {feature.title}
        </h3>
        <p
          className="text-sm text-morandi-secondary mt-1 leading-relaxed"
          style={{ fontFamily: "'Patrick Hand', cursive" }}
        >
          {feature.description}
        </p>
      </div>

      {/* 編號標籤 */}
      <div
        className="absolute top-2 left-2 bg-black text-white px-2 py-1 text-xs font-bold"
        style={{ fontFamily: "'Space Mono', monospace" }}
      >
        #{String(index + 1).padStart(2, '0')}
      </div>
    </motion.div>
  )
}

// ============================================
// Style 4: Recipe Card (食譜卡片風格 - 小卡 4 per row)
// ============================================
function RecipeCard({
  feature,
  index,
  isMobile,
  onImageClick,
}: {
  feature: CollageFeature
  index: number
  isMobile: boolean
  onImageClick: (images: string[], startIndex: number) => void
}) {
  const image = feature.images?.[0]
  const tagColors = [POP.pink, POP.blue, POP.lime, POP.yellow, POP.purple]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08 }}
      whileHover={{ y: -4 }}
      className="group cursor-pointer bg-card relative top-0 hover:-top-2 transition-all duration-300"
      style={{
        boxShadow: '0 15px 30px -10px rgba(0,0,0,0.15), 0 8px 20px -8px rgba(0,0,0,0.1)',
      }}
    >
      {/* 圖片區 */}
      <div
        className={`relative overflow-hidden ${isMobile ? 'h-36' : 'h-44'}`}
        onClick={() => image && onImageClick(feature.images || [], 0)}
      >
        {image ? (
          <img src={image}
            alt={feature.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-muted to-morandi-container flex items-center justify-center text-3xl">
            {feature.icon || '🍽️'}
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <span
            className="text-white text-xl italic"
            style={{ fontFamily: "'Zen Old Mincho', serif" }}
          >
            {feature.title}
          </span>
        </div>
      </div>

      {/* 內容區 */}
      <div className="p-4 border-t border-black">
        {/* 標題 */}
        <div className="flex justify-between items-start mb-2">
          <div>
            <span
              className="text-xs text-morandi-muted"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              FEATURE #{String(index + 1).padStart(2, '0')}
            </span>
            <h3 className="font-bold text-base mt-1">{feature.title}</h3>
          </div>
          <div
            className="w-7 h-7 rounded-full border border-black flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors"
          >
            →
          </div>
        </div>

        {/* 描述 */}
        <p className="text-xs text-morandi-secondary line-clamp-2 mb-3">
          {feature.description}
        </p>

        {/* 標籤 */}
        {feature.tags && feature.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {feature.tags.slice(0, 3).map((tag, tagIndex) => (
              <span
                key={tagIndex}
                className="text-[10px] px-2 py-0.5 text-black font-bold"
                style={{
                  backgroundColor: tagColors[tagIndex % tagColors.length],
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ============================================
// 主組件
// ============================================
export function TourFeaturesSectionCollage({
  data,
  viewMode,
  displayMode = 'large',
}: TourFeaturesSectionCollageProps) {
  const features = (data.features || []) as CollageFeature[]
  const isMobile = viewMode === 'mobile'

  // Lightbox 狀態
  const [lightboxImages, setLightboxImages] = useState<string[]>([])
  const [lightboxIndex, setLightboxIndex] = useState(0)

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

  // 根據卡片風格渲染
  const renderCard = (feature: CollageFeature, index: number) => {
    // 小卡模式一律用 Recipe 風格
    if (displayMode === 'small') {
      return (
        <RecipeCard
          key={index}
          feature={feature}
          index={index}
          isMobile={isMobile}
          onImageClick={openLightbox}
        />
      )
    }

    // 大卡模式根據 cardStyle 決定
    const style = feature.cardStyle || 'polaroid'
    switch (style) {
      case 'diptych':
        return (
          <DiptychCard
            key={index}
            feature={feature}
            index={index}
            isMobile={isMobile}
            onImageClick={openLightbox}
          />
        )
      case 'frame':
        return (
          <FrameCard
            key={index}
            feature={feature}
            index={index}
            isMobile={isMobile}
            onImageClick={openLightbox}
          />
        )
      case 'polaroid':
      default:
        return (
          <PolaroidCard
            key={index}
            feature={feature}
            index={index}
            isMobile={isMobile}
            onImageClick={openLightbox}
          />
        )
    }
  }

  // Grid 設定
  const gridClass = displayMode === 'small'
    ? isMobile
      ? 'grid-cols-2 gap-4'
      : 'grid-cols-4 gap-6'
    : isMobile
      ? 'grid-cols-1 gap-8'
      : 'grid-cols-3 gap-10'

  return (
    <section
      className={isMobile ? 'py-8' : 'py-16'}
      style={{
        backgroundColor: POP.paper,
        fontFamily: "'Space Mono', monospace",
      }}
    >
      <div className={isMobile ? 'px-4' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}>
        {/* 標題 */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2
            className={`font-bold tracking-tighter ${isMobile ? 'text-3xl' : 'text-5xl'}`}
            style={{ fontFamily: "'Permanent Marker', cursive" }}
          >
            {displayMode === 'small' ? 'TASTY BITES' : 'DAILY HIGHLIGHTS'}
          </h2>
          <p className="text-morandi-secondary mt-2 text-sm">
            {displayMode === 'small' ? '美食特輯' : '行程亮點精選'}
          </p>
        </motion.div>

        {/* 卡片網格 */}
        <div className={`grid ${gridClass}`}>
          {features.map((feature, index) => renderCard(feature, index))}
        </div>
      </div>

      {/* Lightbox */}
      <Dialog open={lightboxImages.length > 0} onOpenChange={(open) => !open && closeLightbox()}>
        <DialogContent level={1} className="max-w-[95vw] max-h-[95vh] p-0 bg-black/90 border-none">
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

            {/* 圖片 */}
            <AnimatePresence mode="wait">
              <motion.div
                key={lightboxIndex}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-center"
              >
                <img src={lightboxImages[lightboxIndex]}
                  alt={`圖片 ${lightboxIndex + 1}`}
                  className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
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

      {/* 載入 Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Permanent+Marker&family=Gloria+Hallelujah&family=Space+Mono:wght@400;700&family=Zen+Old+Mincho:wght@700&family=Patrick+Hand&display=swap');
      `}</style>
    </section>
  )
}
