'use client'

import React, { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { FileText, Clock, CheckCircle, XCircle, AlertCircle, FileCheck, Info, UserPlus, Upload, Loader2, X } from 'lucide-react'
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
import { SubmitVisaDialog } from './SubmitVisaDialog'
import { EditVisaDialog } from './EditVisaDialog'
import { ReturnDocumentsDialog } from './ReturnDocumentsDialog'
import { BatchPickupDialog } from './BatchPickupDialog'
import type { Visa } from '@/stores/types'
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
    addApplicantForSame,
    removeApplicant,
    updateApplicant,
    resetForm,
  } = useVisasDialog(tours)

  const [isInfoDialogOpen, setIsInfoDialogOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = React.useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
  const [editingVisa, setEditingVisa] = React.useState<Visa | null>(null)
  const [isReturnDialogOpen, setIsReturnDialogOpen] = React.useState(false)
  const [isPickupDialogOpen, setIsPickupDialogOpen] = React.useState(false)
  const [isRejectDialogOpen, setIsRejectDialogOpen] = React.useState(false)
  const [isBatchPickupDialogOpen, setIsBatchPickupDialogOpen] = React.useState(false)
  const [pickupDate, setPickupDate] = React.useState(new Date().toISOString().split('T')[0])
  const [rejectDate, setRejectDate] = React.useState(new Date().toISOString().split('T')[0])

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
    passport_image_url: '',
  })
  const [isUploadingPassport, setIsUploadingPassport] = React.useState(false)
  const passportFileInputRef = useRef<HTMLInputElement>(null)

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
      // 查詢該團最大的訂單編號（避免刪除後編號重複）
      const { supabase } = await import('@/lib/supabase/client')
      const { data: lastOrder } = await supabase
        .from('orders')
        .select('order_number')
        .eq('tour_id', selectedTour.id)
        .order('order_number', { ascending: false })
        .limit(1)
        .single()

      let nextNum = 1
      if (lastOrder?.order_number) {
        // 從最後一個訂單編號提取數字部分
        const match = lastOrder.order_number.match(/-(\d+)$/)
        if (match) {
          nextNum = parseInt(match[1], 10) + 1
        }
      }
      const nextNumber = nextNum.toString().padStart(3, '0')
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

    // 批次建立簽證和對應的訂單成員（使用 for...of 確保順序執行）
    // 先將申請人按名字分組，收集每人的所有簽證類型
    const applicantMap = new Map<string, {
      visaTypes: string[]
      totalFee: number
      totalCost: number
    }>()

    for (const applicant of applicants) {
      if (!applicant.name) continue
      const fee = applicant.fee ?? calculateFee(applicant.country)
      const cost = applicant.is_urgent ? applicant.cost + 900 : applicant.cost

      const existing = applicantMap.get(applicant.name)
      if (existing) {
        existing.visaTypes.push(applicant.country)
        existing.totalFee += fee
        existing.totalCost += cost
      } else {
        applicantMap.set(applicant.name, {
          visaTypes: [applicant.country],
          totalFee: fee,
          totalCost: cost,
        })
      }
    }

    // 1. 建立所有簽證（每筆簽證一條記錄）
    for (const applicant of applicants) {
      if (!applicant.name) continue

      const fee = applicant.fee ?? calculateFee(applicant.country)
      const total_cost = applicant.is_urgent ? applicant.cost + 900 : applicant.cost

      await addVisa({
        applicant_name: applicant.name,
        contact_person: contact_info.contact_person || '',
        contact_phone: contact_info.contact_phone || '',
        visa_type: applicant.country,
        country: applicant.country,
        received_date: applicant.received_date || null,  // 空字串轉 null
        expected_issue_date: applicant.expected_issue_date || null,  // 空字串轉 null
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

    // 2. 建立成員（按名字去重，每人只建立一筆，備註記錄所有簽證類型）
    // 注意：要寫入 order_members 表（OrderMembersExpandable 讀取的表）
    for (const [name, data] of applicantMap) {
      const remarks = data.visaTypes.join('、')

      try {
        const { error } = await supabase
          .from('order_members')
          .insert({
            order_id: targetOrder.id,
            chinese_name: name,  // order_members 表用 chinese_name 欄位
            member_type: 'adult',
            remarks,  // 簽證類型記錄在備註
            workspace_id: user.workspace_id,
          })

        if (error) throw error
        logger.log(`✅ 成員建立成功: ${name}`)
      } catch (memberError) {
        logger.error(`❌ 成員建立失敗: ${name}`, memberError)
      }
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

  // 上傳護照圖片
  const handlePassportImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('請選擇圖片檔案')
      return
    }

    setIsUploadingPassport(true)
    try {
      const { supabase } = await import('@/lib/supabase/client')
      const fileExt = file.name.split('.').pop()
      const fileName = `passport_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`
      const filePath = `passport-images/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('workspace-files')
        .upload(filePath, file)

      if (uploadError) {
        logger.error('上傳護照圖片失敗:', uploadError)
        toast.error('上傳失敗')
        return
      }

      const { data: urlData } = supabase.storage
        .from('workspace-files')
        .getPublicUrl(filePath)

      updateNewCustomerForm('passport_image_url', urlData.publicUrl)
      toast.success('護照圖片上傳成功')
    } catch (error) {
      logger.error('上傳護照圖片錯誤:', error)
      toast.error('上傳過程發生錯誤')
    } finally {
      setIsUploadingPassport(false)
    }
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
        passport_image_url: newCustomerForm.passport_image_url || null,
        date_of_birth: newCustomerForm.date_of_birth || null,
        gender: newCustomerForm.gender || null,
        notes: newCustomerForm.notes || null,
        source: 'other',  // 簽證來源，'visa' 不在 check constraint 允許的值中
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

  // 取得選中的簽證資料
  const selectedVisas = React.useMemo(() => {
    return visas.filter(v => selectedRows.includes(v.id))
  }, [visas, selectedRows])

  // 送件完成後的處理
  const handleSubmitComplete = () => {
    setSelectedRows([])
    toast.success(`已送出 ${selectedRows.length} 筆簽證`)
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
              <div className="flex items-center gap-2">
                <span className="text-sm text-morandi-secondary bg-morandi-container/50 px-3 py-1.5 rounded-full">
                  已選 <span className="font-semibold text-morandi-primary">{selectedRows.length}</span> 筆
                </span>

                <div className="flex items-center bg-morandi-container/30 rounded-lg p-1 gap-1">
                  <button
                    onClick={() => setIsSubmitDialogOpen(true)}
                    className="px-3 py-1.5 text-sm font-medium rounded-md bg-morandi-gold hover:bg-morandi-gold-hover text-white transition-colors"
                    title="送件給代辦商"
                  >
                    送件
                  </button>
                  <button
                    onClick={() => setIsReturnDialogOpen(true)}
                    className="px-3 py-1.5 text-sm font-medium rounded-md bg-morandi-primary hover:bg-morandi-primary/90 text-white transition-colors"
                    title="登記證件歸還"
                  >
                    歸還
                  </button>
                  <button
                    onClick={() => {
                      setPickupDate(new Date().toISOString().split('T')[0])
                      setIsPickupDialogOpen(true)
                    }}
                    className="px-3 py-1.5 text-sm font-medium rounded-md bg-morandi-green hover:bg-morandi-green/90 text-white transition-colors"
                    title="取件完成"
                  >
                    取件
                  </button>
                  <button
                    onClick={() => {
                      setRejectDate(new Date().toISOString().split('T')[0])
                      setIsRejectDialogOpen(true)
                    }}
                    className="px-3 py-1.5 text-sm font-medium rounded-md bg-morandi-red hover:bg-morandi-red/90 text-white transition-colors"
                    title="標記為退件"
                  >
                    退件
                  </button>
                </div>

                <button
                  onClick={() => setSelectedRows([])}
                  className="text-sm text-morandi-secondary hover:text-morandi-primary transition-colors"
                >
                  取消
                </button>
              </div>
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
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setIsBatchPickupDialogOpen(true)}
                      className="flex items-center gap-2"
                    >
                      <Upload size={16} />
                      批次下件
                    </Button>
                    <Button
                      onClick={() => setIsDialogOpen(true)}
                      className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
                    >
                      新增簽證
                    </Button>
                  </>
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
          onEdit={(visa) => {
            setEditingVisa(visa)
            setIsEditDialogOpen(true)
          }}
        />
      </div>

      {/* 簽證資訊對話框 */}
      <VisasInfoDialog open={isInfoDialogOpen} onClose={() => setIsInfoDialogOpen(false)} />

      {/* 新增簽證對話框 */}
      <AddVisaDialog
        open={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false)
          resetForm()  // 關閉時重置表單
        }}
        onSubmit={handleAddVisa}
        contact_info={contact_info}
        setContactInfo={setContactInfo}
        applicants={applicants}
        tourOptions={tourOptions}
        calculateFee={calculateFee}
        addApplicant={addApplicant}
        addApplicantForSame={addApplicantForSame}
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
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-morandi-gold" />
              新增旅客資料
            </DialogTitle>
            <DialogDescription>
              填寫「{newCustomerForm.name}」的資料（所有欄位皆為選填）
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 grid grid-cols-2 gap-6 max-h-[65vh] overflow-y-auto">
            {/* 左側：表單欄位 */}
            <div className="space-y-4">
              {/* 基本資料 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">姓名</Label>
                  <Input
                    value={newCustomerForm.name}
                    onChange={(e) => updateNewCustomerForm('name', e.target.value)}
                    className="bg-morandi-container/30 h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">電話</Label>
                  <Input
                    value={newCustomerForm.phone}
                    onChange={(e) => updateNewCustomerForm('phone', e.target.value)}
                    placeholder="選填"
                    className="h-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Email</Label>
                  <Input
                    type="email"
                    value={newCustomerForm.email}
                    onChange={(e) => updateNewCustomerForm('email', e.target.value)}
                    placeholder="選填"
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">身分證字號</Label>
                  <Input
                    value={newCustomerForm.national_id}
                    onChange={(e) => updateNewCustomerForm('national_id', e.target.value)}
                    placeholder="選填"
                    className="h-9"
                  />
                </div>
              </div>

              {/* 護照資訊 */}
              <div className="border-t border-border pt-3">
                <p className="text-xs text-morandi-secondary mb-2">護照資訊</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">護照號碼</Label>
                    <Input
                      value={newCustomerForm.passport_number}
                      onChange={(e) => updateNewCustomerForm('passport_number', e.target.value)}
                      placeholder="選填"
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">護照拼音</Label>
                    <Input
                      value={newCustomerForm.passport_romanization}
                      onChange={(e) => updateNewCustomerForm('passport_romanization', e.target.value.toUpperCase())}
                      placeholder="WANG/XIAOMING"
                      className="h-9"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">護照效期</Label>
                    <Input
                      type="date"
                      value={newCustomerForm.passport_expiry_date}
                      onChange={(e) => updateNewCustomerForm('passport_expiry_date', e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">出生日期</Label>
                    <Input
                      type="date"
                      value={newCustomerForm.date_of_birth}
                      onChange={(e) => updateNewCustomerForm('date_of_birth', e.target.value)}
                      className="h-9"
                    />
                  </div>
                </div>
              </div>

              {/* 其他資料 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">性別</Label>
                  <select
                    value={newCustomerForm.gender}
                    onChange={(e) => updateNewCustomerForm('gender', e.target.value)}
                    className="w-full h-9 px-3 border border-border rounded-md bg-background text-sm"
                  >
                    <option value="">選填</option>
                    <option value="male">男</option>
                    <option value="female">女</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">備註</Label>
                  <Input
                    value={newCustomerForm.notes}
                    onChange={(e) => updateNewCustomerForm('notes', e.target.value)}
                    placeholder="選填"
                    className="h-9"
                  />
                </div>
              </div>
            </div>

            {/* 右側：護照圖片上傳 */}
            <div className="space-y-3">
              <Label className="text-xs">護照掃描檔</Label>
              <div
                className={`relative border-2 border-dashed rounded-lg transition-colors ${
                  newCustomerForm.passport_image_url
                    ? 'border-morandi-gold/50 bg-morandi-gold/5'
                    : 'border-border hover:border-morandi-gold/50 hover:bg-morandi-container/20'
                }`}
                style={{ minHeight: '280px' }}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  const file = e.dataTransfer.files?.[0]
                  if (file && file.type.startsWith('image/')) {
                    handlePassportImageUpload(file)
                  }
                }}
              >
                {newCustomerForm.passport_image_url ? (
                  <>
                    <img
                      src={newCustomerForm.passport_image_url}
                      alt="護照掃描檔"
                      className="w-full h-full object-contain rounded-lg"
                      style={{ maxHeight: '280px' }}
                    />
                    <button
                      type="button"
                      onClick={() => updateNewCustomerForm('passport_image_url', '')}
                      className="absolute top-2 right-2 w-7 h-7 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
                      title="移除圖片"
                    >
                      <X size={14} />
                    </button>
                  </>
                ) : (
                  <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer">
                    {isUploadingPassport ? (
                      <Loader2 size={32} className="text-morandi-gold animate-spin" />
                    ) : (
                      <>
                        <Upload size={32} className="text-morandi-secondary/50 mb-2" />
                        <span className="text-sm text-morandi-secondary">點擊或拖曳上傳護照掃描檔</span>
                        <span className="text-xs text-morandi-secondary/60 mt-1">支援 JPG、PNG 格式</span>
                      </>
                    )}
                    <input
                      ref={passportFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          handlePassportImageUpload(file)
                        }
                        e.target.value = ''
                      }}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <p className="text-xs text-morandi-secondary/60">
                上傳護照掃描檔後，未來可直接調用，不需重新掃描
              </p>
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

      {/* 送件對話框 */}
      <SubmitVisaDialog
        open={isSubmitDialogOpen}
        onClose={() => setIsSubmitDialogOpen(false)}
        selectedVisas={selectedVisas}
        onSubmitComplete={handleSubmitComplete}
      />

      {/* 編輯對話框 */}
      <EditVisaDialog
        open={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false)
          setEditingVisa(null)
        }}
        visa={editingVisa}
      />

      {/* 證件歸還對話框 */}
      <ReturnDocumentsDialog
        open={isReturnDialogOpen}
        onClose={() => setIsReturnDialogOpen(false)}
        selectedVisas={selectedVisas}
        onComplete={() => {
          setSelectedRows([])
          toast.success('已登記證件歸還')
        }}
      />

      {/* 取件對話框 */}
      <Dialog open={isPickupDialogOpen} onOpenChange={setIsPickupDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>批次取件</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-morandi-secondary">
              已選擇 <span className="font-semibold text-morandi-primary">{selectedRows.length}</span> 筆簽證
            </p>
            <div>
              <label className="text-sm font-medium text-morandi-primary">取件日期</label>
              <Input
                type="date"
                value={pickupDate}
                onChange={e => setPickupDate(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsPickupDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={() => {
                selectedRows.forEach(id => {
                  const visa = visas.find(v => v.id === id)
                  const updates: Record<string, unknown> = {
                    status: 'collected',
                    pickup_date: pickupDate,
                  }
                  if (!visa?.documents_returned_date) {
                    updates.documents_returned_date = pickupDate
                  }
                  updateVisa(id, updates)
                })
                setSelectedRows([])
                setIsPickupDialogOpen(false)
                toast.success('已取件')
              }}
              className="bg-morandi-green hover:bg-morandi-green/90"
            >
              確認取件
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 退件對話框 */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>批次退件</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-morandi-secondary">
              已選擇 <span className="font-semibold text-morandi-primary">{selectedRows.length}</span> 筆簽證
            </p>
            <div>
              <label className="text-sm font-medium text-morandi-primary">退件日期</label>
              <Input
                type="date"
                value={rejectDate}
                onChange={e => setRejectDate(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={() => {
                selectedRows.forEach(id => {
                  updateVisa(id, {
                    status: 'rejected',
                    documents_returned_date: rejectDate,
                  })
                })
                setSelectedRows([])
                setIsRejectDialogOpen(false)
                toast.success('已標記退件')
              }}
              className="bg-morandi-red hover:bg-morandi-red/90"
            >
              確認退件
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 批次下件對話框 */}
      <BatchPickupDialog
        open={isBatchPickupDialogOpen}
        onClose={() => setIsBatchPickupDialogOpen(false)}
        pendingVisas={visas.filter(v => v.status === 'submitted')}
        onComplete={(updatedVisaIds) => {
          toast.success(`已完成 ${updatedVisaIds.length} 筆下件`)
        }}
        updateVisa={updateVisa}
      />
    </div>
  )
}
