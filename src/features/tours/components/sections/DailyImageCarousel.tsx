import { useState } from 'react'
import { cn } from '@/lib/utils'

interface DailyImageCarouselProps {
  images: string[]
  title: string
}

export function DailyImageCarousel({ images, title }: DailyImageCarouselProps) {
  const [current, setCurrent] = useState(0)

  // 過濾掉空值和無效的圖片
  const validImages = images?.filter(img => img && typeof img === 'string' && img.trim() !== '') || []

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

  return (
    <div className="relative mb-8 mt-6">
      <div className="overflow-hidden rounded-[28px] border border-white/60 bg-white shadow-2xl ring-1 ring-morandi-border/20">
        <div className="relative aspect-[16/9] w-full">
          {validImages.map((image, index) => (
            <img
              key={`${image}-${index}`}
              src={image}
              alt={`${title} 圖片 ${index + 1}`}
              className={cn(
                'absolute inset-0 h-full w-full object-cover transition-opacity duration-700',
                index === current ? 'opacity-100' : 'opacity-0'
              )}
            />
          ))}
        </div>
      </div>

      {showControls && (
        <>
          <button
            type="button"
            onClick={() => goToSlide(current - 1)}
            className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-morandi-primary shadow-lg ring-1 ring-black/5 transition hover:-translate-y-1/2 hover:bg-white"
            aria-label="上一張圖片"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => goToSlide(current + 1)}
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
                onClick={() => goToSlide(index)}
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
  )
}
