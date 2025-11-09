/**
 * SuppliersPage - Main suppliers management page
 */

'use client'

import React, { useState, useCallback } from 'react'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { Building2 } from 'lucide-react'
import { SuppliersList } from './SuppliersList'
import { SuppliersDialog } from './SuppliersDialog'
import { useSuppliersData } from '../hooks/useSuppliersData'
import { useSuppliersFilters } from '../hooks/useSuppliersFilters'
import { useSupplierForm } from '../hooks/useSupplierForm'
import { useRealtimeForSuppliers } from '@/hooks/use-realtime-hooks'

export const SuppliersPage: React.FC = () => {
  // ✅ Realtime 訂閱
  useRealtimeForSuppliers()
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  // Data hooks
  const {
    suppliers,
    countries,
    activeCountries,
    fetchRegions,
    getRegionsByCountry,
    getCitiesByCountry,
    getCitiesByRegion,
    handleCreateSupplier,
  } = useSuppliersData()

  // Filter hooks
  const { filteredSuppliers } = useSuppliersFilters({ suppliers, searchQuery })

  // Form hooks
  const {
    formData,
    paymentAccounts,
    availableRegions,
    availableCities,
    setFormField,
    setContactField,
    setPaymentAccounts,
    handleCountryChange,
    handleRegionChange,
    toggleCitySelection,
    resetForm,
    handleSubmit: submitForm,
  } = useSupplierForm({
    onSubmit: handleCreateSupplier,
    getRegionsByCountry,
    getCitiesByCountry,
    getCitiesByRegion,
  })

  // Lazy load: only load regions when opening dialog
  const handleOpenAddDialog = useCallback(() => {
    if (countries.length === 0) {
      fetchRegions()
    }
    setIsAddDialogOpen(true)
  }, [countries.length, fetchRegions])

  const handleCloseDialog = useCallback(() => {
    setIsAddDialogOpen(false)
    resetForm()
  }, [resetForm])

  const handleSubmit = useCallback(async () => {
    try {
      await submitForm()
      handleCloseDialog()
    } catch (error) {
      alert(error instanceof Error ? error.message : '新增供應商失敗，請稍後再試')
    }
  }, [submitForm, handleCloseDialog])

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
        showSearch={true}
        searchTerm={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="搜尋供應商名稱、聯絡人或服務項目..."
        onAdd={handleOpenAddDialog}
        addLabel="新增供應商"
      />

      {/* 供應商列表 */}
      <div className="flex-1 overflow-auto">
        <SuppliersList suppliers={filteredSuppliers} />
      </div>

      {/* 新增供應商對話框 */}
      <SuppliersDialog
        isOpen={isAddDialogOpen}
        onClose={handleCloseDialog}
        formData={formData}
        paymentAccounts={paymentAccounts}
        activeCountries={activeCountries}
        availableRegions={availableRegions}
        availableCities={availableCities}
        onFormFieldChange={setFormField}
        onContactFieldChange={setContactField}
        onPaymentAccountsChange={setPaymentAccounts}
        onCountryChange={handleCountryChange}
        onRegionChange={handleRegionChange}
        onCityToggle={toggleCitySelection}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
