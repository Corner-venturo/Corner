'use client'

import React, { useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { FileText, Clock, CheckCircle, XCircle, AlertCircle, RotateCcw, Info, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { logger } from '@/lib/utils/logger'
import { toast } from 'sonner'
import { useVisasData } from '../hooks/useVisasData'
import { useVisasFilters } from '../hooks/useVisasFilters'
import { useVisasDialog } from '../hooks/useVisasDialog'
import { useCustomerMatch } from '../hooks/useCustomerMatch'
import { useBatchOperations } from '../hooks/useBatchOperations'
import { useVisaCreate } from '../hooks/useVisaCreate'
import { VisasList } from './VisasList'
import { VisasInfoDialog } from './VisasInfoDialog'
import { AddVisaDialog } from './AddVisaDialog'
import { SubmitVisaDialog } from './SubmitVisaDialog'
import { EditVisaDialog } from './EditVisaDialog'
import { ReturnDocumentsDialog } from './ReturnDocumentsDialog'
import { BatchPickupDialog } from './BatchPickupDialog'
import { CustomerMatchDialog, AddCustomerFormDialog } from './CustomerMatchDialog'
import { BatchPickupDialog as SimpleBatchPickupDialog, BatchRejectDialog } from './BatchOperationDialogs'
import type { Visa } from '@/stores/types'

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
  useEffect(() => {
    const loadData = async () => {
      const { useVisaStore, useOrderStore, useMemberStore, useCustomerStore } = await import('@/stores')
      await Promise.all([
        useVisaStore.getState().fetchAll(),
        fetchTours(),
        useOrderStore.getState().fetchAll(),
        useMemberStore.getState().fetchAll(),
        useCustomerStore.getState().fetchAll(),
      ])
    }
    loadData()
  }, [fetchTours])

  // 篩選管理
  const { activeTab, setActiveTab, selectedRows, setSelectedRows, filteredVisas, buttonAvailability, canSelectVisa } =
    useVisasFilters(visas)

  // 對話框管理
  const {
    isDialogOpen,
    setIsDialogOpen,
    contact_info,
    setContactInfo,
    applicants,
    tourOptions,
    calculateFee,
    addApplicant,
    addApplicantForSame,
    removeApplicant,
    updateApplicant,
    resetForm,
  } = useVisasDialog(tours)

  // 客戶比對
  const customerMatch = useCustomerMatch()

  // 批次操作
  const batchOps = useBatchOperations(visas, selectedRows, updateVisa, () => setSelectedRows([]))

  // 其他對話框狀態
  const [isInfoDialogOpen, setIsInfoDialogOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
  const [editingVisa, setEditingVisa] = React.useState<Visa | null>(null)
  const [isReturnDialogOpen, setIsReturnDialogOpen] = React.useState(false)
  const [isBatchPickupDialogOpen, setIsBatchPickupDialogOpen] = React.useState(false)

  // 權限檢查：清除選擇
  useEffect(() => {
    if (!canManageVisas && selectedRows.length > 0) {
      setSelectedRows([])
    }
  }, [canManageVisas, selectedRows.length, setSelectedRows])

  // 處理批次新增簽證
  const handleAddVisa = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)

    try {
      const hasApplicant = applicants.some(a => a.name)
      if (!canManageVisas || !hasApplicant || !user) return

      let selectedTour

      // 如果沒選團號，使用預設簽證團
      if (!contact_info.tour_id) {
        const currentYear = new Date().getFullYear()
        const defaultTourCode = `VISA-${currentYear}`
        const existingDefaultTour = tours.find(t => t.code === defaultTourCode)

        if (existingDefaultTour) {
          selectedTour = existingDefaultTour
        } else {
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

      if (contact_info.order_id && contact_info.order_id !== '__create_new__') {
        targetOrder = orders.find(o => o.id === contact_info.order_id)
        if (!targetOrder) return
      } else {
        // 查詢該團最大的訂單編號
        const { data: lastOrder } = await supabase
          .from('orders')
          .select('order_number')
          .eq('tour_id', selectedTour.id)
          .order('order_number', { ascending: false })
          .limit(1)
          .single()

        let nextNum = 1
        if (lastOrder?.order_number) {
          const match = lastOrder.order_number.match(/-O(\d+)$/)
          if (match) {
            nextNum = parseInt(match[1], 10) + 1
          }
        }
        const nextNumber = nextNum.toString().padStart(2, '0')
        const order_number = `${selectedTour.code}-O${nextNumber}`

        targetOrder = await addOrder({
          order_number,
          tour_id: selectedTour.id,
          code: order_number,
          tour_name: selectedTour.name,
          contact_person: contact_info.contact_person || applicants.find(a => a.name)?.name || '',
          sales_person: user.display_name || '系統',
          assistant: user.display_name || '系統',
          member_count: applicants.filter(a => a.name).length,
          total_amount: totalFee,
          paid_amount: 0,
          remaining_amount: totalFee,
          payment_status: 'unpaid' as const,
        } as Parameters<typeof addOrder>[0])

        if (contact_info.order_id === '__create_new__') {
          toast.success(`已建立訂單：${order_number}`)
        }
      }

      if (!targetOrder) {
        logger.error('訂單建立失敗')
        return
      }

      // 批次建立簽證
      const applicantMap = new Map<string, {
        visaTypes: string[]
        totalFee: number
        totalCost: number
      }>()

      for (const applicant of applicants) {
        if (!applicant.name) continue
        const fee = applicant.fee ?? calculateFee(applicant.country)

        const existing = applicantMap.get(applicant.name)
        if (existing) {
          existing.visaTypes.push(applicant.country)
          existing.totalFee += fee
          existing.totalCost += applicant.cost
        } else {
          applicantMap.set(applicant.name, {
            visaTypes: [applicant.country],
            totalFee: fee,
            totalCost: applicant.cost,
          })
        }
      }

      // 建立所有簽證
      for (const applicant of applicants) {
        if (!applicant.name) continue

        const fee = applicant.fee ?? calculateFee(applicant.country)

        await addVisa({
          applicant_name: applicant.name,
          contact_person: contact_info.contact_person || '',
          contact_phone: contact_info.contact_phone || '',
          visa_type: applicant.country,
          country: applicant.country,
          received_date: applicant.received_date || undefined,
          expected_issue_date: applicant.expected_issue_date || undefined,
          fee,
          cost: applicant.cost,
          status: 'pending',
          order_id: targetOrder.id,
          order_number: targetOrder.order_number || '',
          tour_id: selectedTour.id,
          code: selectedTour.code,
          created_by: user.id,
          note: '',
        })
      }

      // 建立成員
      for (const [name, data] of applicantMap) {
        const remarks = data.visaTypes.join('、')

        try {
          const { error } = await supabase
            .from('order_members')
            .insert({
              order_id: targetOrder.id,
              chinese_name: name,
              member_type: 'adult',
              remarks,
              workspace_id: user.workspace_id,
            })

          if (error) throw error
          logger.log(`✅ 成員建立成功: ${name}`)
        } catch (memberError) {
          logger.error(`❌ 成員建立失敗: ${name}`, memberError)
        }
      }

      // 收集所有需要比對的人
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

      // 重置表單
      const currentYear = new Date().getFullYear()
      const visaCode = `VISA${currentYear}001`
      const defaultVisaTour = tours.find(t => t.code === visaCode)
      resetForm(defaultVisaTour?.id)
      setIsDialogOpen(false)

      // 開啟旅客比對視窗
      if (peopleToCheck.length > 0) {
        await customerMatch.startCustomerMatch(peopleToCheck)
      }
    } catch (error) {
      logger.error('批次新增簽證失敗', error)
      toast.error('新增簽證失敗，請稍後再試')
    } finally {
      setIsSubmitting(false)
    }
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
            {canManageVisas && selectedRows.length > 0 ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-morandi-secondary bg-morandi-container/50 px-3 py-1.5 rounded-full">
                  已選 <span className="font-semibold text-morandi-primary">{selectedRows.length}</span> 筆
                </span>

                <div className="flex items-center bg-morandi-container/30 rounded-lg p-1 gap-1">
                  <button
                    onClick={() => batchOps.setIsSubmitDialogOpen(true)}
                    disabled={!buttonAvailability.submit}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      buttonAvailability.submit
                        ? 'bg-morandi-gold hover:bg-morandi-gold-hover text-white'
                        : 'bg-morandi-container text-morandi-secondary/50 cursor-not-allowed'
                    }`}
                    title="送件給代辦商"
                  >
                    送件
                  </button>
                  <button
                    onClick={() => {
                      batchOps.setPickupDate(new Date().toISOString().split('T')[0])
                      batchOps.setIsPickupDialogOpen(true)
                    }}
                    disabled={!buttonAvailability.pickup}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      buttonAvailability.pickup
                        ? 'bg-morandi-green hover:bg-morandi-green/90 text-white'
                        : 'bg-morandi-container text-morandi-secondary/50 cursor-not-allowed'
                    }`}
                    title="取件完成"
                  >
                    取件
                  </button>
                  <button
                    onClick={() => setIsReturnDialogOpen(true)}
                    disabled={!buttonAvailability.return}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      buttonAvailability.return
                        ? 'bg-morandi-primary hover:bg-morandi-primary/90 text-white'
                        : 'bg-morandi-container text-morandi-secondary/50 cursor-not-allowed'
                    }`}
                    title="登記證件歸還"
                  >
                    歸還
                  </button>
                  <button
                    onClick={() => {
                      batchOps.setRejectDate(new Date().toISOString().split('T')[0])
                      batchOps.setIsRejectDialogOpen(true)
                    }}
                    disabled={!buttonAvailability.reject}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      buttonAvailability.reject
                        ? 'bg-morandi-red hover:bg-morandi-red/90 text-white'
                        : 'bg-morandi-container text-morandi-secondary/50 cursor-not-allowed'
                    }`}
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
          { value: 'collected', label: '已取件', icon: CheckCircle },
          { value: 'rejected', label: '退件', icon: XCircle },
          { value: 'returned', label: '已歸還', icon: RotateCcw },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="flex-1 overflow-auto">
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
          resetForm()
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
        canSubmit={applicants.some(a => a.name)}
        isSubmitting={isSubmitting}
      />

      {/* 旅客比對對話框 */}
      <CustomerMatchDialog
        open={customerMatch.showCustomerMatchDialog && !customerMatch.showAddCustomerForm}
        currentPerson={customerMatch.currentPerson}
        currentIndex={0}
        totalCount={1}
        onSelectExisting={customerMatch.handleSelectExistingCustomer}
        onAddNew={customerMatch.handleAddNewCustomer}
        onSkipAll={customerMatch.handleSkipAll}
      />

      {/* 新增客戶表單對話框 */}
      <AddCustomerFormDialog
        open={customerMatch.showAddCustomerForm}
        customerName={customerMatch.newCustomerForm.name}
        formData={customerMatch.newCustomerForm}
        isUploading={customerMatch.isUploadingPassport}
        fileInputRef={customerMatch.passportFileInputRef}
        onUpdateField={customerMatch.updateNewCustomerForm}
        onUploadImage={customerMatch.handlePassportImageUpload}
        onSave={customerMatch.handleSaveNewCustomer}
        onBack={() => customerMatch.setShowAddCustomerForm(false)}
      />

      {/* 送件對話框 */}
      <SubmitVisaDialog
        open={batchOps.isSubmitDialogOpen}
        onClose={() => batchOps.setIsSubmitDialogOpen(false)}
        selectedVisas={batchOps.selectedVisas}
        onSubmitComplete={() => {
          setSelectedRows([])
          toast.success(`已送出 ${selectedRows.length} 筆簽證`)
        }}
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
        selectedVisas={batchOps.selectedVisas}
        onComplete={() => {
          setSelectedRows([])
          toast.success('已登記證件歸還')
        }}
      />

      {/* 取件對話框 */}
      <SimpleBatchPickupDialog
        open={batchOps.isPickupDialogOpen}
        selectedCount={selectedRows.length}
        pickupDate={batchOps.pickupDate}
        onPickupDateChange={batchOps.setPickupDate}
        onConfirm={batchOps.handleBatchPickup}
        onCancel={() => batchOps.setIsPickupDialogOpen(false)}
      />

      {/* 退件對話框 */}
      <BatchRejectDialog
        open={batchOps.isRejectDialogOpen}
        selectedCount={selectedRows.length}
        rejectDate={batchOps.rejectDate}
        onRejectDateChange={batchOps.setRejectDate}
        onConfirm={batchOps.handleBatchReject}
        onCancel={() => batchOps.setIsRejectDialogOpen(false)}
      />

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
