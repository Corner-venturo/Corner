'use client'

import { useEffect, useRef } from 'react'
import { CostCategory } from '../types'

interface UseQuoteGroupCostUpdateProps {
  groupSize: number
  groupSizeForGuide: number
  setCategories: React.Dispatch<React.SetStateAction<CostCategory[]>>
}

export const useQuoteGroupCostUpdate = ({
  groupSize,
  groupSizeForGuide,
  setCategories,
}: UseQuoteGroupCostUpdateProps) => {
  // 使用 ref 追蹤前一次的 groupSize 和 groupSizeForGuide
  const prevGroupSizeRef = useRef<number | null>(null)
  const prevGroupSizeForGuideRef = useRef<number | null>(null)

  // 當人數改變時，重新計算所有團體分攤項目
  useEffect(() => {
    // 只有當 groupSize 或 groupSizeForGuide 真正改變時才執行
    // 第一次執行時（ref 為 null）也不執行，避免初始渲染時的迴圈
    if (
      prevGroupSizeRef.current === null ||
      prevGroupSizeForGuideRef.current === null
    ) {
      prevGroupSizeRef.current = groupSize
      prevGroupSizeForGuideRef.current = groupSizeForGuide
      return
    }

    // 如果值沒有實際改變，不執行更新
    if (
      prevGroupSizeRef.current === groupSize &&
      prevGroupSizeForGuideRef.current === groupSizeForGuide
    ) {
      return
    }

    // 更新 ref
    prevGroupSizeRef.current = groupSize
    prevGroupSizeForGuideRef.current = groupSizeForGuide

    setCategories(prevCategories => {
      return prevCategories.map(category => {
        if (
          category.id === 'group-transport' ||
          category.id === 'transport' ||
          category.id === 'guide'
        ) {
          const updatedItems = category.items.map(item => {
            const effectiveQuantity = item.quantity && item.quantity !== 1 ? item.quantity : 1
            let total = 0

            if (category.id === 'group-transport') {
              // 團體分攤分類：自動執行團體分攤邏輯
              if (item.name === '領隊分攤') {
                // 領隊分攤：(單價 × 數量) ÷ 人數（不含嬰兒）
                const guideTotalCost = (item.unit_price || 0) * effectiveQuantity
                total = groupSizeForGuide > 0 ? Math.ceil(guideTotalCost / groupSizeForGuide) : 0
              } else if (groupSizeForGuide > 1) {
                // 其他團體分攤項目：執行一般團體分攤邏輯（不含嬰兒）
                const total_cost = effectiveQuantity * (item.unit_price || 0)
                total = Math.ceil(total_cost / groupSizeForGuide)
              } else {
                // 人數為1時，不分攤
                total = Math.ceil(effectiveQuantity * (item.unit_price || 0))
              }
            } else if (
              (category.id === 'transport' || category.id === 'guide') &&
              item.is_group_cost &&
              groupSize > 1
            ) {
              // 交通和領隊導遊的團體分攤邏輯：小計 = (數量 × 單價) ÷ 團體人數
              const total_cost = effectiveQuantity * (item.unit_price || 0)
              total = Math.ceil(total_cost / groupSize)
            } else {
              // 維持原有的 total 值
              total = item.total || 0
            }

            return { ...item, total }
          })

          const categoryTotal = updatedItems.reduce((sum, item) => sum + (item.total || 0), 0)
          return { ...category, items: updatedItems, total: categoryTotal }
        }
        return category
      })
    })

  }, [groupSize, groupSizeForGuide, setCategories]) // 只依賴數值，不依賴 participantCounts 對象
}
