/**
 * Payment Item Row (Table-based Input)
 * 收款項目行（表格式輸入）
 */

import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { PaymentItem, ReceiptType } from '../types'
import { RECEIPT_TYPES, RECEIPT_TYPE_OPTIONS, BANK_ACCOUNTS } from '../types'

interface PaymentItemRowProps {
  item: PaymentItem
  index: number
  onUpdate: (id: string, updates: Partial<PaymentItem>) => void
  onRemove: (id: string) => void
  canRemove: boolean
  isNewRow?: boolean
  /** 訂單資訊，用於 LinkPay 預設值 */
  orderInfo?: {
    order_number?: string
    tour_name?: string
    contact_person?: string
    contact_email?: string
  }
}

export function PaymentItemRow({
  item,
  index,
  onUpdate,
  onRemove,
  canRemove,
  isNewRow = false,
  orderInfo,
}: PaymentItemRowProps) {
  const receiptTypeLabel =
    RECEIPT_TYPE_OPTIONS.find(opt => opt.value === item.receipt_type)?.label || '現金'

  // 當收款方式變更為 LinkPay 時，自動帶入預設值
  const handleReceiptTypeChange = (newType: ReceiptType) => {
    const updates: Partial<PaymentItem> = { receipt_type: newType }

    // 如果切換到 LinkPay，自動帶入預設值
    if (newType === RECEIPT_TYPES.LINK_PAY) {
      // 預設付款截止日為 7 天後
      if (!item.pay_dateline) {
        const deadline = new Date()
        deadline.setDate(deadline.getDate() + 7)
        updates.pay_dateline = deadline.toISOString().split('T')[0]
      }
      // 預設 Email 從訂單聯絡人
      if (!item.email && orderInfo?.contact_email) {
        updates.email = orderInfo.contact_email
      }
      // 預設收款對象從訂單聯絡人
      if (!item.receipt_account && orderInfo?.contact_person) {
        updates.receipt_account = orderInfo.contact_person.slice(0, 5) // 五字內
      }
      // 預設付款名稱
      if (!item.payment_name && orderInfo?.tour_name) {
        updates.payment_name = orderInfo.tour_name
      }
    }

    onUpdate(item.id, updates)
  }

  return (
    <>
      {/* 主要資料行 - 文青風格 */}
      <tr
        className={cn(
          'border-b border-morandi-container/30 transition-colors',
          isNewRow ? 'bg-white' : 'hover:bg-morandi-container/5'
        )}
      >
        {/* 收款方式 */}
        <td className="py-1.5 px-2" style={{ width: '110px' }}>
          <Select
            value={item.receipt_type.toString()}
            onValueChange={value => handleReceiptTypeChange(Number(value) as ReceiptType)}
          >
            <SelectTrigger className="input-no-focus h-9 border-0 shadow-none bg-transparent text-sm px-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RECEIPT_TYPE_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </td>

        {/* 金額 */}
        <td className="py-1.5 px-2" style={{ width: '120px' }}>
          <input
            type="number"
            value={item.amount || ''}
            onChange={e => onUpdate(item.id, { amount: Number(e.target.value) })}
            placeholder="0"
            className="input-no-focus w-full h-9 px-2 bg-transparent text-sm text-right placeholder:text-morandi-muted"
          />
        </td>

        {/* 交易日期 */}
        <td className="py-1.5 px-2" style={{ width: '150px' }}>
          <DatePicker
            value={item.transaction_date}
            onChange={(date) => onUpdate(item.id, { transaction_date: date })}
            className="input-no-focus h-9 border-0 shadow-none bg-transparent"
            placeholder="選擇日期"
          />
        </td>

        {/* 付款人姓名 / 收款對象 */}
        <td className="py-1.5 px-2" style={{ width: '180px' }}>
          <input
            type="text"
            value={item.receipt_account || ''}
            onChange={e => {
              // LinkPay 限制五字內
              const value = item.receipt_type === RECEIPT_TYPES.LINK_PAY
                ? e.target.value.slice(0, 5)
                : e.target.value
              onUpdate(item.id, { receipt_account: value })
            }}
            placeholder={item.receipt_type === RECEIPT_TYPES.LINK_PAY ? '收款對象(五字內)' : '輸入付款人'}
            maxLength={item.receipt_type === RECEIPT_TYPES.LINK_PAY ? 5 : undefined}
            className="input-no-focus w-full h-9 px-1 bg-transparent text-sm placeholder:text-morandi-muted"
          />
        </td>

        {/* 備註 */}
        <td className="py-1.5 px-2">
          <input
            type="text"
            value={item.note || ''}
            onChange={e => onUpdate(item.id, { note: e.target.value })}
            placeholder="備註（選填）"
            className="input-no-focus w-full h-9 px-1 bg-transparent text-sm placeholder:text-morandi-muted"
          />
        </td>

        {/* 操作 */}
        <td className="py-2 px-3 w-20 text-center">
          {canRemove && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(item.id)}
              className="h-9 text-morandi-red hover:bg-morandi-red/10"
            >
              <Trash2 size={16} />
            </Button>
          )}
        </td>
      </tr>

      {/* LinkPay 額外欄位行（只有 LinkPay 需要額外欄位） */}
      {item.receipt_type === RECEIPT_TYPES.LINK_PAY && (
        <tr
          className={cn(
            'border-b border-morandi-container/30',
            isNewRow ? 'bg-white' : 'hover:bg-morandi-container/5'
          )}
        >
          <td colSpan={6} className="py-2 px-3">
            <div className="pl-4 border-l-2 border-morandi-gold/30">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-morandi-primary mb-1 block">
                    Email *
                  </label>
                  <Input
                    type="email"
                    value={item.email || ''}
                    onChange={e => onUpdate(item.id, { email: e.target.value })}
                    placeholder="user@example.com"
                    className="h-8 text-sm border-morandi-container/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-morandi-primary mb-1 block">
                    付款截止日 *
                  </label>
                  <DatePicker
                    value={item.pay_dateline || ''}
                    onChange={(date) => onUpdate(item.id, { pay_dateline: date })}
                    className="h-8 text-sm border-morandi-container/30"
                    placeholder="選擇日期"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-morandi-primary mb-1 block">
                    付款名稱（客戶看到的）
                  </label>
                  <Input
                    value={item.payment_name || ''}
                    onChange={e => onUpdate(item.id, { payment_name: e.target.value })}
                    placeholder="例如：峇里島五日遊 - 尾款"
                    className="h-8 text-sm border-morandi-container/30"
                  />
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
