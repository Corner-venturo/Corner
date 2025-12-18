'use client'

import { useState, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Employee } from '@/stores/types'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'

interface SalaryPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employees: Employee[]
  onSubmit: (data: SalaryPaymentData) => Promise<void>
}

export interface SalaryPaymentData {
  request_date: string
  is_special_billing: boolean
  employee_salaries: Array<{
    employee_id: string
    employee_name: string
    amount: number
  }>
  note: string
}

export function SalaryPaymentDialog({ open, onOpenChange, employees, onSubmit }: SalaryPaymentDialogProps) {
  const currentUser = useAuthStore(state => state.user)
  const [requestDate, setRequestDate] = useState('')
  const [isSpecialBilling, setIsSpecialBilling] = useState(false)
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([])
  const [customAmounts, setCustomAmounts] = useState<Record<string, number>>({})
  const [note, setNote] = useState('')

  // Generate upcoming Thursdays for request date
  const upcomingThursdays = useMemo(() => {
    const thursdays = []
    const today = new Date()
    const currentDay = today.getDay()
    let daysUntilThursday = (4 - currentDay + 7) % 7

    for (let i = 0; i < 20; i++) {
      const thursdayDate = new Date(today)
      thursdayDate.setDate(today.getDate() + daysUntilThursday + i * 7)
      thursdays.push(thursdayDate.toISOString().split('T')[0])
    }
    return thursdays
  }, [])

  // Filter active employees by workspace
  const activeEmployees = useMemo(
    () =>
      employees
        .filter(emp => {
          // 過濾特殊帳號
          if (emp.employee_number === 'liao00') return false

          // 只顯示同一個 workspace 的員工
          const isSameWorkspace = emp.workspace_id === currentUser?.workspace_id
          const isActive = emp.status === 'active' || emp.status === 'probation'
          return isSameWorkspace && isActive
        })
        .map(emp => ({
          ...emp,
          monthly_salary: emp.salary_info?.base_salary ?? 30000,
        })),
    [employees, currentUser?.workspace_id]
  )

  // Toggle employee selection
  const toggleEmployee = (employeeId: string) => {
    setSelectedEmployeeIds(prev =>
      prev.includes(employeeId) ? prev.filter(id => id !== employeeId) : [...prev, employeeId]
    )
  }

  // Calculate total amount
  const totalAmount = useMemo(() => {
    return selectedEmployeeIds.reduce((sum, empId) => {
      const employee = activeEmployees.find(e => e.id === empId)
      const amount = customAmounts[empId] ?? employee?.monthly_salary ?? 30000
      return sum + amount
    }, 0)
  }, [selectedEmployeeIds, customAmounts, activeEmployees])

  const handleSubmit = async () => {
    if (!requestDate || selectedEmployeeIds.length === 0) return

    const employeeSalaries = selectedEmployeeIds.map(empId => {
      const employee = activeEmployees.find(e => e.id === empId)!
      return {
        employee_id: empId,
        employee_name: employee.display_name || employee.chinese_name,
        amount: customAmounts[empId] ?? employee.monthly_salary ?? 30000,
      }
    })

    await onSubmit({
      request_date: requestDate,
      is_special_billing: isSpecialBilling,
      employee_salaries: employeeSalaries,
      note,
    })

    // Reset form
    setRequestDate('')
    setIsSpecialBilling(false)
    setSelectedEmployeeIds([])
    setCustomAmounts({})
    setNote('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>薪資請款</DialogTitle>
          <p className="text-sm text-morandi-secondary">為員工建立薪資請款單</p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Request Date */}
          <div className="border border-border rounded-lg p-4">
            <h3 className="text-sm font-medium text-morandi-primary mb-4">請款資訊</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-morandi-secondary">
                    請款日期 <span className="text-morandi-red">*</span>
                  </label>
                  <div className="flex items-center space-x-1">
                    <input
                      type="checkbox"
                      id="isSpecialBilling"
                      checked={isSpecialBilling}
                      onChange={e => {
                        setIsSpecialBilling(e.target.checked)
                        setRequestDate('')
                      }}
                      className="rounded border-border"
                    />
                    <label htmlFor="isSpecialBilling" className="text-xs text-morandi-primary cursor-pointer">
                      特殊出帳
                    </label>
                  </div>
                </div>

                {isSpecialBilling ? (
                  <DatePicker
                    value={requestDate}
                    onChange={date => setRequestDate(date)}
                    placeholder="選擇日期"
                    className="bg-morandi-gold/10 border-morandi-container/30"
                  />
                ) : (
                  <Select value={requestDate} onValueChange={setRequestDate}>
                    <SelectTrigger className="border-morandi-container/30">
                      <SelectValue placeholder="選擇請款日期（週四）" />
                    </SelectTrigger>
                    <SelectContent>
                      {upcomingThursdays.map(date => (
                        <SelectItem key={date} value={date}>
                          {new Date(date).toLocaleDateString('zh-TW', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            weekday: 'short',
                          })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-morandi-secondary">備註（選填）</label>
                <Input
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="輸入備註..."
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Employee Selection */}
          <div className="border border-border rounded-lg p-4">
            <h3 className="text-sm font-medium text-morandi-primary mb-4">
              選擇員工（已選 {selectedEmployeeIds.length} 人）
            </h3>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {activeEmployees.map(employee => {
                const isSelected = selectedEmployeeIds.includes(employee.id)
                const amount = customAmounts[employee.id] ?? employee.monthly_salary ?? 30000

                return (
                  <div
                    key={employee.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded border transition-colors',
                      isSelected ? 'bg-morandi-gold/10 border-morandi-gold' : 'bg-white border-border'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleEmployee(employee.id)}
                      className="w-4 h-4 rounded border-morandi-container"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">
                        {employee.display_name || employee.chinese_name}
                      </div>
                      <div className="text-xs text-morandi-secondary">
                        {employee.personal_info?.email || 'N/A'} · 預設薪資: NT$ {(employee.monthly_salary ?? 30000).toLocaleString()}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm text-morandi-secondary whitespace-nowrap">本次金額：</span>
                        <Input
                          type="number"
                          value={amount}
                          onChange={e => setCustomAmounts(prev => ({ ...prev, [employee.id]: Number(e.target.value) }))}
                          className="w-32 h-9 text-right"
                          placeholder="0"
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Summary */}
          {selectedEmployeeIds.length > 0 && (
            <div className="border-t border-border pt-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-morandi-primary">
                  總計（{selectedEmployeeIds.length} 人）：
                </span>
                <span className="text-xl font-bold text-morandi-gold">NT$ {totalAmount.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!requestDate || selectedEmployeeIds.length === 0}
              className="bg-morandi-primary hover:bg-morandi-primary/90 text-white"
            >
              建立請款單（{selectedEmployeeIds.length} 人，NT$ {totalAmount.toLocaleString()}）
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
