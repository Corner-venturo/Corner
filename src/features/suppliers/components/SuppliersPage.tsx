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

  const { items: suppliers, create, fetchAll: fetchSuppliers } = useSupplierStore()

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
    setIsAddDialogOpen(true)
  }, [])

  const handleCloseDialog = useCallback(() => {
    setIsAddDialogOpen(false)
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
      await create({
        name: formData.name,
        bank_name: formData.bank_name,
        bank_account: formData.bank_account,
        notes: formData.note,
      })
      handleCloseDialog()
      alert('✅ 供應商建立成功')
    } catch (error) {
      logger.error('❌ Create Supplier Error:', error)
      alert('❌ 建立失敗，請稍後再試')
    }
  }, [formData, create, handleCloseDialog])

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
        <SuppliersList suppliers={filteredSuppliers} />
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
