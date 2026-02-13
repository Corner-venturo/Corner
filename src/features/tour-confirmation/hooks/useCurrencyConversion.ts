import { useState, useCallback } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { logger } from '@/lib/utils/logger'
import {
  getCurrencyName,
  getCurrencySymbol,
} from '../constants/currency'
import { TOUR_CONFIRMATION_SHEET_PAGE_LABELS } from '../constants/labels'
import type { TourConfirmationItem, GroupedConfirmationItems } from '@/types/tour-confirmation-sheet.types'
import type { MutableRefObject } from 'react'

interface UseCurrencyConversionOptions {
  sheet: { exchange_rate?: number | null } | null
  destinationCurrency: string | null
  groupedItems: GroupedConfirmationItems
  updateItem: (id: string, data: Record<string, unknown>) => Promise<unknown>
  updateSheet: (data: Record<string, unknown>) => Promise<unknown>
  localExpectedCostsRef: MutableRefObject<
    Record<string, { value: number | null; formula?: string; dirty: boolean }>
  >
  forceUpdate: () => void
}

/**
 * 匯率設定 & 幣值轉換邏輯
 */
export function useCurrencyConversion({
  sheet,
  destinationCurrency,
  groupedItems,
  updateItem,
  updateSheet,
  localExpectedCostsRef,
  forceUpdate,
}: UseCurrencyConversionOptions) {
  const { toast } = useToast()

  const [exchangeRateDialog, setExchangeRateDialog] = useState<{
    open: boolean
    itemId: string | null
  }>({ open: false, itemId: null })
  const [exchangeRateInput, setExchangeRateInput] = useState('')
  const [localExchangeRate, setLocalExchangeRate] = useState<number | null>(null)

  const effectiveExchangeRate = sheet?.exchange_rate ?? localExchangeRate

  const handleCurrencyConvert = useCallback(
    async (itemId: string) => {
      if (!sheet) return

      if (!effectiveExchangeRate) {
        setExchangeRateDialog({ open: true, itemId })
        return
      }

      const item = Object.values(groupedItems)
        .flat()
        .find((i) => i.id === itemId)
      if (!item) return

      const twdSubtotal = (item.unit_price || 0) * (item.quantity || 1)
      if (twdSubtotal <= 0) {
        toast({
          title: TOUR_CONFIRMATION_SHEET_PAGE_LABELS.小計為_0_無法換算,
          variant: 'destructive',
        })
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
          type_data: updatedTypeData,
        })

        localExpectedCostsRef.current[itemId] = {
          value: foreignAmount,
          formula: undefined,
          dirty: false,
        }
        forceUpdate()

        toast({
          title: `已換算為${currencyName}`,
          description: `${twdSubtotal.toLocaleString()} TWD ÷ ${effectiveExchangeRate} = ${foreignAmount.toLocaleString()} ${destinationCurrency}`,
        })
      } catch (err) {
        logger.error('換算失敗:', err)
        toast({
          title: TOUR_CONFIRMATION_SHEET_PAGE_LABELS.換算失敗,
          variant: 'destructive',
        })
      }
    },
    [
      sheet,
      effectiveExchangeRate,
      groupedItems,
      destinationCurrency,
      updateItem,
      localExpectedCostsRef,
      forceUpdate,
      toast,
    ]
  )

  const handleSaveExchangeRate = useCallback(async () => {
    const rate = parseFloat(exchangeRateInput)
    if (isNaN(rate) || rate <= 0) {
      toast({
        title: TOUR_CONFIRMATION_SHEET_PAGE_LABELS.請輸入有效的匯率,
        variant: 'destructive',
      })
      return
    }

    try {
      await updateSheet({
        exchange_rate: rate,
        foreign_currency: destinationCurrency,
      })
      toast({
        title: TOUR_CONFIRMATION_SHEET_PAGE_LABELS.匯率設定成功,
        description: `1 ${destinationCurrency} = ${rate} TWD`,
      })
    } catch (err) {
      logger.warn('無法儲存匯率到資料庫，使用本地狀態:', err)
      setLocalExchangeRate(rate)
      toast({
        title: TOUR_CONFIRMATION_SHEET_PAGE_LABELS.匯率已設定_本次有效,
        description: `1 ${destinationCurrency} = ${rate} TWD`,
      })
    }

    const pendingItemId = exchangeRateDialog.itemId
    setExchangeRateDialog({ open: false, itemId: null })
    setExchangeRateInput('')

    if (pendingItemId) {
      const item = Object.values(groupedItems)
        .flat()
        .find((i) => i.id === pendingItemId)
      if (item?.expected_cost) {
        const convertedAmount = Math.round(item.expected_cost / rate)
        toast({
          title: `換算結果`,
          description: `${item.expected_cost.toLocaleString()} TWD = ${convertedAmount.toLocaleString()} ${destinationCurrency || TOUR_CONFIRMATION_SHEET_PAGE_LABELS.外幣}`,
        })
      }
    }
  }, [
    exchangeRateInput,
    exchangeRateDialog.itemId,
    destinationCurrency,
    groupedItems,
    updateSheet,
    toast,
  ])

  const openExchangeRateDialog = useCallback(
    (itemId: string | null = null) => {
      setExchangeRateInput(effectiveExchangeRate?.toString() || '')
      setExchangeRateDialog({ open: true, itemId })
    },
    [effectiveExchangeRate]
  )

  return {
    effectiveExchangeRate,
    exchangeRateDialog,
    exchangeRateInput,
    setExchangeRateInput,
    setExchangeRateDialog,
    handleCurrencyConvert,
    handleSaveExchangeRate,
    openExchangeRateDialog,
  }
}
