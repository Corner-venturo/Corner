/**
 * useOrders - 訂單業務邏輯 Hook
 */

import { useMemo } from 'react'

import { useOrderStore, useMemberStore } from '@/stores'
import { Order, Member, CreateOrderData, UpdateOrderData } from '@/types'

export function useOrders() {
  const orderStore = useOrderStore()
  const memberStore = useMemberStore()

  // ============================================
  // 資料驗證
  // ============================================

  const _validateOrderData = (data: Partial<Order>): void => {
    if (data.total_amount !== undefined && data.total_amount < 0) {
      throw new Error('總金額不能為負數')
    }

    if (data.member_count !== undefined && data.member_count < 1) {
      throw new Error('人數必須大於 0')
    }

    if (data.paid_amount !== undefined && data.total_amount !== undefined) {
      if (data.paid_amount > data.total_amount) {
        throw new Error('已付金額不能大於總金額')
      }
    }
  }

  // ============================================
  // 業務邏輯
  // ============================================

  const calculateRemainingAmount = (order: Order): number => {
    return Math.max(0, order.total_amount - order.paid_amount)
  }

  const canEditOrder = (order: Order): boolean => {
    // Order 介面沒有 status 欄位，預設都可以編輯
    return true
  }

  const canCancelOrder = (order: Order): boolean => {
    // Order 介面沒有 status 欄位，預設都可以取消
    return true
  }

  const getPaymentProgress = (order: Order): number => {
    if (order.total_amount === 0) return 0
    return Math.round((order.paid_amount / order.total_amount) * 100)
  }

  const updatePaymentStatus = (order: Order): '未收款' | '部分收款' | '已收款' => {
    if (order.paid_amount === 0) return '未收款'
    if (order.paid_amount < order.total_amount) return '部分收款'
    if (order.paid_amount >= order.total_amount) return '已收款'
    return '未收款'
  }

  // ============================================
  // CRUD 操作
  // ============================================

  const createOrder = async (data: Omit<CreateOrderData, 'id'>): Promise<Order> => {
    // CreateOrderData 使用 number_of_people，但 Order 使用 member_count
    // CreateOrderData 有 status 和 is_active，但 Order 沒有
    // 需要轉換欄位
    const orderData: any = {
      order_number: data.code || '',
      code: data.code || '',
      tour_id: data.tour_id,
      tour_name: '', // 需要從 tour_id 查詢
      contact_person: data.contact_person,
      sales_person: '', // CreateOrderData 沒有這個欄位
      assistant: '', // CreateOrderData 沒有這個欄位
      member_count: data.number_of_people,
      payment_status: data.payment_status || 'unpaid',
      total_amount: data.total_amount,
      paid_amount: data.paid_amount,
      remaining_amount: data.total_amount - (data.paid_amount || 0),
    }

    return await orderStore.create(orderData)
  }

  const updateOrder = async (id: string, data: UpdateOrderData): Promise<Order> => {
    const existing = await orderStore.fetchById(id)
    if (!existing) throw new Error('訂單不存在')
    if (!canEditOrder(existing)) throw new Error('此訂單無法編輯')

    // UpdateOrderData 使用 number_of_people，但 Order 使用 member_count
    // 需要轉換欄位
    const updateData: any = {}

    if (data.contact_person) updateData.contact_person = data.contact_person
    if (data.number_of_people) updateData.member_count = data.number_of_people
    if (data.total_amount !== undefined) updateData.total_amount = data.total_amount
    if (data.paid_amount !== undefined) updateData.paid_amount = data.paid_amount

    // 轉換 payment_status
    if (data.payment_status) {
      updateData.payment_status = data.payment_status || 'unpaid'
    }

    // 重新計算付款狀態
    if (data.total_amount !== undefined || data.paid_amount !== undefined) {
      const updated = { ...existing, ...updateData }
      updateData.remaining_amount = calculateRemainingAmount(updated)
      updateData.payment_status = updatePaymentStatus(updated)
    }

    return await orderStore.update(id, updateData)
  }

  const cancelOrder = async (id: string): Promise<Order> => {
    const _order = await orderStore.fetchById(id)
    if (!_order) throw new Error('訂單不存在')
    if (!canCancelOrder(_order)) throw new Error('此訂單無法取消')

    // Order 介面沒有 status 欄位，無法設定為 cancelled
    // 改為設定 payment_status 或其他欄位來表示取消
    return await orderStore.update(id, {})
  }

  // ============================================
  // 團員管理
  // ============================================

  const getOrderMembers = async (order_id: string): Promise<Member[]> => {
    await memberStore.fetchAll()
    return memberStore.findByField('order_id', order_id)
  }

  const addMember = async (orderData: Member): Promise<Member> => {
    const member = await memberStore.create(orderData)

    // 更新訂單人數
    const _order = await orderStore.fetchById(orderData.order_id)
    if (_order) {
      const members = await getOrderMembers(orderData.order_id)
      await orderStore.update(orderData.order_id, {
        member_count: members.length,
      })
    }

    return member
  }

  // ============================================
  // 查詢方法
  // ============================================

  const getPendingOrders = useMemo(() => {
    // Order 介面沒有 status 和 is_active 欄位
    return orderStore.items
  }, [orderStore.items])

  const getUnpaidOrders = useMemo(() => {
    return orderStore.items.filter(
      o => o.payment_status === 'unpaid' || o.payment_status === 'partial'
    )
  }, [orderStore.items])

  const getOrdersByTour = (tour_id: string): Order[] => {
    return orderStore.items.filter(o => o.tour_id === tour_id)
  }

  return {
    orders: orderStore.items,
    loading: orderStore.loading,
    error: orderStore.error,

    fetchAll: orderStore.fetchAll,
    fetchById: orderStore.fetchById,
    createOrder,
    updateOrder,
    deleteOrder: orderStore.delete,
    cancelOrder,

    canEditOrder,
    canCancelOrder,
    calculateRemainingAmount,
    getPaymentProgress,

    getOrderMembers,
    addMember,

    pendingOrders: getPendingOrders,
    unpaidOrders: getUnpaidOrders,
    getOrdersByTour,
  }
}
