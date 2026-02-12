'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { userStoreHelpers } from '@/stores/user-store'
import { EmployeeFormData } from './types'
import { COMP_HR_LABELS } from '../constants/labels'

interface BasicInfoFieldsProps {
  formData: EmployeeFormData
  setFormData: (data: EmployeeFormData) => void
}

export function BasicInfoFields({ formData, setFormData }: BasicInfoFieldsProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-morandi-primary border-b pb-2">基本資料</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-morandi-primary mb-1">顯示名稱 *</label>
          <Input
            value={formData.display_name}
            onChange={e => setFormData({ ...formData, display_name: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-morandi-primary mb-1">中文姓名</label>
          <Input
            value={formData.chinese_name}
            onChange={e => setFormData({ ...formData, chinese_name: e.target.value })}
            placeholder={COMP_HR_LABELS.例_王小明}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-morandi-primary mb-1">
            英文姓名 *
          </label>
          <Input
            value={formData.english_name}
            onChange={e => setFormData({ ...formData, english_name: e.target.value })}
            placeholder={COMP_HR_LABELS.例_John}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-morandi-primary mb-1">
            員工編號（自動生成）
          </label>
          <Input
            value={userStoreHelpers.generateUserNumber()}
            disabled
            className="bg-morandi-container/20"
          />
          <p className="text-xs text-morandi-muted mt-1">
            格式：E001, E002...
          </p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-morandi-primary mb-1">身分證號</label>
        <Input
          value={formData.personal_info.national_id}
          onChange={e =>
            setFormData({
              ...formData,
              personal_info: { ...formData.personal_info, national_id: e.target.value },
            })
          }
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-morandi-primary mb-1">生日</label>
        <DatePicker
          value={formData.personal_info.birthday}
          onChange={date =>
            setFormData({
              ...formData,
              personal_info: { ...formData.personal_info, birthday: date },
            })
          }
          placeholder={COMP_HR_LABELS.選擇日期}
        />
      </div>
    </div>
  )
}
