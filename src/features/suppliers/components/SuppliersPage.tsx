'use client'
/**
 * SuppliersPage - 供應商管理頁面（僅基本資訊）
 */


import { logger } from '@/lib/utils/logger'
import React, { useState, useCallback } from 'react'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { Building2 } from 'lucide-react'
import { SuppliersList } from './SuppliersList'
import { SuppliersDialog } from './SuppliersDialog'
import {
  useSuppliersSlim,
  createSupplier,
  updateSupplier,
  deleteSupplier as deleteSupplierApi,
} from '@/data'
import type { Supplier } from '@/types/supplier.types'
import { confirm, alert } from '@/lib/ui/alert-dialog'
import { LABELS } from '../constants/labels'

export const SuppliersPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)

  const { items: suppliers } = useSuppliersSlim()

  // 簡化的表單狀態
  const [formData, setFormData] = useState({
    name: '',
    bank_name: '',
    bank_account: '',
    notes: '',
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

  const handleEdit = useCallback((supplier: Supplier) => {
    setIsEditMode(true)
    setEditingSupplier(supplier)
    setFormData({
      name: supplier.name || '',
      bank_name: supplier.bank_name || '',
      bank_account: supplier.bank_account || '',
      notes: supplier.notes || '',
    })
    setIsAddDialogOpen(true)
  }, [])

  const handleDelete = useCallback(async (supplier: Supplier) => {
    const confirmed = await confirm(`確定要刪除供應商「${supplier.name}」嗎？`, {
      title: LABELS.deleteSupplier,
      type: 'warning',
    })
    if (!confirmed) return

    try {
      await deleteSupplierApi(supplier.id)
      await alert('供應商已刪除', 'success')
    } catch (error) {
      logger.error('❌ Delete Supplier Error:', error)
      await alert('刪除失敗，請稍後再試', 'error')
    }
  }, [])

  const handleCloseDialog = useCallback(() => {
    setIsAddDialogOpen(false)
    setIsEditMode(false)
    setEditingSupplier(null)
    setFormData({
      name: '',
      bank_name: '',
      bank_account: '',
      notes: '',
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
        await updateSupplier(editingSupplier.id, {
          name: formData.name,
          bank_name: formData.bank_name,
          bank_account: formData.bank_account,
          notes: formData.notes,
        })
        await alert('供應商更新成功', 'success')
      } else {
        // 新增模式
        await createSupplier({
          name: formData.name,
          bank_name: formData.bank_name || null,
          bank_account: formData.bank_account || null,
          notes: formData.notes || null,
          type: 'other', // 預設型別
        })
        await alert('供應商建立成功', 'success')
      }
      handleCloseDialog()
    } catch (error) {
      logger.error('❌ Save Supplier Error:', error)
      await alert('儲存失敗，請稍後再試', 'error')
    }
  }, [formData, isEditMode, editingSupplier, handleCloseDialog])

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title={LABELS.supplierManagement}
        icon={Building2}
        breadcrumb={[
          { label: LABELS.home, href: '/' },
          { label: LABELS.databaseManagement, href: '/database' },
          { label: LABELS.supplierManagement, href: '/database/suppliers' },
        ]}
        showSearch
        searchTerm={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={LABELS.searchPlaceholder}
        onAdd={handleOpenAddDialog}
        addLabel={LABELS.addSupplier}
      />

      <div className="flex-1 overflow-auto">
        <SuppliersList
          suppliers={filteredSuppliers}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      {/* 新增/編輯供應商對話框 */}
      <SuppliersDialog
        isOpen={isAddDialogOpen}
        onClose={handleCloseDialog}
        formData={formData}
        onFormFieldChange={handleFormFieldChange}
        onSubmit={handleSubmit}
        isEditMode={isEditMode}
      />
    </div>
  )
}
