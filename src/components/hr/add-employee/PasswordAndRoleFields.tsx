'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { EmployeeFormData } from './types';

interface PasswordAndRoleFieldsProps {
  formData: EmployeeFormData;
  setFormData: (data: EmployeeFormData) => void;
}

type EmployeeRole = 'user' | 'employee' | 'admin' | 'tour_leader' | 'sales' | 'accountant' | 'assistant';

export function PasswordAndRoleFields({ formData, setFormData }: PasswordAndRoleFieldsProps) {
  const toggleRole = (role: EmployeeRole) => {
    if (formData.roles.includes(role)) {
      setFormData({ ...formData, roles: formData.roles.filter(r => r !== role) });
    } else {
      setFormData({ ...formData, roles: [...formData.roles, role] });
    }
  };

  return (
    <>
      <div>
        <label className="block text-sm font-medium text-morandi-primary mb-1">
          預設登入密碼
        </label>
        <Input
          type="text"
          value={formData.defaultPassword}
          onChange={(e) => setFormData({ ...formData, defaultPassword: e.target.value })}
          placeholder="請設定預設密碼"
          required
        />
        <p className="text-xs text-morandi-muted mt-1">
          員工可使用此密碼首次登入，建議提醒其登入後更改密碼
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-morandi-primary mb-2">
          附加身份標籤（可複選）
        </label>
        <div className="flex flex-wrap gap-4">
          {([
            { value: 'user', label: '普通使用者' },
            { value: 'employee', label: '員工' },
            { value: 'admin', label: '管理員' },
            { value: 'tour_leader', label: '領隊' },
            { value: 'sales', label: '業務' },
            { value: 'accountant', label: '會計' },
            { value: 'assistant', label: '助理' }
          ] as const).map(({ value, label }) => (
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
          此標籤僅用於篩選，不影響實際權限功能。可勾選多個身份
        </p>
      </div>
    </>
  );
}
