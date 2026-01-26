'use client'

import { useState, useEffect } from 'react'
import { X, Check, FileText } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/date-picker'
import { CurrencyCell } from '@/components/table-cells'
import { useTravelInvoiceStore, BuyerInfo, TravelInvoiceItem } from '@/stores/useTravelInvoiceStore'
import { useAuthStore } from '@/stores'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { toast } from 'sonner'
import { logger } from '@/lib/utils/logger'

interface IssueInvoiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderId: string
  tourId: string
  orderNumber?: string
  contactPerson?: string
  workspaceId?: string
  onSuccess?: () => void
}

interface InvoiceSummary {
  paid_amount: number
  invoiced_amount: number
  invoiceable_amount: number
}

export function IssueInvoiceDialog({
  open,
  onOpenChange,
  orderId,
  tourId,
  orderNumber,
  contactPerson,
  workspaceId,
  onSuccess,
}: IssueInvoiceDialogProps) {
  const user = useAuthStore(state => state.user)
  const { issueInvoice, isLoading } = useTravelInvoiceStore()

  const [summary, setSummary] = useState<InvoiceSummary | null>(null)
  const [loadingSummary, setLoadingSummary] = useState(true)

  // 表單狀態
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0])
  const [amount, setAmount] = useState<number>(0)
  const [buyerName, setBuyerName] = useState(contactPerson || '')
  const [buyerUBN, setBuyerUBN] = useState('')
  const [buyerEmail, setBuyerEmail] = useState('')
  const [itemName, setItemName] = useState('旅遊服務費')

  // 載入訂單發票資訊
  useEffect(() => {
    if (open && orderId) {
      loadInvoiceSummary()
    }
  }, [open, orderId])

  const loadInvoiceSummary = async () => {
    try {
      setLoadingSummary(true)
      const supabase = getSupabaseAdminClient()

      const { data } = await supabase
        .from('orders_invoice_summary')
        .select('*')
        .eq('order_id', orderId)
        .single()

      if (data) {
        const summaryData = {
          paid_amount: Number(data.paid_amount || 0),
          invoiced_amount: Number(data.invoiced_amount || 0),
          invoiceable_amount: Number(data.invoiceable_amount || 0),
        }
        setSummary(summaryData)
        setAmount(summaryData.invoiceable_amount)
      }
    } catch (error) {
      logger.error('載入發票資訊失敗:', error)
    } finally {
      setLoadingSummary(false)
    }
  }

  const handleIssue = async () => {
    if (!buyerName) {
      toast.error('請輸入買受人名稱')
      return
    }

    if (amount <= 0) {
      toast.error('發票金額必須大於 0')
      return
    }

    if (summary && amount > summary.invoiceable_amount) {
      toast.error(`發票金額不能超過可開金額 ${summary.invoiceable_amount}`)
      return
    }

    try {
      const buyerInfo: BuyerInfo = {
        buyerName,
        buyerUBN: buyerUBN || undefined,
        buyerEmail: buyerEmail || undefined,
      }

      const items: TravelInvoiceItem[] = [
        {
          item_name: itemName || '旅遊服務費',
          item_count: 1,
          item_unit: '式',
          item_price: amount,
          itemAmt: amount,
        },
      ]

      await issueInvoice({
        invoice_date: invoiceDate,
        total_amount: amount,
        tax_type: 'dutiable',
        buyerInfo,
        items,
        orders: [{ order_id: orderId, amount }],
        tour_id: tourId,
        created_by: user?.id || '',
        workspace_id: workspaceId,
      })

      toast.success('發票開立成功')
      onOpenChange(false)
      onSuccess?.()

      // 重置表單
      setBuyerName('')
      setBuyerUBN('')
      setBuyerEmail('')
      setAmount(0)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '開立失敗')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent level={2} className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText size={20} />
            開立發票
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 訂單資訊 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">訂單資訊</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-morandi-secondary">訂單編號：</span>
                  <span className="font-medium">{orderNumber}</span>
                </div>
                <div>
                  <span className="text-morandi-secondary">聯絡人：</span>
                  <span className="font-medium">{contactPerson}</span>
                </div>
              </div>

              {loadingSummary ? (
                <p className="text-sm text-morandi-secondary mt-3">載入中...</p>
              ) : summary ? (
                <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t">
                  <div>
                    <p className="text-xs text-morandi-secondary">已收款</p>
                    <p className="font-medium">
                      <CurrencyCell amount={summary.paid_amount} />
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-morandi-secondary">已開發票</p>
                    <p className="font-medium">
                      <CurrencyCell amount={summary.invoiced_amount} />
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-morandi-secondary">可開金額</p>
                    <p className="font-medium text-morandi-gold">
                      <CurrencyCell amount={summary.invoiceable_amount} />
                    </p>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* 發票資訊 */}
          <div className="space-y-3">
            <div>
              <Label>發票金額 *</Label>
              <Input
                type="number"
                value={amount}
                onChange={e => setAmount(Number(e.target.value))}
                placeholder="輸入發票金額"
                max={summary?.invoiceable_amount}
              />
              {summary && amount > summary.invoiceable_amount && (
                <p className="text-xs text-morandi-red mt-1">金額超過可開金額</p>
              )}
            </div>

            <div>
              <Label>品名</Label>
              <Input
                value={itemName}
                onChange={e => setItemName(e.target.value)}
                placeholder="旅遊服務費"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>買受人名稱 *</Label>
                <Input
                  value={buyerName}
                  onChange={e => setBuyerName(e.target.value)}
                  placeholder="請輸入買受人名稱"
                />
              </div>
              <div>
                <Label>統一編號</Label>
                <Input
                  value={buyerUBN}
                  onChange={e => setBuyerUBN(e.target.value)}
                  placeholder="8 碼數字"
                  maxLength={8}
                />
              </div>
            </div>

            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={buyerEmail}
                onChange={e => setBuyerEmail(e.target.value)}
                placeholder="發票通知信箱"
              />
            </div>

            <div>
              <Label>開立日期 *</Label>
              <DatePicker value={invoiceDate} onChange={setInvoiceDate} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="gap-2">
            <X size={16} />
            取消
          </Button>
          <Button
            onClick={handleIssue}
            disabled={!buyerName || amount <= 0 || isLoading || Boolean(summary && amount > summary.invoiceable_amount)}
            className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-2"
          >
            <Check size={16} />
            {isLoading ? '開立中...' : '開立發票'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
