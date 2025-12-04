/**
 * CreateDisbursementDialog
 * 新增出納單對話框
 *
 * 參考 cornerERP 設計：
 * - 上方：出帳日期、出納單號、狀態篩選
 * - 中間：請款編號列表，可搜尋、可勾選
 * - 下方：建立出納單按鈕
 */

'use client'

import { useState, useMemo, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar, Search, X } from 'lucide-react'
import { PaymentRequest, DisbursementOrder } from '@/stores/types'
import { useDisbursementOrderStore, usePaymentRequestStore } from '@/stores'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'
import { statusLabels } from '@/features/finance/requests/types'
import { supabase } from '@/lib/supabase/client'

interface CreateDisbursementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pendingRequests: PaymentRequest[]
  onSuccess: () => void
}

// 計算下一個週四
function getNextThursday(): Date {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const daysUntilThursday = (4 - dayOfWeek + 7) % 7 || 7
  const nextThursday = new Date(today)
  nextThursday.setDate(today.getDate() + daysUntilThursday)
  return nextThursday
}

// 生成出納單號
async function generateDisbursementNumber(existingOrders: DisbursementOrder[]): Promise<string> {
  const now = new Date()
  const year = String(now.getFullYear()).slice(-1)
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const dateStr = `${year}${month}${day}`
  const prefix = `DO${dateStr}`

  const todayOrders = existingOrders.filter(o => o.order_number?.startsWith(prefix))
  let nextNum = 1
  if (todayOrders.length > 0) {
    const lastOrder = todayOrders.sort((a, b) =>
      (b.order_number || '').localeCompare(a.order_number || '')
    )[0]
    const match = lastOrder.order_number?.match(/-(\d+)$/)
    if (match) {
      nextNum = parseInt(match[1], 10) + 1
    }
  }

  return `${prefix}-${String(nextNum).padStart(3, '0')}`
}

// 狀態選項
const STATUS_OPTIONS = [
  { value: 'all', label: '全部狀態' },
  { value: 'pending', label: '請款中' },
  { value: 'approved', label: '已核准' },
  { value: 'confirmed', label: '已確認' },
]

export function CreateDisbursementDialog({
  open,
  onOpenChange,
  pendingRequests,
  onSuccess,
}: CreateDisbursementDialogProps) {
  // Stores
  const { items: disbursement_orders, fetchAll: fetchDisbursementOrders } = useDisbursementOrderStore()
  const { update: updatePaymentRequest } = usePaymentRequestStore()
  const user = useAuthStore(state => state.user)

  // 狀態
  const [disbursementDate, setDisbursementDate] = useState(
    getNextThursday().toISOString().split('T')[0]
  )
  const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 篩選請款單
  const filteredRequests = useMemo(() => {
    return pendingRequests.filter(r => {
      // 搜尋篩選
      if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase()
        const matchSearch =
          r.code?.toLowerCase().includes(lowerSearch) ||
          r.tour_code?.toLowerCase().includes(lowerSearch) ||
          r.tour_name?.toLowerCase().includes(lowerSearch)
        if (!matchSearch) return false
      }

      // 日期篩選
      if (dateFilter) {
        if (!r.created_at || !r.created_at.startsWith(dateFilter)) return false
      }

      // 狀態篩選
      if (statusFilter !== 'all') {
        if (r.status !== statusFilter) return false
      }

      return true
    })
  }, [pendingRequests, searchTerm, dateFilter, statusFilter])

  // 選中的總金額
  const selectedAmount = useMemo(() => {
    return pendingRequests
      .filter(r => selectedRequestIds.includes(r.id))
      .reduce((sum, r) => sum + (r.amount || 0), 0)
  }, [pendingRequests, selectedRequestIds])

  // 切換選擇
  const toggleSelect = useCallback((requestId: string) => {
    setSelectedRequestIds(prev =>
      prev.includes(requestId)
        ? prev.filter(id => id !== requestId)
        : [...prev, requestId]
    )
  }, [])

  // 全選/取消全選
  const toggleSelectAll = useCallback(() => {
    if (selectedRequestIds.length === filteredRequests.length && filteredRequests.length > 0) {
      setSelectedRequestIds([])
    } else {
      setSelectedRequestIds(filteredRequests.map(r => r.id))
    }
  }, [filteredRequests, selectedRequestIds])

  // 設為今日
  const setToday = useCallback(() => {
    setDateFilter(new Date().toISOString().split('T')[0])
  }, [])

  // 清除篩選
  const clearFilters = useCallback(() => {
    setSearchTerm('')
    setDateFilter('')
    setStatusFilter('all')
  }, [])

  // 建立出納單
  const handleCreate = useCallback(async () => {
    if (selectedRequestIds.length === 0) {
      alert('請選擇至少一張請款單')
      return
    }

    setIsSubmitting(true)
    try {
      // 生成出納單號
      const orderNumber = await generateDisbursementNumber(disbursement_orders)

      // 直接使用 Supabase 建立出納單（繞過 store 的 workspace_id 檢查）
      const { data, error } = await supabase
        .from('disbursement_orders')
        .insert({
          order_number: orderNumber,
          disbursement_date: disbursementDate,
          payment_request_ids: selectedRequestIds,
          total_amount: selectedAmount,
          status: 'pending',
          created_by: user.id,
          workspace_id: user?.workspace_id || null,
        })
        .select()
        .single()

      if (error) {
        console.error('Supabase 錯誤:', error)
        throw new Error(error.message)
      }

      console.log('✅ 出納單已建立:', data)

      // 更新請款單狀態為 processing
      for (const id of selectedRequestIds) {
        await updatePaymentRequest(id, { status: 'processing' })
      }

      // 重新載入出納單列表
      await fetchDisbursementOrders()

      alert(`✅ 出納單 ${orderNumber} 建立成功`)

      // 重置狀態
      setSelectedRequestIds([])
      setSearchTerm('')
      setDateFilter('')
      setStatusFilter('all')
      onSuccess()
    } catch (error) {
      console.error('建立出納單失敗:', error)
      const errorMessage = error instanceof Error ? error.message : '未知錯誤'
      alert(`❌ 建立出納單失敗: ${errorMessage}`)
    } finally {
      setIsSubmitting(false)
    }
  }, [
    selectedRequestIds,
    selectedAmount,
    disbursementDate,
    disbursement_orders,
    user,
    fetchDisbursementOrders,
    updatePaymentRequest,
    onSuccess,
  ])

  // 關閉時重置
  const handleClose = useCallback((isOpen: boolean) => {
    if (!isOpen) {
      setSelectedRequestIds([])
      setSearchTerm('')
      setDateFilter('')
      setStatusFilter('all')
    }
    onOpenChange(isOpen)
  }, [onOpenChange])

  // 取得狀態顯示
  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-morandi-gold',
      approved: 'bg-blue-500',
      confirmed: 'bg-morandi-green',
      processing: 'bg-orange-500',
    }
    return (
      <Badge className={cn('text-white text-xs', colors[status] || 'bg-gray-500')}>
        {statusLabels[status] || status}
      </Badge>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-7xl h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl">新增出納單</DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex flex-col space-y-4">
          {/* 第一列：出帳日期、出納單號 */}
          <div className="grid grid-cols-2 gap-4 flex-shrink-0">
            <div className="space-y-1">
              <label className="text-sm text-morandi-muted">出帳日期 *</label>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={disbursementDate}
                  onChange={(e) => setDisbursementDate(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm text-morandi-muted">出納單號</label>
              <Input
                value="（自動產生）"
                disabled
                className="bg-morandi-background/50"
              />
            </div>
          </div>

          {/* 第二列：狀態篩選 */}
          <div className="space-y-1 flex-shrink-0">
            <label className="text-sm text-morandi-muted">狀態</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-morandi-primary bg-background"
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* 請款編號列表標題 + 篩選 */}
          <div className="flex items-center justify-between flex-shrink-0">
            <h3 className="font-semibold text-morandi-primary">
              請款編號列表
              {selectedRequestIds.length > 0 && (
                <span className="ml-2 text-morandi-gold">
                  （已選 {selectedRequestIds.length} 筆，共 NT$ {selectedAmount.toLocaleString()}）
                </span>
              )}
            </h3>
            <div className="flex items-center gap-2">
              {/* 搜尋 */}
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-morandi-muted" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="搜尋請款編號或團名"
                  className="pl-9 w-56"
                />
              </div>
              {/* 出帳日期篩選 */}
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                placeholder="搜尋出帳日期"
                className="w-40"
              />
              {/* 當日按鈕 */}
              <Button
                variant="outline"
                size="sm"
                onClick={setToday}
                className="whitespace-nowrap"
              >
                <Calendar size={14} className="mr-1" />
                當日
              </Button>
              {/* 清除按鈕 */}
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="whitespace-nowrap"
              >
                <X size={14} className="mr-1" />
                清除
              </Button>
            </div>
          </div>

          {/* 請款單列表 */}
          <div className="flex-1 min-h-0 overflow-auto border border-morandi-container/20 rounded-lg">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-morandi-background z-10">
                <tr className="border-b border-morandi-container/20">
                  <th className="py-3 px-4 text-left w-12">
                    <Checkbox
                      checked={selectedRequestIds.length === filteredRequests.length && filteredRequests.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </th>
                  <th className="py-3 px-4 text-left text-morandi-muted font-medium">請款編號</th>
                  <th className="py-3 px-4 text-left text-morandi-muted font-medium">團名</th>
                  <th className="py-3 px-4 text-left text-morandi-muted font-medium">出帳日期</th>
                  <th className="py-3 px-4 text-left text-morandi-muted font-medium">請款人</th>
                  <th className="py-3 px-4 text-right text-morandi-muted font-medium">總金額</th>
                  <th className="py-3 px-4 text-center text-morandi-muted font-medium">狀態</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-morandi-muted">
                      沒有符合條件的請款單
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map(request => (
                    <tr
                      key={request.id}
                      className={cn(
                        'border-b border-morandi-container/10 cursor-pointer hover:bg-morandi-background/30 transition-colors',
                        selectedRequestIds.includes(request.id) && 'bg-morandi-gold/10'
                      )}
                      onClick={() => toggleSelect(request.id)}
                    >
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedRequestIds.includes(request.id)}
                          onCheckedChange={() => toggleSelect(request.id)}
                        />
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-blue-600 hover:underline">
                          {request.code}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-morandi-primary max-w-[200px] truncate">
                        {request.tour_name || '-'}
                      </td>
                      <td className="py-3 px-4 text-morandi-secondary">
                        {request.created_at?.split('T')[0] || '-'}
                      </td>
                      <td className="py-3 px-4 text-morandi-secondary">
                        {request.created_by_name || '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                        {(request.amount || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {getStatusBadge(request.status || 'pending')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 mt-4">
          <Button variant="outline" onClick={() => handleClose(false)}>
            取消
          </Button>
          <Button
            onClick={handleCreate}
            disabled={selectedRequestIds.length === 0 || isSubmitting}
            className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
          >
            {isSubmitting ? '建立中...' : `建立出納單（${selectedRequestIds.length} 筆）`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
