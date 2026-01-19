'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { logger } from '@/lib/utils/logger'
import type { TourVehicle, VehicleMember, CreateTourVehicleData, TourVehicleAssignment } from '@/types/vehicle.types'

interface UseVehicleAssignmentProps {
  tourId: string
  workspaceId: string
}

export function useVehicleAssignment({ tourId, workspaceId }: UseVehicleAssignmentProps) {
  const [vehicles, setVehicles] = useState<TourVehicle[]>([])
  const [members, setMembers] = useState<VehicleMember[]>([])
  const [assignments, setAssignments] = useState<TourVehicleAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // 載入車輛資料
  const loadVehicles = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('tour_vehicles')
        .select('*')
        .eq('tour_id', tourId)
        .order('display_order', { ascending: true, nullsFirst: false })

      if (error) throw error
      setVehicles(data || [])
    } catch (err) {
      logger.error('載入車輛失敗:', err)
      toast.error('載入車輛資料失敗')
    }
  }, [tourId])

  // 載入分配記錄
  const loadAssignments = useCallback(async () => {
    try {
      // 先取得該團的所有車輛 ID
      const { data: vehicleData } = await supabase
        .from('tour_vehicles')
        .select('id')
        .eq('tour_id', tourId)

      if (!vehicleData || vehicleData.length === 0) {
        setAssignments([])
        return
      }

      const vehicleIds = vehicleData.map(v => v.id)

      const { data, error } = await supabase
        .from('tour_vehicle_assignments')
        .select('*')
        .in('vehicle_id', vehicleIds)

      if (error) throw error
      setAssignments(data || [])
    } catch (err) {
      logger.error('載入分配記錄失敗:', err)
    }
  }, [tourId])

  // 載入團員資料
  const loadMembers = useCallback(async () => {
    try {
      // 先取得該團的所有訂單
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, order_number')
        .eq('tour_id', tourId)

      if (ordersError) throw ordersError
      if (!orders || orders.length === 0) {
        setMembers([])
        return
      }

      const orderIds = orders.map(o => o.id)
      const orderCodeMap = new Map(orders.map(o => [o.id, o.order_number]))

      // 取得所有團員
      const { data: membersData, error: membersError } = await supabase
        .from('order_members')
        .select('id, order_id, chinese_name, passport_name')
        .in('order_id', orderIds)

      if (membersError) throw membersError

      setMembers((membersData || []).map(m => ({
        ...m,
        order_code: orderCodeMap.get(m.order_id) || null,
        vehicle_id: null,
        seat_number: null,
      })))
    } catch (err) {
      logger.error('載入團員失敗:', err)
      toast.error('載入團員資料失敗')
    }
  }, [tourId])

  // 初始載入
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      await Promise.all([loadVehicles(), loadMembers(), loadAssignments()])
      setLoading(false)
    }
    load()
  }, [loadVehicles, loadMembers, loadAssignments])

  // 合併分配資訊到成員
  const membersWithAssignment = useMemo(() => {
    const assignmentMap = new Map(assignments.map(a => [a.order_member_id, a]))
    return members.map(m => {
      const assignment = assignmentMap.get(m.id)
      return {
        ...m,
        vehicle_id: assignment?.vehicle_id || null,
        seat_number: assignment?.seat_number || null,
      }
    })
  }, [members, assignments])

  // 新增車輛
  const addVehicle = useCallback(async (data: Omit<CreateTourVehicleData, 'tour_id'>) => {
    try {
      setSaving(true)
      const { error } = await supabase
        .from('tour_vehicles')
        .insert({
          ...data,
          tour_id: tourId,
        })

      if (error) throw error
      await loadVehicles()
      toast.success(`${data.vehicle_name} 已新增`)
    } catch (err) {
      logger.error('新增車輛失敗:', err)
      toast.error('新增車輛失敗')
    } finally {
      setSaving(false)
    }
  }, [tourId, loadVehicles])

  // 更新車輛
  const updateVehicle = useCallback(async (vehicleId: string, data: Partial<TourVehicle>) => {
    try {
      setSaving(true)
      // 只更新允許更新的欄位
      const updateData: Record<string, unknown> = {}
      if (data.vehicle_name !== undefined) updateData.vehicle_name = data.vehicle_name
      if (data.vehicle_type !== undefined) updateData.vehicle_type = data.vehicle_type
      if (data.capacity !== undefined) updateData.capacity = data.capacity
      if (data.license_plate !== undefined) updateData.license_plate = data.license_plate
      if (data.driver_name !== undefined) updateData.driver_name = data.driver_name
      if (data.driver_phone !== undefined) updateData.driver_phone = data.driver_phone
      if (data.notes !== undefined) updateData.notes = data.notes
      if (data.display_order !== undefined) updateData.display_order = data.display_order

      const { error } = await supabase
        .from('tour_vehicles')
        .update(updateData)
        .eq('id', vehicleId)

      if (error) throw error
      await loadVehicles()
      toast.success('車輛資料已更新')
    } catch (err) {
      logger.error('更新車輛失敗:', err)
      toast.error('更新車輛失敗')
    } finally {
      setSaving(false)
    }
  }, [loadVehicles])

  // 刪除車輛
  const deleteVehicle = useCallback(async (vehicleId: string) => {
    try {
      setSaving(true)

      // 先刪除該車的所有分配記錄
      await supabase
        .from('tour_vehicle_assignments')
        .delete()
        .eq('vehicle_id', vehicleId)

      const { error } = await supabase
        .from('tour_vehicles')
        .delete()
        .eq('id', vehicleId)

      if (error) throw error
      await Promise.all([loadVehicles(), loadAssignments()])
      toast.success('車輛已刪除')
    } catch (err) {
      logger.error('刪除車輛失敗:', err)
      toast.error('刪除車輛失敗')
    } finally {
      setSaving(false)
    }
  }, [loadVehicles, loadAssignments])

  // 分配成員到車輛
  const assignMemberToVehicle = useCallback(async (memberId: string, vehicleId: string | null) => {
    try {
      setSaving(true)

      // 先刪除該成員的現有分配
      await supabase
        .from('tour_vehicle_assignments')
        .delete()
        .eq('order_member_id', memberId)

      // 如果有新車輛，建立新分配
      if (vehicleId) {
        const { error } = await supabase
          .from('tour_vehicle_assignments')
          .insert({
            vehicle_id: vehicleId,
            order_member_id: memberId,
          })

        if (error) throw error
      }

      // 樂觀更新
      setAssignments(prev => {
        const filtered = prev.filter(a => a.order_member_id !== memberId)
        if (vehicleId) {
          return [...filtered, {
            id: crypto.randomUUID(),
            vehicle_id: vehicleId,
            order_member_id: memberId,
            seat_number: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }]
        }
        return filtered
      })
    } catch (err) {
      logger.error('分配成員失敗:', err)
      toast.error('分配成員失敗')
      await loadAssignments() // 重新載入以還原
    } finally {
      setSaving(false)
    }
  }, [loadAssignments])

  // 批量分配成員
  const assignMembersToVehicle = useCallback(async (memberIds: string[], vehicleId: string | null) => {
    try {
      setSaving(true)

      // 先刪除這些成員的現有分配
      await supabase
        .from('tour_vehicle_assignments')
        .delete()
        .in('order_member_id', memberIds)

      // 如果有新車輛，建立新分配
      if (vehicleId) {
        const insertData = memberIds.map(memberId => ({
          vehicle_id: vehicleId,
          order_member_id: memberId,
        }))

        const { error } = await supabase
          .from('tour_vehicle_assignments')
          .insert(insertData)

        if (error) throw error
      }

      await loadAssignments()
      toast.success(`已分配 ${memberIds.length} 位成員`)
    } catch (err) {
      logger.error('批量分配成員失敗:', err)
      toast.error('批量分配成員失敗')
      await loadAssignments()
    } finally {
      setSaving(false)
    }
  }, [loadAssignments])

  // 取得未分配的成員
  const unassignedMembers = useMemo(() => {
    return membersWithAssignment.filter(m => !m.vehicle_id)
  }, [membersWithAssignment])

  // 取得各車的成員
  const getMembersForVehicle = useCallback((vehicleId: string) => {
    return membersWithAssignment.filter(m => m.vehicle_id === vehicleId)
  }, [membersWithAssignment])

  return {
    vehicles,
    members: membersWithAssignment,
    unassignedMembers,
    loading,
    saving,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    assignMemberToVehicle,
    assignMembersToVehicle,
    getMembersForVehicle,
    refresh: () => Promise.all([loadVehicles(), loadMembers(), loadAssignments()]),
  }
}
