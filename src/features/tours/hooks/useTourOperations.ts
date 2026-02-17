'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Tour } from '@/stores/types'
import { tourService } from '@/features/tours/services/tour.service'
import { logger } from '@/lib/utils/logger'
import { NewTourData } from '../types'
import { OrderFormData } from '@/features/orders/components/add-order-form'
import type { CreateInput, UpdateInput } from '@/stores/core/types'
import { useCountries, useCities, updateCountry, updateCity, updateQuote } from '@/data'
import { createOrder } from '@/data/entities/orders'
import { TOUR_OPERATIONS_LABELS } from '../constants/labels'
import {
  checkTourDependencies,
  checkTourPaidOrders,
  deleteTourEmptyOrders,
  unlinkTourQuotes,
  unlinkTourItineraries,
} from '@/features/tours/services/tour_dependency.service'

interface TourActions {
  create: (data: CreateInput<Tour>) => Promise<Tour>
  update: (id: string, data: UpdateInput<Tour>) => Promise<Tour>
  delete: (id: string) => Promise<boolean | void>
}

// 🔧 優化：移除不必要的外部依賴，改成內部直接查詢
// 🔧 編輯模式已移至 TourEditDialog + useTourEdit hook
interface UseTourOperationsParams {
  actions: TourActions
  resetForm: () => void
  closeDialog: () => void
  setSubmitting: (value: boolean) => void
  setFormError: (error: string | null) => void
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
    workspaceId,
    onQuoteLinked,
  } = params

  const handleAddTour = useCallback(
    async (newTour: NewTourData, newOrder: Partial<OrderFormData>, fromQuoteId?: string) => {
      // Zod schema 驗證必填欄位
      const { createTourSchema } = await import('@/lib/validations/schemas')
      const validation = createTourSchema.safeParse({
        name: newTour.name.trim(),
        departure_date: newTour.departure_date,
        return_date: newTour.return_date,
      })
      if (!validation.success) {
        setFormError(validation.error.issues[0].message)
        return
      }

      // Check custom destination
      if (newTour.countryCode === '__custom__') {
        if (!newTour.customCountry?.trim()) {
          alert(TOUR_OPERATIONS_LABELS.FILL_COUNTRY_NAME)
          return
        }
        if (!newTour.customLocation?.trim()) {
          alert(TOUR_OPERATIONS_LABELS.FILL_CITY_NAME)
          return
        }
        if (!newTour.customCityCode?.trim()) {
          alert(TOUR_OPERATIONS_LABELS.FILL_CITY_CODE)
          return
        }
        if (newTour.customCityCode.length !== 3) {
          alert(TOUR_OPERATIONS_LABELS.CITY_CODE_3_CHARS)
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
          setFormError(TOUR_OPERATIONS_LABELS.SELECT_CITY_OR_SET_AIRPORT)
          setSubmitting(false)
          return
        }

        // Create new tour (edit mode now uses TourEditDialog with useTourEdit hook)
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

        // If contact person is filled, also add order (業務必填)
        if (newOrder.contact_person?.trim() && newOrder.sales_person?.trim()) {
          // 🔧 優化：直接用 supabase insert，不依賴外部 hook
          const order_number = `${code}-O01`
          const memberCount = newOrder.member_count || 1
          const totalAmount = newOrder.total_amount || newTour.price * memberCount
          const now = new Date().toISOString()
          try {
            await createOrder({
              order_number,
              tour_id: createdTour.id,
              tour_name: newTour.name,
              contact_person: newOrder.contact_person,
              sales_person: newOrder.sales_person || '',
              assistant: newOrder.assistant || '',
              member_count: memberCount,
              payment_status: 'unpaid',
              total_amount: totalAmount,
              paid_amount: 0,
              remaining_amount: totalAmount,
              code,
            } as Parameters<typeof createOrder>[0])
          } catch (orderErr) {
            logger.warn('建立訂單失敗:', (orderErr as Error).message)
          }
        }

        // If created from quote, update quote's tourId
        if (fromQuoteId) {
          // 🔧 優化：直接用 supabase update
          try {
            await updateQuote(fromQuoteId, { tour_id: createdTour.id } as Parameters<typeof updateQuote>[1])
          } catch (quoteError) {
            logger.warn('更新報價單失敗:', quoteError instanceof Error ? quoteError.message : quoteError)
          }
          onQuoteLinked?.(fromQuoteId, createdTour.id)
        }

        resetForm()
        closeDialog()

        // 開團成功後跳轉到詳情頁
        router.push(`/tours/${code}`)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : TOUR_OPERATIONS_LABELS.CREATE_TOUR_FAILED
        setFormError(errorMessage)
        logger.error('Failed to create tour:', err)
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
      router,
      incrementCountryUsage,
      incrementCityUsage,
      workspaceId,
      onQuoteLinked,
    ]
  )

  const handleDeleteTour = useCallback(
    async (tour: Tour | null): Promise<{ success: boolean; error?: string }> => {
      if (!tour) return { success: false, error: TOUR_OPERATIONS_LABELS.INVALID_TOUR }

      try {
        // 檢查是否有關聯資料（團員、收款單、請款單、PNR 不能刪）
        const { blockers, hasBlockers } = await checkTourDependencies(tour.id)

        if (hasBlockers) {
          const errorMsg = TOUR_OPERATIONS_LABELS.CANNOT_DELETE_HAS_DEPS(blockers.join('、'))
          logger.warn(`刪除旅遊團 ${tour.code} 失敗：${errorMsg}`)
          return { success: false, error: errorMsg }
        }

        // 檢查是否有已付款訂單
        const { hasPaidOrders, count: paidCount } = await checkTourPaidOrders(tour.id)
        if (hasPaidOrders) {
          return { success: false, error: TOUR_OPERATIONS_LABELS.CANNOT_DELETE_PAID_ORDERS(paidCount) }
        }

        // 刪除關聯的訂單（沒有團員的空訂單可以刪）
        await deleteTourEmptyOrders(tour.id)

        // 斷開關聯的報價單和行程表
        const linkedQuotesCount = await unlinkTourQuotes(tour.id)
        const linkedItinerariesCount = await unlinkTourItineraries(tour.id)

        // 刪除旅遊團
        await actions.delete(tour.id)

        logger.info(`已刪除旅遊團 ${tour.code}，斷開 ${linkedQuotesCount} 個報價單和 ${linkedItinerariesCount} 個行程表的連結`)
        return { success: true }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : TOUR_OPERATIONS_LABELS.DELETE_TOUR_FAILED
        logger.error('刪除旅遊團失敗:', JSON.stringify(err, null, 2))
        return { success: false, error: errorMsg }
      }
    },
    [actions]
  )


  const handleArchiveTour = useCallback(
    async (tour: Tour, reason?: string) => {
      try {
        // 封存時斷開連結，解除封存不需要
        if (!tour.archived) {
          const linkedQuotesCount = await unlinkTourQuotes(tour.id)
          const linkedItinerariesCount = await unlinkTourItineraries(tour.id)
          logger.info(`封存旅遊團 ${tour.code}，斷開 ${linkedQuotesCount} 個報價單和 ${linkedItinerariesCount} 個行程表的連結`)
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
