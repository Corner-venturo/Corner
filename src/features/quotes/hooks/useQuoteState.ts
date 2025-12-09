import { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuotes } from './useQuotes'
import { useTourStore, useOrderStore } from '@/stores'
import { useWorkspaceChannels } from '@/stores/workspace'
import { CostCategory, ParticipantCounts, SellingPrices, costCategories, VersionRecord } from '../types'
import { useItineraryImport } from './useItineraryImport'
import { QuickQuoteItem } from '@/types/quote.types'

export const useQuoteState = () => {
  const params = useParams()
  const router = useRouter()
  const { quotes, updateQuote, loadQuotes } = useQuotes()
  const { items: tours, create: addTour } = useTourStore()
  const { items: orders } = useOrderStore()
  const { workspaces, loadWorkspaces } = useWorkspaceChannels()
  const { importDataToCategories, isFromItinerary, shouldCreateNewVersion, mealsData, hotelsData, activitiesData } = useItineraryImport()

  // 追蹤是否已經建立過新版本，避免重複建立
  const hasCreatedNewVersion = useRef(false)

  // 追蹤是否已經從行程匯入過資料（避免被 quote 載入覆蓋）
  const hasImportedFromItinerary = useRef(false)

  const quote_id = params.id as string
  const quote = quotes.find(q => q.id === quote_id)

  // 自動載入 workspaces（如果還沒載入）
  useEffect(() => {
    if (workspaces.length === 0) {
      loadWorkspaces()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 自動載入 quotes（如果還沒載入）
  useEffect(() => {
    if (quotes.length === 0) {
      loadQuotes()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 檢查是否為特殊團報價單
  const relatedTour = quote?.tour_id ? tours.find(t => t.id === quote.tour_id) : null
  const isSpecialTour = relatedTour?.status === 'special'
  const isReadOnly = isSpecialTour // 特殊團報價單設為唯讀

  // 計算旅遊團的實際預計人數（從訂單的 member_count 加總）
  const tourPlannedParticipants = useMemo(() => {
    if (!relatedTour) return 0
    const tourOrders = orders.filter(order => order.tour_id === relatedTour.id)
    return tourOrders.reduce((sum, order) => sum + (order.member_count || 0), 0)
  }, [relatedTour, orders])


  const [categories, setCategories] = useState<CostCategory[]>(() => {
    const initialCategories = quote?.categories || costCategories
    // 確保每個分類的總計都正確計算
    let processedCategories = initialCategories.map(cat => ({
      ...cat,
      total: cat.items.reduce((sum, item) => sum + (item.total || 0), 0),
    }))
    
    // 如果是從行程頁面來的，自動匯入行程資料
    if (isFromItinerary && (mealsData.length > 0 || hotelsData.length > 0 || activitiesData.length > 0)) {
      console.log('[useQuoteState] 初始化時匯入行程資料')
      processedCategories = importDataToCategories(processedCategories)
      hasImportedFromItinerary.current = true
    }
    
    return processedCategories
  })

  const [accommodationDays, setAccommodationDays] = useState<number>(quote?.accommodation_days || 0)

  // 多身份人數統計（初始值：從 quote 載入，或從 tour/order 推算，最後才用預設值 1）
  const [participantCounts, setParticipantCounts] = useState<ParticipantCounts>(() => {
    if (quote?.participant_counts) {
      return quote.participant_counts
    }

    // 如果有 tour，從 tour 的訂單計算預計人數
    if (quote?.tour_id && relatedTour) {
      const tourOrders = orders.filter(order => order.tour_id === relatedTour.id)
      const totalMembers = tourOrders.reduce((sum, order) => sum + (order.member_count || 0), 0)

      if (totalMembers > 0) {
        return {
          adult: totalMembers,
          child_with_bed: 0,
          child_no_bed: 0,
          single_room: 0,
          infant: 0,
        }
      }

      // 如果訂單沒有人數，用 tour 的 max_participants
      if (relatedTour.max_participants) {
        return {
          adult: relatedTour.max_participants,
          child_with_bed: 0,
          child_no_bed: 0,
          single_room: 0,
          infant: 0,
        }
      }
    }

    // 如果 quote 有 group_size，使用它
    const quoteGroupSize = quote?.group_size
    if (quoteGroupSize && quoteGroupSize > 0) {
      return {
        adult: quoteGroupSize,
        child_with_bed: 0,
        child_no_bed: 0,
        single_room: 0,
        infant: 0,
      }
    }

    // 最後才用預設值
    return {
      adult: 1,
      child_with_bed: 0,
      child_no_bed: 0,
      single_room: 0,
      infant: 0,
    }
  })

  // 當 quote 載入後，更新所有狀態
  useEffect(() => {
    if (quote) {
      // 如果已經從行程匯入過資料，不要用資料庫的 categories 覆蓋
      if (quote.categories && !hasImportedFromItinerary.current) {
        const loadedCategories = quote.categories.map(cat => ({
          ...cat,
          total: cat.items.reduce((sum, item) => sum + (item.total || 0), 0),
        }))
        setCategories(loadedCategories)
      } else if (hasImportedFromItinerary.current) {
        console.log('[useQuoteState] 跳過 categories 載入（已從行程匯入）')
      }
      if (quote.accommodation_days !== undefined && !hasImportedFromItinerary.current) {
        setAccommodationDays(quote.accommodation_days)
      }
      if (quote.participant_counts) {
        setParticipantCounts(quote.participant_counts)
      }
      if (quote.selling_prices) {
        setSellingPrices(quote.selling_prices)
      }
      if (quote.name) {
        setQuoteName(quote.name)
      }
      // 快速報價單資料
      if (quote.quick_quote_items) {
        setQuickQuoteItems(quote.quick_quote_items as QuickQuoteItem[])
      }
      // 快速報價單客戶資訊
      setQuickQuoteCustomerInfo({
        customer_name: quote.customer_name || '',
        contact_phone: quote.contact_phone || '',
        contact_address: quote.contact_address || '',
        tour_code: quote.tour_code || relatedTour?.code || '',
        handler_name: quote.handler_name || 'William',
        issue_date: quote.issue_date || new Date().toISOString().split('T')[0],
        received_amount: quote.received_amount || 0,
        expense_description: (quote as any)?.expense_description || '',
      })
    }
  }, [quote?.id, relatedTour?.code]) // 只在 quote.id 改變時執行

  // 總人數：優先使用旅遊團訂單的預計人數，其次用 max_participants，最後從參與人數加總
  const groupSize =
    tourPlannedParticipants ||
    relatedTour?.max_participants ||
    participantCounts.adult +
      participantCounts.child_with_bed +
      participantCounts.child_no_bed +
      participantCounts.single_room +
      participantCounts.infant

  // 導遊費用分攤人數（不含嬰兒）：優先使用旅遊團訂單的預計人數，其次用 max_participants，最後從參與人數加總
  const groupSizeForGuide =
    tourPlannedParticipants ||
    relatedTour?.max_participants ||
    participantCounts.adult +
      participantCounts.child_with_bed +
      participantCounts.child_no_bed +
      participantCounts.single_room

  const [quoteName, setQuoteName] = useState<string>(quote?.name || '')
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false)
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState<boolean>(false)
  const [versionName, setVersionName] = useState<string>('')
  const [currentEditingVersion, setCurrentEditingVersion] = useState<number | null>(null) // 追蹤當前編輯的版本索引

  // 多身份售價
  const [sellingPrices, setSellingPrices] = useState<SellingPrices>(
    quote?.selling_prices || {
      adult: 0,
      child_with_bed: 0,
      child_no_bed: 0,
      single_room: 0,
      infant: 0,
    }
  )

  // 快速報價單相關狀態
  const [quickQuoteItems, setQuickQuoteItems] = useState<QuickQuoteItem[]>(
    (quote?.quick_quote_items as QuickQuoteItem[]) || []
  )
  const [quickQuoteCustomerInfo, setQuickQuoteCustomerInfo] = useState({
    customer_name: quote?.customer_name || '',
    contact_phone: quote?.contact_phone || '',
    contact_address: quote?.contact_address || '',
    tour_code: quote?.tour_code || relatedTour?.code || '',
    handler_name: quote?.handler_name || 'William',
    issue_date: quote?.issue_date || new Date().toISOString().split('T')[0],
    received_amount: quote?.received_amount || 0,
    expense_description: (quote as any)?.expense_description || '',
  })

  // 如果找不到報價單，返回列表頁（只有在資料已載入時才判斷）
  useEffect(() => {
    // 只有當 quotes 陣列有資料（表示已載入）且找不到對應的 quote 時，才跳轉
    if (quotes.length > 0 && !quote) {
      router.push('/quotes')
    }
  }, [quote, quotes.length, router])

  // 自動建立新版本（從行程頁面帶入資料時）
  useEffect(() => {
    if (
      shouldCreateNewVersion &&
      quote &&
      !hasCreatedNewVersion.current &&
      (mealsData.length > 0 || hotelsData.length > 0 || activitiesData.length > 0)
    ) {
      hasCreatedNewVersion.current = true

      // 先匯入行程資料到 categories
      const importedCategories = importDataToCategories(categories)

      // 計算新版本號
      const existingVersions = quote.versions || []
      const maxVersion = existingVersions.reduce((max: number, v: { version?: number }) =>
        Math.max(max, v.version || 0), 0
      )
      const newVersionNum = maxVersion + 1

      // 建立新版本
      const newVersion: VersionRecord = {
        id: Date.now().toString(),
        version: newVersionNum,
        name: `從行程帶入 - ${new Date().toLocaleDateString('zh-TW')}`,
        created_at: new Date().toISOString(),
        note: '自動從行程資料建立',
        categories: importedCategories,
        accommodation_days: accommodationDays,
        participant_counts: participantCounts,
        selling_prices: sellingPrices,
        total_cost: importedCategories.reduce((sum, cat) => sum + (cat.total || 0), 0),
      }

      // 更新到資料庫
      const newVersionIndex = existingVersions.length
      updateQuote(quote.id, {
        current_version_index: newVersionIndex,
        versions: [...existingVersions, newVersion],
      }).then(() => {
        // 更新本地 state
        setCategories(importedCategories)
        // 設定當前編輯版本為新建立的版本
        setCurrentEditingVersion(existingVersions.length)

        // 清除 URL 參數
        const url = new URL(window.location.href)
        url.searchParams.delete('create_new_version')
        url.searchParams.delete('from_itinerary')
        url.searchParams.delete('meals')
        url.searchParams.delete('hotels')
        url.searchParams.delete('activities')
        url.searchParams.delete('link_itinerary')
        window.history.replaceState({}, '', url.pathname)
      })
    }
  }, [shouldCreateNewVersion, quote, mealsData, hotelsData, activitiesData])

  return {
    quote_id,
    quote,
    relatedTour,
    isSpecialTour,
    isReadOnly,
    categories,
    setCategories,
    accommodationDays,
    setAccommodationDays,
    participantCounts,
    setParticipantCounts,
    groupSize,
    groupSizeForGuide,
    quoteName,
    setQuoteName,
    saveSuccess,
    setSaveSuccess,
    isSaveDialogOpen,
    setIsSaveDialogOpen,
    versionName,
    setVersionName,
    currentEditingVersion,
    setCurrentEditingVersion,
    sellingPrices,
    setSellingPrices,
    // 快速報價單相關
    quickQuoteItems,
    setQuickQuoteItems,
    quickQuoteCustomerInfo,
    setQuickQuoteCustomerInfo,
    updateQuote,
    addTour,
    router,
  }
}
