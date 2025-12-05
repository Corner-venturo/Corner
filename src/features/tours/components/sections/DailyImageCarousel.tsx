'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { ThreeDPhotoWall } from '@/components/ui/3d-photo-wall'

// 每日圖片型別（支援位置調整）
interface DailyImage {
  url: string
  position?: string
}

interface DailyImageCarouselProps {
  images: (string | DailyImage)[]
  title: string
  allTourImages?: string[] // 整個行程的所有每日照片（用於照片牆）
}

// 工具函數：取得圖片 URL
function getImageUrl(image: string | DailyImage): string {
  return typeof image === 'string' ? image : image.url
}

// 工具函數：取得圖片 position
function getImagePosition(image: string | DailyImage): string {
  return typeof image === 'string' ? 'center' : (image.position || 'center')
}

export function DailyImageCarousel({ images, title, allTourImages = [] }: DailyImageCarouselProps) {
  const [current, setCurrent] = useState(0)
  const [showPhotoWall, setShowPhotoWall] = useState(false)

  // 過濾掉空值和無效的圖片
  const validImages = images?.filter(img => {
    if (!img) return false
    if (typeof img === 'string') return img.trim() !== ''
    return img.url && img.url.trim() !== ''
  }) || []

  if (validImages.length === 0) {
    return null
  }

  const showControls = validImages.length > 1

  const goToSlide = (index: number) => {
    if (!showControls) return
    const total = validImages.length
    const next = (index + total) % total
    setCurrent(next)
  }

  // 點擊圖片時顯示照片牆
  const handleImageClick = () => {
    if (allTourImages.length >= 4) {
      setShowPhotoWall(true)
    }
  }

  return (
    <>
      <div className="relative mb-8 mt-6">
        <div
          className={cn(
            "overflow-hidden rounded-[28px] border border-white/60 bg-white shadow-2xl ring-1 ring-morandi-border/20",
            allTourImages.length >= 4 && "cursor-pointer"
          )}
          onClick={handleImageClick}
        >
          <div className="relative aspect-[16/9] w-full">
            {validImages.map((image, index) => (
              <img
                key={`${getImageUrl(image)}-${index}`}
                src={getImageUrl(image)}
                alt={`${title} 圖片 ${index + 1}`}
                className={cn(
                  'absolute inset-0 h-full w-full object-cover transition-opacity duration-700',
                  index === current ? 'opacity-100' : 'opacity-0'
                )}
                style={{ objectPosition: getImagePosition(image) }}
              />
            ))}
            {/* 點擊提示 */}
            {allTourImages.length >= 4 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/20 transition-colors group">
                <div className="px-4 py-2 bg-black/60 text-white text-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                  點擊查看照片牆
                </div>
              </div>
            )}
          </div>
        </div>

        {showControls && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                goToSlide(current - 1)
              }}
              className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-morandi-primary shadow-lg ring-1 ring-black/5 transition hover:-translate-y-1/2 hover:bg-white"
              aria-label="上一張圖片"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                goToSlide(current + 1)
              }}
              className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-morandi-primary shadow-lg ring-1 ring-black/5 transition hover:-translate-y-1/2 hover:bg-white"
              aria-label="下一張圖片"
            >
              ›
            </button>
            <div className="mt-4 flex justify-center gap-2">
              {validImages.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    goToSlide(index)
                  }}
                  className={cn(
                    'h-2.5 w-2.5 rounded-full border border-morandi-primary/30 transition-all duration-300',
                    current === index ? 'w-6 bg-morandi-primary/90' : 'bg-white/60'
                  )}
                  aria-label={`切換至第 ${index + 1} 張圖片`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* 3D 照片牆 */}
      {showPhotoWall && (
        <ThreeDPhotoWall
          images={allTourImages}
          onClose={() => setShowPhotoWall(false)}
        />
      )}
    </>
  )
}
