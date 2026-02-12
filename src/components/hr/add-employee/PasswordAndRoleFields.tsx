'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { EmployeeFormData } from './types'
import { type UserRole, ROLES } from '@/lib/rbac-config'
import { COMP_HR_LABELS } from '../constants/labels'

interface PasswordAndRoleFieldsProps {
  formData: EmployeeFormData
  setFormData: (data: EmployeeFormData) => void
}

// 可選擇的角色（排除 super_admin，只有超級管理員才能賦予）
const SELECTABLE_ROLES: { value: UserRole; label: string }[] = [
  { value: 'staff', label: ROLES.staff.label },
  { value: 'sales', label: ROLES.sales.label },
  { value: 'tour_leader', label: ROLES.tour_leader.label },
  { value: 'accountant', label: ROLES.accountant.label },
  { value: 'assistant', label: ROLES.assistant.label },
  { value: 'admin', label: ROLES.admin.label },
]

export function PasswordAndRoleFields({ formData, setFormData }: PasswordAndRoleFieldsProps) {
  const toggleRole = (role: UserRole) => {
    if (formData.roles.includes(role)) {
      setFormData({ ...formData, roles: formData.roles.filter(r => r !== role) })
    } else {
      setFormData({ ...formData, roles: [...formData.roles, role] })
    }
  }

  return (
    <>
      <div>
        <label className="block text-sm font-medium text-morandi-primary mb-1">預設登入密碼</label>
        <Input
          type="text"
          value={formData.defaultPassword}
          onChange={e => setFormData({ ...formData, defaultPassword: e.target.value })}
          placeholder={COMP_HR_LABELS.請設定預設密碼}
          required
        />
        <p className="text-xs text-morandi-muted mt-1">
          員工可使用此密碼首次登入，建議提醒其登入後更改密碼
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-morandi-primary mb-2">
          員工角色（可複選）
        </label>
        <div className="flex flex-wrap gap-4">
          {SELECTABLE_ROLES.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                value={value}
                checked={formData.roles.includes(value)}
                onChange={() => toggleRole(value)}
                className="w-4 h-4 text-morandi-gold focus:ring-morandi-gold rounded"
              />
              <span className="text-sm text-morandi-primary">{label}</span>
            </label>
          ))}
        </div>
        <p className="text-xs text-morandi-muted mt-2">
          角色會影響員工可使用的功能。一般員工請選擇「一般員工」
        </p>
      </div>
    </>
  )
}
