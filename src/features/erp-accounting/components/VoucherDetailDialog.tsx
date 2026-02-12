'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/utils/logger'
import type { JournalVoucher, JournalLine, VoucherStatus } from '@/types/accounting.types'
import { VOUCHER_DETAIL_LABELS as L } from '../constants/labels'

interface VoucherDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  voucher: JournalVoucher
}

const statusConfig: Record<VoucherStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: L.status_draft, variant: 'secondary' },
  posted: { label: L.status_posted, variant: 'default' },
  reversed: { label: L.status_reversed, variant: 'destructive' },
  locked: { label: '已鎖定', variant: 'outline' },
}

interface LineWithAccount extends Omit<JournalLine, 'account'> {
  account?: { code: string; name: string }
}

export function VoucherDetailDialog({
  open,
  onOpenChange,
  voucher,
}: VoucherDetailDialogProps) {
  const [lines, setLines] = useState<LineWithAccount[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (open && voucher.id) {
      loadLines()
    }
  }, [open, voucher.id])

  const loadLines = async () => {
    setIsLoading(true)
    try {
      const { data } = await supabase
        .from('journal_lines')
        .select('*, account:chart_of_accounts(code, name)')
        .eq('voucher_id', voucher.id)
        .order('line_no', { ascending: true })

      setLines((data || []) as unknown as LineWithAccount[])
    } catch (error) {
      logger.error('載入分錄失敗:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const config = statusConfig[voucher.status]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent level={1} className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {L.title} - {voucher.voucher_no}
            <Badge variant={config.variant}>{config.label}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <span className="text-sm text-muted-foreground">{L.label_voucher_no}</span>
              <p className="font-mono">{voucher.voucher_no}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">{L.label_date}</span>
              <p>{voucher.voucher_date}</p>
            </div>
            <div className="col-span-2">
              <span className="text-sm text-muted-foreground">{L.label_description}</span>
              <p>{voucher.memo || '-'}</p>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-2 text-left w-12">#</th>
                  <th className="px-4 py-2 text-left">{L.col_account}</th>
                  <th className="px-4 py-2 text-left">{L.col_memo}</th>
                  <th className="px-4 py-2 text-right w-28">{L.col_debit}</th>
                  <th className="px-4 py-2 text-right w-28">{L.col_credit}</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      載入中...
                    </td>
                  </tr>
                ) : lines.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      無分錄資料
                    </td>
                  </tr>
                ) : (
                  lines.map((line) => (
                    <tr key={line.id} className="border-t">
                      <td className="px-4 py-2 text-muted-foreground">{line.line_no}</td>
                      <td className="px-4 py-2">
                        <span className="font-mono text-xs text-muted-foreground mr-2">
                          {line.account?.code}
                        </span>
                        {line.account?.name}
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {line.description || '-'}
                      </td>
                      <td className="px-4 py-2 text-right font-mono">
                        {Number(line.debit_amount) > 0
                          ? Number(line.debit_amount).toLocaleString()
                          : ''}
                      </td>
                      <td className="px-4 py-2 text-right font-mono">
                        {Number(line.credit_amount) > 0
                          ? Number(line.credit_amount).toLocaleString()
                          : ''}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-muted font-medium">
                <tr>
                  <td colSpan={3} className="px-4 py-2 text-right">合計</td>
                  <td className="px-4 py-2 text-right font-mono">
                    {Number(voucher.total_debit).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-right font-mono">
                    {Number(voucher.total_credit).toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {Number(voucher.total_debit) !== Number(voucher.total_credit) && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
              ⚠️ 借貸不平衡！差額：{Math.abs(Number(voucher.total_debit) - Number(voucher.total_credit)).toLocaleString()}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
