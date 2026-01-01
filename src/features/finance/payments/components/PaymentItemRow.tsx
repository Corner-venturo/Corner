/**
 * Payment Item Row (Table-based Input)
 * 收款項目行（表格式輸入）
 */

import { useState } from 'react'
import { Link2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { useToast } from '@/components/ui/use-toast'
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
  const { toast } = useToast()
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedLink, setGeneratedLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const receiptTypeLabel =
    RECEIPT_TYPE_OPTIONS.find(opt => opt.value === item.receipt_type)?.label || '現金'

  // 產生 LinkPay 連結
  const handleGenerateLink = async () => {
    if (!item.email || !item.amount || !item.pay_dateline) {
      toast({
        title: '請填寫必要欄位',
        description: 'Email、金額、付款截止日為必填',
        variant: 'destructive',
      })
      return
    }

    setIsGenerating(true)
    try {
      const { useAuthStore } = await import('@/stores')
      const user = useAuthStore.getState().user

      const response = await fetch('/api/linkpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiptNumber: `PREVIEW-${Date.now()}`, // 預覽用臨時編號
          userName: item.receipt_account || '',
          email: item.email,
          paymentName: item.payment_name || orderInfo?.tour_name || '',
          createUser: user?.id || '',
          amount: item.amount,
          endDate: item.pay_dateline,
        }),
      })
      const data = await response.json()
      if (data.success && data.data?.paymentLink) {
        setGeneratedLink(data.data.paymentLink)
        toast({
          title: '連結產生成功',
          description: '可複製連結發送給客戶',
        })
      } else {
        throw new Error(data.error || '產生連結失敗')
      }
    } catch (error) {
      toast({
        title: '產生連結失敗',
        description: error instanceof Error ? error.message : '請稍後再試',
        variant: 'destructive',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopyLink = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

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
      {/* 主要資料行 */}
      <tr>
        {/* 收款方式 */}
        <td className="py-2 px-3 border border-border">
          <Select
            value={item.receipt_type.toString()}
            onValueChange={value => handleReceiptTypeChange(Number(value) as ReceiptType)}
          >
            <SelectTrigger className="h-auto p-0 border-0 shadow-none bg-transparent text-sm">
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

        {/* 交易日期 */}
        <td className="py-2 px-3 border border-border">
          <DatePicker
            value={item.transaction_date}
            onChange={(date) => onUpdate(item.id, { transaction_date: date })}
            placeholder="選擇日期"
            buttonClassName="h-auto p-0 border-0 shadow-none bg-transparent"
          />
        </td>

        {/* 付款人姓名 / 收款對象 */}
        <td className="py-2 px-3 border border-border">
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
            className="w-full bg-transparent outline-none text-sm"
          />
        </td>

        {/* 備註 */}
        <td className="py-2 px-3 border border-border">
          <input
            type="text"
            value={item.note || ''}
            onChange={e => onUpdate(item.id, { note: e.target.value })}
            placeholder="備註（選填）"
            className="w-full bg-transparent outline-none text-sm"
          />
        </td>

        {/* 金額 */}
        <td className="py-2 px-3 border border-border text-right">
          <input
            type="number"
            value={item.amount || ''}
            onChange={e => onUpdate(item.id, { amount: Number(e.target.value) })}
            placeholder="0"
            className="w-full bg-transparent outline-none text-sm text-right"
          />
        </td>

        {/* 操作 */}
        <td className="py-2 px-3 border border-border text-center">
          {canRemove && (
            <span
              onClick={() => onRemove(item.id)}
              className="text-morandi-secondary cursor-pointer hover:text-morandi-red text-sm"
              title="刪除"
            >
              ✕
            </span>
          )}
        </td>
      </tr>

      {/* LinkPay 額外欄位 - 表頭 */}
      {item.receipt_type === RECEIPT_TYPES.LINK_PAY && (
        <tr className="text-xs text-morandi-secondary font-medium bg-morandi-gold/10">
          <th className="text-left py-2 px-3 border border-border">Email *</th>
          <th className="text-left py-2 px-3 border border-border">付款截止日 *</th>
          <th className="text-left py-2 px-3 border border-border" colSpan={2}>付款名稱（客戶看到的）</th>
          <th className="border border-border" colSpan={2}></th>
        </tr>
      )}

      {/* LinkPay 額外欄位 - 輸入 */}
      {item.receipt_type === RECEIPT_TYPES.LINK_PAY && (
        <tr>
          <td className="py-2 px-3 border border-border">
            <input
              type="email"
              value={item.email || ''}
              onChange={e => onUpdate(item.id, { email: e.target.value })}
              placeholder="user@example.com"
              className="w-full bg-transparent outline-none text-sm"
            />
          </td>
          <td className="py-2 px-3 border border-border">
            <DatePicker
              value={item.pay_dateline || ''}
              onChange={(date) => onUpdate(item.id, { pay_dateline: date })}
              placeholder="選擇日期"
              buttonClassName="h-auto p-0 border-0 shadow-none bg-transparent"
            />
          </td>
          <td className="py-2 px-3 border border-border" colSpan={2}>
            <input
              type="text"
              value={item.payment_name || ''}
              onChange={e => onUpdate(item.id, { payment_name: e.target.value })}
              placeholder="例如：峇里島五日遊 - 尾款"
              className="w-full bg-transparent outline-none text-sm"
            />
          </td>
          <td className="py-2 px-3 border border-border text-center" colSpan={2}>
            <Button
              type="button"
              onClick={handleGenerateLink}
              disabled={isGenerating || !item.email || !item.amount || !item.pay_dateline}
              size="sm"
              className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-1"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  產生中...
                </>
              ) : (
                <>
                  <Link2 size={14} />
                  產生連結
                </>
              )}
            </Button>
          </td>
        </tr>
      )}

      {/* LinkPay 產生的連結 */}
      {item.receipt_type === RECEIPT_TYPES.LINK_PAY && generatedLink && (
        <tr className="bg-morandi-gold/5">
          <td className="py-2 px-3 border border-border text-xs text-morandi-secondary">付款連結</td>
          <td className="py-2 px-3 border border-border" colSpan={3}>
            <input
              type="text"
              value={generatedLink}
              readOnly
              className="w-full bg-transparent outline-none text-xs"
            />
          </td>
          <td className="py-2 px-3 border border-border text-center" colSpan={2}>
            <span
              onClick={handleCopyLink}
              className="text-morandi-gold cursor-pointer hover:text-morandi-gold-hover text-sm mr-3"
            >
              {copied ? '✓ 已複製' : '複製'}
            </span>
            <span
              onClick={() => window.open(generatedLink, '_blank')}
              className="text-morandi-secondary cursor-pointer hover:text-morandi-primary text-sm"
            >
              開啟
            </span>
          </td>
        </tr>
      )}
    </>
  )
}
