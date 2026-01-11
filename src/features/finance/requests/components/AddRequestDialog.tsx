import { useEffect, useState, useMemo } from 'react'
import { Plus, X, FileInput, Check, Building2, Briefcase, Users } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Combobox } from '@/components/ui/combobox'
import { Checkbox } from '@/components/ui/checkbox'
import { RequestDateInput } from './RequestDateInput'
import { ExpenseTypeSelector } from './ExpenseTypeSelector'
import { CurrencyCell } from '@/components/table-cells'
import { EditableRequestItemList } from './RequestItemList'
import { useRequestForm } from '../hooks/useRequestForm'
import { useRequestOperations } from '../hooks/useRequestOperations'
import { useTourRequestItems } from '../hooks/useTourRequestItems'
import { RequestItem } from '../types'
import { PaymentItemCategory, CompanyExpenseType, EXPENSE_TYPE_CONFIG } from '@/stores/types'
import { logger } from '@/lib/utils/logger'
import { cn } from '@/lib/utils'

interface AddRequestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  /** 預設團 ID（從快速請款按鈕傳入） */
  defaultTourId?: string
  /** 預設訂單 ID（從快速請款按鈕傳入） */
  defaultOrderId?: string
  /** 是否為巢狀 Dialog（用於從其他 Dialog 中打開時，使用更高的 z-index 層級） */
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

export function AddRequestDialog({ open, onOpenChange, onSuccess, defaultTourId, defaultOrderId, nested = false }: AddRequestDialogProps) {
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

  // 從需求單帶入的狀態
  const [importFromRequests, setImportFromRequests] = useState(false)
  const [selectedRequestItems, setSelectedRequestItems] = useState<Record<string, { selected: boolean; amount: number }>>({})

  // 查詢該團有供應商的需求單
  const { items: tourRequestItems, loading: loadingRequestItems } = useTourRequestItems(
    importFromRequests && formData.tour_id ? formData.tour_id : null
  )

  // 當需求單項目載入後，初始化選擇狀態
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

  // 切換需求單項目選擇
  const toggleRequestItem = (itemId: string) => {
    setSelectedRequestItems(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        selected: !prev[itemId]?.selected,
      },
    }))
  }

  // 更新需求單項目金額
  const updateRequestItemAmount = (itemId: string, amount: number) => {
    setSelectedRequestItems(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        amount,
      },
    }))
  }

  // 計算選中的需求單項目總金額
  const selectedRequestTotal = useMemo(() => {
    return Object.entries(selectedRequestItems)
      .filter(([, val]) => val.selected)
      .reduce((sum, [, val]) => sum + val.amount, 0)
  }, [selectedRequestItems])

  // 選中的需求單項目數量
  const selectedRequestCount = useMemo(() => {
    return Object.values(selectedRequestItems).filter(val => val.selected).length
  }, [selectedRequestItems])

  // 當對話框開啟且有預設值時，自動帶入
  useEffect(() => {
    if (open && defaultTourId && !formData.tour_id) {
      setFormData(prev => ({
        ...prev,
        tour_id: defaultTourId,
        order_id: defaultOrderId || '',
      }))
    }
  }, [open, defaultTourId, defaultOrderId, formData.tour_id, setFormData])

  // 如果只有一個訂單，自動帶入
  useEffect(() => {
    if (formData.tour_id && filteredOrders.length === 1 && !formData.order_id) {
      const order = filteredOrders[0]
      setFormData(prev => ({ ...prev, order_id: order.id }))
    }
  }, [formData.tour_id, filteredOrders, formData.order_id, setFormData])

  // 取得選中的旅遊團以預覽編號
  const selectedTour = tours.find(t => t.id === formData.tour_id)

  // 根據請款類別預覽編號
  const previewCode = useMemo(() => {
    if (formData.request_category === 'company') {
      if (!formData.expense_type || !formData.request_date) {
        return '請選擇費用類型和日期'
      }
      return generateCompanyRequestCode(formData.expense_type as CompanyExpenseType, formData.request_date)
    } else {
      return selectedTour ? generateRequestCode(selectedTour.code) : '請先選擇旅遊團'
    }
  }, [formData.request_category, formData.expense_type, formData.request_date, selectedTour, generateRequestCode, generateCompanyRequestCode])

  // 轉換為 Combobox 選項格式
  const tourOptions = tours.map(tour => ({
    value: tour.id,
    label: `${tour.code || ''} - ${tour.name || ''}`,
  }))

  const orderOptions = filteredOrders.map(order => ({
    value: order.id,
    label: `${order.order_number} - ${order.contact_person || '無聯絡人'}`,
  }))

  const handleCancel = () => {
    resetForm()
    setImportFromRequests(false)
    setSelectedRequestItems({})
    onOpenChange(false)
  }

  const handleSubmit = async () => {
    try {
      const isCompanyRequest = formData.request_category === 'company'

      // 判斷使用需求單項目還是手動輸入項目
      let itemsToSubmit = requestItems

      if (isCompanyRequest) {
        // 公司請款
        if (!formData.expense_type) {
          logger.error('公司請款必須選擇費用類型')
          return
        }

        await createRequest(
          formData,
          itemsToSubmit,
          '', // 公司請款無團名
          '', // 公司請款無團號
          undefined,
          currentUser?.display_name || currentUser?.chinese_name || ''
        )
      } else {
        // 團體請款
        // 找到選中的旅遊團和訂單資訊
        const selectedTour = tours.find(t => t.id === formData.tour_id)
        const selectedOrder = orders.find(o => o.id === formData.order_id)

        if (!selectedTour) {
          logger.error('找不到選擇的旅遊團:', formData.tour_id)
          return
        }

        if (importFromRequests && selectedRequestCount > 0) {
          // 從需求單帶入：將選中的需求單項目轉換為請款項目
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
      }

      resetForm()
      setImportFromRequests(false)
      setSelectedRequestItems({})
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      logger.error('新增請款單失敗:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] flex flex-col overflow-hidden" nested={nested}>
        <DialogHeader>
          <DialogTitle>新增請款單</DialogTitle>
          <p className="text-sm text-morandi-secondary">
            請款單號: <span className="font-medium text-morandi-primary">{previewCode}</span> (自動生成)
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* 請款類別切換 */}
          <div className="flex gap-2 p-1 bg-morandi-container/30 rounded-lg w-fit">
            <Button
              type="button"
              variant={formData.request_category === 'tour' ? 'default' : 'ghost'}
              className={cn(
                'gap-2',
                formData.request_category === 'tour'
                  ? 'bg-morandi-gold hover:bg-morandi-gold-hover text-white'
                  : 'text-morandi-secondary hover:text-morandi-primary'
              )}
              onClick={() => setFormData(prev => ({ ...prev, request_category: 'tour', expense_type: '' }))}
            >
              <Users size={16} />
              團體請款
            </Button>
            <Button
              type="button"
              variant={formData.request_category === 'company' ? 'default' : 'ghost'}
              className={cn(
                'gap-2',
                formData.request_category === 'company'
                  ? 'bg-morandi-gold hover:bg-morandi-gold-hover text-white'
                  : 'text-morandi-secondary hover:text-morandi-primary'
              )}
              onClick={() => setFormData(prev => ({ ...prev, request_category: 'company', tour_id: '', order_id: '' }))}
            >
              <Briefcase size={16} />
              公司請款
            </Button>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formData.request_category === 'tour' ? (
              <>
                {/* 團體請款：選擇旅遊團和訂單 */}
                <div>
                  <label className="text-sm font-medium text-morandi-primary">選擇旅遊團 *</label>
                  <Combobox
                    options={tourOptions}
                    value={formData.tour_id}
                    onChange={value => {
                      setFormData(prev => ({
                        ...prev,
                        tour_id: value,
                        order_id: '',
                      }))
                    }}
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
              </>
            ) : (
              <>
                {/* 公司請款：選擇費用類型 */}
                <ExpenseTypeSelector
                  value={formData.expense_type as CompanyExpenseType | ''}
                  onChange={value => setFormData(prev => ({ ...prev, expense_type: value }))}
                />
                <div />
              </>
            )}

              <RequestDateInput
                value={formData.request_date}
                onChange={(date, isSpecialBilling) => {
                  setFormData(prev => ({
                    ...prev,
                    request_date: date,
                    is_special_billing: isSpecialBilling,
                  }))
                }}
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

          {/* 從需求單帶入選項 - 只在團體請款時顯示 */}
          {formData.request_category === 'tour' && formData.tour_id && (
            <div className="flex items-center gap-2 p-3 bg-morandi-container/30 rounded-lg">
              <Checkbox
                id="import-from-requests"
                checked={importFromRequests}
                onCheckedChange={(checked) => setImportFromRequests(checked === true)}
              />
              <label
                htmlFor="import-from-requests"
                className="flex items-center gap-2 text-sm font-medium text-morandi-primary cursor-pointer"
              >
                <FileInput size={16} className="text-morandi-gold" />
                從需求單帶入（自動列出有供應商的項目）
              </label>
            </div>
          )}

          {/* 需求單項目列表 或 手動輸入列表 */}
          {formData.request_category === 'tour' && importFromRequests ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-morandi-primary">
                  需求單項目
                  {loadingRequestItems && <span className="ml-2 text-morandi-secondary">載入中...</span>}
                </h3>
                {tourRequestItems.length > 0 && (
                  <span className="text-sm text-morandi-secondary">
                    已選 {selectedRequestCount} 項
                  </span>
                )}
              </div>

              {tourRequestItems.length === 0 && !loadingRequestItems ? (
                <div className="text-center py-8 text-morandi-secondary">
                  此旅遊團沒有有供應商的需求單項目
                </div>
              ) : (
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="max-h-[300px] overflow-y-auto">
                    {tourRequestItems.map(item => {
                      const categoryConfig = getCategoryConfig(item.category)
                      const itemState = selectedRequestItems[item.id]
                      const isSelected = itemState?.selected || false
                      const amount = itemState?.amount || 0

                      return (
                        <div
                          key={item.id}
                          className={cn(
                            'flex items-start gap-3 p-4 border-b border-border last:border-b-0',
                            isSelected ? 'bg-morandi-gold/5' : 'bg-card'
                          )}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleRequestItem(item.id)}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-base">{categoryConfig.icon}</span>
                              <span className={cn('text-xs font-medium', categoryConfig.color)}>
                                {item.category}
                              </span>
                              <span className="text-sm font-medium text-morandi-primary truncate">
                                {item.title}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-morandi-secondary">
                              <Building2 size={12} />
                              <span>供應商：{item.supplierName}</span>
                            </div>
                            {(item.estimatedCost > 0 || item.finalCost) && (
                              <div className="text-xs text-morandi-secondary mt-1">
                                {item.finalCost
                                  ? `確認成本：NT$ ${item.finalCost.toLocaleString()}`
                                  : `預估成本：NT$ ${item.estimatedCost.toLocaleString()}`}
                              </div>
                            )}
                          </div>
                          <div className="w-32 flex-shrink-0">
                            <div className="text-xs text-morandi-secondary mb-1">請款金額</div>
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-morandi-secondary">
                                NT$
                              </span>
                              <Input
                                type="text"
                                value={amount.toLocaleString()}
                                onChange={(e) => {
                                  const value = parseFloat(e.target.value.replace(/,/g, '')) || 0
                                  updateRequestItemAmount(item.id, value)
                                }}
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
            /* Item List - 手動輸入 */
            <EditableRequestItemList
              items={requestItems}
              suppliers={suppliers}
              updateItem={updateItem}
              removeItem={removeItem}
              addNewEmptyItem={addNewEmptyItem}
            />
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t border-border">
            <Button variant="outline" onClick={handleCancel} className="gap-2">
              <X size={16} />
              取消
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                formData.request_category === 'company'
                  ? !formData.expense_type || !formData.request_date || requestItems.length === 0
                  : !formData.tour_id || (importFromRequests ? selectedRequestCount === 0 : requestItems.length === 0)
              }
              className="bg-morandi-gold hover:bg-morandi-gold-hover text-white rounded-md gap-2"
            >
              <Plus size={16} />
              新增請款單 (共 {formData.request_category === 'tour' && importFromRequests ? selectedRequestCount : requestItems.length} 項，
              <CurrencyCell amount={formData.request_category === 'tour' && importFromRequests ? selectedRequestTotal : total_amount} className="inline" />)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
