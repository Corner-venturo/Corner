/**
 * useCreateDisbursement Hook
 * 管理建立出納單的狀態與邏輯
 */

'use client'

import { getTodayString, formatDate } from '@/lib/utils/format-date'
import { useState, useMemo, useCallback } from 'react'
import { PaymentRequest, DisbursementOrder } from '@/stores/types'
import {
  useDisbursementOrders,
  updatePaymentRequest as updatePaymentRequestApi,
  invalidateDisbursementOrders,
} from '@/data'
import { useAuthStore } from '@/stores/auth-store'
import { dynamicFrom } from '@/lib/supabase/typed-client'
import { alert } from '@/lib/ui/alert-dialog'
import { logger } from '@/lib/utils/logger'
import { createDisbursementSchema } from '@/lib/validations/schemas'
import { DISBURSEMENT_LABELS } from '../constants/labels'

// 計算下一個週四
function getNextThursday(): Date {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const daysUntilThursday = (4 - dayOfWeek + 7) % 7 || 7
  const nextThursday = new Date(today)
  nextThursday.setDate(today.getDate() + daysUntilThursday)
  return nextThursday
}

// 生成出納單號
async function generateDisbursementNumber(existingOrders: DisbursementOrder[]): Promise<string> {
  const now = new Date()
  const year = String(now.getFullYear()).slice(-1)
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const dateStr = `${year}${month}${day}`
  const prefix = `DO${dateStr}`

  const todayOrders = existingOrders.filter(o => o.order_number?.startsWith(prefix))
  let nextNum = 1
  if (todayOrders.length > 0) {
    const lastOrder = todayOrders.sort((a, b) =>
      (b.order_number || '').localeCompare(a.order_number || '')
    )[0]
    const match = lastOrder.order_number?.match(/-(\d+)$/)
    if (match) {
      nextNum = parseInt(match[1], 10) + 1
    }
  }

  return `${prefix}-${String(nextNum).padStart(3, '0')}`
}

interface UseCreateDisbursementProps {
  pendingRequests: PaymentRequest[]
  onSuccess: () => void
}

export function useCreateDisbursement({ pendingRequests, onSuccess }: UseCreateDisbursementProps) {
  // 使用 @/data hooks（SWR 自動載入）
  const { items: disbursement_orders } = useDisbursementOrders()
  const user = useAuthStore(state => state.user)

  // 狀態
  const [disbursementDate, setDisbursementDate] = useState(
    formatDate(getNextThursday())
  )
  const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 篩選請款單
  const filteredRequests = useMemo(() => {
    return pendingRequests.filter(r => {
      // 搜尋篩選
      if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase()
        const matchSearch =
          r.code?.toLowerCase().includes(lowerSearch) ||
          r.tour_code?.toLowerCase().includes(lowerSearch) ||
          r.tour_name?.toLowerCase().includes(lowerSearch)
        if (!matchSearch) return false
      }

      // 日期篩選
      if (dateFilter) {
        if (!r.created_at || !r.created_at.startsWith(dateFilter)) return false
      }

      // 狀態篩選
      if (statusFilter !== 'all') {
        if (r.status !== statusFilter) return false
      }

      return true
    })
  }, [pendingRequests, searchTerm, dateFilter, statusFilter])

  // 選中的總金額
  const selectedAmount = useMemo(() => {
    return pendingRequests
      .filter(r => selectedRequestIds.includes(r.id))
      .reduce((sum, r) => sum + (r.amount || 0), 0)
  }, [pendingRequests, selectedRequestIds])

  // 切換選擇
  const toggleSelect = useCallback((requestId: string) => {
    setSelectedRequestIds(prev =>
      prev.includes(requestId)
        ? prev.filter(id => id !== requestId)
        : [...prev, requestId]
    )
  }, [])

  // 全選/取消全選
  const toggleSelectAll = useCallback(() => {
    if (selectedRequestIds.length === filteredRequests.length && filteredRequests.length > 0) {
      setSelectedRequestIds([])
    } else {
      setSelectedRequestIds(filteredRequests.map(r => r.id))
    }
  }, [filteredRequests, selectedRequestIds])

  // 設為今日
  const setToday = useCallback(() => {
    setDateFilter(getTodayString())
  }, [])

  // 清除篩選
  const clearFilters = useCallback(() => {
    setSearchTerm('')
    setDateFilter('')
    setStatusFilter('all')
  }, [])

  // 建立出納單
  const handleCreate = useCallback(async () => {
    const validation = createDisbursementSchema.safeParse({
      selectedRequestIds,
      disbursementDate,
    })
    if (!validation.success) {
      void alert(validation.error.issues[0].message, 'warning')
      return
    }

    setIsSubmitting(true)
    try {
      // 生成出納單號
      const orderNumber = await generateDisbursementNumber(disbursement_orders)

      // 直接使用 Supabase 建立出納單（繞過 store 的 workspace_id 檢查）

      const { data, error } = await dynamicFrom('disbursement_orders')
        .insert({
          id: crypto.randomUUID(),
          code: orderNumber,
          order_number: orderNumber,
          disbursement_date: disbursementDate,
          payment_request_ids: selectedRequestIds,
          amount: selectedAmount,
          status: 'pending',
          workspace_id: user?.workspace_id || null,
          created_by: user?.id || null,
        })
        .select()
        .single()

      if (error) {
        logger.error(DISBURSEMENT_LABELS.Supabase_錯誤, error)
        throw new Error(error.message)
      }

      // 更新請款單狀態為 approved（已確認，已加入出納單）
      for (const id of selectedRequestIds) {
        await updatePaymentRequestApi(id, { status: 'approved' })
      }

      // 重新載入出納單列表（SWR 快取失效）
      await invalidateDisbursementOrders()

      await alert(`出納單 ${orderNumber} 建立成功`, 'success')

      // 重置狀態
      resetForm()
      onSuccess()
    } catch (error) {
      logger.error(DISBURSEMENT_LABELS.建立出納單失敗, error)
      const errorMessage = error instanceof Error ? error.message : DISBURSEMENT_LABELS.未知錯誤
      await alert(`建立出納單失敗: ${errorMessage}`, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }, [
    selectedRequestIds,
    selectedAmount,
    disbursement_orders,
    disbursementDate,
    user,
    onSuccess,
  ])

  // 重置表單
  const resetForm = useCallback(() => {
    setSelectedRequestIds([])
    setSearchTerm('')
    setDateFilter('')
    setStatusFilter('all')
  }, [])

  return {
    // 狀態
    disbursementDate,
    selectedRequestIds,
    searchTerm,
    dateFilter,
    statusFilter,
    isSubmitting,
    filteredRequests,
    selectedAmount,

    // 設定函數
    setDisbursementDate,
    setSearchTerm,
    setDateFilter,
    setStatusFilter,

    // 操作函數
    toggleSelect,
    toggleSelectAll,
    setToday,
    clearFilters,
    handleCreate,
    resetForm,
  }
}
