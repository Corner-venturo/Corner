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
  Send,
  AlertCircle,
  Printer,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { CalcInput } from '@/components/ui/calc-input'
import { useToast } from '@/components/ui/use-toast'
import { useAuthStore } from '@/stores/auth-store'
import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/utils/logger'
import { syncTripToOnline } from '../services/syncToOnline'
import { useTourConfirmationSheet } from '../hooks/useTourConfirmationSheet'
import { useTourSheetData } from '../hooks/useTourSheetData'
import { ItemEditDialog } from './ItemEditDialog'
import {
  TourInfoSection,
  DailyItinerarySection,
  HotelConfirmationSection,
  SettlementSection,
  ExchangeRateDialog,
} from './sections'
import {
  getDestinationCurrency,
  getCurrencyName,
  getCurrencySymbol,
  formatCurrency,
  formatDate,
} from '../constants/currency'
import type { Tour } from '@/stores/types'
import type {
  TourConfirmationItem,
  ConfirmationItemCategory,
  CreateConfirmationItem,
  ResourceType,
} from '@/types/tour-confirmation-sheet.types'
import { COST_SUMMARY_LABELS, TOUR_CONFIRMATION_SHEET_PAGE_LABELS } from '../constants/labels';

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
  { key: 'transport', label: COST_SUMMARY_LABELS.交通 },
  { key: 'accommodation', label: COST_SUMMARY_LABELS.住宿 },
  { key: 'meal', label: COST_SUMMARY_LABELS.餐食 },
  { key: 'activity', label: COST_SUMMARY_LABELS.活動 },
  { key: 'other', label: COST_SUMMARY_LABELS.其他 },
]

export function TourConfirmationSheetPage({ tour }: TourConfirmationSheetPageProps) {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const workspaceId = tour.workspace_id || user?.workspace_id || ''

  // 主要 hook
  const {
    sheet,
    items,
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

  // 資料載入 hook
  const {
    itinerary,
    itineraryLoading,
    tourRequests,
    requestsLoading,
    vehicleRequests,
    incompleteRequests,
    quoteItems,
    quoteItemsLoading,
    tourOrders,
    ordersLoading,
    primaryContact,
    calculateAgeGroups,
    tourRooms,
    quoteRoomItems,
  } = useTourSheetData({
    tourId: tour.id,
    quoteId: tour.quote_id,
    departureDate: tour.departure_date,
  })

  const ageGroups = calculateAgeGroups(tour.departure_date)
  const destinationCurrency = getDestinationCurrency(tour.location, tour.code)

  // 預計支出的 local state
  const localExpectedCostsRef = useRef<Record<string, { value: number | null; formula?: string; dirty: boolean }>>({})
  const [, forceUpdate] = useState(0)

  const handleExpectedCostChange = (itemId: string, value: number | null) => {
    localExpectedCostsRef.current[itemId] = {
      ...localExpectedCostsRef.current[itemId],
      value,
      dirty: true
    }
    forceUpdate(n => n + 1)
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
    if (!local?.dirty) return

    try {
      const updates: Record<string, unknown> = { expected_cost: local.value }
      if (local.formula !== undefined) {
        updates.type_data = {
          ...((currentTypeData as Record<string, unknown>) || {}),
          expected_cost_formula: local.formula || null
        }
      }
      await updateItem(itemId, updates as Parameters<typeof updateItem>[1])
      localExpectedCostsRef.current[itemId] = { ...local, dirty: false }
    } catch (err) {
      logger.error('更新預計支出失敗:', err)
      toast({ title: TOUR_CONFIRMATION_SHEET_PAGE_LABELS.更新失敗, variant: 'destructive' })
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

  // 編輯對話框狀態
  const [editDialog, setEditDialog] = useState<{
    open: boolean
    category: ConfirmationItemCategory
    item: TourConfirmationItem | null
  }>({
    open: false,
    category: 'transport',
    item: null,
  })

  // 匯率設定對話框
  const [exchangeRateDialog, setExchangeRateDialog] = useState<{
    open: boolean
    itemId: string | null
  }>({ open: false, itemId: null })
  const [exchangeRateInput, setExchangeRateInput] = useState('')
  const [localExchangeRate, setLocalExchangeRate] = useState<number | null>(null)
  const effectiveExchangeRate = sheet?.exchange_rate ?? localExchangeRate

  // 幣值轉換
  const handleCurrencyConvert = async (itemId: string) => {
    if (!sheet) return

    if (!effectiveExchangeRate) {
      setExchangeRateDialog({ open: true, itemId })
      return
    }

    const item = Object.values(groupedItems).flat().find(i => i.id === itemId)
    if (!item) return

    const twdSubtotal = (item.unit_price || 0) * (item.quantity || 1)
    if (twdSubtotal <= 0) {
      toast({ title: TOUR_CONFIRMATION_SHEET_PAGE_LABELS.小計為_0_無法換算, variant: 'destructive' })
      return
    }

    const foreignAmount = Math.round(twdSubtotal / effectiveExchangeRate)
    const currencyName = getCurrencyName(destinationCurrency)

    try {
      const currentTypeData = item.type_data as Record<string, unknown> | null
      const updatedTypeData = {
        ...currentTypeData,
        original_twd_subtotal: twdSubtotal,
        subtotal_currency: destinationCurrency,
        expected_cost_formula: null,
      }
      await updateItem(itemId, {
        subtotal: foreignAmount,
        expected_cost: foreignAmount,
        notes: `${currencyName}支出`,
        type_data: updatedTypeData as unknown as Parameters<typeof updateItem>[1]['type_data'],
      })

      localExpectedCostsRef.current[itemId] = { value: foreignAmount, formula: undefined, dirty: false }
      forceUpdate(n => n + 1)

      toast({
        title: `已換算為${currencyName}`,
        description: `${twdSubtotal.toLocaleString()} TWD ÷ ${effectiveExchangeRate} = ${foreignAmount.toLocaleString()} ${destinationCurrency}`,
      })
    } catch (err) {
      logger.error('換算失敗:', err)
      toast({ title: TOUR_CONFIRMATION_SHEET_PAGE_LABELS.換算失敗, variant: 'destructive' })
    }
  }

  // 儲存匯率設定
  const handleSaveExchangeRate = async () => {
    const rate = parseFloat(exchangeRateInput)
    if (isNaN(rate) || rate <= 0) {
      toast({ title: TOUR_CONFIRMATION_SHEET_PAGE_LABELS.請輸入有效的匯率, variant: 'destructive' })
      return
    }

    try {
      await updateSheet({
        exchange_rate: rate,
        foreign_currency: destinationCurrency,
      })
      toast({ title: TOUR_CONFIRMATION_SHEET_PAGE_LABELS.匯率設定成功, description: `1 ${destinationCurrency} = ${rate} TWD` })
    } catch (err) {
      logger.warn('無法儲存匯率到資料庫，使用本地狀態:', err)
      setLocalExchangeRate(rate)
      toast({ title: TOUR_CONFIRMATION_SHEET_PAGE_LABELS.匯率已設定_本次有效, description: `1 ${destinationCurrency} = ${rate} TWD` })
    }

    setExchangeRateDialog({ open: false, itemId: null })
    setExchangeRateInput('')

    if (exchangeRateDialog.itemId) {
      const item = Object.values(groupedItems).flat().find(i => i.id === exchangeRateDialog.itemId)
      if (item?.expected_cost) {
        const convertedAmount = Math.round(item.expected_cost / rate)
        toast({
          title: `換算結果`,
          description: `${item.expected_cost.toLocaleString()} TWD = ${convertedAmount.toLocaleString()} ${destinationCurrency || TOUR_CONFIRMATION_SHEET_PAGE_LABELS.外幣}`,
        })
      }
    }
  }

  // Inline 新增狀態
  const [addingCategory, setAddingCategory] = useState<ConfirmationItemCategory | null>(null)
  const [newItemData, setNewItemData] = useState(EMPTY_NEW_ITEM)
  const [savingNew, setSavingNew] = useState(false)
  const firstInputRef = useRef<HTMLInputElement>(null)
  const [transportSubType, setTransportSubType] = useState<TransportSubType>(null)
  const [manualFlightMode, setManualFlightMode] = useState(false)
  const [manualFlight, setManualFlight] = useState({
    outbound: { airline: '', flightNumber: '', departureAirport: '', arrivalAirport: '' },
    return: { airline: '', flightNumber: '', departureAirport: '', arrivalAirport: '' },
  })

  // 交接狀態
  const [handingOver, setHandingOver] = useState(false)

  // 聚焦到第一個輸入框
  useEffect(() => {
    if (addingCategory && firstInputRef.current) {
      firstInputRef.current.focus()
    }
  }, [addingCategory])

  // 開啟 inline 新增模式
  const handleAdd = (category: ConfirmationItemCategory) => {
    setAddingCategory(category)
    setNewItemData(EMPTY_NEW_ITEM)
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
  }

  // 從航班資訊創建項目
  const handleAddFlightItems = async () => {
    if (!sheet?.id) return

    setSavingNew(true)
    try {
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
        })
      }

      handleCancelAdd()
    } finally {
      setSavingNew(false)
    }
  }

  // 儲存手動填寫的航班
  const handleSaveManualFlight = async () => {
    if (!sheet?.id) return

    setSavingNew(true)
    try {
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

      const { error: updateError } = await supabase
        .from('tours')
        .update({
          outbound_flight: outboundFlight,
          return_flight: returnFlight,
        })
        .eq('id', tour.id)

      if (updateError) throw updateError

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
        })
      }

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
          { key: 'breakfast', label: TOUR_CONFIRMATION_SHEET_PAGE_LABELS.早餐, value: meals?.breakfast },
          { key: 'lunch', label: TOUR_CONFIRMATION_SHEET_PAGE_LABELS.午餐, value: meals?.lunch },
          { key: 'dinner', label: TOUR_CONFIRMATION_SHEET_PAGE_LABELS.晚餐, value: meals?.dinner },
        ]

        for (const meal of mealTypes) {
          if (meal.value && meal.value !== TOUR_CONFIRMATION_SHEET_PAGE_LABELS.敬請自理 && meal.value !== TOUR_CONFIRMATION_SHEET_PAGE_LABELS.機上) {
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
        if (day.accommodation && day.accommodation !== TOUR_CONFIRMATION_SHEET_PAGE_LABELS.溫暖的家) {
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

  // 從需求單帶入
  const handleImportFromRequests = async (category: ConfirmationItemCategory) => {
    if (!sheet?.id) return

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
          request_id: req.id,
          resource_type: req.resource_type as ResourceType | null,
          resource_id: req.resource_id || null,
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

  // 儲存新項目
  const handleSaveNewItem = async () => {
    if (!sheet?.id || !addingCategory) return

    setSavingNew(true)
    try {
      let title = newItemData.title || TOUR_CONFIRMATION_SHEET_PAGE_LABELS.新項目
      const hasDateRange = newItemData.service_date_end && newItemData.service_date_end !== newItemData.service_date
      if (addingCategory === 'transport' && transportSubType === 'vehicle') {
        if (hasDateRange) {
          title = title || TOUR_CONFIRMATION_SHEET_PAGE_LABELS.全程用車
        } else {
          title = title || TOUR_CONFIRMATION_SHEET_PAGE_LABELS.單日用車
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

  // 儲存編輯的項目
  const handleSave = async (data: CreateConfirmationItem) => {
    if (editDialog.item) {
      await updateItem(editDialog.item.id, data)
    }
    setEditDialog({ open: false, category: 'transport', item: null })
  }

  // 刪除項目
  const handleDelete = async (itemId: string) => {
    if (confirm(TOUR_CONFIRMATION_SHEET_PAGE_LABELS.確定要刪除此項目嗎)) {
      await deleteItem(itemId)
    }
  }

  // 檢查是否已設定領隊
  const hasLeader = sheet?.tour_leader_name && sheet.tour_leader_name.trim() !== ''

  // 交接功能
  const handleHandoff = async () => {
    if (incompleteRequests.length > 0) return

    if (!hasLeader) {
      const proceed = window.confirm(
        TOUR_CONFIRMATION_SHEET_PAGE_LABELS.尚未設定領隊_n_n +
        TOUR_CONFIRMATION_SHEET_PAGE_LABELS.如果此團需要領隊_請先在上方填寫領隊姓名_n +
        TOUR_CONFIRMATION_SHEET_PAGE_LABELS.如果此團不需要領隊_如包車_可以繼續交接_n_n +
        TOUR_CONFIRMATION_SHEET_PAGE_LABELS.確定要繼續交接嗎
      )
      if (!proceed) return
    }

    setHandingOver(true)
    try {
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

      const syncResult = await syncTripToOnline(tour.id)
      if (!syncResult.success) {
        logger.warn('同步到 Online 失敗:', syncResult.message)
      }

      alert(TOUR_CONFIRMATION_SHEET_PAGE_LABELS.交接完成_n_n確認單狀態已更新_n行程已同步到_Onlin)
      reload()
    } catch (error) {
      logger.error('交接失敗:', error)
      alert(TOUR_CONFIRMATION_SHEET_PAGE_LABELS.交接失敗_請稍後再試)
    } finally {
      setHandingOver(false)
    }
  }

  // 列印功能
  const handlePrint = () => {
    window.print()
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

  const allItems = Object.values(groupedItems).flat()

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

      {/* 列印內容區域 */}
      <div
        id="print-content"
        className="border border-border rounded-lg overflow-hidden print:border-0 print:rounded-none print:overflow-visible bg-white"
      >
        {/* 團基本資訊 */}
        <TourInfoSection
          tour={tour}
          sheet={sheet}
          itinerary={itinerary}
          primaryContact={primaryContact}
          ageGroups={ageGroups}
          vehicleRequests={vehicleRequests}
        />

        {/* 每日行程表 */}
        {itinerary && <DailyItinerarySection itinerary={itinerary} />}

        {/* 飯店確認 */}
        {itinerary && (
          <HotelConfirmationSection
            itinerary={itinerary}
            tourRequests={tourRequests}
            tourRooms={tourRooms}
            quoteRoomItems={quoteRoomItems}
          />
        )}

        {/* 統一表格 */}
        <div className="border-t border-border">
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
                const categoryItems = groupedItems[cat.key]

                return (
                  <React.Fragment key={cat.key}>
                    {/* 分類標題行 */}
                    <tr className="bg-morandi-container/30 border-t border-border print:hidden">
                      <td colSpan={9} className="px-3 py-1.5">
                        <span className="font-medium text-morandi-primary">{cat.label}</span>
                        <span className="ml-2 text-xs text-morandi-secondary">({categoryItems.length})</span>
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
                      </td>
                    </tr>

                    {/* 項目列表 */}
                    {categoryItems.length === 0 && addingCategory !== cat.key ? (
                      <tr className="border-t border-border/50">
                        <td colSpan={10} className="px-3 py-3 text-center text-morandi-secondary text-xs">
                          尚無{cat.label}項目
                        </td>
                      </tr>
                    ) : (
                      categoryItems.map((item, idx) => {
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
                            <td className="px-2 py-2 text-right font-mono text-sm border-r border-border/30">
                              {subtotal > 0 ? (
                                (item.type_data as { subtotal_currency?: string } | null)?.subtotal_currency
                                  ? `${getCurrencySymbol((item.type_data as { subtotal_currency?: string }).subtotal_currency)} ${subtotal.toLocaleString()}`
                                  : formatCurrency(subtotal)
                              ) : '-'}
                            </td>
                            <td className="px-1 py-1 border-r border-border/30 print:hidden">
                              <div className="flex items-center">
                                {(item.type_data as { subtotal_currency?: string } | null)?.subtotal_currency && (
                                  <span className="text-xs text-muted-foreground pl-1 shrink-0">
                                    {getCurrencySymbol((item.type_data as { subtotal_currency?: string }).subtotal_currency)}
                                  </span>
                                )}
                                <CalcInput
                                  data-expected-cost-input={item.id}
                                  value={item.id in localExpectedCostsRef.current ? localExpectedCostsRef.current[item.id].value : item.expected_cost}
                                  onChange={(val) => handleExpectedCostChange(item.id, val)}
                                  formula={localExpectedCostsRef.current[item.id]?.formula ?? (item.type_data as unknown as { expected_cost_formula?: string } | null)?.expected_cost_formula}
                                  onFormulaChange={(f) => handleExpectedCostFormulaChange(item.id, f)}
                                  onBlur={() => handleExpectedCostBlur(item.id, item.type_data)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                                      e.preventDefault()
                                      const inputs = document.querySelectorAll<HTMLInputElement>('[data-expected-cost-input]')
                                      const inputsArray = Array.from(inputs)
                                      const currentIndex = inputsArray.findIndex(input => input.dataset.expectedCostInput === item.id)
                                      if (currentIndex === -1) return
                                      const nextIndex = e.key === 'ArrowDown'
                                        ? Math.min(currentIndex + 1, inputsArray.length - 1)
                                        : Math.max(currentIndex - 1, 0)
                                      inputsArray[nextIndex]?.focus()
                                    }
                                  }}
                                  className="flex-1 h-7 px-2 py-1 text-sm text-right font-mono bg-transparent border border-transparent hover:border-border focus:border-morandi-gold focus:ring-1 focus:ring-morandi-gold/30 rounded outline-none"
                                  placeholder="-"
                                />
                              </div>
                            </td>
                            <td className="px-2 py-2 text-right font-mono text-sm border-r border-border/30 hidden print:table-cell">
                              {item.expected_cost ? (
                                (item.type_data as { subtotal_currency?: string } | null)?.subtotal_currency
                                  ? `${getCurrencySymbol((item.type_data as { subtotal_currency?: string }).subtotal_currency)} ${item.expected_cost.toLocaleString()}`
                                  : formatCurrency(item.expected_cost)
                              ) : '-'}
                            </td>
                            <td className="px-2 py-2 text-right font-mono text-sm border-r border-border/30">{item.actual_cost ? formatCurrency(item.actual_cost) : '-'}</td>
                            <td className="px-1 py-1 print:hidden">
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={item.id in localNotesRef.current ? localNotesRef.current[item.id].value : (item.notes || '')}
                                  onChange={(e) => handleNotesChange(item.id, e.target.value)}
                                  onBlur={() => handleNotesBlur(item.id)}
                                  className="flex-1 h-7 px-2 py-1 text-xs bg-transparent border border-transparent hover:border-border focus:border-morandi-gold focus:ring-1 focus:ring-morandi-gold/30 rounded outline-none"
                                  placeholder={TOUR_CONFIRMATION_SHEET_PAGE_LABELS.備註}
                                />
                                {destinationCurrency && (item.subtotal || (item.unit_price && item.quantity)) ? (
                                  <button
                                    type="button"
                                    className="h-6 px-1.5 text-xs text-morandi-gold hover:text-morandi-gold-hover hover:bg-morandi-gold/10 rounded shrink-0 print:hidden"
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

                    {/* Inline 新增行 - 交通類別 */}
                    {addingCategory === cat.key && cat.key === 'transport' && (
                      <tr className="border-t border-border/50 bg-morandi-gold/10">
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
                        {transportSubType === 'flight' && (
                          <>
                            <td colSpan={8} className="px-4 py-2">
                              {tour.outbound_flight || tour.return_flight ? (
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
                                    {savingNew ? '新增中...' : TOUR_CONFIRMATION_SHEET_PAGE_LABELS.確認帶入}
                                  </button>
                                  <button
                                    onClick={() => { setAddingCategory(null); setTransportSubType(null) }}
                                    className="text-morandi-red hover:underline text-xs"
                                  >
                                    取消
                                  </button>
                                </div>
                              ) : manualFlightMode ? (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 text-sm">
                                    <span className="text-morandi-green font-medium w-10">去程</span>
                                    <input
                                      placeholder={TOUR_CONFIRMATION_SHEET_PAGE_LABELS.航空}
                                      value={manualFlight.outbound.airline}
                                      onChange={(e) => setManualFlight(prev => ({ ...prev, outbound: { ...prev.outbound, airline: e.target.value } }))}
                                      className="w-20 px-2 py-1 border border-border rounded text-sm"
                                    />
                                    <input
                                      placeholder={TOUR_CONFIRMATION_SHEET_PAGE_LABELS.航班}
                                      value={manualFlight.outbound.flightNumber}
                                      onChange={(e) => setManualFlight(prev => ({ ...prev, outbound: { ...prev.outbound, flightNumber: e.target.value } }))}
                                      className="w-20 px-2 py-1 border border-border rounded text-sm"
                                    />
                                    <input
                                      placeholder={TOUR_CONFIRMATION_SHEET_PAGE_LABELS.起飛}
                                      value={manualFlight.outbound.departureAirport}
                                      onChange={(e) => setManualFlight(prev => ({ ...prev, outbound: { ...prev.outbound, departureAirport: e.target.value } }))}
                                      className="w-16 px-2 py-1 border border-border rounded text-sm"
                                    />
                                    <span>→</span>
                                    <input
                                      placeholder={TOUR_CONFIRMATION_SHEET_PAGE_LABELS.抵達}
                                      value={manualFlight.outbound.arrivalAirport}
                                      onChange={(e) => setManualFlight(prev => ({ ...prev, outbound: { ...prev.outbound, arrivalAirport: e.target.value } }))}
                                      className="w-16 px-2 py-1 border border-border rounded text-sm"
                                    />
                                  </div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <span className="text-morandi-gold font-medium w-10">回程</span>
                                    <input
                                      placeholder={TOUR_CONFIRMATION_SHEET_PAGE_LABELS.航空}
                                      value={manualFlight.return.airline}
                                      onChange={(e) => setManualFlight(prev => ({ ...prev, return: { ...prev.return, airline: e.target.value } }))}
                                      className="w-20 px-2 py-1 border border-border rounded text-sm"
                                    />
                                    <input
                                      placeholder={TOUR_CONFIRMATION_SHEET_PAGE_LABELS.航班}
                                      value={manualFlight.return.flightNumber}
                                      onChange={(e) => setManualFlight(prev => ({ ...prev, return: { ...prev.return, flightNumber: e.target.value } }))}
                                      className="w-20 px-2 py-1 border border-border rounded text-sm"
                                    />
                                    <input
                                      placeholder={TOUR_CONFIRMATION_SHEET_PAGE_LABELS.起飛}
                                      value={manualFlight.return.departureAirport}
                                      onChange={(e) => setManualFlight(prev => ({ ...prev, return: { ...prev.return, departureAirport: e.target.value } }))}
                                      className="w-16 px-2 py-1 border border-border rounded text-sm"
                                    />
                                    <span>→</span>
                                    <input
                                      placeholder={TOUR_CONFIRMATION_SHEET_PAGE_LABELS.抵達}
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
                                      {savingNew ? '儲存中...' : TOUR_CONFIRMATION_SHEET_PAGE_LABELS.確認儲存}
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
                        {transportSubType === 'vehicle' && (
                          <>
                            <td className="p-1 border-r border-border/30">
                              <div className="flex items-center gap-1">
                                <DatePicker
                                  value={newItemData.service_date}
                                  onChange={(date) => handleNewItemChange('service_date', date)}
                                  placeholder={TOUR_CONFIRMATION_SHEET_PAGE_LABELS.開始}
                                  buttonClassName="h-8 text-xs border-0 shadow-none"
                                />
                                <span className="text-morandi-secondary text-xs">~</span>
                                <DatePicker
                                  value={newItemData.service_date_end}
                                  onChange={(date) => handleNewItemChange('service_date_end', date)}
                                  placeholder={TOUR_CONFIRMATION_SHEET_PAGE_LABELS.結束_選填}
                                  buttonClassName="h-8 text-xs border-0 shadow-none"
                                  clearable
                                />
                              </div>
                            </td>
                            <td className="p-0 border-r border-border/30" style={{ maxWidth: '100px' }}>
                              <input
                                value={newItemData.supplier_name}
                                onChange={(e) => handleNewItemChange('supplier_name', e.target.value)}
                                placeholder={TOUR_CONFIRMATION_SHEET_PAGE_LABELS.車行}
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
                                placeholder={TOUR_CONFIRMATION_SHEET_PAGE_LABELS.備註}
                                className="w-full h-full px-3 py-2 text-sm bg-transparent border-0 outline-none focus:bg-card focus:ring-2 focus:ring-inset focus:ring-morandi-gold/50 placeholder:text-morandi-secondary/50"
                              />
                            </td>
                            <td className="px-2 py-2">
                              <div className="flex items-center gap-1 justify-end">
                                <button
                                  onClick={handleSaveNewItem}
                                  disabled={savingNew}
                                  className="p-1.5 text-white bg-morandi-green hover:bg-morandi-green/80 rounded disabled:opacity-50"
                                  title={TOUR_CONFIRMATION_SHEET_PAGE_LABELS.儲存}
                                >
                                  {savingNew ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                </button>
                                <button
                                  onClick={handleCancelAdd}
                                  disabled={savingNew}
                                  className="p-1.5 text-white bg-morandi-red hover:bg-morandi-red/80 rounded disabled:opacity-50"
                                  title={TOUR_CONFIRMATION_SHEET_PAGE_LABELS.取消}
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    )}

                    {/* 其他類別的 Inline 新增行 */}
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
                            placeholder={TOUR_CONFIRMATION_SHEET_PAGE_LABELS.輸入供應商}
                            className="w-full h-full px-3 py-2 text-sm bg-transparent border-0 outline-none focus:bg-card focus:ring-2 focus:ring-inset focus:ring-morandi-gold/50 placeholder:text-morandi-secondary/50"
                          />
                        </td>
                        <td className="p-0 border-r border-border/30">
                          <input
                            value={newItemData.title}
                            onChange={(e) => handleNewItemChange('title', e.target.value)}
                            placeholder={TOUR_CONFIRMATION_SHEET_PAGE_LABELS.輸入項目說明}
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
                            placeholder={TOUR_CONFIRMATION_SHEET_PAGE_LABELS.輸入備註}
                            className="w-full h-full px-3 py-2 text-sm bg-transparent border-0 outline-none focus:bg-card focus:ring-2 focus:ring-inset focus:ring-morandi-gold/50 placeholder:text-morandi-secondary/50"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-1 justify-end">
                            <button
                              onClick={handleSaveNewItem}
                              disabled={savingNew}
                              className="p-1.5 text-white bg-morandi-green hover:bg-morandi-green/80 rounded disabled:opacity-50"
                              title={TOUR_CONFIRMATION_SHEET_PAGE_LABELS.儲存}
                            >
                              {savingNew ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                            </button>
                            <button
                              onClick={handleCancelAdd}
                              disabled={savingNew}
                              className="p-1.5 text-white bg-morandi-red hover:bg-morandi-red/80 rounded disabled:opacity-50"
                              title={TOUR_CONFIRMATION_SHEET_PAGE_LABELS.取消}
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
              {(() => {
                const expectedForeign = allItems.reduce((sum, item) => {
                  const typeData = item.type_data as { subtotal_currency?: string } | null
                  if (typeData?.subtotal_currency === destinationCurrency) {
                    return sum + (item.expected_cost || 0)
                  }
                  return sum
                }, 0)
                return (
                  <tr className="bg-morandi-container/50 border-t-2 border-border font-medium">
                    <td colSpan={7} className="px-2 py-2 text-right text-morandi-primary">
                      總計
                    </td>
                    <td className="px-2 py-2 text-right font-mono text-morandi-primary">
                      {expectedForeign > 0 && (
                        <div className="text-morandi-gold">
                          {getCurrencySymbol(destinationCurrency)} {expectedForeign.toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td className="px-2 py-2 text-right font-mono text-morandi-primary">
                      {formatCurrency(costSummary.total.actual)}
                    </td>
                    <td className="px-2 py-2"></td>
                  </tr>
                )
              })()}
            </tfoot>
          </table>
        </div>

        {/* 結算區塊 */}
        <SettlementSection
          items={allItems}
          destinationCurrency={destinationCurrency}
          effectiveExchangeRate={effectiveExchangeRate}
          onEditExchangeRate={() => {
            setExchangeRateInput(effectiveExchangeRate?.toString() || '')
            setExchangeRateDialog({ open: true, itemId: null })
          }}
          onSetExchangeRate={() => setExchangeRateDialog({ open: true, itemId: null })}
        />
      </div>{/* 結束 print-content */}

      {/* 編輯對話框 */}
      <ItemEditDialog
        open={editDialog.open}
        category={editDialog.category}
        item={editDialog.item}
        sheetId={sheet?.id || ''}
        onClose={() => setEditDialog({ open: false, category: 'transport', item: null })}
        onSave={handleSave}
      />

      {/* 匯率設定對話框 */}
      <ExchangeRateDialog
        open={exchangeRateDialog.open}
        onOpenChange={(open) => !open && setExchangeRateDialog({ open: false, itemId: null })}
        destinationCurrency={destinationCurrency}
        exchangeRateInput={exchangeRateInput}
        onExchangeRateInputChange={setExchangeRateInput}
        onSave={handleSaveExchangeRate}
      />
    </div>
  )
}
