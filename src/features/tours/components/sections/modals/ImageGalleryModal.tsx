'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
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
    <Dialog open={!!imageGallery} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        level={1} className="max-w-5xl w-full bg-black/90 border-none p-0 gap-0"
        aria-describedby={undefined}
      >
        <div className="relative flex items-center justify-center min-h-[60vh]">
          {/* 左箭頭 */}
          {imageGallery.images.length > 1 && (
            <button
              onClick={onPrev}
              className="absolute left-4 z-10 w-12 h-12 rounded-full bg-card/10 hover:bg-card/20 flex items-center justify-center transition-colors"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-8 h-8 text-white" />
            </button>
          )}

          {/* 主圖片 */}
          <AnimatePresence mode="wait">
            <motion.div
              key={imageGallery.currentIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="max-w-5xl max-h-[80vh] relative"
            >
              <img
                src={currentImage.url}
                alt={currentImage.title || ''}
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
              />
              {/* 圖片標題和描述 */}
              {(currentImage.title || currentImage.description) && (
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
              )}
            </motion.div>
          </AnimatePresence>

          {/* 右箭頭 */}
          {imageGallery.images.length > 1 && (
            <button
              onClick={onNext}
              className="absolute right-4 z-10 w-12 h-12 rounded-full bg-card/10 hover:bg-card/20 flex items-center justify-center transition-colors"
              aria-label="Next image"
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
                  onClick={() => onSelectIndex(idx)}
                  className={`w-16 h-12 rounded overflow-hidden border-2 transition-all ${
                    idx === imageGallery.currentIndex
                      ? 'border-white opacity-100'
                      : 'border-transparent opacity-50 hover:opacity-75'
                  }`}
                  aria-label={`View image ${idx + 1}`}
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
        </div>
      </DialogContent>
    </Dialog>
  )
}
