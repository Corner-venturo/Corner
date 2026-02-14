'use client'

/**
 * 發票詳情頁面
 * 改用統一的 ResponsiveHeader 佈局
 */

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { FileText, FileX, X, Check } from 'lucide-react'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { NotFoundState } from '@/components/ui/not-found-state'
import { DateCell, CurrencyCell } from '@/components/table-cells'
import { ContentContainer } from '@/components/layout/content-container'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTravelInvoiceStore } from '@/stores/travel-invoice-store'
import { alert } from '@/lib/ui/alert-dialog'
import { TRAVEL_INVOICE_LABELS, TRAVEL_INVOICE_DETAIL_LABELS } from '../../constants/labels'

export default function InvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { currentInvoice, fetchInvoiceById, voidInvoice, isLoading } = useTravelInvoiceStore()

  const [showVoidDialog, setShowVoidDialog] = useState(false)
  const [voidReason, setVoidReason] = useState('')
  const [notFound, setNotFound] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)

  useEffect(() => {
    const loadInvoice = async () => {
      if (params.id) {
        await fetchInvoiceById(params.id as string)
        setHasLoaded(true)
      }
    }
    loadInvoice()
  }, [params.id, fetchInvoiceById])

  useEffect(() => {
    if (hasLoaded && !isLoading && !currentInvoice) {
      setNotFound(true)
    } else if (currentInvoice) {
      setNotFound(false)
    }
  }, [hasLoaded, isLoading, currentInvoice])

  const handleVoid = async () => {
    if (!currentInvoice) return
    if (!voidReason.trim()) {
      await alert('請填寫作廢原因', 'error')
      return
    }

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

  if (isLoading && !hasLoaded) {
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
            <p className="text-morandi-secondary">{TRAVEL_INVOICE_LABELS.LOADING}</p>
          </div>
        </ContentContainer>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="h-full flex flex-col">
        <ResponsiveHeader
          title="發票詳情"
          icon={FileText}
          showBackButton={true}
          onBack={() => router.push('/finance/travel-invoice')}
        />
        <div className="flex-1 flex items-center justify-center">
          <NotFoundState
            title="找不到該發票"
            description="您要找的發票可能已被刪除或不存在"
            backButtonLabel="返回發票列表"
            backHref="/finance/travel-invoice"
          />
        </div>
      </div>
    )
  }

  if (!currentInvoice) {
    return null
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
              <CardTitle className="text-base">{TRAVEL_INVOICE_LABELS.BASIC_INFO}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-morandi-secondary">{TRAVEL_INVOICE_LABELS.INVOICE_NUMBER}</p>
                <p className="font-medium text-morandi-primary">
                  {currentInvoice.invoice_number || '尚未取得'}
                </p>
              </div>
              <div>
                <p className="text-sm text-morandi-secondary">{TRAVEL_INVOICE_LABELS.ISSUE_DATE}</p>
                <p className="font-medium text-morandi-primary">{currentInvoice.invoice_date}</p>
              </div>
              <div>
                <p className="text-sm text-morandi-secondary">{TRAVEL_INVOICE_LABELS.TAX_TYPE}</p>
                <p className="font-medium text-morandi-primary">
                  {currentInvoice.tax_type === 'dutiable'
                    ? '應稅'
                    : currentInvoice.tax_type === 'zero'
                      ? '零稅率'
                      : '免稅'}
                </p>
              </div>
              <div>
                <p className="text-sm text-morandi-secondary">{TRAVEL_INVOICE_LABELS.TOTAL_AMOUNT}</p>
                <p className="font-medium text-lg text-morandi-gold">
                  <CurrencyCell amount={currentInvoice.total_amount} className="font-medium text-lg text-morandi-gold" />
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 買受人資訊 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{TRAVEL_INVOICE_LABELS.BUYER_INFO}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-morandi-secondary">{TRAVEL_INVOICE_LABELS.NAME}</p>
                <p className="font-medium text-morandi-primary">
                  {currentInvoice.buyerInfo.buyerName || '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-morandi-secondary">{TRAVEL_INVOICE_LABELS.TAX_ID}</p>
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
                <p className="text-sm text-morandi-secondary">{TRAVEL_INVOICE_LABELS.MOBILE}</p>
                <p className="font-medium text-morandi-primary">
                  {currentInvoice.buyerInfo.buyerMobile || '-'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 商品明細 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{TRAVEL_INVOICE_DETAIL_LABELS.PRODUCT_DETAILS}</CardTitle>
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
          {currentInvoice.status === 'issued' && currentInvoice.randomNum && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{TRAVEL_INVOICE_DETAIL_LABELS.INVOICE_INFO}</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-morandi-secondary">{TRAVEL_INVOICE_DETAIL_LABELS.RANDOM_CODE}</p>
                  <p className="font-medium font-mono text-morandi-primary">
                    {currentInvoice.randomNum}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-morandi-secondary">{TRAVEL_INVOICE_DETAIL_LABELS.BARCODE}</p>
                  <p className="font-medium font-mono text-sm text-morandi-primary">
                    {currentInvoice.barcode || '-'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 作廢資訊 */}
          {currentInvoice.status === 'voided' && (
            <Card className="border-status-danger/30">
              <CardHeader>
                <CardTitle className="text-base text-status-danger">{TRAVEL_INVOICE_DETAIL_LABELS.VOID_INFO}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-morandi-secondary">{TRAVEL_INVOICE_DETAIL_LABELS.VOID_TIME}</p>
                  <p className="font-medium text-morandi-primary">
                    {currentInvoice.voidDate
                      ? <DateCell date={currentInvoice.voidDate} format="time" showIcon={false} className="font-medium text-morandi-primary" />
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-morandi-secondary">{TRAVEL_INVOICE_DETAIL_LABELS.VOID_REASON}</p>
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
      <Dialog open={showVoidDialog} onOpenChange={setShowVoidDialog}>
        <DialogContent level={1} className="max-w-md">
          <DialogHeader>
            <DialogTitle>{TRAVEL_INVOICE_DETAIL_LABELS.VOID_INVOICE}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="voidReason">{TRAVEL_INVOICE_DETAIL_LABELS.VOID_REASON_REQUIRED}</Label>
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
    </div>
  )
}
