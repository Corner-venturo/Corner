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
}

export function PaymentItemRow({
  item,
  index,
  onUpdate,
  onRemove,
  canRemove,
  isNewRow = false,
}: PaymentItemRowProps) {
  const receiptTypeLabel =
    RECEIPT_TYPE_OPTIONS.find(opt => opt.value === item.receipt_type)?.label || '現金'

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
            onValueChange={value => onUpdate(item.id, { receipt_type: Number(value) as ReceiptType })}
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

        {/* 付款人姓名 */}
        <td className="py-1.5 px-2" style={{ width: '180px' }}>
          <input
            type="text"
            value={item.receipt_account || ''}
            onChange={e => onUpdate(item.id, { receipt_account: e.target.value })}
            placeholder="輸入付款人"
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

      {/* 額外欄位行（根據收款方式顯示） */}
      {item.receipt_type !== RECEIPT_TYPES.CASH && (
        <tr
          className={cn(
            'border-b border-morandi-container/30',
            isNewRow ? 'bg-white' : 'hover:bg-morandi-container/5'
          )}
        >
          <td colSpan={6} className="py-2 px-3">
            <div className="pl-4 border-l-2 border-morandi-gold/30">
              {/* LinkPay 額外欄位 */}
              {item.receipt_type === RECEIPT_TYPES.LINK_PAY && (
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
              )}

              {/* 匯款額外欄位 */}
              {item.receipt_type === RECEIPT_TYPES.BANK_TRANSFER && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-morandi-primary mb-1 block">
                      匯入帳戶 *
                    </label>
                    <Select
                      value={item.account_info || ''}
                      onValueChange={value => onUpdate(item.id, { account_info: value })}
                    >
                      <SelectTrigger className="h-8 text-sm border-morandi-container/30">
                        <SelectValue placeholder="請選擇帳戶" />
                      </SelectTrigger>
                      <SelectContent>
                        {BANK_ACCOUNTS.map(bank => (
                          <SelectItem key={bank.value} value={bank.value}>
                            {bank.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-morandi-primary mb-1 block">
                      手續費
                    </label>
                    <Input
                      type="number"
                      value={item.fees || ''}
                      onChange={e => onUpdate(item.id, { fees: Number(e.target.value) })}
                      placeholder="選填"
                      className="h-8 text-sm border-morandi-container/30"
                    />
                  </div>
                </div>
              )}

              {/* 刷卡額外欄位 */}
              {item.receipt_type === RECEIPT_TYPES.CREDIT_CARD && (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-morandi-primary mb-1 block">
                      卡號後四碼
                    </label>
                    <Input
                      maxLength={4}
                      value={item.card_last_four || ''}
                      onChange={e =>
                        onUpdate(item.id, { card_last_four: e.target.value.replace(/\D/g, '') })
                      }
                      placeholder="1234"
                      className="h-8 text-sm border-morandi-container/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-morandi-primary mb-1 block">
                      授權碼
                    </label>
                    <Input
                      value={item.auth_code || ''}
                      onChange={e => onUpdate(item.id, { auth_code: e.target.value })}
                      placeholder="授權碼"
                      className="h-8 text-sm border-morandi-container/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-morandi-primary mb-1 block">
                      手續費
                    </label>
                    <Input
                      type="number"
                      value={item.fees || ''}
                      onChange={e => onUpdate(item.id, { fees: Number(e.target.value) })}
                      placeholder="選填"
                      className="h-8 text-sm border-morandi-container/30"
                    />
                  </div>
                </div>
              )}

              {/* 支票額外欄位 */}
              {item.receipt_type === RECEIPT_TYPES.CHECK && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-morandi-primary mb-1 block">
                      支票號碼
                    </label>
                    <Input
                      value={item.check_number || ''}
                      onChange={e => onUpdate(item.id, { check_number: e.target.value })}
                      placeholder="支票號碼"
                      className="h-8 text-sm border-morandi-container/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-morandi-primary mb-1 block">
                      開票銀行
                    </label>
                    <Input
                      value={item.check_bank || ''}
                      onChange={e => onUpdate(item.id, { check_bank: e.target.value })}
                      placeholder="銀行名稱"
                      className="h-8 text-sm border-morandi-container/30"
                    />
                  </div>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
