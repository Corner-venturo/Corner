/**
 * 收款項目表單組件
 */

import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DateInput } from '@/components/ui/date-input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Trash2 } from 'lucide-react'
import type { ReceiptItem } from '@/stores'
import { useAuthStore } from '@/stores/auth-store'
import { isFeatureAvailable } from '@/lib/feature-restrictions'
import { ReceiptType, RECEIPT_TYPE_OPTIONS } from '@/types/receipt.types'
import { PAYMENT_ITEM_LABELS } from '../../constants/labels'

const BANK_ACCOUNTS = [
  { value: '國泰', label: '國泰銀行' },
  { value: '合庫', label: '合作金庫' },
]

interface PaymentItemFormProps {
  item: ReceiptItem
  index: number
  onUpdate: (id: string, updates: Partial<ReceiptItem>) => void
  onRemove: (id: string) => void
  canRemove: boolean
}

export function PaymentItemForm({
  item,
  index,
  onUpdate,
  onRemove,
  canRemove,
}: PaymentItemFormProps) {
  const { user } = useAuthStore()

  // 根據 workspace 過濾收款方式選項（非 TP/TC 隱藏 LinkPay）
  const filteredReceiptTypeOptions = useMemo(() => {
    if (isFeatureAvailable('linkpay', user?.workspace_code)) {
      return RECEIPT_TYPE_OPTIONS
    }
    return RECEIPT_TYPE_OPTIONS.filter(opt => opt.value !== ReceiptType.LINK_PAY)
  }, [user?.workspace_code])

  return (
    <div className="border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium">{PAYMENT_ITEM_LABELS.ITEM_TITLE} {index + 1}</h4>
        {canRemove && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRemove(item.id)}
            className="text-morandi-red hover:text-morandi-red/80"
          >
            <Trash2 size={16} />
          </Button>
        )}
      </div>

      {/* 第一排：基本欄位 */}
      <div className="grid grid-cols-12 gap-3 mb-3">
        <div className="col-span-2">
          <label className="text-sm font-medium text-morandi-primary mb-2 block">{PAYMENT_ITEM_LABELS.PAYMENT_METHOD}</label>
          <Select
            value={item.receipt_type.toString()}
            onValueChange={value => onUpdate(item.id, { receipt_type: Number(value) })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {filteredReceiptTypeOptions.map(option => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-2">
          <label className="text-sm font-medium text-morandi-primary mb-2 block">{PAYMENT_ITEM_LABELS.AMOUNT}</label>
          <Input
            type="number"
            value={item.amount || ''}
            onChange={e => onUpdate(item.id, { amount: Number(e.target.value) })}
            placeholder={PAYMENT_ITEM_LABELS.PLEASE_ENTER_3984}
          />
        </div>

        <div className="col-span-2">
          <label className="text-sm font-medium text-morandi-primary mb-2 block">{PAYMENT_ITEM_LABELS.TRANSACTION_DATE}</label>
          <DateInput
            value={item.transaction_date}
            onChange={value => onUpdate(item.id, { transaction_date: value })}
          />
        </div>

        <div className="col-span-3">
          <label className="text-sm font-medium text-morandi-primary mb-2 block">{PAYMENT_ITEM_LABELS.PAYER_NAME}</label>
          <Input
            value={item.receipt_account || ''}
            onChange={e => onUpdate(item.id, { receipt_account: e.target.value })}
          />
        </div>

        <div className="col-span-3">
          <label className="text-sm font-medium text-morandi-primary mb-2 block">{PAYMENT_ITEM_LABELS.REMARKS}</label>
          <Input
            value={item.notes || ''}
            onChange={e => onUpdate(item.id, { notes: e.target.value })}
            placeholder={PAYMENT_ITEM_LABELS.OPTIONAL}
          />
        </div>
      </div>

      {/* 第二排：LinkPay 專屬欄位 */}
      {item.receipt_type === ReceiptType.LINK_PAY && (
        <div className="grid grid-cols-12 gap-3 pt-3 border-t">
          <div className="col-span-4">
            <label className="text-sm font-medium text-morandi-primary mb-2 block">Email *</label>
            <Input
              type="email"
              value={item.email || ''}
              onChange={e => onUpdate(item.id, { email: e.target.value })}
              placeholder="user@example.com"
            />
          </div>

          <div className="col-span-4">
            <label className="text-sm font-medium text-morandi-primary mb-2 block">
              {PAYMENT_ITEM_LABELS.LABEL_6186}
            </label>
            <DateInput
              value={item.pay_dateline || ''}
              onChange={value => onUpdate(item.id, { pay_dateline: value })}
            />
          </div>

          <div className="col-span-4">
            <label className="text-sm font-medium text-morandi-primary mb-2 block">
              {PAYMENT_ITEM_LABELS.LABEL_4673}
            </label>
            <Input
              value={item.payment_name || ''}
              onChange={e => onUpdate(item.id, { payment_name: e.target.value })}
              placeholder={PAYMENT_ITEM_LABELS.EXAMPLE_4757}
            />
          </div>
        </div>
      )}

      {/* 第二排：現金專屬欄位 */}
      {item.receipt_type === ReceiptType.CASH && (
        <div className="grid grid-cols-12 gap-3 pt-3 border-t">
          <div className="col-span-4">
            <label className="text-sm font-medium text-morandi-primary mb-2 block">{PAYMENT_ITEM_LABELS.HANDLER}</label>
            <Input
              value={item.handler_name || ''}
              onChange={e => onUpdate(item.id, { handler_name: e.target.value })}
              placeholder={PAYMENT_ITEM_LABELS.PLEASE_ENTER_2071}
            />
          </div>
        </div>
      )}

      {/* 第二排：匯款專屬欄位 */}
      {item.receipt_type === ReceiptType.BANK_TRANSFER && (
        <div className="grid grid-cols-12 gap-3 pt-3 border-t">
          <div className="col-span-4">
            <label className="text-sm font-medium text-morandi-primary mb-2 block">
              {PAYMENT_ITEM_LABELS.LABEL_7063}
            </label>
            <Select
              value={item.account_info || ''}
              onValueChange={value => onUpdate(item.id, { account_info: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder={PAYMENT_ITEM_LABELS.PLEASE_SELECT_578} />
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

          <div className="col-span-4">
            <label className="text-sm font-medium text-morandi-primary mb-2 block">{PAYMENT_ITEM_LABELS.HANDLING_FEE}</label>
            <Input
              type="number"
              value={item.fees || ''}
              onChange={e => onUpdate(item.id, { fees: Number(e.target.value) })}
              placeholder={PAYMENT_ITEM_LABELS.LABEL_1988}
            />
          </div>
        </div>
      )}

      {/* 第二排：刷卡專屬欄位 */}
      {item.receipt_type === ReceiptType.CREDIT_CARD && (
        <div className="grid grid-cols-12 gap-3 pt-3 border-t">
          <div className="col-span-3">
            <label className="text-sm font-medium text-morandi-primary mb-2 block">
              {PAYMENT_ITEM_LABELS.LABEL_1306}
            </label>
            <Input
              maxLength={4}
              value={item.card_last_four || ''}
              onChange={e =>
                onUpdate(item.id, { card_last_four: e.target.value.replace(/\D/g, '') })
              }
              placeholder="1234"
            />
          </div>

          <div className="col-span-3">
            <label className="text-sm font-medium text-morandi-primary mb-2 block">{PAYMENT_ITEM_LABELS.AUTH_CODE}</label>
            <Input
              value={item.auth_code || ''}
              onChange={e => onUpdate(item.id, { auth_code: e.target.value })}
              placeholder={PAYMENT_ITEM_LABELS.PLEASE_ENTER_1445}
            />
          </div>

          <div className="col-span-3">
            <label className="text-sm font-medium text-morandi-primary mb-2 block">{PAYMENT_ITEM_LABELS.HANDLING_FEE}</label>
            <Input
              type="number"
              value={item.fees || ''}
              onChange={e => onUpdate(item.id, { fees: Number(e.target.value) })}
              placeholder={PAYMENT_ITEM_LABELS.LABEL_1988}
            />
          </div>
        </div>
      )}

      {/* 第二排：支票專屬欄位 */}
      {item.receipt_type === ReceiptType.CHECK && (
        <div className="grid grid-cols-12 gap-3 pt-3 border-t">
          <div className="col-span-4">
            <label className="text-sm font-medium text-morandi-primary mb-2 block">{PAYMENT_ITEM_LABELS.LABEL_9924}</label>
            <Input
              value={item.check_number || ''}
              onChange={e => onUpdate(item.id, { check_number: e.target.value })}
              placeholder={PAYMENT_ITEM_LABELS.PLEASE_ENTER_8853}
            />
          </div>

          <div className="col-span-4">
            <label className="text-sm font-medium text-morandi-primary mb-2 block">{PAYMENT_ITEM_LABELS.LABEL_7421}</label>
            <Input
              value={item.check_bank || ''}
              onChange={e => onUpdate(item.id, { check_bank: e.target.value })}
              placeholder={PAYMENT_ITEM_LABELS.PLEASE_ENTER_2131}
            />
          </div>
        </div>
      )}
    </div>
  )
}
