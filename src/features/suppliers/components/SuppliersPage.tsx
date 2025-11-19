/**
 * SuppliersPage - 供應商管理頁面（僅基本資訊）
 */

'use client'

import { logger } from '@/lib/utils/logger'
import React, { useState, useCallback, useEffect } from 'react'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { Building2 } from 'lucide-react'
import { SuppliersList } from './SuppliersList'
import { SuppliersDialog } from './SuppliersDialog'
import { useSupplierStore } from '@/stores'
import { useRealtimeForSuppliers } from '@/hooks/use-realtime-hooks'

export const SuppliersPage: React.FC = () => {
  // ✅ Realtime 訂閱
  useRealtimeForSuppliers()

  const [searchQuery, setSearchQuery] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<any>(null)

  const { items: suppliers, create, update, delete: deleteSupplier, fetchAll: fetchSuppliers } = useSupplierStore()

  // 載入資料
  useEffect(() => {
    fetchSuppliers()
  }, [fetchSuppliers])

  // 簡化的表單狀態
  const [formData, setFormData] = useState({
    name: '',
    bank_name: '',
    bank_account: '',
    note: '',
  })

  // 過濾供應商
  const filteredSuppliers = suppliers.filter(supplier =>
    searchQuery
      ? supplier.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        supplier.bank_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        supplier.bank_account?.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  )

  const handleOpenAddDialog = useCallback(() => {
    setIsEditMode(false)
    setEditingSupplier(null)
    setIsAddDialogOpen(true)
  }, [])

  const handleEdit = useCallback((supplier: any) => {
    setIsEditMode(true)
    setEditingSupplier(supplier)
    setFormData({
      name: supplier.name || '',
      bank_name: supplier.bank_name || '',
      bank_account: supplier.bank_account || '',
      note: supplier.notes || '',
    })
    setIsAddDialogOpen(true)
  }, [])

  const handleDelete = useCallback(async (supplier: any) => {
    if (!confirm(`確定要刪除供應商「${supplier.name}」嗎？`)) return

    try {
      await deleteSupplier(supplier.id)
      alert('✅ 供應商已刪除')
    } catch (error) {
      logger.error('❌ Delete Supplier Error:', error)
      alert('❌ 刪除失敗，請稍後再試')
    }
  }, [deleteSupplier])

  const handleCloseDialog = useCallback(() => {
    setIsAddDialogOpen(false)
    setIsEditMode(false)
    setEditingSupplier(null)
    setFormData({
      name: '',
      bank_name: '',
      bank_account: '',
      note: '',
    })
  }, [])

  const handleFormFieldChange = useCallback(
    <K extends keyof typeof formData>(field: K, value: (typeof formData)[K]) => {
      setFormData(prev => ({ ...prev, [field]: value }))
    },
    []
  )

  const handleSubmit = useCallback(async () => {
    try {
      if (isEditMode && editingSupplier) {
        // 更新模式
        await update(editingSupplier.id, {
          name: formData.name,
          bank_name: formData.bank_name,
          bank_account: formData.bank_account,
          notes: formData.note,
        } as any)
        alert('✅ 供應商更新成功')
      } else {
        // 新增模式
        await create({
          name: formData.name,
          bank_name: formData.bank_name,
          bank_account: formData.bank_account,
          notes: formData.note,
        } as any)
        alert('✅ 供應商建立成功')
      }
      handleCloseDialog()
    } catch (error) {
      logger.error('❌ Save Supplier Error:', error)
      alert('❌ 儲存失敗，請稍後再試')
    }
  }, [formData, isEditMode, editingSupplier, create, update, handleCloseDialog])

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="供應商管理"
        icon={Building2}
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '資料庫管理', href: '/database' },
          { label: '供應商管理', href: '/database/suppliers' },
        ]}
        showSearch
        searchTerm={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="搜尋供應商名稱或銀行資訊..."
        onAdd={handleOpenAddDialog}
        addLabel="新增供應商"
      />

      <div className="flex-1 overflow-auto">
        <SuppliersList
          suppliers={filteredSuppliers}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      {/* 新增供應商對話框 */}
      <SuppliersDialog
        isOpen={isAddDialogOpen}
        onClose={handleCloseDialog}
        formData={formData}
        onFormFieldChange={handleFormFieldChange}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
