import { useVisaStore, useTourStore, useOrderStore, useMemberStore } from '@/stores'
import { useAuthStore } from '@/stores/auth-store'
import { useMemo, useCallback } from 'react'
import { toast } from 'sonner'

/**
 * 簽證資料管理 Hook
 * 負責取得和操作簽證、團號、訂單資料
 */
export function useVisasData() {
  const { items: visas, create: addVisa, update: updateVisa, delete: deleteVisaFromStore } = useVisaStore()
  const { items: tours, create: addTour, fetchAll: fetchTours } = useTourStore()
  const { items: orders, create: addOrder, update: updateOrder, delete: deleteOrder } = useOrderStore()
  const { items: members, delete: deleteMember } = useMemberStore()
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
      console.error('找不到簽證:', visaId)
      return
    }

    const { order_id, applicant_name, fee, cost } = visa

    try {
      // 1. 刪除簽證
      await deleteVisaFromStore(visaId)

      // 2. 找到並刪除對應的訂單成員（按申請人姓名比對）
      if (order_id && applicant_name) {
        const memberToDelete = members.find(
          m => m.order_id === order_id &&
               (m.chinese_name === applicant_name || m.name === applicant_name)
        )
        if (memberToDelete) {
          await deleteMember(memberToDelete.id)
        }
      }

      // 3. 檢查該訂單是否還有其他簽證
      if (order_id) {
        const remainingVisas = visas.filter(v => v.order_id === order_id && v.id !== visaId)
        const targetOrder = orders.find(o => o.id === order_id)

        if (remainingVisas.length === 0 && targetOrder) {
          // 訂單下沒有其他簽證了，刪除整張訂單
          await deleteOrder(order_id)
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
      console.error('刪除簽證失敗:', error)
      toast.error('刪除簽證失敗')
    }
  }, [visas, orders, members, deleteVisaFromStore, deleteMember, deleteOrder, updateOrder])

  return {
    // 資料
    visas,
    tours,
    orders,
    members,
    user,

    // 權限
    canManageVisas,

    // 簽證操作
    addVisa,
    updateVisa,
    deleteVisa: deleteVisaWithCascade, // 使用帶連動刪除的版本

    // 團號操作
    addTour,
    fetchTours,

    // 訂單操作
    addOrder,
  }
}
