'use client'

/**
 * useOrderMembersData - 訂單成員資料管理與對話框狀態 Hook
 * 從 OrderMembersExpandable.tsx 拆分出來
 *
 * 此 hook 負責：
 * - 成員列表資料載入與狀態管理
 * - 新增/刪除成員操作
 * - 新增成員對話框狀態
 * - 訂單選擇對話框狀態（團體模式）
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/utils/logger'
import { alert, confirm } from '@/lib/ui/alert-dialog'
import type { OrderMember } from '../order-member.types'

interface UseOrderMembersDataParams {
  orderId?: string
  tourId: string
  workspaceId: string
  mode: 'order' | 'tour'
}

interface TourOrder {
  id: string
  order_number: string | null
}

export function useOrderMembersData({
  orderId,
  tourId,
  workspaceId,
  mode,
}: UseOrderMembersDataParams) {
  // ========== 成員資料狀態 ==========
  const [members, setMembers] = useState<OrderMember[]>([])
  const [loading, setLoading] = useState(false)
  const [departureDate, setDepartureDate] = useState<string | null>(null)
  const [returnDate, setReturnDate] = useState<string | null>(null)

  // ========== 團體模式相關狀態 ==========
  const [orderCount, setOrderCount] = useState(0)
  const [tourOrders, setTourOrders] = useState<TourOrder[]>([])

  // ========== 新增成員對話框狀態 ==========
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [memberCountToAdd, setMemberCountToAdd] = useState<number | ''>(1)
  const [selectedOrderIdForAdd, setSelectedOrderIdForAdd] = useState<string | null>(null)
  const [showOrderSelectDialog, setShowOrderSelectDialog] = useState(false)

  // ========== 顧客資料由 SWR 自動載入 ==========

  /**
   * 載入旅遊團出發/回程日期
   */
  const loadTourDepartureDate = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('tours')
        .select('departure_date, return_date')
        .eq('id', tourId)
        .single()

      if (error) throw error
      setDepartureDate(data?.departure_date || null)
      setReturnDate(data?.return_date || null)
    } catch (error) {
      logger.error('載入出發日期失敗:', error)
    }
  }, [tourId])

  /**
   * 載入成員資料
   * - 單一訂單模式：載入該訂單的成員
   * - 團體模式：載入該旅遊團所有訂單的成員
   */
  const loadMembers = useCallback(async () => {
    setLoading(true)
    try {
      let membersData: OrderMember[] = []
      let orderCodeMap: Record<string, string> = {}

      if (mode === 'tour') {
        // 團體模式：載入旅遊團所有訂單的成員
        // 1. 先查詢該旅遊團的所有訂單
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('id, order_number')
          .eq('tour_id', tourId)
          .order('created_at', { ascending: true })

        if (ordersError) throw ordersError

        if (ordersData && ordersData.length > 0) {
          // 設定訂單數量和訂單列表
          setOrderCount(ordersData.length)
          setTourOrders(ordersData)

          // 建立訂單編號對應表（只取序號部分，如 "01"）
          orderCodeMap = Object.fromEntries(
            ordersData.map(o => {
              const orderNum = o.order_number || ''
              // 從 "CNX250128A-01" 提取 "01"
              const seqMatch = orderNum.match(/-(\d+)$/)
              return [o.id, seqMatch ? seqMatch[1] : orderNum]
            })
          )
          const orderIds = ordersData.map(o => o.id)

          // 2. 載入這些訂單的所有成員
          const { data: allMembersData, error: membersError } = await supabase
            .from('order_members')
            .select('*')
            .in('order_id', orderIds)
            .order('created_at', { ascending: true })

          if (membersError) throw membersError
          membersData = allMembersData || []
        }
      } else if (orderId) {
        // 單一訂單模式
        const { data, error: membersError } = await supabase
          .from('order_members')
          .select('*')
          .eq('order_id', orderId)
          .order('created_at', { ascending: true })

        if (membersError) throw membersError
        membersData = data || []
      }

      // 收集所有有 customer_id 的成員
      const customerIds = membersData
        .map(m => m.customer_id)
        .filter(Boolean) as string[]

      // 如果有 customer_id，批次查詢顧客驗證狀態
      let customerStatusMap: Record<string, string> = {}
      if (customerIds.length > 0) {
        const { data: customersData } = await supabase
          .from('customers')
          .select('id, verification_status')
          .in('id', customerIds)

        if (customersData) {
          customerStatusMap = Object.fromEntries(
            customersData.map(c => [c.id, c.verification_status || ''])
          )
        }
      }

      // 合併驗證狀態和訂單編號到成員
      const membersWithStatus = membersData.map(m => ({
        ...m,
        customer_verification_status: m.customer_id ? customerStatusMap[m.customer_id] || null : null,
        order_code: mode === 'tour' ? orderCodeMap[m.order_id] || null : null,
      }))

      setMembers(membersWithStatus)
    } catch (error) {
      logger.error('載入成員失敗:', error)
    } finally {
      setLoading(false)
    }
  }, [mode, tourId, orderId])

  /**
   * 處理新增成員按鈕點擊
   * - 團體模式：需要先選擇訂單
   * - 單一訂單模式：直接開啟新增對話框
   */
  const handleAddMember = async () => {
    if (mode === 'tour') {
      // 團體模式：需要先選擇訂單
      if (tourOrders.length === 0) {
        await alert('此團尚無訂單，請先建立訂單', 'warning')
        return
      }
      if (tourOrders.length === 1) {
        // 只有一個訂單，直接使用
        setSelectedOrderIdForAdd(tourOrders[0].id)
        setIsAddDialogOpen(true)
      } else {
        // 多個訂單，顯示選擇對話框
        setShowOrderSelectDialog(true)
      }
    } else {
      setIsAddDialogOpen(true)
    }
  }

  /**
   * 確認新增成員
   */
  const confirmAddMembers = async () => {
    // 如果是空白或無效數字，預設為 1
    const count = typeof memberCountToAdd === 'number' ? memberCountToAdd : 1

    // 團體模式使用選擇的訂單 ID，單一訂單模式使用 prop 的 orderId
    const targetOrderId = mode === 'tour' ? selectedOrderIdForAdd : orderId
    if (!targetOrderId) {
      await alert('請選擇訂單', 'warning')
      return
    }

    try {
      const newMembers = Array.from({ length: count }, () => ({
        order_id: targetOrderId,
        workspace_id: workspaceId,
        member_type: 'adult',
        identity: '大人',
      }))

      const { data, error } = await supabase
        .from('order_members')
        .insert(newMembers)
        .select()

      if (error) throw error
      setMembers([...members, ...(data || [])])
      setIsAddDialogOpen(false)
      setMemberCountToAdd(1)
    } catch (error) {
      logger.error('新增成員失敗:', error)
      await alert('新增失敗', 'error')
    }
  }

  /**
   * 刪除成員
   */
  const handleDeleteMember = async (memberId: string) => {
    // 找到要刪除的成員，顯示名稱讓使用者確認
    const memberToDelete = members.find(m => m.id === memberId)
    const memberName = memberToDelete?.chinese_name || memberToDelete?.passport_name || '此成員'

    const confirmed = await confirm(`確定要刪除「${memberName}」嗎？`, {
      title: '刪除成員',
      type: 'warning',
    })
    if (!confirmed) return

    try {
      const { error } = await supabase.from('order_members').delete().eq('id', memberId)

      if (error) throw error
      setMembers(members.filter(m => m.id !== memberId))
    } catch (error) {
      logger.error('刪除成員失敗:', error)
      await alert('刪除失敗', 'error')
    }
  }

  /**
   * 初始載入
   */
  useEffect(() => {
    loadMembers()
    loadTourDepartureDate()
    // 顧客資料由 SWR 自動載入（用於編輯模式搜尋）
  }, [orderId, tourId, mode, loadMembers, loadTourDepartureDate])

  return {
    // 成員資料
    members,
    setMembers,
    loading,
    departureDate,
    returnDate,
    orderCount,
    tourOrders,

    // 資料載入函數
    loadMembers,
    loadTourDepartureDate,

    // 成員操作
    handleAddMember,
    confirmAddMembers,
    handleDeleteMember,

    // 新增成員對話框狀態
    isAddDialogOpen,
    setIsAddDialogOpen,
    memberCountToAdd,
    setMemberCountToAdd,

    // 訂單選擇對話框狀態（團體模式）
    selectedOrderIdForAdd,
    setSelectedOrderIdForAdd,
    showOrderSelectDialog,
    setShowOrderSelectDialog,
  }
}
