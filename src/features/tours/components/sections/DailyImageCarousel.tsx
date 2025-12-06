'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { ThreeDPhotoWall } from '@/components/ui/3d-photo-wall'
import { ChevronLeft, ChevronRight } from 'lucide-react'

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
  const [showPhotoWall, setShowPhotoWall] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [currentIndex, setCurrentIndex] = useState(0)

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

  // 無限循環：滑動到指定 index
  const scrollToIndex = (index: number) => {
    if (!scrollRef.current || validImages.length <= 1) return

    // 無限循環邏輯
    const total = validImages.length
    const nextIndex = ((index % total) + total) % total

    const container = scrollRef.current
    const cardWidth = container.offsetWidth * 0.7 // 70% 寬度
    const gap = 12
    const scrollPosition = nextIndex * (cardWidth + gap)

    container.scrollTo({
      left: scrollPosition,
      behavior: 'smooth'
    })
    setCurrentIndex(nextIndex)
  }

  // 監聽滾動更新當前索引
  useEffect(() => {
    const container = scrollRef.current
    if (!container || validImages.length <= 1) return

    const handleScroll = () => {
      const cardWidth = container.offsetWidth * 0.7
      const gap = 12
      const index = Math.round(container.scrollLeft / (cardWidth + gap))
      setCurrentIndex(Math.max(0, Math.min(index, validImages.length - 1)))
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [validImages.length])

  // 點擊圖片時顯示照片牆
  const handleImageClick = () => {
    if (allTourImages.length >= 4) {
      setShowPhotoWall(true)
    }
  }

  // 單張圖片時使用原本的樣式
  if (validImages.length === 1) {
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
              <img
                src={getImageUrl(validImages[0])}
                alt={`${title} 圖片 1`}
                className="h-full w-full object-cover"
                style={{ objectPosition: getImagePosition(validImages[0]) }}
              />
              {allTourImages.length >= 4 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/20 transition-colors group">
                  <div className="px-4 py-2 bg-black/60 text-white text-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                    點擊查看照片牆
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {showPhotoWall && (
          <ThreeDPhotoWall
            images={allTourImages}
            onClose={() => setShowPhotoWall(false)}
          />
        )}
      </>
    )
  }

  // 多張圖片：中間完整 + 左右露半邊的輪播
  return (
    <>
      <div className="relative mb-8 mt-6">
        {/* 輪播容器 */}
        <div
          ref={scrollRef}
          className="overflow-x-auto scrollbar-hide"
          style={{
            scrollBehavior: 'smooth',
            scrollSnapType: 'x mandatory'
          }}
        >
          <div
            className="flex gap-3"
            style={{
              paddingLeft: '15%',
              paddingRight: '15%'
            }}
          >
            {validImages.map((image, index) => (
              <div
                key={`${getImageUrl(image)}-${index}`}
                className={cn(
                  "flex-shrink-0 overflow-hidden rounded-[20px] border border-white/60 bg-white shadow-xl ring-1 ring-morandi-border/20 transition-all duration-300",
                  allTourImages.length >= 4 && "cursor-pointer",
                  index === currentIndex ? "scale-100 opacity-100" : "scale-95 opacity-70"
                )}
                style={{
                  width: '70%',
                  scrollSnapAlign: 'center'
                }}
                onClick={handleImageClick}
              >
                <div className="relative aspect-[16/9] w-full">
                  <img
                    src={getImageUrl(image)}
                    alt={`${title} 圖片 ${index + 1}`}
                    className="h-full w-full object-cover"
                    style={{ objectPosition: getImagePosition(image) }}
                  />
                  {allTourImages.length >= 4 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/20 transition-colors group">
                      <div className="px-4 py-2 bg-black/60 text-white text-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                        點擊查看照片牆
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 左右箭頭控制 */}
        {showControls && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                scrollToIndex(currentIndex - 1)
              }}
              className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-morandi-primary shadow-lg ring-1 ring-black/5 transition hover:bg-white z-10"
              aria-label="上一張圖片"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                scrollToIndex(currentIndex + 1)
              }}
              className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-morandi-primary shadow-lg ring-1 ring-black/5 transition hover:bg-white z-10"
              aria-label="下一張圖片"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {/* 分頁指示器 */}
        {showControls && (
          <div className="mt-4 flex justify-center gap-2">
            {validImages.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  scrollToIndex(index)
                }}
                className={cn(
                  'h-2.5 rounded-full border border-morandi-primary/30 transition-all duration-300',
                  currentIndex === index ? 'w-6 bg-morandi-primary/90' : 'w-2.5 bg-white/60'
                )}
                aria-label={`切換至第 ${index + 1} 張圖片`}
              />
            ))}
          </div>
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
