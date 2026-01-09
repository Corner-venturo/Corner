/**
 * FleetPage - 車隊管理頁面
 */

'use client'

import { logger } from '@/lib/utils/logger'
import React, { useState, useCallback, useEffect } from 'react'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { Bus } from 'lucide-react'
import { FleetList } from './FleetList'
import { FleetDialog } from './FleetDialog'
import { useFleetVehicleStore } from '@/stores'
import type { FleetVehicle, FleetVehicleFormData, VehicleType, VehicleStatus } from '@/types/fleet.types'
import { confirm, alert } from '@/lib/ui/alert-dialog'

const emptyFormData: FleetVehicleFormData = {
  license_plate: '',
  vehicle_name: '',
  vehicle_type: 'large_bus',
  capacity: 45,
  driver_name: '',
  driver_phone: '',
  status: 'available',
  notes: '',
}

export const FleetPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingItem, setEditingItem] = useState<FleetVehicle | null>(null)
  const [formData, setFormData] = useState<FleetVehicleFormData>(emptyFormData)

  const {
    items: vehicles,
    loading,
    create,
    update,
    delete: deleteItem,
    fetchAll,
  } = useFleetVehicleStore()

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  // 過濾資料
  const filteredItems = vehicles.filter(item => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      item.license_plate?.toLowerCase().includes(query) ||
      item.vehicle_name?.toLowerCase().includes(query) ||
      item.driver_name?.toLowerCase().includes(query)
    )
  })

  const handleOpenAddDialog = useCallback(() => {
    setIsEditMode(false)
    setEditingItem(null)
    setFormData(emptyFormData)
    setIsDialogOpen(true)
  }, [])

  const handleEdit = useCallback((item: FleetVehicle) => {
    setIsEditMode(true)
    setEditingItem(item)
    setFormData({
      license_plate: item.license_plate || '',
      vehicle_name: item.vehicle_name || '',
      vehicle_type: item.vehicle_type || 'large_bus',
      capacity: item.capacity || 45,
      driver_name: item.driver_name || '',
      driver_phone: item.driver_phone || '',
      status: item.status || 'available',
      notes: item.notes || '',
    })
    setIsDialogOpen(true)
  }, [])

  const handleDelete = useCallback(
    async (item: FleetVehicle) => {
      const confirmed = await confirm(`確定要刪除車輛「${item.license_plate}」嗎？`, {
        title: '刪除車輛',
        type: 'warning',
      })
      if (!confirmed) return

      try {
        await deleteItem(item.id)
        await alert('車輛已刪除', 'success')
      } catch (error) {
        logger.error('Delete FleetVehicle Error:', error)
        await alert('刪除失敗，請稍後再試', 'error')
      }
    },
    [deleteItem]
  )

  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false)
    setIsEditMode(false)
    setEditingItem(null)
    setFormData(emptyFormData)
  }, [])

  const handleFormFieldChange = useCallback(
    <K extends keyof FleetVehicleFormData>(field: K, value: FleetVehicleFormData[K]) => {
      setFormData(prev => ({ ...prev, [field]: value }))
    },
    []
  )

  const handleSubmit = useCallback(async () => {
    try {
      const data = {
        license_plate: formData.license_plate,
        vehicle_name: formData.vehicle_name || null,
        vehicle_type: formData.vehicle_type as VehicleType,
        capacity: formData.capacity,
        driver_name: formData.driver_name || null,
        driver_phone: formData.driver_phone || null,
        status: formData.status as VehicleStatus,
        notes: formData.notes || null,
      }

      if (isEditMode && editingItem) {
        await update(editingItem.id, data)
        await alert('車輛資料更新成功', 'success')
      } else {
        await create(data as Parameters<typeof create>[0])
        await alert('車輛資料建立成功', 'success')
      }
      handleCloseDialog()
    } catch (error) {
      logger.error('Save FleetVehicle Error:', error)
      await alert('儲存失敗，請稍後再試', 'error')
    }
  }, [formData, isEditMode, editingItem, create, update, handleCloseDialog])

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="車隊管理"
        icon={Bus}
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '資料庫管理', href: '/database' },
          { label: '車隊管理', href: '/database/fleet' },
        ]}
        showSearch
        searchTerm={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="搜尋車牌、車輛名稱、司機..."
        onAdd={handleOpenAddDialog}
        addLabel="新增車輛"
      />

      <div className="flex-1 overflow-auto">
        <FleetList
          items={filteredItems}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      <FleetDialog
        isOpen={isDialogOpen}
        isEditMode={isEditMode}
        onClose={handleCloseDialog}
        formData={formData}
        onFormFieldChange={handleFormFieldChange}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
