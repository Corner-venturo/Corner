'use client'

import React, { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { morandiColors } from '@/lib/constants/morandi-colors'
import { Dialog, DialogContent } from '@/components/ui/dialog'

interface Activity {
  title: string
  description?: string
  image?: string
}

interface MobileActivityCarouselProps {
  activities: Activity[]
  className?: string
}

/**
 * 手機版景點卡片輪播組件
 * - 小卡片水平滑動，露出下一張
 * - 點擊開啟懸浮視窗檢視完整內容
 */
export function MobileActivityCarousel({ activities, className = '' }: MobileActivityCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showHint, setShowHint] = useState(true)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  // 3秒後隱藏滑動提示
  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 3000)
    return () => clearTimeout(timer)
  }, [])

  // 監聽滾動更新當前索引
  useEffect(() => {
    const container = scrollRef.current
    if (!container) return

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft
      const cardWidth = 200 + 12 // 卡片寬度 + gap
      const index = Math.round(scrollLeft / cardWidth)
      setCurrentIndex(index)
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  // 懸浮視窗的上一張/下一張
  const goToPrev = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1)
    }
  }

  const goToNext = () => {
    if (selectedIndex !== null && selectedIndex < activities.length - 1) {
      setSelectedIndex(selectedIndex + 1)
    }
  }

  if (activities.length === 0) return null

  return (
    <>
      {/* 輪播容器 */}
      <div className={`relative ${className}`}>
        {/* 滑動提示 */}
        <AnimatePresence>
          {showHint && activities.length > 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-1/2 right-2 -translate-y-1/2 z-10 pointer-events-none"
            >
              <motion.div
                animate={{ x: [0, 6, 0] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
                className="flex items-center gap-0.5 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded-full"
              >
                <span>滑動</span>
                <ChevronRight size={12} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 卡片列表 - 水平滾動（小卡片） */}
        <div
          ref={scrollRef}
          className="overflow-x-auto scrollbar-hide -mx-4 px-4"
          style={{ scrollBehavior: 'smooth' }}
        >
          <div className="flex gap-3" style={{ width: 'max-content' }}>
            {activities.map((activity, index) => (
              <div
                key={index}
                onClick={() => setSelectedIndex(index)}
                className="w-[200px] flex-shrink-0 rounded-xl overflow-hidden bg-card shadow-md cursor-pointer active:scale-[0.97] transition-transform"
                style={{
                  border: `1px solid ${morandiColors.border.light}`,
                }}
              >
                {/* 圖片區 - 有圖片顯示圖片，沒圖片顯示底色 */}
                <div className="relative w-full h-[140px]">
                  {activity.image && activity.image.trim() !== '' ? (
                    <Image
                      src={activity.image}
                      alt={activity.title}
                      fill
                      className="object-cover"
                      sizes="200px"
                      unoptimized={activity.image.startsWith('data:')}
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ backgroundColor: morandiColors.background.cream }}
                    >
                      <span className="text-morandi-secondary text-xs">景點資訊</span>
                    </div>
                  )}
                </div>

                {/* 文字區 */}
                <div className="p-3">
                  <h4
                    className="font-bold text-sm mb-1 line-clamp-1"
                    style={{ color: morandiColors.text.primary }}
                  >
                    {activity.title}
                  </h4>
                  {activity.description && (
                    <p
                      className="text-xs leading-relaxed line-clamp-2"
                      style={{ color: morandiColors.text.secondary }}
                    >
                      {activity.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 分頁指示器 */}
        {activities.length > 1 && (
          <div className="flex justify-center gap-1 mt-2">
            {activities.map((_, index) => (
              <div
                key={index}
                className={`h-1 rounded-full transition-all duration-300 ${
                  index === currentIndex ? 'w-3 bg-morandi-gold' : 'w-1 bg-morandi-container'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* 懸浮視窗 Modal - 使用標準 Dialog 組件 */}
      <Dialog open={selectedIndex !== null} onOpenChange={(open) => !open && setSelectedIndex(null)}>
        <DialogContent level={1} className="max-w-[85vw] sm:max-w-md p-0 overflow-hidden gap-0">
          <AnimatePresence mode="wait">
            {selectedIndex !== null && (
              <motion.div
                key={selectedIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {/* 頂部拖曳指示條 - 往下滑關閉 */}
                <div
                  className="absolute top-0 left-0 right-0 h-8 flex items-center justify-center z-20 cursor-pointer"
                  onClick={() => setSelectedIndex(null)}
                >
                  <div className="w-10 h-1 bg-border rounded-full" />
                </div>

                {/* 圖片 - 有圖片才顯示 */}
                {activities[selectedIndex]?.image && activities[selectedIndex].image!.trim() !== '' && (
                  <div className="relative w-full aspect-[3/2] max-h-[40vh]">
                    <Image
                      src={activities[selectedIndex].image!}
                      alt={activities[selectedIndex].title}
                      fill
                      className="object-cover"
                      sizes="90vw"
                      unoptimized={activities[selectedIndex].image!.startsWith('data:')}
                    />

                    {/* 左右切換按鈕 - 更柔和的設計，放在圖片兩側邊緣 */}
                    {activities.length > 1 && (
                      <>
                        {selectedIndex > 0 && (
                          <button
                            onClick={goToPrev}
                            className="absolute left-0 top-1/2 -translate-y-1/2 p-3 bg-black/20 hover:bg-black/40 text-white transition-all duration-200"
                            style={{
                              background: 'linear-gradient(90deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.1) 100%)',
                              borderRadius: '0 8px 8px 0'
                            }}
                          >
                            <ChevronLeft size={20} />
                          </button>
                        )}
                        {selectedIndex < activities.length - 1 && (
                          <button
                            onClick={goToNext}
                            className="absolute right-0 top-1/2 -translate-y-1/2 p-3 bg-black/20 hover:bg-black/40 text-white transition-all duration-200"
                            style={{
                              background: 'linear-gradient(270deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.1) 100%)',
                              borderRadius: '8px 0 0 8px'
                            }}
                          >
                            <ChevronRight size={20} />
                          </button>
                        )}
                      </>
                    )}

                    {/* 分頁指示器 - 放在圖片底部 */}
                    {activities.length > 1 && (
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {activities.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedIndex(index)}
                            className={`h-2 rounded-full transition-all shadow ${
                              index === selectedIndex ? 'w-5 bg-card' : 'w-2 bg-card/60'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 內容區 - 支援觸控滑動關閉 */}
                <div
                  className="px-5 py-6 max-h-[35vh] overflow-y-auto flex flex-col items-center text-center"
                  onTouchStart={(e) => {
                    const touch = e.touches[0]
                    // 記錄初始觸摸位置
                    e.currentTarget.dataset.startY = touch.clientY.toString()
                  }}
                  onTouchMove={(e) => {
                    const target = e.currentTarget
                    const startY = parseInt(target.dataset.startY || '0')
                    const currentY = e.touches[0].clientY
                    const diff = currentY - startY

                    // 向下滑動超過 100px 且滾動位置在頂部時關閉
                    if (diff > 100 && target.scrollTop === 0) {
                      setSelectedIndex(null)
                    }
                  }}
                >
                  <div className="w-full max-w-sm mx-auto">
                    <h3
                      className="font-bold text-xl mb-3"
                      style={{ color: morandiColors.text.primary }}
                    >
                      {activities[selectedIndex]?.title}
                    </h3>
                    {activities[selectedIndex]?.description && (
                      <p
                        className="text-sm leading-relaxed"
                        style={{ color: morandiColors.text.secondary }}
                      >
                        {activities[selectedIndex].description}
                      </p>
                    )}
                  </div>
                  {/* 底部額外空間，讓滾動關閉更容易觸發 */}
                  <div className="h-16" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </>
  )
}
