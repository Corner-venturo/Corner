'use client'

/**
 * TourFlightSection - 航班區塊
 *
 * 🔧 重構說明 (2025-01-31):
 * - 原本：5 個獨立元件 (TourFlightSection*.tsx) + 3 個卡片元件 = 1,990 行
 * - 現在：統一元件 + 主題系統
 * - 保留此檔案作為向後相容的入口點
 *
 * @see TourFlightSectionUnified - 新的統一實作
 * @see @/features/tours/themes - 主題系統
 */

import { TourFlightSectionUnified } from './flight/TourFlightSectionUnified'
import type { TourPageData, CoverStyleType } from '@/features/tours/types/tour-display.types'

interface TourFlightSectionProps {
  data: TourPageData
  viewMode: 'desktop' | 'mobile'
  coverStyle?: CoverStyleType
}

/**
 * 航班區塊主組件 - 現在委託給統一元件處理
 */
export function TourFlightSection({ data, viewMode }: TourFlightSectionProps) {
  return <TourFlightSectionUnified data={data} viewMode={viewMode} />
}
