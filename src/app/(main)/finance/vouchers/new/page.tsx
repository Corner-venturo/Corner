'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, Save, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { useVoucherStore } from '@/stores/voucher-store'
import { useVoucherEntryStore } from '@/stores/voucher-entry-store'
import { useAccountingSubjectStore } from '@/stores/accounting-subject-store'
import { useAuthStore } from '@/stores/auth-store'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { AccountingSubject, CreateVoucherEntryData } from '@/types/accounting-pro.types'
import { cn } from '@/lib/utils'
import { alert } from '@/lib/ui/alert-dialog'

interface VoucherEntryRow {
  id: string
  subject_id: string
  debit: string
  credit: string
  description: string
}

export default function NewVoucherPage() {
  const router = useRouter()
  const user = useAuthStore(state => state.user)

  // Stores
  const createVoucher = useVoucherStore(state => state.create)
  const createEntry = useVoucherEntryStore(state => state.create)
  const subjects = useAccountingSubjectStore(state => state.items)
  const fetchSubjects = useAccountingSubjectStore(state => state.fetchAll)

  // 載入科目
  useEffect(() => {
    fetchSubjects()
  }, [])

  // 表單狀態
  const [voucherDate, setVoucherDate] = useState(new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState('')
  const [entries, setEntries] = useState<VoucherEntryRow[]>([
    {
      id: '1',
      subject_id: '',
      debit: '',
      credit: '',
      description: '',
    },
    {
      id: '2',
      subject_id: '',
      debit: '',
      credit: '',
      description: '',
    },
  ])

  // 可選科目（排除父科目，只顯示明細科目）
  const selectableSubjects = subjects.filter(s => {
    const hasChildren = subjects.some(child => child.parent_id === s.id)
    return !hasChildren && s.is_active
  })

  // 新增分錄行
  const addEntryRow = () => {
    setEntries([
      ...entries,
      {
        id: Date.now().toString(),
        subject_id: '',
        debit: '',
        credit: '',
        description: '',
      },
    ])
  }

  // 刪除分錄行
  const removeEntryRow = (id: string) => {
    if (entries.length <= 2) {
      void alert('至少需要兩筆分錄', 'warning')
      return
    }
    setEntries(entries.filter(e => e.id !== id))
  }

  // 更新分錄行
  const updateEntryRow = (id: string, field: keyof VoucherEntryRow, value: string) => {
    setEntries(
      entries.map(e => {
        if (e.id !== id) return e

        // 如果是金額欄位，清空另一個金額欄位
        if (field === 'debit' && value) {
          return { ...e, debit: value, credit: '' }
        }
        if (field === 'credit' && value) {
          return { ...e, credit: value, debit: '' }
        }

        return { ...e, [field]: value }
      })
    )
  }

  // 計算借貸合計
  const totalDebit = entries.reduce((sum, e) => sum + (parseFloat(e.debit) || 0), 0)
  const totalCredit = entries.reduce((sum, e) => sum + (parseFloat(e.credit) || 0), 0)
  const isBalanced = totalDebit === totalCredit && totalDebit > 0

  // 儲存傳票
  const handleSave = async () => {
    // 驗證
    if (!voucherDate) {
      await alert('請選擇傳票日期', 'warning')
      return
    }

    if (!isBalanced) {
      await alert('借貸不平衡，無法儲存', 'warning')
      return
    }

    const hasEmptySubject = entries.some(e => !e.subject_id && (e.debit || e.credit))
    if (hasEmptySubject) {
      await alert('請為所有分錄選擇會計科目', 'warning')
      return
    }

    if (!user?.workspace_id) {
      await alert('無法取得工作空間資訊', 'error')
      return
    }

    try {
      // 產生傳票編號
      const dateStr = voucherDate.replace(/-/g, '')
      const random = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, '0')
      const voucherNo = `V${dateStr}${random}`

      const voucher = await createVoucher({
        workspace_id: user.workspace_id,
        voucher_no: voucherNo,
        voucher_date: voucherDate,
        type: 'manual',
        source_type: 'manual',
        source_id: null,
        description: description || null,
        total_debit: totalDebit,
        total_credit: totalCredit,
        status: 'draft',
        created_by: user.id,
        posted_by: null,
        posted_at: null,
        voided_by: null,
        voided_at: null,
        void_reason: null,
      })

      let entryNo = 1
      for (const entry of entries) {
        const debit = parseFloat(entry.debit) || 0
        const credit = parseFloat(entry.credit) || 0

        if (debit === 0 && credit === 0) continue

        const entryData: CreateVoucherEntryData = {
          voucher_id: voucher.id,
          entry_no: entryNo++,
          subject_id: entry.subject_id,
          debit,
          credit,
          description: entry.description || null,
        }

        await createEntry(entryData)
      }

      await alert('傳票儲存成功', 'success')
      router.push(`/finance/vouchers/${voucher.id}`)
    } catch (error) {
      console.error('建立傳票失敗:', error)
      await alert('建立傳票失敗，請稍後再試', 'error')
    }
  }

  return (
    <>
      <ResponsiveHeader
        title="新增傳票"
        icon={FileText}
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '財務管理', href: '/finance' },
          { label: '會計傳票', href: '/finance/vouchers' },
          { label: '新增傳票', href: '/finance/vouchers/new' },
        ]}
      >
        <div className="flex items-center gap-2">
          <Button
            onClick={() => router.back()}
            variant="outline"
            size="sm"
            className="border-[#E0D8CC]"
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            返回
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isBalanced}
            className="bg-[#C9A961] hover:bg-[#B8985A] text-white disabled:opacity-50"
            size="sm"
          >
            <Save className="h-4 w-4 mr-1.5" />
            儲存
          </Button>
        </div>
      </ResponsiveHeader>

      <div className="pt-[72px] p-6">
        {/* 傳票基本資訊 */}
        <div className="bg-white rounded-lg border border-[#E0D8CC] p-6 mb-6">
          <h3 className="text-lg font-semibold text-[#3D2914] mb-4">傳票資訊</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-[#6B5D52] mb-2 block">
                傳票日期 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={voucherDate}
                onChange={e => setVoucherDate(e.target.value)}
                className="w-full px-3 py-2 border border-[#E0D8CC] rounded-lg focus:outline-none focus:border-[#C9A961]"
              />
            </div>

            <div>
              <label className="text-sm text-[#6B5D52] mb-2 block">摘要</label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="例如：1月份薪資支出"
                className="w-full px-3 py-2 border border-[#E0D8CC] rounded-lg focus:outline-none focus:border-[#C9A961]"
              />
            </div>
          </div>
        </div>

        {/* 分錄明細 */}
        <div className="bg-white rounded-lg border border-[#E0D8CC] overflow-hidden mb-6">
          <div className="px-6 py-4 bg-[#FAF8F5] border-b border-[#E0D8CC] flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[#3D2914]">分錄明細</h3>
            <Button
              onClick={addEntryRow}
              variant="outline"
              size="sm"
              className="border-[#E0D8CC]"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              新增分錄
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#FAF8F5] border-b border-[#E0D8CC]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#6B5D52]">
                    會計科目 <span className="text-red-500">*</span>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#6B5D52]">摘要</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[#6B5D52]">
                    借方
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[#6B5D52]">
                    貸方
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-[#6B5D52] w-16">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E0D8CC]">
                {entries.map((entry, index) => {
                  const subject = subjects.find(s => s.id === entry.subject_id)
                  return (
                    <tr key={entry.id} className="hover:bg-[#FAF8F5] transition-colors">
                      <td className="px-4 py-3">
                        <Select
                          value={entry.subject_id}
                          onValueChange={value => updateEntryRow(entry.id, 'subject_id', value)}
                        >
                          <SelectTrigger className="border-[#E0D8CC]">
                            <SelectValue placeholder="選擇會計科目">
                              {subject && (
                                <span className="text-sm">
                                  {subject.code} - {subject.name}
                                </span>
                              )}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {selectableSubjects.map(s => (
                              <SelectItem key={s.id} value={s.id}>
                                <span className="text-sm">
                                  {s.code} - {s.name}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={entry.description}
                          onChange={e => updateEntryRow(entry.id, 'description', e.target.value)}
                          placeholder="分錄摘要"
                          className="w-full px-2 py-1 border border-[#E0D8CC] rounded focus:outline-none focus:border-[#C9A961] text-sm"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={entry.debit}
                          onChange={e => updateEntryRow(entry.id, 'debit', e.target.value)}
                          disabled={!!entry.credit}
                          placeholder="0"
                          className="w-full px-2 py-1 border border-[#E0D8CC] rounded focus:outline-none focus:border-[#C9A961] text-sm text-right disabled:bg-gray-50"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={entry.credit}
                          onChange={e => updateEntryRow(entry.id, 'credit', e.target.value)}
                          disabled={!!entry.debit}
                          placeholder="0"
                          className="w-full px-2 py-1 border border-[#E0D8CC] rounded focus:outline-none focus:border-[#C9A961] text-sm text-right disabled:bg-gray-50"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button
                          onClick={() => removeEntryRow(entry.id)}
                          variant="ghost"
                          size="sm"
                          className="p-1 h-auto text-red-600 hover:text-red-700 hover:bg-red-50"
                          disabled={entries.length <= 2}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  )
                })}

                {/* 合計列 */}
                <tr className="bg-[#FAF8F5] font-semibold">
                  <td colSpan={2} className="px-4 py-3 text-right text-sm text-[#3D2914]">
                    合計
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-[#3D2914]">
                    NT$ {totalDebit.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-[#3D2914]">
                    NT$ {totalCredit.toLocaleString()}
                  </td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 借貸平衡檢查 */}
          <div className="px-6 py-4 bg-[#FAF8F5] border-t border-[#E0D8CC]">
            {isBalanced ? (
              <div className="flex items-center gap-2 text-green-700">
                <div className="w-2 h-2 bg-green-600 rounded-full" />
                <span className="font-medium">借貸平衡</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-orange-700">
                <div className="w-2 h-2 bg-orange-600 rounded-full" />
                <span className="font-medium">
                  {totalDebit === 0 && totalCredit === 0
                    ? '請輸入分錄金額'
                    : `借貸不平衡！差額：NT$ ${Math.abs(totalDebit - totalCredit).toLocaleString()}`}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 提示訊息 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">💡 填寫提示</h4>
          <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
            <li>每筆分錄只能填借方或貸方其中一個金額</li>
            <li>借方合計必須等於貸方合計</li>
            <li>至少需要兩筆分錄</li>
            <li>儲存後將建立為草稿狀態，需手動過帳才會生效</li>
          </ul>
        </div>
      </div>
    </>
  )
}
