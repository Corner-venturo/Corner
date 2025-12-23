'use client'

import { logger } from '@/lib/utils/logger'
import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tour } from '@/types/tour.types'
import { PaymentRequest } from '@/stores/types'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { toast } from 'sonner'
import { Plus, X } from 'lucide-react'
import { confirm } from '@/lib/ui/alert-dialog'

interface Employee {
  id: string
  name: string
}

interface BonusRecipient {
  employeeId: string
  percentage: number
}

interface TourCloseDialogProps {
  tour: Tour
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function TourCloseDialog({ tour, open, onOpenChange, onSuccess }: TourCloseDialogProps) {
  const user = useAuthStore(state => state.user)
  const [loading, setLoading] = useState(false)
  const [calculating, setCalculating] = useState(true)
  const [employees, setEmployees] = useState<Employee[]>([])

  // 計算數據
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [totalCost, setTotalCost] = useState(0)
  const [memberCount, setMemberCount] = useState(0)
  const [grossProfit, setGrossProfit] = useState(0)
  const [miscExpense, setMiscExpense] = useState(0)
  const [tax, setTax] = useState(0)
  const [netProfit, setNetProfit] = useState(0)

  // 業務業績（可多人）
  const [salesRecipients, setSalesRecipients] = useState<BonusRecipient[]>([
    { employeeId: '', percentage: 0 }
  ])

  // OP 獎金（可多人）
  const [opRecipients, setOpRecipients] = useState<BonusRecipient[]>([
    { employeeId: '', percentage: 0 }
  ])

  // 載入員工列表
  useEffect(() => {
    if (open) {
      loadEmployees()
      calculateTourFinance()
    }
     
  }, [open, tour.id])

  const loadEmployees = async () => {
    try {
      // 取得當前 workspace
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('id')
        .limit(1)
        .single()

      if (!workspace) {
        logger.error('找不到工作空間')
        return
      }

      // 只載入同一 workspace 的員工
      const { data, error } = await supabase
        .from('employees')
        .select('id, display_name')
        .eq('workspace_id', workspace.id)
        .order('display_name')

      if (error) throw error
      if (data) {
        setEmployees(
          data.map(emp => ({
            id: emp.id,
            name: emp.display_name || '',
          }))
        )
      }
    } catch (error) {
      logger.error('載入員工失敗:', error)
    }
  }

  const calculateTourFinance = async () => {
    try {
      setCalculating(true)

      // 1. 計算總收入（該團所有訂單的收款）
      const { data: orders } = await supabase
        .from('orders')
        .select('id, paid_amount')
        .eq('tour_id', tour.id)

      const revenue = orders?.reduce((sum, o) => sum + (o.paid_amount || 0), 0) || 0
      setTotalRevenue(revenue)

      const orderIds = orders?.map(o => o.id) || []
      let cost = 0
      let members = 0

      if (orderIds.length > 0) {
        // 平行查詢：成本和團員數
        const [paymentsRes, membersRes] = await Promise.all([
          supabase
            .from('payment_requests')
            .select('amount')
            .in('order_id', orderIds)
            .eq('status', 'paid'),
          supabase
            .from('order_members')
            .select('id')
            .in('order_id', orderIds),
        ])

        cost = paymentsRes.data?.reduce((sum: number, pr: Pick<PaymentRequest, 'amount'>) => sum + (pr.amount || 0), 0) || 0
        members = membersRes.data?.length || 0
      }

      setTotalCost(cost)
      setMemberCount(members)

      // 計算各項數值
      const gross = revenue - cost
      const misc = members * 10
      const taxAmount = Math.round((gross - misc) * 0.12)
      const net = gross - misc - taxAmount

      setGrossProfit(gross)
      setMiscExpense(misc)
      setTax(taxAmount)
      setNetProfit(net)
    } catch (error) {
      logger.error('計算團體財務失敗:', error)
      toast.error('計算失敗')
    } finally {
      setCalculating(false)
    }
  }

  // 新增業務
  const addSalesRecipient = () => {
    setSalesRecipients([...salesRecipients, { employeeId: '', percentage: 0 }])
  }

  // 移除業務
  const removeSalesRecipient = (index: number) => {
    setSalesRecipients(salesRecipients.filter((_, i) => i !== index))
  }

  // 新增 OP
  const addOpRecipient = () => {
    setOpRecipients([...opRecipients, { employeeId: '', percentage: 0 }])
  }

  // 移除 OP
  const removeOpRecipient = (index: number) => {
    setOpRecipients(opRecipients.filter((_, i) => i !== index))
  }

  // 確認結團
  const handleCloseTour = async () => {
    // 驗證
    const salesTotal = salesRecipients.reduce((sum, r) => sum + r.percentage, 0)
    const opTotal = opRecipients.reduce((sum, r) => sum + r.percentage, 0)

    if (salesRecipients.some(r => !r.employeeId)) {
      toast.error('請選擇所有業務人員')
      return
    }

    if (opRecipients.some(r => !r.employeeId)) {
      toast.error('請選擇所有 OP 人員')
      return
    }

    const confirmed = await confirm(`確定要結團嗎？結團後將無法修改。\n\n業務業績：${salesTotal}%\nOP 獎金：${opTotal}%`, {
      title: '結團確認',
      type: 'warning',
    })
    if (!confirmed) {
      return
    }

    setLoading(true)
    try {
      // 取得第一個訂單 ID（用於關聯請款單）
      const { data: firstOrder } = await supabase
        .from('orders')
        .select('id')
        .eq('tour_id', tour.id)
        .limit(1)
        .single()

      const orderId = firstOrder?.id

      // 批量產生獎金請款單（避免 N+1 寫入）
      const bonusPayments: Array<{
        order_id: string | undefined
        supplier_name: string
        supplier_type: string
        amount: number
        note: string
        status: string
        workspace_id: string | undefined
      }> = []

      // 1. 收集業務業績請款單
      for (const recipient of salesRecipients) {
        if (recipient.percentage > 0) {
          const amount = Math.round(netProfit * (recipient.percentage / 100))
          bonusPayments.push({
            order_id: orderId,
            supplier_name: '業務業績',
            supplier_type: 'bonus',
            amount,
            note: `業務業績 ${recipient.percentage}%`,
            status: 'pending',
            workspace_id: user?.workspace_id,
          })
        }
      }

      // 2. 收集 OP 獎金請款單
      for (const recipient of opRecipients) {
        if (recipient.percentage > 0) {
          const amount = Math.round(netProfit * (recipient.percentage / 100))
          bonusPayments.push({
            order_id: orderId,
            supplier_name: 'OP 獎金',
            supplier_type: 'bonus',
            amount,
            note: `OP 獎金 ${recipient.percentage}%`,
            status: 'pending',
            workspace_id: user?.workspace_id,
          })
        }
      }

      // 3. 批量寫入
      if (bonusPayments.length > 0) {
        await (supabase as any).from('payment_requests').insert(bonusPayments)
      }

      // 4. 更新團體狀態為已結團
      const { error: updateError } = await supabase
        .from('tours')
        .update({
          status: '結案',
          closing_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', tour.id)

      if (updateError) throw updateError

      toast.success('結團成功！')
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      logger.error('結團失敗:', error)
      toast.error('結團失敗')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>團體結算 - {tour.name}</DialogTitle>
        </DialogHeader>

        {calculating ? (
          <div className="py-8 text-center text-morandi-secondary">計算中...</div>
        ) : (
          <div className="space-y-6">
            {/* 財務摘要 */}
            <div className="bg-morandi-container/20 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-morandi-secondary">團費收入</span>
                <span className="font-medium">${totalRevenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-morandi-secondary">成本支出</span>
                <span className="font-medium text-red-600">-${totalCost.toLocaleString()}</span>
              </div>
              <div className="border-t border-morandi-gold/20 pt-2 flex justify-between">
                <span className="font-medium">毛利</span>
                <span className="font-bold text-lg">${grossProfit.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-morandi-secondary">公司雜支 ({memberCount} 人 × $10)</span>
                <span className="font-medium text-red-600">-${miscExpense.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-morandi-secondary">稅金 (12%)</span>
                <span className="font-medium text-red-600">-${tax.toLocaleString()}</span>
              </div>
              <div className="border-t border-morandi-gold/20 pt-2 flex justify-between">
                <span className="font-bold">淨利潤</span>
                <span className="font-bold text-xl text-green-600">${netProfit.toLocaleString()}</span>
              </div>
            </div>

            {/* 業務業績 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-base font-semibold">業務業績</Label>
                <Button variant="outline" size="sm" onClick={addSalesRecipient}>
                  <Plus size={14} className="mr-1" />
                  新增業務
                </Button>
              </div>
              <div className="space-y-2">
                {salesRecipients.map((recipient, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Select
                      value={recipient.employeeId}
                      onValueChange={value => {
                        const newRecipients = [...salesRecipients]
                        newRecipients[index].employeeId = value
                        setSalesRecipients(newRecipients)
                      }}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="選擇業務" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map(emp => (
                          <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      value={recipient.percentage || ''}
                      onChange={e => {
                        const newRecipients = [...salesRecipients]
                        newRecipients[index].percentage = parseFloat(e.target.value) || 0
                        setSalesRecipients(newRecipients)
                      }}
                      className="w-24"
                      placeholder="%"
                    />
                    <span className="text-sm text-morandi-secondary min-w-[80px]">
                      ${Math.round(netProfit * (recipient.percentage / 100)).toLocaleString()}
                    </span>
                    {salesRecipients.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSalesRecipient(index)}
                      >
                        <X size={16} />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* OP 獎金 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-base font-semibold">OP 獎金</Label>
                <Button variant="outline" size="sm" onClick={addOpRecipient}>
                  <Plus size={14} className="mr-1" />
                  新增 OP
                </Button>
              </div>
              <div className="space-y-2">
                {opRecipients.map((recipient, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Select
                      value={recipient.employeeId}
                      onValueChange={value => {
                        const newRecipients = [...opRecipients]
                        newRecipients[index].employeeId = value
                        setOpRecipients(newRecipients)
                      }}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="選擇 OP" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map(emp => (
                          <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      value={recipient.percentage || ''}
                      onChange={e => {
                        const newRecipients = [...opRecipients]
                        newRecipients[index].percentage = parseFloat(e.target.value) || 0
                        setOpRecipients(newRecipients)
                      }}
                      className="w-24"
                      placeholder="%"
                    />
                    <span className="text-sm text-morandi-secondary min-w-[80px]">
                      ${Math.round(netProfit * (recipient.percentage / 100)).toLocaleString()}
                    </span>
                    {opRecipients.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeOpRecipient(index)}
                      >
                        <X size={16} />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 按鈕 */}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button onClick={handleCloseTour} disabled={loading}>
                {loading ? '處理中...' : '確認結團'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
