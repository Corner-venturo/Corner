/**
 * 收款項目表單組件
 */

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Trash2 } from 'lucide-react'
import type { ReceiptItem } from '@/stores'

const RECEIPT_TYPES = {
  BANK_TRANSFER: 0,
  CASH: 1,
  CREDIT_CARD: 2,
  CHECK: 3,
  LINK_PAY: 4,
} as const

const RECEIPT_TYPE_OPTIONS = [
  { value: RECEIPT_TYPES.CASH, label: '現金' },
  { value: RECEIPT_TYPES.BANK_TRANSFER, label: '匯款' },
  { value: RECEIPT_TYPES.CREDIT_CARD, label: '刷卡' },
  { value: RECEIPT_TYPES.CHECK, label: '支票' },
  { value: RECEIPT_TYPES.LINK_PAY, label: 'LinkPay' },
]

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
  return (
    <div className="border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium">收款項目 {index + 1}</h4>
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
          <label className="text-sm font-medium text-morandi-primary mb-2 block">收款方式 *</label>
          <Select
            value={item.receipt_type.toString()}
            onValueChange={value => onUpdate(item.id, { receipt_type: Number(value) })}
          >
            <SelectTrigger>
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
        </div>

        <div className="col-span-2">
          <label className="text-sm font-medium text-morandi-primary mb-2 block">金額 *</label>
          <Input
            type="number"
            value={item.amount || ''}
            onChange={e => onUpdate(item.id, { amount: Number(e.target.value) })}
            placeholder="請輸入金額"
          />
        </div>

        <div className="col-span-2">
          <label className="text-sm font-medium text-morandi-primary mb-2 block">交易日期 *</label>
          <Input
            type="date"
            value={item.transaction_date}
            onChange={e => onUpdate(item.id, { transaction_date: e.target.value })}
          />
        </div>

        <div className="col-span-3">
          <label className="text-sm font-medium text-morandi-primary mb-2 block">付款人姓名</label>
          <Input
            value={item.receipt_account || ''}
            onChange={e => onUpdate(item.id, { receipt_account: e.target.value })}
            placeholder="請輸入付款人姓名"
          />
        </div>

        <div className="col-span-3">
          <label className="text-sm font-medium text-morandi-primary mb-2 block">備註</label>
          <Input
            value={item.note || ''}
            onChange={e => onUpdate(item.id, { note: e.target.value })}
            placeholder="選填"
          />
        </div>
      </div>

      {/* 第二排：LinkPay 專屬欄位 */}
      {item.receipt_type === RECEIPT_TYPES.LINK_PAY && (
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
              付款截止日 *
            </label>
            <Input
              type="date"
              value={item.pay_dateline || ''}
              onChange={e => onUpdate(item.id, { pay_dateline: e.target.value })}
            />
          </div>

          <div className="col-span-4">
            <label className="text-sm font-medium text-morandi-primary mb-2 block">
              付款名稱（客戶看到的）
            </label>
            <Input
              value={item.payment_name || ''}
              onChange={e => onUpdate(item.id, { payment_name: e.target.value })}
              placeholder="例如：峇里島五日遊 - 尾款"
            />
          </div>
        </div>
      )}

      {/* 第二排：現金專屬欄位 */}
      {item.receipt_type === RECEIPT_TYPES.CASH && (
        <div className="grid grid-cols-12 gap-3 pt-3 border-t">
          <div className="col-span-4">
            <label className="text-sm font-medium text-morandi-primary mb-2 block">經手人</label>
            <Input
              value={item.handler_name || ''}
              onChange={e => onUpdate(item.id, { handler_name: e.target.value })}
              placeholder="請輸入經手人姓名"
            />
          </div>
        </div>
      )}

      {/* 第二排：匯款專屬欄位 */}
      {item.receipt_type === RECEIPT_TYPES.BANK_TRANSFER && (
        <div className="grid grid-cols-12 gap-3 pt-3 border-t">
          <div className="col-span-4">
            <label className="text-sm font-medium text-morandi-primary mb-2 block">
              匯入帳戶 *
            </label>
            <Select
              value={item.account_info || ''}
              onValueChange={value => onUpdate(item.id, { account_info: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="請選擇匯入帳戶" />
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
            <label className="text-sm font-medium text-morandi-primary mb-2 block">手續費</label>
            <Input
              type="number"
              value={item.fees || ''}
              onChange={e => onUpdate(item.id, { fees: Number(e.target.value) })}
              placeholder="選填，如有手續費"
            />
          </div>
        </div>
      )}

      {/* 第二排：刷卡專屬欄位 */}
      {item.receipt_type === RECEIPT_TYPES.CREDIT_CARD && (
        <div className="grid grid-cols-12 gap-3 pt-3 border-t">
          <div className="col-span-3">
            <label className="text-sm font-medium text-morandi-primary mb-2 block">
              卡號後四碼
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
            <label className="text-sm font-medium text-morandi-primary mb-2 block">授權碼</label>
            <Input
              value={item.auth_code || ''}
              onChange={e => onUpdate(item.id, { auth_code: e.target.value })}
              placeholder="請輸入授權碼"
            />
          </div>

          <div className="col-span-3">
            <label className="text-sm font-medium text-morandi-primary mb-2 block">手續費</label>
            <Input
              type="number"
              value={item.fees || ''}
              onChange={e => onUpdate(item.id, { fees: Number(e.target.value) })}
              placeholder="選填，如有手續費"
            />
          </div>
        </div>
      )}

      {/* 第二排：支票專屬欄位 */}
      {item.receipt_type === RECEIPT_TYPES.CHECK && (
        <div className="grid grid-cols-12 gap-3 pt-3 border-t">
          <div className="col-span-4">
            <label className="text-sm font-medium text-morandi-primary mb-2 block">支票號碼</label>
            <Input
              value={item.check_number || ''}
              onChange={e => onUpdate(item.id, { check_number: e.target.value })}
              placeholder="請輸入支票號碼"
            />
          </div>

          <div className="col-span-4">
            <label className="text-sm font-medium text-morandi-primary mb-2 block">開票銀行</label>
            <Input
              value={item.check_bank || ''}
              onChange={e => onUpdate(item.id, { check_bank: e.target.value })}
              placeholder="請輸入銀行名稱"
            />
          </div>
        </div>
      )}
    </div>
  )
}
