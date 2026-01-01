/**
 * LinkPay 付款記錄表格
 *
 * 功能：
 * 1. 顯示 LinkPay 付款連結列表
 * 2. 複製付款連結
 * 3. 顯示付款狀態
 * 4. 顯示到期日
 */

'use client'

import { logger } from '@/lib/utils/logger'
import { useState } from 'react'
import { Copy, ExternalLink, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { LinkPayLog } from '@/types/receipt.types'
import { LinkPayStatus, LINKPAY_STATUS_LABELS } from '@/types/receipt.types'
import { alert } from '@/lib/ui/alert-dialog'
import { DateCell, CurrencyCell } from '@/components/table-cells'

interface LinkPayLogsTableProps {
  logs: LinkPayLog[]
}

export function LinkPayLogsTable({ logs }: LinkPayLogsTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // 複製連結
  const handleCopy = async (link: string, logId: string) => {
    try {
      await navigator.clipboard.writeText(link)
      setCopiedId(logId)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      logger.error('複製失敗:', error)
      void alert('複製失敗', 'error')
    }
  }

  // 狀態顏色
  const getStatusColor = (status: LinkPayStatus) => {
    switch (status) {
      case LinkPayStatus.PAID:
        return 'bg-morandi-green/10 text-morandi-green border-morandi-green/20'
      case LinkPayStatus.PENDING:
        return 'bg-morandi-gold/10 text-morandi-gold border-morandi-gold/20'
      case LinkPayStatus.EXPIRED:
        return 'bg-morandi-muted/10 text-morandi-muted border-morandi-muted/20'
      case LinkPayStatus.ERROR:
        return 'bg-morandi-red/10 text-morandi-red border-morandi-red/20'
      default:
        return 'bg-morandi-container/10 text-morandi-secondary border-morandi-container/20'
    }
  }

  // 狀態文字
  const getStatusText = (status: LinkPayStatus) => {
    return LINKPAY_STATUS_LABELS[status] || '未知'
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-morandi-muted">
        <p>尚無 LinkPay 付款記錄</p>
        <p className="text-sm mt-2">點擊上方「建立付款連結」按鈕開始</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {logs.map(log => (
        <div
          key={log.id}
          className="border border-morandi-container/30 rounded-lg p-4 hover:border-morandi-gold/50 transition-colors"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              {/* 訂單號 & 狀態 */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-morandi-primary">
                  {log.linkpay_order_number}
                </span>
                <Badge className={getStatusColor(log.status)}>
                  {getStatusText(log.status)}
                </Badge>
              </div>

              {/* 金額 & 到期日 */}
              <div className="flex items-center gap-4 text-sm text-morandi-secondary">
                <CurrencyCell amount={log.amount} />
                {log.end_date && (
                  <>
                    <span className="text-morandi-muted">|</span>
                    <span className="flex items-center gap-1">
                      到期日：<DateCell date={log.end_date} showIcon={false} />
                      {new Date(log.end_date) < new Date() && (
                        <span className="ml-2 text-morandi-red">(已過期)</span>
                      )}
                    </span>
                  </>
                )}
              </div>

              {/* 付款連結 */}
              {log.link && (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={log.link}
                    readOnly
                    className="flex-1 px-3 py-1.5 text-xs bg-morandi-background border border-morandi-container/30 rounded text-morandi-secondary"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(log.link || '', log.id)}
                    className="shrink-0"
                  >
                    {copiedId === log.id ? (
                      <>
                        <Check size={14} className="mr-1" />
                        已複製
                      </>
                    ) : (
                      <>
                        <Copy size={14} className="mr-1" />
                        複製
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => log.link && window.open(log.link, '_blank')}
                    className="shrink-0"
                  >
                    <ExternalLink size={14} className="mr-1" />
                    開啟
                  </Button>
                </div>
              )}

              {/* 建立時間 */}
              <div className="text-xs text-morandi-muted flex items-center gap-1">
                建立時間：<DateCell date={log.created_at} showIcon={false} className="text-xs text-morandi-muted" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
