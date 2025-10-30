'use client'

import { useState, useEffect, useRef } from 'react'

interface GalleryOptions {
  viewMode: 'desktop' | 'mobile'
}

export function useTourGallery({ viewMode }: GalleryOptions) {
  const [showGallery, setShowGallery] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const galleryRef = useRef<HTMLElement>(null)

  // 檢測精選景點區塊是否進入視窗（觸發全屏相簿）
  useEffect(() => {
    if (viewMode !== 'mobile') return

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.7) {
            setShowGallery(true)
            document.body.style.overflow = 'hidden'
          }
        })
      },
      { threshold: 0.7 }
    )

    if (galleryRef.current) {
      observer.observe(galleryRef.current)
    }

    return () => {
      observer.disconnect()
      document.body.style.overflow = ''
    }
  }, [viewMode])

  const closeGallery = () => {
    setShowGallery(false)
    document.body.style.overflow = ''
  }

  return {
    showGallery,
    setShowGallery,
    currentImageIndex,
    setCurrentImageIndex,
    galleryRef,
    closeGallery,
  }
}
