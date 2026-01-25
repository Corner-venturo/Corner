'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useVehicleAssignment } from './useVehicleAssignment'
import { Plus, Trash2, Bus, User, GripVertical, Edit2, Save, X, Phone } from 'lucide-react'
import { VEHICLE_TYPES, type TourVehicle, type VehicleMember } from '@/types/vehicle.types'

interface VehicleAssignmentProps {
  tourId: string
  workspaceId: string
}

export function VehicleAssignment({ tourId, workspaceId }: VehicleAssignmentProps) {
  const {
    vehicles,
    unassignedMembers,
    loading,
    saving,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    assignMemberToVehicle,
    getMembersForVehicle,
  } = useVehicleAssignment({ tourId, workspaceId })

  const [showAddVehicle, setShowAddVehicle] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<TourVehicle | null>(null)
  const [draggedMember, setDraggedMember] = useState<VehicleMember | null>(null)
  const [dragOverTarget, setDragOverTarget] = useState<string | 'unassigned' | null>(null)

  // 新車輛表單
  const [newVehicle, setNewVehicle] = useState({
    vehicle_name: '1號車',
    license_plate: '',
    driver_name: '',
    driver_phone: '',
    vehicle_type: '43人座',
    capacity: 43,
    notes: '',
    display_order: 1,
  })

  // 計算下一個車號
  const getNextVehicleNumber = useCallback(() => {
    if (vehicles.length === 0) return 1
    // 嘗試從 vehicle_name 中提取數字
    const numbers = vehicles
      .map(v => {
        const match = v.vehicle_name.match(/(\d+)/)
        return match ? parseInt(match[1]) : 0
      })
      .filter(n => n > 0)
    return numbers.length > 0 ? Math.max(...numbers) + 1 : vehicles.length + 1
  }, [vehicles])

  // 開啟新增車輛對話框
  const handleOpenAddVehicle = () => {
    const nextNum = getNextVehicleNumber()
    setNewVehicle(prev => ({
      ...prev,
      vehicle_name: `${nextNum}號車`,
      display_order: nextNum,
    }))
    setShowAddVehicle(true)
  }

  // 新增車輛
  const handleAddVehicle = async () => {
    await addVehicle(newVehicle)
    setShowAddVehicle(false)
    const nextNum = getNextVehicleNumber() + 1
    setNewVehicle({
      vehicle_name: `${nextNum}號車`,
      license_plate: '',
      driver_name: '',
      driver_phone: '',
      vehicle_type: '43人座',
      capacity: 43,
      notes: '',
      display_order: nextNum,
    })
  }

  // 更新車輛
  const handleUpdateVehicle = async () => {
    if (!editingVehicle) return
    await updateVehicle(editingVehicle.id, {
      vehicle_name: editingVehicle.vehicle_name,
      license_plate: editingVehicle.license_plate,
      driver_name: editingVehicle.driver_name,
      driver_phone: editingVehicle.driver_phone,
      vehicle_type: editingVehicle.vehicle_type,
      capacity: editingVehicle.capacity,
      notes: editingVehicle.notes,
    })
    setEditingVehicle(null)
  }

  // 拖曳開始
  const handleDragStart = (member: VehicleMember) => {
    setDraggedMember(member)
  }

  // 拖曳結束
  const handleDragEnd = () => {
    setDraggedMember(null)
    setDragOverTarget(null)
  }

  // 拖曳進入
  const handleDragOver = (e: React.DragEvent, target: string | 'unassigned') => {
    e.preventDefault()
    setDragOverTarget(target)
  }

  // 拖曳離開
  const handleDragLeave = () => {
    setDragOverTarget(null)
  }

  // 放下
  const handleDrop = async (target: string | 'unassigned') => {
    if (!draggedMember) return
    const vehicleId = target === 'unassigned' ? null : target
    await assignMemberToVehicle(draggedMember.id, vehicleId)
    setDraggedMember(null)
    setDragOverTarget(null)
  }

  // 計算總人數
  const totalMembers = unassignedMembers.length + vehicles.reduce((sum, v) => sum + getMembersForVehicle(v.id).length, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-morandi-secondary">載入中...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 標題列 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bus className="text-morandi-gold" size={20} />
          <h3 className="font-medium text-morandi-primary">分車管理</h3>
          <span className="text-xs text-morandi-secondary">
            (共 {vehicles.length} 車 / {totalMembers} 人)
          </span>
        </div>
        <Button
          size="sm"
          className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-1"
          onClick={handleOpenAddVehicle}
          disabled={saving}
        >
          <Plus size={14} />
          新增車輛
        </Button>
      </div>

      {/* 分車區域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* 未分配區域 */}
        <div
          className={cn(
            'border rounded-lg p-3 min-h-[200px] transition-colors',
            dragOverTarget === 'unassigned' ? 'border-morandi-gold bg-morandi-gold/5' : 'border-border bg-morandi-container/20'
          )}
          onDragOver={(e) => handleDragOver(e, 'unassigned')}
          onDragLeave={handleDragLeave}
          onDrop={() => handleDrop('unassigned')}
        >
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
            <User size={16} className="text-morandi-secondary" />
            <span className="text-sm font-medium text-morandi-primary">未分配</span>
            <span className="text-xs text-morandi-secondary">({unassignedMembers.length} 人)</span>
          </div>
          <div className="space-y-1">
            {unassignedMembers.map(member => (
              <MemberCard
                key={member.id}
                member={member}
                onDragStart={() => handleDragStart(member)}
                onDragEnd={handleDragEnd}
                isDragging={draggedMember?.id === member.id}
              />
            ))}
            {unassignedMembers.length === 0 && (
              <p className="text-xs text-morandi-muted text-center py-4">全部成員已分配</p>
            )}
          </div>
        </div>

        {/* 車輛區域 */}
        {vehicles.map(vehicle => {
          const vehicleMembers = getMembersForVehicle(vehicle.id)
          return (
            <div
              key={vehicle.id}
              className={cn(
                'border rounded-lg p-3 min-h-[200px] transition-colors',
                dragOverTarget === vehicle.id
                  ? 'border-morandi-gold bg-morandi-gold/5'
                  : 'border-border bg-white'
              )}
              onDragOver={(e) => handleDragOver(e, vehicle.id)}
              onDragLeave={handleDragLeave}
              onDrop={() => handleDrop(vehicle.id)}
            >
              {/* 車輛標題 */}
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <Bus size={16} className="text-morandi-gold" />
                  <span className="text-sm font-medium text-morandi-primary">
                    {vehicle.vehicle_name}
                  </span>
                  <span className="text-xs text-morandi-secondary">
                    ({vehicleMembers.length}/{vehicle.capacity || '?'} 人)
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setEditingVehicle(vehicle)}
                  >
                    <Edit2 size={12} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-morandi-red hover:text-morandi-red"
                    onClick={() => deleteVehicle(vehicle.id)}
                    disabled={saving}
                  >
                    <Trash2 size={12} />
                  </Button>
                </div>
              </div>

              {/* 車輛資訊 */}
              {(vehicle.driver_name || vehicle.license_plate || vehicle.vehicle_type) && (
                <div className="text-xs text-morandi-secondary mb-2 space-y-0.5">
                  {vehicle.vehicle_type && <div>{vehicle.vehicle_type}</div>}
                  {vehicle.driver_name && (
                    <div className="flex items-center gap-1">
                      <span>司機: {vehicle.driver_name}</span>
                      {vehicle.driver_phone && (
                        <span className="flex items-center gap-0.5">
                          <Phone size={10} />
                          {vehicle.driver_phone}
                        </span>
                      )}
                    </div>
                  )}
                  {vehicle.license_plate && <div>車牌: {vehicle.license_plate}</div>}
                </div>
              )}

              {/* 成員列表 */}
              <div className="space-y-1">
                {vehicleMembers.map(member => (
                  <MemberCard
                    key={member.id}
                    member={member}
                    onDragStart={() => handleDragStart(member)}
                    onDragEnd={handleDragEnd}
                    isDragging={draggedMember?.id === member.id}
                  />
                ))}
                {vehicleMembers.length === 0 && (
                  <p className="text-xs text-morandi-muted text-center py-4">拖曳成員到此處</p>
                )}
              </div>
            </div>
          )
        })}

        {/* 無車輛提示 */}
        {vehicles.length === 0 && (
          <div className="border border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center text-center col-span-full lg:col-span-1">
            <Bus size={32} className="text-morandi-muted mb-2" />
            <p className="text-sm text-morandi-secondary mb-2">尚未新增車輛</p>
            <Button
              size="sm"
              variant="outline"
              className="gap-1"
              onClick={handleOpenAddVehicle}
            >
              <Plus size={14} />
              新增第一輛車
            </Button>
          </div>
        )}
      </div>

      {/* 新增車輛對話框 */}
      <Dialog open={showAddVehicle} onOpenChange={setShowAddVehicle}>
        <DialogContent level={3} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>新增車輛</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>車輛名稱</Label>
                <Input
                  value={newVehicle.vehicle_name}
                  onChange={(e) => setNewVehicle(prev => ({ ...prev, vehicle_name: e.target.value }))}
                  placeholder="例：1號車"
                />
              </div>
              <div>
                <Label>車型</Label>
                <Select
                  value={newVehicle.vehicle_type}
                  onValueChange={(v) => {
                    const type = VEHICLE_TYPES.find(t => t.value === v)
                    setNewVehicle(prev => ({
                      ...prev,
                      vehicle_type: v,
                      capacity: type ? parseInt(v) : prev.capacity,
                    }))
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VEHICLE_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>車牌號碼</Label>
                <Input
                  value={newVehicle.license_plate}
                  onChange={(e) => setNewVehicle(prev => ({ ...prev, license_plate: e.target.value }))}
                  placeholder="選填"
                />
              </div>
              <div>
                <Label>座位數</Label>
                <Input
                  type="number"
                  min={1}
                  value={newVehicle.capacity}
                  onChange={(e) => setNewVehicle(prev => ({ ...prev, capacity: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>司機姓名</Label>
                <Input
                  value={newVehicle.driver_name}
                  onChange={(e) => setNewVehicle(prev => ({ ...prev, driver_name: e.target.value }))}
                  placeholder="選填"
                />
              </div>
              <div>
                <Label>司機電話</Label>
                <Input
                  value={newVehicle.driver_phone}
                  onChange={(e) => setNewVehicle(prev => ({ ...prev, driver_phone: e.target.value }))}
                  placeholder="選填"
                />
              </div>
            </div>
            <div>
              <Label>備註</Label>
              <Input
                value={newVehicle.notes}
                onChange={(e) => setNewVehicle(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="選填"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddVehicle(false)}>
              <X size={14} className="mr-1" />
              取消
            </Button>
            <Button
              className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
              onClick={handleAddVehicle}
              disabled={saving || !newVehicle.vehicle_name.trim()}
            >
              <Plus size={14} className="mr-1" />
              新增
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 編輯車輛對話框 */}
      <Dialog open={!!editingVehicle} onOpenChange={(open) => !open && setEditingVehicle(null)}>
        <DialogContent level={3} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>編輯 {editingVehicle?.vehicle_name}</DialogTitle>
          </DialogHeader>
          {editingVehicle && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>車輛名稱</Label>
                  <Input
                    value={editingVehicle.vehicle_name}
                    onChange={(e) => setEditingVehicle(prev => prev ? { ...prev, vehicle_name: e.target.value } : null)}
                    placeholder="例：1號車"
                  />
                </div>
                <div>
                  <Label>車型</Label>
                  <Select
                    value={editingVehicle.vehicle_type || ''}
                    onValueChange={(v) => {
                      const type = VEHICLE_TYPES.find(t => t.value === v)
                      setEditingVehicle(prev => prev ? {
                        ...prev,
                        vehicle_type: v,
                        capacity: type ? parseInt(v) : prev.capacity,
                      } : null)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VEHICLE_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>車牌號碼</Label>
                  <Input
                    value={editingVehicle.license_plate || ''}
                    onChange={(e) => setEditingVehicle(prev => prev ? { ...prev, license_plate: e.target.value } : null)}
                    placeholder="選填"
                  />
                </div>
                <div>
                  <Label>座位數</Label>
                  <Input
                    type="number"
                    min={1}
                    value={editingVehicle.capacity}
                    onChange={(e) => setEditingVehicle(prev => prev ? { ...prev, capacity: parseInt(e.target.value) || 0 } : null)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>司機姓名</Label>
                  <Input
                    value={editingVehicle.driver_name || ''}
                    onChange={(e) => setEditingVehicle(prev => prev ? { ...prev, driver_name: e.target.value } : null)}
                    placeholder="選填"
                  />
                </div>
                <div>
                  <Label>司機電話</Label>
                  <Input
                    value={editingVehicle.driver_phone || ''}
                    onChange={(e) => setEditingVehicle(prev => prev ? { ...prev, driver_phone: e.target.value } : null)}
                    placeholder="選填"
                  />
                </div>
              </div>
              <div>
                <Label>備註</Label>
                <Input
                  value={editingVehicle.notes || ''}
                  onChange={(e) => setEditingVehicle(prev => prev ? { ...prev, notes: e.target.value } : null)}
                  placeholder="選填"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingVehicle(null)}>
              <X size={14} className="mr-1" />
              取消
            </Button>
            <Button
              className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
              onClick={handleUpdateVehicle}
              disabled={saving}
            >
              <Save size={14} className="mr-1" />
              儲存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// 成員卡片組件
interface MemberCardProps {
  member: VehicleMember
  onDragStart: () => void
  onDragEnd: () => void
  isDragging: boolean
}

function MemberCard({ member, onDragStart, onDragEnd, isDragging }: MemberCardProps) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        'flex items-center gap-2 px-2 py-1.5 bg-white border border-border rounded cursor-grab active:cursor-grabbing transition-all',
        isDragging && 'opacity-50 scale-95'
      )}
    >
      <GripVertical size={12} className="text-morandi-muted flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-morandi-primary truncate">
          {member.chinese_name || member.passport_name || '未命名'}
        </div>
        {member.order_code && (
          <div className="text-[10px] text-morandi-secondary truncate">
            {member.order_code}
          </div>
        )}
      </div>
    </div>
  )
}
