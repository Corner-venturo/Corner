'use client'

/**
 * 發票詳情頁面
 */

import { useEffect, useState } from 'react'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

import { ArrowLeft, FileX, FileEdit } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTravelInvoiceStore } from '@/stores/useTravelInvoiceStore'

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
      await voidInvoice(currentInvoice.id, voidReason, 'current_user') // TODO: 從登入狀態取得
      setShowVoidDialog(false)
      setVoidReason('')
    } catch (error: any) {
      alert(error.message)
    }
  }

  if (isLoading || !currentInvoice) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-center text-muted-foreground">載入中...</p>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any }> = {
      pending: { label: '待處理', variant: 'secondary' },
      issued: { label: '已開立', variant: 'default' },
      voided: { label: '已作廢', variant: 'destructive' },
      allowance: { label: '已折讓', variant: 'outline' },
      failed: { label: '失敗', variant: 'destructive' },
    }
    const config = statusMap[status] || { label: status, variant: 'secondary' }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 標題列 */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <Link href="/finance/travel-invoice">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{currentInvoice.transactionNo}</h1>
            <p className="text-muted-foreground mt-1">
              {currentInvoice.invoice_number || '尚未取得發票號碼'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {getStatusBadge(currentInvoice.status)}
          {currentInvoice.status === 'issued' && (
            <Button variant="destructive" onClick={() => setShowVoidDialog(true)}>
              <FileX className="mr-2 h-4 w-4" />
              作廢發票
            </Button>
          )}
        </div>
      </div>

      {/* 基本資訊 */}
      <Card>
        <CardHeader>
          <CardTitle>基本資訊</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-muted-foreground">特店編號</p>
            <p className="font-medium">{currentInvoice.merchantId}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">開立日期</p>
            <p className="font-medium">{currentInvoice.invoice_date}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">課稅別</p>
            <p className="font-medium">
              {currentInvoice.tax_type === 'dutiable'
                ? '應稅'
                : currentInvoice.tax_type === 'zero'
                  ? '零稅率'
                  : '免稅'}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">總金額</p>
            <p className="font-medium text-lg">NT$ {currentInvoice.total_amount.toLocaleString()}</p>
          </div>
        </CardContent>
      </Card>

      {/* 買受人資訊 */}
      <Card>
        <CardHeader>
          <CardTitle>買受人資訊</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-muted-foreground">名稱</p>
            <p className="font-medium">{currentInvoice.buyerInfo.buyerName || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">統一編號</p>
            <p className="font-medium">{currentInvoice.buyerInfo.buyerUBN || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{currentInvoice.buyerInfo.buyerEmail || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">手機</p>
            <p className="font-medium">{currentInvoice.buyerInfo.buyerMobile || '-'}</p>
          </div>
        </CardContent>
      </Card>

      {/* 商品明細 */}
      <Card>
        <CardHeader>
          <CardTitle>商品明細</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <thead className="border-b">
              <tr>
                <th className="text-left py-2">商品名稱</th>
                <th className="text-center py-2">數量</th>
                <th className="text-center py-2">單位</th>
                <th className="text-right py-2">單價</th>
                <th className="text-right py-2">金額</th>
              </tr>
            </thead>
            <tbody>
              {currentInvoice.items.map((item, index) => (
                <tr key={index} className="border-b">
                  <td className="py-3">{item.item_name}</td>
                  <td className="text-center">{item.item_count}</td>
                  <td className="text-center">{item.item_unit}</td>
                  <td className="text-right">NT$ {item.item_price.toLocaleString()}</td>
                  <td className="text-right font-medium">NT$ {item.itemAmt.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* 發票資訊 */}
      {currentInvoice.status === 'issued' && currentInvoice.randomNum && (
        <Card>
          <CardHeader>
            <CardTitle>發票資訊</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">隨機碼</p>
              <p className="font-medium font-mono">{currentInvoice.randomNum}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">條碼</p>
              <p className="font-medium font-mono text-sm">{currentInvoice.barcode || '-'}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 作廢資訊 */}
      {currentInvoice.status === 'voided' && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle>作廢資訊</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">作廢時間</p>
                <p className="font-medium">
                  {currentInvoice.voidDate
                    ? new Date(currentInvoice.voidDate).toLocaleString('zh-TW')
                    : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">作廢原因</p>
                <p className="font-medium">{currentInvoice.voidReason || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 作廢對話框 */}
      {showVoidDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>作廢發票</CardTitle>
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
