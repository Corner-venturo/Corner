'use client'

import React, { useEffect } from 'react'
import { FileText, Clock, CheckCircle, XCircle, AlertCircle, FileCheck, Info, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { logger } from '@/lib/utils/logger'
import { tourService } from '@/features/tours/services/tour.service'
import { toast } from 'sonner'
import { useVisasData } from '../hooks/useVisasData'
import { useVisasFilters } from '../hooks/useVisasFilters'
import { useVisasDialog } from '../hooks/useVisasDialog'
import { VisasList } from './VisasList'
import { VisasInfoDialog } from './VisasInfoDialog'
import { AddVisaDialog } from './AddVisaDialog'
// ============================================
// 簽證管理主頁面
// ============================================

export default function VisasPage() {
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

  // 旅客比對相關狀態
  const [showCustomerMatchDialog, setShowCustomerMatchDialog] = React.useState(false)
  const [pendingCustomers, setPendingCustomers] = React.useState<Array<{
    name: string
    phone: string
    matchedCustomers: Array<{
      id: string
      name: string
      phone: string | null
      date_of_birth: string | null
      national_id: string | null
    }>
  }>>([])
  const [currentCustomerIndex, setCurrentCustomerIndex] = React.useState(0)

  // 新增客戶表單狀態
  const [showAddCustomerForm, setShowAddCustomerForm] = React.useState(false)
  const [newCustomerForm, setNewCustomerForm] = React.useState({
    name: '',
    phone: '',
    email: '',
    national_id: '',
    passport_number: '',
    passport_romanization: '',
    passport_expiry_date: '',
    date_of_birth: '',
    gender: '',
    notes: '',
  })

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
        received_date: applicant.received_date,
        expected_issue_date: applicant.expected_issue_date,
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

      // 收集所有需要比對的人（聯絡人 + 所有申請人）
      const { useCustomerStore } = await import('@/stores')
      const customers = useCustomerStore.getState().items

      const peopleToCheck: Array<{ name: string; phone: string }> = []
      if (contact_info.contact_person) {
        peopleToCheck.push({
          name: contact_info.contact_person,
          phone: contact_info.contact_phone || '',
        })
      }
      applicants.forEach(a => {
        if (a.name && !peopleToCheck.some(p => p.name === a.name)) {
          peopleToCheck.push({ name: a.name, phone: '' })
        }
      })

      // 為每個人找同名的客戶
      const pendingList = peopleToCheck.map(person => {
        const matched = customers
          .filter(c => c.name === person.name)
          .map(c => ({
            id: c.id,
            name: c.name,
            phone: c.phone,
            date_of_birth: c.date_of_birth || null,
            national_id: c.national_id || null,
          }))

        return {
          name: person.name,
          phone: person.phone,
          matchedCustomers: matched,
        }
      })

      // 重置表單
      const currentYear = new Date().getFullYear()
      const visaCode = `VISA${currentYear}001`
      const defaultVisaTour = tours.find(t => t.code === visaCode)
      resetForm(defaultVisaTour?.id)
      setIsDialogOpen(false)

      // 開啟旅客比對視窗
      if (pendingList.length > 0) {
        setPendingCustomers(pendingList)
        setCurrentCustomerIndex(0)
        setShowCustomerMatchDialog(true)
      }
    } catch (error) {
      logger.error('批次新增簽證失敗', error)
      toast.error('新增簽證失敗，請稍後再試')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 取得當前要比對的人
  const currentPerson = pendingCustomers[currentCustomerIndex]

  // 前往下一位或完成
  const goToNextCustomer = () => {
    if (currentCustomerIndex < pendingCustomers.length - 1) {
      setCurrentCustomerIndex(prev => prev + 1)
    } else {
      // 全部完成
      setShowCustomerMatchDialog(false)
      setShowAddCustomerForm(false)
      setPendingCustomers([])
      setCurrentCustomerIndex(0)
    }
  }

  // 選擇現有客戶（確認是此人）
  const handleSelectExistingCustomer = (customerId: string, customerName: string) => {
    toast.success(`已確認「${customerName}」為現有客戶`)
    goToNextCustomer()
  }

  // 不是現有客戶，開啟新增表單
  const handleAddNewCustomer = () => {
    if (!currentPerson) return

    setNewCustomerForm({
      name: currentPerson.name,
      phone: currentPerson.phone,
      email: '',
      national_id: '',
      passport_number: '',
      passport_romanization: '',
      passport_expiry_date: '',
      date_of_birth: '',
      gender: '',
      notes: '',
    })
    setShowAddCustomerForm(true)
  }

  // 更新新增客戶表單
  const updateNewCustomerForm = (field: string, value: string) => {
    setNewCustomerForm(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  // 儲存新客戶
  const handleSaveNewCustomer = async () => {
    try {
      const { useCustomerStore } = await import('@/stores')
      const addCustomer = useCustomerStore.getState().create

      await addCustomer({
        name: newCustomerForm.name,
        phone: newCustomerForm.phone || null,
        email: newCustomerForm.email || null,
        national_id: newCustomerForm.national_id || null,
        passport_number: newCustomerForm.passport_number || null,
        passport_romanization: newCustomerForm.passport_romanization || null,
        passport_expiry_date: newCustomerForm.passport_expiry_date || null,
        date_of_birth: newCustomerForm.date_of_birth || null,
        gender: newCustomerForm.gender || null,
        notes: newCustomerForm.notes || null,
        source: 'visa',
      } as Parameters<typeof addCustomer>[0])

      toast.success(`已新增「${newCustomerForm.name}」到 CRM`)
      setShowAddCustomerForm(false)
      goToNextCustomer()
    } catch (error) {
      logger.error('新增旅客到 CRM 失敗', error)
      toast.error('新增旅客失敗')
    }
  }

  // 跳過當前旅客
  const handleSkipCustomer = () => {
    setShowAddCustomerForm(false)
    goToNextCustomer()
  }

  // 全部跳過
  const handleSkipAll = () => {
    setShowCustomerMatchDialog(false)
    setShowAddCustomerForm(false)
    setPendingCustomers([])
    setCurrentCustomerIndex(0)
  }

  // 批次送件
  const handleBatchSubmit = async () => {
    if (!canManageVisas || selectedRows.length === 0) return
    const today = new Date().toISOString().split('T')[0]

    for (const id of selectedRows) {
      await updateVisa(id, { status: 'submitted', actual_submission_date: today })
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
                    const today = new Date().toISOString().split('T')[0]
                    selectedRows.forEach(id => updateVisa(id, { status: 'submitted', actual_submission_date: today }))
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

      {/* 旅客比對對話框 */}
      <Dialog open={showCustomerMatchDialog && !showAddCustomerForm} onOpenChange={(open) => !open && handleSkipAll()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-morandi-gold" />
              旅客資料比對
              {pendingCustomers.length > 1 && (
                <span className="text-sm font-normal text-morandi-secondary">
                  ({currentCustomerIndex + 1} / {pendingCustomers.length})
                </span>
              )}
            </DialogTitle>
            <DialogDescription>
              {currentPerson?.matchedCustomers.length > 0
                ? `找到 ${currentPerson.matchedCustomers.length} 位同名「${currentPerson?.name}」的客戶，請確認是否為同一人`
                : `「${currentPerson?.name}」為新客戶，是否要新增到 CRM？`
              }
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {/* 有同名客戶時，列出供選擇 */}
            {currentPerson?.matchedCustomers.length > 0 ? (
              <div className="space-y-3">
                {currentPerson.matchedCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    className="p-4 border border-border rounded-lg hover:border-morandi-gold/50 hover:bg-morandi-container/20 transition-colors cursor-pointer"
                    onClick={() => handleSelectExistingCustomer(customer.id, customer.name)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-morandi-gold/20 flex items-center justify-center text-lg font-medium text-morandi-gold">
                          {customer.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-morandi-primary">{customer.name}</div>
                          <div className="text-sm text-morandi-secondary space-x-3">
                            {customer.phone && <span>📱 {customer.phone}</span>}
                            {customer.date_of_birth && (
                              <span>🎂 {new Date(customer.date_of_birth).toLocaleDateString('zh-TW')}</span>
                            )}
                            {customer.national_id && <span>🪪 {customer.national_id}</span>}
                          </div>
                          {!customer.phone && !customer.date_of_birth && !customer.national_id && (
                            <div className="text-sm text-morandi-secondary/60">尚無詳細資料</div>
                          )}
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="text-morandi-gold border-morandi-gold/50">
                        是此人
                      </Button>
                    </div>
                  </div>
                ))}

                {/* 不是以上任何人，新增為新客戶 */}
                <div
                  className="p-4 border border-dashed border-border rounded-lg hover:border-morandi-green/50 hover:bg-morandi-green/5 transition-colors cursor-pointer"
                  onClick={handleAddNewCustomer}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-morandi-green/20 flex items-center justify-center">
                        <UserPlus className="h-5 w-5 text-morandi-green" />
                      </div>
                      <div>
                        <div className="font-medium text-morandi-primary">都不是，新增為新客戶</div>
                        <div className="text-sm text-morandi-secondary">建立「{currentPerson?.name}」的新資料</div>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="text-morandi-green border-morandi-green/50">
                      新增
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              /* 沒有同名客戶，直接顯示新增選項 */
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-morandi-gold/20 flex items-center justify-center mx-auto mb-4">
                  <UserPlus className="h-8 w-8 text-morandi-gold" />
                </div>
                <div className="text-lg font-medium text-morandi-primary mb-2">
                  {currentPerson?.name}
                </div>
                <div className="text-sm text-morandi-secondary mb-4">
                  此為新客戶，尚無資料
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="ghost"
                onClick={handleSkipAll}
                className="text-morandi-secondary"
              >
                全部跳過
              </Button>
              {pendingCustomers.length > 1 && (
                <Button
                  variant="outline"
                  onClick={handleSkipCustomer}
                >
                  跳過此人
                </Button>
              )}
            </div>
            {currentPerson?.matchedCustomers.length === 0 && (
              <Button
                onClick={handleAddNewCustomer}
                className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
              >
                新增到 CRM
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 新增客戶表單對話框 */}
      <Dialog open={showAddCustomerForm} onOpenChange={(open) => !open && setShowAddCustomerForm(false)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-morandi-gold" />
              新增旅客資料
            </DialogTitle>
            <DialogDescription>
              填寫「{newCustomerForm.name}」的資料（所有欄位皆為選填）
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
            {/* 姓名（已帶入） */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>姓名</Label>
                <Input
                  value={newCustomerForm.name}
                  onChange={(e) => updateNewCustomerForm('name', e.target.value)}
                  className="bg-morandi-container/30"
                />
              </div>
              <div className="space-y-2">
                <Label>電話</Label>
                <Input
                  value={newCustomerForm.phone}
                  onChange={(e) => updateNewCustomerForm('phone', e.target.value)}
                  placeholder="選填"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={newCustomerForm.email}
                  onChange={(e) => updateNewCustomerForm('email', e.target.value)}
                  placeholder="選填"
                />
              </div>
              <div className="space-y-2">
                <Label>身分證字號</Label>
                <Input
                  value={newCustomerForm.national_id}
                  onChange={(e) => updateNewCustomerForm('national_id', e.target.value)}
                  placeholder="選填"
                />
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <p className="text-xs text-morandi-secondary mb-3">護照資訊（選填）</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>護照號碼</Label>
                  <Input
                    value={newCustomerForm.passport_number}
                    onChange={(e) => updateNewCustomerForm('passport_number', e.target.value)}
                    placeholder="選填"
                  />
                </div>
                <div className="space-y-2">
                  <Label>護照拼音</Label>
                  <Input
                    value={newCustomerForm.passport_romanization}
                    onChange={(e) => updateNewCustomerForm('passport_romanization', e.target.value.toUpperCase())}
                    placeholder="WANG/XIAOMING"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label>護照效期</Label>
                  <Input
                    type="date"
                    value={newCustomerForm.passport_expiry_date}
                    onChange={(e) => updateNewCustomerForm('passport_expiry_date', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>出生日期</Label>
                  <Input
                    type="date"
                    value={newCustomerForm.date_of_birth}
                    onChange={(e) => updateNewCustomerForm('date_of_birth', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>性別</Label>
                <select
                  value={newCustomerForm.gender}
                  onChange={(e) => updateNewCustomerForm('gender', e.target.value)}
                  className="w-full h-10 px-3 border border-border rounded-md bg-background text-sm"
                >
                  <option value="">選填</option>
                  <option value="male">男</option>
                  <option value="female">女</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>備註</Label>
                <Input
                  value={newCustomerForm.notes}
                  onChange={(e) => updateNewCustomerForm('notes', e.target.value)}
                  placeholder="選填"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowAddCustomerForm(false)}
            >
              返回
            </Button>
            <Button
              onClick={handleSaveNewCustomer}
              className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
            >
              儲存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
