'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Combobox, type ComboboxOption } from '@/components/ui/combobox'
import { X, Save, Plus, Trash2, FileCheck } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/client'
import { generateUUID } from '@/lib/utils/uuid'
import { getTodayString } from '@/lib/utils/format-date'
import { useAuthStore } from '@/stores/auth-store'
import { useAccounts } from '../hooks'
import type { JournalVoucher, VoucherStatus, Account } from '@/types/accounting.types'

interface VoucherFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  voucher?: JournalVoucher | null
  onSuccess: () => void
}

interface VoucherLine {
  id: string
  account_id: string
  description: string
  debit_amount: number
  credit_amount: number
}

const createEmptyLine = (): VoucherLine => ({
  id: generateUUID(),
  account_id: '',
  description: '',
  debit_amount: 0,
  credit_amount: 0,
})

/**
 * 生成傳票編號
 */
async function generateVoucherNo(): Promise<string> {
  const today = new Date()
  const prefix = `JV${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`

  const { data } = await supabase
    .from('journal_vouchers')
    .select('voucher_no')
    .like('voucher_no', `${prefix}%`)
    .order('voucher_no', { ascending: false })
    .limit(1)

  let nextNumber = 1
  if (data && data.length > 0) {
    const lastNo = data[0].voucher_no
    const numericPart = lastNo.replace(prefix, '')
    const current = parseInt(numericPart, 10)
    if (!isNaN(current)) {
      nextNumber = current + 1
    }
  }

  return `${prefix}${String(nextNumber).padStart(4, '0')}`
}

export function VoucherFormDialog({
  open,
  onOpenChange,
  voucher,
  onSuccess,
}: VoucherFormDialogProps) {
  const { user } = useAuthStore()
  const { items: accounts } = useAccounts()
  
  const [voucherDate, setVoucherDate] = useState(getTodayString())
  const [memo, setMemo] = useState('')
  const [lines, setLines] = useState<VoucherLine[]>([createEmptyLine(), createEmptyLine()])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isEditMode = !!voucher

  // 載入現有傳票資料（編輯模式）
  useEffect(() => {
    if (open && voucher) {
      setVoucherDate(voucher.voucher_date)
      setMemo(voucher.memo || '')
      loadVoucherLines(voucher.id)
    } else if (open && !voucher) {
      // 新增模式：重置表單
      setVoucherDate(getTodayString())
      setMemo('')
      setLines([createEmptyLine(), createEmptyLine()])
    }
  }, [open, voucher])

  const loadVoucherLines = async (voucherId: string) => {
    const { data } = await supabase
      .from('journal_lines')
      .select('*')
      .eq('voucher_id', voucherId)
      .order('line_no', { ascending: true })

    if (data && data.length > 0) {
      setLines(data.map(line => ({
        id: line.id,
        account_id: line.account_id || '',
        description: line.description || '',
        debit_amount: Number(line.debit_amount) || 0,
        credit_amount: Number(line.credit_amount) || 0,
      })))
    } else {
      setLines([createEmptyLine(), createEmptyLine()])
    }
  }

  // 科目選項（轉換為 Combobox 格式）
  const accountOptions: ComboboxOption<Account>[] = useMemo(() => {
    return accounts
      .filter(acc => acc.is_active)
      .map(acc => ({
        value: acc.id,
        label: `${acc.code} ${acc.name}`,
        data: acc,
      }))
  }, [accounts])

  // 計算借貸總額
  const totals = useMemo(() => {
    const debit = lines.reduce((sum, line) => sum + (line.debit_amount || 0), 0)
    const credit = lines.reduce((sum, line) => sum + (line.credit_amount || 0), 0)
    return { debit, credit, isBalanced: debit === credit && debit > 0 }
  }, [lines])

  // 更新分錄
  const updateLine = (index: number, field: keyof VoucherLine, value: string | number) => {
    setLines(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  // 新增分錄行
  const addLine = () => {
    setLines(prev => [...prev, createEmptyLine()])
  }

  // 刪除分錄行
  const removeLine = (index: number) => {
    if (lines.length <= 2) {
      toast.error('傳票至少需要 2 筆分錄')
      return
    }
    setLines(prev => prev.filter((_, i) => i !== index))
  }

  // 驗證表單
  const validateForm = (): boolean => {
    if (!voucherDate) {
      toast.error('請選擇傳票日期')
      return false
    }

    const validLines = lines.filter(line => 
      line.account_id && (line.debit_amount > 0 || line.credit_amount > 0)
    )

    if (validLines.length < 2) {
      toast.error('傳票至少需要 2 筆有效分錄')
      return false
    }

    if (!totals.isBalanced) {
      toast.error('借貸金額必須平衡')
      return false
    }

    return true
  }

  // 儲存傳票（草稿）
  const handleSaveDraft = async () => {
    if (!validateForm()) return
    await saveVoucher('draft')
  }

  // 過帳傳票
  const handlePost = async () => {
    if (!validateForm()) return
    await saveVoucher('posted')
  }

  const saveVoucher = async (status: VoucherStatus) => {
    if (!user?.workspace_id || !user?.id) {
      toast.error('用戶資訊不完整')
      return
    }

    setIsSubmitting(true)
    const now = new Date().toISOString()

    try {
      let voucherId = voucher?.id
      let voucherNo = voucher?.voucher_no

      if (isEditMode && voucherId) {
        // 編輯模式：更新傳票
        const { error: updateError } = await supabase
          .from('journal_vouchers')
          .update({
            voucher_date: voucherDate,
            memo: memo || null,
            status,
            total_debit: totals.debit,
            total_credit: totals.credit,
            updated_at: now,
          })
          .eq('id', voucherId)

        if (updateError) throw updateError

        // 刪除舊分錄
        await supabase
          .from('journal_lines')
          .delete()
          .eq('voucher_id', voucherId)

      } else {
        // 新增模式：建立傳票
        voucherId = generateUUID()
        voucherNo = await generateVoucherNo()

        const { error: insertError } = await supabase
          .from('journal_vouchers')
          .insert({
            id: voucherId,
            voucher_no: voucherNo,
            voucher_date: voucherDate,
            memo: memo || null,
            company_unit: 'default',
            status,
            total_debit: totals.debit,
            total_credit: totals.credit,
            created_by: user.id,
            created_at: now,
            updated_at: now,
          })

        if (insertError) throw insertError
      }

      // 建立分錄
      const validLines = lines.filter(line => 
        line.account_id && (line.debit_amount > 0 || line.credit_amount > 0)
      )

      const lineInserts = validLines.map((line, index) => ({
        id: generateUUID(),
        voucher_id: voucherId!,
        line_no: index + 1,
        account_id: line.account_id,
        description: line.description || null,
        debit_amount: line.debit_amount || 0,
        credit_amount: line.credit_amount || 0,
        created_at: now,
        updated_at: now,
      }))

      const { error: linesError } = await supabase
        .from('journal_lines')
        .insert(lineInserts)

      if (linesError) throw linesError

      toast.success(
        status === 'posted' 
          ? `傳票 ${voucherNo} 已過帳` 
          : `傳票 ${voucherNo} 已儲存為草稿`
      )

      onSuccess()
      onOpenChange(false)

    } catch (error) {
      console.error('儲存傳票失敗:', error)
      toast.error(error instanceof Error ? error.message : '儲存傳票失敗')
    } finally {
      setIsSubmitting(false)
    }
  }

  const canEdit = !voucher || voucher.status === 'draft'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent level={1} className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {isEditMode ? '編輯傳票' : '新增傳票'}
            {voucher && (
              <Badge variant={voucher.status === 'draft' ? 'secondary' : 'default'}>
                {voucher.status === 'draft' ? '草稿' : '已過帳'}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 傳票頭資訊 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>傳票日期 *</Label>
              <Input
                type="date"
                value={voucherDate}
                onChange={(e) => setVoucherDate(e.target.value)}
                disabled={!canEdit}
              />
            </div>
            <div className="space-y-2">
              <Label>傳票編號</Label>
              <Input
                value={voucher?.voucher_no || '（自動產生）'}
                disabled
                className="bg-muted"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>摘要</Label>
            <Textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="傳票摘要說明..."
              rows={2}
              disabled={!canEdit}
            />
          </div>

          {/* 分錄明細 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">分錄明細</Label>
              {canEdit && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addLine}
                  className="gap-1"
                >
                  <Plus size={14} />
                  新增行
                </Button>
              )}
            </div>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-3 py-2 text-left w-12">#</th>
                    <th className="px-3 py-2 text-left min-w-[200px]">科目</th>
                    <th className="px-3 py-2 text-left">摘要</th>
                    <th className="px-3 py-2 text-right w-28">借方</th>
                    <th className="px-3 py-2 text-right w-28">貸方</th>
                    {canEdit && <th className="px-3 py-2 w-12"></th>}
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, index) => (
                    <tr key={line.id} className="border-t">
                      <td className="px-3 py-2 text-muted-foreground">{index + 1}</td>
                      <td className="px-3 py-1">
                        <Combobox
                          value={line.account_id}
                          onChange={(value) => updateLine(index, 'account_id', value)}
                          options={accountOptions}
                          placeholder="選擇科目"
                          disabled={!canEdit}
                          showSearchIcon={false}
                          disablePortal
                          className="w-full"
                        />
                      </td>
                      <td className="px-3 py-1">
                        <Input
                          value={line.description}
                          onChange={(e) => updateLine(index, 'description', e.target.value)}
                          placeholder="說明"
                          disabled={!canEdit}
                          className="h-9"
                        />
                      </td>
                      <td className="px-3 py-1">
                        <Input
                          type="number"
                          value={line.debit_amount || ''}
                          onChange={(e) => updateLine(index, 'debit_amount', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          disabled={!canEdit}
                          className="h-9 text-right font-mono"
                          min={0}
                        />
                      </td>
                      <td className="px-3 py-1">
                        <Input
                          type="number"
                          value={line.credit_amount || ''}
                          onChange={(e) => updateLine(index, 'credit_amount', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          disabled={!canEdit}
                          className="h-9 text-right font-mono"
                          min={0}
                        />
                      </td>
                      {canEdit && (
                        <td className="px-3 py-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeLine(index)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted font-medium">
                  <tr>
                    <td colSpan={3} className="px-3 py-2 text-right">合計</td>
                    <td className="px-3 py-2 text-right font-mono">
                      {totals.debit.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right font-mono">
                      {totals.credit.toLocaleString()}
                    </td>
                    {canEdit && <td></td>}
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* 借貸平衡狀態 */}
            {totals.debit !== totals.credit && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                ⚠️ 借貸不平衡！差額：{Math.abs(totals.debit - totals.credit).toLocaleString()}
              </div>
            )}
            {totals.isBalanced && (
              <div className="p-3 bg-green-500/10 text-green-600 rounded-lg text-sm">
                ✓ 借貸平衡
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" className="gap-1" onClick={() => onOpenChange(false)}>
            <X size={16} />
            取消
          </Button>
          {canEdit && (
            <>
              <Button
                variant="secondary"
                onClick={handleSaveDraft}
                disabled={isSubmitting}
                className="gap-1"
              >
                <Save size={16} />
                {isSubmitting ? '儲存中...' : '儲存草稿'}
              </Button>
              <Button
                onClick={handlePost}
                disabled={isSubmitting || !totals.isBalanced}
                className="gap-1"
              >
                <FileCheck size={16} />
                {isSubmitting ? '處理中...' : '過帳'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
