'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Combobox } from '@/components/ui/combobox'
import { Trash2, Plus, Pencil, X, Save } from 'lucide-react'
import { useTours, useSuppliers, usePaymentRequestItems, deletePaymentRequest as deletePaymentRequestApi } from '@/data'
import { PaymentRequest, PaymentRequestItem } from '@/stores/types'
import { DateCell, CurrencyCell } from '@/components/table-cells'
import { statusLabels, statusColors, categoryOptions } from '../types'
import { paymentRequestService } from '@/features/payments/services/payment-request.service'
import { logger } from '@/lib/utils/logger'
import { confirm, alert } from '@/lib/ui/alert-dialog'

interface RequestDetailDialogProps {
  request: PaymentRequest | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RequestDetailDialog({ request, open, onOpenChange }: RequestDetailDialogProps) {
  const { items: requestItems, refresh: refreshRequestItems } = usePaymentRequestItems()
  const { items: tours } = useTours()
  const { items: suppliers } = useSuppliers()

  // 編輯模式狀態
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [isAddingItem, setIsAddingItem] = useState(false)
  const [newItem, setNewItem] = useState({
    category: '其他' as PaymentRequestItem['category'],
    supplier_id: '',
    supplier_name: '',
    description: '',
    unit_price: 0,
    quantity: 1,
  })
  const [editItem, setEditItem] = useState<Partial<PaymentRequestItem>>({})

  // 載入請款項目
  useEffect(() => {
    if (open && request) {
      refreshRequestItems()
    }
  }, [open, request, refreshRequestItems])

  // 重置編輯狀態
  useEffect(() => {
    if (!open) {
      setEditingItemId(null)
      setIsAddingItem(false)
      setNewItem({
        category: '其他',
        supplier_id: '',
        supplier_name: '',
        description: '',
        unit_price: 0,
        quantity: 1,
      })
    }
  }, [open])

  if (!request) return null

  // 取得此請款單的項目
  const items = requestItems.filter(item => item.request_id === request.id)

  // 取得關聯的團
  const tour = request.tour_id ? tours.find(t => t.id === request.tour_id) : null

  // 供應商選項（給 Combobox 使用）
  const supplierOptions = suppliers.map(s => ({
    value: s.id,
    label: s.name || '未命名',
  }))

  // 刪除請款單
  const handleDelete = async () => {
    const confirmed = await confirm('確定要刪除此請款單嗎？此操作無法復原。', {
      title: '刪除請款單',
      type: 'warning',
    })
    if (!confirmed) {
      return
    }

    try {
      await deletePaymentRequestApi(request.id)
      await alert('請款單已刪除', 'success')
      onOpenChange(false)
    } catch (error) {
      logger.error('刪除請款單失敗:', error)
      await alert('刪除請款單失敗', 'error')
    }
  }

  // 新增項目
  const handleAddItem = async () => {
    if (!newItem.description || newItem.unit_price <= 0) {
      await alert('請填寫說明和單價', 'warning')
      return
    }

    try {
      const selectedSupplier = suppliers.find(s => s.id === newItem.supplier_id)
      await paymentRequestService.addItem(request.id, {
        category: newItem.category,
        supplier_id: newItem.supplier_id || '',
        supplier_name: selectedSupplier?.name || newItem.supplier_name || '',
        description: newItem.description,
        unit_price: newItem.unit_price,
        quantity: newItem.quantity,
        note: '',
        sort_order: items.length + 1,
      })

      await refreshRequestItems()
      setIsAddingItem(false)
      setNewItem({
        category: '其他',
        supplier_id: '',
        supplier_name: '',
        description: '',
        unit_price: 0,
        quantity: 1,
      })
    } catch (error) {
      logger.error('新增項目失敗:', error)
      await alert('新增項目失敗', 'error')
    }
  }

  // 開始編輯項目
  const startEditItem = (item: PaymentRequestItem) => {
    setEditingItemId(item.id)
    setEditItem({
      category: item.category,
      supplier_id: item.supplier_id,
      supplier_name: item.supplier_name,
      description: item.description,
      unit_price: item.unit_price,
      quantity: item.quantity,
    })
  }

  // 儲存編輯
  const handleSaveEdit = async (itemId: string) => {
    try {
      const selectedSupplier = suppliers.find(s => s.id === editItem.supplier_id)
      await paymentRequestService.updateItem(request.id, itemId, {
        ...editItem,
        supplier_name: selectedSupplier?.name || editItem.supplier_name,
      })
      await refreshRequestItems()
      setEditingItemId(null)
    } catch (error) {
      logger.error('更新項目失敗:', error)
      await alert('更新項目失敗', 'error')
    }
  }

  // 刪除項目
  const handleDeleteItem = async (itemId: string) => {
    const confirmed = await confirm('確定要刪除此項目嗎？', {
      title: '刪除項目',
      type: 'warning',
    })
    if (!confirmed) return

    try {
      await paymentRequestService.deleteItem(request.id, itemId)
      await refreshRequestItems()
    } catch (error) {
      logger.error('刪除項目失敗:', error)
      await alert('刪除項目失敗', 'error')
    }
  }

  // 判斷是否可以編輯（只有待處理狀態可以編輯）
  const canEdit = request.status === 'pending'

  // 是否正在編輯中（新增或編輯項目）
  const isEditing = isAddingItem || editingItemId !== null

  // 處理關閉對話框（編輯中時阻止關閉）
  const handleOpenChange = async (newOpen: boolean) => {
    if (!newOpen && isEditing) {
      // 正在編輯中，提示用戶
      await alert('請先儲存或取消目前的編輯', 'warning')
      return
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">請款單 {request.code}</DialogTitle>
              <p className="text-sm text-morandi-muted mt-1">
                {request.tour_code ? `團號：${request.tour_code}` : '無關聯團號'}
                {request.order_number && ` | 訂單：${request.order_number}`}
              </p>
            </div>
            <Badge className={statusColors[(request.status || 'pending') as 'pending' | 'approved' | 'paid']}>
              {statusLabels[(request.status || 'pending') as 'pending' | 'approved' | 'paid']}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* 基本資訊 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-morandi-background/50 rounded-lg">
            <InfoItem label="請款單號" value={request.code} />
            <InfoItem label="團號" value={request.tour_code || '-'} />
            <InfoItem label="團名" value={request.tour_name || tour?.name || '-'} />
            <InfoItem label="訂單編號" value={request.order_number || '-'} />
            <InfoItem label="請款人" value={request.created_by_name || '-'} />
            <div>
              <p className="text-xs text-morandi-muted mb-1">請款日期</p>
              <DateCell date={request.created_at} showIcon={false} />
            </div>
            <div>
              <p className="text-xs text-morandi-muted mb-1">總金額</p>
              <CurrencyCell amount={request.amount || 0} className="font-semibold text-morandi-gold" />
            </div>
          </div>

          {/* 請款項目 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-morandi-primary">
                請款項目 ({items.length} 項)
              </h3>
              {canEdit && !isAddingItem && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsAddingItem(true)}
                  className="h-7"
                >
                  <Plus size={14} className="mr-1" />
                  新增項目
                </Button>
              )}
            </div>

            <div className="border border-morandi-container/20 rounded-lg overflow-hidden">
              {/* 表頭 - 與 EditableRequestItemList 一致的 grid 結構 */}
              <div className="bg-morandi-background/50 border-b border-morandi-container/20">
                <div className={`grid ${canEdit ? 'grid-cols-[80px_1fr_1fr_96px_64px_112px_80px]' : 'grid-cols-[80px_1fr_1fr_96px_64px_112px]'} px-3 py-2.5`}>
                  <span className="text-xs font-medium text-morandi-muted">類別</span>
                  <span className="text-xs font-medium text-morandi-muted">供應商</span>
                  <span className="text-xs font-medium text-morandi-muted">說明</span>
                  <span className="text-xs font-medium text-morandi-muted text-right">單價</span>
                  <span className="text-xs font-medium text-morandi-muted text-center">數量</span>
                  <span className="text-xs font-medium text-morandi-muted text-right">小計</span>
                  {canEdit && <span className="text-xs font-medium text-morandi-muted text-center">操作</span>}
                </div>
              </div>

              {/* 項目區域 */}
              <div className="max-h-[280px] overflow-y-auto">
                {/* 新增項目表單 */}
                {isAddingItem && (
                  <div className={`grid ${canEdit ? 'grid-cols-[80px_1fr_1fr_96px_64px_112px_80px]' : 'grid-cols-[80px_1fr_1fr_96px_64px_112px]'} px-2 py-1.5 border-b border-morandi-container/10 bg-morandi-gold/5 items-center`}>
                    <div>
                      <Select
                        value={newItem.category}
                        onValueChange={(value) => setNewItem({ ...newItem, category: value as PaymentRequestItem['category'] })}
                      >
                        <SelectTrigger className="h-8 text-xs border-0 shadow-none bg-transparent">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categoryOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Combobox
                        options={supplierOptions}
                        value={newItem.supplier_id}
                        onChange={(value) => setNewItem({ ...newItem, supplier_id: value })}
                        placeholder="選擇供應商..."
                        className="[&_input]:h-8 [&_input]:text-xs [&_input]:bg-transparent"
                      />
                    </div>
                    <div>
                      <Input
                        value={newItem.description}
                        onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                        placeholder="說明"
                        className="h-8 text-xs border-0 shadow-none bg-transparent"
                      />
                    </div>
                    <div>
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={newItem.unit_price || ''}
                        onChange={(e) => {
                          const num = parseFloat(e.target.value) || 0
                          setNewItem({ ...newItem, unit_price: num })
                        }}
                        className="h-8 text-xs text-right border-0 shadow-none bg-transparent"
                      />
                    </div>
                    <div>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={newItem.quantity || ''}
                        onChange={(e) => {
                          const num = parseInt(e.target.value) || 0
                          setNewItem({ ...newItem, quantity: num })
                        }}
                        className="h-8 text-xs text-center border-0 shadow-none bg-transparent"
                      />
                    </div>
                    <div className="text-right pr-2">
                      <CurrencyCell amount={newItem.unit_price * newItem.quantity} className="text-morandi-gold" />
                    </div>
                    <div className="flex items-center justify-center gap-1">
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleAddItem}>
                        <Save size={14} className="text-status-success" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setIsAddingItem(false)}>
                        <X size={14} className="text-status-danger" />
                      </Button>
                    </div>
                  </div>
                )}

                {items.length === 0 && !isAddingItem ? (
                  <div className="text-center py-8 text-morandi-muted">
                    尚無請款項目
                  </div>
                ) : (
                  items.map((item) => (
                    <div key={item.id} className={`grid ${canEdit ? 'grid-cols-[80px_1fr_1fr_96px_64px_112px_80px]' : 'grid-cols-[80px_1fr_1fr_96px_64px_112px]'} px-2 py-1.5 border-b border-morandi-container/10 items-center hover:bg-morandi-container/5`}>
                      {editingItemId === item.id ? (
                        /* 編輯模式 */
                        <>
                          <div>
                            <Select
                              value={editItem.category || ''}
                              onValueChange={(value) => setEditItem({ ...editItem, category: value as PaymentRequestItem['category'] })}
                            >
                              <SelectTrigger className="h-8 text-xs border-0 shadow-none bg-transparent">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {categoryOptions.map(opt => (
                                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Combobox
                              options={supplierOptions}
                              value={editItem.supplier_id || ''}
                              onChange={(value) => setEditItem({ ...editItem, supplier_id: value })}
                              placeholder="選擇供應商..."
                              className="[&_input]:h-8 [&_input]:text-xs [&_input]:bg-transparent"
                            />
                          </div>
                          <div>
                            <Input
                              value={editItem.description || ''}
                              onChange={(e) => setEditItem({ ...editItem, description: e.target.value })}
                              className="h-8 text-xs border-0 shadow-none bg-transparent"
                            />
                          </div>
                          <div>
                            <Input
                              type="text"
                              inputMode="decimal"
                              value={editItem.unit_price || ''}
                              onChange={(e) => {
                                const num = parseFloat(e.target.value) || 0
                                setEditItem({ ...editItem, unit_price: num })
                              }}
                              className="h-8 text-xs text-right border-0 shadow-none bg-transparent"
                            />
                          </div>
                          <div>
                            <Input
                              type="text"
                              inputMode="numeric"
                              value={editItem.quantity || ''}
                              onChange={(e) => {
                                const num = parseInt(e.target.value) || 0
                                setEditItem({ ...editItem, quantity: num })
                              }}
                              className="h-8 text-xs text-center border-0 shadow-none bg-transparent"
                            />
                          </div>
                          <div className="text-right pr-2">
                            <CurrencyCell amount={(editItem.unit_price || 0) * (editItem.quantity || 0)} className="text-morandi-gold" />
                          </div>
                          <div className="flex items-center justify-center gap-1">
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleSaveEdit(item.id)}>
                              <Save size={14} className="text-status-success" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditingItemId(null)}>
                              <X size={14} className="text-status-danger" />
                            </Button>
                          </div>
                        </>
                      ) : (
                        /* 顯示模式 */
                        <>
                          <div className="text-sm px-1">
                            {categoryOptions.find(c => c.value === item.category)?.label || item.category}
                          </div>
                          <div className="text-sm px-1">{item.supplier_name || '-'}</div>
                          <div className="text-sm px-1">{item.description || '-'}</div>
                          <div className="text-right pr-2">
                            <CurrencyCell amount={item.unit_price || 0} className="text-sm" />
                          </div>
                          <div className="text-sm text-center">{item.quantity}</div>
                          <div className="text-right pr-2">
                            <CurrencyCell amount={item.subtotal || 0} className="text-morandi-gold" />
                          </div>
                          {canEdit && (
                            <div className="flex items-center justify-center gap-1">
                              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => startEditItem(item)}>
                                <Pencil size={14} className="text-morandi-secondary" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleDeleteItem(item.id)}>
                                <Trash2 size={14} className="text-status-danger" />
                              </Button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* 合計 */}
              <div className="bg-morandi-background/50 border-t border-morandi-container/20">
                <div className={`grid ${canEdit ? 'grid-cols-[80px_1fr_1fr_96px_64px_112px_80px]' : 'grid-cols-[80px_1fr_1fr_96px_64px_112px]'} px-3 py-3`}>
                  <div></div>
                  <div></div>
                  <div></div>
                  <div></div>
                  <div className="text-right font-semibold text-sm">合計</div>
                  <div className="text-right pr-2">
                    <CurrencyCell amount={request.amount || 0} className="font-bold text-morandi-gold" />
                  </div>
                  {canEdit && <div></div>}
                </div>
              </div>
            </div>
          </div>

          {/* 備註 */}
          {request.note && (
            <div className="p-4 bg-morandi-background/50 rounded-lg">
              <h3 className="text-sm font-semibold text-morandi-primary mb-2">備註</h3>
              <p className="text-sm text-morandi-secondary whitespace-pre-wrap">{request.note}</p>
            </div>
          )}

          {/* 操作按鈕 */}
          <div className="flex items-center justify-end pt-4 border-t border-morandi-container/20">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="text-morandi-red border-morandi-red hover:bg-morandi-red/10"
            >
              <Trash2 size={16} className="mr-2" />
              刪除
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// 資訊項目組件
function InfoItem({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div>
      <p className="text-xs text-morandi-muted mb-1">{label}</p>
      <p className={`text-sm ${highlight ? 'font-semibold text-morandi-gold' : 'text-morandi-primary'}`}>
        {value}
      </p>
    </div>
  )
}
