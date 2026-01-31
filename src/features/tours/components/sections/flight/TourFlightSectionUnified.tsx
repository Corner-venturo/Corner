'use client'

import { UnifiedFlightCard } from './UnifiedFlightCard'
import { getTheme, type TourStyle } from '@/features/tours/themes'
import type { TourPageData } from '@/features/tours/types/tour-display.types'

/**
 * 統一航班區塊 - 用主題系統取代多個獨立元件
 *
 * 整合前：5 個獨立元件 (1,464 行)
 * 整合後：1 個統一元件 + 主題系統
 */

interface TourFlightSectionUnifiedProps {
  data: TourPageData
  viewMode: 'desktop' | 'mobile'
  /** 強制指定風格，覆蓋 data.flightStyle */
  forceStyle?: TourStyle
}

// 從 flightStyle 字串對應到 TourStyle
function resolveStyle(
  flightStyle: string | undefined | null,
  coverStyle: string | undefined | null
): TourStyle {
  // 優先使用 flightStyle
  if (flightStyle && flightStyle !== 'none') {
    // 特殊映射
    if (flightStyle === 'chinese') return 'nature'
    if (flightStyle === 'japanese') return 'nature'
    // 直接對應
    if (['original', 'luxury', 'art', 'dreamscape', 'collage', 'nature', 'gemini'].includes(flightStyle)) {
      return flightStyle as TourStyle
    }
  }

  // 根據 coverStyle 推斷
  if (coverStyle) {
    if (['original', 'luxury', 'art', 'dreamscape', 'collage', 'nature', 'gemini'].includes(coverStyle)) {
      return coverStyle as TourStyle
    }
  }

  return 'original'
}

export function TourFlightSectionUnified({
  data,
  viewMode,
  forceStyle,
}: TourFlightSectionUnifiedProps) {
  const isMobile = viewMode === 'mobile'

  // 國內無航班
  if (data.flightStyle === 'none') {
    return null
  }

  // 沒有航班資料
  if (!data.outboundFlight && !data.returnFlight) {
    return null
  }

  // 決定風格
  const style = forceStyle || resolveStyle(data.flightStyle, data.coverStyle)
  const theme = getTheme(style)

  // 區塊背景樣式
  const sectionStyle: React.CSSProperties = {
    backgroundColor: typeof theme.colors.background === 'string' && theme.colors.background.startsWith('linear')
      ? undefined
      : theme.colors.background,
    background: typeof theme.colors.background === 'string' && theme.colors.background.startsWith('linear')
      ? theme.colors.background
      : undefined,
  }

  // Nature 風格加紙張紋理
  if (style === 'nature') {
    sectionStyle.backgroundImage = "url('https://www.transparenttextures.com/patterns/cream-paper.png')"
    sectionStyle.backgroundBlendMode = 'multiply'
  }

  return (
    <section
      id="flight"
      className={isMobile ? 'pt-4 pb-8' : 'pt-8 pb-16'}
      style={sectionStyle}
    >
      <div className={isMobile ? 'px-4' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}>
        {/* 標題（部分風格顯示） */}
        {['nature', 'luxury'].includes(style) && (
          <div className="flex flex-col items-center justify-center gap-2 mb-8 text-center">
            <h2
              className="text-2xl md:text-3xl font-medium tracking-wide"
              style={{
                color: theme.colors.text,
                fontFamily: theme.fonts.heading,
              }}
            >
              航班資訊
            </h2>
          </div>
        )}

        {/* 航班卡片 */}
        <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-1 md:grid-cols-2 gap-6'}`}>
          {data.outboundFlight && (
            <UnifiedFlightCard
              flight={data.outboundFlight}
              type="outbound"
              style={style}
              isMobile={isMobile}
              destinationImage={data.coverImage}
            />
          )}
          {data.returnFlight && (
            <UnifiedFlightCard
              flight={data.returnFlight}
              type="return"
              style={style}
              isMobile={isMobile}
              destinationImage={data.coverImage}
            />
          )}
        </div>

        {/* 底部說明（部分風格顯示） */}
        {['nature', 'luxury'].includes(style) && (
          <div className="text-center mt-8">
            <p
              className="text-xs leading-relaxed"
              style={{
                color: theme.colors.muted,
                opacity: 0.5,
                fontFamily: theme.fonts.body,
              }}
            >
              * 航班時間可能會有所變動，請以最新通知為準。
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
