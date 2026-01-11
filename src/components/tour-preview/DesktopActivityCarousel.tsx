'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AttractionCard } from './AttractionCard'

interface Activity {
  title: string
  description?: string
  image?: string
}

interface DesktopActivityCarouselProps {
  activities: Activity[]
  onActivityClick?: (activity: Activity) => void
  className?: string
}

/**
 * 桌面版景點卡片輪播組件
 * - 中間完整顯示，左右露半邊
 * - 支援無限循環
 * - 左右箭頭控制
 */
export function DesktopActivityCarousel({
  activities,
  onActivityClick,
  className = ''
}: DesktopActivityCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  // 滑動到指定 index（無限循環）
  const scrollToIndex = (index: number) => {
    if (!scrollRef.current || activities.length <= 1) return

    const total = activities.length
    const nextIndex = ((index % total) + total) % total

    const container = scrollRef.current
    const cardWidth = container.offsetWidth * 0.6 // 60% 寬度
    const gap = 16
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
    if (!container || activities.length <= 1) return

    const handleScroll = () => {
      const cardWidth = container.offsetWidth * 0.6
      const gap = 16
      const index = Math.round(container.scrollLeft / (cardWidth + gap))
      setCurrentIndex(Math.max(0, Math.min(index, activities.length - 1)))
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [activities.length])

  if (activities.length === 0) return null

  const showControls = activities.length > 1

  return (
    <div className={cn('relative', className)}>
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
          className="flex gap-4"
          style={{
            paddingLeft: '20%',
            paddingRight: '20%'
          }}
        >
          {activities.map((activity, index) => (
            <div
              key={`activity-${index}`}
              className={cn(
                'flex-shrink-0 transition-all duration-300',
                index === currentIndex ? 'scale-100 opacity-100' : 'scale-95 opacity-70'
              )}
              style={{
                width: '60%',
                scrollSnapAlign: 'center'
              }}
            >
              <AttractionCard
                title={activity.title}
                description={activity.description || ''}
                image={activity.image}
                layout="vertical"
                className="transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer"
                onClick={() => onActivityClick?.(activity)}
              />
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
            className="absolute left-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-card/90 text-morandi-primary shadow-lg ring-1 ring-black/5 transition hover:bg-card hover:scale-110 z-10"
            aria-label="上一張圖片"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              scrollToIndex(currentIndex + 1)
            }}
            className="absolute right-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-card/90 text-morandi-primary shadow-lg ring-1 ring-black/5 transition hover:bg-card hover:scale-110 z-10"
            aria-label="下一張圖片"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

      {/* 分頁指示器 */}
      {showControls && (
        <div className="mt-4 flex justify-center gap-2">
          {activities.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                scrollToIndex(index)
              }}
              className={cn(
                'h-2.5 rounded-full border border-morandi-primary/30 transition-all duration-300',
                currentIndex === index ? 'w-6 bg-morandi-primary/90' : 'w-2.5 bg-card/60'
              )}
              aria-label={`切換至第 ${index + 1} 張圖片`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
