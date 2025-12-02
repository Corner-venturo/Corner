'use client'

import React, { useEffect } from 'react'
import { FileText, Clock, CheckCircle, XCircle, AlertCircle, FileCheck, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { logger } from '@/lib/utils/logger'
import { tourService } from '@/features/tours/services/tour.service'
import { toast } from 'sonner'
import { useVisasData } from '../hooks/useVisasData'
import { useVisasFilters } from '../hooks/useVisasFilters'
import { useVisasDialog } from '../hooks/useVisasDialog'
import { VisasList } from './VisasList'
import { VisasInfoDialog } from './VisasInfoDialog'
import { AddVisaDialog } from './AddVisaDialog'
import {
  useRealtimeForVisas,
} from '@/hooks/use-realtime-hooks'

// ============================================
// 簽證管理主頁面
// ============================================

export default function VisasPage() {
  // ✅ Realtime 訂閱（只訂閱 Visas）
  // Tours, Orders, Members, Customers 只用來顯示名稱，不需要即時訂閱
  useRealtimeForVisas()
  // 資料管理
  const {
    visas,
    tours,
    orders,
    user,
    canManageVisas,
    addVisa,
    updateVisa,
    deleteVisa,
    addTour,
    fetchTours,
    addOrder,
  } = useVisasData()

  // 載入資料
  React.useEffect(() => {
    const loadData = async () => {
      const { useVisaStore, useOrderStore, useMemberStore, useCustomerStore } = await import(
        '@/stores'
      )
      await Promise.all([
        useVisaStore.getState().fetchAll(),
        fetchTours(),
        useOrderStore.getState().fetchAll(),
        useMemberStore.getState().fetchAll(),
        useCustomerStore.getState().fetchAll(),
      ])
    }
    loadData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 篩選管理
  const { activeTab, setActiveTab, selectedRows, setSelectedRows, filteredVisas } =
    useVisasFilters(visas)

  // 對話框管理
  const {
    isDialogOpen,
    setIsDialogOpen,
    contact_info,
    setContactInfo,
    applicants,
    setApplicants,
    tourOptions,
    calculateFee,
    addApplicant,
    removeApplicant,
    updateApplicant,
    resetForm,
  } = useVisasDialog(tours)

  const [isInfoDialogOpen, setIsInfoDialogOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // 權限檢查：清除選擇
  useEffect(() => {
    if (!canManageVisas && selectedRows.length > 0) {
      setSelectedRows([])
    }
  }, [canManageVisas, selectedRows.length, setSelectedRows])

  // 第一個辦理人自動帶入申請人姓名
  useEffect(() => {
    if (applicants.length > 0) {
      setApplicants(prev => {
        const updated = [...prev]
        updated[0].name = contact_info.applicant_name
        return updated
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contact_info.applicant_name, applicants.length])

  // 處理批次新增簽證
  const handleAddVisa = async () => {
    // 防止重複提交
    if (isSubmitting) return
    setIsSubmitting(true)

    try {
    if (!canManageVisas || !contact_info.applicant_name || !user) return

    let selectedTour

    // 如果沒選團號，使用預設簽證團（不自動建立）
    if (!contact_info.tour_id) {
      const currentYear = new Date().getFullYear()
      const defaultTourCode = `VISA-${currentYear}`
      const existingDefaultTour = tours.find(t => t.code === defaultTourCode)

      if (existingDefaultTour) {
        selectedTour = existingDefaultTour
      } else {
        // 提示管理員需要先建立簽證團
        toast.error(`請先在簽證頁面設定 ${currentYear} 年預設簽證團，或在表單中選擇團號`)
        return
      }
    } else {
      selectedTour = tours.find(t => t.id === contact_info.tour_id)
      if (!selectedTour) return
    }

    // 取得或建立訂單
    const totalFee = applicants.reduce((sum, a) => sum + calculateFee(a.country), 0)
    let targetOrder

    // 如果選擇「+ 新增訂單」或沒有選訂單，則自動建立
    if (contact_info.order_id && contact_info.order_id !== '__create_new__') {
      targetOrder = orders.find(o => o.id === contact_info.order_id)
      if (!targetOrder) return
    } else {
      // 重新查詢該團的訂單數量（確保最新）
      const { supabase } = await import('@/lib/supabase/client')
      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('tour_id', selectedTour.id)

      const nextNumber = ((count || 0) + 1).toString().padStart(3, '0')
      const order_number = `${selectedTour.code}-${nextNumber}`

      targetOrder = await addOrder({
        order_number,
        tour_id: selectedTour.id,
        code: order_number,
        tour_name: selectedTour.name,
        contact_person: contact_info.contact_person || contact_info.applicant_name,
        sales_person: user.display_name || '系統',
        assistant: user.display_name || '系統',
        member_count: applicants.filter(a => a.name).length,
        total_amount: totalFee,
        paid_amount: 0,
        remaining_amount: totalFee,
        payment_status: 'unpaid' as const,
      } as any)

      if (contact_info.order_id === '__create_new__') {
        toast.success(`已建立訂單：${order_number}`)
      }
    }

    if (!targetOrder) {
      logger.error('訂單建立失敗')
      return
    }

    // 批次建立簽證（使用 for...of 確保順序執行）
    for (const applicant of applicants) {
      if (!applicant.name) continue

      const fee = calculateFee(applicant.country)
      const total_cost = applicant.is_urgent ? applicant.cost + 900 : applicant.cost

      await addVisa({
        applicant_name: applicant.name,
        contact_person: contact_info.contact_person || '',
        contact_phone: contact_info.contact_phone || '',
        visa_type: applicant.country,
        country: applicant.country,
        submission_date: applicant.submission_date,
        received_date: applicant.received_date,
        fee,
        cost: total_cost,
        status: 'pending',
        order_id: targetOrder.id,
        order_number: targetOrder.order_number || '',
        tour_id: selectedTour.id,
        code: selectedTour.code,
        created_by: user.id,
        note: '',
      })
    }

      // 重置表單
      const currentYear = new Date().getFullYear()
      const visaCode = `VISA${currentYear}001`
      const defaultVisaTour = tours.find(t => t.code === visaCode)
      resetForm(defaultVisaTour?.id)
      setIsDialogOpen(false)
    } catch (error) {
      logger.error('批次新增簽證失敗', error)
      toast.error('新增簽證失敗，請稍後再試')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 批次送件
  const handleBatchSubmit = async () => {
    if (!canManageVisas || selectedRows.length === 0) return
    const today = new Date().toISOString().split('T')[0]

    for (const id of selectedRows) {
      await updateVisa(id, { status: 'submitted', submission_date: today })
    }

    setSelectedRows([])
  }

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="簽證管理"
        icon={FileText}
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '簽證管理', href: '/visas' },
        ]}
        actions={
          <div className="flex items-center gap-3">
            {/* 批次操作區域 */}
            {canManageVisas && selectedRows.length > 0 ? (
              <>
                <span className="text-sm text-morandi-primary">
                  已選擇 {selectedRows.length} 筆簽證
                </span>
                <Button
                  onClick={() => {
                    selectedRows.forEach(id => updateVisa(id, { status: 'submitted' }))
                    setSelectedRows([])
                  }}
                  size="sm"
                  variant="secondary"
                >
                  送
                </Button>
                <Button
                  onClick={() => {
                    selectedRows.forEach(id => updateVisa(id, { status: 'collected' }))
                    setSelectedRows([])
                  }}
                  size="sm"
                  variant="default"
                >
                  取
                </Button>
                <Button
                  onClick={() => {
                    selectedRows.forEach(id => updateVisa(id, { status: 'rejected' }))
                    setSelectedRows([])
                  }}
                  size="sm"
                  variant="destructive"
                >
                  退
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSelectedRows([])}>
                  取消選擇
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsInfoDialogOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Info size={16} />
                  查看簽證資訊
                </Button>
                {canManageVisas && (
                  <Button
                    onClick={() => setIsDialogOpen(true)}
                    className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
                  >
                    新增簽證
                  </Button>
                )}
              </>
            )}
          </div>
        }
        tabs={[
          { value: 'all', label: '全部', icon: FileText },
          { value: 'pending', label: '待送件', icon: Clock },
          { value: 'submitted', label: '已送件', icon: AlertCircle },
          { value: 'issued', label: '已下件', icon: CheckCircle },
          { value: 'collected', label: '已取件', icon: FileCheck },
          { value: 'rejected', label: '退件', icon: XCircle },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="flex-1 overflow-auto">
        {/* 簽證列表 */}
        <VisasList
          filteredVisas={filteredVisas}
          canManageVisas={canManageVisas}
          selectedRows={selectedRows}
          onSelectionChange={setSelectedRows}
          onDelete={deleteVisa}
          onUpdateStatus={(id, status) => updateVisa(id, { status })}
        />
      </div>

      {/* 簽證資訊對話框 */}
      <VisasInfoDialog open={isInfoDialogOpen} onClose={() => setIsInfoDialogOpen(false)} />

      {/* 新增簽證對話框 */}
      <AddVisaDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSubmit={handleAddVisa}
        contact_info={contact_info}
        setContactInfo={setContactInfo}
        applicants={applicants}
        tourOptions={tourOptions}
        calculateFee={calculateFee}
        addApplicant={addApplicant}
        removeApplicant={removeApplicant}
        updateApplicant={updateApplicant}
        canSubmit={!!contact_info.applicant_name && applicants.some(a => a.name)}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}
