'use client'

import { createTour, invalidateTours } from '@/data'
import { useVisas, createVisa, updateVisa as updateVisaData, deleteVisa as deleteVisaData } from '@/data'
import { useAuthStore } from '@/stores/auth-store'
import { createOrder, updateOrder, deleteOrder as deleteOrderData } from '@/data'
import { useMemo, useCallback, useState } from 'react'
import { toast } from 'sonner'
import { logger } from '@/lib/utils/logger'
import { supabase } from '@/lib/supabase/client'
import type { Tour, Order } from '@/stores/types'

/**
 * 簽證資料管理 Hook
 * 🔧 優化：只載入 visas，tours/orders 按需載入
 */
export function useVisasData() {
  const { items: visas } = useVisas()
  const { user } = useAuthStore()

  // tours 和 orders 改成按需載入
  const [tours, setTours] = useState<Tour[]>([])
  const [orders, setOrders] = useState<Order[]>([])

  // 權限檢查（暫時開放給所有人）
  const canManageVisas = useMemo(() => {
    return true // 所有登入使用者都可以管理簽證
  }, [])

  // 按需載入 tours（新增對話框打開時調用，排除封存的）
  const fetchToursOnDemand = useCallback(async () => {
    if (tours.length > 0) return // 已載入過就不重複載入
    const { data } = await supabase
      .from('tours')
      .select('*')
      .or('archived.is.null,archived.eq.false') // 排除封存的
      .order('created_at', { ascending: false })
    if (data) setTours(data as Tour[])
  }, [tours.length])

  // 按需載入 orders（對話框打開時調用）
  const fetchOrdersOnDemand = useCallback(async () => {
    if (orders.length > 0) return
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setOrders(data as Order[])
  }, [orders.length])

  /**
   * 刪除簽證並連動處理（直接查詢 Supabase，不依賴預載入的 orders）
   */
  const deleteVisaWithCascade = useCallback(async (visaId: string) => {
    const visa = visas.find(v => v.id === visaId)
    if (!visa) {
      logger.error('找不到簽證:', visaId)
      return
    }

    const { order_id, applicant_name, fee } = visa

    try {
      // 1. 刪除簽證
      await deleteVisaData(visaId)

      // 2. 刪除對應的訂單成員
      if (order_id && applicant_name) {
        const { data: memberToDelete } = await supabase
          .from('order_members')
          .select('id')
          .eq('order_id', order_id)
          .or(`chinese_name.eq.${applicant_name},name.eq.${applicant_name}`)
          .limit(1)
          .single()

        if (memberToDelete) {
          await supabase.from('order_members').delete().eq('id', memberToDelete.id)
        }
      }

      // 3. 檢查該訂單是否還有其他簽證（直接查詢）
      if (order_id) {
        const remainingVisas = visas.filter(v => v.order_id === order_id && v.id !== visaId)

        // 直接查詢訂單資料
        const { data: targetOrder } = await supabase
          .from('orders')
          .select('id, total_amount, remaining_amount, member_count')
          .eq('id', order_id)
          .single()

        if (remainingVisas.length === 0 && targetOrder) {
          await deleteOrderData(order_id)
          toast.success('已刪除簽證及相關訂單')
        } else if (targetOrder) {
          const newTotalAmount = (targetOrder.total_amount || 0) - (fee || 0)
          const newRemainingAmount = (targetOrder.remaining_amount || 0) - (fee || 0)
          const newMemberCount = Math.max(0, (targetOrder.member_count || 0) - 1)

          await updateOrder(order_id, {
            total_amount: Math.max(0, newTotalAmount),
            remaining_amount: Math.max(0, newRemainingAmount),
            member_count: newMemberCount,
          })
          toast.success('已刪除簽證')
        } else {
          toast.success('已刪除簽證')
        }
      } else {
        toast.success('已刪除簽證')
      }
    } catch (error) {
      logger.error('刪除簽證失敗:', error)
      toast.error('刪除簽證失敗')
    }
  }, [visas])

  return {
    // 資料
    visas,
    tours,
    orders,
    user,

    // 權限
    canManageVisas,

    // 簽證操作
    addVisa: createVisa,
    updateVisa: updateVisaData,
    deleteVisa: deleteVisaWithCascade,

    // 團號操作
    addTour: createTour,
    fetchTours: fetchToursOnDemand, // 按需載入

    // 訂單操作
    addOrder: createOrder,
    fetchOrders: fetchOrdersOnDemand, // 按需載入
  }
}
