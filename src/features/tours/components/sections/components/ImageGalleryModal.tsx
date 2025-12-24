'use client'

import { motion } from 'framer-motion'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: ART.black }}
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-6 right-6 z-10 w-12 h-12 flex items-center justify-center border border-white transition-colors hover:bg-white hover:text-black"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      <div className="absolute top-6 left-6 z-10">
        <span className="text-sm tracking-wider font-mono text-white/60">
          {imageGallery.currentIndex + 1} / {imageGallery.images.length}
        </span>
      </div>

      {imageGallery.images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); onPrev() }}
            className="absolute left-6 z-10 w-12 h-12 flex items-center justify-center border border-white transition-colors hover:bg-white hover:text-black"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onNext() }}
            className="absolute right-6 z-10 w-12 h-12 flex items-center justify-center border border-white transition-colors hover:bg-white hover:text-black"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        </>
      )}

      <motion.div
        key={imageGallery.currentIndex}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="max-w-5xl max-h-[85vh] mx-6"
        onClick={e => e.stopPropagation()}
      >
        <img
          src={imageGallery.images[imageGallery.currentIndex]}
          alt={imageGallery.title || '行程圖片'}
          className="max-w-full max-h-[85vh] object-contain"
        />
      </motion.div>

      {imageGallery.images.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {imageGallery.images.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => { e.stopPropagation(); onSelectIndex(idx) }}
              className={`w-2 h-2 transition-all ${
                idx === imageGallery.currentIndex
                  ? 'bg-white w-8'
                  : 'bg-white/30 hover:bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </motion.div>
  )
}
