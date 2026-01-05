import { getTodayString } from '@/lib/utils/format-date'
import { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuotes } from './useQuotes'
import { useTourStore, useOrderStore } from '@/stores'
import { useWorkspaceChannels } from '@/stores/workspace'
import { CostCategory, ParticipantCounts, SellingPrices, costCategories, TierPricing } from '../types'
import { QuickQuoteItem } from '@/types/quote.types'

export const useQuoteState = () => {
  const params = useParams()
  const router = useRouter()
  const { quotes, updateQuote, loadQuotes } = useQuotes()
  const { items: tours, create: addTour } = useTourStore()
  const { items: orders } = useOrderStore()
  const { workspaces, loadWorkspaces } = useWorkspaceChannels()

  const quote_id = params.id as string
  const quote = quotes.find(q => q.id === quote_id)

  // 自動載入 workspaces（如果還沒載入）
  useEffect(() => {
    if (workspaces.length === 0) {
      loadWorkspaces()
    }

  }, [])

  // 自動載入 quotes（如果還沒載入）
  useEffect(() => {
    if (quotes.length === 0) {
      loadQuotes()
    }

  }, [])

  // 檢查是否為特殊團報價單
  const relatedTour = quote?.tour_id ? tours.find(t => t.id === quote.tour_id) : null
  const isSpecialTour = relatedTour?.status === '特殊團' // 使用中文狀態值
  const isReadOnly = isSpecialTour // 特殊團報價單設為唯讀

  // 計算旅遊團的實際預計人數（從訂單的 member_count 加總）
  const tourPlannedParticipants = useMemo(() => {
    if (!relatedTour) return 0
    const tourOrders = orders.filter(order => order.tour_id === relatedTour.id)
    return tourOrders.reduce((sum, order) => sum + (order.member_count || 0), 0)
  }, [relatedTour, orders])


  const [categories, setCategories] = useState<CostCategory[]>(() => {
    // 注意：空陣列 [] 是 truthy，所以要用 length 檢查
    const initialCategories = (quote?.categories && quote.categories.length > 0)
      ? quote.categories
      : costCategories
    // 確保每個分類的總計都正確計算
    let processedCategories = initialCategories.map(cat => ({
      ...cat,
      total: cat.items.reduce((sum, item) => sum + (item.total || 0), 0),
    }))

    // 修復住宿天數與項目不一致的問題：
    // 如果 accommodation_days > 0 但住宿項目為空，根據天數初始化空的住宿項目
    const savedAccommodationDays = quote?.accommodation_days || 0
    if (savedAccommodationDays > 0) {
      const accommodationCategory = processedCategories.find(cat => cat.id === 'accommodation')
      if (accommodationCategory && accommodationCategory.items.length === 0) {
        const newItems = []
        for (let day = 1; day <= savedAccommodationDays; day++) {
          newItems.push({
            id: `accommodation-day${day}-${Date.now()}-${day}`,
            name: '', // 飯店名稱（待填）
            quantity: 0,
            unit_price: 0,
            total: 0,
            note: '',
            day: day,
            room_type: '',
          })
        }
        accommodationCategory.items = newItems
      }
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

  // 追蹤是否已經載入過砍次表，避免重複載入覆蓋用戶編輯
  const hasLoadedTierPricings = useRef(false)

  // 當 quote 載入後，更新所有狀態
  useEffect(() => {
    if (quote) {
      // 空陣列 [] 是 truthy，所以要用 length 檢查
      if (quote.categories && quote.categories.length > 0) {
        const loadedCategories = quote.categories.map(cat => ({
          ...cat,
          total: cat.items.reduce((sum, item) => sum + (item.total || 0), 0),
        }))
        setCategories(loadedCategories)
      } else {
        // 沒有 categories 或是空陣列，使用預設分類
        // 同時根據 accommodation_days 初始化住宿項目
        const initialCategories = costCategories.map(cat => ({ ...cat, items: [...cat.items] }))
        const savedAccommodationDays = quote.accommodation_days || 0
        if (savedAccommodationDays > 0) {
          const accommodationCategory = initialCategories.find(cat => cat.id === 'accommodation')
          if (accommodationCategory) {
            const newItems = []
            for (let day = 1; day <= savedAccommodationDays; day++) {
              newItems.push({
                id: `accommodation-day${day}-${Date.now()}-${day}`,
                name: '',
                quantity: 0,
                unit_price: 0,
                total: 0,
                note: '',
                day: day,
                room_type: '',
              })
            }
            accommodationCategory.items = newItems
          }
        }
        setCategories(initialCategories)
      }
      if (quote.accommodation_days !== undefined) {
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
        customer_name: quote.customer_name || quote.name || '', // 優先用 customer_name，否則用團體名稱
        contact_person: quote.contact_person || '',
        contact_phone: quote.contact_phone || '',
        contact_address: quote.contact_address || '',
        tour_code: quote.tour_code || relatedTour?.code || '',
        handler_name: quote.handler_name || 'William',
        issue_date: quote.issue_date || getTodayString(),
        received_amount: quote.received_amount || 0,
        expense_description: (quote as typeof quote & { expense_description?: string })?.expense_description || '',
      })
      // 載入砍次表資料（只在第一次載入時執行）
      if (!hasLoadedTierPricings.current) {
        const quoteWithTierPricings = quote as typeof quote & { tier_pricings?: TierPricing[] }
        const savedTierPricings = quoteWithTierPricings.tier_pricings
        if (savedTierPricings && Array.isArray(savedTierPricings)) {
          setTierPricings(savedTierPricings)
        }
        hasLoadedTierPricings.current = true
      }
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
    customer_name: quote?.customer_name || quote?.name || '', // 優先用 customer_name，否則用團體名稱
    contact_person: quote?.contact_person || '',
    contact_phone: quote?.contact_phone || '',
    contact_address: quote?.contact_address || '',
    tour_code: quote?.tour_code || relatedTour?.code || '',
    handler_name: quote?.handler_name || 'William',
    issue_date: quote?.issue_date || getTodayString(),
    received_amount: quote?.received_amount || 0,
    expense_description: (quote as typeof quote & { expense_description?: string })?.expense_description || '',
  })

  // 砍次表狀態 - 從 quote 載入或初始化為空陣列
  const [tierPricings, setTierPricings] = useState<TierPricing[]>(() => {
    const quoteWithTierPricings = quote as typeof quote & { tier_pricings?: TierPricing[] }
    return quoteWithTierPricings?.tier_pricings || []
  })

  // 檢查是否為 404 狀態（資料已載入但找不到對應的 quote）
  const [notFound, setNotFound] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)

  useEffect(() => {
    // 當 quotes 已載入時設定 hasLoaded
    if (quotes.length > 0) {
      setHasLoaded(true)
    }
  }, [quotes.length])

  useEffect(() => {
    // 只有當資料已載入且找不到對應的 quote 時，才設定 notFound
    if (hasLoaded && !quote) {
      setNotFound(true)
    } else if (quote) {
      setNotFound(false)
    }
  }, [quote, hasLoaded])

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
    // 砍次表相關
    tierPricings,
    setTierPricings,
    // 404 狀態
    notFound,
    hasLoaded,
    updateQuote,
    addTour,
    router,
  }
}
