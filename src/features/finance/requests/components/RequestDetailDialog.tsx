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
import { Trash2, Plus, Pencil, X, Save } from 'lucide-react'
import { usePaymentRequestStore, usePaymentRequestItemStore, useTourStore, useSupplierStore } from '@/stores'
import { PaymentRequest, PaymentRequestItem } from '@/stores/types'
import { formatDate } from '@/lib/utils'
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
  const { delete: deleteRequest } = usePaymentRequestStore()
  const { items: requestItems, fetchAll: fetchRequestItems } = usePaymentRequestItemStore()
  const { items: tours } = useTourStore()
  const { items: suppliers } = useSupplierStore()

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
      fetchRequestItems()
    }
  }, [open, request, fetchRequestItems])

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
      await deleteRequest(request.id)
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

      await fetchRequestItems()
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
      await fetchRequestItems()
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
      await fetchRequestItems()
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
            <InfoItem label="請款日期" value={formatDate(request.created_at)} />
            <InfoItem
              label="總金額"
              value={`NT$ ${(request.amount || 0).toLocaleString()}`}
              highlight
            />
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

            <div className="overflow-x-auto border border-morandi-container/20 rounded-lg">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-morandi-background/50 border-b border-morandi-container/20">
                    <th className="text-left py-2 px-3 text-morandi-muted font-medium">類別</th>
                    <th className="text-left py-2 px-3 text-morandi-muted font-medium">供應商</th>
                    <th className="text-left py-2 px-3 text-morandi-muted font-medium">說明</th>
                    <th className="text-right py-2 px-3 text-morandi-muted font-medium">單價</th>
                    <th className="text-right py-2 px-3 text-morandi-muted font-medium">數量</th>
                    <th className="text-right py-2 px-3 text-morandi-muted font-medium">小計</th>
                    {canEdit && <th className="text-center py-2 px-3 text-morandi-muted font-medium w-20">操作</th>}
                  </tr>
                </thead>
                <tbody>
                  {/* 新增項目表單 */}
                  {isAddingItem && (
                    <tr className="border-b border-morandi-container/10 bg-morandi-gold/5">
                      <td className="py-2 px-2">
                        <Select
                          value={newItem.category}
                          onValueChange={(value) => setNewItem({ ...newItem, category: value as PaymentRequestItem['category'] })}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {categoryOptions.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-2 px-2">
                        <Select
                          value={newItem.supplier_id}
                          onValueChange={(value) => setNewItem({ ...newItem, supplier_id: value })}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="選擇供應商" />
                          </SelectTrigger>
                          <SelectContent>
                            {suppliers.map(s => (
                              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-2 px-2">
                        <Input
                          value={newItem.description}
                          onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                          placeholder="說明"
                          className="h-8 text-xs"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={newItem.unit_price || ''}
                          onChange={(e) => {
                            const num = parseFloat(e.target.value) || 0
                            setNewItem({ ...newItem, unit_price: num })
                          }}
                          className="h-8 text-xs text-right w-24"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <Input
                          type="text"
                          inputMode="numeric"
                          value={newItem.quantity || ''}
                          onChange={(e) => {
                            const num = parseInt(e.target.value) || 0
                            setNewItem({ ...newItem, quantity: num })
                          }}
                          className="h-8 text-xs text-right w-16"
                        />
                      </td>
                      <td className="py-2 px-3 text-right font-medium text-morandi-gold">
                        NT$ {(newItem.unit_price * newItem.quantity).toLocaleString()}
                      </td>
                      <td className="py-2 px-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleAddItem}>
                            <Save size={14} className="text-status-success" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setIsAddingItem(false)}>
                            <X size={14} className="text-status-danger" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )}

                  {items.length === 0 && !isAddingItem ? (
                    <tr>
                      <td colSpan={canEdit ? 7 : 6} className="text-center py-8 text-morandi-muted">
                        尚無請款項目
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr key={item.id} className="border-b border-morandi-container/10">
                        {editingItemId === item.id ? (
                          /* 編輯模式 */
                          <>
                            <td className="py-2 px-2">
                              <Select
                                value={editItem.category || ''}
                                onValueChange={(value) => setEditItem({ ...editItem, category: value as PaymentRequestItem['category'] })}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {categoryOptions.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="py-2 px-2">
                              <Select
                                value={editItem.supplier_id || ''}
                                onValueChange={(value) => setEditItem({ ...editItem, supplier_id: value })}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue placeholder="選擇供應商" />
                                </SelectTrigger>
                                <SelectContent>
                                  {suppliers.map(s => (
                                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="py-2 px-2">
                              <Input
                                value={editItem.description || ''}
                                onChange={(e) => setEditItem({ ...editItem, description: e.target.value })}
                                className="h-8 text-xs"
                              />
                            </td>
                            <td className="py-2 px-2">
                              <Input
                                type="text"
                                inputMode="decimal"
                                value={editItem.unit_price || ''}
                                onChange={(e) => {
                                  const num = parseFloat(e.target.value) || 0
                                  setEditItem({ ...editItem, unit_price: num })
                                }}
                                className="h-8 text-xs text-right w-24"
                              />
                            </td>
                            <td className="py-2 px-2">
                              <Input
                                type="text"
                                inputMode="numeric"
                                value={editItem.quantity || ''}
                                onChange={(e) => {
                                  const num = parseInt(e.target.value) || 0
                                  setEditItem({ ...editItem, quantity: num })
                                }}
                                className="h-8 text-xs text-right w-16"
                              />
                            </td>
                            <td className="py-2 px-3 text-right font-medium text-morandi-gold">
                              NT$ {((editItem.unit_price || 0) * (editItem.quantity || 0)).toLocaleString()}
                            </td>
                            <td className="py-2 px-2 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleSaveEdit(item.id)}>
                                  <Save size={14} className="text-status-success" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditingItemId(null)}>
                                  <X size={14} className="text-status-danger" />
                                </Button>
                              </div>
                            </td>
                          </>
                        ) : (
                          /* 顯示模式 */
                          <>
                            <td className="py-2 px-3">
                              {categoryOptions.find(c => c.value === item.category)?.label || item.category}
                            </td>
                            <td className="py-2 px-3">{item.supplier_name || '-'}</td>
                            <td className="py-2 px-3">{item.description || '-'}</td>
                            <td className="py-2 px-3 text-right">
                              NT$ {(item.unit_price || 0).toLocaleString()}
                            </td>
                            <td className="py-2 px-3 text-right">{item.quantity}</td>
                            <td className="py-2 px-3 text-right font-medium text-morandi-gold">
                              NT$ {(item.subtotal || 0).toLocaleString()}
                            </td>
                            {canEdit && (
                              <td className="py-2 px-2 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => startEditItem(item)}>
                                    <Pencil size={14} className="text-morandi-secondary" />
                                  </Button>
                                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleDeleteItem(item.id)}>
                                    <Trash2 size={14} className="text-status-danger" />
                                  </Button>
                                </div>
                              </td>
                            )}
                          </>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-morandi-background/50">
                    <td colSpan={canEdit ? 5 : 5} className="py-3 px-3 text-right font-semibold">
                      合計
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-morandi-gold">
                      NT$ {(request.amount || 0).toLocaleString()}
                    </td>
                    {canEdit && <td></td>}
                  </tr>
                </tfoot>
              </table>
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
