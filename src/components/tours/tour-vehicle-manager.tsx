'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, Users, Bus, X, Check, Phone, User } from 'lucide-react'
import { toast } from 'sonner'
import { confirm } from '@/lib/ui/alert-dialog'
import { VEHICLE_TYPES } from '@/types/room-vehicle.types'
import type { TourVehicleStatus, TourVehicleAssignment } from '@/types/room-vehicle.types'
import { cn } from '@/lib/utils'
import { logger } from '@/lib/utils/logger'
import type { OrderMember } from '@/components/orders/order-member.types'

// 此元件只需要 OrderMember 的部分欄位
type MemberBasic = Pick<OrderMember, 'id' | 'chinese_name' | 'passport_name'>

interface TourVehicleManagerProps {
  tourId: string
  members: MemberBasic[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TourVehicleManager({ tourId, members, open, onOpenChange }: TourVehicleManagerProps) {
  const user = useAuthStore(state => state.user)
  const [vehicles, setVehicles] = useState<TourVehicleStatus[]>([])
  const [assignments, setAssignments] = useState<TourVehicleAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddVehicle, setShowAddVehicle] = useState(false)

  const [newVehicle, setNewVehicle] = useState({
    vehicle_name: '',
    vehicle_type: 'large_bus',
    capacity: 45,
    driver_name: '',
    driver_phone: '',
    license_plate: '',
  })

  useEffect(() => {
    if (open) {
      loadVehicles()
      loadAssignments()
    }
  }, [open, tourId])

  const loadVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('tour_vehicles_status')
        .select('*')
        .eq('tour_id', tourId)
        .order('display_order')

      if (error) throw error
      setVehicles((data || []) as TourVehicleStatus[])
    } catch (error) {
      logger.error('載入車輛失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAssignments = async () => {
    try {
      const { data: vehiclesData } = await supabase
        .from('tour_vehicles')
        .select('id')
        .eq('tour_id', tourId)

      if (!vehiclesData || vehiclesData.length === 0) {
        setAssignments([])
        return
      }

      const vehicleIds = vehiclesData.map((v: { id: string }) => v.id)

      const { data, error } = await supabase
        .from('tour_vehicle_assignments')
        .select('*')
        .in('vehicle_id', vehicleIds)

      if (error) throw error
      setAssignments((data || []) as TourVehicleAssignment[])
    } catch (error) {
      logger.error('載入分配失敗:', error)
    }
  }

  const handleAddVehicle = async () => {
    if (!newVehicle.vehicle_name.trim()) {
      toast.error('請輸入車輛名稱')
      return
    }

    try {
      const { error } = await supabase.from('tour_vehicles').insert({
        tour_id: tourId,
        vehicle_name: newVehicle.vehicle_name,
        vehicle_type: newVehicle.vehicle_type,
        capacity: newVehicle.capacity,
        driver_name: newVehicle.driver_name || null,
        driver_phone: newVehicle.driver_phone || null,
        license_plate: newVehicle.license_plate || null,
        display_order: vehicles.length,
        workspace_id: user?.workspace_id,
      })

      if (error) throw error

      toast.success('車輛已新增')
      setShowAddVehicle(false)
      setNewVehicle({
        vehicle_name: '',
        vehicle_type: 'large_bus',
        capacity: 45,
        driver_name: '',
        driver_phone: '',
        license_plate: '',
      })
      loadVehicles()
    } catch (error) {
      logger.error('新增車輛失敗:', error)
      toast.error('新增車輛失敗')
    }
  }

  const handleDeleteVehicle = async (vehicleId: string) => {
    const confirmed = await confirm('確定要刪除這輛車嗎？已分配的團員將會被移除。', {
      title: '刪除車輛',
      type: 'warning',
    })
    if (!confirmed) return

    try {
      const { error } = await supabase
        .from('tour_vehicles')
        .delete()
        .eq('id', vehicleId)

      if (error) throw error

      toast.success('車輛已刪除')
      loadVehicles()
      loadAssignments()
    } catch (error) {
      logger.error('刪除車輛失敗:', error)
      toast.error('刪除車輛失敗')
    }
  }

  const handleAssignMember = async (vehicleId: string, memberId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId)
    if (vehicle && vehicle.is_full) {
      toast.error('此車已滿')
      return
    }

    const existingAssignment = assignments.find(a => a.order_member_id === memberId)
    if (existingAssignment) {
      toast.error('此團員已分配到其他車輛')
      return
    }

    try {
      const { error } = await supabase.from('tour_vehicle_assignments').insert({
        vehicle_id: vehicleId,
        order_member_id: memberId,
      })

      if (error) throw error

      toast.success('已分配')
      loadVehicles()
      loadAssignments()
    } catch (error) {
      logger.error('分配失敗:', error)
      toast.error('分配失敗')
    }
  }

  const handleRemoveAssignment = async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from('tour_vehicle_assignments')
        .delete()
        .eq('id', assignmentId)

      if (error) throw error

      toast.success('已移除')
      loadVehicles()
      loadAssignments()
    } catch (error) {
      logger.error('移除失敗:', error)
      toast.error('移除失敗')
    }
  }

  const getVehicleMembers = (vehicleId: string) => {
    const vehicleAssignments = assignments.filter(a => a.vehicle_id === vehicleId)
    return vehicleAssignments.map(a => {
      const member = members.find(m => m.id === a.order_member_id)
      return { assignment: a, member }
    })
  }

  const getUnassignedMembers = () => {
    const assignedMemberIds = assignments.map(a => a.order_member_id)
    return members.filter(m => !assignedMemberIds.includes(m.id))
  }

  const unassignedMembers = getUnassignedMembers()

  const totalAssigned = vehicles.reduce((sum, v) => sum + v.assigned_count, 0)
  const totalCapacity = vehicles.reduce((sum, v) => sum + v.capacity, 0)

  return (
    <>
    {/* 主 Dialog：level={2} 因為從 TourDetailDialog 打開 */}
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent level={2} className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-morandi-primary">
            <Bus className="h-5 w-5 text-morandi-gold" />
            分車管理
            {vehicles.length > 0 && (
              <span className="text-sm font-normal text-morandi-muted ml-2">
                {vehicles.length} 輛車 · {totalAssigned}/{members.length} 人
              </span>
            )}
            <div className="flex items-center gap-2 ml-auto">
              <Button
                variant="outline"
                onClick={() => setShowAddVehicle(true)}
                className="gap-1.5"
              >
                <Plus className="h-4 w-4" />
                新增車輛
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden grid grid-cols-3 gap-4 mt-4">
          {/* 左側：待分配團員 */}
          <div className="flex flex-col min-h-0 bg-morandi-container rounded-lg p-3 border border-border">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-morandi-secondary" />
              <h3 className="font-medium text-morandi-primary text-sm">待分配</h3>
              <span className="ml-auto text-xs px-1.5 py-0.5 bg-card rounded text-morandi-secondary border border-border">
                {unassignedMembers.length}
              </span>
            </div>

            <div className="flex-1 overflow-auto space-y-1.5">
              {unassignedMembers.map(member => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-2 bg-card rounded border border-border hover:border-morandi-gold transition-colors"
                >
                  <span className="text-sm text-morandi-primary">
                    {member.chinese_name || member.passport_name || '未知'}
                  </span>
                  <div className="flex gap-1 flex-wrap justify-end">
                    {vehicles.filter(v => !v.is_full).map(vehicle => (
                      <button
                        key={vehicle.id}
                        className="text-xs px-2 py-1 rounded border border-border text-morandi-secondary hover:border-morandi-gold hover:text-morandi-gold transition-all"
                        onClick={() => handleAssignMember(vehicle.id, member.id)}
                      >
                        {vehicle.vehicle_name}
                      </button>
                    ))}
                    {vehicles.filter(v => !v.is_full).length === 0 && (
                      <span className="text-xs text-morandi-muted">無可用車輛</span>
                    )}
                  </div>
                </div>
              ))}
              {unassignedMembers.length === 0 && (
                <div className="flex flex-col items-center justify-center py-6 text-morandi-muted">
                  <Check className="h-6 w-6 mb-1" />
                  <span className="text-xs">全部已分配</span>
                </div>
              )}
            </div>
          </div>

          {/* 右側：車輛列表 */}
          <div className="col-span-2 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-medium text-morandi-primary">車輛列表</h3>
                {vehicles.length > 0 && (
                  <p className="text-xs text-morandi-muted mt-0.5">
                    共 {vehicles.length} 輛車，總容量 {totalCapacity} 人
                  </p>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-auto space-y-2">
              {vehicles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 bg-morandi-container rounded-lg border border-dashed border-morandi-muted">
                  <Bus className="h-10 w-10 text-morandi-muted mb-2" />
                  <p className="text-morandi-secondary text-sm">還沒有設定車輛</p>
                </div>
              ) : (
                vehicles.map(vehicle => {
                  const vehicleMembers = getVehicleMembers(vehicle.id)
                  const progress = (vehicle.assigned_count / vehicle.capacity) * 100

                  return (
                    <div
                      key={vehicle.id}
                      className={cn(
                        "morandi-card p-3",
                        vehicle.is_full && "border-morandi-green bg-[rgba(159,166,143,0.08)]"
                      )}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Bus className={cn(
                            "h-4 w-4",
                            vehicle.is_full ? "text-morandi-green" : "text-morandi-gold"
                          )} />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-morandi-primary">{vehicle.vehicle_name}</span>
                              <span className="badge-morandi text-xs">
                                {VEHICLE_TYPES.find(t => t.value === vehicle.vehicle_type)?.label || vehicle.vehicle_type}
                              </span>
                              {vehicle.license_plate && (
                                <span className="text-xs text-morandi-muted font-mono">{vehicle.license_plate}</span>
                              )}
                            </div>
                            {/* 司機資訊 */}
                            {(vehicle.driver_name || vehicle.driver_phone) && (
                              <div className="flex items-center gap-3 mt-0.5 text-xs text-morandi-muted">
                                {vehicle.driver_name && (
                                  <span className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    {vehicle.driver_name}
                                  </span>
                                )}
                                {vehicle.driver_phone && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {vehicle.driver_phone}
                                  </span>
                                )}
                              </div>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <div className="w-28 h-1.5 bg-morandi-container rounded-full overflow-hidden">
                                <div
                                  className={cn(
                                    "h-full rounded-full transition-all",
                                    vehicle.is_full ? "bg-morandi-green" : "bg-morandi-gold"
                                  )}
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <span className={cn(
                                "text-xs",
                                vehicle.is_full ? "text-morandi-green" : "text-morandi-secondary"
                              )}>
                                {vehicle.assigned_count}/{vehicle.capacity}
                                {vehicle.is_full && <Check className="h-3 w-3 inline ml-0.5" />}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-morandi-muted hover:text-morandi-red hover:bg-transparent"
                          onClick={() => handleDeleteVehicle(vehicle.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex flex-wrap gap-1.5 min-h-[28px]">
                        {vehicleMembers.map(({ assignment, member }) => (
                          <span
                            key={assignment.id}
                            className="inline-flex items-center gap-1 bg-morandi-container text-morandi-primary text-xs px-2 py-1 rounded border border-border"
                          >
                            {member?.chinese_name || '未知'}
                            <button
                              onClick={() => handleRemoveAssignment(assignment.id)}
                              className="hover:text-morandi-red transition-colors"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                        {vehicle.remaining_seats > 0 && (
                          <span className="text-xs text-morandi-muted px-2 py-1">
                            還有 {vehicle.remaining_seats} 座位
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>

    {/* 新增車輛 Dialog：level={3} 因為是 level={2} Dialog 的子 Dialog */}
    <Dialog open={showAddVehicle} onOpenChange={setShowAddVehicle}>
      <DialogContent level={3} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-morandi-primary">
            <Plus className="h-5 w-5 text-morandi-gold" />
            新增車輛
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-1.5">
            <Label className="text-morandi-primary">車輛名稱 *</Label>
            <Input
              value={newVehicle.vehicle_name}
              onChange={e => setNewVehicle({ ...newVehicle, vehicle_name: e.target.value })}
              placeholder="例如：1號車、A車"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-morandi-primary">車型</Label>
              <Select
                value={newVehicle.vehicle_type}
                onValueChange={value => {
                  const type = VEHICLE_TYPES.find(t => t.value === value)
                  setNewVehicle({
                    ...newVehicle,
                    vehicle_type: value,
                    capacity: type?.capacity || 45
                  })
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VEHICLE_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-morandi-primary">座位數</Label>
              <Input
                type="number"
                min={1}
                value={newVehicle.capacity}
                onChange={e => setNewVehicle({ ...newVehicle, capacity: parseInt(e.target.value) || 45 })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-morandi-primary">司機姓名</Label>
              <Input
                value={newVehicle.driver_name}
                onChange={e => setNewVehicle({ ...newVehicle, driver_name: e.target.value })}
                placeholder="選填"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-morandi-primary">司機電話</Label>
              <Input
                value={newVehicle.driver_phone}
                onChange={e => setNewVehicle({ ...newVehicle, driver_phone: e.target.value })}
                placeholder="選填"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-morandi-primary">車牌號碼</Label>
            <Input
              value={newVehicle.license_plate}
              onChange={e => setNewVehicle({ ...newVehicle, license_plate: e.target.value })}
              placeholder="選填"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button variant="outline" onClick={() => setShowAddVehicle(false)} className="btn-morandi-secondary gap-2">
              <X size={16} />
              取消
            </Button>
            <Button onClick={handleAddVehicle} className="btn-morandi-primary gap-2">
              <Plus size={16} />
              新增車輛
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}
