/**
 * 結算區塊
 */

import React from 'react'
import { Button } from '@/components/ui/button'
import { getCurrencySymbol } from '../../constants/currency'
import type { TourConfirmationItem } from '@/types/tour-confirmation-sheet.types'

interface SettlementSectionProps {
  items: TourConfirmationItem[]
  destinationCurrency: string | null
  effectiveExchangeRate: number | null
  onEditExchangeRate: () => void
  onSetExchangeRate: () => void
}

export function SettlementSection({
  items,
  destinationCurrency,
  effectiveExchangeRate,
  onEditExchangeRate,
  onSetExchangeRate,
}: SettlementSectionProps) {
  // 計算預計支出 (外幣)：只加總有外幣標記的項目
  const expectedForeign = items.reduce((sum, item) => {
    const typeData = item.type_data as { subtotal_currency?: string } | null
    if (typeData?.subtotal_currency === destinationCurrency) {
      return sum + (item.expected_cost || 0)
    }
    return sum
  }, 0)

  return (
    <div className="border-t border-border p-4 bg-morandi-container/20">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-morandi-primary">結算</h3>
        {destinationCurrency && (
          <div className="flex items-center gap-2 text-sm">
            {effectiveExchangeRate ? (
              <>
                <span className="text-morandi-secondary">
                  匯率：1 {destinationCurrency} = {effectiveExchangeRate} TWD
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-morandi-gold hover:text-morandi-gold-hover"
                  onClick={onEditExchangeRate}
                >
                  修改
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={onSetExchangeRate}
              >
                設定 {destinationCurrency} 匯率
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-4">
        {destinationCurrency && expectedForeign > 0 ? (
          <>
            <div className="space-y-1">
              <p className="text-xs text-morandi-secondary">預計支出 ({destinationCurrency})</p>
              <p className="text-2xl font-mono font-medium text-morandi-gold">
                {getCurrencySymbol(destinationCurrency)} {expectedForeign.toLocaleString()}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-morandi-secondary">實際支出 ({destinationCurrency})</p>
              <p className="text-2xl font-mono font-medium text-morandi-gold">
                {getCurrencySymbol(destinationCurrency)} 0
              </p>
            </div>
          </>
        ) : (
          <div className="text-sm text-morandi-secondary">尚無外幣支出項目</div>
        )}
      </div>
    </div>
  )
}
