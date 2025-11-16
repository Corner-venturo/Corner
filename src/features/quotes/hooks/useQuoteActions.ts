import { useCallback, useEffect } from 'react'
import { UI_DELAYS } from '@/lib/constants/timeouts'
import { generateTourCode } from '@/stores/utils/code-generator'
import { getCurrentWorkspaceCode } from '@/lib/workspace-helpers'
import { logger } from '@/lib/utils/logger'
import { CostCategory, ParticipantCounts, SellingPrices } from '../types'

interface UseQuoteActionsProps {
  quote: any
  updateQuote: (id: string, data: any) => void
  addTour: (data: any) => Promise<any>
  router: any
  updatedCategories: CostCategory[]
  total_cost: number
  groupSize: number
  groupSizeForGuide: number
  quoteName: string
  accommodationDays: number
  participantCounts: ParticipantCounts
  sellingPrices: SellingPrices
  versionName: string
  currentEditingVersion: number | null
  setSaveSuccess: (value: boolean) => void
  setCategories: React.Dispatch<React.SetStateAction<CostCategory[]>>
}

export const useQuoteActions = ({
  quote,
  updateQuote,
  addTour,
  router,
  updatedCategories,
  total_cost,
  groupSize,
  groupSizeForGuide,
  quoteName,
  accommodationDays,
  participantCounts,
  sellingPrices,
  versionName,
  currentEditingVersion,
  setSaveSuccess,
  setCategories,
}: UseQuoteActionsProps) => {
  // 當人數改變時，重新計算所有團體分攤項目
  useEffect(() => {
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
  }, [participantCounts, groupSize, groupSizeForGuide, setCategories]) // 監聽人數變化

  // 儲存當前版本（覆蓋）
  const handleSave = useCallback(
    () => {
      if (!quote) return

      try {
        const baseUpdate = {
          categories: updatedCategories,
          total_cost,
          group_size: groupSize,
          name: quoteName,
          accommodation_days: accommodationDays,
          participant_counts: participantCounts,
          selling_prices: sellingPrices,
        }

        // 如果正在編輯某個版本，更新該版本
        if (currentEditingVersion !== null && quote.versions) {
          const existingVersions = [...quote.versions]
          existingVersions[currentEditingVersion] = {
            ...existingVersions[currentEditingVersion],
            categories: updatedCategories,
            total_cost,
            group_size: groupSize,
            accommodation_days: accommodationDays,
            participant_counts: participantCounts,
            selling_prices: sellingPrices,
            updated_at: new Date().toISOString(),
          }

          updateQuote(quote.id, {
            ...baseUpdate,
            versions: existingVersions,
          })
        } else {
          // 沒有編輯版本，只更新主資料
          updateQuote(quote.id, baseUpdate)
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
    ]
  )

  // 另存新版本
  const handleSaveAsNewVersion = useCallback(
    (note?: string, setCurrentEditingVersion?: (index: number) => void) => {
      if (!quote) return

      try {
        // 計算新的版本號（取得版本歷史中的最大版本號 + 1）
        const existingVersions = quote.versions || []
        const maxVersion = existingVersions.reduce((max: number, v: any) =>
          Math.max(max, v.version || 0), 0
        )
        const newVersion = maxVersion + 1

        // 創建新的版本記錄
        const newVersionRecord = {
          id: Date.now().toString(),
          version: newVersion,
          categories: updatedCategories,
          total_cost,
          group_size: groupSize,
          accommodation_days: accommodationDays,
          participant_counts: participantCounts,
          selling_prices: sellingPrices,
          note: note || versionName || `版本 ${newVersion}`,
          created_at: new Date().toISOString(),
        }

        // 更新報價單：將新版本加入版本歷史
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
        })

        // 自動切換到新創建的版本（新版本的索引是 length - 1）
        if (setCurrentEditingVersion) {
          setCurrentEditingVersion(newVersions.length - 1)
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

  // 格式化時間
  const formatDateTime = useCallback((dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }, [])

  // 轉為最終版本
  const handleFinalize = useCallback(() => {
    if (!quote) return

    // 先保存當前版本為新版本
    const existingVersions = quote.versions || []
    const maxVersion = existingVersions.reduce((max: number, v: any) =>
      Math.max(max, v.version || 0), 0
    )
    const newVersion = maxVersion + 1

    const finalizeVersionRecord = {
      id: Date.now().toString(),
      version: newVersion,
      categories: updatedCategories,
      total_cost,
      group_size: groupSize,
      accommodation_days: accommodationDays,
      participant_counts: participantCounts,
      selling_prices: sellingPrices,
      note: '轉為最終版本前的狀態',
      created_at: new Date().toISOString(),
    }

    // 更新狀態為最終版本
    updateQuote(quote.id, {
      status: 'approved',
      categories: updatedCategories,
      total_cost,
      group_size: groupSize,
      name: quoteName,
      accommodation_days: accommodationDays,
      participant_counts: participantCounts,
      selling_prices: sellingPrices,
      versions: [...existingVersions, finalizeVersionRecord],
    })

    // 自動跳轉到旅遊團新增頁面，並帶上報價單ID
    router.push(`/tours?fromQuote=${quote.id}`)
  }, [
    quote,
    updateQuote,
    updatedCategories,
    total_cost,
    groupSize,
    quoteName,
    accommodationDays,
    participantCounts,
    sellingPrices,
    router,
  ])

  // 開旅遊團
  const handleCreateTour = useCallback(async () => {
    if (!quote) return

    // 先保存目前的報價單狀態為新版本
    const existingVersions = quote.versions || []
    const maxVersion = existingVersions.reduce((max: number, v: any) =>
      Math.max(max, v.version || 0), 0
    )
    const newVersion = maxVersion + 1

    const createTourVersionRecord = {
      id: Date.now().toString(),
      version: newVersion,
      categories: updatedCategories,
      total_cost,
      group_size: groupSize,
      accommodation_days: accommodationDays,
      participant_counts: participantCounts,
      selling_prices: sellingPrices,
      note: '轉為旅遊團前的版本',
      created_at: new Date().toISOString(),
    }

    // 更新報價單狀態為最終版本
    updateQuote(quote.id, {
      status: 'approved',
      versions: [...existingVersions, createTourVersionRecord],
    })

    // 創建旅遊團
    const departure_date = new Date()
    departure_date.setDate(departure_date.getDate() + 30) // 預設30天後出發
    const return_date = new Date(departure_date)
    return_date.setDate(return_date.getDate() + 5) // 預設5天行程

    // 使用報價單名稱作為地點（用戶可以在旅遊團頁面再修改）
    const location = quoteName || '待定'

    // 生成團號（使用預設地區代碼 'XX'）
    const workspaceCode = getCurrentWorkspaceCode()
    if (!workspaceCode) {
      throw new Error('無法取得 workspace code')
    }
    const tourCode = generateTourCode(
      workspaceCode,
      'XX', // 預設地區代碼，用戶可以後續修改
      departure_date.toISOString(),
      [] // TODO: 傳入現有的 tours 來避免編號衝突
    )

    const newTour = await addTour({
      name: quoteName,
      location: location,
      departure_date: departure_date.toISOString().split('T')[0],
      return_date: return_date.toISOString().split('T')[0],
      price: Math.round(total_cost / groupSize), // 每人單價
      status: 'draft',
      code: tourCode,
      contract_status: 'pending',
      total_revenue: 0,
      total_cost: total_cost,
      profit: 0,
    })

    // 更新報價單的 tour_id
    if (newTour?.id) {
      await updateQuote(quote.id, { tour_id: newTour.id })
    }

    // 跳轉到旅遊團管理頁面，並高亮新建的團
    router.push(`/tours?highlight=${newTour?.id}`)
  }, [
    quote,
    updatedCategories,
    total_cost,
    groupSize,
    accommodationDays,
    participantCounts,
    sellingPrices,
    updateQuote,
    quoteName,
    addTour,
    router,
  ])

  // 刪除版本
  const handleDeleteVersion = useCallback(
    (versionIndex: number) => {
      if (!quote || !quote.versions) return

      try {
        const existingVersions = [...quote.versions]
        existingVersions.splice(versionIndex, 1)

        updateQuote(quote.id, {
          versions: existingVersions,
        })

        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), UI_DELAYS.SUCCESS_MESSAGE)
      } catch (error) {
        logger.error('刪除版本失敗:', error)
      }
    },
    [quote, updateQuote, setSaveSuccess]
  )

  return {
    handleSave,
    handleSaveAsNewVersion,
    formatDateTime,
    handleFinalize,
    handleCreateTour,
    handleDeleteVersion,
  }
}
