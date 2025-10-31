import { useVisaStore, useTourStore, useOrderStore } from '@/stores'
import { useAuthStore } from '@/stores/auth-store'
import { useMemo } from 'react'

/**
 * 簽證資料管理 Hook
 * 負責取得和操作簽證、團號、訂單資料
 */
export function useVisasData() {
  const { items: visas, create: addVisa, update: updateVisa, delete: deleteVisa } = useVisaStore()
  const { items: tours, create: addTour, fetchAll: fetchTours } = useTourStore()
  const { items: orders, create: addOrder } = useOrderStore()
  const { user } = useAuthStore()

  // 權限檢查（暫時開放給所有人）
  const canManageVisas = useMemo(() => {
    return true // 所有登入使用者都可以管理簽證
  }, [])

  return {
    // 資料
    visas,
    tours,
    orders,
    user,

    // 權限
    canManageVisas,

    // 簽證操作
    addVisa,
    updateVisa,
    deleteVisa,

    // 團號操作
    addTour,
    fetchTours,

    // 訂單操作
    addOrder,
  }
}
