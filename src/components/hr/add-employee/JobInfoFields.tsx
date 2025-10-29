'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { EmployeeFormData } from './types';

interface JobInfoFieldsProps {
  formData: EmployeeFormData;
  setFormData: (data: EmployeeFormData) => void;
}

export function JobInfoFields({ formData, setFormData }: JobInfoFieldsProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-morandi-primary border-b pb-2">職務資料</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-morandi-primary mb-1">入職日期</label>
          <Input
            type="date"
            value={formData.job_info.hire_date}
            onChange={(e) => setFormData({
              ...formData,
              job_info: { ...formData.job_info, hire_date: e.target.value }
            })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-morandi-primary mb-1">起薪</label>
          <Input
            type="number"
            value={formData.salary_info.base_salary}
            onChange={(e) => setFormData({
              ...formData,
              salary_info: { ...formData.salary_info, base_salary: Number(e.target.value) }
            })}
            placeholder="0"
          />
        </div>
      </div>
    </div>
  );
}
