'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { ART } from '../utils/art-theme'
import { ImageGalleryState } from '../hooks/useImageGallery'

interface ImageGalleryModalProps {
  imageGallery: ImageGalleryState
  onClose: () => void
  onPrev: () => void
  onNext: () => void
  onSelectIndex: (idx: number) => void
}

export function ImageGalleryModal({
  imageGallery,
  onClose,
  onPrev,
  onNext,
  onSelectIndex,
}: ImageGalleryModalProps) {
  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        level={2}
        className="max-w-5xl w-full border-none p-0 gap-0"
        style={{ backgroundColor: ART.ink }}
        aria-describedby={undefined}
      >
        <div className="relative flex items-center justify-center min-h-[60vh]">
          {/* 圖片計數器 */}
          <div className="absolute top-6 left-6 z-10">
            <span className="text-sm tracking-wider font-mono text-white/60">
              {imageGallery.currentIndex + 1} / {imageGallery.images.length}
            </span>
          </div>

          {/* 左右箭頭 */}
          {imageGallery.images.length > 1 && (
            <>
              <button
                onClick={onPrev}
                className="absolute left-6 z-10 w-12 h-12 flex items-center justify-center border border-white transition-colors hover:bg-card hover:text-black"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>
              <button
                onClick={onNext}
                className="absolute right-6 z-10 w-12 h-12 flex items-center justify-center border border-white transition-colors hover:bg-card hover:text-black"
                aria-label="Next image"
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </button>
            </>
          )}

          {/* 主圖片 */}
          <AnimatePresence mode="wait">
            <motion.div
              key={imageGallery.currentIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="max-w-5xl max-h-[85vh] mx-6"
            >
              <img
                src={imageGallery.images[imageGallery.currentIndex]}
                alt={imageGallery.title || '行程圖片'}
                className="max-w-full max-h-[85vh] object-contain"
              />
            </motion.div>
          </AnimatePresence>

          {/* 點狀指示器 */}
          {imageGallery.images.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
              {imageGallery.images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelectIndex(idx)}
                  className={`w-2 h-2 transition-all ${
                    idx === imageGallery.currentIndex
                      ? 'bg-card w-8'
                      : 'bg-card/30 hover:bg-card/50'
                  }`}
                  aria-label={`View image ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
