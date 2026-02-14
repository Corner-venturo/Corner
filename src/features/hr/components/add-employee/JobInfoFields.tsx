'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { EmployeeFormData } from './types'
import { COMP_HR_LABELS } from '@/features/hr/constants/labels'

interface JobInfoFieldsProps {
  formData: EmployeeFormData
  setFormData: (data: EmployeeFormData) => void
}

export function JobInfoFields({ formData, setFormData }: JobInfoFieldsProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-morandi-primary border-b pb-2">{COMP_HR_LABELS.LABEL_2872}</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-morandi-primary mb-1">{COMP_HR_LABELS.LABEL_9610}</label>
          <DatePicker
            value={formData.job_info.hire_date}
            onChange={date =>
              setFormData({
                ...formData,
                job_info: { ...formData.job_info, hire_date: date },
              })
            }
            placeholder={COMP_HR_LABELS.選擇日期}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-morandi-primary mb-1">{COMP_HR_LABELS.LABEL_8149}</label>
          <Input
            type="number"
            value={formData.salary_info.base_salary}
            onChange={e =>
              setFormData({
                ...formData,
                salary_info: { ...formData.salary_info, base_salary: Number(e.target.value) },
              })
            }
            placeholder="0"
          />
        </div>
      </div>
    </div>
  )
}
