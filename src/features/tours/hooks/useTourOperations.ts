'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Tour } from '@/stores/types'
import { tourService } from '@/features/tours/services/tour.service'
import { logger } from '@/lib/utils/logger'
import { NewTourData } from '../types'
import { OrderFormData } from '@/components/orders/add-order-form'
import type { CreateInput, UpdateInput } from '@/stores/core/types'
import { useCountries, useCities, updateCountry, updateCity } from '@/data'
import { supabase } from '@/lib/supabase/client'

interface TourActions {
  create: (data: CreateInput<Tour>) => Promise<Tour>
  update: (id: string, data: UpdateInput<Tour>) => Promise<Tour>
  delete: (id: string) => Promise<boolean | void>
}

// 🔧 優化：移除不必要的外部依賴，改成內部直接查詢
interface UseTourOperationsParams {
  actions: TourActions
  resetForm: () => void
  closeDialog: () => void
  setSubmitting: (value: boolean) => void
  setFormError: (error: string | null) => void
  dialogType: string
  dialogData: Tour | null
  workspaceId?: string
  // 🔧 保留 fromQuoteId 更新功能（可選）
  onQuoteLinked?: (quoteId: string, tourId: string) => void
}

export function useTourOperations(params: UseTourOperationsParams) {
  const router = useRouter()
  const { items: countries } = useCountries()
  const { items: cities } = useCities()

  // Helper functions to increment usage count (replaces store methods)
  const incrementCountryUsage = async (countryName: string) => {
    const country = countries.find(c => c.name === countryName)
    if (!country) return
    const newCount = (country.usage_count || 0) + 1
    await updateCountry(country.id, { usage_count: newCount })
  }

  const incrementCityUsage = async (cityName: string) => {
    const city = cities.find(c => c.name === cityName)
    if (!city) return
    const newCount = (city.usage_count || 0) + 1
    await updateCity(city.id, { usage_count: newCount })
  }

  const {
    actions,
    resetForm,
    closeDialog,
    setSubmitting,
    setFormError,
    dialogType,
    dialogData,
    workspaceId,
    onQuoteLinked,
  } = params

  const handleAddTour = useCallback(
    async (newTour: NewTourData, newOrder: Partial<OrderFormData>, fromQuoteId?: string) => {
      // 驗證必填欄位，並給用戶明確的錯誤提示
      if (!newTour.name.trim()) {
        setFormError('請填寫團名')
        return
      }
      if (!newTour.departure_date) {
        setFormError('請選擇出發日期')
        return
      }
      if (!newTour.return_date) {
        setFormError('請選擇回程日期')
        return
      }

      // Check custom destination
      if (newTour.countryCode === '__custom__') {
        if (!newTour.customCountry?.trim()) {
          alert('請填寫國家名稱')
          return
        }
        if (!newTour.customLocation?.trim()) {
          alert('請填寫城市名稱')
          return
        }
        if (!newTour.customCityCode?.trim()) {
          alert('請填寫城市代號')
          return
        }
        if (newTour.customCityCode.length !== 3) {
          alert('城市代號必須是 3 碼')
          return
        }
      }

      try {
        setSubmitting(true)
        setFormError(null)

        const departure_date = new Date(newTour.departure_date)

        // Determine city code and name
        const cityCode =
          newTour.countryCode === '__custom__' ? newTour.customCityCode! : newTour.cityCode
        const cityName =
          newTour.countryCode === '__custom__'
            ? newTour.customLocation!
            : newTour.cityName || newTour.cityCode

        // 驗證城市代碼（團號需要 3 碼英文城市代碼）
        if (!cityCode || cityCode.length < 2) {
          setFormError('請選擇城市，或在「系統設定 > 地區管理」中為該城市設定機場代碼')
          setSubmitting(false)
          return
        }

        // Edit mode: update existing tour
        if (dialogType === 'edit' && dialogData) {
          const tourData = {
            name: newTour.name,
            location: cityName,
            departure_date: newTour.departure_date,
            return_date: newTour.return_date,
            status: newTour.status,
            price: newTour.price,
            max_participants: newTour.max_participants,
            description: newTour.description,
            enable_checkin: newTour.enable_checkin || false,
            controller_id: newTour.controller_id || null,
          }

          await actions.update(dialogData.id, tourData)
          resetForm()
          closeDialog()
          return
        }

        // Create mode: create new tour
        const code = await tourService.generateTourCode(cityCode, departure_date, newTour.isSpecial)

        // 解析航班文字為 FlightInfo（簡單格式：航空公司 班次 時間）
        const parseFlightText = (text?: string): import('@/stores/types').FlightInfo | null => {
          if (!text?.trim()) return null
          // 存儲原始文字到 flightNumber，其他欄位留空讓用戶在行程表中填寫
          return {
            airline: '',
            flightNumber: text.trim(),
            departureAirport: '',
            departureTime: '',
            arrivalAirport: '',
            arrivalTime: '',
          }
        }

        const tourData = {
          name: newTour.name,
          location: cityName,
          departure_date: newTour.departure_date,
          return_date: newTour.return_date,
          status: newTour.status,
          price: newTour.price,
          max_participants: newTour.max_participants,
          code,
          contract_status: 'pending' as const,
          total_revenue: 0,
          total_cost: 0,
          profit: 0,
          current_participants: 0,
          quote_id: fromQuoteId || undefined,
          enable_checkin: newTour.enable_checkin || false,
          controller_id: newTour.controller_id || undefined,
          outbound_flight: parseFlightText(newTour.outbound_flight_text),
          return_flight: parseFlightText(newTour.return_flight_text),
          workspace_id: workspaceId, // RLS 必須
        }

        const createdTour = await actions.create(tourData)

        // 更新國家和城市的使用次數（讓常用的排在前面）
        const countryName = newTour.countryCode === '__custom__'
          ? newTour.customCountry!
          : newTour.countryCode
        if (countryName) {
          incrementCountryUsage(countryName)
        }
        if (cityName) {
          incrementCityUsage(cityName)
        }

        // If contact person is filled, also add order
        if (newOrder.contact_person?.trim()) {
          // 🔧 優化：直接用 supabase insert，不依賴外部 hook
          const order_number = `${code}-O01`
          const memberCount = newOrder.member_count || 1
          const totalAmount = newOrder.total_amount || newTour.price * memberCount
          const now = new Date().toISOString()
          const orderData = {
            id: crypto.randomUUID(),
            order_number,
            tour_id: createdTour.id,
            code: code,
            tour_name: newTour.name,
            contact_person: newOrder.contact_person,
            sales_person: newOrder.sales_person || '',
            assistant: newOrder.assistant || '',
            member_count: memberCount,
            payment_status: 'unpaid' as const,
            total_amount: totalAmount,
            paid_amount: 0,
            remaining_amount: totalAmount,
            workspace_id: workspaceId,
            created_at: now,
            updated_at: now,
          }

          const { error: orderError } = await supabase.from('orders').insert(orderData)
          if (orderError) {
            logger.warn('建立訂單失敗:', orderError.message)
          }
        }

        // If created from quote, update quote's tourId
        if (fromQuoteId) {
          // 🔧 優化：直接用 supabase update
          const { error: quoteError } = await supabase
            .from('quotes')
            .update({ tour_id: createdTour.id, updated_at: new Date().toISOString() })
            .eq('id', fromQuoteId)
          if (quoteError) {
            logger.warn('更新報價單失敗:', quoteError.message)
          }
          onQuoteLinked?.(fromQuoteId, createdTour.id)
          router.replace('/tours')
        }

        resetForm()
        closeDialog()
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : dialogType === 'edit'
              ? '更新旅遊團失敗'
              : '建立旅遊團失敗'
        setFormError(errorMessage)
        logger.error('Failed to create/update tour:', err)
      } finally {
        setSubmitting(false)
      }
    },
    [
      actions,
      resetForm,
      closeDialog,
      setSubmitting,
      setFormError,
      dialogType,
      dialogData,
      router,
      incrementCountryUsage,
      incrementCityUsage,
      workspaceId,
      onQuoteLinked,
    ]
  )

  const handleDeleteTour = useCallback(
    async (tour: Tour | null) => {
      if (!tour) return

      try {
        // 1. 刪除關聯的 PNRs
        const { error: pnrError } = await supabase
          .from('pnrs')
          .delete()
          .eq('tour_id', tour.id)
        if (pnrError) {
          logger.warn('刪除 PNRs 失敗:', JSON.stringify(pnrError))
        }

        // 2. 刪除關聯的請款單 (payment_requests)
        const { error: prError } = await supabase
          .from('payment_requests')
          .delete()
          .eq('tour_id', tour.id)
        if (prError) {
          logger.warn('刪除請款單失敗:', JSON.stringify(prError))
        }

        // 4. 刪除關聯的收款單 (receipt_orders)
        const { error: roError } = await supabase
          .from('receipt_orders')
          .delete()
          .eq('tour_id', tour.id)
        if (roError) {
          logger.warn('刪除收款單失敗:', JSON.stringify(roError))
        }

        // 5. 刪除關聯的團員 (order_members)
        const { error: omError } = await supabase
          .from('order_members')
          .delete()
          .eq('tour_id', tour.id)
        if (omError) {
          logger.warn('刪除團員失敗:', JSON.stringify(omError))
        }

        // 6. 刪除關聯的訂單 (orders)
        const { error: ordError } = await supabase
          .from('orders')
          .delete()
          .eq('tour_id', tour.id)
        if (ordError) {
          logger.warn('刪除訂單失敗:', JSON.stringify(ordError))
        }

        // 7. 🔧 優化：直接查詢並斷開關聯的報價單
        const { data: linkedQuotes } = await supabase
          .from('quotes')
          .select('id')
          .eq('tour_id', tour.id)

        if (linkedQuotes && linkedQuotes.length > 0) {
          const { error: quoteError } = await supabase
            .from('quotes')
            .update({ tour_id: null, status: 'proposed', updated_at: new Date().toISOString() })
            .eq('tour_id', tour.id)
          if (quoteError) {
            logger.warn('斷開報價單失敗:', quoteError.message)
          }
        }

        // 8. 🔧 優化：直接查詢並斷開關聯的行程表
        const { data: linkedItineraries } = await supabase
          .from('itineraries')
          .select('id')
          .eq('tour_id', tour.id)

        if (linkedItineraries && linkedItineraries.length > 0) {
          const { error: itinError } = await supabase
            .from('itineraries')
            .update({ tour_id: null, tour_code: null, status: '提案', updated_at: new Date().toISOString() })
            .eq('tour_id', tour.id)
          if (itinError) {
            logger.warn('斷開行程表失敗:', itinError.message)
          }
        }

        // 9. 刪除旅遊團
        await actions.delete(tour.id)

        logger.info(`已刪除旅遊團 ${tour.code}，包含相關訂單、請款單、收款單，並斷開 ${linkedQuotes?.length || 0} 個報價單和 ${linkedItineraries?.length || 0} 個行程表的連結`)
      } catch (err) {
        logger.error('刪除旅遊團失敗:', JSON.stringify(err, null, 2))
      }
    },
    [actions]
  )


  const handleArchiveTour = useCallback(
    async (tour: Tour, reason?: string) => {
      try {
        // 封存時斷開連結，解除封存不需要
        if (!tour.archived) {
          // 1. 🔧 優化：直接查詢並斷開關聯的報價單
          const { data: linkedQuotes } = await supabase
            .from('quotes')
            .select('id')
            .eq('tour_id', tour.id)

          if (linkedQuotes && linkedQuotes.length > 0) {
            const { error: quoteError } = await supabase
              .from('quotes')
              .update({ tour_id: null, status: 'proposed', updated_at: new Date().toISOString() })
              .eq('tour_id', tour.id)
            if (quoteError) {
              logger.warn('斷開報價單失敗:', quoteError.message)
            }
          }

          // 2. 🔧 優化：直接查詢並斷開關聯的行程表
          const { data: linkedItineraries } = await supabase
            .from('itineraries')
            .select('id')
            .eq('tour_id', tour.id)

          if (linkedItineraries && linkedItineraries.length > 0) {
            const { error: itinError } = await supabase
              .from('itineraries')
              .update({ tour_id: null, tour_code: null, status: '提案', updated_at: new Date().toISOString() })
              .eq('tour_id', tour.id)
            if (itinError) {
              logger.warn('斷開行程表失敗:', itinError.message)
            }
          }

          logger.info(`封存旅遊團 ${tour.code}，斷開 ${linkedQuotes?.length || 0} 個報價單和 ${linkedItineraries?.length || 0} 個行程表的連結`)
        }

        // 封存時記錄原因，解除封存時清除原因
        await actions.update(tour.id, {
          archived: !tour.archived,
          archive_reason: tour.archived ? null : reason,
        } as Partial<Tour>)
        logger.info(tour.archived ? '已解除封存旅遊團' : `已封存旅遊團，原因：${reason}`)
      } catch (err) {
        logger.error('封存/解封旅遊團失敗:', err)
      }
    },
    [actions]
  )

  return {
    handleAddTour,
    handleDeleteTour,
    handleArchiveTour,
  }
}
