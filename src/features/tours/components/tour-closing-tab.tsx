'use client'

/**
 * TourClosingTab - 結案頁籤
 *
 * 合併利潤總覽與獎金設定，供結案作業使用
 */

import { ProfitTab } from './ProfitTab'
import { BonusSettingTab } from './BonusSettingTab'
import type { Tour } from '@/stores/types'

interface TourClosingTabProps {
  tour: Tour
}

export function TourClosingTab({ tour }: TourClosingTabProps) {
  return (
    <div className="space-y-6">
      <ProfitTab tour={tour} />
      <BonusSettingTab tour={tour} />
    </div>
  )
}
