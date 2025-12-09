'use client'

/**
 * 發票詳情頁面
 * 改用統一的 ResponsiveHeader 佈局
 */

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { FileText, FileX } from 'lucide-react'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { ContentContainer } from '@/components/layout/content-container'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTravelInvoiceStore } from '@/stores/useTravelInvoiceStore'
import { alert } from '@/lib/ui/alert-dialog'

export default function InvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { currentInvoice, fetchInvoiceById, voidInvoice, isLoading } = useTravelInvoiceStore()

  const [showVoidDialog, setShowVoidDialog] = useState(false)
  const [voidReason, setVoidReason] = useState('')

  useEffect(() => {
    if (params.id) {
      fetchInvoiceById(params.id as string)
    }
  }, [params.id, fetchInvoiceById])

  const handleVoid = async () => {
    if (!currentInvoice || !voidReason.trim()) return

    try {
      await voidInvoice(currentInvoice.id, voidReason, 'current_user')
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

  if (isLoading || !currentInvoice) {
    return (
      <div className="h-full flex flex-col">
        <ResponsiveHeader
          title="發票詳情"
          icon={FileText}
          showBackButton={true}
          onBack={() => router.push('/finance/travel-invoice')}
        />
        <ContentContainer>
          <div className="text-center py-12">
            <p className="text-morandi-secondary">載入中...</p>
          </div>
        </ContentContainer>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title={currentInvoice.transactionNo}
        icon={FileText}
        showBackButton={true}
        onBack={() => router.push('/finance/travel-invoice')}
        badge={
          <span className="ml-2">{getStatusBadge(currentInvoice.status)}</span>
        }
        actions={
          currentInvoice.status === 'issued' ? (
            <Button
              variant="destructive"
              onClick={() => setShowVoidDialog(true)}
              className="flex items-center gap-2"
            >
              <FileX className="h-4 w-4" />
              作廢發票
            </Button>
          ) : undefined
        }
      />

      <ContentContainer className="flex-1 overflow-auto">
        <div className="space-y-6 pb-6">
          {/* 基本資訊 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">基本資訊</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-morandi-secondary">發票號碼</p>
                <p className="font-medium text-morandi-primary">
                  {currentInvoice.invoice_number || '尚未取得'}
                </p>
              </div>
              <div>
                <p className="text-sm text-morandi-secondary">開立日期</p>
                <p className="font-medium text-morandi-primary">{currentInvoice.invoice_date}</p>
              </div>
              <div>
                <p className="text-sm text-morandi-secondary">課稅別</p>
                <p className="font-medium text-morandi-primary">
                  {currentInvoice.tax_type === 'dutiable'
                    ? '應稅'
                    : currentInvoice.tax_type === 'zero'
                      ? '零稅率'
                      : '免稅'}
                </p>
              </div>
              <div>
                <p className="text-sm text-morandi-secondary">總金額</p>
                <p className="font-medium text-lg text-morandi-gold">
                  NT$ {currentInvoice.total_amount.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 買受人資訊 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">買受人資訊</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-morandi-secondary">名稱</p>
                <p className="font-medium text-morandi-primary">
                  {currentInvoice.buyerInfo.buyerName || '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-morandi-secondary">統一編號</p>
                <p className="font-medium text-morandi-primary">
                  {currentInvoice.buyerInfo.buyerUBN || '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-morandi-secondary">Email</p>
                <p className="font-medium text-morandi-primary">
                  {currentInvoice.buyerInfo.buyerEmail || '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-morandi-secondary">手機</p>
                <p className="font-medium text-morandi-primary">
                  {currentInvoice.buyerInfo.buyerMobile || '-'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 商品明細 */}
          <Card>
            <CardHeader>
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
                    {currentInvoice.items.map((item, index) => (
                      <tr key={index} className="border-b border-border/40 last:border-b-0">
                        <td className="py-3 px-4 text-sm text-morandi-primary">{item.item_name}</td>
                        <td className="py-3 px-4 text-sm text-morandi-primary text-center">
                          {item.item_count}
                        </td>
                        <td className="py-3 px-4 text-sm text-morandi-primary text-center">
                          {item.item_unit}
                        </td>
                        <td className="py-3 px-4 text-sm text-morandi-primary text-right">
                          NT$ {item.item_price.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-sm text-morandi-primary text-right font-medium">
                          NT$ {item.itemAmt.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* 發票資訊 */}
          {currentInvoice.status === 'issued' && currentInvoice.randomNum && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">發票資訊</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-morandi-secondary">隨機碼</p>
                  <p className="font-medium font-mono text-morandi-primary">
                    {currentInvoice.randomNum}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-morandi-secondary">條碼</p>
                  <p className="font-medium font-mono text-sm text-morandi-primary">
                    {currentInvoice.barcode || '-'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 作廢資訊 */}
          {currentInvoice.status === 'voided' && (
            <Card className="border-red-300">
              <CardHeader>
                <CardTitle className="text-base text-red-600">作廢資訊</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-morandi-secondary">作廢時間</p>
                  <p className="font-medium text-morandi-primary">
                    {currentInvoice.voidDate
                      ? new Date(currentInvoice.voidDate).toLocaleString('zh-TW')
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-morandi-secondary">作廢原因</p>
                  <p className="font-medium text-morandi-primary">
                    {currentInvoice.voidReason || '-'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </ContentContainer>

      {/* 作廢對話框 */}
      {showVoidDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-base">作廢發票</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="voidReason">作廢原因 *</Label>
                <Input
                  id="voidReason"
                  value={voidReason}
                  onChange={e => setVoidReason(e.target.value)}
                  placeholder="請輸入作廢原因"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowVoidDialog(false)}>
                  取消
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleVoid}
                  disabled={!voidReason.trim() || isLoading}
                >
                  確認作廢
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
