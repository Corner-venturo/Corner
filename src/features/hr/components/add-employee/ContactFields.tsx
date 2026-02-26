'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2 } from 'lucide-react'
import { EmployeeFormData } from './types'
import { ADD_EMPLOYEE_LABELS } from './constants/labels'

interface ContactFieldsProps {
  formData: EmployeeFormData
  setFormData: (data: EmployeeFormData) => void
}

export function ContactFields({ formData, setFormData }: ContactFieldsProps) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-morandi-primary mb-1 flex items-center justify-between">
          <span>{ADD_EMPLOYEE_LABELS.LABEL_5110}</span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              setFormData({
                ...formData,
                personal_info: {
                  ...formData.personal_info,
                  phone: [...formData.personal_info.phone, ''],
                },
              })
            }}
            className="h-6 text-xs"
          >
            <Plus size={12} className="mr-1" />
            {ADD_EMPLOYEE_LABELS.ADD_3363}
          </Button>
        </label>
        <div className="space-y-2">
          {formData.personal_info.phone.map((phone, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={phone}
                onChange={e => {
                  const phones = [...formData.personal_info.phone]
                  phones[index] = e.target.value
                  setFormData({
                    ...formData,
                    personal_info: { ...formData.personal_info, phone: phones },
                  })
                }}
                placeholder={`電話 ${index + 1}`}
              />
              {formData.personal_info.phone.length > 1 && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    const phones = formData.personal_info.phone.filter((_, i) => i !== index)
                    setFormData({
                      ...formData,
                      personal_info: { ...formData.personal_info, phone: phones },
                    })
                  }}
                  className="text-status-danger hover:text-status-danger"
                >
                  <Trash2 size={16} />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-morandi-primary mb-1">
          {ADD_EMPLOYEE_LABELS.LABEL_AUTH_EMAIL}
        </label>
        <Input
          type="email"
          value={formData.auth_email}
          onChange={e => setFormData({ ...formData, auth_email: e.target.value })}
          required
        />
        <p className="text-xs text-morandi-muted mt-1">
          {ADD_EMPLOYEE_LABELS.LABEL_AUTH_EMAIL_HINT}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-morandi-primary mb-1">Email（個人）</label>
        <Input
          type="email"
          value={formData.personal_info.email}
          onChange={e =>
            setFormData({
              ...formData,
              personal_info: { ...formData.personal_info, email: e.target.value },
            })
          }
        />
      </div>
    </>
  )
}
