'use client'

/**
 * TourConfirmationSheetPage - 團確單頁面
 *
 * 正式的出團確認表，類似 Excel 表格風格
 * 用於交接作業
 */

import React, { useState, useEffect, useRef } from 'react'
import {
  Plus,
  Loader2,
  RefreshCw,
  Check,
  X,
  Download,
  Printer,
  Send,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { CalcInput } from '@/components/ui/calc-input'
import { useToast } from '@/components/ui/use-toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/stores/auth-store'
import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/utils/logger'
import { syncTripToOnline } from '../services/syncToOnline'
import { useTourConfirmationSheet } from '../hooks/useTourConfirmationSheet'
import { ItemEditDialog } from './ItemEditDialog'
import type { Tour, Itinerary, DailyItineraryDay } from '@/stores/types'
import type {
  TourConfirmationItem,
  ConfirmationItemCategory,
  CreateConfirmationItem,
  CostSummary,
  ResourceType,
} from '@/types/tour-confirmation-sheet.types'
import type { Database } from '@/lib/supabase/types'

// tour_requests Row type
type TourRequestRow = Database['public']['Tables']['tour_requests']['Row']

// 新行的初始狀態
const EMPTY_NEW_ITEM = {
  service_date: '',
  service_date_end: '',
  supplier_name: '',
  title: '',
  unit_price: '',
  quantity: '',
  expected_cost: '',
  actual_cost: '',
  notes: '',
}

// 交通子類型
type TransportSubType = 'flight' | 'vehicle' | null

interface TourConfirmationSheetPageProps {
  tour: Tour
}

// 分類配置
const CATEGORIES: { key: ConfirmationItemCategory; label: string }[] = [
  { key: 'transport', label: '交通' },
  { key: 'accommodation', label: '住宿' },
  { key: 'meal', label: '餐食' },
  { key: 'activity', label: '活動' },
  { key: 'other', label: '其他' },
]

export function TourConfirmationSheetPage({ tour }: TourConfirmationSheetPageProps) {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const workspaceId = tour.workspace_id || user?.workspace_id || ''

  const {
    sheet,
    groupedItems,
    costSummary,
    loading,
    saving,
    error,
    createSheet,
    updateSheet,
    addItem,
    updateItem,
    deleteItem,
    reload,
  } = useTourConfirmationSheet({ tourId: tour.id })

  // 預計支出的 local state（用 useRef 確保 blur 時讀取最新值）
  const localExpectedCostsRef = useRef<Record<string, { value: number | null; formula?: string; dirty: boolean }>>({})
  const [, forceUpdate] = useState(0) // 用於觸發重新渲染

  // 處理預計支出的 inline 更新（只在 blur 時儲存到資料庫）
  const handleExpectedCostChange = (itemId: string, value: number | null) => {
    localExpectedCostsRef.current[itemId] = {
      ...localExpectedCostsRef.current[itemId],
      value,
      dirty: true
    }
    forceUpdate(n => n + 1) // 觸發重新渲染以顯示新值
  }

  const handleExpectedCostFormulaChange = (itemId: string, formula: string | undefined) => {
    localExpectedCostsRef.current[itemId] = {
      ...localExpectedCostsRef.current[itemId],
      formula,
      dirty: true
    }
  }

  const handleExpectedCostBlur = async (itemId: string, currentTypeData?: unknown) => {
    const local = localExpectedCostsRef.current[itemId]
    if (!local?.dirty) return // 沒有修改過就不儲存

    try {
      const updates: Record<string, unknown> = { expected_cost: local.value }
      // 如果有公式變更，也一併更新
      if (local.formula !== undefined) {
        updates.type_data = {
          ...((currentTypeData as Record<string, unknown>) || {}),
          expected_cost_formula: local.formula || null // 清空公式時設為 null
        }
      }
      await updateItem(itemId, updates as Parameters<typeof updateItem>[1])
      // 儲存成功，標記為非 dirty（但保留值避免閃爍）
      localExpectedCostsRef.current[itemId] = { ...local, dirty: false }
    } catch (err) {
      logger.error('更新預計支出失敗:', err)
      toast({ title: '更新失敗', variant: 'destructive' })
    }
  }

  // 備註的 local state
  const localNotesRef = useRef<Record<string, { value: string; dirty: boolean }>>({})

  const handleNotesChange = (itemId: string, value: string) => {
    localNotesRef.current[itemId] = { value, dirty: true }
    forceUpdate(n => n + 1)
  }

  const handleNotesBlur = async (itemId: string) => {
    const local = localNotesRef.current[itemId]
    if (!local?.dirty) return

    try {
      await updateItem(itemId, { notes: local.value || null })
      localNotesRef.current[itemId] = { ...local, dirty: false }
    } catch (err) {
      logger.error('更新備註失敗:', err)
      toast({ title: '更新失敗', variant: 'destructive' })
    }
  }

  // 編輯對話框狀態（僅用於編輯現有項目）
  const [editDialog, setEditDialog] = useState<{
    open: boolean
    category: ConfirmationItemCategory
    item: TourConfirmationItem | null
  }>({
    open: false,
    category: 'transport',
    item: null,
  })

  // 幣值轉換相關
  // 機場代碼 / 城市 / 國家 對應幣別
  const DESTINATION_CURRENCY_MAP: Record<string, string> = {
    // 日本
    '日本': 'JPY', 'Japan': 'JPY',
    'NRT': 'JPY', 'HND': 'JPY', 'KIX': 'JPY', 'NGO': 'JPY', 'CTS': 'JPY', 'FUK': 'JPY', 'OKA': 'JPY',
    '東京': 'JPY', '大阪': 'JPY', '京都': 'JPY', '北海道': 'JPY', '沖繩': 'JPY', '名古屋': 'JPY', '福岡': 'JPY',
    // 泰國
    '泰國': 'THB', 'Thailand': 'THB',
    'BKK': 'THB', 'CNX': 'THB', 'HKT': 'THB',
    '曼谷': 'THB', '清邁': 'THB', '普吉': 'THB',
    // 韓國
    '韓國': 'KRW', 'Korea': 'KRW',
    'ICN': 'KRW', 'GMP': 'KRW', 'PUS': 'KRW',
    '首爾': 'KRW', '釜山': 'KRW',
    // 越南
    '越南': 'VND', 'Vietnam': 'VND',
    'SGN': 'VND', 'HAN': 'VND', 'DAD': 'VND',
    '胡志明': 'VND', '河內': 'VND', '峴港': 'VND',
    // 美國
    '美國': 'USD', 'USA': 'USD',
    'LAX': 'USD', 'JFK': 'USD', 'SFO': 'USD',
    // 新加坡
    '新加坡': 'SGD', 'Singapore': 'SGD', 'SIN': 'SGD',
    // 馬來西亞
    '馬來西亞': 'MYR', 'Malaysia': 'MYR', 'KUL': 'MYR',
    // 中國
    '中國': 'CNY', 'China': 'CNY',
    'PVG': 'CNY', 'PEK': 'CNY', 'CAN': 'CNY',
    '上海': 'CNY', '北京': 'CNY', '廣州': 'CNY',
    // 香港
    '香港': 'HKD', 'Hong Kong': 'HKD', 'HKG': 'HKD',
    // 澳門
    '澳門': 'MOP', 'Macau': 'MOP', 'MFM': 'MOP',
    // 歐洲
    '歐洲': 'EUR', 'Europe': 'EUR',
  }

  // 從團的目的地取得幣別
  const getDestinationCurrency = () => {
    // 1. 先從 tour.location 查找
    if (tour.location && DESTINATION_CURRENCY_MAP[tour.location]) {
      return DESTINATION_CURRENCY_MAP[tour.location]
    }
    // 2. 從團號前三碼（機場代碼）查找
    if (tour.code) {
      const airportCode = tour.code.substring(0, 3).toUpperCase()
      if (DESTINATION_CURRENCY_MAP[airportCode]) {
        return DESTINATION_CURRENCY_MAP[airportCode]
      }
    }
    return null
  }
  const destinationCurrency = getDestinationCurrency()

  // 匯率設定對話框
  const [exchangeRateDialog, setExchangeRateDialog] = useState<{
    open: boolean
    itemId: string | null
  }>({ open: false, itemId: null })
  const [exchangeRateInput, setExchangeRateInput] = useState('')

  // 本地匯率狀態（當資料庫欄位不存在時使用）
  const [localExchangeRate, setLocalExchangeRate] = useState<number | null>(null)
  const effectiveExchangeRate = sheet?.exchange_rate ?? localExchangeRate

  // 處理幣值轉換 - 點擊外幣按鈕時，自動用小計除以匯率更新預計支出
  const handleCurrencyConvert = async (itemId: string) => {
    if (!sheet) return

    // 如果還沒設定匯率，打開對話框設定
    if (!effectiveExchangeRate) {
      setExchangeRateDialog({ open: true, itemId })
      return
    }

    // 找到該項目
    const item = Object.values(groupedItems).flat().find(i => i.id === itemId)
    if (!item) return

    // 計算小計（優先用資料庫的 subtotal，否則用 unit_price * quantity）
    const subtotal = item.subtotal ?? ((item.unit_price || 0) * (item.quantity || 1))
    if (subtotal <= 0) {
      toast({ title: '小計為 0，無法換算', variant: 'destructive' })
      return
    }

    // 換算：小計(TWD) / 匯率 = 外幣金額
    const convertedAmount = Math.round(subtotal / effectiveExchangeRate)

    try {
      // 更新預計支出
      await updateItem(itemId, { expected_cost: convertedAmount })

      // 同步更新 localExpectedCostsRef 以確保 UI 立即反映新值
      localExpectedCostsRef.current[itemId] = { value: convertedAmount, dirty: false }
      forceUpdate(n => n + 1)

      toast({
        title: `已更新預計支出`,
        description: `${subtotal.toLocaleString()} TWD ÷ ${effectiveExchangeRate} = ${convertedAmount.toLocaleString()} ${destinationCurrency}`,
      })
    } catch (err) {
      logger.error('更新預計支出失敗:', err)
      toast({ title: '更新失敗', variant: 'destructive' })
    }
  }

  // 儲存匯率設定
  const handleSaveExchangeRate = async () => {
    const rate = parseFloat(exchangeRateInput)
    if (isNaN(rate) || rate <= 0) {
      toast({ title: '請輸入有效的匯率', variant: 'destructive' })
      return
    }

    try {
      await updateSheet({
        exchange_rate: rate,
        foreign_currency: destinationCurrency,
      })
      toast({ title: '匯率設定成功', description: `1 ${destinationCurrency} = ${rate} TWD` })
    } catch (err) {
      // 如果資料庫欄位不存在，改用本地狀態
      logger.warn('無法儲存匯率到資料庫，使用本地狀態:', err)
      setLocalExchangeRate(rate)
      toast({ title: '匯率已設定（本次有效）', description: `1 ${destinationCurrency} = ${rate} TWD` })
    }

    setExchangeRateDialog({ open: false, itemId: null })
    setExchangeRateInput('')

    // 如果有指定項目，執行轉換
    if (exchangeRateDialog.itemId) {
      const item = Object.values(groupedItems).flat().find(i => i.id === exchangeRateDialog.itemId)
      if (item?.expected_cost) {
        const convertedAmount = Math.round(item.expected_cost / rate)
        toast({
          title: `換算結果`,
          description: `${item.expected_cost.toLocaleString()} TWD = ${convertedAmount.toLocaleString()} ${destinationCurrency || '外幣'}`,
        })
      }
    }
  }

  // Inline 新增狀態
  const [addingCategory, setAddingCategory] = useState<ConfirmationItemCategory | null>(null)
  const [newItemData, setNewItemData] = useState(EMPTY_NEW_ITEM)
  const [savingNew, setSavingNew] = useState(false)
  const firstInputRef = useRef<HTMLInputElement>(null)

  // 交通類型選擇狀態
  const [transportSubType, setTransportSubType] = useState<TransportSubType>(null)

  // 手動填寫航班狀態
  const [manualFlightMode, setManualFlightMode] = useState(false)
  const [manualFlight, setManualFlight] = useState({
    outbound: { airline: '', flightNumber: '', departureAirport: '', arrivalAirport: '' },
    return: { airline: '', flightNumber: '', departureAirport: '', arrivalAirport: '' },
  })

  // 行程表資料（用於自動帶入）
  const [itinerary, setItinerary] = useState<Itinerary | null>(null)
  const [itineraryLoading, setItineraryLoading] = useState(false)

  // 需求單資料（用於顯示已送出的需求）
  const [tourRequests, setTourRequests] = useState<TourRequestRow[]>([])
  const [requestsLoading, setRequestsLoading] = useState(false)

  // 報價單項目（用於自動帶入，這是主要資料來源）
  interface QuoteItem {
    category: string
    supplierName: string
    title: string
    serviceDate: string | null
    quantity: number
    resourceType?: string | null
    resourceId?: string | null
    latitude?: number | null
    longitude?: number | null
    googleMapsUrl?: string | null
    quotedPrice?: number | null
  }
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([])
  const [quoteItemsLoading, setQuoteItemsLoading] = useState(false)

  // 訂單和團員資料（用於聯絡人和人數配置）
  interface OrderMember {
    id: string
    chinese_name: string | null
    birth_date: string | null
  }
  interface TourOrder {
    id: string
    code: string
    contact_person: string | null
    contact_phone: string | null
    contact_email: string | null
    members: OrderMember[]
  }
  const [tourOrders, setTourOrders] = useState<TourOrder[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)

  // 房型配置資料（從 tour_rooms 表或報價單取得）
  interface TourRoom {
    id: string
    night_number: number
    hotel_name: string | null
    room_type: string
    room_number: string | null
    amount: number | null
    notes: string | null
  }
  const [tourRooms, setTourRooms] = useState<TourRoom[]>([])

  // 報價單房型資料（從報價單住宿項目取得）
  interface QuoteRoomItem {
    day: number
    room_type: string
    quantity: number
  }
  const [quoteRoomItems, setQuoteRoomItems] = useState<QuoteRoomItem[]>([])

  // 從需求單取得遊覽車資訊
  const vehicleRequests = tourRequests.filter(
    req => req.category === 'vehicle' || req.category === 'transport'
  )

  // 計算人數分組（6歲以下、65歲以上、其他）
  const calculateAgeGroups = () => {
    const allMembers = tourOrders.flatMap(o => o.members)
    const today = new Date()
    const departureDate = tour.departure_date ? new Date(tour.departure_date) : today

    let under6 = 0
    let over65 = 0
    let others = 0

    allMembers.forEach(member => {
      if (!member.birth_date) {
        others++
        return
      }
      const birthDate = new Date(member.birth_date)
      const age = Math.floor((departureDate.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      if (age < 6) {
        under6++
      } else if (age >= 65) {
        over65++
      } else {
        others++
      }
    })

    return { under6, over65, others, total: allMembers.length }
  }

  const ageGroups = calculateAgeGroups()

  // 取得主要聯絡人（第一筆訂單）
  const primaryContact = tourOrders.length > 0 ? tourOrders[0] : null

  // 交接狀態
  const [handingOver, setHandingOver] = useState(false)

  // 每日說明展開狀態
  const [expandedDays, setExpandedDays] = useState<Record<number, boolean>>({})
  // 每日說明文字
  const [dayNotes, setDayNotes] = useState<Record<number, string>>({})

  // 切換說明展開
  const toggleDayNote = (dayIdx: number) => {
    setExpandedDays(prev => ({ ...prev, [dayIdx]: !prev[dayIdx] }))
  }

  // 更新說明文字
  const updateDayNote = (dayIdx: number, note: string) => {
    setDayNotes(prev => ({ ...prev, [dayIdx]: note }))
  }

  // 載入行程表
  useEffect(() => {
    const loadItinerary = async () => {
      if (!tour.id) return
      setItineraryLoading(true)
      try {
        const { data } = await supabase
          .from('itineraries')
          .select('*')
          .eq('tour_id', tour.id)
          .maybeSingle()
        if (data) {
          setItinerary(data as unknown as Itinerary)
        }
      } finally {
        setItineraryLoading(false)
      }
    }
    loadItinerary()
  }, [tour.id])

  // 載入需求單（顯示所有狀態，除了取消的）
  useEffect(() => {
    const loadTourRequests = async () => {
      if (!tour.id) return
      setRequestsLoading(true)
      try {
        const { data } = await supabase
          .from('tour_requests')
          .select('*')
          .eq('tour_id', tour.id)
          .neq('status', 'cancelled')
          .order('service_date')
        if (data) {
          setTourRequests(data)
        }
      } finally {
        setRequestsLoading(false)
      }
    }
    loadTourRequests()
  }, [tour.id])

  // 載入報價單項目（自動帶入的主要資料來源）
  useEffect(() => {
    const loadQuoteItems = async () => {
      if (!tour.quote_id) return
      setQuoteItemsLoading(true)
      try {
        const { data: quote } = await supabase
          .from('quotes')
          .select('categories, start_date')
          .eq('id', tour.quote_id)
          .single()

        if (!quote?.categories) {
          setQuoteItems([])
          return
        }

        const categories = quote.categories as Array<{
          id: string
          items?: Array<{
            name?: string
            day?: number
            quantity?: number | null
            unit_price?: number | null
            is_self_arranged?: boolean
            resource_type?: string | null
            resource_id?: string | null
            resource_latitude?: number | null
            resource_longitude?: number | null
            resource_google_maps_url?: string | null
          }>
        }>

        const startDate = quote.start_date || tour.departure_date
        const calculateDate = (dayNum: number): string | null => {
          if (!startDate) return null
          const date = new Date(startDate)
          date.setDate(date.getDate() + dayNum - 1)
          return date.toISOString().split('T')[0]
        }

        const items: QuoteItem[] = []
        const CATEGORY_MAP: Record<string, string> = {
          'transport': 'transport',
          'group-transport': 'transport',
          'accommodation': 'accommodation',
          'meals': 'meal',
          'activities': 'activity',
          'others': 'other',
        }

        for (const cat of categories) {
          const mappedCategory = CATEGORY_MAP[cat.id]
          if (!mappedCategory || !cat.items) continue

          for (const item of cat.items) {
            if (!item.name) continue
            // 跳過自理項目
            if (item.is_self_arranged || item.name.includes('自理')) continue
            // 跳過身份票種和領隊分攤
            if (['成人', '兒童', '嬰兒', '領隊分攤'].includes(item.name)) continue

            let supplierName = ''
            let title = item.name
            let serviceDate: string | null = null

            if (mappedCategory === 'accommodation') {
              supplierName = item.name
              title = item.name
              if (item.day) serviceDate = calculateDate(item.day)
            } else if (mappedCategory === 'meal') {
              const match = item.name.match(/Day\s*(\d+)\s*(早餐|午餐|晚餐)\s*(?:[：:]|\s*-\s*)\s*(.+)/)
              if (match) {
                const dayNum = parseInt(match[1])
                supplierName = match[3].trim()
                title = match[2]
                serviceDate = calculateDate(dayNum)
              } else {
                supplierName = item.name
              }
            } else if (mappedCategory === 'activity') {
              supplierName = item.name
              title = item.name
              if (item.day) serviceDate = calculateDate(item.day)
            } else {
              supplierName = item.name
              title = item.name
            }

            items.push({
              category: mappedCategory,
              supplierName,
              title,
              serviceDate,
              quantity: item.quantity || 1,
              resourceType: item.resource_type,
              resourceId: item.resource_id,
              latitude: item.resource_latitude,
              longitude: item.resource_longitude,
              googleMapsUrl: item.resource_google_maps_url,
              quotedPrice: item.unit_price,
            })
          }
        }

        setQuoteItems(items)
      } finally {
        setQuoteItemsLoading(false)
      }
    }
    loadQuoteItems()
  }, [tour.quote_id, tour.departure_date])

  // 載入訂單和團員資料
  useEffect(() => {
    const loadOrdersAndMembers = async () => {
      if (!tour.id) return
      setOrdersLoading(true)
      try {
        // 載入訂單
        const { data: orders } = await supabase
          .from('orders')
          .select('id, code, contact_person, contact_phone, contact_email')
          .eq('tour_id', tour.id)
          .order('created_at')

        if (orders && orders.length > 0) {
          // 載入每個訂單的成員
          const ordersWithMembers: TourOrder[] = []
          for (const order of orders) {
            const { data: members } = await supabase
              .from('order_members')
              .select('id, chinese_name, birth_date')
              .eq('order_id', order.id)

            ordersWithMembers.push({
              ...order,
              members: members || [],
            })
          }
          setTourOrders(ordersWithMembers)
        }
      } finally {
        setOrdersLoading(false)
      }
    }
    loadOrdersAndMembers()
  }, [tour.id])

  // 載入房型配置資料
  useEffect(() => {
    const loadTourRooms = async () => {
      if (!tour.id) return
      try {
        const { data } = await supabase
          .from('tour_rooms')
          .select('id, night_number, hotel_name, room_type, room_number, amount, notes')
          .eq('tour_id', tour.id)
          .order('night_number')
          .order('room_type')
        if (data) {
          setTourRooms(data)
        }
      } catch (err) {
        logger.error('載入房型配置失敗:', err)
      }
    }
    loadTourRooms()
  }, [tour.id])

  // 載入報價單房型資料
  useEffect(() => {
    const loadQuoteRoomItems = async () => {
      if (!tour.quote_id) return
      try {
        const { data: quote } = await supabase
          .from('quotes')
          .select('versions')
          .eq('id', tour.quote_id)
          .maybeSingle()

        if (!quote?.versions) return

        // 取得最新版本的 categories
        const versions = quote.versions as Array<{
          categories?: Array<{
            id: string
            name: string
            items?: Array<{
              name?: string // 房型名稱存在 name 欄位（如：雙人房、三人房）
              day?: number
              quantity?: number | null
            }>
          }>
        }>
        if (!versions || versions.length === 0) return

        const latestVersion = versions[versions.length - 1]
        if (!latestVersion?.categories) return

        // 找住宿類別（id 為 'accommodation' 或名稱包含住宿）
        const accommodationCategory = latestVersion.categories.find(
          cat => cat.id === 'accommodation' || cat.name === '住宿'
        )
        if (!accommodationCategory?.items) return

        // 房型名稱存在 item.name 欄位，day 欄位表示第幾天
        const roomItems: QuoteRoomItem[] = accommodationCategory.items
          .filter(item => item.day && item.name)
          .map(item => ({
            day: item.day!,
            room_type: item.name!, // 房型名稱在 name 欄位
            quantity: item.quantity || 1,
          }))

        setQuoteRoomItems(roomItems)
      } catch (err) {
        logger.error('載入報價單房型資料失敗:', err)
      }
    }
    loadQuoteRoomItems()
  }, [tour.quote_id])

  // 當開始新增時，聚焦到第一個輸入框
  useEffect(() => {
    if (addingCategory && firstInputRef.current) {
      firstInputRef.current.focus()
    }
  }, [addingCategory])

  // 注意：不再自動建立或帶入資料
  // 使用者需要在「需求總攬」點擊「產生團確單」來建立/更新團確單

  // 開啟 inline 新增模式
  const handleAdd = (category: ConfirmationItemCategory) => {
    setAddingCategory(category)
    setNewItemData(EMPTY_NEW_ITEM)
    // 交通類別需要先選擇子類型
    if (category === 'transport') {
      setTransportSubType(null)
    }
  }

  // 取消新增
  const handleCancelAdd = () => {
    setAddingCategory(null)
    setNewItemData(EMPTY_NEW_ITEM)
    setTransportSubType(null)
  }

  // 選擇交通子類型
  const handleSelectTransportType = (type: TransportSubType) => {
    setTransportSubType(type)
    if (type === 'flight' && tour.outbound_flight) {
      // 自動帶入航班資訊 - 會創建兩筆（去程+回程）
      // 這裡先不自動填入，讓用戶確認後再創建
    }
  }

  // 從航班資訊創建項目
  const handleAddFlightItems = async () => {
    if (!sheet?.id) return

    setSavingNew(true)
    try {
      // 創建去程航班項目
      if (tour.outbound_flight) {
        const outbound = tour.outbound_flight
        await addItem({
          sheet_id: sheet.id,
          category: 'transport',
          service_date: tour.departure_date || '',
          service_date_end: null,
          day_label: null,
          supplier_name: outbound.airline || '',
          supplier_id: null,
          title: `去程 ${outbound.flightNumber} ${outbound.departureAirport}→${outbound.arrivalAirport}`,
          description: `${outbound.departureAirport} ${outbound.departureTime} → ${outbound.arrivalAirport} ${outbound.arrivalTime}`,
          unit_price: null,
          currency: 'TWD',
          quantity: null,
          subtotal: null,
          expected_cost: null,
          actual_cost: null,
          contact_info: null,
          booking_reference: null,
          booking_status: 'pending',
          type_data: null,
          sort_order: 0,
          notes: outbound.duration || null,
          workspace_id: workspaceId,
        })
      }

      // 創建回程航班項目
      if (tour.return_flight) {
        const returnFlight = tour.return_flight
        await addItem({
          sheet_id: sheet.id,
          category: 'transport',
          service_date: tour.return_date || '',
          service_date_end: null,
          day_label: null,
          supplier_name: returnFlight.airline || '',
          supplier_id: null,
          title: `回程 ${returnFlight.flightNumber} ${returnFlight.departureAirport}→${returnFlight.arrivalAirport}`,
          description: `${returnFlight.departureAirport} ${returnFlight.departureTime} → ${returnFlight.arrivalAirport} ${returnFlight.arrivalTime}`,
          unit_price: null,
          currency: 'TWD',
          quantity: null,
          subtotal: null,
          expected_cost: null,
          actual_cost: null,
          contact_info: null,
          booking_reference: null,
          booking_status: 'pending',
          type_data: null,
          sort_order: 1,
          notes: returnFlight.duration || null,
          workspace_id: workspaceId,
        })
      }

      handleCancelAdd()
    } finally {
      setSavingNew(false)
    }
  }

  // 儲存手動填寫的航班資訊並新增項目
  const handleSaveManualFlight = async () => {
    if (!sheet?.id) return

    setSavingNew(true)
    try {
      // 準備航班資料
      const outboundFlight = manualFlight.outbound.airline ? {
        airline: manualFlight.outbound.airline,
        flightNumber: manualFlight.outbound.flightNumber,
        departureAirport: manualFlight.outbound.departureAirport,
        arrivalAirport: manualFlight.outbound.arrivalAirport,
      } : null

      const returnFlight = manualFlight.return.airline ? {
        airline: manualFlight.return.airline,
        flightNumber: manualFlight.return.flightNumber,
        departureAirport: manualFlight.return.departureAirport,
        arrivalAirport: manualFlight.return.arrivalAirport,
      } : null

      // 更新 tour 的航班資訊
      const { error: updateError } = await supabase
        .from('tours')
        .update({
          outbound_flight: outboundFlight,
          return_flight: returnFlight,
        })
        .eq('id', tour.id)

      if (updateError) throw updateError

      // 新增交通項目
      if (outboundFlight) {
        await addItem({
          sheet_id: sheet.id,
          category: 'transport',
          service_date: tour.departure_date || '',
          service_date_end: null,
          day_label: null,
          supplier_name: outboundFlight.airline,
          supplier_id: null,
          title: `去程 ${outboundFlight.flightNumber} ${outboundFlight.departureAirport}→${outboundFlight.arrivalAirport}`,
          description: null,
          unit_price: null,
          currency: 'TWD',
          quantity: null,
          subtotal: null,
          expected_cost: null,
          actual_cost: null,
          contact_info: null,
          booking_reference: null,
          booking_status: 'pending',
          type_data: null,
          sort_order: 0,
          notes: null,
          workspace_id: workspaceId,
        })
      }

      if (returnFlight) {
        await addItem({
          sheet_id: sheet.id,
          category: 'transport',
          service_date: tour.return_date || '',
          service_date_end: null,
          day_label: null,
          supplier_name: returnFlight.airline,
          supplier_id: null,
          title: `回程 ${returnFlight.flightNumber} ${returnFlight.departureAirport}→${returnFlight.arrivalAirport}`,
          description: null,
          unit_price: null,
          currency: 'TWD',
          quantity: null,
          subtotal: null,
          expected_cost: null,
          actual_cost: null,
          contact_info: null,
          booking_reference: null,
          booking_status: 'pending',
          type_data: null,
          sort_order: 1,
          notes: null,
          workspace_id: workspaceId,
        })
      }

      // 重置狀態
      setManualFlightMode(false)
      setManualFlight({
        outbound: { airline: '', flightNumber: '', departureAirport: '', arrivalAirport: '' },
        return: { airline: '', flightNumber: '', departureAirport: '', arrivalAirport: '' },
      })
      handleCancelAdd()
    } finally {
      setSavingNew(false)
    }
  }

  // 從行程表帶入餐食
  const handleImportMeals = async () => {
    if (!sheet?.id || !itinerary?.daily_itinerary) return

    setSavingNew(true)
    try {
      for (const day of itinerary.daily_itinerary) {
        const meals = day.meals
        const mealTypes = [
          { key: 'breakfast', label: '早餐', value: meals?.breakfast },
          { key: 'lunch', label: '午餐', value: meals?.lunch },
          { key: 'dinner', label: '晚餐', value: meals?.dinner },
        ]

        for (const meal of mealTypes) {
          if (meal.value && meal.value !== '敬請自理' && meal.value !== '機上') {
            await addItem({
              sheet_id: sheet.id,
              category: 'meal',
              service_date: day.date || '',
              service_date_end: null,
              day_label: day.dayLabel || null,
              supplier_name: '',
              supplier_id: null,
              title: `${meal.label}：${meal.value}`,
              description: null,
              unit_price: null,
              currency: 'TWD',
              quantity: null,
              subtotal: null,
              expected_cost: null,
              actual_cost: null,
              contact_info: null,
              booking_reference: null,
              booking_status: 'pending',
              type_data: null,
              sort_order: 0,
              notes: null,
              workspace_id: workspaceId,
            })
          }
        }
      }
      handleCancelAdd()
    } finally {
      setSavingNew(false)
    }
  }

  // 從行程表帶入住宿
  const handleImportAccommodation = async () => {
    if (!sheet?.id || !itinerary?.daily_itinerary) return

    setSavingNew(true)
    try {
      for (const day of itinerary.daily_itinerary) {
        if (day.accommodation && day.accommodation !== '溫暖的家') {
          await addItem({
            sheet_id: sheet.id,
            category: 'accommodation',
            service_date: day.date || '',
            service_date_end: null,
            day_label: day.dayLabel || null,
            supplier_name: day.accommodation,
            supplier_id: null,
            title: day.accommodation,
            description: null,
            unit_price: null,
            currency: 'TWD',
            quantity: null,
            subtotal: null,
            expected_cost: null,
            actual_cost: null,
            contact_info: null,
            booking_reference: null,
            booking_status: 'pending',
            type_data: null,
            sort_order: 0,
            notes: day.accommodationRating ? `${day.accommodationRating}星級` : null,
            workspace_id: workspaceId,
          })
        }
      }
      handleCancelAdd()
    } finally {
      setSavingNew(false)
    }
  }

  // 從行程表帶入景點/活動
  const handleImportActivities = async () => {
    if (!sheet?.id || !itinerary?.daily_itinerary) return

    setSavingNew(true)
    try {
      for (const day of itinerary.daily_itinerary) {
        if (day.activities && day.activities.length > 0) {
          for (const activity of day.activities) {
            // 只帶入有標題的景點
            if (activity.title) {
              await addItem({
                sheet_id: sheet.id,
                category: 'activity',
                service_date: day.date || '',
                service_date_end: null,
                day_label: day.dayLabel || null,
                supplier_name: '',
                supplier_id: null,
                title: activity.title,
                description: activity.description || null,
                unit_price: null,
                currency: 'TWD',
                quantity: null,
                subtotal: null,
                expected_cost: null,
                actual_cost: null,
                contact_info: null,
                booking_reference: null,
                booking_status: 'pending',
                type_data: null,
                sort_order: 0,
                notes: null,
                workspace_id: workspaceId,
              })
            }
          }
        }
      }
      handleCancelAdd()
    } finally {
      setSavingNew(false)
    }
  }

  // 從需求單帶入（包含資源關聯）
  const handleImportFromRequests = async (category: ConfirmationItemCategory) => {
    if (!sheet?.id) return

    // 根據分類過濾需求單
    const categoryMap: Record<ConfirmationItemCategory, string[]> = {
      transport: ['transport', 'vehicle'],
      meal: ['meal', 'restaurant'],
      accommodation: ['accommodation', 'hotel'],
      activity: ['activity', 'attraction'],
      other: ['other'],
    }

    const filteredRequests = tourRequests.filter(
      (req) => categoryMap[category].includes(req.category)
    )

    if (filteredRequests.length === 0) return

    setSavingNew(true)
    try {
      for (const req of filteredRequests) {
        await addItem({
          sheet_id: sheet.id,
          category,
          service_date: req.service_date || '',
          service_date_end: req.service_date_end || null,
          day_label: null,
          supplier_name: req.supplier_name || '',
          supplier_id: req.supplier_id || null,
          title: req.title,
          description: req.description || null,
          unit_price: null,
          currency: req.currency || 'TWD',
          quantity: req.quantity || null,
          subtotal: null,
          expected_cost: req.quoted_cost || req.estimated_cost || null,
          actual_cost: req.final_cost || null,
          contact_info: null,
          booking_reference: null,
          booking_status: req.status === 'confirmed' ? 'confirmed' : 'pending',
          type_data: null,
          sort_order: 0,
          notes: req.notes || null,
          workspace_id: workspaceId,
          // 關聯需求單
          request_id: req.id,
          // 資源關聯（餐廳/飯店/景點）
          resource_type: req.resource_type as ResourceType | null,
          resource_id: req.resource_id || null,
          // GPS 資訊（供領隊導航）
          latitude: req.latitude || null,
          longitude: req.longitude || null,
          google_maps_url: req.google_maps_url || null,
        })
      }
      handleCancelAdd()
    } finally {
      setSavingNew(false)
    }
  }

  // 檢查某分類是否有可帶入的需求單
  const hasRequestsForCategory = (category: ConfirmationItemCategory): boolean => {
    const categoryMap: Record<ConfirmationItemCategory, string[]> = {
      transport: ['transport', 'vehicle'],
      meal: ['meal', 'restaurant'],
      accommodation: ['accommodation', 'hotel'],
      activity: ['activity', 'attraction'],
      other: ['other'],
    }
    return tourRequests.some((req) => categoryMap[category].includes(req.category))
  }

  // 儲存新項目（inline）
  const handleSaveNewItem = async () => {
    if (!sheet?.id || !addingCategory) return

    setSavingNew(true)
    try {
      // 計算標題（車子根據是否有結束日期判斷單日/區間）
      let title = newItemData.title || '新項目'
      const hasDateRange = newItemData.service_date_end && newItemData.service_date_end !== newItemData.service_date
      if (addingCategory === 'transport' && transportSubType === 'vehicle') {
        if (hasDateRange) {
          title = title || '全程用車'
        } else {
          title = title || '單日用車'
        }
      }

      await addItem({
        sheet_id: sheet.id,
        category: addingCategory,
        service_date: newItemData.service_date || '',
        service_date_end: hasDateRange ? newItemData.service_date_end : null,
        day_label: null,
        supplier_name: newItemData.supplier_name || '',
        supplier_id: null,
        title,
        description: null,
        unit_price: newItemData.unit_price ? parseFloat(newItemData.unit_price) : null,
        currency: 'TWD',
        quantity: newItemData.quantity ? parseInt(newItemData.quantity) : null,
        subtotal: null,
        expected_cost: newItemData.expected_cost ? parseFloat(newItemData.expected_cost) : null,
        actual_cost: newItemData.actual_cost ? parseFloat(newItemData.actual_cost) : null,
        contact_info: null,
        booking_reference: null,
        booking_status: 'pending',
        type_data: null,
        sort_order: 0,
        notes: newItemData.notes || null,
        workspace_id: workspaceId,
      })
      handleCancelAdd()
    } finally {
      setSavingNew(false)
    }
  }

  // 更新新行欄位
  const handleNewItemChange = (field: keyof typeof EMPTY_NEW_ITEM, value: string) => {
    setNewItemData(prev => ({ ...prev, [field]: value }))
  }

  // 開啟編輯對話框
  const handleEdit = (item: TourConfirmationItem) => {
    setEditDialog({
      open: true,
      category: item.category as ConfirmationItemCategory,
      item,
    })
  }

  // 儲存編輯的項目（Dialog 模式）
  const handleSave = async (data: CreateConfirmationItem) => {
    if (editDialog.item) {
      await updateItem(editDialog.item.id, data)
    }
    setEditDialog({ open: false, category: 'transport', item: null })
  }

  // 刪除項目
  const handleDelete = async (itemId: string) => {
    if (confirm('確定要刪除此項目嗎？')) {
      await deleteItem(itemId)
    }
  }

  // 格式化金額
  const formatCurrency = (value: number | null | undefined) => {
    if (value == null) return '-'
    return new Intl.NumberFormat('zh-TW').format(value)
  }

  // 格式化日期
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('zh-TW', {
      month: '2-digit',
      day: '2-digit',
    })
  }

  // Loading 狀態
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-morandi-secondary" size={32} />
      </div>
    )
  }

  // 錯誤狀態
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-morandi-red">
        <p>載入失敗：{error}</p>
        <Button variant="outline" onClick={reload} className="mt-4 gap-2">
          <RefreshCw size={16} />
          重新載入
        </Button>
      </div>
    )
  }

  // 缺少 workspace_id
  if (!workspaceId) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-morandi-secondary">
        <p>無法取得工作空間資訊，請重新登入</p>
      </div>
    )
  }

  // 列印功能
  const handlePrint = () => {
    window.print()
  }

  // 計算未完成的需求數量
  const incompleteRequests = tourRequests.filter(
    req => req.status !== 'confirmed' && req.status !== 'replied'
  )

  // 檢查是否已設定領隊
  const hasLeader = sheet?.tour_leader_name && sheet.tour_leader_name.trim() !== ''

  // 交接功能
  const handleHandoff = async () => {
    if (incompleteRequests.length > 0) return

    // 檢查領隊
    if (!hasLeader) {
      const proceed = window.confirm(
        '⚠️ 尚未設定領隊\n\n' +
        '如果此團需要領隊，請先在上方填寫領隊姓名。\n' +
        '如果此團不需要領隊（如包車），可以繼續交接。\n\n' +
        '確定要繼續交接嗎？'
      )
      if (!proceed) return
    }

    setHandingOver(true)
    try {
      // 1. 更新確認表狀態為已交接
      if (sheet) {
        const { error: sheetError } = await supabase
          .from('tour_confirmation_sheets')
          .update({
            status: 'completed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', sheet.id)

        if (sheetError) throw sheetError
      }

      // 2. 同步行程到 Online
      const syncResult = await syncTripToOnline(tour.id)
      if (!syncResult.success) {
        logger.warn('同步到 Online 失敗:', syncResult.message)
      }

      // 3. 顯示成功訊息
      alert('交接完成！\n\n確認單狀態已更新。\n行程已同步到 Online App。')
      reload()
    } catch (error) {
      logger.error('交接失敗:', error)
      alert('交接失敗，請稍後再試')
    } finally {
      setHandingOver(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* 工具列 - 列印時隱藏 */}
      <div className="flex items-center justify-between print:hidden">
        <div className="text-sm text-morandi-secondary">
          {tour.code} {tour.name} | {tour.departure_date} ~ {tour.return_date}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="gap-2"
          >
            <Printer size={16} />
            列印
          </Button>

          {/* 確認交接按鈕 */}
          {incompleteRequests.length > 0 ? (
            <Button
              variant="outline"
              size="sm"
              disabled
              className="gap-2 text-morandi-secondary"
              title={`尚有 ${incompleteRequests.length} 項需求未完成`}
            >
              <AlertCircle size={16} />
              尚有 {incompleteRequests.length} 項待處理
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={handleHandoff}
              disabled={handingOver}
              className="gap-2 bg-morandi-green hover:bg-morandi-green/90"
            >
              {handingOver ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
              確認交接
            </Button>
          )}
        </div>
      </div>

      {/* 列印時顯示的標題 */}
      <div className="hidden print:block print:mb-4">
        <h1 className="text-xl font-bold text-center mb-2">團體確認單</h1>
        <div className="text-center text-sm">
          <p className="font-medium">{tour.code} {tour.name}</p>
          <p>出發日期：{tour.departure_date} ~ {tour.return_date}</p>
        </div>
      </div>

      {/* 團基本資訊 */}
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <tbody>
            {/* 團名 / 團號 */}
            <tr className="border-b border-border">
              <td className="px-4 py-2 bg-morandi-container/30 text-morandi-secondary font-medium w-[100px]">團名</td>
              <td className="px-4 py-2 w-[40%]">{tour.name || '-'}</td>
              <td className="px-4 py-2 bg-morandi-container/30 text-morandi-secondary font-medium w-[100px]">團號</td>
              <td className="px-4 py-2">{tour.code || '-'}</td>
            </tr>
            {/* 出團日期 / 隨團領隊 */}
            <tr className="border-b border-border">
              <td className="px-4 py-2 bg-morandi-container/30 text-morandi-secondary font-medium">出團日期</td>
              <td className="px-4 py-2 w-[40%]">
                {tour.departure_date && tour.return_date
                  ? `${tour.departure_date} ~ ${tour.return_date}`
                  : tour.departure_date || '-'}
              </td>
              <td className="px-4 py-2 bg-morandi-container/30 text-morandi-secondary font-medium w-[100px]">隨團領隊</td>
              <td className="px-4 py-2">{sheet?.tour_leader_name || '-'}</td>
            </tr>
            {/* 聯絡人+航班（去程） */}
            {(() => {
              const outbound = itinerary?.outbound_flight || tour.outbound_flight
              const returnFlight = itinerary?.return_flight || tour.return_flight
              const formatFlightDate = (dateStr: string | null | undefined) => {
                if (!dateStr) return ''
                const date = new Date(dateStr)
                return `${date.getMonth() + 1}/${String(date.getDate()).padStart(2, '0')}`
              }
              const outboundFlight = outbound && typeof outbound === 'object' ? outbound as { airline?: string; flightNumber?: string; departureAirport?: string; arrivalAirport?: string; departureTime?: string; arrivalTime?: string } : null
              const returnFlightData = returnFlight && typeof returnFlight === 'object' ? returnFlight as { airline?: string; flightNumber?: string; departureAirport?: string; arrivalAirport?: string; departureTime?: string; arrivalTime?: string } : null

              return (
                <>
                  <tr className="border-b border-border">
                    <td className="px-4 py-2 bg-morandi-container/30 text-morandi-secondary font-medium">聯絡人</td>
                    <td className="px-4 py-2">{primaryContact?.contact_person || '-'}</td>
                    <td className="px-4 py-2 bg-morandi-container/30 text-morandi-secondary font-medium w-[60px]">
                      <span className="text-morandi-green">去程</span>
                    </td>
                    <td className="px-4 py-2">
                      {outboundFlight?.flightNumber
                        ? `${formatFlightDate(tour.departure_date)} ${outboundFlight.airline} ${outboundFlight.flightNumber} ${outboundFlight.departureAirport} ${outboundFlight.departureTime} → ${outboundFlight.arrivalAirport} ${outboundFlight.arrivalTime}`
                        : '-'}
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-4 py-2 bg-morandi-container/30 text-morandi-secondary font-medium">聯絡電話</td>
                    <td className="px-4 py-2">{primaryContact?.contact_phone || '-'}</td>
                    <td className="px-4 py-2 bg-morandi-container/30 text-morandi-secondary font-medium">
                      <span className="text-morandi-gold">回程</span>
                    </td>
                    <td className="px-4 py-2">
                      {returnFlightData?.flightNumber
                        ? `${formatFlightDate(tour.return_date)} ${returnFlightData.airline} ${returnFlightData.flightNumber} ${returnFlightData.departureAirport} ${returnFlightData.departureTime} → ${returnFlightData.arrivalAirport} ${returnFlightData.arrivalTime}`
                        : '-'}
                    </td>
                  </tr>
                </>
              )
            })()}
            {/* 人數配置 */}
            <tr className="border-b border-border">
              <td className="px-4 py-2 bg-morandi-container/30 text-morandi-secondary font-medium">團體人數</td>
              <td className="px-4 py-2" colSpan={3}>
                <div className="flex items-center gap-6">
                  <span className="font-medium">{ageGroups.total} 人</span>
                  <span className="text-morandi-secondary">
                    <span className="text-morandi-green">6歲以下：{ageGroups.under6}</span>
                    <span className="mx-2">|</span>
                    <span className="text-morandi-gold">65歲以上：{ageGroups.over65}</span>
                    <span className="mx-2">|</span>
                    <span>一般：{ageGroups.others}</span>
                  </span>
                </div>
              </td>
            </tr>
            {/* 交通（有資料才顯示） */}
            {vehicleRequests.length > 0 && (
              <tr>
                <td className="px-4 py-2 bg-morandi-container/30 text-morandi-secondary font-medium align-top w-[100px]">交通</td>
                <td colSpan={3}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-morandi-container/20">
                        <th className="px-3 py-1.5 text-left font-medium text-morandi-secondary w-[180px]">公司名稱</th>
                        <th className="px-3 py-1.5 text-left font-medium text-morandi-secondary w-[100px]">司機</th>
                        <th className="px-3 py-1.5 text-left font-medium text-morandi-secondary w-[120px]">車號</th>
                        <th className="px-3 py-1.5 text-left font-medium text-morandi-secondary">手機電話</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vehicleRequests.map((req, idx) => {
                        const reqAny = req as TourRequestRow & {
                          driver_name?: string | null
                          plate_number?: string | null
                          driver_phone?: string | null
                        }
                        return (
                          <tr key={req.id} className={idx % 2 === 1 ? 'bg-morandi-container/5' : ''}>
                            <td className="px-3 py-1.5">{req.supplier_name || '-'}</td>
                            <td className="px-3 py-1.5">{reqAny.driver_name || '-'}</td>
                            <td className="px-3 py-1.5">{reqAny.plate_number || '-'}</td>
                            <td className="px-3 py-1.5">{reqAny.driver_phone || '-'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 每日行程表 */}
      {itinerary?.daily_itinerary && itinerary.daily_itinerary.length > 0 && (
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2 bg-morandi-gold text-white">
            <span className="font-medium">每日行程</span>
            <span className="text-white/80 text-sm">({itinerary.daily_itinerary.length} 天)</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-morandi-container/50 border-b border-border">
                <th className="px-3 py-2 text-left font-medium text-morandi-primary w-[80px]">日期</th>
                <th className="px-3 py-2 text-left font-medium text-morandi-primary">行程</th>
              </tr>
            </thead>
            <tbody>
              {itinerary.daily_itinerary.map((day, idx) => {
                const isExpanded = expandedDays[idx]
                const noteText = dayNotes[idx] || ''

                // 組合行程字串
                const itineraryStr = day.activities && day.activities.length > 0
                  ? `${day.dayLabel}｜${day.activities.map(a => a.title).filter(Boolean).join(' > ')}`
                  : `${day.dayLabel}｜${day.title || ''}`

                return (
                  <React.Fragment key={idx}>
                    {/* 第一行：日期 + 行程 */}
                    <tr className="border-t border-border/50 bg-card hover:bg-morandi-container/10">
                      <td className="px-3 py-2 align-top">
                        <div className="text-sm font-medium text-morandi-primary">{day.date}</div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="text-morandi-primary">{itineraryStr}</div>
                      </td>
                    </tr>
                    {/* 第二行：[+] 按鈕 + 餐食住宿（固定欄位間距） */}
                    <tr className="border-t border-border/30 bg-morandi-container/5">
                      <td className="px-3 py-2 align-top">
                        <button
                          onClick={() => toggleDayNote(idx)}
                          className="flex items-center gap-1 text-xs text-morandi-gold hover:text-morandi-gold-hover"
                          title={isExpanded ? '收起說明' : '新增說明'}
                        >
                          <Plus size={14} className={`transition-transform ${isExpanded ? 'rotate-45' : ''}`} />
                          說明
                        </button>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex text-sm text-morandi-secondary">
                          <span className="w-[150px] flex items-center">
                            早：{day.meals?.breakfast || 'X'}
                            {day.meals?.breakfast === '飯店早餐' && (
                              <Check size={14} className="ml-1 text-morandi-green/40" />
                            )}
                          </span>
                          <span className="w-[150px] flex items-center">
                            午：{day.meals?.lunch || 'X'}
                          </span>
                          <span className="w-[150px] flex items-center">
                            晚：{day.meals?.dinner || 'X'}
                          </span>
                          {day.accommodation && day.accommodation !== '溫暖的家' && (
                            <span className="flex-1 flex items-center">
                              住：{day.accommodation}
                              {(day.isSameAccommodation || day.accommodation.includes('同上')) && (
                                <Check size={14} className="ml-1 text-morandi-green/40" />
                              )}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                    {/* 第三行：說明（展開時顯示） */}
                    {isExpanded && (
                      <tr className="border-t border-border/30 bg-morandi-gold/5">
                        <td className="px-3 py-2 align-top">
                          <span className="text-xs text-morandi-secondary">備註</span>
                        </td>
                        <td className="px-3 py-2">
                          <textarea
                            value={noteText}
                            onChange={(e) => updateDayNote(idx, e.target.value)}
                            placeholder="輸入說明文字，例如：提醒客戶帶護照..."
                            className="w-full px-2 py-1.5 text-sm border border-border rounded bg-card focus:outline-none focus:ring-2 focus:ring-morandi-gold/50 resize-none"
                            rows={2}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 飯店確認 */}
      {(() => {
        // 從行程表取得每天的住宿資訊
        if (!itinerary?.daily_itinerary || itinerary.daily_itinerary.length === 0) {
          return null
        }

        // 建立每晚住宿清單（排除最後一天和「溫暖的家」）
        const nightlyAccommodations: Array<{
          nightNumber: number
          date: string
          dayLabel: string
          hotelName: string
          isSameAsPrevious: boolean
        }> = []

        itinerary.daily_itinerary.forEach((day, idx) => {
          // 最後一天通常不住宿
          if (idx === itinerary.daily_itinerary.length - 1) return
          if (!day.accommodation || day.accommodation === '溫暖的家') return

          const isSame = day.isSameAccommodation || day.accommodation.includes('同上')
          // 提取實際飯店名稱（去掉「同上」前綴）
          let hotelName = day.accommodation
          if (isSame && day.accommodation.includes('(')) {
            hotelName = day.accommodation.replace(/同上\s*\(([^)]+)\)/, '$1').trim()
          }

          nightlyAccommodations.push({
            nightNumber: idx + 1,
            date: day.date || '',
            dayLabel: day.dayLabel || `Day ${idx + 1}`,
            hotelName: hotelName,
            isSameAsPrevious: isSame,
          })
        })

        if (nightlyAccommodations.length === 0) {
          return null
        }

        // 從需求單取得住宿確認狀態
        const accommodationRequests = tourRequests.filter(
          req => req.category === 'accommodation' || req.category === 'hotel'
        )

        // 取得每晚的房型配置（優先使用報價單，其次使用 tour_rooms）
        const getRoomTypesForNight = (nightNumber: number) => {
          // 優先從報價單取得房型
          const quoteRooms = quoteRoomItems.filter(r => r.day === nightNumber)
          if (quoteRooms.length > 0) {
            return quoteRooms
              .map(r => `${r.room_type} x${r.quantity}`)
              .join('、')
          }

          // 其次從 tour_rooms 表取得
          const rooms = tourRooms.filter(r => r.night_number === nightNumber)
          if (rooms.length === 0) return '-'
          // 統計各房型數量
          const roomCounts: Record<string, number> = {}
          rooms.forEach(r => {
            const type = r.room_type || '未指定'
            roomCounts[type] = (roomCounts[type] || 0) + 1
          })
          return Object.entries(roomCounts)
            .map(([type, count]) => `${type} x${count}`)
            .join('、')
        }

        // 取得飯店的確認狀態
        const getHotelStatus = (hotelName: string) => {
          const req = accommodationRequests.find(r =>
            r.supplier_name?.includes(hotelName) || r.title?.includes(hotelName)
          )
          if (!req) return { status: 'pending', label: '待確認', color: 'bg-morandi-gold/20 text-morandi-gold' }
          if (req.status === 'confirmed') return { status: 'confirmed', label: '已確認', color: 'bg-morandi-green/20 text-morandi-green' }
          if (req.status === 'replied') return { status: 'replied', label: '已回覆', color: 'bg-morandi-container text-morandi-primary' }
          return { status: 'pending', label: '待確認', color: 'bg-morandi-gold/20 text-morandi-gold' }
        }

        return (
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-morandi-primary text-white">
              <div className="flex items-center gap-2">
                <span className="font-medium">飯店確認</span>
                <span className="text-white/80 text-sm">({nightlyAccommodations.length} 晚)</span>
              </div>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-morandi-container/50 border-b border-border">
                  <th className="px-3 py-2 text-left font-medium text-morandi-primary w-[80px]">日期</th>
                  <th className="px-3 py-2 text-left font-medium text-morandi-primary">飯店名稱</th>
                  <th className="px-3 py-2 text-left font-medium text-morandi-primary w-[200px]">房型配置</th>
                  <th className="px-3 py-2 text-left font-medium text-morandi-primary w-[80px]">狀態</th>
                </tr>
              </thead>
              <tbody>
                {nightlyAccommodations.map((night, idx) => {
                  const status = getHotelStatus(night.hotelName)
                  const roomTypes = getRoomTypesForNight(night.nightNumber)
                  return (
                    <tr key={idx} className={`border-t border-border/50 hover:bg-morandi-container/10 ${idx % 2 === 1 ? 'bg-morandi-container/5' : ''}`}>
                      <td className="px-3 py-2 text-morandi-secondary">{night.date}</td>
                      <td className="px-3 py-2">
                        <span className="font-medium">{night.hotelName}</span>
                        {night.isSameAsPrevious && (
                          <span className="ml-2 text-xs text-morandi-secondary">(續住)</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-morandi-secondary">{roomTypes}</td>
                      <td className="px-3 py-2">
                        <span className={`px-1.5 py-0.5 rounded text-xs ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      })()}

      {/* 統一表格 */}
      <div className="border border-border rounded-lg overflow-hidden print:border-black print:rounded-none">
        <table className="w-full text-sm table-fixed">
          {/* 表頭 */}
          <thead>
            <tr className="bg-morandi-container/50 border-b border-border">
              <th className="px-2 py-2 text-left font-medium text-morandi-primary w-[4%] border-r border-border/30">分類</th>
              <th className="px-1 py-2 text-left font-medium text-morandi-primary w-[5%] border-r border-border/30">日期</th>
              <th className="px-2 py-2 text-left font-medium text-morandi-primary w-[12%] border-r border-border/30">供應商</th>
              <th className="px-2 py-2 text-left font-medium text-morandi-primary border-r border-border/30">項目說明</th>
              <th className="px-1 py-2 text-right font-medium text-morandi-primary w-[6%] border-r border-border/30">單價</th>
              <th className="px-1 py-2 text-center font-medium text-morandi-primary w-[4%] border-r border-border/30">數量</th>
              <th className="px-1 py-2 text-right font-medium text-morandi-primary w-[6%] border-r border-border/30">小計</th>
              <th className="px-1 py-2 text-right font-medium text-morandi-primary w-[7%] border-r border-border/30">預計支出</th>
              <th className="px-1 py-2 text-right font-medium text-morandi-primary w-[7%] border-r border-border/30">實際支出</th>
              <th className="px-2 py-2 text-left font-medium text-morandi-primary w-[28%]">備註</th>
            </tr>
          </thead>
          <tbody>
            {CATEGORIES.map((cat) => {
              const items = groupedItems[cat.key]

              // 判斷是否可從行程表帶入
              const canImport = itinerary?.daily_itinerary && itinerary.daily_itinerary.length > 0
              const getImportHandler = () => {
                if (cat.key === 'meal') return handleImportMeals
                if (cat.key === 'accommodation') return handleImportAccommodation
                if (cat.key === 'activity') return handleImportActivities
                return null
              }
              const importHandler = getImportHandler()

              return (
                <React.Fragment key={cat.key}>
                  {/* 分類標題行 */}
                  <tr className="bg-morandi-container/30 border-t border-border print:hidden">
                    <td colSpan={9} className="px-3 py-1.5">
                      <span className="font-medium text-morandi-primary">{cat.label}</span>
                      <span className="ml-2 text-xs text-morandi-secondary">({items.length})</span>
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAdd(cat.key)}
                        className="h-6 px-2 text-xs text-morandi-gold hover:text-morandi-gold-hover"
                      >
                        <Plus size={12} className="mr-1" />
                        新增
                      </Button>
                    </td>
                  </tr>
                  <tr className="bg-morandi-container/30 border-t border-border hidden print:table-row">
                    <td colSpan={10} className="px-3 py-1.5">
                      <span className="font-medium text-morandi-primary">{cat.label}</span>
                      <span className="ml-2 text-xs text-morandi-secondary">({items.length})</span>
                    </td>
                  </tr>
                  {/* 項目列表 */}
                  {items.length === 0 && addingCategory !== cat.key ? (
                    <tr className="border-t border-border/50">
                      <td colSpan={10} className="px-3 py-3 text-center text-morandi-secondary text-xs">
                        尚無{cat.label}項目
                      </td>
                    </tr>
                  ) : (
                    items.map((item, idx) => {
                      // 優先使用資料庫的 subtotal，否則計算
                      const subtotal = item.subtotal ?? ((item.unit_price || 0) * (item.quantity || 0))
                      return (
                        <tr
                          key={item.id}
                          className={`border-t border-border/50 hover:bg-morandi-container/10 ${
                            idx % 2 === 1 ? 'bg-morandi-container/5' : ''
                          }`}
                        >
                          <td className="px-2 py-2 text-morandi-secondary text-xs border-r border-border/30">{cat.label}</td>
                          <td className="px-1 py-2 text-xs border-r border-border/30">{formatDate(item.service_date)}</td>
                          <td className="px-2 py-2 text-sm border-r border-border/30">{item.supplier_name}</td>
                          <td className="px-2 py-2 text-sm border-r border-border/30">{item.title}</td>
                          <td className="px-2 py-2 text-right font-mono text-sm border-r border-border/30">{item.unit_price ? formatCurrency(item.unit_price) : '-'}</td>
                          <td className="px-2 py-2 text-center text-sm border-r border-border/30">{item.quantity || '-'}</td>
                          <td className="px-2 py-2 text-right font-mono text-sm border-r border-border/30">{subtotal > 0 ? formatCurrency(subtotal) : '-'}</td>
                          <td className="px-1 py-1 border-r border-border/30 print:hidden">
                            <CalcInput
                              value={item.id in localExpectedCostsRef.current ? localExpectedCostsRef.current[item.id].value : item.expected_cost}
                              onChange={(val) => handleExpectedCostChange(item.id, val)}
                              formula={localExpectedCostsRef.current[item.id]?.formula ?? (item.type_data as unknown as { expected_cost_formula?: string } | null)?.expected_cost_formula}
                              onFormulaChange={(f) => handleExpectedCostFormulaChange(item.id, f)}
                              onBlur={() => handleExpectedCostBlur(item.id, item.type_data)}
                              className="w-full h-7 px-2 py-1 text-sm text-right font-mono bg-transparent border border-transparent hover:border-border focus:border-morandi-gold focus:ring-1 focus:ring-morandi-gold/30 rounded outline-none"
                              placeholder="-"
                            />
                          </td>
                          <td className="px-2 py-2 text-right font-mono text-sm border-r border-border/30 hidden print:table-cell">{item.expected_cost ? formatCurrency(item.expected_cost) : '-'}</td>
                          <td className="px-2 py-2 text-right font-mono text-sm border-r border-border/30">{item.actual_cost ? formatCurrency(item.actual_cost) : '-'}</td>
                          <td className="px-1 py-1 print:hidden">
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={item.id in localNotesRef.current ? localNotesRef.current[item.id].value : (item.notes || '')}
                                onChange={(e) => handleNotesChange(item.id, e.target.value)}
                                onBlur={() => handleNotesBlur(item.id)}
                                className="flex-1 h-7 px-2 py-1 text-xs bg-transparent border border-transparent hover:border-border focus:border-morandi-gold focus:ring-1 focus:ring-morandi-gold/30 rounded outline-none"
                                placeholder="備註..."
                              />
                              {destinationCurrency && (item.subtotal || (item.unit_price && item.quantity)) ? (
                                <button
                                  type="button"
                                  className="h-6 px-1.5 text-xs text-morandi-gold hover:text-morandi-gold-hover hover:bg-morandi-gold/10 rounded shrink-0"
                                  onClick={() => handleCurrencyConvert(item.id)}
                                >
                                  {destinationCurrency}
                                </button>
                              ) : null}
                            </div>
                          </td>
                          <td className="px-2 py-2 text-xs text-morandi-secondary hidden print:table-cell">
                            {item.notes || '-'}
                          </td>
                        </tr>
                      )
                    })
                  )}

                  {/* Inline 新增行 - 交通類別：下拉選單選類型 */}
                  {addingCategory === cat.key && cat.key === 'transport' && (
                    <tr className="border-t border-border/50 bg-morandi-gold/10">
                      {/* 分類欄位：下拉選單 */}
                      <td className="px-3 py-2 border-r border-border/30">
                        <select
                          value={transportSubType || ''}
                          onChange={(e) => handleSelectTransportType(e.target.value as TransportSubType)}
                          className="text-sm bg-transparent border-0 outline-none cursor-pointer -ml-1"
                          style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none', paddingRight: '16px', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%238b8680\' stroke-width=\'2\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right center' }}
                        >
                          <option value="">選擇</option>
                          <option value="flight">航班</option>
                          <option value="vehicle">車子</option>
                        </select>
                      </td>
                      {/* 未選擇類型：只顯示取消按鈕 */}
                      {!transportSubType && (
                        <>
                          <td colSpan={8} className="px-3 py-2"></td>
                          <td className="px-2 py-2 text-right">
                            <button
                              onClick={() => { setAddingCategory(null); setTransportSubType(null) }}
                              className="text-morandi-red hover:underline text-xs"
                            >
                              取消
                            </button>
                          </td>
                        </>
                      )}
                      {/* 航班：顯示帶入按鈕或手動填寫 */}
                      {transportSubType === 'flight' && (
                        <>
                          <td colSpan={8} className="px-4 py-2">
                            {tour.outbound_flight || tour.return_flight ? (
                              // 有航班資訊：顯示並確認帶入
                              <div className="flex items-center gap-4">
                                <div className="text-sm space-x-4">
                                  {tour.outbound_flight && (
                                    <span>
                                      <span className="text-morandi-green">去程</span> {tour.outbound_flight.airline} {tour.outbound_flight.flightNumber} {tour.outbound_flight.departureAirport}→{tour.outbound_flight.arrivalAirport}
                                    </span>
                                  )}
                                  {tour.return_flight && (
                                    <span>
                                      <span className="text-morandi-gold">回程</span> {tour.return_flight.airline} {tour.return_flight.flightNumber} {tour.return_flight.departureAirport}→{tour.return_flight.arrivalAirport}
                                    </span>
                                  )}
                                </div>
                                <button
                                  onClick={handleAddFlightItems}
                                  disabled={savingNew}
                                  className="px-3 py-1 text-xs font-medium text-white bg-morandi-gold hover:bg-morandi-gold-hover rounded disabled:opacity-50"
                                >
                                  {savingNew ? '新增中...' : '確認帶入'}
                                </button>
                                <button
                                  onClick={() => { setAddingCategory(null); setTransportSubType(null) }}
                                  className="text-morandi-red hover:underline text-xs"
                                >
                                  取消
                                </button>
                              </div>
                            ) : manualFlightMode ? (
                              // 手動填寫模式
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="text-morandi-green font-medium w-10">去程</span>
                                  <input
                                    placeholder="航空"
                                    value={manualFlight.outbound.airline}
                                    onChange={(e) => setManualFlight(prev => ({ ...prev, outbound: { ...prev.outbound, airline: e.target.value } }))}
                                    className="w-20 px-2 py-1 border border-border rounded text-sm"
                                  />
                                  <input
                                    placeholder="航班"
                                    value={manualFlight.outbound.flightNumber}
                                    onChange={(e) => setManualFlight(prev => ({ ...prev, outbound: { ...prev.outbound, flightNumber: e.target.value } }))}
                                    className="w-20 px-2 py-1 border border-border rounded text-sm"
                                  />
                                  <input
                                    placeholder="起飛"
                                    value={manualFlight.outbound.departureAirport}
                                    onChange={(e) => setManualFlight(prev => ({ ...prev, outbound: { ...prev.outbound, departureAirport: e.target.value } }))}
                                    className="w-16 px-2 py-1 border border-border rounded text-sm"
                                  />
                                  <span>→</span>
                                  <input
                                    placeholder="抵達"
                                    value={manualFlight.outbound.arrivalAirport}
                                    onChange={(e) => setManualFlight(prev => ({ ...prev, outbound: { ...prev.outbound, arrivalAirport: e.target.value } }))}
                                    className="w-16 px-2 py-1 border border-border rounded text-sm"
                                  />
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="text-morandi-gold font-medium w-10">回程</span>
                                  <input
                                    placeholder="航空"
                                    value={manualFlight.return.airline}
                                    onChange={(e) => setManualFlight(prev => ({ ...prev, return: { ...prev.return, airline: e.target.value } }))}
                                    className="w-20 px-2 py-1 border border-border rounded text-sm"
                                  />
                                  <input
                                    placeholder="航班"
                                    value={manualFlight.return.flightNumber}
                                    onChange={(e) => setManualFlight(prev => ({ ...prev, return: { ...prev.return, flightNumber: e.target.value } }))}
                                    className="w-20 px-2 py-1 border border-border rounded text-sm"
                                  />
                                  <input
                                    placeholder="起飛"
                                    value={manualFlight.return.departureAirport}
                                    onChange={(e) => setManualFlight(prev => ({ ...prev, return: { ...prev.return, departureAirport: e.target.value } }))}
                                    className="w-16 px-2 py-1 border border-border rounded text-sm"
                                  />
                                  <span>→</span>
                                  <input
                                    placeholder="抵達"
                                    value={manualFlight.return.arrivalAirport}
                                    onChange={(e) => setManualFlight(prev => ({ ...prev, return: { ...prev.return, arrivalAirport: e.target.value } }))}
                                    className="w-16 px-2 py-1 border border-border rounded text-sm"
                                  />
                                </div>
                                <div className="flex items-center gap-2 pt-1">
                                  <button
                                    onClick={handleSaveManualFlight}
                                    disabled={savingNew || (!manualFlight.outbound.airline && !manualFlight.return.airline)}
                                    className="px-3 py-1 text-xs font-medium text-white bg-morandi-gold hover:bg-morandi-gold-hover rounded disabled:opacity-50"
                                  >
                                    {savingNew ? '儲存中...' : '確認儲存'}
                                  </button>
                                  <button
                                    onClick={() => { setManualFlightMode(false); setAddingCategory(null); setTransportSubType(null) }}
                                    className="text-morandi-red hover:underline text-xs"
                                  >
                                    取消
                                  </button>
                                </div>
                              </div>
                            ) : (
                              // 無航班資訊：顯示手動填寫按鈕
                              <div className="flex items-center gap-4">
                                <span className="text-sm text-morandi-secondary">尚無航班資訊</span>
                                <button
                                  onClick={() => setManualFlightMode(true)}
                                  className="px-3 py-1 text-xs font-medium text-white bg-morandi-gold hover:bg-morandi-gold-hover rounded"
                                >
                                  手動填寫
                                </button>
                                <button
                                  onClick={() => { setAddingCategory(null); setTransportSubType(null) }}
                                  className="text-morandi-red hover:underline text-xs"
                                >
                                  取消
                                </button>
                              </div>
                            )}
                          </td>
                        </>
                      )}
                      {/* 車子：日期選擇（一個日期=單日，兩個日期=區間） */}
                      {transportSubType === 'vehicle' && (
                        <>
                          <td className="p-1 border-r border-border/30">
                            <div className="flex items-center gap-1">
                              <DatePicker
                                value={newItemData.service_date}
                                onChange={(date) => handleNewItemChange('service_date', date)}
                                placeholder="開始"
                                buttonClassName="h-8 text-xs border-0 shadow-none"
                              />
                              <span className="text-morandi-secondary text-xs">~</span>
                              <DatePicker
                                value={newItemData.service_date_end}
                                onChange={(date) => handleNewItemChange('service_date_end', date)}
                                placeholder="結束(選填)"
                                buttonClassName="h-8 text-xs border-0 shadow-none"
                                clearable
                              />
                            </div>
                          </td>
                          <td className="p-0 border-r border-border/30" style={{ maxWidth: '100px' }}>
                            <input
                              value={newItemData.supplier_name}
                              onChange={(e) => handleNewItemChange('supplier_name', e.target.value)}
                              placeholder="車行..."
                              className="w-full h-full px-2 py-2 text-sm bg-transparent border-0 outline-none focus:bg-card focus:ring-2 focus:ring-inset focus:ring-morandi-gold/50 placeholder:text-morandi-secondary/50"
                            />
                          </td>
                          <td className="p-0 border-r border-border/30">
                            <input
                              value={newItemData.title}
                              onChange={(e) => handleNewItemChange('title', e.target.value)}
                              placeholder={newItemData.service_date_end ? '全程用車' : '單日用車'}
                              className="w-full h-full px-3 py-2 text-sm bg-transparent border-0 outline-none focus:bg-card focus:ring-2 focus:ring-inset focus:ring-morandi-gold/50 placeholder:text-morandi-secondary/50"
                            />
                          </td>
                          <td className="p-0 border-r border-border/30">
                            <input
                              type="number"
                              value={newItemData.unit_price}
                              onChange={(e) => handleNewItemChange('unit_price', e.target.value)}
                              placeholder="0"
                              className="w-full h-full px-3 py-2 text-sm text-right font-mono bg-transparent border-0 outline-none focus:bg-card focus:ring-2 focus:ring-inset focus:ring-morandi-gold/50 placeholder:text-morandi-secondary/50"
                            />
                          </td>
                          <td className="p-0 border-r border-border/30">
                            <input
                              type="number"
                              value={newItemData.quantity}
                              onChange={(e) => handleNewItemChange('quantity', e.target.value)}
                              placeholder="0"
                              className="w-full h-full px-3 py-2 text-sm text-center bg-transparent border-0 outline-none focus:bg-card focus:ring-2 focus:ring-inset focus:ring-morandi-gold/50 placeholder:text-morandi-secondary/50"
                            />
                          </td>
                          <td className="p-0 border-r border-border/30">
                            <input
                              type="number"
                              value={newItemData.expected_cost}
                              onChange={(e) => handleNewItemChange('expected_cost', e.target.value)}
                              placeholder="0"
                              className="w-full h-full px-3 py-2 text-sm text-right font-mono bg-transparent border-0 outline-none focus:bg-card focus:ring-2 focus:ring-inset focus:ring-morandi-gold/50 placeholder:text-morandi-secondary/50"
                            />
                          </td>
                          <td className="p-0 border-r border-border/30">
                            <input
                              type="number"
                              value={newItemData.actual_cost}
                              onChange={(e) => handleNewItemChange('actual_cost', e.target.value)}
                              placeholder="0"
                              className="w-full h-full px-3 py-2 text-sm text-right font-mono bg-transparent border-0 outline-none focus:bg-card focus:ring-2 focus:ring-inset focus:ring-morandi-gold/50 placeholder:text-morandi-secondary/50"
                            />
                          </td>
                          <td className="p-0 border-r border-border/30">
                            <input
                              value={newItemData.notes}
                              onChange={(e) => handleNewItemChange('notes', e.target.value)}
                              placeholder="備註..."
                              className="w-full h-full px-3 py-2 text-sm bg-transparent border-0 outline-none focus:bg-card focus:ring-2 focus:ring-inset focus:ring-morandi-gold/50 placeholder:text-morandi-secondary/50"
                            />
                          </td>
                        </>
                      )}
                      {/* 車子模式的操作按鈕 */}
                      {transportSubType === 'vehicle' && (
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-1 justify-end">
                            <button
                              onClick={handleSaveNewItem}
                              disabled={savingNew}
                              className="p-1.5 text-white bg-morandi-green hover:bg-morandi-green/80 rounded disabled:opacity-50"
                              title="儲存"
                            >
                              {savingNew ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                            </button>
                            <button
                              onClick={handleCancelAdd}
                              disabled={savingNew}
                              className="p-1.5 text-white bg-morandi-red hover:bg-morandi-red/80 rounded disabled:opacity-50"
                              title="取消"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  )}

                  {/* 其他類別：一般新增行 */}
                  {addingCategory === cat.key && cat.key !== 'transport' && (
                    <tr className="border-t border-border/50 bg-morandi-gold/10">
                      <td className="px-3 py-2 text-morandi-secondary text-xs border-r border-border/30">{cat.label}</td>
                      <td className="p-0 border-r border-border/30">
                        <input
                          ref={firstInputRef}
                          type="date"
                          value={newItemData.service_date}
                          onChange={(e) => handleNewItemChange('service_date', e.target.value)}
                          className="w-full h-full px-3 py-2 text-sm bg-transparent border-0 outline-none focus:bg-card focus:ring-2 focus:ring-inset focus:ring-morandi-gold/50"
                        />
                      </td>
                      <td className="p-0 border-r border-border/30">
                        <input
                          value={newItemData.supplier_name}
                          onChange={(e) => handleNewItemChange('supplier_name', e.target.value)}
                          placeholder="輸入供應商..."
                          className="w-full h-full px-3 py-2 text-sm bg-transparent border-0 outline-none focus:bg-card focus:ring-2 focus:ring-inset focus:ring-morandi-gold/50 placeholder:text-morandi-secondary/50"
                        />
                      </td>
                      <td className="p-0 border-r border-border/30">
                        <input
                          value={newItemData.title}
                          onChange={(e) => handleNewItemChange('title', e.target.value)}
                          placeholder="輸入項目說明..."
                          className="w-full h-full px-3 py-2 text-sm bg-transparent border-0 outline-none focus:bg-card focus:ring-2 focus:ring-inset focus:ring-morandi-gold/50 placeholder:text-morandi-secondary/50"
                        />
                      </td>
                      <td className="p-0 border-r border-border/30">
                        <input
                          type="number"
                          value={newItemData.unit_price}
                          onChange={(e) => handleNewItemChange('unit_price', e.target.value)}
                          placeholder="0"
                          className="w-full h-full px-3 py-2 text-sm text-right font-mono bg-transparent border-0 outline-none focus:bg-card focus:ring-2 focus:ring-inset focus:ring-morandi-gold/50 placeholder:text-morandi-secondary/50"
                        />
                      </td>
                      <td className="p-0 border-r border-border/30">
                        <input
                          type="number"
                          value={newItemData.quantity}
                          onChange={(e) => handleNewItemChange('quantity', e.target.value)}
                          placeholder="0"
                          className="w-full h-full px-3 py-2 text-sm text-center bg-transparent border-0 outline-none focus:bg-card focus:ring-2 focus:ring-inset focus:ring-morandi-gold/50 placeholder:text-morandi-secondary/50"
                        />
                      </td>
                      <td className="p-0 border-r border-border/30">
                        <input
                          type="number"
                          value={newItemData.expected_cost}
                          onChange={(e) => handleNewItemChange('expected_cost', e.target.value)}
                          placeholder="0"
                          className="w-full h-full px-3 py-2 text-sm text-right font-mono bg-transparent border-0 outline-none focus:bg-card focus:ring-2 focus:ring-inset focus:ring-morandi-gold/50 placeholder:text-morandi-secondary/50"
                        />
                      </td>
                      <td className="p-0 border-r border-border/30">
                        <input
                          type="number"
                          value={newItemData.actual_cost}
                          onChange={(e) => handleNewItemChange('actual_cost', e.target.value)}
                          placeholder="0"
                          className="w-full h-full px-3 py-2 text-sm text-right font-mono bg-transparent border-0 outline-none focus:bg-card focus:ring-2 focus:ring-inset focus:ring-morandi-gold/50 placeholder:text-morandi-secondary/50"
                        />
                      </td>
                      <td className="p-0 border-r border-border/30">
                        <input
                          value={newItemData.notes}
                          onChange={(e) => handleNewItemChange('notes', e.target.value)}
                          placeholder="輸入備註..."
                          className="w-full h-full px-3 py-2 text-sm bg-transparent border-0 outline-none focus:bg-card focus:ring-2 focus:ring-inset focus:ring-morandi-gold/50 placeholder:text-morandi-secondary/50"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={handleSaveNewItem}
                            disabled={savingNew}
                            className="p-1.5 text-white bg-morandi-green hover:bg-morandi-green/80 rounded disabled:opacity-50"
                            title="儲存"
                          >
                            {savingNew ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                          </button>
                          <button
                            onClick={handleCancelAdd}
                            disabled={savingNew}
                            className="p-1.5 text-white bg-morandi-red hover:bg-morandi-red/80 rounded disabled:opacity-50"
                            title="取消"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
          {/* 總計 */}
          <tfoot>
            <tr className="bg-morandi-container/50 border-t-2 border-border font-medium">
              <td colSpan={6} className="px-2 py-2 text-right text-morandi-primary">
                總計
              </td>
              <td className="px-2 py-2 text-right font-mono text-morandi-primary">
                {formatCurrency(
                  Object.values(groupedItems).flat().reduce((sum, item) =>
                    sum + (item.subtotal ?? ((item.unit_price || 0) * (item.quantity || 0))), 0
                  )
                )}
              </td>
              <td className="px-2 py-2 text-right font-mono text-morandi-primary">
                {formatCurrency(costSummary.total.expected)}
              </td>
              <td className="px-2 py-2 text-right font-mono text-morandi-primary">
                {formatCurrency(costSummary.total.actual)}
              </td>
              <td className="px-2 py-2"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* 結算區塊 */}
      <div className="mt-4 border border-border rounded-lg p-4 bg-morandi-container/20">
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
                    onClick={() => {
                      setExchangeRateInput(effectiveExchangeRate?.toString() || '')
                      setExchangeRateDialog({ open: true, itemId: null })
                    }}
                  >
                    修改
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setExchangeRateDialog({ open: true, itemId: null })}
                >
                  設定 {destinationCurrency} 匯率
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-morandi-secondary">預計支出 (TWD)</p>
            <p className="text-lg font-mono font-medium text-morandi-primary">
              {formatCurrency(costSummary.total.expected)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-morandi-secondary">實際支出 (TWD)</p>
            <p className="text-lg font-mono font-medium text-morandi-primary">
              {formatCurrency(costSummary.total.actual)}
            </p>
          </div>
          {destinationCurrency && effectiveExchangeRate && (
            <>
              <div className="space-y-1">
                <p className="text-xs text-morandi-secondary">預計支出 ({destinationCurrency})</p>
                <p className="text-lg font-mono font-medium text-morandi-gold">
                  {Math.round(costSummary.total.expected / effectiveExchangeRate).toLocaleString()}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-morandi-secondary">實際支出 ({destinationCurrency})</p>
                <p className="text-lg font-mono font-medium text-morandi-gold">
                  {Math.round(costSummary.total.actual / effectiveExchangeRate).toLocaleString()}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 編輯對話框 */}
      <ItemEditDialog
        open={editDialog.open}
        category={editDialog.category}
        item={editDialog.item}
        sheetId={sheet?.id || ''}
        workspaceId={workspaceId}
        onClose={() => setEditDialog({ open: false, category: 'transport', item: null })}
        onSave={handleSave}
      />

      {/* 匯率設定對話框 */}
      <Dialog open={exchangeRateDialog.open} onOpenChange={(open) => !open && setExchangeRateDialog({ open: false, itemId: null })}>
        <DialogContent level={1} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>設定匯率</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-morandi-secondary">
              設定 {destinationCurrency || '外幣'} 對台幣的匯率，用於換算預計支出
            </p>
            <div className="space-y-2">
              <Label htmlFor="exchange-rate">1 {destinationCurrency || '外幣'} = ? TWD</Label>
              <Input
                id="exchange-rate"
                type="number"
                step="0.001"
                placeholder="例如：0.22（日圓）或 0.9（泰銖）"
                value={exchangeRateInput}
                onChange={(e) => setExchangeRateInput(e.target.value)}
              />
              <p className="text-xs text-morandi-secondary">
                例：日圓約 0.22，泰銖約 0.9，韓元約 0.024
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExchangeRateDialog({ open: false, itemId: null })}>
              取消
            </Button>
            <Button onClick={handleSaveExchangeRate}>
              確認
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

