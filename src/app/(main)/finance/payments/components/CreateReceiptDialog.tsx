/**
 * 新增收款單 Dialog
 */

import { getTodayString } from '@/lib/utils/format-date'
import { useState, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Save, X } from 'lucide-react'
import { PaymentItemForm } from './PaymentItemForm'
import { Combobox } from '@/components/ui/combobox'
import { useToursSlim } from '@/data'
import { CurrencyCell } from '@/components/table-cells'
import type { ReceiptItem, Order } from '@/stores'
import { ReceiptType } from '@/types/receipt.types'
import { CREATE_RECEIPT_LABELS } from '../../constants/labels'

interface CreateReceiptDialogProps {
  isOpen: boolean
  onClose: () => void
  availableOrders: Order[]
  onSubmit: (data: { selectedOrderId: string; paymentItems: ReceiptItem[] }) => Promise<void>
}

export function CreateReceiptDialog({
  isOpen,
  onClose,
  availableOrders,
  onSubmit,
}: CreateReceiptDialogProps) {
  const { items: tours } = useToursSlim()
  const [selectedTourId, setSelectedTourId] = useState('')
  const [selectedOrderId, setSelectedOrderId] = useState('')
  const [paymentItems, setPaymentItems] = useState<ReceiptItem[]>([
    {
      id: '1',
      receipt_type: ReceiptType.BANK_TRANSFER,
      amount: 0,
      transaction_date: getTodayString(),
    },
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 可用訂單（根據選中的團體過濾）
  const filteredOrders = useMemo(() => {
    if (!selectedTourId) return []
    return availableOrders.filter(order => order.tour_id === selectedTourId)
  }, [availableOrders, selectedTourId])

  const selectedOrder = filteredOrders.find(order => order.id === selectedOrderId)

  const totalAmount = paymentItems.reduce((sum, item) => sum + (item.amount || 0), 0)

  const addPaymentItem = () => {
    const newItem: ReceiptItem = {
      id: Date.now().toString(),
      receipt_type: ReceiptType.BANK_TRANSFER,
      amount: 0,
      transaction_date: getTodayString(),
    }
    setPaymentItems(prev => [...prev, newItem])
  }

  const removePaymentItem = (id: string) => {
    if (paymentItems.length > 1) {
      setPaymentItems(prev => prev.filter(item => item.id !== id))
    }
  }

  const updatePaymentItem = (id: string, updates: Partial<ReceiptItem>) => {
    setPaymentItems(prev => prev.map(item => (item.id === id ? { ...item, ...updates } : item)))
  }

  const resetForm = () => {
    setSelectedTourId('')
    setSelectedOrderId('')
    setPaymentItems([
      {
        id: '1',
        receipt_type: ReceiptType.BANK_TRANSFER,
        amount: 0,
        transaction_date: getTodayString(),
      },
    ])
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      await onSubmit({ selectedOrderId, paymentItems })
      resetForm()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    onClose()
    resetForm()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent level={1} className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">{CREATE_RECEIPT_LABELS.TITLE}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 基本資訊 */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{CREATE_RECEIPT_LABELS.BASIC_INFO}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 選擇團體 */}
              <div>
                <label className="text-sm font-medium text-morandi-primary mb-2 block">
                  {CREATE_RECEIPT_LABELS.SELECT_1269}
                </label>
                <Combobox
                  options={tours.filter(t => t.id).map(tour => ({
                    value: tour.id!,
                    label: `${tour.code || ''} - ${tour.name || ''}`,
                  }))}
                  value={selectedTourId}
                  onChange={value => {
                    setSelectedTourId(value)
                    setSelectedOrderId('') // 清空已選訂單
                  }}
                  placeholder={CREATE_RECEIPT_LABELS.SELECT_8066}
                />
              </div>

              {/* 選擇訂單 */}
              <div>
                <label className="text-sm font-medium text-morandi-primary mb-2 block">
                  {CREATE_RECEIPT_LABELS.SELECT_8775}
                </label>
                <Select
                  disabled={!selectedTourId || filteredOrders.length === 0}
                  value={selectedOrderId}
                  onValueChange={setSelectedOrderId}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        !selectedTourId
                          ? CREATE_RECEIPT_LABELS.SELECT_8066
                          : filteredOrders.length === 0
                            ? CREATE_RECEIPT_LABELS.NO_ORDERS
                            : CREATE_RECEIPT_LABELS.SELECT_ORDER_PLACEHOLDER
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredOrders.map(order => (
                      <SelectItem key={order.id} value={order.id}>
                        <div>
                          <div className="font-medium">
                            {order.order_number} - {order.contact_person}
                          </div>
                          <div className="text-sm text-morandi-secondary flex items-center gap-1">
                            {CREATE_RECEIPT_LABELS.REMAINING_PREFIX}<CurrencyCell amount={order.remaining_amount || 0} />
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedOrder && (
                <div>
                  <label className="text-sm font-medium text-morandi-primary mb-2 block">
                    {CREATE_RECEIPT_LABELS.LABEL_6150}
                  </label>
                  <div className="flex h-10 w-full rounded-md border border-input bg-morandi-container/30 px-3 py-2 text-sm">
                    <CurrencyCell amount={selectedOrder.remaining_amount || 0} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 收款項目 */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{CREATE_RECEIPT_LABELS.PAYMENT_ITEMS}</h3>
              <Button onClick={addPaymentItem} variant="outline" size="sm">
                <Plus size={16} className="mr-2" />
                {CREATE_RECEIPT_LABELS.ADD_2089}
              </Button>
            </div>

            <div className="space-y-4">
              {paymentItems.map((item, index) => (
                <PaymentItemForm
                  key={item.id}
                  item={item}
                  index={index}
                  onUpdate={updatePaymentItem}
                  onRemove={removePaymentItem}
                  canRemove={paymentItems.length > 1}
                />
              ))}
            </div>
          </div>

          {/* 摘要 */}
          <div className="bg-morandi-container/20 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">{CREATE_RECEIPT_LABELS.TOTAL_AMOUNT}</span>
              <CurrencyCell amount={totalAmount} className="text-2xl font-bold text-morandi-gold" />
            </div>
          </div>

          {/* 操作按鈕 */}
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={handleClose} disabled={isSubmitting} className="gap-2">
              <X size={16} />
              {CREATE_RECEIPT_LABELS.CANCEL}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedOrderId || totalAmount <= 0 || isSubmitting}
              className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-2"
            >
              <Save size={16} />
              {isSubmitting ? CREATE_RECEIPT_LABELS.SUBMITTING : CREATE_RECEIPT_LABELS.SAVE_RECEIPT}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
