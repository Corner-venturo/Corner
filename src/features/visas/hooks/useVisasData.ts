import { useTours, createTour, invalidateTours } from '@/data'
import { useVisas, createVisa, updateVisa as updateVisaData, deleteVisa as deleteVisaData } from '@/data'
import { useAuthStore } from '@/stores/auth-store'
import { useOrders, createOrder, updateOrder, deleteOrder as deleteOrderData } from '@/data'
import { useMemo, useCallback } from 'react'
import { toast } from 'sonner'
import { logger } from '@/lib/utils/logger'
import { supabase } from '@/lib/supabase/client'

/**
 * 簽證資料管理 Hook
 * 負責取得和操作簽證、團號、訂單資料
 */
export function useVisasData() {
  const { items: visas } = useVisas()
  const { items: tours, loading: loadingTours } = useTours()
  const { items: orders } = useOrders()
  const { user } = useAuthStore()

  // 權限檢查（暫時開放給所有人）
  const canManageVisas = useMemo(() => {
    return true // 所有登入使用者都可以管理簽證
  }, [])

  /**
   * 刪除簽證並連動處理：
   * 1. 刪除對應的訂單成員（按申請人姓名比對）
   * 2. 更新訂單金額
   * 3. 如果訂單下所有簽證都刪除了，則刪除整張訂單
   */
  const deleteVisaWithCascade = useCallback(async (visaId: string) => {
    // 找到要刪除的簽證
    const visa = visas.find(v => v.id === visaId)
    if (!visa) {
      logger.error('找不到簽證:', visaId)
      return
    }

    const { order_id, applicant_name, fee } = visa

    try {
      // 1. 刪除簽證
      await deleteVisaData(visaId)

      // 2. 找到並刪除對應的訂單成員（按申請人姓名比對）
      // 🔧 優化：直接查詢 Supabase，不需要預載入所有 members
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

      // 3. 檢查該訂單是否還有其他簽證
      if (order_id) {
        const remainingVisas = visas.filter(v => v.order_id === order_id && v.id !== visaId)
        const targetOrder = orders.find(o => o.id === order_id)

        if (remainingVisas.length === 0 && targetOrder) {
          // 訂單下沒有其他簽證了，刪除整張訂單
          await deleteOrderData(order_id)
          toast.success('已刪除簽證及相關訂單')
        } else if (targetOrder) {
          // 還有其他簽證，更新訂單金額
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
  }, [visas, orders])

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
    deleteVisa: deleteVisaWithCascade, // 使用帶連動刪除的版本

    // 團號操作
    addTour: createTour,
    fetchTours: invalidateTours,

    // 訂單操作
    addOrder: createOrder,
  }
}
