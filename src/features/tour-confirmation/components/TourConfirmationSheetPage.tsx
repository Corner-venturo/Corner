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
  Edit2,
  Trash2,
  Check,
  X,
  Download,
  Printer,
  Send,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
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
  { key: 'meal', label: '餐食' },
  { key: 'accommodation', label: '住宿' },
  { key: 'activity', label: '活動' },
  { key: 'other', label: '其他' },
]

export function TourConfirmationSheetPage({ tour }: TourConfirmationSheetPageProps) {
  const { user } = useAuthStore()
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

  // 需求單資料（用於帶入資源關聯）
  const [tourRequests, setTourRequests] = useState<TourRequestRow[]>([])
  const [requestsLoading, setRequestsLoading] = useState(false)

  // 交接狀態
  const [handingOver, setHandingOver] = useState(false)

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

  // 當開始新增時，聚焦到第一個輸入框
  useEffect(() => {
    if (addingCategory && firstInputRef.current) {
      firstInputRef.current.focus()
    }
  }, [addingCategory])

  // 自動建立確認表並帶入需求單（如果不存在）
  useEffect(() => {
    const createAndImport = async () => {
      if (!loading && !sheet && tour && workspaceId && !requestsLoading) {
        try {
          // 1. 建立確認表
          const newSheet = await createSheet({
            tour_code: tour.code,
            tour_name: tour.name,
            departure_date: tour.departure_date || undefined,
            return_date: tour.return_date || undefined,
            workspace_id: workspaceId,
          })

          if (!newSheet?.id) return

          // 2. 自動帶入所有需求單資料
          const categoryMap: Record<string, ConfirmationItemCategory> = {
            transport: 'transport',
            vehicle: 'transport',
            meal: 'meal',
            restaurant: 'meal',
            accommodation: 'accommodation',
            hotel: 'accommodation',
            activity: 'activity',
            attraction: 'activity',
            other: 'other',
          }

          for (const req of tourRequests) {
            const category = categoryMap[req.category] || 'other'
            await addItem({
              sheet_id: newSheet.id,
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
              request_id: req.id,
              resource_type: req.resource_type as ResourceType | null,
              resource_id: req.resource_id || null,
              latitude: req.latitude || null,
              longitude: req.longitude || null,
              google_maps_url: req.google_maps_url || null,
            })
          }

          // 3. 自動帶入航班資訊
          if (tour.outbound_flight) {
            const outbound = tour.outbound_flight
            await addItem({
              sheet_id: newSheet.id,
              category: 'transport',
              service_date: tour.departure_date || '',
              service_date_end: null,
              day_label: null,
              supplier_name: outbound.airline || '',
              supplier_id: null,
              title: `去程 ${outbound.flightNumber} ${outbound.departureAirport}→${outbound.arrivalAirport}`,
              description: `${outbound.departureTime} - ${outbound.arrivalTime}`,
              unit_price: null,
              currency: 'TWD',
              quantity: null,
              subtotal: null,
              expected_cost: null,
              actual_cost: null,
              contact_info: null,
              booking_reference: null,
              booking_status: 'confirmed',
              type_data: null,
              sort_order: 0,
              notes: outbound.duration || null,
              workspace_id: workspaceId,
            })
          }

          if (tour.return_flight) {
            const returnFlight = tour.return_flight
            await addItem({
              sheet_id: newSheet.id,
              category: 'transport',
              service_date: tour.return_date || '',
              service_date_end: null,
              day_label: null,
              supplier_name: returnFlight.airline || '',
              supplier_id: null,
              title: `回程 ${returnFlight.flightNumber} ${returnFlight.departureAirport}→${returnFlight.arrivalAirport}`,
              description: `${returnFlight.departureTime} - ${returnFlight.arrivalTime}`,
              unit_price: null,
              currency: 'TWD',
              quantity: null,
              subtotal: null,
              expected_cost: null,
              actual_cost: null,
              contact_info: null,
              booking_reference: null,
              booking_status: 'confirmed',
              type_data: null,
              sort_order: 1,
              notes: returnFlight.duration || null,
              workspace_id: workspaceId,
            })
          }

          // 重新載入以顯示新資料
          reload()
        } catch (err) {
          logger.error('建立確認表失敗:', err)
        }
      }
    }
    createAndImport()
  }, [loading, sheet, tour, workspaceId, tourRequests, requestsLoading, createSheet, addItem, reload])

  // 如果確認表存在但沒有項目，自動帶入需求單
  const [hasAutoImported, setHasAutoImported] = useState(false)
  useEffect(() => {
    const autoImportToExistingSheet = async () => {
      // 條件：確認表存在、沒有項目、有需求單、尚未自動帶入過
      if (
        sheet?.id &&
        groupedItems.transport.length === 0 &&
        groupedItems.meal.length === 0 &&
        groupedItems.accommodation.length === 0 &&
        groupedItems.activity.length === 0 &&
        groupedItems.other.length === 0 &&
        (tourRequests.length > 0 || tour.outbound_flight || tour.return_flight) &&
        !requestsLoading &&
        !hasAutoImported
      ) {
        setHasAutoImported(true)

        try {
          const categoryMap: Record<string, ConfirmationItemCategory> = {
            transport: 'transport',
            vehicle: 'transport',
            meal: 'meal',
            restaurant: 'meal',
            accommodation: 'accommodation',
            hotel: 'accommodation',
            activity: 'activity',
            attraction: 'activity',
            other: 'other',
          }

          // 帶入需求單
          for (const req of tourRequests) {
            const category = categoryMap[req.category] || 'other'
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
              request_id: req.id,
              resource_type: req.resource_type as ResourceType | null,
              resource_id: req.resource_id || null,
              latitude: req.latitude || null,
              longitude: req.longitude || null,
              google_maps_url: req.google_maps_url || null,
            })
          }

          // 帶入航班
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
              description: `${outbound.departureTime} - ${outbound.arrivalTime}`,
              unit_price: null,
              currency: 'TWD',
              quantity: null,
              subtotal: null,
              expected_cost: null,
              actual_cost: null,
              contact_info: null,
              booking_reference: null,
              booking_status: 'confirmed',
              type_data: null,
              sort_order: 0,
              notes: outbound.duration || null,
              workspace_id: workspaceId,
            })
          }

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
              description: `${returnFlight.departureTime} - ${returnFlight.arrivalTime}`,
              unit_price: null,
              currency: 'TWD',
              quantity: null,
              subtotal: null,
              expected_cost: null,
              actual_cost: null,
              contact_info: null,
              booking_reference: null,
              booking_status: 'confirmed',
              type_data: null,
              sort_order: 1,
              notes: returnFlight.duration || null,
              workspace_id: workspaceId,
            })
          }

          reload()
        } catch (err) {
          logger.error('自動帶入失敗:', err)
        }
      }
    }
    autoImportToExistingSheet()
  }, [sheet, groupedItems, tourRequests, tour, workspaceId, requestsLoading, hasAutoImported, addItem, reload])

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
          description: `${outbound.departureTime} - ${outbound.arrivalTime}`,
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
          description: `${returnFlight.departureTime} - ${returnFlight.arrivalTime}`,
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

      {/* 每日行程表 */}
      {itinerary?.daily_itinerary && itinerary.daily_itinerary.length > 0 && (
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white">
            <span className="font-medium">每日行程</span>
            <span className="text-blue-100 text-sm">({itinerary.daily_itinerary.length} 天)</span>
          </div>
          <div className="divide-y divide-border">
            {itinerary.daily_itinerary.map((day, idx) => (
              <div key={idx} className="px-4 py-3 bg-card hover:bg-morandi-container/10">
                <div className="flex items-start gap-4">
                  {/* 日期 */}
                  <div className="flex-shrink-0 w-20">
                    <div className="text-sm font-medium text-morandi-primary">{day.dayLabel}</div>
                    <div className="text-xs text-morandi-secondary">{day.date}</div>
                  </div>
                  {/* 行程內容 */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-morandi-primary">{day.title}</div>
                    {day.activities && day.activities.length > 0 && (
                      <div className="text-sm text-morandi-secondary mt-1">
                        {day.activities.map(a => a.title).filter(Boolean).join(' → ')}
                      </div>
                    )}
                  </div>
                  {/* 住宿 */}
                  <div className="flex-shrink-0 text-right">
                    {day.accommodation && day.accommodation !== '溫暖的家' && (
                      <div className="text-sm">
                        <span className="text-morandi-secondary">住宿：</span>
                        <span className="text-morandi-primary">{day.accommodation}</span>
                      </div>
                    )}
                    {/* 餐食 */}
                    {day.meals && (
                      <div className="text-xs text-morandi-secondary mt-1">
                        {[
                          day.meals.breakfast && day.meals.breakfast !== '敬請自理' ? `早：${day.meals.breakfast}` : null,
                          day.meals.lunch && day.meals.lunch !== '敬請自理' ? `午：${day.meals.lunch}` : null,
                          day.meals.dinner && day.meals.dinner !== '敬請自理' ? `晚：${day.meals.dinner}` : null,
                        ].filter(Boolean).join(' | ')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 統一表格 */}
      <div className="border border-border rounded-lg overflow-hidden print:border-black print:rounded-none">
        <table className="w-full text-sm">
          {/* 表頭 */}
          <thead>
            <tr className="bg-morandi-container/50 border-b border-border">
              <th className="px-3 py-2 text-left font-medium text-morandi-primary w-[70px]">分類</th>
              <th className="px-3 py-2 text-left font-medium text-morandi-primary w-[80px]">日期</th>
              <th className="px-3 py-2 text-left font-medium text-morandi-primary">供應商/名稱</th>
              <th className="px-3 py-2 text-left font-medium text-morandi-primary">項目說明</th>
              <th className="px-3 py-2 text-right font-medium text-morandi-primary w-[80px]">單價</th>
              <th className="px-3 py-2 text-center font-medium text-morandi-primary w-[50px]">數量</th>
              <th className="px-3 py-2 text-right font-medium text-morandi-primary w-[90px]">預計支出</th>
              <th className="px-3 py-2 text-right font-medium text-morandi-primary w-[90px]">實際支出</th>
              <th className="px-3 py-2 text-left font-medium text-morandi-primary w-[120px]">備註</th>
              <th className="px-2 py-2 w-[70px] print:hidden"></th>
            </tr>
          </thead>
          <tbody>
            {CATEGORIES.map((cat) => {
              const items = groupedItems[cat.key]
              const categoryTotal = {
                expected: items.reduce((sum, i) => sum + (i.expected_cost || 0), 0),
                actual: items.reduce((sum, i) => sum + (i.actual_cost || 0), 0),
              }

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
                  <tr className="bg-morandi-container/30 border-t border-border">
                    <td colSpan={9} className="px-3 py-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-morandi-primary">{cat.label}</span>
                        <span className="text-xs text-morandi-secondary">
                          預計: {formatCurrency(categoryTotal.expected)} / 實際: {formatCurrency(categoryTotal.actual)}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-1.5 text-right print:hidden">
                      <div className="flex items-center gap-1 justify-end">
                        {/* 從需求單帶入按鈕（優先顯示，包含資源關聯） */}
                        {hasRequestsForCategory(cat.key) && items.length === 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleImportFromRequests(cat.key)}
                            disabled={savingNew}
                            className="h-6 px-2 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            title="從需求單帶入（含 GPS 資訊）"
                          >
                            <Download size={12} className="mr-1" />
                            需求單
                          </Button>
                        )}
                        {/* 從行程表帶入按鈕 */}
                        {canImport && importHandler && items.length === 0 && !hasRequestsForCategory(cat.key) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={importHandler}
                            disabled={savingNew}
                            className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            title="從行程表帶入"
                          >
                            <Download size={12} className="mr-1" />
                            行程表
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAdd(cat.key)}
                          className="h-6 px-2 text-xs text-morandi-gold hover:text-morandi-gold-hover"
                        >
                          <Plus size={12} className="mr-1" />
                          新增
                        </Button>
                      </div>
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
                    items.map((item, idx) => (
                      <tr
                        key={item.id}
                        className={`border-t border-border/50 hover:bg-morandi-container/10 ${
                          idx % 2 === 1 ? 'bg-morandi-container/5' : ''
                        }`}
                      >
                        <td className="px-3 py-2 text-morandi-secondary text-xs">{cat.label}</td>
                        <td className="px-3 py-2">{formatDate(item.service_date)}</td>
                        <td className="px-3 py-2">{item.supplier_name}</td>
                        <td className="px-3 py-2">{item.title}</td>
                        <td className="px-3 py-2 text-right font-mono">{formatCurrency(item.unit_price)}</td>
                        <td className="px-3 py-2 text-center">{item.quantity || '-'}</td>
                        <td className="px-3 py-2 text-right font-mono">{formatCurrency(item.expected_cost)}</td>
                        <td className="px-3 py-2 text-right font-mono">{formatCurrency(item.actual_cost)}</td>
                        <td className="px-3 py-2 text-xs text-morandi-secondary truncate max-w-[120px]">
                          {item.notes || '-'}
                        </td>
                        <td className="px-2 py-2 print:hidden">
                          <div className="flex items-center gap-1 justify-end">
                            <button
                              onClick={() => handleEdit(item)}
                              className="p-1 text-morandi-secondary hover:text-morandi-primary rounded"
                              title="編輯"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1 text-morandi-secondary hover:text-morandi-red rounded"
                              title="刪除"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
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
                                      <span className="text-blue-600">回程</span> {tour.return_flight.airline} {tour.return_flight.flightNumber} {tour.return_flight.departureAirport}→{tour.return_flight.arrivalAirport}
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
                                  <span className="text-blue-600 font-medium w-10">回程</span>
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
              <td colSpan={6} className="px-3 py-2 text-right text-morandi-primary">
                總計
              </td>
              <td className="px-3 py-2 text-right font-mono text-morandi-primary">
                {formatCurrency(costSummary.total.expected)}
              </td>
              <td className="px-3 py-2 text-right font-mono text-morandi-primary">
                {formatCurrency(costSummary.total.actual)}
              </td>
              <td colSpan={2} className="px-3 py-2">
                {costSummary.total.actual > 0 && (
                  <span className={`text-xs ${
                    costSummary.total.actual > costSummary.total.expected
                      ? 'text-morandi-red'
                      : 'text-morandi-green'
                  }`}>
                    差額: {costSummary.total.actual - costSummary.total.expected > 0 ? '+' : ''}
                    {formatCurrency(costSummary.total.actual - costSummary.total.expected)}
                  </span>
                )}
              </td>
            </tr>
          </tfoot>
        </table>
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
    </div>
  )
}

