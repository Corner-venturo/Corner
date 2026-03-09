import { getTodayString } from '@/lib/utils/format-date'
import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuotes } from './useQuotes'
import { useToursSlim, useItineraries, useOrdersSlim, createTour } from '@/data'
import { useWorkspaceChannels } from '@/stores/workspace'
import {
  CostCategory,
  ParticipantCounts,
  SellingPrices,
  costCategories,
  TierPricing,
  CostItem,
} from '../types'
import { QuickQuoteItem } from '@/types/quote.types'
import type { FlightInfo } from '@/stores/types/tour.types'
import { QUOTE_HOOKS_LABELS } from '../constants/labels'

export const useQuoteState = () => {
  const params = useParams()
  const router = useRouter()
  const { quotes, updateQuote, loadQuotes } = useQuotes()
  const { items: tours } = useToursSlim()
  const { items: orders } = useOrdersSlim()
  const { workspaces, loadWorkspaces } = useWorkspaceChannels()
  const { items: itineraries } = useItineraries()

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

  // SWR 自動載入行程表

  // 找到關聯的行程表（優先用 itinerary_id，備援用 proposal_package_id）
  const linkedItinerary = useMemo(() => {
    // 1. 優先用 itinerary_id 直接關聯
    if (quote?.itinerary_id) {
      const itinerary = itineraries.find(i => i.id === quote.itinerary_id)
      if (itinerary) return itinerary
    }
    // 2. 備援：用 proposal_package_id 找關聯的行程表
    if (quote?.proposal_package_id) {
      const itinerary = itineraries.find(i => i.proposal_package_id === quote.proposal_package_id)
      if (itinerary) return itinerary
    }
    return null
  }, [quote?.itinerary_id, quote?.proposal_package_id, itineraries])

  // 格式化航班資訊
  const formatFlightInfo = useCallback(
    (flight: FlightInfo | null, type: '去程' | '回程'): string => {
      if (!flight) return ''
      const parts: string[] = []
      if (flight.flightNumber) parts.push(flight.flightNumber)
      if (flight.departureAirport && flight.arrivalAirport) {
        parts.push(`${flight.departureAirport}→${flight.arrivalAirport}`)
      }
      if (flight.departureTime && flight.arrivalTime) {
        parts.push(`${flight.departureTime}-${flight.arrivalTime}`)
      }
      return parts.length > 0 ? `【${type}】${parts.join(' ')}` : ''
    },
    []
  )

  // 追蹤是否已添加過航班資訊，避免重複添加
  const hasAddedFlightInfo = useRef(false)
  const lastQuoteId = useRef<string | null>(null)

  // 當 quote.id 改變時，重置航班添加狀態
  useEffect(() => {
    if (quote_id !== lastQuoteId.current) {
      hasAddedFlightInfo.current = false
      lastQuoteId.current = quote_id
    }
  }, [quote_id])

  const [categories, setCategories] = useState<CostCategory[]>(() => {
    // 注意：空陣列 [] 是 truthy，所以要用 length 檢查
    const initialCategories =
      quote?.categories && quote.categories.length > 0 ? quote.categories : costCategories
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
            quantity: null,
            unit_price: null,
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
                quantity: null,
                unit_price: null,
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
        expense_description:
          (quote as typeof quote & { expense_description?: string })?.expense_description || '',
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
  }, [quote?.id, quote?.updated_at, relatedTour?.code]) // 當 quote.id 或 quote 資料更新時執行

  // 當行程表載入後，自動添加航班資訊到交通類別
  useEffect(() => {
    // 只在以下條件成立時添加航班項目：
    // 1. 有關聯的行程表
    // 2. 行程表有航班資訊
    // 3. 還沒添加過（避免重複）
    // 4. 報價單的交通類別還沒有「機票成人」項目（避免覆蓋用戶已編輯的資料）
    if (!linkedItinerary || hasAddedFlightInfo.current) return

    const outboundFlight = linkedItinerary.outbound_flight as FlightInfo | null
    const returnFlight = linkedItinerary.return_flight as FlightInfo | null

    // 沒有航班資訊，不需要添加
    if (!outboundFlight && !returnFlight) return

    // 檢查交通類別是否已有「機票成人」
    const transportCategory = categories.find(cat => cat.id === 'transport')
    const hasExistingFlightItem = transportCategory?.items.some(item => item.name === '機票成人')

    // 如果已有航班項目，不重複添加
    if (hasExistingFlightItem) {
      hasAddedFlightInfo.current = true
      return
    }

    // 格式化航班備註
    const flightNotes: string[] = []
    const outboundNote = formatFlightInfo(outboundFlight, '去程')
    const returnNote = formatFlightInfo(returnFlight, '回程')
    if (outboundNote) flightNotes.push(outboundNote)
    if (returnNote) flightNotes.push(returnNote)

    if (flightNotes.length === 0) return

    // 創建航班項目
    const flightItem: CostItem = {
      id: `flight-adult-${Date.now()}`,
      name: '機票成人',
      quantity: null, // 不填數量
      unit_price: null, // 不填金額
      total: 0,
      note: flightNotes.join('\n'),
    }

    // 添加到交通類別
    setCategories(prevCategories => {
      return prevCategories.map(cat => {
        if (cat.id === 'transport') {
          return {
            ...cat,
            items: [flightItem, ...cat.items],
          }
        }
        return cat
      })
    })

    hasAddedFlightInfo.current = true
  }, [linkedItinerary, categories, formatFlightInfo])

  // 總人數：直接用報價單設定的人數
  const groupSize =
    participantCounts.adult +
      participantCounts.child_with_bed +
      participantCounts.child_no_bed +
      participantCounts.single_room +
      participantCounts.infant || 1

  // 團體分攤人數（不含嬰兒）：直接用報價單設定的人數
  const groupSizeForGuide =
    participantCounts.adult +
      participantCounts.child_with_bed +
      participantCounts.child_no_bed +
      participantCounts.single_room || 1

  const [quoteName, setQuoteName] = useState<string>(quote?.name || '')
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false)

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
    expense_description:
      (quote as typeof quote & { expense_description?: string })?.expense_description || '',
  })

  // 砍次表狀態 - 從 quote 載入或初始化為空陣列
  const [tierPricings, setTierPricings] = useState<TierPricing[]>(() => {
    const quoteWithTierPricings = quote as typeof quote & { tier_pricings?: TierPricing[] }
    return quoteWithTierPricings?.tier_pricings || []
  })

  // 檢查是否為 404 狀態（資料已載入但找不到對應的 quote）
  const [notFound, setNotFound] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  // 🔧 修復：追蹤是否曾經找到過報價單，避免 SWR 刷新時短暫顯示 404
  const hasFoundQuoteRef = useRef(false)

  useEffect(() => {
    // 當 quotes 已載入時設定 hasLoaded
    if (quotes.length > 0) {
      setHasLoaded(true)
    }
  }, [quotes.length])

  useEffect(() => {
    // 如果找到報價單，記錄下來
    if (quote) {
      hasFoundQuoteRef.current = true
      setNotFound(false)
      return
    }

    // 只有當資料已載入、找不到報價單、且從未找到過時，才設定 notFound
    // 這樣可以避免 SWR 刷新時短暫顯示 404
    if (hasLoaded && !quote && !hasFoundQuoteRef.current) {
      setNotFound(true)
    }
  }, [quote, hasLoaded])

  // 當 quote_id 改變時，重置 hasFoundQuoteRef
  useEffect(() => {
    hasFoundQuoteRef.current = false
    setNotFound(false)
  }, [quote_id])

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
    addTour: createTour,
    router,
  }
}
