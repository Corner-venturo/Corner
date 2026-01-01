/**
 * MemberInfoForm - 成員基本資訊表單
 * 從 MemberEditDialog.tsx 拆分
 */

'use client'

import React from 'react'
import type { EditFormData } from './hooks/useMemberEdit'

interface MemberInfoFormProps {
  formData: EditFormData
  onChange: (data: EditFormData) => void
}

export function MemberInfoForm({ formData, onChange }: MemberInfoFormProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-morandi-primary">成員資料</h3>

      {/* 中文姓名 */}
      <div>
        <label className="block text-xs font-medium text-morandi-primary mb-1">中文姓名</label>
        <input
          type="text"
          value={formData.chinese_name || ''}
          onChange={e => onChange({ ...formData, chinese_name: e.target.value })}
          className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-morandi-gold"
        />
      </div>

      {/* 護照拼音 */}
      <div>
        <label className="block text-xs font-medium text-morandi-primary mb-1">護照拼音</label>
        <input
          type="text"
          value={formData.passport_name || ''}
          onChange={e => onChange({ ...formData, passport_name: e.target.value })}
          className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-morandi-gold"
        />
      </div>

      {/* 出生年月日 */}
      <div>
        <label className="block text-xs font-medium text-morandi-primary mb-1">出生年月日</label>
        <input
          type="text"
          value={formData.birth_date || ''}
          onChange={e => onChange({ ...formData, birth_date: e.target.value })}
          placeholder="YYYY-MM-DD"
          className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-morandi-gold"
        />
      </div>

      {/* 性別 */}
      <div>
        <label className="block text-xs font-medium text-morandi-primary mb-1">性別</label>
        <select
          value={formData.gender || ''}
          onChange={e => onChange({ ...formData, gender: e.target.value })}
          className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-morandi-gold"
        >
          <option value="">請選擇</option>
          <option value="M">男</option>
          <option value="F">女</option>
        </select>
      </div>

      {/* 身分證號 */}
      <div>
        <label className="block text-xs font-medium text-morandi-primary mb-1">身分證號</label>
        <input
          type="text"
          value={formData.id_number || ''}
          onChange={e => onChange({ ...formData, id_number: e.target.value.toUpperCase() })}
          className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-morandi-gold"
        />
      </div>

      {/* 護照號碼 */}
      <div>
        <label className="block text-xs font-medium text-morandi-primary mb-1">護照號碼</label>
        <input
          type="text"
          value={formData.passport_number || ''}
          onChange={e => onChange({ ...formData, passport_number: e.target.value })}
          className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-morandi-gold"
        />
      </div>

      {/* 護照效期 */}
      <div>
        <label className="block text-xs font-medium text-morandi-primary mb-1">護照效期</label>
        <input
          type="text"
          value={formData.passport_expiry || ''}
          onChange={e => onChange({ ...formData, passport_expiry: e.target.value })}
          placeholder="YYYY-MM-DD"
          className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-morandi-gold"
        />
      </div>

      {/* 特殊餐食 */}
      <div>
        <label className="block text-xs font-medium text-morandi-primary mb-1">特殊餐食</label>
        <input
          type="text"
          value={formData.special_meal || ''}
          onChange={e => onChange({ ...formData, special_meal: e.target.value })}
          className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-morandi-gold"
        />
      </div>

      {/* 備註 */}
      <div>
        <label className="block text-xs font-medium text-morandi-primary mb-1">備註</label>
        <textarea
          value={formData.remarks || ''}
          onChange={e => onChange({ ...formData, remarks: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-morandi-gold resize-none"
        />
      </div>
    </div>
  )
}
