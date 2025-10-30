'use client'

import { useState } from 'react'
import { X, DollarSign, Calendar } from 'lucide-react'
import { useReceiptOrderStore } from '@/stores'

interface CreateReceiptDialogProps {
  order: {
    id: string
    order_number: string
    contact_person: string
    total_amount: number
    paid_amount: number
    gap: number
  }
  onClose: () => void
  onSuccess: (receiptId: string) => void
}

export function CreateReceiptDialog({ order, onClose, onSuccess }: CreateReceiptDialogProps) {
  const { create: createReceipt } = useReceiptOrderStore()

  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split('T')[0])
  const [paymentMethod, setPaymentMethod] = useState<'現金' | '匯款' | '刷卡' | '支票'>('匯款')
  const [amount, setAmount] = useState(order.gap.toString())
  const [note, setNote] = useState('')

  const handleCreate = async () => {
    try {
      const receiptData = {
        order_id: order.id,
        order_number: order.order_number,
        tour_id: '', // 從訂單取得 tour_id
        code: '', // 從訂單取得 code
        tour_name: '', // 從訂單取得 tour_name
        contact_person: order.contact_person,
        receipt_date: receiptDate,
        payment_items: [
          {
            payment_method: paymentMethod,
            amount: parseFloat(amount),
            transaction_date: receiptDate,
            note,
          },
        ],
        total_amount: parseFloat(amount),
        status: '已收款' as const,
        note,
        created_by: 'current-user', // 從 auth store 取得
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const receipt = await createReceipt(receiptData as unknown)
      onSuccess(receipt.id)
      onClose()
    } catch (error) {
      alert('建立收款單失敗，請稍後再試')
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/20 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div className="card-morandi-elevated w-[500px]" onClick={e => e.stopPropagation()}>
        {/* 標題列 */}
        <div className="flex items-center justify-between pb-3 border-b border-morandi-gold/20">
          <div className="flex items-center gap-2">
            <DollarSign className="text-morandi-gold" size={20} />
            <h3 className="text-lg font-semibold text-morandi-primary">建立收款單</h3>
          </div>
          <button onClick={onClose} className="btn-icon-morandi !w-8 !h-8">
            <X size={16} />
          </button>
        </div>

        {/* 內容 */}
        <div className="space-y-4 my-4">
          {/* 訂單資訊 */}
          <div className="bg-morandi-container/5 rounded-lg p-3 border border-morandi-gold/20">
            <div className="text-sm font-medium text-morandi-secondary mb-2">訂單資訊：</div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-morandi-secondary">訂單號：</span>
                <span className="font-medium text-morandi-primary">{order.order_number}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-morandi-secondary">客戶：</span>
                <span className="text-morandi-primary">{order.contact_person}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-morandi-secondary">總額：</span>
                <span className="text-morandi-primary">${order.total_amount.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-morandi-secondary">已收：</span>
                <span className="text-morandi-primary">${order.paid_amount.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm pt-2 border-t border-morandi-gold/20">
                <span className="text-morandi-secondary">待收金額：</span>
                <span className="text-lg font-semibold text-red-600">
                  ${order.gap.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* 收款日期 */}
          <div>
            <label className="block text-sm font-medium text-morandi-secondary mb-2">
              收款日期
            </label>
            <div className="relative">
              <input
                type="date"
                value={receiptDate}
                onChange={e => setReceiptDate(e.target.value)}
                className="pl-10"
              />
              <Calendar
                className="absolute left-3 top-1/2 -translate-y-1/2 text-morandi-secondary"
                size={16}
              />
            </div>
          </div>

          {/* 收款方式 */}
          <div>
            <label className="block text-sm font-medium text-morandi-secondary mb-2">
              收款方式
            </label>
            <select
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value as unknown)}
            >
              <option value="現金">現金</option>
              <option value="匯款">匯款</option>
              <option value="刷卡">刷卡</option>
              <option value="支票">支票</option>
            </select>
          </div>

          {/* 收款金額 */}
          <div>
            <label className="block text-sm font-medium text-morandi-secondary mb-2">
              收款金額
            </label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="輸入收款金額"
            />
          </div>

          {/* 備註 */}
          <div>
            <label className="block text-sm font-medium text-morandi-secondary mb-2">
              備註（選填）
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={3}
              placeholder="輸入備註..."
            />
          </div>
        </div>

        {/* 底部操作按鈕 */}
        <div className="flex gap-2 justify-end pt-3 border-t border-morandi-gold/20">
          <button className="btn-morandi-secondary !py-2 !px-4" onClick={onClose}>
            取消
          </button>
          <button
            className="btn-morandi-primary !py-2 !px-4"
            onClick={handleCreate}
            disabled={!amount || parseFloat(amount) <= 0}
          >
            建立收款單
          </button>
        </div>
      </div>
    </div>
  )
}
