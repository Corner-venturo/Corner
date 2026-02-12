/**
 * useOrderMembers - 訂單成員資料管理 Hook
 * 從 OrderMembersExpandable.tsx 拆分出來
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/utils/logger'
import { confirm } from '@/lib/ui/alert-dialog'
import type { OrderMember, CustomCostField } from '../order-member.types'
import { COMP_ORDERS_LABELS } from '../constants/labels'

interface UseOrderMembersParams {
  orderId?: string
  tourId: string
  workspaceId: string
  mode: 'order' | 'tour'
}

interface UseOrderMembersReturn {
  // 資料
  members: OrderMember[]
  loading: boolean
  departureDate: string | null
  returnDate: string | null
  orderCount: number
  roomAssignments: Record<string, string>
  vehicleAssignments: Record<string, string>
  pnrValues: Record<string, string>
  customCostFields: CustomCostField[]

  // 操作
  loadMembers: () => Promise<void>
  addMembers: (count: number) => Promise<void>
  deleteMember: (memberId: string) => Promise<boolean>
  updateMember: (memberId: string, field: keyof OrderMember, value: string | number | null) => Promise<void>
  updateMemberData: (memberId: string, data: Partial<OrderMember>) => Promise<void>
  setPnrValue: (memberId: string, value: string) => void
  setCustomCostFields: React.Dispatch<React.SetStateAction<CustomCostField[]>>
  refreshRoomAssignments: () => Promise<void>
  refreshVehicleAssignments: () => Promise<void>
}

export function useOrderMembers({
  orderId,
  tourId,
  workspaceId,
  mode,
}: UseOrderMembersParams): UseOrderMembersReturn {
  const [members, setMembers] = useState<OrderMember[]>([])
  const [loading, setLoading] = useState(false)
  const [departureDate, setDepartureDate] = useState<string | null>(null)
  const [returnDate, setReturnDate] = useState<string | null>(null)
  const [orderCount, setOrderCount] = useState(0)
  const [roomAssignments, setRoomAssignments] = useState<Record<string, string>>({})
  const [vehicleAssignments, setVehicleAssignments] = useState<Record<string, string>>({})
  const [pnrValues, setPnrValues] = useState<Record<string, string>>({})
  const [customCostFields, setCustomCostFields] = useState<CustomCostField[]>([])

  // 載入旅遊團出發/回程日期
  const loadTourDates = useCallback(async () => {
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
      logger.error(COMP_ORDERS_LABELS.載入出發日期失敗, error)
    }
  }, [tourId])

  // 載入分房資訊
  const loadRoomAssignments = useCallback(async () => {
    if (!tourId) return
    try {
      const { data: rooms } = await supabase
        .from('tour_rooms')
        .select('id, room_number, room_type')
        .eq('tour_id', tourId)

      if (!rooms || rooms.length === 0) return

      const { data: assignments } = await supabase
        .from('tour_room_assignments')
        .select('order_member_id, room_id')
        .in('room_id', rooms.map(r => r.id))

      if (assignments) {
        const map: Record<string, string> = {}
        assignments.forEach(a => {
          const room = rooms.find(r => r.id === a.room_id)
          if (room) {
            map[a.order_member_id] = room.room_number || room.room_type || COMP_ORDERS_LABELS.已分房
          }
        })
        setRoomAssignments(map)
      }
    } catch (error) {
      logger.error(COMP_ORDERS_LABELS.載入分房資訊失敗, error)
    }
  }, [tourId])

  // 載入分車資訊
  const loadVehicleAssignments = useCallback(async () => {
    if (!tourId) return
    try {
      const { data: vehicles } = await supabase
        .from('tour_vehicles')
        .select('id, vehicle_name, vehicle_type')
        .eq('tour_id', tourId)

      if (!vehicles || vehicles.length === 0) return

      const { data: assignments } = await supabase
        .from('tour_vehicle_assignments')
        .select('order_member_id, vehicle_id')
        .in('vehicle_id', vehicles.map(v => v.id))

      if (assignments) {
        const map: Record<string, string> = {}
        assignments.forEach(a => {
          const vehicle = vehicles.find(v => v.id === a.vehicle_id)
          if (vehicle) {
            map[a.order_member_id] = vehicle.vehicle_name || vehicle.vehicle_type || COMP_ORDERS_LABELS.已分車
          }
        })
        setVehicleAssignments(map)
      }
    } catch (error) {
      logger.error(COMP_ORDERS_LABELS.載入分車資訊失敗, error)
    }
  }, [tourId])

  // 載入成員資料
  const loadMembers = useCallback(async () => {
    setLoading(true)
    try {
      let membersData: OrderMember[] = []

      if (mode === 'tour') {
        // 團體模式：取得該旅遊團所有訂單的成員
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('id, order_number')
          .eq('tour_id', tourId)

        if (ordersError) throw ordersError

        if (ordersData && ordersData.length > 0) {
          setOrderCount(ordersData.length)

          // 建立訂單編號對照表
          const orderCodeMap: Record<string, string> = {}
          ordersData.forEach(o => {
            const orderNum = o.order_number || ''
            const seqMatch = orderNum.match(/-(\d+)$/)
            orderCodeMap[o.id] = seqMatch ? seqMatch[1] : orderNum
          })

          const orderIds = ordersData.map(o => o.id)

          const { data: allMembersData, error: membersError } = await supabase
            .from('order_members')
            .select('*')
            .in('order_id', orderIds)
            .order('created_at', { ascending: true })

          if (membersError) throw membersError
          membersData = (allMembersData || []).map(m => ({
            ...m,
            order_code: orderCodeMap[m.order_id] || ''
          }))
        }
      } else {
        // 單一訂單模式
        if (!orderId) {
          setMembers([])
          return
        }
        const { data, error: membersError } = await supabase
          .from('order_members')
          .select('*')
          .eq('order_id', orderId)
          .order('created_at', { ascending: true })

        if (membersError) throw membersError
        membersData = data || []
      }

      // 取得關聯顧客的驗證狀態
      const customerIds = membersData
        .map(m => m.customer_id)
        .filter((id): id is string => !!id)

      if (customerIds.length > 0) {
        const { data: customersData } = await supabase
          .from('customers')
          .select('id, verification_status')
          .in('id', customerIds)

        if (customersData) {
          const statusMap = new Map(
            customersData.map(c => [c.id, c.verification_status])
          )
          membersData = membersData.map(m => ({
            ...m,
            customer_verification_status: m.customer_id
              ? statusMap.get(m.customer_id) || null
              : null
          }))
        }
      }

      setMembers(membersData)
    } catch (error) {
      logger.error(COMP_ORDERS_LABELS.載入成員失敗, error)
    } finally {
      setLoading(false)
    }
  }, [orderId, tourId, mode])

  // 新增成員
  const addMembers = useCallback(async (count: number) => {
    if (!orderId) return

    try {
      const newMembers = Array.from({ length: count }, () => ({
        order_id: orderId,
        workspace_id: workspaceId,
        member_type: 'adult' as const,
        identity: COMP_ORDERS_LABELS.大人,
      }))

      const { data, error } = await supabase
        .from('order_members')
        .insert(newMembers)
        .select()

      if (error) throw error

      if (data) {
        setMembers(prev => [...prev, ...data])
      }
    } catch (error) {
      logger.error(COMP_ORDERS_LABELS.新增成員失敗, error)
      throw error
    }
  }, [orderId, workspaceId])

  // 刪除成員
  const deleteMember = useCallback(async (memberId: string): Promise<boolean> => {
    const confirmed = await confirm(COMP_ORDERS_LABELS.確定要刪除此成員嗎, {
      confirmText: COMP_ORDERS_LABELS.刪除,
      cancelText: COMP_ORDERS_LABELS.取消,
    })

    if (!confirmed) return false

    try {
      const { error } = await supabase
        .from('order_members')
        .delete()
        .eq('id', memberId)

      if (error) throw error

      setMembers(prev => prev.filter(m => m.id !== memberId))
      return true
    } catch (error) {
      logger.error(COMP_ORDERS_LABELS.刪除成員失敗, error)
      return false
    }
  }, [])

  // 更新成員單一欄位
  const updateMember = useCallback(async (
    memberId: string,
    field: keyof OrderMember,
    value: string | number | null
  ) => {
    try {
      const { error } = await supabase
        .from('order_members')
        .update({ [field]: value })
        .eq('id', memberId)

      if (error) throw error

      setMembers(prev => prev.map(m =>
        m.id === memberId ? { ...m, [field]: value } : m
      ))
    } catch (error) {
      logger.error(COMP_ORDERS_LABELS.更新成員失敗, error)
    }
  }, [])

  // 更新成員多個欄位
  const updateMemberData = useCallback(async (
    memberId: string,
    data: Partial<OrderMember>
  ) => {
    try {
      const { error } = await supabase
        .from('order_members')
        .update(data)
        .eq('id', memberId)

      if (error) throw error

      setMembers(prev => prev.map(m =>
        m.id === memberId ? { ...m, ...data } : m
      ))
    } catch (error) {
      logger.error(COMP_ORDERS_LABELS.更新成員失敗, error)
      throw error
    }
  }, [])

  // 設定 PNR 值
  const setPnrValue = useCallback((memberId: string, value: string) => {
    setPnrValues(prev => ({ ...prev, [memberId]: value }))
  }, [])

  // 初始載入
  useEffect(() => {
    loadMembers()
    loadTourDates()
    if (mode === 'tour') {
      loadRoomAssignments()
      loadVehicleAssignments()
    }
  }, [loadMembers, loadTourDates, loadRoomAssignments, loadVehicleAssignments, mode])

  return {
    members,
    loading,
    departureDate,
    returnDate,
    orderCount,
    roomAssignments,
    vehicleAssignments,
    pnrValues,
    customCostFields,
    loadMembers,
    addMembers,
    deleteMember,
    updateMember,
    updateMemberData,
    setPnrValue,
    setCustomCostFields,
    refreshRoomAssignments: loadRoomAssignments,
    refreshVehicleAssignments: loadVehicleAssignments,
  }
}
