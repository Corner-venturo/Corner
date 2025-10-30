'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Employee } from '@/stores/types'
import { BasicInfoFormData } from './types'

interface EmploymentInfoSectionProps {
  employee: Employee
  isEditing: boolean
  formData: BasicInfoFormData
  setFormData: (data: BasicInfoFormData) => void
}

export function EmploymentInfoSection({
  employee,
  isEditing,
  formData,
  setFormData,
}: EmploymentInfoSectionProps) {
  return (
    <div className="bg-morandi-container/10 rounded-lg p-4">
      <h4 className="font-medium text-morandi-primary mb-3">職務資料</h4>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-morandi-primary mb-1">入職日期</label>
          {isEditing ? (
            <Input
              type="date"
              value={formData.job_info.hire_date}
              onChange={e =>
                setFormData({
                  ...formData,
                  job_info: { ...formData.job_info, hire_date: e.target.value },
                })
              }
            />
          ) : (
            <p className="text-morandi-primary py-2">
              {new Date(employee.job_info.hire_date).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
