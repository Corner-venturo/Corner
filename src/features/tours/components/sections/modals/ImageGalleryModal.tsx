'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { ImageGalleryState, ImageInfo } from '../utils/itineraryLuxuryUtils'

interface ImageGalleryModalProps {
  imageGallery: ImageGalleryState | null
  onClose: () => void
  onPrev: () => void
  onNext: () => void
  onSelectIndex: (index: number) => void
}

export function ImageGalleryModal({
  imageGallery,
  onClose,
  onPrev,
  onNext,
  onSelectIndex,
}: ImageGalleryModalProps) {
  if (!imageGallery) return null

  const currentImage = imageGallery.images[imageGallery.currentIndex]

  return (
    <AnimatePresence>
      {imageGallery && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={onClose}
        >
          {/* 關閉按鈕 */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* 左箭頭 */}
          {imageGallery.images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onPrev()
              }}
              className="absolute left-4 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-8 h-8 text-white" />
            </button>
          )}

          {/* 主圖片 */}
          <motion.div
            key={imageGallery.currentIndex}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="max-w-5xl max-h-[80vh] relative"
            onClick={e => e.stopPropagation()}
          >
            <img
              src={currentImage.url}
              alt={currentImage.title || ''}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
            {/* 圖片標題和描述 */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 rounded-b-lg">
              {currentImage.title && (
                <h3
                  className="text-white text-xl font-bold mb-2"
                  style={{ fontFamily: "'Noto Serif TC', serif" }}
                >
                  {currentImage.title}
                </h3>
              )}
              {currentImage.description && (
                <p className="text-white/80 text-sm">
                  {currentImage.description}
                </p>
              )}
            </div>
          </motion.div>

          {/* 右箭頭 */}
          {imageGallery.images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onNext()
              }}
              className="absolute right-4 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-8 h-8 text-white" />
            </button>
          )}

          {/* 縮圖列表 */}
          {imageGallery.images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {imageGallery.images.map((img: ImageInfo, idx: number) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelectIndex(idx)
                  }}
                  className={`w-16 h-12 rounded overflow-hidden border-2 transition-all ${
                    idx === imageGallery.currentIndex
                      ? 'border-white opacity-100'
                      : 'border-transparent opacity-50 hover:opacity-75'
                  }`}
                >
                  <img
                    src={img.url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
