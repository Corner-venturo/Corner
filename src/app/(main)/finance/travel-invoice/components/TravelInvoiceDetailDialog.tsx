'use client'

/**
 * 發票詳情 Dialog
 * 從 [id]/page.tsx 轉換而來
 */

import { useState, useEffect } from 'react'
import { FileText, FileX, X, Check } from 'lucide-react'
import { CurrencyCell, DateCell } from '@/components/table-cells'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTravelInvoiceStore } from '@/stores/useTravelInvoiceStore'
import { alert } from '@/lib/ui/alert-dialog'
import type { TravelInvoice } from '@/stores/useTravelInvoiceStore'

interface TravelInvoiceDetailDialogProps {
  invoice: TravelInvoice | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TravelInvoiceDetailDialog({
  invoice,
  open,
  onOpenChange,
}: TravelInvoiceDetailDialogProps) {
  const { voidInvoice, isLoading } = useTravelInvoiceStore()

  const [showVoidDialog, setShowVoidDialog] = useState(false)
  const [voidReason, setVoidReason] = useState('')

  // Reset void reason when dialog closes
  useEffect(() => {
    if (!open) {
      setVoidReason('')
      setShowVoidDialog(false)
    }
  }, [open])

  const handleVoid = async () => {
    if (!invoice) return
    if (!voidReason.trim()) {
      await alert('請填寫作廢原因', 'error')
      return
    }

    try {
      await voidInvoice(invoice.id, voidReason, 'current_user')
      setShowVoidDialog(false)
      setVoidReason('')
    } catch (error) {
      await alert(error instanceof Error ? error.message : '發生未知錯誤', 'error')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pending: { label: '待處理', variant: 'secondary' },
      issued: { label: '已開立', variant: 'default' },
      voided: { label: '已作廢', variant: 'destructive' },
      allowance: { label: '已折讓', variant: 'outline' },
      failed: { label: '失敗', variant: 'destructive' },
    }
    const config = statusMap[status] || { label: status, variant: 'secondary' as const }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  if (!invoice) return null

  return (
    <>
      {/* 主 Dialog：子 Dialog 開啟時完全不渲染（避免多重遮罩） */}
      {!showVoidDialog && (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-morandi-gold" />
              {invoice.transactionNo}
              <span className="ml-2">{getStatusBadge(invoice.status)}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* 基本資訊 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">基本資訊</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-morandi-secondary">發票號碼</p>
                  <p className="font-medium text-morandi-primary">
                    {invoice.invoice_number || '尚未取得'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-morandi-secondary">開立日期</p>
                  <p className="font-medium text-morandi-primary">{invoice.invoice_date}</p>
                </div>
                <div>
                  <p className="text-sm text-morandi-secondary">課稅別</p>
                  <p className="font-medium text-morandi-primary">
                    {invoice.tax_type === 'dutiable'
                      ? '應稅'
                      : invoice.tax_type === 'zero'
                        ? '零稅率'
                        : '免稅'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-morandi-secondary">總金額</p>
                  <p className="font-medium text-lg text-morandi-gold">
                    <CurrencyCell amount={invoice.total_amount} className="font-medium text-lg text-morandi-gold" />
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 買受人資訊 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">買受人資訊</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-morandi-secondary">名稱</p>
                  <p className="font-medium text-morandi-primary">
                    {invoice.buyerInfo.buyerName || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-morandi-secondary">統一編號</p>
                  <p className="font-medium text-morandi-primary">
                    {invoice.buyerInfo.buyerUBN || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-morandi-secondary">Email</p>
                  <p className="font-medium text-morandi-primary">
                    {invoice.buyerInfo.buyerEmail || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-morandi-secondary">手機</p>
                  <p className="font-medium text-morandi-primary">
                    {invoice.buyerInfo.buyerMobile || '-'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 商品明細 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">商品明細</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border border-border/60 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-morandi-container/40 border-b border-border/60">
                      <tr>
                        <th className="text-left py-3 px-4 text-sm font-medium text-morandi-primary">
                          商品名稱
                        </th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-morandi-primary">
                          數量
                        </th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-morandi-primary">
                          單位
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-morandi-primary">
                          單價
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-morandi-primary">
                          金額
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.items.map((item, index) => (
                        <tr key={index} className="border-b border-border/40 last:border-b-0">
                          <td className="py-3 px-4 text-sm text-morandi-primary">{item.item_name}</td>
                          <td className="py-3 px-4 text-sm text-morandi-primary text-center">
                            {item.item_count}
                          </td>
                          <td className="py-3 px-4 text-sm text-morandi-primary text-center">
                            {item.item_unit}
                          </td>
                          <td className="py-3 px-4 text-sm text-morandi-primary text-right">
                            <CurrencyCell amount={item.item_price} className="text-sm text-morandi-primary" />
                          </td>
                          <td className="py-3 px-4 text-sm text-morandi-primary text-right font-medium">
                            <CurrencyCell amount={item.itemAmt} className="text-sm text-morandi-primary font-medium" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* 發票資訊 */}
            {invoice.status === 'issued' && invoice.randomNum && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">發票資訊</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-morandi-secondary">隨機碼</p>
                    <p className="font-medium font-mono text-morandi-primary">
                      {invoice.randomNum}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-morandi-secondary">條碼</p>
                    <p className="font-medium font-mono text-sm text-morandi-primary">
                      {invoice.barcode || '-'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 作廢資訊 */}
            {invoice.status === 'voided' && (
              <Card className="border-status-danger/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-status-danger">作廢資訊</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-sm text-morandi-secondary">作廢時間</p>
                    <p className="font-medium text-morandi-primary">
                      {invoice.voidDate
                        ? <DateCell date={invoice.voidDate} format="time" showIcon={false} className="font-medium text-morandi-primary" />
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-morandi-secondary">作廢原因</p>
                    <p className="font-medium text-morandi-primary">
                      {invoice.voidReason || '-'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="gap-2">
              <X size={16} />
              關閉
            </Button>
            {invoice.status === 'issued' && (
              <Button
                variant="destructive"
                onClick={() => setShowVoidDialog(true)}
                className="gap-2"
              >
                <FileX size={16} />
                作廢發票
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      )}

      {/* 作廢確認對話框 */}
      <Dialog open={showVoidDialog} onOpenChange={setShowVoidDialog}>
        <DialogContent level={2} className="max-w-md">
          <DialogHeader>
            <DialogTitle>作廢發票</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="voidReason">作廢原因 *</Label>
              <Input
                id="voidReason"
                value={voidReason}
                onChange={e => setVoidReason(e.target.value)}
                placeholder="請輸入作廢原因"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVoidDialog(false)} className="gap-2">
              <X size={16} />
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleVoid}
              disabled={!voidReason.trim() || isLoading}
              className="gap-2"
            >
              <Check size={16} />
              確認作廢
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
