'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Edit, Trash2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { usePaymentRequestStore, usePaymentRequestItemStore, useTourStore } from '@/stores'
import { formatDate } from '@/lib/utils'
import { statusLabels, statusColors } from '@/features/finance/requests/types'
import { logger } from '@/lib/utils/logger'
import { confirm, alert } from '@/lib/ui/alert-dialog'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function RequestDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()

  // Stores
  const { items: requests, fetchAll: fetchRequests, update: updateRequest, delete: deleteRequest } = usePaymentRequestStore()
  const { items: requestItems, fetchAll: fetchRequestItems } = usePaymentRequestItemStore()
  const { items: tours } = useTourStore()

  // State
  const [request, setRequest] = useState(requests.find(r => r.id === id))
  const [isLoading, setIsLoading] = useState(true)

  // 載入資料
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await Promise.all([fetchRequests(), fetchRequestItems()])
      setIsLoading(false)
    }
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 更新 request 當 store 變化時
  useEffect(() => {
    const updated = requests.find(r => r.id === id)
    if (updated) {
      setRequest(updated)
    }
  }, [requests, id])

  // 取得此請款單的項目
  const items = requestItems.filter(item => item.request_id === id)

  // 取得關聯的團
  const tour = request?.tour_id ? tours.find(t => t.id === request.tour_id) : null

  // 刪除請款單
  const handleDelete = async () => {
    const confirmed = await confirm('確定要刪除此請款單嗎？此操作無法復原。', {
      title: '刪除請款單',
      type: 'warning',
    })
    if (!confirmed) {
      return
    }

    try {
      await deleteRequest(id)
      await alert('請款單已刪除', 'success')
      router.push('/finance/requests')
    } catch (error) {
      logger.error('刪除請款單失敗:', error)
      await alert('刪除請款單失敗', 'error')
    }
  }

  // 更新狀態
  const handleStatusChange = async (newStatus: 'pending' | 'approved' | 'paid') => {
    try {
      await updateRequest(id, { status: newStatus })
      await alert(`狀態已更新為：${statusLabels[newStatus]}`, 'success')
    } catch (error) {
      logger.error('更新狀態失敗:', error)
      await alert('更新狀態失敗', 'error')
    }
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-morandi-muted">載入中...</p>
        </div>
      </div>
    )
  }

  if (!request) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-morandi-muted">找不到請款單</p>
          <Button onClick={() => router.back()} className="mt-4">
            返回列表
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-morandi-background">
      {/* Header */}
      <div className="bg-white border-b border-morandi-container/20 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-morandi-secondary hover:text-morandi-primary"
            >
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-morandi-primary">
                請款單 {request.code}
              </h1>
              <p className="text-sm text-morandi-muted">
                {request.tour_code ? `團號：${request.tour_code}` : '無關聯團號'}
                {request.order_number && ` | 訂單：${request.order_number}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge className={statusColors[request.status || 'pending']}>
              {statusLabels[request.status || 'pending']}
            </Badge>
            {request.status === 'pending' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange('approved')}
                className="text-morandi-gold border-morandi-gold hover:bg-morandi-gold/10"
              >
                <Check size={16} className="mr-2" />
                核准
              </Button>
            )}
            {request.status === 'approved' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange('paid')}
                className="text-green-600 border-green-600 hover:bg-green-50"
              >
                <Check size={16} className="mr-2" />
                標記已付款
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="text-morandi-red border-morandi-red hover:bg-morandi-red/10"
            >
              <Trash2 size={16} className="mr-2" />
              刪除
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* 基本資訊 */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-morandi-primary mb-4">基本資訊</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <InfoItem label="請款單號" value={request.code} />
            <InfoItem label="團號" value={request.tour_code || '-'} />
            <InfoItem label="團名" value={request.tour_name || tour?.name || '-'} />
            <InfoItem label="訂單編號" value={request.order_number || '-'} />
            <InfoItem label="請款日期" value={formatDate(request.created_at)} />
            <InfoItem
              label="總金額"
              value={`NT$ ${(request.amount || 0).toLocaleString()}`}
              highlight
            />
          </div>
        </Card>

        {/* 請款項目 */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-morandi-primary mb-4">
            請款項目 ({items.length} 項)
          </h3>
          {items.length === 0 ? (
            <p className="text-morandi-muted text-center py-4">尚無請款項目</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-morandi-container/20">
                    <th className="text-left py-2 px-3 text-morandi-muted font-medium">類別</th>
                    <th className="text-left py-2 px-3 text-morandi-muted font-medium">供應商</th>
                    <th className="text-left py-2 px-3 text-morandi-muted font-medium">說明</th>
                    <th className="text-right py-2 px-3 text-morandi-muted font-medium">單價</th>
                    <th className="text-right py-2 px-3 text-morandi-muted font-medium">數量</th>
                    <th className="text-right py-2 px-3 text-morandi-muted font-medium">小計</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-morandi-container/10">
                      <td className="py-2 px-3">{item.category}</td>
                      <td className="py-2 px-3">{item.supplier_name || '-'}</td>
                      <td className="py-2 px-3">{item.description || '-'}</td>
                      <td className="py-2 px-3 text-right">
                        NT$ {(item.unit_price || 0).toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-right">{item.quantity}</td>
                      <td className="py-2 px-3 text-right font-medium text-morandi-gold">
                        NT$ {(item.subtotal || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-morandi-background/50">
                    <td colSpan={5} className="py-3 px-3 text-right font-semibold">
                      合計
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-morandi-gold text-lg">
                      NT$ {(request.amount || 0).toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Card>

        {/* 備註 */}
        {request.note && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-morandi-primary mb-4">備註</h3>
            <p className="text-morandi-secondary whitespace-pre-wrap">{request.note}</p>
          </Card>
        )}
      </div>
    </div>
  )
}

// 資訊項目組件
function InfoItem({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div>
      <p className="text-xs text-morandi-muted mb-1">{label}</p>
      <p className={`text-sm ${highlight ? 'font-semibold text-morandi-gold' : 'text-morandi-primary'}`}>
        {value}
      </p>
    </div>
  )
}
