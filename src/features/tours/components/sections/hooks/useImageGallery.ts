import { useState } from 'react'

export interface ImageGalleryState {
  images: string[]
  currentIndex: number
  title?: string
}

export function useImageGallery() {
  const [imageGallery, setImageGallery] = useState<ImageGalleryState | null>(null)

  const openImageGallery = (images: string[], startIndex: number, title?: string) => {
    if (images.length > 0) {
      setImageGallery({ images, currentIndex: startIndex, title })
    }
  }

  const closeImageGallery = () => {
    setImageGallery(null)
  }

  const goToPreviousImage = () => {
    if (!imageGallery) return
    setImageGallery({
      ...imageGallery,
      currentIndex: imageGallery.currentIndex > 0
        ? imageGallery.currentIndex - 1
        : imageGallery.images.length - 1
    })
  }

  const goToNextImage = () => {
    if (!imageGallery) return
    setImageGallery({
      ...imageGallery,
      currentIndex: imageGallery.currentIndex < imageGallery.images.length - 1
        ? imageGallery.currentIndex + 1
        : 0
    })
  }

  const selectImageIndex = (idx: number) => {
    if (!imageGallery) return
    setImageGallery({ ...imageGallery, currentIndex: idx })
  }

  return {
    imageGallery,
    openImageGallery,
    closeImageGallery,
    goToPreviousImage,
    goToNextImage,
    selectImageIndex,
  }
}
