'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Calendar } from 'lucide-react';
import { Employee } from '@/stores/types';
import { BasicInfoFormData } from './types';

interface PersonalInfoSectionProps {
  employee: Employee;
  isEditing: boolean;
  formData: BasicInfoFormData;
  setFormData: (data: BasicInfoFormData) => void;
}

export function PersonalInfoSection({ employee, isEditing, formData, setFormData }: PersonalInfoSectionProps) {
  return (
    <div className="bg-morandi-container/10 rounded-lg p-4">
      <h4 className="font-medium text-morandi-primary mb-3">個人資料</h4>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-morandi-primary mb-1">
              顯示名稱
            </label>
            {isEditing ? (
              <Input
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              />
            ) : (
              <p className="text-morandi-primary py-2">{employee.display_name}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-morandi-primary mb-1">
              中文姓名
            </label>
            {isEditing ? (
              <Input
                value={formData.chinese_name}
                onChange={(e) => setFormData({ ...formData, chinese_name: e.target.value })}
              />
            ) : (
              <p className="text-morandi-primary py-2">{(employee as any).chinese_name || '-'}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-morandi-primary mb-1">
              英文姓名
            </label>
            {isEditing ? (
              <Input
                value={formData.english_name}
                onChange={(e) => setFormData({ ...formData, english_name: e.target.value })}
              />
            ) : (
              <p className="text-morandi-primary py-2">{employee.english_name}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-morandi-primary mb-1">
              員工編號
            </label>
            <p className="text-morandi-primary py-2 bg-morandi-container/20 px-3 rounded">
              {employee.employee_number}
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-morandi-primary mb-1">
            身分證號
          </label>
          {isEditing ? (
            <Input
              value={formData.personal_info.national_id}
              onChange={(e) => setFormData({
                ...formData,
                personal_info: { ...formData.personal_info, national_id: e.target.value }
              })}
            />
          ) : (
            <p className="text-morandi-primary py-2">{employee.personal_info.national_id}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-morandi-primary mb-1 flex items-center gap-1">
            <Calendar size={14} />
            生日
          </label>
          {isEditing ? (
            <Input
              type="date"
              value={formData.personal_info.birthday}
              onChange={(e) => setFormData({
                ...formData,
                personal_info: { ...formData.personal_info, birthday: e.target.value }
              })}
            />
          ) : (
            <p className="text-morandi-primary py-2">
              {new Date(employee.personal_info.birthday).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
