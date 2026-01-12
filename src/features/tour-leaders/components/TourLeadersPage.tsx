/**
 * TourLeadersPage - 領隊資料管理頁面
 */

'use client'

import { logger } from '@/lib/utils/logger'
import React, { useState, useCallback } from 'react'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { Users } from 'lucide-react'
import { TourLeadersList } from './TourLeadersList'
import { TourLeadersDialog } from './TourLeadersDialog'
import { LeaderAvailabilityDialog } from './LeaderAvailabilityDialog'
import { useTourLeaders, createTourLeader, updateTourLeader, deleteTourLeader } from '@/data'
import type { TourLeader, TourLeaderFormData } from '@/types/tour-leader.types'
import { confirm, alert } from '@/lib/ui/alert-dialog'

const emptyFormData: TourLeaderFormData = {
  name: '',
  name_en: '',
  phone: '',
  email: '',
  address: '',
  national_id: '',
  passport_number: '',
  passport_expiry: '',
  languages: '',
  specialties: '',
  license_number: '',
  notes: '',
  status: 'active',
}

export const TourLeadersPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingItem, setEditingItem] = useState<TourLeader | null>(null)
  const [formData, setFormData] = useState<TourLeaderFormData>(emptyFormData)
  const [isAvailabilityDialogOpen, setIsAvailabilityDialogOpen] = useState(false)
  const [availabilityLeader, setAvailabilityLeader] = useState<TourLeader | null>(null)

  // SWR 自動載入資料，不需要手動 fetchAll
  const { items: tourLeaders, loading } = useTourLeaders()

  // 過濾資料
  const filteredItems = tourLeaders.filter(item => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      item.name?.toLowerCase().includes(query) ||
      item.name_en?.toLowerCase().includes(query) ||
      item.phone?.toLowerCase().includes(query) ||
      item.code?.toLowerCase().includes(query)
    )
  })

  const handleOpenAddDialog = useCallback(() => {
    setIsEditMode(false)
    setEditingItem(null)
    setFormData(emptyFormData)
    setIsDialogOpen(true)
  }, [])

  const handleEdit = useCallback((item: TourLeader) => {
    setIsEditMode(true)
    setEditingItem(item)
    setFormData({
      name: item.name || '',
      name_en: item.name_en || '',
      phone: item.phone || '',
      email: item.email || '',
      address: item.address || '',
      national_id: item.national_id || '',
      passport_number: item.passport_number || '',
      passport_expiry: item.passport_expiry || '',
      languages: item.languages?.join(', ') || '',
      specialties: item.specialties?.join(', ') || '',
      license_number: item.license_number || '',
      notes: item.notes || '',
      status: item.status || 'active',
    })
    setIsDialogOpen(true)
  }, [])

  const handleOpenAvailability = useCallback((item: TourLeader) => {
    setAvailabilityLeader(item)
    setIsAvailabilityDialogOpen(true)
  }, [])

  const handleCloseAvailability = useCallback(() => {
    setIsAvailabilityDialogOpen(false)
    setAvailabilityLeader(null)
  }, [])

  const handleDelete = useCallback(
    async (item: TourLeader) => {
      const confirmed = await confirm(`確定要刪除領隊「${item.name}」嗎？`, {
        title: '刪除領隊',
        type: 'warning',
      })
      if (!confirmed) return

      try {
        await deleteTourLeader(item.id)
        await alert('領隊已刪除', 'success')
      } catch (error) {
        logger.error('Delete TourLeader Error:', error)
        await alert('刪除失敗，請稍後再試', 'error')
      }
    },
    []
  )

  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false)
    setIsEditMode(false)
    setEditingItem(null)
    setFormData(emptyFormData)
  }, [])

  const handleFormFieldChange = useCallback(
    <K extends keyof TourLeaderFormData>(field: K, value: TourLeaderFormData[K]) => {
      setFormData(prev => ({ ...prev, [field]: value }))
    },
    []
  )

  const handleSubmit = useCallback(async () => {
    try {
      const data = {
        name: formData.name,
        name_en: formData.name_en || null,
        phone: formData.phone || null,
        email: formData.email || null,
        address: formData.address || null,
        national_id: formData.national_id || null,
        passport_number: formData.passport_number || null,
        passport_expiry: formData.passport_expiry || null,
        languages: formData.languages
          ? formData.languages.split(',').map(s => s.trim()).filter(Boolean)
          : [],
        specialties: formData.specialties
          ? formData.specialties.split(',').map(s => s.trim()).filter(Boolean)
          : [],
        license_number: formData.license_number || null,
        notes: formData.notes || null,
        status: formData.status,
      }

      if (isEditMode && editingItem) {
        await updateTourLeader(editingItem.id, data)
        await alert('領隊資料更新成功', 'success')
      } else {
        await createTourLeader(data)
        await alert('領隊資料建立成功', 'success')
      }
      handleCloseDialog()
    } catch (error) {
      logger.error('Save TourLeader Error:', error)
      await alert('儲存失敗，請稍後再試', 'error')
    }
  }, [formData, isEditMode, editingItem, handleCloseDialog])

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="領隊資料"
        icon={Users}
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '資料庫管理', href: '/database' },
          { label: '領隊資料', href: '/database/tour-leaders' },
        ]}
        showSearch
        searchTerm={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="搜尋領隊姓名、電話..."
        onAdd={handleOpenAddDialog}
        addLabel="新增領隊"
      />

      <div className="flex-1 overflow-auto">
        <TourLeadersList
          items={filteredItems}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAvailability={handleOpenAvailability}
        />
      </div>

      <TourLeadersDialog
        isOpen={isDialogOpen}
        isEditMode={isEditMode}
        onClose={handleCloseDialog}
        formData={formData}
        onFormFieldChange={handleFormFieldChange}
        onSubmit={handleSubmit}
      />

      <LeaderAvailabilityDialog
        isOpen={isAvailabilityDialogOpen}
        onClose={handleCloseAvailability}
        leader={availabilityLeader}
      />
    </div>
  )
}
