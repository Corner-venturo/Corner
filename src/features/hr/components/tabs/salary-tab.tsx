'use client'

import React, { forwardRef, useImperativeHandle, useState } from 'react'
import { Employee } from '@/stores/types'
import { TrendingUp } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useUserStore } from '@/stores/user-store'
import { DateCell, CurrencyCell } from '@/components/table-cells'
import { HR_LABELS } from './constants/labels'

interface SalaryTabProps {
  employee: Employee
  isEditing?: boolean
  setIsEditing?: (editing: boolean) => void
}

export const SalaryTab = forwardRef<{ handleSave: () => void }, SalaryTabProps>(
  ({ employee, isEditing }, ref) => {
    const employeeWithSalary = employee as Employee & { monthly_salary?: number }
    const [monthlySalary, setMonthlySalary] = useState(employeeWithSalary.monthly_salary ?? 30000)
    const { update } = useUserStore()

    useImperativeHandle(ref, () => ({
      handleSave: async () => {
        await update(employee.id, { monthly_salary: monthlySalary } as Partial<Employee & { monthly_salary: number }>)
      },
    }))

    const allowances = employee.salary_info?.allowances || []
    const totalAllowances = allowances.reduce((sum, allowance) => sum + allowance.amount, 0)
    const baseSalary = employee.salary_info?.base_salary || 0
    const salaryHistory = employee.salary_info?.salary_history || []

    return (
      <div className="space-y-6">
        {/* 月薪設定（主要薪資）*/}
        <div className="bg-morandi-gold/10 rounded-lg p-4 border-2 border-morandi-gold/30">
          <h4 className="font-medium text-morandi-primary mb-3">{HR_LABELS.LABEL_5360}</h4>
          <div className="flex items-center gap-4">
            {isEditing ? (
              <>
                <span className="text-sm text-morandi-secondary">NT$</span>
                <Input
                  type="number"
                  value={monthlySalary}
                  onChange={e => setMonthlySalary(Number(e.target.value))}
                  className="w-48 text-xl font-bold"
                />
              </>
            ) : (
              <CurrencyCell amount={monthlySalary} className="text-3xl font-bold text-morandi-primary" />
            )}
          </div>
          <p className="text-xs text-morandi-secondary mt-2">{HR_LABELS.LABEL_3358}</p>
        </div>

        {/* 目前薪資資訊（舊系統 salary_info）*/}
        {(baseSalary > 0 || allowances.length > 0) && (
          <div className="bg-morandi-container/10 rounded-lg p-4">
            <h4 className="font-medium text-morandi-primary mb-3 text-sm">{HR_LABELS.LABEL_6093}</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <CurrencyCell amount={baseSalary} className="text-xl font-bold text-morandi-primary" />
                <p className="text-xs text-morandi-muted">{HR_LABELS.LABEL_786}</p>
              </div>
              <div className="text-center">
                <CurrencyCell amount={totalAllowances} className="text-xl font-bold text-morandi-gold" />
                <p className="text-xs text-morandi-muted">{HR_LABELS.LABEL_295}</p>
              </div>
              <div className="text-center">
                <CurrencyCell amount={baseSalary + totalAllowances} className="text-xl font-bold text-status-success" />
                <p className="text-xs text-morandi-muted">{HR_LABELS.TOTAL_2192}</p>
              </div>
            </div>
          </div>
        )}

        {/* 津貼明細 */}
        <div className="bg-morandi-container/10 rounded-lg p-4">
          <h4 className="font-medium text-morandi-primary mb-3">{HR_LABELS.LABEL_4237}</h4>
          {allowances.length > 0 ? (
            <div className="space-y-2">
              {allowances.map((allowance, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center py-2 border-b border-border/30"
                >
                  <span className="text-morandi-primary">{allowance.type}</span>
                  <CurrencyCell amount={allowance.amount} className="font-medium" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-morandi-muted text-sm">{HR_LABELS.LABEL_8719}</p>
          )}
        </div>

        {/* 薪資調整歷史 */}
        <div className="bg-morandi-container/10 rounded-lg p-4">
          <h4 className="font-medium text-morandi-primary mb-3 flex items-center gap-2">
            <TrendingUp size={16} />
            {HR_LABELS.LABEL_4231}
          </h4>
          <div className="space-y-3">
            {salaryHistory.map((record, index: number) => (
              <div
                key={index}
                className="flex justify-between items-center p-3 bg-card rounded border"
              >
                <div>
                  <CurrencyCell amount={record.base_salary} className="font-medium text-morandi-primary" />
                  <p className="text-sm text-morandi-muted">{record.reason}</p>
                </div>
                <div className="text-right">
                  <DateCell date={record.effective_date} showIcon={false} className="text-sm text-morandi-secondary" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }
)
