'use client'

import React, { useEffect, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, FileText, Printer, Trash2, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { useVoucherStore } from '@/stores/voucher-store'
import { useVoucherEntryStore } from '@/stores/voucher-entry-store'
import { useAccountingSubjectStore } from '@/stores/accounting-subject-store'
import { DateCell, StatusCell } from '@/components/table-cells'
import { cn } from '@/lib/utils'

export default function VoucherDetailPage() {
  const router = useRouter()
  const params = useParams()
  const voucherId = params.id as string

  // Stores
  const vouchers = useVoucherStore(state => state.items)
  const fetchVouchers = useVoucherStore(state => state.fetchAll)
  const updateVoucher = useVoucherStore(state => state.update)
  const deleteVoucher = useVoucherStore(state => state.delete)

  const entries = useVoucherEntryStore(state => state.items)
  const fetchEntries = useVoucherEntryStore(state => state.fetchAll)

  const subjects = useAccountingSubjectStore(state => state.items)
  const fetchSubjects = useAccountingSubjectStore(state => state.fetchAll)

  // 載入資料
  useEffect(() => {
    fetchVouchers()
    fetchEntries()
    fetchSubjects()
  }, [])

  // 找到當前傳票
  const voucher = useMemo(() => {
    return vouchers.find(v => v.id === voucherId)
  }, [vouchers, voucherId])

  // 找到傳票分錄
  const voucherEntries = useMemo(() => {
    return entries
      .filter(e => e.voucher_id === voucherId)
      .sort((a, b) => a.entry_no - b.entry_no)
      .map(entry => {
        const subject = subjects.find(s => s.id === entry.subject_id)
        return {
          ...entry,
          subject_code: subject?.code || '',
          subject_name: subject?.name || '',
        }
      })
  }, [entries, voucherId, subjects])

  // 過帳
  const handlePost = async () => {
    if (!voucher) return
    if (!confirm('確定要過帳此傳票嗎？過帳後將無法修改。')) return

    await updateVoucher(voucher.id, {
      status: 'posted',
      posted_at: new Date().toISOString(),
    })

    alert('過帳成功')
  }

  // 作廢
  const handleVoid = async () => {
    if (!voucher) return
    const reason = prompt('請輸入作廢原因：')
    if (!reason) return

    await updateVoucher(voucher.id, {
      status: 'void',
      voided_at: new Date().toISOString(),
      void_reason: reason,
    })

    alert('作廢成功')
  }

  // 刪除
  const handleDelete = async () => {
    if (!voucher) return
    if (voucher.status === 'posted') {
      alert('已過帳的傳票無法刪除，請先作廢')
      return
    }

    if (!confirm('確定要刪除此傳票嗎？此操作無法復原。')) return

    await deleteVoucher(voucher.id)
    router.push('/finance/vouchers')
  }

  if (!voucher) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <FileText className="h-16 w-16 text-[#AFA598] mx-auto mb-4" />
          <p className="text-[#9E8F81]">找不到傳票</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <ResponsiveHeader
        title={voucher.voucher_no}
        icon={FileText}
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '財務管理', href: '/finance' },
          { label: '會計傳票', href: '/finance/vouchers' },
          { label: voucher.voucher_no, href: `/finance/vouchers/${voucher.id}` },
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

          {voucher.status === 'draft' && (
            <>
              <Button
                onClick={handlePost}
                className="bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                <CheckCircle className="h-4 w-4 mr-1.5" />
                過帳
              </Button>
              <Button
                onClick={handleDelete}
                variant="outline"
                size="sm"
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                刪除
              </Button>
            </>
          )}

          {voucher.status === 'posted' && (
            <Button
              onClick={handleVoid}
              variant="outline"
              size="sm"
              className="border-orange-300 text-orange-600 hover:bg-orange-50"
            >
              作廢
            </Button>
          )}

          <Button variant="outline" size="sm" className="border-[#E0D8CC]">
            <Printer className="h-4 w-4 mr-1.5" />
            列印
          </Button>
        </div>
      </ResponsiveHeader>

      <div className="pt-[72px] p-6">
        {/* 傳票基本資訊 */}
        <div className="bg-white rounded-lg border border-[#E0D8CC] p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="text-xs text-[#9E8F81] mb-1 block">傳票編號</label>
              <div className="font-mono text-lg font-semibold text-[#3D2914]">
                {voucher.voucher_no}
              </div>
            </div>

            <div>
              <label className="text-xs text-[#9E8F81] mb-1 block">傳票日期</label>
              <DateCell date={voucher.voucher_date} />
            </div>

            <div>
              <label className="text-xs text-[#9E8F81] mb-1 block">狀態</label>
              <div className="flex items-center">
                <span
                  className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                    voucher.status === 'draft'
                      ? 'bg-gray-100 text-gray-700'
                      : voucher.status === 'posted'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                  }`}
                >
                  {voucher.status === 'draft'
                    ? '草稿'
                    : voucher.status === 'posted'
                      ? '已過帳'
                      : '已作廢'}
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs text-[#9E8F81] mb-1 block">類型</label>
              <div className="text-sm text-[#3D2914]">
                {voucher.type === 'auto' ? '自動產生' : '手工輸入'}
              </div>
            </div>

            <div>
              <label className="text-xs text-[#9E8F81] mb-1 block">來源</label>
              <div className="text-sm text-[#3D2914]">
                {voucher.source_type === 'order_payment' && '訂單收款'}
                {voucher.source_type === 'payment_request' && '付款請求'}
                {voucher.source_type === 'tour_closing' && '結團'}
                {voucher.source_type === 'manual' && '手工輸入'}
              </div>
            </div>

            <div className="md:col-span-1">
              <label className="text-xs text-[#9E8F81] mb-1 block">摘要</label>
              <div className="text-sm text-[#3D2914]">{voucher.description || '-'}</div>
            </div>
          </div>
        </div>

        {/* 傳票分錄 */}
        <div className="bg-white rounded-lg border border-[#E0D8CC] overflow-hidden">
          <div className="px-6 py-4 bg-[#FAF8F5] border-b border-[#E0D8CC]">
            <h3 className="text-lg font-semibold text-[#3D2914]">分錄明細</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#FAF8F5] border-b border-[#E0D8CC]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#6B5D52] w-16">
                    序號
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#6B5D52]">
                    科目代碼
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#6B5D52]">
                    科目名稱
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#6B5D52]">
                    摘要
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[#6B5D52]">
                    借方
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[#6B5D52]">
                    貸方
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E0D8CC]">
                {voucherEntries.map(entry => (
                  <tr key={entry.id} className="hover:bg-[#FAF8F5] transition-colors">
                    <td className="px-4 py-3">
                      <div className="text-sm text-[#9E8F81]">{entry.entry_no}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono text-sm text-[#3D2914]">{entry.subject_code}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-[#3D2914]">{entry.subject_name}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-[#9E8F81]">{entry.description || '-'}</div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div
                        className={cn(
                          'text-sm font-medium',
                          entry.debit > 0 ? 'text-[#3D2914]' : 'text-[#D4C5A8]'
                        )}
                      >
                        {entry.debit > 0 ? `NT$ ${entry.debit.toLocaleString()}` : '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div
                        className={cn(
                          'text-sm font-medium',
                          entry.credit > 0 ? 'text-[#3D2914]' : 'text-[#D4C5A8]'
                        )}
                      >
                        {entry.credit > 0 ? `NT$ ${entry.credit.toLocaleString()}` : '-'}
                      </div>
                    </td>
                  </tr>
                ))}

                {/* 合計列 */}
                <tr className="bg-[#FAF8F5] font-semibold">
                  <td colSpan={4} className="px-4 py-3 text-right text-sm text-[#3D2914]">
                    合計
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-[#3D2914]">
                    NT$ {voucher.total_debit.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-[#3D2914]">
                    NT$ {voucher.total_credit.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 借貸平衡檢查 */}
          <div className="px-6 py-4 bg-[#FAF8F5] border-t border-[#E0D8CC]">
            {voucher.total_debit === voucher.total_credit ? (
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">借貸平衡</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-700">
                <Trash2 className="h-5 w-5" />
                <span className="font-medium">
                  借貸不平衡！差額：NT${' '}
                  {Math.abs(voucher.total_debit - voucher.total_credit).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 作廢資訊 */}
        {voucher.status === 'void' && voucher.void_reason && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Trash2 className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-red-900 mb-1">作廢原因</h4>
                <p className="text-sm text-red-700">{voucher.void_reason}</p>
                {voucher.voided_at && (
                  <p className="text-xs text-red-600 mt-2">
                    作廢時間：{new Date(voucher.voided_at).toLocaleString('zh-TW')}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
