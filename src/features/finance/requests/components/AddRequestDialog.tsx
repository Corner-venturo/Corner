import { useEffect, useState, useMemo } from 'react'
import { Plus, X, FileInput, Building2, Briefcase, Users, Layers, AlertCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Combobox } from '@/components/ui/combobox'
import { Checkbox } from '@/components/ui/checkbox'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RequestDateInput } from './RequestDateInput'
import { ExpenseTypeSelector } from './ExpenseTypeSelector'
import { CurrencyCell } from '@/components/table-cells'
import { EditableRequestItemList } from './RequestItemList'
import { useRequestForm } from '../hooks/useRequestForm'
import { useRequestOperations } from '../hooks/useRequestOperations'
import { useTourRequestItems } from '../hooks/useTourRequestItems'
import { usePayments } from '@/features/payments/hooks/usePayments'
import { RequestItem, categoryOptions } from '../types'
import { PaymentItemCategory, CompanyExpenseType } from '@/stores/types'
import { logger } from '@/lib/utils/logger'
import { cn } from '@/lib/utils'
import { alert } from '@/lib/ui/alert-dialog'
import { formatDate } from '@/lib/utils/format-date'
import { useWorkspaceId } from '@/lib/workspace-context'
import type { UserRole } from '@/lib/rbac-config'

/**
 * 可以建立公司請款的角色
 */
const COMPANY_PAYMENT_ROLES: UserRole[] = ['super_admin', 'admin', 'accountant']

interface AddRequestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  /** 預設團 ID（從快速請款按鈕傳入） */
  defaultTourId?: string
  /** 預設訂單 ID（從快速請款按鈕傳入） */
  defaultOrderId?: string
  /** 是否為巢狀 Dialog */
  nested?: boolean
}

// 類別對應的圖標和顏色
const CATEGORY_CONFIG: Record<string, { icon: string; color: string }> = {
  '住宿': { icon: '🏨', color: 'text-blue-600' },
  'accommodation': { icon: '🏨', color: 'text-blue-600' },
  '交通': { icon: '🚌', color: 'text-green-600' },
  'transportation': { icon: '🚌', color: 'text-green-600' },
  '門票': { icon: '🎫', color: 'text-purple-600' },
  'ticket': { icon: '🎫', color: 'text-purple-600' },
  'activity': { icon: '🎫', color: 'text-purple-600' },
  '餐食': { icon: '🍽️', color: 'text-orange-600' },
  'meal': { icon: '🍽️', color: 'text-orange-600' },
  '其他': { icon: '📦', color: 'text-morandi-secondary' },
}

function getCategoryConfig(category: string) {
  return CATEGORY_CONFIG[category] || CATEGORY_CONFIG['其他']
}

// 批量請款的團分配類型
interface TourAllocation {
  tour_id: string
  tour_code: string
  tour_name: string
  allocated_amount: number
}

type RequestMode = 'tour' | 'batch' | 'company'

// 計算下一個週四（如果今天是週四，跳到下週四）
function getNextThursdayDate(): string {
  const today = new Date()
  const dayOfWeek = today.getDay() // 0=週日, 1=週一, ..., 4=週四

  let daysUntilThursday = 4 - dayOfWeek
  if (daysUntilThursday <= 0) {
    // 今天是週四或之後，跳到下週四
    daysUntilThursday += 7
  }

  const nextThursday = new Date(today)
  nextThursday.setDate(today.getDate() + daysUntilThursday)

  return formatDate(nextThursday)
}

export function AddRequestDialog({ open, onOpenChange, onSuccess, defaultTourId, defaultOrderId, nested = false }: AddRequestDialogProps) {
  // === 共用 Hooks ===
  const {
    formData,
    setFormData,
    requestItems,
    filteredOrders,
    total_amount,
    addNewEmptyItem,
    updateItem,
    removeItem,
    resetForm,
    suppliers,
    tours,
    orders,
    currentUser,
  } = useRequestForm()

  const { generateRequestCode, generateCompanyRequestCode, createRequest } = useRequestOperations()
  const { payment_requests, createPaymentRequest, addPaymentItem } = usePayments()
  const workspaceId = useWorkspaceId()

  // === 共用狀態 ===
  const [activeTab, setActiveTab] = useState<RequestMode>('tour')

  // 檢查用戶是否有公司請款權限
  const canCreateCompanyPayment = useMemo(() => {
    if (!currentUser?.roles) return false
    return currentUser.roles.some(role => COMPANY_PAYMENT_ROLES.includes(role as UserRole))
  }, [currentUser?.roles])

  // === 團體請款狀態 ===
  const [importFromRequests, setImportFromRequests] = useState(false)
  const [selectedRequestItems, setSelectedRequestItems] = useState<Record<string, { selected: boolean; amount: number }>>({})

  const { items: tourRequestItems, loading: loadingRequestItems } = useTourRequestItems(
    importFromRequests && formData.tour_id ? formData.tour_id : null
  )

  // === 批量請款狀態 ===
  const [batchDate, setBatchDate] = useState(getNextThursdayDate())
  const [batchCategory, setBatchCategory] = useState<PaymentItemCategory>('匯款')
  const [batchSupplierId, setBatchSupplierId] = useState('')
  const [batchDescription, setBatchDescription] = useState('')
  const [batchTotalAmount, setBatchTotalAmount] = useState(0)
  const [batchNote, setBatchNote] = useState('')
  const [tourAllocations, setTourAllocations] = useState<TourAllocation[]>([])

  // === 計算值 ===

  // 團體請款：需求單項目相關
  useEffect(() => {
    if (tourRequestItems.length > 0) {
      const initialState: Record<string, { selected: boolean; amount: number }> = {}
      tourRequestItems.forEach(item => {
        initialState[item.id] = {
          selected: false,
          amount: item.finalCost || item.estimatedCost || 0,
        }
      })
      setSelectedRequestItems(initialState)
    }
  }, [tourRequestItems])

  const toggleRequestItem = (itemId: string) => {
    setSelectedRequestItems(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], selected: !prev[itemId]?.selected },
    }))
  }

  const updateRequestItemAmount = (itemId: string, amount: number) => {
    setSelectedRequestItems(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], amount },
    }))
  }

  const selectedRequestTotal = useMemo(() => {
    return Object.entries(selectedRequestItems)
      .filter(([, val]) => val.selected)
      .reduce((sum, [, val]) => sum + val.amount, 0)
  }, [selectedRequestItems])

  const selectedRequestCount = useMemo(() => {
    return Object.values(selectedRequestItems).filter(val => val.selected).length
  }, [selectedRequestItems])

  // 過濾掉已封存和特殊團
  const activeTours = useMemo(() => {
    return tours.filter(tour => !tour.archived && tour.status !== '特殊團')
  }, [tours])

  // 批量請款：計算值
  const availableTours = useMemo(() => {
    // 只排除已選擇的旅遊團（非空的 tour_id）
    const selectedIds = new Set(tourAllocations.filter(a => a.tour_id).map(a => a.tour_id))
    return activeTours
      .filter(tour => !selectedIds.has(tour.id))
      .slice(0, 50)
  }, [activeTours, tourAllocations])

  const totalAllocatedAmount = useMemo(() => {
    return tourAllocations.reduce((sum, allocation) => sum + allocation.allocated_amount, 0)
  }, [tourAllocations])

  const unallocatedAmount = batchTotalAmount - totalAllocatedAmount

  const batchSupplierName = useMemo(() => {
    const supplier = suppliers.find(s => s.id === batchSupplierId)
    return supplier?.name || ''
  }, [suppliers, batchSupplierId])

  // 批量請款：操作
  const addTourAllocation = () => {
    // 新增空白行，讓用戶自己選擇旅遊團
    setTourAllocations(prev => [...prev, {
      tour_id: '',
      tour_code: '',
      tour_name: '',
      allocated_amount: 0,
    }])
  }

  const removeTourAllocation = (index: number) => {
    setTourAllocations(prev => prev.filter((_, i) => i !== index))
  }

  const updateTourAllocation = (index: number, updates: Partial<TourAllocation>) => {
    setTourAllocations(prev => prev.map((allocation, i) => (i === index ? { ...allocation, ...updates } : allocation)))
  }

  const selectTour = (index: number, tourId: string) => {
    const tour = tours.find(t => t.id === tourId)
    if (!tour) return
    updateTourAllocation(index, {
      tour_id: tour.id,
      tour_code: tour.code || '',
      tour_name: tour.name || '',
    })
  }

  const distributeEvenly = () => {
    if (tourAllocations.length === 0 || batchTotalAmount <= 0) return
    const amountPerTour = Math.floor(batchTotalAmount / tourAllocations.length)
    const remainder = batchTotalAmount - amountPerTour * tourAllocations.length
    setTourAllocations(prev => prev.map((allocation, index) => ({
      ...allocation,
      allocated_amount: amountPerTour + (index === 0 ? remainder : 0),
    })))
  }

  // 生成批量請款編號
  const generateBatchRequestCode = (tourCode: string) => {
    const existingCount = payment_requests.filter(r =>
      r.tour_code === tourCode || r.code?.startsWith(`${tourCode}-I`)
    ).length
    const nextNumber = existingCount + 1
    return `${tourCode}-I${nextNumber.toString().padStart(2, '0')}`
  }

  // === 初始化 ===
  useEffect(() => {
    if (!open) return

    setImportFromRequests(false)
    setSelectedRequestItems({})

    // 重置批量請款（預設兩個空白行）
    setBatchDate(getNextThursdayDate())
    setBatchCategory('匯款')
    setBatchSupplierId('')
    setBatchDescription('')
    setBatchTotalAmount(0)
    setBatchNote('')
    setTourAllocations([
      { tour_id: '', tour_code: '', tour_name: '', allocated_amount: 0 },
      { tour_id: '', tour_code: '', tour_name: '', allocated_amount: 0 },
    ])

    const initialize = async () => {
      const { invalidateTours, invalidateOrders } = await import('@/data')
      await Promise.all([invalidateTours(), invalidateOrders()])

      if (defaultTourId) {
        setActiveTab('tour')
        setFormData(prev => ({
          ...prev,
          request_category: 'tour',
          tour_id: defaultTourId,
          order_id: defaultOrderId || '',
        }))
      } else {
        resetForm()
      }
    }

    initialize()
  }, [open, defaultTourId, defaultOrderId, resetForm, setFormData])

  // 自動帶入訂單
  useEffect(() => {
    if (formData.tour_id && filteredOrders.length === 1 && !formData.order_id) {
      const order = filteredOrders[0]
      setFormData(prev => ({ ...prev, order_id: order.id }))
    }
  }, [formData.tour_id, filteredOrders, formData.order_id, setFormData])

  // === 預覽編號 ===
  const selectedTour = tours.find(t => t.id === formData.tour_id)

  const previewCode = useMemo(() => {
    if (activeTab === 'company') {
      if (!formData.expense_type || !formData.request_date) return '請選擇費用類型和日期'
      return generateCompanyRequestCode(formData.expense_type as CompanyExpenseType, formData.request_date)
    } else if (activeTab === 'batch') {
      return tourAllocations.length > 0 ? `將建立 ${tourAllocations.length} 筆請款單` : '請新增旅遊團分配'
    } else {
      return selectedTour ? generateRequestCode(selectedTour.code) : '請先選擇旅遊團'
    }
  }, [activeTab, formData.expense_type, formData.request_date, selectedTour, tourAllocations.length, generateRequestCode, generateCompanyRequestCode])

  // === 選項 ===
  const tourOptions = activeTours.map(tour => ({
    value: tour.id,
    label: `${tour.code || ''} - ${tour.name || ''}`,
  }))

  const orderOptions = filteredOrders.map(order => ({
    value: order.id,
    label: `${order.order_number} - ${order.contact_person || '無聯絡人'}`,
  }))

  // === 操作 ===
  const handleCancel = () => {
    resetForm()
    setImportFromRequests(false)
    setSelectedRequestItems({})
    setBatchDate(getNextThursdayDate())
    setBatchCategory('匯款')
    setBatchSupplierId('')
    setBatchDescription('')
    setBatchTotalAmount(0)
    setBatchNote('')
    setTourAllocations([
      { tour_id: '', tour_code: '', tour_name: '', allocated_amount: 0 },
      { tour_id: '', tour_code: '', tour_name: '', allocated_amount: 0 },
    ])
    onOpenChange(false)
  }

  const handleSubmit = async () => {
    try {
      // 檢查 workspace_id
      if (!workspaceId) {
        void alert('無法取得工作空間，請重新登入', 'warning')
        return
      }

      if (activeTab === 'batch') {
        // 批量請款 - 過濾掉未選擇旅遊團的行
        const toSubmit = tourAllocations.filter(a => a.tour_id && a.allocated_amount > 0)

        if (toSubmit.length === 0) {
          void alert('請至少選擇一個旅遊團並輸入金額', 'warning')
          return
        }
        if (batchTotalAmount === 0) {
          void alert('請款金額不能為 0', 'warning')
          return
        }
        if (unallocatedAmount !== 0) {
          void alert(`還有 NT$ ${Math.abs(unallocatedAmount).toLocaleString()} ${unallocatedAmount > 0 ? '未分配' : '超出'}，請確認分配金額`, 'warning')
          return
        }

        // 生成批次 ID，讓所有同批建立的請款單可以關聯在一起
        const batchId = crypto.randomUUID()

        let successCount = 0
        let errorCount = 0

        for (const allocation of toSubmit) {
          try {
            const requestCode = generateBatchRequestCode(allocation.tour_code)
            const request = await createPaymentRequest({
              workspace_id: workspaceId,
              tour_id: allocation.tour_id,
              code: requestCode,
              tour_code: allocation.tour_code,
              tour_name: allocation.tour_name,
              request_date: batchDate,
              amount: 0,
              status: 'pending',
              note: batchNote,
              request_type: '供應商支出',
              request_category: 'tour',
              batch_id: batchId, // 批次 ID：同批請款單共用此 ID
            })

            // 建立品項（帶獨立編號如 HND260328A-I01-1）
            await addPaymentItem(request.id, {
              category: batchCategory,
              supplier_id: batchSupplierId || '',
              supplier_name: batchSupplierName || null,
              description: batchDescription || batchCategory,
              unit_price: allocation.allocated_amount,
              quantity: 1,
              note: '',
              sort_order: 1,
            })
            successCount++
          } catch (itemError) {
            logger.error(`建立請款單品項失敗 (${allocation.tour_code}):`, itemError)
            errorCount++
          }
        }

        if (errorCount > 0) {
          await alert(`建立完成：成功 ${successCount} 筆，失敗 ${errorCount} 筆。請檢查失敗的請款單品項。`, 'warning')
        } else {
          await alert(`成功建立 ${successCount} 筆請款單（批次 ID: ${batchId.slice(0, 8)}...）`, 'success')
        }
        handleCancel()
        onSuccess?.()
      } else if (activeTab === 'company') {
        // 公司請款
        if (!formData.expense_type) {
          logger.error('公司請款必須選擇費用類型')
          return
        }
        await createRequest(formData, requestItems, '', '', undefined, currentUser?.display_name || currentUser?.chinese_name || '')
        handleCancel()
        onSuccess?.()
      } else {
        // 團體請款
        const selectedTour = tours.find(t => t.id === formData.tour_id)
        const selectedOrder = orders.find(o => o.id === formData.order_id)

        if (!selectedTour) {
          logger.error('找不到選擇的旅遊團:', formData.tour_id)
          return
        }

        let itemsToSubmit = requestItems
        if (importFromRequests && selectedRequestCount > 0) {
          itemsToSubmit = tourRequestItems
            .filter(item => selectedRequestItems[item.id]?.selected)
            .map(item => ({
              id: Math.random().toString(36).substr(2, 9),
              category: item.category as PaymentItemCategory,
              supplier_id: item.supplierId,
              supplierName: item.supplierName,
              description: item.title,
              unit_price: selectedRequestItems[item.id]?.amount || 0,
              quantity: 1,
            }))
        }

        await createRequest(
          formData,
          itemsToSubmit,
          selectedTour.name || '',
          selectedTour.code || '',
          selectedOrder?.order_number ?? undefined,
          currentUser?.display_name || currentUser?.chinese_name || ''
        )
        handleCancel()
        onSuccess?.()
      }
    } catch (error) {
      logger.error('新增請款單失敗:', error)
    }
  }

  // === 渲染 ===
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] flex flex-col overflow-hidden" nested={nested}>
        <DialogHeader>
          <DialogTitle>新增請款單</DialogTitle>
          <p className="text-sm text-morandi-secondary">
            {activeTab === 'batch' ? previewCode : <>請款單號: <span className="font-medium text-morandi-primary">{previewCode}</span> (自動生成)</>}
          </p>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => {
          const mode = v as RequestMode
          setActiveTab(mode)
          // 同步更新 formData.request_category
          if (mode === 'company') {
            setFormData(prev => ({ ...prev, request_category: 'company' }))
          } else {
            setFormData(prev => ({ ...prev, request_category: 'tour' }))
          }
        }} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="w-fit">
            <TabsTrigger value="tour" className="gap-2">
              <Users size={16} />
              團體請款
            </TabsTrigger>
            <TabsTrigger value="batch" className="gap-2">
              <Layers size={16} />
              批量請款
            </TabsTrigger>
            {canCreateCompanyPayment && (
              <TabsTrigger value="company" className="gap-2">
                <Briefcase size={16} />
                公司請款
              </TabsTrigger>
            )}
          </TabsList>

          {/* 團體請款 */}
          <TabsContent value="tour" className="flex-1 overflow-y-auto mt-4 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-morandi-primary">選擇旅遊團 *</label>
                <Combobox
                  options={tourOptions}
                  value={formData.tour_id}
                  onChange={value => setFormData(prev => ({ ...prev, tour_id: value, order_id: '' }))}
                  placeholder="搜尋團號或團名..."
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-morandi-primary">選擇訂單（可選）</label>
                <Combobox
                  options={orderOptions}
                  value={formData.order_id}
                  onChange={value => setFormData(prev => ({ ...prev, order_id: value }))}
                  placeholder={!formData.tour_id ? '請先選擇旅遊團' : '搜尋訂單...'}
                  disabled={!formData.tour_id}
                  className="mt-1"
                />
              </div>
              <RequestDateInput
                value={formData.request_date}
                onChange={(date, isSpecialBilling) => setFormData(prev => ({ ...prev, request_date: date, is_special_billing: isSpecialBilling }))}
              />
              <div>
                <label className="text-sm font-medium text-morandi-primary">備註</label>
                <Input
                  value={formData.note}
                  onChange={e => setFormData(prev => ({ ...prev, note: e.target.value }))}
                  placeholder="輸入備註（可選）"
                  className="mt-1"
                />
              </div>
            </div>

            {formData.tour_id && (
              <div className="flex items-center gap-2 p-3 bg-morandi-container/30 rounded-lg">
                <Checkbox
                  id="import-from-requests"
                  checked={importFromRequests}
                  onCheckedChange={(checked) => setImportFromRequests(checked === true)}
                />
                <label htmlFor="import-from-requests" className="flex items-center gap-2 text-sm font-medium text-morandi-primary cursor-pointer">
                  <FileInput size={16} className="text-morandi-gold" />
                  從需求單帶入（自動列出有供應商的項目）
                </label>
              </div>
            )}

            {importFromRequests ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-morandi-primary">
                    需求單項目
                    {loadingRequestItems && <span className="ml-2 text-morandi-secondary">載入中...</span>}
                  </h3>
                  {tourRequestItems.length > 0 && (
                    <span className="text-sm text-morandi-secondary">已選 {selectedRequestCount} 項</span>
                  )}
                </div>

                {tourRequestItems.length === 0 && !loadingRequestItems ? (
                  <div className="text-center py-8 text-morandi-secondary">此旅遊團沒有有供應商的需求單項目</div>
                ) : (
                  <div className="border border-border rounded-lg overflow-hidden">
                    <div className="max-h-[300px] overflow-y-auto">
                      {tourRequestItems.map(item => {
                        const categoryConfig = getCategoryConfig(item.category)
                        const itemState = selectedRequestItems[item.id]
                        const isSelected = itemState?.selected || false
                        const amount = itemState?.amount || 0

                        return (
                          <div key={item.id} className={cn('flex items-start gap-3 p-4 border-b border-border last:border-b-0', isSelected ? 'bg-morandi-gold/5' : 'bg-card')}>
                            <Checkbox checked={isSelected} onCheckedChange={() => toggleRequestItem(item.id)} className="mt-1" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-base">{categoryConfig.icon}</span>
                                <span className={cn('text-xs font-medium', categoryConfig.color)}>{item.category}</span>
                                <span className="text-sm font-medium text-morandi-primary truncate">{item.title}</span>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-morandi-secondary">
                                <Building2 size={12} />
                                <span>供應商：{item.supplierName}</span>
                              </div>
                              {(item.estimatedCost > 0 || item.finalCost) && (
                                <div className="text-xs text-morandi-secondary mt-1">
                                  {item.finalCost ? `確認成本：NT$ ${item.finalCost.toLocaleString()}` : `預估成本：NT$ ${item.estimatedCost.toLocaleString()}`}
                                </div>
                              )}
                            </div>
                            <div className="w-32 flex-shrink-0">
                              <div className="text-xs text-morandi-secondary mb-1">請款金額</div>
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-morandi-secondary">NT$</span>
                                <Input
                                  type="text"
                                  value={amount.toLocaleString()}
                                  onChange={(e) => updateRequestItemAmount(item.id, parseFloat(e.target.value.replace(/,/g, '')) || 0)}
                                  className="pl-8 text-right text-sm h-8"
                                  disabled={!isSelected}
                                />
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <EditableRequestItemList items={requestItems} suppliers={suppliers} updateItem={updateItem} removeItem={removeItem} addNewEmptyItem={addNewEmptyItem} />
            )}
          </TabsContent>

          {/* 批量請款 */}
          <TabsContent value="batch" className="flex-1 overflow-y-auto mt-4 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>請款日期</Label>
                <DatePicker value={batchDate} onChange={(date) => setBatchDate(date)} placeholder="選擇日期" />
              </div>
              <div>
                <Label>總金額</Label>
                <Input type="number" placeholder="輸入總金額" value={batchTotalAmount || ''} onChange={e => setBatchTotalAmount(parseFloat(e.target.value) || 0)} />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-morandi-container/30">
              <h3 className="text-sm font-medium text-morandi-primary">請款項目資訊</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>類別</Label>
                  <Select value={batchCategory} onValueChange={(value) => setBatchCategory(value as PaymentItemCategory)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>供應商</Label>
                  <Select value={batchSupplierId} onValueChange={setBatchSupplierId}>
                    <SelectTrigger><SelectValue placeholder="選擇供應商（選填）" /></SelectTrigger>
                    <SelectContent className="max-h-[300px] overflow-y-auto">
                      {suppliers.filter(s => s.type === 'supplier').map(supplier => (
                        <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>說明</Label>
                <Input placeholder="請款說明（選填）" value={batchDescription} onChange={e => setBatchDescription(e.target.value)} />
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-morandi-container/30">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">旅遊團分配</Label>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={distributeEvenly} disabled={tourAllocations.length === 0 || batchTotalAmount === 0}>平均分配</Button>
                  <Button size="sm" variant="outline" onClick={addTourAllocation}><Plus className="h-4 w-4 mr-1" />新增旅遊團</Button>
                </div>
              </div>

              {/* 表格式旅遊團分配 */}
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="text-xs text-morandi-primary font-medium bg-morandi-container/40">
                      <th className="text-left py-2.5 px-3 border-b border-r border-border">旅遊團</th>
                      <th className="text-right py-2.5 px-3 border-b border-r border-border w-40">分配金額</th>
                      <th className="text-center py-2.5 px-3 border-b border-border w-16">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tourAllocations.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="text-center py-6 text-morandi-secondary text-sm bg-card">
                          點擊「新增旅遊團」開始分配
                        </td>
                      </tr>
                    ) : (
                      tourAllocations.map((allocation, index) => (
                        <tr key={index} className="bg-card hover:bg-morandi-container/10">
                          <td className="py-2 px-3 border-b border-r border-border">
                            <Combobox
                              options={[
                                // 已選擇的旅遊團（如果有的話）
                                ...(allocation.tour_id ? [{ value: allocation.tour_id, label: `${allocation.tour_code} - ${allocation.tour_name}` }] : []),
                                // 可選的旅遊團
                                ...availableTours.map(tour => ({ value: tour.id, label: `${tour.code} - ${tour.name}` })),
                              ]}
                              value={allocation.tour_id}
                              onChange={value => selectTour(index, value)}
                              placeholder="搜尋旅遊團..."
                            />
                          </td>
                          <td className="py-2 px-3 border-b border-r border-border">
                            <input
                              type="number"
                              placeholder="0"
                              value={allocation.allocated_amount || ''}
                              onChange={e => updateTourAllocation(index, { allocated_amount: parseFloat(e.target.value) || 0 })}
                              className="input-no-focus w-full bg-transparent text-sm text-right"
                            />
                          </td>
                          <td className="py-2 px-3 border-b border-border text-center">
                            <span
                              onClick={() => removeTourAllocation(index)}
                              className="text-morandi-secondary cursor-pointer hover:text-morandi-red text-sm"
                              title="刪除"
                            >
                              ✕
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                    {/* 總計行 */}
                    <tr className="bg-morandi-container/20 font-medium">
                      <td className="py-2.5 px-3 border-r border-border text-sm text-morandi-primary">
                        共 {tourAllocations.length} 行
                      </td>
                      <td className="py-2.5 px-3 border-r border-border text-right">
                        <CurrencyCell amount={totalAllocatedAmount} className="text-sm" />
                      </td>
                      <td className="py-2.5 px-3 border-border"></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 未分配提示 */}
              {unallocatedAmount !== 0 && (
                <div className={cn(
                  'flex items-center justify-between px-3 py-2 rounded-lg text-sm',
                  unallocatedAmount > 0 ? 'bg-morandi-gold/10 text-morandi-gold' : 'bg-morandi-red/10 text-morandi-red'
                )}>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{unallocatedAmount > 0 ? '還有金額未分配' : '分配金額超過總金額'}</span>
                  </div>
                  <div className="font-medium">
                    未分配：<CurrencyCell amount={Math.abs(unallocatedAmount)} className="inline" />
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label>備註</Label>
              <Input placeholder="請款備註（選填）" value={batchNote} onChange={e => setBatchNote(e.target.value)} />
            </div>
          </TabsContent>

          {/* 公司請款 */}
          {canCreateCompanyPayment && (
            <TabsContent value="company" className="flex-1 overflow-y-auto mt-4 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ExpenseTypeSelector
                  value={formData.expense_type as CompanyExpenseType | ''}
                  onChange={value => setFormData(prev => ({ ...prev, expense_type: value }))}
                />
                <div />
                <RequestDateInput
                  value={formData.request_date}
                  onChange={(date, isSpecialBilling) => setFormData(prev => ({ ...prev, request_date: date, is_special_billing: isSpecialBilling }))}
                />
                <div>
                  <label className="text-sm font-medium text-morandi-primary">備註</label>
                  <Input
                    value={formData.note}
                    onChange={e => setFormData(prev => ({ ...prev, note: e.target.value }))}
                    placeholder="輸入備註（可選）"
                    className="mt-1"
                  />
                </div>
              </div>

              <EditableRequestItemList items={requestItems} suppliers={suppliers} updateItem={updateItem} removeItem={removeItem} addNewEmptyItem={addNewEmptyItem} />
            </TabsContent>
          )}
        </Tabs>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-4 border-t border-border">
          {/* 左側：總金額顯示 */}
          <div className="flex items-center text-sm">
            <span className="text-morandi-secondary">
              {activeTab === 'batch'
                ? `共 ${tourAllocations.filter(a => a.tour_id).length} 筆，總金額`
                : `共 ${activeTab === 'tour' && importFromRequests ? selectedRequestCount : requestItems.length} 項，總金額`
              }
            </span>
            <span className="inline-block min-w-[120px] text-right font-semibold text-morandi-gold">
              NT$ {(activeTab === 'batch'
                ? batchTotalAmount
                : (activeTab === 'tour' && importFromRequests ? selectedRequestTotal : total_amount)
              ).toLocaleString()}
            </span>
          </div>
          {/* 中間空白 */}
          <div className="flex-1" />
          {/* 右側：按鈕 */}
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleCancel} className="gap-2">
              <X size={16} />
              取消
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                activeTab === 'batch'
                  ? unallocatedAmount !== 0 || tourAllocations.filter(a => a.tour_id).length === 0
                  : activeTab === 'company'
                    ? !formData.expense_type || !formData.request_date || requestItems.length === 0
                    : !formData.tour_id || (importFromRequests ? selectedRequestCount === 0 : requestItems.length === 0)
              }
              className="bg-morandi-gold hover:bg-morandi-gold-hover text-white rounded-md gap-2"
            >
              <Plus size={16} />
              {activeTab === 'batch' ? '建立批次請款' : '新增請款單'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
