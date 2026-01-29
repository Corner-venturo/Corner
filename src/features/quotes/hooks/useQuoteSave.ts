'use client'

import { useCallback } from 'react'
import { UI_DELAYS } from '@/lib/constants/timeouts'
import { logger } from '@/lib/utils/logger'
import { CostCategory, ParticipantCounts, SellingPrices, TierPricing } from '../types'
import type { Quote, QuoteVersion } from '@/stores/types'
import type { QuickQuoteItem } from '@/types/quote.types'

interface QuickQuoteCustomerInfo {
  customer_name: string
  contact_phone: string
  contact_address: string
  tour_code: string
  handler_name: string
  issue_date: string
  received_amount: number
  expense_description: string
}

interface UseQuoteSaveProps {
  quote: Quote | null | undefined
  updateQuote: (id: string, data: Partial<Quote>) => void
  updatedCategories: CostCategory[]
  total_cost: number
  groupSize: number
  quoteName: string
  accommodationDays: number
  participantCounts: ParticipantCounts
  sellingPrices: SellingPrices
  versionName: string
  currentEditingVersion: number | null
  setSaveSuccess: (value: boolean) => void
  quickQuoteItems?: QuickQuoteItem[]
  quickQuoteCustomerInfo?: QuickQuoteCustomerInfo
  tierPricings?: TierPricing[]
}

export const useQuoteSave = ({
  quote,
  updateQuote,
  updatedCategories,
  total_cost,
  groupSize,
  quoteName,
  accommodationDays,
  participantCounts,
  sellingPrices,
  versionName,
  currentEditingVersion,
  setSaveSuccess,
  quickQuoteItems,
  quickQuoteCustomerInfo,
  tierPricings,
}: UseQuoteSaveProps) => {
  // 儲存當前版本（覆蓋）
  // 新邏輯：所有版本都存在 versions[] 陣列，current_version_index 追蹤當前編輯的版本
  const handleSave = useCallback(
    (setCurrentEditingVersion?: (index: number) => void) => {
      if (!quote) {
        logger.error('[handleSave] quote 為 undefined，無法儲存')
        return
      }

      try {
        const existingVersions = quote.versions || []

        // 快速報價單資料
        const quickQuoteData = quickQuoteCustomerInfo ? {
          customer_name: quickQuoteCustomerInfo.customer_name,
          contact_phone: quickQuoteCustomerInfo.contact_phone,
          contact_address: quickQuoteCustomerInfo.contact_address,
          tour_code: quickQuoteCustomerInfo.tour_code,
          handler_name: quickQuoteCustomerInfo.handler_name,
          issue_date: quickQuoteCustomerInfo.issue_date,
          received_amount: quickQuoteCustomerInfo.received_amount,
          expense_description: quickQuoteCustomerInfo.expense_description,
          quick_quote_items: quickQuoteItems || [],
        } : {}

        // 砍次表資料
        const tierPricingsData = tierPricings || []

        // 第一次儲存：沒有版本記錄，自動創建 versions[0]
        if (existingVersions.length === 0) {
          const firstVersion: QuoteVersion = {
            id: Date.now().toString(),
            version: 1,
            mode: 'detailed', // 預設為詳細模式
            name: quoteName || quote.customer_name || '版本 1', // 優先使用行程代碼（quoteName）
            categories: updatedCategories,
            total_cost,
            group_size: groupSize,
            accommodation_days: accommodationDays,
            participant_counts: participantCounts,
            selling_prices: sellingPrices,
            notes: '初始版本',
            created_at: new Date().toISOString(),
          }

          updateQuote(quote.id, {
            name: quoteName,
            versions: [firstVersion],
            current_version_index: 0,
            // categories 作為臨時編輯狀態，同步更新
            categories: updatedCategories,
            total_cost,
            group_size: groupSize,
            accommodation_days: accommodationDays,
            participant_counts: participantCounts,
            selling_prices: sellingPrices,
            // 砍次表資料
            tier_pricings: tierPricingsData,
            // 快速報價單資料
            ...quickQuoteData,
          })

          // 設定當前編輯版本為 0
          if (setCurrentEditingVersion) {
            setCurrentEditingVersion(0)
          }
        } else {
          // 已有版本：更新 currentEditingVersion 對應的版本
          const versionIndex = currentEditingVersion ?? (quote.current_version_index ?? 0)
          const updatedVersions: QuoteVersion[] = [...existingVersions]

          if (versionIndex >= 0 && versionIndex < updatedVersions.length) {
            updatedVersions[versionIndex] = {
              ...updatedVersions[versionIndex],
              categories: updatedCategories,
              total_cost,
              group_size: groupSize,
              accommodation_days: accommodationDays,
              participant_counts: participantCounts,
              selling_prices: sellingPrices,
              updated_at: new Date().toISOString(),
            }
          }

          updateQuote(quote.id, {
            name: quoteName,
            versions: updatedVersions,
            current_version_index: versionIndex,
            // categories 作為臨時編輯狀態，同步更新
            categories: updatedCategories,
            total_cost,
            group_size: groupSize,
            accommodation_days: accommodationDays,
            participant_counts: participantCounts,
            selling_prices: sellingPrices,
            // 砍次表資料
            tier_pricings: tierPricingsData,
            // 快速報價單資料
            ...quickQuoteData,
          })
        }

        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), UI_DELAYS.SUCCESS_MESSAGE)
      } catch (error) {
        logger.error('儲存失敗:', error)
      }
    },
    [
      quote,
      updatedCategories,
      total_cost,
      groupSize,
      quoteName,
      accommodationDays,
      participantCounts,
      sellingPrices,
      currentEditingVersion,
      updateQuote,
      setSaveSuccess,
      quickQuoteItems,
      quickQuoteCustomerInfo,
      tierPricings,
    ]
  )

  // 另存新版本
  const handleSaveAsNewVersion = useCallback(
    (newVersionName?: string, setCurrentEditingVersion?: (index: number) => void) => {
      if (!quote) return

      try {
        // 計算新的版本號（取得版本歷史中的最大版本號 + 1）
        const existingVersions = quote.versions || []
        const maxVersion = existingVersions.reduce((max: number, v: QuoteVersion) =>
          Math.max(max, v.version || 0), 0
        )
        const newVersion = maxVersion + 1

        // 創建新的版本記錄
        // 優先使用傳入的 newVersionName，其次使用 versionName state，最後使用預設名稱
        const finalVersionName = newVersionName || versionName || `版本 ${newVersion}`
        const newVersionRecord: QuoteVersion = {
          id: Date.now().toString(),
          version: newVersion,
          mode: 'detailed', // 預設為詳細模式
          name: finalVersionName, // 版本名稱
          categories: updatedCategories,
          total_cost,
          group_size: groupSize,
          accommodation_days: accommodationDays,
          participant_counts: participantCounts,
          selling_prices: sellingPrices,
          notes: '', // 版本備註
          created_at: new Date().toISOString(),
        }

        // 更新報價單：將新版本加入版本歷史
        const newVersionIndex = existingVersions.length
        const newVersions = [...existingVersions, newVersionRecord]
        updateQuote(quote.id, {
          categories: updatedCategories,
          total_cost,
          group_size: groupSize,
          name: quoteName,
          accommodation_days: accommodationDays,
          participant_counts: participantCounts,
          selling_prices: sellingPrices,
          versions: newVersions,
          current_version_index: newVersionIndex, // 自動切換到新版本
        })

        // 自動切換到新創建的版本（新版本的索引是 length - 1）
        if (setCurrentEditingVersion) {
          setCurrentEditingVersion(newVersionIndex)
        }

        // 顯示成功提示
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), UI_DELAYS.SUCCESS_MESSAGE)
      } catch (error) {
        logger.error('保存版本失敗:', error)
      }
    },
    [
      quote,
      updatedCategories,
      total_cost,
      groupSize,
      quoteName,
      accommodationDays,
      participantCounts,
      sellingPrices,
      versionName,
      updateQuote,
      setSaveSuccess,
    ]
  )

  return {
    handleSave,
    handleSaveAsNewVersion,
  }
}
